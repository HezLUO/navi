# Navi Alpha 13 Project Initialization And Suggested Map Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add alpha.13 project-initialization clarity and a read-only `navi init --suggest-map` preview so target projects can understand that Navi is installed globally once and initialized per project for reliable fresh-session behavior.

**Architecture:** Keep this in the existing docs-backed `navi init` surface. Extend `src/cli/navi-init.ts` with `suggestMap` options, deterministic evidence discovery, conservative shape hints, and preview rendering; keep writes limited to the existing AGENTS/project-map initialization flow. Update project-local docs and minimal global skill wording only enough to clarify global install vs project initialization, then sync package copies when canonical skill files change.

**Tech Stack:** TypeScript, Node.js `fs/promises`, Vitest, Markdown docs, existing plugin package verifier.

## Global Constraints

- This is Implementation mode for alpha.13 Project Integration, not Release mode.
- Do not enter Release mode, tag, create GitHub Releases, update GitHub Release bodies, publish npm packages, or do marketplace work.
- Do not touch `src/web`, MCP runtime/server behavior, local app behavior, telemetry, background automation, Memory v2, agent adapters, delegation, or write delegation.
- Do not update README or release notes unless a later Release-mode decision explicitly requires it.
- Do not modify external target projects.
- Preserve existing package id, skill id, CLI alias, and `along-working-thread` compatibility names.
- `navi init` must be described as project initialization, not installing Navi again.
- `--suggest-map` must be read-only and must never write the suggested map automatically, even when combined with `--write`.
- `--write` controls only durable project-local initialization.
- Suggested maps are previews, not confirmed Project Maps or Rhythm Maps.
- Do not call a model, read other Codex threads, or rely on source-thread history.
- Use targeted validation: `npm test -- tests/cli/navi-init.test.ts`, `npm test -- tests/skills/along-working-thread-skill.test.ts` if skill docs change, `npm run verify:plugin-package` if package copies change, and `git diff --check`.

---

## File Structure

- Modify `src/cli/navi-init.ts`: add `--suggest-map`, product-model output, read-only evidence discovery, shape hint calculation, and preview rendering.
- Modify `tests/cli/navi-init.test.ts`: add targeted fixture tests for project-initialization wording, `--suggest-map`, linear/flowing/unclear hints, and `--suggest-map --write` separation.
- Modify `docs/along/project-maps/navi-project-trigger-template.md`: clarify initialized-project behavior and global/project-local boundary.
- Modify `docs/along/project-maps/navi-project-init.md`: document `--suggest-map`, global install vs project initialization, and suggestion write boundary.
- Modify `.agents/skills/along-working-thread/SKILL.md`: add minimal global skill wording about global install vs project initialization.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`: add minimal reference wording for global-only vs initialized project behavior.
- Modify `plugins/along-working-thread/skills/along-working-thread/SKILL.md`: exact copy of canonical skill after changes.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`: exact copy of canonical reference after changes.
- Modify `tests/skills/along-working-thread-skill.test.ts`: add assertions for minimal global skill/reference boundary wording.

## Task 1: Add Failing CLI Tests For Initialization Clarity And `--suggest-map`

**Files:**
- Modify: `tests/cli/navi-init.test.ts`
- Test: `tests/cli/navi-init.test.ts`

**Interfaces:**
- Consumes: existing `makeProject()`, `exists()`, `buildInitPlan()`, `applyInitPlan()`, `renderInitPlan()`, `parseInitArgs()`, and `runNaviInitCli()`.
- Produces: failing tests that define `suggestMap?: boolean`, read-only preview output, and the non-duplicate-install wording.

- [ ] **Step 1: Add initialization wording assertions to existing dry-run and write tests**

In `tests/cli/navi-init.test.ts`, update the dry-run test `defaults to dry-run and does not write target files` by adding:

```ts
    expect(output).toContain("This does not install Navi again.");
    expect(output).toContain("It adds project-local guidance and a starter map for this project.");
```

Update the write test `writes AGENTS.md and a provisional project map only behind --write` by adding:

```ts
    const output = renderInitPlan(plan);
    expect(output).toContain("Navi init applied");
    expect(output).toContain("This does not install Navi again.");
    expect(output).toContain("It adds project-local guidance and a starter map for this project.");
```

- [ ] **Step 2: Add `--suggest-map` argument parsing test**

In the `describe("navi init CLI helpers", () => { ... })` block, update `parses target and write flags` into:

```ts
  it("parses target, write, and suggest-map flags", () => {
    expect(parseInitArgs(["--target", "/tmp/demo", "--write", "--suggest-map"], "/tmp/fallback")).toEqual({
      targetDir: "/tmp/demo",
      write: true,
      suggestMap: true,
    });
  });
```

- [ ] **Step 3: Add read-only `--suggest-map` CLI test**

Add this test after `renders dry-run output through the CLI runner without writing files`:

```ts
  it("renders a suggested map preview without writing files", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "README.md"),
      "# Demo Product\n\nThis project has a design plan, implementation work, tests, and release preparation.\n",
    );
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--target", project, "--suggest-map"], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    const output = stdout.join("");
    expect(code).toBe(0);
    expect(stderr.join("")).toBe("");
    expect(output).toContain("Navi suggested project map preview");
    expect(output).toContain("No files were changed.");
    expect(output).toContain("Evidence read:");
    expect(output).toContain("README.md");
    expect(output).toContain("Project shape hint: linear");
    expect(output).toContain("Project progress");
    expect(output).toContain("Needs confirmation before becoming a stable map.");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
    expect(await exists(path.join(project, "docs/along/project-maps/navi-project-map.md"))).toBe(false);
  });
```

- [ ] **Step 4: Add flowing fixture test**

Add this test after the linear read-only preview test:

```ts
  it("renders a flowing Rhythm Map preview for recurring workflow evidence", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "PROJECT_STATE.md"),
      "# Application Workflow\n\nCurrent state: weekly screening, waiting for feedback, follow-up cycles, and refreshed outreach records.\n",
    );
    await fs.writeFile(
      path.join(project, "STATUS.md"),
      "# Status\n\nThe project tracks application waiting states and feedback follow-up.\n",
    );

    const output = renderInitPlan(await buildInitPlan({ targetDir: project, write: false, suggestMap: true }));

    expect(output).toContain("Navi suggested project map preview");
    expect(output).toContain("Project shape hint: flowing");
    expect(output).toContain("Project rhythm");
    expect(output).toContain("Current track");
    expect(output).toContain("Evidence read:");
    expect(output).toContain("PROJECT_STATE.md");
    expect(output).toContain("STATUS.md");
    expect(output).not.toContain("Map status: confirmed");
  });
```

- [ ] **Step 5: Add unclear fixture test**

Add this test after the flowing preview test:

```ts
  it("does not render a concrete map when evidence is unclear", async () => {
    const project = await makeProject();

    const output = renderInitPlan(await buildInitPlan({ targetDir: project, write: false, suggestMap: true }));

    expect(output).toContain("Navi suggested project map preview");
    expect(output).toContain("Project shape hint: unclear");
    expect(output).toContain("Not enough evidence for a reliable map preview.");
    expect(output).toContain("Then rerun navi init --suggest-map.");
    expect(output).not.toContain("Project progress");
    expect(output).not.toContain("Project rhythm");
  });
```

- [ ] **Step 6: Add `--suggest-map --write` separation test**

Add this test after the unclear fixture test:

```ts
  it("combines suggest-map and write without writing the suggested map", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "README.md"),
      "# Delivery Project\n\nA one-time deliverable with plan, implementation, validation, and release notes.\n",
    );

    const plan = await buildInitPlan({ targetDir: project, write: true, suggestMap: true });
    const output = renderInitPlan(plan);
    await applyInitPlan(plan);

    const map = await fs.readFile(path.join(project, "docs/along/project-maps/navi-project-map.md"), "utf8");

    expect(output).toContain("Navi init applied");
    expect(output).toContain("Navi suggested project map preview");
    expect(output).toContain("Suggested map was not written.");
    expect(output).toContain("Project shape hint: linear");
    expect(map).toContain("Map status: provisional");
    expect(map).toContain("Project shape: unclear");
    expect(map).not.toContain("Project progress");
    expect(map).not.toContain("Map status: confirmed");
  });
```

