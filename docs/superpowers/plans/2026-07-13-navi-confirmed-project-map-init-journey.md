# Navi Confirmed Project Map And Initialization Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace provisional project initialization with one confirmed `.navi/project-map.md`, exact preview-to-write binding, truthful doctor diagnosis, and Codex-first guided baseline behavior.

**Architecture:** Add a model-free Project Map contract parser shared by init and doctor. Keep evidence interpretation and user confirmation in the Codex skill, while `navi init` accepts a validated project-external Map candidate, fingerprints the exact preview, revalidates the plan, writes the Map first, and activates the project trigger last. Keep the deterministic evidence scanner as an internal diagnostic input rather than a public suggested-map generator.

**Tech Stack:** TypeScript, Node.js `fs/promises`, Node.js `crypto`, Vitest, Markdown skill/plugin contracts, existing Navi CLI dispatcher and package verifier.

## Global Constraints

- Execute this plan only in a new, real Codex worktree task created from `main` after the bootstrap remediation has passed parent review and been integrated.
- Do not execute implementation in the main design/supervision session. `superpowers:subagent-driven-development` may be used inside the real worktree task; it is not a substitute for worktree isolation.
- Before Task 1, verify the integrated baseline contains the final bootstrap transaction, selector, doctor, wrapper, and naming remediation commits. If it does not, stop and report the dependency instead of adapting this plan to an older baseline.
- Preserve user or prior-session changes. Do not reset, delete, or overwrite unrelated work.
- `.navi/project-map.md` is the only canonical Navi Project Map path.
- Stored Maps use `navi_map: 1`, `map_status: confirmed`, `project_status: active|paused|closed`, and ISO `last_confirmed` metadata.
- Stored Maps contain all six required hidden anchors; headings and prose may use any project language.
- Do not create a provisional Map or `.navi/state.md`.
- Existing roadmaps, plans, trackers, and status files remain evidence and are never adopted or rewritten as the Navi Map.
- `navi init` never installs the global plugin and never calls a model.
- No-payload `navi init` is read-only and must not report successful initialization.
- Remove `--suggest-map` from the public CLI; retain bounded evidence discovery only as an internal, non-authoritative capability.
- Initial apply writes the Map first and the trigger last. Do not add another broad global-style transaction system.
- Navi never stages, commits, pushes, or modifies `.gitignore` in a target project.
- Do not write to real `$CODEX_HOME`, plugin configuration/cache, or external target projects. Use temporary target roots. A later real-project calibration write requires separate user approval.
- Do not modify `src/web`, MCP behavior, runtime UI, background behavior, Memory v2, other-agent adapters, package version, tags, release notes, GitHub Release state, or publication configuration.
- Use targeted changed-area tests during implementation. Do not run full `npm test`, `npm run build`, browser tests, `npm pack`, release verification, tag, push, or release steps.
- Each task may create its listed local commit without a separate approval prompt. Do not merge or push from the worktree.

---

## File Structure

Create or isolate these responsibilities:

- `src/cli/navi-project-map.ts`: canonical path, metadata/anchor parser, file safety inspection, and structured Map state.
- `src/cli/navi-evidence.ts`: bounded project evidence discovery retained from the former suggested-map implementation; no Map generation.
- `src/cli/navi-init-fingerprint.ts`: deterministic preview fingerprint over exact input and target state.
- `src/cli/navi-init.ts`: argument parsing, project initialization planning, rendering, revalidation, Map-first/trigger-last apply, and managed trigger classification.
- `src/cli/navi-doctor.ts`: combined plugin/global/project diagnostics using the shared Map and trigger classifiers.
- `.agents/skills/navi/SKILL.md`: canonical Codex-first eligibility, guided baseline, adaptive supervision, maintenance, and lifecycle behavior.
- `plugins/navi/skills/navi/SKILL.md`: exact packaged copy of the canonical skill.
- `docs/navi/project-init.md`: active user-facing initialization contract.
- `docs/navi/project-trigger-template.md`: active concise trigger template.

Do not create a runtime adapter framework. In this source alpha, “Codex adapter” means the canonical skill/plugin behavior plus deterministic CLI integration.

---

### Task 1: Add The Confirmed Project Map Contract

**Files:**
- Create: `src/cli/navi-project-map.ts`
- Create: `tests/cli/navi-project-map.test.ts`

**Interfaces:**
- Produces: `NAVI_PROJECT_MAP_RELATIVE_PATH`, `REQUIRED_PROJECT_MAP_ANCHORS`, `ProjectLifecycleStatus`, `ProjectMapDocument`, `ProjectMapParseResult`, `ProjectMapFileState`, `parseProjectMapDocument(text)`, and `inspectProjectMapFile(projectDir)`.
- Consumed by: Tasks 2, 3, and 4.

- [ ] **Step 0: Verify and record the integrated baseline**

Run before any implementation edit:

```bash
git status --short --branch
git log --oneline --decorate -12
git rev-parse HEAD > "$(git rev-parse --git-path navi-confirmed-map-base)"
```

Expected: the worktree is clean, the log includes the parent-approved bootstrap
integration, and the worktree-local Git metadata file contains that exact base
SHA. If the bootstrap integration is absent, stop without writing source files.

- [ ] **Step 1: Write parser fixtures and failing contract tests**

Add complete English and Chinese-heading fixtures inline in `tests/cli/navi-project-map.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  inspectProjectMapFile,
  parseProjectMapDocument,
  REQUIRED_PROJECT_MAP_ANCHORS,
} from "../../src/cli/navi-project-map";

const roots: string[] = [];
const map = (headings: string[]) => `---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-13
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## ${headings[index]}\n\nConfirmed value ${index + 1}.`,
).join("\n\n")}
`;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("confirmed Navi Project Map contract", () => {
  it.each([
    ["English", ["Desired Outcome", "Route To Outcome", "Current Position", "Current Boundary", "Next Decision", "Evidence And Uncertainty"]],
    ["Chinese", ["期望结果", "实现路线", "当前位置", "当前边界", "下一决策", "证据与不确定性"]],
  ])("accepts %s natural-language headings with stable anchors", (_name, headings) => {
    expect(parseProjectMapDocument(map(headings))).toMatchObject({
      kind: "valid",
      document: { version: 1, mapStatus: "confirmed", projectStatus: "active", lastConfirmed: "2026-07-13" },
    });
  });

  it.each([
    ["missing anchor", (text: string) => text.replace("<!-- navi:next-decision -->", "")],
    ["duplicate anchor", (text: string) => `${text}\n<!-- navi:next-decision -->\n`],
    ["out-of-order anchors", (text: string) => text
      .replace("<!-- navi:route-to-outcome -->", "<!-- navi:swap-anchor -->")
      .replace("<!-- navi:current-position -->", "<!-- navi:route-to-outcome -->")
      .replace("<!-- navi:swap-anchor -->", "<!-- navi:current-position -->")],
    ["draft status", (text: string) => text.replace("map_status: confirmed", "map_status: draft")],
    ["invalid lifecycle", (text: string) => text.replace("project_status: active", "project_status: waiting")],
    ["invalid date", (text: string) => text.replace("2026-07-13", "13/07/2026")],
  ])("rejects %s", (_name, mutate) => {
    expect(parseProjectMapDocument(mutate(map(["A", "B", "C", "D", "E", "F"]))).kind).toBe("invalid");
  });

  it("preserves an unsupported future contract version", () => {
    expect(parseProjectMapDocument(map(["A", "B", "C", "D", "E", "F"]).replace("navi_map: 1", "navi_map: 2"))).toMatchObject({ kind: "unsupported", version: 2 });
  });
});
```

Add file-state cases using temporary roots for `missing`, valid regular file,
symlink, directory-at-file-path, invalid content, and unsupported version. Assert
that inspection never follows the symlink and never writes.

- [ ] **Step 2: Run the Map tests and verify the expected import failure**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts
```

Expected: FAIL because `src/cli/navi-project-map.ts` does not exist.

- [ ] **Step 3: Implement the strict contract parser and safe file inspection**

Create these exported types and constants exactly:

```ts
export const NAVI_PROJECT_MAP_RELATIVE_PATH = ".navi/project-map.md";
export const REQUIRED_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export type ProjectLifecycleStatus = "active" | "paused" | "closed";

export interface ProjectMapDocument {
  version: 1;
  mapStatus: "confirmed";
  projectStatus: ProjectLifecycleStatus;
  lastConfirmed: string;
  text: string;
}

export type ProjectMapParseResult =
  | { kind: "valid"; document: ProjectMapDocument }
  | { kind: "unsupported"; version: number; diagnostic: string }
  | { kind: "invalid"; diagnostic: string; recognizedVersion?: 1 };

export type ProjectMapFileState =
  | { kind: "missing"; mapPath: string }
  | { kind: "valid"; mapPath: string; document: ProjectMapDocument }
  | { kind: "unsupported"; mapPath: string; version: number; diagnostic: string }
  | { kind: "invalid"; mapPath: string; diagnostic: string; recognizedVersion?: 1 }
  | { kind: "unsafe"; mapPath: string; diagnostic: string };
```

Implement a contract-specific frontmatter parser rather than a general YAML
implementation. It must:

- require one opening and one closing `---` delimiter;
- parse scalar `key: value` lines;
- reject duplicate required keys;
- require all four required keys;
- preserve the original text and tolerate additional unique scalar metadata
  keys without treating them as Navi contract fields;
- validate `navi_map` as a base-10 integer;
- return `unsupported` for any version other than `1` before attempting rewrite;
- require exact `confirmed`, lifecycle enum, and `YYYY-MM-DD` whose date
  round-trips through UTC calendar fields; and
- require each anchor exactly once and in the declared order.

`inspectProjectMapFile()` must use `lstat`, return `unsafe` for symlinks or
non-regular files, read UTF-8 only from a regular file, and convert parser
results into file-state results without writing.

- [ ] **Step 4: Run contract tests and typecheck**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts
npm run typecheck
```

