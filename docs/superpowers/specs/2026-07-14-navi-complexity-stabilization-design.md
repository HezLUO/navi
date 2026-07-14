# Navi Complexity Stabilization Design

Date: 2026-07-14

Status: Approved in design discussion on 2026-07-14

## Summary

Navi should pause new product-capability work after the Confirmed Project Map
journey is integrated and the approved Lane Handoff implementation is complete.
It should then run one bounded complexity-stabilization phase before resuming
product expansion.

This phase is not a rewrite, release, or indefinite cleanup program. It creates
clear ownership and engineering boundaries around the current Codex-first Navi
product, freezes historical Along code as read-only evidence, reduces prompt and
test maintenance density, and establishes an explicit stop point.

The product behavior should remain unchanged. Stabilization succeeds when Navi
can evolve without routinely touching historical Along code, duplicated rules,
or oversized mixed-responsibility modules.

## Why This Phase Exists

Navi has a coherent product wedge: Codex supervision through skill and plugin
behavior, project-local guidance, Project Maps, and `navi init`. It also has
strong installation safety and targeted validation. The primary complexity
risk is not currently an unmaintainable algorithmic core. It is accumulated
surface area:

- active Navi code shares a package, build, dependencies, and tests with
  historical Along runtime, MCP, server, and web code;
- supervision behavior is concentrated in a large reference document and
  mirrored package files;
- `navi init` has accumulated command rendering, evidence discovery, map
  handling, transaction safety, and template generation responsibilities;
- many tests assert repeated prose rather than stable behavior; and
- design history is extensive but lacks a single active/superseded/historical
  navigation model.

Continuing to add capabilities on top of these conditions would increase the
cost of every later product decision. The stabilization phase addresses that
cost before adding another supervision concept.

## Product Sequence

The intended sequence is:

1. Integrate the Confirmed Project Map journey after parent review and explicit
   merge approval.
2. Implement the separately approved Lane Handoff contract.
3. Pause new product capabilities.
4. Execute this bounded complexity-stabilization design.
5. Calibrate the stabilized current product in two or three real projects.
6. Resume product planning using calibration evidence.

The deferred Codex-first Policy Kernel, runtime UI, Memory v2, other-agent
adapters, and distribution expansion do not move ahead merely because they are
non-conflicting or already have design material.

## Goals

The stabilization phase has five goals:

1. Make the Current Navi product surface unambiguous in the repository.
2. Remove Historical Along from Navi's default installation, build, typecheck,
   test, and dependency surfaces.
3. Give active CLI modules and supervision rules one clear responsibility and
   one authoritative source.
4. Reduce test maintenance caused by duplicated prose without weakening the
   important user journeys and safety contracts.
5. Define a measurable exit point and a lightweight gate against renewed
   complexity growth.

## Non-Goals

This phase does not:

- add runtime UI, a background watcher, Memory v2, relationship modes,
  delegation, write delegation, or another agent adapter;
- redesign Navi's user-facing installation or distribution journey;
- publish to npm, enter a public marketplace, tag, release, or modify release
  promises;
- rebrand Historical Along code as current Navi capability;
- preserve Historical Along as a supported runnable subsystem;
- extract Navi into a new repository or public package architecture;
- implement the full Codex-first Policy Kernel;
- rewrite working code solely for stylistic consistency;
- use total line-count reduction, test-count growth, or coverage growth as the
  success measure; or
- continue cleanup indefinitely after the exit conditions are met.

Removing unused historical dependencies from the default Navi install is in
scope. Designing a new one-command install, npm publication, or marketplace
distribution remains part of the later Distribution and Trust stage.

## Repository Zones

The repository has three explicit zones after stabilization.

### Current Navi

This is the only supported product surface. It includes:

- Navi CLI commands and their active domain and environment adapters;
- the canonical Navi skill and its packaged plugin mirror;
- active `docs/navi` user and operator documentation;
- release history and current package verification; and
- tests for current Navi behavior.

