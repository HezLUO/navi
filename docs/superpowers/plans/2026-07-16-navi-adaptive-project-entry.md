# Navi Adaptive Project Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give mature and evidence-poor Codex projects one Navi entry journey that selects an evidence-first candidate, conflict decision, stale-evidence check, or Guided Baseline Formation without adding a second initializer or weakening the confirmed-Map write boundary.

**Architecture:** Add one focused `project-entry-v1.md` prompt/docs owner for bounded evidence profiling and adaptive baseline formation, then route the existing Navi skill and Project Map reference to it. Keep interpretation in Codex; change the existing CLI only to rank safer, more useful candidate evidence paths for the already-shipped `needs-confirmed-map` result. Reuse the current Project Map schema, `navi init` preview, fingerprint, write ordering, and project trigger unchanged.

**Tech Stack:** Codex skill Markdown, TypeScript/Node.js filesystem inspection, Vitest contract and CLI tests, existing Navi plugin-package mirror verifier.

## Global Constraints

- Implement only after the approved design at `docs/superpowers/specs/2026-07-16-navi-adaptive-project-entry-design.md` and this plan are committed and pushed to a clean `main`.
- Execute in a new Codex-managed worktree. Do not implement in the persistent Main Thread.
- Use the Codex-first Supervised Delivery Loop V1 with one fresh read-only Validation Thread at `review-ready` and at most two in-scope remediation re-reviews in that same Validation Thread.
- Treat the complete Execution Contract, every approved amendment, the exact review-ready event, executor verification, and residual risks as required Validation Contract evidence.
- Keep one user-visible entry, two internal baseline-formation strategies, and one confirmed-Map preview/write exit.
- Evidence Profile remains turn-local, prompt/docs-backed Codex judgment. Do not add a persisted profile, runtime classifier, database, index, subprocess Git reader, background scan, watcher, daemon, scheduler, or second init command.
- The CLI may discover and rank candidate local text sources. It must not interpret Desired Outcome, choose authority, classify conflicts, inspect Git history, inspect code semantically, or create a Project Map.
- Preserve the existing `.navi/project-map.md` schema, managed `AGENTS.md` trigger, candidate-outside-target rule, fingerprint binding, Map-first/trigger-last transaction, partial-activation behavior, and direct-CLI refusal boundaries.
- Direction conflict must return to the user. Modification time, fixed document preference, code state, and model confidence must not silently select product direction.
- Existing roadmaps, specs, plans, trackers, and code retain domain ownership. The confirmed Map owns only Navi's supervision baseline.
- A new project may confirm an explicitly provisional route or working rhythm, but stored blank placeholders and fabricated certainty remain forbidden.
- Do not modify release metadata, package metadata, dependency files, Historical Along, MCP/runtime/UI surfaces, external target projects, global Codex state, or `work/`.
- Do not run full `npm test`. Use the exact bounded checks in this plan, plus `npm run typecheck`, `npm run verify:plugin-package`, and diff/scope audits.
- Do not merge, push, tag, release, publish, install globally, run target-project init, or perform real-project calibration inside the implementation lane.
- After explicit integration, calibrate one mature real project first. Calibrate one new or evidence-poor project second only after the mature-project result is understood.

## Execution Contract

