# Navi Alpha 11 Lane Closure Next-Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.11 lane-closure next-decision handoff guidance so Navi/Codex closes commit, merge, push, worktree, review, validation, calibration, and design/documentation lanes with explicit closure or the smallest useful next decision instead of leaving the user with only `continue`.

**Architecture:** Keep alpha.11 as a docs-backed prompt behavior update. Add failing text assertions first, update the canonical skill and reference, update project-local trigger text and `navi init` generated text, sync the plugin package copy, then run targeted verification. Do not add runtime UI, automatic orchestration, state machines, background watchers, release automation, npm publication, or marketplace behavior.

**Tech Stack:** Markdown skill docs, TypeScript CLI string rendering, Vitest text assertions, existing plugin package verification script.

## Global Constraints

- Implementation must run in a true Codex worktree session, not in the main design session.
- Alpha.11 solves lane-closure decision invisibility, not all pause semantics.
- Output should default to a light natural-language handoff, not a mandatory menu.
- Trigger scope is recognizable lane closure where the next user-relevant decision would otherwise be invisible.
- Implementation should stay docs/prompt-backed and narrow.
- Push completion is not automatic release preparation.
- Documentation closeout is not design confirmation.
- Do not tag, release, publish to npm, update GitHub Releases, run release checklists, modify `src/web`, modify external target projects, create runtime/thread orchestration, add background watchers, add Memory v2, add adapters, add delegation, or add write delegation.
- Do not modify untracked `work/`.

---

## Navi-Specific Execution Boundary

Start the implementation worktree from current `main`, which includes:

```text
c2d4a91 docs: refine navi alpha 11 lane closure design
c286dc8 docs: add navi alpha 11 lane closure design
6540ad1 feat: add navi alpha 10 map maintenance guidance
```

Allowed validation:

- `npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts`
- `npm run verify:plugin-package`
- `git diff --check`

