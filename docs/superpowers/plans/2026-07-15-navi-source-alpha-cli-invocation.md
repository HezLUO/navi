# Navi Source-Alpha CLI Invocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every source-alpha doctor, setup, and project-init follow-up use a Navi command proven executable in the active Codex environment, without turning Navi into a PATH manager or installer.

**Architecture:** Add one process-local invocation resolver and POSIX command renderer at the CLI Command/Adapter boundary. Resolve the context once in the dispatcher, pass it into setup and doctor, and keep init's existing no-generic-apply contract while routing doctor's init guidance through the shared renderer. Preserve migration stages, setup transactions, project-init fingerprints, and all approval boundaries.

**Tech Stack:** TypeScript, Node.js filesystem and path APIs, Vitest, existing Navi CLI modules and source-alpha documentation.

## Global Constraints

- Work in a Codex-managed isolated worktree created from the reviewed plan commit; do not implement on `main`.
- Use TDD for every behavior change: observe the focused RED failure before editing production code.
- Create one Invocation Context per recognized top-level CLI invocation. Do not add per-command PATH probes.
- Prefer a trustworthy bare `navi`, then a verified absolute current entrypoint, then a verified source invocation.
- Treat missing or mismatched bare-command reachability as a warning when a verified fallback exists; fail only when no verified invocation exists.
- Verify identity through read-only path, realpath, package-root, bin, and npm-lifecycle evidence. Never execute an unknown PATH candidate.
- Keep command prefixes as structured tokens and quote them only at render time for the documented POSIX shell surface.
- Do not edit PATH, shell profiles, Codex configuration, npm prefix state, plugin state, target projects, or global bootstrap files during implementation or automated verification.
- Do not add a launcher installer, receipt, cache, database, daemon, public npm release, public marketplace release, Windows installer, or cross-shell abstraction.
- Do not change plugin migration stages, setup transaction safety, init plan fingerprints, write flags, approval gates, package metadata, version, changelog, release notes, tag, publication, or Historical Along behavior.
- `navi init` currently does not print a generic apply command by design. Do not add one. Doctor's project-init repair guidance is the active init self-reference that must use the shared renderer.
- Use only the targeted verification listed in this plan. Do not run full `npm test`, tag checks, release checks, or release preparation.
- The approved design is `docs/superpowers/specs/2026-07-15-navi-source-alpha-cli-invocation-design.md`.
- The implementation lane may create the four local task commits explicitly listed below. Stop before merge, push, tag, release, global mutation, target-project mutation, or calibration.
- After the implementation lane reports review-ready, the parent creates a fresh independent read-only validation task from the exact base and candidate HEAD. The validator receives the spec, plan, diff, and bounded commands, but not the executor's reasoning transcript.
- A validation result gates integration only. It does not require the Main Thread to stop unrelated approved design or supervision work.

---

## File Structure

**Create:** `src/cli/navi-invocation.ts`
- Owns invocation reachability, PATH candidate identity, fallback selection, and POSIX command rendering.
- Does not parse plugins, make migration decisions, or write environment state.

**Create:** `tests/cli/navi-invocation.test.ts`
- Covers same-source PATH resolution, mismatch, absolute and npm fallback, unavailable state, and shell quoting.

**Modify:** `src/cli/navi.ts`
- Resolves one Invocation Context for a recognized command and passes the same object to the selected handler.

**Modify:** `tests/cli/navi-command.test.ts`
- Proves one-time resolution and handler propagation without reading the test runner's PATH.

**Modify:** `src/cli/navi-global.ts`
- Uses the shared renderer for setup apply, recovery, removal, and rerun guidance.
- Leaves global bootstrap content and transaction domain behavior unchanged.

**Modify:** `tests/cli/navi-global.test.ts`
- Covers fallback rendering and unavailable-command blocking while preserving transaction precedence.

**Modify:** `src/cli/navi-doctor.ts`
- Replaces CLI-root-only truth with pass/warn/fail invocation reachability.
- Uses the shared renderer for doctor, setup, and init follow-up commands.

**Modify:** `tests/cli/navi-doctor.test.ts`
- Covers reachability semantics, stage independence, transaction precedence, and fallback rendering for setup and init guidance.

