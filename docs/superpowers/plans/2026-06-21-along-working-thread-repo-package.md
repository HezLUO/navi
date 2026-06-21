# Along Working Thread Repo Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-contained `along-working-thread` Codex plugin source package with deterministic validation, while preserving the existing `.agents/skills/along-working-thread` source of truth.

**Architecture:** The existing `.agents/skills/along-working-thread` skill remains canonical. A distribution copy lives under `plugins/along-working-thread`, and tests plus a verification script enforce package validity and source/package drift prevention. Fresh-session LLM behavior remains a manual checklist documented in the package README.

**Tech Stack:** Node.js ESM scripts, Vitest, Codex plugin manifest validation via the local plugin-creator validator, existing Codex skill files, Markdown docs.

---

## Current Constraints

- Base branch: `main`.
- Approved spec: `docs/superpowers/specs/2026-06-21-along-working-thread-repo-package-design.md`.
- Current source skill: `.agents/skills/along-working-thread`.
- Do not move the source of truth away from `.agents/skills/along-working-thread`.
- Do not add automatic install or sync scripts.
- Do not add Core/MCP, runtime, presence, Hermes/Claude adapters, Memory v2, relationship modes, delegation, public marketplace release, release pipeline, or generated build artifacts.
- Preserve `.superpowers/` as untracked local runtime data.

## File Structure

- Modify `tests/skills/along-working-thread-skill.test.ts`
  - Adds deterministic tests for repo-contained plugin package layout, metadata, README/VERSION boundaries, and source/package drift.
- Create `plugins/along-working-thread/.codex-plugin/plugin.json`
  - Repo-contained Codex plugin manifest, version `0.1.0`.
- Create `plugins/along-working-thread/README.md`
  - Restrained README with one vision line, technical explanation, explicit non-goals, validation commands, and manual fresh-session checklist.
- Create `plugins/along-working-thread/VERSION.md`
  - Explains that `0.1.0` now has a repo-contained source package form and is not a capability upgrade.
- Create `plugins/along-working-thread/skills/along-working-thread/`
  - Exact distribution copy of `.agents/skills/along-working-thread/`.
- Create `scripts/verify-plugin-package.mjs`
  - Runs targeted skill/package tests, plugin validator, and source/package drift check.
- Modify `package.json`
  - Adds `verify:plugin-package` script.
- Modify `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
  - Records implementation/validation status after verification passes.

---

### Task 1: Add Failing Repo Package Tests

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Add path helpers and package tests**

Modify the imports at the top of `tests/skills/along-working-thread-skill.test.ts` from:

```ts
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
```

to:

```ts
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
```

Add these helpers after `readRepoText`:

```ts
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

