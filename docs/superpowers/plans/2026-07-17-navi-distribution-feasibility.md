# Navi Distribution Feasibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in a true Codex-managed worktree task. Do not
> execute this plan in the persistent Main Thread, and do not reinterpret it as
> `subagent-driven-development` inside the Main Thread. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Produce one review-ready Navi plugin candidate whose installed skill
contains a self-contained project-init entry and whose Git-backed and local
marketplace artifacts can be staged for real feasibility calibration without
publishing a release.

**Architecture:** Bundle the existing TypeScript `navi init` implementation into
one generated package-local ESM entry with `esbuild`, preserving one source of
truth for fingerprint, path, Map, trigger, and write safety. Route installed
skill onboarding to that entry, then add a deterministic staging tool that
renders an immutable remote marketplace catalog and a local-marketplace bundle
from the same plugin bytes. Keep real marketplace installation, target-project
calibration, version selection, ZIP/checksum creation, tag, GitHub Release, and
Public Plugin Directory work outside this implementation lane.

**Tech Stack:** TypeScript, Node.js 20-compatible ESM, `esbuild` 0.28.1 as one
build-only dependency, Node.js filesystem/process APIs, Vitest, Markdown
skill/reference contracts, Codex plugin marketplace metadata, Git worktrees.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-17-navi-distribution-ready-design.md`.
- The exact clean `main` commit containing the approved design and this plan is
  supplied as the worktree baseline. The Execution Thread records it before
  editing.
- Execute in one true Codex-managed worktree. The persistent Main Thread may
  continue only non-conflicting design or supervision work.
- Use exactly four task commits with the subjects defined below. Each task gets
  a fresh task-level review before the next task starts.
- At final `review-ready`, create one fresh Level 3 read-only Validation Thread
  for the exact candidate snapshot. Reuse that validator for at most two
  in-scope remediation rounds.
- The user has approved one new dependency:
  `esbuild@^0.28.1`. It is build-only. Do not add any other dependency, runtime
  package, package manager, installer framework, archive library, or network
  client.
- Project-local `npm ci` in the isolated worktree is preauthorized under the
  existing bounded dependency-install rule. The approved
  `npm install --save-dev esbuild@^0.28.1` may modify only `package.json` and
  `package-lock.json`; it must not modify global npm state.
- The generated plugin init entry must contain no `tsx`, `esbuild`,
  `node_modules`, source-checkout path, hardcoded Codex cache path, or external
  runtime dependency beyond Node built-ins.
- Bundling does not prove Node is guaranteed on every Codex surface. The
  implementation must fail truthfully when Node is unavailable; real
  macOS/Linux/WSL runtime evidence belongs to post-integration Calibration
  mode.
- Preserve existing `navi init` arguments, Map V1/V2 behavior, evidence bounds,
  fingerprint binding, Map-first/trigger-last ordering, symlink refusal,
  freshness checks, and partial-activation diagnosis.
- Preserve `navi-source` as the technical marketplace identifier and `navi` as
  the plugin identifier. Change only the user-facing marketplace display name
  to `Navi Releases`.
- The checked-in root marketplace remains a source/calibration catalog in this
  implementation. A generated immutable remote catalog is a staged output; it
  must not replace the root catalog before an explicit Release plan selects the
  exact version and tag.
- Canonical and packaged skill trees, including the generated script, remain
  byte-identical.
- Do not generate or commit `dist/`, a ZIP, `SHA256SUMS`, a release tag, a
  GitHub Release, or Public Plugin Directory submission material in this lane.
- Do not run global marketplace commands, install the candidate into Codex,
  initialize a real target project, or modify external projects in this lane.
- Do not touch `work/`, Historical Along, Runtime Surface, UI, MCP, background
  services, other-agent support, npm publication metadata, or global Codex
  state.
- Do not run full `npm test`. Use the exact bounded checks in this plan.
- Do not merge, push, tag, release, publish, or accept known product risk
  without a separate explicit Main Thread decision.

## Execution Contract

```text
goal: implement the bounded Navi Distribution feasibility candidate
user_value: an unfamiliar Codex user can obtain the same plugin bytes through a Git-backed or local marketplace and the installed skill has one safe package-local project-init path
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved Distribution Ready design and this plan
allowed_scope: the exact build, package, canonical/package skill, marketplace, focused-test, and current-doc paths listed in Tasks 1-4
forbidden_scope: release tag, GitHub Release, ZIP, checksum publication, Public Plugin Directory submission, npm publication, global install, external target project, work/, Historical Along, Runtime Surface, UI, MCP, background service, other-agent support
implementation_plan: docs/superpowers/plans/2026-07-17-navi-distribution-feasibility.md
verification_budget: exact Task 1-4 tests, final bounded suite, typecheck, plugin verification, generated-entry check, diff and scope audits; no full npm test
validation_level: 3
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

The Execution Thread may create the four local task commits without separate
commit approval. A second dependency, a native binary, a runtime fallback that
writes project files directly from skill instructions, root-catalog release
activation, target-project mutation, global install, verification-budget
expansion, or runtime requirement change is premise-changing and returns to
the Main Thread.

## Preconditions

Before Task 1, run:

```bash
git status --short --branch
git rev-parse HEAD
test -f docs/superpowers/specs/2026-07-17-navi-distribution-ready-design.md
test -f docs/superpowers/plans/2026-07-17-navi-distribution-feasibility.md
test -f plugins/navi/.codex-plugin/plugin.json
test -f .agents/plugins/marketplace.json
test -f src/cli/navi-init.ts
test ! -e dist
```

Expected: clean isolated worktree at the supplied baseline, every required file
present, and no staged distribution output.

Run the existing bounded baseline before editing:

```bash
npm ci
npm test -- tests/package/navi-package.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-project-map.test.ts tests/cli/navi-project-trigger.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-project-map.test.ts tests/skills/navi-skill.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
```

