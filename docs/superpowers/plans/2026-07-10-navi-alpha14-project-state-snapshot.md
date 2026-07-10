# Navi Alpha 14 Project State Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a conservative project-local `.navi/state.md` snapshot that `navi init --write` creates safely and that fresh Navi sessions read early, challenge against newer evidence, and update only with explicit user approval.

**Architecture:** Extend the existing docs-backed `navi init` action plan with one additional create-or-skip action for `.navi/state.md`; reuse the current write preflight and symlink protections rather than adding a new storage layer. Add `.navi/state.md` to read-only evidence discovery while treating the exact generated starter as neutral evidence, then document state-first/evidence-challenged behavior in the canonical skill, reference, generated trigger, and project-initialization docs. Keep Project State distinct from Project Map and handoff, and keep all state maintenance manual or semi-manual.

**Tech Stack:** TypeScript, Node.js `fs/promises`, Vitest, Markdown docs, existing `navi init` safety helpers, existing plugin package verifier.

## Global Constraints

- This is Implementation mode for alpha.14 Project Integration, not Release mode.
- Execute only after alpha.13 remediation has been reviewed and merged into `main`.
- At execution start, confirm that `main` contains the alpha.13 `--suggest-map` implementation and its review fixes for bounded reads, self-generated evidence, conservative confidence, correct target guidance, and initialization wording.
- If alpha.13 is not merged or its final interfaces materially differ from the interfaces named below, stop before editing and update this plan against the merged code.
- Do not create the implementation worktree from a pre-alpha.13 commit.
- Do not enter Release mode, tag, create GitHub Releases, update release notes, publish npm packages, or do marketplace work.
- Do not touch `src/web`, MCP runtime/server behavior, local app behavior, telemetry, background automation, Memory v2, agent adapters, delegation, or write delegation.
- Do not modify external target projects; tests must use disposable temporary directories.
- Preserve existing package id, skill id, CLI alias, and `along-working-thread` compatibility names.
- `.navi/state.md` is Markdown, not JSON.
- `navi init` must remain dry-run by default; only `--write` may create `.navi/state.md`.
- Never overwrite an existing `.navi/state.md`.
- `--suggest-map` remains terminal-only and must never populate or rewrite `.navi/state.md`.
- The generated starter state must remain visibly uncalibrated and must not infer project-specific goal, stage, focus, or current position.
- State is read early but is not unquestionable truth; current user instructions and newer relevant project evidence may challenge it.
- State updates remain manual or semi-manual and require explicit user approval.
- Project Map is route/structure, Project State is the current navigation snapshot, and handoff is the session-transfer package.
- Alpha.12 quietness still applies: no control gain, no Navi surface.
- Use targeted validation only: CLI tests for CLI changes, skill tests for skill/reference/docs changes, plugin verification for package-copy changes, and `git diff --check`.

---

## File Structure

- Modify `src/cli/navi-init.ts`: add the `.navi/state.md` init action, render the exact conservative starter, include state in evidence discovery, neutralize the exact generated starter during shape scoring, and add compact alpha.14 trigger wording.
- Modify `tests/cli/navi-init.test.ts`: cover dry-run, creation, preservation, symlink safety, `--suggest-map` separation, neutral starter evidence, and generated trigger wording.
- Modify `.agents/skills/along-working-thread/SKILL.md`: add minimal alpha.14 state-first, stale-suspicion, update-approval, artifact-boundary, and quietness rules.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`: add the complete alpha.14 Project State Snapshot reference section.
- Modify `docs/along/project-maps/navi-project-init.md`: document `.navi/state.md` as standard project initialization output and distinguish starter state from suggested map output.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`: keep the project-local trigger template aligned with the generated trigger block.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`: exact copy of the canonical skill after changes.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`: exact copy of the canonical reference after changes.
- Modify `tests/skills/along-working-thread-skill.test.ts`: assert the alpha.14 contract across canonical skill, reference, init docs, trigger template, and packaged copies.