```text
goal: implement one adaptive project-entry journey for mature and evidence-poor Codex projects
user_value: users enter Navi through one natural path and receive a truthful candidate or focused baseline question without classifying their own project
source_task: persistent Navi Main Thread task identifier supplied at worktree creation
baseline: exact clean main commit containing the approved design and this plan
allowed_scope: the exact canonical/package skill, evidence-discovery, focused-test, and current-doc paths listed by Tasks 1-4
forbidden_scope: release/package/dependency metadata, Historical Along, MCP/runtime/UI, external projects, global state, work/, automatic Git or target writes
implementation_plan: docs/superpowers/plans/2026-07-16-navi-adaptive-project-entry.md
verification_budget: exact Task 1-4 focused commands, final bounded suite, typecheck, plugin verification, diff and scope audits; no full npm test
validation_level: 3
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

The execution thread may make the four local task commits named below without asking for separate commit approval. Any new file path, runtime interpretation, target-project write, permission change, verification-budget expansion, architecture change, or known-risk acceptance is premise-changing and returns to the Main Thread.

---

## Planned File Structure

### New canonical owner and mirror

- `.agents/skills/navi/references/project-entry-v1.md`: sole detailed owner for bounded evidence scan, Evidence Profile, adaptive strategy routing, layered authority, provisional-route rules, and material-update handoff.
- `plugins/navi/skills/navi/references/project-entry-v1.md`: byte-identical package mirror.
- `tests/skills/navi-project-entry.test.ts`: focused deterministic contract coverage for the new owner and mirror boundary.

### Existing skill routing surfaces

- `.agents/skills/navi/SKILL.md`: list the new owner and route uninitialized broad supervision through it.
- `.agents/skills/navi/references/project-map-v1.md`: keep Project Map schema/rendering/maintenance ownership; replace duplicated entry detail with a concise handoff to `project-entry-v1.md` while preserving the existing CLI write boundary.
- `plugins/navi/skills/navi/SKILL.md` and `plugins/navi/skills/navi/references/project-map-v1.md`: exact canonical mirrors.
- `tests/skills/navi-project-map.test.ts` and `tests/skills/navi-skill.test.ts`: owner-routing and non-duplication assertions.

### Existing CLI evidence discovery

- `src/cli/navi-evidence.ts`: recognize and deterministically prioritize README, roadmap, active plan/spec, status, handoff/tracker/workflow, legacy project record, and package-shape candidates without interpreting them.
- `tests/cli/navi-evidence.test.ts`: ranking, bounds, legacy preservation, symlink, byte-budget, and generated-trigger stripping coverage.
- `tests/cli/navi-init-plan.test.ts`: prove the existing `needs-confirmed-map` plan exposes the improved top candidate paths while remaining read-only.

### Current documentation and truthfulness

- `docs/navi/project-init.md`: explain one entry, Evidence Profile routing, mature evidence-first candidate, evidence-poor Guided Baseline Formation, layered authority, and unchanged approved write.
- `README.md`, `README.zh-CN.md`, `plugins/navi/README.md`: concise current-source adaptive-entry truthfulness without claiming runtime classification.
- `docs/navi/design-history.md`: index the approved design and this plan.
- `docs/navi/roadmap.md`: make mature-project calibration the next gate after integration and keep new-project calibration second.
- `tests/repository/current-surface.test.ts` and `tests/skills/navi-capability-truthfulness.test.ts`: active authority, public boundary, and no-runtime assertions.

---

### Task 1: Define The Adaptive Project Entry Contract

**Files:**
- Create: `.agents/skills/navi/references/project-entry-v1.md`
- Create: `tests/skills/navi-project-entry.test.ts`

**Interfaces:**
- Consumes: the confirmed `.navi/project-map.md` schema and write boundary owned by `project-map-v1.md` and `navi init`.
- Produces: one prompt/docs owner with `coherent | conflicting | insufficient | stale` Evidence Profile routing used by Tasks 2-4.

- [ ] **Step 1: Create the focused test with failing owner and route assertions**

Create `tests/skills/navi-project-entry.test.ts`:

```ts
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const marker = `${heading}\n`;
  const start = markdown.indexOf(marker);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  const level = heading.match(/^#+/u)?.[0].length;
  if (level === undefined) throw new Error(`Expected Markdown heading: ${heading}`);
  const contentStart = start + marker.length;
  const nextHeading = new RegExp(`\\n#{1,${level}} \\S`, "gu");
  nextHeading.lastIndex = contentStart;
  const match = nextHeading.exec(markdown);
  return markdown.slice(contentStart, match?.index ?? markdown.length);
}