The root `package.json`, default build, default typecheck, default test command,
and installation dependencies serve this zone only.

### Historical Along Evidence

Historical Along runtime, MCP, server, web, related tests, and product-specific
documents move into an explicitly named historical or archive area. They are
preserved for traceability and future design evidence, with their original
Along identity intact.

The archive is read-only product evidence:

- it is not part of current Navi installation or packaging;
- it is not imported by Current Navi;
- it is not typechecked, built, or tested by default;
- it carries no compatibility or runnable-subsystem promise; and
- its archive notice directs readers to the Current Navi entry point.

The stabilization implementation may move files mechanically, but it does not
repair, modernize, rename, or re-platform archived code.

### Design History

Specs, plans, calibration logs, product debt, roadmaps, and release records
remain available for product reasoning. A concise index classifies relevant
documents as:

- `active`: still authoritative for the current product;
- `superseded`: replaced by a named later decision; or
- `historical`: retained as context but not an active requirement.

Status classification is navigation metadata, not a demand to rewrite every
historical document.

## Current Navi Internal Boundaries

### CLI Responsibilities

The active CLI follows four responsibilities without introducing a framework:

1. **Command** parses arguments, selects a command, renders output, and maps
   results to exit codes.
2. **Journey** coordinates user flows such as global setup, doctor, and project
   initialization.
3. **Domain** owns Project Map, evidence, fingerprint, installation, and
   transaction rules that can be understood without CLI prose.
4. **Adapter** performs filesystem, Git, Codex Home, and other external
   environment access.

A Journey may compose Domain and Adapter units. Domain units do not depend on
command output text or Codex desktop tool shapes. Command units do not make
product-domain judgments.

`navi-init` becomes an orchestration boundary rather than the owner of evidence
discovery, Project Map semantics, write transactions, trigger prose, and all
presentation details. No arbitrary file-length limit is required; a file is
split when it has more than one independent reason to change.

### Supervision Rule Responsibilities

The canonical `SKILL.md` remains a concise trigger and routing entry point.
Focused references own Project Map interpretation, supervision judgment,
project lifecycle, lane coordination, and authorization boundaries. A response
loads only references relevant to the current request rather than requiring the
entire supervision rulebook for every turn.

The project trigger has one canonical template. The packaged plugin is a
controlled mirror of canonical skill sources and is never an independently
edited rule source. Deterministic verification may enforce mirror equality.

Specs explain why a rule exists, but runtime skill behavior and generated
project guidance do not depend on searching design-history documents.

This phase establishes ownership and seams only. It does not introduce a new
rule registry, deterministic supervision engine, public contract SDK, or full
Policy Kernel.

## Test Boundaries

Tests align with the responsibility that owns the behavior:

- Domain tests validate structured input, output, invariants, and failure
  states.
- Journey tests exercise user-visible command flows and guarded writes.
- A small capability-truthfulness suite prevents Navi from claiming runtime,
  delivery, or installation capabilities it does not implement.
- Package verification checks canonical and packaged source agreement.
- Prose assertions are retained only when exact wording is itself a safety or
  product contract.

Repeated paragraph-level `toContain()` assertions that only make wording
changes expensive should be consolidated or removed after equivalent behavior
or ownership coverage exists. Stabilization must not weaken authorization,
transaction safety, language-following, Project Map, Lane Handoff, or honest
capability boundaries.

## Implementation Tranches

The work is divided into five bounded tranches.

### 1. Establish The Active Surface Inventory

Classify current files and record the user-visible behavior that must remain
stable. Resolve uncertain ownership before moving files; do not copy a file
into both active and historical zones as a shortcut.

### 2. Isolate Historical Along

Move historical source, tests, and supporting documents into the archive.
Remove their scripts and dependencies from Current Navi defaults. Add an
archive notice and enforce that active modules do not import archived code.

Mechanical moves should be separate from active behavior refactors so review
can distinguish relocation from semantic change.

