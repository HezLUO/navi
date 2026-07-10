# Navi Global Bootstrap And Init Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a source-alpha global Navi bootstrap that stays quiet for narrow work, offers project initialization for broad supervision prompts, provides a real `navi` CLI path, and hands reliable behavior to project-local guidance after explicit approval.

**Architecture:** Separate the customer-facing `navi` command from the historical `along` runtime entrypoint. Add one focused global-setup module for managed `$CODEX_HOME/AGENTS.md` lifecycle and one read-only doctor module for CLI/plugin/bootstrap/project checks. Keep the bootstrap block minimal and always visible, while the existing project-local trigger and skill retain full Navi behavior.

**Tech Stack:** TypeScript, Node.js `fs/promises`, `child_process`, Vitest, Markdown docs, existing Codex plugin package and verifier.

## Global Constraints

- This is Implementation mode, not Release mode.
- Execute in a real Codex worktree session created from `main` after this plan is approved and pushed.
- Do not implement in the main design session.
- Do not tag, publish, create a GitHub Release, bump a release version, or enter npm/public marketplace work.
- Do not implement MCP, runtime UI, background watchers, notifications, always-on presence, agent adapters, or alpha.14 `.navi/state.md`.
- Do not rebrand or modify `src/web`; it remains historical Along Shared Desk / future capability evidence.
- Do not modify real `$CODEX_HOME/AGENTS.md`, the personal plugin installation, `engineering_loop`, or `sub_ag_ski` from the implementation worktree.
- All setup/doctor tests must use disposable temporary directories and injected command results.
- The global bootstrap remains prompt-backed and must not claim deterministic runtime interception.
- Ordinary users should see at most: setup once, approve project init once, then use natural language.
- `navi setup`, removal, and `navi init` remain dry-run by default; writes require `--write`.
- Global setup must preserve all bytes outside its managed region.
- Global setup must refuse duplicate, nested, incomplete, user-modified, or symlink-unsafe managed regions.
- Setup must not write a bootstrap that claims Navi is available when the plugin is missing or disabled.
- `navi doctor` is read-only.
- `navi` must not start the historical Along server or open `src/web`.
- `along start` compatibility remains available through the legacy entrypoint.
- Plugin `defaultPrompt` must contain at most three entries.
- Implicit skill routing remains best effort; the global block is the first-use reliability layer.
- Use targeted tests plus one final TypeScript typecheck. Do not run the full test suite or production build by default.
- Stop after commits, targeted verification, and a review-ready report. Do not merge or push from the worktree.

---

## File Structure

Create:

- `src/cli/navi.ts`
  - Customer-facing Navi command dispatcher. Supports `init`, `setup`, and `doctor`; never starts Along runtime.
- `src/cli/navi-global.ts`
  - Global bootstrap block rendering, managed-region planning, plugin preflight, dry-run/write/remove behavior, and atomic global AGENTS writes.
- `src/cli/navi-doctor.ts`
  - Read-only inspection of CLI/plugin/bootstrap/project/manifest state.
- `tests/cli/navi-command.test.ts`
  - Navi command dispatch and usage behavior.
- `tests/cli/navi-global.test.ts`
  - Pure managed-region planning plus safe filesystem setup behavior.
- `tests/cli/navi-doctor.test.ts`
  - Read-only doctor checks and rendering.

Modify:

- `src/cli/index.ts`
  - Retain only historical `along start` behavior.
- `package.json`
  - Route `navi` and the `npm run navi` script to `src/cli/navi.ts`; retain `along` on `src/cli/index.ts`.
- `tests/mcp/working-thread-package.test.ts`
  - Assert split entrypoints and direct Node execution of `navi init`.
- `.agents/skills/along-working-thread/SKILL.md`
  - Add the minimal global-bootstrap/project-local handoff contract and shorten discovery metadata.
- `.agents/skills/along-working-thread/agents/openai.yaml`
  - Use concise trigger-first metadata while keeping implicit invocation best effort.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Document the complete bootstrap boundary and first-use behavior.
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact copy of the canonical skill.
- `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`
  - Exact copy of canonical agent metadata.
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact copy of the canonical reference.
- `plugins/along-working-thread/.codex-plugin/plugin.json`
  - Reduce default prompts to three and tighten discovery descriptions.
- `tests/skills/along-working-thread-skill.test.ts`
  - Assert bootstrap wording, metadata limits, and source/package synchronization.
- `README.md`
  - Add the source-alpha setup-once, approve-init-once path.
- `README.zh-CN.md`
  - Keep the Chinese public setup narrative aligned.
- `plugins/along-working-thread/README.md`
  - Document the package prerequisite and global/bootstrap/project-local boundary.
- `docs/along/project-maps/navi-project-init.md`
  - Document global setup separately from project init.
