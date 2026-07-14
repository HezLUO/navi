import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { JudgmentMergeResult, OpenThread, OpenThreadDelegationRef, OpenThreadEvidence } from "./types";
import { getOpenThreadsPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export class OpenThreadStore {
  private readonly writes: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.writes = new WriteCoordinator(repoPath);
  }

  async readAll(): Promise<OpenThread[]> {
    let raw: string;
    try {
      raw = await fs.readFile(getOpenThreadsPath(this.repoPath), "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
    const parsed = JSON.parse(raw) as OpenThread[];
    return this.sortThreads(parsed);
  }

  async readActive(): Promise<OpenThread[]> {
    return (await this.readAll()).filter((thread) => !["resolved", "archived"].includes(thread.status));
  }

  async createSeedThread(input: {
    id?: string;
    title: string;
    whyItMatters: string;
    currentJudgment: string;
  }): Promise<OpenThread> {
    const now = new Date().toISOString();
    const thread: OpenThread = {
      id: input.id ?? `thread-${randomUUID()}`,
      title: input.title,
      status: "open",
      whyItMatters: input.whyItMatters,
      currentJudgment: input.currentJudgment,
      evidence: [],
      risks: [],
      nextAttentionTrigger: "New evidence changes Along's judgment.",
      interventionThreshold: "Along sees a contradiction, elevated risk, or plan drift.",
      delegationHistory: [],
      memoryLinks: [],
      traceRefs: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.upsert(thread);
    return thread;
  }

  async upsert(thread: OpenThread): Promise<OpenThread> {
    await this.updateThreads((threads) => (
      this.sortThreads([thread, ...threads.filter((item) => item.id !== thread.id)])
    ));
    return thread;
  }

  async appendEvidence(threadId: string, evidence: OpenThreadEvidence): Promise<OpenThread> {
    let nextThread: OpenThread | undefined;
    await this.updateThreads((threads) => {
      const thread = this.requireThreadFrom(threads, threadId);
      const exists = thread.evidence.some((item) => item.id === evidence.id);
      if (exists) {
        nextThread = thread;
        return threads;
      }
      nextThread = {
        ...thread,
        evidence: [...thread.evidence, evidence],
        updatedAt: maxIsoTimestamp(thread.updatedAt, evidence.at),
      };
      return this.upsertInto(threads, nextThread);
    });
    return nextThread!;
  }

  async recordDelegation(
    threadId: string,
    delegation: OpenThreadDelegationRef,
    updatedAt = delegation.createdAt,
  ): Promise<OpenThread> {
    let nextThread: OpenThread | undefined;
    await this.updateThreads((threads) => {
      const thread = this.requireThreadFrom(threads, threadId);
      const history = this.upsertDelegationHistory(thread, delegation);
      const effectiveDelegation = this.requireDelegationFrom(history, delegation.delegationId);
      nextThread = {
        ...thread,
        status: this.statusForDelegation(thread.status, effectiveDelegation),
        delegationHistory: history,
        updatedAt: maxIsoTimestamp(thread.updatedAt, updatedAt),
      };
      return this.upsertInto(threads, nextThread);
    });
    return nextThread!;
  }

  async mergeDelegationResult(
    threadId: string,
    delegation: OpenThreadDelegationRef,
    mergeForThread: (thread: OpenThread) => JudgmentMergeResult,
  ): Promise<JudgmentMergeResult> {
    let merge: JudgmentMergeResult | undefined;
    await this.updateThreads((threads) => {
      const thread = this.requireThreadFrom(threads, threadId);
      merge = mergeForThread(thread);
      const evidence = this.appendNewEvidence(thread.evidence, merge.evidenceAdded);
      const nextThread: OpenThread = {
        ...thread,
        status: this.statusForMerge(thread.status, merge),
        currentJudgment: merge.nextJudgment,
        evidence,
        delegationHistory: this.upsertDelegationHistory(thread, delegation),
        updatedAt: maxIsoTimestamp(
          maxIsoTimestamp(thread.updatedAt, delegation.createdAt),
          merge.createdAt,
        ),
      };
      return this.upsertInto(threads, nextThread);
    });
    if (!merge) throw new Error(`Open Thread merge failed: ${threadId}`);
    return merge;
  }

  async updateJudgment(threadId: string, input: {
    currentJudgment: string;
    status?: OpenThread["status"];
    traceRef?: string;
    updatedAt?: string;
  }): Promise<OpenThread> {
    let nextThread: OpenThread | undefined;
    await this.updateThreads((threads) => {
      const thread = this.requireThreadFrom(threads, threadId);
      nextThread = {
        ...thread,
        status: input.status ?? thread.status,
        currentJudgment: input.currentJudgment,
        traceRefs: input.traceRef && !thread.traceRefs.includes(input.traceRef)
          ? [...thread.traceRefs, input.traceRef]
          : thread.traceRefs,
        updatedAt: input.updatedAt ?? new Date().toISOString(),
      };
      return this.upsertInto(threads, nextThread);
    });
    return nextThread!;
  }

  private async updateThreads(transform: (threads: OpenThread[]) => OpenThread[]): Promise<OpenThread[]> {
    return this.writes.updateJsonStrict<OpenThread[]>(getOpenThreadsPath(this.repoPath), [], transform);
  }

  private upsertInto(threads: OpenThread[], thread: OpenThread): OpenThread[] {
    return this.sortThreads([thread, ...threads.filter((item) => item.id !== thread.id)]);
  }

  private upsertDelegationHistory(thread: OpenThread, delegation: OpenThreadDelegationRef): OpenThreadDelegationRef[] {
    const existing = thread.delegationHistory.find((item) => item.delegationId === delegation.delegationId);
    if (existing && isTerminalDelegationStatus(existing.status) && isPendingDelegationStatus(delegation.status)) {
      return thread.delegationHistory;
    }
    return existing
      ? thread.delegationHistory.map((item) => (
        item.delegationId === delegation.delegationId ? { ...item, ...delegation } : item
      ))
      : [...thread.delegationHistory, delegation];
  }

  private appendNewEvidence(existing: OpenThreadEvidence[], incoming: OpenThreadEvidence[]): OpenThreadEvidence[] {
    const evidenceIds = new Set(existing.map((item) => item.id));
    return [
      ...existing,
      ...incoming.filter((item) => !evidenceIds.has(item.id)),
    ];
  }

  private statusForDelegation(
    currentStatus: OpenThread["status"],
    delegation: OpenThreadDelegationRef,
  ): OpenThread["status"] {
    if (delegation.status === "failed") return "needs_user";
    if (
      (delegation.status === "completed" || delegation.status === "cancelled")
      && currentStatus === "needs_user"
    ) {
      return "needs_user";
    }
    if (delegation.status === "completed" || delegation.status === "cancelled") return "watching";
    return "delegated";
  }

  private statusForMerge(currentStatus: OpenThread["status"], merge: JudgmentMergeResult): OpenThread["status"] {
    if (merge.shouldNotifyUser || currentStatus === "needs_user") return "needs_user";
    return "watching";
  }

  private requireThreadFrom(threads: OpenThread[], threadId: string): OpenThread {
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) throw new Error(`Open Thread not found: ${threadId}`);
    return thread;
  }

  private requireDelegationFrom(
    history: OpenThreadDelegationRef[],
    delegationId: string,
  ): OpenThreadDelegationRef {
    const delegation = history.find((item) => item.delegationId === delegationId);
    if (!delegation) throw new Error(`Open Thread delegation not found: ${delegationId}`);
    return delegation;
  }

  private sortThreads(threads: OpenThread[]): OpenThread[] {
    return [...threads].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function maxIsoTimestamp(left: string, right: string): string {
  return left.localeCompare(right) >= 0 ? left : right;
}

function isTerminalDelegationStatus(status: OpenThreadDelegationRef["status"]): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

function isPendingDelegationStatus(status: OpenThreadDelegationRef["status"]): boolean {
  return status === "requested" || status === "running";
}
