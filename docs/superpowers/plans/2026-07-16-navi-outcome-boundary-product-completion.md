# Navi Outcome Boundary And Product Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-compatible, write-new Outcome Boundary to Navi Project Maps, then collect the bounded natural evidence needed for a Codex-first Product Complete decision.

**Architecture:** Introduce Project Map contract version 2 with one new stable `navi:outcome-boundary` anchor while continuing to read version 1 Maps as `legacy-missing`. Keep boundary formation, revision, supervision, and closure policy in the existing Project Map owner and Adaptive Entry owner; keep `navi init` as the fingerprint-bound write path for new Maps and one exact legacy-to-current augmentation. After source integration, run Calibration-mode observations in two real projects and use the implementation task itself as the natural Supervised Delivery sample.

**Tech Stack:** TypeScript, Node.js filesystem APIs, Vitest, Markdown skill/reference contracts, Codex task messaging, Git worktrees.

## Global Constraints

- Do not begin implementation until the Adaptive Project Entry candidate has passed independent Level 3 validation and the user has explicitly approved integration into `main`.
- The Main Thread records the exact integrated `main` HEAD in the Execution Contract before creating the implementation worktree. That immutable HEAD is the implementation baseline.
- Execute implementation in one true Codex-managed worktree. Do not implement in the Main Thread.
- Use four task commits. Each task receives a fresh task-level review before the next task starts.
- At final `review-ready`, create one fresh Level 3 read-only Validation Thread for the exact candidate snapshot. It must be a true Codex task that can deliver a structured result directly to the Main Thread; an internal `multi_agent` subagent that requires `wait_agent` does not satisfy this contract. Reuse that validator for at most two in-scope remediation rounds.
- Do not merge, push, tag, release, publish, or modify a target project without a separate explicit user decision.
- Do not touch `work/`, Historical Along, MCP/runtime/UI, global Codex state, global npm state, package versions, release metadata, or dependencies.
- Do not add a database, daemon, watcher, scheduler, queue, second Map file, second project-entry command, automatic Map write, or support for agents other than Codex.
- `navi_map: 1` remains readable as a legacy Map with no confirmed Outcome Boundary. `navi_map: 2` is the only format accepted for a new or upgraded Map write.
- A version-1 Map missing Outcome Boundary is not invalid, unsupported, unsafe, or automatically repairable. It remains usable for best-effort supervision.
- A version-1 to version-2 migration may add only the Outcome Boundary section and update `navi_map` plus `last_confirmed`. It must preserve every other Map byte after line-ending normalization.
- Canonical files under `.agents/skills/navi/` and packaged files under `plugins/navi/skills/navi/` must remain byte-identical.
- Verification is bounded to affected CLI, skill, repository, package-mirror, and typecheck surfaces. Do not run full `npm test` unless a new shared-core finding changes the approved verification premise.
- Implementation success is not product proof. Calibration begins only after independent validation and explicit integration.

## Preconditions And File Ownership

Before Task 1, the Execution Thread must confirm:

```bash
git status --short --branch
git rev-parse HEAD
test -f .agents/skills/navi/references/project-entry-v1.md
test -f docs/superpowers/specs/2026-07-16-navi-outcome-boundary-design.md
test -f docs/superpowers/specs/2026-07-16-navi-codex-first-product-completion-design.md
```

Expected: clean isolated worktree, the exact baseline supplied by the Main
Thread, Adaptive Project Entry present, and both approved designs present.

Implementation ownership is divided as follows:

- `src/cli/navi-project-map.ts` owns Map version recognition, anchor validation,
  and exact v1-to-v2 upgrade comparison.
- `src/cli/navi-init-plan.ts` owns write-new candidate policy and the one allowed
  legacy augmentation plan.
- `.agents/skills/navi/references/project-map-v1.md` owns dual-boundary schema,
  revision, rendering, lifecycle, and maintenance behavior.
- `.agents/skills/navi/references/project-entry-v1.md` owns evidence-backed and
  Guided Baseline formation of Outcome Boundary.
- `.agents/skills/navi/references/supervision-v1.md` routes over-validation,
  scope drift, and closure decisions to the Project Map owner without copying
  the full boundary contract.
- Packaged skill files mirror canonical owners exactly.
- `docs/navi/project-init.md`, root/package READMEs, design history, and roadmap
  own current-source truthfulness and the post-implementation calibration gate.