describe("Navi adaptive project entry", () => {
  it("defines one visible entry and four evidence profiles", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );

    expect(reference).toContain("one user-visible project-entry journey");
    expect(reference).toContain("Evidence Profile");
    for (const profile of ["coherent", "conflicting", "insufficient", "stale"]) {
      expect(reference).toContain(profile);
    }
    for (const field of [
      "profile",
      "sources",
      "supported_judgments",
      "missing_judgments",
      "conflicts",
      "uncertainty",
      "next_baseline_action",
    ]) {
      expect(reference).toContain(field);
    }
  });

  it("routes each profile without deciding direction for the user", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const routing = extractSection(reference, "## Profile Routing");

    expect(routing).toContain("coherent -> Evidence-First Candidate");
    expect(routing).toContain("conflicting -> Conflict Resolution");
    expect(routing).toContain("insufficient -> Guided Baseline Formation");
    expect(routing).toContain("stale -> Targeted Code Check, then reclassify");
    expect(routing).toMatch(/must not[\s\S]*modification time/i);
    expect(routing).toMatch(/direction conflict[\s\S]*user/i);
  });

  it("keeps scanning bounded and code checks targeted", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const scan = extractSection(reference, "## Bounded Evidence Scan");

    for (const expected of [
      ".navi/project-map.md",
      "AGENTS.md",
      "README",
      "roadmap",
      "active specification or implementation plan",
      "status records, handoffs, trackers, or task files",
      "Git status, current branch, and recent commits",
    ]) {
      expect(scan).toContain(expected);
    }
    expect(scan).toMatch(/stop gathering evidence[\s\S]*unlikely to change the profile/i);
    expect(scan).toMatch(/targeted code check[\s\S]*cannot establish the user's desired outcome/i);
  });

  it("defines mature and evidence-poor baseline strategies", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );

    const mature = extractSection(reference, "## Evidence-First Candidate");
    expect(mature).toMatch(/do not ask[\s\S]*repeat supported facts/i);
    expect(mature).toMatch(/complete candidate[\s\S]*final confirmation/i);

    const guided = extractSection(reference, "## Guided Baseline Formation");
    expect(guided).toContain("one missing judgment at a time");
    expect(guided).toContain("provisional route or working rhythm");
    expect(guided).toContain("Evidence And Uncertainty");
    expect(guided).toMatch(/must not[\s\S]*blank placeholder/i);
  });

  it("preserves layered authority and the existing approved write exit", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const authority = extractSection(reference, "## Layered Authority");
    expect(authority).toContain("roadmaps own detailed product sequencing");
    expect(authority).toContain("confirmed `.navi/project-map.md`");
    expect(authority).toMatch(/does not replace[\s\S]*roadmap/i);

    const exit = extractSection(reference, "## Confirmed Exit");
    for (const expected of [
      "one combined",
      "fingerprint",
      "Map first",
      "trigger second",
      "explicit approval",
    ]) {
      expect(exit).toContain(expected);
    }
  });

  it("does not claim a persisted classifier or runtime surface", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    expect(reference).toContain("turn-local, prompt/docs-backed Codex judgment");
    expect(reference).toMatch(/not a persisted profile[\s\S]*runtime classifier/i);
    expect(reference).not.toContain("Navi runs a runtime classifier");
    expect(reference).not.toContain("Navi starts a background repository indexer");
    expect(reference).not.toContain("`navi init --new`");
    expect(reference).not.toContain("`navi init --existing`");
  });
});
```

- [ ] **Step 2: Run the new test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-project-entry.test.ts
```

Expected: FAIL because `.agents/skills/navi/references/project-entry-v1.md` does not exist.

- [ ] **Step 3: Create the canonical reference**

Create `.agents/skills/navi/references/project-entry-v1.md` with these exact sections:

```markdown
# Navi Adaptive Project Entry V1

Use this reference when a broad supervision need appears in a project without reliable project-local Navi guidance or a confirmed Project Map.

Navi exposes one user-visible project-entry journey. Evidence Profile is turn-local, prompt/docs-backed Codex judgment; it is not a persisted profile, runtime classifier, repository index, or automatic authority selector.

## Entry Boundary

Apply the quietness gate first. Narrow factual or bounded execution requests stay quiet. A broad progress, next-step, stop, wait, continue, confusion, or plan-reliability request may enter project initialization judgment when reliable project-local Navi guidance is missing.

Never initialize automatically. A declined entry receives explicitly uncertain best-effort read-only supervision, and Navi does not repeat the same reminder in that session.

## Evidence Profile

Record conceptually:

profile: coherent | conflicting | insufficient | stale
sources: bounded evidence used
supported_judgments: Desired Outcome, route or rhythm, Current Position, Current Boundary, or Next Decision supported by evidence
missing_judgments: required judgments still needing user input
conflicts: incompatible decision-relevant claims
uncertainty: incomplete or apparently outdated evidence
next_baseline_action: candidate | resolve conflict | ask one question | inspect code

Do not persist the profile as a project file.

## Bounded Evidence Scan

Inspect in order: existing `.navi/project-map.md` and project-local trigger state; `AGENTS.md`; README; active roadmap and active specification or implementation plan; status records, handoffs, trackers, or task files; then Git status, current branch, and recent commits.

Stop gathering evidence when additional reading is unlikely to change the profile. Do not perform a full-repository audit.

Use a targeted code check only when documents are insufficient, conflicting, or apparently stale. Name the disputed claim. Code may show implemented state but cannot establish the user's desired outcome or choose product direction.

## Profile Routing

coherent -> Evidence-First Candidate
conflicting -> Conflict Resolution
insufficient -> Guided Baseline Formation
stale -> Targeted Code Check, then reclassify

Navi must not use modification time, fixed filename priority, code state, or model confidence to settle a direction conflict. Present the claims, sources, impact, and recommendation; the user confirms the direction.

## Evidence-First Candidate

Build a complete candidate before questioning the user. Do not ask the user to repeat supported facts. Ask only about missing, conflicting, or route-changing judgments. Distinguish observed implementation state from intended direction, preserve evidence and uncertainty, then show one complete candidate for final confirmation.

## Guided Baseline Formation

Ask about one missing judgment at a time. Confirm Desired Outcome, Current Position, Current Boundary, Next Decision, and either a route or working rhythm. A new project may confirm an explicitly provisional route or working rhythm. Record unknowns in Evidence And Uncertainty; a stored candidate must not contain a blank placeholder or fabricated certainty.

## Layered Authority

Project roadmaps own detailed product sequencing; specs own design; plans own bounded execution; trackers own item state; code and tests provide implemented-behavior evidence. The confirmed `.navi/project-map.md` owns Navi's compact supervision baseline and does not replace a project roadmap.

## Confirmed Exit

Both strategies use one combined Map and managed-trigger preview, one fingerprint-bound explicit approval, Map first, and trigger second. Use the existing `navi init --map-file <candidate> --expect-plan <fingerprint> --write` boundary. Do not bypass the CLI, stage, commit, push, or mutate global state.

## Material Updates

Propose a bounded Map diff only when Desired Outcome, major route or Product Stage, Current Boundary, Next Decision, or decision-relevant evidence conflict materially changes. Routine commits, tests, and local completion do not independently trigger a Map update.
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

```bash
npm test -- tests/skills/navi-project-entry.test.ts
```

Expected: PASS, 1 file and 6 tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add .agents/skills/navi/references/project-entry-v1.md tests/skills/navi-project-entry.test.ts
git diff --cached --check
git commit -m "feat: define adaptive navi project entry"
```

