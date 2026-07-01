# Navi Alpha 4 Supervision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the alpha.4 supervision contract from `docs/superpowers/specs/2026-07-01-navi-alpha4-supervision-design.md`: phase supervision, verification budgets, stop signals, parallel-work supervision, proactive decision signals, and lightweight vision-distance guidance.

**Architecture:** Keep alpha.4 as a docs-backed, skill-first behavior change. Update the canonical skill and reference under `.agents/skills/along-working-thread`, keep the packaged plugin copy under `plugins/along-working-thread/skills/along-working-thread` in exact sync, and update the project-local trigger surfaces used by `navi init`. Do not add runtime, UI, memory, worktree orchestration, or release automation.

**Tech Stack:** Markdown skill/reference docs, TypeScript string rendering in `src/cli/navi-init.ts`, Vitest string/fixture tests, existing `npm run verify:plugin-package` package-sync verification.

---

## File Structure

- Modify `.agents/skills/along-working-thread/SKILL.md`
  - Canonical skill-level behavior rules for alpha.4 supervision.
  - Adds trigger coverage for stop/wait/approval/vision-distance questions.
  - Adds mode, verification budget, proactive signal, and worktree boundary rules.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Canonical detailed reference for the same behavior.
  - Defines phase set, verification budgets, bounded execution contract, parallel work supervision, proactive decision signals, and vision-distance rules.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact distribution copy of the canonical skill file.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact distribution copy of the canonical reference file.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`
  - Reusable target-project `AGENTS.md` trigger template.
  - Adds concise project-local supervision rules without turning every response into a full report.
- Modify `src/cli/navi-init.ts`
  - Updates `renderAgentsBlock()` so `navi init --write` installs the alpha.4 project-local supervision trigger.
  - Keeps the initializer narrow and project-local.
- Modify `tests/skills/along-working-thread-skill.test.ts`
  - Adds documentation contract tests for the canonical skill/reference, trigger template, package README, and existing sync invariant.
- Modify `tests/cli/navi-init.test.ts`
  - Adds generated-AGENTS assertions for alpha.4 supervision trigger content.
- Modify `docs/along/project-maps/navi-project-init.md`
  - Documents that `navi init` now installs the project-local trigger for phase/verification/worktree supervision.
- Modify `docs/along/roadmaps/navi-post-alpha-roadmap.md`
  - Records alpha.4 as the next supervision-layer implementation focus without turning it into release work.
- Modify `plugins/along-working-thread/README.md`
  - Documents the alpha.4 supervision focus at the package README level without implying UI, runtime, memory, or worktree orchestration.

## Execution Boundaries

- Do not create or modify `src/web`.
- Do not add runtime services, background watchers, UI, memory, adapters, or automatic worktree orchestration.
- Do not run full `npm test` during implementation unless the user explicitly changes this to release mode.
- Do not tag, push, prepare release notes, or publish.
- Use targeted validation:
  - `npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts`
  - `npm run verify:plugin-package` after the package copy is synced, because exact package sync is part of the touched surface.

### Task 1: Add Failing Skill And Init Contract Tests

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add a skill/reference test for alpha.4 supervision behavior**

Append this test inside `describe("Along Working Thread Codex skill", () => { ... })` in `tests/skills/along-working-thread-skill.test.ts`, near the other Navi behavior tests:

```ts
  it("documents alpha 4 phase, validation, and parallel-work supervision", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");
    const readme = await readRepoText("plugins/along-working-thread/README.md");

    for (const expected of [
      "phase supervision",
      "verification budget",
      "stop criteria",
      "proactive decision signal",
      "parallel work supervision",
      "vision-distance",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Design: decide what to do, why, and what not to do",
      "Calibration: observe real or semi-real behavior without proving the whole system",
      "Implementation: make a bounded change for a confirmed problem",
      "Release: prepare an external version that users may rely on",
      "Closeout: record outcome, risks, and next steps without adding new validation loops",
      "Exploration: investigate future directions without committing to implementation",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Design mode does not need tests",
      "Implementation mode uses targeted tests around changed behavior",
      "Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks",
      "Closeout mode records the result and should not start a new validation loop",
      "continued validation will not change the current decision",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "task goal",
      "allowed edit scope",
      "allowed validation level",
      "forbidden escalations",
      "stop criteria",
      "expected return format",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "The main session should not default to waiting for every worktree",
      "wait only when the worktree result is blocking",
      "The result will change the current design direction",
      "The result is required before a merge, release, or irreversible decision",
      "The worktree discovered a blocking fact that invalidates the current assumption",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi should proactively surface signals when silence would cause loss of control",
      "The current stage has met its stop criteria",
      "Codex is exceeding the verification budget",
      "Work is drifting from design into implementation, or from implementation into release",
      "A write, commit, push, release, external-project edit, or destructive action needs approval",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "phase supervision",
      "verification budget",
      "proactive decision signals",
      "parallel work supervision",
      "vision-distance",
      "stop, wait, approve, continue, or ask how far the current work is from the original goal",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "Alpha.4 supervision extends this from passive progress mapping to decision support",
      "whether to continue, stop, wait, approve, or move to the next phase",
      "without adding UI, runtime, memory, or automatic worktree orchestration",
    ]) {
      expect(readme).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add a `navi init` generated-trigger test for alpha.4 supervision content**

Append this test inside `describe("navi init planning", () => { ... })` in `tests/cli/navi-init.test.ts`, immediately after the existing language-following test:

```ts
  it("installs alpha 4 supervision rules for phase, validation, and parallel work", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Use Navi as a supervision layer, not just a progress reporter.",
      "phase supervision",
      "verification budget",
      "proactive decision signal",
      "parallel work supervision",
      "vision-distance",
      "Design mode does not need tests.",
      "Implementation mode uses targeted tests around changed behavior.",
      "Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.",
      "The main session should not default to waiting for every worktree.",
      "Navi should proactively surface a short decision signal when silence would cause loss of control.",
    ]) {
      expect(agents).toContain(expected);
    }
  });
```

- [ ] **Step 3: Run the targeted tests and confirm they fail for missing alpha.4 text**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL. The failure should be missing string expectations such as `phase supervision`, `verification budget`, or `Use Navi as a supervision layer, not just a progress reporter.` It should not fail because of syntax errors.

### Task 2: Update Canonical Skill And Reference

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update the skill description trigger coverage**

In `.agents/skills/along-working-thread/SKILL.md`, replace the frontmatter `description:` value with:

```yaml
description: 'Use when any active Codex project needs Working Thread continuity or Navi supervision for non-expert progress/next-step/stop/wait/approval/vision-distance confusion, including 现在做到哪了, 我看不懂, 接下来, 继续吧, should I stop, should I wait, is this enough, or 这个方案可以吗; also use for high-impact drift challenges, Challenge Briefs, or wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation without project supervision.'
```

- [ ] **Step 2: Replace the V1 alpha behavior paragraph**

In `.agents/skills/along-working-thread/SKILL.md`, replace the paragraph starting with `Navi's V1 alpha behavior centers on` with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, and alpha.4 **phase supervision**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, or how far the current work is from the original goal. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 3: Add alpha.4 hard boundaries**

In the `## Hard Boundaries` list in `.agents/skills/along-working-thread/SKILL.md`, add these bullets after `Codex must not answer progress or next-step confusion by jumping straight to more implementation work.`:

```markdown
- Codex must not let release-mode verification habits contaminate design, calibration, implementation, closeout, or exploration mode.
- Codex must not treat more tests as automatically better; validation strength must match the current stage and decision.
- Codex must not default the main session to waiting for every worktree when the result is non-blocking.
- Codex must not silently escalate a bounded implementation task into full tests, tag, push, or release preparation.
```

- [ ] **Step 4: Add alpha.4 behavior guardrails**

In the `## Behavior Guardrails` list in `.agents/skills/along-working-thread/SKILL.md`, add these bullets after the language-following bullet:

```markdown
- Navi is a supervision layer, not just a progress reporter. It helps the user decide whether to continue, stop, wait, approve, or move to the next phase.
- Alpha.4 supervision covers phase supervision, verification budget, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment.
- Navi should identify the current work mode when it affects the answer: design, calibration, implementation, release, closeout, or exploration.
- Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks. Closeout mode records the result and should not start a new validation loop.
- Navi should recommend stopping when continued validation will not change the current decision.
- Before bounded implementation or worktree execution starts, Navi should state the task goal, allowed edit scope, allowed validation level, forbidden escalations, stop criteria, and expected return format.
- The main session should not default to waiting for every worktree. Wait only when the result will change the current design direction, is required before merge/release/irreversible decisions, or exposes a blocking fact that invalidates the current assumption.
- Navi should proactively surface a short decision signal when silence would cause loss of control, such as when stop criteria are met, verification exceeds budget, work drifts into release, an approval gate appears, a worktree result is blocking, or the loop is moving away from the original goal.
- Vision-distance judgment should place current work on the path from the user's original goal to the fuller project vision without overstating maturity.
```

- [ ] **Step 5: Update progress trigger wording**

In `.agents/skills/along-working-thread/SKILL.md`, replace:

```markdown
- Navi Progress Map triggers when the user asks what should happen next, what the current progress is, whether to continue, whether the work is done, what remains, or says they do not understand the current progress.
```

with:

```markdown
- Navi Progress Map or supervision triggers when the user asks what should happen next, what the current progress is, whether to continue, whether to stop, whether to wait, whether the work is done, whether validation is enough, whether a plan should be approved, what remains, how far the work is from the original goal, or says they do not understand the current progress.
```

- [ ] **Step 6: Add a concise workflow step for supervision gates**

In `.agents/skills/along-working-thread/SKILL.md`, add this item after workflow item 4 and renumber the remaining items:

```markdown
5. If the user asks whether to stop, wait, approve, continue testing, or move phases, answer with the smallest useful supervision judgment: current phase, whether the current loop is enough, whether any worktree is blocking, and the next phase or approval gate.
```

- [ ] **Step 7: Add detailed alpha.4 reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section after `### Response Language Selection` and before `## Progress Map`:

```markdown
## Alpha 4 Supervision Layer

Alpha.4 strengthens Navi from a passive progress map into a supervision layer. Navi helps the user decide whether to continue, stop, wait, approve, or move to the next phase.

The supervision layer includes phase supervision, verification budget, stop criteria, bounded execution contracts, parallel work supervision, proactive decision signals, and lightweight vision-distance judgment.

### Phase Supervision

Navi should identify the current work stage when it affects the user's decision:

- Design: decide what to do, why, and what not to do.
- Calibration: observe real or semi-real behavior without proving the whole system.
- Implementation: make a bounded change for a confirmed problem.
- Release: prepare an external version that users may rely on.
- Closeout: record outcome, risks, and next steps without adding new validation loops.
- Exploration: investigate future directions without committing to implementation.

For each stage, Navi should understand the stage goal, allowed actions, actions that should not happen in that stage, stop criteria, and the likely next stage.

### Verification Budget

Validation strength is a stage-dependent budget, not an always-increase quality signal.

- Design mode does not need tests.
- Calibration mode uses small real or semi-real observations and does not try to prove full correctness.
- Implementation mode uses targeted tests around changed behavior.
- Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.
- Closeout mode records the result and should not start a new validation loop.
- Exploration mode reads, compares, and reasons; it does not validate nonexistent implementation.

Navi should recommend stopping when continued validation will not change the current decision.

Example:

```text
Current targeted validation is enough for implementation mode. Continuing into full tests would make this release-level work. Stop here unless you explicitly want to prepare a release.
```

### Bounded Execution Contract

Before bounded implementation or worktree execution starts, Navi should state:

- task goal;
- allowed edit scope;
- allowed validation level;
- forbidden escalations;
- stop criteria;
- expected return format.

Example:

```text
Only fix the language-following behavior. Allow prompt/template edits and targeted behavior tests. Do not run full test, tag, release, or update unrelated docs. Stop when English prompts produce English maps and Chinese prompts remain Chinese. Return changed files, tests run, residual risk, and merge recommendation.
```

### Parallel Work Supervision

The main session handles product direction, phase judgment, worktree task boundaries, whether to wait or continue, and merge/release/roadmap decisions.

Worktree sessions handle one bounded execution task, one bounded validation budget, and a concise result report.

The main session should not default to waiting for every worktree. It should wait only when the worktree result is blocking:

- The result will change the current design direction.
- The result is required before a merge, release, or irreversible decision.
- The worktree discovered a blocking fact that invalidates the current assumption.

Otherwise, the main session can continue design work under an explicit assumption.

Example:

```text
The language-following worktree is still validating. Main design can continue assuming it passes; if it fails, the failure becomes an alpha.4 prerequisite, not a reason to stop all planning.
```

### Proactive Decision Signals

Navi should proactively surface signals when silence would cause loss of control. It should not wait for users to know which question to ask.

Proactive decision signal triggers include:

- The current stage has met its stop criteria.
- Codex is exceeding the verification budget.
- Work is drifting from design into implementation, or from implementation into release.
- A write, commit, push, release, external-project edit, or destructive action needs approval.
- A worktree result is blocking the main session.
- The current loop is moving away from the original goal.
- The next phase is clear and continuing the current loop has low value.

These signals should be short and decision-oriented. Navi should not print a full map every time.

### Vision-Distance Judgment

Vision-distance judgment places current work on the path from the user's original goal to the fuller project vision.

For alpha.4 this stays lightweight. Navi should be able to say:

- what small capability the current work advances;
- what larger product stage it belongs to;
- what major capabilities remain missing;
- whether the current loop is central or peripheral;
- what next phase would most improve progress toward the vision.

Navi should not pretend that a small bugfix or release check is equivalent to progress on the full vision.
```

- [ ] **Step 8: Run the skill/reference tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for the new alpha.4 string checks after the canonical skill/reference and README are updated. Any syntax or YAML frontmatter failure must be fixed before moving on.

### Task 3: Sync The Packaged Plugin Copy

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Copy canonical skill to the packaged skill**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
```

Expected: no output.

- [ ] **Step 2: Copy canonical reference to the packaged reference**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: no output.

- [ ] **Step 3: Confirm exact sync**

Run:

```bash
cmp -s .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
echo "skill:$?"
cmp -s .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
echo "reference:$?"
```

Expected:

```text
skill:0
reference:0
```

- [ ] **Step 4: Run package sync verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. If this fails because tests now expect docs that have not yet been updated, continue to Task 4 before rerunning. If it fails because packaged files differ from canonical files, return to Steps 1-3.

### Task 4: Update Project-Local Trigger Template And `navi init` Output

**Files:**
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add alpha.4 trigger examples to the reusable template**

In `docs/along/project-maps/navi-project-trigger-template.md`, extend the trigger example list by adding these examples after `continue`:

```markdown
- `should I stop?`
- `should I wait for the worktree?`
- `is this enough validation?`
- `can I approve this plan?`
- `how far are we from the original goal?`
```

- [ ] **Step 2: Add project-local alpha.4 supervision rules to the reusable template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this text after the response-language paragraph:

```markdown
Use Navi as a supervision layer, not just a progress reporter. Alpha.4 supervision covers phase supervision, verification budget, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment.

When the user's decision depends on it, identify the current mode: design, calibration, implementation, release, closeout, or exploration. Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks. Closeout mode records the result and should not start a new validation loop.

Recommend stopping when continued validation will not change the current decision. If Codex starts exceeding the verification budget, proactively surface a short decision signal instead of continuing the loop silently.

The main session should not default to waiting for every worktree. Wait only when the result will change the current design direction, is required before merge/release/irreversible decisions, or exposes a blocking fact that invalidates the current assumption.

Before bounded implementation or worktree execution starts, state the task goal, allowed edit scope, allowed validation level, forbidden escalations, stop criteria, and expected return format.

Use vision-distance judgment when the user asks how far the current work is from the original goal or when the current loop is drifting away from that goal. Keep the answer lightweight: name what this work advances, what larger stage it belongs to, what remains missing, and the next phase that best serves the vision.
```

- [ ] **Step 3: Mirror the same examples in `renderAgentsBlock()`**

In `src/cli/navi-init.ts`, add these lines to the trigger examples list in `renderAgentsBlock()` after `- \`continue\``:

```ts
- \`should I stop?\`
- \`should I wait for the worktree?\`
- \`is this enough validation?\`
- \`can I approve this plan?\`
- \`how far are we from the original goal?\`
```

- [ ] **Step 4: Mirror the same supervision rules in `renderAgentsBlock()`**

In `src/cli/navi-init.ts`, insert this exact text after the response-language paragraph inside `renderAgentsBlock()`:

```ts
Use Navi as a supervision layer, not just a progress reporter. Alpha.4 supervision covers phase supervision, verification budget, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment.

When the user's decision depends on it, identify the current mode: design, calibration, implementation, release, closeout, or exploration. Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks. Closeout mode records the result and should not start a new validation loop.

Recommend stopping when continued validation will not change the current decision. If Codex starts exceeding the verification budget, proactively surface a short decision signal instead of continuing the loop silently.

The main session should not default to waiting for every worktree. Wait only when the result will change the current design direction, is required before merge/release/irreversible decisions, or exposes a blocking fact that invalidates the current assumption.

Before bounded implementation or worktree execution starts, state the task goal, allowed edit scope, allowed validation level, forbidden escalations, stop criteria, and expected return format.

Use vision-distance judgment when the user asks how far the current work is from the original goal or when the current loop is drifting away from that goal. Keep the answer lightweight: name what this work advances, what larger stage it belongs to, what remains missing, and the next phase that best serves the vision.
```

- [ ] **Step 5: Run the `navi init` tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

### Task 5: Update Supporting Docs Without Entering Release Mode

**Files:**
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/roadmaps/navi-post-alpha-roadmap.md`
- Modify: `plugins/along-working-thread/README.md`

- [ ] **Step 1: Update `navi-project-init.md` to mention alpha.4 supervision**

In `docs/along/project-maps/navi-project-init.md`, add this paragraph after the `global skill + project-local trigger source + project-local Project Map` code block:

```markdown
For alpha.4, the project-local trigger source also carries Navi supervision rules: phase supervision, verification budget, stop criteria, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment. This lets fresh sessions help the user decide whether to continue, stop, wait, approve, or move to the next phase without depending only on global skill auto-routing.
```

- [ ] **Step 2: Update the initialization flow**

In `docs/along/project-maps/navi-project-init.md`, replace step 3:

```markdown
3. Draft the project-local trigger source.
```

with:

```markdown
3. Draft the project-local trigger source, including the alpha.4 supervision rules for phase, validation budget, stop/wait/approval gates, worktree waiting, and vision-distance judgment.
```

- [ ] **Step 3: Add alpha.4 to the roadmap**

In `docs/along/roadmaps/navi-post-alpha-roadmap.md`, add this section after `## Challenge Moment Integration`:

```markdown
## Alpha 4 Supervision Focus

Goal: strengthen Navi as a supervision layer before expanding into a full project navigation console.

- P0: Add phase supervision so Navi can explain whether the current work is design, calibration, implementation, release, closeout, or exploration.
- P0: Add verification budget guidance so Navi can tell the user when targeted validation is enough and when continued checks have become release-level work.
- P0: Add proactive decision signals for stop, wait, approval, phase-change, and over-validation moments.
- P0: Add parallel work supervision so the main session does not default to waiting for every bounded worktree.
- P1: Add lightweight vision-distance judgment so Navi can place current work on the path from the user's original goal to the fuller Navi vision.

This is not approval to implement runtime UI, background watchers, Memory v2, agent adapters, delegation, marketplace distribution, or release automation.
```

- [ ] **Step 4: Update plugin README**

In `plugins/along-working-thread/README.md`, add this paragraph after the paragraph that starts `Navi helps users understand, supervise, and steer expert agents.`:

```markdown
Alpha.4 supervision extends this from passive progress mapping to decision support for whether to continue, stop, wait, approve, or move to the next phase. It covers phase supervision, verification budgets, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment without adding UI, runtime, memory, or automatic worktree orchestration.
```

- [ ] **Step 5: Run documentation contract tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

### Task 6: Final Targeted Verification And Review

**Files:**
- Review: all modified files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

- [ ] **Step 3: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Review the actual diff for scope creep**

Run:

```bash
git diff -- .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts docs/along/project-maps/navi-project-init.md docs/along/roadmaps/navi-post-alpha-roadmap.md plugins/along-working-thread/README.md
```

Expected:

- Diff only touches alpha.4 supervision text, generated trigger text, targeted tests, and supporting docs.
- No `src/web` changes.
- No runtime, memory, adapter, or release automation changes.
- No release notes, tag, version, or changelog changes unless the user explicitly moved to release mode.

- [ ] **Step 5: Check repository state**

Run:

```bash
git status --short --branch
```

Expected:

```text
## main...origin/main
 M .agents/skills/along-working-thread/SKILL.md
 M .agents/skills/along-working-thread/references/working-thread-v1.md
 M docs/along/project-maps/navi-project-init.md
 M docs/along/project-maps/navi-project-trigger-template.md
 M docs/along/roadmaps/navi-post-alpha-roadmap.md
 M plugins/along-working-thread/README.md
 M plugins/along-working-thread/skills/along-working-thread/SKILL.md
 M plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
 M src/cli/navi-init.ts
 M tests/cli/navi-init.test.ts
 M tests/skills/along-working-thread-skill.test.ts
?? docs/superpowers/plans/2026-07-01-navi-alpha4-supervision.md
?? docs/superpowers/specs/2026-07-01-navi-alpha4-supervision-design.md
?? work/
```

Existing untracked `work/` should remain untouched.

## Commit Guidance

Do not commit automatically during implementation unless the user explicitly approves commit creation for this implementation pass.

If the user approves a commit after all targeted verification passes, use:

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/README.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts docs/along/project-maps/navi-project-init.md docs/along/roadmaps/navi-post-alpha-roadmap.md docs/superpowers/specs/2026-07-01-navi-alpha4-supervision-design.md docs/superpowers/plans/2026-07-01-navi-alpha4-supervision.md
git commit -m "docs: plan navi alpha 4 supervision"
```

## Spec Coverage Self-Review

- Phase supervision: Task 2 adds canonical behavior and reference; Task 1 tests it.
- Verification budget and stop mechanism: Task 2 adds rules; Task 4 installs them into target-project triggers; Task 1 and Task 4 test them.
- Verification budget contract: Task 2 defines the contract; Task 4 installs a concise target-project version.
- Parallel work supervision: Task 2 defines wait/non-wait conditions; Task 4 installs the same rule for fresh sessions.
- Vision-distance judgment: Task 2 defines lightweight source behavior; Task 4 installs target-project trigger guidance.
- Proactive decision signals: Task 2 defines triggers; Task 4 installs short signal guidance.
- Source evidence priority and language-following: existing tests remain in place; Task 6 targeted tests protect them from regression.
- Non-goals: Task 6 diff review explicitly checks that no UI, runtime, memory, worktree orchestration, release, or `src/web` work was added.
- Acceptance strategy: Task 6 uses targeted tests and package sync verification, not full release-mode validation.
