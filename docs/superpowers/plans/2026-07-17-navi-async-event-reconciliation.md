# Navi Async Event Reconciliation V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task in one true
> Codex-managed isolated worktree. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Recover an important missed task transition at the next dependent
Main Task checkpoint without periodic polling, user relay, or Runtime Surface.

**Architecture:** `lane-handoff-v1.md` remains the sole owner of direct event
delivery and gains one receiver-side `Main-Task Reconciliation` policy.
`SKILL.md` routes unresolved relevant tasks to that owner, while
`supervised-delivery-v1.md` adopts the owner without copying checkpoint or
inspection rules. Static contract tests lock checkpoint relevance, one-shot
inspection, quiet routing, delivery-failure handling, package mirrors, and the
no-runtime boundary.

**Tech Stack:** Markdown skill contracts, TypeScript, Vitest, Navi's canonical
and packaged plugin mirrors, Codex host task messaging.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-17-navi-async-event-reconciliation-design.md`.
- This is bounded Implementation mode. It is not Release mode and does not
  authorize merge, push, tag, release, publication, or target-project writes.
- Direct task messaging remains the primary path. Reconciliation is a
  receiver-side one-shot safety net at a dependent control checkpoint, not a
  timer, periodic poll, progress monitor, inbox, durable queue, watcher,
  daemon, or Runtime Surface.
- A relevant unresolved task may affect product premise, acceptance, scope,
  material risk, integration/release readiness, temporary global or external
  state, or the next real user decision. Ordinary progress and unrelated
  exploration do not qualify.
- Checkpoints are limited to a dependent user decision; related task creation,
  replacement, cancellation, or redirection; merge/push/tag/release/publication;
  a claim that only waiting remains; or closure of the affected lane/session
  phase.
- Each relevant task may be inspected at most once for one checkpoint. A
  running result is quiet and does not authorize a second read at that
  checkpoint.
- Use the known task identifier directly. Prefer a host one-shot completion
  snapshot or bounded wait when available; otherwise allow one read-only task
  inspection. Do not list or search tasks when the identifier is known.
- Completed valid events follow existing event routing and deduplication.
  Completed invalid delivery is `delivery-protocol-failure`; it does not imply
  user authorization and permits at most one bounded re-delivery request when
  required fields are missing.
- A task read failure does not authorize a retry loop. Dependent high-impact
  work stops; independent work may continue with the state unresolved.
- Reconciliation remains quiet unless it recovers a decision-changing event,
  finds a delivery-protocol failure, or exposes a host capability gap that
  blocks a dependent high-impact action.
- The state is turn-local Main Task context. Do not persist it to the Project
  Map, `state.md`, repository files, or global storage.
- Do not change the Lane Handoff or Validation wire formats.
- `lane-handoff-v1.md` is the detailed owner. `SKILL.md` routes to it and
  `supervised-delivery-v1.md` references it without policy duplication.
- Do not add dependencies, source runtime code, CLI behavior, README claims,
  package/version metadata, background processes, or host-specific
  orchestration code.
- Canonical and packaged Navi skill files must remain byte-identical.
- Do not modify `docs/navi/calibration-log.md`; it contains user-owned
  uncommitted changes. Do not modify `work/` or Historical Along.
- Verification is intentionally bounded to the two affected skill test files,
  plugin-package verification, mirror checks, scope audit, forbidden-capability
  audit, and diff checks. Do not run full `npm test`, typecheck, release checks,
  or a synthetic calibration task in the implementation worktree.
- If the isolated worktree lacks `node_modules`, one project-local `npm ci` is
  preauthorized for the existing lockfile. It must not change `package.json`,
  `package-lock.json`, global npm state, or dependency policy.
- Use exactly two implementation commits. Run one fresh whole-candidate
  read-only review before review-ready.
- The Source Main Task preauthorizes one fresh Level 2 read-only Validation
  Task for the exact review-ready event and snapshot. Reuse that same validator
  for at most two in-scope remediation re-reviews.
- Validation may not write files, implement fixes, merge, push, tag, release,
  publish, or accept product risk.

## Execution Contract

```text
goal: implement Async Event Reconciliation V1
user_value: missed important task transitions are recovered at the next dependent checkpoint without user relay or progress polling
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit supplied when the worktree task is created
allowed_scope: the exact eight canonical/package skill, reference, and focused-test paths listed below
forbidden_scope: runtime, CLI, dependencies, package/version metadata, README, Historical Along, work/, calibration-log, external projects, global Codex state, merge, push, tag, release, publication
implementation_plan: docs/superpowers/plans/2026-07-17-navi-async-event-reconciliation.md
verification_budget: two focused Vitest files, verify:plugin-package, mirror/scope/forbidden-capability/diff checks; no full test or typecheck
validation_level: 2
validation_preauthorized: true
remediation_limit: 2
stop_conditions: premise-changing plan conflict, new scope or dependency, permission or product-risk decision, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