---

### Task 1: Support Project Map V2 Without Invalidating V1

**Files:**
- Modify: `src/cli/navi-project-map.ts`
- Modify: `tests/cli/navi-project-map.test.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Modify: `tests/cli/navi-init-apply.test.ts`
- Modify: `tests/cli/navi-init-plan.test.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-project-trigger.test.ts`

**Interfaces:**
- Produces: `LEGACY_PROJECT_MAP_VERSION = 1`
- Produces: `CURRENT_PROJECT_MAP_VERSION = 2`
- Produces: `LEGACY_PROJECT_MAP_ANCHORS`
- Produces: `REQUIRED_PROJECT_MAP_ANCHORS` with `navi:outcome-boundary` between Desired Outcome and Route To Outcome
- Produces: `ProjectMapDocument.version: 1 | 2`
- Produces: `ProjectMapDocument.outcomeBoundaryStatus: "legacy-missing" | "confirmed"`
- Preserves: `parseProjectMapDocument(text)` and `inspectProjectMapFile(projectDir)` call signatures

- [ ] **Step 1: Add failing parser tests for current and legacy contracts**

Replace the one-version test helper with explicit v1 and v2 builders:

```ts
const legacyMap = () => renderMap(1, LEGACY_PROJECT_MAP_ANCHORS);
const currentMap = () => renderMap(2, REQUIRED_PROJECT_MAP_ANCHORS);

function renderMap(version: 1 | 2, anchors: readonly string[]): string {
  return `---
navi_map: ${version}
map_status: confirmed
project_status: active
last_confirmed: 2026-07-16
---
# Navi Project Map

${anchors.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed value ${index + 1}.`,
).join("\n\n")}
`;
}
```

Add assertions that:

```ts
expect(parseProjectMapDocument(legacyMap())).toMatchObject({
  kind: "valid",
  document: { version: 1, outcomeBoundaryStatus: "legacy-missing" },
});

expect(parseProjectMapDocument(currentMap())).toMatchObject({
  kind: "valid",
  document: { version: 2, outcomeBoundaryStatus: "confirmed" },
});

expect(parseProjectMapDocument(
  currentMap().replace("<!-- navi:outcome-boundary -->", ""),
)).toMatchObject({ kind: "invalid", recognizedVersion: 2 });

expect(parseProjectMapDocument(
  legacyMap().replace(
    "<!-- navi:route-to-outcome -->",
    "<!-- navi:outcome-boundary -->\n## Outcome Boundary\n\nPartial.\n\n<!-- navi:route-to-outcome -->",
  ),
)).toMatchObject({ kind: "invalid", recognizedVersion: 1 });
```

Retain coverage for metadata, lifecycle, date, duplicate anchors, ordering,
unsupported future versions, safe reads, symlinks, races, and no writes.

Mechanically update every shared `confirmedMap()` fixture that imports
`REQUIRED_PROJECT_MAP_ANCHORS` to emit `navi_map: 2`. Where a test needs an
unsupported version, use `navi_map: 3`; version 2 is now supported. Do not add
legacy behavior assertions outside `navi-project-map.test.ts` until Task 2.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-project-trigger.test.ts
```

Expected: FAIL because version 2 is unsupported and the new exports and
`outcomeBoundaryStatus` do not exist.

- [ ] **Step 3: Implement the versioned parser contract**

Use explicit versioned anchors:

```ts
export const LEGACY_PROJECT_MAP_VERSION = 1 as const;
export const CURRENT_PROJECT_MAP_VERSION = 2 as const;

export const LEGACY_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export const REQUIRED_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:outcome-boundary",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export type ProjectMapContractVersion = 1 | 2;
export type OutcomeBoundaryStatus = "legacy-missing" | "confirmed";

export interface ProjectMapDocument {
  version: ProjectMapContractVersion;
  mapStatus: "confirmed";
  projectStatus: ProjectLifecycleStatus;
  lastConfirmed: string;
  outcomeBoundaryStatus: OutcomeBoundaryStatus;
  text: string;
}
```

Select the exact anchor contract after parsing the integer version:

```ts
if (version !== LEGACY_PROJECT_MAP_VERSION && version !== CURRENT_PROJECT_MAP_VERSION) {
  return {
    kind: "unsupported",
    version,
    diagnostic: `Project Map contract version ${version} is not supported.`,
  };
}