Expected: the new test file passes and typecheck exits `0`.

- [ ] **Step 5: Commit the Map contract**

```bash
git add src/cli/navi-project-map.ts tests/cli/navi-project-map.test.ts
git commit -m "feat: add confirmed navi project map contract"
```

---

### Task 2: Make Init Require A Confirmed Map

**Files:**
- Create: `src/cli/navi-evidence.ts`
- Create: `tests/cli/navi-evidence.test.ts`
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-command.test.ts`

**Interfaces:**
- Consumes: `inspectProjectMapFile()` and `NAVI_PROJECT_MAP_RELATIVE_PATH` from Task 1.
- Produces: `inspectProjectEvidence(targetDir)`, updated `InitOptions`, and `InitPlan` states `needs-confirmed-map|actionable|healthy|blocked`.
- Consumed by: Task 3 fingerprint/write behavior and Task 4 doctor classification.

- [ ] **Step 1: Replace provisional-init expectations with failing no-payload tests**

Delete or rewrite assertions that expect `docs/along/project-maps/...`, a
provisional starter Map, or successful no-payload initialization. Add these
tests:

```ts
it("keeps no-payload init read-only and explains the missing confirmed baseline", async () => {
  const project = await createProject();
  const before = await snapshot(project);
  const plan = await buildInitPlan({ targetDir: project });

  expect(plan.state).toBe("needs-confirmed-map");
  expect(plan.actions).toEqual([]);
  expect(renderInitPlan(plan)).toContain("confirmed Project Map");
  expect(renderInitPlan(plan)).not.toContain("Apply with:");
  expect(await snapshot(project)).toEqual(before);
});

it("does not accept --suggest-map as a public init option", () => {
  expect(() => parseInitArgs(["--suggest-map"], "/tmp/project")).toThrow(/removed|unknown option/i);
});

it("does not write a trigger when a confirmed Map payload is absent", async () => {
  const project = await createProject();
  const code = await runNaviInitCli(["--target", project, "--write"], testIo());

  expect(code).toBe(1);
  await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
  await expect(fs.access(path.join(project, ".navi/project-map.md"))).rejects.toThrow();
});
```

Add a command-wrapper assertion that direct
`navi init --target /private/tmp/navi-empty-project` exits
nonzero with a guided message and no `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 2: Run focused tests and verify they fail against provisional behavior**

Run:

```bash
npm test -- tests/cli/navi-init.test.ts tests/cli/navi-command.test.ts
```

Expected: FAIL because no-payload init still plans a provisional Map and
`--suggest-map` remains public.

- [ ] **Step 3: Extract bounded evidence discovery without Map generation**

Move bounded directory traversal, candidate ordering, snippet byte limits, and
safe unreadable/disappearing-file handling from `navi-init.ts` into
`navi-evidence.ts`. Export:

```ts
export interface ProjectEvidenceItem {
  relativePath: string;
  text: string;
}

export interface ProjectEvidenceInspection {
  items: ProjectEvidenceItem[];
  truncated: boolean;
}

export async function inspectProjectEvidence(targetDir: string): Promise<ProjectEvidenceInspection>;
```

Do not export project-shape scoring, confidence, suggested views, or generated
Map text. Migrate the existing bounded scanner tests into
`tests/cli/navi-evidence.test.ts` and assert only evidence discovery behavior.
Use the inspection in no-payload init output to name up to three candidate local
sources; do not infer or print a Map.

Delete the now-unused `SuggestedMapPreview`, shape-score types and keyword
inference, suggested-map renderer, provisional `renderProjectMap()`,
`docs/along/project-maps/` target constants, and starter-map collision logic
from `navi-init.ts`. Preserve only evidence traversal behavior that has a direct
consumer in the no-payload diagnosis or Codex integration contract.

- [ ] **Step 4: Replace init options and states**

Use these public shapes:

```ts
export interface InitOptions {
  targetDir?: string;
  write?: boolean;
  mapFile?: string;
  expectPlan?: string;
}

export type InitPlanState = "needs-confirmed-map" | "actionable" | "healthy" | "blocked";

export interface InitPlan {
  mode: "dry-run" | "write";
  state: InitPlanState;
  targetDir: string;
  actions: InitAction[];
  validationPrompt: string;
  fingerprint?: string;
  diagnostic?: string;
  evidencePaths: string[];
}
```

Argument rules:

- support `--target`, `--map-file`, `--expect-plan`, and `--write`, with one
  following value for the first three options;
