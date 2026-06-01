# Along Runtime Control Plane and Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Runtime Control Plane so Along has durable session lifecycle, runtime profile, permissions, events, context packets, coordinated writes, review gate, traces, and Doctor API before Memory v2 and Autonomy expand.

**Architecture:** Keep Along local-first and file-backed. Add focused TypeScript core modules under `src/core/`, route all `.along/` writes through a Write Coordinator, then integrate the control-plane contracts into `AlongRuntime` and the Express API without introducing a database, daemon, vector store, or project-code write permission.

**Tech Stack:** Node 22, TypeScript, Vitest, Express, React/Vite, local JSON/JSONL/Markdown files, zod where request validation already exists.

---

## Scope Check

This spec includes several components, but they are not independent product subsystems. They are one runtime contract stack: session lifecycle depends on coordinated writes, event intake, profile/permissions, trace, and Doctor. Keep this as one implementation plan with commits after each bounded layer.

## File Structure

Create and modify these files:

```text
src/
  core/
    context-engine.ts
    doctor.ts
    event-store.ts
    review-gate.ts
    runtime-profile.ts
    session-lifecycle.ts
    trace-store.ts
    types.ts
    paths.ts
    write-coordinator.ts
    memory-store.ts
    runtime.ts
  server/
    app.ts
  web/
    App.tsx
tests/
  core/
    context-engine.test.ts
    doctor.test.ts
    event-store.test.ts
    review-gate.test.ts
    runtime-profile.test.ts
    runtime-control-plane.types.test.ts
    runtime.test.ts
    session-lifecycle.test.ts
    write-coordinator.test.ts
  server/
    app.test.ts
```

Responsibility boundaries:

- `src/core/types.ts`: shared control-plane types and constants only.
- `src/core/paths.ts`: all `.along/` runtime path helpers.
- `src/core/write-coordinator.ts`: atomic JSON writes, JSONL append with idempotency, project-level lock.
- `src/core/runtime-profile.ts`: settings defaults, settings loading, effective profile, Permission Envelope derivation.
- `src/core/event-store.ts`: event normalization, JSONL event append, event reads.
- `src/core/trace-store.ts`: trace append and trace reads.
- `src/core/review-gate.ts`: review inbox reads/writes and review decisions.
- `src/core/context-engine.ts`: deterministic, permission-aware context packet construction.
- `src/core/session-lifecycle.ts`: durable current pointer, session index, recovery, pause, wrap-up lifecycle state.
- `src/core/doctor.ts`: runtime health snapshot for API/debug use.
- `src/core/memory-store.ts`: initializes the new runtime directories and delegates shared writes only where needed.
- `src/core/runtime.ts`: integrates the control plane with the existing Along session flow.
- `src/server/app.ts`: exposes pause, Doctor, trace, and review endpoints.
- `src/web/App.tsx`: keep current UI flow compatible with disk-backed current sessions and wrap-up idempotency.

## Data Contract Names

Use these names exactly:

```ts
export type SessionLifecycleState = "new" | "active" | "paused" | "wrapped" | "expired" | "recovered";
export type RuntimeMode = "companion" | "debug" | "research";
export type RuntimeMemoryMode = "off" | "session" | "project_reviewed" | "project_auto" | "global_reviewed";
export type PresenceMode = "ambient" | "focused" | "interactive" | "resting";
export type RelationshipStyle = "calm" | "close" | "reflective" | "challenger";
export type AccountabilityLevel = "off" | "gentle" | "direct" | "strict";
export type AutonomyLevel = "quiet" | "suggestive" | "proactive";
export type AlongEventSource = "user" | "along" | "runtime" | "filesystem" | "tool" | "system";
export type ContextPurpose = "session_start" | "autonomy_tick" | "wrap_up" | "memory_consolidation" | "user_response" | "debug_inspection";
export type RuntimeStorageMode = "writable" | "degraded" | "readonly";
```

## Task 1: Control-Plane Types And Paths

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/paths.ts`
- Test: `tests/core/runtime-control-plane.types.test.ts`

- [ ] **Step 1: Write the failing type and path tests**

Create `tests/core/runtime-control-plane.types.test.ts`:

```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  alongEventKinds,
  contextSectionKinds,
  defaultPermissionEnvelope,
  defaultRuntimeProfile,
  reviewItemKinds,
  sessionLifecycleStates,
} from "../../src/core/types";
import {
  getContextPacketPath,
  getCurrentSessionPath,
  getEventsFilePath,
  getReviewInboxPath,
  getRuntimeLockPath,
  getRuntimeSettingsPath,
  getRuntimeStatePath,
  getSessionFilePath,
  getSessionIndexPath,
  getTraceFilePath,
} from "../../src/core/paths";

describe("runtime control-plane type constants", () => {
  it("declares approved session lifecycle states", () => {
    expect(sessionLifecycleStates).toEqual(["new", "active", "paused", "wrapped", "expired", "recovered"]);
  });

  it("keeps the conservative runtime defaults", () => {
    expect(defaultRuntimeProfile).toMatchObject({
      runtimeMode: "companion",
      memoryMode: "project_reviewed",
      presenceMode: "ambient",
      relationshipStyle: "calm",
      accountabilityLevel: "off",
      autonomyLevel: "quiet",
      featureFlags: {},
    });
  });

  it("denies project file writes and global memory promotion by default", () => {
    expect(defaultPermissionEnvelope.canModifyProjectFiles).toBe(false);
    expect(defaultPermissionEnvelope.requiresReview.globalMemory).toBe(true);
    expect(defaultPermissionEnvelope.requiresReview.proceduralMemory).toBe(true);
  });

  it("declares event, context, and review contract names", () => {
    expect(alongEventKinds).toContain("session_recovered");
    expect(alongEventKinds).toContain("user_refusal");
    expect(contextSectionKinds).toContain("permission_envelope");
    expect(reviewItemKinds).toContain("procedural_memory_candidate");
  });
});

describe("runtime control-plane paths", () => {
  it("maps runtime files under the project .along directory", () => {
    const repo = path.join("tmp", "demo");
    expect(getRuntimeStatePath(repo)).toBe(path.join(repo, ".along", "state.json"));
    expect(getRuntimeSettingsPath(repo)).toBe(path.join(repo, ".along", "settings.json"));
    expect(getCurrentSessionPath(repo)).toBe(path.join(repo, ".along", "sessions", "current.json"));
    expect(getSessionIndexPath(repo)).toBe(path.join(repo, ".along", "sessions", "index.json"));
    expect(getSessionFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "sessions", "session-1.json"));
    expect(getEventsFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "events", "session-1.jsonl"));
    expect(getContextPacketPath(repo, "context-1")).toBe(path.join(repo, ".along", "context", "context-1.json"));
    expect(getReviewInboxPath(repo)).toBe(path.join(repo, ".along", "review", "inbox.json"));
    expect(getTraceFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "traces", "session-1.jsonl"));
    expect(getRuntimeLockPath(repo)).toBe(path.join(repo, ".along", "locks", "runtime.lock"));
  });
});
```

- [ ] **Step 2: Run the failing type and path tests**

Run:

```bash
npm test -- tests/core/runtime-control-plane.types.test.ts
```

Expected: FAIL because the new constants and helpers are not exported.

- [ ] **Step 3: Add control-plane type exports**

Append these exports to `src/core/types.ts` after the existing `AlongSession` interface:

```ts
export const sessionLifecycleStates = ["new", "active", "paused", "wrapped", "expired", "recovered"] as const;
export type SessionLifecycleState = (typeof sessionLifecycleStates)[number];

export type RuntimeMode = "companion" | "debug" | "research";
export type RuntimeMemoryMode = "off" | "session" | "project_reviewed" | "project_auto" | "global_reviewed";
export type PresenceMode = "ambient" | "focused" | "interactive" | "resting";
export type RelationshipStyle = "calm" | "close" | "reflective" | "challenger";
export type AccountabilityLevel = "off" | "gentle" | "direct" | "strict";
export type AutonomyLevel = "quiet" | "suggestive" | "proactive";

export interface RuntimeProfile {
  runtimeMode: RuntimeMode;
  memoryMode: RuntimeMemoryMode;
  presenceMode: PresenceMode;
  relationshipStyle: RelationshipStyle;
  accountabilityLevel: AccountabilityLevel;
  autonomyLevel: AutonomyLevel;
  featureFlags: Record<string, boolean>;
}

