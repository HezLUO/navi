# Living Conductor Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Along living-conductor loop: Open Threads, deterministic attention, read-only delegation requests, Judgment Merge, runtime/API integration, and a minimal visible project-intelligence surface.

**Architecture:** Add focused core modules on top of the Runtime Control Plane foundation: `OpenThreadStore` persists thread state, `attention-score` decides whether a thread deserves action, `read-only-delegation` prepares and optionally runs Codex read-only analysis, and `judgment-merge` converts delegation results into Along's own thread judgment. Runtime and API endpoints orchestrate these modules without granting project-write authority.

**Tech Stack:** TypeScript, Node.js `fs/promises` and `child_process`, Express, React, Vitest, existing `.along/` local storage, existing Runtime Profile / Permission Envelope / Event / Trace / Context infrastructure.

---

## Scope Check

The approved spec covers a full product direction. This plan intentionally implements the first foundation slice only. It does not implement a full Hermes adapter, always-on daemon, rich visual memory browser, automatic write delegation, or multi-pack marketplace.

Execution prerequisite:

- Start from the current `runtime-control-plane-implementation` branch or a branch that already contains its Tasks 1-8.
- Before executing this plan, complete or merge the missing Runtime Control Plane Doctor/API tasks if they are still absent:
  - `src/core/doctor.ts`
  - `GET /api/runtime/doctor`
  - `GET /api/review/items`
  - `POST /api/review/items/:id/decision`
  - `POST /api/session/pause`

If those runtime endpoints are missing, stop this plan and finish `docs/superpowers/plans/2026-06-01-along-runtime-control-plane-lifecycle.md` first.

## File Structure

Create or modify these files:

- Modify `src/core/types.ts`: add Open Thread, attention, delegation, Judgment Merge, and product-mode contracts.
- Modify `src/core/paths.ts`: add `.along/threads/`, `.along/delegations/`, and conductor snapshot paths.
- Modify `src/core/memory-store.ts`: initialize living-conductor directories and seed files.
- Create `src/core/open-thread-store.ts`: read, write, upsert, and update Open Threads.
- Create `src/core/attention-score.ts`: deterministic scoring and action selection.
- Create `src/core/read-only-delegation.ts`: agent adapter contracts, Codex prompt builder, safe read-only runner, result parsing.
- Create `src/core/judgment-merge.ts`: merge user/project/delegation evidence into thread judgment.
- Create `src/core/conductor-runtime.ts`: orchestrate heartbeat, delegation request creation, result ingestion, and conductor snapshot creation.
- Modify `src/core/runtime.ts`: instantiate conductor runtime and expose pass-through methods.
- Modify `src/server/app.ts`: add conductor endpoints.
- Modify `src/web/App.tsx`: add minimal Project Intelligence Library and Delegation Live View.
- Modify `src/web/styles.css`: style the new surface without changing the app into a dashboard.
- Add focused tests under `tests/core/` and `tests/server/`.

Keep the modules small. Do not fold conductor logic into `runtime.ts`.

---

### Task 1: Add Living Conductor Contracts

**Files:**
- Modify: `src/core/types.ts`
- Test: `tests/core/living-conductor-types.test.ts`

- [ ] **Step 1: Write the failing type/runtime contract tests**

Create `tests/core/living-conductor-types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  defaultConductorPreferences,
  delegationModeLabels,
  openThreadStatuses,
  threadAttentionActions,
  judgmentMergeClassifications,
} from "../../src/core/types";

describe("living conductor contracts", () => {
  it("defines the Open Thread lifecycle states", () => {
    expect(openThreadStatuses).toEqual(["open", "watching", "needs_user", "delegated", "resolved", "archived"]);
  });

  it("defines deterministic attention actions", () => {
    expect(threadAttentionActions).toEqual(["silent", "thread_update", "read_only_delegation", "digest", "intervention"]);
  });

  it("separates user-facing delegation labels from authority", () => {
    expect(delegationModeLabels).toEqual(["local_only", "ask_before_delegation", "read_only_auto", "write_requires_approval"]);
    expect(defaultConductorPreferences.delegationModeLabel).toBe("read_only_auto");
    expect(defaultConductorPreferences.projectWritePermission).toBe(false);
  });

  it("classifies Judgment Merge outcomes", () => {
    expect(judgmentMergeClassifications).toContain("contradicts_current_judgment");
    expect(judgmentMergeClassifications).toContain("adds_new_risk");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- tests/core/living-conductor-types.test.ts
```

Expected: FAIL because the exported contract arrays and defaults do not exist.

- [ ] **Step 3: Add the contracts**

Append these contracts to `src/core/types.ts`:

```ts
export const openThreadStatuses = ["open", "watching", "needs_user", "delegated", "resolved", "archived"] as const;
export type OpenThreadStatus = (typeof openThreadStatuses)[number];

export const openThreadEvidenceKinds = [
  "user_statement",
  "design_decision",
  "project_observation",
  "implementation_signal",
  "delegation_result",
  "user_correction",
  "runtime_trace",
] as const;
export type OpenThreadEvidenceKind = (typeof openThreadEvidenceKinds)[number];

export interface OpenThreadEvidence {
  id: string;
  at: string;
  kind: OpenThreadEvidenceKind;
  sourceRef: string;
  summary: string;
  strength: "weak" | "medium" | "strong";
}

export interface OpenThreadRisk {
  id: string;
  at: string;
  summary: string;
  severity: "low" | "medium" | "high";
  sourceRef: string;
}

export interface OpenThreadDelegationRef {
  delegationId: string;
  target: "codex" | "hermes" | "local_subagent" | "manual";
  status: "requested" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  resultRef?: string;
}

export interface OpenThread {
  id: string;
  title: string;
  status: OpenThreadStatus;
  whyItMatters: string;
  currentJudgment: string;
  evidence: OpenThreadEvidence[];
  risks: OpenThreadRisk[];
  nextAttentionTrigger: string;
  interventionThreshold: string;
  delegationHistory: OpenThreadDelegationRef[];
  memoryLinks: string[];
  traceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export const heartbeatTriggers = ["session_start", "user_event", "interval", "resume", "delegation_result", "review_event"] as const;
export type HeartbeatTrigger = (typeof heartbeatTriggers)[number];

export const threadAttentionActions = ["silent", "thread_update", "read_only_delegation", "digest", "intervention"] as const;
export type ThreadAttentionAction = (typeof threadAttentionActions)[number];

export interface ThreadAttentionScore {
  threadId: string;
  trigger: HeartbeatTrigger;
  score: number;
  action: ThreadAttentionAction;
  factors: {
    riskDelta: number;
    judgmentDelta: number;
    staleness: number;
    continuity: number;
    evidenceGap: number;
    delegationValue: number;
    interruptionCost: number;
    userPreferenceFit: number;
  };
  reasons: string[];
}

export const delegationModeLabels = ["local_only", "ask_before_delegation", "read_only_auto", "write_requires_approval"] as const;
export type DelegationModeLabel = (typeof delegationModeLabels)[number];

export interface ConductorPreferences {
  delegationModeLabel: DelegationModeLabel;
  interventionStyle: "calm_reviewer" | "collaborative_companion" | "strong_challenger" | "custom";
  challengeDirectness: "low" | "medium" | "high";
  digestPreference: "off" | "brief" | "normal";
  highRiskEscalation: boolean;
  projectWritePermission: boolean;
}

export const defaultConductorPreferences: ConductorPreferences = {
  delegationModeLabel: "read_only_auto",
  interventionStyle: "collaborative_companion",
  challengeDirectness: "medium",
  digestPreference: "brief",
  highRiskEscalation: true,
  projectWritePermission: false,
};

export interface ReadOnlyDelegationRequest {
  id: string;
  threadId: string;
  reason: string;
  target: "codex" | "hermes" | "local_subagent" | "manual";
  scope: string[];
  forbiddenActions: string[];
  question: string;
  expectedOutput: string[];
  budget: {
    timeoutMs: number;
    maxOutputChars: number;
  };
  returnFormat: "judgment_merge_json";
  status: "requested" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

export interface ReadOnlyDelegationResult {
  requestId: string;
  threadId: string;
  target: ReadOnlyDelegationRequest["target"];
  status: "completed" | "failed" | "cancelled";
  summary: string;
  evidence: string[];
  risks: string[];
  recommendations: string[];
  confidence: "low" | "medium" | "high";
  rawOutput?: string;
  completedAt: string;
}

export const judgmentMergeClassifications = [
  "supports_current_judgment",
  "weakens_current_judgment",
  "contradicts_current_judgment",
  "adds_new_risk",
  "closes_evidence_gap",
  "creates_new_thread",
  "irrelevant_or_low_signal",
] as const;
export type JudgmentMergeClassification = (typeof judgmentMergeClassifications)[number];

export interface JudgmentMergeResult {
  threadId: string;
  classification: JudgmentMergeClassification;
  previousJudgment: string;
  nextJudgment: string;
  riskChanges: string[];
  evidenceAdded: OpenThreadEvidence[];
  newThreadSuggestions: Array<{ title: string; whyItMatters: string }>;
  shouldNotifyUser: boolean;
  reason: string;
  createdAt: string;
}

export interface ConductorSnapshot {
  threads: OpenThread[];
  attention: ThreadAttentionScore[];
  delegations: ReadOnlyDelegationRequest[];
  latestMerge?: JudgmentMergeResult;
  preferences: ConductorPreferences;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- tests/core/living-conductor-types.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts tests/core/living-conductor-types.test.ts
git commit -m "feat: add living conductor contracts"
```

---

### Task 2: Add Open Thread Storage

**Files:**
- Modify: `src/core/paths.ts`
- Modify: `src/core/memory-store.ts`
- Create: `src/core/open-thread-store.ts`
- Test: `tests/core/open-thread-store.test.ts`

- [ ] **Step 1: Write failing storage tests**

Create `tests/core/open-thread-store.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OpenThreadStore } from "../../src/core/open-thread-store";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-threads-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("OpenThreadStore", () => {
  it("initializes with no active threads", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);

    expect(await store.readAll()).toEqual([]);
  });

  it("upserts and sorts threads by update time", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert({
      id: "thread-1",
      title: "Runtime plan drift",
      status: "open",
      whyItMatters: "Implementation order affects Along's foundation.",
      currentJudgment: "Runtime Doctor should be finished before Memory v2.",
      evidence: [],
      risks: [],
      nextAttentionTrigger: "Runtime implementation progress changes.",
      interventionThreshold: "Approved plan and implementation diverge.",
      delegationHistory: [],
      memoryLinks: [],
      traceRefs: [],
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:00.000Z",
    });

    await store.appendEvidence("thread-1", {
      id: "evidence-1",
      at: "2026-06-12T00:05:00.000Z",
      kind: "implementation_signal",
      sourceRef: "docs:runtime-progress",
      summary: "Doctor API is still missing.",
      strength: "strong",
    });

    const [thread] = await store.readActive();
    expect(thread.title).toBe("Runtime plan drift");
    expect(thread.evidence).toHaveLength(1);
    expect(thread.updatedAt).toBe("2026-06-12T00:05:00.000Z");
  });

  it("records delegation references without duplicating them", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.createSeedThread({
      id: "thread-1",
      title: "Agent identity",
      whyItMatters: "Along should stay focused on self-initiation and companionship.",
      currentJudgment: "Along is a conductor companion, not a default executor.",
    });

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "requested",
      createdAt: "2026-06-12T00:00:00.000Z",
    });
    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "requested",
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const [thread] = await store.readAll();
    expect(thread.delegationHistory).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/open-thread-store.test.ts
```

Expected: FAIL because `OpenThreadStore` and new paths do not exist.

- [ ] **Step 3: Add thread paths**

Append these helpers to `src/core/paths.ts`:

```ts
export function getOpenThreadsDir(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "threads");
}

export function getOpenThreadsPath(repoPath: string): string {
  return path.join(getOpenThreadsDir(repoPath), "open-threads.json");
}

export function getDelegationsDir(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "delegations");
}

export function getDelegationRequestsPath(repoPath: string): string {
  return path.join(getDelegationsDir(repoPath), "requests.json");
}

export function getConductorSnapshotPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "conductor", "snapshot.json");
}
```

- [ ] **Step 4: Initialize conductor directories**

In `src/core/memory-store.ts`, add these directories inside `ensureInitialized()`:

```ts
fs.mkdir(path.join(this.projectDir, "threads"), { recursive: true }),
fs.mkdir(path.join(this.projectDir, "delegations"), { recursive: true }),
fs.mkdir(path.join(this.projectDir, "conductor"), { recursive: true }),
```

After the existing `curiosity/queue.json` initialization, add:

```ts
await this.writeIfMissing(path.join(this.projectDir, "threads", "open-threads.json"), "[]\n");
await this.writeIfMissing(path.join(this.projectDir, "delegations", "requests.json"), "[]\n");
```

- [ ] **Step 5: Implement `OpenThreadStore`**

Create `src/core/open-thread-store.ts`:

```ts
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
    return parsed.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
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
    const threads = await this.readAll();
    const next = [thread, ...threads.filter((item) => item.id !== thread.id)]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    await this.writeAll(next);
    return thread;
  }

  async appendEvidence(threadId: string, evidence: OpenThreadEvidence): Promise<OpenThread> {
    const thread = await this.requireThread(threadId);
    const exists = thread.evidence.some((item) => item.id === evidence.id);
    const next: OpenThread = {
      ...thread,
      evidence: exists ? thread.evidence : [...thread.evidence, evidence],
      updatedAt: evidence.at,
    };
    await this.upsert(next);
    return next;
  }

  async recordDelegation(threadId: string, delegation: OpenThreadDelegationRef): Promise<OpenThread> {
    const thread = await this.requireThread(threadId);
    const existing = thread.delegationHistory.find((item) => item.delegationId === delegation.delegationId);
    const history = existing
      ? thread.delegationHistory.map((item) => item.delegationId === delegation.delegationId ? { ...item, ...delegation } : item)
      : [...thread.delegationHistory, delegation];
    const next: OpenThread = {
      ...thread,
      status: delegation.status === "completed" ? "watching" : delegation.status === "failed" ? "needs_user" : "delegated",
      delegationHistory: history,
      updatedAt: delegation.createdAt,
    };
    await this.upsert(next);
    return next;
  }

  async updateJudgment(threadId: string, input: {
    currentJudgment: string;
    status?: OpenThread["status"];
    traceRef?: string;
    updatedAt?: string;
  }): Promise<OpenThread> {
    const thread = await this.requireThread(threadId);
    const updatedAt = input.updatedAt ?? new Date().toISOString();
    const next: OpenThread = {
      ...thread,
      status: input.status ?? thread.status,
      currentJudgment: input.currentJudgment,
      traceRefs: input.traceRef && !thread.traceRefs.includes(input.traceRef) ? [...thread.traceRefs, input.traceRef] : thread.traceRefs,
      updatedAt,
    };
    await this.upsert(next);
    return next;
  }

  private async requireThread(threadId: string): Promise<OpenThread> {
    const thread = (await this.readAll()).find((item) => item.id === threadId);
    if (!thread) throw new Error(`Open Thread not found: ${threadId}`);
    return thread;
  }

  private async writeAll(threads: OpenThread[]): Promise<void> {
    await this.writes.atomicWriteJson(getOpenThreadsPath(this.repoPath), threads);
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm test -- tests/core/open-thread-store.test.ts tests/core/memory-store.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/paths.ts src/core/memory-store.ts src/core/open-thread-store.ts tests/core/open-thread-store.test.ts
git commit -m "feat: persist open threads"
```

---

### Task 3: Add Deterministic Attention Scoring

**Files:**
- Create: `src/core/attention-score.ts`
- Test: `tests/core/attention-score.test.ts`

- [ ] **Step 1: Write failing attention tests**

Create `tests/core/attention-score.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoreOpenThread } from "../../src/core/attention-score";
import type { OpenThread } from "../../src/core/types";

function thread(overrides: Partial<OpenThread> = {}): OpenThread {
  return {
    id: "thread-1",
    title: "Runtime plan drift",
    status: "open",
    whyItMatters: "The project foundation depends on runtime completion.",
    currentJudgment: "Finish Runtime Doctor before Memory v2.",
    evidence: [],
    risks: [],
    nextAttentionTrigger: "Runtime implementation status changes.",
    interventionThreshold: "Approved plan and implementation differ.",
    delegationHistory: [],
    memoryLinks: [],
    traceRefs: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("scoreOpenThread", () => {
  it("recommends read-only delegation for stale high-value threads with evidence gaps", () => {
    const result = scoreOpenThread(thread(), {
      trigger: "resume",
      now: new Date("2026-06-12T00:00:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: false,
    });

    expect(result.action).toBe("read_only_delegation");
    expect(result.factors.staleness).toBeGreaterThan(0);
    expect(result.factors.evidenceGap).toBeGreaterThan(0);
  });

  it("recommends intervention when high risk evidence appears and messages are allowed", () => {
    const result = scoreOpenThread(thread({
      risks: [{
        id: "risk-1",
        at: "2026-06-12T00:00:00.000Z",
        summary: "Implementation diverged from the approved plan.",
        severity: "high",
        sourceRef: "delegation:codex",
      }],
      evidence: [{
        id: "evidence-1",
        at: "2026-06-12T00:00:00.000Z",
        kind: "delegation_result",
        sourceRef: "delegation:codex",
        summary: "Doctor API is missing.",
        strength: "strong",
      }],
      updatedAt: "2026-06-12T00:00:00.000Z",
    }), {
      trigger: "delegation_result",
      now: new Date("2026-06-12T00:01:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: true,
    });

    expect(result.action).toBe("intervention");
    expect(result.reasons.join(" ")).toContain("high risk");
  });

  it("stays silent for recently updated low-risk threads", () => {
    const result = scoreOpenThread(thread({
      evidence: [{
        id: "evidence-1",
        at: "2026-06-12T00:00:00.000Z",
        kind: "user_statement",
        sourceRef: "chat:1",
        summary: "User approved the current direction.",
        strength: "medium",
      }],
      updatedAt: "2026-06-12T00:00:00.000Z",
    }), {
      trigger: "interval",
      now: new Date("2026-06-12T00:02:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: true,
    });

    expect(result.action).toBe("silent");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/attention-score.test.ts
```

Expected: FAIL because `attention-score.ts` does not exist.

- [ ] **Step 3: Implement deterministic scoring**

Create `src/core/attention-score.ts`:

```ts
import type { HeartbeatTrigger, OpenThread, ThreadAttentionScore } from "./types";

interface ScoreInput {
  trigger: HeartbeatTrigger;
  now: Date;
  lastInterventionAt?: string;
  allowReadOnlyDelegation: boolean;
  canProactivelyMessage: boolean;
}

const dayMs = 24 * 60 * 60 * 1000;

export function scoreOpenThread(thread: OpenThread, input: ScoreInput): ThreadAttentionScore {
  const latestTime = Date.parse(thread.updatedAt);
  const ageDays = Number.isFinite(latestTime) ? Math.max(0, (input.now.getTime() - latestTime) / dayMs) : 0;
  const highRiskCount = thread.risks.filter((risk) => risk.severity === "high").length;
  const strongEvidenceCount = thread.evidence.filter((evidence) => evidence.strength === "strong").length;
  const recentInterventionMinutes = minutesSince(input.lastInterventionAt, input.now);

  const factors = {
    riskDelta: Math.min(4, highRiskCount * 4 + thread.risks.filter((risk) => risk.severity === "medium").length * 2),
    judgmentDelta: input.trigger === "delegation_result" || input.trigger === "user_event" ? 2 : 0,
    staleness: Math.min(3, Math.floor(ageDays / 3)),
    continuity: thread.whyItMatters.length > 0 ? 2 : 0,
    evidenceGap: thread.evidence.length === 0 ? 3 : strongEvidenceCount === 0 ? 1 : 0,
    delegationValue: input.allowReadOnlyDelegation && thread.delegationHistory.length === 0 ? 2 : 0,
    interruptionCost: recentInterventionMinutes !== undefined && recentInterventionMinutes < 60 ? 4 : input.trigger === "interval" ? 2 : 0,
    userPreferenceFit: input.canProactivelyMessage ? 1 : 0,
  };

  const score = factors.riskDelta
    + factors.judgmentDelta
    + factors.staleness
    + factors.continuity
    + factors.evidenceGap
    + factors.delegationValue
    + factors.userPreferenceFit
    - factors.interruptionCost;

  const reasons = reasonsFor(thread, factors);
  let action: ThreadAttentionScore["action"] = "silent";

  if (factors.riskDelta >= 4 && input.canProactivelyMessage && score >= 5) {
    action = "intervention";
  } else if (input.allowReadOnlyDelegation && factors.delegationValue > 0 && factors.evidenceGap > 0 && score >= 5) {
    action = "read_only_delegation";
  } else if (score >= 5 && input.canProactivelyMessage) {
    action = "digest";
  } else if (score >= 3) {
    action = "thread_update";
  }

  return {
    threadId: thread.id,
    trigger: input.trigger,
    score,
    action,
    factors,
    reasons,
  };
}

function reasonsFor(thread: OpenThread, factors: ThreadAttentionScore["factors"]): string[] {
  const reasons: string[] = [];
  if (factors.riskDelta >= 4) reasons.push("high risk evidence is present");
  if (factors.staleness > 0) reasons.push("thread has not been revisited recently");
  if (factors.evidenceGap > 0) reasons.push("thread needs stronger evidence");
  if (factors.delegationValue > 0) reasons.push("read-only delegation can reduce uncertainty");
  if (thread.whyItMatters.length > 0) reasons.push(`continuity: ${thread.whyItMatters}`);
  return reasons;
}

function minutesSince(timestamp: string | undefined, now: Date): number | undefined {
  if (!timestamp) return undefined;
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return undefined;
  return Math.max(0, (now.getTime() - time) / 60_000);
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/core/attention-score.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/attention-score.ts tests/core/attention-score.test.ts
git commit -m "feat: score open thread attention"
```

---

### Task 4: Add Read-Only Delegation Adapter

**Files:**
- Create: `src/core/read-only-delegation.ts`
- Test: `tests/core/read-only-delegation.test.ts`

- [ ] **Step 1: Write failing delegation tests**

Create `tests/core/read-only-delegation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildReadOnlyDelegationPrompt,
  CodexReadOnlyAdapter,
  defaultForbiddenReadOnlyActions,
  parseCodexJsonlFinalMessage,
} from "../../src/core/read-only-delegation";
import type { ReadOnlyDelegationRequest } from "../../src/core/types";

function request(): ReadOnlyDelegationRequest {
  return {
    id: "delegation-1",
    threadId: "thread-1",
    reason: "Runtime plan drift needs external review.",
    target: "codex",
    scope: ["docs/superpowers/plans/2026-06-01-along-runtime-control-plane-lifecycle.md", "src/core"],
    forbiddenActions: defaultForbiddenReadOnlyActions,
    question: "Inspect whether runtime implementation matches the approved plan.",
    expectedOutput: ["risks", "missing tasks", "confidence"],
    budget: { timeoutMs: 120_000, maxOutputChars: 12_000 },
    returnFormat: "judgment_merge_json",
    status: "requested",
    createdAt: "2026-06-12T00:00:00.000Z",
  };
}

describe("read-only delegation", () => {
  it("builds prompts with explicit forbidden actions", () => {
    const prompt = buildReadOnlyDelegationPrompt(request());
    expect(prompt).toContain("READ-ONLY");
    expect(prompt).toContain("Do not modify files");
    expect(prompt).toContain("Inspect whether runtime implementation matches the approved plan");
  });

  it("parses the final Codex JSONL agent message", () => {
    const jsonl = [
      JSON.stringify({ type: "thread.started", thread_id: "abc" }),
      JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "{\"summary\":\"Doctor API missing\",\"evidence\":[\"No doctor.ts\"],\"risks\":[\"Plan drift\"],\"recommendations\":[\"Finish Doctor\"],\"confidence\":\"high\"}" } }),
      JSON.stringify({ type: "turn.completed" }),
    ].join("\n");

    expect(parseCodexJsonlFinalMessage(jsonl)).toContain("Doctor API missing");
  });

  it("runs through an injected Codex runner without touching files", async () => {
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) => [
        JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "{\"summary\":\"Reviewed\",\"evidence\":[],\"risks\":[],\"recommendations\":[],\"confidence\":\"medium\"}" } }),
      ].join("\n"),
    });

    const result = await adapter.runReadOnly(request());
    expect(result.status).toBe("completed");
    expect(result.summary).toBe("Reviewed");
    expect(result.confidence).toBe("medium");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/read-only-delegation.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the read-only adapter**

Create `src/core/read-only-delegation.ts`:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ReadOnlyDelegationRequest, ReadOnlyDelegationResult } from "./types";

const execFileAsync = promisify(execFile);

export const defaultForbiddenReadOnlyActions = [
  "Do not modify files.",
  "Do not create commits.",
  "Do not push branches.",
  "Do not install dependencies.",
  "Do not run destructive commands.",
  "Do not change project state.",
];

export interface AgentAdapter {
  name: string;
  capabilities: string[];
  canRun(input: ReadOnlyDelegationRequest): Promise<boolean>;
  buildPrompt(input: ReadOnlyDelegationRequest): Promise<string>;
  runReadOnly(input: ReadOnlyDelegationRequest): Promise<ReadOnlyDelegationResult>;
}

interface CodexReadOnlyAdapterOptions {
  runCodex?: (prompt: string, timeoutMs: number) => Promise<string>;
}

export class CodexReadOnlyAdapter implements AgentAdapter {
  readonly name = "codex";
  readonly capabilities = ["read_only_analysis", "review", "diagnosis", "plan_comparison"];

  constructor(private readonly options: CodexReadOnlyAdapterOptions = {}) {}

  async canRun(input: ReadOnlyDelegationRequest): Promise<boolean> {
    return input.target === "codex" && input.status === "requested";
  }

  async buildPrompt(input: ReadOnlyDelegationRequest): Promise<string> {
    return buildReadOnlyDelegationPrompt(input);
  }

  async runReadOnly(input: ReadOnlyDelegationRequest): Promise<ReadOnlyDelegationResult> {
    const prompt = await this.buildPrompt(input);
    const rawOutput = await (this.options.runCodex ?? runCodexCli)(prompt, input.budget.timeoutMs);
    const finalMessage = parseCodexJsonlFinalMessage(rawOutput);
    const parsed = parseDelegationJson(finalMessage);
    return {
      requestId: input.id,
      threadId: input.threadId,
      target: input.target,
      status: "completed",
      summary: parsed.summary,
      evidence: parsed.evidence,
      risks: parsed.risks,
      recommendations: parsed.recommendations,
      confidence: parsed.confidence,
      rawOutput: rawOutput.slice(0, input.budget.maxOutputChars),
      completedAt: new Date().toISOString(),
    };
  }
}

export function buildReadOnlyDelegationPrompt(input: ReadOnlyDelegationRequest): string {
  return [
    "You are being called by Along as a READ-ONLY analysis delegate.",
    "",
    `Open Thread: ${input.threadId}`,
    `Reason: ${input.reason}`,
    "",
    "Allowed scope:",
    ...input.scope.map((item) => `- ${item}`),
    "",
    "Forbidden actions:",
    ...input.forbiddenActions.map((item) => `- ${item}`),
    "",
    "Question:",
    input.question,
    "",
    "Expected output:",
    ...input.expectedOutput.map((item) => `- ${item}`),
    "",
    "Return only JSON with this exact shape:",
    "{\"summary\":\"string\",\"evidence\":[\"string\"],\"risks\":[\"string\"],\"recommendations\":[\"string\"],\"confidence\":\"low|medium|high\"}",
  ].join("\n");
}

export function parseCodexJsonlFinalMessage(jsonl: string): string {
  let finalMessage = "";
  for (const line of jsonl.split("\n").filter(Boolean)) {
    const parsed = JSON.parse(line) as { item?: { type?: string; text?: string } };
    if (parsed.item?.type === "agent_message" && typeof parsed.item.text === "string") {
      finalMessage = parsed.item.text;
    }
  }
  if (finalMessage.length === 0) throw new Error("Codex read-only delegation returned no final agent message.");
  return finalMessage;
}

async function runCodexCli(prompt: string, timeoutMs: number): Promise<string> {
  const { stdout } = await execFileAsync("codex", ["exec", "--json", "--sandbox", "read-only", prompt], {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 4,
  });
  return stdout;
}

function parseDelegationJson(text: string): Omit<ReadOnlyDelegationResult, "requestId" | "threadId" | "target" | "status" | "rawOutput" | "completedAt"> {
  const parsed = JSON.parse(text) as {
    summary?: unknown;
    evidence?: unknown;
    risks?: unknown;
    recommendations?: unknown;
    confidence?: unknown;
  };
  const confidence = parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high"
    ? parsed.confidence
    : "low";
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Codex returned an unstructured summary.",
    evidence: toStringArray(parsed.evidence),
    risks: toStringArray(parsed.risks),
    recommendations: toStringArray(parsed.recommendations),
    confidence,
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
```