- `docs/along/navi-product-debt.md`
  - Record the bootstrap gap as addressed by an always-visible global instruction layer, while public distribution remains open.

Do not modify:

- `src/cli/navi-init.ts` except for a compile-only import/interface adjustment that becomes strictly necessary after entrypoint separation.
- `tests/cli/navi-init.test.ts` unless that adjustment changes an existing exported interface.
- `src/web/**`, `src/mcp/**`, server/runtime modules, release notes, changelog, or alpha.14 files.

---

### Task 1: Separate Navi And Along Entrypoints

**Files:**
- Create: `src/cli/navi.ts`
- Create: `tests/cli/navi-command.test.ts`
- Modify: `src/cli/index.ts`
- Modify: `package.json`
- Modify: `tests/mcp/working-thread-package.test.ts`

**Interfaces:**
- Consumes: `runNaviInitCli(args: string[], io?: NaviInitIo): Promise<number>` from `src/cli/navi-init.ts`.
- Produces:
  - `NaviCliIo`
  - `runNaviCli(args: string[], io?: NaviCliIo): Promise<number>`
  - `NAVI_USAGE`
  - separate package bins: `navi -> src/cli/navi.ts`, `along -> src/cli/index.ts`.

- [ ] **Step 1: Write failing package-wiring and dispatch tests**

Create `tests/cli/navi-command.test.ts` with an init-dispatch test and a no-runtime-default test:

```ts
import { describe, expect, it, vi } from "vitest";
import { NAVI_USAGE, runNaviCli } from "../../src/cli/navi";

describe("Navi command dispatcher", () => {
  it("dispatches init without exposing the Along runtime", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const runInit = vi.fn(async () => 0);

    const code = await runNaviCli(["init", "--target", "/tmp/demo"], {
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
      runInit,
    });

    expect(code).toBe(0);
    expect(runInit).toHaveBeenCalledWith(["--target", "/tmp/demo"]);
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toBe("");
  });

  it("shows Navi usage instead of starting Along when no command is given", async () => {
    const stderr: string[] = [];

    const code = await runNaviCli([], {
      stdout: () => undefined,
      stderr: (text) => stderr.push(text),
      runInit: async () => 0,
    });

    expect(code).toBe(1);
    expect(stderr.join("")).toContain(NAVI_USAGE);
    expect(stderr.join("")).not.toContain("along start");
  });
});
```

Update the first test in `tests/mcp/working-thread-package.test.ts` to require:

```ts
expect(packageJson.scripts.navi).toBe("tsx src/cli/navi.ts");
expect(packageJson.bin).toEqual({
  navi: "src/cli/navi.ts",
  along: "src/cli/index.ts",
});
```

Update the direct Node execution test to run `src/cli/navi.ts`.

- [ ] **Step 2: Run the focused tests and confirm red state**

Run:

```bash
npm test -- tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
```

Expected: FAIL because `src/cli/navi.ts` does not exist and package bins still share `index.ts`.

- [ ] **Step 3: Add the standalone Navi dispatcher**

Create `src/cli/navi.ts`:

```ts
#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { runNaviInitCli } from "./navi-init";

export const NAVI_USAGE = "Usage: navi <init|setup|doctor> [options]";

export interface NaviCliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  runInit: (args: string[]) => Promise<number>;
}

const DEFAULT_IO: NaviCliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  runInit: runNaviInitCli,
};

export async function runNaviCli(args: string[], io: NaviCliIo = DEFAULT_IO): Promise<number> {
  const [command, ...commandArgs] = args;

  if (command === "init") {
    return io.runInit(commandArgs);
  }

  io.stderr(`${NAVI_USAGE}\n`);
  return 1;
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  process.exit(await runNaviCli(process.argv.slice(2)));
}
```

This task intentionally advertises future `setup` and `doctor` commands in usage but returns usage until later tasks wire them. It must never import server/runtime modules.

- [ ] **Step 4: Make the existing entrypoint Along-only**

Remove the `init` branch from `src/cli/index.ts`. Keep `start` as its default and change its unknown-command error to:

```ts
console.error(`Unknown Along command "${command}". Use: along start`);
```

Do not change the server spawn, port, or browser-open behavior.

- [ ] **Step 5: Split package scripts and bins**

Update `package.json`:

```json
"scripts": {
  "navi": "tsx src/cli/navi.ts"
},
"bin": {
  "navi": "src/cli/navi.ts",
  "along": "src/cli/index.ts"
}
```

Keep every unrelated script and dependency unchanged.

- [ ] **Step 6: Run focused tests and direct dry-run**

Run:

```bash
npm test -- tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
node src/cli/navi.ts init --target /tmp
```

