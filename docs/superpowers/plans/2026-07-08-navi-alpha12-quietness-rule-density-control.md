# Navi Alpha 12 Quietness Rule Density Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the alpha.12 Quietness Gate so Navi chooses the smallest useful surface and stays quiet when no user-control gain exists.

**Architecture:** This is a docs-backed prompt behavior change. The canonical behavior lives in `.agents/skills/along-working-thread/SKILL.md` and `.agents/skills/along-working-thread/references/working-thread-v1.md`; project-local installation guidance is mirrored in `docs/along/project-maps/navi-project-trigger-template.md` and the `navi init` inline trigger renderer in `src/cli/navi-init.ts`. Tests assert the required alpha.12 language in the canonical skill/reference/template and in generated target-project `AGENTS.md`.

**Tech Stack:** Markdown skill docs, TypeScript CLI template, Vitest text assertions, existing plugin package verifier.

## Global Constraints

- Stay in Implementation mode only: bounded docs/prompt-backed behavior update plus targeted tests.
- Do not enter Release mode, tag, create GitHub Releases, update GitHub Release bodies, publish npm packages, or do marketplace work.
- Do not touch `src/web`, MCP runtime/server behavior, local app behavior, telemetry, background automation, Memory v2, agent adapters, delegation, or write delegation.
- Do not update README or release notes unless a later Release-mode decision explicitly requires it.
- Preserve existing package id, skill id, CLI alias, and `along-working-thread` compatibility names.
- Keep alpha.12 as a quietness gate before existing Navi surfaces, not as another mandatory map, mode label, menu, or state machine.
- Validation budget: run targeted skill tests, targeted `navi init` tests, `npm run verify:plugin-package` after package copy sync, and `git diff --check`.

---

## File Structure

- Modify `.agents/skills/along-working-thread/SKILL.md`: add alpha.12 to the canonical skill summary, hard boundaries, and behavior guardrails.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`: add a dedicated alpha.12 reference section near alpha.11, with control gain, quietness ladder, stay-quiet cases, and must-surface cases.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`: add the project-local trigger version of the Quietness Gate.
- Modify `src/cli/navi-init.ts`: mirror the trigger-template text inside `renderAgentsBlock()` so fresh `navi init --write` projects receive alpha.12 behavior.
- Modify `tests/skills/along-working-thread-skill.test.ts`: add assertions for canonical alpha.12 docs and trigger template.
- Modify `tests/cli/navi-init.test.ts`: add assertions that generated target-project `AGENTS.md` contains alpha.12 trigger rules.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`: exact copy of `.agents/skills/along-working-thread/SKILL.md`.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`: exact copy of `.agents/skills/along-working-thread/references/working-thread-v1.md`.

## Task 1: Add Failing Canonical Skill And Template Tests

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Reads: `.agents/skills/along-working-thread/SKILL.md`
- Reads: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Reads: `docs/along/project-maps/navi-project-trigger-template.md`

**Interfaces:**
- Consumes: existing `readRepoText()` helper in `tests/skills/along-working-thread-skill.test.ts`.
- Produces: a failing test named `documents alpha 12 quietness and rule density control`.

- [ ] **Step 1: Insert the failing test after the alpha.11 test**

Add this test immediately after `it("documents alpha 11 lane closure next-decision handoff", async () => { ... });` and before `it("documents the Navi Project Map model and source priority", async () => { ... });`:

```ts
  it("documents alpha 12 quietness and rule density control", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.12 quietness gate",
      "No control gain, no Navi surface",
      "Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect.",
      "Use the lightest sufficient surface",
      "Silent Direct Answer",
      "Embedded Hint",
      "One-Sentence Handoff",
      "Short Options",
      "Full Map",
      "narrow status questions",
      "clear chained instructions",
      "approved bounded loops",
      "lightweight design confirmations",
      "fake branches",
      "pseudo-supervision",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

    for (const expected of [
      "## Alpha 12 Quietness And Rule Density Control",
      "Alpha.12 answers",
      "No control gain, no Navi surface",
      "Orientation Gain",
      "Decision Gain",
      "Boundary Gain",
      "Risk Gain",
      "Coordination Gain",
      "Quietness Ladder",
      "Must-Stay-Quiet Cases",
      "Must-Not-Stay-Quiet Cases",
      "Pseudo-Supervision",
      "Alpha.12 is not a runtime classifier",
      "Alpha.12 is not a new mandatory output format",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 2: Run the targeted skill test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because the alpha.12 strings are not yet present in the canonical skill, reference, and trigger template.

## Task 2: Implement Canonical Alpha.12 Skill, Reference, Template, And Package Copy

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: failing test from Task 1.
- Produces: alpha.12 prompt guidance in canonical docs, project-local trigger template, and exact package copies.

- [ ] **Step 1: Update the canonical skill summary**

In `.agents/skills/along-working-thread/SKILL.md`, update the V1 alpha behavior paragraph so it names alpha.12:

```markdown
Navi's V1 alpha behavior centers on **Progress/Rhythm Maps**, **Challenge Layer**, alpha.4 **phase supervision**, alpha.5 **pause semantics**, alpha.6 **stage-and-vision supervision**, alpha.7 **coordination layer**, alpha.8 **decision handoff quality**, alpha.11 **lane closure handoff**, and alpha.12 **quietness gate**. Navi gives a Progress Map or Rhythm Map when the user asks about progress, next steps, whether to continue, whether to stop, whether to wait for a worktree, whether a plan is safe to approve, how far the current work is from the original goal, or whether the main session should continue while another lane runs. Alpha.12 prevents pseudo-supervision by applying the rule: No control gain, no Navi surface. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, over-validation, coordination conflict, or self-certifying momentum. Along remains the broader long-term product vision.
```

- [ ] **Step 2: Add canonical hard-boundary bullets**

In `.agents/skills/along-working-thread/SKILL.md`, under `## Hard Boundaries`, add these bullets after the existing alpha.11 lane-closure bullets:

```markdown
- Codex must not surface Navi merely because a previous alpha rule could technically apply; alpha.12 requires control gain first.
- Codex must not create pseudo-supervision: maps, mode labels, option sets, handoffs, or process explanations that do not improve what the user can understand, decide, stop, approve, or redirect.
- Codex must not expand narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, finished narrow tasks, or no-real-branch moments into Progress Maps, lane maps, or decision menus.
- Codex must not count "more complete", "more professional", "more explanatory", or "more structured" as control gain by itself.
```

- [ ] **Step 3: Add canonical behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, insert this block after the alpha.11 lane-closure paragraph that ends with `Documentation closeout is not design confirmation.` and before `Use a light continuation contract when a multi-step loop is clear:`:

```markdown
- Alpha.12 quietness gate runs before choosing any Navi surface. Use this test first: No control gain, no Navi surface.
- Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect. Control gain can be Orientation Gain, Decision Gain, Boundary Gain, Risk Gain, or Coordination Gain.
- Use the lightest sufficient surface: Silent Direct Answer when no control gain exists; Embedded Hint when a short phrase is enough; One-Sentence Handoff when one next decision or boundary matters; Short Options only when real branches exist; Full Map only for broad orientation, visible confusion, or multiple control dimensions.
- Keep Navi quiet for narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, no-real-branch moments, finished narrow tasks, and information that does not change the decision.
- Surface Navi when silence would reduce user control: the user is visibly lost, an approval/write/release/risk/scope boundary appears, lanes may conflict, Codex is over-validating or waiting incorrectly, lane closure hides a real next decision, a project map may be stale, implementation success is being treated as product proof, or Release-mode work starts without explicit approval.
- Alpha.12 is not a runtime classifier, state machine, telemetry, UI, background watcher, automatic mode switch, automatic implementation planning, automatic worktree creation, automatic commit/push/merge/tag/release flow, or new mandatory output format.
```

- [ ] **Step 4: Add the reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, add this section immediately after the alpha.11 section and before `## Progress Map`:

```markdown
## Alpha 12 Quietness And Rule Density Control

Alpha.12 answers:

```text
Should Navi surface at all, and if yes, how much structure is actually useful?
```

Alpha.12 solves Pseudo-Supervision.

Pseudo-Supervision means:

```text
Navi surfaces a map, mode label, option set, handoff, or process explanation even though it does not materially increase user control.
```

The core rule is:

```text
No control gain, no Navi surface.
```

Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect.

### Control Gain Types

- Orientation Gain: the user cannot see where the work stands, and Navi makes the current position understandable.
- Decision Gain: the user cannot see what decision they are being asked to make, and Navi names a real decision.
- Boundary Gain: continuing would cross a write, commit, push, tag, release, mode-change, scope-expansion, cross-project, validation-budget, or risk-acceptance boundary.
- Risk Gain: continuing blindly may create obvious cost, misleading confidence, wrong direction, over-validation, wrong waiting, stale-map error, or premature release pressure.
- Coordination Gain: multiple lanes, worktrees, reviews, waits, or external states could conflict, block, or confuse the main session.

Do not count "more complete", "more professional", "more explanatory", or "more structured" as control gain by itself.

### Quietness Ladder

Use the lightest sufficient surface:

- Silent Direct Answer: use when there is no meaningful control gain.
- Embedded Hint: use when slight control gain exists and one short phrase is enough.
- One-Sentence Handoff: use when one next decision or boundary matters.
- Short Options: use only when real branches exist and the user can judge between them.
- Full Map: use when the user asks for broader orientation, is visibly lost, or multiple control dimensions matter at once.

Do not add fake branches. Do not include bare `continue` or `继续` as an option. If continuing is meaningful, name the concrete next action, boundary, and stop point.

### Must-Stay-Quiet Cases

Keep Navi quiet unless the user also asks for orientation, supervision, risk, or next-step judgment:

- narrow status questions, such as "Did push succeed?", "What branch are we on?", "Did the test pass?", or "What files changed?";
- clear chained instructions, such as "Commit and push" or "Write the plan, check diff, then stop at commit";
- approved bounded loops with a clear next action, boundary, and acceptance point;
- lightweight design confirmations such as "符合", "认可", or "1";
- no-real-branch moments where only one next step is clearly correct;
- finished narrow tasks with no active follow-up;
- information that does not change the user's next decision.

### Must-Not-Stay-Quiet Cases

Surface the lightest useful Navi signal when silence would reduce user control:

- the user is visibly lost or asks for overall progress;
- continuing would cross an approval, write, release, risk, or scope boundary;
- multiple lanes or worktrees may conflict;
- Codex is over-validating or waiting incorrectly;
- a lane looks complete while hiding a real next decision;
- a stale project map may mislead fresh sessions;
- implementation success is being treated as product proof;
- release-mode work is starting without explicit approval.

### Evaluation Order

1. Identify the request type.
2. Ask whether any control gain exists.
3. If no control gain exists, answer directly.
4. If control gain exists, choose the lightest sufficient surface.
5. Only then select the relevant existing Navi rule, such as Progress Map, pause semantics, coordination layer, lane-closure handoff, Work Mode, Vision Distance, or Challenge Moment.

Alpha.12 is not a runtime classifier, a state machine, telemetry, UI, background watcher, task database, scheduler, automatic mode switch, automatic implementation planning, automatic worktree creation, automatic commit/push/merge/tag/release flow, release preparation, or publication. Alpha.12 is not a new mandatory output format. Quietness does not mean silence when user control is at risk.
```

- [ ] **Step 5: Add the project-local trigger template block**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this paragraph after the alpha.11 paragraph that ends with `Documentation closeout is not design confirmation.` and before `No Menu Inside Approved Boundary:`:

```markdown
Alpha.12 quietness gate: before choosing any Navi surface, ask whether the response creates control gain. No control gain, no Navi surface. Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect. Use the lightest sufficient surface: Silent Direct Answer, Embedded Hint, One-Sentence Handoff, Short Options, or Full Map. Keep Navi quiet for narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, no-real-branch moments, finished narrow tasks, and information that does not change the decision. Surface Navi when silence would reduce user control, such as visible confusion, approval/write/release/risk/scope boundaries, lane conflicts, over-validation, wrong waiting, hidden next decisions, stale project maps, or implementation success being treated as product proof. Do not create pseudo-supervision, fake branches, or menus just because a rule could technically apply.
```

- [ ] **Step 6: Sync packaged skill copies exactly**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: no output. The packaged skill files must be byte-for-byte identical to the canonical source files.

