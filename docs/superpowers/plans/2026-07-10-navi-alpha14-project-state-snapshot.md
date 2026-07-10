# Navi Alpha 14 Confirmed Project State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional `.navi/state.md` navigation snapshot that Navi offers only after the state is reliable, previews before writing, reads as non-authoritative evidence, and maintains only at meaningful navigation boundaries.

**Architecture:** Implement alpha.14 as a prompt/docs-backed behavior contract, not a new CLI state subsystem. The canonical skill and reference own eligibility, preview, state shape, reading, update, opt-out, and quietness behavior; the project-local trigger and initialization documentation carry the minimum fresh-session contract. `navi init` continues to create only its existing project guidance and starter map, with targeted tests proving that it does not create `.navi/state.md`.

**Tech Stack:** Markdown behavior contracts, TypeScript string templates, Vitest, existing plugin package verifier.

## Global Constraints

- Execute only after the Global Bootstrap worktree has been reviewed and merged into `main`; it changes overlapping skill, trigger, CLI, and test surfaces.
- Start alpha.14 execution from the then-current `main` in a new isolated worktree.
- Re-read the merged files before editing; preserve compatible bootstrap behavior instead of restoring pre-bootstrap text.
- Do not create `.navi/state.md` during `navi init`, in repository fixtures, or in real target projects.
- Do not add a `navi state` command, state-specific filesystem planner, JSON schema, runtime database, watcher, scheduler, automatic Git action, agent adapter, delegation, or write delegation.
- A missing `.navi/state.md` is normal and must not reduce Navi's usefulness.
- Required state fields must be confirmed and must not contain `Unclear` at creation.
- Every new durable write needs either its own preview and approval or an already-approved bounded write lane that directly covers the state change.
- Preserve alpha.12 quietness: `No control gain, no Navi surface.`
- Preserve the language-following contract: user-facing previews and explanations follow the current user prompt language.
- Keep `src/web` outside scope.
- Use targeted tests only. Do not run the full test suite, build, browser tests, release checklist, tag, push, or publish.

---

## File Structure

- Modify `.agents/skills/along-working-thread/SKILL.md`: add the compact normative alpha.14 behavior rules used during Navi selection.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`: add the full eligibility, content, lifecycle, opt-out, Git, and artifact-boundary contract.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`: exact packaged copy of the canonical skill.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`: exact packaged copy of the canonical reference.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`: document the compact target-project trigger wording.
- Modify `docs/along/project-maps/navi-project-init.md`: explain that Project State is delayed and optional, not an init output.
- Modify `src/cli/navi-init.ts`: synchronize only the generated `AGENTS.md` trigger wording; do not add state actions or state I/O.
- Modify `tests/skills/along-working-thread-skill.test.ts`: assert the approved alpha.14 contract and packaged-copy parity.
- Modify `tests/cli/navi-init.test.ts`: assert generated trigger wording and prove dry-run/write do not create state.

---

### Task 1: Define The Canonical Confirmed-State Contract

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: existing Project Map, Work Mode, lane coordination, language-following, and alpha.12 quietness rules.
- Produces: the normative Project State contract later copied into packaged assets and summarized by project-local triggers.

- [ ] **Step 1: Add a failing canonical contract test**

Add this test near the existing alpha.13 initialization tests in
`tests/skills/along-working-thread-skill.test.ts`:

```ts
it("documents alpha 14 delayed confirmed project state", async () => {
  const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
  const reference = await readRepoText(
    ".agents/skills/along-working-thread/references/working-thread-v1.md",
  );

  for (const expected of [
    ".navi/state.md",
    "optional navigation snapshot",
    "Project Map is route and structure",
    "Project State is the confirmed current navigation snapshot",
    "Handoff is the session-transfer package",
    "must not create project state during navi init",
    "compact preview",
    "user-confirmed",
    "current user instructions",
    "already-approved bounded write lane",
    "do not offer again in the same session",
    "deletion as an opt-out",
    "modify .gitignore",
    "No control gain, no Navi surface",
  ]) {
    expect(skill).toContain(expected);
    expect(reference).toContain(expected);
  }

  for (const forbidden of [
    "Unclear - needs calibration",
    "Created by `navi init --write`; not yet calibrated",
    "automatic freshness score",
  ]) {
    expect(skill).not.toContain(forbidden);
    expect(reference).not.toContain(forbidden);
  }
});
```

