# Navi Rhythm Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document Navi Rhythm Map behavior so flowing projects such as internship applications and Hong Kong applications get rhythm-based maps instead of misleading one-way overall progress bars.

**Architecture:** This is a documentation-driven behavior update for the `along-working-thread` skill. Add fixture-style assertions first, update the canonical skill/reference docs, sync the plugin package copy, and verify the package drift checks. No runtime, MCP, UI, schema, or dependency changes are in scope.

**Tech Stack:** Markdown skill/reference docs, Vitest fixture assertions, repo-contained Codex plugin package, Node verification script.

---

## File Structure

- Modify: `tests/skills/along-working-thread-skill.test.ts`
  - Add fixture-style documentation tests for Rhythm Map selection, output requirements, examples, and package README/version positioning.
- Modify: `.agents/skills/along-working-thread/SKILL.md`
  - Add concise trigger/guardrail rules so Navi can choose between linear progress strips and Rhythm Maps.
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Add the detailed behavior model: project shape selection, Rhythm Map structure, examples, trigger/downgrade rules, and validation expectations.
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact copy of the canonical skill after updates.
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact copy of the canonical reference after updates.
- Modify: `plugins/along-working-thread/README.md`
  - Add package-facing explanation and fresh-session validation checks for flowing projects.
- Modify: `plugins/along-working-thread/VERSION.md`
  - Note that `0.1.0` now includes documented Rhythm Map behavior but remains a documentation-only behavior update.
- Optional external sync after verification: `/Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0/`
  - Sync the installed personal plugin cache from `plugins/along-working-thread/` only after repo verification passes.

## Constraints

- Do not change `src/`, MCP server code, package manifest shape, dependencies, runtime behavior, or UI.
- Do not add live model invocation tests.
- Keep `.agents/skills/along-working-thread` as canonical source and `plugins/along-working-thread/skills/along-working-thread` as exact distribution copy.
- Keep version `0.1.0`; do not bump to `0.2.0`.
- Treat successful tests as documentation/package verification, not proof that product feeling is complete.

---

### Task 1: Add Failing Rhythm Map Documentation Tests

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Add the core Rhythm Map fixture test**

In `tests/skills/along-working-thread-skill.test.ts`, add this test immediately after `it("documents compact horizontal rendering and mandatory current-position explanation", async () => { ... })` and before `it("documents degraded state rules for unreliable project maps", async () => { ... })`:

```ts
  it("documents Navi Rhythm Map behavior for flowing projects", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running project",
      "recurring daily, weekly, or periodic actions",
      "multiple parallel opportunities, routes, targets, or stakeholders",
      "external feedback that controls the next step",
      "repeated loops of refresh, screen, prepare, wait, follow up, and decide",
      "ongoing stewardship rather than one fixed deliverable",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "project shape",
      "whole long-running project",
      "bounded subtask",
      "linear subtask strip",
      "pick the narrowest useful map",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi should choose a Rhythm Map instead of forcing a one-way overall progress bar",
      "Rhythm Map",
      "flowing projects",
      "specific bounded subtask",
    ]) {
      expect(skill).toContain(expected);
    }
  });
```

- [ ] **Step 2: Add the Rhythm Map rendering and examples fixture test**

In the same file, add this test immediately after the test from Step 1:

```ts
  it("documents Rhythm Map rendering, examples, and downgrade behavior", async () => {
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "项目节奏",
      "[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]",
      "当前主线",
      "[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]",
      "This map does not express completion percentage.",
      "what the user must confirm",
      "where continuing will lead",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Internship Project",
      "[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]",
      "[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]",
      "status changes require evidence such as email, portal state, or screenshots",
      "material customization should wait until a specific target job is selected",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Hong Kong Application Project",
      "[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]",
      "[HKUST 表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]",
      "[预检] -> [填表] -> [附件核对] -> [最终确认] -> [提交后记录]",
    ]) {
      expect(reference).toContain(expected);
    }
  });
```

- [ ] **Step 3: Add the package-facing Rhythm Map fixture test**

In the same file, add this test immediately after `it("documents graphical progress bar validation in the package README", async () => { ... })`:

```ts
  it("documents Rhythm Map validation in the package README and version boundary", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const version = await readRepoText("plugins/along-working-thread/VERSION.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running projects",
      "weekly refresh",
      "daily preparation",
      "waiting for external feedback",
      "decision gate",
      "should not force a one-way overall progress bar",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "internship-style project",
      "Hong Kong application-style project",
      "whole long-running project",
      "bounded subtask",
    ]) {
      expect(readme).toContain(expected);
    }

    expect(version).toContain("Rhythm Map behavior for flowing long-running projects");
    expect(version).toContain("documentation-only behavior update");
  });
```

- [ ] **Step 4: Run targeted tests and verify they fail**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "Rhythm Map"
```

Expected: FAIL. The new assertions should fail because `Rhythm Map` and the flowing-project examples are not yet documented in the skill/reference/package docs.

- [ ] **Step 5: Commit the failing tests**

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: add navi rhythm map documentation assertions"
```

---

### Task 2: Update Canonical Skill And Reference Docs

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update canonical `SKILL.md` guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets inside `## Behavior Guardrails` after the existing bullet:

```text
- Navi should choose a Rhythm Map instead of forcing a one-way overall progress bar when the target work is a flowing long-running project.
- flowing projects include recurring daily, weekly, or periodic actions; multiple parallel opportunities, routes, targets, or stakeholders; external feedback that controls the next step; repeated loops of refresh, screen, prepare, wait, follow up, and decide; or ongoing stewardship rather than one fixed deliverable.
- when the user asks about a whole long-running flowing project, use a Rhythm Map that shows project rhythm, current focus, waiting states, and user decision gate.
- when the user asks about a specific bounded subtask inside a flowing project, use the narrowest useful map, such as a linear subtask strip.
- if the project shape is unclear, mark the map as provisional rather than presenting a confident stable map.
```

Place these immediately after:

```text
- Progress Map should use a stable target-project overall progress bar for progress and next-step orientation when a reliable project stage sequence exists.
```

- [ ] **Step 2: Add the project shape selection section to the reference**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section after the `### Project Map Model` source-priority discussion and before the existing paragraph that starts `The overall progress bar describes the target project`:

````md
### Project Shape Selection

Navi should not assume that every supervised project has one stable one-way completion path. Before choosing a visual map, identify the layer the user is asking about:

```text
Whole long-running project? -> classify project shape
Specific subtask?           -> classify subtask shape
````

Use a linear progress strip when the work is a one-time delivery or a bounded subtask:

```text
[需求] -> [设计] -> [执行] -> [验证] -> [交付]
```

Use a Rhythm Map when the work is a flowing long-running project with signals such as:

- recurring daily, weekly, or periodic actions;
- multiple parallel opportunities, routes, targets, or stakeholders;
- external feedback that controls the next step;
- repeated loops of refresh, screen, prepare, wait, follow up, and decide;
- ongoing stewardship rather than one fixed deliverable.

If the project shape is mixed, Navi should pick the narrowest useful map:

- whole long-running project: Rhythm Map;
- specific bounded subtask: linear subtask strip;
- unclear scope: provisional map plus a confirmation question.
```

- [ ] **Step 3: Add the Rhythm Map section to the reference**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section immediately after the new `### Project Shape Selection` section:

````md
### Rhythm Map

A Rhythm Map is the Navi map form for flowing long-running projects. It should not express completion percentage. It should show the current cycle, active focus, waiting states, user decision gate, and where continuing will lead.

Use this structure:

```text
项目节奏
[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]
                                      ▲
                                   当前焦点

当前主线
[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]
                         ▲
                      当前动作
````

The upper layer answers: what repeating rhythm is this long-running project currently in?

The lower layer answers: what specific track or action is active in this conversation?

A valid Rhythm Map response must include:

- a compact rhythm strip;
- a compact active-track or current-action strip when useful;
- a plain-language explanation of the current focus;
- what has changed or stayed stable;
- the recommended next small loop;
- what the user must confirm;
- any main risk, especially if the agent may otherwise over-execute or update status without evidence.

Do not use internal labels alone. If the rhythm says `日常准备`, explain what that means for the user's actual goal.
```

- [ ] **Step 4: Add the internship and Hong Kong application examples to the reference**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section immediately after the new `### Rhythm Map` section:

````md
#### Example: Internship Project

For an internship-style project, the whole project is flowing because it combines weekly job-pool refresh, daily interview preparation, active application waiting, and evidence-driven status updates.

