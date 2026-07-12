# Navi Bootstrap Remediation And ID Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the completed source-alpha bootstrap branch safe to merge by migrating active product identifiers to Navi, adding a stable CLI wrapper, fixing doctor root discovery, replacing unsafe global writes with a recoverable transaction, and documenting a complete source installation and legacy migration path.

**Architecture:** Preserve the worktree's CLI dispatcher and pure managed-block planning, but separate plugin discovery, canonical CODEX_HOME resolution, transaction state, and doctor rendering into testable interfaces. New users install `navi@navi-source`; legacy `along-working-thread` is detected only for explicit migration. All mutation tests operate on temporary roots and no task writes real global Codex state.

**Tech Stack:** TypeScript, Node.js ESM and `fs/promises`, `tsx/esm/api`, Vitest, JSON Codex marketplace/plugin manifests, Markdown documentation.

**Post-review revision (2026-07-13):** Tasks 1-10 record the completed initial remediation. Merge review found blocking transaction, path, identity, migration-copy, and naming defects. Resume this existing worktree at Task 11; do not rerun or rewrite the historical Task 1-10 commits.

## Global Constraints

- Execute this plan in the existing bootstrap worktree `/Users/james/.codex/worktrees/656b/Navi`, based on completed commit `2eda54e`.
- This is Implementation mode, not Release mode.
- Do not merge, push, tag, publish, bump a version, create a GitHub Release, or enter npm/public marketplace work from the worktree.
- Do not modify real `$CODEX_HOME`, Codex plugin configuration/cache, npm global links, `engineering_loop`, or `sub_ag_ski`.
- Do not modify or rebrand `src/web`, historical Along runtime/server source, Working Thread MCP behavior, alpha.14 state work, or historical specs/releases.
- New active product identifiers are exactly: CLI `navi`, plugin `navi`, skill `navi`, plugin source `plugins/navi`, repo skill `.agents/skills/navi`, marketplace `navi-source`, selector `navi@navi-source`.
- Do not ship two active equivalent skills. `along-working-thread` is detection/migration input, not a second packaged runtime.
- `navi setup`, removal, and `navi init` remain dry-run by default. Writes require `--write` and all existing approval boundaries.
- A conflict or unsafe prerequisite returns nonzero and never prints an `Apply with: ... --write` instruction.
- Global setup uses canonical CODEX_HOME and the approved cooperative same-user concurrency model. It removes known deletion windows, uses exact-byte checks and no-replace publication, and never knowingly overwrites or deletes detected third-party content. It does not claim adversarial same-user atomicity.
- `navi doctor` is read-only.
- Tests use temporary roots and injected command results. Direct probes use temporary cwd and temporary CODEX_HOME only.
- Run targeted tests, plugin verification, typecheck, and `git diff --check`. Do not run the full test suite or production build by default.
- Each task ends in a focused commit. Stop after review-ready verification and report commit IDs; do not merge or push.
- The user's approval of this bounded implementation plan authorizes every local task commit explicitly listed below. Do not request separate approval for those commits.
- Stop before an unplanned commit, unknown or out-of-scope staged content, history rewriting, merge, push, tag, release, cross-project change, scope expansion, mode escalation, or known-risk acceptance.
- A user-authored project rule outside a Navi managed block remains authoritative and is never rewritten by this plan.
- The worktree currently contains uncommitted Task 11 experiments in `src/cli/navi-transaction.ts`, `src/cli/navi-global.ts`, `tests/cli/navi-transaction.test.ts`, and `tests/cli/navi-global.test.ts`. Inspect and preserve useful evidence/tests. Do not reset, discard, or blindly overwrite these changes; replace trial code only where the approved transaction-directory design requires it.

---

## File Structure

Create:

- `.agents/plugins/marketplace.json` - repo-local `navi-source` marketplace catalog.
- `src/cli/navi-bin.mjs` - stable JavaScript executable wrapper using `tsx/esm/api`.
- `src/cli/navi-installation.ts` - parses current/legacy rows from `codex plugin list` and exposes installation state without filesystem assumptions.
- `src/cli/navi-codex-home.ts` - resolves canonical CODEX_HOME and confines managed artifact paths.
- `src/cli/navi-transaction.ts` - transaction planning, apply, recovery, lock, hashes, fsync, and artifact ownership.
- `tests/cli/navi-installation.test.ts` - current, legacy, dual, missing, and uninspectable plugin fixtures.
- `tests/cli/navi-transaction.test.ts` - interruption, recovery, conflict, concurrency, symlink, and cleanup fixtures.

Rename:

- `.agents/skills/along-working-thread` -> `.agents/skills/navi`
- `plugins/along-working-thread` -> `plugins/navi`
- `plugins/navi/skills/along-working-thread` -> `plugins/navi/skills/navi`
- `tests/skills/along-working-thread-skill.test.ts` -> `tests/skills/navi-skill.test.ts`

Modify:

- `package.json` - expose only `navi -> src/cli/navi-bin.mjs`.
- `src/cli/navi.ts` - remain an importable dispatcher; remove raw-TS bin responsibility.
- `src/cli/navi-global.ts` - retain managed-block planning and delegate installation, canonical-root, and transaction behavior.
- `src/cli/navi-doctor.ts` - consume explicit bin/plugin/project roots and transaction status.
- `src/cli/navi-init.ts` - recognize exact old generated block and render current Navi-only block.
- `scripts/verify-plugin-package.mjs` - validate Navi paths, names, synchronization, and marketplace entry.
- `tests/cli/navi-command.test.ts` - wrapper/direct execution coverage.
- `tests/cli/navi-global.test.ts` - setup orchestration, conflict output, and exit behavior.
- `tests/cli/navi-doctor.test.ts` - corrected path model and legacy diagnostics.
- `tests/cli/navi-init.test.ts` - exact legacy trigger upgrade and edited-block refusal.
- `tests/mcp/working-thread-package.test.ts` - package bin contract only; do not alter MCP behavior.
- `README.md`, `README.zh-CN.md`, `plugins/navi/README.md` - install, migrate, remove, and product-boundary documentation.
- `docs/along/project-maps/navi-project-init.md`, `docs/along/navi-product-debt.md` - current implementation status without rebranding Along history.