Do not run the full test suite or typecheck unless a targeted failure proves this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/skills/along-working-thread-skill.test.ts`
  - Adds targeted alpha.11 text assertions for the canonical skill, canonical reference, and project trigger template.
- `tests/cli/navi-init.test.ts`
  - Adds a targeted generated-`AGENTS.md` assertion proving `navi init` installs alpha.11 trigger guidance.
- `.agents/skills/along-working-thread/SKILL.md`
  - Adds concise alpha.11 behavior guardrails to the canonical skill entrypoint.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Adds the full alpha.11 reference section after alpha.8 and before Progress Map guidance.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds concise project-local alpha.11 trigger guidance.
- `src/cli/navi-init.ts`
  - Keeps generated project-local `AGENTS.md` block in sync with the trigger template.
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact sync copy of the canonical skill.
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact sync copy of the canonical reference.

Do not modify:

- `src/web/**`
- runtime server/MCP files
- README files
- release notes or GitHub Release bodies
- package ids, skill ids, or CLI aliases
- external target projects
- untracked `work/`

---

### Task 1: Add Failing Alpha.11 Text Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

**Interfaces:**

- Consumes: existing `readRepoText()`, `makeProject()`, `buildInitPlan()`, and `applyInitPlan()` test helpers.
- Produces: failing assertions that define the exact alpha.11 strings future tasks must satisfy.

- [ ] **Step 1: Add the canonical skill/reference/template test**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test after the existing `"documents alpha 8 decision handoff quality"` test and before `"documents the Navi Project Map model and source priority"`:

```ts
  it("documents alpha 11 lane closure next-decision handoff", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.11 lane closure handoff",
      "Lane closure is not automatically session closure",
      "lane-closure decision invisibility",
      "smallest useful next-decision signal",
      "explicit closure",
      "one default recommendation",
      "short real options",
      "approval gate",
      "blocked reason",
      "Push completion is not automatic release preparation",
      "Documentation closeout is not design confirmation",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 11 Lane Closure Next-Decision Handoff",
      "Alpha.11 answers",
      "Lane closure is not automatically session closure",
      "lane-closure decision invisibility",
      "Is the next decision already visible to the user?",
      "Explicit Closure",
      "One Default Recommendation",
      "Short Real Options",
      "Approval Gate",
      "Blocked Reason",
      "Lane Closure Triggers",
      "Non-Trigger Cases",
      "Push completion is not automatic release preparation",
      "Documentation closeout is not design confirmation",
      "not a mandatory menu",
      "not automatic release preparation",
      "not a project manager or scheduler",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add the generated-trigger test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"installs alpha 10 map maintenance trigger guidance for generated Navi triggers"` test:

```ts
  it("installs alpha 11 lane closure handoff rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.11 lane closure handoff",
      "Lane closure is not automatically session closure",
      "smallest useful next-decision signal",
      "explicit closure",
      "one default recommendation",
      "short real options",
      "approval gate",
      "blocked reason",
      "Push completion is not automatic release preparation",
      "Documentation closeout is not design confirmation",
    ]) {
      expect(agents).toContain(expected);
    }

    expect(agents).not.toContain("## Alpha 11 Lane Closure Next-Decision Handoff");
  });
```

- [ ] **Step 3: Run the targeted tests to verify they fail**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL. The first failure should mention a missing alpha.11 string such as `Alpha.11 lane closure handoff`.

Do not commit failing tests yet.

---

### Task 2: Update Canonical Skill Entry Point

**Files:**

- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**

- Consumes: alpha.11 design language from `docs/superpowers/specs/2026-07-07-navi-alpha11-lane-closure-next-decision-design.md`.
- Produces: canonical skill guidance that generated/plugin copies can mirror.

- [ ] **Step 1: Update the canonical skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, replace the paragraph beginning with `Navi's V1 alpha behavior centers on` with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, alpha.5 **pause semantics**, alpha.6 **stage-and-vision supervision**, alpha.7 **coordination layer**, alpha.8 **decision handoff quality**, and alpha.11 **lane closure handoff**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, how far the current work is from the original goal, or whether the main session should continue while another lane runs. Alpha.11 helps Codex avoid lane-closure decision invisibility after commit, merge, push, worktree, review, validation, calibration, or design/documentation lanes close. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, coordination conflict, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 2: Add alpha.11 hard-boundary bullets**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets under `## Hard Boundaries` after the existing alpha.8 decision handoff bullets and before `Navi must not claim it can automatically give the final correct answer in every professional domain.`:

```markdown
- Codex must not treat lane closure as automatic session closure when the session remains active and the next user-relevant decision is not visible.
- Codex must not leave commit, merge, push, worktree, review, validation, calibration, or design/documentation closeouts with only a status report when the user still needs a next decision.
- Codex must not make push completion sound like automatic release preparation; Release mode still requires explicit user approval.
- Codex must not call a written or committed design draft complete before the intended design discussion and user approval have happened.
- Codex must not add lane-closure menus to narrow status answers, clear chained commands, already-approved bounded loops, or fake branches.
```

- [ ] **Step 3: Add alpha.11 behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add this block after the existing alpha.8 decision handoff guardrails and before `Use a light continuation contract`:

```markdown
- Alpha.11 lane closure handoff covers the specific moment after a recognizable lane closes and the next user-relevant decision would otherwise be invisible. Lane closure is not automatically session closure.
- Alpha.11 solves lane-closure decision invisibility: a local work lane has closed, but the user cannot tell whether to stop, review, merge, push, start planning, enter release mode, record calibration evidence, or move to another design question.
- Ask internally: Is the next decision already visible to the user? If yes, keep the answer short and do not add structure. If no, add the smallest useful next-decision signal.
- Use the lightest sufficient output: explicit closure when the line is done, one default recommendation when one next step is clearly best, short real options when real branches exist, an approval gate when continuing would cross a boundary, or a blocked reason when no useful non-conflicting work remains.
- Apply this especially after commit, merge, push, worktree implementation, worktree review, targeted validation, calibration sample, or design/documentation lanes close.
- Do not apply it to narrow status answers, genuinely complete work with no active follow-up, clear chained instructions, already-approved bounded loops with a clear acceptance point, answers that already include closure or a visible next decision, or fake branches.
- Push completion is not automatic release preparation. Mention release planning only as an option when relevant, and never enter Release mode without explicit approval.
- Documentation closeout is not design confirmation. A written or committed design draft should not be called complete until the user has had the intended design discussion and approved the design direction.
```

- [ ] **Step 4: Run the skill test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: still FAIL until the full reference and trigger template are updated.

---

### Task 3: Add Full Alpha.11 Reference Section

**Files:**

- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**

- Consumes: canonical skill alpha.11 guardrails from Task 2.
- Produces: full reference text used by skill readers and package verification.

- [ ] **Step 1: Insert the alpha.11 reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section after the existing alpha.8 section and before `## Progress Map`:

````markdown
## Alpha 11 Lane Closure Next-Decision Handoff

Alpha.11 specializes alpha.8 decision handoff quality for the moment after a lane closes.

Alpha.8 answers:

```text
When Codex gives control back, is the next decision visible and useful?
```

Alpha.11 answers:

```text
After this lane closed, is the next user-relevant decision already visible?
```

The goal is:

```text
When a lane closes, Navi should either close the whole line explicitly or surface the smallest useful next decision, so the user is not forced to type "continue" to discover what remains.
```

This is prompt/docs-backed supervision. It is not a runtime scheduler, project manager, automatic release flow, state machine, or task database.

### Core Principle

Lane closure is not automatically session closure.

A commit, merge, push, worktree completion, review completion, validation pass, calibration record, or design/documentation write can close one lane while the session still has useful next decisions.

### Problem Definition

Alpha.11 solves lane-closure decision invisibility.

Lane-closure decision invisibility means:

```text
A local work lane has closed, but the user cannot tell whether to stop, continue, review, merge, push, start planning, enter release mode, record calibration evidence, or move to a different design question.
```

The key internal question is:

```text
Is the next decision already visible to the user?
```

If yes, keep the answer short and do not add structure. If no, add the smallest useful next-decision signal.

### Handoff Shapes

Use the lightest sufficient handoff shape:

- Explicit Closure: the lane and whole line are genuinely done.
- One Default Recommendation: one next step is clearly best and does not cross an unapproved boundary.
- Short Real Options: two to four real branches exist and the user can judge among them.
- Approval Gate: continuing would cross a write, commit, push, release, mode-change, scope-expansion, cross-project, or risk-acceptance boundary.
- Blocked Reason: no useful non-conflicting work remains without missing input, a tool result, external state, or user approval.

Do not include bare `continue` or `继续` as an option. If continuing is meaningful, name the concrete action, boundary, and stop point.

### Lane Closure Triggers

Apply alpha.11 when a recognizable lane closes and the next user-relevant decision would otherwise be invisible.

Common triggers:

- commit succeeds;
- merge succeeds;
- push succeeds;
- worktree implementation completes;
- worktree review completes;
- targeted validation passes;
- calibration sample is recorded;
- documentation or design line is written;
- release-adjacent check finishes but Release mode has not been approved.

### Non-Trigger Cases

Do not add a lane-closure handoff when:

- the user asked only for a narrow status answer, such as whether a push succeeded;
- the current task is genuinely complete and there is no active follow-up;
- the user gave a clear chained instruction, such as `commit and push`;
- the session is inside an already-approved bounded loop with a clear acceptance point;
- the answer already includes explicit closure or a visible next decision;
- adding options would create fake branches;
- continuing would cross an approval gate that should be named directly.

### Examples

Bad:

```text
Pushed to origin/main. No release mode.
```

Good:

```text
Pushed to origin/main. The implementation lane is closed and we are not in Release mode. Next recommended step: decide whether to enter implementation planning for alpha.11 or stop with the design recorded.
```

Good:

```text
Commit is created. Next decision: push it, create the implementation worktree, or stop here.
```

Good:

```text
The worktree completed. This creates a review/merge option; the main session can still continue non-conflicting design unless the result changes the current premise.
```

### Alpha.11 Boundaries

Alpha.11 is not a mandatory menu, not automatic implementation planning, not automatic worktree creation, not automatic commit, push, merge, tag, release, or release preparation, not a project manager or scheduler, not runtime UI, not local app behavior, not background watcher behavior, not Memory v2, not agent adapters, not delegation or write delegation, not npm publication, and not marketplace distribution.

Push completion is not automatic release preparation. Mention release planning only as an option when relevant, and do not enter Release mode without explicit user approval.

Documentation closeout is not design confirmation. A written or committed design draft should not be called complete until the user has had the intended design discussion and approved the design direction.
````

- [ ] **Step 2: Run the skill test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: still FAIL until the project trigger template is updated.

---

### Task 4: Update Project Trigger Template And Generated `AGENTS.md`

**Files:**

- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`
- Test: `tests/skills/along-working-thread-skill.test.ts`
- Test: `tests/cli/navi-init.test.ts`

**Interfaces:**

- Consumes: concise alpha.11 trigger guidance.
- Produces: generated target-project `AGENTS.md` rules that match the template.

- [ ] **Step 1: Add the concise alpha.11 trigger paragraph to the template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this paragraph after the existing alpha.10 map-maintenance sentence and before `No Menu Inside Approved Boundary`:

```markdown
Alpha.11 lane closure handoff: Lane closure is not automatically session closure. When commit, merge, push, worktree, review, validation, calibration, or design/documentation lanes close and the next user-relevant decision would otherwise be invisible, add the smallest useful next-decision signal: explicit closure, one default recommendation, short real options, approval gate, or blocked reason. Do not add this for narrow status answers, clear chained commands, already-approved bounded loops, or fake branches. Push completion is not automatic release preparation. Documentation closeout is not design confirmation.
```

- [ ] **Step 2: Add the same concise paragraph to `renderAgentsBlock()`**

In `src/cli/navi-init.ts`, add the exact same paragraph in `renderAgentsBlock()` after the alpha.10 map-maintenance sentence and before `No Menu Inside Approved Boundary`.

Because this is inside a TypeScript template string, escape only backticks if they appear. This paragraph has no backticks, so paste it verbatim.

- [ ] **Step 3: Run both targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: the CLI test should pass its generated alpha.11 assertions; the skill test may still fail until plugin copies are synced only if package drift tests run indirectly later.

---

### Task 5: Sync Plugin Package Copy

**Files:**

- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Verify: `npm run verify:plugin-package`

**Interfaces:**

- Consumes: canonical `.agents/skills/along-working-thread/**` files.
- Produces: plugin package skill copy with no source/package drift.

- [ ] **Step 1: Copy the canonical skill entrypoint to the plugin copy**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
```

- [ ] **Step 2: Copy the canonical reference to the plugin copy**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 3: Verify the package copy**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This script also runs `npm test -- tests/skills/along-working-thread-skill.test.ts`, validates the plugin manifest, and checks source/package skill drift.

---

### Task 6: Targeted Verification And Commit

**Files:**

- Verify all modified files.

**Interfaces:**

- Consumes: all previous tasks.
- Produces: one implementation commit ready for main-session review/merge.

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

- [ ] **Step 3: Run whitespace verification**

Run:

```bash
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Inspect the diff**

Run:

```bash
git diff -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Confirm:

- alpha.11 appears in canonical skill and reference.
- alpha.11 appears in project trigger template and generated `AGENTS.md`.
- generated trigger text is concise and does not include the full `## Alpha 11 Lane Closure Next-Decision Handoff` reference section.
- plugin skill and reference match canonical copies.
- no README, release, runtime, `src/web`, or external target-project files changed.

- [ ] **Step 5: Commit**

Run:

```bash
git add tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: add navi alpha 11 lane closure handoff"
```

Expected: one local worktree commit. Do not push, merge, tag, or release.

---

## Completion Report

When finished, report:

- commit hash;
- changed files summary;
- validation commands and pass/fail;
- whether implementation stayed within the approved alpha.11 boundary;
- any deviations from this plan;
- whether review/merge is ready.

Do not tag, release, push, or merge unless the main session/user explicitly approves that later.