Expected: tests PASS; direct command exits 0, prints `Navi init preview`, and does not start a server.

- [ ] **Step 7: Commit Task 1**

```bash
git add src/cli/navi.ts src/cli/index.ts package.json tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
git commit -m "refactor: separate navi and along cli entrypoints"
```

---

### Task 2: Add Pure Global Bootstrap Planning

**Files:**
- Create: `src/cli/navi-global.ts`
- Create: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Produces:
  - `NAVI_GLOBAL_BLOCK_START`
  - `NAVI_GLOBAL_BLOCK_END`
  - `renderGlobalBootstrapBlock(): string`
  - `GlobalSetupOperation = "install" | "remove"`
  - `GlobalAgentsActionKind = "create" | "modify" | "remove" | "skip" | "conflict"`
  - `planGlobalAgentsContent(existing: string | undefined, operation: GlobalSetupOperation): GlobalAgentsAction`

- [ ] **Step 1: Write failing pure-planning tests**

Create tests covering the bootstrap wording and every managed-region state:

```ts
import { describe, expect, it } from "vitest";
import {
  NAVI_GLOBAL_BLOCK_END,
  NAVI_GLOBAL_BLOCK_START,
  planGlobalAgentsContent,
  renderGlobalBootstrapBlock,
} from "../../src/cli/navi-global";

describe("Navi global bootstrap planning", () => {
  it("renders only first-use routing responsibilities", () => {
    const block = renderGlobalBootstrapBlock();

    expect(block).toContain(NAVI_GLOBAL_BLOCK_START);
    expect(block).toContain("broad progress, next-step, stop, wait, continue, confusion, or plan-reliability");
    expect(block).toContain("project-local Navi guidance");
    expect(block).toContain("provisional judgment");
    expect(block).toContain("ask whether to initialize");
    expect(block).toContain("keep narrow factual and bounded execution requests quiet");
    expect(block).toContain("do not repeat the reminder in the same session after the user declines");
    expect(block).toContain("Do not draw a full Progress Map or Rhythm Map");
    expect(block).toContain("Do not write files or run navi init automatically");
    expect(block).not.toContain("Product Stage");
  });

  it("creates a block without changing existing bytes", () => {
    const existing = "# User instructions\n\nKeep my existing rules.\n";
    const action = planGlobalAgentsContent(existing, "install");

    expect(action.kind).toBe("modify");
    expect(action.previousContent).toBe(existing);
    expect(action.content?.startsWith(existing)).toBe(true);
  });

  it("skips the exact current block", () => {
    const block = `${renderGlobalBootstrapBlock()}\n`;
    expect(planGlobalAgentsContent(block, "install").kind).toBe("skip");
  });

  it("removes only the exact managed region", () => {
    const before = "before\n";
    const after = "after\n";
    const existing = `${before}${renderGlobalBootstrapBlock()}\n${after}`;
    const action = planGlobalAgentsContent(existing, "remove");

    expect(action.kind).toBe("remove");
    expect(action.content).toBe(`${before}${after}`);
  });

  it.each([
    `${NAVI_GLOBAL_BLOCK_START}\nincomplete`,
    `${NAVI_GLOBAL_BLOCK_END}\nend only`,
    `${renderGlobalBootstrapBlock()}\n${renderGlobalBootstrapBlock()}`,
    `${NAVI_GLOBAL_BLOCK_START}\nuser-edited content\n${NAVI_GLOBAL_BLOCK_END}`,
  ])("rejects unsafe or user-modified managed regions", (existing) => {
    expect(planGlobalAgentsContent(existing, "install").kind).toBe("conflict");
    expect(planGlobalAgentsContent(existing, "remove").kind).toBe("conflict");
  });
});
```

- [ ] **Step 2: Run the test and confirm red state**

Run:

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: FAIL because `src/cli/navi-global.ts` does not exist.

- [ ] **Step 3: Define bootstrap constants, action types, and renderer**

Create `src/cli/navi-global.ts` with these public types:

```ts
export const NAVI_GLOBAL_BLOCK_START = "<!-- NAVI:GLOBAL-BOOTSTRAP:START -->";
export const NAVI_GLOBAL_BLOCK_END = "<!-- NAVI:GLOBAL-BOOTSTRAP:END -->";

export type GlobalSetupOperation = "install" | "remove";
export type GlobalAgentsActionKind = "create" | "modify" | "remove" | "skip" | "conflict";

export interface GlobalAgentsAction {
  kind: GlobalAgentsActionKind;
  summary: string;
  content?: string;
  previousContent?: string;
}
```

Render a compact block with this semantic content:

```ts
export function renderGlobalBootstrapBlock(): string {
  return `${NAVI_GLOBAL_BLOCK_START}
