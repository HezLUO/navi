# Product Expression Tightening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework Along's first screen into Shared Desk First so the app expresses self-initiated companionship and read-only conductor behavior without expanding runtime authority.

**Architecture:** Keep runtime capabilities unchanged. Add a pure web view-model that derives Main Thread, Watch Threads, Quiet State, user override effects, and delegation display from the existing conductor snapshot. Render that model through a new Shared Desk component, then demote Project Intelligence and Delegation Live View into secondary surfaces.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, existing Express API and conductor snapshot types.

---

## Spec And Boundaries

Approved spec:

`docs/superpowers/specs/2026-06-12-product-expression-tightening-design.md`

Implementation must preserve these boundaries:

- no Memory v2;
- no Hermes adapter;
- no write delegation;
- no LLM-assisted attention judgment;
- no Living Desktop implementation;
- no Ambient Presence First primary UI;
- no project-write capability;
- no automatic commits, pushes, dependency installs, or destructive actions from Along runtime.

This plan changes product expression and local UI behavior only.

## File Structure

Create:

- `src/web/shared-desk-model.ts`
  - Pure functions and types for deriving Shared Desk state from `ConductorSnapshotResponse`-shaped data.
  - Owns thread ranking, quiet state, user override filtering, watch-thread slicing, and delegation matching.

- `src/web/SharedDesk.tsx`
  - Presentational React component for Your Side, Along's Side, Main Thread, Watch Threads, read-only delegation suggestion, and lightweight controls.
  - No API calls inside this component.

- `tests/web/shared-desk-model.test.ts`
  - Unit tests for Main Thread selection, Watch Thread limits, quiet state, delegation attachment, and user override behavior.

Modify:

- `src/web/App.tsx`
  - Wire `buildSharedDeskModel`.
  - Store client-side thread overrides.
  - Replace dashboard-first layout with Shared Desk first.
  - Keep Project Intelligence and Delegation Live View as secondary `<details>` surfaces.
  - Preserve wrap-up and sound behavior.

- `src/web/styles.css`
  - Add Shared Desk layout, Main Thread, Watch Thread, quiet state, delegation block, secondary surface, and mobile styles.
  - Keep responsive constraints so text does not overlap on mobile.

No core runtime or server files should be modified unless an implementation task discovers a compile-time mismatch that cannot be solved in the web layer. If that happens, stop and ask for review before expanding scope.

## Task 1: Shared Desk View Model

**Files:**
- Create: `src/web/shared-desk-model.ts`
- Create: `tests/web/shared-desk-model.test.ts`

- [ ] **Step 1: Write failing tests for thread ranking, quiet state, and overrides**

