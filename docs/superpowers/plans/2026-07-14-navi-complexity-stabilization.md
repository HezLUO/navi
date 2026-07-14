# Navi Complexity Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans in a true Codex-managed worktree to implement this plan task-by-task. Do not execute this plan in the source main task. Each task ends at a reviewable local commit; the completed bounded branch returns once for source-task read-only parent review through Navi Lane Handoff.

**Goal:** Make Current Navi the repository's only default product surface while preserving Historical Along as read-only evidence and retaining all approved Navi CLI, supervision, Project Map, authorization, and Lane Handoff behavior.

**Architecture:** Stabilize the repository in five sequential ownership changes. First remove Historical Along from root scripts, dependencies, typecheck, and default tests; then establish active document authority, split prompt rules by responsibility, decompose `navi init` behind Command/Journey/Domain/Adapter boundaries, and consolidate tests around behavior and capability truthfulness. Mechanical relocation and semantic refactoring stay in separate commits so each review can distinguish movement from behavior change.

**Tech Stack:** Node.js 22, TypeScript 5.7, `tsx`, Vitest 2.1, Markdown Codex skills, JSON plugin metadata, Git worktrees.

## Global Constraints

- Work Mode is Implementation. Do not enter Release mode.
- Start from a clean worktree at commit `c763dd8` or a later explicitly approved `main` commit that contains the same stabilization design and Lane Handoff behavior.
- Do not modify, stage, delete, or commit the source task's untracked `work/` directory.
- Do not add user-facing capability, change command names, change exit semantics, change Project Map semantics, weaken write authorization, or rebrand Historical Along as Navi.
- Do not add runtime UI, background watching, Memory v2, delegation, write delegation, another-agent adapters, npm publication, marketplace publication, tags, releases, or GitHub Release work.
- Preserve target-project read compatibility for historical `docs/along/project-maps/` evidence. Repository archival does not authorize removing that bounded compatibility path.
- Remove the root `build` script. Current source-run Navi has no build artifact; `typecheck` and `verify:plugin-package` are the authoritative checks.
- Historical files are evidence only: move them mechanically, do not repair their imports or make their archived tests runnable.
- Use targeted tests per task. Do not run Historical Along tests or the pre-archive full suite after Task 1.
- Run one bounded active-Navi integration suite at the end. Do not run a release checklist.
- Local task commits listed in this plan are authorized inside the implementation worktree. Merge, push, tag, release, publication, cross-project writes, scope expansion, validation-budget expansion, and risk acceptance remain source-task or user decisions.
- If a supposedly historical file is imported by Current Navi, stop that move, report the exact import, and classify it. Do not add a compatibility shim or duplicate the file.
- Use `NAVI_LANE_HANDOFF_EVENT` V1 for `decision-required`, formal `blocked`, or final `review-ready` transitions. Ordinary task progress and task commits are not events.

---

## Planned Repository Shape

```text
src/cli/                         # Current Navi only
tests/cli/                       # Current CLI domain/journey/adapter tests
tests/package/                   # Current source-package and bin tests
tests/repository/                # Active/archive boundary tests
tests/skills/                    # Current skill and policy tests
.agents/skills/navi/             # Canonical Navi skill source
plugins/navi/                    # Controlled package mirror
docs/navi/                       # Active Navi entry point, roadmap, debt, calibration
docs/releases/                   # Release history
docs/superpowers/                # Design history, indexed by docs/navi/design-history.md
archive/along/                   # Historical Along evidence, not runnable by default
```

The active CLI module ownership after Task 4 is:

```text
src/cli/navi.ts                  # command selection only
src/cli/navi-init.ts             # init journey: parse, coordinate, render, exit code
src/cli/navi-init-plan.ts        # init domain plan and action model
src/cli/navi-init-apply.ts       # guarded filesystem write adapter
src/cli/navi-project-trigger.ts  # one trigger template, recognition, inspection
src/cli/navi-evidence.ts         # evidence domain and bounded filesystem reads
src/cli/navi-project-map.ts      # confirmed Map domain
src/cli/navi-global.ts           # setup journey
src/cli/navi-doctor.ts           # doctor journey
src/cli/navi-*.ts                # existing focused domain/adapters
```

