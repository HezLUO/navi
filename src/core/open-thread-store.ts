import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { OpenThread, OpenThreadDelegationRef, OpenThreadEvidence } from "./types";
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

  async recordDelegation(threadId: string, delegation: OpenThreadDelegationRef): Promise<OpenThread> {
    let nextThread: OpenThread | undefined;
    await this.updateThreads((threads) => {
      const thread = this.requireThreadFrom(threads, threadId);
      const existing = thread.delegationHistory.find((item) => item.delegationId === delegation.delegationId);
      const history = existing
        ? thread.delegationHistory.map((item) => (
          item.delegationId === delegation.delegationId ? { ...item, ...delegation } : item
        ))
        : [...thread.delegationHistory, delegation];
      nextThread = {
        ...thread,
        status: delegation.status === "completed" ? "watching" : delegation.status === "failed" ? "needs_user" : "delegated",
        delegationHistory: history,
        updatedAt: maxIsoTimestamp(thread.updatedAt, delegation.createdAt),
      };
      return this.upsertInto(threads, nextThread);
    });
    return nextThread!;
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
    return this.writes.withRuntimeLock("update-open-threads", async () => {
      const next = transform(await this.readThreadsForMutation());
      await this.writes.atomicWriteJson(getOpenThreadsPath(this.repoPath), next);
      return next;
    });
  }

  private async readThreadsForMutation(): Promise<OpenThread[]> {
    let raw: string;
    try {
      raw = await fs.readFile(getOpenThreadsPath(this.repoPath), "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
    return JSON.parse(raw) as OpenThread[];
  }

  private upsertInto(threads: OpenThread[], thread: OpenThread): OpenThread[] {
    return this.sortThreads([thread, ...threads.filter((item) => item.id !== thread.id)]);
  }

  private requireThreadFrom(threads: OpenThread[], threadId: string): OpenThread {
    const thread = threads.find((item) => item.id === threadId);
    if (!thread) throw new Error(`Open Thread not found: ${threadId}`);
    return thread;
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