## Planned Files And Ownership

```text
.agents/skills/navi/SKILL.md
  Routes a dependent control checkpoint for an unresolved relevant task to the
  Lane Handoff reconciliation owner without copying its detailed rules.

.agents/skills/navi/references/lane-handoff-v1.md
  Sole owner of relevance, checkpoints, turn-local state, one-shot inspection,
  result routing, delivery-protocol failure, quietness, and V1 limits.

.agents/skills/navi/references/supervised-delivery-v1.md
  Applies the shared owner to unresolved Execution and Validation Tasks without
  duplicating checkpoint or inspection policy.

plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/lane-handoff-v1.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
  Byte-identical package mirrors of the three canonical files above.

tests/skills/navi-supervision.test.ts
  Locks the detailed Lane Handoff owner and router boundary.

tests/skills/navi-supervised-delivery.test.ts
  Locks Supervised Delivery adoption, one-owner separation, and package mirrors.
```

---

### Task 1: Define Main-Task Reconciliation In The Lane Handoff Owner

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/lane-handoff-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/lane-handoff-v1.md`
- Test: `tests/skills/navi-supervision.test.ts`

**Interfaces:**
- Consumes: existing `Awaiting Direct Event`, Source Main Task routing, event
  identity, and delivery-failure rules in `lane-handoff-v1.md`.
- Produces: one `## Main-Task Reconciliation` policy referenced by Task 2.

- [ ] **Step 1: Replace the old no-poll-only test with a failing reconciliation contract test**

In `tests/skills/navi-supervision.test.ts`, retain the existing Awaiting Direct
Event assertions and extend the test so it loads the canonical router and a new
section:

```ts
it("waits for direct lane events and reconciles only at dependent checkpoints", async () => {
  const [skill, reference, packagedSkill, packagedReference] = await Promise.all([
    readRepoText(".agents/skills/navi/SKILL.md"),
    readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
    readRepoText("plugins/navi/skills/navi/SKILL.md"),
    readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
  ]);
  const awaiting = extractMarkdownSection(reference, "## Awaiting Direct Event");
  const reconciliation = extractMarkdownSection(reference, "## Main-Task Reconciliation");

  expect(awaiting).toMatch(
    /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
  );
  expect(awaiting).toMatch(/workflow state[\s\S]*not a\s+Work Mode/i);
  expect(awaiting).toMatch(/ordinary progress/i);
  expect(awaiting).toMatch(/do not[\s\S]*poll/i);

  for (const boundary of [
    "product premise",
    "acceptance",
    "authorized scope",
    "material risk",
    "temporary global or external state",
    "next real user decision",
    "dependent user decision",
    "create, replace, cancel, or redirect",
    "merge, push, tag, release, or publish",
    "only useful remaining action is waiting",
    "close the affected product lane or session phase",
  ]) {
    expect(reconciliation).toContain(boundary);
  }

  for (const stateField of [
    "task_id",
    "goal",
    "declared_impact",
    "expected_transition",
    "last_handled_event_id",
    "delivery_state",
    "last_reconciliation_reason",
  ]) {
    expect(reconciliation).toContain(stateField);
  }
  for (const deliveryState of [
    "awaiting-direct-event",
    "reconciliation-needed",
    "closed",
  ]) {
    expect(reconciliation).toContain(deliveryState);
  }

  expect(reconciliation).toMatch(/known `task_id`[\s\S]*one-shot[\s\S]*one read-only task inspection/i);
  expect(reconciliation).toMatch(/at most once[\s\S]*one checkpoint/i);
  expect(reconciliation).toMatch(/still running[\s\S]*quiet[\s\S]*must not read it again/i);
  expect(reconciliation).toMatch(/completed[\s\S]*valid event[\s\S]*existing routing/i);
  expect(reconciliation).toMatch(/delivery-protocol-failure[\s\S]*not user authorization/i);
  expect(reconciliation).toMatch(/one bounded re-delivery[\s\S]*same task/i);
  expect(reconciliation).toMatch(/read failure[\s\S]*do not retry in a loop/i);
  expect(reconciliation).toMatch(/duplicate[\s\S]*event_id[\s\S]*silently ignore/i);
  expect(reconciliation).toMatch(/do not ask the user[\s\S]*relay/i);
  expect(reconciliation).toMatch(/turn-local[\s\S]*not[\s\S]*persistent/i);
  expect(reconciliation).toMatch(
    /no further turn[\s\S]*no completion wakeup[\s\S]*cannot reconcile/i,
  );

  for (const forbiddenCapability of [
    "timer",
    "periodic polling",
    "durable queue",
    "daemon",
    "Runtime Surface",
  ]) {
    expect(reconciliation).toContain(forbiddenCapability);
  }

  expect(skill).toMatch(/dependent control checkpoint[\s\S]*unresolved relevant task[\s\S]*lane-handoff-v1\.md/i);
  expect(packagedSkill).toBe(skill);
  expect(packagedReference).toBe(reference);
});
```

