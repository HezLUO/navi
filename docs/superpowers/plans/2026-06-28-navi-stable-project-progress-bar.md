# Navi Stable Project Progress Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Navi's skill/reference/package docs so Progress Maps use a stable target-project overall progress bar plus an optional current-stage sub-progress bar, instead of inventing a different overall bar each time.

**Architecture:** This is a documentation-behavior change only. Tests first assert the required wording in the canonical skill/reference and package README; then the canonical `.agents` skill/reference are updated and copied exactly into the package skill directory.

**Tech Stack:** Markdown skill docs, Vitest documentation assertions, existing `npm run verify:plugin-package` package verifier.

---

## File Structure

- Modify: `tests/skills/along-working-thread-skill.test.ts`
  - Add regression assertions for stable target-project progress bars, sub-progress bars, no hardcoded Navi stages for unrelated user projects, and package README checklist coverage.
- Modify: `.agents/skills/along-working-thread/SKILL.md`
  - Tighten short skill guardrails so they mention a stable target-project overall bar and optional current-stage sub-progress bar.
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Replace the current single ad hoc horizontal stage-bar guidance with the approved two-level target-project map structure.
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Keep an exact copy of `.agents/skills/along-working-thread/SKILL.md`.
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Keep an exact copy of `.agents/skills/along-working-thread/references/working-thread-v1.md`.
- Modify: `plugins/along-working-thread/README.md`
  - Add package-level validation language that the first two Navi prompt checks should use a stable target-project overall progress bar rather than a newly invented bar.

Do not modify runtime, MCP, UI, schema, dependencies, `.along/`, or background behavior.

## Task 1: Add Failing Documentation Assertions

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Add assertions to the existing Navi behavior test**

In `tests/skills/along-working-thread-skill.test.ts`, inside `it("documents Navi Progress Map behavior for non-expert users", async () => { ... })`, after the existing expectations for `visible product progress or internal preparation`, add:

```ts
    for (const expected of [
      "stable target-project overall progress bar",
      "current-stage sub-progress bar",
      "Do not generate a new overall progress bar every time.",
      "Do not hardcode Navi's own stages when the user is asking about a different target project.",
      "If no stable project-level stage sequence exists yet",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("stable target-project overall progress bar");
    expect(skill).toContain("current-stage sub-progress bar");
```

- [ ] **Step 2: Add assertions to the package README positioning test**

In the same file, inside `it("positions the package around Navi Progress Map without expanding runtime scope", async () => { ... })`, after the existing README prompt assertions, add:

```ts
    expect(readme).toContain("stable target-project overall progress bar");
    expect(readme).toContain("current-stage sub-progress bar");
```

- [ ] **Step 3: Run targeted test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "documents Navi Progress Map behavior for non-expert users"
```

Expected: FAIL because the current docs do not yet contain `stable target-project overall progress bar` or `current-stage sub-progress bar`.

- [ ] **Step 4: Commit failing test**

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover stable navi progress bars"
```

## Task 2: Update Canonical Skill And Reference

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update the short skill guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, replace the current horizontal stage-bar bullet:

```md
- Progress Map may include a horizontal stage bar when it helps a non-expert user understand project position, but the stage bar must use user-facing stage names and explain what the marked current stage is doing.
```

with:

```md
- Progress Map should use a stable target-project overall progress bar for progress and next-step orientation when a reliable project stage sequence exists.
- local concerns, fixes, retests, and follow-up tasks should appear in a current-stage sub-progress bar, not as new overall project stages.
- if no stable project-level stage sequence exists yet, say which source is needed, such as the project record, active plan, or user confirmation, instead of inventing stages.
```

- [ ] **Step 2: Update the skill output-style guardrails**

In the same file, after:

```md
- Do not use internal labels alone, such as "write skill/reference" or "implementation pass", without translating what that stage means for the user's goal.
```

add:

```md
- Do not hardcode Navi's own stages when the user is asking about a different target project.
```

- [ ] **Step 3: Replace the reference stage-bar section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, replace the block from:

```md
Progress Map may include a horizontal stage bar when it helps a non-expert user understand where the work stands:
```

through:

```md
For progress and next-step orientation questions, include a compact horizontal stage bar when the current stage sequence can be inferred. This applies to questions like "where are we", "what should we do next", `现在做到哪了？我看不懂。`, and `接下来我们应该做什么？`. If the sequence cannot be inferred reliably, do not invent stages; say which source is needed, such as the project record, recent changes, or active plan.
```

with:

````md
Progress Map should include a stable target-project overall progress bar for progress and next-step orientation questions when a reliable project stage sequence exists.

The overall progress bar answers: where is the user's target project?

```text
Project overall progress:
[Stage 1] -> [Stage 2] -> [Stage 3] -> [Stage 4] -> [Stage 5]
                         ^
                      Current position
```

The stage labels should come from the project context, active Working Thread, active plan, or a recently accepted Progress Map. Once established, the overall stage sequence should remain stable across repeated maps until the project direction changes enough to require a new map and the user accepts that change.

Do not generate a new overall progress bar every time. Do not hardcode Navi's own implementation stages when the user is asking about a different target project. Do not include Along project stages unless Along itself is the target project being discussed.

When the active overall stage has meaningful local work, add a current-stage sub-progress bar:

```text
Current-stage sub-progress:
[Issue found] -> [Rule/checklist fixed] -> [Retest] -> [Commit/record] -> [Next stage]
                                  ^
                               Current step
```

The sub-progress bar answers: what is happening inside the current target-project stage? Local concerns, fixes, retests, and follow-up tasks belong in the sub-progress bar; they should not become new overall project stages.

Every marked current position must be followed by a plain-language explanation of what that stage is doing, why it matters, what comes next, and what the user needs to confirm. Do not use internal labels alone, such as "write skill/reference" or "implementation pass", without translating what that stage means for the user's goal.

For progress and next-step orientation questions, include a compact horizontal stage bar when the current stage sequence can be inferred. This applies to questions like "where are we", "what should we do next", `现在做到哪了？我看不懂。`, and `接下来我们应该做什么？`. If no stable project-level stage sequence exists yet, do not invent stages; say which source is needed, such as the project record, active plan, or user confirmation.
````

- [ ] **Step 4: Update the reference example**

In the `Example for `继续吧` when the next action is not already clear:` block, replace the current example's first bar:

```text
[Navi progress]
[Problem found] -> [Map format defined] -> [Agent instructions updated] -> [Ambiguous phrases refined] -> [Fresh-session validation] -> [Real-use calibration]
                                                                                  ^
                                                                               Current position
```

with:

```text
[Project overall progress]
[Problem definition] -> [Behavior design] -> [Documentation] -> [Fresh-session validation] -> [Real-use calibration] -> [Stable behavior]
                                                                ^
                                                             Current position

[Current-stage sub-progress]
[Ambiguous phrase found] -> [Continue rule clarified] -> [Fresh-session retest] -> [User confirmation]
                                     ^
                                  Current step
```

Also replace:

```text
We are refining ambiguous user phrases, not adding a new feature.
```

with:

```text
The target project is in fresh-session validation. Inside that stage, we are clarifying an ambiguous continue rule, not adding a new feature.
```

- [ ] **Step 5: Run targeted test and verify it passes**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "documents Navi Progress Map behavior for non-expert users"
```

Expected: PASS for the targeted test.

- [ ] **Step 6: Commit canonical docs**

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: define stable target project progress bars"
```

## Task 3: Sync Package Skill Copy And Update README Checklist

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/README.md`

- [ ] **Step 1: Copy canonical skill into package skill**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
```

- [ ] **Step 2: Copy canonical reference into package reference**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 3: Update README Navi Progress Map expected text**