The canonical skill reference ownership after Task 3 is:

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/supervision-v1.md
.agents/skills/navi/references/project-map-v1.md
.agents/skills/navi/references/challenge-v1.md
.agents/skills/navi/references/working-thread-v1.md
.agents/skills/navi/references/lane-handoff-v1.md
```

## Worktree Bootstrap

Before Task 1, confirm the isolated checkout and bounded baseline:

```bash
git status --short --branch
git rev-parse HEAD
npm test -- tests/cli tests/skills tests/mcp/working-thread-package.test.ts
```

Expected: the worktree is clean, HEAD matches the delegated baseline, and the current active-Navi-oriented tests pass. Do not run the Historical Along core/server/web suite as a prerequisite for stabilization.

If `node_modules` is absent, use the lockfile-defined project environment with `npm ci`. If registry access or dependency install scripts require approval, emit one `decision-required` Lane Handoff event before installing. This authorizes only project-local dependencies inside the isolated worktree.

---

### Task 1: Isolate Historical Along From Current Navi Defaults

**Files:**
- Create: `archive/along/README.md`
- Create: `tests/repository/current-surface.test.ts`
- Create: `tests/package/navi-package.test.ts`
- Move: `src/core/` to `archive/along/src/core/`
- Move: `src/mcp/` to `archive/along/src/mcp/`
- Move: `src/server/` to `archive/along/src/server/`
- Move: `src/web/` to `archive/along/src/web/`
- Move: `src/cli/index.ts` to `archive/along/src/cli/index.ts`
- Move: `tests/core/` to `archive/along/tests/core/`
- Move: `tests/server/` to `archive/along/tests/server/`
- Move: `tests/web/` to `archive/along/tests/web/`
- Move: `tests/mcp/` to `archive/along/tests/mcp/`
- Move: `index.html` to `archive/along/index.html`
- Move: `vite.config.ts` to `archive/along/vite.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `tsconfig.json`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`

**Interfaces:**
- Consumes: the current source-run `navi` bin, active `src/cli/`, package verifier, and existing historical code/tests.
- Produces: a root package that installs, typechecks, and tests Current Navi only; `archive/along/` is excluded by location rather than ignore tricks.

- [ ] **Step 1: Write the failing active-surface contract**

Create `tests/repository/current-surface.test.ts` with these assertions:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

const root = process.cwd();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  }));
  return files.flat();
}

describe("Current Navi repository surface", () => {
  it("keeps Historical Along outside Current Navi defaults", async () => {
    expect(packageJson.scripts).toEqual({
      navi: "./src/cli/navi-bin.mjs",
      test: "vitest run",
      "test:watch": "vitest",
      typecheck: "tsc --noEmit",
      "verify:plugin-package": "node scripts/verify-plugin-package.mjs",
    });
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.devDependencies).toEqual({
      "@types/node": "^22.10.0",
      tsx: "^4.19.0",
      typescript: "^5.7.0",
      vitest: "^2.1.0",
    });

    const activeFiles = await listFiles(path.join(root, "src"));
    expect(activeFiles.every((file) => file.includes(`${path.sep}src${path.sep}cli${path.sep}`))).toBe(true);
    expect(await fs.readFile(path.join(root, "archive/along/README.md"), "utf8"))
      .toMatch(/Historical Along Evidence[\s\S]*not a supported runnable subsystem/i);
  });

  it("does not import archived code from active source or tests", async () => {
    const activeFiles = [
      ...(await listFiles(path.join(root, "src"))),
      ...(await listFiles(path.join(root, "tests"))),
    ].filter((file) => /\.(?:ts|mjs)$/.test(file));

    for (const file of activeFiles) {
      const text = await fs.readFile(file, "utf8");
      expect(text, path.relative(root, file)).not.toMatch(
        /(?:from\s+|import\()["'][^"']*(?:archive\/along|src\/(?:core|mcp|server|web))/
      );
    }
  });
});
```

- [ ] **Step 2: Run the contract to verify RED**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because historical scripts, dependencies, source directories, and archive notice still have the old shape.

- [ ] **Step 3: Move Historical Along mechanically**

Use `git mv` for every listed source, test, fixture, HTML, and Vite path. Move the complete original `tests/mcp/working-thread-package.test.ts` into the archive; do not rewrite it there. Create `archive/along/README.md` with exactly this boundary:

```markdown
# Historical Along Evidence

This directory preserves the Along runtime, MCP, server, Shared Desk UI, tests, and supporting files as product-history evidence.

It is not a supported runnable subsystem, Current Navi dependency, installation surface, build target, typecheck target, or default test target. The files keep their Along identity and may contain historical imports or commands that no longer work from the repository root.

Current Navi starts at [`../../README.md`](../../README.md), with active operator documentation in [`../../docs/navi/`](../../docs/navi/).
```

- [ ] **Step 4: Create the Current Navi package test**

Create `tests/package/navi-package.test.ts` by retaining only the Navi-owned behavior from the old mixed test:

```ts
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import pluginManifest from "../../plugins/navi/.codex-plugin/plugin.json";

describe("Navi source package wiring", () => {
  it("exposes only the stable Navi JavaScript bin", () => {
    expect(packageJson.scripts.navi).toBe("./src/cli/navi-bin.mjs");
    expect(packageJson.bin).toEqual({ navi: "src/cli/navi-bin.mjs" });
    expect(packageJson.bin).not.toHaveProperty("along");
  });

  it("supports direct Node execution of the Navi init wrapper dry-run", () => {
    const project = mkdtempSync(path.join(tmpdir(), "navi-bin-"));
    try {
      const result = spawnSync(process.execPath, [
        path.resolve(process.cwd(), "src/cli/navi-bin.mjs"),
        "init", "--target", project,
      ], { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toContain("Navi init preview");
      expect(result.stdout).toContain("A confirmed Project Map is required");
      expect(existsSync(path.join(project, "AGENTS.md"))).toBe(false);
    } finally {
      rmSync(project, { force: true, recursive: true });
    }
  });

  it("routes first-use supervision through confirmed Map baseline formation", () => {
    expect(pluginManifest.interface.defaultPrompt).toContain(
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    );
  });
});
```

- [ ] **Step 5: Make root package metadata Current-Navi-only**

Set `package.json` scripts and dependencies to the exact values asserted in Step 1. Preserve package identity, repository metadata, `private: true`, license, and `bin`. Remove `dev`, `mcp:working-thread`, `web`, and `build`; do not replace `build` with typecheck.

Set `tsconfig.json` to remove JSX and Vite ownership:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "tests", "vitest.config.ts"]
}
```

Update `package-lock.json` from the changed package metadata:

```bash
npm install --package-lock-only --ignore-scripts
```

If the command requires registry access not already authorized, emit one `decision-required` Lane Handoff event. Do not hand-edit dependency graph entries as a workaround.

- [ ] **Step 6: Update current public references to the historical UI**

In the three active README surfaces, replace claims that point at `src/web` with `archive/along/src/web`, while preserving the statement that it is Historical Along/future evidence and not the Navi alpha UI. Do not rewrite release records or historical design notes.

- [ ] **Step 7: Verify Task 1 GREEN**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts tests/package/navi-package.test.ts
npm run typecheck
npm run verify:plugin-package
git diff --check
```

Expected: all commands exit `0`; the default source and test trees contain no Historical Along module.

- [ ] **Step 8: Commit Task 1**

```bash
git add archive/along src tests package.json package-lock.json tsconfig.json README.md README.zh-CN.md plugins/navi/README.md
git commit -m "refactor: isolate historical along surface"
```

Before committing, confirm `git status --short` contains only Task 1 paths and no source-task `work/` content.

---

### Task 2: Establish Active Navi Document Authority