Expected: one commit containing exactly the two Task 1 files.

---

### Task 2: Route The Navi Skill And Project Map To The New Owner

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/project-map-v1.md`
- Create: `plugins/navi/skills/navi/references/project-entry-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/project-map-v1.md`
- Modify: `tests/skills/navi-project-entry.test.ts`
- Modify: `tests/skills/navi-project-map.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: `project-entry-v1.md` from Task 1.
- Produces: canonical skill routing and byte-identical package mirrors without a second detailed owner.

- [ ] **Step 1: Add failing owner-routing assertions**

Append to `tests/skills/navi-project-entry.test.ts`:

```ts
it("routes the skill and Project Map owner without duplicating the entry contract", async () => {
  const [skill, projectMap, entry] = await Promise.all([
    readRepoText(".agents/skills/navi/SKILL.md"),
    readRepoText(".agents/skills/navi/references/project-map-v1.md"),
    readRepoText(".agents/skills/navi/references/project-entry-v1.md"),
  ]);

  expect(skill).toContain("references/project-entry-v1.md");
  expect(skill).toMatch(/uninitialized[\s\S]*adaptive project entry/i);
  expect(projectMap).toContain("project-entry-v1.md");
  expect(projectMap).toContain("Project Map schema, rendering, lifecycle, and maintenance");
  expect(projectMap).not.toContain("profile: coherent | conflicting | insufficient | stale");
  expect(entry).toContain("profile: coherent | conflicting | insufficient | stale");
});

it("keeps every modified package skill file byte-identical", async () => {
  for (const relativePath of [
    "SKILL.md",
    "references/project-map-v1.md",
    "references/project-entry-v1.md",
  ]) {
    const [canonical, packaged] = await Promise.all([
      readRepoText(`.agents/skills/navi/${relativePath}`),
      readRepoText(`plugins/navi/skills/navi/${relativePath}`),
    ]);
    expect(packaged).toBe(canonical);
  }
});
```

In `tests/skills/navi-project-map.test.ts`, update the initialization-owner test so it requires `project-entry-v1.md` and rejects the Evidence Profile schema in `project-map-v1.md`.

In `tests/skills/navi-skill.test.ts`, add `references/project-entry-v1.md` to the expected canonical/package file list and assert the Required References section routes adaptive project entry to it.

- [ ] **Step 2: Run focused routing tests and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-project-entry.test.ts tests/skills/navi-project-map.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because the skill does not route to the new owner and the package mirror does not exist.

- [ ] **Step 3: Add the canonical routing lines**

Add to `.agents/skills/navi/SKILL.md` Required References:

```markdown
- `references/project-entry-v1.md` for one adaptive entry, bounded evidence profiling, mature-project evidence-first candidates, conflict routing, and evidence-poor Guided Baseline Formation.
```

Add to Behavior Guardrails:

```markdown
- When broad supervision appears in an uninitialized project, use `references/project-entry-v1.md` to choose the baseline-formation strategy before using `references/project-map-v1.md` for the confirmed Map, rendering, and lifecycle.
```

