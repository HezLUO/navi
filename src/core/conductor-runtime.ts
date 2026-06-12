import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { scoreOpenThread } from "./attention-score";
import { mergeDelegationResultIntoJudgment } from "./judgment-merge";
import { OpenThreadStore } from "./open-thread-store";
import { getConductorSnapshotPath, getDelegationRequestsPath } from "./paths";
import { defaultForbiddenReadOnlyActions } from "./read-only-delegation";
import { TraceStore } from "./trace-store";
import {
  defaultConductorPreferences,
  type ConductorPreferences,
  type ConductorSnapshot,
  type HeartbeatTrigger,
  type JudgmentMergeResult,
  type OpenThread,
  type ReadOnlyDelegationRequest,
  type ReadOnlyDelegationResult,
  type ThreadAttentionScore,
} from "./types";
import { WriteCoordinator } from "./write-coordinator";

export interface ConductorRuntimeOptions {
  repoPath: string;
  preferences?: Partial<ConductorPreferences>;
}

export interface HeartbeatInput {
  trigger: HeartbeatTrigger;
  sessionId: string;
  now?: Date;
}

export interface CreateDelegationInput {
  threadId: string;
  sessionId: string;
  reason: string;
  question: string;
  scope: string[];
}

export class ConductorRuntime {
  private readonly threads: OpenThreadStore;
  private readonly traces: TraceStore;
  private readonly writes: WriteCoordinator;
  private readonly preferences: ConductorPreferences;

  constructor(private readonly options: ConductorRuntimeOptions) {
    this.threads = new OpenThreadStore(options.repoPath);
    this.traces = new TraceStore(options.repoPath);
    this.writes = new WriteCoordinator(options.repoPath);
    this.preferences = { ...defaultConductorPreferences, ...options.preferences };
  }

  async runHeartbeat(input: HeartbeatInput): Promise<ConductorSnapshot> {
    const now = input.now ?? new Date();
    const activeThreads = await this.threads.readActive();
    const attention = activeThreads.map((thread) => scoreOpenThread(thread, {
      trigger: input.trigger,
      now,
      allowReadOnlyDelegation: this.preferences.delegationModeLabel === "read_only_auto",
      canProactivelyMessage: this.preferences.highRiskEscalation,
    }));

    for (const decision of attention.filter((item) => item.action === "read_only_delegation")) {
      const thread = this.requireThread(activeThreads, decision.threadId);
      await this.createReadOnlyDelegation({
        threadId: thread.id,
        sessionId: input.sessionId,
        reason: decision.reasons.join(" "),
        question: `Read-only inspect whether this open thread needs updated judgment: ${thread.title}`,
        scope: [".along", "docs", "src", "tests"],
      });
    }

    const snapshot: ConductorSnapshot = {
      threads: await this.threads.readActive(),
      attention,
      delegations: await this.readDelegationRequests(),
      preferences: this.preferences,
    };
    await this.writes.atomicWriteJson(getConductorSnapshotPath(this.options.repoPath), snapshot);
    await this.traces.recordTrace({
      sessionId: input.sessionId,
      operation: "conductorHeartbeat",
      inputs: activeThreads.map((thread) => `thread:${thread.id}`),
      decision: this.summarizeAttention(attention),
      reason: `trigger=${input.trigger}`,
      relatedEventIds: [],
      outcome: "allowed",
    });
    return snapshot;
  }

