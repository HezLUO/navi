# Navi Alpha 5 Next Decision Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the alpha.5 Next Decision Visibility follow-up so Navi exposes the smallest useful next decision when a valid stop would otherwise leave the user only able to say `continue`.

**Architecture:** This is a prompt/docs-backed behavior change. Update the canonical Navi skill and reference, project-local trigger template, generated `navi init` trigger block, packaged skill copy, and targeted text tests. No runtime, UI, MCP, release, or external-project changes are in scope.

**Tech Stack:** Markdown skill/reference docs, TypeScript CLI template text in `src/cli/navi-init.ts`, Vitest text assertions, existing plugin package verification script.

---

## Execution Boundary

This plan must be executed in a true Codex worktree session, not in the main Navi design/supervision session.

Start the implementation worktree from current local `main` after the plan commit. The starting history must include:

- `00877b5 docs: record navi next-decision pause friction`
- `6c75f5f docs: add navi next-decision visibility design`
- this implementation plan commit

The implementation worktree must not:

- push;
- tag;
- create a GitHub Release;
- update release notes, README, README.zh-CN, or CHANGELOG;
- touch `src/web`;
- change MCP server/runtime/UI behavior;
- modify external target projects;
- run the full test suite unless a targeted test reveals an actual shared-core issue and the worktree report explains why escalation was needed.

The main session will review and decide whether to merge the worktree result.

## File Structure

Modify these files only:

- `.agents/skills/along-working-thread/SKILL.md`
  - Canonical skill entrypoint.
  - Add a concise hard boundary and behavior guardrail for Next Decision Visibility.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Canonical full reference.
  - Add the detailed Next Decision Visibility rule and output shape.
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Packaged copy of the canonical skill entrypoint.
  - Keep byte-for-byte aligned with `.agents/skills/along-working-thread/SKILL.md`.
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Packaged copy of the canonical reference.
  - Keep byte-for-byte aligned with `.agents/skills/along-working-thread/references/working-thread-v1.md`.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Project-local trigger template used by docs and `navi init`.
  - Add lightweight Next Decision Visibility guidance.
- `src/cli/navi-init.ts`
  - Generated `AGENTS.md` text.
  - Keep trigger wording aligned with `docs/along/project-maps/navi-project-trigger-template.md`.
- `tests/skills/along-working-thread-skill.test.ts`
  - Targeted text assertions for canonical skill/reference/template.
- `tests/cli/navi-init.test.ts`
  - Targeted text assertions for generated `AGENTS.md`.

Do not create new source modules. Do not add dependencies.

## Task 1: Add Failing Targeted Tests

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Extend the skill/reference/template alpha.5 test**

In `tests/skills/along-working-thread-skill.test.ts`, find:

```ts
  it("documents alpha 5 pause semantics and decision-point stopping", async () => {
```

Inside the first `for (const expected of [...])` block, add these exact expected strings:

```ts
      "Next Decision Visibility",
      "smallest useful next-decision hint",
      "no visible next decision except `continue`",
      "valid stop can still create continuation friction",
```

Inside the second `for (const expected of [...])` block for the reference file, add these exact expected strings:

```ts
      "Next Decision Visibility Rule",
      "When Navi or Codex proactively stops",
      "No Hint",
      "One Default Recommendation",
      "Short Option Set",
      "the stop is already a clear approval gate",
      "after commit, push, merge, validation, or worktree handoff",
      "does not force a Progress Map",
```

- [ ] **Step 2: Extend the generated `navi init` test**

In `tests/cli/navi-init.test.ts`, find:

```ts
  it("installs alpha 5 pause semantics rules for generated Navi triggers", async () => {
```

Inside the `for (const expected of [...])` block, add these exact expected strings:

```ts
      "Next Decision Visibility",
      "smallest useful next-decision hint",
      "no visible next decision except `continue`",
      "after commit, push, merge, validation, or worktree handoff",
      "does not force a Progress Map",
```

- [ ] **Step 3: Run the targeted tests and verify the red state**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL because the new Next Decision Visibility strings are not yet present in the skill, reference, template, or generated trigger.

If the command fails because dependencies are missing in the worktree, run:

```bash
npm ci
```

Then rerun the targeted test command. Do not change dependency versions.