In `.agents/skills/navi/references/project-map-v1.md`, keep `Confirmed Project Map Model`, `Final Preview And Activation`, `Global Bootstrap And Project Handoff`, `Daily Supervision Behavior`, and `Map Maintenance And Authorization`. Replace the detailed `Init Eligibility Gate` and `Guided Baseline Formation` ownership paragraphs with:

```markdown
#### Adaptive Baseline Formation

Use `project-entry-v1.md` for the one visible entry, bounded Evidence Profile, evidence-first mature-project candidate, direction-conflict decision, stale-evidence check, and evidence-poor Guided Baseline Formation.

This reference continues to own the Project Map schema, rendering, lifecycle, and maintenance. Both entry strategies must converge on the confirmed Map and exact preview/write boundary below.
```

- [ ] **Step 4: Synchronize exact package mirrors**

Run:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/project-map-v1.md plugins/navi/skills/navi/references/project-map-v1.md
cp .agents/skills/navi/references/project-entry-v1.md plugins/navi/skills/navi/references/project-entry-v1.md
```

- [ ] **Step 5: Run focused routing tests and confirm GREEN**

Run:

```bash
npm test -- tests/skills/navi-project-entry.test.ts tests/skills/navi-project-map.test.ts tests/skills/navi-skill.test.ts
```

Expected: PASS for all three files.

- [ ] **Step 6: Commit Task 2**

```bash
git add .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/project-map-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/project-map-v1.md \
  plugins/navi/skills/navi/references/project-entry-v1.md \
  tests/skills/navi-project-entry.test.ts \
  tests/skills/navi-project-map.test.ts \
  tests/skills/navi-skill.test.ts
git diff --cached --check
git commit -m "feat: route navi adaptive project entry"
```

Expected: one Task 2 commit containing exactly the eight listed files.

---

### Task 3: Rank Useful Mature-Project Evidence Without Interpreting It

**Files:**
- Modify: `src/cli/navi-evidence.ts`
- Modify: `tests/cli/navi-evidence.test.ts`
- Modify: `tests/cli/navi-init-plan.test.ts`

**Interfaces:**
- Consumes: existing `inspectProjectEvidence(targetDir): Promise<ProjectEvidenceInspection>` and `InitPlan.evidencePaths`.
- Produces: the same interfaces with improved deterministic candidate selection; no Evidence Profile type or semantic classifier.

- [ ] **Step 1: Add failing candidate-order tests**

Replace the first discovery case in `tests/cli/navi-evidence.test.ts` with:

```ts
it("discovers bounded mature-project sources in deterministic priority order", async () => {
  const root = await projectRoot();
  await fs.writeFile(path.join(root, "package.json"), "{}\n");
  await fs.writeFile(path.join(root, "README.md"), "# Read me\n");
  await fs.writeFile(path.join(root, "ROADMAP.md"), "# Route\n");
  await fs.writeFile(path.join(root, "STATUS.md"), "# Status\n");
  await fs.writeFile(path.join(root, "TRACKER.md"), "# Tracker\n");
  await fs.writeFile(path.join(root, "photo.png"), "not really an image\n");
  await fs.mkdir(path.join(root, "docs", "specs"), { recursive: true });
  await fs.writeFile(path.join(root, "docs", "specs", "active.md"), "# Active spec\n");

  const result = await inspectProjectEvidence(root);

  expect(result.items.map((item) => item.relativePath)).toEqual([
    "README.md",
    "ROADMAP.md",
    "docs/specs/active.md",
    "STATUS.md",
    "TRACKER.md",
    "package.json",
  ]);
  expect(result.truncated).toBe(false);
});
```

Add:

```ts
it("keeps one recognized legacy project record behind current mature-project sources", async () => {
  const root = await projectRoot();
  await fs.writeFile(path.join(root, "README.md"), "# Current project\n");
  await fs.writeFile(path.join(root, "ROADMAP.md"), "# Current route\n");
  const legacyDir = path.join(root, "docs", "along", "project-maps");
  await fs.mkdir(legacyDir, { recursive: true });
  await fs.writeFile(path.join(legacyDir, "confirmed.md"), "# Legacy evidence\n");

  const result = await inspectProjectEvidence(root);

  expect(result.items.map((item) => item.relativePath)).toEqual([
    "README.md",
    "ROADMAP.md",
    "docs/along/project-maps/confirmed.md",
  ]);
});
```

In `tests/cli/navi-init-plan.test.ts`, add a missing-map case that writes README, ROADMAP, STATUS, and package files, calls `buildInitPlan({ targetDir })`, and expects:

```ts
expect(plan.state).toBe("needs-confirmed-map");
expect(plan.evidencePaths).toEqual(["README.md", "ROADMAP.md", "STATUS.md"]);
expect(plan.actions).toEqual([]);
```

- [ ] **Step 2: Run evidence and init-plan tests and confirm RED**

Run:

```bash
npm test -- tests/cli/navi-evidence.test.ts tests/cli/navi-init-plan.test.ts
```

Expected: FAIL because ROADMAP, tracker, and specs are not current evidence candidates and the existing priorities differ.

- [ ] **Step 3: Extend known evidence candidates without changing interfaces**

In `src/cli/navi-evidence.ts`, replace `KNOWN_EVIDENCE_RELATIVE_PATHS` with:

```ts
const KNOWN_EVIDENCE_RELATIVE_PATHS = [
  "AGENTS.md",
  "README.md",
  "README",
  "ROADMAP.md",
  "ROADMAP",
  "PROJECT_STATE.md",
  "STATUS.md",
  "TODO.md",
  "TRACKER.md",
];
```

Replace `isEvidenceCandidate` with equivalent existing binary exclusions followed by these accepted text shapes:

```ts
const isMarkdown = lowerBase.endsWith(".md");
return lowerBase.startsWith("readme")
  || lowerBase === "agents.md"
  || lowerBase === "project_state.md"
  || lowerBase.startsWith("roadmap")
  || lowerBase.startsWith("todo")
  || lowerBase.startsWith("status")
  || lowerBase.startsWith("tracker")
  || lowerBase === "package.json"
  || lowerBase === "pyproject.toml"
  || (lowerPath.startsWith("docs/along/project-maps/") && isMarkdown)
  || (lowerPath.includes("/handoff") && isMarkdown)
  || (lowerPath.includes("/workflow") && isMarkdown)
  || (lowerPath.includes("/plan") && isMarkdown)
  || (lowerPath.includes("/spec") && isMarkdown);