Navi global bootstrap only:
- Keep narrow factual checks and clear bounded execution requests quiet.
- For broad progress, next-step, stop, wait, continue, confusion, or plan-reliability questions, check whether the active project has project-local Navi guidance.
- If project-local Navi guidance is missing, avoid a confident stable map. Give at most one short provisional judgment, identify the likely project root, and ask whether to initialize that project with Navi.
- Do not draw a full Progress Map or Rhythm Map from the global bootstrap.
- Do not write files or run navi init automatically. If the user declines, do not repeat the reminder in the same session.
- When project-local Navi guidance exists, let that guidance and the installed Navi skill own full supervision behavior.
${NAVI_GLOBAL_BLOCK_END}`;
}
```

Do not include full map templates, Work Mode definitions, coordination rules, or release behavior in this block.

- [ ] **Step 4: Implement exact managed-region planning**

Implement `planGlobalAgentsContent()` using index positions and exact block equality, not regex replacement. Requirements:

- zero markers: create/append for install, skip for remove;
- one complete exact block: skip for install, remove for remove;
- a complete recognized older generated block may be upgraded only if it is listed in a `KNOWN_GLOBAL_BOOTSTRAP_BLOCKS` constant;
- any unrecognized content inside markers is a conflict;
- duplicate, reversed, nested, or incomplete markers are conflicts;
- content outside the managed region is copied byte-for-byte;
- when appending, add only the minimum newline separator needed.

Use this helper shape:

```ts
function markerOffsets(text: string): { starts: number[]; ends: number[] } {
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_START, index)) !== -1) {
    starts.push(index);
    index += NAVI_GLOBAL_BLOCK_START.length;
  }

  index = 0;
  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_END, index)) !== -1) {
    ends.push(index);
    index += NAVI_GLOBAL_BLOCK_END.length;
  }

  return { starts, ends };
}
```

- [ ] **Step 5: Run the pure tests**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: PASS with no filesystem writes.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/cli/navi-global.ts tests/cli/navi-global.test.ts
git commit -m "feat: plan navi global bootstrap lifecycle"
```

---

### Task 3: Add Safe Setup Preflight And Atomic Writes

**Files:**
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Consumes: pure managed-region interfaces from Task 2.
- Produces:
  - `NaviPluginStatus`
  - `GlobalSetupPlan`
  - `GlobalSetupOptions`
  - `NaviSetupIo`
  - `inspectInstalledNaviPlugin(runCommand?): Promise<NaviPluginStatus>`
  - `buildGlobalSetupPlan(options, dependencies?): Promise<GlobalSetupPlan>`
  - `applyGlobalSetupPlan(plan): Promise<void>`
  - `renderGlobalSetupPlan(plan): string`
  - `runNaviSetupCli(args, io?, dependencies?): Promise<number>`

- [ ] **Step 1: Add failing setup filesystem tests**

Extend `tests/cli/navi-global.test.ts` with disposable `CODEX_HOME` fixtures and a plugin stub:

```ts
const enabledPlugin = {
  installed: true,
  enabled: true,
  version: "0.1.0",
  sourcePath: "/tmp/personal/along-working-thread",
  raw: "along-working-thread@personal  installed, enabled  0.1.0  /tmp/personal/along-working-thread",
};

it("keeps setup dry-run read-only", async () => {
  const codexHome = await makeTempCodexHome();
  const plan = await buildGlobalSetupPlan(
    { codexHome, write: false, remove: false },
    { inspectPlugin: async () => enabledPlugin },
  );

  await applyGlobalSetupPlan(plan);

  expect(plan.action.kind).toBe("create");
  await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
});

it("refuses setup writes when the plugin is unavailable", async () => {
  const codexHome = await makeTempCodexHome();
  const plan = await buildGlobalSetupPlan(
    { codexHome, write: true, remove: false },
    {
      inspectPlugin: async () => ({
        installed: false,
        enabled: false,
        raw: "",
      }),
    },
  );

  await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/plugin.*installed and enabled/i);
  await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
});
```

Add tests for:

- create on `--write`;
- exact skip;
- recognized update preserving outside bytes;
- removal preserving outside bytes;
- incomplete/duplicate/user-modified conflict with no write;
- symlinked `AGENTS.md` refusal;
- symlinked parent refusal;
- file changed between plan and apply refusal;
- temporary-file cleanup when rename fails;
- setup output says this configures global discovery and does not initialize a project;
- remove output says plugin, CLI, and project-local files remain.

- [ ] **Step 2: Run focused tests and confirm red state**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: FAIL because setup planning, plugin preflight, and filesystem application are not implemented.

- [ ] **Step 3: Implement plugin status parsing without shell execution**

Use `execFile` or `spawn` with argument arrays. Never construct a shell command string.

```ts
export interface NaviPluginStatus {
  installed: boolean;
  enabled: boolean;
  version?: string;
  sourcePath?: string;
  raw: string;
}