Expected: bounded baseline PASS. If `npm ci` changes `package.json` or
`package-lock.json`, stop as `decision-required`. Existing npm audit findings do
not authorize dependency remediation.

## Planned File Structure And Ownership

### Package-local init build

- `src/cli/navi-plugin-init.ts`: minimal bundle entry that delegates only to
  `runNaviInitCli(process.argv.slice(2))`.
- `scripts/build-plugin-init.mjs`: sole owner for deterministic bundling,
  canonical/package writes, executable mode, and `--check` drift detection.
- `.agents/skills/navi/scripts/navi-project-init.mjs`: generated canonical
  package-local init entry.
- `plugins/navi/skills/navi/scripts/navi-project-init.mjs`: byte-identical
  packaged copy.
- `tests/package/navi-plugin-init.test.ts`: installed-copy simulation, no-source
  dependency, read-only preview, exact fingerprint write, and file-boundary
  coverage.

### Installed-skill routing

- `.agents/skills/navi/references/project-map-v1.md`: sole owner for resolving
  and invoking the loaded skill's package-local init entry at the existing
  preview/write boundary.
- `.agents/skills/navi/references/project-entry-v1.md`: hands a confirmed
  candidate to that boundary without copying invocation detail.
- `.agents/skills/navi/SKILL.md`: routes installed-plugin initialization to the
  Project Map owner.
- `plugins/navi/skills/navi/**`: byte-identical mirrors.
- `scripts/verify-plugin-package.mjs`: checks the generated entry before skill
  tests, manifest validation, and mirror drift.

### Distribution staging

- `scripts/stage-plugin-distribution.mjs`: owns release-identity validation,
  remote catalog rendering, local-marketplace staging, source symlink refusal,
  and a machine-readable staging manifest. It does not create archives or
  checksums.
- `tests/package/navi-distribution.test.ts`: exact remote/local catalog,
  identity, package-byte, forbidden-scope, and refusal coverage.
- `.agents/plugins/marketplace.json`: retains the local source entry and stable
  `navi-source` id; changes only display name to `Navi Releases` before Release
  activation.

### Current-source truthfulness

- `README.md`, `README.zh-CN.md`, `plugins/navi/README.md`, and
  `plugins/navi/VERSION.md`: distinguish the latest tagged source alpha from the
  unreleased Distribution feasibility candidate.
- `docs/navi/project-init.md`: explains installed package-local preview/write
  behavior and runtime failure boundary.
- `docs/navi/product-debt.md`: replaces the generic marketplace gap with the
  remaining feasibility, calibration, Release, and optional Directory gaps.
- `docs/navi/design-history.md` and `docs/navi/roadmap.md`: index the approved
  design and plan while preserving Product Complete calibration as an open
  product gate and Distribution feasibility as a separately approved lane.
- Focused repository/skill tests own truthfulness and one-owner assertions.

---

### Task 1: Bundle The Existing Init Path Into The Installed Skill

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/cli/navi-plugin-init.ts`
- Create: `scripts/build-plugin-init.mjs`
- Create: `.agents/skills/navi/scripts/navi-project-init.mjs` (generated)
- Create: `plugins/navi/skills/navi/scripts/navi-project-init.mjs` (generated)
- Create: `tests/package/navi-plugin-init.test.ts`

**Interfaces:**
- Consumes: `runNaviInitCli(args)` from `src/cli/navi-init.ts`.
- Produces: `npm run build:plugin-init`.
- Produces: `npm run check:plugin-init`.
- Produces: executable package path
  `skills/navi/scripts/navi-project-init.mjs` in canonical and packaged trees.
- Preserves: all existing `navi init` CLI arguments and exit codes.

- [ ] **Step 1: Add failing installed-copy package tests**

Create `tests/package/navi-plugin-init.test.ts` with these helpers and cases:

```ts
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { REQUIRED_PROJECT_MAP_ANCHORS } from "../../src/cli/navi-project-map";

const roots = new Set<string>();
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const canonicalEntry = path.join(
  repoRoot,
  ".agents/skills/navi/scripts/navi-project-init.mjs",
);
const packagedEntry = path.join(
  repoRoot,
  "plugins/navi/skills/navi/scripts/navi-project-init.mjs",
);