- [ ] **Step 7: Run targeted CLI tests and confirm failure**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because `suggestMap` is not yet part of `InitOptions`, `parseInitArgs()`, `buildInitPlan()`, or `renderInitPlan()`.

## Task 2: Implement CLI Product Model, Option Parsing, And Preview Data Types

**Files:**
- Modify: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

**Interfaces:**
- Consumes: failing tests from Task 1.
- Produces:
  - `InitOptions.suggestMap?: boolean`
  - `parseInitArgs()` returns `{ targetDir, write, suggestMap }`
  - `InitPlan.suggestedMapPreview?: SuggestedMapPreview`
  - `buildInitPlan()` attaches a preview when requested
  - `renderInitPlan()` includes project-initialization wording and preview output

- [ ] **Step 1: Add preview types**

In `src/cli/navi-init.ts`, after `export interface InitAction { ... }`, add:

```ts
export type ProjectShapeHint = "linear" | "flowing" | "mixed" | "unclear";
export type SuggestionConfidence = "high" | "medium" | "low";

export interface EvidenceSnippet {
  relativePath: string;
  text: string;
}

export interface SuggestedMapPreview {
  evidenceRead: string[];
  shape: ProjectShapeHint;
  confidence: SuggestionConfidence;
  suggestedView?: "Project Map" | "Rhythm Map";
  mapText?: string;
  why: string[];
  uncertainOrMissing: string[];
}
```

- [ ] **Step 2: Extend options and plan interfaces**

Change the `InitPlan` and `InitOptions` interfaces to:

```ts
export interface InitPlan {
  mode: "dry-run" | "write";
  targetDir: string;
  actions: InitAction[];
  validationPrompt: string;
  suggestedMapPreview?: SuggestedMapPreview;
}

export interface InitOptions {
  targetDir?: string;
  write?: boolean;
  suggestMap?: boolean;
}
```

- [ ] **Step 3: Parse `--suggest-map`**

Change the `parsed` object in `parseInitArgs()` to include `suggestMap: false`, and add this branch before the unknown-option error:

```ts
    if (arg === "--suggest-map") {
      parsed.suggestMap = true;
      continue;
    }
```

Update the usage line in `runNaviInitCli()` to:

```ts
    io.stderr("Usage: navi init [--target <path>] [--write] [--suggest-map]\n");
```

- [ ] **Step 4: Attach preview in `buildInitPlan()`**

Change the return from `buildInitPlan()` to:

```ts
  const suggestedMapPreview = options.suggestMap ? await suggestProjectMap(targetDir) : undefined;

  return {
    mode: options.write ? "write" : "dry-run",
    targetDir,
    actions,
    validationPrompt: VALIDATION_PROMPT,
    suggestedMapPreview,
  };
```

This references `suggestProjectMap()` before it exists; Task 3 implements it.

- [ ] **Step 5: Add product-model wording in `renderInitPlan()`**

After `lines.push(\`Target: ${plan.targetDir}\`);`, add:

```ts
  lines.push("This does not install Navi again.");
  lines.push("It adds project-local guidance and a starter map for this project.");
```

After the write/no-write summary block and before the fresh-session validation prompt, add:

```ts
  if (plan.suggestedMapPreview) {
    lines.push("");
    lines.push(renderSuggestedMapPreview(plan.suggestedMapPreview, plan.mode));
  }
```

This references `renderSuggestedMapPreview()` before it exists; Task 3 implements it.

## Task 3: Implement Read-Only Evidence Discovery And Suggested Preview Rendering

**Files:**
- Modify: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

**Interfaces:**
- Consumes: types and references from Task 2.
- Produces:
  - `suggestProjectMap(targetDir: string): Promise<SuggestedMapPreview>`
  - `renderSuggestedMapPreview(preview: SuggestedMapPreview, mode: InitPlan["mode"]): string`

