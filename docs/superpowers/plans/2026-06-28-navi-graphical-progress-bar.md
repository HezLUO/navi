# Navi Graphical Progress Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Navi graphical progress bar design as stable skill/package guidance and fixture-style tests, without adding runtime, MCP, or UI code.

**Architecture:** This is a documentation-driven skill behavior change. The canonical source remains `.agents/skills/along-working-thread`, the plugin package remains an exact distribution copy under `plugins/along-working-thread/skills/along-working-thread`, and tests enforce that Navi uses a stable `Project Map` model, source priority, horizontal chat rendering, and degraded-state rules.

**Tech Stack:** Markdown skill docs, Vitest fixture tests, existing `npm run verify:plugin-package` package verifier.

---

## File Structure

- Modify: `tests/skills/along-working-thread-skill.test.ts`
  - Responsibility: fixture-style assertions that the skill/reference/README document the Project Map model, source priority, horizontal rendering, triggers, and degraded-state behavior.
- Modify: `.agents/skills/along-working-thread/SKILL.md`
  - Responsibility: short top-level Navi behavior guardrails for when the map appears and what it must include.
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Responsibility: detailed behavior reference, examples, source priority, rendering shape, and fallback rules.
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Responsibility: exact package copy of the canonical skill.
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Responsibility: exact package copy of the canonical reference.
- Modify: `plugins/along-working-thread/README.md`
  - Responsibility: package-level user/developer summary and fresh-session validation checklist for graphical progress behavior.

Do not modify runtime files under `src/`. Do not build a real graphical UI, image renderer, MCP server, background store, or schema migration in this plan.

---

## Task 1: Add Failing Fixture Tests for Project Map Behavior

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Add failing tests for the Project Map model, source priority, chat rendering, and README checklist**

Append these `it(...)` blocks inside the existing `describe("Along Working Thread Codex skill", () => { ... })` block, after the current Navi Progress Map test:

```ts
  it("documents the Navi Project Map model and source priority", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "Project Map",
      "map_status",
      "overall_stages",
      "current_overall_stage",
      "current_stage_explanation",
      "sub_progress",
      "visible_evidence",
      "missing_or_risk",
      "next_gate",
      "user_confirmation_needed",
      "source",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "user just confirmed",
      "active Working Thread or project record",
      "approved plan or spec",
      "most recent Navi map that the user did not reject",
      "provisional inferred map",
      "clearly marked as awaiting confirmation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("stable Project Map");
    expect(skill).toContain("source priority");
    expect(reference).toContain("If sources conflict");
    expect(reference).toContain("confirmed user-facing project map wins");
  });

  it("documents compact horizontal rendering and mandatory current-position explanation", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "compact horizontal progress strip",
      "[需求澄清] -> [方案比较] -> [原型设计]",
      "▲",
      "The strip answers \"where am I\"",
      "the explanation answers \"what does this position mean\"",
      "Every current position must be followed by a plain-language explanation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("compact horizontal progress strip");
    expect(skill).toContain("plain-language explanation");
  });

  it("documents degraded state rules for unreliable project maps", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "should not draw a confident stable bar",
      "我现在还没有可靠的项目地图",
      "临时判断，待你确认后才会作为稳定项目地图",
      "Accuracy is more important than immediate visual confidence",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("must not draw a confident stable bar");
    expect(skill).toContain("provisional map");
  });

  it("documents graphical progress bar validation in the package README", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");

    for (const expected of [
      "Project Map",
      "stable target-project stage sequence",
      "compact horizontal progress strip",
      "source priority",
      "provisional map",
      "must not draw a confident stable bar",
    ]) {
      expect(readme).toContain(expected);
    }
  });
```

- [ ] **Step 2: Run the focused skill test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: `FAIL` with missing string assertions such as `stable Project Map`, `source priority`, or `compact horizontal progress strip`.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover navi graphical progress map guidance"
```

Expected: one test-only commit.

---

## Task 2: Update Canonical Skill and Reference Guidance

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update the canonical skill guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, inside `## Behavior Guardrails`, add these bullets near the existing stable progress bar bullets:

```markdown
- Navi progress bars should be generated from a stable Project Map rather than improvised from the latest message alone.
- Project Map guidance uses source priority: user-confirmed map, active Working Thread or project record, approved plan or spec, most recent unrejected Navi map, then provisional map.
- when a reliable Project Map exists, render progress and next-step orientation as a compact horizontal progress strip with a plain-language explanation of the current position.
- if the Project Map is unreliable, Navi must not draw a confident stable bar; it may give a provisional map only when clearly marked as awaiting confirmation.
```

- [ ] **Step 2: Add detailed Project Map reference section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, inside the `## Progress Map` section after the existing introductory structure and before the first stable-bar example, add this subsection:

````markdown
### Project Map Model

Navi's progress bar should be generated from a stable `Project Map`, not improvised from the latest message alone.

```text
Project Map
- project_name: the user's current supervised project
- map_status: confirmed | provisional
- overall_stages: stable target-project stages
- current_overall_stage: the active overall stage
- current_stage_explanation: what the current stage means in plain language
- sub_progress: optional local steps inside the current stage
- visible_evidence: completed work the user can verify
- missing_or_risk: current gap, uncertainty, or main risk
- next_gate: acceptance point before moving to the next stage
- user_confirmation_needed: what the user needs to confirm now
- source: where this map came from
```

Use this source priority when building the `Project Map`:

1. the project map the user just confirmed;
2. the active Working Thread or project record;
3. an approved plan or spec;
4. the most recent Navi map that the user did not reject;
5. a provisional inferred map, clearly marked as awaiting confirmation.