Create `tests/web/shared-desk-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSharedDeskModel, type ConductorSnapshotInput, type OpenThreadInput } from "../../src/web/shared-desk-model";

function thread(overrides: Partial<OpenThreadInput> = {}): OpenThreadInput {
  return {
    id: "thread-1",
    title: "Product feeling before capability expansion",
    status: "open",
    whyItMatters: "This decides whether Along becomes a generic agent competitor.",
    currentJudgment: "Tighten product expression before Hermes.",
    risks: [],
    evidence: [],
    ...overrides,
  };
}

function snapshot(overrides: Partial<ConductorSnapshotInput> = {}): ConductorSnapshotInput {
  return {
    threads: [
      thread({ id: "main", title: "Main candidate", status: "needs_user" }),
      thread({ id: "watch-1", title: "Watch self-initiation", status: "delegated" }),
      thread({ id: "watch-2", title: "Watch companionship", status: "open" }),
      thread({ id: "extra", title: "Extra thread", status: "open" }),
    ],
    attention: [
      { threadId: "main", action: "intervention", score: 11, reasons: ["changed judgment"] },
      { threadId: "watch-1", action: "read_only_delegation", score: 8, reasons: ["evidence gap"] },
      { threadId: "watch-2", action: "thread_update", score: 4, reasons: ["watching nearby concern"] },
      { threadId: "extra", action: "thread_update", score: 3, reasons: ["lower signal"] },
    ],
    delegations: [
      {
        id: "delegation-1",
        threadId: "main",
        target: "codex",
        status: "requested",
        reason: "Read-only review can reduce uncertainty.",
        scope: [".along", "docs", "src", "tests"],
        forbiddenActions: [
          "Do not modify files.",
          "Do not create commits.",
          "Do not push branches.",
        ],
      },
    ],
    preferences: { delegationModeLabel: "read_only_auto", projectWritePermission: false },
    ...overrides,
  };
}

describe("buildSharedDeskModel", () => {
  it("selects one main thread and at most two watch threads", () => {
    const model = buildSharedDeskModel({ conductor: snapshot() });

    expect(model.mode).toBe("active");
    expect(model.mainThread?.id).toBe("main");
    expect(model.watchThreads.map((item) => item.id)).toEqual(["watch-1", "watch-2"]);
    expect(model.watchThreads).toHaveLength(2);
  });

  it("attaches the matching read-only delegation to the main thread", () => {
    const model = buildSharedDeskModel({ conductor: snapshot() });

    expect(model.mainThread?.delegation?.target).toBe("codex");
    expect(model.mainThread?.delegation?.status).toBe("requested");
    expect(model.mainThread?.delegation?.forbiddenActions).toContain("Do not modify files.");
  });

  it("returns quiet state when no thread has enough signal", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot({
        threads: [thread({ id: "quiet", status: "open", evidence: [], risks: [] })],
        attention: [{ threadId: "quiet", action: "silent", score: 0, reasons: [] }],
        delegations: [],
      }),
    });

    expect(model.mode).toBe("quiet");
    expect(model.mainThread).toBeUndefined();
    expect(model.watchThreads).toEqual([]);
    expect(model.quietMessage).toContain("no thread worth interrupting");
  });

  it("lets a user force a watch thread to become main", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot(),
      overrides: { forcedMainThreadId: "watch-1", hiddenThreadIds: [], notNowThreadIds: [] },
    });

    expect(model.mainThread?.id).toBe("watch-1");
    expect(model.mainThread?.selectionReason).toContain("You asked Along to focus here");
    expect(model.watchThreads.map((item) => item.id)).toEqual(["main", "watch-2"]);
  });

  it("hides and suppresses user-dismissed threads", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot(),
      overrides: {
        forcedMainThreadId: undefined,
        hiddenThreadIds: ["main"],
        notNowThreadIds: ["watch-1"],
      },
    });

    expect(model.mainThread?.id).toBe("watch-2");
    expect(model.visibleThreads.map((item) => item.id)).not.toContain("main");
    expect(model.visibleThreads.map((item) => item.id)).not.toContain("watch-1");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- tests/web/shared-desk-model.test.ts
```

Expected: FAIL because `src/web/shared-desk-model.ts` does not exist.

- [ ] **Step 3: Implement the pure view model**

Create `src/web/shared-desk-model.ts`:

