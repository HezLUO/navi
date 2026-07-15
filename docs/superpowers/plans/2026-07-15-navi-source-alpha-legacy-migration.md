# Navi Source-Alpha Legacy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `navi doctor` guide a safe source-alpha transition from the legacy `along-working-thread` plugin to Current Navi one valid action at a time, without coupling global migration to project initialization.

**Architecture:** Preserve `navi-installation.ts` as the single parser of Codex plugin evidence, but add a typed conflict reason so doctor does not infer meaning from diagnostic prose. Keep the migration stage, source verification, action precedence, and rendered next action inside `navi-doctor.ts`; keep `navi setup` dual-install blocking and every project-local init module unchanged. Synchronize the active English, Chinese, packaged, and project-init documentation after the behavior is green.

**Tech Stack:** TypeScript, Node.js filesystem APIs, Vitest, existing Navi CLI modules and source-alpha documentation.

## Global Constraints

- Work in a Codex-managed isolated worktree created from the reviewed plan commit; do not implement on `main`.
- Use TDD for every behavior change: observe the focused RED failure before editing production code.
- Do not execute `codex plugin add`, `codex plugin remove`, `navi setup --write`, `navi init --write`, `npm link`, or any real global or target-project mutation.
- Do not add `navi migrate`, a migration receipt, automatic rollback, project scanning, long-term dual-runtime support, a workflow engine, or a second installation parser.
- Do not modify `navi init`, Project Map, project-trigger, setup transaction, package metadata, version, changelog, release notes, tag, publication, or Historical Along behavior.
- `transition-dual` remains unhealthy and nonzero; it exists only for read-only Current Navi source verification before exact legacy removal.
- Global activation and project-local trigger migration remain separate. Project state may affect the overall doctor result, but it must not change the reported global migration stage.
- Render at most one `Next action:`. Lower-priority repair facts may remain in the report model for compatibility, but must not appear as competing rendered commands.
- Keep `navi setup` blocked while both plugin generations are installed.
- Use only targeted verification listed in this plan. Do not run the full `npm test`, tag checks, release checks, or release preparation.
- The approved design is `docs/superpowers/specs/2026-07-15-navi-source-alpha-legacy-migration-design.md`.
- The implementation lane may create the three local task commits explicitly listed below. Stop before merge, push, tag, release, real migration, or calibration.
- After the implementation lane reports review-ready, the parent must create a fresh independent validation task from the exact base and candidate HEAD. The validator receives the spec, plan, diff, and test commands, but not the executor's reasoning transcript; it must not write files.

---

## File Structure

**Modify:** `src/cli/navi-installation.ts`
- Remains the only Codex plugin-list parser.
- Adds a typed reason for the three existing conflict forms: dual generation, non-authoritative Current Navi, and duplicate Current Navi.

**Modify:** `src/cli/navi-doctor.ts`
- Adds the derived migration-stage and single-next-action report fields.
- Permits manifest inspection for one authoritative Current Navi row during the recognized dual-generation transition.
- Selects actions with transaction/path safety before installation, bootstrap, and project initialization.
- Renders facts plus one `Next action:` instead of multiple `Repair:` commands.

**Modify:** `tests/cli/navi-installation.test.ts`
- Locks the typed conflict evidence at the parser boundary.

**Modify:** `tests/cli/navi-doctor.test.ts`
- Covers the migration stages, transition source check, invalid dual states, action precedence, and rendered single-action contract.

**Verify only:** `src/cli/navi-global.ts`
- Must remain unchanged; its existing setup preflight continues to block dual installation.

**Verify only:** `tests/cli/navi-global.test.ts`
- Existing dual-install setup refusal is part of the bounded regression suite.

**Modify:** `README.md`
- Replaces project-first legacy migration with phase-aware global cutover followed by later project-local migration.

**Modify:** `README.zh-CN.md`
- Carries the same migration truth in Chinese.

**Modify:** `plugins/navi/README.md`
- Keeps the repo-contained source package instructions aligned with the root README.

**Modify:** `docs/navi/project-init.md`
- States that project trigger upgrades occur after global Current Navi activation and are not a global cutover prerequisite.

**Modify:** `docs/navi/design-history.md`
- Adds the approved migration design and implementation plan to the Active authority index.

**Modify:** `tests/repository/current-surface.test.ts`
- Prevents the external-reader migration surfaces from returning to the contradictory project-first sequence.

---

### Task 1: Preserve Typed Plugin Conflict Evidence