export interface PermissionEnvelope {
  canReadProject: boolean;
  canReadAlongMemory: boolean;
  canWriteSession: boolean;
  canWriteJournal: boolean;
  canCreateMemoryCandidate: boolean;
  canPromoteMemory: boolean;
  canUpdateGraph: boolean;
  canShowStatus: boolean;
  canAskUser: boolean;
  canProactivelyMessage: boolean;
  canCallTools: boolean;
  canModifyProjectFiles: boolean;
  requiresReview: {
    memoryPromotion: boolean;
    globalMemory: boolean;
    proceduralMemory: boolean;
    proactiveMessage: boolean;
    projectFileWrite: boolean;
  };
}

export const defaultRuntimeProfile: RuntimeProfile = {
  runtimeMode: "companion",
  memoryMode: "project_reviewed",
  presenceMode: "ambient",
  relationshipStyle: "calm",
  accountabilityLevel: "off",
  autonomyLevel: "quiet",
  featureFlags: {},
};

export const defaultPermissionEnvelope: PermissionEnvelope = {
  canReadProject: true,
  canReadAlongMemory: true,
  canWriteSession: true,
  canWriteJournal: true,
  canCreateMemoryCandidate: true,
  canPromoteMemory: false,
  canUpdateGraph: true,
  canShowStatus: true,
  canAskUser: true,
  canProactivelyMessage: false,
  canCallTools: false,
  canModifyProjectFiles: false,
  requiresReview: {
    memoryPromotion: true,
    globalMemory: true,
    proceduralMemory: true,
    proactiveMessage: true,
    projectFileWrite: true,
  },
};

export const alongEventKinds = [
  "session_started",
  "session_recovered",
  "session_paused",
  "session_wrapped",
  "user_message",
  "user_correction",
  "user_preference",
  "user_refusal",
  "user_review_decision",
  "along_tick",
  "presence_state_changed",
  "curiosity_created",
  "project_observed",
  "file_summary_changed",
  "memory_candidate_created",
  "graph_relation_candidate_created",
  "journal_written",
  "error_recorded",
  "recovery_performed",
] as const;
export type AlongEventKind = (typeof alongEventKinds)[number];
export type AlongEventSource = "user" | "along" | "runtime" | "filesystem" | "tool" | "system";

export interface AlongEvent {
  id: string;
  schemaVersion: 1;
  occurredAt: string;
  receivedAt: string;
  sessionId: string;
  source: AlongEventSource;
  kind: AlongEventKind;
  visibility: "internal" | "user_visible" | "reviewable";
  scope: "session" | "project" | "global_candidate";
  payload: Record<string, unknown>;
  provenance: {
    route?: string;
    filePath?: string;
    command?: string;
    parentEventId?: string;
  };
  memoryEligibility: "never" | "session_only" | "candidate" | "review_required";
  riskLevel: "low" | "medium" | "high";
  idempotencyKey?: string;
}

export const contextSectionKinds = [
  "current_session",
  "recent_events",
  "project_summary",
  "active_curiosity",
  "reviewed_memory",
  "memory_candidate",
  "graph_neighborhood",
  "journal_excerpt",
  "runtime_profile",
  "permission_envelope",
] as const;
export type ContextSectionKind = (typeof contextSectionKinds)[number];
export type ContextPurpose =
  | "session_start"
  | "autonomy_tick"
  | "wrap_up"
  | "memory_consolidation"
  | "user_response"
  | "debug_inspection";

export interface ContextItem {
  id: string;
  content: string;
  sourceRef: string;
  includedBecause: string;
  confidence: "low" | "medium" | "high";
  scope: "session" | "project" | "global";
  riskLevel: "low" | "medium" | "high";
}

export interface ContextSection {
  kind: ContextSectionKind;
  items: ContextItem[];
}

export interface ContextOmission {
  sourceRef: string;
  reason: "budget" | "permission_denied" | "requires_review" | "expired" | "low_relevance" | "risk_too_high";
}

export interface ContextPacket {
  id: string;
  createdAt: string;
  sessionId: string;
  purpose: ContextPurpose;
  budget: {
    maxItems: number;
    maxApproxTokens: number;
  };
  sections: ContextSection[];
  omissions: ContextOmission[];
}

export const reviewItemKinds = [
  "memory_candidate",
  "global_memory_candidate",
  "procedural_memory_candidate",
  "graph_relation_candidate",
  "relationship_style_change",
  "accountability_change",
  "proactive_behavior_change",
  "sensitive_inference",
] as const;
export type ReviewItemKind = (typeof reviewItemKinds)[number];
export type ReviewStatus = "pending" | "accepted" | "edited" | "rejected" | "expired";

export interface ReviewItem {
  id: string;
  kind: ReviewItemKind;
  createdAt: string;
  sessionId: string;
  proposedChange: string;
  sourceRefs: string[];
  reason: string;
  riskLevel: "low" | "medium" | "high";
  defaultAction: "ignore" | "ask" | "keep_as_candidate";
  status: ReviewStatus;
}

export interface TraceEntry {
  id: string;
  at: string;
  sessionId?: string;
  operation: string;
  inputs: string[];
  decision: string;
  reason: string;
  permissionSnapshot?: string;
  contextPacketId?: string;
  relatedEventIds: string[];
  outcome: "allowed" | "blocked" | "queued" | "failed" | "recovered";
}

export type RuntimeStorageMode = "writable" | "degraded" | "readonly";

export interface RuntimeDoctorReport {
  lifecycleState: SessionLifecycleState | "none";
  effectiveProfile: RuntimeProfile;
  permissionEnvelope: PermissionEnvelope;
  currentPointerHealthy: boolean;
  recentEvents: AlongEvent[];
  latestContextPacket?: ContextPacket;
  pendingReviewItems: ReviewItem[];
  recentFailures: TraceEntry[];
  storageMode: RuntimeStorageMode;
}
```

- [ ] **Step 4: Add runtime path helpers**

Append these functions to `src/core/paths.ts`:

```ts
export function getRuntimeStatePath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "state.json");
}

export function getRuntimeSettingsPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "settings.json");
}

export function getCurrentSessionPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", "current.json");
}

export function getSessionIndexPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", "index.json");
}

export function getSessionFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", `${sessionId}.json`);
}

export function getEventsFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "events", `${sessionId}.jsonl`);
}

export function getContextPacketPath(repoPath: string, contextPacketId: string): string {
  return path.join(getProjectAlongDir(repoPath), "context", `${contextPacketId}.json`);
}

export function getReviewInboxPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "review", "inbox.json");
}

export function getTraceFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "traces", `${sessionId}.jsonl`);
}

export function getRuntimeLockPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "locks", "runtime.lock");
}
```

- [ ] **Step 5: Run the type and path tests**

Run:

```bash
npm test -- tests/core/runtime-control-plane.types.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/paths.ts tests/core/runtime-control-plane.types.test.ts
git commit -m "feat: add runtime control plane contracts"
```

## Task 2: Write Coordinator And Project Lock

**Files:**
- Create: `src/core/write-coordinator.ts`
- Test: `tests/core/write-coordinator.test.ts`

- [ ] **Step 1: Write failing Write Coordinator tests**

Create `tests/core/write-coordinator.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WriteCoordinator } from "../../src/core/write-coordinator";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-write-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("WriteCoordinator", () => {
  it("writes JSON atomically and reads fallback when missing", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "state.json");

    await expect(coordinator.readJson(filePath, { ok: false })).resolves.toEqual({ ok: false });
    await coordinator.atomicWriteJson(filePath, { ok: true });

    await expect(coordinator.readJson(filePath, { ok: false })).resolves.toEqual({ ok: true });
  });

  it("deduplicates JSONL appends by idempotency key", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "events", "session-1.jsonl");

    await coordinator.appendJsonLine(filePath, { id: "event-1", idempotencyKey: "same-key", value: 1 });
    await coordinator.appendJsonLine(filePath, { id: "event-2", idempotencyKey: "same-key", value: 2 });

    const lines = (await fs.readFile(filePath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ id: "event-1", value: 1 });
  });

  it("blocks a second active runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);

    await expect(coordinator.withRuntimeLock("outer", async () => {
      await expect(coordinator.withRuntimeLock("inner", async () => "nope")).rejects.toThrow("Runtime lock is active");
      return "done";
    })).resolves.toBe("done");
  });

  it("recovers a stale runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    await fs.writeFile(lockPath, JSON.stringify({
      owner: "old",
      operation: "stale",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:01:00.000Z",
    }));

    const result = await coordinator.withRuntimeLock("recovery", async (lock) => lock.recoveredStaleLock);
    await expect(fs.access(lockPath)).rejects.toThrow();
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing Write Coordinator tests**

Run:

```bash
npm test -- tests/core/write-coordinator.test.ts
```

Expected: FAIL because `src/core/write-coordinator.ts` does not exist.

- [ ] **Step 3: Create the Write Coordinator**