```ts
export interface OpenThreadInput {
  id: string;
  title: string;
  status: string;
  whyItMatters: string;
  currentJudgment: string;
  risks: Array<{ id: string; summary: string; severity: string }>;
  evidence: Array<{ id: string; summary: string; strength: string }>;
}

export interface AttentionInput {
  threadId: string;
  action: string;
  score: number;
  reasons: string[];
}

export interface DelegationInput {
  id: string;
  threadId: string;
  target: string;
  status: string;
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
  status: string;
  currentJudgment: string;
  whyItMatters: string;
  selectionReason: string;
  attentionAction: string;
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

interface BuildInput {
  conductor: ConductorSnapshotInput | null;
  overrides?: SharedDeskOverrides;
}

const actionRank: Record<string, number> = {
  intervention: 70,
  digest: 60,
  read_only_delegation: 50,
  thread_update: 30,
  silent: 0,
};

const statusRank: Record<string, number> = {
  needs_user: 45,
  delegated: 35,
  watching: 20,
  open: 10,
  resolved: -100,
  archived: -100,
};

const defaultQuietMessage = "I'm here. I do not see a thread worth interrupting you for right now.";

export function buildSharedDeskModel(input: BuildInput): SharedDeskModel {
  if (!input.conductor) return quietModel();

  const overrides = input.overrides ?? { hiddenThreadIds: [], notNowThreadIds: [] };
  const attentionByThread = new Map(input.conductor.attention.map((item) => [item.threadId, item]));
  const delegationByThread = new Map(input.conductor.delegations.map((item) => [item.threadId, item]));
  const hidden = new Set(overrides.hiddenThreadIds);
  const suppressed = new Set(overrides.notNowThreadIds);

  const candidates = input.conductor.threads
    .filter((thread) => !hidden.has(thread.id) && !suppressed.has(thread.id))
    .map((thread) => toSharedThread(thread, attentionByThread.get(thread.id), delegationByThread.get(thread.id)))
    .sort((a, b) => rankThread(b) - rankThread(a));

  if (candidates.length === 0) return quietModel();

  const forcedMain = overrides.forcedMainThreadId
    ? candidates.find((thread) => thread.id === overrides.forcedMainThreadId)
    : undefined;

  const mainThread = forcedMain
    ? { ...forcedMain, selectionReason: "You asked Along to focus here." }
    : candidates.find(isStrongEnoughForMain);

  if (!mainThread) return quietModel(candidates.slice(0, 2));

  const watchThreads = candidates
    .filter((thread) => thread.id !== mainThread.id)
    .filter(isStrongEnoughForWatch)
    .slice(0, 2);

  return {
    mode: "active",
    mainThread,
    watchThreads,
    visibleThreads: [mainThread, ...watchThreads],
    quietMessage: "",
  };
}

function toSharedThread(
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
    selectionReason: selectionReasonFor(thread, attention),
    attentionAction: attention?.action ?? "unscored",
    attentionScore: attention?.score ?? 0,
    delegation,
  };
}

function selectionReasonFor(thread: OpenThreadInput, attention: AttentionInput | undefined): string {
  if (attention?.reasons.length) return attention.reasons[0];
  if (thread.status === "needs_user") return "Along needs your judgment before this thread can move forward.";
  if (thread.status === "delegated") return "Along is already coordinating read-only analysis for this thread.";
  if (thread.risks.length > 0) return "Along sees risk attached to this thread.";
  if (thread.evidence.length > 0) return "Along has evidence worth preserving on this thread.";
  return thread.whyItMatters;
}

function rankThread(thread: SharedDeskThread): number {
  return (actionRank[thread.attentionAction] ?? 0)
    + (statusRank[thread.status] ?? 0)
    + thread.attentionScore
    + (thread.delegation ? 8 : 0);
}

function isStrongEnoughForMain(thread: SharedDeskThread): boolean {
  if (thread.status === "needs_user" || thread.status === "delegated") return true;
  if (thread.attentionAction === "intervention" || thread.attentionAction === "digest") return true;
  if (thread.attentionAction === "read_only_delegation" && thread.attentionScore >= 5) return true;
  return false;
}

function isStrongEnoughForWatch(thread: SharedDeskThread): boolean {
  if (thread.status === "needs_user" || thread.status === "delegated") return true;
  if (thread.attentionAction === "silent") return false;
  if (thread.attentionAction === "unscored") return false;
  return thread.attentionScore >= 3;
}

function quietModel(visibleThreads: SharedDeskThread[] = []): SharedDeskModel {
  return {
    mode: "quiet",
    mainThread: undefined,
    watchThreads: visibleThreads,
    visibleThreads,
    quietMessage: defaultQuietMessage,
  };
}
```

- [ ] **Step 4: Run focused tests and fix compile mismatches**

