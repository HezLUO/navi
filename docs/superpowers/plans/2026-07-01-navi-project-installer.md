# Navi Project Installer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the narrow `navi init` project-local installer described in `docs/superpowers/specs/2026-07-01-navi-project-installer-design.md`.

**Architecture:** Put installer planning, rendering, and write application in a pure-ish CLI support module at `src/cli/navi-init.ts`. Keep `src/cli/index.ts` as the command dispatcher, preserving `along start` while adding `navi init`. Update package metadata and public docs so the alpha promises a narrow project-local initializer, not global plugin installation or npm distribution.

**Tech Stack:** TypeScript ESM, Node `fs/promises`, Node `path`, Vitest, existing npm scripts.

---

## File Structure

- Create `src/cli/navi-init.ts`
  - Owns `buildInitPlan`, `applyInitPlan`, `renderInitPlan`, `parseInitArgs`, `runNaviInitCli`, constants, and small filesystem helpers.
- Modify `src/cli/index.ts`
  - Dispatches `init` to `runNaviInitCli`.
  - Preserves the existing `start` behavior for `along start`.
- Create `tests/cli/navi-init.test.ts`
  - Covers dry-run safety, write behavior, preservation, idempotence, existing map protection, CLI parsing, and rendering.
- Modify `package.json`
  - Add public `navi` bin while keeping `along`.
  - Add local source-alpha helper script `navi`.
- Modify `tests/mcp/working-thread-package.test.ts`
  - Update package metadata expectations for the new bin/script shape.
- Modify `README.md`
  - Replace "no automatic installer" language with narrow `navi init` setup guidance.
- Modify `docs/along/project-maps/navi-project-init.md`
  - Change from future CLI language to shipped narrow CLI language.
- Modify `docs/along/navi-product-debt.md`
  - Mark installation debt as partly addressed by project-local `navi init`.
- Modify `docs/along/roadmaps/navi-post-alpha-roadmap.md`
  - Move installer from future design item to shipped narrow capability, keeping distribution improvements open.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Update the project initialization section to mention `navi init` as the narrow setup surface.
- Modify `plugins/along-working-thread/README.md`
  - Explain that the package itself still requires explicit plugin use, while the repo now includes a target-project initializer.
- Modify `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Keep the packaged skill reference in exact sync with the canonical source reference.
- Modify `tests/skills/along-working-thread-skill.test.ts`
  - Update documentation assertions that currently expect no CLI/automatic installer.

### Task 1: Installer Core Tests

**Files:**
- Create: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Write failing installer tests**

Create `tests/cli/navi-init.test.ts` with this content:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  NAVI_AGENTS_BLOCK_START,
  applyInitPlan,
  buildInitPlan,
  parseInitArgs,
  renderInitPlan,
  resolveTargetPath,
  runNaviInitCli,
} from "../../src/cli/navi-init";

async function makeProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-init-"));
  const project = path.join(root, "target-project");
  await fs.mkdir(project);
  return project;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe("navi init planning", () => {
  it("defaults to dry-run and does not write target files", async () => {
    const project = await makeProject();

    const plan = await buildInitPlan({ targetDir: project, write: false });
    const output = renderInitPlan(plan);

    expect(plan.mode).toBe("dry-run");
    expect(plan.targetDir).toBe(path.resolve(project));
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([
      ["create", "AGENTS.md"],
      ["create", "docs/along/project-maps/navi-project-map.md"],
    ]);
    expect(output).toContain("Navi init preview");
    expect(output).toContain("No files were changed");
    expect(output).toContain("navi init --target");
    expect(output).toContain("接下来我们应该做什么？");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
    expect(await exists(path.join(project, "docs/along/project-maps/navi-project-map.md"))).toBe(false);
  });

  it("writes AGENTS.md and a provisional project map only behind --write", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
    const map = await fs.readFile(path.join(project, "docs/along/project-maps/navi-project-map.md"), "utf8");

    expect(agents).toContain(NAVI_AGENTS_BLOCK_START);
    expect(agents).toContain("## Navi Progress Map Rules");
    expect(agents).toContain("keep Navi quiet");
    expect(map).toContain("# Navi Project Map");
    expect(map).toContain("Map status: provisional");
    expect(map).toContain("This map only establishes where Navi should look first.");
  });

  it("preserves existing AGENTS.md content when adding the Navi block", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Project Instructions\n\nKeep this existing rule.\n");

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(agents).toMatch(/^# Project Instructions\n\nKeep this existing rule\./);
    expect(agents.match(/Navi Progress Map Rules/g)).toHaveLength(1);
  });

  it("is idempotent when an AGENTS.md Navi block already exists", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(
      agentsPath,
      `# Project Instructions\n\n${NAVI_AGENTS_BLOCK_START}\n## Navi Progress Map Rules\nExisting block.\n<!-- NAVI:END -->\n`,
    );

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")?.kind).toBe("skip");
    expect(agents.match(new RegExp(NAVI_AGENTS_BLOCK_START, "g"))).toHaveLength(1);
    expect(agents).toContain("Existing block.");
  });

  it("does not overwrite an existing project map", async () => {
    const project = await makeProject();
    const mapPath = path.join(project, "docs/along/project-maps/navi-project-map.md");
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, "# Existing Map\n\nKeep this confirmed map.\n");

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    expect(plan.actions.find((action) => action.relativePath === "docs/along/project-maps/navi-project-map.md")?.kind).toBe("skip");
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe("# Existing Map\n\nKeep this confirmed map.\n");
  });

  it("rejects unsafe target-relative writes", () => {
    expect(() => resolveTargetPath("/tmp/example-project", "../outside.md")).toThrow(/outside target/i);
  });

  it("rejects target paths that are not directories", async () => {
    const project = await makeProject();
    const fileTarget = path.join(project, "not-a-directory.txt");
    await fs.writeFile(fileTarget, "not a directory");

    await expect(buildInitPlan({ targetDir: fileTarget, write: false })).rejects.toThrow(/directory/i);
  });
});