- [ ] **Step 2: Run the targeted skill test and confirm the red state**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL in the new alpha.14 test because the canonical contract is not
present yet. Existing tests should remain green.

- [ ] **Step 3: Add compact normative rules to the canonical skill**

Add an `Alpha.14 confirmed Project State` group beside the existing
project-local evidence rules in `.agents/skills/along-working-thread/SKILL.md`.
Insert this complete contract as Markdown bullets:

```md
- Alpha.14 Project State is an optional navigation snapshot at `.navi/state.md`. Project Map is route and structure; Project State is the confirmed current navigation snapshot; Handoff is the session-transfer package.
- A missing `.navi/state.md` is normal. Navi must not create project state during navi init and must not add an empty or `Unclear` starter.
- Offer delayed creation only for a cross-session project when Project Goal, Current Stage, Current Focus, and one real Next Decision are reliable, provided or confirmed by the user, no state exists, and saving it would materially reduce future reconstruction. Do not offer from a provisional map, during a narrow task, near project closure, after rejection in the same session, or while interrupting an already-approved bounded loop.
- Before creation, show a compact preview of Goal, Stage, Focus, Next decision, and Stop boundary, then obtain approval. The saved state status is `user-confirmed`; required core fields must not be unclear.
- When state exists, read it early but treat it as a navigation cache. Current user instructions and newer relevant approved project evidence override stored state.
- Consider updates only when Goal, Stage, Focus, relevant Parallel Work, Next Decision, or Stop / Continue Policy changes materially. Routine edits, tests, commits, pushes, debugging, and `continue` inside an approved loop do not justify state churn.
- If a state change directly follows an already-approved bounded write lane, include the smallest state patch without a second `continue` gate. Otherwise preview the change at a meaningful boundary and ask for approval. Never rewrite state from uncertain inference.
- If creation is rejected, do not offer again in the same session. Treat deletion as an opt-out and do not recreate without a new explicit request or approval. Do not silently repair malformed state.
- Navi must not stage or commit state, must not modify .gitignore, and must not repeatedly remind the user about tracking. Follow the target project's version-control policy.
- Project State is not a mandatory response template. Alpha.12 still applies: No control gain, no Navi surface.
```

Do not duplicate the full reference in `SKILL.md`. Keep these bullets operational
and compact enough to survive skill context budgets.

- [ ] **Step 4: Add the full behavior section to the canonical reference**

Add `## Alpha 14 Confirmed Project State` to
`.agents/skills/along-working-thread/references/working-thread-v1.md` with these
subsections and exact requirements:

```md
### Artifact Model

Project Map is route and structure. Project State is the confirmed current navigation snapshot. Handoff is the session-transfer package. `.navi/state.md` is an optional navigation snapshot, not runtime memory or a task database.

### Creation Eligibility

Offer creation only when the project is likely to continue across sessions; Project Goal, Current Stage, Current Focus, and one real Next Decision are reliable and user-provided or user-confirmed; no state exists; and saving the snapshot materially reduces future reconstruction. Do not offer from a provisional judgment, for a narrow one-shot task, near project closure, when required fields remain unclear, after rejection in the same session, or while interrupting an already-approved bounded loop. Navi must not create project state during navi init.

### Preview And State Shape

Before writing, show a compact preview containing Goal, Stage, Focus, Next decision, and Stop boundary, in the current user's prompt language. After approval, write `# Navi Project State`, `State status: user-confirmed`, and the sections `Project Goal`, `Current Stage`, `Current Focus`, `Parallel Work`, `Next Decision`, `Stop / Continue Policy`, `Evidence`, and `Last Updated`. Required core fields must not contain `Unclear`. `Parallel Work` may be `None.`. Evidence cites at least one project-local source or current user confirmation.