- [ ] **Step 1: Add evidence limits and ignored directories**

Near the existing `const AGENTS_RELATIVE_PATH = ...` declarations, add:

```ts
const EVIDENCE_SNIPPET_BYTES = 12 * 1024;
const EVIDENCE_TOTAL_BYTES = 160 * 1024;
const IGNORED_EVIDENCE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
]);
```

- [ ] **Step 2: Add candidate evidence discovery**

Add these functions before `listExistingProjectMaps()`:

```ts
async function suggestProjectMap(targetDir: string): Promise<SuggestedMapPreview> {
  const snippets = await collectEvidenceSnippets(targetDir);
  return buildSuggestedMapPreview(snippets);
}

async function collectEvidenceSnippets(targetDir: string): Promise<EvidenceSnippet[]> {
  const snippets: EvidenceSnippet[] = [];
  let remainingBytes = EVIDENCE_TOTAL_BYTES;

  for (const relativePath of await listEvidenceCandidateFiles(targetDir)) {
    if (remainingBytes <= 0) {
      break;
    }

    const absolutePath = resolveTargetPath(targetDir, relativePath);
    const raw = await fs.readFile(absolutePath, "utf8");
    const text = raw.slice(0, Math.min(EVIDENCE_SNIPPET_BYTES, remainingBytes));
    remainingBytes -= Buffer.byteLength(text, "utf8");
    snippets.push({ relativePath, text });
  }

  return snippets;
}

async function listEvidenceCandidateFiles(targetDir: string): Promise<string[]> {
  const candidates: string[] = [];
  await collectEvidenceCandidateFiles(targetDir, ".", candidates);
  return candidates.sort((left, right) => evidencePriority(left) - evidencePriority(right) || left.localeCompare(right));
}

async function collectEvidenceCandidateFiles(
  targetDir: string,
  relativeDir: string,
  candidates: string[],
): Promise<void> {
  const absoluteDir = relativeDir === "." ? targetDir : resolveTargetPath(targetDir, relativeDir);
  let entries;
  try {
    entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    const relativePath = relativeDir === "." ? entry.name : path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_EVIDENCE_DIRS.has(entry.name)) {
        await collectEvidenceCandidateFiles(targetDir, relativePath, candidates);
      }
      continue;
    }

    if (entry.isFile() && isEvidenceCandidate(relativePath)) {
      candidates.push(relativePath);
    }
  }
}
```

- [ ] **Step 3: Add candidate matching and priority**

Add these helpers after `collectEvidenceCandidateFiles()`:

```ts
function isEvidenceCandidate(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  const basename = path.posix.basename(normalized);
  const lowerPath = normalized.toLowerCase();
  const lowerBase = basename.toLowerCase();

  if (
    lowerBase.endsWith(".lock") ||
    lowerBase.endsWith(".png") ||
    lowerBase.endsWith(".jpg") ||
    lowerBase.endsWith(".jpeg") ||
    lowerBase.endsWith(".gif") ||
    lowerBase.endsWith(".pdf") ||
    lowerBase.endsWith(".zip")
  ) {
    return false;
  }

  return (
    lowerBase.startsWith("readme") ||
    lowerBase === "agents.md" ||
    lowerBase === "project_state.md" ||
    lowerBase.startsWith("todo") ||
    lowerBase.startsWith("status") ||
    lowerBase === "package.json" ||
    lowerBase === "pyproject.toml" ||
    lowerPath.startsWith("docs/along/project-maps/") && lowerBase.endsWith(".md") ||
    lowerPath.includes("/handoff") && lowerBase.endsWith(".md") ||
    lowerPath.includes("/workflow") && lowerBase.endsWith(".md") ||
    lowerPath.includes("/plan") && lowerBase.endsWith(".md")
  );
}

function evidencePriority(relativePath: string): number {
  const lower = relativePath.toLowerCase();
  if (lower === "agents.md") return 0;
  if (lower.startsWith("docs/along/project-maps/")) return 1;
  if (lower === "project_state.md") return 2;
  if (lower.startsWith("readme")) return 3;
  if (lower.startsWith("todo") || lower.startsWith("status")) return 4;
  if (lower.includes("/workflow") || lower.includes("/handoff") || lower.includes("/plan")) return 5;
  if (lower === "package.json" || lower === "pyproject.toml") return 6;
  return 99;
}
```