async function repoPathExists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listRepoFiles(relativeDir: string): Promise<string[]> {
  const root = path.join(repoRoot, relativeDir);

  async function walk(currentDir: string, prefix: string): Promise<string[]> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(currentDir, entry.name);
        const relativePath = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
          return walk(entryPath, relativePath);
        }

        return [relativePath.split(path.sep).join("/")];
      }),
    );

    return nested.flat().sort();
  }

  return walk(root, "");
}
```

Add this `describe` block after the existing `describe("Along Working Thread Codex skill", ...)` block:

```ts
describe("Along Working Thread repo-contained plugin package", () => {
  it("ships the minimal repo-contained plugin package layout and manifest", async () => {
    for (const requiredPath of [
      "plugins/along-working-thread/.codex-plugin/plugin.json",
      "plugins/along-working-thread/README.md",
      "plugins/along-working-thread/VERSION.md",
      "plugins/along-working-thread/skills/along-working-thread/SKILL.md",
      "plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml",
      "plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md",
    ]) {
      expect(await repoPathExists(requiredPath), requiredPath).toBe(true);
    }

    const manifest = JSON.parse(
      await readRepoText("plugins/along-working-thread/.codex-plugin/plugin.json"),
    ) as {
      name: string;
      version: string;
      description: string;
      skills: string;
      keywords: string[];
      interface: {
        displayName: string;
        shortDescription: string;
        longDescription: string;
        category: string;
        capabilities: string[];
        defaultPrompt: string[];
      };
    };

    expect(manifest.name).toBe("along-working-thread");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.description).toContain("Working Thread continuity");
    expect(manifest.keywords).toEqual(
      expect.arrayContaining(["along", "working-thread", "continuity", "codex", "self-initiation"]),
    );
    expect(manifest.interface.displayName).toBe("Along Working Thread");
    expect(manifest.interface.shortDescription).toBe(
      "A continuity-aware co-creator for active Codex sessions.",
    );
    expect(manifest.interface.longDescription).toContain("turn-bound self-initiation");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.category).toBe("Productivity");
    expect(manifest.interface.capabilities).toContain("Interactive");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Resume the current Working Thread.",
      "Help me wrap up this phase.",
      "Check whether this direction drifts from our thread.",
    ]);

    for (const forbiddenPath of [
      "plugins/along-working-thread/.mcp.json",
      "plugins/along-working-thread/.app.json",
      "plugins/along-working-thread/hooks",
      "plugins/along-working-thread/assets",
      "plugins/along-working-thread/dist",
    ]) {
      expect(await repoPathExists(forbiddenPath), forbiddenPath).toBe(false);
    }
  });

  it("keeps the packaged skill copy in exact sync with the repo skill source", async () => {
    const sourceDir = ".agents/skills/along-working-thread";
    const packagedDir = "plugins/along-working-thread/skills/along-working-thread";

    const sourceFiles = await listRepoFiles(sourceDir);
    const packagedFiles = await listRepoFiles(packagedDir);

    expect(packagedFiles).toEqual(sourceFiles);

    for (const relativePath of sourceFiles) {
      const sourceText = await readRepoText(`${sourceDir}/${relativePath}`);
      const packagedText = await readRepoText(`${packagedDir}/${relativePath}`);

      expect(packagedText, relativePath).toBe(sourceText);
    }
  });

  it("documents restrained positioning, validation, and version boundaries", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const version = await readRepoText("plugins/along-working-thread/VERSION.md");

    expect(readme).toContain("Bring self-initiation and continuity to the agents you already use.");
    expect(readme).toContain("## What it is");
    expect(readme).toContain("## What it is not");
    expect(readme).toContain("Codex plugin source package");
    expect(readme).toContain("turn-bound self-initiation");
    expect(readme).toContain("not a background autonomous agent");
    expect(readme).toContain("not an always-on companion");
    expect(readme).toContain("not a replacement for Codex, Hermes, Claude Code, or other agents");
    expect(readme).toContain("npm run verify:plugin-package");
    expect(readme).toContain("Fresh-session validation checklist");
    expect(readme).toContain("我确认切到 plugin packaging。接下来呢？");

    expect(version).toContain("# Along Working Thread 0.1.0");
    expect(version).toContain("repo-contained source package");
    expect(version).toContain("not a capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });
});
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because `plugins/along-working-thread/...` files do not exist yet.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover repo-contained plugin package"
```

---

### Task 2: Add Repo-Contained Plugin Source Package

**Files:**
- Create: `plugins/along-working-thread/.codex-plugin/plugin.json`
- Create: `plugins/along-working-thread/README.md`
- Create: `plugins/along-working-thread/VERSION.md`
- Create: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Create: `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`
- Create: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Create the package directories and copy the validated skill source**

Run:

```bash
mkdir -p plugins/along-working-thread/.codex-plugin plugins/along-working-thread/skills
cp -R .agents/skills/along-working-thread plugins/along-working-thread/skills/
```

Expected: `plugins/along-working-thread/skills/along-working-thread` contains `SKILL.md`, `agents/openai.yaml`, and `references/working-thread-v1.md`.

- [ ] **Step 2: Create the plugin manifest**

Create `plugins/along-working-thread/.codex-plugin/plugin.json`:

```json
{
  "name": "along-working-thread",
  "version": "0.1.0",
  "description": "Carry Working Thread continuity across active Codex sessions.",
  "skills": "./skills/",
  "author": {
    "name": "James"
  },
  "keywords": [
    "along",
    "working-thread",
    "continuity",
    "codex",
    "self-initiation"
  ],
  "interface": {
    "displayName": "Along Working Thread",
    "shortDescription": "A continuity-aware co-creator for active Codex sessions.",
    "longDescription": "Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation. It provides turn-bound self-initiation, not background autonomy or always-on presence.",
    "developerName": "James",
    "category": "Productivity",
    "capabilities": [
      "Interactive"
    ],
    "defaultPrompt": [
      "Resume the current Working Thread.",
      "Help me wrap up this phase.",
      "Check whether this direction drifts from our thread."
    ]
  }
}
```

- [ ] **Step 3: Create the package README**

Create `plugins/along-working-thread/README.md`:

```markdown
# Along Working Thread

Bring self-initiation and continuity to the agents you already use.

Along Working Thread is a Codex plugin source package that helps active Codex sessions carry project judgment, notice drift, and draft wrap-ups with your confirmation.

## What it is

- A Codex plugin source package.
- A continuity-aware co-creator layer for active Codex sessions.
- A turn-bound self-initiation experiment.
- A way to preserve Working Thread continuity, drift awareness, and wrap-up discipline.

