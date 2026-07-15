# Navi Source-Alpha CLI Invocation Implementation Plan

> **Status:** Implemented as four planned task commits plus two explicitly authorized remediation commits. The sixth remediation is the bounded candidate-closing change described below.

**Goal:** Make every source-alpha doctor, setup, and project-init follow-up use a Navi command proven to be a regular executable file in the active Codex environment, without turning Navi into a PATH manager or installer.

**Architecture:** One process-local invocation resolver and POSIX command renderer at the CLI Command/Adapter boundary owns executable evidence. The dispatcher resolves the context once, setup and doctor render only its structured command prefix, and init retains its no-generic-apply contract. Migration stages, setup transactions, project-init fingerprints, and approval boundaries remain unchanged.

**Tech stack:** TypeScript, Node.js filesystem and path APIs, Vitest, and the existing Navi CLI modules and source-alpha documentation.

## Final constraints

- Work from reviewed base `e1d58c1` in the Codex-managed isolated worktree.
- Use TDD for every behavior change and record focused RED before production edits.
- Create one Invocation Context per recognized top-level CLI invocation; do not add per-command PATH probes.
- Prefer a verified bare `navi`, then a verified launched entrypoint, then the verified source npm invocation.
- Treat missing or mismatched bare-command reachability as a warning when a verified fallback exists; fail only when no verified invocation exists.
- Executable evidence is read-only: require `X_OK`, resolve symlinks, and require the final target to be a regular file. Never execute a candidate during discovery.
- Keep command prefixes as structured tokens and quote only at render time for the documented POSIX shell surface.
- Do not edit PATH, shell profiles, Codex configuration, npm prefix state, plugin state, target projects, global bootstrap files, package metadata, lockfiles, dependencies, `work/`, or release state.
- Do not add an installer, receipt, cache, database, daemon, public release, Windows installer, or cross-shell abstraction.
- Do not change migration stages, transaction safety, fingerprints, write flags, approval gates, release truth, or Historical Along behavior.
- `navi init` must not print a generic apply command. Doctor's project-init repair guidance remains the only active init self-reference routed through the shared renderer.
- Run only the bounded verification and audits in this plan. Do not run full `npm test`, package/release verification, tag checks, release preparation, or npm audit remediation.
- The approved design remains `docs/superpowers/specs/2026-07-15-navi-source-alpha-cli-invocation-design.md`; this remediation does not edit it.

## Final 16-path scope

The candidate may differ from base in exactly these paths:

1. `README.md`
2. `README.zh-CN.md`
3. `docs/navi/design-history.md`
4. `docs/navi/roadmap.md`
5. `docs/superpowers/plans/2026-07-15-navi-source-alpha-cli-invocation.md`
6. `plugins/navi/README.md`
7. `src/cli/navi-doctor.ts`
8. `src/cli/navi-global.ts`
9. `src/cli/navi-invocation.ts`
10. `src/cli/navi.ts`
11. `tests/cli/navi-command.test.ts`
12. `tests/cli/navi-doctor.test.ts`
13. `tests/cli/navi-global.test.ts`
14. `tests/cli/navi-invocation.test.ts`
15. `tests/repository/current-surface.test.ts`
16. `tests/skills/navi-capability-truthfulness.test.ts`

The original implementation approved 14 paths. The fifth remediation explicitly added `docs/navi/roadmap.md`; the sixth explicitly adds this active plan. No other path is authorized.

## Implemented invocation contract

### Resolver and renderer

`src/cli/navi-invocation.ts` owns:

- `NaviInvocationContext` and its pass/fallback/unavailable states;
- injected, read-only `access`, `realpath`, `readFile`, and `stat` dependencies;
- PATH lookup relative to the injected `cwd`, including the existing empty-component semantics for `navi` only;
- executable validation that calls `access(candidate, X_OK)`, resolves the candidate with `realpath`, then accepts it only when `stat(canonical).isFile()` is true;
- identity matching against the canonical executable source wrapper;
- the structured npm prefix `['npm', 'run', 'navi', '--']`; and
- POSIX token quoting without executing any candidate.

