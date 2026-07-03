# Navi Public Narrative System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Navi's public entry narrative with the approved public narrative system so external readers see Navi as an independent supervision product, understand current `main` versus latest tagged release, and do not need Along as prerequisite context.

**Architecture:** This is a docs and metadata narrative update. Add failing text assertions first, then update `README.md`, `README.zh-CN.md`, `package.json`, and plugin metadata descriptions. Keep release notes, GitHub Release bodies, runtime/UI, `src/web`, package ids, and npm/marketplace publication out of scope.

**Tech Stack:** Markdown public docs, JSON/YAML package metadata, Vitest text assertions, existing plugin package verification script.

---

## Navi-Specific Execution Boundary

Implementation must run in a true Codex worktree session, not in the main design session.

Start the implementation worktree from current `main` after:

```text
cba4241 docs: add navi public narrative design
```

If that commit has not been pushed yet, start from the local working tree or push first before creating the implementation worktree.

Do not tag, release, publish to npm, update GitHub Releases, modify `src/web`, modify release docs, modify external target projects, or migrate internal ids such as `along-working-thread`.

Allowed validation:

- `npm test -- tests/skills/along-working-thread-skill.test.ts`
- `npm run verify:plugin-package`
- `git diff --check`

Do not run the full test suite or typecheck unless a targeted failure shows this plan touched shared behavior beyond the approved files.

## File Structure

Modify these files:

- `tests/skills/along-working-thread-skill.test.ts`
  - Updates and extends existing text assertions for the public narrative in README and metadata.
- `README.md`
  - Aligns English public entry narrative with the approved system.
- `README.zh-CN.md`
  - Keeps Chinese public narrative synchronized in the same implementation pass.
- `package.json`
  - Updates the short package description only if needed to include the broader supervision behavior beyond maps and challenge.
- `.agents/skills/along-working-thread/agents/openai.yaml`
  - Updates plugin metadata short description to include supervision, pause/continue, stage/vision, and coordination without overstating runtime scope.
- `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`
  - Exact sync copy of the canonical agent metadata.

Do not modify:

- `docs/releases/**`
- GitHub Release bodies
- `src/web/**`
- MCP/server/runtime files
- `plugins/along-working-thread/.codex-plugin/plugin.json` unless a targeted test proves its current description conflicts with the narrative system
- package name, skill id, directory names, or CLI aliases
- external target projects

---

### Task 1: Add Failing Public Narrative Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Replace the root README narrative assertions**

In `tests/skills/along-working-thread-skill.test.ts`, find the test named `"documents the current Navi-first product narrative in the root README"` and replace its body with:

```ts
  it("documents the current Navi-first public narrative in the root README", async () => {
    const readme = await readRepoText("README.md");

    for (const expected of [
      "Navi helps non-expert users understand, supervise, and steer expert agents.",
      "Navi is an independent open-source product for supervising expert agents.",
      "Current main branch behavior includes Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance.",
      "Latest tagged GitHub source release:",
      "Current main branch:",
      "This alpha is a GitHub source package",
      "Codex skill/plugin behavior",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "npm run navi -- init --target /path/to/target-project",
      "Navi shows where the project is, what is missing, whether to continue, when to stop, how much validation is enough, and whether parallel work should wait or continue.",
      "Along is the parent/lab context and broader long-term product family.",
      "should be understandable without knowing Along",
      "Some internal ids, paths, and package directories still use `along-working-thread` for alpha compatibility.",
      "legacy/internal naming",
      "not the customer-facing product name",
      "MCP, runtime, local app, background presence",
      "older Along companion ideas",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi is Along's current V1 product surface",
      "Navi's V1 alpha behavior centers on **Progress/Rhythm Maps** and **Challenge Layer** behavior",
      "`0.1.0-alpha.3` is ready as the latest GitHub source release",
    ]) {
      expect(readme).not.toContain(forbidden);
    }

    const promiseIndex = readme.indexOf("Navi helps non-expert users understand, supervise, and steer expert agents.");
    const alongIndex = readme.indexOf("Along is the parent/lab context");
    const compatibilityIndex = readme.indexOf("Some internal ids, paths, and package directories still use `along-working-thread`");

    expect(promiseIndex).toBeGreaterThanOrEqual(0);
    expect(alongIndex).toBeGreaterThan(promiseIndex);
    expect(compatibilityIndex).toBeGreaterThan(alongIndex);
  });
```

- [ ] **Step 2: Add a README.zh-CN synchronization test**

Immediately after the root README narrative test, add:

```ts
  it("keeps the Chinese README aligned with the public narrative system", async () => {
    const readme = await readRepoText("README.zh-CN.md");

    for (const expected of [
      "Navi 帮助非专家用户理解、监督并引导 expert agents。",
      "Navi 是一个独立的开源产品，用于监督 expert agents。",
      "当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。",
      "最新 tagged GitHub source release：",
      "当前 main branch：",
      "这个 alpha 是 GitHub source package",
      "Codex skill/plugin 行为",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。",
      "Along 是 parent/lab context 和更长期的产品家族。",
      "不应该要求读者先理解 Along 才能理解 Navi",
      "一些内部 id、路径和 package directory 仍会因为 alpha compatibility 使用 `along-working-thread`。",
      "legacy/internal naming",
      "不是面向用户的产品名",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi 是这个愿景中的第一个独立 V1 产品表面。",
      "`0.1.0-alpha.3` 是当前面向开发者和早期测试者的最新 GitHub source release。",
    ]) {
      expect(readme).not.toContain(forbidden);
    }
  });
```

- [ ] **Step 3: Add metadata narrative assertions**

In the existing test named `"documents Navi entry routing in agent metadata without forcing ordinary requests"`, add these expectations after the existing `expect(agentMetadata).toContain("Navi Progress Maps");` line:

```ts
    expect(agentMetadata).toContain("supervision");
    expect(agentMetadata).toContain("pause/continue");
    expect(agentMetadata).toContain("stage/vision");
    expect(agentMetadata).toContain("coordination");
```

Add this new test after the agent metadata routing test:

```ts
  it("keeps package metadata aligned with Navi public narrative", async () => {
    const packageJson = JSON.parse(await readRepoText("package.json")) as {
      description: string;
      private: boolean;
    };
    const canonicalMetadata = await readRepoText(".agents/skills/along-working-thread/agents/openai.yaml");
    const pluginMetadata = await readRepoText("plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml");

    expect(packageJson.private).toBe(true);
    expect(packageJson.description).toContain("Navi helps non-expert users understand, supervise, and steer expert agents");
    expect(packageJson.description).toContain("maps, challenge, pause, stage/vision, and coordination guidance");

    for (const metadata of [canonicalMetadata, pluginMetadata]) {
      expect(metadata).toContain("display_name: Navi");
      expect(metadata).toContain("Navi supervision");
      expect(metadata).toContain("Progress/Rhythm Maps");
      expect(metadata).toContain("pause/continue");
      expect(metadata).toContain("stage/vision");
      expect(metadata).toContain("coordination");
      expect(metadata).toContain("ordinary clear execution requests stay quiet");
    }
  });
```

- [ ] **Step 4: Run the targeted test to confirm RED**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL. The first failure should mention a missing public narrative string such as `Current main branch behavior includes Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance.` or missing metadata strings.

Do not commit failing tests yet.

---

### Task 2: Update README.md Public Narrative

**Files:**

- Modify: `README.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Replace the first-page product narrative**

In `README.md`, replace the two paragraphs after the preview image:

```markdown
Navi is an independent open-source product and the first V1 product surface from the broader Along vision. Along is the long-term companion-layer vision; Navi is the current alpha product you can inspect, install, and test today.

This repository is the canonical open-source alpha home for Navi. Navi's V1 alpha behavior centers on **Progress/Rhythm Maps** and **Challenge Layer** behavior inside active Codex sessions: it explains where a target project stands, what is missing, what comes next, what the user needs to confirm, and when expert-agent momentum needs a lightweight challenge.
```

with:

```markdown
Navi is an independent open-source product for supervising expert agents. It is the current alpha product you can inspect, install, and test today.

This repository is the canonical open-source alpha home for Navi. Current main branch behavior includes Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance. Navi shows where the project is, what is missing, whether to continue, when to stop, how much validation is enough, and whether parallel work should wait or continue.
```

- [ ] **Step 2: Replace the Alpha Status section**

In `README.md`, replace the first sentence under `## Alpha Status`:

```markdown
`0.1.0-alpha.3` is ready as the latest GitHub source release for developers and early testers.
```

with:

```markdown
Latest tagged GitHub source release: `0.1.0-alpha.3`.

Current main branch: includes post-release docs-backed supervision updates through alpha.7 Coordination Layer guidance. These main-branch changes are not a new tagged release unless a later release is explicitly prepared.
```

- [ ] **Step 3: Update the stable/current behavior bullets**

In the `What is stable in this alpha:` list, replace:

```markdown
- Challenge Layer behavior for anti-self-certification moments.
- Prompt-language following for Navi maps in multilingual target projects.
- Working Thread continuity for project judgment that needs durable carry-forward.
- Project-local Navi initialization through `navi init`, `AGENTS.md`, and `docs/along/project-maps/`.
- Codex skill/plugin behavior with project-local docs.
```