```text
项目节奏
[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]
                                      ▲
                                   当前焦点

当前主线
[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]
                     ▲
                  当前动作
````

The explanation should make clear that today is not about "finishing the project"; the next useful move is a small daily loop; status changes require evidence such as email, portal state, or screenshots; and material customization should wait until a specific target job is selected.

#### Example: Hong Kong Application Project

For a Hong Kong application-style project, the whole project is flowing because supervisor screening, direction planning, materials, forms, and follow-ups continue in parallel.

```text
项目节奏
[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]
                                ▲
                             当前焦点

当前主线
[HKUST 表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]
                       ▲
                    当前动作
```

The overall project uses a Rhythm Map, but a bounded subtask such as `HKUST CSE Early 表单填报` can still use a linear subtask strip:

```text
[预检] -> [填表] -> [附件核对] -> [最终确认] -> [提交后记录]
```
```

- [ ] **Step 5: Update compact rendering guidance to include Rhythm Maps**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, inside `### Compact Horizontal Rendering`, add this paragraph after:

```text
When a reliable Project Map exists, render progress and next-step orientation as a compact horizontal progress strip.
```

Add:

```md
When the project is flowing rather than linear, render the Rhythm Map as compact horizontal strips instead of a one-way overall progress strip. The same rule applies: the strip answers "where am I", and the explanation answers "what does this position mean".
```

- [ ] **Step 6: Run targeted tests and verify the canonical docs now satisfy the new core assertions**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "Navi Rhythm Map behavior|Rhythm Map rendering"
```

Expected: PASS for the new canonical skill/reference tests. The package README/version test may still fail until Task 3.

- [ ] **Step 7: Commit canonical docs**

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: teach navi rhythm map behavior"
```

---

### Task 3: Sync Plugin Package Docs And README

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/README.md`
- Modify: `plugins/along-working-thread/VERSION.md`

- [ ] **Step 1: Sync the packaged skill copy from canonical source**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: `git diff -- plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md` shows the same conceptual changes as the canonical docs.

- [ ] **Step 2: Add package README Rhythm Map section**

In `plugins/along-working-thread/README.md`, insert this section after the existing paragraph that ends with:

```text
If the map is unreliable, Navi must not draw a confident stable bar; it should inspect the source of truth or mark any provisional map as awaiting confirmation.
```

Add:

```md
For flowing long-running projects, Navi should use a **Rhythm Map** instead of forcing a one-way overall progress bar. Flowing projects include internship-style project work, Hong Kong application-style project work, weekly refresh cycles, daily preparation loops, waiting for external feedback, parallel opportunities, and decision gates.

A Rhythm Map should show:

1. the recurring project rhythm;
2. the current active track;
3. what is waiting on outside evidence;
4. the next small loop;
5. the decision gate the user must confirm.

For a whole long-running project, use the Rhythm Map. For a bounded subtask inside that project, such as a form-filling sequence, use the narrowest useful map, including a linear subtask strip when that is clearer. Navi should not force a one-way overall progress bar when the project is actually a recurring cycle.
```

- [ ] **Step 3: Add package README fresh-session validation checks**

In `plugins/along-working-thread/README.md`, inside `### Navi Progress Map`, add this block after the existing `Graphical progress note` paragraph:

```md
Rhythm Map note: For flowing long-running projects, fresh-session validation should check that Codex does not force a single overall completion path. In an internship-style project, `接下来我们应该做什么？` should produce a Rhythm Map that distinguishes weekly refresh, daily preparation, waiting for external feedback, and a decision gate. In a Hong Kong application-style project, the whole project should use a Rhythm Map, while a bounded form-filling subtask may use a linear subtask strip.
```

- [ ] **Step 4: Update VERSION boundary text**

In `plugins/along-working-thread/VERSION.md`, update the second paragraph from:

```md
This pass documents Navi as the customer-facing Progress Map behavior for non-expert progress and next-step questions. It is not a runtime capability upgrade.
```

to:

```md
This pass documents Navi as the customer-facing Progress Map behavior for non-expert progress and next-step questions, including Rhythm Map behavior for flowing long-running projects. It is a documentation-only behavior update, not a runtime capability upgrade.
```

Add this bullet under `The package continues to provide:` after `Navi Progress Maps for progress, next-step, continue, and confusion questions from non-expert users;`:

```md
- Rhythm Maps for flowing long-running projects with recurring cycles, parallel opportunities, external feedback, and user decision gates;
```

- [ ] **Step 5: Run targeted package tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "Rhythm Map"
```

Expected: PASS for all Rhythm Map tests.

- [ ] **Step 6: Run full skill/package test file**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for all tests in `tests/skills/along-working-thread-skill.test.ts`.

- [ ] **Step 7: Commit package docs**

```bash
git add plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/README.md plugins/along-working-thread/VERSION.md
git commit -m "docs: package navi rhythm maps"
```

---

### Task 4: Verify Package And Sync Installed Cache

**Files:**
- Review: `scripts/verify-plugin-package.mjs`
- Review: `.agents/skills/along-working-thread/`
- Review: `plugins/along-working-thread/`
- Optional external sync target: `/Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0/`

- [ ] **Step 1: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This should run the skill tests, plugin validation, and exact source/package drift check.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Confirm branch state**

Run:

```bash
git status --short --branch
```

Expected: clean working tree on the implementation branch or `main`, with the new commits ahead of the remote if not pushed.

- [ ] **Step 4: Sync installed personal plugin cache**

If implementing from the main local repo and the installed cache exists, sync the verified package to the installed personal plugin cache:

```bash
rsync -a --delete plugins/along-working-thread/ /Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0/
```

Expected: command succeeds. If Codex sandbox blocks writes outside the workspace, request escalation with the reason: syncing the verified local plugin package into the installed personal plugin cache.

- [ ] **Step 5: Verify installed cache matches package**

Run:

```bash
diff -qr plugins/along-working-thread /Users/james/.codex/plugins/cache/personal/along-working-thread/0.1.0
```

Expected: no output.

- [ ] **Step 6: Commit cache-independent verification note only if needed**

No repo commit is needed for cache sync itself. If a verification note is added to docs during implementation, commit it explicitly:

```bash
git add <changed-doc-file>
git commit -m "docs: record navi rhythm map verification"
```

Expected: skip this step unless the implementer intentionally created a repo-tracked verification note.

---

### Task 5: Fresh-Session Calibration Handoff

**Files:**
- Review: `docs/superpowers/specs/2026-06-29-navi-rhythm-map-design.md`
- Review: `plugins/along-working-thread/README.md`

- [ ] **Step 1: Prepare calibration prompts**

Use these prompts in new, independent Codex threads after implementation is merged or installed:

```text
请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？
```

Run once in an internship-style project and once in a Hong Kong application-style project.

- [ ] **Step 2: Expected internship-style result**

Expected answer shape:

```text
项目节奏
[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]
                                      ▲
                                   当前焦点

当前主线
[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]
                     ▲
                  当前动作
```

The answer must explain that the project is flowing, name the next small loop, state that status changes require evidence, and avoid pretending the whole project is near "done".

- [ ] **Step 3: Expected Hong Kong application-style result**

Expected answer shape:

```text
项目节奏
[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]
                                ▲
                             当前焦点

当前主线
[HKUST 表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]
                       ▲
                    当前动作
```

The answer must explain that the whole project is flowing, but a bounded form-filling task may use a linear subtask strip. It must identify what the user must confirm before submission or outreach.

- [ ] **Step 4: Report calibration result**

Report:

```text
Intern project: Pass/Concern/Fail
HK application project: Pass/Concern/Fail
Did either thread reuse Navi's own test-project map? yes/no
Did either thread force a one-way overall progress bar for a flowing project? yes/no
Did the answer explain current focus, next small loop, waiting evidence, and user confirmation gate? yes/no
```

Expected: Pass only if both projects receive target-project Rhythm Maps or a clearly justified provisional Rhythm Map.

---

## Final Verification Checklist

Run these before claiming implementation complete:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
git diff --check
git status --short --branch
```

Expected:

- all skill tests pass;
- plugin package verification passes;
- source/package drift check passes;
- no whitespace errors;
- working tree status is clearly reported.

## Implementation Boundary

This plan intentionally does not implement runtime state, MCP behavior, UI components, bitmap progress graphics, background memory, or live LLM evaluation. The result is updated skill/reference/package documentation and fixture tests that guide future Codex sessions toward Rhythm Map behavior.