This replaces the superseded `X_OK`-only rule. Searchable directories, including symlinks whose final target is a directory, are not executable evidence.

### Bare Navi and launched entrypoint

- The first qualifying `navi` PATH candidate must be `X_OK`, resolve to a regular file, and resolve to the canonical source wrapper.
- A directory named `navi` is ignored rather than recorded as a mismatched executable candidate.
- The launched entrypoint must independently be `X_OK`, resolve to a regular file, and resolve to the same canonical wrapper.
- Symlinks to regular executable files remain valid for both PATH and launched-entrypoint evidence.

### Source npm fallback

The superseded lifecycle-and-metadata-only fallback is not valid. `npm run navi --` is available only when all of this evidence holds:

1. `PATH` is defined and non-empty for npm lookup;
2. the first qualifying `npm` candidate on injected PATH is `X_OK` and resolves to a regular file;
3. `npm_lifecycle_event` is exactly `navi`;
4. injected `cwd` resolves to the canonical CLI root;
5. package name, bin mapping, and direct script mapping match the source package contract; and
6. the expected source wrapper is itself `X_OK` and resolves to a regular file.

A directory named `npm`, a symlink to a directory, empty PATH, undefined PATH, a non-executable source wrapper, or a directory-shaped expected wrapper cannot establish this fallback. Symlinks to regular executable npm and source-wrapper files remain valid. The resolver never runs npm or any candidate while collecting evidence.

### Dispatcher, setup, and doctor

- `src/cli/navi.ts` resolves exactly once for recognized commands and passes the same context to the chosen handler.
- `src/cli/navi-global.ts` renders setup preview, apply, removal, recovery, and rerun commands only through the verified context. Existing transaction and unsafe-path precedence is unchanged.
- `src/cli/navi-doctor.ts` reports pass/warn/fail reachability independently from migration stage and uses the renderer for doctor/setup/init follow-ups.
- Linked-bin PATH advice appears only for a one-token absolute fallback actually named `navi` in its recorded bin directory.
- When the CLI root is missing, doctor uses non-command guidance: `Use a checked-out Navi source package to establish a verified Navi CLI entrypoint.` It must not output an unverified bare `navi` command.

## Fixture and regression contract

`tests/cli/navi-invocation.test.ts` uses real temporary filesystem fixtures and removes every fixture after the test. The fixture contract includes:

- regular wrapper and candidate files with explicit executable modes;
- symlinks to regular executable files for positive Navi PATH, npm, launched-entrypoint, and source-wrapper coverage;
- direct directories and symlinks-to-directories for negative Navi PATH, npm, launched/expected-wrapper, and source-wrapper coverage;
- relative, empty, and undefined PATH cases using only injected values; and
- marker-producing unknown scripts whose absent markers prove candidates are inspected but never executed.

`tests/cli/navi-doctor.test.ts` covers fallback rendering, missing/unavailable invocation behavior, migration-stage independence, transaction precedence, linked-bin advice, and the missing-CLI-root non-command repair.

## Commit record

The final bounded candidate consists of exactly six commits after base `e1d58c1`:

1. `4d17d97 feat: resolve navi cli invocation`
2. `d6adbde feat: route navi setup through verified invocation`
3. `c60684c feat: report navi cli reachability`
4. `cf2fc4d docs: explain navi cli fallback`
5. `591a4c6 fix: verify navi cli fallbacks`
6. `fix: require executable navi cli targets`

The first four commits are preserved unchanged. The fifth and sixth are the only authorized remediation commits.

### Authorized fifth remediation outcome

The fifth commit changed exactly:

- `src/cli/navi-invocation.ts`
- `tests/cli/navi-invocation.test.ts`
- `src/cli/navi-doctor.ts`
- `tests/cli/navi-doctor.test.ts`
- `docs/navi/roadmap.md`
- `tests/repository/current-surface.test.ts`