## Task 1: Create And Preserve The Conservative Starter State

**Files:**
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `src/cli/navi-init.ts`

**Interfaces:**
- Consumes: existing `InitAction`, `buildInitPlan()`, `applyInitPlan()`, `renderInitPlan()`, `resolveTargetPath()`, `readTextIfExists()`, and the existing create-action preflight/symlink safety path.
- Produces:
  - `const NAVI_STATE_RELATIVE_PATH = ".navi/state.md"`
  - `planProjectStateAction(statePath: string): Promise<InitAction>`
  - `renderNaviStarterState(): string`
  - a third standard init action that creates or skips `.navi/state.md`

- [ ] **Step 1: Update the dry-run test to require a state action without writes**

In `tests/cli/navi-init.test.ts`, update the existing `defaults to dry-run and does not write target files` test so its action assertion and file checks include `.navi/state.md`:

```ts
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([
      ["create", "AGENTS.md"],
      ["create", "docs/along/project-maps/navi-project-map.md"],
      ["create", ".navi/state.md"],
    ]);
    expect(output).toContain("Create: .navi/state.md");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
    expect(await exists(path.join(project, "docs/along/project-maps/navi-project-map.md"))).toBe(false);
    expect(await exists(path.join(project, ".navi/state.md"))).toBe(false);
```

- [ ] **Step 2: Add a write-mode starter-state test**

Add this test in the `navi init planning` describe block after the existing write-mode initialization test:

```ts
  it("creates a conservative uncalibrated Navi project state behind --write", async () => {
    const project = await makeProject();
    const statePath = path.join(project, ".navi/state.md");
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const state = await fs.readFile(statePath, "utf8");
    expect(plan.actions.find((action) => action.relativePath === ".navi/state.md")?.kind).toBe("create");
    expect(state).toContain("# Navi Project State");
    expect(state).toContain("## Project Goal\nUnclear - needs calibration.");
    expect(state).toContain("## Current Stage\nUnclear - needs calibration.");
    expect(state).toContain("## Current Focus\nUnclear - review project evidence and choose the current focus.");
    expect(state).toContain("## Parallel Work\nNone.");
    expect(state).toContain("## Next Decision\nConfirm the project goal, current stage, current focus, and next real decision.");
    expect(state).toContain("## Stop / Continue Policy");
    expect(state).toContain("## Evidence");
    expect(state).toContain("## Last Updated\nCreated by `navi init --write`; not yet calibrated.");
    expect(state).not.toContain(path.basename(project));
    expect(state).not.toContain("Map status: confirmed");
  });
```

- [ ] **Step 3: Add an existing-state preservation test**

Add this test after the starter-state creation test:

```ts
  it("preserves an existing Navi project state", async () => {
    const project = await makeProject();
    const statePath = path.join(project, ".navi/state.md");
    const existingState = `# Navi Project State

## Project Goal
Ship the confirmed target-project workflow.

## Current Stage
Implementation review.

## Current Focus
Review the bounded worktree result.
`;
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, existingState);

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const stateAction = plan.actions.find((action) => action.relativePath === ".navi/state.md");
    expect(stateAction?.kind).toBe("skip");
    expect(stateAction?.summary).toContain("already exists");
    await expect(fs.readFile(statePath, "utf8")).resolves.toBe(existingState);
  });
```

- [ ] **Step 4: Add `.navi` parent symlink safety coverage**

Add this test after the existing project-map parent-symlink test:

```ts
  it("rejects a symlinked .navi directory before creating state", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const outsideStateDir = path.join(path.dirname(project), "outside-navi-state");
    const outsideStatePath = path.join(outsideStateDir, "state.md");

    await fs.mkdir(outsideStateDir);
    await fs.symlink(outsideStateDir, path.join(project, ".navi"));

    await expect(applyInitPlan(plan)).rejects.toThrow(/symlink/i);
    expect(await exists(outsideStatePath)).toBe(false);
  });
```