const requiredAnchors = version === CURRENT_PROJECT_MAP_VERSION
  ? REQUIRED_PROJECT_MAP_ANCHORS
  : LEGACY_PROJECT_MAP_ANCHORS;
```

For version 1, reject the reserved Outcome Boundary anchor so a partially
upgraded document cannot masquerade as either contract. Generalize
`recognizedVersion` from literal `1` to `ProjectMapContractVersion` in parser
and file-state unions. Return `outcomeBoundaryStatus` from the selected version.

- [ ] **Step 4: Run parser tests and typecheck**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-project-trigger.test.ts
npm run typecheck
```

Expected: parser suite PASS and typecheck PASS.

- [ ] **Step 5: Review Task 1**

The fresh reviewer must verify that v1 remains valid and read-only, v2 requires
the new ordered anchor, every shared fixture now represents its declared
version, unsupported version 3 remains unsupported, and no filesystem safety
behavior changed.

- [ ] **Step 6: Commit Task 1**

```bash
git add src/cli/navi-project-map.ts tests/cli/navi-project-map.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-project-trigger.test.ts
git commit -m "feat: version navi outcome boundaries"
```

---

### Task 2: Enforce Write-New And One Exact Legacy Upgrade

**Files:**
- Modify: `src/cli/navi-project-map.ts`
- Modify: `src/cli/navi-init-plan.ts`
- Modify: `src/cli/navi-doctor.ts`
- Modify: `tests/cli/navi-init-plan.test.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `tests/cli/navi-init-apply.test.ts`
- Modify: `tests/cli/navi-doctor.test.ts`

**Interfaces:**
- Consumes: versioned `ProjectMapDocument` from Task 1
- Produces: `isOutcomeBoundaryOnlyUpgrade(current, candidate): boolean`
- Changes internal candidate inspection to return `{ text, document }`
- Preserves: existing CLI arguments and fingerprint-bound preview/write journey
- Preserves: v1 trigger-only activation when no Map write is requested
- Produces: doctor warning for a readable v1 Map without treating it as invalid

- [ ] **Step 1: Add failing write-policy and migration tests**

Use explicit local fixtures in each affected CLI test file:

```ts
function renderConfirmedMap(version: 1 | 2, anchors: readonly string[]): string {
  return `---
navi_map: ${version}
map_status: confirmed
project_status: active
last_confirmed: 2026-07-16
---
# Navi Project Map

${anchors.map((anchor) => {
  const heading = anchor.replace("navi:", "").split("-").map(
    (part) => part[0]!.toUpperCase() + part.slice(1),
  ).join(" ");
  const value = anchor === "navi:route-to-outcome" ? "Confirmed route." : `Confirmed ${heading}.`;
  return `<!-- ${anchor} -->\n## ${heading}\n\n${value}`;
}).join("\n\n")}
`;
}

const legacyConfirmedMap = () => renderConfirmedMap(1, LEGACY_PROJECT_MAP_ANCHORS);
const currentConfirmedMapWithOnlyOutcomeBoundaryAdded = () =>
  renderConfirmedMap(2, REQUIRED_PROJECT_MAP_ANCHORS);
```

Add focused cases proving:

```ts
it("keeps a legacy v1 Map readable and permits trigger-only activation", async () => {
  const project = await createProject();
  await writeCanonicalMap(project, legacyConfirmedMap());
  const plan = await buildInitPlan({ targetDir: project });
  expect(plan.actions.map((action) => action.relativePath)).toEqual(["AGENTS.md"]);
});

it("requires v2 for a newly created Map", async () => {
  const project = await createProject();
  const candidate = await writeCandidate(project, legacyConfirmedMap());
  const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });
  expect(plan).toMatchObject({ state: "blocked", actions: [] });
  expect(plan.diagnostic).toMatch(/version 2|Outcome Boundary/i);
});

it("plans one exact v1-to-v2 Outcome Boundary augmentation", async () => {
  const project = await createProject();
  const before = legacyConfirmedMap();
  const after = currentConfirmedMapWithOnlyOutcomeBoundaryAdded();
  await writeCanonicalMap(project, before);
  const candidate = await writeCandidate(project, after);
  const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });
  expect(plan.actions[0]).toMatchObject({
    kind: "modify",
    relativePath: ".navi/project-map.md",
    previousContent: before,
    content: after,
  });
});

it("rejects a legacy upgrade that also changes Route To Outcome", async () => {
  const project = await createProject();
  await writeCanonicalMap(project, legacyConfirmedMap());
  const candidate = await writeCandidate(
    project,
    currentConfirmedMapWithOnlyOutcomeBoundaryAdded().replace("Confirmed route", "Changed route"),
  );
  const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });
  expect(plan).toMatchObject({ state: "blocked", actions: [] });
});
```