Create `src/core/write-coordinator.ts`:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getRuntimeLockPath } from "./paths";

interface RuntimeLockFile {
  owner: string;
  operation: string;
  createdAt: string;
  expiresAt: string;
}

export interface RuntimeLockContext {
  operation: string;
  recoveredStaleLock: boolean;
}

export class WriteCoordinator {
  constructor(private readonly repoPath: string) {}

  async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async atomicWriteJson(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    const handle = await fs.open(tempPath, "w");
    try {
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(tempPath, filePath);
  }

  async appendJsonLine(filePath: string, value: Record<string, unknown>): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const key = typeof value.idempotencyKey === "string" ? value.idempotencyKey : undefined;
    if (key && await this.hasJsonLineWithKey(filePath, key)) return;
    await fs.appendFile(filePath, `${JSON.stringify(value)}\n`);
  }

  async withRuntimeLock<T>(operation: string, fn: (context: RuntimeLockContext) => Promise<T>): Promise<T> {
    const lockPath = getRuntimeLockPath(this.repoPath);
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    const recoveredStaleLock = await this.recoverStaleLockIfNeeded(lockPath);
    const lock: RuntimeLockFile = {
      owner: `${process.pid}:${randomUUID()}`,
      operation,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
    };

    try {
      await fs.writeFile(lockPath, JSON.stringify(lock, null, 2), { flag: "wx" });
    } catch {
      throw new Error("Runtime lock is active");
    }

    try {
      return await fn({ operation, recoveredStaleLock });
    } finally {
      await this.removeLockIfOwned(lockPath, lock.owner);
    }
  }