  async createReadOnlyDelegation(input: CreateDelegationInput): Promise<ReadOnlyDelegationRequest> {
    this.requireThread(await this.threads.readAll(), input.threadId);

    let selected: ReadOnlyDelegationRequest | undefined;

    await this.writes.updateJsonStrict<ReadOnlyDelegationRequest[]>(
      getDelegationRequestsPath(this.options.repoPath),
      [],
      (requests) => {
        const existing = requests.find((request) => (
          request.threadId === input.threadId
          && request.target === "codex"
          && this.isPendingDelegationStatus(request.status)
        ));
        if (existing) {
          selected = existing;
          return requests;
        }

        const request = this.buildReadOnlyDelegationRequest(input);
        selected = request;
        return [...requests, request];
      },
    );
    if (!selected) throw new Error(`Read-only delegation was not created: ${input.threadId}`);
    await this.threads.recordDelegation(input.threadId, {
      delegationId: selected.id,
      target: selected.target,
      status: selected.status,
      createdAt: selected.createdAt,
    });
    return selected;
  }

  async ingestDelegationResult(result: ReadOnlyDelegationResult): Promise<JudgmentMergeResult> {
    const thread = this.requireThread(await this.threads.readAll(), result.threadId);
    const request = await this.transitionDelegationRequest(result, thread);
    const delegation = {
      delegationId: result.requestId,
      target: result.target,
      status: result.status,
      createdAt: request.createdAt,
      resultRef: `delegation:${result.requestId}:result`,
    };

    if (result.status !== "completed") {
      await this.threads.recordDelegation(result.threadId, delegation, result.completedAt);
      return this.buildNoopTerminalMerge(thread, result);
    }

    return await this.threads.mergeDelegationResult(
      result.threadId,
      delegation,
      (currentThread) => this.mergeCompletedResultIntoCurrentThread(currentThread, result),
    );
  }

  async snapshot(): Promise<ConductorSnapshot> {
    return {
      threads: await this.threads.readActive(),
      attention: [],
      delegations: await this.readDelegationRequests(),
      preferences: this.preferences,
    };
  }

