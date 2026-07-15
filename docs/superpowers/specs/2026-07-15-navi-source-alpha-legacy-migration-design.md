# Navi Source-Alpha Legacy Migration Design

Date: 2026-07-15

Status: Approved in design discussion on 2026-07-15

## Summary

Navi needs a general source-alpha migration path from the legacy
`along-working-thread` Codex plugin installation to the current
`navi@navi-source` installation. The current guidance couples global plugin
migration to project-local trigger migration and gives conflicting actions
during the temporary dual-install state.

The approved design keeps global plugin operations explicit and user-run. It
does not add a migration command, persistent receipt, background process, or
long-term dual-runtime compatibility. Instead, `navi doctor` becomes a
phase-aware migration guide. It verifies the current Navi source during a
short dual-install transition, presents one executable next action, and keeps
global activation separate from project-local migration.

This design covers source-alpha migration behavior. It does not authorize
implementation, real global mutation, target-project writes, a release, or a
public installer.

## Problem

The current migration contract is internally inconsistent:

1. Navi correctly treats current-plus-legacy installation as a conflict
   because two active equivalent skills can produce duplicate discovery and
   ambiguous behavior.
2. `navi setup` correctly refuses to install the global bootstrap while that
   conflict exists.
3. Current doctor and README guidance tells the user to install Current Navi,
   migrate and validate a target project while both plugins are installed,
   and only then remove the legacy plugin.
4. The project validation in that sequence cannot reliably establish which
   active plugin supplied the behavior.
5. The sequence also makes the user identify and migrate projects before a
   global product transition can complete.
6. Doctor can emit plugin, global-bootstrap, and project-init repairs at the
   same time even when lower-level repairs cannot yet succeed.

The result is excessive user burden and an unsafe supervisory message: Navi
reports several facts but does not identify the one valid next action.

## Product Goal

Provide a general, bounded migration path for source-alpha users that:

- replaces the legacy global plugin with Current Navi;
- verifies the authoritative Current Navi source before legacy removal;
- permits only a short, diagnosed dual-install transition;
- installs the Current Navi global bootstrap after the legacy plugin is gone;
- leaves project files untouched during global migration;
- migrates legacy project triggers only when those projects are next used;
- gives one valid next action at each stage; and
- retains explicit user control over every global mutation.

The first real calibration will use the current development machine, but the
behavior must not depend on that machine's paths or one known legacy selector.

## Non-Goals

This design does not add:

- a `navi migrate` command;
- automatic execution of `codex plugin add` or `codex plugin remove`;
- a persistent migration receipt or migration database;
- automatic plugin rollback;
- long-term current-plus-legacy coexistence;
- a scan of the user's projects;
- automatic project initialization or trigger rewriting;
- npm publication, a public marketplace, or a one-click installer;
- changes to the global setup filesystem transaction model; or
- release preparation.

## Core Product Decisions

### Short Transition, Not Dual-Runtime Support

The migration may pass through a short state in which one authoritative
Current Navi installation and one identified legacy installation are both
present. This state remains unhealthy and returns a nonzero doctor result. It
exists only so doctor can verify Current Navi before the user removes the
legacy selector.

Navi does not run behavioral project calibration, install the global
bootstrap, or claim activation success during this transition.

### Guidance Without Global Mutation

`navi doctor` owns diagnosis, ordering, exact-selector reporting, validation
evidence, and the next recommended command. The user owns execution of global
Codex plugin commands and the approved `navi setup --write` operation.

This preserves the current trust boundary: Navi does not become a privileged
wrapper around Codex plugin management.

### Global Migration Is Independent Of Project Migration

Global migration does not require a project inventory and does not modify a
target project. A project with a missing Map, missing trigger, or recognized
legacy trigger does not invalidate successful global activation.

After Current Navi is globally active, the next session in a project with a
recognized legacy trigger may offer the existing fingerprint-bound `navi init`
upgrade. If the user declines, ordinary work continues and the reminder is not
repeated in that session.

### Stateless Source-Alpha Recovery