- [ ] **Step 5: Update the existing all-skipped fixture for the new standard action**

In the existing `renders write mode as no-op when every action is skipped` test, create an existing state before building the plan:

```ts
    const statePath = path.join(project, ".navi/state.md");
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, "# Existing Navi Project State\n");

    const plan = await buildInitPlan({ targetDir: project, write: true });
    const output = renderInitPlan(plan);

    expect(plan.actions.every((action) => action.kind === "skip")).toBe(true);
    expect(output).toContain("No files needed changes.");
    expect(output).not.toContain("Files were changed according to the plan above.");
```

- [ ] **Step 6: Run the targeted CLI test and confirm the red state**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because `.navi/state.md`, `planProjectStateAction()`, and `renderNaviStarterState()` do not exist yet.

- [ ] **Step 7: Add the state path and state action to `buildInitPlan()`**

In `src/cli/navi-init.ts`, add the constant beside the existing target-relative paths:

```ts
const AGENTS_RELATIVE_PATH = "AGENTS.md";
const PROJECT_MAP_RELATIVE_PATH = "docs/along/project-maps/navi-project-map.md";
const NAVI_STATE_RELATIVE_PATH = ".navi/state.md";
```

Then extend `buildInitPlan()`:

```ts
  const agentsPath = resolveTargetPath(targetDir, AGENTS_RELATIVE_PATH);
  const mapPath = resolveTargetPath(targetDir, PROJECT_MAP_RELATIVE_PATH);
  const statePath = resolveTargetPath(targetDir, NAVI_STATE_RELATIVE_PATH);

  const actions: InitAction[] = [
    await planAgentsAction(agentsPath),
    await planProjectMapAction(targetDir, mapPath),
    await planProjectStateAction(statePath),
  ];
```

Keep alpha.13 suggested-map construction after the standard action list. Do not attach suggested content to the state action.

- [ ] **Step 8: Implement create-or-skip state planning**

Add this function immediately after `planProjectMapAction()`:

```ts
async function planProjectStateAction(statePath: string): Promise<InitAction> {
  const existing = await readTextIfExists(statePath);

  if (existing !== undefined) {
    return {
      kind: "skip",
      relativePath: NAVI_STATE_RELATIVE_PATH,
      absolutePath: statePath,
      summary: "A project-local Navi state snapshot already exists. Navi will preserve it.",
    };
  }

  return {
    kind: "create",
    relativePath: NAVI_STATE_RELATIVE_PATH,
    absolutePath: statePath,
    summary: "Create a conservative, uncalibrated Navi project state snapshot.",
    content: renderNaviStarterState(),
  };
}
```

Do not add a state-specific write path. The existing create-action preflight, `assertPhysicalWritePath()`, parent directory creation, and `writeNewFile(..., { flag: "wx" })` must protect this action.

- [ ] **Step 9: Implement the exact conservative starter state**

Add this renderer near `renderProjectMap()`:

```ts
function renderNaviStarterState(): string {
  return `# Navi Project State

## Project Goal
Unclear - needs calibration.

## Current Stage
Unclear - needs calibration.

## Current Focus
Unclear - review project evidence and choose the current focus.

## Parallel Work
None.

## Next Decision
Confirm the project goal, current stage, current focus, and next real decision.

## Stop / Continue Policy
Continue through reversible inspection and drafting. Stop before irreversible writes, broad scope changes, release decisions, or when the next decision is unclear.

## Evidence
- Created by \`navi init --write\`.
- Review README, project docs, specs, plans, recent commits, and user instructions before treating this state as current.

## Last Updated
Created by \`navi init --write\`; not yet calibrated.
`;
}
```

Do not interpolate the target path, project basename, inferred stage, suggested map, current Git state, timestamp, or source-thread context.

- [ ] **Step 10: Run the targeted CLI test and confirm green**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS, including the new dry-run, creation, preservation, and `.navi` symlink tests.

- [ ] **Step 11: Commit the starter-state implementation**

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts
git commit -m "feat: add navi starter state snapshot"
```