**Files:**
- Modify: `src/cli/navi-installation.ts:15-23,96-117`
- Test: `tests/cli/navi-installation.test.ts`

**Interfaces:**
- Consumes: `parsePluginListRows(output: string): PluginListRow[]` and `inspectNaviInstallation(runCommand?: RunCommand): Promise<NaviInstallationStatus>`.
- Produces: exported `NaviInstallationConflictReason` and optional `NaviInstallationStatus.conflictReason` used by Task 2.
- Keeps: all existing `kind`, `current`, `legacy`, `raw`, and `diagnostic` fields and parser behavior.

- [ ] **Step 1: Add failing assertions for each conflict reason**

In `tests/cli/navi-installation.test.ts`, update the existing alternate-selector, duplicate-selector, and current-plus-legacy tests so they include these exact assertions:

```ts
await expect(inspectNaviInstallation(commandResult(
  "navi@other  Installed, Enabled  0.1.0  /source/plugins/navi",
))).resolves.toMatchObject({
  kind: "conflict",
  conflictReason: "non-authoritative-current",
});

await expect(inspectNaviInstallation(commandResult(`${CURRENT}\n${CURRENT}`))).resolves.toMatchObject({
  kind: "conflict",
  conflictReason: "duplicate-current",
});

await expect(inspectNaviInstallation(commandResult(
  `${CURRENT}\nalong-working-thread@personal  Installed, Enabled  0.1.0  /legacy`,
))).resolves.toMatchObject({
  kind: "conflict",
  conflictReason: "dual-generation",
  current: { selector: "navi@navi-source" },
  legacy: { selector: "along-working-thread@personal" },
});
```

- [ ] **Step 2: Run the focused test and observe RED**

Run:

```bash
npm test -- tests/cli/navi-installation.test.ts
```

Expected: FAIL because `conflictReason` is absent from all three conflict results. Existing parser assertions should continue to pass.

- [ ] **Step 3: Add the typed conflict reason without changing parser ownership**

In `src/cli/navi-installation.ts`, add:

```ts
export type NaviInstallationConflictReason =
  | "dual-generation"
  | "non-authoritative-current"
  | "duplicate-current";

export interface NaviInstallationStatus {
  kind: NaviInstallationKind;
  current?: PluginListRow;
  legacy?: PluginListRow;
  raw: string;
  diagnostic?: string;
  conflictReason?: NaviInstallationConflictReason;
}
```

Add the matching field to the three existing conflict returns:

```ts
if (alternateNaviRows.length > 0) {
  return {
    kind: "conflict",
    conflictReason: "non-authoritative-current",
    current,
    ...(legacy ? { legacy } : {}),
    raw,
    diagnostic: `Navi is installed from a non-authoritative selector: ${alternateNaviRows.map((row) => row.selector).join(", ")}.`,
  };
}

if (exactCurrentRows.length > 1) {
  return {
    kind: "conflict",
    conflictReason: "duplicate-current",
    current,
    ...(legacy ? { legacy } : {}),
    raw,
    diagnostic: `Navi is installed more than once from ${CURRENT_SELECTOR}.`,
  };
}

if (current?.installed && legacy?.installed) {
  return {
    kind: "conflict",
    conflictReason: "dual-generation",
    current,
    legacy,
    raw,
    diagnostic: "Both current Navi and legacy plugins are installed.",
  };
}
```

Do not export `CURRENT_SELECTOR`, add a second parser, or replace the existing diagnostic strings.

- [ ] **Step 4: Run the focused test and typecheck**

Run:

```bash
npm test -- tests/cli/navi-installation.test.ts
npm run typecheck
```

