# Navi Lane Handoff Event Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a bounded Codex worktree deliver one truthful `decision-required`, `blocked`, or `review-ready` transition to its source main task without requiring the user to relay task state or adding a Navi runtime.

**Architecture:** Keep delivery prompt/docs-backed and Codex-first. A focused canonical Lane Handoff reference defines the versioned envelope, transition boundaries, one-retry/deduplication behavior, source-task routing, and honest fallback; the Navi skill and project trigger provide concise adapter instructions, while host task messaging remains the transport. Existing Confirmed Map triggers are migrated as recognized legacy content, and no queue, watcher, service, scheduler, or automatic authority is introduced.

**Tech Stack:** Markdown skill/reference contracts, TypeScript project-trigger templates, Vitest contract and initializer tests, existing Navi plugin package verifier, Codex host task messaging during later natural calibration only.

## Global Constraints

- Execute from a true Codex-managed worktree based on `dd9fefc` or a later `main` that contains the integrated Confirmed Project Map journey, `edb560a` capability-truthfulness remediation, `e0313da` Lane Handoff design, and `ceb5383` complexity-stabilization design.
- This is Implementation mode, not Release mode. Do not push, merge, tag, publish, change package versions, or prepare a GitHub Release.
- Implement exactly three transitions: `decision-required`, `blocked`, and `review-ready`. Do not add progress, routine waiting, test, commit, running-child, acknowledgement, or generic completion events.
- Use host-provided Codex task messaging only. Do not add a Supervisor Inbox task, background process, queue, database, MCP server, watcher, scheduler, runtime controller, or polling loop.
- Delivery is coordination evidence. It never authorizes resume, recovery, scope expansion, acceptance-criteria reduction, risk acceptance, merge, push, tag, release, or publication.
- A failed delivery may be retried once immediately with the same `event_id`. Do not add timed retries or durable storage. Duplicate receipt is ignored in source-task context.
- Keep the generated project trigger concise. The full schema belongs only in the focused canonical/package reference and the bounded delegation prompt.
- Preserve the current Confirmed Map trigger as a recognized legacy block so existing initialized projects receive an explicit previewed upgrade rather than an unsafe/unknown diagnosis.
- Keep global bootstrap limited to first-use discovery and project initialization routing; it must not gain lane delivery behavior.
- Do not modify `src/web`, `src/core`, `src/mcp`, `src/server`, Historical Along runtime surfaces, source-alpha installation logic, or global plugin state.
- Automated tests must not send real task messages. Real delivery is calibrated only on the first natural worktree lifecycle after implementation.
- Run targeted tests only. Do not run full `npm test`, build, browser tests, npm pack, release checks, or publication checks.

---

## File Structure

- `.agents/skills/navi/references/lane-handoff-v1.md`: canonical event schema, transition gates, delivery/retry/fallback behavior, source routing, bounded replies, and authority limits.
- `plugins/navi/skills/navi/references/lane-handoff-v1.md`: exact packaged copy of the canonical reference.
- `.agents/skills/navi/SKILL.md`: concise conditional reference pointer and Codex adapter responsibilities.
- `plugins/navi/skills/navi/SKILL.md`: exact packaged copy of the canonical skill.
- `.agents/skills/navi/references/working-thread-v1.md`: replace the semantic-only review-readiness paragraph with a concise pointer to delivered Lane Handoff behavior.
- `plugins/navi/skills/navi/references/working-thread-v1.md`: exact packaged copy.
- `src/cli/navi-init.ts`: render the concise project-local Lane Handoff rule and recognize the pre-Lane-Handoff Confirmed Map trigger as legacy.
- `docs/navi/project-trigger-template.md`: exact human-readable managed block produced by `renderAgentsBlock()`.
- `tests/fixtures/navi-legacy-agents-blocks.ts`: fixed pre-Lane-Handoff Confirmed Map trigger bytes used by migration tests.
- `tests/skills/navi-skill.test.ts`: unified schema, transition, retry, routing, authority, fallback, mirror, and rule-density assertions.
- `tests/cli/navi-init.test.ts`: exact new trigger, legacy recognition, previewed upgrade, and write migration tests.
- `tests/cli/navi-global.test.ts`: assertions that global bootstrap remains free of Lane Handoff delivery.
- `README.md`, `README.zh-CN.md`, and `plugins/navi/README.md`: truthful current capability and non-runtime boundaries.

