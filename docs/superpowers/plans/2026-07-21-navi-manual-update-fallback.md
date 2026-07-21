# Navi Manual Update Fallback V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` in one Codex-managed worktree. Use
> one fresh implementer and one fresh read-only reviewer per task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give installed Navi users one truthful, explicit update path after
the accepted Stock App `Native Absent` result, while preserving the current
task, project guidance, and release boundaries.

**Architecture:** Add one prompt/docs-backed Manual Update Fallback owner. It
classifies the configured installation channel, permits the official Git
marketplace upgrade only after direct user approval at a stable checkpoint,
and states that the current Stock App cannot reliably inject the updated Skill
into the existing task. A newly created task is the narrowest proved activation
boundary. Local-source and unavailable Public Directory channels receive
separate truthful guidance. No updater runtime, scheduler, CLI command, or
project migration is added.

**Tech Stack:** Markdown Navi skill/reference contracts, bilingual repository
and plugin documentation, TypeScript, Vitest, Git, Codex plugin CLI help
contract, and canonical/package mirror verification.

## Evidence Basis

- Approved design:
  `docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md`.
- Approved inspection plan:
  `docs/superpowers/plans/2026-07-21-navi-stock-app-update-capability-inspection.md`.
- Accepted inspection event:
  `navi-stock-update-inspection-result-20260721-01`.
- Accepted validation result:
  `navi-stock-update-validation-result-20260721-01`.
- Reviewed snapshot:
  `dcd869581e827cd0ebd9d91bee9661abc62c6f7e`.
- Observed host:
  Stock App `26.715.52143` build `5591`, Codex CLI `0.144.5`.
- Accepted capability tuple:
  C1 scheduling `unknown`, C2 upgrade/cache ordering `unknown`, C3 forced
  discovery `present`, C4 existing-task structured Skill input `absent`,
  on-demand chain `incomplete`, classification `Native Absent`.
- Current installed CLI syntax:
  `codex plugin marketplace upgrade [MARKETPLACE_NAME] --json`.
  `marketplace update` is not a valid command.

## Global Constraints

- Use exactly four implementation task commits with the subjects specified in
  this plan. The design and plan commits are separate.
- Add no automatic update check, interval check, background work, timer,
  scheduler, watcher, daemon, queue, database, Runtime Surface, Update Host,
  panel, MCP server, hook, automation, or notification service.
- Add no source, CLI, package, dependency, lockfile, plugin-manifest, generated
  init bundle, distribution-staging, release, tag, marketplace-catalog, or
  target-project behavior.
- Do not create or move `stable`, `preview`, a release tag, a GitHub Release,
  a Public Plugin Directory entry, or an npm publication.
- Do not claim that Stock App startup scheduling or cache-readiness ordering is
  absent. Both remain `unknown` for the inspected version.
- Do not claim that a Stock App restart reloads an updated Skill into the same
  task. That behavior is unproved.
- Do not claim that plain text, an `@` mention, or a natural-language request
  injects the discovery-returned installed-cache Skill into an existing task.
- The current task may continue using its existing Navi version. The narrowest
  proved updated-version activation boundary in the Stock App is a genuinely
  new task after successful official update verification.
- A plugin update never requires `navi init` and never rewrites
  `.navi/project-map.md` or the Navi `AGENTS.md` managed block.
- The global marketplace upgrade command is a user-owned mutation. Navi may
  explain it and request approval; it must not run it silently.
- `codex plugin marketplace upgrade navi-source --json` applies only to a
  verified Git-backed `navi-source` marketplace. It must not be offered as a
  local-source checkout updater.
- A local-source installation is updated through the user's trusted source
  workflow. Navi does not invent a tag, branch, `git pull`, dependency, or
  release command.
- The Public Plugin Directory remains unavailable for Navi now. Do not present
  Directory update behavior as current.
- Keep the first ordinary update failure on the prior version with no immediate
  retry. Failure does not authorize marketplace removal/re-add, plugin removal,
  cache deletion, config edits, or rollback mutation.
- Keep canonical and packaged Navi skill files byte-identical.
- Use whitespace-normalized semantic assertions for Markdown. Never make hard
  line wrapping part of acceptance.
- Do not touch `work/`, Historical Along, real Codex global state, external
  projects, or unrelated files.