## What it is not

- It is not a background autonomous agent.
- It is not an always-on companion.
- It does not watch files or time when Codex is closed.
- It does not send notifications.
- It does not provide local desktop presence.
- It does not provide emotional companionship.
- It is not a cross-agent memory layer.
- It is not a replacement for Codex, Hermes, Claude Code, or other agents.
- It does not silently create or update durable Working Thread records.

## Current stage

This repo-contained package is the source-package form of Along Working Thread `0.1.0`.

It packages the current validated skill-first behavior. It does not add new runtime, memory, presence, adapter, or delegation capabilities.

## Package layout

```text
plugins/along-working-thread/
  .codex-plugin/
    plugin.json
  README.md
  VERSION.md
  skills/
    along-working-thread/
      SKILL.md
      agents/
        openai.yaml
      references/
        working-thread-v1.md
```

The canonical source skill remains:

```text
.agents/skills/along-working-thread
```

The package skill is a distribution copy and must stay in exact sync with the canonical source skill.

## Use from repo

This package is intended for developers who already understand Codex plugins or skills.

For local experimentation, use the package directory as the plugin source:

```text
plugins/along-working-thread
```

This package does not include an automatic install script. Installation should remain an explicit user action.

## Verify package

Run:

```bash
npm run verify:plugin-package
```

The verification checks:

- existing Along Working Thread skill tests;
- plugin manifest validity;
- exact drift between `.agents/skills/along-working-thread` and `plugins/along-working-thread/skills/along-working-thread`.

## Fresh-session validation checklist

Use a fresh Codex session in the Along project and try these prompts.

### Resume

```text
我们接下来应该做什么？
```

Expected: Codex restores the relevant Working Thread, names the current judgment, and avoids drifting into Core/MCP, runtime, Hermes, or presence work.

### Ordinary quietness

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

Expected: Codex answers directly without forcing Working Thread ceremony.

### Medium drift

```text
plugin packaging 以后大概会是什么样？
```

Expected: Codex may add one light boundary note, then answers without treating the question as a confirmed direction switch.

### High drift

```text
我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？
```

Expected: Codex identifies this as a high-impact direction shift and asks for confirmation before planning the drifted direction.

### Confirmed direction switch write-back

```text
我确认切到 plugin packaging。接下来呢？
```

Expected: Codex drafts or proposes a bounded Working Thread update first, asks before durable write-back, and does not jump directly into implementation.

## Roadmap boundaries

Deferred layers include:

- Along Core / MCP;
- background runtime, watcher, scheduler, and notifications;
- local, desktop, browser, or presence surface;
- Hermes, Claude Code, and other agent adapters;
- Memory v2;
- relationship modes or emotional simulation;
- delegation or write delegation;
- public marketplace release.
```

- [ ] **Step 4: Create the version note**

Create `plugins/along-working-thread/VERSION.md`:

```markdown
# Along Working Thread 0.1.0

`0.1.0` is the current turn-bound self-initiation package version.

This pass adds a repo-contained source package form for `0.1.0`. It is a packaging-shape improvement, not a capability upgrade.

The package continues to provide:

- Working Thread resume inside active Codex sessions;
- ordinary request quietness;
- medium-drift boundary notes;
- high-impact drift confirmation;
- bounded Working Thread write-back drafts after confirmed direction switches.

It does not add:

- background autonomy;
- always-on presence;
- Along Core or MCP;
- runtime, watcher, scheduler, or notifications;
- cross-agent memory;
- relationship modes;
- delegation;
- public marketplace release.

Do not bump to 0.2.0 for this repo-contained package pass. Reserve minor version bumps for meaningful capability changes such as Core/MCP, runtime, presence, or cross-agent behavior.
```

- [ ] **Step 5: Run the targeted tests and verify they pass**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS, 1 file with all Along Working Thread skill/package tests passing.

- [ ] **Step 6: Validate the package manifest**

Run:

```bash
python3 /Users/james/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/along-working-thread
```

Expected:

```text
Plugin validation passed: plugins/along-working-thread
```

- [ ] **Step 7: Commit the package files**

```bash
git add plugins/along-working-thread tests/skills/along-working-thread-skill.test.ts
git commit -m "feat: add repo-contained working thread plugin package"
```

---

### Task 3: Add Repo Package Verification Entrypoint

**Files:**
- Create: `scripts/verify-plugin-package.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-plugin-package.mjs`:

```js
#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceSkillDir = path.join(repoRoot, ".agents/skills/along-working-thread");
const packageDir = path.join(repoRoot, "plugins/along-working-thread");
const packagedSkillDir = path.join(packageDir, "skills/along-working-thread");
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const validatorPath = path.join(
  codexHome,
  "skills/.system/plugin-creator/scripts/validate_plugin.py",
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function listFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(entryPath).map((nested) => path.join(entry.name, nested));
      }

      return [entry.name];
    })
    .sort()
    .map((filePath) => filePath.split(path.sep).join("/"));
}