Do not modify:

- `src/web/**`
- `src/mcp/**`
- `src/server/**`
- historical `docs/superpowers/specs/**` or `docs/superpowers/plans/**` except this approved remediation pair
- release notes, changelog, tags, or version fields

---

### Task 1: Migrate Active Plugin And Skill Identifiers

**Files:**
- Create: `.agents/plugins/marketplace.json`
- Rename: `.agents/skills/along-working-thread` -> `.agents/skills/navi`
- Rename: `plugins/along-working-thread` -> `plugins/navi`
- Rename: `plugins/navi/skills/along-working-thread` -> `plugins/navi/skills/navi`
- Rename: `tests/skills/along-working-thread-skill.test.ts` -> `tests/skills/navi-skill.test.ts`
- Modify: `plugins/navi/.codex-plugin/plugin.json`
- Modify: `scripts/verify-plugin-package.mjs`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces plugin manifest name `navi`, skill frontmatter name `navi`, marketplace `navi-source`, and verifier constants for only the current Navi package.
- Preserves identical canonical/package skill content after path migration.

- [ ] **Step 1: Write failing package identity assertions**

Rename the skill test, then change its path constants and identity assertions to require:

```ts
const canonicalSkillRoot = path.join(repoRoot, ".agents", "skills", "navi");
const pluginRoot = path.join(repoRoot, "plugins", "navi");
const packagedSkillRoot = path.join(pluginRoot, "skills", "navi");

expect(canonicalFrontmatter.name).toBe("navi");
expect(packagedFrontmatter.name).toBe("navi");
expect(pluginManifest.name).toBe("navi");
```

Add a marketplace assertion that parses `.agents/plugins/marketplace.json` and requires exactly one entry with name `navi`, local path `./plugins/navi`, installation `AVAILABLE`, authentication `ON_INSTALL`, and category `Productivity`.

- [ ] **Step 2: Run the identity tests and verify red state**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: FAIL because Navi paths/catalog do not exist and the manifest/skill IDs remain legacy.

- [ ] **Step 3: Rename active source directories and identifiers**

Use Git-aware renames. Change both skill frontmatters to:

```yaml
---
name: navi
description: Use when any active Codex project needs Navi supervision for non-expert progress, next-step, stop, wait, approval, coordination, or vision-distance confusion.
---
```

Change `plugins/navi/.codex-plugin/plugin.json` to use `"name": "navi"`. Remove wording that calls Navi merely Along's current V1 surface; keep at most one concise relationship sentence in long-form documentation.

- [ ] **Step 4: Add the canonical source marketplace catalog**

Create `.agents/plugins/marketplace.json` with exactly the JSON object approved in the design spec: top-level name `navi-source`, display name `Navi Source`, and one `navi` local source entry at `./plugins/navi` with required policy and category fields.

- [ ] **Step 5: Update the package verifier**

Replace legacy path/name constants with Navi constants. Add structured JSON checks for the marketplace and manifest; do not validate them with text matching. Keep drift comparison between `.agents/skills/navi` and `plugins/navi/skills/navi`.

- [ ] **Step 6: Run focused identity verification**

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
```

Expected: PASS. `rg -n "along-working-thread" .agents/skills/navi plugins/navi .agents/plugins/marketplace.json scripts/verify-plugin-package.mjs tests/skills/navi-skill.test.ts` may find only explicit legacy-migration wording, not current identifiers or paths.

- [ ] **Step 7: Commit Task 1**

```bash
git add -A .agents/skills .agents/plugins plugins scripts/verify-plugin-package.mjs tests/skills
git commit -m "refactor: migrate active navi plugin identifiers"
```

---

### Task 2: Add Stable JavaScript CLI Wrapper And Remove Along Bin

**Files:**
- Create: `src/cli/navi-bin.mjs`
- Modify: `src/cli/navi.ts`
- Modify: `package.json`
- Modify: `tests/cli/navi-command.test.ts`
- Modify: `tests/mcp/working-thread-package.test.ts`

**Interfaces:**
- Consumes `runNaviCli(args: string[]): Promise<number>` from `src/cli/navi.ts`.
- Produces one package bin: `navi -> src/cli/navi-bin.mjs`.

- [ ] **Step 1: Write failing bin and direct-execution tests**

Require:

```ts
expect(packageJson.bin).toEqual({ navi: "src/cli/navi-bin.mjs" });
expect(packageJson.bin).not.toHaveProperty("along");
```

Spawn `node <absolute-wrapper> init --target <temp-project>`, `setup`, and `doctor` with `cwd` set to an unrelated temp directory. Give setup/doctor a temporary `CODEX_HOME` and injected/fixture plugin-list path established by later tests; for this task the wrapper smoke test may assert that dispatch reaches each command rather than a module-resolution failure.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
```

Expected: FAIL because the wrapper does not exist and `along` remains a package bin.

- [ ] **Step 3: Add the wrapper**

Create `src/cli/navi-bin.mjs`:

```js
#!/usr/bin/env node
import { tsImport } from "tsx/esm/api";

const { runNaviCli } = await tsImport("./navi.ts", import.meta.url);
process.exitCode = await runNaviCli(process.argv.slice(2));
```

Keep `src/cli/navi.ts` importable and remove its raw TypeScript direct-execution block. It must use explicit `.ts` imports if required by `tsImport`, or otherwise use one resolution convention proven by all three direct probes.

- [ ] **Step 4: Update package wiring**

Set:

```json
"bin": {
  "navi": "src/cli/navi-bin.mjs"
}
```

Keep `npm run navi` as a developer command if useful, but do not expose `along` globally. Do not delete historical Along source in this task.

- [ ] **Step 5: Run focused tests**

```bash
npm test -- tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
```

