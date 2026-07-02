# Navi Alpha 5 Pause Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.5 pause semantics to Navi's docs-backed behavior so Codex continues inside clear boundaries and stops at real user decision points.

**Architecture:** This is a prompt/rule-level behavior change. The canonical behavior lives in the repo skill and reference, the project-local trigger template and `navi init` generated block carry the behavior into target projects, and the packaged plugin copy must remain byte-for-byte synced with the canonical skill directory.

**Tech Stack:** Markdown skill/reference docs, TypeScript `navi init`, Vitest targeted tests, existing `npm run verify:plugin-package` package consistency check.

---

## Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Start the worktree from the current local `main` state that includes:

```text
f742198 docs: add navi alpha 5 pause semantics design
```

Do not start from `origin/main` unless that commit has first been pushed or otherwise made available in the worktree.

Do not tag, release, publish to npm, update GitHub Releases, or run release checklist work in this implementation pass.

## File Structure

- Modify `.agents/skills/along-working-thread/SKILL.md`
  - Adds concise alpha.5 pause semantics guardrails to the canonical skill entrypoint.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Adds the full alpha.5 pause semantics reference section.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Mechanical copy of the canonical skill after edits.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Mechanical copy of the canonical reference after edits.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds the lightweight project-local trigger rules for pause semantics.
- Modify `src/cli/navi-init.ts`
  - Adds the same project-local trigger rules to generated `AGENTS.md` blocks.
- Modify `tests/skills/along-working-thread-skill.test.ts`
  - Adds targeted assertions for canonical skill/reference/template pause semantics.
- Modify `tests/cli/navi-init.test.ts`
  - Adds targeted assertions that `navi init --write` installs pause semantics in generated `AGENTS.md`.

No other files are in scope unless a targeted test failure proves a direct consistency issue inside this same surface.

---

### Task 1: Add Failing Tests For Alpha.5 Pause Semantics

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add skill/reference/template assertions**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test immediately after the existing test named `"documents alpha 4 phase, validation, and parallel-work supervision"`:

```ts
  it("documents alpha 5 pause semantics and decision-point stopping", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.5 pause semantics",
      "continue inside a bounded, already-approved loop",
      "stop at decisions the user can actually judge",
      "continue to the already-defined acceptance point",
      "Do not stop just because a local sub-step finished",
      "explain the pause reason",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 5 Pause Semantics Layer",
      "Continue-Through Rule",
      "Decision-Point Stop Rule",
      "Pause Reason Rule",
      "No Local Completion Stop Rule",
      "When the next action, boundary, and acceptance point are already clear",
      "Navi should not stop simply because a sub-step finished",
      "successful file write or `git diff --check` pass",
      "writing to files when the current mode was read-only",
      "staging, committing, pushing, tagging, or releasing",
      "Use the smallest useful intervention",
      "No map when the user says `continue` and the continuation boundary is already clear",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add `navi init` generated block assertions**

In `tests/cli/navi-init.test.ts`, insert this test immediately after the existing test named `"installs alpha 4 supervision rules for phase, validation, and parallel work"`:

```ts
  it("installs alpha 5 pause semantics rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.5 pause semantics",
      "continue to the already-defined acceptance point",
      "Do not stop just because a local sub-step finished",
      "Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases",
      "When stopping, explain the pause reason in one sentence",
      "Use a light continuation contract when a multi-step loop is clear",
    ]) {
      expect(agents).toContain(expected);
    }
  });
```

- [ ] **Step 3: Run targeted tests and confirm failure**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL. The new tests should fail because the alpha.5 strings are not yet present in the skill, reference, template, or generated `AGENTS.md` block.

---

### Task 2: Update Canonical Skill And Reference

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update the skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, replace:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, and alpha.4 **phase supervision**.
```

with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, and alpha.5 **pause semantics**.
```

- [ ] **Step 2: Add hard-boundary bullets**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets under `## Hard Boundaries` after the existing release-escalation bullet:

```markdown
- Codex must not require user continuation for local sub-step completion when the next action, boundary, and acceptance point are already clear.
- Codex must not use pause semantics to bypass user approval, tool approval, write gates, commit/push/tag/release gates, mode changes, scope expansion, validation-budget escalation, or cross-project modification.
```

- [ ] **Step 3: Add alpha.5 behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets under `## Behavior Guardrails` immediately after the alpha.4 supervision bullet:

```markdown
- Alpha.5 pause semantics covers pause reasons, decision-point stopping, continue-through behavior, and no-local-completion stops.
- The goal is to continue inside a bounded, already-approved loop and stop at decisions the user can actually judge.
- If the next action, boundary, and acceptance point are already clear, continue to the already-defined acceptance point instead of stopping at each local sub-step.
- Do not stop just because a local sub-step finished, such as a doc write, read-only status check, or `git diff --check` passing.
- Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance.
- When stopping, explain the pause reason in one sentence when possible and say what continuing would do.
- Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
```

- [ ] **Step 4: Replace the older continue bullet**

In `.agents/skills/along-working-thread/SKILL.md`, replace the current bullet:

```markdown
- when the user says continue or `继续吧`, continue directly if the previous context clearly established the next action, purpose, boundary, and acceptance point; otherwise give a short Progress Map before continuing.
```

with:

```markdown
- when the user says continue or `继续吧`, continue directly to the already-defined acceptance point if the previous context clearly established the next action, purpose, boundary, and acceptance point; otherwise give a short Progress Map before continuing.
```

- [ ] **Step 5: Add the reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section immediately after the `### Vision-Distance Judgment` section and before `## Progress Map`:

```markdown
## Alpha 5 Pause Semantics Layer

Alpha.5 adds pause semantics to the alpha.4 supervision layer. Alpha.4 decides the current mode and validation budget. Alpha.5 decides how to continue or stop inside that mode.

The goal is:

```text
Continue inside a bounded, already-approved loop; stop at decisions the user can actually judge.
```

This is not a promise to never stop. Some stops are required for user control, tool approval, safety, and project ownership.

### Continue-Through Rule

When the next action, boundary, and acceptance point are already clear, Navi should help Codex continue to the already-defined acceptance point instead of stopping at every local completion.

For example, if Codex has said it will write a calibration note, run a doc-only `git diff --check`, and then stop at the commit decision, then successful file write or `git diff --check` pass is not a user decision point. The user should not need to type `continue` merely to reach the commit decision.

If the user says `continue` or `继续` and no permission, risk, mode, project, or release boundary is crossed, Navi should continue directly rather than re-rendering a full Progress Map.

### Decision-Point Stop Rule

Navi should stop when the next step asks the user to decide something meaningful, approve an action, accept risk, change mode, or change scope.

Required stop points include:

- writing to files when the current mode was read-only;
- touching another project;
- staging, committing, pushing, tagging, or releasing;
- changing from design to implementation;
- changing from implementation to release;
- expanding scope beyond the approved task;
- spending a higher validation budget than the current mode allows;
- accepting a known risk;
- choosing between materially different product directions;
- resolving a failed check that requires code or behavior changes.

### Pause Reason Rule

When Navi stops proactively, it should explain the pause reason briefly and say what would happen if the user approves continuing.

Default shape:

```text
I am stopping here because the next step is a git commit. If you approve, I will commit only the alpha.5 pause semantics implementation files and will not push, tag, or release.
```

Prefer one sentence when the context is simple. Do not print a full Progress Map when a pause reason is enough.

### No Local Completion Stop Rule

Navi should not stop simply because a sub-step finished. It should continue until the already-declared acceptance point unless a new fact creates a real decision.

Avoidable stop points include:

- "The doc was written."
- "`git diff --check` passed."
- "The readonly status check completed."
- "The first file read finished."
- "A non-blocking worktree produced another progress update."

These can be reported as progress if useful, but they should not require a user `continue` when the larger boundary is already approved.

### Pause Semantics Output Strategy

Use the smallest useful intervention:

- No map when the user says `continue` and the continuation boundary is already clear.
- One-sentence pause reason when the only issue is why the agent stopped.
- Light continuation contract when the task will take multiple steps but the boundary is clear.
- Compact Progress Map when the user asks where the project is, what comes next, whether to continue, or says they do not understand.
- Challenge Moment when continuing would drift, over-validate, self-certify, or cross an unsafe boundary.

If pause semantics make Navi produce a strong structure on every response, the behavior is wrong. The point is less meaningless stopping, not more process text.
```

- [ ] **Step 6: Run skill tests and confirm remaining expected failures**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL if the project trigger template or packaged copy assertions are still unmet. PASS is also acceptable if the inserted canonical strings satisfy all skill-side assertions before package sync. Do not broaden the test run yet.

---

### Task 3: Update Project-Local Trigger Template And `navi init`

**Files:**
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add alpha.5 trigger text to the reusable template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this text immediately after the paragraph that starts `Recommend stopping when continued validation will not change the current decision.`:

```markdown
Alpha.5 pause semantics: when the next action, boundary, and acceptance point are already clear, continue to the already-defined acceptance point instead of stopping at each local sub-step. Do not stop just because a local sub-step finished, such as a doc write, read-only status check, or `git diff --check` passing.

Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance. When stopping, explain the pause reason in one sentence and say what continuing would do.

Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
```

- [ ] **Step 2: Add the same trigger text to generated `AGENTS.md` blocks**

In `src/cli/navi-init.ts`, inside `renderAgentsBlock()`, insert the same three paragraphs immediately after this existing paragraph:

```ts
Recommend stopping when continued validation will not change the current decision. Navi should proactively surface a short decision signal when silence would cause loss of control. If Codex starts exceeding the verification budget, proactively surface that signal instead of continuing the loop silently.
```

The inserted TypeScript template text should be:

```ts
Alpha.5 pause semantics: when the next action, boundary, and acceptance point are already clear, continue to the already-defined acceptance point instead of stopping at each local sub-step. Do not stop just because a local sub-step finished, such as a doc write, read-only status check, or \`git diff --check\` passing.

Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance. When stopping, explain the pause reason in one sentence and say what continuing would do.

Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
```

- [ ] **Step 3: Run `navi init` targeted tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

---

### Task 4: Sync Packaged Skill Copy

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Copy canonical skill files into the plugin package**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 2: Run skill/package targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This command also runs the skill package tests and verifies packaged source consistency.

---

### Task 5: Final Targeted Validation And Diff Review

**Files:**
- Inspect: all modified files
- Test: targeted alpha.5 behavior surface only

- [ ] **Step 1: Run the combined targeted test set**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git diff --stat
```

Expected changed files:

```text
.agents/skills/along-working-thread/SKILL.md
.agents/skills/along-working-thread/references/working-thread-v1.md
plugins/along-working-thread/skills/along-working-thread/SKILL.md
plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
docs/along/project-maps/navi-project-trigger-template.md
src/cli/navi-init.ts
tests/skills/along-working-thread-skill.test.ts
tests/cli/navi-init.test.ts
```

If other files changed, inspect them and remove unrelated changes unless they are directly required by a targeted failure in this plan.

---

### Task 6: Worktree Commit And Handoff Report

**Files:**
- Stage only the alpha.5 implementation files from Task 5.

- [ ] **Step 1: Check worktree status**

Run:

```bash
git status --short --branch
```

Expected: only the alpha.5 implementation files from Task 5 are modified.

- [ ] **Step 2: Commit in the implementation worktree**

Run:

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
git commit -m "docs: add navi alpha 5 pause semantics"
```

Expected: commit succeeds in the worktree. Do not push from the worktree unless the main session explicitly approves.

- [ ] **Step 3: Return a concise handoff report**

Return this information to the main session:

```text
Changed files:
- .agents/skills/along-working-thread/SKILL.md
- .agents/skills/along-working-thread/references/working-thread-v1.md
- plugins/along-working-thread/skills/along-working-thread/SKILL.md
- plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
- docs/along/project-maps/navi-project-trigger-template.md
- src/cli/navi-init.ts
- tests/skills/along-working-thread-skill.test.ts
- tests/cli/navi-init.test.ts

Tests run:
- npm test -- tests/cli/navi-init.test.ts
- npm test -- tests/skills/along-working-thread-skill.test.ts
- npm run verify:plugin-package
- npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
- git diff --check

Behavior summary:
- Navi now distinguishes local-completion stops from real decision-point stops.
- `continue` / `继续` can proceed directly to an already-defined acceptance point.
- Required pauses explain the pause reason and bounded next action.

Not done:
- no full test suite
- no typecheck
- no tag
- no release
- no push
- no runtime/UI/MCP changes

Residual risk:
- prompt-level behavior remains non-deterministic until fresh-session calibration confirms the wording.
```

---

## Post-Implementation Calibration Gate

Do not run fresh-session calibration inside the implementation worktree by default.

After the main session reviews or merges the worktree result, the main session should decide whether to run one read-only calibration prompt in `sub_ag_ski` or another real target project:

```text
Read-only Navi calibration. Do not modify files, commit, push, tag, or release.

Where is this project now? Should we continue? If yes, continue to what acceptance point, and where should you stop for user decision?
```

Expected behavior: a bounded continuation contract or a clear pause reason, not a full proof of product correctness.
