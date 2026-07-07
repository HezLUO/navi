# Navi Alpha 10 Project-Local Map Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project-local Map Maintenance guidance to `navi init` generated files so fresh sessions know when to suggest, approve, or avoid Project/Rhythm Map updates without turning maps into task logs.

**Architecture:** Keep this as a narrow docs/string-rendering update. Add failing `navi init` generated-file tests first, update the project-local trigger template with one short rule, update the generated `AGENTS.md` block with the same short rule, update the generated project map starter with the detailed `## Map Maintenance` section, then run targeted verification. Do not change runtime behavior, skill/plugin package behavior, README, release notes, external target projects, or `src/web`.

**Tech Stack:** TypeScript CLI string rendering, Markdown project-map template docs, Vitest CLI tests.

---

## Navi-Specific Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Start the implementation worktree from current `main`, which includes:

```text
2a63ec4 docs: add navi alpha 10 map maintenance design
d5b2ba3 docs: add navi alpha 9 calibration evidence plan
```

Do not tag, release, publish to npm, update GitHub Releases, run full release checklists, modify `src/web`, modify external target projects, change package ids, create runtime/thread orchestration, add a `navi map update` command, add automatic map scanning, add automatic map rewriting, or expand this into a map-management system.

Allowed validation:

- `npm test -- tests/cli/navi-init.test.ts`
- `git diff --check`

Do not run the full test suite, typecheck, plugin package verification, or release checks unless a targeted failure proves this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/cli/navi-init.test.ts`
  - Adds targeted generated-file tests for the alpha.10 trigger rule and generated map maintenance section.
- `docs/along/project-maps/navi-project-trigger-template.md`
  - Adds one short project-local trigger rule about stale or misleading maps.
- `src/cli/navi-init.ts`
  - Keeps generated `AGENTS.md` trigger text in sync with the template.
  - Adds the detailed `## Map Maintenance` section to the generated project map starter.

Do not modify:

- `.agents/skills/**`
- `plugins/**`
- `src/web/**`
- README files
- release notes or GitHub Release bodies
- package ids, skill ids, or CLI aliases
- external target projects
- untracked `work/`

---

### Task 1: Add Failing Alpha.10 `navi init` Tests

**Files:**

- Modify: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Add the generated-trigger test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"installs alpha 8 decision handoff quality rules for generated Navi triggers"` test:

```ts
  it("installs alpha 10 map maintenance trigger guidance for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    expect(agents).toContain(
      "If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.",
    );
    expect(agents).not.toContain("This map is a navigation baseline, not a task log.");
    expect(agents).not.toContain("Update it when navigation judgment changes");
  });
```

- [ ] **Step 2: Add the generated-map maintenance test**

In `tests/cli/navi-init.test.ts`, insert this test after the existing `"writes AGENTS.md and a provisional project map only behind --write"` test:

```ts
  it("installs alpha 10 map maintenance guidance in the generated project map", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const map = await fs.readFile(path.join(project, "docs/along/project-maps/navi-project-map.md"), "utf8");

    for (const expected of [
      "## Map Maintenance",
      "This map is a navigation baseline, not a task log.",
      "Update it when navigation judgment changes",
      "current stage, focus, main track, map type, source-of-truth files, or project direction changes",
      "Do not update it for ordinary file edits, tests, commits, pushes, temporary status notes, or bounded subtasks that do not change overall navigation.",
      "Map updates are durable project writes.",
      "Codex/Navi may suggest a small patch, but user approval is required before writing.",
    ]) {
      expect(map).toContain(expected);
    }
  });
```

- [ ] **Step 3: Run the targeted test to verify it fails**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL. The first failure should mention missing alpha.10 text such as `## Map Maintenance` or `If the Project/Rhythm Map seems stale or misleading`.

Do not commit failing tests yet.

---

### Task 2: Update Project Trigger Template

**Files:**

- Modify: `docs/along/project-maps/navi-project-trigger-template.md`

- [ ] **Step 1: Add the short trigger rule**

In `docs/along/project-maps/navi-project-trigger-template.md`, insert this paragraph after the existing alpha.8 decision handoff quality paragraph and before `No Menu Inside Approved Boundary`:

```markdown
If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.
```

Keep the template short. Do not paste the full `## Map Maintenance` section into `AGENTS.md` trigger guidance.

- [ ] **Step 2: Re-run the targeted test**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: still FAIL until `src/cli/navi-init.ts` is updated, because the generated `AGENTS.md` block and generated project map starter are not yet in sync.

---

### Task 3: Update `navi init` Generated Text

**Files:**

- Modify: `src/cli/navi-init.ts`

- [ ] **Step 1: Sync the generated `AGENTS.md` block**

In `renderAgentsBlock()`, add this paragraph in the same relative location as the trigger template:

```markdown
If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.
```

Do not add the detailed maintenance section to `renderAgentsBlock()`.

- [ ] **Step 2: Add the generated project map maintenance section**

In `renderProjectMap()`, insert this section after the `## Current Map` guidance and before `## Fresh-Session Validation`:

```markdown
## Map Maintenance

This map is a navigation baseline, not a task log.

Update it when navigation judgment changes, such as when the current stage, focus, main track, map type, source-of-truth files, or project direction changes.

Do not update it for ordinary file edits, tests, commits, pushes, temporary status notes, or bounded subtasks that do not change overall navigation.

Map updates are durable project writes. Codex/Navi may suggest a small patch, but user approval is required before writing.
```

- [ ] **Step 3: Preserve existing starter behavior**

Verify the generated map still contains:

- `# Navi Project Map`
- `Map status: provisional`
- `This map only establishes where Navi should look first.`
- `## Fresh-Session Validation`

Do not change the validation prompt.

---

### Task 4: Targeted Verification

**Files:**

- Verify: `tests/cli/navi-init.test.ts`
- Verify: `docs/along/project-maps/navi-project-trigger-template.md`
- Verify: `src/cli/navi-init.ts`

- [ ] **Step 1: Run the targeted CLI tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run whitespace verification**

Run:

```bash
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Inspect the diff**

Run:

```bash
git diff -- tests/cli/navi-init.test.ts docs/along/project-maps/navi-project-trigger-template.md src/cli/navi-init.ts
```

Confirm:

- `AGENTS.md` trigger guidance only gets the one short stale-map rule.
- Generated project map gets the full `## Map Maintenance` section.
- No README, release, plugin, skill, runtime, `src/web`, or external target-project files changed.

---

## Completion Report

When finished, report:

- files changed;
- targeted tests run and results;
- whether the implementation stayed within the approved alpha.10 boundary;
- whether any unexpected files changed;
- exact commit hash if the worktree session committed the implementation.

Do not tag, release, push, or merge unless the main session/user explicitly approves that later.