Expected: PASS; no probe reports `ERR_MODULE_NOT_FOUND` or starts the Along server.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/cli/navi-bin.mjs src/cli/navi.ts package.json tests/cli/navi-command.test.ts tests/mcp/working-thread-package.test.ts
git commit -m "fix: add stable navi cli wrapper"
```

---

### Task 3: Model Current And Legacy Plugin Installation Explicitly

**Files:**
- Create: `src/cli/navi-installation.ts`
- Create: `tests/cli/navi-installation.test.ts`
- Modify: `src/cli/navi-global.ts`

**Interfaces:**
- Produces:
  - `PluginListRow { selector: string; pluginName: string; marketplaceName?: string; installed: boolean; enabled: boolean; version?: string; sourcePath?: string; raw: string }`
  - `NaviInstallationKind = "current" | "legacy" | "conflict" | "missing" | "uninspectable"`
  - `NaviInstallationStatus { kind: NaviInstallationKind; current?: PluginListRow; legacy?: PluginListRow; raw: string; diagnostic?: string }`
  - `inspectNaviInstallation(runCommand?: RunCommand): Promise<NaviInstallationStatus>`

- [ ] **Step 1: Write table-driven parser tests**

Use realistic `codex plugin list` fixtures for:

```text
navi@navi-source              Installed, Enabled  0.1.0  /source/plugins/navi
along-working-thread@personal Installed, Enabled  0.1.0  /legacy/plugin
```

Cover current only, legacy only, both, neither, disabled current, current without source path, and nonzero/unparseable command output. Assert that legacy marketplace name is parsed from the actual selector and never hard-coded.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-installation.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement parsing and inspection**

Move `RunCommand` and the default `execFile` adapter from `navi-global.ts` into `navi-installation.ts`. Parse rows by selector first, then status/version/source columns. Match only exact plugin names `navi` and `along-working-thread`; do not use substring matching.

Return `conflict` whenever both are installed, even if one is disabled. Return `legacy` only when current is absent. Preserve raw output for diagnostics but do not treat it as a filesystem path until a parsed `sourcePath` exists.

- [ ] **Step 4: Integrate setup preflight**

Replace `inspectInstalledNaviPlugin` with `inspectNaviInstallation`. Setup write is allowed only for `kind === "current"` with current installed and enabled. Legacy, conflict, missing, disabled, or uninspectable states produce nonzero refusal and explicit repair text.

- [ ] **Step 5: Run focused tests**

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-global.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add src/cli/navi-installation.ts src/cli/navi-global.ts tests/cli/navi-installation.test.ts tests/cli/navi-global.test.ts
git commit -m "fix: distinguish navi and legacy plugin installs"
```

---

### Task 4: Canonicalize CODEX_HOME And Confine Managed Artifacts

**Files:**
- Create: `src/cli/navi-codex-home.ts`
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Produces:
  - `CanonicalCodexHome { requestedPath: string; canonicalPath: string }`
  - `resolveCanonicalCodexHome(requestedPath: string): Promise<CanonicalCodexHome>`
  - `confinedCodexPath(root: string, basename: string): string`
  - `assertUnlinkedArtifact(path: string): Promise<"missing" | "file">`

- [ ] **Step 1: Add failing trust-boundary tests**

Cover an existing physical directory, a user-facing symlink to that directory, missing root, non-directory root, AGENTS symlink, transaction-artifact symlink, and `../` confinement attempts. Assert that accepted symlink routes return the physical canonical path and all later plan paths use it.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: FAIL on canonical-path expectations.

- [ ] **Step 3: Implement canonical root resolution**

Use `path.resolve`, `fs.stat`, and `fs.realpath`. Require a directory. `confinedCodexPath` accepts a basename, resolves it beneath the canonical root, and rejects any `path.relative(root, candidate)` that is empty where a file is expected, starts with `..`, or is absolute.

Use `lstat` for `AGENTS.md` and every transaction artifact. A missing path is allowed where the operation expects creation; a symbolic link or non-regular existing artifact is rejected.

- [ ] **Step 4: Integrate setup planning**

Add `requestedCodexHome` and canonical `codexHome` to `GlobalSetupPlan`. After canonicalization, never perform a filesystem operation through the requested alias. Render both paths only when they differ.

- [ ] **Step 5: Run focused tests**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/cli/navi-codex-home.ts src/cli/navi-global.ts tests/cli/navi-global.test.ts
git commit -m "fix: canonicalize navi global setup root"
```

---

### Task 5: Replace Global Writes With Recoverable Transactions

> Historical execution note: this task produced the first transaction implementation. Its flat-artifact and strong-atomicity assumptions are superseded by Task 11. Do not rerun Task 5; retain its commit as history and remediate forward.

**Files:**
- Create: `src/cli/navi-transaction.ts`
- Create: `tests/cli/navi-transaction.test.ts`
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Produces:
  - `TransactionOperation = "create" | "modify" | "remove"`
  - `TransactionStage = "prepared" | "backed-up" | "published"`
  - `NaviTransactionRecord { id: string; operation: TransactionOperation; target: "AGENTS.md"; stageFile?: string; backupFile?: string; expectedHash?: string; desiredHash?: string; stage: TransactionStage; createdAt: string }`
  - `inspectTransaction(root: string): Promise<TransactionInspection>`
  - `applyAgentsTransaction(input: ApplyTransactionInput): Promise<void>`
  - `recoverTransaction(root: string, inspection: RecoverableInspection): Promise<void>`

- [ ] **Step 1: Write failing transaction state tests**

Use a temporary canonical root and deterministic IDs. Cover:

- create publishes only when target is absent;
- modify and remove reject changed expected bytes;
- target appearance between planning and publish is not overwritten;
- modify interruption after backup is recoverable;
- desired target plus expected old backup cleans a committed transaction;
- missing target plus expected old backup restores old content;
- unexpected target or backup content preserves both and reports conflict;
- live/existing lock refuses;
- lock without complete manifest evidence conflicts without age deletion;
- stage open collision does not remove a pre-existing stage path;
- cleanup removes only artifacts marked as created by the invocation;
- target, lock, manifest, stage, and backup symlinks are rejected.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-transaction.test.ts
```