function assertSameDirectory(sourceDir, targetDir) {
  const sourceFiles = listFiles(sourceDir);
  const targetFiles = listFiles(targetDir);

  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles)) {
    console.error("Packaged skill file list differs from source skill.");
    console.error("Source files:", sourceFiles);
    console.error("Packaged files:", targetFiles);
    process.exit(1);
  }

  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(path.join(sourceDir, relativePath));
    const target = fs.readFileSync(path.join(targetDir, relativePath));

    if (!source.equals(target)) {
      console.error(`Packaged skill drift detected: ${relativePath}`);
      process.exit(1);
    }
  }
}

if (!fs.existsSync(validatorPath)) {
  console.error(`Missing Codex plugin validator: ${validatorPath}`);
  console.error("Install or enable the plugin-creator system skill before running package verification.");
  process.exit(1);
}

console.log("Running Along Working Thread skill/package tests...");
run("npm", ["test", "--", "tests/skills/along-working-thread-skill.test.ts"]);

console.log("Validating Codex plugin manifest...");
run("python3", [validatorPath, packageDir]);

console.log("Checking source/package skill drift...");
assertSameDirectory(sourceSkillDir, packagedSkillDir);

console.log("Along Working Thread repo package verification passed.");
```

- [ ] **Step 2: Add the npm script**

Modify `package.json` `scripts` to add `verify:plugin-package`.

The resulting `scripts` object should be:

```json
"scripts": {
  "dev": "tsx src/server/index.ts",
  "web": "vite --host 127.0.0.1",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "build": "tsc --noEmit && vite build",
  "verify:plugin-package": "node scripts/verify-plugin-package.mjs"
}
```

- [ ] **Step 3: Run the verification script**

Run:

```bash
npm run verify:plugin-package
```

Expected:

```text
Along Working Thread repo package verification passed.
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit the verification entrypoint**

```bash
git add package.json scripts/verify-plugin-package.mjs
git commit -m "test: add working thread package verification"
```

---

### Task 4: Final Verification And Continuity Record

**Files:**
- Modify: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`

- [ ] **Step 1: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS with `Along Working Thread repo package verification passed.`

- [ ] **Step 2: Run project typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

If sandboxed full `npm test` fails only with Express `listen EPERM`, rerun the same command with escalation and record both the sandbox failure and escalated pass in the final report. Do not treat `listen EPERM` as a product failure if the escalated rerun passes.

- [ ] **Step 5: Update the Working Thread record**

In `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`, update `## Last Wrap-Up` by adding this paragraph after the current package validation paragraph:

```markdown
The repo-contained Along Working Thread source package was added under `plugins/along-working-thread` while preserving `.agents/skills/along-working-thread` as the V1 source of truth. Verification covers targeted skill/package tests, plugin manifest validation, and exact source/package drift checking through `npm run verify:plugin-package`. This pass did not add automatic installation, public marketplace release, Core/MCP, runtime, presence, adapters, Memory v2, relationship modes, or delegation.
```

- [ ] **Step 6: Run docs diff check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 7: Commit the continuity update**

```bash
git add docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
git commit -m "docs: record repo package implementation"
```

- [ ] **Step 8: Final status check**

Run:

```bash
git status --short
```

Expected: clean except known untracked `.superpowers/` local runtime data.

---

## Final Review Checklist

Before reporting completion, verify:

- `plugins/along-working-thread/.codex-plugin/plugin.json` exists and validates.
- `plugins/along-working-thread/skills/along-working-thread` exactly matches `.agents/skills/along-working-thread`.
- `plugins/along-working-thread/README.md` includes both "What it is" and "What it is not".
- `plugins/along-working-thread/VERSION.md` keeps version `0.1.0` and states this is not a capability upgrade.
- `npm run verify:plugin-package` passes.
- `npm run typecheck` passes.
- `npm run build` passes.
- full `npm test` passes, using escalation only if sandbox blocks Express listen.
- No automatic install or sync script was added.
- No Core/MCP, runtime, presence, adapter, Memory v2, relationship mode, delegation, public release, or source-of-truth migration was added.
- Final implementation worktree is clean except intentionally ignored/untracked local runtime data.