### Reading And Conflict

Read existing state early, but treat it as a navigation cache. Current user instructions and newer relevant approved project evidence override stored state. Ordinary low-level activity does not make state stale. Surface a conflict only when it changes orientation, a stop boundary, or the next decision.

### Update Lifecycle

Consider updates only when Project Goal, Current Stage, Current Focus, relevant Parallel Work, Next Decision, or Stop / Continue Policy changes materially. If a change directly follows an already-approved bounded write lane, include the smallest state patch without a second `continue` gate. Otherwise wait for a meaningful closure or decision point, preview the change, and ask for approval. Do not rewrite state from uncertain inference, on every turn, by timer, or in the background.

### Missing, Invalid, And Opt-Out State

Missing state is normal. After rejection, do not offer again in the same session. Treat deletion as an opt-out and do not recreate without a new explicit request or approval. Read only clearly usable content from malformed state, lower confidence, and do not repair it silently. A state read failure must not disable Navi.

### Version Control And Privacy

Do not run `git add`, create a commit, modify .gitignore, or repeatedly remind the user about tracking. Follow the target project's policy. Do not store secrets, hidden reasoning, transcripts, source-thread metadata, test logs, percentage guesses, or long backlogs in state.

### Quietness And Non-Goals

State is not a mandatory response template. No control gain, no Navi surface. Alpha.14 adds no `navi state` command, schema, runtime database, watcher, scheduler, automatic repair, project manager, Memory v2, agent adapter, delegation, write delegation, or UI.
```

- [ ] **Step 5: Run the targeted skill test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS, including the new alpha.14 test.

- [ ] **Step 6: Review the canonical contract for density and contradiction**

Check:

```bash
rg -n "Alpha.14|\.navi/state\.md|Unclear|navi init --write|automatic" \
  .agents/skills/along-working-thread/SKILL.md \
  .agents/skills/along-working-thread/references/working-thread-v1.md
```

Expected:

- no starter-state or init-created-state requirement;
- no requirement to print state on every turn;
- creation and update approval rules are distinct;
- the compact skill and full reference agree.

- [ ] **Step 7: Commit the canonical behavior**

```bash
git add \
  .agents/skills/along-working-thread/SKILL.md \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "feat: define confirmed navi project state"