Also add a guarded-write test that changes the v1 Map after preview and proves
neither the Map nor `AGENTS.md` is written.

Add doctor cases proving:

```ts
// Extend the existing navi-doctor import with inspectProjectInitialization.
const f = await fixture();
const mapPath = path.join(f.projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
await fs.mkdir(path.dirname(mapPath), { recursive: true });
await fs.writeFile(mapPath, legacyConfirmedMap(), "utf8");
await fs.writeFile(path.join(f.projectDir, "AGENTS.md"), `${renderAgentsBlock()}\n`, "utf8");

expect(await inspectProjectInitialization(f.projectDir)).toMatchObject({
  kind: "healthy",
  outcomeBoundaryStatus: "legacy-missing",
});

const report = await buildNaviDoctorReport(
  { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
  { inspectInstallation: async () => current(f.source), invocation: trustedInvocation },
);
expect(report.checks.find((check) => check.id === "project-init")).toMatchObject({
  status: "warn",
});
expect(report.checks.find((check) => check.id === "project-init")?.summary).toMatch(
  /readable[\s\S]*Outcome Boundary/i,
);
```

Use the existing `fixture()`, `current()`, `trustedInvocation`,
`renderAgentsBlock()`, and `buildNaviDoctorReport()` helpers in that test file;
do not add production-only test seams.

- [ ] **Step 2: Run the CLI tests and verify RED**

Run:

```bash
npm test -- tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-doctor.test.ts
```

Expected: FAIL because current init treats v1 as the only writable contract and
rejects every differing candidate as a generic update.

- [ ] **Step 3: Implement exact upgrade comparison**

Add a pure helper in `src/cli/navi-project-map.ts`:

```ts
export function isOutcomeBoundaryOnlyUpgrade(
  current: ProjectMapDocument,
  candidate: ProjectMapDocument,
): boolean {
  if (current.version !== LEGACY_PROJECT_MAP_VERSION) return false;
  if (candidate.version !== CURRENT_PROJECT_MAP_VERSION) return false;
  if (current.projectStatus !== candidate.projectStatus) return false;

  const normalizedCurrent = normalizeMapForUpgradeComparison(current.text);
  const normalizedCandidate = normalizeMapForUpgradeComparison(
    removeOutcomeBoundarySection(candidate.text),
  )
    .replace(/^navi_map: 2$/m, "navi_map: 1")
    .replace(
      /^last_confirmed: \d{4}-\d{2}-\d{2}$/m,
      `last_confirmed: ${current.lastConfirmed}`,
    );

  return normalizedCandidate === normalizedCurrent;
}

function normalizeMapForUpgradeComparison(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

function removeOutcomeBoundarySection(text: string): string {
  const normalized = normalizeMapForUpgradeComparison(text);
  const startMarker = "\n\n<!-- navi:outcome-boundary -->";
  const endMarker = "\n\n<!-- navi:route-to-outcome -->";
  const start = normalized.indexOf(startMarker);
  const end = normalized.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) return normalized;
  return normalized.slice(0, start) + normalized.slice(end);
}
```

The implementation must verify exactly one Outcome Boundary anchor before this
helper runs; Task 1 parser owns that invariant.

- [ ] **Step 4: Route candidate policy in `buildInitPlan`**

Change candidate inspection to return its parsed document:

```ts
async function inspectConfirmedMapCandidate(
  targetDir: string,
  mapFile: string,
): Promise<{ text: string; document: ProjectMapDocument }> {
  // Preserve lstat, O_NOFOLLOW, realpath, and read safety checks.
  const parsed = parseProjectMapDocument(text);
  if (parsed.kind !== "valid") {
    throw new Error(`Candidate is not a valid confirmed Project Map: ${parsed.diagnostic}`);
  }
  return { text, document: parsed.document };
}
```

Apply these branches in order:

```ts
if (
  mapState.kind === "missing"
  && candidate !== undefined
  && candidate.document.version !== CURRENT_PROJECT_MAP_VERSION
) {
  return blockedPlan(base, "A new confirmed Project Map must use version 2 with Outcome Boundary.");
}

if (mapState.kind === "valid" && candidate !== undefined) {
  if (mapState.document.text === candidate.text) {
    // Preserve byte-identical trigger-only behavior, including v1.
  } else if (isOutcomeBoundaryOnlyUpgrade(mapState.document, candidate.document)) {
    // Plan one fingerprint-bound Map modify action before trigger activation.
  } else {
    return blockedPlan(base, "navi init permits only an exact legacy Outcome Boundary upgrade, not a generic Map update.");
  }
}
```

Recognized invalid Map repair remains guarded, but any replacement write must be
version 2. Preserve transaction, path, race, preview, and fingerprint behavior.

In `src/cli/navi-doctor.ts`, carry
`map.document.outcomeBoundaryStatus` into `ProjectInitializationState` whenever
the Map is valid. A healthy v1 Map returns a warning that it is readable but has
no confirmed Outcome Boundary and points to the candidate preview path. A v1
Map with a missing trigger still prioritizes the existing trigger activation
warning and may mention the boundary as a non-blocking detail. Never classify
v1 as `map-invalid`, and never recommend automatic migration.

- [ ] **Step 5: Run the complete affected CLI surface**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-init-fingerprint.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-project-trigger.test.ts
npm run typecheck
```

Expected: 5 files PASS and typecheck PASS.

- [ ] **Step 6: Review Task 2**

The reviewer must trace missing, valid-v1, valid-v2, invalid-recognized,
unsupported, unsafe, byte-identical, exact-upgrade, generic-update, drift, and
partial-write paths. It must also verify that doctor reports v1 as readable and
non-blocking rather than invalid. Any path that silently rewrites v1 or allows
changes beyond the added boundary is Important.

- [ ] **Step 7: Commit Task 2**

```bash
git add src/cli/navi-project-map.ts src/cli/navi-init-plan.ts src/cli/navi-doctor.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-doctor.test.ts
git commit -m "feat: migrate navi outcome boundaries safely"
```

---

### Task 3: Activate Dual-Boundary Supervision Contracts

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/project-map-v1.md`
- Modify: `.agents/skills/navi/references/project-entry-v1.md`
- Modify: `.agents/skills/navi/references/supervision-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/project-map-v1.md`
- Modify: `plugins/navi/skills/navi/references/project-entry-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md`
- Modify: `tests/skills/navi-project-map.test.ts`
- Modify: `tests/skills/navi-project-entry.test.ts`
- Modify: `tests/skills/navi-supervision.test.ts`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`

**Interfaces:**
- Consumes: v1/v2 contract and migration policy from Tasks 1-2
- Produces: one canonical Outcome Boundary policy owner in `project-map-v1.md`
- Produces: evidence-first and Guided Baseline formation rules in `project-entry-v1.md`
- Produces: quiet routing from `supervision-v1.md`
- Preserves: current-prompt language following, quietness, direct lane messaging, validation boundaries, and package mirrors

- [ ] **Step 1: Add failing contract tests**

Add focused assertions for the approved semantic contract:

```ts
expect(projectMap).toMatch(/Outcome Boundary[\s\S]*Enough Outcome[\s\S]*Acceptance Evidence[\s\S]*Outside This Boundary[\s\S]*Revisit Trigger/i);
expect(projectMap).toMatch(/Outcome Boundary[\s\S]*whole current goal[\s\S]*Current Boundary[\s\S]*current stage/i);
expect(projectMap).toMatch(/version 1[\s\S]*legacy[\s\S]*readable[\s\S]*version 2[\s\S]*new/i);
expect(projectMap).toMatch(/Existing Boundary[\s\S]*Proposed Boundary[\s\S]*Reason For Change[\s\S]*Decision Required/i);
expect(projectMap).toMatch(/ordinary commits[\s\S]*do not[\s\S]*reconfirm/i);
expect(projectMap).toMatch(/Acceptance Evidence[\s\S]*quiet/i);

expect(projectEntry).toMatch(/coherent[\s\S]*Outcome Boundary candidate/i);
expect(projectEntry).toMatch(/two or three[\s\S]*completion levels/i);
expect(projectEntry).toMatch(/provisional[\s\S]*user confirms[\s\S]*Revisit Trigger/i);
expect(projectEntry).toMatch(/no default recommendation|supports no default recommendation/i);