Expected: FAIL because the transaction module does not exist.

- [ ] **Step 3: Implement records, hashing, exclusive artifacts, and fsync helpers**

Use SHA-256 over exact bytes. Create lock, manifest, stage, and backup names beneath the canonical root only. Create lock/stage/manifest with `wx`. Track each successfully created artifact in an invocation-owned set before allowing cleanup.

Fsync file handles after writing. Open and sync the canonical root directory after publish/restore/cleanup operations where Node and the platform permit it; report a hard error if durability steps required by the transaction cannot complete.

- [ ] **Step 4: Implement no-overwrite publish and backup flow**

Use `fs.link(stagePath, targetPath)` for no-overwrite publish. For modify/remove, re-read and hash the target immediately before moving it to the unique backup; after move, re-read/hash the backup before publishing or committing removal. Never call a plain rename that replaces an existing desired target.

If any state becomes ambiguous, retain the backup and manifest. Do not silently roll forward over third content.

- [ ] **Step 5: Implement inspection and conservative recovery**

Inspection is read-only and classifies `none`, `live-lock`, `recoverable-restore`, `recoverable-cleanup`, or `conflict`. Recovery accepts only the two approved unambiguous states. It never deletes a lock based only on age.

- [ ] **Step 6: Integrate setup semantics**

Replace unlink/temporary-rename mutation in `applyGlobalSetupPlan` with transaction calls. Dry-run reports transaction state. On `--write`, perform one unambiguous recovery and exit with text instructing the user to rerun the desired setup/remove command; do not recover and mutate in one invocation.

- [ ] **Step 7: Run focused tests**

```bash
npm test -- tests/cli/navi-transaction.test.ts tests/cli/navi-global.test.ts
```

Expected: PASS. Search the setup mutation path and confirm it contains no direct `fs.unlink(agentsPath)` and no replacement rename onto `AGENTS.md`.

- [ ] **Step 8: Commit Task 5**

```bash
git add src/cli/navi-transaction.ts src/cli/navi-global.ts tests/cli/navi-transaction.test.ts tests/cli/navi-global.test.ts
git commit -m "fix: make navi global setup recoverable"
```

---

### Task 6: Correct Conflict Rendering And Exit Codes

**Files:**
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- `renderGlobalSetupPlan(plan)` emits apply guidance only for actionable safe plans.
- `runNaviSetupCli()` returns nonzero for blocked/conflicted states.

- [ ] **Step 1: Add failing CLI-output tests**

Assert that managed-block conflict, plugin missing/disabled, legacy-only, dual install, unsafe root, and ambiguous transaction each:

```ts
expect(code).not.toBe(0);
expect(output).not.toContain("Apply with:");
expect(output).not.toContain("navi setup --write");
```

Also assert that a normal install/remove preview returns `0` and includes the correct apply command.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-global.test.ts
```

Expected: FAIL because conflict preview currently returns `0` and prints apply guidance.

- [ ] **Step 3: Implement explicit blocked rendering**

Make render decisions from structured plan state, not summary-string matching. Render one smallest repair/migration action for blocked states. Only append `Apply with:` when the plan is actionable and safe.

- [ ] **Step 4: Run focused tests and commit**

```bash
npm test -- tests/cli/navi-global.test.ts
git add src/cli/navi-global.ts tests/cli/navi-global.test.ts
git commit -m "fix: refuse unsafe navi setup previews"
```

Expected: PASS and commit succeeds.

---

### Task 7: Rebuild Doctor Around Explicit Roots And Transaction State

**Files:**
- Modify: `src/cli/navi-doctor.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Modify: `src/cli/navi.ts` only if dependency wiring is required

**Interfaces:**
- Consumes `NaviInstallationStatus`, canonical CODEX_HOME, and transaction inspection.
- `NaviDoctorOptions` contains explicit `cliRoot`, `projectDir`, and `codexHome`; plugin source comes only from installation status.

- [ ] **Step 1: Add failing path and state tests**

Cover:

- unrelated process cwd with explicit wrapper-derived CLI root;
- current plugin source path distinct from CLI root and project cwd;
- current plugin without source path produces warning, not fake drift failure;
- legacy-only status prints the parsed legacy selector and migration order;
- current plus legacy is a failure;
- canonical CODEX_HOME alias reports requested/canonical locations;
- recoverable transaction is a failure with `navi setup --write` recovery guidance;
- ambiguous/live transaction is a failure without destructive guidance;
- global `AGENTS.md` symlink is a failure;
- doctor performs no writes.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-doctor.test.ts
```

Expected: FAIL because doctor still derives `plugins/along-working-thread` from cwd.

- [ ] **Step 3: Remove cwd-based package construction**

Delete the `process.cwd()/plugins/...` fallback. Derive CLI root from an injected value supplied by the wrapper/dispatcher module URL. Use cwd only for `projectDir`. Use current plugin `sourcePath` for manifest and source inspection.

When source path or cache evidence is unavailable, emit a warning that inspection is incomplete. Do not compare invented paths. Update cache discovery to follow actual installation metadata instead of hard-coding `personal/along-working-thread/0.1.0`.

- [ ] **Step 4: Add legacy and transaction checks**

Render current, legacy, conflict, missing, and uninspectable installation states truthfully. Include a transaction check in the report and make recoverable/ambiguous/live transaction states nonzero because setup is not currently safe.

- [ ] **Step 5: Run focused tests and direct doctor probe**

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-command.test.ts
```

Then spawn the absolute `navi-bin.mjs doctor` from a temporary unrelated cwd with temporary CODEX_HOME and fixture command discovery. Expected: no `ERR_MODULE_NOT_FOUND`, no cwd-derived package path, and no writes.

- [ ] **Step 6: Commit Task 7**