### 3. Clarify Rule And Document Ownership

Create the active document index, classify superseded and historical material,
split the oversized supervision reference by responsibility, and make the
canonical-to-packaged direction explicit.

### 4. Decompose Current Navi Hotspots

Move active CLI responsibilities behind the Command, Journey, Domain, and
Adapter boundaries. Preserve command names, output contracts, exit semantics,
write ordering, and authorization behavior.

### 5. Reduce Test Maintenance And Calibrate

Replace redundant prose-presence checks with focused domain, journey, and
capability-truthfulness coverage. Run a bounded active-Navi suite, then observe
the stabilized product in two or three real target projects.

Calibration asks whether Navi remains understandable, quiet, truthful, and
useful. It is not a release checklist or an attempt to prove the whole system
correct.

## Migration And Failure Handling

Each tranche has a reviewable acceptance point. If a tranche reveals an active
dependency on Historical Along, the implementation pauses that move and
classifies the dependency; it does not add a compatibility shim or silently
duplicate the code.

If a proposed decomposition changes user-visible behavior, command output,
authorization, map semantics, or installation requirements, that change is
treated as a separate product decision rather than folded into stabilization.

Historical links and active documentation references are updated with the
mechanical move. Permanent compatibility branches and duplicate authoritative
documents are prohibited. Git history remains the recovery mechanism for
archived locations.

Commits should keep mechanical relocation, active refactoring, rule migration,
and test consolidation distinguishable. This is a review aid, not a requirement
for user approval after every local commit in an already authorized plan.

## Verification Budget

Verification remains proportional to each tranche:

- run changed-area tests and `git diff --check` for every tranche;
- run typecheck only when the active TypeScript boundary changes;
- run package verification when canonical or packaged plugin sources change;
- run one bounded Current Navi integration suite at the end; and
- do not run Historical Along's former full suite by default.

This implementation mode does not automatically escalate to release mode. Full
release verification, tags, pushes, publication, and GitHub Release work require
separate explicit authorization.

## Exit Conditions

The stabilization loop closes when all of these conditions hold:

1. Root package scripts, dependencies, build, typecheck, and default tests
   describe Current Navi rather than Historical Along.
2. Current Navi imports no archived code.
3. The Historical Along archive clearly states its evidence-only status and
   carries no supported-runtime promise.
4. Active documentation has one entry point and relevant design history is
   navigable as active, superseded, or historical.
5. Skill, trigger, and packaged mirror responsibilities have one authoritative
   direction.
6. Active CLI units can be changed and tested by responsibility without
   understanding an unrelated whole-product module.
7. Global setup and doctor, confirmed Project Map initialization, language
   following, authorization boundaries, and Lane Handoff retain their approved
   behavior.
8. Two or three real-project calibrations show no material behavior regression
   or new installation burden.
9. Remaining cleanup is recorded as ordinary debt and does not block the next
   product-design stage.

Meeting these conditions ends the phase. The team does not continue refactoring
merely because further aesthetic cleanup is possible.

## Complexity Regression Gate

After stabilization, a Codex-initiated new capability or cross-boundary change
answers six lightweight questions before implementation:

1. What user problem does the capability solve?
2. Which existing active module and rule owner should contain it?
3. Does it introduce a second state, rule, or template authority?
4. Does it depend on Historical Along?
5. What is the minimum sufficient verification, and why?
6. Is the user value worth the additional concept and maintenance surface?

This gate is qualitative and does not use numeric scoring. It does not run for
ordinary conversation, local wording changes, or bounded bug fixes. Being
non-conflicting or easy to parallelize makes a lane eligible; it does not prove
that the lane has sufficient priority or product value.

## Success Criteria

The design is successfully implemented when Current Navi is the only default
product surface, Historical Along is preserved without remaining an implicit
maintenance obligation, active rules and modules have clear ownership, and the
team can resume product design without immediately returning to a testing or
refactoring loop.