function confirmedMap(): string {
  return `---
navi_map: 2
map_status: confirmed
project_status: active
last_confirmed: 2026-07-17
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed ${index + 1}.`,
).join("\n\n")}
`;
}

function installedCopy(): { root: string; entry: string; project: string } {
  const root = mkdtempSync(path.join(tmpdir(), "navi-plugin-init-"));
  roots.add(root);
  const plugin = path.join(root, "cache", "navi-source", "navi", "0.1.0");
  const project = path.join(root, "target project");
  mkdirSync(project, { recursive: true });
  cpSync(path.join(repoRoot, "plugins/navi"), plugin, { recursive: true });
  return {
    root,
    entry: path.join(plugin, "skills/navi/scripts/navi-project-init.mjs"),
    project,
  };
}

afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  roots.clear();
});

describe("installed Navi package-local init entry", () => {
  it("is generated, executable, mirrored, and source-path independent", () => {
    expect(existsSync(canonicalEntry)).toBe(true);
    expect(existsSync(packagedEntry)).toBe(true);
    expect(readFileSync(packagedEntry)).toEqual(readFileSync(canonicalEntry));
    expect(statSync(packagedEntry).mode & 0o111).not.toBe(0);

    const text = readFileSync(packagedEntry, "utf8");
    expect(text).not.toContain("tsx/esm/api");
    expect(text).not.toContain("node_modules");
    expect(text).not.toContain(repoRoot);
    expect(text).not.toContain("~/.codex/plugins/cache");
  });

  it("runs a read-only preview from a copied plugin and unrelated cwd", () => {
    const fixture = installedCopy();
    const result = spawnSync(process.execPath, [
      fixture.entry,
      "--target",
      fixture.project,
    ], { cwd: fixture.root, encoding: "utf8" });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stdout).toContain("Navi init preview");
    expect(result.stdout).toContain("confirmed Project Map");
    expect(existsSync(path.join(fixture.project, ".navi"))).toBe(false);
    expect(existsSync(path.join(fixture.project, "AGENTS.md"))).toBe(false);
  });

  it("writes only the approved Map and managed trigger after exact preview", () => {
    const fixture = installedCopy();
    const candidate = path.join(fixture.root, "candidate.md");
    writeFileSync(candidate, confirmedMap());

    const preview = spawnSync(process.execPath, [
      fixture.entry,
      "--target", fixture.project,
      "--map-file", candidate,
    ], { cwd: fixture.root, encoding: "utf8" });
    const fingerprint = preview.stdout.match(/^Plan fingerprint: ([a-f0-9]{64})$/m)?.[1];
    expect(preview.status, preview.stderr).toBe(0);
    expect(fingerprint).toBeDefined();
    expect(existsSync(path.join(fixture.project, ".navi"))).toBe(false);

    const apply = spawnSync(process.execPath, [
      fixture.entry,
      "--target", fixture.project,
      "--map-file", candidate,
      "--expect-plan", fingerprint!,
      "--write",
    ], { cwd: fixture.root, encoding: "utf8" });

    expect(apply.status, apply.stderr).toBe(0);
    expect(readFileSync(path.join(fixture.project, ".navi/project-map.md"), "utf8"))
      .toBe(confirmedMap());
    expect(readFileSync(path.join(fixture.project, "AGENTS.md"), "utf8"))
      .toContain("Navi Project Supervision");
  });
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npm test -- tests/package/navi-plugin-init.test.ts
```

Expected: FAIL because both generated entry paths and the build commands are
absent.

- [ ] **Step 3: Add the approved build-only dependency and scripts**

Run:

```bash
npm install --save-dev esbuild@^0.28.1
```

Then add these package scripts without changing existing script values:

```json
{
  "build:plugin-init": "node scripts/build-plugin-init.mjs",
  "check:plugin-init": "node scripts/build-plugin-init.mjs --check"
}
```

Expected: only `package.json`, `package-lock.json`, and worktree-local
`node_modules` change. Confirm `npm ls esbuild` resolves `0.28.1` within the
approved range.

- [ ] **Step 4: Add the minimal source entry**

Create `src/cli/navi-plugin-init.ts`:

```ts
import { runNaviInitCli } from "./navi-init";

process.exitCode = await runNaviInitCli(process.argv.slice(2));
```

Do not import `navi.ts`, setup, doctor, invocation fallback, `tsx`, or package
metadata. The bundle is only the existing project-init journey.

- [ ] **Step 5: Implement deterministic canonical/package bundling**

Create `scripts/build-plugin-init.mjs`:

```js
#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const entryPoint = path.join(repoRoot, "src/cli/navi-plugin-init.ts");
const outputs = [
  path.join(repoRoot, ".agents/skills/navi/scripts/navi-project-init.mjs"),
  path.join(repoRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
];

export async function renderPluginInitBundle() {
  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    legalComments: "none",
    sourcemap: false,
    write: false,
    outfile: "navi-project-init.mjs",
    banner: { js: "#!/usr/bin/env node" },
  });
  const output = result.outputFiles?.[0];
  if (output === undefined) throw new Error("esbuild produced no Navi init bundle");
  return Buffer.from(output.contents);
}

export async function buildPluginInit({ check = false } = {}) {
  const expected = await renderPluginInitBundle();
  for (const outputPath of outputs) {
    if (check) {
      const current = await fs.readFile(outputPath);
      if (!current.equals(expected)) {
        throw new Error(`Generated Navi init entry is stale: ${outputPath}`);
      }
      const stat = await fs.stat(outputPath);
      if ((stat.mode & 0o111) === 0) {
        throw new Error(`Generated Navi init entry is not executable: ${outputPath}`);
      }
      continue;
    }
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, expected);
    await fs.chmod(outputPath, 0o755);
  }
}

const direct = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check") || args.length > 1) {
    throw new Error("Usage: node scripts/build-plugin-init.mjs [--check]");
  }
  await buildPluginInit({ check: args[0] === "--check" });
}
```

Run the writer once:

```bash
npm run build:plugin-init
```

Review the generated bundle. It may import Node built-ins, but it must have no
relative import to repo source and no package dependency at runtime.

- [ ] **Step 6: Run Task 1 GREEN checks**

Run:

```bash
npm test -- tests/package/navi-plugin-init.test.ts tests/package/navi-package.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-project-map.test.ts tests/cli/navi-project-trigger.test.ts
npm run check:plugin-init
npm run typecheck
git diff --check
```

Expected: all tests PASS, generated check PASS, typecheck PASS, diff check PASS.

- [ ] **Step 7: Review Task 1**

The fresh reviewer must verify:

- bundle entry delegates only to `runNaviInitCli`;
- no init behavior or safety logic is copied;
- generated canonical/package scripts are byte-identical and executable;
- the copied installed package runs without source or `node_modules` imports;
- preview remains read-only and write remains fingerprint-bound; and
- `esbuild` is the only new dependency and is absent from plugin runtime files.

- [ ] **Step 8: Commit Task 1**

```bash
git add package.json package-lock.json src/cli/navi-plugin-init.ts scripts/build-plugin-init.mjs tests/package/navi-plugin-init.test.ts .agents/skills/navi/scripts/navi-project-init.mjs plugins/navi/skills/navi/scripts/navi-project-init.mjs
git commit -m "feat: bundle navi project init"
```

---