If sources conflict, the more recently confirmed user-facing project map wins over older inferred state.

The overall progress bar describes the target project, not Navi's own internal answering process. Local concerns, document fixes, retests, validation loops, or calibration tasks belong in `sub_progress`. They must not rewrite `overall_stages`.
````

- [ ] **Step 3: Add horizontal rendering and degraded-state wording**

In the same `## Progress Map` section, after the existing stable/sub-progress bar rules, add this subsection:

````markdown
### Compact Horizontal Rendering

When a reliable Project Map exists, render progress and next-step orientation as a compact horizontal progress strip:

```text
项目总体进度
[需求澄清] -> [方案比较] -> [原型设计] -> [可行性验证] -> [交付准备]
                ▲
              当前位置
```

If the current overall stage has meaningful local work, add a second strip:

```text
当前阶段内部
[列出方案] -> [比较风险] -> [确认推荐] -> [进入原型]
                ▲
              当前位置
```

The strip answers "where am I"; the explanation answers "what does this position mean". Every current position must be followed by a plain-language explanation of what that stage is doing, why it matters, what comes next, and what the user needs to confirm.

If no reliable Project Map exists, Navi should not draw a confident stable bar. It should say:

```text
我现在还没有可靠的项目地图。为了避免误导，我需要先看项目记录、当前计划或最近确认的目标，然后再画进度条。
```

It may provide a provisional map only if clearly labeled:

```text
临时判断，待你确认后才会作为稳定项目地图。
```

Accuracy is more important than immediate visual confidence.
````

- [ ] **Step 4: Run the focused skill test and verify only README/package-copy assertions still fail**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: canonical skill/reference assertions pass. README assertions or package drift verification may still need Task 3.

- [ ] **Step 5: Commit the canonical guidance**

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: define navi project map guidance"
```

Expected: one docs commit touching only canonical skill/reference files.

---

## Task 3: Sync Package Copy and README Checklist

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/README.md`

- [ ] **Step 1: Copy canonical skill files into package skill files**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: package skill and reference exactly match the canonical files.

- [ ] **Step 2: Update README Navi summary**

In `plugins/along-working-thread/README.md`, after the paragraph that starts `Navi is accuracy-first in fresh sessions`, add:

```markdown
Navi progress bars should come from a stable **Project Map** rather than a one-off guess. The Project Map records the user's target project, stable target-project stage sequence, current stage, current-stage explanation, optional sub-progress, visible evidence, missing risk, next gate, user confirmation needed, and source.

Project Map source priority is: the map the user just confirmed, the active Working Thread or project record, an approved plan or spec, the most recent unrejected Navi map, then a clearly marked provisional map.

When a reliable Project Map exists, Navi should render a compact horizontal progress strip and explain the current position in plain language. If the map is unreliable, Navi must not draw a confident stable bar; it should inspect the source of truth or mark any provisional map as awaiting confirmation.
```

- [ ] **Step 3: Update README fresh-session checklist**

In the `### Navi Progress Map` checklist section of `plugins/along-working-thread/README.md`, after `Stable bar note: ...`, add:

```markdown
Graphical progress note: The map should use the stable Project Map source priority and render a compact horizontal progress strip when a reliable target-project stage sequence exists. The current-position marker must be followed by a plain-language explanation of what that stage is doing. If the source is unreliable, Codex should say it needs the project record, active plan, or user confirmation and must not draw a confident stable bar. A provisional map is acceptable only when clearly labeled as awaiting confirmation.
```

- [ ] **Step 4: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: `Plugin package verification passed.`

- [ ] **Step 5: Commit package sync and README**

```bash
git add plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/README.md
git commit -m "docs: sync navi graphical progress guidance"
```

Expected: one docs/package commit.

---

## Task 4: Final Verification and Local Install Sync

**Files:**
- No source edits expected unless verification reveals a mismatch.

- [ ] **Step 1: Run full package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: all Vitest tests pass, plugin validation passes, and source/package skill drift check passes.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Sync the installed personal plugin cache only after verification passes**

Run:

```bash
rsync -a --delete plugins/along-working-thread/ /Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0/
```

Expected: no output. The installed personal plugin cache now matches the repo package.

- [ ] **Step 4: Inspect final status**

Run:

```bash
git status --short --branch
```

Expected: `## main...origin/main [ahead N]` and no unstaged or uncommitted source changes.

- [ ] **Step 5: Report completion and recommend fresh-session validation**

Report:

```text
Implemented the Navi graphical progress bar guidance as documentation-backed behavior. Verification passed with npm run verify:plugin-package and git diff --check. The next product check is a real fresh Codex session in a non-Along project using: 现在做到哪了？我看不懂。 and 接下来我们应该做什么？
```

Do not claim product experience is proven. This implementation only makes the expected behavior available and test-covered.

---

## Self-Review Against Spec

- Spec requires data-model-first behavior: covered by Task 1 Project Map assertions and Task 2 Project Map reference.
- Spec requires source priority: covered by Task 1 source-priority assertions and Task 2 source-priority documentation.
- Spec requires compact horizontal chat rendering: covered by Task 1 rendering assertions and Task 2 rendering examples.
- Spec requires trigger/degraded-state rules: covered by Task 1 degraded-state assertions and Task 2 degraded-state guidance.
- Spec requires package visibility: covered by Task 3 README and package sync.
- Spec excludes runtime, MCP, background state, and UI implementation: file structure explicitly forbids `src/` runtime changes and Task 4 verifies package-only behavior.