with:

```markdown
- Challenge Layer behavior for anti-self-certification moments.
- Pause semantics for continue/stop boundaries and meaningful decision points.
- Stage/vision supervision for product stage, work mode, and distance from the original goal.
- Coordination guidance for worktrees, review/merge timing, external waits, and non-conflicting main-session work.
- Prompt-language following for Navi maps in multilingual target projects.
- Working Thread continuity for project judgment that needs durable carry-forward.
- Project-local Navi initialization through `navi init`, `AGENTS.md`, and `docs/along/project-maps/`.
- Codex skill/plugin behavior with project-local docs.
- Source package verification through `npm run verify:plugin-package`.
```

- [ ] **Step 4: Replace the Relationship To Along section**

In `README.md`, replace the whole `## Relationship To Along` section body with:

```markdown
Along is the parent/lab context and broader long-term product family. Navi is an independent product surface from that work and should be understandable without knowing Along.

Use Along to understand origin and future-family context. Use Navi to understand the current alpha product, setup path, and supervision behavior.
```

- [ ] **Step 5: Replace the repeated compatibility note**

In `README.md`, under `## Current V1 shape`, replace:

```markdown
The internal package id remains `along-working-thread` for compatibility with existing skill paths, local installs, and tests. The customer-facing product name is Navi.
```

with:

```markdown
Some internal ids, paths, and package directories still use `along-working-thread` for alpha compatibility. Treat that as legacy/internal naming, not the customer-facing product name.
```

- [ ] **Step 6: Keep release docs untouched and run the targeted test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL if README.zh-CN or metadata strings are still missing. The root README narrative assertions should now pass.

---

### Task 3: Update README.zh-CN In The Same Pass

**Files:**

- Modify: `README.zh-CN.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Replace the first-page Chinese product narrative**

In `README.zh-CN.md`, replace the two paragraphs after the preview image:

```markdown
Navi 是一个独立的开源产品，也是更大的 Along 愿景中的第一个 V1 产品表面。Along 是长期的 companion-layer 愿景；Navi 是当前可以检查、安装和测试的 alpha 产品。

这个仓库是 Navi canonical 的开源 alpha 主页。Navi 的 V1 alpha 行为集中在活跃 Codex 会话中的 **Progress/Rhythm Maps** 和 **Challenge Layer**：它会解释目标项目现在处于哪里、还缺什么、下一步是什么、用户需要确认什么，以及 expert-agent 的推进什么时候需要轻量挑战。
```

with:

```markdown
Navi 是一个独立的开源产品，用于监督 expert agents。它是当前可以检查、安装和测试的 alpha 产品。

这个仓库是 Navi canonical 的开源 alpha 主页。当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。
```

- [ ] **Step 2: Replace the Chinese Alpha Status opening**

In `README.zh-CN.md`, replace the first sentence under `## Alpha 状态`:

```markdown
`0.1.0-alpha.3` 是当前面向开发者和早期测试者的最新 GitHub source release。
```

with:

```markdown
最新 tagged GitHub source release：`0.1.0-alpha.3`。

当前 main branch：包含到 alpha.7 Coordination Layer guidance 为止的 post-release docs-backed supervision updates。除非后续明确准备新的 release，否则这些 main branch 变化还不是新的 tagged release。
```

- [ ] **Step 3: Update the Chinese stable/current behavior bullets**

In `README.zh-CN.md`, under `这个 alpha 中稳定的内容：`, replace:

```markdown
- Challenge Layer：用于 anti-self-certification moment。
- 多语言目标项目中的 Navi map prompt-language following。
- Working Thread continuity：用于需要 durable carry-forward 的项目判断。
- 通过 `navi init`、`AGENTS.md` 和 `docs/along/project-maps/` 做 project-local Navi 初始化。
- 搭配 project-local docs 的 Codex skill/plugin 行为。
```

with:

```markdown
- Challenge Layer：用于 anti-self-certification moment。
- Pause semantics：用于 continue/stop 边界和真正有意义的 decision point。
- Stage/vision supervision：用于判断 product stage、work mode，以及距离原始目标还有多远。
- Coordination guidance：用于 worktree、review/merge timing、external waits，以及 non-conflicting main-session work。
- 多语言目标项目中的 Navi map prompt-language following。
- Working Thread continuity：用于需要 durable carry-forward 的项目判断。
- 通过 `navi init`、`AGENTS.md` 和 `docs/along/project-maps/` 做 project-local Navi 初始化。
- 搭配 project-local docs 的 Codex skill/plugin 行为。
- 通过 `npm run verify:plugin-package` 做 source package verification。
```