The Codex CLI command uses `codex exec --json --sandbox read-only`. Official Codex docs state `--json` emits JSONL events, and the CLI supports `--sandbox read-only | workspace-write | danger-full-access`. Keep tests injected so CI does not require a logged-in Codex CLI.

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/core/read-only-delegation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/read-only-delegation.ts tests/core/read-only-delegation.test.ts
git commit -m "feat: add read-only delegation adapter"
```

---

### Task 5: Add Judgment Merge

**Files:**
- Create: `src/core/judgment-merge.ts`
- Test: `tests/core/judgment-merge.test.ts`

- [ ] **Step 1: Write failing Judgment Merge tests**

Create `tests/core/judgment-merge.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mergeDelegationResultIntoJudgment } from "../../src/core/judgment-merge";
import type { OpenThread, ReadOnlyDelegationResult } from "../../src/core/types";

function thread(): OpenThread {
  return {
    id: "thread-1",
    title: "Runtime plan drift",
    status: "delegated",
    whyItMatters: "The foundation must be coherent before Memory v2.",
    currentJudgment: "Runtime implementation may be incomplete.",
    evidence: [],
    risks: [],
    nextAttentionTrigger: "Codex read-only review returns.",
    interventionThreshold: "The review finds missing runtime APIs.",
    delegationHistory: [],
    memoryLinks: [],
    traceRefs: [],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };
}