Run:

```bash
npm test -- tests/web/shared-desk-model.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/web/shared-desk-model.ts tests/web/shared-desk-model.test.ts
git commit -m "feat: derive shared desk model"
```

## Task 2: Shared Desk Component

**Files:**
- Create: `src/web/SharedDesk.tsx`
- Modify: `src/web/App.tsx`

- [ ] **Step 1: Create the presentational component**

Create `src/web/SharedDesk.tsx`:

```tsx
import { Brain, GitBranch, MessageCircle, PauseCircle, Search, XCircle } from "lucide-react";
import type { SharedDeskModel, SharedDeskThread } from "./shared-desk-model";

interface SessionForDesk {
  state: string;
  context: {
    repoName: string;
    gitStatus: string;
    recentCommits: string[];
    directorySummary: string[];
  };
  plan: {
    learningGoal: string;
    currentActivity: string;
  };
}

export type SharedDeskThreadAction =
  | { type: "not_now"; threadId: string }
  | { type: "hide"; threadId: string }
  | { type: "make_main"; threadId: string }
  | { type: "ask_why"; threadId: string };

interface SharedDeskProps {
  session: SessionForDesk | null;
  model: SharedDeskModel;
  onRunHeartbeat: () => void;
  onThreadAction: (action: SharedDeskThreadAction) => void;
}

export function SharedDesk({ session, model, onRunHeartbeat, onThreadAction }: SharedDeskProps) {
  return (
    <section className="desk-shell" aria-label="Shared Desk">
      <div className="desk-context-grid">
        <article className="desk-context-panel">
          <GitBranch size={18} aria-hidden="true" />
          <p className="desk-label">Your side</p>
          <h2>{session?.context.repoName ?? "Waiting for local session"}</h2>
          <pre>{session?.context.gitStatus || "No git changes detected."}</pre>
          <div className="activity-list">
            {(session?.context.recentCommits ?? ["Recent activity will appear after Along reads the repo."]).slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </article>

        <article className="desk-context-panel desk-along-side">
          <Brain size={18} aria-hidden="true" />
          <p className="desk-label">Along's side</p>
          <h2>{model.mode === "active" ? "I am holding this with you." : "I am here quietly."}</h2>
          <p>{session?.plan.learningGoal ?? "Arriving at the desk..."}</p>
          <p className="muted">{session?.plan.currentActivity ?? "Loading project memory."}</p>
        </article>
      </div>

      {model.mainThread ? (
        <MainThreadCard thread={model.mainThread} onThreadAction={onThreadAction} onRunHeartbeat={onRunHeartbeat} />
      ) : (
        <article className="main-thread-card quiet-state">
          <p className="desk-label">Quiet state</p>
          <h2>No thread needs to interrupt you right now.</h2>
          <p>{model.quietMessage}</p>
          <button onClick={onRunHeartbeat}>
            <Search size={16} aria-hidden="true" />
            Check gently
          </button>
        </article>
      )}

      {model.watchThreads.length > 0 && (
        <section className="watch-thread-grid" aria-label="Watch Threads">
          {model.watchThreads.map((thread) => (
            <WatchThreadCard key={thread.id} thread={thread} onThreadAction={onThreadAction} />
          ))}
        </section>
      )}
    </section>
  );
}

function MainThreadCard({
  thread,
  onThreadAction,
  onRunHeartbeat,
}: {
  thread: SharedDeskThread;
  onThreadAction: (action: SharedDeskThreadAction) => void;
  onRunHeartbeat: () => void;
}) {
  return (
    <article className="main-thread-card">
      <p className="desk-label">Along's judgment</p>
      <h2>{thread.title}</h2>
      <p className="judgment-copy">{thread.currentJudgment}</p>
      <div className="why-now">
        <strong>Why now</strong>
        <p>{thread.selectionReason}</p>
      </div>
      {thread.delegation && <DelegationBlock thread={thread} />}
      <div className="desk-actions">
        <button onClick={() => onThreadAction({ type: "ask_why", threadId: thread.id })}>
          <MessageCircle size={16} aria-hidden="true" />
          Ask why
        </button>
        <button onClick={onRunHeartbeat}>
          <Search size={16} aria-hidden="true" />
          Check gently
        </button>
        <button onClick={() => onThreadAction({ type: "not_now", threadId: thread.id })}>
          <PauseCircle size={16} aria-hidden="true" />
          Not now
        </button>
        <button onClick={() => onThreadAction({ type: "hide", threadId: thread.id })}>
          <XCircle size={16} aria-hidden="true" />
          Hide
        </button>
      </div>
    </article>
  );
}

function WatchThreadCard({
  thread,
  onThreadAction,
}: {
  thread: SharedDeskThread;
  onThreadAction: (action: SharedDeskThreadAction) => void;
}) {
  return (
    <article className="watch-thread-card">
      <div className="row-title">
        <strong>{thread.title}</strong>
        <span className="row-status">{thread.status.replaceAll("_", " ")}</span>
      </div>
      <p>{thread.selectionReason}</p>
      <button onClick={() => onThreadAction({ type: "make_main", threadId: thread.id })}>Make this main</button>
    </article>
  );
}

function DelegationBlock({ thread }: { thread: SharedDeskThread }) {
  if (!thread.delegation) return null;

  return (
    <div className="delegation-suggestion">
      <p className="desk-label">Read-only conductor action</p>
      <p>I can keep this bounded as read-only analysis.</p>
      <dl>
        <div>
          <dt>Target</dt>
          <dd>{thread.delegation.target}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{thread.delegation.status.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt>Scope</dt>
          <dd>{thread.delegation.scope.join(", ")}</dd>
        </div>
      </dl>
      {thread.delegation.forbiddenActions && thread.delegation.forbiddenActions.length > 0 && (
        <p className="muted">Will not: {thread.delegation.forbiddenActions.slice(0, 3).join(" ")}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck to see expected App wiring errors are still absent**

Run:

```bash
npm run typecheck
```

Expected: PASS because the component is not imported yet.

- [ ] **Step 3: Commit Task 2**

```bash
git add src/web/SharedDesk.tsx
git commit -m "feat: add shared desk component"
```

## Task 3: App Wiring And Secondary Surfaces

**Files:**
- Modify: `src/web/App.tsx`

- [ ] **Step 1: Import the Shared Desk model and component**

Modify the top of `src/web/App.tsx`:

```tsx
import { BookOpen, Brain, CheckCircle2, Coffee, MessageCircle, Music2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SharedDesk, type SharedDeskThreadAction } from "./SharedDesk";
import { buildSharedDeskModel, type SharedDeskOverrides } from "./shared-desk-model";
import { createSoundscape } from "./soundscape";
```

Remove `GitBranch` from the icon import because `SharedDesk` owns that context panel.

- [ ] **Step 2: Add client-side override state**

Inside `App`, after `wrapFeedback` state:

```tsx
const [threadOverrides, setThreadOverrides] = useState<SharedDeskOverrides>({
  hiddenThreadIds: [],
  notNowThreadIds: [],
});
```

Add the derived model after `delegations` currently gets computed:

```tsx
const sharedDesk = useMemo(() => buildSharedDeskModel({
  conductor,
  overrides: threadOverrides,
}), [conductor, threadOverrides]);
```

- [ ] **Step 3: Add thread action handling**

Inside `App`, before `toggleSound`:

```tsx
function handleThreadAction(action: SharedDeskThreadAction) {
  setThreadOverrides((current) => {
    if (action.type === "not_now") {
      return {
        ...current,
        forcedMainThreadId: current.forcedMainThreadId === action.threadId ? undefined : current.forcedMainThreadId,
        notNowThreadIds: unique([...current.notNowThreadIds, action.threadId]),
      };
    }

    if (action.type === "hide") {
      return {
        ...current,
        forcedMainThreadId: current.forcedMainThreadId === action.threadId ? undefined : current.forcedMainThreadId,
        hiddenThreadIds: unique([...current.hiddenThreadIds, action.threadId]),
      };
    }

    if (action.type === "make_main") {
      return {
        ...current,
        forcedMainThreadId: action.threadId,
        hiddenThreadIds: current.hiddenThreadIds.filter((id) => id !== action.threadId),
        notNowThreadIds: current.notNowThreadIds.filter((id) => id !== action.threadId),
      };
    }

    return current;
  });
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
```

The `ask_why` action intentionally does not change state in this task. The current Main Thread already exposes `Why now`. A later implementation may open a richer explanation panel.

- [ ] **Step 4: Replace dashboard-first top layout with Shared Desk**

In the returned JSX, keep the opening `<main className="shell">` and the existing hero section. Replace the first two context cards and the Project Intelligence / Delegation Live View cards with:

```tsx
<SharedDesk
  session={session}
  model={sharedDesk}
  onRunHeartbeat={runConductorHeartbeat}
  onThreadAction={handleThreadAction}
/>

<section className="secondary-grid" aria-label="Advanced project intelligence">
  <details className="panel secondary-surface">
    <summary>Project intelligence</summary>
    <p className="muted">All Open Threads Along is watching from the conductor layer.</p>
    <div className="thread-list" aria-label="Open Threads">
      {openThreads.length > 0 ? openThreads.map((thread) => (
        <div className="thread-row" key={thread.id}>
          <div className="row-title">
            <strong>{thread.title}</strong>
            <span className="row-status">{stateLabel(thread.status)}</span>
          </div>
          <p>{thread.currentJudgment}</p>
          <p className="muted">{thread.whyItMatters}</p>
        </div>
      )) : (
        <p className="empty-state">No Open Threads yet.</p>
      )}
    </div>
  </details>

  <details className="panel secondary-surface">
    <summary>Delegation live view</summary>
    <p className="muted">Read-only requests, kept visible without granting write control.</p>
    <div className="delegation-list" aria-label="Read-only delegations">
      {delegations.length > 0 ? delegations.map((delegation) => (
        <div className="delegation-row" key={delegation.id}>
          <div className="row-title">
            <strong>{stateLabel(delegation.target)}</strong>
            <span className="row-status">{stateLabel(delegation.status)}</span>
          </div>
          <p>{delegation.reason}</p>
          <p className="muted delegation-scope">{delegation.scope.join(", ")}</p>
        </div>
      )) : (
        <p className="empty-state">No read-only delegations requested.</p>
      )}
    </div>
  </details>
</section>
```

Keep the Shared Timeline, Gentle Share, and Wrap-up panels below this secondary section.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
npm test -- tests/web/shared-desk-model.test.ts
npm run typecheck
```

Expected: focused tests pass; typecheck passes.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/web/App.tsx
git commit -m "feat: wire shared desk into app"
```

## Task 4: Shared Desk Styling And Responsive Behavior

**Files:**
- Modify: `src/web/styles.css`

- [ ] **Step 1: Add Shared Desk styles**

Append this section before the existing `@media` block:

```css
.desk-shell {
  max-width: 1120px;
  margin: 0 auto 16px;
  display: grid;
  gap: 16px;
}

.desk-context-grid,
.secondary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.desk-context-panel,
.main-thread-card,
.watch-thread-card,
.secondary-surface {
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid #e1ddd2;
  border-radius: 8px;
  padding: 18px;
  box-sizing: border-box;
}

.desk-context-panel h2,
.main-thread-card h2 {
  margin: 6px 0 10px;
  font-size: 20px;
  line-height: 1.25;
}

.desk-context-panel pre {
  white-space: pre-wrap;
  color: #52616b;
}

.desk-along-side {
  border-color: #d9b99c;
}

.desk-label {
  margin: 8px 0 0;
  color: #7c3f2c;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.main-thread-card {
  border-color: #b8cec8;
  background: #fbfcf9;
}

.main-thread-card.quiet-state {
  border-color: #e1ddd2;
  background: #fbf8f1;
}

.judgment-copy {
  max-width: 760px;
  color: #1f2933;
  font-size: 17px;
  line-height: 1.55;
}

.why-now {
  margin-top: 14px;
  padding: 12px;
  border-radius: 8px;
  background: #eef6f3;
  color: #244748;
}

.why-now p {
  margin: 6px 0 0;
  line-height: 1.45;
}

.desk-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.desk-actions button,
.watch-thread-card button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #c9b8a5;
  background: #fffaf1;
  color: #1f2933;
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
}

