# Navi Bootstrap Remediation And ID Migration Design

Date: 2026-07-11

Status: Approved in design discussion on 2026-07-11; filesystem threat model revised and approved on 2026-07-13

## Summary

The first Navi bootstrap implementation completed its bounded worktree plan, but merge review found runtime, path-model, write-safety, distribution, and naming defects. The branch must not merge until a strictly bounded remediation corrects those defects.

The remediation also closes a product-boundary mistake. `along-working-thread` began as an internal compatibility identifier before Navi became an independent product surface. A new source-alpha installation path must not teach that legacy identifier as Navi's product name. New installation, discovery, diagnosis, project initialization, and active documentation use `navi`. Along remains origin, lab context, and possible future product-family context.

This is Implementation work after an approved design. It is not Release work. It does not authorize a tag, version bump, GitHub Release, npm publication, public marketplace publication, real global installation, or real target-project mutation.

## Evidence From Merge Review

The completed worktree at `/Users/james/.codex/worktrees/656b/Navi` must be remediated before merge because review reproduced these issues:

1. Direct `navi doctor` execution from an unrelated working directory fails because `navi-doctor.ts` uses extensionless TypeScript imports that the raw Node entrypoint cannot resolve.
2. Doctor invents its package root from `process.cwd()/plugins/along-working-thread`, so a correctly linked CLI produces false source, manifest, and cache failures outside the Navi checkout.
3. Global setup performs a check followed by rename or unlink. Another process can change the target between those operations, causing overwrite or deletion of content that was never approved.
4. Active documentation says the plugin must already be installed but does not provide a complete source-alpha installation procedure.
5. A conflicted setup dry-run exits successfully and still prints `Apply with: navi setup --write`.
6. Temporary-file cleanup can remove a path that the current invocation did not create.
7. The known-upgrade test does not contain a deployed older block and therefore tests skip behavior while claiming upgrade behavior.
8. The package bin points directly at TypeScript and implicitly depends on Node 22 native type stripping without declaring that runtime contract.
9. New installation instructions would expose `along-working-thread` as the plugin selector, contradicting Navi's approved independent-product boundary.

## Product Naming Decision

The active product identifiers become:

```text
CLI command:       navi
plugin id:         navi
skill id:          navi
plugin source:     plugins/navi
repo skill source: .agents/skills/navi
marketplace:       navi-source
plugin selector:   navi@navi-source
```

The Navi package must no longer install an `along` executable. Historical Along runtime and source evidence can remain in the repository, but they are not installed as a side effect of installing Navi.

`along-working-thread` remains visible only where it is factually required:

- historical specs, plans, releases, and source records;
- a concise Navi/Along relationship explanation;
- legacy-installation detection and migration instructions.

It must not remain in the new-user installation path, current plugin manifest, current skill identifier, active setup examples, ordinary doctor success output, or newly generated project trigger.

## Legacy Compatibility Model

Do not ship two equivalent active skills. Installing both `navi` and `along-working-thread` could produce duplicate discovery and ambiguous behavior.

Compatibility is detection and explicit migration, not dual runtime support:

- `navi doctor` reports a legacy installation when only `along-working-thread` is present.
- It reports a conflict when both legacy and current plugins are present.
- It obtains the actual legacy marketplace selector from `codex plugin list`; documentation must not guess it.
- It never removes, installs, or migrates global plugins automatically.
- New project blocks reference only Navi.
- `navi init` recognizes the exact previously deployed managed Navi block as an older generated version and can upgrade it after explicit `--write` approval.
- User-edited managed blocks remain conflicts. Ordinary documents that mention Along are never rewritten.

The safe user sequence is:

```text
install current Navi plugin
-> run navi doctor
-> upgrade an active project's exact managed trigger with navi init --write
-> verify that project
-> explicitly remove the legacy plugin
```

Navi does not scan the user's disk for old projects.

## Source-Alpha Marketplace

The repository contains `.agents/plugins/marketplace.json` with this product model:

```json
{
  "name": "navi-source",
  "interface": {
    "displayName": "Navi Source"
  },
  "plugins": [
    {
      "name": "navi",
      "source": {
        "source": "local",
        "path": "./plugins/navi"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

The source-alpha path is explicit and user-run:

```bash
git clone https://github.com/HezLUO/navi.git
cd navi
npm install
npm run verify:plugin-package
codex plugin marketplace add "$PWD"
codex plugin add navi@navi-source
npm link
navi doctor
navi setup
navi setup --write
```

These commands modify Codex global configuration/cache or npm's global link state. Navi documents that fact and does not execute those installation steps from `navi setup`.

Removal is likewise explicit:

```bash
navi setup --remove
navi setup --remove --write
codex plugin remove navi@navi-source
codex plugin marketplace remove navi-source
npm unlink -g navi
```

This is a local source marketplace, not npm publication, a public marketplace listing, or one-click installation.

## Stable CLI Entry

`package.json` exposes only:

```json
{
  "bin": {
    "navi": "src/cli/navi-bin.mjs"
  }
}
```

The JavaScript wrapper uses the installed `tsx/esm/api` `tsImport()` function to load `navi.ts` relative to `import.meta.url`, then calls `runNaviCli(process.argv.slice(2))`. It does not rely on native TypeScript stripping, import-side-effect direct-execution detection, or the caller's working directory.

The source alpha keeps `tsx` as an installed development dependency. Producing a bundled public CLI is deferred to Distribution & Trust work.

Direct execution from an unrelated working directory must cover `init`, `setup`, and `doctor`.

## Doctor Path And Plugin Model

Doctor uses three independent roots:

- CLI source root: derived from the bin wrapper/module URL.
- Installed plugin source root: parsed from the current `navi` row returned by `codex plugin list`.
- Target project root: the current working directory unless explicitly injected in a test.

Doctor never substitutes one root for another. In particular, it does not construct a plugin package path beneath `process.cwd()`.

Plugin status distinguishes:

- current Navi installed and enabled;
- current Navi installed but disabled;
- legacy plugin only;
- both current and legacy plugins;
- neither plugin;
- command output that cannot be inspected reliably.

When a current plugin row has no inspectable `sourcePath`, doctor reports an inspectability warning instead of inventing a fallback. Manifest and cache comparison use the installed plugin source path and the corresponding installed cache evidence. Missing inspectability must not create false source-drift claims.

The CODEX_HOME check uses the canonical path model defined below. Doctor is read-only and reports requested and canonical locations when they differ.

## Canonical CODEX_HOME Trust Boundary

Before planning or applying global setup:

1. Resolve the requested CODEX_HOME path.
2. Require it to exist and be a directory.
3. Resolve it with `realpath` and use only that canonical physical path afterward.
4. Ensure every managed filename remains confined beneath that root using `path.relative`.
5. Use `lstat` to reject a symlink at AGENTS, lock, transaction, stage, or backup paths.

A symlink in the user-facing path to CODEX_HOME is allowed only as a route to an existing canonical directory. Setup reports both paths and performs every later operation through the canonical root. This avoids mechanically rejecting ordinary platform aliases such as macOS `/var -> /private/var` while preserving a clear physical trust boundary.

Missing, non-directory, unresolvable, or confinement-violating roots are hard failures. Project-local `navi init` keeps its existing path model; this remediation does not refactor it into the global transaction system.

## Filesystem Threat Model

The source alpha uses a **cooperative same-user concurrency model**.

Navi must protect against crashes, duplicate Navi setup runs, ordinary concurrent edits, stale plans, symlinks, malformed transaction evidence, and content changes visible at its deterministic transaction checkpoints. It uses exact-byte hashes, an exclusive Navi lock, confined artifacts, no-replace publication, backups, fsync, and conservative recovery.

Navi does not claim to resist a malicious process running with the same user permissions and deliberately racing individual filesystem system calls. Pure Node filesystem APIs do not provide a portable directory-handle-relative primitive that combines no-follow, no-replace, and compare-and-move semantics against that adversary. This limitation must be described as a security boundary, not hidden behind an unprovable atomicity claim.

This narrower model does not permit known unsafe behavior. Navi still must remove the observed link/verify/unlink deletion window, reject unowned manifest paths, preserve third-party content when a conflict is detected, and avoid claiming completion when recovery evidence is incomplete.

## Cooperative Recoverable Transaction

Global AGENTS writes use one exclusive transaction directory under canonical CODEX_HOME:

```text
.AGENTS.md.navi-lock
.AGENTS.md.navi-transaction-<id>/
  manifest.json
  stage
  backup