Expected: the installation test file passes and typecheck exits 0.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/cli/navi-installation.ts tests/cli/navi-installation.test.ts
git commit -m "refactor: classify navi installation conflicts"
```

---

### Task 2: Render Phase-Aware Doctor Guidance

**Files:**
- Modify: `src/cli/navi-doctor.ts:12-135`
- Test: `tests/cli/navi-doctor.test.ts`
- Verify only: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Consumes: `NaviInstallationStatus.conflictReason` from Task 1 and existing `DoctorCheck` results.
- Produces: exported `NaviMigrationStage`, `NaviDoctorReport.migrationStage`, and optional `NaviDoctorReport.nextAction`.
- Keeps: `DoctorCheck`, the seven existing check IDs, `runNaviDoctorCli()` exit semantics, setup transaction behavior, and all project inspection behavior.

- [ ] **Step 1: Replace the obsolete project-first migration test with stage tests**

In `tests/cli/navi-doctor.test.ts`, import `renderGlobalBootstrapBlock` from `../../src/cli/navi-global` and replace `reports legacy and conflict installation states truthfully` with these tests:

```ts
it("guides legacy-only and verified dual transition with one global action", async () => {
  const f = await fixture();
  const legacy = {
    selector: "along-working-thread@personal",
    pluginName: "along-working-thread",
    marketplaceName: "personal",
    installed: true,
    enabled: true,
    raw: "legacy",
  };

  const legacyReport = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => ({ kind: "legacy", legacy, raw: "legacy" }) },
  );
  expect(legacyReport.migrationStage).toBe("legacy-only");
  expect(legacyReport.nextAction).toContain("navi@navi-source");
  expect(renderNaviDoctorReport(legacyReport)).not.toMatch(/navi init|navi setup --write/);

  const dualReport = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    {
      inspectInstallation: async () => ({
        ...current(f.source),
        kind: "conflict",
        conflictReason: "dual-generation",
        legacy,
      }),
    },
  );
  expect(dualReport.migrationStage).toBe("transition-dual");
  expect(dualReport.checks.find((check) => check.id === "manifest")?.status).toBe("pass");
  expect(dualReport.nextAction).toBe(
    "Run codex plugin remove along-working-thread@personal, then rerun navi doctor. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.",
  );
  expect(renderNaviDoctorReport(dualReport)).toContain("Migration stage: transition-dual");
  expect(renderNaviDoctorReport(dualReport).match(/Next action:/g)).toHaveLength(1);
  expect(renderNaviDoctorReport(dualReport)).not.toContain("navi init");
});

it.each(["missing source path", "alternate current", "duplicate current"])(
  "keeps legacy installed for %s",
  async (name) => {
    const f = await fixture();
    const legacy = {
      selector: "along-working-thread@personal",
      pluginName: "along-working-thread",
      marketplaceName: "personal",
      installed: true,
      enabled: true,
      raw: "legacy",
    };
    const installation: NaviInstallationStatus = name === "missing source path"
      ? { ...current(), kind: "conflict", conflictReason: "dual-generation", legacy }
      : name === "alternate current"
        ? {
            kind: "conflict",
            conflictReason: "non-authoritative-current",
            current: { selector: "navi@other", pluginName: "navi", marketplaceName: "other", installed: true, enabled: true, raw: "alternate" },
            legacy,
            raw: "alternate",
            diagnostic: "Navi is installed from a non-authoritative selector: navi@other.",
          }
        : {
            ...current(f.source),
            kind: "conflict",
            conflictReason: "duplicate-current",
            legacy,
            diagnostic: "Navi is installed more than once from navi@navi-source.",
          };

    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => installation },
    );
    expect(report.migrationStage).toBe("dual-invalid");
    expect(report.nextAction).toMatch(/keep.*legacy.*installed/i);
    expect(report.nextAction).not.toContain("codex plugin remove along-working-thread@personal");
  },
);
```

- [ ] **Step 2: Add failing precedence and completion tests**

Add focused tests that establish these exact observable contracts:

```ts
it("reports current-only bootstrap work before project initialization", async () => {
  const f = await fixture();
  const report = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current(f.source) },
  );

  expect(report.migrationStage).toBe("current-only-bootstrap-missing");
  expect(report.nextAction).toBe("Run navi setup, review the preview, then run navi setup --write.");
  expect(renderNaviDoctorReport(report)).not.toContain("navi init");
});

it("keeps current-active global status independent from project initialization", async () => {
  const f = await fixture();
  await fs.writeFile(path.join(f.codexHome, "AGENTS.md"), renderGlobalBootstrapBlock());
  const report = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current(f.source) },
  );

  expect(report.migrationStage).toBe("current-active");
  expect(report.checks.find((check) => check.id === "project-init")?.status).toBe("warn");
  expect(report.nextAction).toMatch(/Project Map candidate/i);
});