- [ ] **Step 4: Add conservative shape scoring**

Add these helpers after `evidencePriority()`:

```ts
function buildSuggestedMapPreview(snippets: EvidenceSnippet[]): SuggestedMapPreview {
  const combined = snippets.map((snippet) => `${snippet.relativePath}\n${snippet.text}`).join("\n").toLowerCase();
  const evidenceRead = snippets.map((snippet) => snippet.relativePath);
  const flowingScore = scoreSignals(combined, [
    "application",
    "internship",
    "recruiting",
    "outreach",
    "research",
    "operations",
    "waiting",
    "follow-up",
    "feedback",
    "screening",
    "refresh",
    "cycle",
    "workflow",
    "handoff",
  ]);
  const linearScore = scoreSignals(combined, [
    "milestone",
    "spec",
    "design",
    "implementation",
    "validation",
    "release",
    "deliverable",
    "build",
    "test",
    "package.json",
  ]);

  if (snippets.length === 0 || (flowingScore < 2 && linearScore < 2)) {
    return {
      evidenceRead,
      shape: "unclear",
      confidence: "low",
      why: ["Not enough project evidence was found for a reliable shape hint."],
      uncertainOrMissing: ["Add or confirm PROJECT_STATE.md, README, task/status files, or a project map."],
    };
  }

  if (flowingScore >= 2 && linearScore >= 2) {
    return {
      evidenceRead,
      shape: "mixed",
      confidence: "medium",
      suggestedView: "Rhythm Map",
      mapText: renderFlowingPreviewMap(),
      why: ["Found both recurring workflow signals and bounded delivery signals."],
      uncertainOrMissing: ["Confirm whether Navi should orient this project as a recurring workflow or a bounded delivery."],
    };
  }

  if (flowingScore > linearScore) {
    return {
      evidenceRead,
      shape: "flowing",
      confidence: flowingScore >= 4 ? "high" : "medium",
      suggestedView: "Rhythm Map",
      mapText: renderFlowingPreviewMap(),
      why: ["Found recurring workflow, waiting, feedback, or follow-up signals."],
      uncertainOrMissing: ["Confirm the rhythm labels before treating this as a stable map."],
    };
  }

  return {
    evidenceRead,
    shape: "linear",
    confidence: linearScore >= 4 ? "high" : "medium",
    suggestedView: "Project Map",
    mapText: renderLinearPreviewMap(),
    why: ["Found bounded delivery, implementation, validation, build, or release signals."],
    uncertainOrMissing: ["Confirm the stage labels before treating this as a stable map."],
  };
}

function scoreSignals(text: string, signals: string[]): number {
  return signals.reduce((score, signal) => score + (text.includes(signal) ? 1 : 0), 0);
}
```

- [ ] **Step 5: Add preview map renderers**

Add:

```ts
function renderLinearPreviewMap(): string {
  return `Project progress
[Goal] -> [Design/plan] -> [Implementation] -> [Validation] -> [Delivery]
                         ^
                    Current position`;
}

function renderFlowingPreviewMap(): string {
  return `Project rhythm
[Cycle/source refresh] + [Screening/selection] + [Preparation/execution] + [Follow-up/feedback]
                                      ^
                                  Current focus

Current track
[Read records] -> [Choose small loop] -> [Execute] -> [Record/wait]`;
}
```

- [ ] **Step 6: Add preview output renderer**

Add:

```ts
function renderSuggestedMapPreview(preview: SuggestedMapPreview, mode: InitPlan["mode"]): string {
  const lines: string[] = [];
  lines.push("Navi suggested project map preview");
  lines.push(mode === "write" ? "Suggested map was not written." : "No files were changed.");
  lines.push("");
  lines.push("Evidence read:");
  if (preview.evidenceRead.length === 0) {
    lines.push("- none");
  } else {
    for (const evidence of preview.evidenceRead) {
      lines.push(`- ${evidence}`);
    }
  }
  lines.push("");
  lines.push(`Project shape hint: ${preview.shape} (${preview.confidence} confidence)`);
  lines.push("Needs confirmation before becoming a stable map.");
  lines.push("");

  if (preview.mapText && preview.confidence !== "low") {
    lines.push("Suggested map:");
    lines.push("```text");
    lines.push(preview.mapText);
    lines.push("```");
    lines.push("");
  } else {
    lines.push("Not enough evidence for a reliable map preview.");
    lines.push("");
  }

  lines.push("Why this map:");
  for (const reason of preview.why) {
    lines.push(`- ${reason}`);
  }
  lines.push("");
  lines.push("Uncertain or missing:");
  for (const missing of preview.uncertainOrMissing) {
    lines.push(`- ${missing}`);
  }
  lines.push("");
  lines.push("Next step:");
  lines.push("- Run navi init --target . --write to add project-local guidance and a starter map.");
  lines.push("- Review or edit the suggested map before treating it as stable.");
  if (preview.shape === "unclear" || preview.confidence === "low") {
    lines.push("- Then rerun navi init --suggest-map.");
  }

  return lines.join("\n");
}
```

- [ ] **Step 7: Run targeted CLI tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit CLI implementation**

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts
git commit -m "feat: add navi suggested map preview"
```

Expected: commit succeeds with only the listed files.

## Task 4: Update Project-Local Docs And Minimal Global Skill Boundary

**Files:**
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: alpha.13 product model from the spec.
- Produces: docs and global skill wording that distinguish global install from project initialization without adding full `--suggest-map` rules to User Supervision.

- [ ] **Step 1: Add failing skill/reference test**

In `tests/skills/along-working-thread-skill.test.ts`, add this test after the alpha.12 test:

```ts
  it("documents alpha 13 global install versus project initialization boundary", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const initDoc = await readRepoText("docs/along/project-maps/navi-project-init.md");

    for (const expected of [
      "Navi is installed globally once",
      "navi init initializes a target project",
      "does not install Navi again",
      "project-local initialization is the reliable path",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
      expect(initDoc).toContain(expected);
    }

    expect(skill).not.toContain("navi init --suggest-map --accept-suggested-map");
  });
```

- [ ] **Step 2: Run skill test and confirm failure**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because the alpha.13 boundary wording is not yet present.

- [ ] **Step 3: Update canonical skill with minimal boundary wording**

In `.agents/skills/along-working-thread/SKILL.md`, add this bullet block after the `Navi Project Map` / source priority bullets and before the Progress/Rhythm rendering bullets:

```markdown
- Navi is installed globally once; `navi init` initializes a target project for reliable fresh-session behavior and does not install Navi again.
- Global-only Navi can provide best-effort supervision, but project-local initialization is the reliable path for project evidence, trigger behavior, and starter maps.
- If a broad progress or next-step prompt appears in a project that lacks project-local Navi guidance, avoid a confident stable map; recommend `navi init` as project configuration and offer only a provisional judgment if the user wants to continue without initialization.
```

- [ ] **Step 4: Update canonical reference with minimal boundary wording**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, inside `### Navi Project Initialization`, add this paragraph after the opening paragraph:

```markdown
Navi is installed globally once. `navi init` initializes a target project for reliable fresh-session behavior and does not install Navi again. Global-only Navi can provide best-effort supervision, but project-local initialization is the reliable path for project evidence, trigger behavior, and starter maps.
```

Add this paragraph before `Do not use navi init as a global Codex plugin or skill installer.`:

```markdown
If a broad progress or next-step prompt appears in a project that lacks project-local Navi guidance, avoid a confident stable map. Recommend `navi init` as project configuration and offer only a provisional judgment if the user wants to continue without initialization.
```

- [ ] **Step 5: Update project init docs**

In `docs/along/project-maps/navi-project-init.md`, after the first paragraph, add:

```markdown
Navi is installed globally once. `navi init` initializes a target project for reliable fresh-session behavior and does not install Navi again.

In product terms:

```text
global install = enables the Navi skill/plugin capability
navi init      = adds project-local guidance and a starter map for this project
```
```

Add a new section before `## Boundaries`:

```markdown
## Suggested Map Preview

`navi init --suggest-map` performs read-only evidence discovery and prints a suggested Project Map or Rhythm Map preview.

It does not write the suggestion to disk, does not mark the map as confirmed, does not call a model, and does not read other Codex threads or source-thread history.

`--suggest-map` and `--write` may be combined. In that case, `--write` applies only the standard project-local initialization files, while the suggested map remains terminal output only.
```

- [ ] **Step 6: Update project trigger template**

In `docs/along/project-maps/navi-project-trigger-template.md`, add this paragraph after the opening trigger examples and before language-following:

```markdown
Navi is installed globally once. This project-local block exists because `navi init` initializes this project for reliable fresh-session behavior; it does not install Navi again. Use project-local records before drawing a stable map, and keep starter maps provisional until the user confirms them.
```

- [ ] **Step 7: Sync packaged skill copies**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: no output.

- [ ] **Step 8: Run targeted skill tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit docs and skill boundary updates**

```bash
git add docs/along/project-maps/navi-project-trigger-template.md docs/along/project-maps/navi-project-init.md .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: clarify navi project initialization boundary"
```

Expected: commit succeeds with only the listed files.

## Task 5: Final Targeted Validation And Review Report

**Files:**
- Reads: all modified files
- Test: `tests/cli/navi-init.test.ts`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: commits from Tasks 1-4.
- Produces: ready-for-main-session review report; does not push, tag, release, or publish.

- [ ] **Step 1: Run targeted CLI tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run targeted skill tests**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

- [ ] **Step 4: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 5: Verify scope**

Run:

```bash
git diff --name-only HEAD~2..HEAD
```

Expected modified files are limited to:

```text
.agents/skills/along-working-thread/SKILL.md
.agents/skills/along-working-thread/references/working-thread-v1.md
docs/along/project-maps/navi-project-init.md
docs/along/project-maps/navi-project-trigger-template.md
plugins/along-working-thread/skills/along-working-thread/SKILL.md
plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
src/cli/navi-init.ts
tests/cli/navi-init.test.ts
tests/skills/along-working-thread-skill.test.ts
```

- [ ] **Step 6: Report final status**

Report:

```text
Implemented alpha.13 Project Initialization And Suggested Map Preview.

Commits:
- <sha> feat: add navi suggested map preview
- <sha> docs: clarify navi project initialization boundary

Validation:
- npm test -- tests/cli/navi-init.test.ts: PASS
- npm test -- tests/skills/along-working-thread-skill.test.ts: PASS
- npm run verify:plugin-package: PASS
- git diff --check: PASS

Scope:
- No README/release notes/GitHub Release changes.
- No src/web, MCP runtime/server, UI, external target project, npm publication, marketplace, tag, release, or push.
- Suggested maps are read-only previews and are never written automatically.
```

## Plan Self-Review

- Spec coverage: This plan covers global install vs project initialization, `navi init` wording, global-only caution, initialized-project trigger reliability, `--suggest-map`, `--suggest-map --write`, hybrid evidence discovery, shape hints, preview rendering, targeted fixtures, minimal global skill wording, package copy sync, and targeted validation.
- Scope check: This is one bounded Project Integration implementation. It does not include confirmed map writing, model-backed project analysis, runtime UI, release work, external target-project writes, npm publication, or marketplace publication.
- Placeholder scan: The plan contains concrete files, commands, signatures, tests, and expected outputs. It does not defer implementation details to the worker.
- Type consistency: `suggestMap`, `SuggestedMapPreview`, `ProjectShapeHint`, `SuggestionConfidence`, `EvidenceSnippet`, `suggestProjectMap()`, and `renderSuggestedMapPreview()` are defined before they are used by later tasks.