### Task 2: Route Installed Onboarding Through The Package Entry

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/project-map-v1.md`
- Modify: `.agents/skills/navi/references/project-entry-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/project-map-v1.md`
- Modify: `plugins/navi/skills/navi/references/project-entry-v1.md`
- Modify: `scripts/verify-plugin-package.mjs`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/skills/navi-project-map.test.ts`
- Modify: `tests/skills/navi-project-entry.test.ts`

**Interfaces:**
- Consumes: `scripts/navi-project-init.mjs` relative to the actually loaded Navi
  skill directory.
- Produces: one installed-package invocation contract owned by
  `project-map-v1.md`.
- Preserves: `project-entry-v1.md` ownership of evidence profiling and baseline
  formation.
- Produces: package verification failure when the generated entry is stale.

- [ ] **Step 1: Add failing one-owner and installed-path tests**

Add to `tests/skills/navi-project-map.test.ts`:

```ts
it("owns the installed package-local initialization boundary", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/project-map-v1.md",
  );
  const section = extractMarkdownSection(
    reference,
    "#### Installed Package Init Entry",
  );

  expect(section).toContain("scripts/navi-project-init.mjs");
  expect(section).toContain("actually loaded Navi skill directory");
  expect(section).toMatch(/must not[\s\S]*source checkout/i);
  expect(section).toMatch(/must not[\s\S]*Codex cache path/i);
  expect(section).toMatch(/preview[\s\S]*fingerprint[\s\S]*explicit approval/i);
  expect(section).toMatch(/Node[\s\S]*unavailable[\s\S]*do not write directly/i);
});
```

Add to `tests/skills/navi-project-entry.test.ts`:

```ts
it("hands confirmed candidates to the Project Map init owner", async () => {
  const entry = await readRepoText(
    ".agents/skills/navi/references/project-entry-v1.md",
  );
  const exit = extractSection(entry, "## Confirmed Exit");

  expect(exit).toContain("project-map-v1.md");
  expect(exit).toContain("package-local init entry");
  expect(exit).not.toContain("scripts/navi-project-init.mjs");
  expect(exit).not.toContain("~/.codex/plugins/cache");
});
```

Add to `tests/skills/navi-skill.test.ts`:

```ts
it("routes installed project writes to the Project Map owner", async () => {
  const skill = await readRepoText(".agents/skills/navi/SKILL.md");
  expect(skill).toMatch(
    /installed plugin[\s\S]*project-map-v1\.md[\s\S]*package-local init/i,
  );
  expect(skill).not.toContain("~/.codex/plugins/cache");
});
```

- [ ] **Step 2: Run focused skill tests and verify RED**

Run:

```bash
npm test -- tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because the installed package-local owner section and routing do
not exist.

- [ ] **Step 3: Add the canonical installed-package contract**

Add this owner section beneath `#### Final Preview And Activation` in
`.agents/skills/navi/references/project-map-v1.md`:

```md
#### Installed Package Init Entry

For an installed Navi plugin, resolve `scripts/navi-project-init.mjs` relative
to the actually loaded Navi skill directory. Do not infer the entry from the
current working directory, a Navi source checkout, a global npm link, or a
hardcoded Codex cache path.

Use the package entry for both steps of the existing boundary: first render the
read-only candidate preview, then invoke the same entry with the exact returned
fingerprint only after explicit approval. The package entry does not form the
baseline and does not install Navi again.

If Node is unavailable or the package entry cannot be resolved as a regular
file inside the loaded skill directory, report that Distribution feasibility
is not established. Do not fall back to direct project writes, guessed cache
paths, a source-only `navi` command, or silent runtime installation.
```

In `.agents/skills/navi/references/project-entry-v1.md`, replace the direct CLI
detail in `## Confirmed Exit` with a handoff to the Project Map owner:

```md
Both strategies use one combined Map and managed-trigger preview, one
fingerprint-bound explicit approval, Map first, and trigger second. Hand the
confirmed candidate to the package-local init entry owned by
`project-map-v1.md`. Do not copy its path-resolution contract here, bypass the
formal init entry, stage, commit, push, or mutate global state.
```

In `.agents/skills/navi/SKILL.md`, add one routing sentence under Behavior
Guardrails:

```md
- For installed plugin project initialization, use the package-local init entry
  owned by `references/project-map-v1.md`; do not require the source checkout or
  bare `navi` CLI.
```

Update other nearby source-only wording only where it directly contradicts the
new installed path. Preserve all baseline, approval, quietness, and write-safety
rules.

- [ ] **Step 4: Synchronize package mirrors**

Make these pairs byte-identical:

```text
.agents/skills/navi/SKILL.md
plugins/navi/skills/navi/SKILL.md

.agents/skills/navi/references/project-map-v1.md
plugins/navi/skills/navi/references/project-map-v1.md

.agents/skills/navi/references/project-entry-v1.md
plugins/navi/skills/navi/references/project-entry-v1.md
```

Do not edit generated script bytes by hand.

- [ ] **Step 5: Make package verification reject stale generated code**

In `scripts/verify-plugin-package.mjs`, add this before skill/package tests:

```js
console.log("Checking generated package-local Navi init entry...");
run("node", ["scripts/build-plugin-init.mjs", "--check"]);
```

The existing full-tree mirror comparison will now include the `scripts/`
directory and reject canonical/package drift.

- [ ] **Step 6: Run Task 2 GREEN checks**

Run:

```bash
npm test -- tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-skill.test.ts tests/package/navi-plugin-init.test.ts
npm run check:plugin-init
npm run verify:plugin-package
git diff --check
```

Expected: focused tests PASS, generated check PASS, plugin verifier PASS,
canonical/package mirror PASS, diff check PASS.

- [ ] **Step 7: Review Task 2**

The fresh reviewer must verify that Project Map remains the sole invocation
owner, Project Entry retains only baseline ownership, the skill routes without
copying path logic, runtime failure does not authorize direct writes, and no
source CLI or cache path is required for ordinary installed onboarding.