  private async hasJsonLineWithKey(filePath: string, key: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .some((line) => {
          try {
            const parsed = JSON.parse(line) as { idempotencyKey?: unknown };
            return parsed.idempotencyKey === key;
          } catch {
            return false;
          }
        });
    } catch {
      return false;
    }
  }

  private async recoverStaleLockIfNeeded(lockPath: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(lockPath, "utf8");
      const lock = JSON.parse(raw) as RuntimeLockFile;
      if (Date.parse(lock.expiresAt) > Date.now()) return false;
      await fs.unlink(lockPath);
      return true;
    } catch {
      return false;
    }
  }

  private async removeLockIfOwned(lockPath: string, owner: string): Promise<void> {
    try {
      const raw = await fs.readFile(lockPath, "utf8");
      const lock = JSON.parse(raw) as RuntimeLockFile;
      if (lock.owner === owner) await fs.unlink(lockPath);
    } catch {
      return;
    }
  }
}
```

- [ ] **Step 4: Run the Write Coordinator tests**

Run:

```bash
npm test -- tests/core/write-coordinator.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/write-coordinator.ts tests/core/write-coordinator.test.ts
git commit -m "feat: coordinate along runtime writes"
```

## Task 3: Runtime Profile And Permission Envelope

**Files:**
- Create: `src/core/runtime-profile.ts`
- Modify: `src/core/memory-store.ts`
- Test: `tests/core/runtime-profile.test.ts`
- Test: `tests/core/memory-store.test.ts`

- [ ] **Step 1: Write failing Runtime Profile tests**

Create `tests/core/runtime-profile.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRuntimeProfile, derivePermissionEnvelope } from "../../src/core/runtime-profile";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-profile-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("runtime profile", () => {
  it("uses conservative defaults when settings are missing", async () => {
    const repo = await makeRepo();
    const profile = await loadRuntimeProfile(repo);
    expect(profile.memoryMode).toBe("project_reviewed");
    expect(profile.autonomyLevel).toBe("quiet");
    expect(profile.accountabilityLevel).toBe("off");
  });

  it("merges settings without accepting unknown authority", async () => {
    const repo = await makeRepo();
    await fs.mkdir(path.join(repo, ".along"), { recursive: true });
    await fs.writeFile(path.join(repo, ".along", "settings.json"), JSON.stringify({
      runtimeMode: "debug",
      accountabilityLevel: "strict",
      autonomyLevel: "proactive",
      featureFlags: { doctor: true },
    }));

    const profile = await loadRuntimeProfile(repo);
    const permissions = derivePermissionEnvelope(profile);

    expect(profile.runtimeMode).toBe("debug");
    expect(profile.accountabilityLevel).toBe("strict");
    expect(profile.autonomyLevel).toBe("proactive");
    expect(permissions.canShowStatus).toBe(true);
    expect(permissions.canProactivelyMessage).toBe(false);
    expect(permissions.canModifyProjectFiles).toBe(false);
    expect(permissions.requiresReview.globalMemory).toBe(true);
  });
});
```

Append this test to `tests/core/memory-store.test.ts`:

```ts
it("initializes runtime settings with conservative defaults", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-memory-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);

  const store = new MemoryStore(repo, home);
  await store.ensureInitialized();

  const settings = JSON.parse(await fs.readFile(path.join(repo, ".along", "settings.json"), "utf8"));
  expect(settings.memoryMode).toBe("project_reviewed");
  expect(settings.canModifyProjectFiles).toBeUndefined();
});
```

- [ ] **Step 2: Run the failing profile tests**

Run:

```bash
npm test -- tests/core/runtime-profile.test.ts tests/core/memory-store.test.ts
```

Expected: FAIL because `runtime-profile.ts` does not exist and `settings.json` is not initialized.

- [ ] **Step 3: Create runtime profile loading and permission derivation**

Create `src/core/runtime-profile.ts`:

```ts
import type { PermissionEnvelope, RuntimeProfile } from "./types";
import { defaultPermissionEnvelope, defaultRuntimeProfile } from "./types";
import { getRuntimeSettingsPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export async function loadRuntimeProfile(repoPath: string): Promise<RuntimeProfile> {
  const coordinator = new WriteCoordinator(repoPath);
  const raw = await coordinator.readJson<Partial<RuntimeProfile>>(getRuntimeSettingsPath(repoPath), {});
  return {
    ...defaultRuntimeProfile,
    ...raw,
    featureFlags: {
      ...defaultRuntimeProfile.featureFlags,
      ...(raw.featureFlags ?? {}),
    },
  };
}

export function derivePermissionEnvelope(profile: RuntimeProfile): PermissionEnvelope {
  return {
    ...defaultPermissionEnvelope,
    canReadProject: profile.memoryMode !== "off",
    canReadAlongMemory: profile.memoryMode !== "off",
    canWriteSession: true,
    canWriteJournal: profile.memoryMode !== "off",
    canCreateMemoryCandidate: profile.memoryMode === "project_reviewed" || profile.memoryMode === "project_auto" || profile.memoryMode === "global_reviewed",
    canPromoteMemory: false,
    canUpdateGraph: profile.memoryMode !== "off",
    canShowStatus: true,
    canAskUser: true,
    canProactivelyMessage: false,
    canCallTools: false,
    canModifyProjectFiles: false,
    requiresReview: {
      memoryPromotion: profile.memoryMode !== "off",
      globalMemory: true,
      proceduralMemory: true,
      proactiveMessage: profile.autonomyLevel !== "quiet",
      projectFileWrite: true,
    },
  };
}
```

- [ ] **Step 4: Initialize settings in MemoryStore**

In `src/core/memory-store.ts`, add this import:

```ts
import { defaultRuntimeProfile } from "./types";
```

Inside `ensureInitialized()`, after creating `.along/sessions`, add directory creation for runtime folders:

```ts
      fs.mkdir(path.join(this.projectDir, "events"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "context"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "review"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "traces"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "locks"), { recursive: true }),
```

After the existing `writeIfMissing` calls for project memory files, add:

```ts
    await this.writeIfMissing(path.join(this.projectDir, "settings.json"), `${JSON.stringify(defaultRuntimeProfile, null, 2)}\n`);
    await this.writeIfMissing(path.join(this.projectDir, "state.json"), `${JSON.stringify({
      schemaVersion: 1,
      runtimeVersion: "control-plane-v1",
      lastActiveSessionId: undefined,
      lastOpenedAt: undefined,
      health: "writable",
      effectiveProfile: defaultRuntimeProfile,
    }, null, 2)}\n`);
    await this.writeIfMissing(path.join(this.projectDir, "sessions", "index.json"), "[]\n");
```

- [ ] **Step 5: Run the profile tests**

Run:

```bash
npm test -- tests/core/runtime-profile.test.ts tests/core/memory-store.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/runtime-profile.ts src/core/memory-store.ts tests/core/runtime-profile.test.ts tests/core/memory-store.test.ts
git commit -m "feat: derive runtime profile permissions"
```

## Task 4: Event Store And Trace Store

**Files:**
- Create: `src/core/event-store.ts`
- Create: `src/core/trace-store.ts`
- Test: `tests/core/event-store.test.ts`

- [ ] **Step 1: Write failing event and trace tests**

Create `tests/core/event-store.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EventStore } from "../../src/core/event-store";
import { TraceStore } from "../../src/core/trace-store";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-events-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("EventStore", () => {
  it("records schema-versioned runtime events", async () => {
    const repo = await makeRepo();
    const store = new EventStore(repo);
    const event = await store.recordEvent({
      sessionId: "session-1",
      source: "runtime",
      kind: "session_recovered",
      visibility: "internal",
      scope: "session",
      payload: { reason: "api_restart" },
      provenance: { route: "GET /api/session/current" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: "recover-session-1",
    });

    expect(event.schemaVersion).toBe(1);
    expect(event.kind).toBe("session_recovered");
    expect(event.receivedAt).toBeTruthy();
    expect(await store.readEvents("session-1")).toHaveLength(1);
  });

  it("deduplicates events by idempotency key", async () => {
    const repo = await makeRepo();
    const store = new EventStore(repo);
    const input = {
      sessionId: "session-1",
      source: "user" as const,
      kind: "user_refusal" as const,
      visibility: "reviewable" as const,
      scope: "session" as const,
      payload: { refused: "global memory" },
      provenance: {},
      memoryEligibility: "session_only" as const,
      riskLevel: "low" as const,
      idempotencyKey: "refusal-1",
    };

    await store.recordEvent(input);
    await store.recordEvent(input);

    expect(await store.readEvents("session-1")).toHaveLength(1);
  });
});

describe("TraceStore", () => {
  it("records trace entries for runtime decisions", async () => {
    const repo = await makeRepo();
    const store = new TraceStore(repo);
    await store.recordTrace({
      sessionId: "session-1",
      operation: "recoverCurrentSession",
      inputs: ["current.json", "sessions/session-1.json"],
      decision: "restore",
      reason: "current pointer is valid",
      relatedEventIds: ["event-1"],
      outcome: "recovered",
    });

    const traces = await store.readTraces("session-1");
    expect(traces[0]).toMatchObject({
      operation: "recoverCurrentSession",
      decision: "restore",
      outcome: "recovered",
    });
  });
});
```

- [ ] **Step 2: Run the failing event tests**

Run:

```bash
npm test -- tests/core/event-store.test.ts
```

Expected: FAIL because `event-store.ts` and `trace-store.ts` do not exist.

- [ ] **Step 3: Create EventStore**

Create `src/core/event-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { AlongEvent, AlongEventKind, AlongEventSource } from "./types";
import { getEventsFilePath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export interface EventInput {
  sessionId: string;
  source: AlongEventSource;
  kind: AlongEventKind;
  visibility: AlongEvent["visibility"];
  scope: AlongEvent["scope"];
  payload: Record<string, unknown>;
  provenance: AlongEvent["provenance"];
  memoryEligibility: AlongEvent["memoryEligibility"];
  riskLevel: AlongEvent["riskLevel"];
  occurredAt?: string;
  idempotencyKey?: string;
}

export class EventStore {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async recordEvent(input: EventInput): Promise<AlongEvent> {
    const now = new Date().toISOString();
    const event: AlongEvent = {
      id: `event-${randomUUID()}`,
      schemaVersion: 1,
      occurredAt: input.occurredAt ?? now,
      receivedAt: now,
      sessionId: input.sessionId,
      source: input.source,
      kind: input.kind,
      visibility: input.visibility,
      scope: input.scope,
      payload: input.payload,
      provenance: input.provenance,
      memoryEligibility: input.memoryEligibility,
      riskLevel: input.riskLevel,
      idempotencyKey: input.idempotencyKey,
    };
    await this.coordinator.appendJsonLine(getEventsFilePath(this.repoPath, input.sessionId), event);
    const events = await this.readEvents(input.sessionId);
    return events.find((item) => item.idempotencyKey && item.idempotencyKey === input.idempotencyKey) ?? event;
  }

  async readEvents(sessionId: string): Promise<AlongEvent[]> {
    const filePath = getEventsFilePath(this.repoPath, sessionId);
    try {
      const raw = await import("node:fs/promises").then((fs) => fs.readFile(filePath, "utf8"));
      return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line) as AlongEvent);
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 4: Create TraceStore**

Create `src/core/trace-store.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { TraceEntry } from "./types";
import { getTraceFilePath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export type TraceInput = Omit<TraceEntry, "id" | "at">;

export class TraceStore {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async recordTrace(input: TraceInput): Promise<TraceEntry> {
    const trace: TraceEntry = {
      id: `trace-${randomUUID()}`,
      at: new Date().toISOString(),
      ...input,
    };
    const sessionId = input.sessionId ?? "runtime";
    await this.coordinator.appendJsonLine(getTraceFilePath(this.repoPath, sessionId), trace);
    return trace;
  }

  async readTraces(sessionId: string): Promise<TraceEntry[]> {
    try {
      const raw = await import("node:fs/promises").then((fs) => fs.readFile(getTraceFilePath(this.repoPath, sessionId), "utf8"));
      return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line) as TraceEntry);
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 5: Run the event tests**

Run:

```bash
npm test -- tests/core/event-store.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/event-store.ts src/core/trace-store.ts tests/core/event-store.test.ts
git commit -m "feat: record runtime events and traces"
```

## Task 5: Review Gate

**Files:**
- Create: `src/core/review-gate.ts`
- Test: `tests/core/review-gate.test.ts`

- [ ] **Step 1: Write failing Review Gate tests**

Create `tests/core/review-gate.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ReviewGate } from "../../src/core/review-gate";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-review-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("ReviewGate", () => {
  it("stores global and procedural candidates as pending review items", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    await gate.addReviewItem({
      kind: "global_memory_candidate",
      sessionId: "session-1",
      proposedChange: "Remember this across projects.",
      sourceRefs: ["event-1"],
      reason: "User stated a durable preference.",
      riskLevel: "medium",
      defaultAction: "ask",
    });
    await gate.addReviewItem({
      kind: "procedural_memory_candidate",
      sessionId: "session-1",
      proposedChange: "Use a new review procedure.",
      sourceRefs: ["event-2"],
      reason: "The session produced a reusable workflow.",
      riskLevel: "medium",
      defaultAction: "keep_as_candidate",
    });

    const inbox = await gate.readInbox();
    expect(inbox).toHaveLength(2);
    expect(inbox.every((item) => item.status === "pending")).toBe(true);
  });

  it("records rejection so the same candidate can be suppressed", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const item = await gate.addReviewItem({
      kind: "memory_candidate",
      sessionId: "session-1",
      proposedChange: "Remember a rejected fact.",
      sourceRefs: ["event-1"],
      reason: "Candidate came from wrap-up.",
      riskLevel: "low",
      defaultAction: "keep_as_candidate",
    });

    await gate.reject(item.id);
    const inbox = await gate.readInbox();
    expect(inbox.find((entry) => entry.id === item.id)?.status).toBe("rejected");
    expect(await gate.hasRejectedProposal("Remember a rejected fact.")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing Review Gate tests**

Run:

```bash
npm test -- tests/core/review-gate.test.ts
```

Expected: FAIL because `review-gate.ts` does not exist.

- [ ] **Step 3: Create ReviewGate**

Create `src/core/review-gate.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { ReviewItem, ReviewItemKind } from "./types";
import { getReviewInboxPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

interface ReviewItemInput {
  kind: ReviewItemKind;
  sessionId: string;
  proposedChange: string;
  sourceRefs: string[];
  reason: string;
  riskLevel: ReviewItem["riskLevel"];
  defaultAction: ReviewItem["defaultAction"];
}

export class ReviewGate {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async readInbox(): Promise<ReviewItem[]> {
    return await this.coordinator.readJson<ReviewItem[]>(getReviewInboxPath(this.repoPath), []);
  }

  async addReviewItem(input: ReviewItemInput): Promise<ReviewItem> {
    const inbox = await this.readInbox();
    const existing = inbox.find((item) => item.proposedChange === input.proposedChange && item.kind === input.kind);
    if (existing) return existing;
    const item: ReviewItem = {
      id: `review-${randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      ...input,
    };
    await this.coordinator.atomicWriteJson(getReviewInboxPath(this.repoPath), [...inbox, item]);
    return item;
  }

  async accept(id: string): Promise<ReviewItem> {
    return await this.updateStatus(id, "accepted");
  }

  async reject(id: string): Promise<ReviewItem> {
    return await this.updateStatus(id, "rejected");
  }

  async edit(id: string, proposedChange: string): Promise<ReviewItem> {
    const inbox = await this.readInbox();
    const next = inbox.map((item) => item.id === id ? { ...item, proposedChange, status: "edited" as const } : item);
    await this.coordinator.atomicWriteJson(getReviewInboxPath(this.repoPath), next);
    const updated = next.find((item) => item.id === id);
    if (!updated) throw new Error(`Review item not found: ${id}`);
    return updated;
  }

  async hasRejectedProposal(proposedChange: string): Promise<boolean> {
    return (await this.readInbox()).some((item) => item.proposedChange === proposedChange && item.status === "rejected");
  }

  private async updateStatus(id: string, status: ReviewItem["status"]): Promise<ReviewItem> {
    const inbox = await this.readInbox();
    const next = inbox.map((item) => item.id === id ? { ...item, status } : item);
    await this.coordinator.atomicWriteJson(getReviewInboxPath(this.repoPath), next);
    const updated = next.find((item) => item.id === id);
    if (!updated) throw new Error(`Review item not found: ${id}`);
    return updated;
  }
}
```

- [ ] **Step 4: Run the Review Gate tests**

Run:

```bash
npm test -- tests/core/review-gate.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/review-gate.ts tests/core/review-gate.test.ts
git commit -m "feat: add runtime review gate"
```

## Task 6: Context Engine

**Files:**
- Create: `src/core/context-engine.ts`
- Test: `tests/core/context-engine.test.ts`

- [ ] **Step 1: Write failing Context Engine tests**

Create `tests/core/context-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildContextPacket } from "../../src/core/context-engine";
import { defaultPermissionEnvelope, defaultRuntimeProfile, type AlongEvent, type AlongSession } from "../../src/core/types";

const session: AlongSession = {
  id: "session-1",
  repoPath: "/tmp/demo",
  startedAt: "2026-06-01T00:00:00.000Z",
  state: "arriving",
  context: {
    repoPath: "/tmp/demo",
    repoName: "demo",
    gitStatus: "clean",
    recentCommits: [],
    manifests: [],
    directorySummary: ["src/"],
    testHints: ["npm test"],
  },
  plan: {
    state: "arriving",
    sessionId: "session-1",
    learningGoal: "understand demo",
    currentActivity: "quietly reading",
    shareLine: "I am reading the project shape.",
  },
};

function event(id: string, kind: AlongEvent["kind"], memoryEligibility: AlongEvent["memoryEligibility"]): AlongEvent {
  return {
    id,
    schemaVersion: 1,
    occurredAt: "2026-06-01T00:00:00.000Z",
    receivedAt: "2026-06-01T00:00:00.000Z",
    sessionId: "session-1",
    source: "user",
    kind,
    visibility: "reviewable",
    scope: "session",
    payload: { text: id },
    provenance: {},
    memoryEligibility,
    riskLevel: "low",
  };
}

describe("buildContextPacket", () => {
  it("builds sourced session_start context", () => {
    const packet = buildContextPacket({
      session,
      purpose: "session_start",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [event("event-1", "session_started", "never")],
      reviewedMemory: ["Project uses Vitest."],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.purpose).toBe("session_start");
    expect(packet.sections.find((section) => section.kind === "current_session")?.items[0].sourceRef).toBe("session:session-1");
    expect(packet.sections.find((section) => section.kind === "permission_envelope")).toBeTruthy();
  });

  it("omits unreviewed candidates from ordinary user response context", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [event("event-2", "user_preference", "review_required")],
      reviewedMemory: [],
      memoryCandidates: ["Unreviewed candidate"],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Unreviewed candidate")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "memory_candidate:0", reason: "requires_review" });
  });
});
```

- [ ] **Step 2: Run the failing Context Engine tests**

Run:

```bash
npm test -- tests/core/context-engine.test.ts
```

Expected: FAIL because `context-engine.ts` does not exist.

- [ ] **Step 3: Create Context Engine**

Create `src/core/context-engine.ts`:

```ts
import { randomUUID } from "node:crypto";
import type { AlongEvent, AlongSession, ContextPacket, ContextPurpose, PermissionEnvelope, RuntimeProfile } from "./types";

interface ContextInput {
  session: AlongSession;
  purpose: ContextPurpose;
  profile: RuntimeProfile;
  permissionEnvelope: PermissionEnvelope;
  recentEvents: AlongEvent[];
  reviewedMemory: string[];
  memoryCandidates: string[];
  maxItems: number;
  maxApproxTokens: number;
}

export function buildContextPacket(input: ContextInput): ContextPacket {
  const sections: ContextPacket["sections"] = [];
  const omissions: ContextPacket["omissions"] = [];

  sections.push({
    kind: "current_session",
    items: [{
      id: `context-item-${randomUUID()}`,
      content: `${input.session.context.repoName}: ${input.session.plan.learningGoal}`,
      sourceRef: `session:${input.session.id}`,
      includedBecause: `${input.purpose} needs the active session identity and learning goal.`,
      confidence: "high",
      scope: "session",
      riskLevel: "low",
    }],
  });

  sections.push({
    kind: "runtime_profile",
    items: [{
      id: `context-item-${randomUUID()}`,
      content: JSON.stringify(input.profile),
      sourceRef: ".along/settings.json",
      includedBecause: "Runtime behavior must reflect the effective profile.",
      confidence: "high",
      scope: "project",
      riskLevel: "low",
    }],
  });

  sections.push({
    kind: "permission_envelope",
    items: [{
      id: `context-item-${randomUUID()}`,
      content: JSON.stringify(input.permissionEnvelope),
      sourceRef: "derived:permission_envelope",
      includedBecause: "Every runtime operation must obey permissions.",
      confidence: "high",
      scope: "session",
      riskLevel: "low",
    }],
  });

  if (input.recentEvents.length > 0) {
    sections.push({
      kind: "recent_events",
      items: input.recentEvents.slice(-5).map((event) => ({
        id: `context-item-${randomUUID()}`,
        content: `${event.kind}: ${JSON.stringify(event.payload)}`,
        sourceRef: `event:${event.id}`,
        includedBecause: `${input.purpose} uses recent explicit runtime events.`,
        confidence: "high",
        scope: event.scope === "global_candidate" ? "global" : event.scope,
        riskLevel: event.riskLevel,
      })),
    });
  }

  if (input.permissionEnvelope.canReadAlongMemory && input.reviewedMemory.length > 0) {
    sections.push({
      kind: "reviewed_memory",
      items: input.reviewedMemory.slice(0, 3).map((memory, index) => ({
        id: `context-item-${randomUUID()}`,
        content: memory,
        sourceRef: `reviewed_memory:${index}`,
        includedBecause: "Reviewed memory may influence ordinary Along behavior.",
        confidence: "medium",
        scope: "project",
        riskLevel: "low",
      })),
    });
  }

  for (const [_index, _candidate] of input.memoryCandidates.entries()) {
    const index = _index;
    const candidate = _candidate;
    if (input.purpose === "memory_consolidation" || input.purpose === "debug_inspection") {
      sections.push({
        kind: "memory_candidate",
        items: [{
          id: `context-item-${randomUUID()}`,
          content: candidate,
          sourceRef: `memory_candidate:${index}`,
          includedBecause: `${input.purpose} is allowed to inspect memory candidates.`,
          confidence: "low",
          scope: "project",
          riskLevel: "medium",
        }],
      });
    } else {
      omissions.push({ sourceRef: `memory_candidate:${index}`, reason: "requires_review" });
    }
  }

  return {
    id: `context-${randomUUID()}`,
    createdAt: new Date().toISOString(),
    sessionId: input.session.id,
    purpose: input.purpose,
    budget: {
      maxItems: input.maxItems,
      maxApproxTokens: input.maxApproxTokens,
    },
    sections: sections.slice(0, input.maxItems),
    omissions,
  };
}
```

- [ ] **Step 4: Run the Context Engine tests**

Run:

```bash
npm test -- tests/core/context-engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/context-engine.ts tests/core/context-engine.test.ts
git commit -m "feat: build runtime context packets"
```

## Task 7: Durable Session Lifecycle

**Files:**
- Create: `src/core/session-lifecycle.ts`
- Test: `tests/core/session-lifecycle.test.ts`

- [ ] **Step 1: Write failing session lifecycle tests**

Create `tests/core/session-lifecycle.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SessionLifecycle } from "../../src/core/session-lifecycle";
import type { AlongSession } from "../../src/core/types";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-lifecycle-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
  return repo;
}