**Verify only:** `src/cli/navi-init.ts`, `src/cli/navi-init-plan.ts`
- Keep the no-generic-apply and fingerprint-bound Codex-integration contract unchanged.

**Verify only:** `tests/cli/navi-init.test.ts`, `tests/cli/navi-init-plan.test.ts`
- Existing tests protect the init boundary while doctor renders project-init follow-ups.

**Modify:** `README.md`, `README.zh-CN.md`, `plugins/navi/README.md`
- Explain the repository-local doctor entry when bare `navi` is unavailable and the fallback behavior after doctor starts.

**Modify:** `docs/navi/design-history.md`
- Indexes the approved design and plan and makes this bounded bootstrap gap the current implementation gate.

**Modify:** `tests/skills/navi-capability-truthfulness.test.ts`
- Keeps the three external-reader source-alpha instructions aligned.

**Modify:** `tests/repository/current-surface.test.ts`
- Locks the active design/plan index and current bounded phase.

---

### Task 1: Resolve And Render A Verified Navi Invocation

**Files:**
- Create: `src/cli/navi-invocation.ts`
- Create: `tests/cli/navi-invocation.test.ts`

**Interfaces:**
- Produces: `NaviInvocationContext`, `NaviInvocationReachability`, `resolveNaviInvocationContext()`, `renderNaviCommand()`, and `TRUSTED_BARE_NAVI_INVOCATION`.
- Consumes: the canonical Navi package root, launched entrypoint, current `PATH`, current working directory, and npm lifecycle evidence.
- Keeps: all environment inspection injectable and read-only.

- [ ] **Step 1: Write resolver and renderer tests first**

Create `tests/cli/navi-invocation.test.ts` with real temporary files and symlinks so identity behavior is tested without invoking any discovered binary:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderNaviCommand,
  resolveNaviInvocationContext,
} from "../../src/cli/navi-invocation";

const roots: string[] = [];

async function fixture(): Promise<{ root: string; cliRoot: string; wrapper: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-invocation-"));
  roots.push(root);
  const cliRoot = path.join(root, "Navi source alpha");
  const wrapper = path.join(cliRoot, "src/cli/navi-bin.mjs");
  await fs.mkdir(path.dirname(wrapper), { recursive: true });
  await fs.writeFile(wrapper, "#!/usr/bin/env node\n");
  await fs.chmod(wrapper, 0o755);
  await fs.writeFile(path.join(cliRoot, "package.json"), JSON.stringify({
    name: "navi",
    bin: { navi: "src/cli/navi-bin.mjs" },
    scripts: { navi: "./src/cli/navi-bin.mjs" },
  }));
  return { root, cliRoot, wrapper };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("Navi invocation resolution", () => {
  it("trusts the first executable PATH candidate when it resolves to this Navi wrapper", async () => {
    const f = await fixture();
    const bin = path.join(f.root, "bin");
    await fs.mkdir(bin);
    await fs.symlink(f.wrapper, path.join(bin, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: bin,
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "pass", commandPrefix: ["navi"] });
    expect(renderNaviCommand(context, ["setup", "--write"])).toBe("navi setup --write");
  });

  it("rejects a mismatched first PATH candidate and uses the verified launched entrypoint", async () => {
    const f = await fixture();
    const bin = path.join(f.root, "bin");
    const other = path.join(f.root, "other-navi");
    await fs.mkdir(bin);
    await fs.writeFile(other, "#!/bin/sh\nexit 0\n");
    await fs.chmod(other, 0o755);
    await fs.symlink(other, path.join(bin, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: bin,
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "fallback", reason: "path-mismatch" });
    expect(context.commandPrefix).toEqual([f.wrapper]);
    expect(renderNaviCommand(context, ["doctor"])).toBe(`'${f.wrapper}' doctor`);
  });

  it("uses the verified source npm invocation when the wrapper is not directly executable", async () => {
    const f = await fixture();
    await fs.chmod(f.wrapper, 0o644);

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: "",
      cwd: f.cliRoot,
      npmLifecycleEvent: "navi",
    });

    expect(context).toMatchObject({
      reachability: "fallback",
      reason: "path-missing",
      commandPrefix: ["npm", "run", "navi", "--"],
    });
    expect(renderNaviCommand(context, ["setup", "--write"])).toBe("npm run navi -- setup --write");
  });

  it("reports unavailable when no bare, absolute, or verified npm invocation exists", async () => {
    const f = await fixture();
    await fs.chmod(f.wrapper, 0o644);

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: path.join(f.root, "unknown"),
      envPath: "",
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "unavailable", commandPrefix: undefined });
    expect(renderNaviCommand(context, ["doctor"])).toBeUndefined();
  });

  it("quotes every unsafe POSIX token without executing it", async () => {
    const f = await fixture();
    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: "",
      cwd: f.root,
    });

    expect(renderNaviCommand(context, ["init", "--target", "/tmp/James' project"])).toBe(
      `'${f.wrapper}' init --target '/tmp/James'"'"' project'`,
    );
  });
});
```

- [ ] **Step 2: Run the new test and observe RED**

Run:

```bash
npm test -- tests/cli/navi-invocation.test.ts
```

Expected: FAIL because `src/cli/navi-invocation.ts` does not exist.

- [ ] **Step 3: Implement the minimal invocation module**

Create `src/cli/navi-invocation.ts` with these exported contracts:

```ts
import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type NaviInvocationReachability = "pass" | "fallback" | "unavailable";
export type NaviInvocationReason = "bare" | "path-missing" | "path-mismatch" | "unavailable";