expect(supervision).toMatch(/Outcome Boundary[\s\S]*project-map-v1\.md/i);
expect(supervision).toMatch(/outside[\s\S]*scope|over-validation[\s\S]*Acceptance Evidence/i);
expect(supervision).toMatch(/Silent Tracking|lightest sufficient surface/i);
```

Add a one-owner assertion that the four-field detailed schema appears in
`project-map-v1.md` but is not duplicated as a second full schema in
`supervision-v1.md`.

- [ ] **Step 2: Run focused skill tests and verify RED**

Run:

```bash
npm test -- tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts
```

Expected: FAIL because Outcome Boundary and its compatibility policy are absent.

- [ ] **Step 3: Update the canonical Project Map owner**

Add the exact semantic structure:

```markdown
### Dual-Boundary Model

- Outcome Boundary owns whole-goal completion and contains Enough Outcome,
  Acceptance Evidence, Outside This Boundary, and Revisit Trigger.
- Current Boundary owns the current-stage stopping condition.
- Next Decision owns the real user judgment after the current stop.

A version-1 Map remains readable as legacy-missing. A newly confirmed or
approved replacement Map uses version 2 and includes the ordered
`navi:outcome-boundary` anchor. Missing Outcome Boundary alone is uncertainty,
not corruption and not authorization to rewrite the Map.
```

Add material revision triggers, existing/proposed boundary comparison, user
confirmation, quiet rendering, completion evidence handling, outside-boundary
future options, and closed-project quietness from the approved design.

- [ ] **Step 4: Update Adaptive Entry and supervision routing**

In `project-entry-v1.md`, make Outcome Boundary a required v2 baseline judgment.
Evidence-First forms a candidate only from coherent evidence. Guided Baseline
offers two or three project-specific completion levels when needed, asks one
question at a time, and permits a user-confirmed provisional boundary with a
Revisit Trigger.

In `supervision-v1.md`, route vision-distance, scope-expansion,
over-validation, and closure questions to the Project Map owner. Preserve the
quietness gate: do not print the full boundary for ordinary execution,
lightweight confirmation, or clear approved loops.

In `SKILL.md`, add hard boundaries:

```markdown
- Navi must not silently change a user-confirmed Outcome Boundary.
- Navi must not treat implementation momentum, passing tests, or an attractive
  future feature as approval to expand the whole-goal completion line.
- Navi must not require a legacy-readable version-1 Map to be reinitialized
  before providing useful read-only supervision.
```

- [ ] **Step 5: Synchronize package mirrors mechanically**

After canonical edits, synchronize only the four corresponding packaged files.
Then run:

```bash
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
diff -q .agents/skills/navi/references/project-map-v1.md plugins/navi/skills/navi/references/project-map-v1.md
diff -q .agents/skills/navi/references/project-entry-v1.md plugins/navi/skills/navi/references/project-entry-v1.md
diff -q .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md
```

Expected: no output.

- [ ] **Step 6: Run skill and package verification**

Run:

```bash
npm test -- tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts
npm run verify:plugin-package
```

Expected: focused tests PASS, manifest validation PASS, and source/package drift
check PASS.

- [ ] **Step 7: Review Task 3**

The reviewer must check dual-boundary ownership, provisional truthfulness,
evidence-backed recommendations, user confirmation, legacy quietness, language
following, no heavy default output, and no runtime or automatic-write claim.

- [ ] **Step 8: Commit Task 3**

```bash
git add .agents/skills/navi plugins/navi/skills/navi tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts
git commit -m "feat: supervise navi outcome boundaries"
```

---

### Task 4: Make Current-Source Documentation And Gate Status Truthful

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/navi/project-init.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `tests/repository/current-surface.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: implemented v2 contract and prompt-backed behavior from Tasks 1-3
- Produces: truthful current-main documentation and the next Calibration gate
- Preserves: latest tagged release versus unreleased current-main distinction
- Preserves: no npm publication, marketplace, runtime, UI, or release claim

- [ ] **Step 1: Add failing current-surface assertions**

Add assertions that current documentation states:

```ts
expect(projectInit).toMatch(/navi_map: 2[\s\S]*Outcome Boundary/i);
expect(projectInit).toMatch(/version 1[\s\S]*readable[\s\S]*does not require reinitialization/i);
expect(projectInit).toMatch(/preview[\s\S]*fingerprint[\s\S]*approval/i);
expect(roadmap).toMatch(/Outcome Boundary[\s\S]*real-project calibration/i);
expect(readme).toMatch(/current main[\s\S]*unreleased/i);
expect(readme).not.toMatch(/runtime scheduler|background service is included/i);
```

Retain existing assertions for Adaptive Entry, Supervised Delivery, source-alpha
truthfulness, Historical Along isolation, and alpha.3 tagged-release wording.

- [ ] **Step 2: Run focused documentation tests and verify RED**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because current docs still describe v1 as the new-write Map
contract and do not identify Outcome Boundary calibration as the next gate.

- [ ] **Step 3: Update current-source documentation**

Document this user journey without implying automatic mutation:

```text
global source setup once
-> adaptive project evidence judgment
-> user-confirmed Desired Outcome plus Outcome Boundary
-> one v2 Map and managed-trigger preview
-> one fingerprint-bound approved write
-> fresh-session supervision
-> material boundary revision only with user confirmation
```

State that v1 Maps remain readable, v2 is required for new and upgraded writes,
and the exact v1-to-v2 augmentation is the only Map migration accepted through
`navi init`. Keep tagged alpha.3 versus unreleased current-main wording intact.

Use these capability-truthfulness statements in the English surfaces:

```markdown
Current main writes Project Map contract version 2 with a user-confirmed Outcome
Boundary. Existing version-1 Maps remain readable and do not require immediate
reinitialization. A version-1 Map can receive one fingerprint-bound approved
Outcome Boundary augmentation; Navi does not migrate or rewrite it
automatically. This current-main behavior remains unreleased until a later tag
explicitly includes it.
```

Use the corresponding statement in `README.zh-CN.md`:

```markdown
当前 main 使用 Project Map contract version 2 写入经过用户确认的 Outcome
Boundary。现有 version-1 Map 仍然可读，不需要立即重新初始化。version-1 Map
只能通过一次经过预览、指纹绑定和用户批准的 Outcome Boundary 补充升级；Navi
不会自动迁移或重写它。该 current-main 行为仍未发布，只有后续 tag 明确包含时
才属于已发布版本。
```

In design history, index both approved designs and this active plan. In roadmap,
set the next gate to real-project Outcome Boundary and Product Complete
calibration, not release preparation.

- [ ] **Step 4: Run final bounded verification**

Run:

```bash
npm test -- tests/cli/navi-project-map.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-init-fingerprint.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-project-trigger.test.ts tests/repository/current-surface.test.ts tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/skills/navi-skill.test.ts
npm run typecheck
npm run verify:plugin-package
git diff --check
```

Expected: all 13 focused files PASS, typecheck PASS, package verifier PASS, and
diff check PASS. Do not run full `npm test`.

- [ ] **Step 5: Run scope and capability audits**

Run:

```bash
git diff --name-only "$(git merge-base HEAD main)"..HEAD
git diff "$(git merge-base HEAD main)"..HEAD -- package.json package-lock.json plugins/navi/VERSION.md archive/along work
rg -n "daemon|database|background watcher|automatic Map write|auto.*commit|auto.*push|auto.*release" src/cli .agents/skills/navi plugins/navi/skills/navi docs/navi README.md README.zh-CN.md
```

Expected: only planned files changed; forbidden diff is empty; text matches, if
any, describe explicit non-goals rather than shipped capability.

- [ ] **Step 6: Obtain fresh whole-candidate review**

The reviewer must inspect the approved design, this plan, all four commits, the
complete baseline-to-HEAD diff, parser/migration safety, one-owner policy,
package mirrors, docs truthfulness, and test adequacy. Any Critical or Important
finding blocks `review-ready`.