.watch-thread-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.watch-thread-card p {
  color: #52616b;
  font-size: 14px;
  line-height: 1.45;
}

.delegation-suggestion {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e1ddd2;
  border-radius: 8px;
  background: #fffaf1;
}

.delegation-suggestion dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 10px 0;
}

.delegation-suggestion dt {
  color: #687782;
  font-size: 12px;
}

.delegation-suggestion dd {
  margin: 4px 0 0;
  overflow-wrap: anywhere;
}

.secondary-surface summary {
  cursor: pointer;
  color: #1f2933;
  font-weight: 700;
}
```

- [ ] **Step 2: Update mobile styles**

Inside the existing `@media (max-width: 760px)` block, add:

```css
.desk-context-grid,
.secondary-grid,
.watch-thread-grid {
  display: block;
}

.desk-context-panel,
.main-thread-card,
.watch-thread-card,
.secondary-surface {
  margin-bottom: 16px;
}

.delegation-suggestion dl {
  grid-template-columns: 1fr;
}

.desk-actions {
  display: grid;
  grid-template-columns: 1fr;
}

.desk-actions button,
.watch-thread-card button {
  justify-content: center;
}
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS; Vite build completes and reports generated `dist` assets.

- [ ] **Step 4: Commit Task 4**

```bash
git add src/web/styles.css
git commit -m "style: tighten shared desk layout"
```