export interface NaviInvocationContext {
  cliRoot: string;
  entrypoint: string;
  reachability: NaviInvocationReachability;
  reason: NaviInvocationReason;
  commandPrefix?: readonly string[];
  pathCandidate?: string;
  pathBin?: string;
}

export interface NaviInvocationOptions {
  cliRoot: string;
  launchedEntrypoint: string;
  envPath?: string;
  cwd: string;
  npmLifecycleEvent?: string;
}

export interface NaviInvocationDependencies {
  access: typeof fs.access;
  realpath: typeof fs.realpath;
  readFile: typeof fs.readFile;
}

const DEFAULT_DEPENDENCIES: NaviInvocationDependencies = {
  access: fs.access,
  realpath: fs.realpath,
  readFile: fs.readFile,
};

export const TRUSTED_BARE_NAVI_INVOCATION: NaviInvocationContext = {
  cliRoot: "",
  entrypoint: "navi",
  reachability: "pass",
  reason: "bare",
  commandPrefix: ["navi"],
};

export async function resolveNaviInvocationContext(
  options: NaviInvocationOptions,
  dependencies: NaviInvocationDependencies = DEFAULT_DEPENDENCIES,
): Promise<NaviInvocationContext> {
  const cliRoot = path.resolve(options.cliRoot);
  const expectedEntrypoint = path.join(cliRoot, "src/cli/navi-bin.mjs");
  const canonicalEntrypoint = await realpathOptional(expectedEntrypoint, dependencies);
  if (!canonicalEntrypoint) {
    return {
      cliRoot,
      entrypoint: expectedEntrypoint,
      reachability: "unavailable",
      reason: "unavailable",
    };
  }
  const pathCandidate = await firstExecutableOnPath(options.envPath, dependencies);
  const pathMatches = pathCandidate === undefined
    ? false
    : await resolvesTo(pathCandidate, canonicalEntrypoint, dependencies);

  if (pathMatches) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "pass",
      reason: "bare",
      commandPrefix: ["navi"],
      pathCandidate,
      pathBin: path.dirname(pathCandidate),
    };
  }

  const launched = path.resolve(options.launchedEntrypoint);
  if (await isExecutable(launched, dependencies) && await resolvesTo(launched, canonicalEntrypoint, dependencies)) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "fallback",
      reason: pathCandidate ? "path-mismatch" : "path-missing",
      commandPrefix: [launched],
      pathBin: path.dirname(launched),
      ...(pathCandidate ? { pathCandidate } : {}),
    };
  }

  if (options.npmLifecycleEvent === "navi" && path.resolve(options.cwd) === cliRoot && await hasSourceScript(cliRoot, dependencies)) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "fallback",
      reason: pathCandidate ? "path-mismatch" : "path-missing",
      commandPrefix: ["npm", "run", "navi", "--"],
      ...(pathCandidate ? { pathCandidate, pathBin: path.dirname(pathCandidate) } : {}),
    };
  }

  return {
    cliRoot,
    entrypoint: canonicalEntrypoint,
    reachability: "unavailable",
    reason: "unavailable",
    ...(pathCandidate ? { pathCandidate, pathBin: path.dirname(pathCandidate) } : {}),
  };
}