In `plugins/along-working-thread/README.md`, replace the expected text for:

```text
接下来我们应该做什么？
```

with:

```md
Expected: Codex gives a Navi Progress Map before recommending more work. When a reliable target-project stage sequence exists, it should include a stable target-project overall progress bar, identify current position, explain what the current stage is doing, name completed work, what still remains, why the next step matters, what the user needs to confirm, and the main risk if one exists.
```

Replace the expected text for:

```text
现在做到哪了？我看不懂。
```

with:

```md
Expected: Codex includes a stable target-project overall progress bar when a reliable stage sequence exists, distinguishes visible user-verifiable progress from internal preparation, explains what the current stage is doing, and names what the user can inspect or ask the agent to validate.
```

After the `这个方案可以吗？我不懂技术。` expected text, add:

```md
Stable bar note: The overall progress bar should describe the user's target project, not Navi's own implementation stages. Local concerns or fixes should appear in a current-stage sub-progress bar when useful.
```

- [ ] **Step 4: Run package positioning test and verify it passes**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "positions the package around Navi Progress Map without expanding runtime scope"
```

Expected: PASS for the targeted package positioning test.

- [ ] **Step 5: Commit package sync and README**

```bash
git add plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/README.md
git commit -m "docs: sync stable progress map package guidance"
```

## Task 4: Full Verification And Handoff

**Files:**
- Verify only; no planned file changes.

- [ ] **Step 1: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected:

```text
tests/skills/along-working-thread-skill.test.ts: 13 tests passed
Plugin validation passed
Along Working Thread repo package verification passed
```

If Vitest fails with `EPERM` while writing a temporary config file, rerun the same command with `sandbox_permissions: "require_escalated"` and record that the rerun was needed because Vitest writes a temporary bundled config file.

- [ ] **Step 2: Run diff check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 3: Review final diff**

Run:

```bash
git status --short --branch
git log --oneline -6
```

Expected:

- worktree is clean;
- recent commits include the three task commits;
- no runtime, MCP, UI, schema, dependency, `.along/`, or background behavior files changed.

- [ ] **Step 4: Report fresh-session validation prompts**

Report that the next validation should use a real fresh Codex thread, not a subagent, with these prompts:

```text
接下来我们应该做什么？
现在做到哪了？我看不懂。
继续吧。
这个方案可以吗？我不懂技术。
```

Expected validation:

- first two prompts use a stable target-project overall progress bar;
- if local work exists inside the current stage, it appears in a current-stage sub-progress bar;
- progress bars explain what the current stage is doing;
- Navi does not hardcode its own implementation stages when the user asks about another target project;
- `继续吧。` does not blindly execute when acceptance points are unclear;
- `这个方案可以吗？我不懂技术。` remains a pre-approval check.

## Boundary Checklist

The implementation is inside scope only if all remain true:

- no new runtime behavior;
- no graphical UI;
- no MCP tools, resources, prompts, or schema changes;
- no `.along/` state;
- no dependencies;
- no background watcher, scheduler, notification, or local presence behavior;
- no automatic implementation after a map;
- no claim that product feeling is validated without fresh-session and user calibration.

## Self-Review

Spec coverage:

- Stable target-project overall bar: Task 2 and Task 3.
- Current-stage sub-progress bar: Task 2 and Task 3.
- Navi is only current test case, not the user's project: Task 2 reference wording and Task 3 README note.
- Local concerns should not rewrite the main bar: Task 2 reference wording.
- No UI/runtime/schema scope: Task 4 boundary checklist.

Placeholder scan:

- No unfinished-marker text remains.
- All file paths are exact.
- Test commands and expected outcomes are explicit.

Type consistency:

- This is Markdown/test-only work. The same phrases are used consistently across test assertions, canonical docs, package docs, and README: `stable target-project overall progress bar` and `current-stage sub-progress bar`.