```

Replace `evidencePriority` with:

```ts
function evidencePriority(relativePath: string): number {
  const lower = relativePath.toLowerCase();
  const base = path.posix.basename(lower);
  if (lower === "agents.md") return 0;
  if (base === "readme" || base === "readme.md") return 1;
  if (base.startsWith("roadmap")) return 2;
  if (lower.includes("/plan") || lower.includes("/spec")) return 3;
  if (
    base === "project_state.md"
    || base.startsWith("status")
    || base.startsWith("todo")
    || base.startsWith("tracker")
    || lower.includes("/workflow")
    || lower.includes("/handoff")
  ) return 4;
  if (lower.startsWith("docs/along/project-maps/")) return 5;
  if (base.startsWith("readme")) return 6;
  if (base === "package.json" || base === "pyproject.toml") return 7;
  return 99;
}
```

Do not add `mtime`, semantic classification, Git subprocesses, or code scanning to `navi-evidence.ts`.

- [ ] **Step 4: Run the bounded CLI tests and confirm GREEN**

Run:

```bash
npm test -- tests/cli/navi-evidence.test.ts tests/cli/navi-init-plan.test.ts tests/cli/navi-init.test.ts
```

Expected: PASS for all three files. Existing symlink, TOCTOU, byte-budget, count-bound, and generated-trigger stripping tests must remain green.

- [ ] **Step 5: Run TypeScript validation**

Run:

```bash
npm run typecheck
```

Expected: exit 0.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/cli/navi-evidence.ts \
  tests/cli/navi-evidence.test.ts \
  tests/cli/navi-init-plan.test.ts
git diff --cached --check
git commit -m "feat: prioritize navi project evidence"
```

Expected: one Task 3 commit containing exactly the three listed files.

---