- [ ] **Step 8: Commit Task 2**

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/project-map-v1.md .agents/skills/navi/references/project-entry-v1.md plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/project-map-v1.md plugins/navi/skills/navi/references/project-entry-v1.md scripts/verify-plugin-package.mjs tests/skills/navi-project-map.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-skill.test.ts
git commit -m "feat: route installed navi project init"
```

---

### Task 3: Stage One Plugin Artifact For Remote And Local Marketplaces

**Files:**
- Modify: `package.json`
- Modify: `.agents/plugins/marketplace.json`
- Modify: `scripts/verify-plugin-package.mjs`
- Create: `scripts/stage-plugin-distribution.mjs`
- Create: `scripts/stage-plugin-distribution.d.mts`
- Create: `tests/package/navi-distribution.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces: `stageDistribution({ repoRoot, outputDir, releaseTag })`.
- Produces: `renderRemoteMarketplace(releaseTag)` with immutable
  `git-subdir` source.
- Produces: `renderLocalMarketplace()` with `./plugins/navi` source.
- Produces: `npm run stage:plugin-distribution -- --output PATH --release-tag TAG`.
- Preserves: checked-in root catalog as a local source/calibration catalog until
  Release mode.

- [ ] **Step 1: Add failing staging and marketplace tests**

Create `tests/package/navi-distribution.test.ts`:

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderLocalMarketplace,
  renderRemoteMarketplace,
  stageDistribution,
} from "../../scripts/stage-plugin-distribution.mjs";

const roots = new Set<string>();
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

afterEach(async () => {
  await Promise.all([...roots].map((root) => fs.rm(root, { recursive: true, force: true })));
  roots.clear();
});

describe("Navi Distribution staging", () => {
  it("renders stable local and immutable remote marketplace identities", () => {
    expect(renderLocalMarketplace()).toMatchObject({
      name: "navi-source",
      interface: { displayName: "Navi Releases" },
      plugins: [{
        name: "navi",
        source: { source: "local", path: "./plugins/navi" },
      }],
    });
    expect(renderRemoteMarketplace("v0.1.0")).toMatchObject({
      name: "navi-source",
      interface: { displayName: "Navi Releases" },
      plugins: [{
        name: "navi",
        source: {
          source: "git-subdir",
          url: "https://github.com/HezLUO/navi.git",
          path: "./plugins/navi",
          ref: "v0.1.0",
        },
      }],
    });
    expect(JSON.stringify(renderRemoteMarketplace("v0.1.0"))).not.toContain('"ref":"main"');
  });

  it("stages one local marketplace from the exact packaged plugin bytes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const outputDir = path.join(root, "stage");

    const result = await stageDistribution({
      repoRoot,
      outputDir,
      releaseTag: "v0.1.0",
    });

    const localRoot = path.join(outputDir, "navi-0.1.0");
    expect(result).toEqual({
      version: "0.1.0",
      releaseTag: "v0.1.0",
      localMarketplaceRoot: localRoot,
      remoteMarketplacePath: path.join(outputDir, "navi-source.marketplace.json"),
      manifestPath: path.join(outputDir, "distribution-manifest.json"),
    });
    expect(JSON.parse(await fs.readFile(
      path.join(localRoot, ".agents/plugins/marketplace.json"),
      "utf8",
    ))).toEqual(renderLocalMarketplace());
    expect(await fs.readFile(
      path.join(localRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
    )).toEqual(await fs.readFile(
      path.join(repoRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
    ));
    await expect(fs.access(path.join(localRoot, "node_modules"))).rejects.toThrow();
    await expect(fs.access(path.join(localRoot, "src"))).rejects.toThrow();
    await expect(fs.access(path.join(localRoot, "work"))).rejects.toThrow();
  });

  it("rejects version drift and an existing output directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    await expect(stageDistribution({
      repoRoot,
      outputDir: path.join(root, "wrong-version"),
      releaseTag: "v9.9.9",
    })).rejects.toThrow(/manifest version 0\.1\.0/i);

    const existing = path.join(root, "existing");
    await fs.mkdir(existing);
    await expect(stageDistribution({
      repoRoot,
      outputDir: existing,
      releaseTag: "v0.1.0",
    })).rejects.toThrow(/already exists/i);
  });
});
```

Add a declaration at the top of the test until project-local declaration
coverage is created in Step 3:

```ts
// @ts-expect-error The implementation is an ESM build script with runtime-tested exports.
```

Place it immediately before the `.mjs` import so typecheck remains intentional
and narrow.

- [ ] **Step 2: Run the staging test and verify RED**

Run:

```bash
npm test -- tests/package/navi-distribution.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because the staging module and `Navi Releases` marketplace copy
do not exist.

- [ ] **Step 3: Implement deterministic staging**

Create `scripts/stage-plugin-distribution.mjs` with these exports and CLI:

```js
#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryUrl = "https://github.com/HezLUO/navi.git";

function pluginEntry(source) {
  return {
    name: "navi",
    source,
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: "Productivity",
  };
}

function marketplace(source) {
  return {
    name: "navi-source",
    interface: { displayName: "Navi Releases" },
    plugins: [pluginEntry(source)],
  };
}

export function renderLocalMarketplace() {
  return marketplace({ source: "local", path: "./plugins/navi" });
}

export function renderRemoteMarketplace(releaseTag) {
  return marketplace({
    source: "git-subdir",
    url: repositoryUrl,
    path: "./plugins/navi",
    ref: releaseTag,
  });
}

async function assertNoSymlink(root, current = root) {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const candidate = path.join(current, entry.name);
    const stat = await fs.lstat(candidate);
    if (stat.isSymbolicLink()) {
      throw new Error(`Plugin package contains a symlink: ${path.relative(root, candidate)}`);
    }
    if (stat.isDirectory()) await assertNoSymlink(root, candidate);
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function stageDistribution({
  repoRoot = defaultRepoRoot,
  outputDir,
  releaseTag,
}) {
  const absoluteRoot = path.resolve(repoRoot);
  const absoluteOutput = path.resolve(outputDir);
  try {
    await fs.lstat(absoluteOutput);
    throw new Error(`Distribution output already exists: ${absoluteOutput}`);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const pluginRoot = path.join(absoluteRoot, "plugins/navi");
  const manifest = JSON.parse(await fs.readFile(
    path.join(pluginRoot, ".codex-plugin/plugin.json"),
    "utf8",
  ));
  if (manifest.name !== "navi" || typeof manifest.version !== "string") {
    throw new Error("Navi plugin manifest identity is invalid");
  }
  if (releaseTag !== `v${manifest.version}`) {
    throw new Error(
      `Release tag ${releaseTag} does not match manifest version ${manifest.version}`,
    );
  }
  if (absoluteOutput === pluginRoot || absoluteOutput.startsWith(`${pluginRoot}${path.sep}`)) {
    throw new Error("Distribution output must not be inside the plugin package");
  }

  await assertNoSymlink(pluginRoot);
  const localMarketplaceRoot = path.join(absoluteOutput, `navi-${manifest.version}`);
  const packagedPlugin = path.join(localMarketplaceRoot, "plugins/navi");
  await fs.mkdir(path.dirname(packagedPlugin), { recursive: true });
  await fs.cp(pluginRoot, packagedPlugin, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });

  await writeJson(
    path.join(localMarketplaceRoot, ".agents/plugins/marketplace.json"),
    renderLocalMarketplace(),
  );
  const remoteMarketplacePath = path.join(
    absoluteOutput,
    "navi-source.marketplace.json",
  );
  await writeJson(remoteMarketplacePath, renderRemoteMarketplace(releaseTag));
  const manifestPath = path.join(absoluteOutput, "distribution-manifest.json");
  await writeJson(manifestPath, {
    version: manifest.version,
    releaseTag,
    plugin: "navi",
    marketplace: "navi-source",
    pluginPath: "plugins/navi",
  });

  return {
    version: manifest.version,
    releaseTag,
    localMarketplaceRoot,
    remoteMarketplacePath,
    manifestPath,
  };
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!value || (key !== "--output" && key !== "--release-tag")) {
      throw new Error(
        "Usage: node scripts/stage-plugin-distribution.mjs --output PATH --release-tag TAG",
      );
    }
    options[key === "--output" ? "outputDir" : "releaseTag"] = value;
  }
  if (!options.outputDir || !options.releaseTag) {
    throw new Error(
      "Usage: node scripts/stage-plugin-distribution.mjs --output PATH --release-tag TAG",
    );
  }
  return options;
}

const direct = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const result = await stageDistribution(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
```

Add a minimal declaration file instead of retaining the temporary
`@ts-expect-error`:

Create `scripts/stage-plugin-distribution.d.mts`:

```ts
export interface StageDistributionOptions {
  repoRoot?: string;
  outputDir: string;
  releaseTag: string;
}

export interface StagedDistribution {
  version: string;
  releaseTag: string;
  localMarketplaceRoot: string;
  remoteMarketplacePath: string;
  manifestPath: string;
}

export function renderLocalMarketplace(): Record<string, unknown>;
export function renderRemoteMarketplace(releaseTag: string): Record<string, unknown>;
export function stageDistribution(
  options: StageDistributionOptions,
): Promise<StagedDistribution>;
```

Remove the temporary `@ts-expect-error` from the test after the declaration is
present.

- [ ] **Step 4: Wire package scripts and checked-in source catalog copy**

Add without changing existing script values:

```json
{
  "stage:plugin-distribution": "node scripts/stage-plugin-distribution.mjs"
}
```

Change only the display name in `.agents/plugins/marketplace.json`:

```json
"interface": {
  "displayName": "Navi Releases"
}
```

Keep its checked-in plugin source exactly:

```json
"source": {
  "source": "local",
  "path": "./plugins/navi"
}
```

Update `scripts/verify-plugin-package.mjs` to require `Navi Releases` while
retaining `navi-source`, one plugin, local source path, and policy checks. Update
the corresponding marketplace assertion in `tests/skills/navi-skill.test.ts`.

- [ ] **Step 5: Run Task 3 GREEN checks**

Run:

```bash
npm test -- tests/package/navi-distribution.test.ts tests/package/navi-plugin-init.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
npm run typecheck
test ! -e dist
git status --short
```

Expected:

- tests PASS;
- staging, identity refusal, and exact plugin-byte assertions pass inside the
  test-owned temporary directories and clean themselves up;
- package verifier and typecheck PASS; and
- no `dist/` artifact exists or is tracked.

- [ ] **Step 6: Review Task 3**

The fresh reviewer must verify:

- one plugin byte tree feeds both channels;
- remote catalog source is `git-subdir` and uses the exact release tag;
- local catalog source is `./plugins/navi`;
- tag and manifest version mismatch is rejected;
- root catalog remains local before Release mode;
- no archive, checksum, release, network fetch, or global installation occurs;
  and
- staging refuses source symlinks and pre-existing output.

- [ ] **Step 7: Commit Task 3**

```bash
git add package.json .agents/plugins/marketplace.json scripts/verify-plugin-package.mjs scripts/stage-plugin-distribution.mjs scripts/stage-plugin-distribution.d.mts tests/package/navi-distribution.test.ts tests/skills/navi-skill.test.ts
git commit -m "feat: stage navi distribution artifacts"
```

---

### Task 4: Make Current Distribution Capability Truthful

