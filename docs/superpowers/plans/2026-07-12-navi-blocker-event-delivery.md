# Navi Blocker Event Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Codex adapter contract that lets a formally blocked bounded worktree notify its source main session once, without making the user relay the blocker or adding a Navi runtime.

**Architecture:** Add one focused blocker-event reference to the canonical and packaged Navi skills, then add concise routing guardrails to the skill and generated project trigger. The host-provided thread-messaging tool remains the transport; Navi defines when to emit, what to send, how the main session defers lane-local blockers, and how unsupported hosts degrade.

**Tech Stack:** Markdown skill/reference contracts, TypeScript string templates, Vitest static/initializer tests, existing Navi plugin package verifier.

## Global Constraints

- Execute this plan only after the Global Bootstrap remediation is reviewed and merged into `main`.
- The execution baseline must contain `.agents/skills/navi`, `plugins/navi`, `tests/skills/navi-skill.test.ts`, and the completed Navi identifier migration.
- Do not execute against the current pre-bootstrap `along-working-thread` paths and do not implement inside the blocked bootstrap worktree.
- Use a new true Codex worktree created from the post-bootstrap `main` baseline.
- This is Implementation mode, not Release mode.
- The first version uses host-provided thread messaging only. Do not add a Supervisor task, background process, queue, database, MCP server, watcher, scheduler, or runtime controller.
- Emit only after a bounded goal is formally marked blocked. Do not emit for ordinary waiting, in-scope failures, child completion, task completion, review readiness, or worktree completion.
- Event delivery is coordination evidence, not approval, automatic recovery, scope expansion, or permission to resume.
- Do not add blocker delivery behavior to the global bootstrap.
- Keep generated project guidance concise; the full event schema belongs in the Navi reference and the concrete worktree delegation prompt.
- Run targeted tests only. Do not run full `npm test`, build, browser tests, npm pack, release checks, tag, push, or publication.

---

## File Structure

- `.agents/skills/navi/references/blocker-event-v1.md`: canonical event schema, emission rules, main-session routing, and fallback behavior.
- `plugins/navi/skills/navi/references/blocker-event-v1.md`: exact packaged copy of the canonical reference.
- `.agents/skills/navi/SKILL.md`: concise Codex adapter guardrails and pointer to the detailed reference.
- `plugins/navi/skills/navi/SKILL.md`: exact packaged copy of the canonical skill.
- `src/cli/navi-init.ts`: concise project-local instruction requiring the source task ID and blocker contract in bounded worktree delegation prompts.
- `tests/skills/navi-skill.test.ts`: reference schema, non-trigger, no-runtime, main-session deferral, and source/package synchronization assertions.
- `tests/cli/navi-init.test.ts`: generated project guidance and rule-density assertions.
- `tests/cli/navi-global.test.ts`: explicit assertion that first-use global bootstrap text remains free of blocker-delivery behavior.

---

### Task 1: Add The Canonical Blocker Event Contract

**Files:**
- Create: `.agents/skills/navi/references/blocker-event-v1.md`
- Create: `plugins/navi/skills/navi/references/blocker-event-v1.md`
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces: the `NAVI_LANE_BLOCKER_EVENT` semantic envelope.
- Produces: `declared_impact` values `lane-local` and `premise-changing`.
- Produces: one Codex adapter rule for emitting after formal goal blocking and one main-session rule for handling immediately or deferring.
- Consumes: host-provided source task metadata, goal lifecycle, and thread messaging; no Navi runtime API is introduced.

- [ ] **Step 1: Add failing schema and boundary tests**

In `tests/skills/navi-skill.test.ts`, add a test beside the existing coordination-layer assertions:

```ts
it("defines one-way blocker event delivery without adding a runtime", async () => {
  const canonicalSkill = await readRepoText(".agents/skills/navi/SKILL.md");
  const packagedSkill = await readRepoText("plugins/navi/skills/navi/SKILL.md");
  const canonicalReference = await readRepoText(
    ".agents/skills/navi/references/blocker-event-v1.md",
  );
  const packagedReference = await readRepoText(
    "plugins/navi/skills/navi/references/blocker-event-v1.md",
  );

  expect(packagedSkill).toBe(canonicalSkill);
  expect(packagedReference).toBe(canonicalReference);

  for (const field of [
    "NAVI_LANE_BLOCKER_EVENT",
    "event_id",
    "source_lane",
    "goal",
    "status: blocked",
    "reason",
    "evidence",
    "worktree_state",
    "decision_needed",
    "declared_impact",
    "lane-local",
    "premise-changing",
  ]) {
    expect(canonicalReference).toContain(field);
  }

  for (const boundary of [
    "formally marked blocked",
    "After the blocked status update succeeds",
    "at most one event",
    "not authorization",
    "remains blocked",
    "ordinary waiting",
    "task completion",
    "review readiness",
    "delivery failed",
    "continue non-conflicting design",
    "Do not send a routine acknowledgement",
  ]) {
    expect(canonicalReference).toContain(boundary);
  }

  expect(canonicalReference).not.toContain("Supervisor Inbox");
  expect(canonicalReference).not.toContain("poll every worktree");
  expect(canonicalReference).not.toContain("automatically resume the worktree");
});
```