```bash
git add src/cli/navi-doctor.ts src/cli/navi.ts tests/cli/navi-doctor.test.ts tests/cli/navi-command.test.ts
git commit -m "fix: inspect navi doctor from authoritative roots"
```

---

### Task 8: Upgrade Exact Legacy Project Triggers

**Files:**
- Modify: `src/cli/navi-init.ts`
- Modify: `tests/cli/navi-init.test.ts`
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/working-thread-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/working-thread-v1.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- `renderAgentsBlock()` renders current Navi-only guidance.
- A `KNOWN_NAVI_AGENTS_BLOCKS` collection contains the exact previously deployed alpha.13 block plus the current block.
- Planning adds `conflict` only if the existing public action type is safely extended; otherwise it throws a typed planning error that the CLI renders nonzero without apply guidance.
- The generated block and canonical/package skill contract use scoped commit authorization instead of treating every local commit as an independent approval gate.

- [ ] **Step 1: Add exact old-block upgrade tests**

Copy the deployed pre-migration generated block into a test fixture as an exact literal. Assert dry-run reports an update, preserves bytes before/after the markers, does not write, and `--write` replaces only the managed block with the Navi-only version.

Add a one-character edited legacy block fixture. Assert nonzero refusal, unchanged bytes, and no `Apply with:` line. Add duplicate/incomplete marker fixtures with the same refusal.

Add static contract assertions for the generated block and both skill copies:

```ts
expect(contract).toContain("approved bounded implementation or worktree plan");
expect(contract).toContain("explicitly planned local task commits");
expect(contract).toContain("Do not request separate approval for each such commit");
expect(contract).toContain("unknown staged content");
expect(contract).toContain("history rewriting");
expect(contract).toContain("merge, push, tag, release");
expect(contract).not.toContain("Stop for user approval before file writes outside the approved mode, commits, pushes");
```

Assert separately that the contract preserves explicit user control: an unplanned commit, a user request not to commit, project-owned instructions outside the Navi marker, merge, push, tag, release, history rewriting, cross-project changes, scope expansion, and known-risk acceptance remain approval boundaries.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/cli/navi-init.test.ts
```

Expected: FAIL because current init does not model a real previous generated block or conflict output.

- [ ] **Step 3: Implement exact recognized upgrade**

Extract the managed region by marker offsets. Upgrade only when it equals the exact old generated block. Keep all outside bytes unchanged. Render the current block with only Navi product/skill identifiers and the scoped commit authorization contract.

Replace the absolute commit-approval sentence in the canonical skill and reference with the same semantics. Keep canonical and packaged copies byte-identical. Approval from a bounded implementation plan propagates to its worktree parent and bounded subagents for listed local task commits; those tasks report commits without stopping. Do not weaken merge, push, tag, release, history-rewrite, cross-project, scope, risk, or project-owned instruction gates.

Do not scan arbitrary project files, replace ordinary Along text, modify `sub_ag_ski`, or alter Subagent-Driven Development itself.

- [ ] **Step 4: Run focused tests and commit**

```bash
npm test -- tests/cli/navi-init.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
git add src/cli/navi-init.ts tests/cli/navi-init.test.ts .agents/skills/navi plugins/navi/skills/navi tests/skills/navi-skill.test.ts
git commit -m "fix: migrate legacy navi project triggers"
```

Expected: PASS and commit succeeds.

---

### Task 9: Replace Active Installation And Migration Documentation

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/along/project-maps/navi-project-init.md`
- Modify: `docs/along/navi-product-debt.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces one complete new-user source installation path and one explicit legacy migration path.

- [ ] **Step 1: Add failing documentation assertions**

Require active docs to contain:

```text
codex plugin marketplace add "$PWD"
codex plugin add navi@navi-source
npm link
navi doctor
navi setup
navi setup --write
```

Require removal commands and a warning that these operations mutate global Codex/plugin/npm state. Assert that the primary installation section does not contain `codex plugin add along-working-thread` and does not describe Navi merely as Along's current V1 product surface.

- [ ] **Step 2: Verify red state**

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL because installation instructions are incomplete and use legacy framing.

- [ ] **Step 3: Update active documentation**

Document:

- verify source before installation;
- add repo-local marketplace and `navi@navi-source` explicitly;
- link source CLI;
- doctor/setup/init responsibility boundaries;
- legacy-only and dual-install diagnostics;
- user-run migration and removal commands;
- source-alpha limitations;
- Navi independence and concise Along relationship;
- `src/web` and historical Along runtime are not current Navi UI/product surface.

Do not add automatic installation behavior or claim cryptographic source attestation.

- [ ] **Step 4: Run focused docs/package checks and commit**

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
git add README.md README.zh-CN.md plugins/navi/README.md docs/along/project-maps/navi-project-init.md docs/along/navi-product-debt.md tests/skills/navi-skill.test.ts
git commit -m "docs: define navi source install and migration"
```

Expected: tests and verifier PASS; commit succeeds.

---

### Task 10: Run Targeted Verification And Prepare Review Report

**Files:**
- Modify only files already in scope if a targeted verification failure proves a defect in this remediation.

**Interfaces:**
- Produces a clean worktree, commit list, exact verification evidence, and a review-ready summary. Does not merge or push.

- [ ] **Step 1: Run the bounded test set**

```bash
npm test -- tests/cli/navi-command.test.ts tests/cli/navi-installation.test.ts tests/cli/navi-global.test.ts tests/cli/navi-transaction.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/skills/navi-skill.test.ts tests/mcp/working-thread-package.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check 1110f68..HEAD
```

Expected: every command exits `0`. Do not replace this with full `npm test` or `npm run build`.

- [ ] **Step 2: Run three direct CLI probes from an unrelated cwd**

Create disposable target and CODEX_HOME directories beneath `/tmp`. Change to `/private/tmp` so every command runs outside the repository:

```bash
probe_root="$(mktemp -d /tmp/navi-bootstrap-probe.XXXXXX)"
mkdir -p "$probe_root/project" "$probe_root/codex-home"
cd /private/tmp
node /Users/james/.codex/worktrees/656b/Navi/src/cli/navi-bin.mjs init --target "$probe_root/project"
CODEX_HOME="$probe_root/codex-home" node /Users/james/.codex/worktrees/656b/Navi/src/cli/navi-bin.mjs setup
CODEX_HOME="$probe_root/codex-home" node /Users/james/.codex/worktrees/656b/Navi/src/cli/navi-bin.mjs doctor
```

The temporary CODEX_HOME isolates Codex configuration and plugin discovery from the user's live installation. Expected: `init` returns `0`; `setup` and `doctor` may return nonzero because the isolated home has no installed plugin, but neither reports a module-resolution failure or performs a write. Remove the probe root after inspecting the output.

- [ ] **Step 3: Audit active naming and forbidden scope**

```bash
rg -n "codex plugin add along-working-thread|plugins/along-working-thread|\.agents/skills/along-working-thread" README.md README.zh-CN.md plugins/navi .agents/skills/navi .agents/plugins/marketplace.json src/cli scripts tests/cli tests/skills/navi-skill.test.ts
git diff --name-only 2eda54e..HEAD
git status --short --branch
```

Expected: legacy strings occur only in explicit detection/migration fixtures or text; no active install path uses them. Changed files remain inside this plan. Worktree is clean after final commit.

- [ ] **Step 4: Commit any verified corrections**

If and only if targeted verification required in-scope corrections:

```bash
git add -u
git commit -m "fix: close navi bootstrap remediation gaps"
```

Otherwise do not create an empty commit.

- [ ] **Step 5: Return the review handoff**

Report:

- base commit and all remediation commit IDs;
- exact commands and pass counts;
- direct-probe outcomes;
- confirmation that no real global state or target project was modified;
- remaining risks or deviations;
- `git status --short --branch`.

Stop for parent-session review. Do not merge, push, tag, publish, or start release work.

---

### Task 11: Rebuild Global Transactions For Cooperative Concurrency

**Files:**
- Modify: `src/cli/navi-transaction.ts`
- Modify: `src/cli/navi-global.ts`
- Modify: `tests/cli/navi-transaction.test.ts`
- Modify: `tests/cli/navi-global.test.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`

**Interfaces:**
- Produces `NaviTransactionManifest { version: 1; id: string; operation: "create" | "modify" | "remove"; target: "AGENTS.md"; stage: "prepared" | "backed-up" | "published"; expectedHash?: string; desiredHash?: string; pid: number; createdAt: string }`.
- Produces `NaviTransactionLock { version: 1; id: string; pid: number }`.
- Produces fixed children `manifest.json`, `stage`, and `backup` beneath `.AGENTS.md.navi-transaction-<id>/`.
- Produces `TransactionCheckpoint = "after-plan-verification" | "after-backup-move" | "before-publish" | "after-publish" | "before-cleanup"`.
- Produces `TransactionDependencies { isProcessAlive?: (pid: number) => Promise<boolean | undefined>; checkpoint?: (name: TransactionCheckpoint, paths: TransactionCheckpointPaths) => Promise<void> }`.
- Keeps public `inspectTransaction`, `applyAgentsTransaction`, and `recoverTransaction` entrypoints with operation-specific recovery.
- Does not introduce native helpers, platform binaries, caller-controlled artifact paths, or adversarial same-user guarantees.

- [ ] **Step 1: Inspect and classify the retained uncommitted attempt**

Run:

```bash
git status --short --branch
git diff -- src/cli/navi-transaction.ts src/cli/navi-global.ts tests/cli/navi-transaction.test.ts tests/cli/navi-global.test.ts
```

Expected: exactly those four files may contain the retained trial. Preserve useful manifest-ownership, recovery-precedence, create/remove recovery, and race fixtures. Identify assertions that still encode flat artifacts or adversarial atomicity; replace only those parts required by the approved transaction-directory design. Do not reset the worktree.

- [ ] **Step 2: Add failing transaction-directory ownership tests**

Add tests that reject these manifest mutations:

```ts
const invalidManifests = [
  { id: "other-than-directory-id" },
  { target: "user-notes.md" },
  { pid: 0 },
  { version: 2 },
  { stageFile: "user-notes.md" },
  { backupFile: "user-notes.md" },
];
```

For every case, create `user-notes.md` containing `KEEP`, inspect and attempt any permitted recovery, then assert:

```ts
expect(inspection.kind).toBe("conflict");
await expect(fs.readFile(path.join(rootPath, "user-notes.md"), "utf8"))
  .resolves.toBe("KEEP");
```

Also reject symlinked transaction directories and mismatched directory/manifest IDs.

- [ ] **Step 3: Run ownership tests and verify red**

```bash
npm test -- tests/cli/navi-transaction.test.ts
```

Expected: FAIL because the retained implementation still uses flat artifacts.

- [ ] **Step 4: Implement the fixed transaction directory and lock**

Create the directory exclusively with mode `0700`. Derive paths in code rather than reading them from manifest:

```ts
const transactionDir = confinedCodexPath(root, `.AGENTS.md.navi-transaction-${id}`);
const manifestPath = path.join(transactionDir, "manifest.json");
const stagePath = path.join(transactionDir, "stage");
const backupPath = path.join(transactionDir, "backup");
```

Require manifest ID to match the directory basename and reject legacy path fields. Write an exclusive JSON lock containing the same ID and `process.pid`.

Add injectable PID liveness. Interpret it conservatively:

```text
matching lock + pid alive       -> active
matching lock + pid absent      -> inspect evidence for recovery
lock/manifest mismatch          -> conflict
pid state cannot be decided     -> conflict
bare or malformed lock          -> conflict
```

Never delete a lock based only on age. Remove a matching confirmed-dead-PID lock only as part of a verified recovery or committed-state cleanup.

- [ ] **Step 5: Add failing operation-specific recovery tests**

