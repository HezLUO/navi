import type { OpenThreadStatus, ReadOnlyDelegationRequest, ThreadAttentionAction } from "../core/types";

export interface OpenThreadInput {
  id: string;
  title: string;
  status: OpenThreadStatus;
  whyItMatters: string;
  currentJudgment: string;
  risks: Array<{ id: string; summary: string; severity: string }>;
  evidence: Array<{ id: string; summary: string; strength: string }>;
}

export interface AttentionInput {
  threadId: string;
  action: ThreadAttentionAction;
  score: number;
  reasons: string[];
}

export interface DelegationInput {
  id: string;
  threadId: string;
  target: ReadOnlyDelegationRequest["target"];
  status: ReadOnlyDelegationRequest["status"];
  reason: string;
  scope: string[];
  forbiddenActions?: string[];
}

export interface ConductorSnapshotInput {
  threads: OpenThreadInput[];
  attention: AttentionInput[];
  delegations: DelegationInput[];
  preferences: {
    delegationModeLabel: string;
    projectWritePermission: boolean;
    [key: string]: unknown;
  };
}

export interface SharedDeskOverrides {
  forcedMainThreadId?: string;
  hiddenThreadIds: string[];
  notNowThreadIds: string[];
}

export interface SharedDeskThread {
  id: string;
  title: string;
  status: OpenThreadStatus;
  currentJudgment: string;
  whyItMatters: string;
  selectionReason: string;
  attentionAction: ThreadAttentionAction;
  attentionScore: number;
  delegation?: DelegationInput;
}

export interface SharedDeskModel {
  mode: "active" | "quiet";
  mainThread?: SharedDeskThread;
  watchThreads: SharedDeskThread[];
  visibleThreads: SharedDeskThread[];
  quietMessage: string;
}

interface RankedThread {
  thread: SharedDeskThread;
  rank: number;
  index: number;
}

const QUIET_MESSAGE = "I'm here. I do not see a thread worth interrupting you for right now.";

const actionRank: Record<ThreadAttentionAction, number> = {
  intervention: 70,
  digest: 60,
  read_only_delegation: 50,
  thread_update: 30,
  silent: 0,
};

const statusRank: Record<OpenThreadStatus, number> = {
  needs_user: 45,
  delegated: 35,
  watching: 20,
  open: 10,
  resolved: -100,
  archived: -100,
};

export function buildSharedDeskModel(input: {
  conductor: ConductorSnapshotInput | null;
  overrides?: SharedDeskOverrides;
}): SharedDeskModel {
  const { conductor } = input;

  if (conductor === null) {
    return quietModel();
  }

  const overrides = normalizeOverrides(input.overrides);
  const hiddenThreadIds = new Set([...overrides.hiddenThreadIds, ...overrides.notNowThreadIds]);
  const attentionByThreadId = new Map(conductor.attention.map((item) => [item.threadId, item]));
  const delegationByThreadId = new Map(conductor.delegations.map((item) => [item.threadId, item]));

  const rankedThreads = conductor.threads
    .filter((item) => !hiddenThreadIds.has(item.id))
    .map((item, index): RankedThread => {
      const attention = attentionByThreadId.get(item.id);
      const delegation = delegationByThreadId.get(item.id);
      const thread = toSharedDeskThread(item, attention, delegation);

      return {
        thread,
        rank: scoreThread(thread),
        index,
      };
    })
    .sort((left, right) => right.rank - left.rank || left.index - right.index);

  const visibleThreads = rankedThreads.map((item) => item.thread);

  if (visibleThreads.length === 0) {
    return quietModel(visibleThreads);
  }

  const forcedMainThread = visibleThreads.find((item) => item.id === overrides.forcedMainThreadId);
  const mainThread = forcedMainThread
    ? {
        ...forcedMainThread,
        selectionReason: "You asked Along to focus here.",
      }
    : visibleThreads.find(isStrongEnoughForMain);

  if (mainThread === undefined) {
    return quietModel(visibleThreads);
  }

  const watchThreads = visibleThreads
    .filter((item) => item.id !== mainThread.id)
    .filter(isStrongEnoughForWatch)
    .slice(0, 2);

  return {
    mode: "active",
    mainThread,
    watchThreads,
    visibleThreads: visibleThreads.map((item) => (item.id === mainThread.id ? mainThread : item)),
    quietMessage: QUIET_MESSAGE,
  };
}

function quietModel(visibleThreads: SharedDeskThread[] = []): SharedDeskModel {
  return {
    mode: "quiet",
    watchThreads: [],
    visibleThreads,
    quietMessage: QUIET_MESSAGE,
  };
}

function normalizeOverrides(overrides: SharedDeskOverrides | undefined): SharedDeskOverrides {
  return {
    forcedMainThreadId: overrides?.forcedMainThreadId,
    hiddenThreadIds: overrides?.hiddenThreadIds ?? [],
    notNowThreadIds: overrides?.notNowThreadIds ?? [],
  };
}

function toSharedDeskThread(
  thread: OpenThreadInput,
  attention: AttentionInput | undefined,
  delegation: DelegationInput | undefined,
): SharedDeskThread {
  return {
    id: thread.id,
    title: thread.title,
    status: thread.status,
    currentJudgment: thread.currentJudgment,
    whyItMatters: thread.whyItMatters,
    selectionReason: selectionReason(thread, attention),
    attentionAction: attention?.action ?? "silent",
    attentionScore: attention?.score ?? 0,
    delegation,
  };
}

function selectionReason(thread: OpenThreadInput, attention: AttentionInput | undefined): string {
  const attentionReason = attention?.reasons.find((item) => item.trim().length > 0);

  if (attentionReason !== undefined) {
    return attentionReason;
  }

  if (thread.status === "needs_user") {
    return "This thread needs your attention.";
  }

  if (thread.status === "delegated") {
    return "A delegation is active on this thread.";
  }

  if (thread.risks.length > 0) {
    return "This thread carries an unresolved risk.";
  }

  if (thread.evidence.length > 0) {
    return "New evidence changed this thread.";
  }

  return thread.whyItMatters;
}

function scoreThread(thread: SharedDeskThread): number {
  return (
    (actionRank[thread.attentionAction] ?? 0) +
    (statusRank[thread.status] ?? 0) +
    thread.attentionScore +
    (thread.delegation === undefined ? 0 : 8)
  );
}

function isStrongEnoughForMain(thread: SharedDeskThread): boolean {
  return (
    thread.status === "needs_user" ||
    thread.status === "delegated" ||
    thread.attentionAction === "intervention" ||
    thread.attentionAction === "digest" ||
    (thread.attentionAction === "read_only_delegation" && thread.attentionScore >= 5) ||
    (thread.attentionAction === "thread_update" && thread.attentionScore >= 4)
  );
}

function isStrongEnoughForWatch(thread: SharedDeskThread): boolean {
  if (thread.status === "needs_user" || thread.status === "delegated") return true;
  if (thread.attentionAction === "silent") return false;
  return thread.attentionScore >= 3;
}