it("reports an installed Current Navi without inspectable source as unusable", async () => {
  const f = await fixture();
  const report = await buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current() },
  );

  expect(report.migrationStage).toBe("current-unusable");
  expect(report.nextAction).toMatch(/source path or manifest/i);
  expect(renderNaviDoctorReport(report)).not.toContain("navi setup --write");
});
```

Extend the existing transaction test so a recoverable or conflicting setup transaction wins over plugin, bootstrap, and project actions:

```ts
expect(recoverable.nextAction).toContain("navi setup --write");
expect(renderNaviDoctorReport(recoverable).match(/Next action:/g)).toHaveLength(1);
```

Extend the symlinked `AGENTS.md` test so its unsafe-path repair wins before installation migration:

```ts
expect(report.nextAction).toMatch(/symlink|regular file/i);
```

- [ ] **Step 3: Run doctor tests and observe RED**

Run:

```bash
npm test -- tests/cli/navi-doctor.test.ts
```

Expected: FAIL because the report has no migration stage or next action, dual install skips manifest inspection, and rendering still prints multiple `Repair:` lines.

- [ ] **Step 4: Add migration-stage and report interfaces**

In `src/cli/navi-doctor.ts`, add:

```ts
export type NaviMigrationStage =
  | "legacy-only"
  | "transition-dual"
  | "dual-invalid"
  | "current-only-bootstrap-missing"
  | "current-active"
  | "current-unusable";

export interface NaviDoctorReport {
  requestedCodexHome: string;
  codexHome: string;
  cliRoot: string;
  projectDir: string;
  migrationStage: NaviMigrationStage;
  nextAction?: string;
  checks: DoctorCheck[];
}
```

Replace the project-first `migrationRepair()` with constants or small functions that produce only the current global action. Keep selector interpolation exact and unquoted because selectors are parsed as single non-whitespace tokens by `navi-installation.ts`:

```ts
const GLOBAL_REPAIR = "Run navi setup, review the preview, then run navi setup --write.";
const SOURCE_REPAIR = "Install and enable navi@navi-source, then rerun navi doctor.";
const CURRENT_SOURCE_REPAIR = "Keep the legacy plugin installed. Repair or remove the incomplete Current Navi installation, then rerun navi doctor before removing legacy.";
const CURRENT_ONLY_SOURCE_REPAIR = "Repair the installed Current Navi source path or manifest, then rerun navi doctor.";

function legacyInstallAction(legacySelector: string): string {
  return `Install and enable navi@navi-source, then rerun navi doctor. Keep the exact legacy selector ${legacySelector} installed during this verification step.`;
}

function legacyRemovalAction(legacySelector: string): string {
  return `Run codex plugin remove ${legacySelector}, then rerun navi doctor. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.`;
}
```

- [ ] **Step 5: Make plugin repairs stage-safe and type-driven**

Replace `selectorConflictRepair()` and `buildPluginCheck()` with branches that use `conflictReason`, not diagnostic prose:

```ts
function selectorConflictRepair(status: NaviInstallationStatus): string {
  if (status.conflictReason === "non-authoritative-current") {
    const selector = status.current?.selector;
    return selector
      ? `Remove the non-authoritative Navi selector ${selector}, then install and enable navi@navi-source before rerunning navi doctor.`
      : "Keep the legacy installation unchanged and repair codex plugin list so the non-authoritative Current Navi selector can be identified.";
  }
  if (status.conflictReason === "duplicate-current") {
    return "Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains, then rerun navi doctor.";
  }
  return "Resolve the reported Current Navi plugin selector conflict, then rerun navi doctor.";
}