Use this table:

```ts
const recoveryCases = [
  ["create", "missing", "prepared", "cleanup"],
  ["create", "desired", "published", "cleanup"],
  ["create", "third-party", "published", "conflict"],
  ["modify", "expected", "prepared", "cleanup"],
  ["modify", "missing", "backed-up", "restore"],
  ["modify", "desired", "published", "cleanup"],
  ["modify", "third-party", "published", "conflict"],
  ["remove", "expected", "prepared", "cleanup"],
  ["remove", "missing", "published", "cleanup"],
  ["remove", "third-party", "published", "conflict"],
] as const;
```

Assert create recovery never requires `backup`; modify restore uses no-replace; completed remove never recreates `AGENTS.md`; malformed hash/schema/lock evidence remains conflict.

- [ ] **Step 6: Implement recovery and orchestration precedence**

Implement the approved matrix. In `applyGlobalSetupPlan`, use this order:

```ts
if (plan.mode === "dry-run") return "applied";
if (
  plan.transaction.kind === "recoverable-restore" ||
  plan.transaction.kind === "recoverable-cleanup"
) {
  await recoverTransaction(plan.codexHome, plan.transaction);
  return "recovered";
}
if (plan.transaction.kind !== "none") {
  throw new Error(plan.transaction.message);
}
if (plan.action.kind === "skip") return "applied";
const blocked = setupBlockReason(plan);
if (blocked) throw new Error(blocked);
```

Dry-run remains read-only and reports the planned recovery. During `--write`, recovery precedes action skip, plugin availability, and new mutation planning. One invocation recovers or applies; it never does both.

- [ ] **Step 7: Add failing deterministic checkpoint tests**

Inject cooperative edits at all five checkpoints. Cover target change before backup move, target appearance before publish, target change after publish, existing target during no-replace restore, and unrelated-file preservation.

Across the relevant scenarios, require assertions equivalent to:

```ts
expect(thirdPartyContent).toBe("concurrent");
expect(inspection.kind).toBe("conflict");
```

When the approved old target was successfully moved before the injected edit, also require the retained `backup` to contain `approved-old-content`. Do not require a backup in a race detected before the move.

Test names must say `cooperative concurrent edit`, not adversarial or absolute atomic safety.

- [ ] **Step 8: Implement cooperative create, modify, and remove**

Create publishes fixed `stage` with a no-replace hard link after target-absence verification.

Modify/remove verify exact approved bytes, rename target into fixed `backup`, and re-hash backup. On mismatch, do not publish. Restore only with no-replace when target remains absent; otherwise preserve target and backup.

Modify publishes fixed `stage` with no-replace and verifies desired bytes. Remove treats expected backup plus target absence as committed removal. Never unlink `AGENTS.md` as a compare-and-delete substitute.

Cleanup removes only the verified transaction directory and matching lock after committed state is rechecked and fsynced. Cleanup failure leaves recoverable evidence and returns failure.

- [ ] **Step 9: Add security-boundary copy and output tests**

Require conflicted output to omit `force`, `delete the lock`, and `Apply with:`. Add the approved cooperative-concurrency statement to troubleshooting/security sections of all three active READMEs, not ordinary successful setup output.

- [ ] **Step 10: Run focused Task 11 verification**

```bash
npm test -- tests/cli/navi-transaction.test.ts tests/cli/navi-global.test.ts tests/cli/navi-doctor.test.ts
npm run typecheck
git diff --check
```

Expected: PASS with no real CODEX_HOME access and no adversarial atomicity claim.

- [ ] **Step 11: Review and commit Task 11**

```bash
git add src/cli/navi-transaction.ts src/cli/navi-global.ts \
  tests/cli/navi-transaction.test.ts tests/cli/navi-global.test.ts \
  tests/cli/navi-doctor.test.ts README.md README.zh-CN.md plugins/navi/README.md
git commit -m "fix: harden navi cooperative setup transactions"
```

---

### Task 12: Require The Exact Navi Installation And Preserve Paths

**Files:**
- Modify: `src/cli/navi-installation.ts`
- Modify: `src/cli/navi.ts`
- Modify: `tests/cli/navi-installation.test.ts`
- Modify: `tests/cli/navi-command.test.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Modify: `tests/cli/navi-global.test.ts`

**Interfaces:**
- Current source-alpha selector is exactly `navi@navi-source`.
- Other Navi selectors, duplicate current selectors, and current-plus-legacy states are non-actionable conflicts.
- Plugin `PATH` parsing preserves the complete remainder after the version column, including spaces.
- CLI root conversion uses `fileURLToPath`.

- [ ] **Step 1: Add failing identity and path tests**

Add fixtures for `navi@other`, duplicate `navi@navi-source` rows, current plus legacy, and:

```text
navi@navi-source  installed, enabled  0.1.0  /Users/james/Codex Project/General Codex Project/Navi/plugins/navi
```

Assert the full path survives parsing. Add an exported CLI-root helper test using `file:///Users/james/Codex%20Project/Navi/src/cli/navi.ts` and expect `/Users/james/Codex Project/Navi`.

- [ ] **Step 2: Run and verify red**

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-command.test.ts
```

Expected: FAIL on alternate selector acceptance, duplicate handling, truncated PATH, and `%20` root.

- [ ] **Step 3: Implement exact identity and path parsing**

Parse selector and status columns first, identify the version token, then retain the remaining PATH column as one string. Match current only when `selector === "navi@navi-source"`. Treat any other installed Navi selector or duplicate current rows as a non-actionable `conflict` with explicit diagnostics.

Use:

```ts
fileURLToPath(new URL("../..", import.meta.url))
```

for CLI root derivation.

- [ ] **Step 4: Verify and commit Task 12**

```bash
npm test -- tests/cli/navi-installation.test.ts tests/cli/navi-command.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-global.test.ts
npm run typecheck
git diff --check
git add src/cli/navi-installation.ts src/cli/navi.ts \
  tests/cli/navi-installation.test.ts tests/cli/navi-command.test.ts \
  tests/cli/navi-doctor.test.ts tests/cli/navi-global.test.ts
