# Navi Awaiting Direct Event Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Execute it
> in one true Codex-managed isolated worktree. Steps use checkbox (`- [ ]`)
> syntax for tracking.

**Goal:** Prevent Navi's Main Thread from polling a Codex task after successful
direct task-message delivery while preserving explicit, bounded status checks
for the few cases that provide real user control.

**Architecture:** `lane-handoff-v1.md` remains the sole owner of the generic
post-delivery lifecycle and defines `Awaiting Direct Event` as a workflow state,
not a Work Mode or runtime service. `supervised-delivery-v1.md` and the Navi
router adopt that state without duplicating its exception policy. Static
contract tests lock the transition, prohibited monitoring calls, three bounded
exceptions, package mirrors, and the no-runtime boundary.

**Tech Stack:** Markdown skill contracts, TypeScript, Vitest, Navi's canonical
and packaged plugin mirrors, Codex host task messaging.

## Global Constraints

- This is a bounded Implementation-mode contract correction. It is not Release
  mode and does not authorize tag, push, release, publication, or target-project
  writes.
- `Awaiting Direct Event` is a workflow state. It is not a fifth Work Mode, a
  Product Stage, a scheduler, a watcher, a notification service, a queue, or a
  Runtime Surface.
- Successful direct task-message delivery is the entry condition. The Main
  Thread must not call `read_thread`, `list_threads`, `wait_agent`, schedule a
  timer, or create another polling mechanism merely to observe ordinary
  progress.
- While awaiting a direct event, the Main Thread continues useful
  non-conflicting design or supervision. If none exists, it ends the current
  turn and relies on direct inbound task messaging.
- One bounded inspection is allowed only when the user explicitly requests
  task status, the host reports task-message delivery failure or messaging is
  unavailable, or the approved contract declares a concrete safety deadline
  for temporary external/global state. An exception never authorizes a loop.
- An inbound event, an allowed one-shot inspection result, or a reported
  delivery failure exits `Awaiting Direct Event` and returns control to normal
  Lane Handoff routing.
- Do not weaken existing duplicate-event handling, validation identity,
  remediation limits, user decision boundaries, or non-conflicting-main-work
  rules.
- Do not add dependencies, source runtime code, CLI behavior, background
  processes, persistent task state, timers, or host-specific orchestration
  code.
- Canonical and packaged Navi skill files must remain byte-identical.
- Do not modify `docs/navi/calibration-log.md`; it contains user-owned
  uncommitted changes. The Main Thread records the observed polling sample in a
  separate, explicitly authorized closeout after this implementation.
- Do not modify `work/`, `archive/along`, package metadata, version metadata,
  README files, release notes, or distribution artifacts.
- Verification is intentionally bounded to the two affected skill test files,
  plugin-package verification, mirror checks, scope audit, and diff checks. Do
  not run full `npm test`, typecheck, release checks, or real-project
  calibration in the implementation worktree.
- If the isolated worktree lacks `node_modules`, project-local `npm ci` is
  preauthorized for this trusted Navi baseline and existing lockfile. It must
  not change `package.json`, `package-lock.json`, global npm state, or dependency
  policy; host sandbox or network approval remains authoritative.

---

## Planned Files And Ownership

```text
.agents/skills/navi/SKILL.md
  Top-level router guardrail that enters the detailed owner after successful
  direct task-message delivery.

.agents/skills/navi/references/lane-handoff-v1.md
  Sole owner of Awaiting Direct Event entry, allowed behavior, exceptions, and
  exit conditions.

.agents/skills/navi/references/supervised-delivery-v1.md
  Applies the generic state to Execution and Validation Thread transitions.

plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/lane-handoff-v1.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
  Byte-identical packaged mirrors of the three canonical owners.

tests/skills/navi-supervision.test.ts
  Locks the generic Lane Handoff state and its non-runtime boundaries.

tests/skills/navi-supervised-delivery.test.ts
  Locks Main Thread adoption after Execution/Validation messages and prevents
  the existing failure-only polling assertion from being mistaken for the
  complete lifecycle rule.
```

No other changed path is allowed.

## Execution Contract