```

---

### Task 2: Carry The Contract Into Project Initialization

**Files:**
- Modify: `src/cli/navi-init.ts`
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: Task 1's canonical eligibility, preview, reading, update, opt-out, and quietness rules.
- Produces: fresh-session project guidance without adding a CLI state writer.

- [ ] **Step 1: Add failing CLI boundary assertions**

In the existing dry-run test in `tests/cli/navi-init.test.ts`, add:

```ts
expect(
  plan.actions.some((action) => action.relativePath === ".navi/state.md"),
).toBe(false);
expect(await exists(path.join(project, ".navi/state.md"))).toBe(false);
```

In the existing `writes AGENTS.md and a provisional project map only behind
--write` test, add:

```ts
expect(await exists(path.join(project, ".navi/state.md"))).toBe(false);
```

Add a generated-trigger contract test in the same describe block:

```ts
it("installs delayed confirmed project-state guidance without creating state", async () => {
  const project = await makeProject();

  const plan = await buildInitPlan({ targetDir: project, write: true });
  await applyInitPlan(plan);

  const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
  for (const expected of [
    ".navi/state.md",
    "optional navigation snapshot",
    "must not create project state during navi init",
    "compact preview",
    "user-confirmed",
    "current user instructions",
    "No control gain, no Navi surface",
  ]) {
    expect(agents).toContain(expected);
  }
  expect(await exists(path.join(project, ".navi/state.md"))).toBe(false);
});
```

- [ ] **Step 2: Add a failing documentation contract test**

Add this test near the initialization documentation tests in
`tests/skills/along-working-thread-skill.test.ts`:

```ts
it("documents delayed Project State as separate from navi init output", async () => {
  const initDoc = await readRepoText("docs/along/project-maps/navi-project-init.md");
  const triggerDoc = await readRepoText(
    "docs/along/project-maps/navi-project-trigger-template.md",
  );

  for (const expected of [
    ".navi/state.md",
    "optional navigation snapshot",
    "compact preview",
    "user-confirmed",
    "deletion as an opt-out",
    "modify .gitignore",
  ]) {
    expect(initDoc).toContain(expected);
    expect(triggerDoc).toContain(expected);
  }

  expect(initDoc).toContain("does not create `.navi/state.md`");
  expect(initDoc).not.toContain("including starter state");
});
```

- [ ] **Step 3: Run both targeted tests and confirm the red state**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL only in the new trigger/documentation assertions. The no-state
filesystem assertions may already pass because alpha.14 has not added state I/O.

- [ ] **Step 4: Add compact state guidance to the generated trigger**

In `renderAgentsBlock()` in `src/cli/navi-init.ts`, add one compact alpha.14
paragraph. Preserve all Global Bootstrap text merged into this function. Use:

```text
Alpha.14 confirmed Project State: `.navi/state.md` is an optional navigation snapshot, not an init output or mandatory response template. A missing file is normal; Navi must not create project state during navi init. Offer delayed creation only when Goal, Stage, Focus, and one real Next Decision are reliable and user-confirmed, saving them would reduce future reconstruction, and the offer will not interrupt an approved loop. Show a compact preview before writing; saved core fields must not be unclear and state status is `user-confirmed`. Read existing state early, but current user instructions and newer relevant approved evidence override it. Treat rejection and deletion as opt-out signals, never repair or recreate silently, and never stage, commit, or modify .gitignore for state. No control gain, no Navi surface.
```

Do not add `.navi/state.md` to `buildInitPlan()`. Do not add a state renderer,
action, writer, read path, CLI flag, or command.

- [ ] **Step 5: Synchronize the documented trigger template**

Add the same paragraph to
`docs/along/project-maps/navi-project-trigger-template.md`. The documented and
generated forms must use the same behavior terms even if surrounding heading
format differs.

- [ ] **Step 6: Update project initialization documentation**

Add `## Optional Delayed Project State` to
`docs/along/project-maps/navi-project-init.md` with these requirements:

```md
`.navi/state.md` is an optional navigation snapshot. `navi init` does not create `.navi/state.md`; initialization remains complete and useful when the file is absent.

Navi may offer to save Project State later only when Project Goal, Current Stage, Current Focus, and one real Next Decision are reliable and user-confirmed, and saving them would materially reduce future reconstruction. Before writing, Navi shows a compact preview of Goal, Stage, Focus, Next decision, and Stop boundary. Required fields must not be `Unclear`.

Existing state is read early but does not override current user instructions or newer relevant approved project evidence. Updates happen only at meaningful navigation boundaries. Rejection suppresses another offer in the same session; treat deletion as an opt-out.

Navi does not automatically stage or commit state and must not modify .gitignore. The target project decides whether `.navi/state.md` belongs in version control.
```

Also ensure the standard init output list still names only `AGENTS.md` and the
starter Project Map. Do not describe state as a third init action.

- [ ] **Step 7: Run both targeted tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 8: Verify no state-specific CLI subsystem was added**

Run:

```bash
git diff -- src/cli/navi-init.ts
rg -n "NAVI_STATE|planProjectState|renderNavi.*State|state\.md.*InitAction" src/cli tests/cli
```

Expected:

- the CLI diff changes only generated trigger wording;
- the `rg` command returns no state planner, renderer, or state action;
- tests prove `.navi/state.md` remains absent after dry-run and write mode.

- [ ] **Step 9: Commit project initialization guidance**

```bash
git add \
  src/cli/navi-init.ts \
  docs/along/project-maps/navi-project-trigger-template.md \
  docs/along/project-maps/navi-project-init.md \
  tests/cli/navi-init.test.ts \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: add delayed navi project state guidance"
```