git commit -m "fix: preserve authoritative navi installation paths"
```

---

### Task 13: Align Doctor And Migration Guidance

**Files:**
- Modify: `src/cli/navi-doctor.ts`
- Modify: `tests/cli/navi-doctor.test.ts`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Produces one migration sequence: install current, preview exact trigger upgrade, apply approved init, validate target, remove exact legacy selector, rerun doctor/setup.
- Keeps package/cache status as an explicit incomplete warning when `codex plugin list` provides only one PATH. It does not invent a cache path or false drift result.

- [ ] **Step 1: Add failing migration-copy tests**

Assert legacy-only and dual-install reports contain the ordered actions `navi@navi-source`, `navi init`, target validation, exact legacy selector removal, and rerun doctor/setup. Assert all three active READMEs describe the same sequence.

Assert a single inspectable plugin PATH produces an incomplete warning containing `no separate cache evidence`; it must not report `pass` or `drift`.

- [ ] **Step 2: Run and verify red**

```bash
npm test -- tests/cli/navi-doctor.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because doctor skips trigger validation in its dual-install repair text and the docs do not share one exact sequence.

- [ ] **Step 3: Implement truthful copy and verify**

Update doctor repair text and the three docs. Do not add automatic plugin removal, automatic init, cache guessing, or new doctor filesystem discovery.

```bash
npm test -- tests/cli/navi-doctor.test.ts tests/skills/navi-skill.test.ts
npm run verify:plugin-package
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit Task 13**

```bash
git add src/cli/navi-doctor.ts tests/cli/navi-doctor.test.ts \
  README.md README.zh-CN.md plugins/navi/README.md tests/skills/navi-skill.test.ts
git commit -m "docs: align navi source migration guidance"
```

---

### Task 14: Finish The Navi-First Package Narrative

**Files:**
- Modify: `plugins/navi/VERSION.md`
- Modify: `plugins/navi/README.md`
- Modify: `.agents/skills/navi/references/working-thread-v1.md`
- Modify: `plugins/navi/skills/navi/references/working-thread-v1.md`
- Modify: `docs/along/navi-product-debt.md`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Latest GitHub source release label is `0.1.0-alpha.3`.
- Navi is an independent product; Along is origin, parent/lab, or possible future-family context.
- `along-working-thread` remains only in explicit legacy detection/migration or clearly historical samples.

- [ ] **Step 1: Replace stale assertions with failing Navi-first assertions**

Require:

```ts
expect(version).toContain("# Navi 0.1.0");
expect(version).toContain("0.1.0-alpha.3");
expect(version).toContain("independent product");
expect(version).not.toContain("Navi as Along's current V1 product surface");
expect(reference).toContain("the Navi skill may be installed and readable");
expect(reference).not.toContain("the Along Working Thread skill may be installed and readable");
```

Update product-debt status text so addressed identifiers are not simultaneously described as still leading with Along.

- [ ] **Step 2: Run and verify red**

```bash
npm test -- tests/skills/navi-skill.test.ts
```

Expected: FAIL on stale VERSION, reference, and debt text.

- [ ] **Step 3: Update narrative and verify package sync**

Make the canonical reference Navi-first, copy it exactly to the packaged reference, and update VERSION/README/debt text without changing manifest/package version fields, changelog, release notes, or tags.

```bash
npm test -- tests/skills/navi-skill.test.ts
npm run verify:plugin-package
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit Task 14**

```bash
git add plugins/navi/VERSION.md plugins/navi/README.md \
  .agents/skills/navi/references/working-thread-v1.md \
  plugins/navi/skills/navi/references/working-thread-v1.md \
  docs/along/navi-product-debt.md tests/skills/navi-skill.test.ts
git commit -m "docs: finish navi-first package migration"
```

---

### Task 15: Reverify The Post-Review Remediation

**Files:**
- Modify only Task 11-14 files if bounded verification proves an in-scope defect.

**Interfaces:**
- Produces a clean worktree and evidence for a second parent merge review.

- [ ] **Step 1: Run the original bounded suite**

```bash
npm test -- tests/cli/navi-command.test.ts tests/cli/navi-installation.test.ts tests/cli/navi-global.test.ts tests/cli/navi-transaction.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/skills/navi-skill.test.ts tests/mcp/working-thread-package.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check 1110f68..HEAD
```

Expected: every command exits `0`. Do not run full `npm test` or build.

- [ ] **Step 2: Run isolated cooperative-transaction and space-path probes**

Use only temporary roots beneath `/tmp`. Exercise create, modify, remove, confirmed-dead-PID recovery, existing-target no-replace restore, third-party target before publish, and cleanup refusal for malformed ownership. Execute the CLI through a path fixture containing spaces and verify doctor resolves decoded CLI and plugin source paths.

Expected: no unrelated file is deleted, conflicts retain target and transaction evidence, and no output claims adversarial atomicity.

- [ ] **Step 3: Audit scope and active narrative**

```bash
git status --short --branch
git diff --name-only 3c35deb..HEAD
rg -n "alpha\.1|Along's current V1 product surface|the Along Working Thread skill may be installed" \
  plugins/navi .agents/skills/navi docs/along/navi-product-debt.md tests/skills/navi-skill.test.ts
```

Expected: worktree clean; changed files remain within Tasks 11-14; stale active narrative has no matches except explicit negative assertions.

- [ ] **Step 4: Return the second review handoff**

Report:

- Task 11-14 commit IDs and subjects;
- exact targeted test files and counts;
- cooperative transaction and space-path probe outcomes;
- the residual limitation that malicious same-user syscall racing is outside the source-alpha guarantee;
- confirmation that no real global/plugin/external-project state was modified; and
- `git status --short --branch`.

Mark the bounded goal complete only after every check passes. Stop at parent review/merge. Do not merge, push, tag, or release.