## Task 5: Runtime Smoke And Browser Verification

**Files:**
- No source changes expected unless verification finds a bug.

- [ ] **Step 1: Run full static verification**

Run:

```bash
npm test -- tests/web/shared-desk-model.test.ts
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 2: Start local API and web servers**

Run in one terminal:

```bash
npm run dev
```

Expected:

```text
Along is listening at http://127.0.0.1:4317
```

Run in another terminal:

```bash
npm run web
```

Expected:

```text
Local:   http://127.0.0.1:5173/
```

In Codex sandbox, if either command fails with `listen EPERM`, rerun that specific command with sandbox escalation.

- [ ] **Step 3: Seed or reuse ignored `.along/` calibration threads**

If `.along/threads/open-threads.json` already has the Along-self calibration threads, reuse them.

If it is absent, run this with the project-local `tsx` runner:

```bash
./node_modules/.bin/tsx -e "(async () => { const { MemoryStore } = await import('./src/core/memory-store.ts'); const { OpenThreadStore } = await import('./src/core/open-thread-store.ts'); const repo = process.cwd(); const memory = new MemoryStore(repo); await memory.ensureInitialized(); const store = new OpenThreadStore(repo); const base = { createdAt: '2026-06-01T00:00:00.000Z', updatedAt: '2026-06-01T00:00:00.000Z', status: 'open', evidence: [], risks: [], delegationHistory: [], memoryLinks: ['docs/superpowers/notes/2026-06-11-living-conductor-continuity-record.md'], traceRefs: [], nextAttentionTrigger: 'Product expression calibration changes.', interventionThreshold: 'Along risks feeling like dashboard instead of companion.' }; for (const thread of [{ id: 'product-expression-next', title: 'Product Expression Tightening should ship before capability expansion', whyItMatters: 'This preserves Along as self-initiated companion rather than generic agent platform.', currentJudgment: 'Shared Desk First should be implemented before Hermes, Memory v2, or write delegation.' }, { id: 'shared-desk-feel', title: 'Shared Desk must feel companion-like, not like dashboard polish', whyItMatters: 'This is the central product expression risk.', currentJudgment: 'Main Thread plus Watch Threads should make Along feel like it is holding judgment with the user.' }, { id: 'quiet-state-noise', title: 'Quiet State should prevent low-signal reminders', whyItMatters: 'Living companion requires silence when there is no meaningful judgment.', currentJudgment: 'Do not fill the UI only because Open Threads exist.' }]) { await store.upsert({ ...base, ...thread }); } })().catch((error) => { console.error(error); process.exit(1); });"
```

Expected: command exits 0 and writes ignored `.along/threads/open-threads.json`.

- [ ] **Step 4: Trigger heartbeat for active Shared Desk data**

Run:

```bash
curl -sS -X POST http://127.0.0.1:4317/api/session/start
curl -sS -X POST http://127.0.0.1:4317/api/conductor/heartbeat -H 'Content-Type: application/json' -d '{"trigger":"user_event"}'
curl -sS http://127.0.0.1:4317/api/conductor/snapshot
```

Expected:

- session response has `id`;
- heartbeat response has `threads`;
- snapshot response has `threads` and `delegations`;
- no project files outside `.along/` are modified by the runtime.

- [ ] **Step 5: Browser verify desktop**

Open:

```text
http://127.0.0.1:5173/
```

Verify:

- Shared Desk appears before Project Intelligence and Delegation Live View.
- Main Thread is visually dominant when a strong thread exists.
- At most two Watch Threads appear.
- Project Intelligence and Delegation Live View are in secondary expandable surfaces.
- Delegation block says read-only and shows scope/forbidden actions when a matching request exists.
- `Not now` removes the current Main Thread from the main slot.
- `Make this main` promotes a Watch Thread.
- `Hide` removes a thread from Shared Desk.
- `Ask why` leaves state stable and does not crash.
- No console errors.

- [ ] **Step 6: Browser verify mobile**

Resize to approximately `390x844`.

Verify:

- Main Thread appears before Watch Threads.
- Watch Threads stack without overlap.
- Delegation scope and forbidden-action text wraps.
- Buttons do not overflow.
- Secondary surfaces are below the Shared Desk.

- [ ] **Step 7: Stop local servers and confirm ports are closed**

Stop both server processes.

Run:

```bash
lsof -nP -iTCP:4317 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Expected: both commands produce no listener output. `lsof` may exit with code 1 when no listener exists.

- [ ] **Step 8: Commit verification notes if needed**

If verification requires a docs update, commit it:

```bash
git add docs/superpowers/notes/2026-06-11-living-conductor-continuity-record.md
git commit -m "docs: record shared desk verification"
```

If no docs update is needed, do not create a verification-only commit.

## Final Verification

Before declaring implementation complete, run:

```bash
npm test -- tests/web/shared-desk-model.test.ts
npm run typecheck
npm run build
git status --short
```

Expected:

- focused tests pass;
- typecheck passes;
- build passes;
- `git status --short` shows only intended changes or is clean except ignored/untracked local `.superpowers/` artifacts.

Do not claim full test-suite status unless full `npm test` is run. If full `npm test` is requested and fails in sandbox with Express `listen EPERM`, rerun it with sandbox escalation.

## Implementation Notes

- Keep `.superpowers/` and `.along/` out of commits.
- Do not change conductor permissions.
- Do not introduce LLM judgment in this pass.
- Do not add a settings UI for attention density or voice.
- Do not rename the product from Along.
- Do not remove Doctor, Project Intelligence, or Delegation Live View; demote the latter two into secondary surfaces.
- Keep all new UI text in English for consistency with the current UI copy.