## Task 2: Update Canonical Skill Entrypoint

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`

- [ ] **Step 1: Add a hard boundary**

In `.agents/skills/along-working-thread/SKILL.md`, in `## Hard Boundaries`, after:

```md
- Codex must not use pause semantics to bypass user approval, tool approval, write gates, commit/push/tag/release gates, mode changes, scope expansion, validation-budget escalation, or cross-project modification.
```

Add:

```md
- Codex must not stop after a valid completed action and leave the user with no visible next decision except `continue` when the session is still active.
```

- [ ] **Step 2: Add the behavior guardrail**

In `## Behavior Guardrails`, after:

```md
- When stopping, explain the pause reason in one sentence when possible and say what continuing would do.
```

Add:

```md
- Next Decision Visibility covers valid stops that still create continuation friction. When Navi or Codex proactively stops and the user would otherwise have no visible next decision except `continue` or `继续`, provide the smallest useful next-decision hint.
- Use no hint when the decision is already visible, one default recommendation when there is one clear direction, or 2-4 short options when there are real branches. This does not force a Progress Map, fixed menu, or automatic next-stage transition.
```

- [ ] **Step 3: Keep existing alpha.5 rules intact**

Do not remove or weaken these existing lines:

```md
- Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance.
- Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
- Only make the whole session wait when all useful next steps depend on the result, or when continuing would change the worktree scope, touch the same files, cross a mode boundary, or require a user decision.
```

## Task 3: Update Canonical Reference

**Files:**
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Add the Next Decision Visibility section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, find the end of `### Waiting Scope Rule`:

```md
Do not treat a waiting worktree, external review, or background track as a reason to stop the whole main session unless one of those whole-session stop conditions is present.
```

After it, add:

```md
### Next Decision Visibility Rule

A valid stop can still create continuation friction if it hides the next decision.

When Navi or Codex proactively stops, and the user would otherwise have no visible next decision except `continue` or `继续`, provide the smallest useful next-decision hint.

Use this rule after commit, push, merge, validation, or worktree handoff completes and the session remains active; when the pause reason itself does not reveal what the user can choose next; when multiple reasonable tracks exist such as closeout, calibration, design, implementation planning, or release preparation; or when recent interaction shows the user repeatedly has to ask `continue` to get direction.

Do not add the hint when the user already gave the next instruction, the stop is already a clear approval gate, the session naturally ends, the current loop should continue to an already-defined acceptance point, or the hint would become fixed boilerplate.

#### No Hint

If the next decision is already visible, do not add extra structure.

Example:

```text
I am stopping because the next action is `git push origin main`.
```

#### One Default Recommendation

Use this when there is one clear next direction.

Example:

```text
Next decision: close this alpha.5 follow-up here, or approve a small implementation plan to add this rule.
```

#### Short Option Set

Use this when there are real branches.

Example:

```text
Next decision: commit this note, keep collecting examples, or switch back to product design.
```

The option set should usually be 2-4 short choices.

Next Decision Visibility does not force a Progress Map. Use a Progress Map or Rhythm Map only when the user asks where the project is, asks what comes next, or says they do not understand the broader project state.
```

- [ ] **Step 2: Ensure the output strategy still reads as lightweight**

In `### Pause Semantics Output Strategy`, keep:

```md
Use the smallest useful intervention:
```

Do not add a rule that says every stop must print a menu.

## Task 4: Update Project Trigger Template And `navi init`

**Files:**
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`

- [ ] **Step 1: Update the project trigger template**

In `docs/along/project-maps/navi-project-trigger-template.md`, after:

```md
Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
```

Add:

```md
Next Decision Visibility: a valid stop can still create continuation friction if it hides the next decision. When Navi or Codex proactively stops and the user would otherwise have no visible next decision except `continue` or `继续`, provide the smallest useful next-decision hint.