Keep one existing assertion that a user-requested task status check remains an
allowed bounded inspection. Do not retain an assertion that makes the three
old exceptions exhaustive; the approved design adds dependent checkpoints.

- [ ] **Step 2: Run the Task 1 test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
```

Expected: FAIL only in the changed test because
`## Main-Task Reconciliation` and the router guardrail do not yet exist.

- [ ] **Step 3: Add the detailed reconciliation owner**

In `.agents/skills/navi/references/lane-handoff-v1.md`, preserve
`## Awaiting Direct Event` and add `## Main-Task Reconciliation` immediately
before `## Source Main Task`. The section must state, in prose rather than a
runtime schema:

```markdown
## Main-Task Reconciliation

Direct task messaging remains the primary path. The Source Main Task keeps
only turn-local context for each unresolved relevant task: `task_id`, `goal`,
`declared_impact`, `expected_transition`, `last_handled_event_id`,
`delivery_state`, and `last_reconciliation_reason`. This is not persistent
state, a task database, or a queue.

`delivery_state` is `awaiting-direct-event` while direct delivery is primary,
`reconciliation-needed` at one dependent checkpoint before inspection, and
`closed` after the recovered or directly delivered transition is handled.

An unresolved task is reconciliation-relevant only when its next transition
may change the product premise, acceptance, authorized scope, material risk,
merge/push/tag/release/publication readiness, temporary global or external
state, or the next real user decision. Ordinary progress and unrelated
exploration do not qualify.

A dependent control checkpoint occurs only before the Main Task presents a
dependent user decision; creates, replaces, cancels, or redirects a related
task; performs a merge, push, tag, release, or publish action on affected work;
claims that the only useful remaining action is waiting; or closes the affected
product lane or session phase. Completing an ordinary design section is not
itself a checkpoint.

At one checkpoint, use the known `task_id` directly. Prefer a host one-shot
completion snapshot or bounded wait when available; otherwise perform one
read-only task inspection. Inspect one relevant task at most once for one
checkpoint. Do not list or search tasks when the identifier is known. A task
that is still running remains quiet and the Main Task must not read it again at
that checkpoint.

If the task completed with a valid event, recover it, deduplicate by
`event_id`, and use the existing routing. If it completed without a valid
event, mark `delivery-protocol-failure`; terminal facts are not user
authorization. Request at most one bounded re-delivery from the same task only
when a required field is missing. Do not ask the user to relay the result and
do not create a duplicate task.

On task unavailability or read failure, do not retry in a loop. Stop a
dependent high-impact action, or continue independent work with the state
unresolved. A duplicate `event_id` is silently ignored.

Successful reconciliation is quiet. Surface only a recovered
decision-changing event, a delivery-protocol failure, or a host capability gap
that prevents a dependent high-impact action. Do not add a timer, periodic
polling, durable queue, watcher, daemon, or Runtime Surface.

When the Main Task receives no further turn and the host exposes no completion
wakeup, V1 cannot reconcile by itself. Keep that limit explicit rather than
claiming background delivery.
```

Adjust the old bounded-inspection paragraph in `## Awaiting Direct Event` so it
keeps the three existing exceptions and points to the new dependent-checkpoint
owner instead of claiming those exceptions are exhaustive. Preserve the rule
that ordinary progress does not authorize `read_thread`, `list_threads`, a
timer, or a polling loop.