### Task 4: Align Current Documentation And Calibration Gate

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/navi/project-init.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `tests/repository/current-surface.test.ts`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`

**Interfaces:**
- Consumes: the adaptive entry contract from Tasks 1-2 and improved evidence hints from Task 3.
- Produces: truthful current-source documentation and the explicit mature-first, evidence-poor-second calibration sequence.

- [ ] **Step 1: Add failing truthfulness and current-gate assertions**

In `tests/repository/current-surface.test.ts`, replace the existing `records supervised delivery as the current bounded implementation gate` test with:

```ts
it("records adaptive project entry as the current bounded gate", async () => {
  const [history, roadmap] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
  ]);
  const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
  const historyPhase = history.match(/## Current Phase\n(?<phase>[\s\S]*?)\n## /)?.groups?.phase ?? "";
  const roadmapPhase = roadmap.match(/## Current Phase\n(?<phase>[\s\S]*?)\n## /)?.groups?.phase ?? "";

  for (const currentPhase of [historyPhase, roadmapPhase]) {
    expect(currentPhase).toContain("Supervised Delivery Loop V1 is integrated");
    expect(currentPhase).toContain("adaptive project entry implementation is the current bounded gate");
    expect(currentPhase).toContain("first mature real-project calibration");
    expect(currentPhase).toContain(
      "new or evidence-poor project calibration follows after the mature-project result is understood",
    );
    expect(currentPhase).not.toContain(
      "Codex-first Supervised Delivery Loop V1 implementation is the current bounded gate",
    );
  }

  expect(active).toContain(
    "`docs/superpowers/specs/2026-07-16-navi-adaptive-project-entry-design.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-16-navi-adaptive-project-entry.md`",
  );
});
```

In `tests/skills/navi-capability-truthfulness.test.ts`, add:

```ts
it("describes adaptive project entry without claiming a runtime classifier", async () => {
  const [readme, chineseReadme, pluginReadme, projectInit] = await Promise.all([
    readRepoText("README.md"),
    readRepoText("README.zh-CN.md"),
    readRepoText("plugins/navi/README.md"),
    readRepoText("docs/navi/project-init.md"),
  ]);

  for (const surface of [readme, pluginReadme, projectInit]) {
    expect(surface).toMatch(/one (?:user-visible|visible) project entry/i);
    expect(surface).toMatch(/mature project[\s\S]*evidence-first candidate/i);
    expect(surface).toMatch(/insufficient evidence[\s\S]*Guided Baseline Formation/i);
    expect(surface).toMatch(/direction conflict[\s\S]*user/i);
    expect(surface).toMatch(/prompt\/docs-backed[\s\S]*not a runtime classifier/i);
    expect(surface).toMatch(/confirmed (?:Project )?Map[\s\S]*fingerprint-bound write/i);
  }

  expect(chineseReadme).toMatch(/一个(?:用户可见的)?项目入口/);
  expect(chineseReadme).toMatch(/成熟项目[\s\S]*evidence-first candidate/i);
  expect(chineseReadme).toMatch(/证据不足[\s\S]*Guided Baseline Formation/i);
  expect(chineseReadme).toMatch(/方向冲突[\s\S]*用户确认/);
  expect(chineseReadme).toMatch(/prompt\/docs-backed[\s\S]*不是 runtime classifier/i);
  expect(chineseReadme).toMatch(/confirmed Map[\s\S]*fingerprint-bound write/i);
});
```

- [ ] **Step 2: Run focused truthfulness tests and confirm RED**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts tests/skills/navi-capability-truthfulness.test.ts
```

Expected: FAIL because current docs do not describe adaptive entry or the new gate.

- [ ] **Step 3: Update the detailed project-init documentation**

In `docs/navi/project-init.md`, retain the existing global/project split, one preview, direct CLI, fixed Map, doctor, migration, and fresh-session sections. Expand `Just-In-Time Entry` with:

```markdown
Navi presents one visible project entry. It first performs a bounded evidence scan and selects an internal baseline strategy:

- coherent evidence -> an evidence-first candidate for confirmation;
- conflicting evidence -> one focused user direction decision;
- insufficient evidence -> Guided Baseline Formation;
- apparently stale evidence -> one targeted code or Git check, then reclassification.

The Evidence Profile is prompt/docs-backed, turn-local Codex judgment. It is not a persisted file, runtime classifier, background scanner, or authority decision.
```

Add a `Layered Authority` subsection stating that project documents retain detailed domain ownership while `.navi/project-map.md` owns the confirmed supervision baseline. Add a `New Projects` paragraph allowing an explicitly provisional route or working rhythm with unknowns in Evidence And Uncertainty and forbidding blank placeholders.

- [ ] **Step 4: Update public current-source summaries**

In `README.md` and `plugins/navi/README.md`, add this concise meaning beside the current guided-baseline journey:

```markdown
Current source uses one visible, prompt/docs-backed project entry. A mature project receives an evidence-first candidate; a direction conflict returns to the user; insufficient evidence falls back to Guided Baseline Formation. Both paths use the same confirmed Map preview and fingerprint-bound write. This is not a runtime classifier or background repository scanner.
```

Add this synchronized meaning to `README.zh-CN.md` without changing command examples or release identity:

```markdown
当前 source 使用一个用户可见的项目入口，由 prompt/docs-backed 行为完成分流。成熟项目先得到 evidence-first candidate；方向冲突交给用户确认；证据不足时进入 Guided Baseline Formation。两条路径共用同一个 confirmed Map preview 和 fingerprint-bound write。这不是 runtime classifier，也不是后台仓库扫描器。
```

- [ ] **Step 5: Update active authority and calibration order**