The migration is a bounded, same-session source-alpha operation. Doctor prints
the exact observed legacy selector and the stage-specific recovery direction,
but does not create a persistent receipt.

If the operation is interrupted, rerunning `navi doctor` and inspecting the
current Codex plugin list reconstructs the state. A future public installer may
justify a durable migration transaction, but this source-alpha path does not.

## Derived Migration Stages

Doctor derives migration stages from existing installation, source, bootstrap,
path-safety, and transaction evidence. The stages are not persisted and do not
become a new public state store.

### `legacy-only`

One identified legacy plugin is installed and the authoritative Current Navi
plugin is absent.

Doctor reports the exact legacy selector and recommends installing and enabling
`navi@navi-source`. It does not recommend project initialization or global
bootstrap setup yet.

### `transition-dual`

Exactly one installed and enabled authoritative `navi@navi-source` row and one
identified legacy row are present. The Current Navi source path is inspectable.

Doctor keeps the plugin check failed, performs read-only Current Navi source and
manifest checks, and recommends removing the exact legacy selector only after
those checks pass.

### `dual-invalid`

Both product generations appear present, but the Current Navi selector is
non-authoritative, duplicated, disabled, uninspectable, or otherwise invalid;
or the legacy identity is ambiguous.

Doctor stops the transition. It recommends repairing or removing the invalid
Current Navi installation while preserving the working legacy installation.
It must not recommend legacy removal.

### `current-only-bootstrap-missing`

The authoritative Current Navi plugin is installed, enabled, and inspectable;
no legacy installation remains; and the global bootstrap is absent or needs an
ordinary recognized update.

Doctor recommends `navi setup`, review of the preview, and then an explicitly
approved `navi setup --write`.

### `current-active`

The authoritative Current Navi installation is healthy, no legacy installation
remains, and the global bootstrap is valid.

Global migration is complete. Project initialization findings may still appear
as project-level warnings, but they do not change this global result.

### `current-unusable`

No usable legacy installation remains and Current Navi is missing, disabled,
uninspectable, or invalid.

Doctor recommends repairing Current Navi first. It may also present a manual
fallback using the previously observed exact legacy selector when that evidence
is still available to the active migration session. It must not invent a
legacy marketplace selector or claim automatic rollback.

## Diagnostic Precedence

Doctor must not print several incompatible repair commands as equivalent next
steps. It applies this precedence:

```text
unsafe CODEX_HOME path or unresolved setup transaction
-> plugin installation and Current Navi source identity
-> global bootstrap
-> project-local initialization
```

Rules:

- A higher-level unresolved condition may leave lower-level facts visible, but
  lower-level repairs are deferred or omitted.
- An unsafe path, live setup transaction, or ambiguous transaction conflict is
  resolved before plugin migration continues.
- During `legacy-only`, `transition-dual`, or `dual-invalid`, bootstrap output
  must not recommend `navi setup --write`.
- During those stages, project-init output must not recommend modifying a
  project.
- Bootstrap becomes actionable only after a healthy current-only installation.
- Project initialization becomes actionable only after global activation.
- Rendered output ends with one concise `Next action:` when an action is
  available.
- A healthy result does not gain a synthetic action merely to keep the user
  busy.

This ordering changes guidance, not filesystem authority. Existing setup
transaction recovery and path-safety rules remain authoritative.

## User Journey

The normal source-alpha migration is:

```text
navi doctor
-> codex plugin add navi@navi-source
-> navi doctor
-> codex plugin remove <exact legacy selector reported by doctor>
-> navi doctor
-> navi setup
-> user reviews and approves the preview
-> navi setup --write
-> navi doctor
```

At each stage doctor states:

1. the current migration stage;
2. why migration is not yet complete;
3. the one recommended next action;
4. the validation command after that action; and
5. a rollback direction only when the attempted action fails.

The CLI must not require the user to translate a long diagnosis into a command
or choose among commands that cannot all succeed in the current state.

## Failure Handling