describe("navi init CLI helpers", () => {
  it("parses target and write flags", () => {
    expect(parseInitArgs(["--target", "/tmp/demo", "--write"], "/tmp/fallback")).toEqual({
      targetDir: "/tmp/demo",
      write: true,
    });
  });

  it("returns a non-zero code for unknown flags", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--bogus"], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(1);
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toContain("Unknown option");
  });

  it("renders dry-run output through the CLI runner without writing files", async () => {
    const project = await makeProject();
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--target", project], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(0);
    expect(stderr.join("")).toBe("");
    expect(stdout.join("")).toContain("Navi init preview");
    expect(stdout.join("")).toContain("No files were changed");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because `../../src/cli/navi-init` does not exist.

### Task 2: Installer Core Implementation

**Files:**
- Create: `src/cli/navi-init.ts`
- Test: `tests/cli/navi-init.test.ts`

- [ ] **Step 1: Implement the installer core**

Create `src/cli/navi-init.ts` with this content:

```ts
import fs from "node:fs/promises";
import path from "node:path";

export const NAVI_AGENTS_BLOCK_START = "<!-- NAVI:START -->";
export const NAVI_AGENTS_BLOCK_END = "<!-- NAVI:END -->";

export const VALIDATION_PROMPT = `请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？`;

const AGENTS_RELATIVE_PATH = "AGENTS.md";
const PROJECT_MAP_RELATIVE_PATH = "docs/along/project-maps/navi-project-map.md";

export type InitActionKind = "create" | "modify" | "skip";

export interface InitAction {
  kind: InitActionKind;
  relativePath: string;
  absolutePath: string;
  summary: string;
  content?: string;
}

export interface InitPlan {
  mode: "dry-run" | "write";
  targetDir: string;
  actions: InitAction[];
  validationPrompt: string;
}

export interface InitOptions {
  targetDir?: string;
  write?: boolean;
}

export interface NaviInitIo {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export function resolveTargetPath(targetDir: string, relativePath: string): string {
  const resolvedTarget = path.resolve(targetDir);
  const resolvedPath = path.resolve(resolvedTarget, relativePath);
  const relativeFromTarget = path.relative(resolvedTarget, resolvedPath);

  if (relativeFromTarget.startsWith("..") || path.isAbsolute(relativeFromTarget)) {
    throw new Error(`Refusing to write outside target directory: ${relativePath}`);
  }

  return resolvedPath;
}

export function parseInitArgs(args: string[], cwd = process.cwd()): Required<InitOptions> {
  const parsed: Required<InitOptions> = {
    targetDir: cwd,
    write: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--target") {
      const target = args[index + 1];
      if (!target || target.startsWith("--")) {
        throw new Error("Missing value for --target");
      }
      parsed.targetDir = target;
      index += 1;
      continue;
    }

    if (arg === "--write") {
      parsed.write = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return parsed;
}

export async function buildInitPlan(options: InitOptions = {}): Promise<InitPlan> {
  const targetDir = path.resolve(options.targetDir ?? process.cwd());
  await assertDirectory(targetDir);

  const agentsPath = resolveTargetPath(targetDir, AGENTS_RELATIVE_PATH);
  const mapPath = resolveTargetPath(targetDir, PROJECT_MAP_RELATIVE_PATH);

  const actions: InitAction[] = [
    await planAgentsAction(agentsPath),
    await planProjectMapAction(targetDir, mapPath),
  ];

  return {
    mode: options.write ? "write" : "dry-run",
    targetDir,
    actions,
    validationPrompt: VALIDATION_PROMPT,
  };
}

export async function applyInitPlan(plan: InitPlan): Promise<void> {
  if (plan.mode !== "write") {
    return;
  }

  for (const action of plan.actions) {
    if ((action.kind === "create" || action.kind === "modify") && action.content !== undefined) {
      await fs.mkdir(path.dirname(action.absolutePath), { recursive: true });
      await fs.writeFile(action.absolutePath, action.content);
    }
  }
}

export function renderInitPlan(plan: InitPlan): string {
  const lines: string[] = [];
  const isDryRun = plan.mode === "dry-run";
  lines.push(isDryRun ? "Navi init preview" : "Navi init applied");
  lines.push(`Target: ${plan.targetDir}`);
  lines.push("");

  for (const action of plan.actions) {
    const label = action.kind === "create" ? "Create" : action.kind === "modify" ? "Modify" : "Skip";
    lines.push(`- ${label}: ${action.relativePath}`);
    lines.push(`  ${action.summary}`);
  }

  lines.push("");
  if (isDryRun) {
    lines.push("No files were changed.");
    lines.push(`Apply with: navi init --target ${JSON.stringify(plan.targetDir)} --write`);
  } else {
    lines.push("Files were changed according to the plan above.");
  }

  lines.push("");
  lines.push("Fresh-session validation prompt:");
  lines.push("```text");
  lines.push(plan.validationPrompt);
  lines.push("```");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export async function runNaviInitCli(
  args: string[],
  io: NaviInitIo = {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
): Promise<number> {
  try {
    const options = parseInitArgs(args, io.cwd);
    const plan = await buildInitPlan(options);
    await applyInitPlan(plan);
    io.stdout(renderInitPlan(plan));
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    io.stderr("Usage: navi init [--target <path>] [--write]\n");
    return 1;
  }
}

async function assertDirectory(targetDir: string): Promise<void> {
  let stat;
  try {
    stat = await fs.stat(targetDir);
  } catch (error) {
    throw new Error(`Target directory does not exist: ${targetDir}`, { cause: error });
  }

  if (!stat.isDirectory()) {
    throw new Error(`Target path must be a directory: ${targetDir}`);
  }
}

async function planAgentsAction(agentsPath: string): Promise<InitAction> {
  const existing = await readTextIfExists(agentsPath);
  const block = renderAgentsBlock();

  if (existing === undefined) {
    return {
      kind: "create",
      relativePath: AGENTS_RELATIVE_PATH,
      absolutePath: agentsPath,
      summary: "Add the project-local Navi trigger source.",
      content: `${block}\n`,
    };
  }

  if (existing.includes(NAVI_AGENTS_BLOCK_START)) {
    return {
      kind: "skip",
      relativePath: AGENTS_RELATIVE_PATH,
      absolutePath: agentsPath,
      summary: "A Navi-managed trigger block already exists.",
    };
  }

  const separator = existing.endsWith("\n") ? "\n" : "\n\n";
  return {
    kind: "modify",
    relativePath: AGENTS_RELATIVE_PATH,
    absolutePath: agentsPath,
    summary: "Append the project-local Navi trigger source while preserving existing instructions.",
    content: `${existing}${separator}${block}\n`,
  };
}

async function planProjectMapAction(targetDir: string, mapPath: string): Promise<InitAction> {
  const existingMaps = await listExistingProjectMaps(targetDir);

  if (existingMaps.length > 0) {
    return {
      kind: "skip",
      relativePath: PROJECT_MAP_RELATIVE_PATH,
      absolutePath: mapPath,
      summary: `Existing project map record found: ${existingMaps.join(", ")}. Navi will not overwrite it.`,
    };
  }

  return {
    kind: "create",
    relativePath: PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "Create a provisional Navi Project Map starter record.",
    content: renderProjectMap(targetDir),
  };
}

function renderAgentsBlock(): string {
  return `${NAVI_AGENTS_BLOCK_START}
## Navi Progress Map Rules

When the user asks about project progress, next steps, whether to continue, or says they do not understand the current state, first give a compact Navi map before ordinary task advice. Trigger examples include:

- \`接下来我们应该做什么？\`
- \`现在做到哪了？我看不懂。\`
- \`继续吧。\`
- \`这个方案可以吗？我不懂技术。\`

Use the target project's own records to choose the map shape:

- If the work has a stable one-way delivery path, use a compact horizontal progress strip.
- If the work is a long-running flow with repeated cycles, parallel tracks, waiting states, or external feedback, use a Rhythm Map.

For flowing projects, prefer this structure and replace the labels with project-specific terms:

\`\`\`text
项目节奏
[周期/方向] + [对象/机会筛选] + [材料/执行准备] + [提交/跟进/反馈]
                              ▲
                           当前焦点

当前主线
[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]
                         ▲
                      当前动作
\`\`\`

After the map, explain the marked position in plain language: what is happening now, why it matters, what should happen next, what the user needs to confirm, and the main risk if blindly continuing would be costly.

Use project-local records such as \`PROJECT_STATE.md\`, task/status files, trackers, workflow records, and the latest project-local handoff to place the current marker and choose the next small loop. Do not treat project-local handoff files as forbidden thread history.

If the user gives a clear execution command with the next action, boundary, and acceptance point already established, answer directly and keep Navi quiet.

Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks. For these tasks, report the requested facts directly; do not output a Progress Map or Rhythm Map unless the user also asks what those facts mean for overall progress, next steps, confusion, or plan reliability.
${NAVI_AGENTS_BLOCK_END}`;
}

function renderProjectMap(targetDir: string): string {
  const projectName = path.basename(targetDir);

  return `# Navi Project Map

Project: ${projectName}
Map status: provisional
Project shape: unclear

## Source Records Navi Should Read First

- \`AGENTS.md\`
- \`README.md\` if present
- \`PROJECT_STATE.md\` if present
- task/status files, tracker files, workflow records, or project-local handoffs if present

## Current Map

This map only establishes where Navi should look first. It is not a confirmed project stage sequence yet.

Before drawing a confident Progress Map or Rhythm Map, inspect the project-local source records and ask for user confirmation when the project shape is unclear.

## Fresh-Session Validation

\`\`\`text
${VALIDATION_PROMPT}
\`\`\`
`;
}

async function listExistingProjectMaps(targetDir: string): Promise<string[]> {
  const mapDir = resolveTargetPath(targetDir, "docs/along/project-maps");
  let entries;
  try {
    entries = await fs.readdir(mapDir, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `docs/along/project-maps/${entry.name}`)
    .sort();
}

async function readTextIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
```

- [ ] **Step 2: Run the focused test and verify GREEN**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: PASS for `tests/cli/navi-init.test.ts`.

- [ ] **Step 3: Commit the core installer module**

Run:

```bash
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts
git commit -m "feat: add navi project init planner"
```

### Task 3: CLI And Package Wiring

**Files:**
- Modify: `src/cli/index.ts`
- Modify: `package.json`
- Modify: `tests/mcp/working-thread-package.test.ts`
- Test: `tests/cli/navi-init.test.ts`
- Test: `tests/mcp/working-thread-package.test.ts`

- [ ] **Step 1: Update package metadata test first**

In `tests/mcp/working-thread-package.test.ts`, replace the first test with:

```ts
  it("exposes the Navi project installer bin while preserving Along compatibility", () => {
    expect(packageJson.scripts["mcp:working-thread"]).toBe(
      "tsx src/mcp/working-thread-server.ts",
    );
    expect(packageJson.scripts.navi).toBe("tsx src/cli/index.ts");

    expect(packageJson.bin).toEqual({
      navi: "src/cli/index.ts",
      along: "src/cli/index.ts",
    });
  });
```

- [ ] **Step 2: Run package wiring test and verify RED**

Run:

```bash
npm test -- tests/mcp/working-thread-package.test.ts
```

Expected: FAIL because `package.json` does not yet expose the `navi` script or bin.

- [ ] **Step 3: Update `package.json`**

Change the `bin` and `scripts` sections to include the source-alpha helper script and public bin:

```json
  "bin": {
    "navi": "src/cli/index.ts",
    "along": "src/cli/index.ts"
  },
  "scripts": {
    "dev": "tsx src/server/index.ts",
    "navi": "tsx src/cli/index.ts",
    "mcp:working-thread": "tsx src/mcp/working-thread-server.ts",
    "web": "vite --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "build": "tsc --noEmit && vite build",
    "verify:plugin-package": "node scripts/verify-plugin-package.mjs"
  },
```

- [ ] **Step 4: Update CLI dispatcher**

Replace `src/cli/index.ts` with:

```ts
#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import open from "open";
import { runNaviInitCli } from "./navi-init";

const command = process.argv[2] ?? "start";

if (command === "init") {
  const exitCode = await runNaviInitCli(process.argv.slice(3));
  process.exit(exitCode);
}

if (command !== "start") {
  console.error(`Unknown command "${command}". Use: navi init [--target <path>] [--write] or along start`);
  process.exit(1);
}

const repoPath = process.cwd();
const port = Number(process.env.ALONG_PORT ?? 4317);
const serverEntry = path.resolve("src/server/index.ts");

const child = spawn("npx", ["tsx", serverEntry], {
  cwd: path.resolve(import.meta.dirname, "../.."),
  env: {
    ...process.env,
    ALONG_REPO_PATH: repoPath,
    ALONG_PORT: String(port),
  },
  stdio: "inherit",
});

setTimeout(() => {
  void open(`http://127.0.0.1:5173`);
}, 800);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/mcp/working-thread-package.test.ts
```

Expected: PASS for both files.

- [ ] **Step 6: Manually verify source-alpha command shape**

Run:

```bash
tmpdir="$(mktemp -d)"
npm run navi -- init --target "$tmpdir"
test ! -e "$tmpdir/AGENTS.md"
npm run navi -- init --target "$tmpdir" --write
test -f "$tmpdir/AGENTS.md"
test -f "$tmpdir/docs/along/project-maps/navi-project-map.md"
```

Expected: every command exits 0; dry-run leaves no `AGENTS.md`; write creates `AGENTS.md` and the provisional project map.

- [ ] **Step 7: Commit CLI and package wiring**

Run:

```bash
git add src/cli/index.ts package.json tests/mcp/working-thread-package.test.ts
git commit -m "feat: expose navi init command"
```

### Task 4: Public Docs And Product Debt Updates

**Files:**
- Modify: `README.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/navi-product-debt.md`
- Modify: `docs/along/roadmaps/navi-post-alpha-roadmap.md`
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update docs assertions first**

In `tests/skills/along-working-thread-skill.test.ts`, update the project initialization expectations so the `initDoc` expected strings are:

```ts
    for (const expected of [
      "# Navi Project Initialization",
      "Minimum install output",
      "AGENTS.md",
      "docs/along/project-maps/",
      "Project Map or Rhythm Map",
      "`navi init` is the narrow project-local setup surface",
      "Do not use `navi init` as a global Codex plugin or skill installer",
      "Fresh-session validation",
    ]) {
      expect(initDoc).toContain(expected);
    }
```

Update the root README narrative expectations so the expected strings include:

```ts
      "Try Navi Alpha In 5 Minutes",
      "This alpha is a GitHub source package",
      "npm run navi -- init --target /path/to/target-project",
      "Project-local setup is explicit and dry-run by default",
      "Wait for a later release if you need npm distribution",
      "global Codex plugin installation",
```

Remove the old expected strings:

```ts
      "Wait for a later release if you need automatic installation",
      "This alpha does not include an automatic installer",
```

- [ ] **Step 2: Run docs test and verify RED**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because the docs still contain the old no-installer wording.

- [ ] **Step 3: Update `README.md`**

Make these concrete text changes:

Replace:

```markdown
This alpha is a GitHub source package for Codex users and developers who are comfortable testing from a repository. It is not yet an npm package, public marketplace listing, or one-click installer.
```

With:

```markdown
This alpha is a GitHub source package for Codex users and developers who are comfortable testing from a repository. It is not yet an npm package, public marketplace listing, or one-click global installer.
```

After the package verification command block, add:

```markdown
Preview project-local setup for a target project:

```bash
npm run navi -- init --target /path/to/target-project
```

Apply the setup only after reviewing the preview:

```bash
npm run navi -- init --target /path/to/target-project --write
```

Project-local setup is explicit and dry-run by default. `navi init` prepares `AGENTS.md`, `docs/along/project-maps/`, and a fresh-session validation prompt inside the target project. It does not install the global Codex plugin or skill.
```

Replace:

```markdown
Wait for a later release if you need automatic installation, npm distribution, public marketplace installation, runtime UI, background watching, notifications, or adapters for agents outside Codex.
```

With:

```markdown
Wait for a later release if you need npm distribution, public marketplace installation, global Codex plugin installation, one-click sync, runtime UI, background watching, notifications, or adapters for agents outside Codex.
```

In "What is stable in this alpha", replace:

```markdown
- Project-local Navi initialization through `AGENTS.md` and `docs/along/project-maps/`.
```

With:

```markdown
- Project-local Navi initialization through `navi init`, `AGENTS.md`, and `docs/along/project-maps/`.
```

In "What is not included", replace:

```markdown
- Automatic install or sync script.
```

With:

```markdown
- Global Codex plugin installation or one-click sync.
```

Replace:

```markdown
This alpha does not include an automatic installer. Installation should remain an explicit user action in the local Codex/plugin environment.
```

With:

```markdown
This alpha includes a narrow project-local initializer:

```bash
npm run navi -- init --target /path/to/target-project
```

The initializer is dry-run by default and only writes with `--write`. It prepares the target project for Navi behavior; it does not install or sync the global Codex plugin or skill.
```

- [ ] **Step 4: Update `docs/along/project-maps/navi-project-init.md`**

Replace the first sentence with:

```markdown
Navi Project Initialization is the minimum reliable way to connect Navi to a target project.
```

After the reliability path block, add:

```markdown
`navi init` is the narrow project-local setup surface for this pattern. It automates the preview and optional write of target-project files; it does not install the global Codex plugin or skill.
```

Replace the boundary line:

```markdown
Do not implement Core/MCP, background runtime, or a CLI as part of this minimum pass.
```

With:

```markdown
Do not use `navi init` as a global Codex plugin or skill installer. Do not implement Core/MCP, background runtime, npm publication, marketplace publication, or one-click sync as part of this project-local setup surface.
```

Replace the future product surface section with:

```markdown
## Product Surface

`navi init` performs this setup flow:

```text
read target project -> draft trigger source -> draft provisional Project Map -> preview -> user applies with --write -> fresh-session validation
```

The command should automate the setup, not change the core product rule: reliable Navi behavior comes from combining the global skill with a project-local trigger source and project-local map.
```

- [ ] **Step 5: Update roadmap and debt docs**

In `docs/along/navi-product-debt.md`, change installation debt status from open to partly addressed and replace "Later consider a `navi init`" with:

```markdown
- Keep `navi init` narrow: project-local preview by default, `--write` for durable changes, no global plugin install.
- Add clearer "Install Navi into this project" docs around the command.
- Treat global plugin installation, one-click sync, npm release, and marketplace release as separate distribution projects.
```

In `docs/along/roadmaps/navi-post-alpha-roadmap.md`, under Distribution Improvements, replace the automatic install design item with:

```markdown
- P0: Validate the narrow `navi init` project-local initializer with clean temporary target projects and at least one real target project.
- P1: Improve installer ergonomics without broadening scope: clearer preview, conflict reporting, and source-record hints.
```

Under Future Capability Layers, replace the Navi project initialization workflow bullet with:

```markdown
- Navi project initialization workflow: extend the shipped narrow `navi init` surface only after real-use feedback confirms the dry-run and write model.
```

Under Explicitly Out Of Current Scope, replace:

```markdown
- Automatic install or sync script.
```

With:

```markdown
- Global plugin installation, one-click sync, npm distribution, or marketplace installation.
```

- [ ] **Step 6: Run docs test and verify GREEN**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for the skills documentation test file.

- [ ] **Step 7: Commit public docs update**

Run:

```bash
git add README.md docs/along/project-maps/navi-project-init.md docs/along/navi-product-debt.md docs/along/roadmaps/navi-post-alpha-roadmap.md tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: document navi init project setup"
```

### Task 5: Skill Package Documentation Sync

**Files:**
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/README.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`
- Verify: `npm run verify:plugin-package`

- [ ] **Step 1: Update source reference first**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, replace the end of the "Navi Project Initialization" section:

```markdown
Do not implement Core/MCP, background runtime, or a CLI as part of this minimum pass. Future product surface can be `navi init` or an app workflow, but the V1 behavior is still documentation-based setup with user-confirmed durable writes.
```

With:

```markdown
`navi init` is the narrow project-local setup surface for this pattern. It previews the `AGENTS.md` trigger source and provisional Project/Rhythm Map starter, then writes only when the user passes `--write`.

Do not use `navi init` as a global Codex plugin or skill installer. Do not add Core/MCP, background runtime, npm publication, marketplace publication, one-click sync, or automatic final project-state inference to this setup surface.
```

- [ ] **Step 2: Copy the source reference to the packaged reference**

Run:

```bash
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

- [ ] **Step 3: Update plugin README**

In `plugins/along-working-thread/README.md`, replace:

```markdown
This package does not include an automatic install script. Installation should remain an explicit user action.
```

With:

```markdown
This plugin source package still requires explicit local Codex plugin or skill setup. The repository also includes a narrow target-project initializer:

```bash
npm run navi -- init --target /path/to/target-project
```

`navi init` prepares project-local Navi files in the target project. It does not install or sync the global Codex plugin or skill.
```

- [ ] **Step 4: Run skill docs test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS, including exact source/package skill drift check.

- [ ] **Step 6: Commit skill package docs sync**

Run:

```bash
git add .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/README.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: sync navi init package guidance"
```

### Task 6: Final Verification And Release-Readiness Check

**Files:**
- Inspect all changed files.
- Commit any remaining integration fixes.

- [ ] **Step 1: Run full typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run focused installer and package tests**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/mcp/working-thread-package.test.ts tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS.

- [ ] **Step 4: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. If the sandbox blocks local server listen calls with `EPERM`, rerun with approved escalation and report both the sandbox failure and the escalated result.

- [ ] **Step 5: Run manual temp-project installer check**

Run:

```bash
tmpdir="$(mktemp -d)"
npm run navi -- init --target "$tmpdir"
test ! -e "$tmpdir/AGENTS.md"
npm run navi -- init --target "$tmpdir" --write
test -f "$tmpdir/AGENTS.md"
test -f "$tmpdir/docs/along/project-maps/navi-project-map.md"
grep -q "Navi Progress Map Rules" "$tmpdir/AGENTS.md"
grep -q "Map status: provisional" "$tmpdir/docs/along/project-maps/navi-project-map.md"
```

Expected: every command exits 0.

- [ ] **Step 6: Review diff for scope**

Run:

```bash
git status -sb
git diff --stat
git diff -- src/cli/index.ts src/cli/navi-init.ts tests/cli/navi-init.test.ts package.json README.md docs/along/project-maps/navi-project-init.md
```

Expected: changes match this plan; no unrelated rewrites.

- [ ] **Step 7: Commit any remaining integration changes**

If verification required small fixes after the task commits, run:

```bash
git add <verified-files>
git commit -m "test: verify navi init integration"
```

Use the exact verified file list instead of staging unrelated files.

## Self-Review

Spec coverage:

- Project-local initialization only: covered by Tasks 1, 2, 4, and 5.
- Default dry-run and explicit `--write`: covered by Tasks 1, 2, 3, and 6.
- No global plugin/skill installation: covered by Tasks 4 and 5 docs, and by implementation scope in Tasks 2 and 3.
- Existing file preservation and no silent map overwrite: covered by Task 1 tests and Task 2 implementation.
- Public command `navi init`: covered by Task 3 package and CLI wiring.
- README and initialization docs no longer claim "no installer": covered by Task 4.
- Package verification remains intact: covered by Task 5 and Task 6.

Placeholder scan:

- No placeholder marker strings remain.
- No deferred implementation instructions remain.
- No unnamed test or file paths.

Type consistency:

- The tests import `buildInitPlan`, `applyInitPlan`, `renderInitPlan`, `parseInitArgs`, `resolveTargetPath`, `runNaviInitCli`, and `NAVI_AGENTS_BLOCK_START`.
- Task 2 defines each imported symbol with the same names.
- `InitPlan.mode` values are `dry-run` and `write`, matching the tests.
- `InitAction.kind` values are `create`, `modify`, and `skip`, matching the tests.