Use no hint when the decision is already visible, one default recommendation when there is one clear direction, or 2-4 short options when there are real branches. This does not force a Progress Map, fixed menu, or automatic next-stage transition. Use a Progress Map or Rhythm Map only when the user asks for broader orientation.
```

- [ ] **Step 2: Update the generated trigger block**

In `src/cli/navi-init.ts`, in the large `renderAgentsBlock()` template, after the same continuation-contract paragraph:

```ts
Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.
```

Add the same text with Markdown backticks escaped for the TypeScript template literal:

```ts
Next Decision Visibility: a valid stop can still create continuation friction if it hides the next decision. When Navi or Codex proactively stops and the user would otherwise have no visible next decision except \`continue\` or \`继续\`, provide the smallest useful next-decision hint.

Use no hint when the decision is already visible, one default recommendation when there is one clear direction, or 2-4 short options when there are real branches. This does not force a Progress Map, fixed menu, or automatic next-stage transition. Use a Progress Map or Rhythm Map only when the user asks for broader orientation.
```

- [ ] **Step 3: Keep the template and generated block aligned**

Compare the new paragraphs in:

```text
docs/along/project-maps/navi-project-trigger-template.md
src/cli/navi-init.ts
```

Expected: same reader-facing wording, with only TypeScript template-literal escaping differences in `src/cli/navi-init.ts`.

## Task 5: Sync Packaged Skill Copy

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Copy canonical skill files into the packaged skill**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: packaged skill files match the canonical source files.

- [ ] **Step 2: Verify package-copy drift locally**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. The script should report that plugin validation passed and source/package skill drift is clean.

## Task 6: Run Targeted Validation

**Files:**
- No edits.

- [ ] **Step 1: Run the combined targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS with 2 test files and 57 tests.

- [ ] **Step 2: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

- [ ] **Step 3: Run whitespace validation**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Review changed file list**

Run:

```bash
git diff --name-only
```

Expected exactly these files:

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

If additional files changed because `npm ci` created `node_modules`, do not stage dependency artifacts.

## Task 7: Commit And Handoff

**Files:**
- Stage only the eight approved implementation files.

- [ ] **Step 1: Stage the implementation files**

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
```

- [ ] **Step 2: Check staged files**

Run:

```bash
git diff --cached --name-only
```

Expected exactly the same eight files listed in Task 6 Step 4.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git commit -m "docs: add navi next-decision visibility rule"
```

Expected: commit succeeds in the worktree.

- [ ] **Step 4: Return handoff to the main session**

The handoff report must include:

```text
Commit:
- the output of `git log -1 --oneline`

Changed files:
- .agents/skills/along-working-thread/SKILL.md
- .agents/skills/along-working-thread/references/working-thread-v1.md
- plugins/along-working-thread/skills/along-working-thread/SKILL.md
- plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
- docs/along/project-maps/navi-project-trigger-template.md
- src/cli/navi-init.ts
- tests/skills/along-working-thread-skill.test.ts
- tests/cli/navi-init.test.ts

Validation:
- Red targeted test before implementation: yes/no with failure reason
- npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts: pass/fail
- npm run verify:plugin-package: pass/fail
- git diff --check: pass/fail

Behavior summary:
- Navi now treats missing next decision after a valid stop as pause friction.
- Navi gives the smallest useful next-decision hint only when the user would otherwise have no visible choice except continue.
- The rule does not force a Progress Map, fixed menu, or automatic next-stage transition.

Not done:
- no full test suite
- no typecheck
- no push
- no tag
- no release
- no runtime/UI/MCP changes

Residual risk:
- Prompt-level reliability still needs small fresh-session calibration after merge if the main session decides it is worth doing.
```

## Main Session Review After Worktree

After the worktree returns, the main session should:

1. Read the handoff report.
2. Inspect the worktree commit diff.
3. Confirm the changed-file list is limited to the eight implementation files.
4. Run targeted validation on `main` after merge:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
npm run verify:plugin-package
git diff --check
```

5. Decide whether to push `main`.

This review is not release mode. Do not tag or create a GitHub Release unless the user explicitly enters release mode.

## Self-Review

Spec coverage:

- Next Decision Visibility rule: Task 3.
- Smallest useful output strategy: Tasks 2, 3, and 4.
- No fixed menu or Progress Map requirement: Tasks 2, 3, 4, and tests in Task 1.
- Implementation surface: Tasks 2 through 5.
- Targeted validation only: Task 6.
- True worktree execution boundary: Execution Boundary and Main Session Review sections.

Red-flag scan:

- No unresolved fill-ins remain.

Scope check:

- This is a single prompt/docs-backed behavior patch. It does not need decomposition into multiple plans.