It required a reachable `X_OK` npm candidate before source npm fallback, rejected empty/undefined PATH for npm lookup, restricted linked-bin advice to an entrypoint actually named `navi`, and synchronized roadmap authority. Its bounded verification passed 8 files / 174 tests, typecheck, diff check, five-commit count, 15-path scope, and the prohibited audits.

### Authorized sixth remediation contract and outcome

The sixth commit starts from clean `591a4c6` and changes exactly:

- `src/cli/navi-invocation.ts`
- `tests/cli/navi-invocation.test.ts`
- `src/cli/navi-doctor.ts`
- `tests/cli/navi-doctor.test.ts`
- `docs/superpowers/plans/2026-07-15-navi-source-alpha-cli-invocation.md`

Its contract is:

1. add `stat` to the injected filesystem dependencies;
2. require every expected wrapper, Navi/npm PATH candidate, launched entrypoint, and source script to be an `X_OK` regular file after symlink resolution;
3. reject direct directories and symlinks-to-directories while preserving executable symlinks-to-files;
4. replace missing-CLI-root `Run navi ...` wording with non-command verified-entrypoint guidance;
5. replace stale plan instructions with the six-commit, 16-path bounded contract; and
6. create exactly one commit with subject `fix: require executable navi cli targets`.

Focused RED must be recorded before production changes and focused GREEN after them. The final report records the sixth commit SHA and exact counts because a commit cannot embed its own SHA.

## Exact bounded verification

After focused GREEN, run the original exact 8-file suite, not full `npm test`:

```bash
npm test -- tests/cli/navi-invocation.test.ts tests/cli/navi-command.test.ts tests/cli/navi-global.test.ts tests/cli/navi-doctor.test.ts tests/cli/navi-init.test.ts tests/cli/navi-init-plan.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
git diff --check
```

Then verify the exact candidate history and scope:

```bash
git rev-list --count HEAD~6..HEAD
git log --format='%h %s' --reverse HEAD~6..HEAD
git diff --name-only HEAD~6...HEAD
```

Expected results are exactly six commits and the 16 paths listed above. The sixth commit subject must be exact and no earlier commit may be rewritten.

Run the original prohibited-behavior audits exactly:

```bash
rg -n "writeFile|appendFile|chmod|symlink|spawn|execFile|execSync" src/cli/navi-invocation.ts
rg -n "\.zshrc|\.zprofile|PATH=" src/cli README.md README.zh-CN.md plugins/navi/README.md
```

Both must return no matches. Also confirm `git status --short` is empty after the commit. Do not install dependencies or tools, run full `npm test`, mutate PATH/global npm/Codex/plugin/target state, or widen the audit surface.

## Self-review and handoff

Review the exact `e1d58c1...HEAD` diff and confirm:

- one resolver and renderer own invocation behavior;
- every executable claim is both `X_OK` and a regular file after symlink resolution;
- executable symlinks-to-files work and all directory-shaped evidence is rejected;
- unknown Navi and npm candidates are never executed;
- setup and doctor output no unverified actionable bare command;
- missing CLI-root guidance is descriptive, not a command;
- migration-stage derivation, transaction precedence, setup/init fingerprinting, and approval boundaries are unchanged;
- the exact six-commit / 16-path scope holds; and
- no prohibited environment, package, global, target-project, `work/`, distribution, or release state changed.

Write the full sixth-remediation report to `/tmp/navi-cli-invocation-sixth-remediation-report.md` with RED/GREEN evidence, plan changes, all verification/audit results, self-review, and residual risks. Stop before merge, push, calibration, release, or external mutation.

## Independent validation and post-integration calibration

Independent validation remains read-only and bounded to the approved design, this synchronized plan, the exact diff, the exact 8-file suite, typecheck, and scope/prohibited audits. Any requested PATH mutation, installer behavior, public distribution, cross-platform expansion, second state system, or file outside the final 16-path scope is premise-changing.

Only after explicit integration may one real-environment calibration invoke doctor through an already known absolute executable entrypoint while bare `navi` remains unavailable. Calibration must not edit PATH, shell profiles, plugins, project files, or release state. It is calibration evidence, not distribution or release proof.
