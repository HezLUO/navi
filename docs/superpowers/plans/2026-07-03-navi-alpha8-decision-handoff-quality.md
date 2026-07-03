# Navi Alpha 8 Decision Handoff Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.8 Decision Handoff Quality guidance so Navi stops with a useful recommendation, real decision options, closure, or a blocked reason instead of leaving the user with only a bare completion report.

**Architecture:** Keep this as a docs-backed prompt behavior update. Add failing text assertions first, update the canonical skill and reference, update project-local trigger text and `navi init` generated text, sync the plugin package copy, then run targeted verification. Do not add runtime UI, automatic orchestration, Memory v2, adapters, release automation, npm publication, or marketplace behavior.

**Tech Stack:** Markdown skill docs, TypeScript CLI string rendering, Vitest text assertions, existing plugin package verification script.

---

## Navi-Specific Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Start the implementation worktree from current `main`, which includes:

```text
849b5a2 docs: add navi alpha 8 decision handoff design
b72a7cb docs: align navi public narrative
```

Do not tag, release, publish to npm, update GitHub Releases, run full release checklists, modify `src/web`, modify external target projects, change package ids, create runtime/thread orchestration, or expand this into a stronger persistent execution contract.

Allowed validation:

- `npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts`
- `npm run verify:plugin-package`
- `git diff --check`