**Files:**
- Create: `docs/navi/README.md`
- Create: `docs/navi/design-history.md`
- Move: `docs/along/navi-calibration-log.md` to `docs/navi/calibration-log.md`
- Move: `docs/along/navi-product-debt.md` to `docs/navi/product-debt.md`
- Move: `docs/along/roadmaps/navi-post-alpha-roadmap.md` to `docs/navi/roadmap.md`
- Move: remaining `docs/along/` to `archive/along/docs/`
- Modify: `tests/repository/current-surface.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: active README and active planning/spec links that use one of the three moved Navi paths

**Interfaces:**
- Consumes: the three-zone repository model and existing Navi/Along documents.
- Produces: one active docs entry point and explicit `active`, `superseded`, and `historical` navigation metadata.

- [ ] **Step 1: Add failing document-authority assertions**

Extend `tests/repository/current-surface.test.ts`:

```ts
it("keeps active Navi docs outside the Historical Along namespace", async () => {
  for (const relative of [
    "docs/navi/README.md",
    "docs/navi/calibration-log.md",
    "docs/navi/product-debt.md",
    "docs/navi/roadmap.md",
    "docs/navi/design-history.md",
  ]) {
    await expect(fs.stat(path.join(root, relative))).resolves.toBeDefined();
  }
  await expect(fs.stat(path.join(root, "docs/along"))).rejects.toMatchObject({ code: "ENOENT" });
});
```

Run `npm test -- tests/repository/current-surface.test.ts` and expect failure on the missing/misplaced paths.

- [ ] **Step 2: Move active and historical documents without rewriting history**

Use `git mv` for all listed paths. Preserve the three active Navi documents byte-for-byte except for links that became invalid after the move. Move all remaining Along documents under `archive/along/docs/` with their relative subdirectories intact.

Do not remove the `docs/along/project-maps/` strings from `src/cli/navi-evidence.ts`; those strings describe bounded read compatibility inside target projects, not this repository's active documentation authority.

- [ ] **Step 3: Create the active documentation entry point**

Create `docs/navi/README.md`:

```markdown
# Current Navi Documentation

Current Navi is the supported Codex-first supervision product in this repository.

- [Project initialization](project-init.md)
- [Project trigger template](project-trigger-template.md)
- [Product roadmap](roadmap.md)
- [Product debt](product-debt.md)
- [Calibration evidence](calibration-log.md)
- [Design-history status index](design-history.md)

Historical Along implementation and documents are preserved under [`../../archive/along/`](../../archive/along/) as read-only evidence. They are not Current Navi installation, runtime, build, or support surfaces.
```

- [ ] **Step 4: Create the design-history status index**

Create `docs/navi/design-history.md` with this classification model and these initial authoritative entries:

```markdown
# Navi Design History Status

This index is navigation metadata. It does not rewrite historical documents.

## Active

- `docs/superpowers/specs/2026-07-14-navi-complexity-stabilization-design.md`
- `docs/superpowers/specs/2026-07-13-navi-confirmed-project-map-init-journey-design.md`
- `docs/superpowers/specs/2026-07-12-navi-blocker-event-delivery-design.md` (revised as Lane Handoff Event Delivery)
- `docs/superpowers/plans/2026-07-14-navi-complexity-stabilization.md`
- `docs/navi/project-init.md`
- `docs/navi/project-trigger-template.md`
- `docs/navi/roadmap.md`
- `docs/navi/product-debt.md`
- `docs/navi/calibration-log.md`

## Superseded

- `docs/superpowers/specs/2026-07-09-navi-alpha13-project-initialization-suggested-map-preview-design.md` — superseded by the confirmed Project Map journey.
- `docs/superpowers/specs/2026-07-10-navi-alpha14-real-project-calibration-design.md` — its provisional state direction was superseded by the confirmed Project Map authority.

## Historical

- `docs/superpowers/notes/` and pre-current plans remain decision history unless an Active entry names them.
- `archive/along/docs/` preserves Along product records and old repo-local Navi evidence paths without current authority.
- `docs/releases/` remains immutable release history; a release record describes its tag, not current `main`.
```

- [ ] **Step 5: Update active tests and links**

Change active tests that read the three moved Navi documents to their `docs/navi/` paths. Tests whose only purpose is to require archived `docs/along/working-threads`, calibration, or project-map example files should be removed from the active suite; the files remain in the archive. Do not update historical specs merely to erase their original paths.

- [ ] **Step 6: Verify and commit Task 2**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
git diff --check
```

Expected: all pass. Commit:

```bash
git add docs/navi archive/along/docs tests/repository/current-surface.test.ts tests/skills/navi-skill.test.ts README.md README.zh-CN.md plugins/navi/README.md
git commit -m "docs: establish current navi authority"
```

---

### Task 3: Split Supervision Rules By Responsibility