function session(repo: string, id = "session-1"): AlongSession {
  return {
    id,
    repoPath: repo,
    startedAt: "2026-06-01T00:00:00.000Z",
    state: "arriving",
    context: {
      repoPath: repo,
      repoName: "repo",
      gitStatus: "clean",
      recentCommits: [],
      manifests: [],
      directorySummary: ["src/"],
      testHints: ["npm test"],
    },
    plan: {
      state: "arriving",
      sessionId: id,
      learningGoal: "understand repo",
      currentActivity: "quietly reading",
    },
  };
}

describe("SessionLifecycle", () => {
  it("persists and recovers a current session", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    expect(recovered.session?.id).toBe("session-1");
    expect(recovered.lifecycleState).toBe("recovered");
    expect(recovered.reason).toBe("current session recovered");
  });

  it("does not silently recover a wrapped session as active", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await lifecycle.markWrapped("session-1");

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    expect(recovered.session?.id).toBe("session-1");
    expect(recovered.lifecycleState).toBe("wrapped");
    expect(recovered.reason).toBe("current session is wrapped");
  });

  it("updates session index without duplicating same session id", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await lifecycle.startSession(session(repo));

    const index = await lifecycle.readIndex();
    expect(index.filter((item) => item.sessionId === "session-1")).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the failing session lifecycle tests**

Run:

```bash
npm test -- tests/core/session-lifecycle.test.ts
```

Expected: FAIL because `session-lifecycle.ts` does not exist.

- [ ] **Step 3: Create SessionLifecycle**

Create `src/core/session-lifecycle.ts`:

```ts
import type { AlongSession, SessionLifecycleState } from "./types";
import { getCurrentSessionPath, getSessionFilePath, getSessionIndexPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export interface CurrentSessionPointer {
  sessionId: string;
  state: SessionLifecycleState;
  updatedAt: string;
  projectPath: string;
  recoveryHint: string;
}

export interface SessionIndexEntry {
  sessionId: string;
  state: SessionLifecycleState;
  startedAt: string;
  updatedAt: string;
  projectPath: string;
}

export interface SessionRecoveryResult {
  session?: AlongSession;
  lifecycleState: SessionLifecycleState | "none";
  reason: string;
}

export class SessionLifecycle {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async startSession(session: AlongSession): Promise<void> {
    await this.writeSessionState(session, "active", "session started");
  }

  async markPaused(sessionId: string): Promise<void> {
    const session = await this.readSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    await this.writeSessionState(session, "paused", "session paused");
  }

  async markWrapped(sessionId: string): Promise<void> {
    const session = await this.readSession(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    session.state = "wrap_up";
    session.plan.state = "wrap_up";
    await this.writeSessionState(session, "wrapped", "session wrapped");
  }

  async recoverCurrentSession(): Promise<SessionRecoveryResult> {
    const pointer = await this.coordinator.readJson<CurrentSessionPointer | null>(getCurrentSessionPath(this.repoPath), null);
    if (!pointer) return { lifecycleState: "none", reason: "no current session pointer" };
    if (pointer.projectPath !== this.repoPath) return { lifecycleState: "none", reason: "current pointer belongs to another project" };
    const session = await this.readSession(pointer.sessionId);
    if (!session) return { lifecycleState: "none", reason: "current session file missing" };
    if (pointer.state === "wrapped") return { session, lifecycleState: "wrapped", reason: "current session is wrapped" };
    const nextSession = { ...session, state: session.state === "wrap_up" ? "wrap_up" : "arriving" };
    await this.writePointer(pointer.sessionId, "recovered", "session recovered from disk");
    return { session: nextSession, lifecycleState: "recovered", reason: "current session recovered" };
  }

  async readIndex(): Promise<SessionIndexEntry[]> {
    return await this.coordinator.readJson<SessionIndexEntry[]>(getSessionIndexPath(this.repoPath), []);
  }

  private async readSession(sessionId: string): Promise<AlongSession | undefined> {
    return await this.coordinator.readJson<AlongSession | undefined>(getSessionFilePath(this.repoPath, sessionId), undefined);
  }

  private async writeSessionState(session: AlongSession, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    await this.coordinator.withRuntimeLock(`session:${state}`, async () => {
      await this.coordinator.atomicWriteJson(getSessionFilePath(this.repoPath, session.id), session);
      await this.writePointer(session.id, state, recoveryHint);
      await this.upsertIndex(session, state);
    });
  }

  private async writePointer(sessionId: string, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    const pointer: CurrentSessionPointer = {
      sessionId,
      state,
      updatedAt: new Date().toISOString(),
      projectPath: this.repoPath,
      recoveryHint,
    };
    await this.coordinator.atomicWriteJson(getCurrentSessionPath(this.repoPath), pointer);
  }

  private async upsertIndex(session: AlongSession, state: SessionLifecycleState): Promise<void> {
    const index = await this.readIndex();
    const next: SessionIndexEntry = {
      sessionId: session.id,
      state,
      startedAt: session.startedAt,
      updatedAt: new Date().toISOString(),
      projectPath: this.repoPath,
    };
    await this.coordinator.atomicWriteJson(getSessionIndexPath(this.repoPath), [
      next,
      ...index.filter((item) => item.sessionId !== session.id),
    ]);
  }
}
```

- [ ] **Step 4: Run the session lifecycle tests**

Run:

```bash
npm test -- tests/core/session-lifecycle.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/session-lifecycle.ts tests/core/session-lifecycle.test.ts
git commit -m "feat: persist runtime session lifecycle"
```

## Task 8: Runtime Integration

**Files:**
- Modify: `src/core/runtime.ts`
- Modify: `tests/core/runtime.test.ts`

- [ ] **Step 1: Add failing runtime integration tests**

Append these tests to `tests/core/runtime.test.ts`:

```ts
it("recovers the current session after runtime re-instantiation", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
  const started = await firstRuntime.start();
  const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
  const current = await secondRuntime.current();

  expect(current?.id).toBe(started.id);
});

it("writes runtime events and traces during start and wrap-up", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
  const session = await runtime.start();
  await runtime.wrapUp("I learned that runtime control matters.");

  const events = await fs.readFile(path.join(repo, ".along", "events", `${session.id}.jsonl`), "utf8");
  const traces = await fs.readFile(path.join(repo, ".along", "traces", `${session.id}.jsonl`), "utf8");

  expect(events).toContain("session_started");
  expect(events).toContain("session_wrapped");
  expect(traces).toContain("startSession");
  expect(traces).toContain("wrapUp");
});

it("keeps wrap-up idempotent for repeated requests", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
  await runtime.start();
  const first = await runtime.wrapUp("Remember this once.");
  const second = await runtime.wrapUp("Remember this once.");
  const journal = await fs.readFile(first.journalPath, "utf8");

  expect(second.journalPath).toBe(first.journalPath);
  expect(journal.match(/Remember this once\\./g)).toHaveLength(1);
});

it("pauses the current session through the lifecycle manager", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
  const session = await runtime.start();
  const paused = await runtime.pause();
  const currentPointer = JSON.parse(await fs.readFile(path.join(repo, ".along", "sessions", "current.json"), "utf8"));

  expect(paused).toEqual({ sessionId: session.id, lifecycleState: "paused" });
  expect(currentPointer.state).toBe("paused");
});
```

- [ ] **Step 2: Run the failing runtime integration tests**

Run:

```bash
npm test -- tests/core/runtime.test.ts
```

Expected: FAIL because `AlongRuntime.current()` does not recover from disk and runtime does not write events/traces.

- [ ] **Step 3: Wire control-plane modules into AlongRuntime**

In `src/core/runtime.ts`, add imports:

```ts
import { buildContextPacket } from "./context-engine";
import { EventStore } from "./event-store";
import { ReviewGate } from "./review-gate";
import { derivePermissionEnvelope, loadRuntimeProfile } from "./runtime-profile";
import { SessionLifecycle } from "./session-lifecycle";
import { TraceStore } from "./trace-store";
import { WriteCoordinator } from "./write-coordinator";
import { getContextPacketPath } from "./paths";
```

Add private fields to `AlongRuntime`:

```ts
  private readonly lifecycle: SessionLifecycle;
  private readonly events: EventStore;
  private readonly traces: TraceStore;
  private readonly reviewGate: ReviewGate;
  private readonly writes: WriteCoordinator;
  private wrappedResult?: WrapUpResult;
```

Initialize them in the constructor:

```ts
    this.lifecycle = new SessionLifecycle(options.repoPath);
    this.events = new EventStore(options.repoPath);
    this.traces = new TraceStore(options.repoPath);
    this.reviewGate = new ReviewGate(options.repoPath);
    this.writes = new WriteCoordinator(options.repoPath);
```

In `start()`, after `this.session = session;`, replace the direct session write with lifecycle and event/trace/context writes:

```ts
    const profile = await loadRuntimeProfile(this.options.repoPath);
    const permissionEnvelope = derivePermissionEnvelope(profile);
    await this.lifecycle.startSession(session);
    const startEvent = await this.events.recordEvent({
      sessionId,
      source: "runtime",
      kind: "session_started",
      visibility: "internal",
      scope: "session",
      payload: { repoPath: this.options.repoPath },
      provenance: { route: "POST /api/session/start" },
      memoryEligibility: "session_only",
      riskLevel: "low",
      idempotencyKey: `session_started:${sessionId}`,
    });
    const packet = buildContextPacket({
      session,
      purpose: "session_start",
      profile,
      permissionEnvelope,
      recentEvents: [startEvent],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });
    await this.writes.atomicWriteJson(getContextPacketPath(this.options.repoPath, packet.id), packet);
    await this.traces.recordTrace({
      sessionId,
      operation: "startSession",
      inputs: ["project context", "runtime profile", "permission envelope"],
      decision: "created active session",
      reason: "start requested and runtime state is writable",
      permissionSnapshot: JSON.stringify(permissionEnvelope),
      contextPacketId: packet.id,
      relatedEventIds: [startEvent.id],
      outcome: "allowed",
    });
```

Keep `await this.writeStartGraph(session, selected);` after the trace block.

- [ ] **Step 4: Make current session recover from disk**

Replace `current()` in `src/core/runtime.ts` with:

```ts
  async current(): Promise<AlongSession | undefined> {
    if (!this.session) {
      const recovered = await this.lifecycle.recoverCurrentSession();
      if (recovered.session && recovered.lifecycleState !== "wrapped") {
        this.session = recovered.session;
        await this.events.recordEvent({
          sessionId: recovered.session.id,
          source: "runtime",
          kind: "session_recovered",
          visibility: "internal",
          scope: "session",
          payload: { reason: recovered.reason },
          provenance: { route: "GET /api/session/current" },
          memoryEligibility: "session_only",
          riskLevel: "low",
          idempotencyKey: `session_recovered:${recovered.session.id}`,
        });
      } else {
        return recovered.session;
      }
    }
    await this.refreshPresenceState();
    return this.session;
  }
```

- [ ] **Step 5: Make wrap-up idempotent and traceable**

At the top of `wrapUp(note: string)`, after the existing session guard, add:

```ts
    if (this.wrappedResult) return this.wrappedResult;
```

After writing the journal and setting wrap-up state, replace `await this.memory.writeSession(this.session.id, this.session);` with:

```ts
    await this.lifecycle.markWrapped(this.session.id);
    const wrapEvent = await this.events.recordEvent({
      sessionId: this.session.id,
      source: "user",
      kind: "session_wrapped",
      visibility: "user_visible",
      scope: "session",
      payload: { note },
      provenance: { route: "POST /api/session/wrap-up" },
      memoryEligibility: "candidate",
      riskLevel: "low",
      idempotencyKey: `session_wrapped:${this.session.id}`,
    });
    await this.reviewGate.addReviewItem({
      kind: "memory_candidate",
      sessionId: this.session.id,
      proposedChange: note,
      sourceRefs: [`event:${wrapEvent.id}`],
      reason: "Wrap-up note can become reviewed project memory.",
      riskLevel: "low",
      defaultAction: "keep_as_candidate",
    });
    await this.traces.recordTrace({
      sessionId: this.session.id,
      operation: "wrapUp",
      inputs: ["wrap-up note", "journal entry", "review candidate"],
      decision: "marked session wrapped",
      reason: "user requested wrap-up",
      relatedEventIds: [wrapEvent.id],
      outcome: "allowed",
    });
```

Before returning from `wrapUp`, assign the result:

```ts
    this.wrappedResult = {
      journalPath,
      remembered: note,
      state: "wrap_up",
      journalPreview: this.previewJournal(entry),
    };
    return this.wrappedResult;
```

- [ ] **Step 6: Add runtime pause support**

Add this interface near `WrapUpResult` in `src/core/runtime.ts`:

```ts
export interface PauseResult {
  sessionId: string;
  lifecycleState: "paused";
}
```

Add this method to `AlongRuntime` after `current()`:

```ts
  async pause(): Promise<PauseResult> {
    const session = await this.current();
    if (!session) throw new Error("Cannot pause before starting a session.");
    await this.lifecycle.markPaused(session.id);
    const pauseEvent = await this.events.recordEvent({
      sessionId: session.id,
      source: "runtime",
      kind: "session_paused",
      visibility: "internal",
      scope: "session",
      payload: { reason: "pause requested" },
      provenance: { route: "POST /api/session/pause" },
      memoryEligibility: "session_only",
      riskLevel: "low",
      idempotencyKey: `session_paused:${session.id}`,
    });
    await this.traces.recordTrace({
      sessionId: session.id,
      operation: "pauseSession",
      inputs: ["current session"],
      decision: "marked session paused",
      reason: "pause requested",
      relatedEventIds: [pauseEvent.id],
      outcome: "allowed",
    });
    return { sessionId: session.id, lifecycleState: "paused" };
  }
```

- [ ] **Step 7: Make journal writing append session sections**

In `src/core/memory-store.ts`, replace `writeJournal(entry)` file writing so it appends a session section and avoids duplicate session ids:

```ts
    const section = [
      `## Session ${entry.sessionId}`,
      "",
      "### I Tried To Understand",
      entry.triedToUnderstand,
      "",
      "### I Looked At",
      ...entry.lookedAt.map((item) => `- ${item}`),
      "",
      "### I Now Believe",
      ...entry.nowBelieves.map((item) => `- ${item}`),
      "",
      "### I Am Still Unsure About",
      ...entry.stillUnsure.map((item) => `- ${item}`),
      "",
      "### Next Time",
      entry.nextTime,
      "",
      "### What I Noticed About Our Session",
      entry.noticedAboutSession,
      "",
    ].join("\n");
    let existing = "";
    try {
      existing = await fs.readFile(filePath, "utf8");
    } catch {
      existing = `# ${entry.date} Along Journal\n\n`;
    }
    if (existing.includes(`## Session ${entry.sessionId}`)) return filePath;
    await fs.writeFile(filePath, `${existing.trimEnd()}\n\n${section}`);