- Do not merge, push, tag, release, publish, or run a real marketplace update
  during implementation or validation.
- Final independent validation is Level 3 because the new guidance controls a
  real global plugin-state mutation and a user-visible continuity boundary.
  The validator remains read-only and does not install dependencies.

## Execution Contract

```text
goal: implement Navi Manual Update Fallback V1 for the accepted Native Absent Stock App branch
user_value: users can update a verified Git-backed Navi installation without being promised automatic same-task reload or being told to reinitialize projects
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved design, accepted capability records, and this plan
allowed_scope: exactly the 16 canonical/package owner, skill adoption, user documentation, current authority, and focused-test paths listed in Tasks 1-4
forbidden_scope: CLI/runtime/source/package/dependency/manifest/catalog/generated bundle, real marketplace or plugin mutation, stable or preview refs, release, publication, target projects, work/, Historical Along, merge, push
implementation_plan: docs/superpowers/plans/2026-07-21-navi-manual-update-fallback.md
verification_budget: exact focused tests, typecheck, plugin-package verification, mirror checks, diff and exact scope audits; no full npm test and no real update command
validation_level: 3
validation_preauthorized: true
remediation_limit: 2
plan_satisfiability_check: required
plan_artifact_correction: bounded
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

## Preconditions

Run:

```bash
git status --short --branch
git rev-parse HEAD
test -f docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md
test -f docs/superpowers/plans/2026-07-21-navi-stock-app-update-capability-inspection.md
test -f docs/superpowers/plans/2026-07-21-navi-manual-update-fallback.md
test -f .agents/skills/navi/SKILL.md
test -f tests/skills/navi-skill.test.ts
test -f tests/skills/navi-capability-truthfulness.test.ts
test -f tests/repository/current-surface.test.ts
codex plugin marketplace upgrade --help
```

Expected: exact supplied baseline; only the known pre-existing untracked
`work/`; and help showing `upgrade [MARKETPLACE_NAME]` plus `--json`. Do not
read, clean, stage, or modify `work/`.

If `node_modules` is absent, use the existing bounded dependency-restore policy
for at most one eligible project-local `npm ci` attempt. Confirm
`package.json` and `package-lock.json` remain byte-identical. Do not use
`npm install` or let a Validation Task install dependencies.

Run the bounded baseline:

```bash
npm test -- tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: PASS before production edits.

## Planned File Structure And Ownership

### Task 1: sole manual-update owner

- `.agents/skills/navi/references/update-checkpoint-v1.md`: sole detailed
  owner for the accepted host capability basis, channel classification, stable
  checkpoint, explicit approval, Git-backed update flow, new-task activation,
  failure preservation, no-reinit boundary, and future supersession.
- `plugins/navi/skills/navi/references/update-checkpoint-v1.md`:
  byte-identical package mirror.
- `tests/skills/navi-update-checkpoint.test.ts`: focused owner, channel,
  continuity, failure, truthfulness, and mirror assertions.

### Task 2: skill adoption

- `.agents/skills/navi/SKILL.md`: routes explicit Navi update requests to the
  owner and states the concise fail-closed boundary.
- `plugins/navi/skills/navi/SKILL.md`: byte-identical package mirror.
- `tests/skills/navi-skill.test.ts`: reference inventory, routing, and
  no-schema-duplication assertions.

### Task 3: user-facing update guidance

- `docs/navi/update.md`: canonical user guide for Git-backed, local-source,
  Public Directory, existing-task, failure, and no-reinit behavior.
- `README.md`: concise English current-source update path and link.
- `README.zh-CN.md`: equivalent Chinese path.
- `plugins/navi/README.md`: installed-package/source-alpha update guidance.
- `tests/skills/navi-capability-truthfulness.test.ts`: cross-surface commands,
  channel distinctions, and no-automatic-update assertions.

### Task 4: current authority and accepted evidence

- `docs/navi/calibration-log.md`: accepted Stock App inspection and validation
  record.
- `docs/navi/design-history.md`: active design/inspection/manual-fallback
  authority and version-scoped Native Absent boundary.
- `docs/navi/roadmap.md`: manual fallback as the supported current update path;
  Update Host and release channels remain separate.