```text
goal: implement Awaiting Direct Event as the post-delivery Main Thread state
user_value: users do not watch Codex repeatedly inspect tasks that already have direct event delivery
baseline: exact clean main commit supplied when the worktree task is created
allowed_scope: the exact eight files in Planned Files And Ownership
forbidden_scope: runtime, CLI, dependencies, docs/navi/calibration-log.md, work/, archive/along, README, version, release, publication, external projects, global Codex state
implementation_plan: docs/superpowers/plans/2026-07-17-navi-awaiting-direct-event.md
verification_budget: two affected Vitest files, verify:plugin-package, mirror/scope/diff checks; no full test or typecheck
validation_level: 2
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

## Worktree Preflight

Before editing, run:

```bash
git status --short --branch
git rev-parse HEAD | tee /tmp/navi-awaiting-direct-event-baseline.txt
test -f package-lock.json
```

Expected: the isolated worktree is clean, the baseline file contains the exact
delegated commit, and the lockfile exists.

If `node_modules` is absent, run the preauthorized local restore:

```bash
npm ci
git diff --exit-code -- package.json package-lock.json
```

Expected: dependencies are available only in the worktree and package metadata
is unchanged. A registry, lifecycle-script, package-metadata, or lockfile
deviation is a real stop condition.

### Task 1: Define The Generic Post-Delivery State

**Files:**
- Modify: `.agents/skills/navi/references/lane-handoff-v1.md`
- Modify: `plugins/navi/skills/navi/references/lane-handoff-v1.md`
- Modify: `tests/skills/navi-supervision.test.ts`

**Interfaces:**
- Consumes: successful host task-message delivery and the existing Lane
  Handoff source-task routing contract.
- Produces: one canonical `## Awaiting Direct Event` section with entry,
  permitted behavior, exceptions, and exit conditions.

- [ ] **Step 1: Add a failing contract test**

Add this test after the existing unified Lane Handoff contract test in
`tests/skills/navi-supervision.test.ts`:

```ts
it("waits for direct lane events without polling task chat", async () => {
  const [reference, packagedReference] = await Promise.all([
    readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
    readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
  ]);
  const awaiting = extractMarkdownSection(
    reference,
    "## Awaiting Direct Event",
  );

  expect(awaiting).toMatch(
    /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
  );
  expect(awaiting).toMatch(/workflow state[\s\S]*not a Work Mode/i);
  for (const forbidden of [
    "read_thread",
    "list_threads",
    "wait_agent",
    "timer",
    "polling loop",
  ]) {
    expect(awaiting).toContain(forbidden);
  }
  expect(awaiting).toMatch(/continue[\s\S]*non-conflicting/i);
  expect(awaiting).toMatch(
    /no useful non-conflicting work[\s\S]*end the current turn[\s\S]*direct inbound event/i,
  );
  expect(awaiting).toMatch(
    /user explicitly requests[\s\S]*delivery failure[\s\S]*safety deadline/i,
  );
  expect(awaiting).toMatch(/one bounded inspection[\s\S]*not a loop/i);
  expect(awaiting).toMatch(
    /inbound event[\s\S]*inspection result[\s\S]*delivery failure[\s\S]*exits/i,
  );
  expect(packagedReference).toBe(reference);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
```

Expected: FAIL only in `waits for direct lane events without polling task
chat` because `## Awaiting Direct Event` is absent.

- [ ] **Step 3: Add the minimal canonical contract**

Insert this section between `## Delivery, Retry, And Fallback` and
`## Source Main Task` in
`.agents/skills/navi/references/lane-handoff-v1.md`:

```markdown
## Awaiting Direct Event

After successful direct task-message delivery to a live Codex task, the sender
enters `Awaiting Direct Event` for that lane. This is a workflow state, not a
Work Mode, Product Stage, scheduler, watcher, notification service, queue, or
Runtime Surface.

While this state is active, do not call `read_thread`, `list_threads`,
`wait_agent`, schedule a timer, or build a polling loop merely to observe
ordinary progress. Continue useful non-conflicting design or supervision. If
no useful non-conflicting work remains, end the current turn and wait for the
direct inbound event.

One bounded inspection is allowed only when the user explicitly requests task
status, the host reports task-message delivery failure or messaging is
unavailable, or the approved contract declares a concrete safety deadline for
temporary external or global state. An allowed inspection is one-shot evidence,
not a loop, recurring timer, or substitute for direct delivery.

An inbound event, an allowed inspection result, or a reported delivery failure
exits `Awaiting Direct Event` and returns the lane to ordinary Source Main Task
routing. Silence is not new evidence, user approval, a blocker, or permission
to expand scope.
```

Synchronize the packaged mirror mechanically:

```bash
cp .agents/skills/navi/references/lane-handoff-v1.md \
  plugins/navi/skills/navi/references/lane-handoff-v1.md
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
```

Expected: PASS with the repository's current test count for this file plus the
new test.

- [ ] **Step 5: Audit and commit Task 1**

Run:

```bash
git diff --check
git diff --name-only
cmp .agents/skills/navi/references/lane-handoff-v1.md \
  plugins/navi/skills/navi/references/lane-handoff-v1.md
```

Expected: exactly the three Task 1 files are changed; diff and mirror checks
pass.

Commit:

```bash
git add \
  .agents/skills/navi/references/lane-handoff-v1.md \
  plugins/navi/skills/navi/references/lane-handoff-v1.md \
  tests/skills/navi-supervision.test.ts
git commit -m "fix: await direct navi lane events"
```

### Task 2: Apply The State To Supervised Delivery

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: `Awaiting Direct Event` from `lane-handoff-v1.md`.
- Produces: explicit Main Thread adoption after sending Execution or Validation
  work, with no duplicate exception policy.

- [ ] **Step 1: Add failing router and lifecycle assertions**