export type RunCommand = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;
```

`inspectInstalledNaviPlugin()` runs `codex plugin list`, locates the row whose plugin id starts with `along-working-thread@`, and returns installed/enabled/version/source data. Treat command failure or an absent row as unavailable, preserving stderr in `raw` for diagnostics.

Do not run `codex plugin add`, remove, marketplace mutation, npm installation, or PATH edits.

- [ ] **Step 4: Implement setup plan construction**

Define:

```ts
export interface GlobalSetupOptions {
  codexHome?: string;
  write?: boolean;
  remove?: boolean;
}

export interface GlobalSetupPlan {
  mode: "dry-run" | "write";
  operation: GlobalSetupOperation;
  codexHome: string;
  agentsPath: string;
  plugin: NaviPluginStatus;
  action: GlobalAgentsAction;
}
```

`buildGlobalSetupPlan()` resolves `codexHome` from the option, then `process.env.CODEX_HOME`, then `path.join(os.homedir(), ".codex")`. It reads `AGENTS.md` if present, rejects a non-directory CODEX_HOME, inspects the plugin, and computes the pure action.

Install plans with `write: true` are not applicable unless `plugin.installed && plugin.enabled`. Removal remains allowed when the plugin is absent because removing a stale bootstrap is a valid cleanup operation.

- [ ] **Step 5: Implement physical-path preflight and atomic application**

`applyGlobalSetupPlan()` returns immediately for dry-run and skip. For write actions:

1. Re-read the target and require exact equality with `action.previousContent`.
2. Reject symlinked CODEX_HOME, target, or any existing parent component.
3. Write the new content to a same-directory temporary file using `flag: "wx"` and mode `0o600` for a new file or the existing file mode for replacement.
4. `fsync` and close the temporary file.
5. Re-check the original target has not changed.
6. Atomically rename the temporary file over the target, or unlink the exact target for a remove action whose resulting content is empty.
7. Remove the temporary file in `finally` when rename did not complete.

Never follow a target symlink. Never remove `$CODEX_HOME/AGENTS.md` when it contains non-Navi content.

- [ ] **Step 6: Implement setup CLI parsing and rendering**

Accept only:

```text
navi setup
navi setup --write
navi setup --remove
navi setup --remove --write
```

Unknown flags return code 1 and print:

```text
Usage: navi setup [--write] [--remove]
```

Dry-run output must name the target path, plugin preflight, planned action, no-write status, and exact apply command. Write output must report only the action actually applied.

- [ ] **Step 7: Run Task 3 tests**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: PASS. Inspect the test temp roots afterward to confirm cleanup occurs in `afterEach`.

- [ ] **Step 8: Commit Task 3**

```bash
git add src/cli/navi-global.ts tests/cli/navi-global.test.ts
git commit -m "feat: add safe navi global setup"
```

---

### Task 4: Add Read-Only Doctor And Complete Command Dispatch

**Files:**
- Create: `src/cli/navi-doctor.ts`
- Create: `tests/cli/navi-doctor.test.ts`
- Modify: `src/cli/navi.ts`
- Modify: `tests/cli/navi-command.test.ts`

**Interfaces:**
- Consumes:
  - `inspectInstalledNaviPlugin()` and bootstrap constants from `navi-global.ts`.
  - `NAVI_AGENTS_BLOCK_START` from `navi-init.ts`.
- Produces:
  - `DoctorCheckStatus = "pass" | "warn" | "fail"`
  - `DoctorCheck`
  - `NaviDoctorReport`
  - `buildNaviDoctorReport(options, dependencies?): Promise<NaviDoctorReport>`
  - `renderNaviDoctorReport(report): string`
  - `runNaviDoctorCli(args, io?, dependencies?): Promise<number>`
  - completed `runNaviCli()` dispatch for `init`, `setup`, and `doctor`.

- [ ] **Step 1: Write failing doctor tests**

Create `tests/cli/navi-doctor.test.ts`:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";

it("reports healthy global and project-local setup without writing", async () => {
  const fixture = await makeDoctorFixture();
  await fs.writeFile(path.join(fixture.codexHome, "AGENTS.md"), `${renderGlobalBootstrapBlock()}\n`);
  await fs.writeFile(path.join(fixture.projectDir, "AGENTS.md"), "<!-- NAVI:START -->\nlocal\n<!-- NAVI:END -->\n");
  const before = await snapshotTree(fixture.root);

  const report = await buildNaviDoctorReport(
    {
      codexHome: fixture.codexHome,
      projectDir: fixture.projectDir,
      packageRoot: fixture.packageRoot,
    },
    { inspectPlugin: async () => enabledPlugin },
  );

  expect(report.checks.find((check) => check.id === "plugin")?.status).toBe("pass");
  expect(report.checks.find((check) => check.id === "global-bootstrap")?.status).toBe("pass");
  expect(report.checks.find((check) => check.id === "project-init")?.status).toBe("pass");
  expect(await snapshotTree(fixture.root)).toEqual(before);
});

it("reports excessive default prompts as a manifest failure", async () => {
  const fixture = await makeDoctorFixture({ defaultPrompts: ["1", "2", "3", "4"] });
  const report = await buildNaviDoctorReport(
    {
      codexHome: fixture.codexHome,
      projectDir: fixture.projectDir,
      packageRoot: fixture.packageRoot,
    },
    { inspectPlugin: async () => enabledPlugin },
  );

  expect(report.checks.find((check) => check.id === "manifest")?.status).toBe("fail");
  expect(renderNaviDoctorReport(report)).toContain("defaultPrompt must contain at most 3 entries");
});
```