- [ ] **Step 4: Replace the Chinese Relationship To Along section**

In `README.zh-CN.md`, replace the body under `## Navi 和 Along 的关系` with:

```markdown
Along 是 parent/lab context 和更长期的产品家族。Navi 是从这条线中独立出来的产品 surface，不应该要求读者先理解 Along 才能理解 Navi。

如果要理解来源和未来产品家族，可以看 Along。如果要理解当前 alpha 产品、setup path 和 supervision behavior，应先看 Navi。
```

- [ ] **Step 5: Replace the repeated Chinese compatibility note**

In `README.zh-CN.md`, under `## 当前 V1 形态`, replace:

```markdown
内部 package id 仍是 `along-working-thread`，以兼容现有 skill paths、local installs 和 tests。面向用户的产品名是 Navi。
```

with:

```markdown
一些内部 id、路径和 package directory 仍会因为 alpha compatibility 使用 `along-working-thread`。请把它视为 legacy/internal naming，不是面向用户的产品名。
```

- [ ] **Step 6: Run the targeted test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL if metadata strings are still missing. README and README.zh-CN public narrative assertions should now pass.

---

### Task 4: Update Package And Plugin Metadata

**Files:**

- Modify: `package.json`
- Modify: `.agents/skills/along-working-thread/agents/openai.yaml`
- Modify: `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`
- Test: `tests/skills/along-working-thread-skill.test.ts`
- Verify: `npm run verify:plugin-package`

- [ ] **Step 1: Update `package.json` description**

In `package.json`, replace:

```json
"description": "Navi helps non-expert users understand, supervise, and steer expert agents with Progress Maps and Challenge Layer behavior.",
```

with:

```json
"description": "Navi helps non-expert users understand, supervise, and steer expert agents with maps, challenge, pause, stage/vision, and coordination guidance.",
```

- [ ] **Step 2: Update canonical plugin metadata**

In `.agents/skills/along-working-thread/agents/openai.yaml`, replace:

```yaml
  short_description: Use for Navi Progress Maps, Rhythm Maps, or Challenge Briefs when users ask progress, next-step, confusion, continue, or plan-reliability questions.
```

with:

```yaml
  short_description: Use for Navi supervision with Progress/Rhythm Maps, Challenge Briefs, pause/continue guidance, stage/vision orientation, and coordination when users ask progress, next-step, confusion, continue, wait, or plan-reliability questions.
```

Leave `display_name: Navi`, `default_prompt`, and `allow_implicit_invocation` unchanged.

- [ ] **Step 3: Sync plugin metadata copy**

Copy the canonical metadata file to the packaged plugin copy:

```bash
cp .agents/skills/along-working-thread/agents/openai.yaml plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. If this fails because plugin package verification also checks `package.json` or plugin manifest wording, inspect the failure and keep changes limited to public narrative metadata. Do not change plugin ids or package ids.

---

### Task 5: Final Verification And Commit

**Files:**

- Verify all modified files from Tasks 1-4.

- [ ] **Step 1: Run targeted README/metadata tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
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

- [ ] **Step 4: Inspect final diff surface**

Run:

```bash
git diff --stat
git diff -- README.md README.zh-CN.md package.json .agents/skills/along-working-thread/agents/openai.yaml plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml tests/skills/along-working-thread-skill.test.ts
```

Expected:

- Only the approved public narrative files and tests are changed.
- No release notes, GitHub Release bodies, `src/web`, runtime/MCP, package ids, skill ids, external projects, or publication files are changed.
- README.md and README.zh-CN.md both contain the new public narrative.
- `main` versus latest tagged release wording is explicit.

- [ ] **Step 5: Commit**

Run:

```bash
git add README.md README.zh-CN.md package.json .agents/skills/along-working-thread/agents/openai.yaml plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: align navi public narrative"
```

Do not push, tag, release, update GitHub Release bodies, publish to npm, or create a marketplace package in this implementation pass.

## Post-Implementation Main-Session Review

After the true worktree session completes, the main session should review:

- Check `git show --stat` for the worktree commit.
- Confirm the changed files match the implementation surface above.
- Confirm `README.md` and `README.zh-CN.md` are updated together.
- Confirm release notes and GitHub Release bodies were not changed.
- Confirm `src/web`, runtime/MCP files, external target projects, package ids, and skill ids were not changed.
- Confirm targeted tests, `npm run verify:plugin-package`, and `git diff --check` passed.
- Decide whether to merge into main, request follow-up, or defer review.

Do not convert this into Release mode without a separate explicit release decision.