Add the design and plan paths to `docs/navi/design-history.md` Active. Update its Current Phase with the same four required current-gate meanings used by the replacement repository test.

Update `docs/navi/roadmap.md` Current Phase so it says Supervised Delivery V1 is integrated, adaptive project entry implementation is the current bounded gate, the first post-integration product calibration is a mature real project, and a new/evidence-poor project follows only after the mature result is understood. Keep distribution, release, runtime, UI, and other-agent work out of this gate.

- [ ] **Step 6: Run focused truthfulness tests and confirm GREEN**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/skills/navi-project-entry.test.ts tests/skills/navi-project-map.test.ts
```

Expected: PASS for all four files.

- [ ] **Step 7: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: all skill tests pass, plugin manifest validation passes, and source/package skill trees are byte-identical.

- [ ] **Step 8: Commit Task 4**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md \
  docs/navi/project-init.md docs/navi/design-history.md docs/navi/roadmap.md \
  tests/repository/current-surface.test.ts \
  tests/skills/navi-capability-truthfulness.test.ts
git diff --cached --check
git commit -m "docs: explain adaptive navi project entry"
```

Expected: one Task 4 commit containing exactly the eight listed files.

---

## Final Bounded Verification

- [ ] **Step 1: Confirm exact commit and file scope**

Run from the implementation base recorded before Task 1:

```bash
git log --oneline --reverse <base>..HEAD
git diff --name-only <base>..HEAD
git status --short --branch
```

Expected: exactly four local task commits; changed paths are limited to the files listed in Tasks 1-4; worktree is clean.

- [ ] **Step 2: Run the exact active acceptance suite**

```bash
npm test -- \
  tests/skills/navi-project-entry.test.ts \
  tests/skills/navi-project-map.test.ts \
  tests/skills/navi-skill.test.ts \
  tests/skills/navi-capability-truthfulness.test.ts \
  tests/repository/current-surface.test.ts \
  tests/cli/navi-evidence.test.ts \
  tests/cli/navi-init-plan.test.ts \
  tests/cli/navi-init.test.ts
```

Expected: all eight files pass.

- [ ] **Step 3: Run type and package boundaries**

```bash
npm run typecheck
npm run verify:plugin-package
git diff <base>..HEAD --check
```

Expected: all commands exit 0.

- [ ] **Step 4: Run forbidden-capability and mirror audits**

```bash
git diff <base>..HEAD -- src/cli/navi-evidence.ts | rg "child_process|spawn|exec|mtime|writeFile|appendFile|rename|rm\(" || true
rg -n "navi init --new|navi init --existing|runtime classifier|background repository scanner" \
  .agents/skills/navi plugins/navi/skills/navi src/cli docs/navi README.md README.zh-CN.md
diff -rq .agents/skills/navi plugins/navi/skills/navi
```

Expected: the source diff audit finds no subprocess, mtime, or write APIs; forbidden runtime phrases appear only in explicit negative-boundary prose if present; `diff -rq` prints nothing.

- [ ] **Step 5: Perform whole-candidate self-review**

Review the exact base-to-HEAD diff for:

- one owner for adaptive entry;
- complete four-profile routing;
- no user-facing project-type selection;
- no automatic direction choice;
- no duplicated Project Map schema or write policy;
- unchanged CLI interfaces and write boundaries;
- current-source documentation that does not overclaim runtime behavior; and
- exact plan deviations, if any, recorded in the review-ready evidence.

- [ ] **Step 6: Emit one review-ready event**

Send a conformant bare `NAVI_LANE_HANDOFF_EVENT` V1 directly to the source task with:

```text
kind: review-ready
reviewed_snapshot: exact HEAD
commits: exact four task commits
changed_scope: exact paths
verification: exact fresh bounded results
residual_risks: known test or prompt-behavior limits
```

Stop without merge, push, tag, release, target-project init, or calibration. The Main Thread creates one fresh Level 3 read-only Validation Thread for this exact event and snapshot.

---

## Post-Integration Calibration Boundary

This section is not executed by the implementation worktree.

After independent validation and explicit integration, the Main Thread enters Calibration mode and selects one mature real project with substantial current documents and code. It records:

- the natural broad prompt;
- bounded sources Navi chose to inspect;
- the Evidence Profile and why;
- the candidate Map, conflict, or focused question;
- whether the user had to classify the project or relay task information;
- whether any meaningless continuation or unauthorized full verification occurred; and
- the user's judgment of accuracy, interruption, and control gain.

Only after that result is understood should a new/evidence-poor project calibrate Guided Baseline Formation and provisional-route handling. Any implementation gap found by either calibration receives a new bounded design or implementation decision; calibration itself does not silently modify Navi or the target project.