Also test:

- missing/disabled plugin;
- missing global block;
- damaged global markers;
- uninitialized current project;
- exact initialized project marker;
- package/cache drift when both roots are inspectable;
- unavailable cache reported as warn, not crash;
- `doctor` rejects all command-line options;
- output contains one smallest repair command per failed check;
- report construction leaves the complete fixture tree unchanged.

- [ ] **Step 2: Extend command tests for setup and doctor injection**

Change `NaviCliIo` to include:

```ts
runSetup: (args: string[]) => Promise<number>;
runDoctor: (args: string[]) => Promise<number>;
```

Add tests proving `runNaviCli(["setup", "--write"])` calls only `runSetup(["--write"])`, `doctor` calls only `runDoctor([])`, and `start` returns usage without importing or starting Along runtime.

Update every Task 1 `NaviCliIo` fixture to provide inert `runSetup` and `runDoctor` functions so the expanded interface remains type-consistent:

```ts
runSetup: async () => 0,
runDoctor: async () => 0,
```

- [ ] **Step 3: Run focused tests and confirm red state**

```bash
npm test -- tests/cli/navi-doctor.test.ts tests/cli/navi-command.test.ts
```

Expected: FAIL because doctor and completed dispatch do not exist.

- [ ] **Step 4: Implement structured doctor checks**

Use these types:

```ts
export type DoctorCheckStatus = "pass" | "warn" | "fail";

export interface DoctorCheck {
  id: "cli" | "plugin" | "manifest" | "global-bootstrap" | "package-cache" | "project-init";
  status: DoctorCheckStatus;
  summary: string;
  repair?: string;
}

export interface NaviDoctorReport {
  codexHome: string;
  projectDir: string;
  checks: DoctorCheck[];
}
```

Doctor checks must be deterministic from injected paths and command results. Directory comparison may recursively compare the small plugin package only when both package and cache paths exist. It must skip `.git`, `node_modules`, and platform metadata. It must never copy, remove, install, or rewrite anything.

Use explicit repair strings:

- missing global bootstrap: `Run navi setup, review the preview, then run navi setup --write.`
- uninitialized project: `Run navi init, review the preview, then run navi init --write.`
- excessive prompts: `Reduce plugin interface.defaultPrompt to at most 3 entries.`
- missing plugin: `Install and enable the source-alpha Navi plugin before running navi setup --write.`

- [ ] **Step 5: Implement doctor CLI and rendering**

`runNaviDoctorCli()` accepts no options. It returns 1 for invalid arguments, otherwise prints the report and returns 1 only when any check is `fail`; warnings keep exit code 0 so source-alpha cache limitations do not make doctor unusable.

Render one line per check:

```text
[pass] plugin: Navi plugin is installed and enabled (0.1.0).
[warn] project-init: This project does not have project-local Navi guidance.
  Repair: Run navi init, review the preview, then run navi init --write.
```

- [ ] **Step 6: Complete Navi command dispatch**

Import `runNaviSetupCli` and `runNaviDoctorCli` into `src/cli/navi.ts`. Extend default IO and switch behavior:

```ts
if (command === "setup") {
  return io.runSetup(commandArgs);
}

if (command === "doctor") {
  return io.runDoctor(commandArgs);
}
```

Keep `init` unchanged and reject `start`.

- [ ] **Step 7: Run Task 4 tests**

```bash
npm test -- tests/cli/navi-doctor.test.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts
```

Expected: PASS with no writes outside temporary fixture roots.

- [ ] **Step 8: Commit Task 4**

```bash
git add src/cli/navi.ts src/cli/navi-doctor.ts tests/cli/navi-command.test.ts tests/cli/navi-doctor.test.ts
git commit -m "feat: add navi bootstrap doctor"
```