---

### Task 1: Define The Unified Codex Lane Handoff Contract

**Files:**
- Create: `.agents/skills/navi/references/lane-handoff-v1.md`
- Create: `plugins/navi/skills/navi/references/lane-handoff-v1.md`
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: delegation metadata containing the source main task ID, the bounded lane goal and authority envelope, host goal lifecycle state, and optional Codex task messaging.
- Produces: the textual `NAVI_LANE_HANDOFF_EVENT` version 1 envelope with exact kinds `decision-required | blocked | review-ready`.
- Produces: one immediate retry using the same `event_id`, task-context duplicate suppression, impact-aware main routing, and honest local fallback.
- Does not produce: a TypeScript event runtime, transport client, durable event store, scheduler, inbox, polling API, or authorization decision.

- [ ] **Step 1: Add failing canonical/package contract tests**

Add this test near the existing coordination and package-mirror tests in `tests/skills/navi-skill.test.ts`:

```ts
it("defines one unified Codex Lane Handoff contract without adding a runtime", async () => {
  const [canonicalSkill, packagedSkill, canonicalReference, packagedReference] =
    await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
    ]);

  expect(packagedSkill).toBe(canonicalSkill);
  expect(packagedReference).toBe(canonicalReference);

  for (const field of [
    "NAVI_LANE_HANDOFF_EVENT",
    "version: 1",
    "event_id",
    "kind: decision-required | blocked | review-ready",
    "source_task",
    "source_lane",
    "goal",
    "summary",
    "evidence",
    "worktree_state",
    "declared_impact: lane-local | premise-changing",
  ]) {
    expect(canonicalReference).toContain(field);
  }

  for (const kindField of [
    "decision_needed",
    "recommendation",
    "continuation",
    "reason",
    "attempts",
    "commits",
    "changed_scope",
    "verification",
    "residual_risks",
  ]) {
    expect(canonicalReference).toContain(kindField);
  }

  for (const boundary of [
    "retry once immediately",
    "same event_id",
    "silently ignore duplicate",
    "delivery failed",
    "not authorization",
    "next natural checkpoint",
    "read-only parent review",
    "strictly bounded remediation",
    "Do not send a routine acknowledgement",
  ]) {
    expect(canonicalReference).toContain(boundary);
  }

  for (const nonEvent of [
    "ordinary progress",
    "routine waiting",
    "test passing",
    "local task commit",
    "running child",
  ]) {
    expect(canonicalReference).toContain(nonEvent);
  }

  expect(canonicalSkill).toContain("references/lane-handoff-v1.md");
  expect(canonicalReference).toMatch(
    /not a background process[\s\S]*durable queue[\s\S]*Supervisor Inbox/i,
  );
  expect(canonicalReference).not.toMatch(
    /start a background process|create a durable queue|open a Supervisor Inbox/i,
  );
});
```

- [ ] **Step 2: Run the skill test and verify the red state**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because `lane-handoff-v1.md` does not exist and the skill does not point to it.

- [ ] **Step 3: Write the complete canonical Lane Handoff reference**

Create `.agents/skills/navi/references/lane-handoff-v1.md` with this content:

```markdown
# Navi Lane Handoff Event Delivery V1

Use this reference only for a bounded Codex lane whose delegation metadata identifies its source main task. Navi defines transition meaning and routing policy; the Codex host provides task identity, transcript persistence, and task messaging.

This is task-to-task coordination while Codex is active. It is not a background process, watcher, notification service, durable queue, Supervisor Inbox, or runtime controller.

## Delegation Metadata

The source main task includes its task ID, the bounded lane goal, file and action scope, validation budget, authority boundaries, stop conditions, and a pointer to this reference in the worktree delegation. Missing source-task metadata disables delivery and uses the honest local fallback.

## Unified Event

NAVI_LANE_HANDOFF_EVENT

version: 1
event_id: one stable identifier chosen once for this lane transition
kind: decision-required | blocked | review-ready
source_task: the source main task identifier from delegation metadata
source_lane: the bounded worktree task identifier
goal: the bounded lane goal
summary: one minimal factual transition summary
evidence: minimal verified evidence or source references
worktree_state: clean, or the exact uncommitted files
declared_impact: lane-local | premise-changing

The event contains facts and source references, not hidden reasoning, exhaustive logs, or implied authorization. The worktree's declared impact is evidence; the source main task makes the final routing judgment.

## Decision Required

Use `kind: decision-required` only when the lane cannot continue without a real user decision about permission, external or cross-project writes, unplanned scope, acceptance-criteria reduction, material risk, product direction, merge, push, tag, release, or publication.

Add:

decision_needed: one decision only the user can make
recommendation: one bounded recommendation, or none when no default is justified
continuation: what the lane will do if the decision authorizes it

Ordinary engineering uncertainty is not decision-required. The lane remains paused after delivery.

## Blocked

Use `kind: blocked` only after the bounded goal satisfies the host goal lifecycle's formal blocked rule.

Add:

reason: one concrete blocking condition
attempts: minimal verified attempts already made
decision_needed: the decision required to resume, replace, or close the lane

An in-scope failure, routine waiting, review readiness, and worktree completion are not blocked. The lane remains blocked after delivery.

## Review Ready

Use `kind: review-ready` only after the lane reaches its stated implementation acceptance point and completes its final scope and worktree-state audit.

Add:

commits: exact implementation commits
changed_scope: exact files or bounded components changed
verification: targeted checks and exact results
residual_risks: known remaining risks, or none

Review-ready means ready for source-side review. It does not mean merged, released, or proved correct.

## Non-Events

Do not emit for ordinary progress, routine waiting, an in-scope failure, test passing, a local task commit, a running child, a routine acknowledgement, or intermediate task completion. A completed bounded implementation emits review-ready only after its acceptance and scope audit.

## Delivery, Retry, And Fallback

Choose the event_id once, render the complete event, and use the available Codex task-messaging capability to send it to source_task. On a reported delivery failure, retry once immediately with the same event_id and identical semantic payload. Do not use timed retries, polling, a resend loop, or durable storage.

If source-task metadata or task messaging is unavailable, or both attempts fail, keep the ordinary local transition report and state that delivery failed. Never claim delivery without host tool evidence.

Delivery is coordination evidence, not authorization. It does not authorize resume, recovery, scope expansion, acceptance-criteria reduction, risk acceptance, merge, push, tag, release, or publication.

## Source Main Task

The source main task tracks handled event IDs in its task context and must silently ignore duplicate receipt. Receiving an event does not make the whole session blocked and does not force a mid-response interruption.

A premise-changing event is handled at the first available turn when it changes a current premise, safety judgment, file scope, acceptance criterion, or user decision. A lane-local event may wait until the next natural checkpoint while useful non-conflicting design continues.

For decision-required, present the one real decision and send the result directly back to the lane. For blocked, present the resume, replace, or close decision only when user judgment is required. For review-ready, perform read-only parent review at the next natural checkpoint without asking the user to relay the result.

If review finds a defect inside the original goal, scope, validation budget, authority, and risk boundaries, send one strictly bounded remediation to the same lane. If remediation changes product design, expands scope, requires permission, lowers acceptance criteria, or accepts new risk, present a real user decision instead.

Do not send a routine acknowledgement. Reply only with an applicable user decision, a strictly bounded remediation, or an explicit resume, replace, or close instruction. Do not create a task-to-task conversation loop.
```

Copy it byte-for-byte to `plugins/navi/skills/navi/references/lane-handoff-v1.md`.

- [ ] **Step 4: Add concise skill routing and adapter responsibilities**

In `.agents/skills/navi/SKILL.md`, extend `## Required Reference` with:

```markdown
For bounded Codex worktree delegation, a delivered lane transition, or source-side lane review, also read:

`references/lane-handoff-v1.md`
```

Add this section immediately before `## Hard Boundaries`:

```markdown
## Codex Lane Handoff Adapter

- A bounded worktree delegation includes the source main task ID, the bounded goal and authority envelope, and a pointer to `references/lane-handoff-v1.md`.
- When host task messaging is available, the worktree emits once on `decision-required`, `blocked`, or `review-ready`. Ordinary progress and waiting do not emit.
- Delivery is evidence, not authorization. Missing metadata or messaging uses the explicit local fallback.
- The source main task routes by current impact, silently ignores duplicate event IDs, reviews `review-ready` at the next natural checkpoint, and returns only real decisions or strictly bounded remediation to the lane.
```

Copy the complete canonical skill byte-for-byte to `plugins/navi/skills/navi/SKILL.md`.

- [ ] **Step 5: Run targeted skill and package verification**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: both commands PASS; the source/package skill trees are byte-identical and the new reference is included by directory drift verification.

- [ ] **Step 6: Scope-review and commit Task 1**

Run:

```bash
git diff --check
git status --short
```

Expected: only the five Task 1 files are changed or created.

Commit:

```bash
git add .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/lane-handoff-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/lane-handoff-v1.md \
  tests/skills/navi-skill.test.ts
git commit -m "feat: define navi lane handoff delivery"
```

---

### Task 2: Migrate Project Guidance To Delivered Lane Handoffs

**Files:**
- Modify: `.agents/skills/navi/references/working-thread-v1.md`
- Modify: `plugins/navi/skills/navi/references/working-thread-v1.md`
- Modify: `src/cli/navi-init.ts`
- Modify: `docs/navi/project-trigger-template.md`
- Modify: `tests/fixtures/navi-legacy-agents-blocks.ts`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Consumes: Task 1's `references/lane-handoff-v1.md` contract.
- Produces: one concise current project-trigger bullet that carries source-task metadata and three-kind delivery into future bounded worktree delegations.
- Produces: safe classification and previewed upgrade of the exact pre-Lane-Handoff Confirmed Map trigger.
- Preserves: Map-first/trigger-last initialization, plan-fingerprint binding, project-owned `AGENTS.md` bytes, global-bootstrap boundaries, and canonical/package reference equality.

- [ ] **Step 1: Add failing trigger, migration, and global-boundary tests**

In `tests/fixtures/navi-legacy-agents-blocks.ts`, add this exact fixed fixture:

```ts
export const LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF = `<!-- NAVI:START -->
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read \`.navi/project-map.md\` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- Treat worktree completion as review-ready state, not an automatic interruption; review when the result can change the current decision.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
<!-- NAVI:END -->`;
```

Import the fixture in `tests/cli/navi-init.test.ts`. Update the exact `renderAgentsBlock()` expectation by replacing the old review-ready bullet with:

```text
- For bounded Codex worktrees, include the source main task ID and Navi Lane Handoff reference in the delegation; when host task messaging is available, emit once on decision-required, blocked, or review-ready, and use the explicit local fallback otherwise. Delivery does not authorize resume, scope expansion, merge, push, tag, or release.
```

Add the fixture to both the trigger-classification and legacy-upgrade parameter tables. Add this focused migration test:

```ts
it("previews an upgrade from the pre-Lane-Handoff confirmed Map trigger", async () => {
  const project = await createProject();
  await writeCanonicalMap(project);
  await fs.writeFile(
    path.join(project, "AGENTS.md"),
    LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF,
  );

  const plan = await buildInitPlan({ targetDir: project });

  expect(plan.actions).toHaveLength(1);
  expect(plan.actions[0]).toMatchObject({ kind: "modify", relativePath: "AGENTS.md" });
  expect(plan.actions[0]?.content).toContain("Navi Lane Handoff reference");
  expect(plan.actions[0]?.content).not.toContain(
    "Treat worktree completion as review-ready state",
  );
});
```

In `tests/cli/navi-global.test.ts`, extend `renders only first-use routing responsibilities` with:

```ts
expect(block).not.toContain("NAVI_LANE_HANDOFF_EVENT");
expect(block).not.toContain("source main task ID");
expect(block).not.toContain("review-ready");
```

Replace the existing skill test named `keeps review readiness semantic-only and leaves unified lane-handoff delivery to its owning design` with:

```ts
it("routes review readiness through Lane Handoff without claiming background delivery", async () => {
  const [skill, workingThread, laneHandoff, packagedWorkingThread] =
    await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/working-thread-v1.md"),
    ]);

  const parallel = extractMarkdownSection(
    workingThread,
    "### Parallel Work And Review Readiness",
  );

  expect(packagedWorkingThread).toBe(workingThread);
  expect(parallel).toMatch(/review-ready[\s\S]*Lane Handoff[\s\S]*natural checkpoint/i);
  expect(parallel).toMatch(/continue[\s\S]*non-conflicting/i);
  expect(skill).toContain("references/lane-handoff-v1.md");
  expect(laneHandoff).toMatch(/task-to-task coordination[\s\S]*not a background/i);
});
```

- [ ] **Step 2: Run the targeted tests and verify the red state**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/cli/navi-global.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because the current trigger lacks the Lane Handoff bullet, the previous Confirmed Map trigger is not recognized as legacy, and the working-thread reference still describes semantic-only review readiness.

- [ ] **Step 3: Add the exact legacy trigger to production recognition**

In `src/cli/navi-init.ts`, add a private function immediately before `renderAgentsBlock()` that returns the exact pre-Lane-Handoff fixture bytes:

```ts
function renderPreLaneHandoffAgentsBlock(): string {
  return `${NAVI_AGENTS_BLOCK_START}
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read \`.navi/project-map.md\` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- Treat worktree completion as review-ready state, not an automatic interruption; review when the result can change the current decision.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
${NAVI_AGENTS_BLOCK_END}`;
}
```

Add `renderPreLaneHandoffAgentsBlock()` to `KNOWN_NAVI_AGENTS_BLOCKS` before the two older legacy blocks. Do not make it current and do not accept edited variants.

- [ ] **Step 4: Render the concise current trigger and update its documented template**

In `renderAgentsBlock()`, replace the old review-ready-state bullet with the exact Lane Handoff bullet from Step 1. Make the identical one-line replacement in `docs/navi/project-trigger-template.md`.

Do not copy event fields, retry rules, routing tables, or tool names into the project trigger.

- [ ] **Step 5: Link Working Thread coordination to delivered transitions**

Replace the body under `### Parallel Work And Review Readiness` in `.agents/skills/navi/references/working-thread-v1.md` with:

```markdown
Main-session design may continue while a bounded implementation worktree performs non-conflicting work. When the delegation carries source-task metadata and host task messaging is available, a completed accepted lane emits a `review-ready` Navi Lane Handoff event; `decision-required` and formally `blocked` use the same focused contract. Delivery does not force an immediate interruption. The source main task reviews at the next natural checkpoint, or earlier when the result changes the current premise, risk, scope, acceptance criteria, merge path, release readiness, or user decision. Use `lane-handoff-v1.md` for emission, retry, fallback, routing, and authority boundaries.
```

Copy the complete canonical working-thread reference byte-for-byte to `plugins/navi/skills/navi/references/working-thread-v1.md`.

- [ ] **Step 6: Run initializer, doctor-adjacent, skill, and package checks**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-global.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: all targeted files PASS; the old Confirmed Map trigger is recognized as legacy and previewed for upgrade, the current trigger is exact, global bootstrap remains free of Lane Handoff delivery, and canonical/package sources match.

- [ ] **Step 7: Scope-review and commit Task 2**

Run:

```bash
git diff --check
git status --short
```

Expected: only the eight Task 2 files are uncommitted.

Commit:

```bash
git add .agents/skills/navi/references/working-thread-v1.md \
  plugins/navi/skills/navi/references/working-thread-v1.md \
  src/cli/navi-init.ts \
  docs/navi/project-trigger-template.md \
  tests/fixtures/navi-legacy-agents-blocks.ts \
  tests/skills/navi-skill.test.ts \
  tests/cli/navi-init.test.ts \
  tests/cli/navi-global.test.ts
git commit -m "feat: route navi lane handoffs across tasks"
```

---

