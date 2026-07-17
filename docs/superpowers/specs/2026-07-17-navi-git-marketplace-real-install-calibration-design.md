# Navi Git Marketplace Real-Installation Calibration Design

## Status

Approved calibration design. This document defines the first post-integration
real-installation calibration for Navi Distribution feasibility.

This design does not authorize pushing `main`, changing global Codex plugin or
marketplace state, creating a target-project copy, starting calibration tasks,
writing target-project files, publishing a release, or entering Release mode.
Each state-changing calibration action remains behind a separate explicit
Calibration-mode authorization.

## Purpose

The Distribution feasibility implementation can build a self-contained
package-local init entry and stage Git-backed and local marketplace metadata.
Static review and repository tests cannot prove that an ordinary Codex user can
install that plugin and reach a useful project-local Navi experience through a
fresh task.

This calibration answers one bounded product question:

> Can a user install Navi through the primary Git-backed marketplace, ask one
> natural project-progress question without naming Navi, approve an exact
> package-local initialization preview, and use the resulting confirmed Project
> Map in a second fresh task?

It does not attempt to prove dual-channel distribution, updates, rollback,
uninstall behavior, cross-platform support, release readiness, or the full Navi
product vision.

## Completion Line

The first calibration uses the minimum real value loop:

```text
immutable Git-backed marketplace
-> Navi plugin installation
-> natural fresh-task onboarding
-> read-only package-local init preview
-> exact approved temporary-project write
-> second fresh task using the confirmed Map
```

Passing this loop permits design of the local-marketplace calibration. It does
not automatically permit a tag, GitHub Release, Public Plugin Directory
submission, update/rollback testing, or cross-platform expansion.

## Target Project

Use a sanitized temporary copy of the real `sub_ag_ski` project.

The copy preserves the real source, package metadata, README, plans, and other
project evidence needed for a meaningful mature-project judgment. It excludes:

- `.git`;
- `node_modules` and generated build output;
- `.navi/`;
- the existing Navi managed block in `AGENTS.md`; and
- any unrelated secret, credential, cache, or machine-local file.

Project-owned instructions outside the Navi managed block remain intact. The
original `sub_ag_ski` project is read-only throughout the calibration and must
show no resulting file change.

A completely empty fixture is not sufficient because it proves only the
evidence-poor path. Direct use of the real project is not allowed because it
would mix first-install evidence with existing Navi state and expose the real
project to calibration writes.

## Installation State Strategy

Use the real Codex global plugin environment, not an isolated CLI-only profile.

Codex CLI profiles can layer configuration, but they do not establish that the
desktop Plugins surface, managed plugin cache, and fresh Codex tasks use the
same isolated state. A CLI-only pass could therefore produce a false positive
for the actual user journey.

Before any global mutation, record:

- the Codex version;
- the current marketplace list and resolved roots;
- the current `navi-source` marketplace origin and selector;
- the installed Navi plugin version and source;
- the Navi enabled or disabled state; and
- enough official-command output to restore that state without editing files
  directly.

Use only official Codex marketplace and plugin commands. Do not edit
`config.toml`, write into the plugin cache, or infer restoration from cache
contents.

If preflight finds multiple Navi selectors, ambiguous legacy state, an unknown
marketplace origin, or no deterministic restoration path, stop before mutation
and return a decision-required result to the Main Thread.

## Immutable Candidate Requirement

The integrated Distribution feasibility candidate must be pushed before
calibration so the Git-backed marketplace can resolve it outside the local
source checkout.

Record one exact integrated commit SHA and use an immutable Git `ref` or `sha`
selector. Do not calibrate a floating `main` entry. The installed candidate must
retain the technical identities:

```text
marketplace: navi-source
plugin: navi
display name: Navi Releases
```

Pushing the integrated commit is a separate explicit user decision. It is not
authorized by this design.

## Calibration Journey

### 1. Preflight

1. Confirm the exact pushed candidate SHA.
2. Confirm the original Navi repository and `sub_ag_ski` state.
3. Record current global marketplace and plugin state.
4. Prove that the prior global state can be restored with official commands.
5. Create the exact temporary project root and sanitized mature-project copy.
6. Confirm that the temporary project has no `.navi/` and no Navi managed
   trigger.

### 2. Git-Backed Installation

1. Add the Navi Git-backed marketplace pinned to the exact candidate SHA.
2. Confirm that Codex resolves the expected `navi-source` catalog.
3. Install and enable `navi@navi-source` through the ordinary Plugins or
   official plugin lifecycle.
4. Confirm that the installed package identity and version match the candidate.

No source checkout command, `npm link`, bare `navi`, hardcoded cache path, or
silent runtime installation may be used to make this step pass.

### 3. First Fresh Task

Start one fresh Codex task rooted at the sanitized temporary project. Use only
this natural prompt:

> 请帮我看看这个项目现在做到哪了，接下来应该做什么。

Do not mention Navi, Project Map, initialization, the package script, or the
calibration objective in the user prompt.

The installed skill should recognize that project-local Navi guidance is
missing, inspect bounded project evidence, form a truthful candidate Map, and
enter the established preview boundary.

An explicit diagnostic prompt such as `Please use Navi` may be used only after
the natural entry fails. It can help classify the failure but cannot convert
the natural-entry result into a pass.