---

### Task 5: Tighten Discovery Metadata And Bootstrap Contract

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/agents/openai.yaml`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- Modify: `plugins/along-working-thread/.codex-plugin/plugin.json`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: global bootstrap contract and command names from Tasks 2-4.
- Produces: concise best-effort skill discovery metadata and exact source/package copies.

- [ ] **Step 1: Write failing metadata and contract tests**

Update the manifest assertions to require exactly these three prompts:

```ts
expect(manifest.interface.defaultPrompt).toEqual([
  "Show where this project stands, what comes next, and what I need to decide.",
  "Should we continue, stop, wait, or move to the next stage?",
  "Check whether this project needs Navi initialization before giving a stable map.",
]);
expect(manifest.interface.defaultPrompt).toHaveLength(3);
```

Replace repetitive metadata assertions with:

```ts
for (const metadata of [canonicalMetadata, pluginMetadata]) {
  expect(metadata).toContain("broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability");
  expect(metadata).toContain("keep narrow tasks quiet");
  expect(metadata).toContain("allow_implicit_invocation: true");
  expect(metadata.length).toBeLessThan(700);
}
```

Update the existing frontmatter test so it asserts the new compact trigger-first description instead of requiring `Working Thread continuity`, `non-expert progress`, and every former Chinese phrase separately. Keep `any active Codex project`, `what's next`, `where are we`, `接下来`, `现在到哪`, and `继续吧` as the exact routing evidence.

Update the existing Challenge Layer package test so Challenge behavior remains asserted through `longDescription`, the skill/reference, and package README, but no longer requires `Challenge Layer` in `shortDescription` or challenge-specific entries in `defaultPrompt`.

Update the existing Navi Progress Map package test so it checks the new three-prompt set from Step 1 rather than the removed seven-prompt array. Do not weaken its non-runtime, non-expert, map, or public-boundary assertions.

Add bootstrap-boundary assertions across the canonical skill and reference:

```ts
for (const text of [skill, reference]) {
  expect(text).toContain("global bootstrap");
  expect(text).toContain("project-local Navi guidance");
  expect(text).toContain("provisional judgment");
  expect(text).toContain("do not repeat the init reminder in the same session");
  expect(text).toContain("prompt-backed, not a runtime interceptor");
}
```

- [ ] **Step 2: Run the skill test and confirm red state**

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL on seven default prompts, repetitive metadata, and missing global-bootstrap wording.

- [ ] **Step 3: Shorten canonical skill discovery metadata**

Use this frontmatter description in the canonical skill:

```yaml
description: Use for broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability questions in any active Codex project, including what's next, where are we, 接下来, 现在到哪, and 继续吧; keeps narrow tasks quiet.
```

Use this canonical `agents/openai.yaml`:

```yaml
interface:
  display_name: Navi
  short_description: Use Navi for broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability questions; keep narrow tasks quiet.
  default_prompt: Show where this project stands, what comes next, and what I need to decide.

policy:
  allow_implicit_invocation: true
```

- [ ] **Step 4: Add the minimal skill rule and full reference contract**

Add a compact skill rule near the existing alpha.13 init boundary:

```markdown
- The global bootstrap is an always-visible first-use routing instruction, not a second copy of Navi. When it finds project-local guidance, full supervision belongs to this skill and the project record.
- When a global-bootstrap prompt reaches Navi without project-local guidance, give at most one provisional judgment, identify or confirm the project root, and ask before project initialization. Do not repeat the init reminder in the same session after the user declines.
- The bootstrap is prompt-backed, not a runtime interceptor, background watcher, or always-on presence.
```

Add a full `Global Bootstrap And Project Handoff` section to the reference covering:

- global setup versus project init;
- quietness gate;
- provisional answer budget;
- project-root ambiguity;
- same-session decline behavior;
- no automatic init;
- no MCP/runtime guarantee;
- project-local takeover after init.

- [ ] **Step 5: Reduce plugin manifest prompts and descriptions**

Set `interface.defaultPrompt` to the exact three prompts from Step 1. Use a concise short description:

```json
"shortDescription": "Project progress, next-step, stop/wait, and plan-reliability guidance."
```

Keep the existing plugin name, version, author, category, capabilities, compatibility id, and non-runtime boundary.

- [ ] **Step 6: Sync canonical files into the package copy**

Copy the canonical skill, reference, and agent metadata byte-for-byte into the package paths. Do not edit package copies independently.