```

- [ ] **Step 8: Run runtime tests**

Run:

```bash
npm test -- tests/core/runtime.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/core/runtime.ts src/core/memory-store.ts tests/core/runtime.test.ts
git commit -m "feat: integrate runtime control plane"
```

## Task 9: Doctor And Server API

**Files:**
- Create: `src/core/doctor.ts`
- Modify: `src/server/app.ts`
- Modify: `tests/server/app.test.ts`
- Test: `tests/core/doctor.test.ts`

- [ ] **Step 1: Write failing Doctor tests**

Create `tests/core/doctor.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AlongRuntime } from "../../src/core/runtime";
import { getRuntimeDoctorReport } from "../../src/core/doctor";

describe("runtime Doctor", () => {
  it("reports lifecycle, profile, permissions, review items, and storage mode", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-doctor-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    await runtime.wrapUp("Doctor should see this candidate.");

    const report = await getRuntimeDoctorReport(repo);
    expect(report.lifecycleState).toBe("wrapped");
    expect(report.effectiveProfile.runtimeMode).toBe("companion");
    expect(report.permissionEnvelope.canModifyProjectFiles).toBe(false);
    expect(report.pendingReviewItems).toHaveLength(1);
    expect(report.storageMode).toBe("writable");
  });
});
```

- [ ] **Step 2: Add failing server API assertions**

Append this test to `tests/server/app.test.ts`:

```ts
it("exposes Doctor and review endpoints", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const app = createApp({ repoPath: repo, homeDir: home });
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address.");

  await fetch(`http://127.0.0.1:${address.port}/api/session/start`, { method: "POST" });
  const pause = await fetch(`http://127.0.0.1:${address.port}/api/session/pause`, { method: "POST" });
  const pauseBody = await pause.json() as { lifecycleState: string };
  await fetch(`http://127.0.0.1:${address.port}/api/session/wrap-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note: "Review me." }),
  });

  const doctor = await fetch(`http://127.0.0.1:${address.port}/api/runtime/doctor`);
  const doctorBody = await doctor.json() as { lifecycleState: string; permissionEnvelope: { canModifyProjectFiles: boolean } };
  const inbox = await fetch(`http://127.0.0.1:${address.port}/api/review/inbox`);
  const inboxBody = await inbox.json() as Array<{ id: string; status: string }>;
  const reject = await fetch(`http://127.0.0.1:${address.port}/api/review/${inboxBody[0].id}/reject`, { method: "POST" });
  const rejectBody = await reject.json() as { status: string };
  server.close();

  expect(doctorBody.lifecycleState).toBe("wrapped");
  expect(doctorBody.permissionEnvelope.canModifyProjectFiles).toBe(false);
  expect(pauseBody.lifecycleState).toBe("paused");
  expect(inboxBody).toHaveLength(1);
  expect(rejectBody.status).toBe("rejected");
});
```

- [ ] **Step 3: Run failing Doctor and server tests**

Run:

```bash
npm test -- tests/core/doctor.test.ts tests/server/app.test.ts
```

Expected: FAIL because Doctor and review endpoints do not exist.

- [ ] **Step 4: Create Doctor report builder**

Create `src/core/doctor.ts`:

```ts
import { buildContextPacket } from "./context-engine";
import { EventStore } from "./event-store";
import { getCurrentSessionPath } from "./paths";
import { ReviewGate } from "./review-gate";
import { derivePermissionEnvelope, loadRuntimeProfile } from "./runtime-profile";
import { SessionLifecycle } from "./session-lifecycle";
import { TraceStore } from "./trace-store";
import type { RuntimeDoctorReport } from "./types";
import { WriteCoordinator } from "./write-coordinator";