**Files:**
- Create: `.agents/skills/navi/references/supervision-v1.md`
- Create: `.agents/skills/navi/references/project-map-v1.md`
- Create: `.agents/skills/navi/references/challenge-v1.md`
- Modify: `.agents/skills/navi/references/working-thread-v1.md`
- Modify: `.agents/skills/navi/SKILL.md`
- Mirror the same paths under `plugins/navi/skills/navi/`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `scripts/verify-plugin-package.mjs`

**Interfaces:**
- Consumes: the canonical `working-thread-v1.md`, `lane-handoff-v1.md`, and package mirror verifier.
- Produces: focused references selected by request type while preserving one canonical-to-package direction.

- [ ] **Step 1: Add failing ownership and mirror tests**

Add one table-driven test to `tests/skills/navi-skill.test.ts`:

```ts
it("routes each supervision responsibility to one canonical reference", async () => {
  const skill = await readRepoText(".agents/skills/navi/SKILL.md");
  const owners = {
    "supervision-v1.md": ["Alpha 4 Supervision Layer", "Alpha 12 Quietness And Rule Density Control"],
    "project-map-v1.md": ["Progress Map", "Confirmed Project Map Model", "Rhythm Map"],
    "challenge-v1.md": ["Challenge Layer", "Challenge Brief", "Professional Judgment Boundary"],
    "working-thread-v1.md": ["Working Thread Definition", "Record Location", "Bounded Adaptive Write-Back"],
    "lane-handoff-v1.md": ["Unified Event", "Pre-Send Wire-Format Check", "Source Main Task"],
  } as const;

  for (const [file, headings] of Object.entries(owners)) {
    expect(skill).toContain(`references/${file}`);
    const canonical = await readRepoText(`.agents/skills/navi/references/${file}`);
    const packaged = await readRepoText(`plugins/navi/skills/navi/references/${file}`);
    expect(packaged).toBe(canonical);
    for (const heading of headings) expect(canonical).toContain(`## ${heading}`);
  }
});
```

Run `npm test -- tests/skills/navi-skill.test.ts` and expect failure because three focused references do not exist.

- [ ] **Step 2: Split the canonical reference mechanically by heading**

Preserve the existing text and heading order while moving:

- `## Alpha 4 Supervision Layer` through the line before `## Progress Map` into `supervision-v1.md`.
- `## Progress Map` through the line before `## Challenge Layer` into `project-map-v1.md`.
- `## Challenge Layer` through the line before `## Record Location` into `challenge-v1.md`.
- Keep the opening Purpose/Working Thread/Navi material and `## Record Location` onward in `working-thread-v1.md`.
- Keep Lane Handoff solely in `lane-handoff-v1.md`.

Add a one-paragraph title/purpose header to each new file; do not duplicate moved policy paragraphs back into `working-thread-v1.md`.

- [ ] **Step 3: Make SKILL.md a routing entry point**

Replace the single required-reference instruction with this routing table:

```markdown
## Required References

Read only the references needed for the current request:

- `references/project-map-v1.md` for progress, next-step, stop/wait, lifecycle, Map maintenance, and vision-distance questions.
- `references/supervision-v1.md` for work mode, verification budget, pause, continuation, coordination, quietness, and decision-handoff judgment.
- `references/challenge-v1.md` for drift, anti-self-certification, risk challenge, and professional-judgment boundaries.
- `references/working-thread-v1.md` for durable Working Thread continuity, creation, wrap-up, and write-back.
- `references/lane-handoff-v1.md` for bounded Codex lane delivery and source-task routing.

Do not load every reference for an ordinary narrow request.
```

Keep trigger descriptions and hard authorization boundaries in `SKILL.md`. Remove detailed paragraphs from `SKILL.md` only when their complete policy owner now exists in one focused reference; retain a concise routing sentence so discoverability is not lost.

Within `## Behavior Guardrails`, replace the duplicated detail blocks beginning with `Alpha.4 supervision covers`, `Alpha.5 pause semantics covers`, `Alpha.6 stage-and-vision supervision`, `Alpha.7 coordination layer`, `Alpha.8 decision handoff quality`, `Alpha.11 lane closure handoff`, and `Alpha.12 quietness gate` with these concise owner routes:

```markdown
- Use `references/supervision-v1.md` for phase/mode, verification budget, pause/continuation, coordination, quietness, and decision-handoff policy.
- Use `references/project-map-v1.md` for confirmed Map authority, Progress/Rhythm Map rendering, lifecycle, maintenance, language following, and initialization baseline policy.
- Use `references/challenge-v1.md` for drift challenge, anti-self-certification, lightweight validation, and professional-judgment boundaries.
- Use `references/working-thread-v1.md` only for durable continuity records and confirmed write-back.
```

Do not remove the corresponding prohibitions from `## Hard Boundaries`; those are the compact safety envelope loaded with the skill entry point.

- [ ] **Step 4: Update tests to read policy owners**

For each existing alpha4/5/6/7/8/11/12 assertion, read `supervision-v1.md`. For Map/Rhythm/confirmed-map assertions, read `project-map-v1.md`. For challenge assertions, read `challenge-v1.md`. For durable record assertions, read `working-thread-v1.md`. Remove assertions that require the same paragraph to appear in both `SKILL.md` and a reference; retain exact duplicate checks only for canonical versus packaged files.

- [ ] **Step 5: Sync the package mirror and widen package verification**

Copy the complete canonical `.agents/skills/navi/` file set to `plugins/navi/skills/navi/` using the repository's existing controlled mirror convention. Change the verifier test invocation to:

```js
run("npm", ["test", "--", "tests/skills"]);
```

The existing recursive byte-for-byte directory comparison remains authoritative.

- [ ] **Step 6: Verify and commit Task 3**

Run:

```bash
npm run verify:plugin-package
git diff --check
```

Expected: the package verifier runs the focused skill directory once, then validates the manifest and exact package mirror. Commit:

```bash
git add .agents/skills/navi plugins/navi/skills/navi tests/skills scripts/verify-plugin-package.mjs
git commit -m "refactor: separate navi supervision policy owners"
```

---

### Task 4: Decompose The `navi init` Hotspot