```

The transaction directory is created exclusively with mode `0700`. `manifest.json` records the transaction ID, operation, fixed target name, exact content hashes, stage, PID, and timestamp, but no user instruction content and no caller-controlled artifact path. `stage` and `backup` are fixed children of the verified transaction directory.

The lock records transaction ID and PID. A matching lock whose PID is confirmed alive means another Navi transaction is active. A PID confirmed absent permits conservative inspection of the matching transaction evidence. A missing, malformed, mismatched, or uninspectable lock/manifest relationship is a conflict. Navi never deletes a lock based only on age; a matching stale lock is removed only as part of a verified recovery or committed-state cleanup.

For create:

1. Create and fsync the transaction directory, stage, manifest, and lock.
2. Verify `AGENTS.md` remains absent.
3. Publish with a no-replace hard link from stage to `AGENTS.md`.
4. Verify the published hash and fsync the canonical directory.
5. Remove only the verified transaction directory and matching lock after committed state is rechecked.

For modify or remove:

1. Verify the target is a regular unlinked file whose bytes equal the approved previous bytes.
2. Move the target into the exclusive transaction directory as fixed child `backup`.
3. Re-read and hash `backup`. If it differs, do not publish. Restore it only with a no-replace operation when the target remains absent; otherwise preserve both and report conflict.
4. For modify, publish fixed child `stage` to `AGENTS.md` with a no-replace hard link and verify the desired hash.
5. For remove, target absence plus the expected backup is the committed removed state. A later third-party target is never deleted.
6. Fsync and clean the matching transaction evidence only after rechecking committed state.

The implementation exposes test-only checkpoints after plan verification, after backup move, before publish, after publish, and before cleanup. Tests may create or replace `AGENTS.md` at those checkpoints and must prove that detected third-party content is not deleted or overwritten. These tests demonstrate cooperative handling; they do not claim adversarial same-user atomicity inside a single system call.

Recovery is operation-specific:

| Operation | Target | Evidence | Result |
| --- | --- | --- | --- |
| create | missing | expected stage | clean unpublished transaction; rerun |
| create | desired hash | expected stage | clean committed transaction |
| create | other content | any | conflict; preserve evidence |
| modify | expected hash | move not started | clean unpublished transaction; rerun |
| modify | missing | expected backup | restore backup with no-replace; rerun |
| modify | desired hash | expected backup | clean committed transaction |
| modify | other content | backup exists | conflict; preserve both |
| remove | expected hash | move not started | clean unpublished transaction; rerun |
| remove | missing | expected backup | clean committed removal |
| remove | other content | backup exists | conflict; preserve both |
| any | any | malformed schema, ownership, hash, or lock evidence | conflict; preserve evidence |

Recovery inspection and execution take precedence over current action `skip`, plugin availability, and new mutation planning. `navi setup --write` performs only one unambiguous recovery and exits, requiring the user to rerun the requested install/remove operation. It never recovers and applies a new mutation in one invocation. Doctor reports transaction state without changing it.

Normal setup output does not expose transaction internals. Troubleshooting documentation should state that Navi protects cooperative local operations and crash recovery but does not claim protection against a malicious same-user process deliberately racing filesystem calls. Conflict output names retained evidence without suggesting forced lock deletion or overwrite.

## Conflict And Exit Semantics

- Successful preview, exact skip, successful write, or no-op removal returns `0`.
- Missing/disabled plugin, current-plus-legacy conflict, managed-region conflict, unsafe path, active/ambiguous transaction, or failed mutation returns nonzero.
- A conflicted preview never prints `Apply with: ... --write`.
- Ordinary non-blocking doctor warnings may return `0`.
- Any doctor finding that makes Navi unavailable or makes setup unsafe returns nonzero.
- Temporary cleanup removes only artifacts whose creation by the current invocation was confirmed.

## Project Trigger Upgrade

The existing alpha.13 managed project block is a real known previous version. `navi init` must recognize that exact generated block and update it to the current block whose product/skill identifier is Navi.

The upgrade is still dry-run first. It preserves all bytes outside the managed region. A user-modified block, duplicate markers, incomplete markers, or an unknown generated form is a conflict and receives no write instruction.

This change must not infer project state, rewrite project maps, or edit arbitrary Along references.

## Scoped Commit Authorization

The previously generated Navi block incorrectly classifies every local commit as a fresh user-approval boundary. That rule conflicts with Navi's own continue-through and no-menu-inside-approved-boundary rules, and it conflicts with Subagent-Driven Development plans that explicitly use local task commits as reviewable checkpoints.

An approved bounded implementation or worktree loop authorizes the local commits explicitly included in that plan when all of these conditions hold:

- the commit contains only files inside the approved task scope;
- it excludes user changes that existed before the loop;
- it is a normal local checkpoint, not a history rewrite;
- it does not merge into main, push, tag, release, or modify another project;
- no new scope, risk, or specification conflict has appeared;
- the user did not explicitly request changes without commits.

The agent may report those commits, but must not pause for separate approval after every task. Approval propagates from the user-approved loop to its worktree parent and bounded subagents. The worktree stops after the planned tasks and targeted verification at the review/merge decision, not at every local commit.

User approval remains required before:

- a commit not covered by the approved loop;
- staging unknown, pre-existing, or out-of-scope changes;
- amend, rebase, squash, reset, force-push, or other history rewriting;
- merging a worktree into main;
- pushing, tagging, releasing, or crossing a project boundary;
- scope expansion, mode escalation, or explicit known-risk acceptance.

Project governance remains authoritative. A user-authored rule outside the Navi managed block may still require approval for every commit. Navi changes only its managed block and its canonical/package skill contract; it does not rewrite project-owned instructions.

The current generated rule must use this semantic contract:

```text
An approved bounded implementation or worktree plan authorizes its explicitly planned local task commits. Do not request separate approval for each such commit. Stop before merge, push, tag, release, history rewriting, cross-project changes, scope expansion, unknown staged content, or any commit not covered by the approved loop.
```

## Product Boundary

This remediation owns Navi's current alpha surface:

- Navi CLI;
- Navi plugin and skill;
- source-alpha marketplace;
- global bootstrap;
- project-local init trigger;
- active setup, migration, and troubleshooting documentation.

It does not rename or rebrand:

- historical specs, plans, and release records;
- `src/web` or Along Shared Desk evidence;
- historical Along server/runtime source;
- unrelated Working Thread MCP files;
- future runtime, memory, presence, adapter, or delegation concepts.

If Along later needs a CLI or package, Along must provide it from its own product surface. Installing Navi must not install an `along` command.

## Validation Boundary

Implementation uses targeted tests only:

- CLI dispatcher/bin tests;
- global setup transaction and recovery tests;
- deterministic cooperative-concurrency checkpoint tests;
- malformed transaction ownership and unrelated-file preservation tests;
- doctor path/plugin-state tests;
- project-init legacy-block upgrade tests;
- skill/package synchronization tests;
- package verifier;
- TypeScript typecheck;
- `git diff --check`;
- three direct CLI probes from an unrelated temporary cwd.

All filesystem tests use temporary CODEX_HOME and target-project fixtures. Command discovery is injected or redirected to fixtures. No test or probe may modify real global Codex configuration, real plugin cache, npm global links, `engineering_loop`, or `sub_ag_ski`.

Do not run the full test suite or build by default. Do not tag, publish, release, merge, or push from the remediation worktree.

## Acceptance Criteria

The branch is ready for another merge review when:

1. A new user can follow one complete source-alpha installation path containing only Navi product identifiers.
2. Direct `navi init`, `navi setup`, and `navi doctor` execution works outside the repository cwd.
3. Doctor uses bin, plugin source, project, cache, and canonical CODEX_HOME roots correctly.
4. Legacy-only and dual-install states receive truthful migration/conflict guidance.
5. Under the documented cooperative same-user threat model, global setup removes the known deletion window, never knowingly overwrites or deletes detected third-party content, rejects unowned transaction evidence, and conservatively recovers interrupted create/modify/remove operations.
6. Conflict previews return nonzero and never recommend `--write`.
7. Exact old project triggers can be upgraded with explicit approval; edited triggers remain untouched.
8. Installing Navi exposes no `along` executable and no new-user `along-working-thread` selector.
9. Targeted verification passes without touching real global or target-project state.
10. Planned local task commits continue without repeated approval, while merge, push, release, history rewrite, unknown staged content, and project-owned governance remain protected.