export function renderNaviCommand(
  context: NaviInvocationContext,
  args: readonly string[],
): string | undefined {
  if (!context.commandPrefix) return undefined;
  return [...context.commandPrefix, ...args].map(quotePosixToken).join(" ");
}
```

Add private helpers with these exact behaviors:

```ts
async function firstExecutableOnPath(
  envPath: string | undefined,
  dependencies: NaviInvocationDependencies,
): Promise<string | undefined> {
  for (const directory of (envPath ?? "").split(path.delimiter).filter(Boolean)) {
    const candidate = path.join(directory, "navi");
    if (await isExecutable(candidate, dependencies)) return candidate;
  }
  return undefined;
}

async function isExecutable(candidate: string, dependencies: NaviInvocationDependencies): Promise<boolean> {
  try {
    await dependencies.access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolvesTo(
  candidate: string,
  expected: string,
  dependencies: NaviInvocationDependencies,
): Promise<boolean> {
  try {
    return await dependencies.realpath(candidate) === expected;
  } catch {
    return false;
  }
}

async function realpathOptional(
  candidate: string,
  dependencies: NaviInvocationDependencies,
): Promise<string | undefined> {
  try {
    return await dependencies.realpath(candidate);
  } catch {
    return undefined;
  }
}

async function hasSourceScript(
  cliRoot: string,
  dependencies: NaviInvocationDependencies,
): Promise<boolean> {
  try {
    const value = JSON.parse(await dependencies.readFile(path.join(cliRoot, "package.json"), "utf8")) as {
      name?: unknown;
      bin?: Record<string, unknown>;
      scripts?: Record<string, unknown>;
    };
    return value.name === "navi"
      && value.bin?.navi === "src/cli/navi-bin.mjs"
      && value.scripts?.navi === "./src/cli/navi-bin.mjs";
  } catch {
    return false;
  }
}

function quotePosixToken(token: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(token)) return token;
  return `'${token.replaceAll("'", `'"'"'`)}'`;
}
```

Do not add child-process execution, npm-prefix guessing, persistence, or PATH writes.

- [ ] **Step 4: Run focused GREEN and typecheck**

Run:

```bash
npm test -- tests/cli/navi-invocation.test.ts
npm run typecheck
```

Expected: 1 test file passes; typecheck exits 0.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/cli/navi-invocation.ts tests/cli/navi-invocation.test.ts
git commit -m "feat: resolve navi cli invocation"
```

---

### Task 2: Resolve Once And Render Setup Commands Through The Context

**Files:**
- Modify: `src/cli/navi.ts`
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-command.test.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Consumes: `resolveNaviInvocationContext()`, `renderNaviCommand()`, and `TRUSTED_BARE_NAVI_INVOCATION` from Task 1.
- Produces: dispatcher handler signatures receiving the same `NaviInvocationContext` and setup rendering that never invents a bare command.
- Keeps: setup plan construction, transaction application, plugin preflight, block ordering, and write behavior unchanged.

- [ ] **Step 1: Add failing dispatcher propagation tests**

In `tests/cli/navi-command.test.ts`, import `NaviInvocationContext`, create this fixture, and update handler assertions:

```ts
const invocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/source/Navi/src/cli/navi-bin.mjs"],
};
```

Pass an injected resolver as the third `runNaviCli()` argument:

```ts
const resolveInvocation = vi.fn(async () => invocation);
const code = await runNaviCli(["init", "--target", "/tmp/demo"], {
  stdout: (text) => stdout.push(text),
  stderr: (text) => stderr.push(text),
  runInit,
  runSetup,
  runDoctor,
}, { resolveInvocation });

expect(resolveInvocation).toHaveBeenCalledTimes(1);
expect(runInit).toHaveBeenCalledWith(["--target", "/tmp/demo"], invocation);
```

For the setup/doctor test, assert each selected handler receives the same object and that the resolver is called once per top-level invocation. For empty/unknown commands, assert the resolver is not called.

- [ ] **Step 2: Add failing setup fallback tests**

In `tests/cli/navi-global.test.ts`, add:

```ts
const fallbackInvocation: NaviInvocationContext = {
  cliRoot: "/Users/james/Codex Project/Navi",
  entrypoint: "/Users/james/.hermes/node/bin/navi",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/Users/james/.hermes/node/bin/navi"],
};

it.each([
  ["install", [], "/Users/james/.hermes/node/bin/navi setup --write"],
  ["remove", ["--remove"], "/Users/james/.hermes/node/bin/navi setup --remove --write"],
])("renders a verified fallback for %s preview", async (_name, args, expected) => {
  const codexHome = await makeTempCodexHome();
  const output: string[] = [];
  const code = await runNaviSetupCli(
    args,
    { stdout: (text) => output.push(text), stderr: (text) => output.push(text) },
    { codexHome, inspectInstallation: async () => enabledInstallation },
    fallbackInvocation,
  );
  expect(code).toBe(0);
  expect(output.join("")).toContain(expected);
  expect(output.join("")).not.toContain("Apply with: navi ");
});
```

Add one recovery assertion using the existing recoverable transaction fixture and the same fallback. Add an unavailable context assertion proving no `Apply with:` command is rendered and the dry run returns nonzero:

```ts
const unavailableInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "unavailable",
  reason: "unavailable",
};
```

- [ ] **Step 3: Run focused RED**

Run:

```bash
npm test -- tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts
```

Expected: FAIL because handlers and setup renderers do not accept Invocation Context and still print bare commands.

- [ ] **Step 4: Resolve once in the dispatcher**

In `src/cli/navi.ts`, change handler signatures to:

```ts
export interface NaviCliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  runInit: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
  runSetup: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
  runDoctor: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
}

export interface NaviCliDependencies {
  resolveInvocation: () => Promise<NaviInvocationContext>;
}
```

Build the production dependency from `resolveNaviCliRoot()`, `process.argv[1]`, `process.env.PATH`, `process.cwd()`, and `process.env.npm_lifecycle_event`. Change `runNaviCli()` so it validates the top-level command first, resolves exactly once for a recognized command, and passes that object to the selected handler. The default init handler accepts but does not use the context because init currently renders no self-referential apply command:

```ts
runInit: (args, _invocation) => runNaviInit(args),
runSetup: (args, invocation) => runNaviSetup(args, invocation),
runDoctor: (args, invocation) => runNaviDoctor(args, invocation),
```

- [ ] **Step 5: Render every setup self-reference structurally**

In `src/cli/navi-global.ts`:

1. add an optional `invocation` parameter defaulting to `TRUSTED_BARE_NAVI_INVOCATION` on `renderGlobalSetupPlan()`, `applyGlobalSetupPlan()`, and `runNaviSetupCli()`;
2. pass it through the command journey;
3. replace setup apply/recovery/rerun literals with `renderNaviCommand(invocation, [...])`;
4. make unavailable invocation a block only after existing live/conflicted transaction and unsafe managed-block reasons have been considered; and
5. leave the durable global bootstrap sentence `Do not write files or run navi init automatically` unchanged because it names a product command rather than giving an executable follow-up.

Use these exact token lists:

```ts
renderNaviCommand(invocation, ["setup"])
renderNaviCommand(invocation, ["setup", "--write"])
renderNaviCommand(invocation, ["setup", "--remove", "--write"])
```

When rendering is unavailable, use this non-command diagnostic:

```text
No verified Navi CLI invocation is available; rerun setup from the checked-out Navi source package.
```

Do not call `renderNaviCommand()` for `codex plugin` commands.

- [ ] **Step 6: Run focused GREEN and typecheck**

Run:

```bash
npm test -- tests/cli/navi-invocation.test.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts
npm run typecheck
```

Expected: 3 test files pass; typecheck exits 0.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/cli/navi.ts src/cli/navi-global.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts
git commit -m "feat: route navi setup through verified invocation"
```

---

### Task 3: Make Doctor Reachability And Follow-Ups Truthful

**Files:**
- Modify: `src/cli/navi-doctor.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Verify only: `src/cli/navi-init.ts`
- Verify only: `src/cli/navi-init-plan.ts`
- Verify only: `tests/cli/navi-init.test.ts`
- Verify only: `tests/cli/navi-init-plan.test.ts`

**Interfaces:**
- Consumes: `NaviInvocationContext`, `renderNaviCommand()`, and `TRUSTED_BARE_NAVI_INVOCATION`.
- Produces: truthful doctor `cli` pass/warn/fail and fallback-rendered doctor/setup/init repairs.
- Keeps: `NaviMigrationStage`, check IDs, transaction precedence, project state derivation, init no-generic-apply behavior, and doctor exit semantics.

- [ ] **Step 1: Add failing doctor reachability tests**

In `tests/cli/navi-doctor.test.ts`, add typed fixtures for trusted, fallback, and unavailable invocation. Add these assertions:

```ts
it("warns without changing the migration stage when a verified fallback is available", async () => {
  const f = await fixture();
  const report = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current(f.source), invocation: fallbackInvocation },
  );

  expect(report.migrationStage).toBe("current-only-bootstrap-missing");
  expect(report.checks.find((check) => check.id === "cli")).toMatchObject({ status: "warn" });
  expect(report.nextAction).toContain("/Users/james/.hermes/node/bin/navi setup");
  expect(report.nextAction).not.toContain("Run navi setup");
});

it("fails command reachability without printing speculative Navi commands", async () => {
  const f = await fixture();
  const report = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current(f.source), invocation: unavailableInvocation },
  );

  expect(report.checks.find((check) => check.id === "cli")).toMatchObject({ status: "fail" });
  expect(report.nextAction).toMatch(/verified Navi CLI entrypoint/i);
  expect(report.nextAction).not.toMatch(/\bnavi (?:doctor|setup|init)\b/);
});
```

Add a project-init case with a confirmed Map but missing trigger and assert its repair contains the absolute fallback `init` command. Update the existing recoverable transaction test so the recovery action uses the fallback while remaining higher priority than CLI warning.

- [ ] **Step 2: Run doctor RED**

Run:

```bash
npm test -- tests/cli/navi-doctor.test.ts
```

Expected: FAIL because doctor still checks only `cliRoot` and builds hard-coded bare commands.

- [ ] **Step 3: Inject Invocation Context into doctor**

Extend `NaviDoctorDependencies`:

```ts
export interface NaviDoctorDependencies {
  inspectInstallation?: () => Promise<NaviInstallationStatus>;
  invocation?: NaviInvocationContext;
}
```

Use `TRUSTED_BARE_NAVI_INVOCATION` only as the deterministic default for direct library tests. Production `runNaviDoctorCli()` receives the context from `navi.ts`.

Change `buildCliCheck()` so it first retains the current CLI-root directory check, then reports:

```ts
switch (invocation.reachability) {
  case "pass":
    return { id: "cli", status: "pass", summary: "Navi CLI is reachable as `navi`." };
  case "fallback":
    return {
      id: "cli",
      status: "warn",
      summary: invocation.reason === "path-mismatch"
        ? "The first `navi` on PATH does not belong to this Navi source; a verified fallback will be used."
        : "Bare `navi` is not reachable from the PATH inherited by Codex; a verified fallback will be used.",
    };
  case "unavailable":
    return {
      id: "cli",
      status: "fail",
      summary: "No verified Navi CLI invocation is available.",
      repair: "Run Navi from the checked-out source package to establish a verified CLI entrypoint.",
    };
}
```

Keep `deriveMigrationStage()` independent from this warning/failure. In `deriveNextAction()`, retain transaction and unsafe-path precedence, then return the unavailable CLI repair before migration, bootstrap, or project-init actions.

- [ ] **Step 4: Replace every actionable Navi self-reference with command builders**

Replace constants containing `navi doctor`, `navi setup`, or `navi init` with functions accepting `NaviInvocationContext`. Use these structured forms:

```ts
const doctor = renderNaviCommand(invocation, ["doctor"]);
const setup = renderNaviCommand(invocation, ["setup"]);
const setupWrite = renderNaviCommand(invocation, ["setup", "--write"]);
const init = renderNaviCommand(invocation, ["init"]);
const initWithFingerprint = renderNaviCommand(invocation, [
  "init", "--expect-plan", "<fingerprint>", "--write",
]);
const initWithCandidate = renderNaviCommand(invocation, [
  "init", "--map-file", "<candidate>",
]);
```

Use those values when building:

- legacy install and doctor-rerun actions;
- exact legacy removal follow-up;
- selector conflict repairs;
- global bootstrap preview/write action;
- transaction recovery action;
- missing/invalid/legacy project-trigger repairs; and
- confirmed-Map candidate preview guidance.

Leave `codex plugin add`, `codex plugin remove`, manual filesystem repair, and prose that merely names Navi unchanged. Do not perform regex replacement over completed strings.

For fallback reachability, append one concise CLI check line through existing report rendering; do not repeat PATH guidance inside every repair. For optional permanent convenience, render only:

```text
Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.
```

Only show that note when a known linked bin directory is available. Do not generate a shell edit command.

- [ ] **Step 5: Run doctor, init, and setup bounded GREEN**

Run:

```bash
npm test -- tests/cli/navi-invocation.test.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts
npm run typecheck
```

Expected: 6 test files pass; typecheck exits 0. Existing init tests must still prove no generic `Apply with:` command and exact fingerprint-bound writes.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/cli/navi-doctor.ts tests/cli/navi-doctor.test.ts
git commit -m "feat: report navi cli reachability"
```

---

### Task 4: Synchronize Source-Alpha Guidance And Close The Bounded Candidate

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/navi/design-history.md`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: the implemented pass/warn/fallback behavior from Tasks 1-3.
- Produces: aligned external-reader setup instructions and active design authority.
- Keeps: alpha.3 release truthfulness, current-main unreleased wording, source verification, migration ordering, and project-init boundaries unchanged.

- [ ] **Step 1: Add failing documentation truth tests**

In `tests/skills/navi-capability-truthfulness.test.ts`, extend the source-installation test so all three README surfaces contain:

```ts
for (const readme of [englishReadme, chineseReadme, packageReadme]) {
  expect(readme).toContain("npm run navi -- doctor");
  expect(readme).toMatch(/PATH|路径/);
  expect(readme).toMatch(/fallback|备用/);
  expect(readme).not.toMatch(/automatically (?:edit|modify).*PATH/i);
}
```

In `tests/repository/current-surface.test.ts`, replace the completed stabilization current-phase assertion with:

```ts
it("records verified CLI invocation as the current bounded implementation gate", async () => {
  const history = await fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8");
  const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

  expect(history).toContain("Source-alpha CLI invocation reachability is the current bounded implementation gate");
  expect(active).toContain("docs/superpowers/specs/2026-07-15-navi-source-alpha-cli-invocation-design.md");
  expect(active).toContain("docs/superpowers/plans/2026-07-15-navi-source-alpha-cli-invocation.md");
});
```

Do not remove the product-debt complexity regression gate or its priority rule assertions.

- [ ] **Step 2: Run documentation RED**

Run:

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: FAIL because the fallback entry and new active design/plan are not documented.

- [ ] **Step 3: Update the three external-reader setup surfaces**

After the normal `npm link` sequence in `README.md` and `plugins/navi/README.md`, add this bounded guidance:

```text
If the active Codex environment cannot resolve bare `navi` after `npm link`, start diagnosis from the repository root with `npm run navi -- doctor`. Doctor reports the PATH limitation and carries one verified fallback into later setup or init guidance. The fallback does not edit PATH or shell configuration. Adding the linked npm bin directory to the PATH inherited by Codex and restarting Codex is optional convenience, not a prerequisite while the fallback works.
```

Add the equivalent Chinese text to `README.zh-CN.md`, preserving technical command names. Do not replace the normal bare-command examples, migration sequence, removal sequence, or alpha.3/current-main release distinction.

- [ ] **Step 4: Update active design authority**

In `docs/navi/design-history.md`:

1. change Current Phase to state that complexity stabilization and its bounded two-project calibration are closed;
2. state exactly `Source-alpha CLI invocation reachability is the current bounded implementation gate`;
3. name one post-integration real-environment calibration as the next gate, not distribution or release; and
4. add the approved invocation design and this plan to `## Active`.

Do not reclassify older designs or rewrite historical records.

- [ ] **Step 5: Run the exact candidate verification**

Run:

```bash
npm test -- tests/cli/navi-invocation.test.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
git diff --check
```

Expected: 8 test files pass; typecheck and diff check exit 0.

Do not run full `npm test`, `npm run verify:plugin-package`, npm audit remediation, tag checks, or release checks. If the package verifier becomes necessary because implementation unexpectedly changes canonical or packaged skill files, stop and return a premise-changing event rather than silently widening verification.

- [ ] **Step 6: Audit exact scope and prohibited behavior**

Run:

```bash
git diff --name-only HEAD~4...HEAD
rg -n "writeFile|appendFile|chmod|symlink|spawn|execFile|execSync" src/cli/navi-invocation.ts
rg -n "\.zshrc|\.zprofile|PATH=" src/cli README.md README.zh-CN.md plugins/navi/README.md
```

Expected changed paths are exactly the files listed in this plan. The invocation module contains read-only `fs.access`, `fs.realpath`, and `fs.readFile` but no filesystem writes or child-process execution. Documentation may name PATH conceptually but must contain no automatic profile-edit command.

- [ ] **Step 7: Commit Task 4**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md docs/navi/design-history.md tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
git commit -m "docs: explain navi cli fallback"
```

- [ ] **Step 8: Self-review and send review-ready handoff**

Review the exact base-to-HEAD diff against the approved spec and this plan. Confirm:

- one resolver and renderer own invocation behavior;
- unknown PATH candidates are never executed;
- setup and doctor output no unverified actionable bare command;
- doctor migration stage remains independent from fallback warnings;
- transaction and unsafe-path decisions retain precedence;
- project-init guidance uses the fallback without adding a generic init apply command;
- no PATH, global Codex, plugin, target-project, package, release, or `work/` state was mutated; and
- the worktree is clean after four task commits.

Send a `review-ready` Lane Handoff Event containing exact base, candidate HEAD, commits, changed paths, RED/GREEN evidence, verification results, and residual risks. Stop before integration.

---

## Independent Validation Contract

The parent creates a fresh read-only Validation Thread after the implementation worktree is review-ready. The validator must:

1. confirm the exact base and candidate HEAD;
2. review the design, plan, and full diff without writing;
3. inspect PATH candidate identity, symlink handling, shell quoting, unavailable behavior, and command ownership;
4. verify migration-stage, transaction, and init fingerprint boundaries remain intact;
5. rerun the exact 8-file bounded suite and typecheck only when dependencies already exist, or report commands as not rerun without silently installing them;
6. classify findings by severity and return `ready` or `remediation-required`; and
7. stop before merge, push, calibration, release, or external mutation.

One bounded remediation round is allowed for findings inside the approved premise. A finding that requires PATH mutation, installer behavior, public distribution, cross-platform expansion, a second state system, or scope outside the listed files returns to the parent as premise-changing.

## Post-Integration Calibration Gate

After independent validation and explicit integration, Calibration mode may perform one real-environment check using the already observed source-alpha state. It invokes doctor through the known absolute linked entrypoint while bare `navi` remains unavailable, confirms the warning and exact fallback, and exercises only a read-only or separately approved command form. It must not edit PATH, shell profiles, plugins, project files, or release state.

That calibration closes this bootstrap gap if the rendered fallback is executable and no new initialization or supervision regression appears. It does not prove public distribution readiness and does not trigger a release.