**Files:**
- Create: `src/cli/navi-init-plan.ts`
- Create: `src/cli/navi-init-apply.ts`
- Create: `src/cli/navi-project-trigger.ts`
- Modify: `src/cli/navi-init.ts`
- Create: `tests/cli/navi-init-plan.test.ts`
- Create: `tests/cli/navi-init-apply.test.ts`
- Create: `tests/cli/navi-project-trigger.test.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify imports in `src/cli/navi-doctor.ts`, `tests/cli/navi-doctor.test.ts`, `tests/cli/navi-evidence.test.ts`, `tests/skills/`, and `tests/fixtures/navi-legacy-agents-blocks.ts`

**Interfaces:**
- Consumes: the existing public exports and behavior of `src/cli/navi-init.ts`.
- Produces: one command/journey facade plus focused plan domain, guarded-write adapter, and trigger owner; no public CLI behavior change.

- [ ] **Step 1: Add failing ownership assertions**

Extend `tests/repository/current-surface.test.ts`:

```ts
it("keeps navi init responsibilities in focused modules", async () => {
  const expected = {
    "src/cli/navi-init.ts": ["runNaviInitCli", "parseInitArgs", "renderInitPlan"],
    "src/cli/navi-init-plan.ts": ["buildInitPlan", "resolveTargetPath"],
    "src/cli/navi-init-apply.ts": ["applyInitPlan"],
    "src/cli/navi-project-trigger.ts": ["renderAgentsBlock", "recognizeNaviManagedBlock", "inspectProjectTrigger"],
  };
  for (const [relative, exports] of Object.entries(expected)) {
    const text = await fs.readFile(path.join(root, relative), "utf8");
    for (const name of exports) expect(text, relative).toMatch(new RegExp(`export (?:async )?(?:function|const|type|interface) ${name}|export \\{[^}]*${name}`));
  }
});
```

Run `npm test -- tests/repository/current-surface.test.ts` and expect failure on the three missing modules.

- [ ] **Step 2: Extract the Project Trigger owner first**

Move these exact responsibilities from `navi-init.ts` to `navi-project-trigger.ts`:

- `NAVI_AGENTS_BLOCK_START`, `NAVI_AGENTS_BLOCK_END`;
- `NaviManagedBlockRecognition`, `ProjectTriggerState`;
- `renderAgentsBlock` and recognized legacy renderers;
- `recognizeNaviManagedBlock`, `inspectProjectTrigger`, and trigger-document read/classification helpers.

`navi-project-trigger.ts` may use Node filesystem/path APIs but must not import command rendering or write-application code. Import its functions from `navi-init-plan.ts` and `navi-doctor.ts`. Re-export current public names from `navi-init.ts` for source compatibility during this stabilization phase.

Move trigger-focused tests from the `navi init guarded writes` describe block into `tests/cli/navi-project-trigger.test.ts`: exact current block rendering, pre-Lane-Handoff migration, managed-block recognition, and unsafe trigger-path classification.

- [ ] **Step 3: Extract the Init Plan domain**

Move to `navi-init-plan.ts`:

- `InitActionKind`, `InitAction`, `InitPlanState`, `InitPlan`, `InitOptions`;
- `VALIDATION_PROMPT`;
- `resolveTargetPath`, `buildInitPlan`;
- plan-state constructors and Map/trigger action constructors.

It may import `navi-evidence`, `navi-project-map`, `navi-init-fingerprint`, and `navi-project-trigger`. It must not import command I/O or call write functions.

Move the `navi init confirmed Map planning` tests into `tests/cli/navi-init-plan.test.ts`. Preserve candidate safety and target confinement cases that exercise planning rather than write-time drift.

- [ ] **Step 4: Extract the guarded write adapter**

Move to `navi-init-apply.ts`:

- `InitWriteDependencies` and `applyInitPlan`;
- writable-action narrowing and preflight;
- physical path/symlink checks;
- stale create/modify checks;
- ordered Map-before-trigger writes and failure cleanup.

It imports action/plan types from `navi-init-plan.ts` and must not render CLI prose. Move preview-drift, guarded write, stale-state, symlink, malformed-action, and write-order tests into `tests/cli/navi-init-apply.test.ts`.

- [ ] **Step 5: Reduce `navi-init.ts` to the Journey facade**

Keep in `navi-init.ts`:

- `ParsedInitOptions`, `NaviInitIo`, `parseInitArgs`;
- `renderInitPlan`, `runNaviInitCli`;
- dynamic orchestration of `buildInitPlan` and `applyInitPlan`;
- compatibility re-exports for the public names previously imported from this module.

Keep argument parsing, dry-run output, fingerprint gate, write invocation, and exit-code tests in `tests/cli/navi-init.test.ts`. Do not change `src/cli/navi.ts` command names or `navi-bin.mjs` loading.

- [ ] **Step 6: Verify changed responsibilities**

Run:

```bash
npm test -- \
  tests/repository/current-surface.test.ts \
  tests/cli/navi-init.test.ts \
  tests/cli/navi-init-plan.test.ts \
  tests/cli/navi-init-apply.test.ts \
  tests/cli/navi-project-trigger.test.ts \
  tests/cli/navi-doctor.test.ts \
  tests/cli/navi-evidence.test.ts
npm run typecheck
git diff --check
```

Expected: exact existing journeys and all filesystem safety cases pass.

- [ ] **Step 7: Commit Task 4**

```bash
git add src/cli tests/cli tests/repository tests/skills tests/fixtures
git commit -m "refactor: separate navi init responsibilities"
```

---

### Task 5: Consolidate Active Tests And Close The Stabilization Loop

**Files:**
- Create: `tests/skills/navi-supervision.test.ts`
- Create: `tests/skills/navi-project-map.test.ts`
- Create: `tests/skills/navi-capability-truthfulness.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`
- Modify: `tests/repository/current-surface.test.ts`
- Modify: `docs/navi/product-debt.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `docs/navi/design-history.md`

**Interfaces:**
- Consumes: focused skill references, active docs, package verifier, decomposed CLI, and archive boundary.
- Produces: one bounded Current Navi suite, a qualitative complexity regression gate, and an explicit handoff to post-merge real-project calibration.

- [ ] **Step 1: Re-home skill tests by responsibility**

Move, without duplicating, the existing tests into these owners:

- `navi-supervision.test.ts`: alpha4/5/6/7/8/11/12, quietness, continuation, decision handoff, mode, and Lane Handoff routing behavior.
- `navi-project-map.test.ts`: confirmed Map, Progress Map, Rhythm Map, lifecycle, language-following, initialization baseline, and Map maintenance behavior.
- `navi-capability-truthfulness.test.ts`: current-main versus tagged release truthfulness, no runtime/background claims, source installation boundaries, package identity, legacy migration, and authorization boundaries.
- `navi-skill.test.ts`: frontmatter, trigger routing, reference ownership, canonical/package mirror, and plugin metadata.