### Task 3: Keep User-Facing Capability Claims Truthful

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: Tasks 1 and 2's prompt/docs-backed Codex Lane Handoff behavior.
- Produces: user-facing language that distinguishes active Codex task-to-task handoff from background notifications, watchers, runtime autonomy, and cross-agent support.
- Preserves: source-alpha distribution status, Codex-only support, current version metadata, and explicit no-runtime/no-always-on promises.

- [ ] **Step 1: Add a failing capability-truthfulness test**

Add to `tests/skills/navi-skill.test.ts`:

```ts
it("documents Codex task handoff without claiming background notifications", async () => {
  const [readme, chineseReadme, pluginReadme] = await Promise.all([
    readRepoText("README.md"),
    readRepoText("README.zh-CN.md"),
    readRepoText("plugins/navi/README.md"),
  ]);

  for (const surface of [readme, pluginReadme]) {
    expect(surface).toMatch(/decision-required[\s\S]*blocked[\s\S]*review-ready/i);
    expect(surface).toMatch(/Codex task-to-task[\s\S]*active session/i);
    expect(surface).toMatch(/no background watcher[\s\S]*notification service/i);
  }

  expect(chineseReadme).toMatch(/decision-required[\s\S]*blocked[\s\S]*review-ready/i);
  expect(chineseReadme).toMatch(/活跃会话[\s\S]*Codex 任务之间/i);
  expect(chineseReadme).toMatch(/不包含后台 watcher[\s\S]*通知服务/i);
});
```

- [ ] **Step 2: Run the test and verify the red state**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because current docs say Navi sends no notifications without distinguishing task messaging from background/user notification services.

- [ ] **Step 3: Add exact English capability language**

Add this paragraph to the current-capability section of both `README.md` and `plugins/navi/README.md`:

```markdown
When a bounded Codex worktree has source-task metadata and host task messaging, Navi can deliver one `decision-required`, `blocked`, or `review-ready` transition back to the source main task. This is Codex task-to-task coordination during an active session, not a background watcher, user notification service, durable queue, or automatic permission to resume, merge, push, or release.
```

In `README.md`, replace `notifications` in the later-release requirement list with `operating-system or background notifications`, replace the `Background autonomy, notifications, or always-on presence` exclusion with the bullet below, and replace the V1 sentence `it does not watch files, send notifications, or act when Codex is closed` with `it does not watch files, send operating-system or background notifications, or act when Codex is closed`.

Use this exact replacement bullet:

```markdown
- It has no background watcher, operating-system notification service, or always-on presence; bounded Lane Handoff uses available Codex task messaging only while Codex is active.
```

In `plugins/navi/README.md`, replace `It does not send notifications.` with the same exact replacement bullet. Replace the claim that the package adds no adapter or delegation capability with:

```markdown
It packages the current skill-first behavior and a prompt/docs-backed Codex Lane Handoff adapter. It does not add runtime, memory, presence, background autonomy, another-agent support, or automatic worktree orchestration.
```

Add `lane-handoff-v1.md` to the displayed plugin package layout.

- [ ] **Step 4: Add synchronized Chinese capability language**

Add this paragraph to the corresponding current-capability section of `README.zh-CN.md`:

```markdown
当一个有明确边界的 Codex worktree 带有 source-task metadata 且 host 提供任务消息能力时，Navi 可以把一次 `decision-required`、`blocked` 或 `review-ready` 转换直接交给来源主任务。这是活跃会话中 Codex 任务之间的协调，不是后台 watcher、用户通知服务、持久队列，也不会自动授权恢复执行、merge、push 或 release。
```

In `README.zh-CN.md`, replace the later-release `notifications` item with `操作系统或后台 notifications`, replace the `后台 autonomy、notifications 或 always-on presence` exclusion with the bullet below, and replace `它不会 watch files、发送 notifications，也不会在 Codex 关闭后继续行动` with `它不会 watch files、发送操作系统或后台 notifications，也不会在 Codex 关闭后继续行动`.

Use this exact replacement bullet:

```markdown
- 不包含后台 watcher、操作系统通知服务或 always-on presence；bounded Lane Handoff 只在 Codex 活跃时使用可用的任务消息能力。
```