- reject duplicates;
- reject `--expect-plan` without `--write`;
- reject `--write` without `--expect-plan` when actions are required;
- reject a Map candidate path inside the canonical target root;
- reject symlinked or non-regular candidate files; and
- render an explicit migration message for `--suggest-map` instead of silently
  accepting it.

Planning rules before Task 3 adds fingerprints:

- no candidate + missing Map => `needs-confirmed-map`, no actions;
- no candidate + valid existing Map => plan only the recognized trigger action;
- valid candidate + missing Map => plan Map create before trigger action;
- candidate identical to valid existing Map => skip Map and plan trigger;
- candidate different from a valid confirmed Map => `blocked`, because init is
  not a Map-update command;
- recognized-version-1 invalid Map + valid candidate => plan an exact guarded
  repair modification with the old bytes in `previousContent`;
- unknown-format, unsupported, or unsafe existing Map => `blocked` and preserve
  it; and
- valid Map + current recognized trigger => `healthy`, no actions.

- [ ] **Step 5: Run init, evidence, and wrapper tests**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-evidence.test.ts tests/cli/navi-init.test.ts tests/cli/navi-command.test.ts
```

Expected: all listed tests pass. No test writes outside its temporary root.

- [ ] **Step 6: Commit the confirmed-input init boundary**

```bash
git add src/cli/navi-evidence.ts src/cli/navi-init.ts tests/cli/navi-evidence.test.ts tests/cli/navi-init.test.ts tests/cli/navi-command.test.ts
git commit -m "feat: require confirmed maps for navi init"
```

---

### Task 3: Bind Preview To Map-First Trigger-Last Writes

**Files:**
- Create: `src/cli/navi-init-fingerprint.ts`
- Create: `tests/cli/navi-init-fingerprint.test.ts`
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`

**Interfaces:**
- Consumes: `InitAction`, validated Map candidate bytes, canonical target root, and Task 1 contract version.
- Produces: `createInitPlanFingerprint(input)` and enforced `--expect-plan` apply behavior.

- [ ] **Step 1: Write failing deterministic fingerprint tests**

```ts
import { describe, expect, it } from "vitest";
import { createInitPlanFingerprint } from "../../src/cli/navi-init-fingerprint";

const input = {
  contractVersion: 1 as const,
  targetDir: "/tmp/project",
  candidateMap: "confirmed map\n",
  agentsBefore: undefined,
  mapBefore: undefined,
  actions: [
    { kind: "create" as const, relativePath: ".navi/project-map.md", content: "confirmed map\n" },
    { kind: "create" as const, relativePath: "AGENTS.md", content: "trigger\n" },
  ],
};

describe("navi init plan fingerprint", () => {
  it("is deterministic for identical exact input", () => {
    expect(createInitPlanFingerprint(input)).toBe(createInitPlanFingerprint(structuredClone(input)));
  });

  it.each([
    ["candidate", { ...input, candidateMap: "changed\n" }],
    ["target", { ...input, targetDir: "/tmp/other" }],
    ["agents", { ...input, agentsBefore: "new instructions\n" }],
    ["map", { ...input, mapBefore: "existing\n" }],
    ["actions", { ...input, actions: [...input.actions].reverse() }],
  ])("changes when %s changes", (_name, changed) => {
    expect(createInitPlanFingerprint(changed)).not.toBe(createInitPlanFingerprint(input));
  });
});
```

- [ ] **Step 2: Run the fingerprint test and verify the missing-module failure**

```bash
npm test -- tests/cli/navi-init-fingerprint.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement canonical serialization and SHA-256**

Export:

```ts
export interface InitFingerprintAction {
  kind: "create" | "modify" | "skip";
  relativePath: string;
  content?: string;
  previousContent?: string;
}

export interface InitFingerprintInput {
  contractVersion: 1;
  targetDir: string;
  candidateMap?: string;
  agentsBefore?: string;
  mapBefore?: string;
  actions: InitFingerprintAction[];
}

export function createInitPlanFingerprint(input: InitFingerprintInput): string;
```

Serialize a newly constructed object whose keys are declared in the interface
order, preserve action order and exact strings, encode missing values as `null`,
then return lowercase SHA-256 hex. Do not hash file paths from the candidate
source; hash only the canonical target root and planned target state.

- [ ] **Step 4: Add failing preview/write drift and activation-order tests**

Cover all of these in `navi-init.test.ts`:

- dry-run prints a line matching `Plan fingerprint: [a-f0-9]{64}` and no
  generic apply command;
- write with the exact fingerprint succeeds;
- changed candidate bytes refuse before any target write;
- changed `AGENTS.md` refuses before Map write;
- a Map appearing or changing after preview refuses;
- missing or incorrect `--expect-plan` refuses;
- Map action runs before trigger action;
- injected Map failure leaves trigger absent/unchanged;
- injected trigger failure after Map success leaves a valid inactive Map and
  reports partial activation; and
- no automatic cleanup deletes the successfully written Map after trigger
  ownership becomes uncertain.

Expose a test-only dependency hook rather than monkey-patching global `fs`:

```ts
export interface InitWriteDependencies {
  beforeWrite?: (relativePath: string) => Promise<void>;
  afterWrite?: (relativePath: string) => Promise<void>;
}

