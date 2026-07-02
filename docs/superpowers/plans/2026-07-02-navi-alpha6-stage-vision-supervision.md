# Navi Alpha 6 Stage And Vision Supervision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.6 stage-and-vision supervision to Navi's docs-backed behavior so Navi can explain Product Stage, Work Mode, and Vision Distance without printing heavy structure by default.

**Architecture:** Keep this as a prompt/docs-backed behavior update. Add failing text tests first, update the canonical skill/reference and generated project-local trigger text, then sync the plugin package copy and run targeted verification. Do not add runtime code, UI, background automation, Memory v2, release automation, or package publication.

**Tech Stack:** Markdown skill docs, TypeScript CLI string rendering, Vitest text assertions, existing plugin package verification script.

---

## Navi-Specific Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Do not tag, release, publish to npm, update GitHub Releases, run full release checklists, modify `src/web`, modify external target projects, or expand this into runtime/UI work.

Allowed validation:

- `npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts`
- `npm run verify:plugin-package`
- `git diff --check`

Do not run the full test suite or typecheck unless a targeted failure shows this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/skills/along-working-thread-skill.test.ts`
  - Adds a targeted alpha.6 text test for canonical skill, canonical reference, and project trigger template.
- `tests/cli/navi-init.test.ts`
  - Adds a targeted generated-`AGENTS.md` test proving `navi init` installs alpha.6 guidance.
- `.agents/skills/along-working-thread/SKILL.md`
  - Adds concise alpha.6 behavior guardrails to the canonical skill entrypoint.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Adds the full alpha.6 reference section after alpha.5 and before Progress Map guidance.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds concise project-local alpha.6 trigger guidance.
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
- external target projects
- `README.zh-CN.md` unless a later decision explicitly expands scope

---

### Task 1: Add Failing Alpha.6 Text Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add the canonical skill/reference/template test**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test after the existing `"documents alpha 5 pause semantics and decision-point stopping"` test and before `"documents the Navi Project Map model and source priority"`:

```ts
  it("documents alpha 6 stage and vision supervision", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.6 stage-and-vision supervision",
      "Product Stage",
      "Work Mode",
      "Vision Distance",
      "Silent Tracking",
      "Light Signal",
      "Full Map",
      "Product Definition",
      "User Supervision",
      "Project Integration",
      "Behavior Calibration",
      "Distribution & Trust",
      "Runtime Surface",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 6 Stage And Vision Supervision Layer",
      "Product Stage is a product-coordinate system",
      "not a waterfall process",
      "Product Definition covers what Navi is, what it is not",
      "User Supervision covers how Navi helps the user supervise Codex",
      "Project Integration covers how Navi enters and works inside real target projects",
      "Behavior Calibration covers whether Navi's behavior works in real or semi-real use",
      "Distribution & Trust covers how external users obtain, understand, verify, and rely on Navi",
      "Runtime Surface covers later product surfaces and long-term capabilities",
      "four primary Work Modes",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Vision Distance should be stage-relative",
      "Do not use percentages",
      "Silent Tracking is the default",
      "Light Signal should usually be one to three sentences",
      "Full Map when the user explicitly asks a broad orientation question",
      "The output should be the smallest useful intervention",
      "Product Stage affects what kind of next step is relevant",
      "Work Mode affects validation budget and allowed actions",
      "Vision Distance explains whether current work is enough for the stage",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
      "not a complete roadmap management system",
      "not an automatic project manager",
      "not runtime UI",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add the `navi init` generated-trigger test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"installs alpha 5 pause semantics rules for generated Navi triggers"` test:

```ts
  it("installs alpha 6 stage and vision supervision rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.6 stage-and-vision supervision",
      "Product Stage",
      "Work Mode",
      "Vision Distance",
      "Product Definition",
      "User Supervision",
      "Project Integration",
      "Behavior Calibration",
      "Distribution & Trust",
      "Runtime Surface",
      "Use Silent Tracking by default",
      "Use a Light Signal",
      "Use a Full Map",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
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

Expected: FAIL. The first failure should mention a missing alpha.6 string such as `Alpha.6 stage-and-vision supervision`.

Do not commit failing tests yet.

---

### Task 2: Update Canonical Skill And Reference

**Files:**

- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update the canonical skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, replace the paragraph beginning with `Navi's V1 alpha behavior centers on` with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, alpha.5 **pause semantics**, and alpha.6 **stage-and-vision supervision**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, or how far the current work is from the original goal. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 2: Add alpha.6 hard-boundary bullets**

In the `## Hard Boundaries` list in `.agents/skills/along-working-thread/SKILL.md`, add these bullets after the existing no-next-decision boundary:

```markdown
- Codex must not confuse Product Stage with Work Mode; Product Stage describes the product layer being advanced, while Work Mode describes the current loop's work type and validation budget.
- Codex must not print Product Stage, Work Mode, and Vision Distance in every response; alpha.6 uses Silent Tracking by default and surfaces structure only when it helps user control.
- Codex must not treat Exploration as a primary Work Mode; Exploration is a Design sub-state.
- Codex must not treat Closeout, Waiting, Review, or Merge as primary Work Modes; they are loop or workflow states.
```

- [ ] **Step 3: Add alpha.6 guardrails**

In the `## Behavior Guardrails` section in `.agents/skills/along-working-thread/SKILL.md`, add this block after the existing Next Decision Visibility paragraph and before `Use a light continuation contract`:

```markdown
- Alpha.6 stage-and-vision supervision uses Product Stage, Work Mode, and Vision Distance to explain where the current work sits in the product vision, how close the current stage is to being enough, and which next decision would move the product forward.
- Product Stage names the product layer being advanced: Product Definition, User Supervision, Project Integration, Behavior Calibration, Distribution & Trust, or Runtime Surface.
- Work Mode names the current loop's work type: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.
- Vision Distance should be stage-relative, not percentage-based: name what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision.
- Use Silent Tracking by default. Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, worktree completion might interrupt non-blocking design, or repeated `continue` prompts indicate friction. Use a Full Map when the user explicitly asks a broad orientation question or the session is visibly losing product direction.
- Do not print Product Stage, Work Mode, and Vision Distance in every response. Use the smallest useful intervention.
```

- [ ] **Step 4: Replace the old six-mode work-mode guidance**

In `.agents/skills/along-working-thread/SKILL.md`, replace this paragraph:

```markdown
- Navi should identify the current work mode when it affects the answer: design, calibration, implementation, release, closeout, or exploration.
- Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks. Closeout mode records the result and should not start a new validation loop.
```

with:

```markdown
- Navi should identify the current Work Mode when it affects the answer: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.
- Design mode does not need tests, implementation, worktrees, or release checklists. Calibration mode uses small real or semi-real observations and avoids proving full correctness. Implementation mode uses targeted validation around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.
```

- [ ] **Step 5: Add the full alpha.6 reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section after the alpha.5 `Next Decision Visibility` section and before `## Progress Map`:

````markdown
## Alpha 6 Stage And Vision Supervision Layer

Alpha.6 adds stage-and-vision supervision to the alpha.4 supervision layer and alpha.5 pause semantics layer.

The goal is to explain where the current work sits in the product vision, how close the current stage is to being enough, and which next decision would actually move the product forward.

This is not a requirement to print more structure. Navi should track the model internally and surface only the smallest useful amount.

### Three-Layer Model

Alpha.6 uses three layers:

- Product Stage: which layer of the full Navi product the current work advances.
- Work Mode: what kind of work this loop is doing and what validation level is appropriate.
- Vision Distance: how close the current stage is to being enough, and what remains missing from the fuller Navi vision.

### Product Stage

Product Stage is a product-coordinate system, not a waterfall process. It explains what layer of the complete Navi product is being advanced.

- Product Definition covers what Navi is, what it is not, who it serves, how it relates to Along, what the alpha wedge is, and which boundaries define the current product.
- User Supervision covers how Navi helps the user supervise Codex or another expert agent, including mode judgment, pause reasons, over-validation detection, worktree waiting scope, next-decision visibility, and stage/vision guidance.
- Project Integration covers how Navi enters and works inside real target projects, including `navi init`, project-local `AGENTS.md` triggers, project maps, handoff/state docs, fresh-session validation, and target-project setup.
- Behavior Calibration covers whether Navi's behavior works in real or semi-real use, including fresh-session transcripts, language-following behavior, meaningless `continue` friction, over-structured output, and worktree/main-session interference.
- Distribution & Trust covers how external users obtain, understand, verify, and rely on Navi, including README clarity, GitHub Releases, tags, source packages, source verification wording, alpha exclusions, install paths, npm publication, marketplace distribution, and public trust signals.
- Runtime Surface covers later product surfaces and long-term capabilities, including runtime UI, local app behavior, background watcher, always-on presence, agent adapters, Memory v2, relationship modes, delegation, write delegation, and future Along/Navi integration.

Runtime Surface protects the current alpha boundary. `src/web` remains historical Along Shared Desk / future capability evidence and must not be rebranded as the current Navi alpha UI.

### Work Mode

Alpha.6 uses four primary Work Modes:

- Design: decide what to do, why, and what not to do.
- Calibration: observe real or semi-real behavior without trying to prove the whole system correct.
- Implementation: make a bounded change for a confirmed problem.
- Release: prepare an external version that users may rely on.

Exploration is a Design sub-state, used when the direction is still uncertain or options are being compared.

Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.

Example:

```text
Product Stage: User Supervision
Work Mode: Implementation
Loop State: waiting for worktree review
```

Work Mode must affect behavior:

- Design mode does not need tests, implementation, worktrees, or release checklists.
- Calibration mode uses small real or semi-real observations and avoids proving full correctness.
- Implementation mode uses targeted validation around changed behavior.
- Release mode is the only default place for full tests, typecheck, package verification, release notes, tags, pushes, and release checks.

### Vision Distance

Vision Distance should be stage-relative.

Do not use percentages. Percentages imply false precision and can make a small bugfix look like measurable progress toward the whole product.

Instead, explain:

- what the current stage is trying to complete;
- whether this stage is close to enough, not enough, or already beyond useful validation;
- which major product stages remain missing;
- whether continuing the current loop still advances the original vision;
- what next stage would most improve progress.

Example:

```text
This is close to enough for alpha.6 design: the stage model, mode model, trigger levels, and output rules are defined. It is still far from complete Navi because Project Integration, Distribution & Trust, and Runtime Surface remain only partially addressed.
```

### Trigger Strength

Silent Tracking is the default. Navi internally tracks Product Stage, Work Mode, and Vision Distance but does not print them for ordinary execution, direct answers, simple status updates, or cases where structure would add friction.

Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, worktree completion might interrupt non-blocking design work, or repeated `continue` prompts indicate friction.

Light Signal should usually be one to three sentences.

Use a Full Map when the user explicitly asks a broad orientation question or when the session is visibly losing product direction.

Full Map triggers include:

- "How far are we from the original vision?"
- "How much is enough for this stage?"
- "Are we spending too much time testing?"
- "What should happen after this stage?"
- "Should the main session wait for the worktree?"
- multiple meaningless `continue` prompts;
- implementation or release work consuming design space;
- a local fix being mistaken for progress on the whole product.

### Alpha.6 Output Rules

The output should be the smallest useful intervention:

- no structure for ordinary continuation;
- Light Signal for small drift or early loss of orientation;
- Full Map for explicit big-picture questions or visible stage confusion.

When Navi surfaces the three-layer model:

- Product Stage affects what kind of next step is relevant.
- Work Mode affects validation budget and allowed actions.
- Vision Distance explains whether current work is enough for the stage and what remains missing from the larger product.

Full Map output should end with a real next decision when the session remains active. The next decision must be something the user can judge, not a bare `continue`.

Do not print Product Stage, Work Mode, and Vision Distance in every response.

### Alpha.6 Boundaries

Alpha.6 is not a complete roadmap management system, not an automatic project manager, not runtime UI, not a local app, not background watcher behavior, not Memory v2, not agent adapters, not delegation, and not write delegation.

Alpha.6 must not automatically decide product direction, start implementation, create worktrees, escalate to Release mode, publish to npm, publish to a marketplace, or rebrand `src/web` as Navi alpha UI.
````

- [ ] **Step 6: Run the skill text test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL at this point if the plugin package copy or project trigger template still lacks alpha.6 strings. If it fails only in plugin/package sync expectations or template expectations, continue to Task 3 and Task 4.

---

### Task 3: Update Project Trigger Template And `navi init`

**Files:**

- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`

- [ ] **Step 1: Add concise alpha.6 trigger guidance to the template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this block after the paragraph that starts with `Use vision-distance judgment when the user asks how far`:

```markdown
Alpha.6 stage-and-vision supervision uses Product Stage, Work Mode, and Vision Distance when the user needs big-picture orientation. Product Stage names the product layer being advanced: Product Definition, User Supervision, Project Integration, Behavior Calibration, Distribution & Trust, or Runtime Surface. Work Mode names the current loop's work type: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.

Use Silent Tracking by default. Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, a worktree completion might interrupt non-blocking design, or repeated `continue` prompts indicate friction. Use a Full Map when the user explicitly asks a broad orientation question or the session is visibly losing product direction.

Vision Distance should be stage-relative, not percentage-based: say what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision. Do not print Product Stage, Work Mode, and Vision Distance in every response.
```

- [ ] **Step 2: Add the same alpha.6 guidance to generated `AGENTS.md`**

In `src/cli/navi-init.ts`, inside `renderAgentsBlock()`, insert the same Markdown text after the paragraph that starts with `Use vision-distance judgment when the user asks how far`.

Use this exact TypeScript string content, preserving backticks with escapes inside the template literal:

```ts
Alpha.6 stage-and-vision supervision uses Product Stage, Work Mode, and Vision Distance when the user needs big-picture orientation. Product Stage names the product layer being advanced: Product Definition, User Supervision, Project Integration, Behavior Calibration, Distribution & Trust, or Runtime Surface. Work Mode names the current loop's work type: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.

Use Silent Tracking by default. Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, a worktree completion might interrupt non-blocking design, or repeated \`continue\` prompts indicate friction. Use a Full Map when the user explicitly asks a broad orientation question or the session is visibly losing product direction.

Vision Distance should be stage-relative, not percentage-based: say what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision. Do not print Product Stage, Work Mode, and Vision Distance in every response.
```

- [ ] **Step 3: Run the `navi init` targeted test**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS for the new alpha.6 generated-trigger test. If it fails, compare the exact text in `docs/along/project-maps/navi-project-trigger-template.md` and `src/cli/navi-init.ts`; they should communicate the same concise rules even though the TypeScript template literal escapes backticks.

---

### Task 4: Sync Plugin Package Copy

**Files:**

- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Copy the canonical skill into the plugin package**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
```

- [ ] **Step 2: Copy the canonical reference into the plugin package**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 3: Verify package sync**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. The package copy should exactly match the canonical skill and reference, and plugin validation should pass.

---

### Task 5: Run Targeted Verification

**Files:**

- Verify: all files modified in Tasks 1 through 4

- [ ] **Step 1: Run targeted skill and init tests together**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS. This should cover the canonical skill/reference, plugin package copy expectations, project trigger template, and generated `AGENTS.md` block.

- [ ] **Step 2: Re-run plugin package verification**

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

Expected: no output and exit code 0.

- [ ] **Step 4: Inspect final changed files**

Run:

```bash
git status --short
```

Expected changed files:

```text
 M .agents/skills/along-working-thread/SKILL.md
 M .agents/skills/along-working-thread/references/working-thread-v1.md
 M docs/along/project-maps/navi-project-trigger-template.md
 M plugins/along-working-thread/skills/along-working-thread/SKILL.md
 M plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
 M src/cli/navi-init.ts
 M tests/cli/navi-init.test.ts
 M tests/skills/along-working-thread-skill.test.ts
```

Untracked `work/` may exist in the main repo context and must not be staged from the implementation worktree unless the user explicitly approves it.

---

### Task 6: Commit Implementation

**Files:**

- Stage only the eight approved implementation files listed in Task 5.

- [ ] **Step 1: Stage implementation files**

Run:

```bash
git add \
  .agents/skills/along-working-thread/SKILL.md \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  docs/along/project-maps/navi-project-trigger-template.md \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md \
  src/cli/navi-init.ts \
  tests/cli/navi-init.test.ts \
  tests/skills/along-working-thread-skill.test.ts
```

- [ ] **Step 2: Check staged diff**

Run:

```bash
git diff --cached --stat
git diff --cached --check
```

Expected: only the eight approved files are staged, and `git diff --cached --check` exits 0.

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "docs: add navi alpha 6 stage vision supervision"
```

Expected: one implementation commit containing only the docs-backed alpha.6 behavior update and targeted tests.

- [ ] **Step 4: Return implementation report**

Return:

```text
Changed files:
- List the eight staged implementation files exactly as shown by `git diff --cached --name-only`.

Validation:
- npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
- npm run verify:plugin-package
- git diff --check

Commit:
- Report the exact output of `git log -1 --oneline`.

Residual risk:
- Prompt-only behavior cannot guarantee every future response uses the model correctly.
- No fresh-session calibration was run in this implementation pass.
- No release/tag/push was performed.

Merge recommendation:
- Review and merge into main if the diff matches the alpha.6 spec and targeted validation passed.
```

---

## Plan Self-Review

Spec coverage:

- Product Stage, Work Mode, and Vision Distance are covered in Task 2 reference text and Task 3 generated trigger guidance.
- Six Product Stage names are covered in Task 1 tests and Task 2/3 implementation steps.
- Four primary Work Modes and the demotion of Exploration, Closeout, Waiting, Review, and Merge are covered in Task 1 tests and Task 2/3 implementation steps.
- Silent Tracking, Light Signal, and Full Map are covered in Task 1 tests and Task 2/3 implementation steps.
- Output non-heaviness is covered by the explicit "Do not print Product Stage, Work Mode, and Vision Distance in every response" requirement.
- Runtime/UI/release non-goals are covered in the execution boundary and reference section.

Placeholder scan:

- This plan contains no unfinished markers, incomplete sections, or vague "write tests" instructions without exact assertions.

Type and command consistency:

- Test strings match the planned skill/reference/template/init text.
- Validation commands match the approved alpha.6 validation budget.
- Commit scope is limited to the eight approved implementation files.

## Execution Handoff

Plan complete. The recommended next step is a true Codex worktree execution session using this plan. The main session should not execute these tasks inline.

If implementation is approved, create a new Codex worktree session with this plan and these boundaries:

```text
Implement docs/superpowers/plans/2026-07-02-navi-alpha6-stage-vision-supervision.md in a true worktree.

Do not tag, release, push, publish, modify src/web, modify external target projects, or run full release validation.

Run only:
- npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
- npm run verify:plugin-package
- git diff --check

Return changed files, validation output summary, residual risk, commit SHA, and merge recommendation.
```