  async readDelegationRequests(): Promise<ReadOnlyDelegationRequest[]> {
    let raw: string;
    try {
      raw = await fs.readFile(getDelegationRequestsPath(this.options.repoPath), "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
    return JSON.parse(raw) as ReadOnlyDelegationRequest[];
  }

  private buildReadOnlyDelegationRequest(input: CreateDelegationInput): ReadOnlyDelegationRequest {
    return {
      id: randomUUID(),
      threadId: input.threadId,
      reason: input.reason,
      target: "codex",
      scope: input.scope,
      forbiddenActions: [...defaultForbiddenReadOnlyActions],
      question: input.question,
      expectedOutput: ["summary", "evidence", "risks", "recommendations", "confidence"],
      budget: {
        timeoutMs: 120_000,
        maxOutputChars: 12_000,
      },
      returnFormat: "judgment_merge_json",
      status: "requested",
      createdAt: new Date().toISOString(),
    };
  }

  private async transitionDelegationRequest(
    result: ReadOnlyDelegationResult,
    thread: OpenThread,
  ): Promise<ReadOnlyDelegationRequest> {
    let selected: ReadOnlyDelegationRequest | undefined;
    await this.writes.updateJsonStrict<ReadOnlyDelegationRequest[]>(
      getDelegationRequestsPath(this.options.repoPath),
      [],
      (requests) => {
        const request = requests.find((item) => item.id === result.requestId);
        this.assertValidDelegationTransition(request, result, thread);
        selected = request;
        const resultDigest = this.digestDelegationResult(result);
        return requests.map((item) => (
          item.id === result.requestId && this.isPendingDelegationStatus(item.status)
            ? { ...item, status: result.status, completedAt: result.completedAt, resultDigest }
            : item.id === result.requestId && item.resultDigest === undefined
              ? { ...item, resultDigest }
              : item
        ));
      },
    );
    if (!selected) throw new Error(`Delegation request not found: ${result.requestId}`);
    return selected;
  }

  private assertValidDelegationTransition(
    request: ReadOnlyDelegationRequest | undefined,
    result: ReadOnlyDelegationResult,
    thread: OpenThread,
  ): asserts request is ReadOnlyDelegationRequest {
    if (!request) throw new Error(`Delegation request not found: ${result.requestId}`);
    if (request.threadId !== result.threadId) {
      throw new Error(`Delegation result thread mismatch: request ${request.threadId} !== result ${result.threadId}.`);
    }
    if (request.target !== result.target) {
      throw new Error(`Delegation result target mismatch: request ${request.target} !== result ${result.target}.`);
    }
    if (this.isPendingDelegationStatus(request.status)) return;
    const resultDigest = this.digestDelegationResult(result);
    if (request.status === result.status && request.completedAt === result.completedAt) {
      if (request.resultDigest === resultDigest) return;
      if (request.resultDigest === undefined && !this.hasRecordedTerminalResult(thread, result)) return;
      throw new Error(`Delegation terminal result payload mismatch: ${request.id}`);
    }
    if (!this.isPendingDelegationStatus(request.status)) {
      throw new Error(`Delegation request already terminal: ${request.id}`);
    }
  }

  private digestDelegationResult(result: ReadOnlyDelegationResult): string {
    const payload = {
      summary: result.summary,
      evidence: result.evidence,
      risks: result.risks,
      recommendations: result.recommendations,
      confidence: result.confidence,
      rawOutput: result.rawOutput ?? null,
    };
    return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  }

  private hasRecordedTerminalResult(thread: OpenThread, result: ReadOnlyDelegationResult): boolean {
    const resultRef = `delegation:${result.requestId}:result`;
    const sourceRef = `delegation:${result.requestId}`;
    return thread.delegationHistory.some((item) => (
      item.delegationId === result.requestId && item.resultRef === resultRef
    )) || thread.evidence.some((item) => item.sourceRef === sourceRef);
  }

  private mergeCompletedResultIntoCurrentThread(
    thread: OpenThread,
    result: ReadOnlyDelegationResult,
  ): JudgmentMergeResult {
    const merge = mergeDelegationResultIntoJudgment(thread, result);
    if (this.hasRecordedTerminalHistory(thread, result)) {
      return {
        ...merge,
        nextJudgment: thread.currentJudgment,
        riskChanges: [],
        evidenceAdded: [],
        newThreadSuggestions: [],
        shouldNotifyUser: false,
        reason: `Delegation result already recorded: ${result.requestId}`,
      };
    }
    const summary = result.summary.trim();
    if (summary.length === 0 || !thread.currentJudgment.includes(summary)) return merge;
    return {
      ...merge,
      nextJudgment: thread.currentJudgment,
    };
  }

  private hasRecordedTerminalHistory(thread: OpenThread, result: ReadOnlyDelegationResult): boolean {
    const resultRef = `delegation:${result.requestId}:result`;
    return thread.delegationHistory.some((item) => (
      item.delegationId === result.requestId && item.resultRef === resultRef
    ));
  }

  private buildNoopTerminalMerge(thread: OpenThread, result: ReadOnlyDelegationResult): JudgmentMergeResult {
    return {
      threadId: thread.id,
      classification: "irrelevant_or_low_signal",
      previousJudgment: thread.currentJudgment,
      nextJudgment: thread.currentJudgment,
      riskChanges: [],
      evidenceAdded: [],
      newThreadSuggestions: [],
      shouldNotifyUser: result.status === "failed",
      reason: `Delegation ${result.status}: ${result.summary.trim() || "No completed result to merge."}`,
      createdAt: result.completedAt,
    };
  }

  private isPendingDelegationStatus(status: ReadOnlyDelegationRequest["status"]): boolean {
    return status === "requested" || status === "running";
  }

  private requireThread(threads: OpenThread[], threadId: string): OpenThread {
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) throw new Error(`Open Thread not found: ${threadId}`);
    return thread;
  }

  private summarizeAttention(attention: ThreadAttentionScore[]): string {
    if (attention.length === 0) return "no active threads";
    return attention.map((item) => `${item.threadId}:${item.action}:${item.score}`).join(", ");
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