**Files:**
- Modify: `plugins/navi/.codex-plugin/plugin.json`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `plugins/navi/VERSION.md`
- Modify: `docs/navi/project-init.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `tests/package/navi-package.test.ts`
- Modify: `tests/repository/current-surface.test.ts`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces: current-main truthfulness for an unreleased Distribution feasibility
  candidate.
- Preserves: latest tagged release `0.1.0-alpha.3` until a later Release plan.
- Preserves: plugin manifest version `0.1.0` in this implementation lane.
- Produces: one visible next gate: independent validation, explicit integration,
  then bounded real-installation feasibility calibration.

- [ ] **Step 1: Add failing current-surface and package-copy assertions**

In `tests/package/navi-package.test.ts`, add:

```ts
it("describes Navi rather than its Historical Along origin", () => {
  expect(pluginManifest.description).toMatch(/Navi helps non-expert Codex users/i);
  expect(pluginManifest.description).toMatch(/progress|next step|supervis/i);
  expect(pluginManifest.keywords).toEqual([
    "codex",
    "navi",
    "progress-map",
    "project-supervision",
    "project-map",
    "decision-support",
  ]);
  expect(pluginManifest.keywords).not.toContain("along");
  expect(pluginManifest.keywords).not.toContain("working-thread");
});
```

In `tests/repository/current-surface.test.ts`, add:

```ts
it("records Distribution feasibility as a separate approved lane", async () => {
  const [history, roadmap, debt] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
  ]);

  expect(history).toContain(
    "docs/superpowers/specs/2026-07-17-navi-distribution-ready-design.md",
  );
  expect(history).toContain(
    "docs/superpowers/plans/2026-07-17-navi-distribution-feasibility.md",
  );
  expect(roadmap).toMatch(/Product Complete calibration[\s\S]*remains open/i);
  expect(roadmap).toMatch(/Distribution feasibility[\s\S]*separately approved/i);
  expect(debt).toMatch(/package-local init[\s\S]*real installation calibration/i);
  expect(debt).toMatch(/Public Plugin Directory[\s\S]*not a prerequisite/i);
});
```

In `tests/skills/navi-capability-truthfulness.test.ts`, add assertions across
root English, Chinese, and package README surfaces:

```ts
for (const text of [readme, pluginReadme]) {
  expect(text).toMatch(/Git-backed[\s\S]*navi-source/i);
  expect(text).toMatch(/package-local[\s\S]*preview[\s\S]*approval/i);
  expect(text).toMatch(/current main[\s\S]*unreleased/i);
  expect(text).toMatch(/Public Plugin Directory[\s\S]*optional/i);
  expect(text).not.toMatch(/available now in the Public Plugin Directory/i);
}
expect(chineseReadme).toMatch(/Git-backed[\s\S]*navi-source/i);
expect(chineseReadme).toMatch(/当前 main[\s\S]*尚未发布/i);
```

- [ ] **Step 2: Run focused truthfulness tests and verify RED**

Run:

```bash
npm test -- tests/package/navi-package.test.ts tests/repository/current-surface.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL on stale manifest identity, source-alpha-only distribution copy,
missing design/plan index entries, and missing feasibility gate wording.

- [ ] **Step 3: Update the plugin manifest without changing version**

Set these manifest fields:

```json
{
  "description": "Navi helps non-expert Codex users understand project progress, decide what comes next, and initialize project-local supervision with explicit approval.",
  "keywords": [
    "codex",
    "navi",
    "progress-map",
    "project-supervision",
    "project-map",
    "decision-support"
  ],
  "interface": {
    "displayName": "Navi",
    "shortDescription": "Project progress, next-step, stop/wait, and decision guidance.",
    "longDescription": "Navi helps non-expert Codex users understand project position, supervise bounded work, decide when to continue or stop, and initialize reliable project-local guidance through an exact approved preview.",
    "developerName": "Navi Contributors",
    "category": "Productivity",
    "capabilities": ["Interactive"],
    "defaultPrompt": [
      "Show where this project stands, what comes next, and what I need to decide.",
      "Should we continue, stop, wait, or move to the next stage?",
      "Set up Navi for this project using a read-only preview before any project write."
    ]
  }
}
```

Keep `name`, `version`, `skills`, and `author` unchanged.

- [ ] **Step 4: Update current-source documentation**

Make all three README surfaces state, in their own language where applicable:

1. `0.1.0-alpha.3` remains the latest tagged GitHub source release.
2. Current `main` contains an unreleased Distribution feasibility candidate.
3. The controlled primary design is a Git-backed `navi-source` marketplace;
   the checked-in candidate is not yet an activated public release entry.
4. Installed onboarding uses the package-local init entry for read-only preview
   and fingerprint-bound approved write.
5. Public Plugin Directory is optional and is not a release prerequisite.
6. GitHub Release local-marketplace ZIP, checksum, update, rollback, and
   uninstall promises belong to a later explicit Release plan.
7. Bare `navi`, npm publication, Bootstrap Installer, Runtime Surface, UI, MCP,
   background updates, and other-agent support are not ordinary-user
   prerequisites in this candidate.

In `plugins/navi/VERSION.md`, retain version `0.1.0` and latest tagged source
release `0.1.0-alpha.3`; replace any claim that marketplace distribution is
categorically future work with the narrower truth that the feasibility
candidate is unreleased and no public Release or Directory publication has
occurred.

In `docs/navi/project-init.md`, add an **Installed package entry** section that
explains loaded-skill-relative resolution, no hardcoded cache/source path,
Node-unavailable refusal, exact preview, fingerprint-bound write, and no direct
skill write fallback.

In `docs/navi/product-debt.md`, record these remaining gates:

- Node/runtime availability across supported Codex surfaces;
- Git-backed installed-copy path resolution;
- local-marketplace bundle calibration;
- version identity, ZIP, and checksum Release work;
- optional Public Plugin Directory materials and review; and
- Bootstrap only if standard marketplace onboarding fails.

In `docs/navi/design-history.md`, add the approved design and this plan under
Active without rewriting historical records.