Add this test before the existing failure-handling test in
`tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("routes successful delivery into the shared no-poll waiting state", async () => {
  const [skill, delivery, packagedSkill, packagedDelivery] = await Promise.all([
    readRepoText(".agents/skills/navi/SKILL.md"),
    readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
    readRepoText("plugins/navi/skills/navi/SKILL.md"),
    readRepoText(
      "plugins/navi/skills/navi/references/supervised-delivery-v1.md",
    ),
  ]);
  const lifecycle = extractSection(delivery, "## Lifecycle And Identity");

  expect(skill).toMatch(
    /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
  );
  expect(lifecycle).toMatch(
    /Execution Thread[\s\S]*Validation Thread[\s\S]*Awaiting Direct Event/i,
  );
  expect(lifecycle).toMatch(
    /lane-handoff-v1\.md[\s\S]*do not poll[\s\S]*inbound event/i,
  );
  expect(packagedSkill).toBe(skill);
  expect(packagedDelivery).toBe(delivery);
});
```

- [ ] **Step 2: Run both affected tests and confirm RED**

Run:

```bash
npm test -- \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
```

Expected: Task 1 remains green; the new Task 2 test fails because the router
and Supervised Delivery lifecycle do not yet name the shared state.

- [ ] **Step 3: Add the minimal router guardrail**

In `.agents/skills/navi/SKILL.md`, add this hard boundary immediately after the
existing external-lane polling boundary:

```markdown
- After successful direct task-message delivery, Codex must enter the `Awaiting Direct Event` state owned by `references/lane-handoff-v1.md`; it must not poll the task for ordinary progress.
```

- [ ] **Step 4: Apply the shared state in Supervised Delivery**

In `## Lifecycle And Identity` of
`.agents/skills/navi/references/supervised-delivery-v1.md`, add this paragraph
after the executor-validator reuse paragraph:

```markdown
After the Main Thread sends work to an Execution Thread or Validation Thread
and direct task-message delivery succeeds, enter `Awaiting Direct Event` as
defined by `lane-handoff-v1.md`. Do not poll either task for ordinary progress;
continue non-conflicting Main Thread work or let the inbound event resume
routing. The generic owner defines every bounded inspection exception and exit
condition; do not duplicate or broaden them here.
```

Synchronize the two packaged mirrors mechanically:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

- [ ] **Step 5: Run bounded GREEN verification**

Run:

```bash
npm test -- \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
npm run verify:plugin-package
```

Expected: both focused test files pass; plugin-package verification passes its
skill tests, manifest validation, and source/package drift check.

- [ ] **Step 6: Audit and commit Task 2**

Run:

```bash
git diff --check
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff HEAD~1 --name-only
```

Expected: Task 2 changes exactly its five listed files; diff and mirror checks
pass.

Commit:

```bash
git add \
  .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md \
  tests/skills/navi-supervised-delivery.test.ts
git commit -m "fix: stop navi task polling"
```

## Final Bounded Verification

After both task commits exist, run exactly:

```bash
BASELINE="$(cat /tmp/navi-awaiting-direct-event-baseline.txt)"
npm test -- \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
npm run verify:plugin-package
git diff --check "$BASELINE"..HEAD
git diff --name-only "$BASELINE"..HEAD
git rev-list --count "$BASELINE"..HEAD
git status --short --branch
```

Expected:

- the two focused test files pass;
- plugin-package verification passes;
- exactly two implementation commits exist;
- exactly the eight planned files changed;
- canonical/package skill and owner mirrors are byte-identical;
- `docs/navi/calibration-log.md`, `work/`, runtime source, CLI, dependencies,
  README, version, distribution, release, and Historical Along are untouched;
- the worktree is clean.

Run one fresh whole-candidate read-only review against this plan. Critical or
Important findings inside the approved scope may use at most two bounded
remediation rounds. Then emit one conformant `NAVI_LANE_HANDOFF_EVENT V1`
`review-ready` event with the exact snapshot.

The Main Thread creates one fresh Level 2 Validation Thread for that exact
snapshot. The Validation Thread reads the plan, all eight changed paths, the
two test files, mirror evidence, and the executor's bounded verification. It
does not install dependencies merely to repeat green tests, and it does not
write files. Acceptance returns to the Main Thread; merge, push, release, and
calibration remain separate decisions.

## Post-Integration Natural Calibration

Do not perform this inside the implementation worktree. After explicit merge
or integration approval, use the next genuine bounded Codex task that already
needs direct Lane Handoff delivery. The Main Thread sends one bounded action,
then enters `Awaiting Direct Event` without reading the task.

Acceptance evidence:

```text
direct event delivered: yes
Main Thread read_thread/list_threads/wait_agent calls while awaiting: 0
user transcript relay: 0
meaningless continue prompts: 0
duplicate task or validator creation: 0
real permission/scope/risk decisions preserved: yes
```

One successful natural sample is enough to close this correction. Failure
returns to Design mode at the smallest observed boundary; it does not trigger
full tests, a release checklist, Runtime Surface implementation, or repeated
calibration runs.
