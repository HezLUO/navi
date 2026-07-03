# Navi Alpha 7 Coordination Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.7 Coordination Layer guidance to Navi's docs-backed behavior so the main session can coordinate worktrees, calibration, review/merge, release, and external waiting lanes without blocking useful non-conflicting work.

**Architecture:** Keep this as a prompt/docs-backed behavior update. Add failing text tests first, update the canonical skill/reference and generated project-local trigger text, then sync the plugin package copy and run targeted verification. Do not add runtime code, automatic thread orchestration, UI, background automation, Memory v2, agent adapters, release automation, or package publication.

**Tech Stack:** Markdown skill docs, TypeScript CLI string rendering, Vitest text assertions, existing plugin package verification script.

---

## Navi-Specific Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Start the implementation worktree from the current local `main` state that includes:

```text
fbe5ed5 docs: add navi alpha 7 coordination design
```

If that commit has not been pushed yet, do not start from `origin/main` unless the worktree is explicitly created from the local working tree or after the commit is pushed.

Do not tag, release, publish to npm, update GitHub Releases, run full release checklists, modify `src/web`, modify external target projects, or expand this into runtime/thread orchestration work.

Allowed validation:

- `npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts`
- `npm run verify:plugin-package`
- `git diff --check`

Do not run the full test suite or typecheck unless a targeted failure shows this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/skills/along-working-thread-skill.test.ts`
  - Adds a targeted alpha.7 text test for canonical skill, canonical reference, and project trigger template.
- `tests/cli/navi-init.test.ts`
  - Adds a targeted generated-`AGENTS.md` test proving `navi init` installs alpha.7 guidance.
- `.agents/skills/along-working-thread/SKILL.md`
  - Adds concise alpha.7 behavior guardrails to the canonical skill entrypoint.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Adds the full alpha.7 reference section after alpha.6 and before Progress Map guidance.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds concise project-local alpha.7 trigger guidance.
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

### Task 1: Add Failing Alpha.7 Text Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add the canonical skill/reference/template test**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test after the existing `"documents alpha 6 stage and vision supervision"` test and before `"documents the Navi Project Map model and source priority"`:

```ts
  it("documents alpha 7 coordination layer supervision", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.7 coordination layer",
      "Coordination Layer",
      "lane-level waiting",
      "whole-session blocked",
      "main session can continue non-conflicting work",
      "completed worktree should create a review option",
      "not an automatic whole-session interruption",
      "Review / Merge is a workflow lane",
      "Release Lane requires explicit user approval",
      "Do not force lane tables into ordinary answers",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 7 Coordination Layer",
      "Lane is a bounded stream of work",
      "Coordination Decision is the main-session judgment",
      "Main Lane",
      "Implementation Lane",
      "Calibration Lane",
      "Review / Merge Lane",
      "Release Lane",
      "External Lane",
      "Lane-level waiting means one stream cannot continue",
      "Whole-session blocked means no useful non-conflicting work remains",
      "continue main lane",
      "switch to review",
      "defer review",
      "pause for user decision",
      "Worktree Running Rule",
      "Worktree Completed Rule",
      "Conflict Rule",
      "Review / Merge Gate Rule",
      "External Wait Rule",
      "Next Decision Rule",
      "Alpha.7 answers",
      "How should the main session coordinate multiple lanes without losing user control?",
      "not automatic thread orchestration",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add the `navi init` generated-trigger test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"installs alpha 6 stage and vision supervision rules for generated Navi triggers"` test:

```ts
  it("installs alpha 7 coordination layer rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.7 coordination layer",
      "Coordination Layer",
      "Main Lane",
      "Implementation Lane",
      "Calibration Lane",
      "Review / Merge Lane",
      "Release Lane",
      "External Lane",
      "lane-level waiting",
      "whole-session blocked",
      "The main session can continue non-conflicting work",
      "A completed worktree should create a review option, not an automatic whole-session interruption.",
      "Review immediately when the result may change the current design premise",
      "Defer review when the current main-lane work is non-conflicting",
      "Do not force lane tables into ordinary answers.",
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

Expected: FAIL. The first failure should mention a missing alpha.7 string such as `Alpha.7 coordination layer`.

Do not commit failing tests yet.

---

### Task 2: Update Canonical Skill Entry Point

**Files:**

- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update the canonical skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, replace the paragraph beginning with `Navi's V1 alpha behavior centers on` with:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, alpha.5 **pause semantics**, alpha.6 **stage-and-vision supervision**, and alpha.7 **coordination layer**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, how far the current work is from the original goal, or whether the main session should continue while another lane runs. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, coordination conflict, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 2: Add alpha.7 hard-boundary bullets**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets under `## Hard Boundaries` after the existing alpha.6 Work Mode / workflow-state bullets:

```markdown
- Codex must not collapse a lane-level wait, completed worktree, or external wait into whole-session blocking when useful non-conflicting main-session work can continue.
- Codex must not let a completed worktree automatically interrupt the main session unless the result may change the current premise, risk, file scope, merge path, release readiness, or user decision.
- Codex must not continue main-session work that would edit the same files, expand the worktree scope, invalidate acceptance criteria, make a pending result obsolete, or create incompatible product judgments.
- Codex must not start a Release Lane, merge, cherry-pick, push, create a worktree, create a Codex thread, or poll external lanes without explicit user approval.
- Codex must not force lane tables into ordinary answers; alpha.7 uses silent tracking by default and surfaces coordination only when it affects user control.
```

- [ ] **Step 3: Add alpha.7 behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add this block after the existing alpha.6 stage-and-vision guardrails and before `Use a light continuation contract`:

```markdown
- Alpha.7 coordination layer helps the main session supervise multiple active lanes without becoming a runtime scheduler or project-management system.
- Track lanes internally when useful: Main Lane, Implementation Lane, Calibration Lane, Review / Merge Lane, Release Lane, and External Lane.
- A lane is a bounded stream of work with a purpose, scope, owner, and state. A Coordination Decision is the main-session judgment about whether to continue, wait, switch attention, review, merge, or ask the user.
- Distinguish lane-level waiting from whole-session blocked. Lane-level waiting means one stream cannot continue. Whole-session blocked means no useful non-conflicting work remains without the pending result or user decision.
- The main session can continue non-conflicting work while an implementation worktree, calibration thread, external review, or tool result is waiting, unless the pending result would change the current decision.
- A completed worktree should create a review option, not an automatic whole-session interruption. Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision. Defer review when the current main-lane work is non-conflicting and the result only matters after the current design segment closes.
- Stop or switch attention when continuing would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments.
- Review / Merge is a workflow lane, not a Work Mode. Release Lane requires explicit user approval to enter Release mode.
- Use Silent Tracking by default. Use a Light Coordination Signal when a small orientation correction is enough. Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue.
- Do not force lane tables into ordinary answers. Use the smallest useful coordination signal.
```

- [ ] **Step 4: Run the canonical skill test and confirm it still fails on reference/template strings**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL. The skill strings should now be present, but the test should still fail because the alpha.7 reference and template strings have not been added yet.

---

### Task 3: Add The Alpha.7 Reference Section

**Files:**

- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Insert the alpha.7 reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section immediately after the alpha.6 section and before `## Progress Map`:

````markdown
## Alpha 7 Coordination Layer

Alpha.7 adds a Coordination Layer on top of alpha.5 pause semantics and alpha.6 stage-and-vision supervision.

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

The goal is:

```text
Keep the main session useful while bounded lanes run elsewhere; interrupt only when a lane result changes the current decision, creates risk, or reaches a real review/merge gate.
```

This is prompt/docs-backed supervision, not automatic thread orchestration.

### Core Concepts

Lane is a bounded stream of work with a purpose, scope, owner, and state.

Coordination Decision is the main-session judgment about whether to continue, wait, switch attention, review, merge, or ask the user.

These concepts are not a mandatory output template. Track them internally and surface only the smallest useful signal.

### Lane Types

- Main Lane: the main conversation lane for design, supervision, roadmap judgment, user decisions, acceptance criteria, review planning, and non-conflicting coordination.
- Implementation Lane: a bounded implementation lane, usually a true Codex worktree session.
- Calibration Lane: a lane for real or semi-real observations, such as fresh-session transcripts, natural prompt checks, target-project behavior samples, or continuation-friction examples.
- Review / Merge Lane: a workflow lane that appears when a worktree or implementation result is ready to inspect, cherry-pick, merge, or reject.
- Release Lane: a lane for external-version readiness. Release Lane requires explicit user approval to enter Release mode.
- External Lane: a lane waiting on external state such as user feedback, GitHub, CI, another Codex thread, another repository, browser state, network access, or a tool result.

Review / Merge is a workflow lane, not a Work Mode. The Work Mode may still be Implementation or Calibration depending on what is being integrated.

### Lane State

Useful lane states include active, waiting, completed, needs review, blocked, conflicting, and deferred.

Lane-level waiting means one stream cannot continue.

Whole-session blocked means no useful non-conflicting work remains without the pending result or user decision.

Do not collapse lane-level waiting into whole-session blocked.

### Coordination Decisions

Use a Coordination Decision when multiple lanes interact:

- continue main lane when the pending lane does not affect the current design or supervision judgment;
- continue current execution lane when the task is inside an approved boundary and should proceed to the stated acceptance point;
- switch to review when a completed lane may change the current premise, risk, or merge path;
- defer review when the completed lane is relevant but does not need to interrupt the current design segment;
- pause for user decision when the next action crosses a write, commit, push, release, mode, scope, risk, or project boundary;
- stop as whole-session blocked when all meaningful next work depends on a pending lane or user decision;
- open a new lane only with approval when a new worktree, fresh-session thread, or external project action is needed.

### Worktree Running Rule

A running worktree is not a whole-session blocker by default.

The main session can continue non-conflicting design, supervision, acceptance-criteria, roadmap, or calibration-planning work when the pending implementation result does not affect the current judgment.

### Worktree Completed Rule

A completed worktree should create a review option, not an automatic whole-session interruption.

Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision.

Defer review when the current main-lane work is non-conflicting and the worktree result only matters after the current design segment closes.

### Conflict Rule

Stop or switch attention when continuing the main lane would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments.

### Review / Merge Gate Rule

Review, cherry-pick, merge, or conflict resolution requires an explicit decision when it changes repository state or product direction.

The main session may prepare review criteria without approval, but it should not merge or push without user approval.

### External Wait Rule

When a tool, thread, CI job, or external project is waiting, name what is waiting and whether other lanes can proceed.

If useful non-conflicting work remains, continue it. If no useful work remains, say the whole session is blocked and name the missing condition.

### Next Decision Rule

When stopping after a completed action, name the next meaningful decision if the session remains active.

Good:

```text
The push is complete. Next decision: close this calibration line, run one more natural prompt, or return to alpha.7 design.
```

Bad:

```text
Pushed.
```

### Alpha.7 Output Rules

Use Silent Tracking by default.

Use a Light Coordination Signal when the user needs a small orientation correction.

Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue.

Do not force lane tables into ordinary answers.

Use the smallest useful coordination signal.

### Alpha.7 Boundaries

Alpha.7 is not automatic creation of worktrees, automatic creation of Codex threads, automatic polling of all threads, automatic merge, automatic cherry-pick, automatic push, a long-term task database, a full project-management system, runtime UI, local app behavior, background watcher behavior, scheduler, notifications, Memory v2, agent adapters, delegation, write delegation, release automation, npm publication, marketplace distribution, or rebranding `src/web` as Navi alpha UI.

Alpha.7 should improve coordination judgment in the current chat-based alpha surface. It should not become an orchestration engine.
````

- [ ] **Step 2: Run the canonical skill test and confirm it now fails only on template strings if any**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL if the template still lacks alpha.7 strings. If this passes already, continue to Task 4 anyway because `navi init` still needs generated trigger text.

---

### Task 4: Update Project Trigger Template And `navi init` Generated Block

**Files:**

- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add alpha.7 trigger guidance to the template**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this block immediately after the alpha.6 Vision Distance paragraph and before `Use the target project's own records to choose the map shape:`:

```markdown
Alpha.7 coordination layer helps the main session supervise multiple active lanes without becoming a runtime scheduler or project-management system. Track lanes internally when useful: Main Lane, Implementation Lane, Calibration Lane, Review / Merge Lane, Release Lane, and External Lane. Distinguish lane-level waiting from whole-session blocked.

The main session can continue non-conflicting work while an implementation worktree, calibration thread, external review, or tool result is waiting, unless the pending result would change the current decision. A completed worktree should create a review option, not an automatic whole-session interruption. Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision. Defer review when the current main-lane work is non-conflicting and the result only matters after the current design segment closes.

Stop or switch attention when continuing would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments. Review / Merge is a workflow lane, not a Work Mode. Release Lane requires explicit user approval to enter Release mode.

Use Silent Tracking by default. Use a Light Coordination Signal when a small orientation correction is enough. Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue. Do not force lane tables into ordinary answers.
```

- [ ] **Step 2: Add the same alpha.7 trigger guidance to `renderAgentsBlock()`**

In `src/cli/navi-init.ts`, inside `renderAgentsBlock()`, insert the same alpha.7 block immediately after this existing paragraph:

```ts
Vision Distance should be stage-relative, not percentage-based: say what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision. Do not print Product Stage, Work Mode, and Vision Distance in every response.
```

Use this exact text in the template literal:

```text
Alpha.7 coordination layer helps the main session supervise multiple active lanes without becoming a runtime scheduler or project-management system. Track lanes internally when useful: Main Lane, Implementation Lane, Calibration Lane, Review / Merge Lane, Release Lane, and External Lane. Distinguish lane-level waiting from whole-session blocked.

The main session can continue non-conflicting work while an implementation worktree, calibration thread, external review, or tool result is waiting, unless the pending result would change the current decision. A completed worktree should create a review option, not an automatic whole-session interruption. Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision. Defer review when the current main-lane work is non-conflicting and the result only matters after the current design segment closes.

Stop or switch attention when continuing would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments. Review / Merge is a workflow lane, not a Work Mode. Release Lane requires explicit user approval to enter Release mode.

Use Silent Tracking by default. Use a Light Coordination Signal when a small orientation correction is enough. Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue. Do not force lane tables into ordinary answers.
```

- [ ] **Step 3: Run targeted tests and confirm they pass**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS. Both new alpha.7 tests should pass.

---

### Task 5: Sync Packaged Plugin Copy

**Files:**

- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Verify: `npm run verify:plugin-package`

- [ ] **Step 1: Copy canonical skill files into the plugin package**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 2: Verify canonical and packaged copies are synchronized**

Run:

```bash
cmp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cmp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: no output and exit code 0 for both `cmp` commands.

- [ ] **Step 3: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

---

### Task 6: Final Targeted Verification And Commit

**Files:**

- Verify all modified files from Tasks 1-5.

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

- [ ] **Step 3: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git diff --stat
git diff -- .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected:

- Only the alpha.7 implementation-surface files are changed.
- No `src/web`, release notes, README, external target project, package publication, or runtime orchestration files are changed.
- The diff adds alpha.7 Coordination Layer guidance and tests only.

- [ ] **Step 5: Commit the implementation**

Run:

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts tests/skills/along-working-thread-skill.test.ts tests/cli/navi-init.test.ts plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: add navi alpha 7 coordination layer"
```

Do not push, tag, release, or create a GitHub Release in this implementation pass.

## Post-Implementation Main-Session Review

After the true worktree session completes, the main session should review before merge:

- Check `git show --stat` for the worktree commit.
- Confirm the changed files match the implementation surface above.
- Confirm `src/web`, release notes, README, external target projects, npm publication, and marketplace files were not changed.
- Confirm targeted tests, `npm run verify:plugin-package`, and `git diff --check` passed in the worktree.
- Confirm the old alpha.5/alpha.6 behavior remains present and not replaced.
- Decide whether to merge into main, request follow-up, or defer review.

Do not convert this implementation result into a release without a separate explicit Release-mode decision.