Delete duplicate paragraph-presence assertions when another test already checks the same rule in its authoritative reference. Retain exact prose assertions only for:

- generated `AGENTS.md` trigger bytes;
- user authorization and write boundaries;
- response-language-following rule;
- confirmed Project Map authority;
- Lane Handoff field names/wire format;
- source/package mirror equality;
- tagged-release versus unreleased-current-main truthfulness; and
- explicit no-runtime/no-background capability claims.

- [ ] **Step 2: Add the qualitative complexity regression gate**

Append to `docs/navi/product-debt.md`:

```markdown
## Complexity Regression Gate

Before Codex proposes a new capability or cross-boundary change, answer:

1. What user problem does it solve?
2. Which active module and rule owner contains it?
3. Does it create a second state, rule, or template authority?
4. Does it depend on Historical Along?
5. What is the minimum sufficient verification?
6. Is the user value worth the additional concept and maintenance surface?

This gate is qualitative. It does not run for ordinary conversation, local wording changes, or bounded bug fixes. Being easy to parallelize does not establish product priority.
```

Update `docs/navi/roadmap.md` to mark complexity stabilization as the current phase and state that the next gate is two or three real-project calibrations, not another capability alpha or release.

- [ ] **Step 3: Run the bounded Current Navi integration suite**

Run exactly:

```bash
npm test -- \
  tests/cli \
  tests/package \
  tests/repository \
  tests/skills
npm run typecheck
npm run verify:plugin-package
git diff --check
```

Expected: all active test files pass. Do not add `archive/along/tests`, browser tests, release checks, `npm pack`, tag checks, or the former Historical Along suite.

- [ ] **Step 4: Audit the exit conditions**

Run:

```bash
rg -n "(?:from|import).*archive/along|(?:from|import).*src/(core|mcp|server|web)" src tests
rg -n '"(dev|mcp:working-thread|web|build)"' package.json
git status --short
```

Expected:

- the first two commands return no matches;
- status contains only planned Task 5 paths before commit;
- `archive/along/README.md` states evidence-only status;
- `docs/navi/README.md` is the active documentation entry point;
- canonical and packaged skill trees are byte-identical;
- no external target project or global Codex state was modified.

- [ ] **Step 5: Commit Task 5**

```bash
git add tests/skills tests/repository docs/navi
git commit -m "test: align navi checks with active boundaries"
```

- [ ] **Step 6: Send the final review-ready handoff**

After confirming a clean worktree, send one V1-conformant bare-text `NAVI_LANE_HANDOFF_EVENT` with:

- all five task commit IDs and subjects;
- exact changed/moved file groups;
- active suite file/test counts;
- typecheck, package verifier, and diff-check results;
- confirmation that Historical Along tests were not run by default;
- confirmation that no merge, push, tag, release, publication, global Codex, or external target-project action occurred; and
- residual risk: two or three real-project calibrations remain after parent integration.

Stop at parent read-only review. Do not merge or start calibration from the worktree.

---

## Post-Integration Calibration Contract

This section is for the source main task after explicit merge approval; it is not implementation-worktree scope.

Use Calibration mode in two or three real projects, preferably the already identified samples:

- `/Users/james/Codex Project/General Codex Project/engineering_loop`
- `/Users/james/Codex Project/General Codex Project/sub_ag_ski`
- `/Users/james/.codex/worktrees/77ad/auto_model_reasoning` only if it still represents a real active project and the user confirms it remains suitable

Observe one natural broad orientation prompt and one bounded continuation/decision prompt per selected project. Judge whether Navi remains understandable, quiet, truthful, and useful; whether initialization burden changed; and whether archive/rule/CLI refactoring caused any visible regression. Do not turn this into a release checklist or full-system proof.

The stabilization phase closes when parent review passes, the branch is explicitly integrated, and two or three real-project observations reveal no material regression or new installation burden. Remaining aesthetic cleanup becomes ordinary product debt rather than a reason to continue the refactoring loop.