export async function applyInitPlan(
  plan: InitPlan,
  dependencies: InitWriteDependencies = {},
): Promise<void>;
```

- [ ] **Step 5: Enforce recomputation and activation-last apply**

`buildInitPlan()` must always compute the fingerprint from current exact bytes
for actionable plans. `runNaviInitCli()` in write mode must compare
`options.expectPlan` with the rebuilt fingerprint before calling
`applyInitPlan()`.

Preflight every action before the first write. Order actionable writes as:

```text
1. .navi/project-map.md
2. AGENTS.md
```

Use the existing confined-path, symlink, create freshness, and modify
previous-content guards from the integrated baseline. Do not weaken bootstrap
remediation safety helpers or reuse global transaction artifacts inside the
project.

- [ ] **Step 6: Run writer tests and typecheck**

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-init-fingerprint.test.ts tests/cli/navi-init.test.ts tests/cli/navi-command.test.ts
npm run typecheck
```

Expected: all listed tests and typecheck pass.

- [ ] **Step 7: Commit fingerprinted activation**

```bash
git add src/cli/navi-init-fingerprint.ts src/cli/navi-init.ts tests/cli/navi-init-fingerprint.test.ts tests/cli/navi-init.test.ts
git commit -m "feat: bind navi init preview to writes"
```

---

### Task 4: Make Doctor Report Combined Project Initialization State

**Files:**
- Modify: `src/cli/navi-init.ts`
- Modify: `src/cli/navi-doctor.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-doctor.test.ts`

**Interfaces:**
- Consumes: Task 1 `ProjectMapFileState` and init's recognized managed-trigger classifier.
- Produces: `ProjectInitializationState` and `inspectProjectInitialization(projectDir)` for doctor and tests.

- [ ] **Step 1: Export a truthful trigger classifier from init**

Export a classifier that recognizes exact current and known generated legacy
blocks rather than marker presence:

```ts
export type ProjectTriggerState =
  | { kind: "missing" }
  | { kind: "current" }
  | { kind: "legacy" }
  | { kind: "invalid"; diagnostic: string }
  | { kind: "unsafe"; diagnostic: string };

export async function inspectProjectTrigger(projectDir: string): Promise<ProjectTriggerState>;
```

Use `lstat` before reading `AGENTS.md`. A symlink or non-regular path is
`unsafe`. Duplicate, incomplete, edited, or unknown marker content is
`invalid`. Preserve the existing exact legacy upgrade recognition.

- [ ] **Step 2: Write failing doctor matrix tests**

Use table-driven fixtures for:

```ts
it.each([
  ["not-initialized", "missing", "missing", "warn"],
  ["map-ready", "missing", "valid", "warn"],
  ["trigger-orphaned", "current", "missing", "fail"],
  ["map-invalid", "current", "invalid", "fail"],
  ["map-unsupported", "current", "unsupported", "fail"],
  ["trigger-invalid", "invalid", "valid", "fail"],
  ["healthy-active", "current", "valid", "pass"],
  ["healthy-paused", "current", "valid-paused", "pass"],
  ["healthy-closed", "current", "valid-closed", "pass"],
] as const)("classifies %s", async (_name, triggerFixture, mapFixture, expectedStatus) => {
  const report = await buildFixtureReport(triggerFixture, mapFixture);
  expect(report.checks.find((check) => check.id === "project-init")?.status).toBe(expectedStatus);
});
```

Add explicit assertions that marker-wrapped garbage does not pass and that a
Map-ready project receives trigger activation preview guidance rather than a
request to regenerate its Map. A recognized-version-1 invalid Map should direct
the user to form a corrected confirmed candidate and review an exact repair
preview; unknown-format, unsupported, and unsafe Maps should receive manual
preservation guidance rather than an overwrite command.

- [ ] **Step 3: Run doctor tests and verify the marker-only failure**

```bash
npm test -- tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts
```

Expected: FAIL until doctor uses shared trigger and Map inspection.

- [ ] **Step 4: Implement combined project classification**

Add:

```ts
export type ProjectInitializationKind =
  | "not-initialized"
  | "map-ready"
  | "trigger-orphaned"
  | "map-invalid"
  | "trigger-invalid"
  | "healthy";

export interface ProjectInitializationState {
  kind: ProjectInitializationKind;
  trigger: ProjectTriggerState;
  map: ProjectMapFileState;
  lifecycle?: "active" | "paused" | "closed";
}

export async function inspectProjectInitialization(projectDir: string): Promise<ProjectInitializationState>;
```