- [ ] **Step 7: Run skill and package verification**

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
```

Expected: PASS, including plugin manifest validation and exact source/package drift checks.

- [ ] **Step 8: Commit Task 5**

```bash
git add .agents/skills/along-working-thread plugins/along-working-thread/.codex-plugin/plugin.json plugins/along-working-thread/skills/along-working-thread tests/skills/along-working-thread-skill.test.ts
git commit -m "fix: add navi bootstrap discovery contract"
```

---

### Task 6: Document The Source-Alpha Setup Without Exposing Internal Complexity

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/along-working-thread/README.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/navi-product-debt.md`
- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**
- Consumes: final commands and boundaries from Tasks 1-5.
- Produces: one coherent source-alpha onboarding path and aligned English/Chinese narratives.

- [ ] **Step 1: Write failing documentation assertions**

Add assertions requiring the root READMEs and plugin README to contain:

```text
Setup once -> approve project init once -> use natural language
npm link
navi doctor
navi setup
navi setup --write
navi init
navi init --write
```

Assert all three explain:

- source alpha still requires explicit plugin installation;
- setup does not initialize a target project;
- init does not reinstall the plugin;
- `doctor` is troubleshooting, not a normal daily step;
- public npm/marketplace/one-click installation remains out of scope;
- `src/web` is not the Navi alpha UI.

Assert `navi-project-init.md` distinguishes global setup from project init and says an agent may run `navi init --write` only after explicit user approval.

Assert product debt no longer says the bootstrap gap is wholly unaddressed; it should say source-alpha bootstrap is implemented while public distribution remains open.

- [ ] **Step 2: Run the skill test and confirm red state**

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL on missing setup/doctor/onboarding wording.

- [ ] **Step 3: Update the root English README**

Add a compact `Source-alpha setup` section with this primary sequence:

```bash
npm install
npm link
navi doctor
navi setup
navi setup --write
```

Immediately explain:

```text
Setup once -> approve project init once -> use natural language
```

Keep explicit plugin installation as a prerequisite link to the package README. Keep manual cache/marketplace details out of the primary sequence and in troubleshooting.

- [ ] **Step 4: Update the Chinese README with the same product contract**

Use the same commands and preserve the distinction:

```text
全局 setup 一次 -> 每个项目批准 init 一次 -> 之后使用自然语言
```

Do not translate command names, flags, marker names, package ids, or file paths.

- [ ] **Step 5: Update package, init, and debt documentation**

In the plugin README, explain that global plugin installation is a source-alpha prerequisite and that the bootstrap block is an always-visible routing layer, not full Navi behavior.

In `navi-project-init.md`, document:

```text
navi setup = global first-use discovery
navi init = one target project's reliable guidance
```

In product debt, mark first-use bootstrap as source-alpha addressed only. Keep npm publication, public marketplace, stable installer, PATH management, and one-click sync open.

- [ ] **Step 6: Run documentation and package tests**

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
```

Expected: PASS with English/Chinese setup narratives aligned and package copies exact.

- [ ] **Step 7: Commit Task 6**

```bash
git add README.md README.zh-CN.md plugins/along-working-thread/README.md docs/along/project-maps/navi-project-init.md docs/along/navi-product-debt.md tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: add navi source alpha bootstrap path"
```

---

## Final Targeted Verification

After all task commits, run only:

```bash
npm test -- tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/mcp/working-thread-package.test.ts
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check "$(git merge-base main HEAD)"..HEAD
git status --short --branch
```

Expected:

- all listed targeted tests pass;
- package validator and source/package drift checks pass;
- TypeScript typecheck passes;
- no whitespace errors;
- worktree is clean;
- commits touch only files named in this plan;
- no real global or external-project files were modified.

Do not run full `npm test`, `npm run build`, browser validation, release verification, npm packing, tag, push, publish, or GitHub Release checks.

## Worktree Return Format

The implementation worktree must report:

- commit SHAs and subjects;
- changed files grouped by task;
- exact targeted test counts and command results;
- plugin verifier and typecheck results;
- confirmation that real `$CODEX_HOME`, personal plugin cache/source, `engineering_loop`, and `sub_ag_ski` were untouched;
- residual risks, especially prompt-backed reliability and source-linked CLI distribution;
- a stop at the main-session read-only review/merge decision.

## Post-Merge Calibration Gate

Real calibration is not performed from the implementation worktree.

After main-session review and merge, require explicit approval before:

1. relinking or updating the real global CLI;
2. updating the personal plugin source/cache;
3. running `navi setup --write` against the real `$CODEX_HOME/AGENTS.md`;
4. initializing `engineering_loop/engineering-loop-kit-transition-package`;
5. modifying either real target project.

Then run the bounded calibration from the approved design:

- `engineering_loop`: one uninitialized broad prompt, one approved init, one post-init fresh prompt;
- `sub_ag_ski`: one initialized broad prompt and one narrow quietness prompt.

Stop when those decisions are supported. Do not expand into release checks or additional samples.