- [ ] **Step 2: Run the test and verify the red state**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because `blocker-event-v1.md` does not exist and the skill lacks the adapter guardrails.

- [ ] **Step 3: Write the focused canonical reference**

Create `.agents/skills/navi/references/blocker-event-v1.md` with this structure and exact contract language:

```markdown
# Navi Lane Blocker Event Delivery

Use this contract only when a bounded worktree goal has been formally marked blocked and the host provides source-task metadata plus thread messaging.

## Event

NAVI_LANE_BLOCKER_EVENT

- event_id: one stable identifier for this blocked goal
- source_lane: the worktree task identifier
- goal: the bounded goal summary
- status: blocked
- reason: one concrete blocking condition
- evidence: minimal verified evidence
- worktree_state: clean, or the exact uncommitted files
- decision_needed: the decision required to resume or replace the lane
- declared_impact: lane-local or premise-changing

## Emission

Send at most one event for the blocked goal, and only after the goal is formally marked blocked. After the blocked status update succeeds, use the host thread-messaging capability to send the envelope to the source main task identified by delegation metadata. Do not send before the status update succeeds. Ordinary waiting, an in-scope test failure, a running child, task completion, review readiness, and worktree completion are not blocker events.

The event is coordination evidence, not authorization. After delivery, the worktree remains blocked. Do not resume, weaken acceptance criteria, expand scope, select an architecture, accept risk, merge, push, tag, or release because the event was delivered.

If source task metadata or thread messaging is unavailable, or delivery failed, keep the local blocked report and say that the blocker was not delivered to the main session. Never claim delivery without host evidence.

## Main Session

The worktree's declared impact is evidence, not the final interruption decision. Handle the event immediately only when it changes the active premise, safety judgment, file scope, acceptance criteria, or current user decision. Otherwise record the lane-local blocker and continue non-conflicting design until the next natural decision point.

Do not send a routine acknowledgement to the blocked worktree. Respond only after the user makes the decision needed to resume or replace the lane.
```

Do not add examples that contain real task IDs, hidden reasoning, complete logs, or automatic execution language.

- [ ] **Step 4: Add concise skill guardrails**

In `.agents/skills/navi/SKILL.md`, add these bullets next to the existing alpha.7 coordination and blocked-state guardrails:

```markdown
- When creating a bounded Codex worktree and host thread messaging is available, include the source main task ID and the Navi Lane Blocker Event Delivery contract in the delegation prompt.
- A bounded worktree may send one structured blocker event to its source main task only after its goal is formally marked blocked. Event delivery is not authorization to resume or expand scope. Use `references/blocker-event-v1.md` for the event and fallback contract.
- When the main task receives a lane-local blocker event, continue non-conflicting design unless the blocker changes the active premise, safety judgment, file scope, acceptance criteria, or current user decision.
```

Copy the canonical reference and skill byte-for-byte to:

```text
plugins/navi/skills/navi/references/blocker-event-v1.md
plugins/navi/skills/navi/SKILL.md
```

- [ ] **Step 5: Run targeted skill and package verification**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: both commands PASS; source/package skill and reference content are identical.

- [ ] **Step 6: Review scope and commit Task 1**

Run:

```bash
git diff --check
git status --short
```

Expected: only the five Task 1 files are changed or created.

Commit:

```bash
git add .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/blocker-event-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/blocker-event-v1.md \
  tests/skills/navi-skill.test.ts
git commit -m "feat: define navi blocker event delivery"
```

---

### Task 2: Carry The Contract Into Bounded Worktree Delegation

**Files:**
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Consumes: the Task 1 `NAVI_LANE_BLOCKER_EVENT` reference contract.
- Produces: one concise generated project instruction that tells the main task what to include when it delegates a bounded worktree.
- Does not produce: the full event schema, a thread-messaging implementation, global-bootstrap behavior, or a background notification mechanism.

- [ ] **Step 1: Add a failing generated-guidance test**

In `tests/cli/navi-init.test.ts`, add:

```ts
it("installs concise bounded-worktree blocker delivery guidance", async () => {
  const project = await makeProject();
  const plan = await buildInitPlan({ targetDir: project, write: true });
  await applyInitPlan(plan);

  const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

  for (const expected of [
    "source main task ID",
    "host thread messaging",
    "formally marked blocked",
    "one structured blocker event",
    "Event delivery is not authorization",
    "report the blocker locally",
  ]) {
    expect(agents).toContain(expected);
  }

  for (const detailedField of [
    "event_id:",
    "source_lane:",
    "worktree_state:",
    "declared_impact:",
  ]) {
    expect(agents).not.toContain(detailedField);
  }
});
```

In `tests/cli/navi-global.test.ts`, extend the existing
`renders only first-use routing responsibilities` test with:

```ts
expect(renderGlobalBootstrapBlock()).not.toContain("blocker event");
expect(renderGlobalBootstrapBlock()).not.toContain("source main task ID");
```

- [ ] **Step 2: Run the initializer test and verify the red state**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because generated project guidance lacks the blocker-delivery paragraph. The global-bootstrap exclusions already pass and guard against accidental scope expansion during implementation.

- [ ] **Step 3: Add one concise paragraph to the generated Navi block**

In `renderAgentsBlock()` in `src/cli/navi-init.ts`, place this paragraph immediately after the existing bounded implementation/worktree execution contract and before detailed stage/vision guidance:

```text
When creating a bounded Codex worktree and host thread messaging is available, include the source main task ID and Navi's blocker-event contract in the delegation prompt. The worktree may send one structured blocker event only after its bounded goal is formally marked blocked; ordinary waiting, in-scope failures, task completion, review readiness, and worktree completion do not notify. Event delivery is not authorization to resume, expand scope, or choose the required decision. If source-task metadata or thread messaging is unavailable or delivery fails, report the blocker locally and say it was not delivered to the main task.
```

Do not insert the detailed event field list into `AGENTS.md`. Do not modify `renderGlobalBootstrapBlock()`.

- [ ] **Step 4: Run the targeted initializer tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/cli/navi-global.test.ts tests/skills/navi-skill.test.ts
```

Expected: both files PASS; the generated trigger contains the concise rule and the canonical/package contract remains synchronized.

- [ ] **Step 5: Review scope and commit Task 2**

Run:

```bash
git diff --check
git status --short
```

Expected: only `src/cli/navi-init.ts`, `tests/cli/navi-init.test.ts`, and `tests/cli/navi-global.test.ts` are uncommitted.

Commit:

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts tests/cli/navi-global.test.ts
git commit -m "feat: route blocked navi worktrees to main"
```

---

### Task 3: Run Final Targeted Verification And Prepare Calibration Handoff

**Files:**
- Modify only Task 1 or Task 2 files if a targeted failure proves an in-scope defect.
- Do not modify `docs/along/navi-calibration-log.md` before a future natural blocker occurs.

**Interfaces:**
- Consumes: Task 1's reference contract and Task 2's generated delegation rule.
- Produces: a clean, review-ready worktree and a future natural-calibration handoff.

- [ ] **Step 1: Run the bounded test set**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts tests/cli/navi-init.test.ts tests/cli/navi-global.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check "$(git merge-base main HEAD)"..HEAD
```

Expected: every command exits `0`. Do not replace this set with full `npm test`.

- [ ] **Step 2: Audit rule density and forbidden scope**

Run:

```bash
rg -n "NAVI_LANE_BLOCKER_EVENT|event_id:|source_lane:|worktree_state:|declared_impact:" \
  .agents/skills/navi plugins/navi/skills/navi src/cli/navi-init.ts
rg -n "blocker event|source main task ID" src/cli/navi-global.ts
git status --short --branch
```

Expected:

- the detailed schema appears only in canonical/package references;
- `SKILL.md` and `navi-init.ts` contain concise routing language;
- `navi-global.ts` contains no blocker-delivery language; and
- the worktree is clean after the two planned commits.

- [ ] **Step 3: Prepare the review report**

Report:

- both commit IDs and subjects;
- exact targeted test files and counts;
- plugin verifier, typecheck, and diff-check results;
- confirmation that no thread was messaged during automated tests;
- confirmation that no global bootstrap, runtime, MCP, external project, merge,
  push, tag, or release work occurred; and
- the remaining calibration requirement: wait for one future natural blocked
  worktree, then observe automatic delivery, deduplication, deferral, and absence
  of user relay.

Stop at the parent review/merge decision. Do not manufacture a blocker, edit the
calibration log, merge, push, tag, or release.