In `docs/navi/roadmap.md`, preserve Product Complete calibration as an open
gate and record Distribution feasibility as a separately approved lane. The
next Distribution gate after implementation is real-installation Calibration,
not automatic Release preparation.

- [ ] **Step 5: Run Task 4 GREEN checks**

Run:

```bash
npm test -- tests/package/navi-package.test.ts tests/repository/current-surface.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check
```

Expected: focused truthfulness tests PASS, package verifier PASS, typecheck PASS,
diff check PASS.

- [ ] **Step 6: Review Task 4**

The fresh reviewer must verify:

- no surface claims Distribution Preview is released;
- no surface claims Public Plugin Directory acceptance or availability;
- Product Complete calibration is not silently declared complete or replaced;
- package metadata describes Navi without stale Along keywords;
- plugin version remains unchanged;
- docs distinguish source catalog, generated release catalog, and local bundle;
  and
- release, ZIP, checksum, global install, and real-project calibration remain
  outside this implementation lane.

- [ ] **Step 7: Commit Task 4**

```bash
git add plugins/navi/.codex-plugin/plugin.json README.md README.zh-CN.md plugins/navi/README.md plugins/navi/VERSION.md docs/navi/project-init.md docs/navi/product-debt.md docs/navi/design-history.md docs/navi/roadmap.md tests/package/navi-package.test.ts tests/repository/current-surface.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/skills/navi-skill.test.ts
git commit -m "docs: explain navi distribution feasibility"
```

---

## Final Bounded Verification

After all four task commits, run exactly:

```bash
npm test -- tests/package/navi-plugin-init.test.ts tests/package/navi-distribution.test.ts tests/package/navi-package.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init-apply.test.ts tests/cli/navi-project-map.test.ts tests/cli/navi-project-trigger.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-project-map.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run check:plugin-init
npm run typecheck
npm run verify:plugin-package
git diff --check
```

Expected: all 13 files PASS, generated entry check PASS, typecheck PASS, plugin
verification PASS, mirror check PASS, diff check PASS. Test counts are not fixed
in advance; report the actual file and test counts.

Run the final artifact and scope audits:

```bash
test ! -e dist
git diff --name-only BASELINE_SHA..HEAD
git diff BASELINE_SHA..HEAD -- package.json package-lock.json
git diff BASELINE_SHA..HEAD -- archive/along work
git diff BASELINE_SHA..HEAD -- plugins/navi/VERSION.md
diff -rq .agents/skills/navi plugins/navi/skills/navi
rg -n "tsx/esm/api|node_modules|/Users/james|\.codex/plugins/cache" .agents/skills/navi/scripts/navi-project-init.mjs plugins/navi/skills/navi/scripts/navi-project-init.mjs
git status --short --branch
```

Replace `BASELINE_SHA` in the shell with the exact baseline recorded at
preflight; it is execution evidence, not a value stored in product files.

Expected:

- no `dist/` output;
- exactly four commits above the baseline;
- changed paths are limited to Tasks 1-4;
- dependency diff adds only `esbuild` and its lockfile graph;
- no Historical Along or `work/` change;
- `plugins/navi/VERSION.md` changes only in Task 4 documentation and retains
  version `0.1.0`;
- canonical/package skill trees are byte-identical;
- forbidden runtime/source/cache strings have no match in generated entries;
  and
- worktree is clean.

If `rg` returns exit 1 with no output, record that as the expected no-match
result. Do not convert the audit into generated-file editing.

## Whole-Candidate Review And Handoff

After bounded verification, obtain one fresh whole-candidate review of the
exact four-commit snapshot. The reviewer must read the approved design, this
plan, complete baseline-to-HEAD diff, generated-entry build path, skill routing,
staging code, package metadata, and test evidence.

The candidate is `review-ready` only when:

- no Critical or Important finding remains;
- generated init bytes are reproducible and mirrored;
- copied installed-package preview/write tests pass;
- remote and local marketplace staging use one plugin byte tree;
- current docs do not claim release or Directory availability;
- no global or target-project mutation occurred; and
- worktree is clean at the exact reviewed snapshot.

Emit one `NAVI_LANE_HANDOFF_EVENT` V1 `review-ready` event containing:

- baseline and reviewed snapshot;
- four commit hashes and subjects;
- exact changed paths;
- actual bounded test counts;
- typecheck, generated-entry, plugin-verifier, mirror, diff, dependency, and
  scope-audit evidence;
- explicit statement that real Node availability remains unproven outside this
  execution environment; and
- residual risks and excluded Release/calibration actions.

The Main Thread then creates one fresh Level 3 read-only Validation Task. The
Validation Task must not install dependencies silently, write files, run global
marketplace commands, or perform calibration.

## Post-Integration Calibration Gate

This plan stops before calibration. After independent acceptance and an
explicit integration decision, a separate Calibration-mode contract may:

1. add `HezLUO/navi` as a Git-backed marketplace pinned to the exact integrated
   commit for candidate calibration;
2. install `navi@navi-source` through Codex;
3. start a fresh task and invoke natural installed onboarding;
4. prove package-local path resolution after changing cwd and making the source
   checkout unavailable to the active task;
5. observe read-only preview and one explicitly approved temporary-project
   write;
6. stage and install the local-marketplace bundle from the same snapshot; and
7. return a feasibility result to the Main Thread.

Those actions modify global Codex/plugin state or a temporary external target
and therefore require their own explicit Calibration permission. Passing that
gate permits Distribution Preview release planning; failure returns to Design
mode for the smallest supported runtime, Bootstrap, or optional CLI decision.

## Explicit Stop Boundary

Completion of this plan means only:

> Navi has a source-reviewed, independently validated Distribution feasibility
> candidate ready for real installed-plugin calibration.

It does not mean Distribution Preview is released, Product Complete is
accepted, Public Plugin Directory submission is ready, or the full Navi product
is complete.