### 4. Preview And Approved Write

Before approval:

- run the init entry from the actually installed plugin package;
- show the target root, candidate Map, managed trigger effect, and exact plan
  fingerprint;
- keep the temporary project byte-for-byte unchanged; and
- avoid direct skill writes or source-checkout fallback.

After the user explicitly approves that exact preview, invoke the same
package-local entry with the returned fingerprint. The only project effects
may be:

- creation of `.navi/project-map.md`; and
- creation or bounded update of the Navi managed block in `AGENTS.md`.

The Map must be written before the managed trigger. Existing path, symlink,
freshness, fingerprint, and partial-activation protections remain active.

### 5. Second Fresh Task

Start a second fresh task in the initialized temporary project and ask:

> 这个项目接下来应该做什么？

Navi should use the confirmed Project Map directly, answer in the prompt's
language, and avoid repeating installation or initialization.

This second task closes the product-value loop. A successful write without
subsequent useful project-local activation is not a calibration pass.

### 6. Restore And Close

After evidence capture, restore the original marketplace source, installed
Navi version, and enabled state with official Codex commands. Confirm the
restored state against the preflight record.

On success, the calibration contract may preauthorize deletion of only the
exact temporary directory it created after evidence is captured. On failure,
retain the temporary directory for diagnosis and require a separate decision
before deletion. Never delete or rewrite the original `sub_ag_ski` project.

## Acceptance Model

### Distribution And Activation

All of these are required for `Distribution: PASS`:

1. The Git-backed marketplace resolves the exact pushed candidate.
2. Codex exposes and installs the expected Navi plugin identity.
3. A fresh task can use installed Navi without the source checkout, `npm link`,
   bare `navi`, or a manually supplied cache path.
4. The natural progress prompt enters Navi onboarding without naming Navi.
5. The installed package-local init entry renders a read-only preview.
6. No project write occurs before exact user approval.
7. The approved write changes only the Project Map and Navi managed trigger.
8. A second fresh task uses the confirmed Map without reinitialization.
9. Global Codex plugin and marketplace state is restored successfully.

Failure of any required item means Distribution feasibility has not passed.
An explicit Navi prompt, source-checkout command, direct cache invocation, or
manual project write may diagnose a failure but may not be counted as success.

### Guidance Quality

Assess guidance separately:

- whether the candidate Map cites real project evidence;
- whether Current Boundary and Next Decision are plausible;
- whether the response invents state, over-reads, or over-narrates; and
- whether the second-task answer gives the user useful control.

Guidance observations do not automatically fail Distribution. Mark the whole
calibration failed only when the guidance is materially false or unsafe enough
that the user should not approve initialization.

The final result may therefore be:

```text
Distribution: PASS
Guidance quality: needs improvement
```

This separation prevents a wording issue from causing repeated installation
tests while preserving a hard failure for misleading project judgment.

## Evidence Package

Capture only evidence needed for the decision:

- exact integrated and installed commit identity;
- Codex version and non-secret preflight state summary;
- marketplace-add and plugin-install outcomes;
- proof that the init entry came from the installed package;
- the first natural prompt and whether it triggered onboarding;
- the pre-approval target file inventory;
- preview fingerprint and declared write set;
- the actual approved file delta;
- the second fresh-task prompt and activation result;
- Distribution and Guidance quality conclusions; and
- restoration confirmation.

Do not store authentication tokens, complete user configuration, unrelated
project content, or cache data that is not needed to establish package origin.
One decisive run is enough. Do not repeat the journey merely to collect a
second green transcript.

## Stop Conditions

Stop and return to the Main Thread when:

- pushing the integrated commit is required;
- global marketplace or plugin mutation has not been explicitly authorized;
- current global state cannot be restored deterministically;
- installed behavior requires a new runtime, Bootstrap Installer, dependency,
  or design change;
- actual writes differ from the exact preview;
- the natural entry fails and further diagnosis would change state or scope; or
- the result requires user acceptance of product or operational risk.

Do not stop for ordinary read-only inspection, fresh-task creation, preapproved
official plugin commands, exact temporary-copy operations, or evidence capture
inside the accepted contract.

## Result Routing

Classify a failure at the smallest responsible boundary:

- Git marketplace resolution;
- plugin installation or enablement;
- installed skill activation;
- package-local Node or entry resolution;
- init preview or write safety; or
- guidance quality.

A failure returns to Design mode for the smallest supported correction. It does
not automatically authorize implementation.

A pass permits design of the local-marketplace dual-channel calibration. It
does not declare Product Complete, Distribution Ready, Release Ready, stable
`1.0`, Public Plugin Directory acceptance, update/rollback support, or
cross-platform support.

## Explicit Non-Goals

This calibration does not include:

- the local-marketplace bundle path;
- GitHub Release ZIP or checksum generation;
- update, rollback, or uninstall testing;
- Linux, WSL, native Windows, or a platform support matrix;
- Public Plugin Directory submission;
- npm publication or a Bootstrap Installer;
- Runtime Surface, UI, MCP, background services, or other-agent support;
- full repository tests or release verification; or
- automatic merge, push, tag, release, publication, or product-risk acceptance.