Do not run the full test suite or typecheck unless a targeted failure proves this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/skills/along-working-thread-skill.test.ts`
  - Adds a targeted alpha.8 text test for canonical skill, canonical reference, and project trigger template.
- `tests/cli/navi-init.test.ts`
  - Adds a targeted generated-`AGENTS.md` test proving `navi init` installs alpha.8 handoff rules.
- `.agents/skills/along-working-thread/SKILL.md`
  - Adds concise alpha.8 behavior guardrails to the canonical skill entrypoint.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Adds the full alpha.8 reference section after alpha.7 and before Progress Map guidance.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds concise project-local alpha.8 trigger guidance.
- `src/cli/navi-init.ts`
  - Keeps the generated project-local `AGENTS.md` block in sync with the trigger template.
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact sync copy of the canonical skill.
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact sync copy of the canonical reference.

Do not modify:

- `src/web/**`
- runtime server/MCP files
- release notes or GitHub Release bodies
- README files
- package ids, skill ids, or CLI aliases
- external target projects
- untracked `work/`

---

### Task 1: Add Failing Alpha.8 Text Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add the canonical skill/reference/template test**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test after the existing `"documents alpha 7 coordination layer supervision"` test and before `"documents the Navi Project Map model and source priority"`:

```ts
  it("documents alpha 8 decision handoff quality", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.8 decision handoff quality",
      "Completion is not always a handoff",
      "Stop with a decision, a recommendation, or closure",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "bare completion report",
      "real next decision",
      "do not include bare `continue` as a fake option",
      "No Menu Inside Approved Boundary",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 8 Decision Handoff Quality",
      "Alpha.8 answers",
      "When Codex gives control back, is the next decision visible and useful?",
      "Completion is not always a handoff",
      "Handoff Outcome",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "Stop With Decision Rule",
      "One Clear Path Rule",
      "Real Branches Rule",
      "No Menu Inside Approved Boundary Rule",
      "Close Finished Lines Rule",
      "Blocked Means Actually Blocked Rule",
      "Mode-Sensitive Handoff Rule",
      "Silent Completion",
      "One-Sentence Handoff",
      "Short Decision Options",
      "Closure Note",
      "not a mandatory menu in every response",
      "not automatic implementation planning",
      "not automatic worktree creation",
      "not automatic commit, push, merge, tag, or release",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add the `navi init` generated-trigger test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"installs alpha 7 coordination layer rules for generated Navi triggers"` test:

```ts
  it("installs alpha 8 decision handoff quality rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.8 decision handoff quality",
      "Completion is not always a handoff",
      "Stop with a decision, a recommendation, or closure",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "bare completion report",
      "real next decision",
      "Do not include bare `continue` as a fake option.",
      "No Menu Inside Approved Boundary",
      "Close Finished Lines",
      "Blocked Means Actually Blocked",
      "Use Silent Completion only when the user asked for a narrow status report",
      "Use One-Sentence Handoff when one next step is clearly best",
      "Use Short Decision Options when there are real branches",
      "Use Closure Note when the current line is actually complete",
    ]) {
      expect(agents).toContain(expected);
    }
  });
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL. The first failure should mention a missing alpha.8 string such as `Alpha.8 decision handoff quality`.

Do not commit failing tests yet.

---

### Task 2: Update Canonical Skill Entry Point

**Files:**

- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update the canonical skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, replace the paragraph beginning with `Navi's V1 alpha behavior centers on` with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, alpha.5 **pause semantics**, alpha.6 **stage-and-vision supervision**, alpha.7 **coordination layer**, and alpha.8 **decision handoff quality**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, how far the current work is from the original goal, or whether the main session should continue while another lane runs. Alpha.8 helps Codex stop with a decision, a recommendation, or closure instead of a bare completion report when the session remains active. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, coordination conflict, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 2: Add alpha.8 hard-boundary bullets**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets under `## Hard Boundaries` after the existing alpha.7 coordination bullets and before `Navi must not claim it can automatically give the final correct answer in every professional domain.`:

```markdown
- Codex must not stop after a completed action with only a bare completion report when the session remains active and the next user decision is not visible.
- Codex must not include bare `continue` or `继续` as a fake option; continuing must name the concrete next action, boundary, and stop point.
- Codex must not print decision menus inside an already-approved bounded loop before the stated acceptance point.
- Codex must not make a default recommendation sound like user approval for writes, commits, pushes, releases, mode changes, scope expansion, or risk acceptance.
- Codex must not claim the whole session is blocked when only one lane is blocked and useful non-conflicting work remains.
```

- [ ] **Step 3: Add alpha.8 behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add this block after the existing alpha.7 coordination guardrails and before `Use a light continuation contract`:

```markdown
- Alpha.8 decision handoff quality covers what Codex says when it gives control back to the user. Completion is not always a handoff.
- The goal is to stop with a decision, a recommendation, or closure; do not stop with a bare completion report when the session is still active.
- Choose the smallest useful Handoff Outcome: Default Next Step when one direction is clearly best, Decision Options when real branches exist, Loop Closure when the current line is actually complete, or a blocked reason when no useful non-conflicting work remains.
- A real next decision must be something the user can judge. Do not include bare `continue` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.
- No Menu Inside Approved Boundary: if the user already approved a bounded loop with a clear acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears.
- Close Finished Lines explicitly. Say the line is closed and name any remaining open lanes only when that helps the user choose what to do next.
- Blocked Means Actually Blocked: do not say the whole session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, or external state.
- Match handoff strength to Work Mode. Design handoffs recommend refine/write/commit/implementation planning. Calibration handoffs recommend record one sample, run one more sample, or close. Implementation handoffs recommend commit, review, merge, targeted follow-up, or stop at verification. Release handoffs recommend release gates only after explicit Release mode approval.
- Use Silent Completion only for narrow status reports or genuinely finished work with no active follow-up. Use One-Sentence Handoff when one next step is clearly best. Use Short Decision Options when there are real branches. Use Closure Note when the current line is actually complete.
- Alpha.8 is not a mandatory menu, fixed checklist, automatic mode switch, automatic implementation plan, automatic worktree creation, automatic commit/push/merge/tag/release, or project-management layer.
```

- [ ] **Step 4: Run the canonical skill test and confirm it still fails on reference/template strings**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL. The skill strings should now be present, but the test should still fail because the alpha.8 reference and template strings have not been added yet.

---

### Task 3: Add The Alpha.8 Reference Section

**Files:**

- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Insert the alpha.8 reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section immediately after the `## Alpha 7 Coordination Layer` section and before `## Progress Map`:

````markdown
## Alpha 8 Decision Handoff Quality

Alpha.8 adds Decision Handoff Quality on top of alpha.5 pause semantics, alpha.6 stage-and-vision supervision, and alpha.7 coordination.

Alpha.5 answers:

```text
Should this lane continue or stop?
```

Alpha.6 answers:

```text
What product stage, work mode, and vision distance are we in?
```

Alpha.7 answers:

```text
How should the main session coordinate multiple lanes without losing user control?
```

Alpha.8 answers:

```text
When Codex gives control back, is the next decision visible and useful?
```

The goal is:

```text
Stop with a decision, a recommendation, or closure; do not stop with a bare completion report when the session is still active.
```

This is prompt/docs-backed supervision. It is not a runtime scheduler, task database, or project-management layer.

### Core Principle

Completion is not always a handoff.

Reporting that an action completed is not enough when the session remains active and the user still needs to choose what happens next. A useful handoff should tell the user what control they now have.

### Handoff Outcome

Use the smallest useful Handoff Outcome:

- Default Next Step: one direction is clearly best and does not cross an unapproved boundary.
- Decision Options: two to four real branches exist and the user can judge among them.
- Loop Closure: the current line is actually complete.
- Blocked reason: no useful non-conflicting work remains without missing input, tool result, external state, or user approval.

### Stop With Decision Rule

If Codex proactively stops while the session remains active, the response should include one of:

- a default recommended next step;
- a small set of real decision options;
- explicit loop closure;
- a blocked reason and the condition needed to proceed.

Avoid bare completion reports unless the user explicitly asked only for a status report.

### One Clear Path Rule

When one next step is clearly best, give a recommendation instead of a menu.

Good:

```text
Recommended next step: push main. The work is already committed and verified; this does not start release mode.
```

Weak:

```text
What next?
```

### Real Branches Rule

When multiple reasonable paths exist, show two to four real options. The branches must be concrete and materially different.

Good:

```text
Next decision:
1. Push the current docs commits.
2. Create the implementation worktree.
3. Pause with design and plan committed.
```

Bad:

```text
1. Continue.
2. Do something else.
```

Do not include bare `continue` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.

### No Menu Inside Approved Boundary Rule

If the user already approved a bounded loop with a clear acceptance point, do not stop with a menu at every intermediate completion.

Example contract:

```text
I will write the plan, run diff check, then stop at the commit decision.
```

Successful file writes, read-only checks, and `git diff --check` passing inside that contract should not require user decisions. The handoff happens at the commit decision unless a new approval gate, risk, scope change, or blocker appears.

### Close Finished Lines Rule

When a line is complete, say so explicitly and name any remaining open lines if the session continues.

Example:

```text
This calibration line is closed. No further validation is needed unless you want a natural-prompt sample later.
```

### Blocked Means Actually Blocked Rule

Do not say the session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, external state, or user approval.

If only one lane is blocked, name that lane and say what the main session can still do.

### Mode-Sensitive Handoff Rule

The handoff shape should match the current Work Mode:

- Design: recommend refining, writing, committing, or moving to implementation planning.
- Calibration: recommend recording evidence, running one more sample, or closing the calibration line.
- Implementation: recommend commit, review, merge, targeted follow-up, or stopping at verification.
- Release: recommend release-gate decisions such as tag, release notes, source package verification, or stop.

Do not let implementation or release options appear in Design mode unless the user has approved that mode transition.

### Output Strategy

Silent Completion: use only when the user asked for a narrow status report or the task is genuinely done with no active follow-up.

One-Sentence Handoff: use when a default next step is obvious.

Short Decision Options: use when multiple real branches exist. Prefer two or three options. Four is the upper bound.

Closure Note: use when the line is complete and the next best action is to switch tracks or stop.

### Alpha.8 Boundaries

Alpha.8 is not a mandatory menu in every response, not a fixed checklist after every action, not automatic mode switching, not automatic implementation planning, not automatic worktree creation, not automatic commit, push, merge, tag, or release, not a task database, not runtime UI, not local app behavior, not background watcher behavior, not Memory v2, not agent adapters, not delegation or write delegation, not release automation, not npm publication, and not marketplace distribution.

Alpha.8 should improve the final step of supervision without creating more process text than the user needs.
````

- [ ] **Step 2: Run the canonical skill test and confirm it still fails on template strings**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL. The reference strings should now be present, but the test should still fail because the project trigger template has not been updated yet.

---

### Task 4: Update Project Trigger Template And `navi init`

**Files:**

- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`
- Test: `tests/skills/along-working-thread-skill.test.ts`
- Test: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Update the project trigger template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this paragraph after the existing alpha.7 paragraph ending with `Do not force lane tables into ordinary answers.`:

```markdown
Alpha.8 decision handoff quality: Completion is not always a handoff. When Codex stops while the session remains active, stop with a decision, a recommendation, or closure instead of a bare completion report. Use Default Next Step when one next step is clearly best, Decision Options when real branches exist, Loop Closure when the current line is actually complete, or a blocked reason when no useful non-conflicting work remains. A real next decision must be something the user can judge. Do not include bare `continue` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.

No Menu Inside Approved Boundary: if the user already approved a bounded loop with a clear acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears. Close Finished Lines explicitly when a lane is complete. Blocked Means Actually Blocked: do not say the whole session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, external state, or user approval.

Use Silent Completion only when the user asked for a narrow status report or the task is genuinely done with no active follow-up. Use One-Sentence Handoff when one next step is clearly best. Use Short Decision Options when there are real branches. Use Closure Note when the current line is actually complete. Alpha.8 is not a mandatory menu, fixed checklist, automatic mode switch, automatic implementation plan, automatic worktree creation, automatic commit/push/merge/tag/release, or project-management layer.
```

- [ ] **Step 2: Update generated `AGENTS.md` text in `src/cli/navi-init.ts`**

In `src/cli/navi-init.ts`, insert the same text inside `buildAgentsBlock()` after the existing alpha.7 generated text and before the map-shape guidance:

```ts
Alpha.8 decision handoff quality: Completion is not always a handoff. When Codex stops while the session remains active, stop with a decision, a recommendation, or closure instead of a bare completion report. Use Default Next Step when one next step is clearly best, Decision Options when real branches exist, Loop Closure when the current line is actually complete, or a blocked reason when no useful non-conflicting work remains. A real next decision must be something the user can judge. Do not include bare \`continue\` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.

No Menu Inside Approved Boundary: if the user already approved a bounded loop with a clear acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears. Close Finished Lines explicitly when a lane is complete. Blocked Means Actually Blocked: do not say the whole session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, external state, or user approval.

Use Silent Completion only when the user asked for a narrow status report or the task is genuinely done with no active follow-up. Use One-Sentence Handoff when one next step is clearly best. Use Short Decision Options when there are real branches. Use Closure Note when the current line is actually complete. Alpha.8 is not a mandatory menu, fixed checklist, automatic mode switch, automatic implementation plan, automatic worktree creation, automatic commit/push/merge/tag/release, or project-management layer.
```

- [ ] **Step 3: Run the combined targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS for the new alpha.8 tests unless plugin copy sync is already asserted by existing tests. If plugin copy drift is detected, continue to Task 5.

---

### Task 5: Sync Plugin Copy And Verify Package

**Files:**

- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Copy canonical skill to plugin skill**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
```

- [ ] **Step 2: Copy canonical reference to plugin reference**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 3: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This should validate package metadata and source/package skill drift.

---

### Task 6: Final Verification And Commit

**Files:**

- Verify all modified files from Tasks 1-5.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

- [ ] **Step 3: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 4: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
git diff --name-only
```

Expected changed tracked files:

```text
.agents/skills/along-working-thread/SKILL.md
.agents/skills/along-working-thread/references/working-thread-v1.md
docs/along/project-maps/navi-project-trigger-template.md
plugins/along-working-thread/skills/along-working-thread/SKILL.md
plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
src/cli/navi-init.ts
tests/cli/navi-init.test.ts
tests/skills/along-working-thread-skill.test.ts
```

The untracked `work/` directory may exist. Do not stage it.

- [ ] **Step 5: Commit**

Run:

```bash
git add .agents/skills/along-working-thread/SKILL.md \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  docs/along/project-maps/navi-project-trigger-template.md \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md \
  src/cli/navi-init.ts \
  tests/cli/navi-init.test.ts \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: add navi alpha 8 decision handoff quality"
```

Expected: one commit with only the approved files staged.

- [ ] **Step 6: Return implementation handoff**

Final response must include:

- commit hash;
- changed files summary;
- validation commands and pass/fail;
- any deviations from this plan;
- residual risk;
- whether review/merge is ready.

Do not push, tag, release, or clean up the Codex-managed worktree.
