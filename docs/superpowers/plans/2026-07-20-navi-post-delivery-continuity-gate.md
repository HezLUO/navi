# Navi Post-Delivery Continuity Gate V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make accepted bounded delivery run one prompt-backed pre-final continuity check so the Main Thread continues useful authorized work, stops at a real decision, waits meaningfully, or ends naturally without requiring a content-free `continue`.

**Architecture:** Keep `supervision-v1.md` as the sole detailed owner and expose only a hard boundary in `SKILL.md`. Supervised Delivery adopts the owner after accepted delivery without duplicating its schema. Focused Markdown contract tests normalize whitespace, and current product documents record the active-but-uncalibrated state plus the 2026-07-20 negative baseline sample.

**Tech Stack:** Markdown skill contracts, TypeScript, Vitest, npm package verification, Git.

## Global Constraints

- Authoritative design: `docs/superpowers/specs/2026-07-20-navi-post-delivery-continuity-gate-design.md`.
- Exact implementation baseline is the plan commit created before Task 1 begins.
- Implementation consists of exactly three local task commits and the exact 14 paths listed below.
- `supervision-v1.md` remains the sole detailed owner of the continuity schema, decision order, conflict rules, quietness, and failure semantics.
- `lane-handoff-v1.md`, `model-routing-v1.md`, and their tests are read-only for this implementation.
- Canonical/package skill files changed by this plan must remain byte-identical.
- No dependency, package metadata, source runtime, CLI, MCP, UI, Runtime Surface, Main Turn Host Adapter, background process, queue, watcher, scheduler, or database change.
- No automatic implementation, task/worktree creation, external write, Git action, validation-budget increase, release, or publication authority.
- `plan_satisfiability_check: required` before dispatch and before production edits.
- `plan_artifact_correction: bounded`: one batch of test-only, whitespace-safe, semantics-preserving corrections may proceed without another user prompt; semantic, scope, permission, risk, acceptance, or verification changes return `decision-required`.
- Markdown semantic assertions replace vertical bars and backticks with spaces, then normalize whitespace before phrase matching; natural line wrapping must not determine pass/fail.
- If `node_modules` is absent in a clean isolated Execution worktree with unchanged `package.json` and `package-lock.json`, one project-local `npm ci` attempt is preauthorized. No retry, `npm install`, audit fix, lockfile change, global npm change, shell-profile change, credential change, or external-project change.
- Execution route floor: `standard + medium`; resolve one host-supported concrete model at dispatch, prefer GPT-5.6 Terra, and use GPT-5.4 as the compatible current fallback. The Route Application Gate must pass before task creation.
- Validation Level: 2 with route floor `standard + high`; derive it independently from Execution and pass the Route Application Gate before creating the one fresh validator.
- Validation is read-only, installs no dependencies, and writes no files.
- At most two in-scope remediation rounds return to the same Validation Task.
- Execution and Validation must deliver structured results directly to the Source Main Task; a result printed only in the task itself is not delivery.
- Do not merge, push, tag, release, publish, edit external projects, or change global Codex state.

## Planned Files

Task 1:

- Modify: `.agents/skills/navi/references/supervision-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md`
- Modify: `tests/skills/navi-supervision.test.ts`

Task 2:

- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`

Task 3:

- Modify: `docs/navi/calibration-log.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `tests/repository/current-surface.test.ts`

---

### Task 1: Define The Post-Delivery Continuity Owner

**Files:**

- Modify: `.agents/skills/navi/references/supervision-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md`
- Modify: `tests/skills/navi-supervision.test.ts`

**Interfaces:**

- Consumes: existing Alpha 5 pause semantics, Waiting Scope, Next Decision Visibility, Awaiting Direct Event references, and the approved design.
- Produces: one `## Post-Delivery Continuity Gate` owner section with the turn-local schema, exact decision order, conflict/authority boundaries, quietness, and failure handling.

- [ ] **Step 1: Add a whitespace-normalization helper and focused failing contract test**

Add this helper after `extractMarkdownSection` in `tests/skills/navi-supervision.test.ts`:

```ts
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[|`]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
```

Add this test near the existing Alpha 5 pause-semantics test:

```ts
it("gates terminal delivery on one turn-local continuity decision", async () => {
  const [canonical, packaged] = await Promise.all([
    readRepoText(".agents/skills/navi/references/supervision-v1.md"),
    readRepoText("plugins/navi/skills/navi/references/supervision-v1.md"),
  ]);
  const section = extractMarkdownSection(
    canonical,
    "## Post-Delivery Continuity Gate",
  );
  const normalized = normalizeWhitespace(section);

  for (const field of [
    "NAVI_POST_DELIVERY_CONTINUITY",
    "version: 1",
    "completed_boundary",
    "source_task_state",
    "highest_priority_candidate",
    "candidate_class",
    "conflict_state",
    "authority_state",
    "result",
    "stop_point",
  ]) {
    expect(section).toContain(field);
  }

  expect(normalized).toContain(
    "Before the Main Thread emits a terminal response after accepted bounded delivery",
  );
  expect(normalized).toContain(
    "Bounded-task completion is not wider source-task completion",
  );
  const decisionOrder = [
    "Continue an already-approved action",
    "Handle a premise-changing event",
    "Continue useful non-conflicting work",
    "Stop at a real decision",
    "Enter a meaningful wait",
    "End naturally",
  ];
  for (const phrase of decisionOrder) expect(normalized).toContain(phrase);
  for (let index = 1; index < decisionOrder.length; index += 1) {
    expect(normalized.indexOf(decisionOrder[index - 1])).toBeLessThan(
      normalized.indexOf(decisionOrder[index]),
    );
  }
  expect(normalized).toContain(
    "wait requires every useful action to depend on an unresolved relevant event",
  );
  expect(normalized).toContain(
    "end requires the wider source objective to be complete",
  );
  expect(normalized).toMatch(
    /do not print the schema.*announce that the gate passed.*add a Progress Map/i,
  );
  expect(normalized).toMatch(
    /must not.*implementation.*task.*worktree.*external.*commit.*push.*release/i,
  );
  expect(normalized).toMatch(
    /not.*runtime.*database.*daemon.*scheduler.*queue.*watcher.*background service/i,
  );
  expect(packaged).toBe(canonical);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
```

Expected: FAIL only because `## Post-Delivery Continuity Gate` and its required contract are absent. Existing supervision tests remain green.

- [ ] **Step 3: Add the minimal canonical owner section**

Insert this section in `.agents/skills/navi/references/supervision-v1.md` after the Alpha 5 pause-semantics rules and before the next alpha layer:

```markdown
## Post-Delivery Continuity Gate

Before the Main Thread emits a terminal response after accepted bounded
delivery, run one turn-local continuity check. Bounded-task completion is not
wider source-task completion. A completion report alone is not evidence that
the Main Thread should stop.

NAVI_POST_DELIVERY_CONTINUITY
version: 1
completed_boundary: concise accepted delivery
source_task_state: active | complete | uncertain
highest_priority_candidate: concrete action or none
candidate_class: covered-action | read-only-design | read-only-supervision | real-decision | dependent-wait | natural-end
conflict_state: none | file-scope | premise | acceptance | lane | unknown
authority_state: covered | user-required | none
result: continue | decision-required | wait | end
stop_point: next concrete acceptance or decision boundary

The record is ephemeral turn-local coordination evidence. Do not print it by
default or persist it in project files, `.navi`, `AGENTS.md`, or global state.

Apply this order exactly once:

1. Continue an already-approved action to its declared acceptance point.
2. Handle a premise-changing event before unrelated work.
3. Continue useful non-conflicting work when one concrete high-priority
   read-only design or supervision action remains.
4. Stop at a real decision and name the action, boundary, consequence, and
   recommendation; do not offer bare `continue`.
5. Enter a meaningful wait only when wait requires every useful action to
   depend on an unresolved relevant event.
6. End naturally only when end requires the wider source objective to be
   complete and no user-relevant decision remains.

Conflict or user-required authority prevents `continue`. The Main Thread must
not start implementation, create a task or worktree, change external state,
commit, push, tag, release, publish, expand scope, or increase verification
budget through this gate. It must not manufacture low-priority cleanup,
unrelated features, extra validation, or speculative runtime work merely to
avoid waiting or ending.

Awaiting Direct Event remains the no-polling state. Before claiming `wait` or
closing an affected lane with an unresolved relevant task, use the existing
one-shot Main-Task Reconciliation checkpoint. Task creation remains separately
subject to the Route Application Gate.

A successful ordinary check is quiet: do not print the schema, announce that
the gate passed, or add a Progress Map merely because delivery completed.
Missing the check when the user must provide a content-free `continue` is a
supervision-protocol failure and should become calibration evidence.

This prompt/docs-backed gate is not runtime, a database, daemon, scheduler,
queue, watcher, or background service. Repeated natural failures are evidence
for later Host Adapter or Runtime Surface judgment, not implementation
authority.
```

Copy the canonical file byte-for-byte to `plugins/navi/skills/navi/references/supervision-v1.md`.

- [ ] **Step 4: Run the focused GREEN and mirror checks**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts
cmp .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md
git diff --check
```

Expected: focused test PASS; `cmp` and diff check exit 0 silently.

- [ ] **Step 5: Obtain one fresh read-only Task 1 review**

The reviewer checks the exact Task 1 diff for schema completeness, decision-order preservation, authority safety, no duplicate owner, quietness, and whitespace-safe assertions. Any Critical or Important finding returns to the Task 1 implementer before commit.

- [ ] **Step 6: Commit Task 1**

```bash
git add .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md tests/skills/navi-supervision.test.ts
git commit -m "feat: gate navi post-delivery continuity"
```

---

### Task 2: Adopt The Gate At Main And Supervised-Delivery Boundaries

**Files:**

- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**

- Consumes: Task 1 `## Post-Delivery Continuity Gate` owner.
- Produces: a top-level hard boundary and one Supervised Delivery adoption point after accepted delivery, without copying the schema or decision order.

- [ ] **Step 1: Add failing SKILL and Supervised Delivery adoption tests**

Add this test to `tests/skills/navi-skill.test.ts`:

```ts
it("requires post-delivery continuity without duplicating its schema", async () => {
  const skill = normalizeWhitespace(
    await readRepoText(".agents/skills/navi/SKILL.md"),
  );

  expect(skill).toContain(
    "Before ending a Main Thread turn after accepted bounded delivery, Codex must apply the Post-Delivery Continuity Gate",
  );
  expect(skill).toContain(
    "must not treat bounded-task completion as automatic source-task closure",
  );
  expect(skill).not.toContain("NAVI_POST_DELIVERY_CONTINUITY version: 1");
});
```

Add this test to `tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("adopts post-delivery continuity after accepted validation", async () => {
  const [delivery, supervision, packagedDelivery] = await Promise.all([
    readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
    readRepoText(".agents/skills/navi/references/supervision-v1.md"),
    readRepoText(
      "plugins/navi/skills/navi/references/supervised-delivery-v1.md",
    ),
  ]);
  const lifecycle = normalizeWhitespace(
    extractSection(delivery, "## Lifecycle And Identity"),
  );

  expect(lifecycle).toContain(
    "After accepted validation closes the bounded delivery, the Main Thread applies the Post-Delivery Continuity Gate before a terminal response",
  );
  expect(lifecycle).toContain(
    "supervision-v1.md remains the detailed owner",
  );
  expect(delivery).not.toContain("NAVI_POST_DELIVERY_CONTINUITY");
  expect(supervision).toContain("NAVI_POST_DELIVERY_CONTINUITY");
  expect(packagedDelivery).toBe(delivery);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts tests/skills/navi-supervised-delivery.test.ts
```

Expected: exactly the new adoption assertions fail; existing skill and delivery behavior stays green.

- [ ] **Step 3: Add the top-level hard boundary**

Add this hard-boundary sentence to `.agents/skills/navi/SKILL.md` beside the existing completion and next-decision rules:

```markdown
- Before ending a Main Thread turn after accepted bounded delivery, Codex must apply the Post-Delivery Continuity Gate in `references/supervision-v1.md`; it must not treat bounded-task completion as automatic source-task closure, manufacture low-priority work, or bypass a real user decision.
```

Copy `.agents/skills/navi/SKILL.md` byte-for-byte to `plugins/navi/skills/navi/SKILL.md`.

- [ ] **Step 4: Add the Supervised Delivery adoption sentence**

In `## Lifecycle And Identity` of `.agents/skills/navi/references/supervised-delivery-v1.md`, add:

```markdown
After accepted validation closes the bounded delivery, the Main Thread applies
the Post-Delivery Continuity Gate before a terminal response;
`supervision-v1.md` remains the detailed owner. This does not authorize a new
task, implementation, merge, push, release, or publication action.
```

Copy the canonical file byte-for-byte to `plugins/navi/skills/navi/references/supervised-delivery-v1.md`.

- [ ] **Step 5: Run the focused GREEN and mirror checks**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff --check
```

Expected: three files PASS; mirror and diff checks exit 0 silently.

- [ ] **Step 6: Obtain one fresh read-only Task 2 review**

The reviewer checks that the hard boundary points to one owner, Supervised Delivery invokes the gate only after accepted delivery, no schema is duplicated, task creation remains separately authorized, and existing direct-event/remediation behavior is unchanged.

- [ ] **Step 7: Commit Task 2**

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-skill.test.ts tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: enforce navi post-delivery continuity"
```

---

### Task 3: Record The Negative Sample And Activate The Current Boundary

**Files:**

- Modify: `docs/navi/calibration-log.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**

- Consumes: accepted Task 1 and Task 2 contracts plus the 2026-07-20 negative sample.
- Produces: truthful active-but-uncalibrated product authority and repository assertions without claiming Product Complete.

- [ ] **Step 1: Add a failing current-surface test**

Add this test to `tests/repository/current-surface.test.ts`:

```ts
it("records post-delivery continuity as implemented but uncalibrated", async () => {
  const [history, roadmap, debt, calibration] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
  ]);

  expect(history).toMatch(
    /Post-Delivery Continuity Gate V1[\s\S]*implemented[\s\S]*natural calibration/i,
  );
  expect(history).toContain(
    "`docs/superpowers/specs/2026-07-20-navi-post-delivery-continuity-gate-design.md`",
  );
  expect(history).toContain(
    "`docs/superpowers/plans/2026-07-20-navi-post-delivery-continuity-gate.md`",
  );
  expect(roadmap).toMatch(
    /Post-Delivery Continuity Gate V1[\s\S]*pre-final[\s\S]*naturally uncalibrated/i,
  );
  expect(debt).toMatch(
    /Task Route Application Gate V1[\s\S]*completion report[\s\S]*content-free `continue`/i,
  );
  expect(calibration).toContain(
    "## 2026-07-20 - Accepted Gate Delivery Still Required Continue",
  );
  expect(calibration).toMatch(
    /negative baseline[\s\S]*user relay count: 0[\s\S]*meaningless continue count: 1/i,
  );
  expect(roadmap).not.toMatch(/Product Complete is closed/i);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: only the new continuity current-surface test fails.

- [ ] **Step 3: Add the exact calibration entry**

Add this entry near the top of `docs/navi/calibration-log.md`:

```markdown
## 2026-07-20 - Accepted Gate Delivery Still Required Continue

Mode: implementation closeout and supervision
Status: negative baseline; Post-Delivery Continuity Gate V1 implemented but natural calibration pending

Task Route Application Gate V1 reached an exact accepted snapshot. Its focused
tests, typecheck, package verification, scope audit, and independent Level 2
validation passed. The Validation Task used an explicit accepted model and
reasoning route, so user relay count was 0.

The Main Thread then emitted a terminal completion report while the wider Navi
product lane remained active. The user supplied a content-free `continue` and
identified it as meaningless. Meaningless continue count: 1.

This is a negative baseline, not a passing Product Complete sample. The missing
action was one pre-final continuity check: continue the highest-priority
non-conflicting supervision work, stop at a real decision, wait meaningfully,
or end only when the wider objective is complete.
```

- [ ] **Step 4: Synchronize current design, roadmap, and debt authority**

Update `docs/navi/design-history.md` to list the design and plan under `## Active` and state:

```markdown
Post-Delivery Continuity Gate V1 is implemented as the prompt/docs-backed
pre-final boundary after accepted bounded delivery. Natural calibration remains
open; it does not implement Runtime Surface or Main Turn Host Adapter behavior.
```

Update `docs/navi/roadmap.md` current phase with:

```markdown
Post-Delivery Continuity Gate V1 adds one pre-final Main Thread check after
accepted bounded delivery. It is naturally uncalibrated and does not close the
remaining joint Product Complete gate by itself.
```

Extend Continuation Friction And Pause Reason Debt in `docs/navi/product-debt.md` with:

```markdown
After Task Route Application Gate V1 was implemented and independently
accepted, the Main Thread returned only a completion report. The wider product
lane remained active, but the user had to provide a content-free `continue` to
restart non-conflicting supervision. This is evidence that descriptive pause
rules need one pre-final application gate; it is not evidence for automatic
implementation or Runtime Surface authority.
```

- [ ] **Step 5: Run Task 3 GREEN and current-doc checks**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
git diff --check
```

Expected: current-surface tests PASS; diff check exits 0 silently.

- [ ] **Step 6: Obtain one fresh read-only Task 3 review**

The reviewer checks dates, exact sample counts, active design/plan authority, Product Complete truthfulness, and absence of Runtime or release claims.

- [ ] **Step 7: Commit Task 3**

```bash
git add docs/navi/calibration-log.md docs/navi/design-history.md docs/navi/product-debt.md docs/navi/roadmap.md tests/repository/current-surface.test.ts
git commit -m "docs: activate navi post-delivery continuity"
```

---

## Final Bounded Verification

- [ ] **Step 1: Run the exact focused acceptance suite**

```bash
npm test -- tests/skills/navi-supervision.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: all selected files and tests PASS.

- [ ] **Step 2: Run type and package verification**

```bash
npm run typecheck
npm run verify:plugin-package
```

Expected: typecheck PASS; plugin manifest, all skill tests, and source/package drift verification PASS.

- [ ] **Step 3: Verify exact mirrors**

```bash
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: all commands exit 0 silently.

- [ ] **Step 4: Audit commit count, scope, and forbidden paths**

Record the exact implementation baseline as `IMPLEMENTATION_BASE` before Task 1. Then run:

```bash
git rev-list --count "$IMPLEMENTATION_BASE"..HEAD
git diff --name-only "$IMPLEMENTATION_BASE"..HEAD
git diff --check "$IMPLEMENTATION_BASE"..HEAD
git diff --exit-code "$IMPLEMENTATION_BASE"..HEAD -- package.json package-lock.json plugins/navi/VERSION.md src scripts .agents/plugins .codex archive work .agents/skills/navi/references/lane-handoff-v1.md .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/model-routing-v1.md
git status --short
```

Expected: exactly 3 commits; exactly the 14 planned paths; both diff checks exit 0; status is clean except the pre-existing untracked `work/` path.

- [ ] **Step 5: Run a fresh whole-candidate read-only review**

Review the exact three-commit candidate against the approved design and this plan. The review must inspect all 14 paths, owner/adoption boundaries, test meaning, negative sample truthfulness, Product Complete boundary, mirrors, and forbidden capabilities. Critical or Important findings prevent review-ready.

- [ ] **Step 6: Emit one direct review-ready event**

The Execution Task sends one `NAVI_LANE_HANDOFF_EVENT V1` directly to the Source Main Task with:

- exact baseline and reviewed snapshot;
- all three commits and 14 changed paths;
- `plan_check: exact | corrected` plus any bounded correction evidence;
- executor verification results;
- review findings and residual risks;
- `delivery_attempts` and `delivery_state`; and
- no merge, push, tag, release, publication, or Product Complete authorization.

- [ ] **Step 7: Create one independent Level 2 Validation Task**

The Main Thread independently resolves a `standard + high` route, passes the Route Application Gate with explicit host model and reasoning arguments, and creates one read-only Validation Task for the exact snapshot. Reuse that task for at most two bounded remediation re-reviews.

- [ ] **Step 8: Apply the new continuity behavior at acceptance**

After accepted validation, do not end with only a completion report. Run the Post-Delivery Continuity Gate against the still-active Navi product lane. Continue one useful non-conflicting action or stop at one concrete user-owned decision. Record whether this natural journey achieved user relay count 0 and meaningless continue count 0; do not self-certify Product Complete without user judgment.