- [ ] **Step 7: Run the targeted skill test and verify it passes**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1-2 changes**

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md docs/along/project-maps/navi-project-trigger-template.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: add navi alpha 12 quietness gate"
```

Expected: commit succeeds with only the listed files.

## Task 3: Add Failing `navi init` Test And Mirror Alpha.12 Into Generated Triggers

**Files:**
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

**Interfaces:**
- Consumes: existing `buildInitPlan()` and `applyInitPlan()` from `src/cli/navi-init.ts`.
- Produces: fresh target-project `AGENTS.md` includes alpha.12 Quietness Gate rules.

- [ ] **Step 1: Insert the failing generated-trigger test**

Add this test in `tests/cli/navi-init.test.ts` immediately after `it("installs alpha 11 lane closure handoff rules for generated Navi triggers", async () => { ... });` and before `it("rejects stale create actions when a target file appears after planning", async () => { ... });`:

```ts
  it("installs alpha 12 quietness gate rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.12 quietness gate",
      "No control gain, no Navi surface",
      "Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect.",
      "Silent Direct Answer",
      "Embedded Hint",
      "One-Sentence Handoff",
      "Short Options",
      "Full Map",
      "narrow status questions",
      "clear chained instructions",
      "approved bounded loops",
      "lightweight design confirmations",
      "no-real-branch moments",
      "pseudo-supervision",
      "fake branches",
    ]) {
      expect(agents).toContain(expected);
    }

    expect(agents).not.toContain("## Alpha 12 Quietness And Rule Density Control");
  });
```

- [ ] **Step 2: Run the targeted CLI test and verify it fails**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because `renderAgentsBlock()` does not yet include alpha.12 trigger text.

- [ ] **Step 3: Mirror the alpha.12 trigger text in `renderAgentsBlock()`**

In `src/cli/navi-init.ts`, inside the `renderAgentsBlock()` template string, insert this paragraph immediately after the alpha.11 paragraph that ends with `Documentation closeout is not design confirmation.` and before `No Menu Inside Approved Boundary:`:

```ts
Alpha.12 quietness gate: before choosing any Navi surface, ask whether the response creates control gain. No control gain, no Navi surface. Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect. Use the lightest sufficient surface: Silent Direct Answer, Embedded Hint, One-Sentence Handoff, Short Options, or Full Map. Keep Navi quiet for narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, no-real-branch moments, finished narrow tasks, and information that does not change the decision. Surface Navi when silence would reduce user control, such as visible confusion, approval/write/release/risk/scope boundaries, lane conflicts, over-validation, wrong waiting, hidden next decisions, stale project maps, or implementation success being treated as product proof. Do not create pseudo-supervision, fake branches, or menus just because a rule could technically apply.
```

- [ ] **Step 4: Run targeted CLI and skill tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3 changes**

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts
git commit -m "feat: install navi alpha 12 trigger rules"
```

Expected: commit succeeds with only the listed files.

## Task 4: Verify Package Sync And Whitespace

**Files:**
- Reads: package skill copy under `plugins/along-working-thread/skills/along-working-thread/`
- Reads: canonical skill source under `.agents/skills/along-working-thread/`
- Reads: all modified files

**Interfaces:**
- Consumes: commits from Tasks 1-3.
- Produces: validation result suitable for main-session review; does not publish or release anything.

- [ ] **Step 1: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This runs the targeted skill test, validates the Codex plugin manifest, and checks canonical/package skill drift.

- [ ] **Step 2: Run targeted `navi init` test**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 4: Report final implementation status**

Report:

```text
Implemented alpha.12 Quietness Gate in canonical skill docs, reference docs, project-local trigger template, navi init generated trigger text, and packaged skill copies.

Validation:
- npm run verify:plugin-package: PASS
- npm test -- tests/cli/navi-init.test.ts: PASS
- git diff --check: PASS

No Release mode, tag, GitHub Release, npm publication, marketplace work, runtime UI, src/web, MCP runtime, or external target-project changes were performed.
```

Do not push, tag, release, or modify external target projects unless the main session explicitly approves those actions.

## Plan Self-Review

- Spec coverage: The plan covers the alpha.12 Quietness Gate, control-gain definition, quietness ladder, stay-quiet cases, must-surface cases, docs-backed implementation surface, `navi init`, package copy sync, and targeted validation.
- Scope check: This is one bounded docs/prompt-backed implementation. It does not include runtime classifiers, UI, telemetry, release work, README edits, external project writes, or publication.
- Placeholder scan: No task contains placeholder markers, deferred implementation language, or unspecified test coverage.
- Type consistency: The only TypeScript behavior touched is `renderAgentsBlock()` output text; the existing `buildInitPlan()` and `applyInitPlan()` interfaces remain unchanged.