Map invalid, unsupported, or unsafe takes `map-invalid`; trigger invalid or
unsafe takes `trigger-invalid`; current/legacy trigger without valid Map is
`trigger-orphaned`; valid Map without trigger is `map-ready`; both missing is
`not-initialized`; recognized current trigger plus valid Map is `healthy`.
Legacy trigger plus valid Map remains non-healthy and receives exact trigger
upgrade guidance.

Doctor stays read-only and renders one smallest repair per state. Closed and
paused lifecycle are healthy initialization states and should be named without
urging continuation.

- [ ] **Step 5: Run doctor, init, installation, and global regression tests**

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-init.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-installation.test.ts tests/cli/navi-global.test.ts
```

Expected: all listed tests pass, including the final bootstrap selector and
transaction diagnosis cases.

- [ ] **Step 6: Commit truthful project diagnosis**

```bash
git add src/cli/navi-init.ts src/cli/navi-doctor.ts tests/cli/navi-init.test.ts tests/cli/navi-doctor.test.ts
git commit -m "feat: diagnose navi project initialization state"
```

---

### Task 5: Install The Codex-First Confirmed Map Behavior

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/working-thread-v1.md`
- Modify: `plugins/navi/.codex-plugin/plugin.json`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/working-thread-v1.md`
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/mcp/working-thread-package.test.ts`

**Interfaces:**
- Consumes: the fixed Map path, metadata, anchors, init states, and doctor semantics from Tasks 1-4.
- Produces: canonical/package Codex behavior and a concise project trigger that points to the canonical Map.

- [ ] **Step 1: Add failing canonical/package contract assertions**

Replace old assertions for provisional maps, `.navi/state.md`,
`docs/along/project-maps/`, and public `--suggest-map` behavior. Assert both
skill copies contain these exact concepts:

```ts
const confirmedMapContract = [
  ".navi/project-map.md",
  "Init Eligibility Gate",
  "Guided Baseline Formation",
  "one missing key judgment at a time",
  "Map language is evidence, not a response-language instruction",
  "meaningful navigation boundary",
  "project_status: active",
  "project_status: paused",
  "project_status: closed",
  "worktree completion creates a review-ready event",
];

for (const phrase of confirmedMapContract) {
  expect(canonicalSkill).toContain(phrase);
  expect(packagedSkill).toContain(phrase);
}

expect(pluginManifest.interface.defaultPrompt).toContain(
  "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
);

for (const stalePhrase of [
  "Map status: provisional",
  ".navi/state.md",
  "navi init --suggest-map",
  "write only a provisional trigger",
]) {
  expect(canonicalSkill).not.toContain(stalePhrase);
  expect(packagedSkill).not.toContain(stalePhrase);
}
```

Add behavioral fixture assertions for clear bounded tasks staying quiet,
insufficient baseline causing one-question guided formation, broad questions
selecting only the relevant Map subset, current-prompt language, stale evidence
challenge, bounded Map-update authorization, paused quietness, closed quietness,
and reopening confirmation.

- [ ] **Step 2: Run skill and init tests and verify stale-contract failures**

```bash
npm test -- tests/skills/navi-skill.test.ts tests/cli/navi-init.test.ts tests/mcp/working-thread-package.test.ts
```

Expected: FAIL because the current skill and generated trigger still describe
provisional and Along-path behavior.

- [ ] **Step 3: Replace the project trigger with a concise activation contract**

Keep the full supervision policy in the skill. Make `renderAgentsBlock()` and
the reusable trigger source carry only these responsibilities:

```markdown
<!-- NAVI:START -->
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read `.navi/project-map.md` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- Worktree completion creates a review-ready event, not an automatic interruption; interrupt only when the result can change the current decision.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
<!-- NAVI:END -->
```

Preserve exact known-block migration for deployed generated blocks. Do not make
the trigger repeat the full history of alpha.4-alpha.14 rules.

- [ ] **Step 4: Rewrite the canonical skill around the unified Map**

Retain Challenge, quietness, bounded continuation, coordination, stage/vision,
and language-following behavior, but make these rules authoritative:

- broad first-use with no Map runs eligibility, not immediate init;
- evidence shortage starts Guided Baseline Formation without writes;
- one final preview covers trigger and Map;
- clear bounded work stays quiet;
- output adapts rather than printing a fixed structure;
- Map updates occur only at meaningful boundaries;
- bounded authorization can cover a smallest Map patch;
- lifecycle controls continuation pressure; and
- existing project roadmaps are evidence, not alternate Map paths.

Remove current guidance that permits confident provisional Map output. A
best-effort answer may state uncertainty, but it must not be represented as a
stored or stable Map.

Copy the canonical skill and reference exactly to the packaged location. Do not
hand-edit the packaged copy differently.

Replace the initialization default prompt in the plugin manifest with:

```text
Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.
```

- [ ] **Step 5: Run skill, init, MCP/package, and verifier tests**