---

### Task 3: Sync The Plugin Package And Verify The Bounded Feature

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: Tasks 1 and 2's approved canonical behavior and project-local trigger contract.
- Produces: an exact packaged copy and a reviewable alpha.14 implementation branch.

- [ ] **Step 1: Add exact-copy assertions**

Add this test to `tests/skills/along-working-thread-skill.test.ts`:

```ts
it("keeps packaged alpha 14 behavior identical to the canonical skill", async () => {
  const canonicalSkill = await readRepoText(
    ".agents/skills/along-working-thread/SKILL.md",
  );
  const packagedSkill = await readRepoText(
    "plugins/along-working-thread/skills/along-working-thread/SKILL.md",
  );
  const canonicalReference = await readRepoText(
    ".agents/skills/along-working-thread/references/working-thread-v1.md",
  );
  const packagedReference = await readRepoText(
    "plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md",
  );

  expect(packagedSkill).toBe(canonicalSkill);
  expect(packagedReference).toBe(canonicalReference);
});
```

- [ ] **Step 2: Run the skill test and confirm packaged copies are red**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL on copy parity because the packaged files do not yet contain the
Task 1 canonical alpha.14 contract.

- [ ] **Step 3: Copy the canonical files into the plugin package**

Run these exact mechanical copy commands:

```bash
cp \
  .agents/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Then verify the copies:

```bash
cmp -s \
  .agents/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md
cmp -s \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: both commands exit `0`.

- [ ] **Step 4: Run final targeted verification**

Run only:

```bash
npm test -- tests/cli/navi-init.test.ts tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check
```

Expected:

- both targeted test files pass with exact test counts reported;
- plugin package verification passes;
- typecheck passes;
- `git diff --check` returns no output.

- [ ] **Step 5: Perform the final scope review**

Run:

```bash
git status --short
git diff --stat "$(git merge-base main HEAD)"..HEAD
git diff "$(git merge-base main HEAD)"..HEAD -- src/cli/navi-init.ts
rg -n 'Unclear - needs calibration|including starter state|Created by `navi init --write`' \
  .agents plugins docs/along src/cli tests
```

Confirm all of these statements:

- `navi init` still has no state action and does not create `.navi/state.md`;
- no empty, starter, or unclear state template was introduced;
- Project State is optional and delayed;
- creation requires reliable user-confirmed core fields, preview, and approval;
- stored state does not outrank current user instructions or newer approved
  evidence;
- routine progress does not create update churn;
- rejection, deletion, malformed state, and Git ownership rules are documented;
- no full tests, release work, external-project writes, or real global writes
  occurred.

- [ ] **Step 6: Commit package synchronization and final test coverage**

```bash
git add \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "chore: sync confirmed navi state behavior"
```

- [ ] **Step 7: Stop at the review decision**

Report:

- all alpha.14 commit SHAs and subjects;
- changed files grouped by task;
- exact targeted test counts and results;
- plugin verifier, typecheck, and diff-check results;
- confirmation that no real target project, global configuration, tag, release,
  push, or publication was changed;
- residual risk: alpha.14 remains prompt/docs-backed and needs later real-project
  calibration before stronger product machinery is justified.

Do not merge, push, tag, release, install globally, or begin calibration without
an explicit main-session decision.

## Plan Self-Check

- Spec coverage: delayed eligibility, compact preview, confirmed content shape,
  source priority, hybrid update lifecycle, quietness, rejection, deletion,
  malformed state, version-control ownership, init separation, plugin copy sync,
  and targeted validation each have an implementation and test step.
- Placeholder scan: the plan contains no `TBD`, `TODO`, vague implementation
  request, or unnamed test command.
- Scope check: one prompt/docs-backed feature; no state runtime or independent CLI
  subsystem is included.
- Dependency check: execution waits for Global Bootstrap merge because the files
  overlap; the plan does not ask the main session to wait idly meanwhile.
- Type consistency: no new TypeScript state types or public APIs are introduced.