export async function getRuntimeDoctorReport(repoPath: string): Promise<RuntimeDoctorReport> {
  const coordinator = new WriteCoordinator(repoPath);
  const lifecycle = new SessionLifecycle(repoPath);
  const profile = await loadRuntimeProfile(repoPath);
  const permissionEnvelope = derivePermissionEnvelope(profile);
  const pointer = await coordinator.readJson<{ sessionId: string; state: RuntimeDoctorReport["lifecycleState"] } | null>(getCurrentSessionPath(repoPath), null);
  const recovered = await lifecycle.recoverCurrentSession();
  const session = recovered.session;
  const events = session ? await new EventStore(repoPath).readEvents(session.id) : [];
  const traces = session ? await new TraceStore(repoPath).readTraces(session.id) : [];
  const review = await new ReviewGate(repoPath).readInbox();
  const latestContextPacket = session ? buildContextPacket({
    session,
    purpose: "debug_inspection",
    profile,
    permissionEnvelope,
    recentEvents: events.slice(-5),
    reviewedMemory: [],
    memoryCandidates: review.filter((item) => item.status === "pending").map((item) => item.proposedChange),
    maxItems: 12,
    maxApproxTokens: 1500,
  }) : undefined;

  return {
    lifecycleState: pointer?.state ?? recovered.lifecycleState,
    effectiveProfile: profile,
    permissionEnvelope,
    currentPointerHealthy: Boolean(pointer && session),
    recentEvents: events.slice(-10),
    latestContextPacket,
    pendingReviewItems: review.filter((item) => item.status === "pending"),
    recentFailures: traces.filter((trace) => trace.outcome === "failed").slice(-5),
    storageMode: "writable",
  };
}
```

- [ ] **Step 5: Add server endpoints**

In `src/server/app.ts`, add imports:

```ts
import { getRuntimeDoctorReport } from "../core/doctor";
import { ReviewGate } from "../core/review-gate";
import { TraceStore } from "../core/trace-store";
```

Inside `createApp`, after `const runtime = new AlongRuntime(options);`, add:

```ts
  const reviewGate = new ReviewGate(options.repoPath);
  const traceStore = new TraceStore(options.repoPath);