```bash
npm test -- tests/skills/navi-skill.test.ts tests/cli/navi-init.test.ts tests/mcp/working-thread-package.test.ts
npm run verify:plugin-package
```

Expected: targeted tests pass; plugin manifest validation and exact
canonical/package sync pass.

- [ ] **Step 6: Commit the Codex-first behavior**

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/working-thread-v1.md plugins/navi/.codex-plugin/plugin.json plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/working-thread-v1.md src/cli/navi-init.ts tests/cli/navi-init.test.ts tests/skills/navi-skill.test.ts tests/mcp/working-thread-package.test.ts
git commit -m "feat: add confirmed project map supervision"
```

---

### Task 6: Migrate Active Product Documentation

**Files:**
- Create: `docs/navi/project-init.md`
- Create: `docs/navi/project-trigger-template.md`
- Modify: `docs/along/project-maps/README.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/project-maps/navi-project-trigger-template.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/along/navi-product-debt.md`
- Modify: `docs/along/roadmaps/navi-post-alpha-roadmap.md`
- Modify: `docs/superpowers/specs/2026-07-09-navi-alpha13-project-initialization-suggested-map-preview-design.md`
- Modify: `docs/superpowers/specs/2026-07-10-navi-alpha14-project-state-snapshot-design.md`
- Modify: `docs/superpowers/specs/2026-07-13-navi-codex-first-supervision-contract-design.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: all implemented behavior from Tasks 1-5.
- Produces: one active public/user narrative with explicit historical supersession notes.

- [ ] **Step 1: Add failing active-document assertions**

Assert the three active READMEs and `docs/navi/project-init.md` all describe:

```text
global install/setup once
guided confirmed baseline
one trigger + .navi/project-map.md preview
one approved project init write
fresh-session natural-language supervision
```

Assert active docs do not claim that init creates a starter/provisional Map,
creates `.navi/state.md`, or uses `docs/along/project-maps/` as the target path.
Assert the alpha.13 and alpha.14 specs contain a top-level superseded note that
links to the confirmed journey spec without rewriting their historical body.

- [ ] **Step 2: Run documentation contract tests and verify failures**

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because active docs still describe the old initialization
surface.

- [ ] **Step 3: Create the active Navi-owned initialization docs**

`docs/navi/project-init.md` must cover:

- global capability versus project configuration;
- just-in-time broad supervision trigger;
- eligibility and guided baseline;
- direct no-payload CLI behavior;
- adapter-driven `--map-file` and fingerprinted write as an advanced/internal
  integration detail;
- fixed Map path and schema summary;
- doctor states;
- Map-first/trigger-last partial behavior;
- fresh-session validation; and
- no Git, release, runtime, background, or other-agent claims.

`docs/navi/project-trigger-template.md` must exactly match the concise generated
managed block from Task 5.

Do not delete historical files under `docs/along/project-maps/` in this task.
Add short supersession banners to the old init and trigger documents, retain
their historical body, and update the directory README plus every active link
to the Navi-owned docs.

- [ ] **Step 4: Align public and architectural narrative**

Update both root READMEs and the package README with the same product boundary.
Update product debt and roadmap to remove the now-resolved provisional/state
direction and record remaining calibration/distribution work without preparing
a release.

In the Codex-first supervision contract, replace separate Project State as a
current input with the unified confirmed Project Map. Keep portability seams
and future-agent non-goals unchanged.

Add only a supersession banner to historical alpha.13 and alpha.14 specs:

```markdown
> **Superseded:** The confirmed Project Map initialization journey replaces the
> public suggested-map flow and separate Project State direction. This file is
> retained as historical design evidence.
```

- [ ] **Step 5: Run docs/package verification**

```bash
npm test -- tests/skills/navi-skill.test.ts tests/mcp/working-thread-package.test.ts
npm run verify:plugin-package
git diff --check
```

Expected: tests and package verifier pass; diff check emits no errors.

- [ ] **Step 6: Commit the active documentation migration**

```bash
git add docs/navi/project-init.md docs/navi/project-trigger-template.md docs/along/project-maps/README.md docs/along/project-maps/navi-project-init.md docs/along/project-maps/navi-project-trigger-template.md README.md README.zh-CN.md plugins/navi/README.md docs/along/navi-product-debt.md docs/along/roadmaps/navi-post-alpha-roadmap.md docs/superpowers/specs/2026-07-09-navi-alpha13-project-initialization-suggested-map-preview-design.md docs/superpowers/specs/2026-07-10-navi-alpha14-project-state-snapshot-design.md docs/superpowers/specs/2026-07-13-navi-codex-first-supervision-contract-design.md tests/skills/navi-skill.test.ts
git commit -m "docs: align navi confirmed map initialization"
```

---

### Task 7: Run Bounded Integration And Calibration