- `docs/navi/product-debt.md`: C1/C2 unknown, current-task structured injection
  absence, future reinspection, and successor-task continuity cost.
- `tests/repository/current-surface.test.ts`: exact current authority and
  capability truthfulness assertions.

---

### Task 1: Define The Manual Update Fallback Owner

**Files:**
- Create: `.agents/skills/navi/references/update-checkpoint-v1.md`
- Create: `plugins/navi/skills/navi/references/update-checkpoint-v1.md`
- Create: `tests/skills/navi-update-checkpoint.test.ts`

**Interfaces:**
- Consumes: explicit user request, stable-checkpoint state, delivery-group
  state, and verified marketplace channel.
- Produces: one bounded manual-update decision and truthful activation guidance.
- Does not invoke any command or persist a version lease.

- [ ] **Step 1: Write the failing owner tests**

Create `tests/skills/navi-update-checkpoint.test.ts`:

```ts
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function extractSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const after = markdown.slice(start + heading.length);
  const next = after.search(/\n## /u);
  return next < 0 ? after : after.slice(0, next);
}

describe("Navi Manual Update Fallback V1", () => {
  it("records the accepted Native Absent capability tuple without widening unknowns", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("Native Absent");
    expect(reference).toContain("C1 scheduling remains unknown");
    expect(reference).toContain("C2 upgrade and cache-readiness ordering remains unknown");
    expect(reference).toContain("C3 forced discovery is present");
    expect(reference).toContain("C4 existing-task structured Skill input is absent");
    expect(reference).toContain("version-scoped host evidence");
  });

  it("requires an explicit request, a stable checkpoint, and a closed delivery group", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("explicit user request");
    expect(reference).toContain("stable checkpoint");
    expect(reference).toContain("active delivery group");
    expect(reference).toContain("defer");
    expect(reference).toContain("direct user approval");
    expect(reference).not.toMatch(/automatically checks? the network every prompt/i);
  });

  it("routes each installation channel without guessing", async () => {
    const rawReference = await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    );
    const reference = normalizeWhitespace(rawReference);

    expect(reference).toContain("Git-backed `navi-source`");
    expect(reference).toContain("codex plugin marketplace upgrade navi-source --json");
    expect(reference).toContain("codex plugin list --marketplace navi-source --available --json");
    expect(reference).toContain("local-source marketplace");
    expect(reference).toContain("does not update the source checkout");
    expect(reference).toContain("Public Plugin Directory");
    expect(reference).toContain("not available");
    expect(reference).toContain("unknown channel");
    expect(reference).toContain("must not guess");
    expect(rawReference).not.toMatch(
      /```(?:text|bash)?\s*codex plugin marketplace update(?:\s|`)/iu,
    );
  });

  it("keeps the existing task truthful and uses the narrowest proved activation boundary", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    );
    const continuity = normalizeWhitespace(
      extractSection(reference, "## Existing Task Boundary"),
    );

    expect(continuity).toContain("current task may continue using its existing Navi version");
    expect(continuity).toContain("genuinely new Codex task");
    expect(continuity).toContain("narrowest proved");
    expect(continuity).not.toMatch(/restart(?:ing)? Codex[^.]*same task[^.]*updated/i);
    expect(continuity).not.toMatch(/plain text[^.]*inject/i);
  });

  it("preserves failure, project guidance, and release boundaries", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("no immediate retry");
    expect(reference).toContain("prior verified version");
    expect(reference).toContain("does not require `navi init`");
    expect(reference).toContain("does not rewrite `.navi/project-map.md`");
    expect(reference).toContain("does not rewrite the Navi `AGENTS.md` managed block");
    expect(reference).toMatch(/does not authorize[\s\S]*release[\s\S]*publication/i);
  });

  it("keeps the canonical and packaged owners byte-identical", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/update-checkpoint-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/update-checkpoint-v1.md"),
    ]);

    expect(packaged).toBe(canonical);
  });
});
```

- [ ] **Step 2: Run the focused RED check**

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts
```

Expected: FAIL because the new owner files do not exist.

- [ ] **Step 3: Create the canonical owner**

Create `.agents/skills/navi/references/update-checkpoint-v1.md` with these
sections and semantics:

````markdown
# Navi Manual Update Fallback V1

This reference is the sole detailed owner for explicit Navi update requests on
the accepted Stock App Native Absent branch. It is prompt/docs-backed guidance,
not an updater, scheduler, watcher, database, queue, daemon, or Runtime Surface.

## Capability Basis

The accepted Stock App inspection is version-scoped host evidence. For Stock
App 26.715.52143 build 5591 with Codex CLI 0.144.5, C1 scheduling remains
unknown, C2 upgrade and cache-readiness ordering remains unknown, C3 forced
discovery is present, and C4 existing-task structured Skill input is absent.
The accepted classification is Native Absent. A later accepted inspection may
supersede this host boundary; model memory or a newer version number alone may
not.

## Trigger And Stable Checkpoint

Use this owner only after an explicit user request to check or update Navi. Do
not automatically check the network on every prompt, at startup, or on a timer.
The request may proceed only at a stable checkpoint after the current response
and approved actions finish. If an active delivery group can still return a
premise-, scope-, acceptance-, risk-, or integration-changing result, defer the
update until that group closes.

The global marketplace update is a user-owned mutation. Show the exact
channel-specific action and require direct user approval before it runs. A
recommendation is not approval.

## Channel Classification

Classify the installed source from bounded official marketplace and plugin
evidence before giving a command.

- Git-backed `navi-source`: the configured marketplace is Git-backed and the
  installed plugin identity is `navi@navi-source`. Use the Git-backed flow.
- local-source marketplace: `navi-source` resolves to a local checkout. The
  marketplace upgrade command does not update the source checkout. The user
  keeps control of the trusted source workflow; Navi must not invent a branch,
  tag, `git pull`, dependency command, or release.
- Public Plugin Directory: Navi is not available there now. Do not present a
  Directory update action as current behavior.
- unknown channel: stop with one focused clarification. Navi must not guess a
  marketplace name, source, ref, selector, or update command.

## Git-Backed Update Flow

After channel verification, present these exact official commands:

```text
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

The first command is the direct user-approved global mutation. The second is a
read-only verification step. Do not use the nonexistent `codex plugin
marketplace update` command. Do not remove and re-add the marketplace or
plugin, edit Codex config, delete cache directories, or change a pinned source
ref as an implicit repair.

Successful command completion proves only the official manual update action.
It does not prove Stock App automatic scheduling, same-task activation, or a
release channel that has not been activated.

## Existing Task Boundary

The current task may continue using its existing Navi version after the global
installation changes. The current Stock App does not expose the proved
structured Skill-input path required to activate the discovery-returned
installed-cache Skill in that existing task.

The narrowest proved updated-version activation boundary is a genuinely new
Codex task created after successful official update verification. Do not claim
that restarting Codex reloads the updated Skill into the same task. Do not
treat plain text, an `@` mention, or a natural-language request as equivalent
to a structured Skill input.

Starting a new task is a host continuity fallback, not project
reinitialization. Preserve the user's project, Outcome Boundary, Project Map,
and accepted delivery evidence. Carry forward only the bounded context needed
for the next task; do not rewrite historical old-version evidence.

## Failure Preservation

If the update or verification fails, keep the prior verified version and the
current task. There is no immediate retry. One failure does not authorize
marketplace removal/re-add, plugin removal, cache deletion, config edits,
source-ref changes, or another mutation. Report the exact failed command and
the smallest user decision needed.

## Project Guidance Boundary

A plugin update does not require `navi init`, does not rewrite
`.navi/project-map.md`, and does not rewrite the Navi `AGENTS.md` managed block.
A later explicit Map contract migration remains previewed, fingerprint-bound,
and separately approved.

## Hard Boundaries

This fallback does not authorize background checks, automatic update claims,
same-task reload claims, an Update Host, a panel, a Runtime Surface, new
permissions, source migration, release, publication, Public Plugin Directory
submission, or target-project writes.
````

- [ ] **Step 4: Copy the canonical owner to the package mirror**

```bash
cp .agents/skills/navi/references/update-checkpoint-v1.md plugins/navi/skills/navi/references/update-checkpoint-v1.md
```

- [ ] **Step 5: Run the focused GREEN check**

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 6: Review Task 1 and commit**

Run a fresh read-only task review against the approved design, inspection
result, validation result, and Task 1 diff. Require no Critical, Important, or
Minor finding before commit.

```bash
git diff --check
cmp .agents/skills/navi/references/update-checkpoint-v1.md plugins/navi/skills/navi/references/update-checkpoint-v1.md
git add .agents/skills/navi/references/update-checkpoint-v1.md plugins/navi/skills/navi/references/update-checkpoint-v1.md tests/skills/navi-update-checkpoint.test.ts
git commit -m "feat: define navi manual update fallback"
```

---

### Task 2: Route Explicit Update Requests Through The Owner

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: an explicit natural-language Navi update request.
- Produces: concise routing to `update-checkpoint-v1.md` without duplicating
  its commands or capability schema.

- [ ] **Step 1: Add failing skill-adoption tests**

Add to `tests/skills/navi-skill.test.ts`:

```ts
it("routes explicit Navi update requests to one truthful owner", async () => {
  const skill = normalizeWhitespace(
    await readRepoText(".agents/skills/navi/SKILL.md"),
  );

  expect(skill).toContain("references/update-checkpoint-v1.md");
  expect(skill).toContain("explicit Navi update request");
  expect(skill).toContain("accepted Native Absent boundary");
  expect(skill).toContain("must not claim automatic or same-task update");
  expect(skill).not.toContain("codex plugin marketplace upgrade navi-source --json");
});
```

Add `plugins/navi/skills/navi/references/update-checkpoint-v1.md` to the
existing required package layout list.

- [ ] **Step 2: Run the focused RED check**

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because SKILL.md does not route update requests yet.

- [ ] **Step 3: Adopt the owner in canonical SKILL.md**

Add this Required References bullet after `model-routing-v1.md`:

```markdown
- `references/update-checkpoint-v1.md` is the sole owner for explicit Navi update requests, channel-specific manual guidance, current-task continuity, failure preservation, and the accepted Native Absent host boundary.
```

Add this Hard Boundaries bullet:

```markdown
- For an explicit Navi update request, use `references/update-checkpoint-v1.md`; under the accepted Native Absent boundary, Navi must not claim automatic or same-task update, silently run a global marketplace mutation, guess an installation channel, or require project reinitialization.
```

Add this Behavior Guardrails bullet:

```markdown
- Route an explicit Navi update request to `references/update-checkpoint-v1.md`. Keep ordinary supervision quiet and do not surface update guidance without an explicit request or a separately approved release/migration decision.
```

- [ ] **Step 4: Copy canonical SKILL.md to the package mirror**

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
```

- [ ] **Step 5: Run Task 1-2 coverage**

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts tests/skills/navi-skill.test.ts
```

Expected: PASS.

- [ ] **Step 6: Review Task 2 and commit**

Require one fresh read-only task review and exact mirror equality.

```bash
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
git diff --check
git add .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md tests/skills/navi-skill.test.ts
git commit -m "feat: route navi manual updates"
```

---

### Task 3: Publish Truthful Channel-Specific User Guidance

**Files:**
- Create: `docs/navi/update.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`

**Interfaces:**
- Consumes: the owner contract and exact current CLI help.
- Produces: one English/Chinese user journey without promising automatic or
  same-task activation.

- [ ] **Step 1: Add failing cross-surface truthfulness tests**

Add to `tests/skills/navi-capability-truthfulness.test.ts`:

```ts
it("documents the accepted manual update fallback without overstating Stock App support", async () => {
  const [readme, chineseReadme, pluginReadme, updateGuide] = await Promise.all([
    readRepoText("README.md"),
    readRepoText("README.zh-CN.md"),
    readRepoText("plugins/navi/README.md"),
    readRepoText("docs/navi/update.md"),
  ]);

  for (const surface of [readme, pluginReadme, updateGuide]) {
    const normalized = surface.replace(/\s+/gu, " ").trim();

    expect(normalized).toContain("codex plugin marketplace upgrade navi-source --json");
    expect(normalized).toContain("codex plugin list --marketplace navi-source --available --json");
    expect(normalized).toMatch(/current task.*existing Navi version/i);
    expect(normalized).toMatch(/new Codex task.*updated version/i);
    expect(normalized).toMatch(/does not require `navi init`/i);
    expect(normalized).toMatch(/local-source.*does not update the source checkout/i);
    expect(normalized).not.toContain("codex plugin marketplace update");
    expect(normalized).not.toMatch(/Stock App automatically checks|restart Codex to update the same task/i);
  }

  const normalizedChineseReadme = chineseReadme.replace(/\s+/gu, " ").trim();
  expect(normalizedChineseReadme).toContain("codex plugin marketplace upgrade navi-source --json");
  expect(normalizedChineseReadme).toMatch(/当前任务.*原有 Navi 版本/);
  expect(normalizedChineseReadme).toMatch(/新建一个 Codex 任务.*更新后的版本/);
  expect(normalizedChineseReadme).toMatch(/不需要\s*重新运行 `navi init`/);
});
```

- [ ] **Step 2: Run the focused RED check**

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts
```

Expected: FAIL because the guide and update sections are absent.

- [ ] **Step 3: Create the canonical user guide**

Create `docs/navi/update.md` with:

````markdown
# Updating Navi

Navi updates are explicit in the currently inspected Stock Codex App. The
accepted host evidence does not support automatic same-task activation.

## Git-Backed `navi-source`

Finish the current bounded delivery group first. Verify that the configured
source is the Git-backed `navi-source` marketplace and that the installed
plugin is `navi@navi-source`. After direct approval, run:

```bash
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

The first command updates global Codex marketplace/plugin state. The second is
read-only verification. Navi does not run either mutation silently.

The current task may continue using its existing Navi version. Start a new
Codex task after successful verification to use the updated version. This is
the narrowest activation boundary proved for the inspected Stock App.

## Local-Source Marketplace

`codex plugin marketplace upgrade` does not update the source checkout of a
local-source marketplace. Update and verify the trusted checkout through the
source workflow you selected. Navi does not guess a branch, tag, `git pull`,
dependency command, or unpublished release. Start a new Codex task only after
the local source and package verification are complete.

## Public Plugin Directory

Navi is not available in the Public Plugin Directory now, so no Directory
update path is current.

## Existing Projects

A plugin update does not require `navi init`, does not rewrite
`.navi/project-map.md`, and does not rewrite the Navi `AGENTS.md` managed block.
The new task reads the existing project guidance.

## Failure

If update or verification fails, keep the current task and prior verified
version. Do not immediately retry, remove and re-add the marketplace or plugin,
delete cache state, edit Codex configuration, or guess a different source ref.
Use the exact command result to decide the smallest repair.

## Current Capability Boundary

For Stock App 26.715.52143 build 5591 with Codex CLI 0.144.5, forced Skill
discovery is present, but the connected existing-task structured Skill-input
path is absent. Startup scheduling and cache-readiness ordering remain unknown.
A later accepted inspection may supersede this version-scoped result.
````

- [ ] **Step 4: Add concise English README guidance**

Add this block after `## Distribution feasibility on current main` in
`README.md`:

````markdown
## Updating Navi

For a verified Git-backed `navi-source` installation, finish the current
bounded delivery group and obtain direct approval before running:

```bash
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

The current task may continue using its existing Navi version. After successful
verification, start a new Codex task to use the updated version. A local-source
marketplace upgrade does not update the source checkout. Navi is not available
in the Public Plugin Directory now. A plugin update does not require `navi init`
or rewrite project-local Navi guidance. See the
[update guide](docs/navi/update.md) for channel and failure boundaries.
````

Add the same block after `### Distribution feasibility candidate` in
`plugins/navi/README.md`, but use this final link:

```markdown
[update guide](../../docs/navi/update.md)
```

- [ ] **Step 5: Add equivalent Chinese guidance**

Add this block after `## 当前 main 的 Distribution feasibility` in
`README.zh-CN.md`:

````markdown
## 更新 Navi

对于已验证的 Git-backed `navi-source` 安装，请先结束当前限界 delivery
group，并在直接批准后运行：

```bash
codex plugin marketplace upgrade navi-source --json
codex plugin list --marketplace navi-source --available --json
```

当前任务可以继续使用原有 Navi 版本。验证更新成功后，新建一个 Codex
任务来使用更新后的版本。local-source marketplace 的 upgrade 不会更新
source checkout。Navi 目前未进入 Public Plugin Directory。插件更新不需要
重新运行 `navi init`，也不会重写 Project Map 或 managed trigger。完整边界见
[更新指南](docs/navi/update.md)。
````

- [ ] **Step 6: Run Task 3 coverage**

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts
```

Expected: PASS.

- [ ] **Step 7: Review Task 3 and commit**

Require a fresh bilingual/capability-truthfulness review. Confirm no automatic
update, same-task restart, release, or Directory availability claim.

```bash
git diff --check
git add docs/navi/update.md README.md README.zh-CN.md plugins/navi/README.md tests/skills/navi-capability-truthfulness.test.ts
git commit -m "docs: explain navi manual updates"
```

---

### Task 4: Record The Accepted Host Boundary As Current Authority

**Files:**
- Modify: `docs/navi/calibration-log.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: accepted inspection and validation identities.
- Produces: version-scoped current authority without changing Product Complete
  or Release status.

- [ ] **Step 1: Add failing current-authority tests**

Add to `tests/repository/current-surface.test.ts`:

```ts
it("records the accepted Native Absent update boundary and manual fallback", async () => {
  const [history, roadmap, debt, calibration] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
  ]);
  const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
  const normalizedRoadmap = roadmap.replace(/\s+/gu, " ").trim();

  expect(active).toContain(
    "`docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-21-navi-stock-app-update-capability-inspection.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-21-navi-manual-update-fallback.md`",
  );
  expect(calibration).toContain("navi-stock-update-validation-result-20260721-01");
  expect(calibration).toMatch(/C1[^\n]*unknown[\s\S]*C2[^\n]*unknown[\s\S]*C3[^\n]*present[\s\S]*C4[^\n]*absent/i);
  expect(normalizedRoadmap).toMatch(/Native Absent.*manual update fallback/i);
  expect(normalizedRoadmap).toMatch(/Update Host.*deferred/i);
  expect(debt).toMatch(/existing-task structured Skill input[\s\S]*new Codex task/i);
  expect(debt).toMatch(/startup scheduling[\s\S]*cache-readiness ordering[\s\S]*unknown/i);
  expect(roadmap).not.toMatch(/Product Complete is closed/i);
});
```

- [ ] **Step 2: Run the focused RED check**

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because the accepted result is not indexed yet.

- [ ] **Step 3: Record the accepted calibration result**

Add this top entry to `docs/navi/calibration-log.md`:

```markdown
## 2026-07-21 - Stock App Update Capability Is Native Absent

Mode: read-only Stock App capability inspection and independent validation

Status: independently accepted `Native Absent`; manual update fallback selected

Evidence:

- inspection event: `navi-stock-update-inspection-result-20260721-01`;
- validation result: `navi-stock-update-validation-result-20260721-01`;
- reviewed snapshot: `dcd869581e827cd0ebd9d91bee9661abc62c6f7e`;
- inspected host: Stock App `26.715.52143` build `5591`, Codex CLI `0.144.5`;
- C1 scheduling: `unknown`;
- C2 upgrade and cache-readiness ordering: `unknown`;
- C3 forced discovery: `present`;
- C4 existing-task structured Skill input: `absent`; and
- `on_demand_chain: incomplete`.

Independent Level 2 validation accepted the classification and confirmed that
protected Stock App, Codex, repository, and private evidence boundaries stayed
unchanged. The supported current path is an explicit official manual update
for a verified Git-backed `navi-source`, followed by a genuinely new Codex task
for updated-version activation. This version-scoped result does not authorize
automatic update claims, Update Host, release, or publication. C1 and C2 remain
unknown.
```

- [ ] **Step 4: Update active authority and roadmap**

In `docs/navi/design-history.md`:

- replace the stale statement that Same-Thread Explicit Skill Reload is the
  next investigation with the accepted FULL-SAME-THREAD and Native Absent
  sequence;
- add these exact entries to `## Active`:

```markdown
- `docs/superpowers/specs/2026-07-21-navi-explicit-update-checkpoint-design.md`
- `docs/superpowers/plans/2026-07-21-navi-stock-app-update-capability-inspection.md`
- `docs/superpowers/plans/2026-07-21-navi-manual-update-fallback.md`
```

- keep Product Complete, Distribution Release, Runtime, and publication open.

In `docs/navi/roadmap.md`:

- add this bounded status paragraph without replacing the existing Product
  Complete gate:

```markdown
The accepted Stock App capability result is `Native Absent`. Manual Update
Fallback V1 is the supported current update path: a directly approved official
Git-backed marketplace upgrade, verification, and a new Codex task for the
updated version. Startup scheduling and cache-readiness ordering remain
unknown. Same-task automatic activation is unavailable on the inspected host.
Update Host remains deferred until natural user evidence shows that the manual
and new-task continuity cost is materially unacceptable.
```

- keep the existing Distribution and Product Complete statuses unchanged;
- keep C1/C2 unknown and same-task automatic activation unavailable;
- defer Update Host pending evidence that the manual/new-task cost is
  materially unacceptable; and
- do not replace or close the remaining joint Product Complete gate.

- [ ] **Step 5: Record bounded product debt**

Add this item to `docs/navi/product-debt.md` before `## Suggested Order`:

```markdown
### 12. Manual Update Continuity Debt

The accepted version-scoped `Native Absent` result proves that the inspected
Stock App has no connected existing-task structured Skill input from forced
discovery. Startup scheduling and cache-readiness ordering remain unknown. A
genuinely new Codex task is therefore the narrowest proved boundary for using
the updated version after a manual official update.

This fallback has a one-main-task continuity cost. Reinspect after a material
Stock App update. Reconsider Update Host only if natural user evidence shows
that this cost is materially unacceptable; feature attractiveness alone is not
sufficient product evidence.
```

- [ ] **Step 6: Run Task 4 and full bounded coverage**

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
```

Expected: all focused files pass; typecheck passes; plugin verification passes
all skill tests, manifest validation, and source/package drift checks.

- [ ] **Step 7: Review Task 4 and commit**

Require a fresh read-only current-authority review before commit.

```bash
git diff --check
git add docs/navi/calibration-log.md docs/navi/design-history.md docs/navi/roadmap.md docs/navi/product-debt.md tests/repository/current-surface.test.ts
git commit -m "docs: activate navi manual update fallback"
```

## Final Bounded Verification

Run exactly:

```bash
npm test -- tests/skills/navi-update-checkpoint.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/update-checkpoint-v1.md plugins/navi/skills/navi/references/update-checkpoint-v1.md
git diff --check HEAD~4..HEAD
test "$(git rev-list --count HEAD~4..HEAD)" -eq 4
git diff --exit-code HEAD~4..HEAD -- package.json package-lock.json plugins/navi/VERSION.md plugins/navi/.codex-plugin/plugin.json .agents/plugins src scripts archive work
git status --short
```

Expected:

- focused tests, typecheck, and plugin-package verification pass;
- both canonical/package comparisons are silent;
- exactly four task commits exist over the supplied baseline;
- the baseline-to-HEAD changed path set is exactly these 16 paths:

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/update-checkpoint-v1.md
README.md
README.zh-CN.md
docs/navi/calibration-log.md
docs/navi/design-history.md
docs/navi/product-debt.md
docs/navi/roadmap.md
docs/navi/update.md
plugins/navi/README.md
plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/update-checkpoint-v1.md
tests/repository/current-surface.test.ts
tests/skills/navi-capability-truthfulness.test.ts
tests/skills/navi-skill.test.ts
tests/skills/navi-update-checkpoint.test.ts
```

- forbidden-path diff is empty;
- package and lock metadata are unchanged;
- no command or prose claims automatic scheduling, same-task reload, a proved
  C1/C2 absence, active Public Directory availability, release, or publication;
  and
- worktree is clean except the untouched pre-existing `work/` entry.

## Whole-Candidate Review And Validation

After the fourth commit:

1. Run one fresh read-only whole-candidate review over the complete four-commit
   diff, approved design, accepted inspection/validation events, and this plan.
2. Stop at `review-ready` only when no Critical or Important finding remains.
3. Deliver one exact-snapshot `NAVI_LANE_HANDOFF_EVENT V1` directly to the
   Source Main Task.
4. The Source Main Task creates one fresh read-only Level 3 Validation Task.
5. Reuse that validator for at most two in-scope remediation rounds.
6. Validation acceptance returns to the Source Main Task for explicit
   integration; it does not authorize merge, push, release, publication, a
   real update command, or retained-evidence deletion.