```

Add these routes before the error handler:

```ts
  app.post("/api/session/pause", async (_req, res, next) => {
    try {
      res.json(await runtime.pause());
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/runtime/doctor", async (_req, res, next) => {
    try {
      res.json(await getRuntimeDoctorReport(options.repoPath));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/runtime/traces", async (req, res, next) => {
    try {
      const sessionId = z.string().min(1).parse(req.query.sessionId);
      res.json(await traceStore.readTraces(sessionId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/review/inbox", async (_req, res, next) => {
    try {
      res.json(await reviewGate.readInbox());
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/accept", async (req, res, next) => {
    try {
      res.json(await reviewGate.accept(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/reject", async (req, res, next) => {
    try {
      res.json(await reviewGate.reject(req.params.id));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/review/:id/edit", async (req, res, next) => {
    try {
      const parsed = z.object({ proposedChange: z.string().min(1) }).parse(req.body);
      res.json(await reviewGate.edit(req.params.id, parsed.proposedChange));
    } catch (error) {
      next(error);
    }
  });
```

- [ ] **Step 6: Run Doctor and server tests**

Run:

```bash
npm test -- tests/core/doctor.test.ts tests/server/app.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/doctor.ts src/server/app.ts tests/core/doctor.test.ts tests/server/app.test.ts
git commit -m "feat: expose runtime doctor and review api"
```

## Task 10: Frontend Compatibility And Final Verification

**Files:**
- Modify: `src/web/App.tsx`
- Test: `tests/server/app.test.ts`

- [ ] **Step 1: Add an API restart regression to the server tests**

Append this test to `tests/server/app.test.ts`:

```ts
it("recovers current session after creating a new app instance", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const firstApp = createApp({ repoPath: repo, homeDir: home });
  const firstServer = firstApp.listen(0);
  const firstAddress = firstServer.address();
  if (!firstAddress || typeof firstAddress === "string") throw new Error("Expected TCP address.");
  const start = await fetch(`http://127.0.0.1:${firstAddress.port}/api/session/start`, { method: "POST" });
  const started = await start.json() as { id: string };
  firstServer.close();

  const secondApp = createApp({ repoPath: repo, homeDir: home });
  const secondServer = secondApp.listen(0);
  const secondAddress = secondServer.address();
  if (!secondAddress || typeof secondAddress === "string") throw new Error("Expected TCP address.");
  const current = await fetch(`http://127.0.0.1:${secondAddress.port}/api/session/current`);
  const recovered = await current.json() as { id: string };
  secondServer.close();

  expect(recovered.id).toBe(started.id);
});
```

- [ ] **Step 2: Run the API restart regression**

Run:

```bash
npm test -- tests/server/app.test.ts
```

Expected: PASS after Task 8 server recovery integration. If it fails, inspect `AlongRuntime.current()` and `SessionLifecycle.recoverCurrentSession()` before touching the frontend.

- [ ] **Step 3: Keep frontend type compatibility**

In `src/web/App.tsx`, expand `SessionResponse` with optional lifecycle/debug fields so the UI tolerates future Doctor-enriched responses:

```ts
interface SessionResponse {
  id: string;
  state: string;
  lifecycleState?: string;
  recoveredReason?: string;
  context: {
    repoName: string;
    gitStatus: string;
    recentCommits: string[];
    directorySummary: string[];
    testHints: string[];
  };
  plan: {
    state: string;
    learningGoal: string;
    currentActivity: string;
    shareLine?: string;
  };
}
```

Keep the current `loadCurrentOrStart()` behavior unchanged:

```ts
async function loadCurrentOrStart(): Promise<SessionResponse | null> {
  const current = await readJson<SessionResponse | null>(`${apiBase}/api/session/current`);
  if (current) return current;
  return await readJson<SessionResponse>(`${apiBase}/api/session/start`, { method: "POST" });
}
```

- [ ] **Step 4: Run full automated verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected:

- `npm test`: all Vitest files pass.
- `npm run typecheck`: exits 0.
- `npm run build`: exits 0 and Vite build completes.

- [ ] **Step 5: Browser verification**

Start the servers:

```bash
npm run dev
npm run web
```

Open `http://127.0.0.1:5173/` in Browser and verify:

- page loads or starts a session;
- page refresh preserves current session;
- stopping and restarting the API preserves current session;
- presence rhythm still progresses;
- wrap-up shows feedback and journal path;
- second wrap-up click does not duplicate the same note in the same journal section;
- `GET http://127.0.0.1:4317/api/runtime/doctor` returns lifecycle, profile, permissionEnvelope, pendingReviewItems, and storageMode.

- [ ] **Step 6: Commit**

```bash
git add src/web/App.tsx tests/server/app.test.ts
git commit -m "test: verify runtime control plane integration"
```

## Final Verification Checklist

Run these commands at the end of the implementation branch:

```bash
npm test
npm run typecheck
npm run build
git status --short --branch
```

Expected:

- all tests pass;
- typecheck passes;
- build passes;
- git status shows only intentional changes or a clean tree;
- `.superpowers/` remains untracked unless the user explicitly asks to track it.

## Implementation Notes

- Do not introduce new dependencies.
- Do not add SQLite, vector retrieval, cloud sync, or a background daemon.
- Do not add project file modification permission.
- Do not make debug or research mode increase authority.
- Keep `project_auto` recognized but not active in first implementation.
- Use project-local `.along/` paths for runtime state.
- Keep generated `.along/` and `.superpowers/` out of user-facing project context.
- Use `superpowers:subagent-driven-development` if implementing by delegation. Keep each task's write scope narrow and review diffs between tasks.
