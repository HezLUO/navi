import { randomUUID } from "node:crypto";
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

    const createdAt = new Date().toISOString();
    const request: ReadOnlyDelegationRequest = {
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
      createdAt,
    };

    await this.writes.updateJsonStrict<ReadOnlyDelegationRequest[]>(
      getDelegationRequestsPath(this.options.repoPath),
      [],
      (requests) => [...requests, request],
    );
    await this.threads.recordDelegation(input.threadId, {
      delegationId: request.id,
      target: request.target,
      status: request.status,
      createdAt,
    });
    return request;
  }

  async ingestDelegationResult(result: ReadOnlyDelegationResult) {
    const thread = this.requireThread(await this.threads.readAll(), result.threadId);
    const merge = mergeDelegationResultIntoJudgment(thread, result);
    const request = (await this.readDelegationRequests()).find((item) => item.id === result.requestId);

    await this.updateDelegationRequest(result);
    await this.threads.recordDelegation(result.threadId, {
      delegationId: result.requestId,
      target: result.target,
      status: result.status,
      createdAt: request?.createdAt ?? result.completedAt,
      resultRef: `delegation:${result.requestId}:result`,
    });
    for (const evidence of merge.evidenceAdded) {
      await this.threads.appendEvidence(result.threadId, evidence);
    }
    await this.threads.updateJudgment(result.threadId, {
      currentJudgment: merge.nextJudgment,
      status: merge.shouldNotifyUser ? "needs_user" : "watching",
      updatedAt: result.completedAt,
    });

    return merge;
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

  private async updateDelegationRequest(result: ReadOnlyDelegationResult): Promise<void> {
    await this.writes.updateJsonStrict<ReadOnlyDelegationRequest[]>(
      getDelegationRequestsPath(this.options.repoPath),
      [],
      (requests) => requests.map((request) => (
        request.id === result.requestId
          ? { ...request, status: result.status, completedAt: result.completedAt }
          : request
      )),
    );
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