### Current Navi Cannot Be Verified During Dual Install

Keep legacy installed. Repair or remove the invalid Current Navi selector and
return to `legacy-only`. Do not remove legacy and do not run setup.

### Legacy Removal Fails

Remain in `transition-dual`. Rerun doctor after resolving the exact Codex plugin
operation failure. Do not continue to bootstrap setup.

### Setup Fails After Legacy Removal

Keep the verified Current Navi plugin. Use the existing global setup transaction
inspection and recovery contract. Do not automatically reinstall legacy merely
because bootstrap setup failed.

### Current Navi Becomes Unusable After Legacy Removal

Prefer repairing the authoritative Current Navi installation. When the active
migration session still has the exact prior selector, doctor may state how to
restore that selector manually. It must not claim that restoration is possible
without checking the relevant marketplace evidence.

### Project Contains A Legacy Trigger

Complete global migration without touching the project. On later project use,
recognize the deployed legacy block and offer the existing fingerprint-bound
upgrade. Unknown, edited, duplicated, or unsafe blocks remain conflicts and are
never rewritten automatically.

## Implementation Boundaries

The intended implementation remains within existing responsibilities:

- `src/cli/navi-installation.ts` continues to parse Codex plugin-list evidence.
  It changes only if focused tests expose an evidence-preservation gap.
- `src/cli/navi-doctor.ts` derives the migration stage, controls diagnostic
  precedence, validates inspectable Current Navi evidence during the recognized
  transition, and renders the one next action.
- `src/cli/navi-global.ts` continues to block setup writes while legacy and
  Current Navi are both installed.
- Project Map, project trigger, and `navi init` modules keep their current
  project-local responsibilities.
- README.md, README.zh-CN.md, plugins/navi/README.md, and the active project-init
  documentation describe global migration and project migration as separate
  phases.

No implementation should create a second installation parser, a general
workflow engine, or a persistent migration-state subsystem.

## Implementation Verification

Implementation mode uses targeted tests rather than release-level validation.
Focused coverage must prove:

- `legacy-only` reports installation of Current Navi and preserves the exact
  legacy selector;
- a valid `transition-dual` remains failed overall but permits Current Navi
  manifest and source inspection;
- a valid transition recommends removing only the exact legacy selector and
  does not recommend `navi init`;
- invalid, duplicate, disabled, or uninspectable Current Navi evidence cannot
  authorize legacy removal;
- current-only plus missing bootstrap recommends setup preview before write;
- `current-active` remains globally complete when the current project is not
  initialized;
- dual install still blocks `navi setup --write`;
- lower-priority repairs are deferred while a higher-priority condition remains;
  and
- the English, Chinese, and packaged README surfaces describe the same sequence.

The implementation worktree receives an independent validation-thread review.
Review depth matches this bounded, medium-impact CLI guidance change. Full
release tests, tag checks, and release preparation are not implied.

## Post-Integration Calibration

Real global migration is a separate Calibration-mode activity and requires
explicit permission for each global mutation. It will:

1. record the legacy-only baseline and exact selector;
2. install Current Navi and observe the diagnosed transition;
3. verify Current Navi source identity before legacy removal;
4. remove the exact legacy selector;
5. install the global bootstrap through preview and approved write;
6. confirm `current-active`;
7. confirm that the migration did not modify either real target project; and
8. proceed to the already approved read-only two-project fresh-session
   calibration.

A failure stops at its actual stage and records the evidence. Calibration does
not repeatedly change tests or broaden implementation until the observed path
appears successful.

## Acceptance Criteria

The design is implemented when:

- doctor distinguishes the approved migration stages from current evidence;
- an authoritative Current Navi source can be inspected during the bounded
  dual-install transition;
- doctor presents one currently executable next action;
- setup remains blocked until the installation is current-only;
- global activation completes without project scanning or project writes;
- legacy project triggers are handled later through explicit project-local
  migration;
- failure guidance preserves the safest available working installation and does
  not invent rollback evidence; and
- documentation and focused tests enforce the same contract.