function buildPluginCheck(status: NaviInstallationStatus): DoctorCheck {
  switch (status.kind) {
    case "current":
      return { id: "plugin", status: "pass", summary: `Navi plugin is installed and enabled${status.current?.version ? ` (${status.current.version}).` : "."}` };
    case "legacy":
      return { id: "plugin", status: "fail", summary: `Only legacy plugin ${status.legacy?.selector ?? "unidentified"} is installed.`, repair: SOURCE_REPAIR };
    case "conflict":
      return status.conflictReason === "dual-generation"
        ? { id: "plugin", status: "fail", summary: `Navi and legacy plugin ${status.legacy?.selector ?? "unidentified"} are both installed.`, repair: CURRENT_SOURCE_REPAIR }
        : { id: "plugin", status: "fail", summary: `Navi plugin installation conflict${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: selectorConflictRepair(status) };
    case "uninspectable":
      return { id: "plugin", status: "fail", summary: `Navi plugin installation could not be inspected${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: "Repair codex plugin list, then rerun navi doctor." };
    case "missing":
      return { id: "plugin", status: "fail", summary: "Navi plugin is missing or disabled.", repair: SOURCE_REPAIR };
  }
}
```

The word `unidentified` is a diagnostic label, not a selector passed into a command. Exact selector commands are emitted only after `deriveNextAction()` confirms that the parsed selector exists.

- [ ] **Step 6: Permit source inspection only from an authoritative current row**

Change `buildManifestCheck()` so the check is based on the actual Current Navi row rather than requiring `status.kind === "current"`:

```ts
function hasInspectableAuthoritativeCurrent(
  status: NaviInstallationStatus,
  sourcePath: string | undefined,
): boolean {
  return status.current?.selector === "navi@navi-source"
    && status.current.installed
    && status.current.enabled
    && sourcePath !== undefined;
}

async function buildManifestCheck(
  status: NaviInstallationStatus,
  sourcePath: string | undefined,
): Promise<DoctorCheck> {
  if (!hasInspectableAuthoritativeCurrent(status, sourcePath)) {
    return {
      id: "manifest",
      status: "warn",
      summary: "Navi plugin source is unavailable; manifest inspection is incomplete.",
    };
  }
  try {
    const manifest = JSON.parse(
      await fs.readFile(path.join(sourcePath, ".codex-plugin", "plugin.json"), "utf8"),
    ) as { interface?: { defaultPrompt?: unknown } };
    const prompts = manifest.interface?.defaultPrompt;
    if (Array.isArray(prompts) && prompts.length <= 3) {
      return {
        id: "manifest",
        status: "pass",
        summary: "Installed Navi plugin manifest defaultPrompt contains at most 3 entries.",
      };
    }
    return {
      id: "manifest",
      status: "fail",
      summary: "Installed Navi plugin manifest defaultPrompt must contain at most 3 entries.",
      repair: "Repair the Current Navi plugin manifest, then rerun navi doctor.",
    };
  } catch {
    return {
      id: "manifest",
      status: "warn",
      summary: "Navi plugin source is unavailable; manifest inspection is incomplete.",
    };
  }
}
```

Do not treat the existing package-cache warning as source verification success or failure. The authoritative selector, enabled row, inspectable source path, and manifest check form this source-alpha transition gate.

- [ ] **Step 7: Derive the migration stage from existing facts**

Add these pure helpers in `src/cli/navi-doctor.ts`:

```ts
function checkById(reportChecks: DoctorCheck[], id: DoctorCheck["id"]): DoctorCheck {
  const check = reportChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Navi doctor internal error: missing ${id} check.`);
  return check;
}

function deriveMigrationStage(
  installation: NaviInstallationStatus,
  checks: DoctorCheck[],
): NaviMigrationStage {
  const manifest = checkById(checks, "manifest");
  const bootstrap = checkById(checks, "global-bootstrap");

  if (installation.kind === "legacy") return "legacy-only";
  if (installation.kind === "conflict") {
    const verifiedTransition = installation.conflictReason === "dual-generation"
      && installation.current?.selector === "navi@navi-source"
      && installation.current.installed
      && installation.current.enabled
      && manifest.status === "pass";
    return verifiedTransition ? "transition-dual" : "dual-invalid";
  }
  if (installation.kind !== "current" || manifest.status !== "pass") {
    return "current-unusable";
  }
  return bootstrap.status === "pass"
    ? "current-active"
    : "current-only-bootstrap-missing";
}
```

`current-active` is global status. Do not inspect the project check in this function.

- [ ] **Step 8: Select one action using the approved precedence**

Add a helper with this decision order:

```ts
function deriveNextAction(
  stage: NaviMigrationStage,
  installation: NaviInstallationStatus,
  checks: DoctorCheck[],
): string | undefined {
  const transaction = checkById(checks, "transaction");
  if (transaction.status === "fail") return transaction.repair ?? transaction.summary;

  const cli = checkById(checks, "cli");
  if (cli.status === "fail") return cli.repair ?? cli.summary;

  const bootstrap = checkById(checks, "global-bootstrap");
  if (bootstrap.status === "fail" && /unsafe/i.test(bootstrap.summary)) {
    return bootstrap.repair ?? bootstrap.summary;
  }

  switch (stage) {
    case "legacy-only": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyInstallAction(selector)
        : "Repair codex plugin list so the exact legacy selector can be identified, then rerun navi doctor.";
    }
    case "transition-dual": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyRemovalAction(selector)
        : "Keep both installations unchanged and repair codex plugin list so the exact legacy selector can be identified.";
    }
    case "dual-invalid": {
      const repair = checkById(checks, "plugin").repair ?? CURRENT_SOURCE_REPAIR;
      return installation.legacy
        ? `Keep the exact legacy selector ${installation.legacy.selector} installed. ${repair}`
        : repair;
    }
    case "current-unusable": {
      const plugin = checkById(checks, "plugin");
      const manifest = checkById(checks, "manifest");
      if (installation.kind !== "current") return plugin.repair ?? SOURCE_REPAIR;
      return manifest.repair ?? CURRENT_ONLY_SOURCE_REPAIR;
    }
    case "current-only-bootstrap-missing":
      return bootstrap.repair ?? GLOBAL_REPAIR;
    case "current-active":
      return checkById(checks, "project-init").repair;
  }
}
```

Do not infer conflict type from `diagnostic` text. Use `conflictReason` for every branch that distinguishes a recognized transition from an invalid dual state.

- [ ] **Step 9: Build and render the staged report**

In `buildNaviDoctorReport()`, build `checks` first, then derive the fields:

```ts
const checks = [
  await buildCliCheck(cliRoot),
  buildPluginCheck(installation),
  await buildManifestCheck(installation, sourcePath),
  await buildGlobalBootstrapCheck(canonical.canonicalPath),
  await buildPackageCacheCheck(sourcePath),
  await buildProjectInitCheck(projectDir),
  await buildTransactionCheck(canonical.canonicalPath),
];
const migrationStage = deriveMigrationStage(installation, checks);
const nextAction = deriveNextAction(migrationStage, installation, checks);

return {
  requestedCodexHome: canonical.requestedPath,
  codexHome: canonical.canonicalPath,
  cliRoot,
  projectDir,
  migrationStage,
  ...(nextAction ? { nextAction } : {}),
  checks,
};
```

Render facts and one action, never per-check repair commands:

```ts
export function renderNaviDoctorReport(report: NaviDoctorReport): string {
  const roots = report.requestedCodexHome === report.codexHome ? [] : [
    `Requested CODEX_HOME: ${report.requestedCodexHome}`,
    `Canonical CODEX_HOME: ${report.codexHome}`,
  ];
  const lines = [
    ...roots,
    `Migration stage: ${report.migrationStage}`,
    ...report.checks.map((check) => `[${check.status}] ${check.id}: ${check.summary}`),
    ...(report.nextAction ? [`Next action: ${report.nextAction}`] : []),
  ];
  return `${lines.join("\n")}\n`;
}
```

Keep `runNaviDoctorCli()` exit semantics unchanged: any failed check still returns 1.

- [ ] **Step 10: Update old assertions to the single-action contract**

In `tests/cli/navi-doctor.test.ts`:

- keep check-level `repair` assertions only where they validate an internal repair source;
- move user-facing migration assertions to `report.nextAction` and `renderNaviDoctorReport(report)`;
- assert rendered output contains no `  Repair:` lines;
- keep existing project-state, path-safety, transaction, read-only, and CLI-argument coverage.

Do not weaken tests for damaged Map or trigger evidence merely because their repair is deferred during global migration.

- [ ] **Step 11: Run doctor and setup regression tests**

Run:

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-global.test.ts
npm run typecheck
```

Expected: all three files pass, typecheck exits 0, doctor has one rendered next action, and setup still refuses dual installation.

- [ ] **Step 12: Commit Task 2**

```bash
git add src/cli/navi-doctor.ts tests/cli/navi-doctor.test.ts
git commit -m "feat: guide staged navi legacy migration"
```

Do not stage `src/cli/navi-global.ts` or `tests/cli/navi-global.test.ts`; they are verification-only in this task.

---

### Task 3: Align External Migration Truth

**Files:**
- Modify: `README.md:64-66`
- Modify: `README.zh-CN.md:64-66`
- Modify: `plugins/navi/README.md:180-182`
- Modify: `docs/navi/project-init.md`
- Modify: `docs/navi/design-history.md`
- Test: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: the migration stages and command order implemented in Task 2.
- Produces: one consistent external-reader contract and a static regression test.
- Keeps: source-alpha installation, removal, global setup, confirmed-Map, fingerprint, and current release-truthfulness text outside the migration paragraphs.

- [ ] **Step 1: Add a failing repository truthfulness test**

In `tests/repository/current-surface.test.ts`, add:

```ts
it("separates global legacy cutover from project-local migration", async () => {
  const [readme, chineseReadme, pluginReadme, projectInit, designHistory] = await Promise.all([
    fs.readFile(path.join(root, "README.md"), "utf8"),
    fs.readFile(path.join(root, "README.zh-CN.md"), "utf8"),
    fs.readFile(path.join(root, "plugins/navi/README.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/project-init.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
  ]);

  for (const text of [readme, pluginReadme]) {
    expect(text).toContain("short dual-install transition");
    expect(text).toContain("codex plugin remove <exact legacy selector>");
    expect(text).toContain("does not scan or initialize target projects");
    expect(text).toContain("next use of a project with a recognized legacy trigger");
    expect(text).not.toMatch(/preview an exact project trigger upgrade[\s\S]*validate the target project[\s\S]*remove the exact legacy selector/i);
  }

  expect(chineseReadme).toContain("短暂 dual-install 过渡");
  expect(chineseReadme).toContain("codex plugin remove <doctor 报告的精确 legacy selector>");
  expect(chineseReadme).toContain("不会扫描或初始化目标项目");
  expect(projectInit).toContain("Global migration is not a project-initialization prerequisite");
  expect(projectInit).toContain("fingerprint-bound");
  const active = designHistory.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
  expect(active).toContain("docs/superpowers/specs/2026-07-15-navi-source-alpha-legacy-migration-design.md");
  expect(active).toContain("docs/superpowers/plans/2026-07-15-navi-source-alpha-legacy-migration.md");
});
```

- [ ] **Step 2: Run the repository test and observe RED**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because the current README surfaces still require project trigger migration before legacy removal and the project-init relationship statement is absent.

- [ ] **Step 3: Replace the English root migration paragraph**

Replace the paragraph under `### Legacy migration and removal` in `README.md` with:

```markdown
If `navi doctor` reports a legacy-only installation, keep the exact reported legacy selector installed and add `navi@navi-source`. During the short dual-install transition, doctor keeps the installation unhealthy but performs read-only checks of the authoritative Current Navi selector, source path, and manifest. After those checks pass, run `codex plugin remove <exact legacy selector>` using the selector reported by doctor, rerun `navi doctor`, then preview and explicitly approve `navi setup --write`. Do not keep both plugins active as a compatibility mode.

This global cutover does not scan or initialize target projects. On the next use of a project with a recognized legacy trigger, Current Navi may offer the existing fingerprint-bound `navi init` upgrade. Declining that project-local upgrade does not undo global activation and should not cause repeated reminders in the same session.
```

- [ ] **Step 4: Replace the Chinese root migration paragraph**

Replace the matching paragraph in `README.zh-CN.md` with:

```markdown
如果 `navi doctor` 报告 legacy-only installation，先保留 doctor 报告的精确 legacy selector，再安装 `navi@navi-source`。在短暂 dual-install 过渡中，doctor 仍把安装状态视为不健康，但会只读检查权威 Current Navi selector、source path 和 manifest。检查通过后，运行 `codex plugin remove <doctor 报告的精确 legacy selector>`，重新运行 `navi doctor`，再预览并明确批准 `navi setup --write`。不要把两个 plugin 长期并存当作兼容模式。

这次全局切换不会扫描或初始化目标项目。之后第一次进入带有 recognized legacy trigger 的项目时，Current Navi 可以提供现有的 fingerprint-bound `navi init` 升级。拒绝项目级升级不会撤销全局激活，也不应在同一会话中反复提醒。
```

- [ ] **Step 5: Align the packaged plugin README**

Replace the paragraph under `### Legacy migration and removal` in `plugins/navi/README.md` with the same two English paragraphs from Step 3, then append this exact sentence to the first paragraph. Preserve the following removal commands:

```markdown
Use only the exact legacy selector reported by doctor; do not guess its marketplace name.
```

- [ ] **Step 6: Clarify the project-init relationship**

Add this bounded section to `docs/navi/project-init.md` before `## Fresh-Session Validation`:

```markdown
## Relationship To Global Legacy Migration

Global migration is not a project-initialization prerequisite in either direction: the global cutover reaches Current Navi without scanning or modifying target projects, and a project does not need to be upgraded before the exact global legacy selector is removed. After global activation, Current Navi can recognize a deployed legacy project trigger when that project is next used and offer the existing fingerprint-bound preview and approved write.

A missing Map, missing trigger, or recognized legacy trigger remains project-local evidence. It may affect that project's doctor result, but it does not change the global migration stage. Unknown, edited, duplicated, incomplete, or unsafe trigger evidence remains a conflict and is never rewritten automatically.
```

- [ ] **Step 7: Index the active migration authority**

Under `## Active` in `docs/navi/design-history.md`, add:

```markdown
- `docs/superpowers/specs/2026-07-15-navi-source-alpha-legacy-migration-design.md`
- `docs/superpowers/plans/2026-07-15-navi-source-alpha-legacy-migration.md`
```

Do not rewrite the historical or superseded lists in this task.

- [ ] **Step 8: Run documentation truthfulness tests**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
npm run verify:plugin-package
git diff --check
```

Expected: the repository test passes, plugin package verification passes, and diff check exits 0. The verifier is used here for current package/mirror truthfulness, not as a release checklist.

- [ ] **Step 9: Commit Task 3**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md docs/navi/project-init.md docs/navi/design-history.md tests/repository/current-surface.test.ts
git commit -m "docs: separate global and project navi migration"
```

---

### Task 4: Bounded Verification And Review-Ready Handoff

**Files:**
- Verify only: all files changed by Tasks 1-3
- Do not create a verification-results source file

**Interfaces:**
- Consumes: the three task commits and the approved design.
- Produces: reproducible evidence for the parent and fresh independent validation task.

- [ ] **Step 1: Run the exact bounded active-Navi suite**

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-global.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
git diff HEAD~3 HEAD --check
```

Expected: all four targeted test files pass, typecheck exits 0, plugin package verification passes, and the combined three-commit diff check exits 0.

- [ ] **Step 2: Audit the implementation scope**

Run:

```bash
git diff --name-only HEAD~3..HEAD
git status --short --branch
```

Expected changed paths are exactly:

```text
README.md
README.zh-CN.md
docs/navi/project-init.md
docs/navi/design-history.md
plugins/navi/README.md
src/cli/navi-doctor.ts
src/cli/navi-installation.ts
tests/cli/navi-doctor.test.ts
tests/cli/navi-installation.test.ts
tests/repository/current-surface.test.ts
```

The worktree must be clean. `src/cli/navi-global.ts`, `tests/cli/navi-global.test.ts`, project init implementation, package metadata, release files, and global/user files must not appear in the diff.

- [ ] **Step 3: Perform the execution-lane self-review**

Read the combined diff against every acceptance criterion in the design. Specifically confirm:

- no branch removes legacy before authoritative Current Navi source and manifest evidence pass;
- no rendered doctor result contains multiple `Next action:` lines or any competing `Repair:` commands;
- transaction and unsafe-path actions outrank migration actions;
- current-only bootstrap work outranks project-init guidance;
- `current-active` does not depend on project initialization;
- setup remains blocked under dual install;
- docs do not put `navi init` before global legacy removal; and
- no automatic mutation, receipt, scan, or new migration command was introduced.

If self-review finds a defect, fix it test-first in the owning task scope and create one clearly named remediation commit. Then rerun the exact bounded suite and replace `HEAD~3` in scope commands with the recorded implementation base commit.

- [ ] **Step 4: Send a review-ready lane handoff and stop**

Send one `NAVI_LANE_HANDOFF_EVENT` of kind `review-ready` to the source main task with:

- exact implementation base and candidate HEAD;
- all task and remediation commits;
- exact changed paths;
- RED/GREEN evidence;
- bounded verification output;
- confirmation that no global/plugin/project mutation occurred; and
- residual risk that real source-alpha migration remains a separately authorized Calibration-mode activity.

Stop before merge, push, global migration, target-project calibration, tag, or release.

## Parent Independent Validation Gate

After receiving the review-ready event, the parent creates one fresh validation task. This is mandatory for this worktree even though the full Supervised Delivery Loop automation is not implemented yet.

The validator receives only:

- the exact implementation base and candidate HEAD;
- the approved design and this plan;
- the combined diff and changed-path list;
- the exact bounded verification commands; and
- the claimed acceptance result.

The validator must remain read-only. It independently checks specification compliance, implementation quality, safety precedence, documentation truthfulness, test gaps, and scope. It reruns the bounded commands when dependencies are available, classifies findings by severity, and returns `NAVI_VALIDATION_RESULT` with `ready`, `remediation-required`, or `premise-changing` judgment.

The parent, not the executor or validator, decides whether to authorize bounded remediation, integrate the candidate, or return to design. A maximum of two bounded remediation rounds applies before the premise must be reconsidered.