## Task 2: Integrate State With Suggested Evidence And Generated Trigger Behavior

**Files:**
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `src/cli/navi-init.ts`

**Interfaces:**
- Consumes: `NAVI_STATE_RELATIVE_PATH`, `renderNaviStarterState()`, alpha.13 bounded evidence discovery, alpha.13 self-generated-evidence filtering, `renderAgentsBlock()`, and the Task 1 state action.
- Produces:
  - `.navi/state.md` as a high-priority candidate evidence path;
  - neutral scoring for the exact generated starter state;
  - project-local trigger rules for state-first/evidence-challenged reading, artifact separation, update approval, and quietness.

- [ ] **Step 1: Add an init-then-suggest neutral-state regression test**

Add this test near the alpha.13 `--suggest-map` tests:

```ts
  it("reads the generated starter state without letting it determine project shape", async () => {
    const project = await makeProject();

    const writePlan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(writePlan);

    const output = renderInitPlan(
      await buildInitPlan({ targetDir: project, write: false, suggestMap: true }),
    );

    expect(output).toContain("Evidence read:");
    expect(output).toContain(".navi/state.md");
    expect(output).toContain("Project shape hint: unclear");
    expect(output).not.toContain("Project shape hint: linear");
    expect(output).not.toContain("Project shape hint: flowing");
  });
```

This test assumes the merged alpha.13 remediation already neutralizes Navi-managed `AGENTS.md` content and the generated provisional starter map. If that prerequisite is missing, stop and finish alpha.13 before continuing.

- [ ] **Step 2: Strengthen `--suggest-map --write` state separation**

Extend the existing `combines suggest-map and write without writing the suggested map` test:

```ts
    const state = await fs.readFile(path.join(project, ".navi/state.md"), "utf8");

    expect(state).toContain("# Navi Project State");
    expect(state).toContain("Unclear - needs calibration.");
    expect(state).toContain("not yet calibrated");
    expect(state).not.toContain("Suggested map:");
    expect(state).not.toContain("Project shape hint:");
    expect(state).not.toContain("Project progress");
    expect(state).not.toContain("Project rhythm");
```

- [ ] **Step 3: Add generated-trigger behavior assertions**

Add this test after the alpha.12 generated-trigger test:

```ts
  it("installs alpha 14 project state snapshot rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      ".navi/state.md",
      "read it early for project orientation",
      "current user instructions and newer relevant project evidence may challenge it",
      "Project Map is route and structure",
      "Project State is the current navigation snapshot",
      "Handoff is the session-transfer package",
      "Current Focus",
      "Parallel Work",
      "one primary Next Decision",
      "manual or semi-manual",
      "explicit user approval",
      "Do not turn state into a mandatory response template",
    ]) {
      expect(agents).toContain(expected);
    }
  });
```

- [ ] **Step 4: Run the targeted CLI test and confirm the red state**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because `.navi/state.md` is not yet candidate evidence, the starter is not explicitly neutralized, and the generated trigger lacks alpha.14 wording.

- [ ] **Step 5: Add `.navi/state.md` to candidate matching and priority**

In the merged alpha.13 evidence candidate helper, include the exact normalized path:

```ts
    lowerPath === NAVI_STATE_RELATIVE_PATH ||
```

Place it before broad basename rules so `.navi/state.md` is recognized even though it lives in a hidden directory.

Do not add `.navi` to the ignored-directory set. If merged alpha.13 skips hidden directories generically, add an exact `.navi` exception while continuing to ignore unrelated hidden directories and all existing heavy/generated directories.

In `evidencePriority()`, give the state snapshot the highest project-state priority without changing the ordering of unrelated evidence:

```ts
  if (lower === NAVI_STATE_RELATIVE_PATH) return 0;
```

Shift other numeric priorities only if the final alpha.13 implementation requires unique values. Preserve deterministic path ordering from alpha.13 remediation.

- [ ] **Step 6: Neutralize only the exact generated starter during scoring**

Add this helper beside the alpha.13 self-generated-evidence sanitizers:

```ts
function evidenceTextForScoring(snippet: EvidenceSnippet): string {
  if (
    snippet.relativePath === NAVI_STATE_RELATIVE_PATH &&
    snippet.text.trim() === renderNaviStarterState().trim()
  ) {
    return "";
  }

  return snippet.text;
}
```

Use it when composing score input while preserving `evidenceRead`:

```ts
  const combined = snippets
    .map((snippet) => `${snippet.relativePath}\n${evidenceTextForScoring(snippet)}`)
    .join("\n")
    .toLowerCase();
```

If merged alpha.13 already has one central scoring sanitizer, fold the exact starter-state branch into that helper instead of creating a second competing pipeline. Preserve these semantics:

- the file path still appears under `Evidence read`;
- the exact starter contributes no linear/flowing keywords;
- any user-edited state is no longer byte-for-byte equal to the starter and may contribute evidence;
- no state content is written or normalized by this read path.

- [ ] **Step 7: Add the compact alpha.14 paragraph to `renderAgentsBlock()`**

Insert this paragraph after project-local evidence/source-priority guidance and before map rendering examples:

```text
When `.navi/state.md` exists, read it early for project orientation, but treat it as a declared snapshot rather than unquestionable truth. Current user instructions and newer relevant project evidence may challenge it. Project Map is route and structure; Project State is the current navigation snapshot; Handoff is the session-transfer package. `Current Focus` names the main-session focus, `Parallel Work` lists only concurrent work that may affect a later decision, and the project keeps one primary `Next Decision`. State is manual or semi-manual: suggest the smallest update only when future fresh-session navigation would materially change, and require explicit user approval before writing. Do not turn state into a mandatory response template; alpha.12 quietness still applies.
```

Do not add a second heading or print the starter state inside `AGENTS.md`.

- [ ] **Step 8: Run the targeted CLI test and confirm green**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS, including state evidence neutrality, `--suggest-map --write` separation, and generated-trigger assertions.