- [ ] **Step 7: Commit Task 4**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md docs/navi/project-init.md docs/navi/design-history.md docs/navi/roadmap.md tests/repository/current-surface.test.ts tests/skills/navi-skill.test.ts
git commit -m "docs: explain navi outcome boundary migration"
```

- [ ] **Step 8: Emit one review-ready event**

The event must contain the exact baseline, exact reviewed snapshot, four commit
hashes, complete changed scope, every executed command and result, all approved
amendments, review findings, and residual risks. The Main Thread then creates
one fresh Level 3 read-only Validation Thread automatically.

---

## Calibration Phase

Calibration is a separate Work Mode after implementation validation and
explicit integration. It does not run inside the implementation worktree and
does not prove the whole repository correct. Every target-project write still
requires explicit approval.

The designated real-project inventory currently contains no
`.navi/project-map.md`, so it contains no natural version-1 migration sample.
Do not manufacture one and label it natural evidence. The exact v1-to-v2 path
is accepted from targeted implementation tests and independent review. A
temporary disposable smoke may be run later with explicit authorization, but it
does not count toward the natural Product Complete portfolio. If a real v1 Map
appears before completion judgment, it may replace that evidence gap through a
separately approved calibration.

### Calibration 1: Mature Stale/Conflicting Project

**Target:** `/Users/james/Codex Project/General Codex Project/sub_ag_ski`

**Initial action:** fresh read-only Codex session with the natural prompt:

```text
接下来我们应该做什么？
```

**Expected evidence judgment:** the old release-preparation direction conflicts
with current value-validation evidence. Navi should identify the current goal as
deciding whether `agent-delegate` v1 creates enough measurable value to justify
v2 design.

**Expected Outcome Boundary candidate:**

```text
Enough Outcome:
Complete the frozen v1 value-validation experiment and make the explicit
decision whether evidence justifies v2 design.

Acceptance Evidence:
The planned 48-run paired experiment, median main-agent context reduction of at
least 20%, quality decline no greater than 5 points with no critical-error
increase, total token increase no greater than 20%, completion-time increase no
greater than 25%, and no more than 2 harmful delegations in 24 enabled runs.

Outside This Boundary:
v2 implementation, market-demand proof, broad platform compatibility,
commercialization, and public release work.

Revisit Trigger:
The frozen experiment completes, telemetry needed for the run protocol is
unavailable, or the evidence invalidates the current value hypothesis.
```

**Success conditions:** bounded evidence scan; no request that the user classify
the project; stale release map is not followed; recommendation remains separate
from approval; complete candidate includes both boundaries; no write, test,
commit, or init before explicit permission.

### Calibration 2: Evidence-Poor Guided Baseline

**Target:** `/Users/james/Codex Project/General Codex Project/engineering_loop/engineering-loop-kit-transition-package`

**Initial action:** fresh read-only Codex session with the natural prompt:

```text
What should we do next?
```

**Expected evidence judgment:** README establishes Loopwright's identity and
repository structure but does not establish the current completion level,
Current Position, Current Boundary, or Next Decision. Navi should classify the
baseline as insufficient rather than coherent.

**Expected interaction:** ask one focused question and offer two or three
project-specific completion levels, such as validating the standard,
establishing an adoption-ready V1, or preparing broader distribution. Do not
select one automatically. After the user chooses, form a provisional Outcome
Boundary with a concrete Revisit Trigger.

**Success conditions:** English response follows the English prompt; no invented
roadmap or current stage; one question at a time; no mandatory full map output
before enough evidence; no write or init before explicit approval; provisional
does not sound permanent.

### Calibration 3: Natural Supervised Delivery And Closure

Use the Outcome Boundary implementation itself as the natural Supervised
Delivery sample. Collect from actual events rather than reconstructing them:

- one task-scoped Execution Thread;
- one candidate-scoped read-only Validation Thread;
- the Validation Thread is a true Codex task and delivers its structured result
  directly to the Main Thread without user prompting, relay, or `wait_agent`;
- zero user-relayed lane events;
- zero duplicate validators for one event and snapshot;
- zero validator writes;
- zero meaningless continuation prompts;
- no more than two bounded remediation rounds; and
- permission, premise, scope, risk, integration, and release decisions remain
  with the user.

After both project-entry calibrations, compare evidence with the Codex-first
Product Complete Outcome Boundary. The Main Thread must present:

```text
Three-Pillar Evidence
Source Operation Evidence
Natural Closure Evidence
Open Critical Or Important Findings
Accepted Minor Debt
Recommendation
Decision Required
```

If no Critical or Important issue remains and the approved Acceptance Evidence
is present, recommend closing the Codex-first Product Complete line and entering
a quiet state. Distribution Ready, Runtime Surface, UI, and other-agent adapters
remain future choices; do not open one automatically.

## Final Stop Point

This plan stops at the user's Codex-first Product Complete decision. It does not
authorize push, tag, release, npm publication, marketplace publication,
Distribution Ready implementation, Runtime Surface design, UI work, or support
for another agent.