**Files:**
- Modify only if a defect is found: files already owned by Tasks 1-6 and their targeted tests.
- Do not create a release checklist or write to real target projects.

**Interfaces:**
- Consumes: complete implementation from Tasks 1-6.
- Produces: clean worktree, bounded verification evidence, temporary-project transcript evidence, and parent review handoff.

- [ ] **Step 1: Verify scope before running tests**

```bash
BASE_SHA=$(cat "$(git rev-parse --git-path navi-confirmed-map-base)")
git status --short --branch
git log --oneline --decorate -10
git diff --stat "$BASE_SHA"..HEAD
git ls-files --others --exclude-standard
```

Expected: only planned commits/files differ from the integrated bootstrap base;
no real target-project or global files appear. Include `BASE_SHA` in the final
report.

- [ ] **Step 2: Run the bounded CLI and contract suite**

Run exactly:

```bash
npm test -- \
  tests/cli/navi-project-map.test.ts \
  tests/cli/navi-evidence.test.ts \
  tests/cli/navi-init-fingerprint.test.ts \
  tests/cli/navi-init.test.ts \
  tests/cli/navi-doctor.test.ts \
  tests/cli/navi-command.test.ts \
  tests/cli/navi-installation.test.ts \
  tests/cli/navi-global.test.ts \
  tests/cli/navi-transaction.test.ts \
  tests/skills/navi-skill.test.ts \
  tests/mcp/working-thread-package.test.ts
```

Expected: all listed files pass. Record exact file and test counts from Vitest;
do not summarize them from memory.

- [ ] **Step 3: Run bounded static verification**

```bash
npm run verify:plugin-package
npm run typecheck
BASE_SHA=$(cat "$(git rev-parse --git-path navi-confirmed-map-base)")
git diff --check "$BASE_SHA"..HEAD
```

Expected: verifier and typecheck exit `0`; diff check emits no output.

- [ ] **Step 4: Run temporary-project journey probes**

Use test helpers or `/tmp` roots only. Record exact commands and outputs for:

1. empty project + no payload => nonzero guided diagnosis, zero writes;
2. valid confirmed Chinese Map candidate + English user-facing invocation
   context => preview remains structurally valid and response contract remains
   English-following in skill fixtures;
3. preview fingerprint + exact write => Map created before trigger;
4. changed candidate or target => refusal, zero new activation writes;
5. Map-ready + missing trigger => trigger-only preview;
6. healthy active, paused, and closed doctor states;
7. trigger orphaned, invalid Map, unsupported version, symlinked Map, and edited
   trigger => truthful nonzero diagnosis; and
8. wrapper execution from an unrelated directory through a repository path
   containing spaces.

Do not call a live model and do not write to `engineering_loop`, `sub_ag_ski`,
`auto_model_reasoning`, real `$CODEX_HOME`, or another external project.

- [ ] **Step 5: Perform a final requirements and stale-language audit**

```bash
rg -n "Map status: provisional|navi init --suggest-map|\.navi/state\.md|docs/along/project-maps/" \
  README.md README.zh-CN.md plugins/navi/README.md docs/navi \
  .agents/skills/navi plugins/navi/skills/navi

rg -n -- "--suggest-map" src/cli/navi-init.ts tests/cli/navi-init.test.ts
```

Expected: the first command emits no active product behavior references. The
second command emits only the explicit removed-option diagnostic and its
negative regression assertions. Historical fixtures or explicit migration
assertions outside this active-path set may retain old text only when the test
names it as historical evidence.

- [ ] **Step 6: Fix only defects exposed by bounded verification**

For each defect, add or tighten the smallest relevant targeted test first, run
that test to observe failure, implement the minimal correction, rerun its
targeted file, and create one scoped fix commit. Do not expand into unrelated
refactoring or release verification.

- [ ] **Step 7: Finish at the parent review decision point**

Report:

- baseline SHA;
- every commit SHA and subject;
- files changed by task;
- exact Vitest file/test counts;
- plugin verifier, typecheck, and diff-check results;
- temporary journey probe results;
- confirmation that real global and external target state was not modified;
- residual product risks; and
- any real-project calibration that still requires user approval.

Keep the worktree clean. Do not merge, push, tag, release, or ask for a release
decision. The parent main session performs an independent read-only review and
decides whether to merge.

---

## Plan Completion Criteria

This plan is complete only when:

- the fixed Map contract is shared by init and doctor;
- no-payload init performs zero writes and cannot report initialization success;
- public suggested/provisional Map behavior is removed;
- exact preview fingerprints bind the candidate and current target state;
- initial writes are Map-first and trigger-last;
- doctor distinguishes missing, partial, invalid, unsafe, lifecycle, and healthy states;
- the canonical and packaged skill copies implement the confirmed journey and remain exact-sync;
- active documentation uses Navi-owned paths and no separate Project State;
- bounded automated verification and temporary calibration pass; and
- execution stops at parent review without merge, push, tag, or release.