- [ ] **Step 9: Commit the CLI state-integration behavior**

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts
git commit -m "feat: integrate navi project state guidance"
```

## Task 3: Document The State Contract And Sync Plugin Copies

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

**Interfaces:**
- Consumes: the approved alpha.14 design, Task 1 starter-state structure, and Task 2 generated-trigger wording.
- Produces: a docs-backed alpha.14 behavior contract shared by canonical skill, full reference, project initialization docs, target-project trigger template, tests, and exact plugin copies.

- [ ] **Step 1: Add the failing alpha.14 contract test**

Add this test after the alpha.13 initialization-boundary test in `tests/skills/along-working-thread-skill.test.ts`:

```ts
  it("documents alpha 14 project state snapshot behavior", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const initDoc = await readRepoText("docs/along/project-maps/navi-project-init.md");
    const trigger = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      ".navi/state.md",
      "read it early",
      "current user instructions",
      "newer relevant project evidence",
      "explicit user approval",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
      expect(initDoc).toContain(expected);
      expect(trigger).toContain(expected);
    }

    for (const expected of [
      "Current Focus",
      "Parallel Work",
      "one primary `Next Decision`",
      "mandatory response template",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
      expect(trigger).toContain(expected);
    }

    expect(reference).toContain("manual or semi-manual");
    expect(initDoc).toContain("manual or semi-manual");

    for (const expected of [
      "## Alpha 14 Project State Snapshot",
      "Project Map   = route and structure",
      "Project State = current navigation snapshot",
      "Handoff       = session-transfer package",
      "trigger-based suspicion",
      "not an automatically synchronized status feed",
      "No control gain, no Navi surface",
      "independent Navi product model",
      "does not require `.along/`",
      "not a runtime state database",
      "not a project-management system",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(initDoc).toContain("navi init --write");
    expect(initDoc).toContain("must not overwrite an existing `.navi/state.md`");
    expect(initDoc).toContain("`--suggest-map` remains terminal-only");
  });
```

- [ ] **Step 2: Run the targeted skill test and confirm the red state**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because the canonical skill, reference, init doc, and trigger template do not yet contain the alpha.14 contract.

- [ ] **Step 3: Add minimal alpha.14 rules to the canonical skill**

In `.agents/skills/along-working-thread/SKILL.md`, add these behavior bullets near the project-local initialization and evidence rules:

```md
- When `.navi/state.md` exists, read it early for project orientation, but treat it as a declared snapshot rather than unquestionable truth. Current user instructions and newer relevant project evidence may challenge it.
- Project Map is route and structure; Project State is the current navigation snapshot; Handoff is the session-transfer package.
- In project state, `Current Focus` names the main-session focus, `Parallel Work` lists only concurrent work that may affect a later decision, and the project keeps one primary `Next Decision`.
- Project state is manual or semi-manual. Suggest the smallest state update only when future fresh-session navigation would materially change, and require explicit user approval before writing.
- Treat starter values, completed recorded lanes, conflicting user prompts, newer approved project records, and map/state disagreement as stale-state suspicion triggers. Use trigger-based suspicion, not automatic freshness scoring or automatic repair.
- Do not turn project state into a mandatory response template. Alpha.12 still applies: no control gain, no Navi surface.
- Do not silently write or automatically synchronize `.navi/state.md`.
- Do not turn `.navi/state.md` into a task list, runtime state store, background freshness check, or substitute for Project Map or handoff.
- Do not place secrets, hidden model memory, private conversation history, or external source-thread data in `.navi/state.md`.
```

- [ ] **Step 4: Add the complete alpha.14 section to the canonical reference**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, add a new section after Navi Project Initialization and before later map-selection details:

````md
## Alpha 14 Project State Snapshot

Alpha.14 adds one compact project-local navigation snapshot at `.navi/state.md`.

The artifact boundary is:

```text
Project Map   = route and structure
Project State = current navigation snapshot
Handoff       = session-transfer package
```

### Reading Rule

When `.navi/state.md` exists, read it early for project orientation. Treat it as a declared snapshot, not unquestionable truth. Current user instructions and newer relevant project evidence may challenge it. Relevant evidence includes approved specs, plans, handoffs, project records, or clearly relevant repository changes. Ordinary low-level activity does not automatically make state stale.

### State Shape

The compact state sections are `Project Goal`, `Current Stage`, `Current Focus`, `Parallel Work`, `Next Decision`, `Stop / Continue Policy`, `Evidence`, and `Last Updated`.

`Current Focus` names the main-session focus. `Parallel Work` lists only concurrent work that may affect a later decision and is not a task list. Keep one primary `Next Decision`; any parallel lane return condition stays with that parallel entry.

Only information that directly changes current navigation belongs in project state. Detailed history, tests, risk analysis, long task lists, and transfer context belong in project docs, plans, trackers, or handoffs.

### Stale-State Suspicion

Use trigger-based suspicion, not an algorithmic freshness score. State may be stale when the user changes goal or priority, a recorded lane has closed, the prompt conflicts with `Next Decision`, a newer approved record changes navigation, starter values remain, or state disagrees with the Project Map.

Stale suspicion may reduce confidence or justify a proposed patch. It must not trigger an automatic write, modification-time score, automatic Git scan on every prompt, watcher, daemon, or automatic repair.

### Update Rule

`.navi/state.md` uses manual or semi-manual maintenance. It is not an automatically synchronized status feed. Suggest the smallest update only when future fresh-session navigation would materially change, such as a goal, stage, focus, relevant parallel lane, primary next decision, stop/continue boundary, lane closure, or first calibration.

Do not suggest updates for ordinary file edits, targeted tests that do not change navigation, routine commits or pushes, temporary debugging, small implementation details, or `continue` inside an already-bounded loop.

Every durable state update requires explicit user approval and must preserve unrelated user-authored content.

### Quietness And Boundaries

Project State is primarily a continuity input, not a mandatory response template. No control gain, no Navi surface.

The `.navi/state.md` path belongs to Navi's independent product model. Along may later consume or enrich it, but alpha.14 does not require `.along/`, an Along runtime, Along Shared Desk, relationship modes, memory, or delegation systems.

Do not place secrets, hidden model memory, private conversation history, or external source-thread data in project state.

Alpha.14 is not a runtime state database, JSON schema layer, automatic project-state inference, background watcher, project-management system, task queue, worktree scheduler, automatic write-back mechanism, Memory v2, agent adapter, delegation system, local UI, or Along Shared Desk rebrand.
````

Keep the section docs-backed. Do not add operation schemas, runtime APIs, percentages, or automatic write commands.

- [ ] **Step 5: Update the project initialization doc**

In `docs/along/project-maps/navi-project-init.md`:

1. Add `.navi/state.md` to standard `navi init --write` output.
2. Describe it as a conservative, visibly uncalibrated starter state.
3. State that `navi init` must not overwrite an existing `.navi/state.md`.
4. State that `--suggest-map` remains terminal-only and never populates state.
5. Add the three-artifact boundary.
6. Explain that state is read early, challenged by newer evidence, and updated only with explicit user approval.
7. State that `.navi/state.md` is manual or semi-manual and is not a mandatory response template.
8. Explain that `.navi/state.md` belongs to independent Navi, does not require `.along/` or an Along runtime, and must not contain secrets or external conversation history.

Include this compact behavior paragraph:

```text
When `.navi/state.md` exists, read it early for project orientation. Treat it as a declared snapshot rather than unquestionable truth: current user instructions and newer relevant project evidence may challenge it. The file uses manual or semi-manual maintenance, and every durable update requires explicit user approval. It is not a mandatory response template.
```

Use this exact compact boundary block:

```text
Project Map   = route and structure
Project State = current navigation snapshot
Handoff       = session-transfer package
```

Use this exact option separation:

```text
--write       = durable standard project initialization, including starter state
--suggest-map = terminal-only project-shape preview
```

- [ ] **Step 6: Update the project trigger template**

In `docs/along/project-maps/navi-project-trigger-template.md`, add the same compact paragraph used in Task 2's generated `renderAgentsBlock()`:

```text
When `.navi/state.md` exists, read it early for project orientation, but treat it as a declared snapshot rather than unquestionable truth. Current user instructions and newer relevant project evidence may challenge it. Project Map is route and structure; Project State is the current navigation snapshot; Handoff is the session-transfer package. `Current Focus` names the main-session focus, `Parallel Work` lists only concurrent work that may affect a later decision, and the project keeps one primary `Next Decision`. State is manual or semi-manual: suggest the smallest update only when future fresh-session navigation would materially change, and require explicit user approval before writing. Do not turn state into a mandatory response template; alpha.12 quietness still applies.
```

Do not paste the full reference section into the trigger template.

- [ ] **Step 7: Sync exact plugin package copies**

Copy canonical files exactly:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Do not hand-edit the packaged copies separately.

- [ ] **Step 8: Run targeted skill and plugin validation**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
```

Expected:

- the targeted skill test passes with the new alpha.14 assertions;
- plugin verification reports exact canonical/package copies and exits 0.

- [ ] **Step 9: Commit the docs-backed state contract**

```bash
git add .agents/skills/along-working-thread/SKILL.md \
  .agents/skills/along-working-thread/references/working-thread-v1.md \
  docs/along/project-maps/navi-project-init.md \
  docs/along/project-maps/navi-project-trigger-template.md \
  plugins/along-working-thread/skills/along-working-thread/SKILL.md \
  plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: define navi project state behavior"
```

## Task 4: Run Final Targeted Validation And Stop At Review

**Files:**
- Verify only; no planned source modifications.

**Interfaces:**
- Consumes: Tasks 1-3 and the merged alpha.13 baseline.
- Produces: fresh targeted evidence, a scope report, residual-risk report, and a clean review/merge handoff.

- [ ] **Step 1: Run the targeted CLI suite**

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS. Report the exact test count from the command output.

- [ ] **Step 2: Run the targeted skill suite**

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS. Report the exact test count from the command output.

- [ ] **Step 3: Verify plugin package consistency**

```bash
npm run verify:plugin-package
```

Expected: PASS with canonical skill/reference copies matching packaged copies.

- [ ] **Step 4: Run whitespace validation**

```bash
git diff --check HEAD~3..HEAD
```

Expected: no output and exit code 0. Tasks 1-3 produce exactly three alpha.14 implementation commits; fold task-local corrections into their owning commit before this check.

- [ ] **Step 5: Verify scope and working tree state**

Run:

```bash
git status --short --branch
git diff --stat HEAD~3..HEAD
git diff --name-status HEAD~3..HEAD
```

Expected scope:

- `src/cli/navi-init.ts`
- `tests/cli/navi-init.test.ts`
- `.agents/skills/along-working-thread/SKILL.md`
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
- `docs/along/project-maps/navi-project-init.md`
- `docs/along/project-maps/navi-project-trigger-template.md`
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- `tests/skills/along-working-thread-skill.test.ts`

No `src/web`, README, changelog, release note, runtime/MCP, external target-project, tag, push, or release changes are allowed.

- [ ] **Step 6: Perform a final artifact-boundary inspection**

Confirm directly from generated content and tests:

```text
Project Map   = route and structure
Project State = current navigation snapshot
Handoff       = session-transfer package
```

Confirm all of these statements are true:

- dry-run creates no target files;
- `--write` creates the exact conservative starter state only when absent;
- existing state is preserved;
- the exact starter does not determine suggested project shape;
- `--suggest-map --write` does not put suggested content into state;
- no state update happens without explicit user approval;
- state guidance does not become a mandatory response template.

- [ ] **Step 7: Report and stop**

Report:

- implementation commit SHAs;
- changed files grouped by CLI/tests/docs/package copies;
- exact targeted test and verifier results;
- whether the worktree is clean;
- residual risks, especially prompt/docs-backed model variability and stale user-authored state;
- merge recommendation.

Stop at the main-session review/merge decision point. Do not merge, push, tag, publish, prepare a release, or start alpha.15.

## Plan Self-Check

- Spec coverage: the tasks cover conservative starter creation, dry-run/write behavior, existing-state preservation, symlink safety, suggested-map separation, state-first reading, evidence challenge, stale suspicion, meaningful update boundaries, explicit approval, compactness, quietness, multi-lane semantics, Map/State/Handoff separation, independent Navi ownership, package-copy sync, and targeted validation.
- Scope control: no runtime state database, JSON schema, watcher, automatic state inference, state command, UI, scheduler, Memory v2, adapter, delegation, release, npm publication, marketplace publication, or `src/web` work is included.
- Type consistency: Task 1 defines `NAVI_STATE_RELATIVE_PATH`, `planProjectStateAction()`, and `renderNaviStarterState()` before Task 2 consumes them. Task 2 uses existing `EvidenceSnippet` and alpha.13 scoring interfaces. Task 3 changes only prompt/docs-backed contracts and package copies.
- Execution prerequisite: implementation starts only from reviewed, merged alpha.13 behavior so alpha.14 does not recreate or conflict with alpha.13 remediation.