describe("mergeDelegationResultIntoJudgment", () => {
  it("adds evidence and risk when a delegation finds a gap", () => {
    const result: ReadOnlyDelegationResult = {
      requestId: "delegation-1",
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "Doctor API is missing.",
      evidence: ["No src/core/doctor.ts exists."],
      risks: ["Runtime plan remains incomplete."],
      recommendations: ["Finish Doctor and review endpoints before Memory v2."],
      confidence: "high",
      completedAt: "2026-06-12T00:05:00.000Z",
    };

    const merge = mergeDelegationResultIntoJudgment(thread(), result);
    expect(merge.classification).toBe("adds_new_risk");
    expect(merge.shouldNotifyUser).toBe(true);
    expect(merge.nextJudgment).toContain("Doctor API is missing");
    expect(merge.evidenceAdded[0].kind).toBe("delegation_result");
  });

  it("stays low signal when result has no evidence or risks", () => {
    const merge = mergeDelegationResultIntoJudgment(thread(), {
      requestId: "delegation-1",
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "No material drift found.",
      evidence: [],
      risks: [],
      recommendations: [],
      confidence: "medium",
      completedAt: "2026-06-12T00:05:00.000Z",
    });

    expect(merge.classification).toBe("irrelevant_or_low_signal");
    expect(merge.shouldNotifyUser).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/judgment-merge.test.ts
```

Expected: FAIL because `judgment-merge.ts` does not exist.

- [ ] **Step 3: Implement Judgment Merge**

Create `src/core/judgment-merge.ts`:

```ts
import type { JudgmentMergeResult, OpenThread, OpenThreadEvidence, ReadOnlyDelegationResult } from "./types";

export function mergeDelegationResultIntoJudgment(
  thread: OpenThread,
  result: ReadOnlyDelegationResult,
): JudgmentMergeResult {
  const at = result.completedAt;
  const evidenceAdded: OpenThreadEvidence[] = result.evidence.map((summary, index) => ({
    id: `evidence:${result.requestId}:${index}`,
    at,
    kind: "delegation_result",
    sourceRef: `delegation:${result.requestId}`,
    summary,
    strength: result.confidence === "high" ? "strong" : result.confidence === "medium" ? "medium" : "weak",
  }));

  const classification = classify(result);
  const nextJudgment = buildNextJudgment(thread, result);
  return {
    threadId: thread.id,
    classification,
    previousJudgment: thread.currentJudgment,
    nextJudgment,
    riskChanges: result.risks,
    evidenceAdded,
    newThreadSuggestions: [],
    shouldNotifyUser: classification === "adds_new_risk" || classification === "contradicts_current_judgment",
    reason: reasonFor(classification, result),
    createdAt: at,
  };
}

function classify(result: ReadOnlyDelegationResult): JudgmentMergeResult["classification"] {
  if (result.risks.length > 0) return "adds_new_risk";
  if (result.evidence.length > 0 && result.recommendations.length > 0) return "closes_evidence_gap";
  if (result.evidence.length > 0) return "supports_current_judgment";
  return "irrelevant_or_low_signal";
}

function buildNextJudgment(thread: OpenThread, result: ReadOnlyDelegationResult): string {
  if (result.risks.length > 0) {
    return `${thread.currentJudgment} Delegation update: ${result.summary} Recommended next step: ${result.recommendations[0] ?? "review the new risk."}`;
  }
  if (result.evidence.length > 0) {
    return `${thread.currentJudgment} Delegation added evidence: ${result.summary}`;
  }
  return thread.currentJudgment;
}

function reasonFor(classification: JudgmentMergeResult["classification"], result: ReadOnlyDelegationResult): string {
  if (classification === "adds_new_risk") return `Delegation found ${result.risks.length} risk(s).`;
  if (classification === "closes_evidence_gap") return "Delegation added evidence and a concrete recommendation.";
  if (classification === "supports_current_judgment") return "Delegation added supporting evidence.";
  return "Delegation did not materially change Along's judgment.";
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/core/judgment-merge.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/judgment-merge.ts tests/core/judgment-merge.test.ts
git commit -m "feat: merge delegation judgments"
```

---

### Task 6: Add Conductor Runtime Orchestration

**Files:**
- Create: `src/core/conductor-runtime.ts`
- Modify: `src/core/runtime.ts`
- Test: `tests/core/conductor-runtime.test.ts`

- [ ] **Step 1: Write failing conductor runtime tests**

Create `tests/core/conductor-runtime.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ConductorRuntime } from "../../src/core/conductor-runtime";
import { OpenThreadStore } from "../../src/core/open-thread-store";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-conductor-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("ConductorRuntime", () => {
  it("runs heartbeat and prepares read-only delegation for a stale thread", async () => {
    const repo = await makeRepo();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });

    const conductor = new ConductorRuntime({ repoPath: repo });
    const result = await conductor.runHeartbeat({
      trigger: "resume",
      sessionId: "session-1",
      now: new Date("2026-06-20T00:00:00.000Z"),
    });

    expect(result.attention[0].action).toBe("read_only_delegation");
    expect(result.delegations[0]).toMatchObject({ threadId: "thread-1", target: "codex", status: "requested" });
  });

  it("ingests a delegation result and updates the thread judgment", async () => {
    const repo = await makeRepo();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Runtime plan drift blocks conductor work.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    const conductor = new ConductorRuntime({ repoPath: repo });
    const request = await conductor.createReadOnlyDelegation({
      threadId: "thread-1",
      sessionId: "session-1",
      reason: "Need review.",
      question: "Check runtime progress.",
      scope: ["src/core"],
    });

    const merge = await conductor.ingestDelegationResult({
      requestId: request.id,
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "Doctor API is missing.",
      evidence: ["No doctor endpoint."],
      risks: ["Runtime plan incomplete."],
      recommendations: ["Finish Doctor."],
      confidence: "high",
      completedAt: "2026-06-12T00:05:00.000Z",
    });

    const [thread] = await threads.readAll();
    expect(merge.shouldNotifyUser).toBe(true);
    expect(thread.currentJudgment).toContain("Doctor API is missing");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/core/conductor-runtime.test.ts
```

Expected: FAIL because `ConductorRuntime` does not exist.

- [ ] **Step 3: Implement conductor runtime**

Create `src/core/conductor-runtime.ts`:

```ts
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type {
  ConductorPreferences,
  ConductorSnapshot,
  HeartbeatTrigger,
  ReadOnlyDelegationRequest,
  ReadOnlyDelegationResult,
} from "./types";
import { defaultConductorPreferences } from "./types";
import { scoreOpenThread } from "./attention-score";
import { mergeDelegationResultIntoJudgment } from "./judgment-merge";
import { defaultForbiddenReadOnlyActions } from "./read-only-delegation";
import { getConductorSnapshotPath, getDelegationRequestsPath } from "./paths";
import { OpenThreadStore } from "./open-thread-store";
import { TraceStore } from "./trace-store";
import { WriteCoordinator } from "./write-coordinator";

interface ConductorRuntimeOptions {
  repoPath: string;
  preferences?: ConductorPreferences;
}

interface HeartbeatInput {
  trigger: HeartbeatTrigger;
  sessionId: string;
  now?: Date;
}

interface CreateDelegationInput {
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
    this.preferences = options.preferences ?? defaultConductorPreferences;
  }

  async runHeartbeat(input: HeartbeatInput): Promise<ConductorSnapshot> {
    const threads = await this.threads.readActive();
    const attention = threads.map((thread) => scoreOpenThread(thread, {
      trigger: input.trigger,
      now: input.now ?? new Date(),
      allowReadOnlyDelegation: this.preferences.delegationModeLabel === "read_only_auto",
      canProactivelyMessage: this.preferences.highRiskEscalation,
    }));

    const delegations: ReadOnlyDelegationRequest[] = [];
    for (const decision of attention.filter((item) => item.action === "read_only_delegation")) {
      const thread = threads.find((item) => item.id === decision.threadId);
      if (!thread) continue;
      delegations.push(await this.createReadOnlyDelegation({
        threadId: thread.id,
        sessionId: input.sessionId,
        reason: decision.reasons.join(" "),
        question: `Read-only inspect this Open Thread and report evidence, risks, and recommendations: ${thread.title}`,
        scope: [".along", "docs", "src", "tests"],
      }));
    }

    const snapshot: ConductorSnapshot = { threads, attention, delegations, preferences: this.preferences };
    await this.writes.atomicWriteJson(getConductorSnapshotPath(this.options.repoPath), snapshot);
    await this.traces.recordTrace({
      sessionId: input.sessionId,
      operation: "conductorHeartbeat",
      inputs: threads.map((thread) => `thread:${thread.id}`),
      decision: `heartbeat produced ${attention.length} attention decision(s)`,
      reason: `trigger=${input.trigger}`,
      relatedEventIds: [],
      outcome: "allowed",
    });
    return snapshot;
  }

  async createReadOnlyDelegation(input: CreateDelegationInput): Promise<ReadOnlyDelegationRequest> {
    const request: ReadOnlyDelegationRequest = {
      id: `delegation-${randomUUID()}`,
      threadId: input.threadId,
      reason: input.reason,
      target: "codex",
      scope: input.scope,
      forbiddenActions: defaultForbiddenReadOnlyActions,
      question: input.question,
      expectedOutput: ["summary", "evidence", "risks", "recommendations", "confidence"],
      budget: { timeoutMs: 120_000, maxOutputChars: 12_000 },
      returnFormat: "judgment_merge_json",
      status: "requested",
      createdAt: new Date().toISOString(),
    };
    const existing = await this.readDelegationRequests();
    await this.writes.atomicWriteJson(getDelegationRequestsPath(this.options.repoPath), [
      request,
      ...existing.filter((item) => item.id !== request.id),
    ]);
    await this.threads.recordDelegation(input.threadId, {
      delegationId: request.id,
      target: request.target,
      status: request.status,
      createdAt: request.createdAt,
    });
    return request;
  }

  async ingestDelegationResult(result: ReadOnlyDelegationResult) {
    const thread = (await this.threads.readAll()).find((item) => item.id === result.threadId);
    if (!thread) throw new Error(`Open Thread not found: ${result.threadId}`);
    const merge = mergeDelegationResultIntoJudgment(thread, result);
    await this.threads.updateJudgment(thread.id, {
      currentJudgment: merge.nextJudgment,
      status: merge.shouldNotifyUser ? "needs_user" : "watching",
      updatedAt: merge.createdAt,
    });
    for (const evidence of merge.evidenceAdded) {
      await this.threads.appendEvidence(thread.id, evidence);
    }
    await this.threads.recordDelegation(thread.id, {
      delegationId: result.requestId,
      target: result.target,
      status: result.status,
      createdAt: result.completedAt,
      resultRef: `delegation:${result.requestId}`,
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

  private async readDelegationRequests(): Promise<ReadOnlyDelegationRequest[]> {
    try {
      const raw = await fs.readFile(getDelegationRequestsPath(this.options.repoPath), "utf8");
      return JSON.parse(raw) as ReadOnlyDelegationRequest[];
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
```

- [ ] **Step 4: Wire through `AlongRuntime`**

In `src/core/runtime.ts`, add:

```ts
import { ConductorRuntime } from "./conductor-runtime";
import type { ConductorSnapshot, HeartbeatTrigger, ReadOnlyDelegationResult } from "./types";
```

Add a private field:

```ts
private readonly conductor: ConductorRuntime;
```

Initialize it in the constructor:

```ts
this.conductor = new ConductorRuntime({ repoPath: options.repoPath });
```

Add these public methods to `AlongRuntime`:

```ts
async conductorSnapshot(): Promise<ConductorSnapshot> {
  return await this.conductor.snapshot();
}

async conductorHeartbeat(trigger: HeartbeatTrigger): Promise<ConductorSnapshot> {
  const currentSession = await this.current();
  if (!currentSession) throw new Error("Cannot run conductor heartbeat without a current session.");
  return await this.conductor.runHeartbeat({ trigger, sessionId: currentSession.id });
}

async ingestDelegationResult(result: ReadOnlyDelegationResult) {
  return await this.conductor.ingestDelegationResult(result);
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/core/conductor-runtime.test.ts tests/core/runtime.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/conductor-runtime.ts src/core/runtime.ts tests/core/conductor-runtime.test.ts
git commit -m "feat: orchestrate conductor heartbeat"
```

---

### Task 7: Add Conductor API Endpoints

**Files:**
- Modify: `src/server/app.ts`
- Test: `tests/server/app-conductor.test.ts`

- [ ] **Step 1: Write failing API tests**

Create `tests/server/app-conductor.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";
import { OpenThreadStore } from "../../src/core/open-thread-store";

async function makeServer() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-conductor-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
  const app = createApp({ repoPath: repo, homeDir: home });
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address.");
  return { repo, server, base: `http://127.0.0.1:${address.port}` };
}

describe("conductor API", () => {
  it("returns conductor snapshot and heartbeat decisions", async () => {
    const { repo, server, base } = await makeServer();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Runtime completion matters before Memory v2.",
      currentJudgment: "Runtime may be incomplete.",
    });

    await fetch(`${base}/api/session/start`, { method: "POST" });
    const heartbeat = await fetch(`${base}/api/conductor/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trigger: "resume" }),
    });
    const heartbeatBody = await heartbeat.json() as { attention: Array<{ action: string }>; delegations: unknown[] };
    const snapshot = await fetch(`${base}/api/conductor/snapshot`);
    const snapshotBody = await snapshot.json() as { threads: Array<{ id: string }> };
    server.close();

    expect(heartbeat.status).toBe(200);
    expect(heartbeatBody.attention[0].action).toBe("read_only_delegation");
    expect(heartbeatBody.delegations).toHaveLength(1);
    expect(snapshotBody.threads[0].id).toBe("thread-1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/server/app-conductor.test.ts
```

Expected: FAIL with 404 for `/api/conductor/heartbeat` or missing endpoint.

- [ ] **Step 3: Add zod schemas and endpoints**

In `src/server/app.ts`, add imports:

```ts
import { heartbeatTriggers } from "../core/types";
```

Add endpoints before the error handler:

```ts
app.get("/api/conductor/snapshot", async (_req, res, next) => {
  try {
    res.json(await runtime.conductorSnapshot());
  } catch (error) {
    next(error);
  }
});

app.post("/api/conductor/heartbeat", async (req, res, next) => {
  try {
    const parsed = z.object({ trigger: z.enum(heartbeatTriggers) }).parse(req.body);
    res.json(await runtime.conductorHeartbeat(parsed.trigger));
  } catch (error) {
    next(error);
  }
});

app.post("/api/conductor/delegation-result", async (req, res, next) => {
  try {
    const parsed = z.object({
      requestId: z.string().min(1),
      threadId: z.string().min(1),
      target: z.enum(["codex", "hermes", "local_subagent", "manual"]),
      status: z.enum(["completed", "failed", "cancelled"]),
      summary: z.string(),
      evidence: z.array(z.string()),
      risks: z.array(z.string()),
      recommendations: z.array(z.string()),
      confidence: z.enum(["low", "medium", "high"]),
      rawOutput: z.string().optional(),
      completedAt: z.string().datetime(),
    }).parse(req.body);
    res.json(await runtime.ingestDelegationResult(parsed));
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/server/app-conductor.test.ts tests/server/app.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/app.ts tests/server/app-conductor.test.ts
git commit -m "feat: expose conductor API"
```

---

### Task 8: Add Minimal Project Intelligence UI

**Files:**
- Modify: `src/web/App.tsx`
- Modify: `src/web/styles.css`

- [ ] **Step 1: Add client-side response contracts**

In `src/web/App.tsx`, add these interfaces near `SessionResponse`:

```tsx
interface OpenThreadResponse {
  id: string;
  title: string;
  status: string;
  whyItMatters: string;
  currentJudgment: string;
  risks: Array<{ summary: string; severity: string }>;
  evidence: Array<{ summary: string; strength: string }>;
}

interface AttentionResponse {
  threadId: string;
  action: string;
  score: number;
  reasons: string[];
}

interface DelegationResponse {
  id: string;
  threadId: string;
  target: string;
  status: string;
  reason: string;
  scope: string[];
}

interface ConductorSnapshotResponse {
  threads: OpenThreadResponse[];
  attention: AttentionResponse[];
  delegations: DelegationResponse[];
  preferences: {
    delegationModeLabel: string;
    interventionStyle: string;
  };
}
```

- [ ] **Step 2: Add snapshot state and polling**

Inside `App()`, add state:

```tsx
const [conductor, setConductor] = useState<ConductorSnapshotResponse | null>(null);
```

Inside the existing `useEffect`, after loading the session, add a helper:

```tsx
function loadConductor() {
  readJson<ConductorSnapshotResponse>(`${apiBase}/api/conductor/snapshot`)
    .then((snapshot) => {
      if (!cancelled) setConductor(snapshot);
    })
    .catch(() => undefined);
}
```

Call it once and inside the existing interval:

```tsx
loadConductor();
```

- [ ] **Step 3: Add a heartbeat button and surfaces**

Add this function inside `App()`:

```tsx
async function runConductorHeartbeat() {
  const result = await readJson<ConductorSnapshotResponse>(`${apiBase}/api/conductor/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trigger: "user_event" }),
  });
  setConductor(result);
}
```

Add two panels inside the grid:

```tsx
<article className="panel wide conductor-panel">
  <Brain size={20} />
  <div className="panel-heading">
    <div>
      <h2>Project intelligence</h2>
      <p className="muted">Open Threads Along is carrying forward.</p>
    </div>
    <button onClick={runConductorHeartbeat}>Check threads</button>
  </div>
  <div className="thread-list">
    {(conductor?.threads ?? []).slice(0, 5).map((thread) => (
      <section className="thread-row" key={thread.id}>
        <div>
          <strong>{thread.title}</strong>
          <span>{thread.status}</span>
        </div>
        <p>{thread.currentJudgment}</p>
        <small>{thread.whyItMatters}</small>
      </section>
    ))}
    {(conductor?.threads.length ?? 0) === 0 && <p className="muted">No Open Threads yet.</p>}
  </div>
</article>

<article className="panel wide conductor-panel">
  <MessageCircle size={20} />
  <h2>Delegation live view</h2>
  <div className="delegation-list">
    {(conductor?.delegations ?? []).slice(0, 5).map((delegation) => (
      <section className="delegation-row" key={delegation.id}>
        <div>
          <strong>{delegation.target}</strong>
          <span>{delegation.status}</span>
        </div>
        <p>{delegation.reason}</p>
        <small>{delegation.scope.join(", ")}</small>
      </section>
    ))}
    {(conductor?.delegations.length ?? 0) === 0 && <p className="muted">No read-only delegations requested.</p>}
  </div>
</article>
```

This UI must stay quiet and utilitarian. Do not turn it into a marketing page or broad productivity dashboard.

- [ ] **Step 4: Add CSS**

Append to `src/web/styles.css`:

```css
.panel-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel-heading h2 {
  margin-top: 0;
}

.thread-list,
.delegation-list {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.thread-row,
.delegation-row {
  border: 1px solid #d8d0c2;
  border-radius: 8px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.58);
}

.thread-row div,
.delegation-row div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.thread-row span,
.delegation-row span {
  border-radius: 999px;
  background: #e4f0ed;
  color: #244748;
  padding: 4px 8px;
  font-size: 12px;
}

.thread-row p,
.delegation-row p {
  margin: 8px 0;
  color: #34454f;
}

.thread-row small,
.delegation-row small {
  color: #687782;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 5: Run static checks**

Run:

```bash
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/web/App.tsx src/web/styles.css
git commit -m "feat: show conductor project intelligence"
```

---

### Task 9: End-To-End Verification

**Files:**
- No source files unless verification exposes a bug.

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
npm test -- tests/core/living-conductor-types.test.ts tests/core/open-thread-store.test.ts tests/core/attention-score.test.ts tests/core/read-only-delegation.test.ts tests/core/judgment-merge.test.ts tests/core/conductor-runtime.test.ts tests/server/app-conductor.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full automated checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: PASS.

If `npm test` fails only because the sandbox denies Express `listen`, rerun `npm test` outside the sandbox with escalation and record that reason in the final handoff.

- [ ] **Step 3: Manual API smoke test**

Start the API server:

```bash
npm run dev
```

In another terminal:

```bash
curl -s -X POST http://127.0.0.1:4317/api/session/start
curl -s http://127.0.0.1:4317/api/conductor/snapshot
curl -s -X POST http://127.0.0.1:4317/api/conductor/heartbeat \
  -H 'Content-Type: application/json' \
  -d '{"trigger":"user_event"}'
```

Expected:

- session starts;
- conductor snapshot returns `threads`, `attention`, `delegations`, and `preferences`;
- heartbeat returns a valid snapshot and does not modify project files.

- [ ] **Step 4: Browser verification**

Start the app:

```bash
npm run dev
npm run web
```

Open the Vite URL and verify:

- existing session rhythm still appears;
- Project Intelligence panel appears;
- Delegation Live View panel appears;
- "Check threads" does not cause layout overlap on desktop or mobile width;
- no sound autoplay occurs;
- wrap-up still writes the journal.

- [ ] **Step 5: Commit verification fixes if needed**

If verification required source changes:

```bash
git status --short
git add src/core src/server src/web tests
git commit -m "fix: stabilize conductor foundation"
```

If no source changes were required, do not create an empty commit.

---

## Plan Self-Review

Spec coverage:

- Open Threads: Tasks 1-2.
- Runtime-triggered heartbeat and attention: Tasks 3 and 6.
- Read-only Codex delegation boundary: Task 4.
- Judgment Merge: Task 5.
- Permission and user-facing delegation modes: Tasks 1 and 8.
- Project Intelligence Library and Delegation Live View: Task 8.
- Trace/Doctor visibility: Task 6 records traces; the existing Runtime Control Plane Doctor should expose trace state after its prerequisite task is complete.
- Full Hermes adapter: intentionally out of scope for this foundation slice.
- Rich Conductor Packs: represented as future presets, not implemented in this foundation slice.

Execution guidance:

- Prefer `superpowers:subagent-driven-development`.
- Use one fresh subagent per task.
- The main session should review after each task and run the focused tests before dispatching the next task.
- Keep commits exactly at task boundaries unless a task requires a verification-fix commit.