- [ ] **Step 4: Add the minimal router guardrail**

In `.agents/skills/navi/SKILL.md`, keep the existing Awaiting Direct Event
guardrail and add one adjacent guardrail:

```markdown
- At a dependent control checkpoint for an unresolved relevant task, Codex must use the one-shot Main-Task Reconciliation policy in `references/lane-handoff-v1.md`; it must not turn reconciliation into ordinary progress polling.
```

Do not copy checkpoint lists, state fields, or result-routing details into
`SKILL.md`.

- [ ] **Step 5: Synchronize the two package mirrors**

Copy the canonical bytes exactly:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
```

- [ ] **Step 6: Run the Task 1 GREEN checks**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
git diff --check
```

Expected: the focused test passes; both `cmp` commands and diff check exit 0.

- [ ] **Step 7: Review and commit Task 1**

Perform one fresh read-only task review against the approved design. The review
must check checkpoint exhaustiveness, non-exhaustive old exceptions, quiet
running behavior, single-owner placement, and no polling/runtime claim.

Then run:

```bash
git diff --name-only
git add \
  .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/lane-handoff-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/lane-handoff-v1.md \
  tests/skills/navi-supervision.test.ts
git commit -m "feat: reconcile missed navi lane events"
```

Expected: exactly the five Task 1 paths are committed.

---

### Task 2: Adopt Reconciliation In Supervised Delivery

**Files:**
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Test: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: Task 1's sole `## Main-Task Reconciliation` owner.
- Produces: Execution and Validation Task lifecycle adoption without duplicated
  checkpoint, state, or inspection policy.

- [ ] **Step 1: Write the failing Supervised Delivery adoption test**

In `tests/skills/navi-supervised-delivery.test.ts`, replace the existing
successful-delivery test with:

```ts
it("uses the shared one-shot reconciliation owner after direct delivery", async () => {
  const [skill, delivery, laneHandoff, packagedSkill, packagedDelivery] =
    await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/references/supervised-delivery-v1.md"),
    ]);
  const lifecycle = extractSection(delivery, "## Lifecycle And Identity");
  const failure = extractSection(delivery, "## Failure Handling");
  const reconciliation = extractSection(laneHandoff, "## Main-Task Reconciliation");

  expect(skill).toMatch(
    /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
  );
  expect(lifecycle).toMatch(
    /Execution Thread[\s\S]*Validation Thread[\s\S]*Awaiting Direct Event/i,
  );
  expect(lifecycle).toMatch(
    /dependent control checkpoint[\s\S]*Main-Task Reconciliation[\s\S]*lane-handoff-v1\.md/i,
  );
  expect(lifecycle).toMatch(/ordinary progress[\s\S]*must not trigger/i);
  expect(failure).toMatch(
    /completed task[\s\S]*valid event[\s\S]*delivery-protocol-failure[\s\S]*not authorization/i,
  );

  for (const detailedOwnerTerm of [
    "last_reconciliation_reason",
    "create, replace, cancel, or redirect",
    "only useful remaining action is waiting",
    "one bounded re-delivery",
  ]) {
    expect(reconciliation).toContain(detailedOwnerTerm);
    expect(delivery).not.toContain(detailedOwnerTerm);
  }

  expect(packagedSkill).toBe(skill);
  expect(packagedDelivery).toBe(delivery);
});
```

- [ ] **Step 2: Run the Task 2 test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL only in the changed test because Supervised Delivery does not
yet name the dependent-checkpoint reconciliation or completed-invalid-delivery
fallback.

- [ ] **Step 3: Add bounded lifecycle adoption**

In `.agents/skills/navi/references/supervised-delivery-v1.md`, update the
Awaiting Direct Event paragraph in `## Lifecycle And Identity` to state:

```markdown
After the Main Thread sends work to an Execution Thread or Validation Thread
and direct task-message delivery succeeds, enter `Awaiting Direct Event` as
defined by `lane-handoff-v1.md`. Do not poll either task for ordinary progress;
continue non-conflicting Main Thread work or let the inbound event resume
routing. Before a dependent control checkpoint, an unresolved relevant task
uses the `Main-Task Reconciliation` policy in `lane-handoff-v1.md`. Ordinary
progress must not trigger reconciliation. The generic owner defines relevance,
checkpoints, inspection budget, quietness, and exit conditions; do not duplicate
or broaden them here.
```