- [ ] **Step 5: Run targeted docs/package tests**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: both commands PASS; English and Chinese docs describe the same boundary, and packaged skill sources remain synchronized.

- [ ] **Step 6: Scope-review and commit Task 3**

Run:

```bash
git diff --check
git status --short
```

Expected: only the four Task 3 files are uncommitted.

Commit:

```bash
git add README.md README.zh-CN.md plugins/navi/README.md tests/skills/navi-skill.test.ts
git commit -m "docs: explain navi lane handoff boundaries"
```

---

### Task 4: Run Bounded Integration Verification And Prepare Natural Calibration

**Files:**
- Modify only Task 1, Task 2, or Task 3 files if a targeted failure proves an in-scope defect.
- Do not edit `docs/along/navi-calibration-log.md` before a natural post-implementation worktree transition occurs.

**Interfaces:**
- Consumes: the unified reference, current skill/package mirror, migrated project trigger, and truthful user docs.
- Produces: a clean review-ready implementation worktree plus one explicit natural-calibration handoff.

- [ ] **Step 1: Run the bounded active-Navi suite**

Run:

```bash
npm test -- \
  tests/skills/navi-skill.test.ts \
  tests/cli/navi-init.test.ts \
  tests/cli/navi-doctor.test.ts \
  tests/cli/navi-global.test.ts \
  tests/mcp/working-thread-package.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check "$(git merge-base main HEAD)"..HEAD
```

Expected: every command exits `0`. Do not replace this set with full `npm test`.

- [ ] **Step 2: Audit detailed-schema placement and forbidden runtime scope**

Run:

```bash
rg -n "NAVI_LANE_HANDOFF_EVENT|event_id:|worktree_state:|declared_impact:" \
  .agents/skills/navi plugins/navi/skills/navi src/cli/navi-init.ts docs/navi/project-trigger-template.md
rg -n "NAVI_LANE_HANDOFF_EVENT|source main task ID|review-ready" src/cli/navi-global.ts
git status --short --branch
```

Expected:

- detailed schema fields appear only in canonical/package `lane-handoff-v1.md` and their focused tests;
- `SKILL.md`, `working-thread-v1.md`, `navi-init.ts`, and the project-trigger template contain concise routing language only;
- `navi-global.ts` has no Lane Handoff delivery text;
- no runtime, MCP, web, package-version, release, external-project, or global Codex state changed; and
- the worktree is clean after the three planned commits.

- [ ] **Step 3: Perform a final scope and capability-truthfulness review**

Read the complete branch diff against the execution baseline and verify:

- all three event kinds and only those kinds are supported;
- a real decision gate is not misclassified as blocked;
- completion becomes review-ready only after acceptance and scope audit;
- delivery failure is not reported as success;
- duplicate receipt and retry do not create message loops;
- parent review is read-only until bounded remediation or a user decision is selected;
- merge, push, tag, release, publication, scope, risk, and permission gates remain explicit; and
- current docs no longer claim either background notifications or no task-to-task delivery.

If review finds an in-scope defect, correct it test-first in the owning task files and commit one bounded fix. Do not redesign transport or add runtime infrastructure.

- [ ] **Step 4: Prepare the review-ready report and natural calibration contract**

Report:

- all implementation commit IDs and subjects;
- exact changed files grouped by task;
- exact targeted test files, counts, package verifier result, typecheck result, and diff-check result;
- confirmation that automated tests sent no real task messages;
- confirmation that no external project, global Codex state, runtime, merge, push, tag, release, or publication work occurred; and
- remaining calibration: use the first natural bounded worktree created after this branch is integrated, carry source-task metadata in its delegation, and observe one real `decision-required`, `blocked`, or `review-ready` transition without manufacturing a blocker.

The natural calibration succeeds when the source main task receives the transition without user relay, does not duplicate it, does not interrupt unrelated lane-local design, performs read-only parent review for `review-ready`, and preserves all real approval gates.

Stop at the parent read-only review and merge decision. Do not create a synthetic worktree solely to make the calibration pass, edit the calibration log before observation, merge, push, tag, or release.