In `## Failure Handling`, add one owner-reference bullet:

```markdown
- A completed task found without a valid event follows Lane Handoff `delivery-protocol-failure`; recovered terminal facts are not authorization, and any bounded re-delivery remains owned by `lane-handoff-v1.md`.
```

Do not add checkpoint lists, state fields, read-tool names, or runtime behavior
to this reference.

- [ ] **Step 4: Synchronize the package mirror**

Run:

```bash
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

- [ ] **Step 5: Run the Task 2 GREEN checks**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
cmp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff --check
```

Expected: the focused test passes; mirror and diff checks exit 0.

- [ ] **Step 6: Review and commit Task 2**

Perform one fresh read-only task review. Confirm that Lane Handoff remains the
sole detailed owner, Supervised Delivery correctly covers both Execution and
Validation Tasks, and ordinary progress still cannot trigger a read.

Then run:

```bash
git diff --name-only HEAD
git add \
  .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md \
  tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: reconcile navi supervised delivery"
```

Expected: exactly the three Task 2 paths are committed.

---

## Final Bounded Verification

- [ ] **Step 1: Run the exact focused acceptance suite**

```bash
npm test -- \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
```

Expected: both files pass.

- [ ] **Step 2: Verify the packaged plugin contract**

```bash
npm run verify:plugin-package
```

Expected: skill tests, manifest validation, and canonical/package drift checks
pass.

- [ ] **Step 3: Verify mirrors, scope, and forbidden capabilities**

```bash
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff --check HEAD~2..HEAD
git diff --name-only HEAD~2..HEAD
git diff HEAD~2..HEAD -- package.json package-lock.json plugins/navi/VERSION.md docs/navi/calibration-log.md work archive/along
if git diff HEAD~2..HEAD -- .agents/skills/navi plugins/navi/skills/navi \
  | rg -n "setInterval|setTimeout|sleep|cron|background service|persistent queue|database|Runtime Surface implementation"; then
  echo "forbidden capability implementation found" >&2
  exit 1
fi
```

Expected:

- all `cmp` and diff-check commands exit 0;
- the changed-path list contains exactly the eight planned paths;
- forbidden-path diff is empty; and
- the forbidden-capability audit exits 0 only when no positive implementation
  match is present. Negative boundary prose may contain `Runtime Surface`; the
  audit intentionally matches only the stronger implementation phrase.

- [ ] **Step 4: Perform one fresh whole-candidate read-only review**

Review the exact two-commit snapshot against the approved design and this
plan. Check design-plan-implementation consistency, one-owner placement,
checkpoint relevance, one-shot budget, quietness, deduplication, user decision
preservation, mirror identity, scope, and no runtime claim.

Critical or Important findings inside the approved scope return to the same
Execution Task for bounded remediation. A premise-changing finding returns to
the Source Main Task. Minor findings are recorded explicitly and do not
automatically expand verification.

- [ ] **Step 5: Send one review-ready event**

The Execution Task sends one conformant bare `NAVI_LANE_HANDOFF_EVENT V1` to
the Source Main Task with:

- exact baseline and reviewed snapshot;
- both implementation commits;
- exact eight-path scope;
- RED/GREEN and final bounded verification evidence;
- whole-candidate review verdict; and
- residual risks, including that natural host behavior is not yet calibrated.

Stop after review-ready. Do not merge, push, release, publish, or start natural
calibration.

## Independent Validation Contract

After a valid review-ready event, the Source Main Task creates exactly one
fresh Level 2 read-only Validation Task for the exact event and snapshot. It
must:

- verify baseline, snapshot, two-commit ancestry, clean state, and exact scope;
- read the design, plan, complete diff, detailed owner, router, adoption
  reference, and focused tests;
- trace direct delivery, dependent checkpoints, one-shot inspection, running
  quietness, completed-invalid-delivery handling, deduplication, and user
  decision boundaries;
- verify canonical/package mirrors;
- distinguish fresh validator evidence from executor-reported automation;
- write no file and install no dependency without a new explicit decision;
- return `accept` or `remediation-required` directly to the Source Main Task;
  and
- stop without merge, push, release, publication, or product-risk acceptance.

An accepted snapshot returns to the Source Main Task for the explicit
integration decision. Post-integration evidence comes from the next natural
multi-task product activity; do not manufacture a dedicated fake task.
