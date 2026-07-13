# Navi Confirmed Project Map And Initialization Journey Design

## Status

Approved product design. This document does not approve implementation, a new
worktree, target-project writes, full-suite verification, release preparation,
tagging, publication, runtime UI, background automation, Memory v2, other-agent
adapters, delegation, or general write delegation.

Implementation requires a separate plan and must begin only after the active
bootstrap remediation has passed parent review and been integrated, because
both efforts touch `navi init` and `navi doctor`.

## Summary

Navi should initialize a project only after the user has confirmed enough
navigation baseline to create a truthful Project Map. A successful
initialization writes two project-local artifacts under one preview and one
approval:

```text
AGENTS.md               = when Navi should engage and when it should stay quiet
.navi/project-map.md    = the confirmed navigation baseline for this project
```

The Project Map combines route and current navigation state. Navi does not
create a provisional map and does not create a separate Project State file.
Existing roadmaps, plans, trackers, and status files remain project evidence;
Navi references them but does not adopt or rewrite them as its own map.

Codex owns evidence interpretation, guided baseline formation, candidate
judgment, and user confirmation. The CLI owns schema validation, exact preview,
conflict detection, preview-to-write binding, and safe project-local writes.

## Product Problem

The current alpha can add a trigger and draft a provisional map from repository
evidence. That is insufficient for an empty or ambiguous project and can create
the false impression that Navi is initialized even though it does not know:

- what outcome the user wants;
- how far the project is from that outcome;
- what stage the project is in;
- when the current loop should stop; or
- what decision follows that boundary.

A second Project State file also duplicates judgments already needed in the
Project Map. The result is more files, more synchronization rules, and less
clarity about which record is authoritative.

The product should instead create one confirmed, human-readable navigation
record only when the baseline is good enough to be useful.

## Product Decisions

1. Navi is installed globally once. `navi init` configures a project; it does
   not install Navi again.
2. `.navi/project-map.md` is always the canonical Navi Project Map.
3. Existing project roadmaps and plans are evidence, not alternate Navi Map
   locations.
4. Initialization requires a user-confirmable navigation baseline.
5. Evidence shortage leads to guided baseline formation, not rejection and not
   a provisional write.
6. Initial trigger and Map creation use one preview and one approval.
7. The Map is a normal project-owned file. Navi does not automatically stage,
   commit, push, or edit `.gitignore`.
8. The Map is updated only when navigation judgment changes materially.
9. Answers adapt to the current request and do not repeat the full stored Map by
   default.
10. The current prompt language controls the response language. Saved Map
    language is evidence, not an output-language instruction.

## Relationship To Earlier Designs

This design supersedes these earlier product directions where they conflict:

- alpha.13 provisional Project Map creation during `navi init`;
- the public `navi init --suggest-map` product surface;
- alpha.14's separate `.navi/state.md` Project State;
- new-project defaults under `docs/along/project-maps/`; and
- any guidance that treats a trigger without a confirmed Map as successful
  reliable initialization.

Useful alpha.10 and alpha.14 rules move into the unified Map contract:

- user confirmation before the first durable write;
- preview before an otherwise unauthorized Map update;
- current evidence may challenge stale saved judgment;
- updates happen only at meaningful navigation boundaries;
- no automatic Git actions; and
- uncertain inference is never silently written as fact.

Historical documents remain evidence of prior decisions until implementation
updates the active product documentation. This spec is authoritative for the
new journey.

## Canonical Project Map

### Location And Ownership

The canonical path is always:

```text
.navi/project-map.md
```

Navi does not search for an arbitrary existing file and declare it to be the
Project Map. A project may also contain `ROADMAP.md`, implementation plans,
issue trackers, handoffs, or status records. Those files retain their existing
ownership and purpose. The Project Map cites them as evidence and stores only
the navigation judgments Navi needs.

This deliberate extra file avoids:

- modifying team-owned roadmap formats;
- confusing a feature roadmap with current supervision state;
- making `navi doctor` understand arbitrary document structures;
- ambiguous update authorization; and
- uncertainty about which record fresh sessions should read.

### Version Control Policy

The Map is an ordinary project file. The target project's existing policy
decides whether it is tracked in Git. Navi never automatically:

- stages it;
- commits it;
- pushes it;
- adds or removes it from `.gitignore`; or
- changes repository governance to accommodate it.

The Map must not contain credentials, secrets, private conversation excerpts,
or copied source material beyond the minimum evidence references needed for
navigation.

### Minimal Metadata

Every valid Map begins with:

```yaml
---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-13
---
```

Rules:

- `navi_map` is the document contract version.
- `map_status` is `confirmed`. Draft or provisional Maps are not stored in the
  target project.
- `project_status` is `active`, `paused`, or `closed`.
- `last_confirmed` is an ISO calendar date.
- Unknown future contract versions are not rewritten automatically.

Metadata identifies the document and its lifecycle. Project meaning remains in
human-readable Markdown rather than moving into YAML or JSON.

### Stable Section Anchors

The Map uses stable hidden anchors and natural-language headings. Example:

```markdown
<!-- navi:desired-outcome -->
## Desired Outcome

<!-- navi:current-position -->
## Current Position
```

The required anchors are:

```text
navi:desired-outcome
navi:route-to-outcome
navi:current-position
navi:current-boundary
navi:next-decision
navi:evidence-and-uncertainty
```

`navi:parallel-lanes` is optional and appears only when parallel work affects a
real decision or is likely to survive across sessions.

Anchors are machine-stable. Headings and body text may use the project's
language. Changing a heading does not invalidate the Map. Duplicate, missing,
or out-of-order required anchors are invalid and receive a diagnostic rather
than automatic repair.

### Required Judgments

The Map contains six judgments:

1. **Desired Outcome**: the user's original need or vision and what level counts
   as complete.
2. **Route To Outcome**: the major stages between the current state and that
   outcome.
3. **Current Position**: the current stage, what is already sufficient, and what
   remains.
4. **Current Boundary**: how far the active loop is authorized to go and what
   condition should stop it.
5. **Next Decision**: the next real choice after the current boundary, not a
   generic next action.
6. **Evidence And Uncertainty**: the smallest local sources and unresolved
   judgments supporting the Map.

When present, **Parallel Lanes** records only:

- purpose;
- status;
- return condition; and
- affected decision.

It is not a worker log or worktree inventory.

### Layered Density

The Map is compact but not subject to a hard one-screen file limit.

The opening navigation summary should normally fit in about one screen and
contain Desired Outcome, Current Position, Current Boundary, and Next Decision.
Route detail, evidence, uncertainty, and optional parallel lanes follow.

The Map must not accumulate ordinary edits, test runs, commits, pushes, command
transcripts, or temporary task status. Those facts belong in their existing
project sources unless they change navigation judgment.

The stored structure is not a required response template. Navi renders only the
parts useful for the current question.

## Initialization Eligibility

### Minimum Baseline

Initialization becomes eligible when Navi can present a user-confirmable answer
for all of these:

- desired project outcome;
- broad route or working rhythm;
- current position; and
- next real decision or current stop boundary.

Project files are not mandatory evidence. Current user confirmation is valid
evidence, so a new project can become eligible before code exists.

Eligibility does not require complete product planning, precise estimates, or a
fully decomposed backlog. It requires enough navigation baseline that a fresh
session will not pretend certainty from an empty trigger.

### Guided Baseline Formation

If the baseline is incomplete, Navi does not write and does not ask the user to
fill a blank form. It:

1. names one missing key judgment;
2. proposes a candidate answer from current evidence;
3. asks one focused question;
4. lets the user confirm or correct the candidate; and
5. repeats only until the minimum baseline is confirmable.

This is a conversational Codex behavior, not a terminal wizard.

The user may stop or decline at any time. Navi then continues best-effort
read-only supervision, does not write project files, and does not repeat the
same initialization reminder in that session.

## End-To-End Initialization Journey

1. The global Navi installation provides skill/plugin capability without
   changing a project.
2. The user raises a broad supervision need in a project that lacks local Navi
   guidance.
3. Codex reads the minimum local evidence and runs the eligibility assessment.
4. If needed, Guided Baseline Formation obtains user-confirmed judgments.
5. Codex renders a complete candidate Project Map in the current prompt
   language unless the user requests another saved language.
6. Navi previews the exact `AGENTS.md` managed-block action and exact
   `.navi/project-map.md` action together.
7. One user approval authorizes both project-local writes.
8. Navi writes the Map first and activates its `AGENTS.md` trigger last.
9. A fresh project session can now read the fixed Map and answer ordinary broad
   supervision questions without source-thread history.

There is no provisional Map stage and no separate Project State creation step.

### Activation-Last Failure Model

Initial application writes the validated Map before the trigger. The trigger is
the activation artifact and is written last.

If Map writing fails, the trigger is unchanged. If trigger writing fails after
the Map succeeds, the project has an inactive confirmed Map but does not claim
successful initialization. Navi reports the partial result; `navi doctor`
classifies it as `map-ready / trigger-missing` and offers a new preview. Navi
does not delete or roll back a file after ownership becomes uncertain.

This ordering is deliberately simpler and safer than adding another broad
cross-file transaction system.

## Codex And CLI Responsibilities

### Codex Adapter

The Codex-first adapter owns:

- deciding when a broad supervision need justifies an initialization check;
- bounded evidence discovery;
- eligibility assessment;
- Guided Baseline Formation;
- candidate Map reasoning and rendering;
- user confirmation;
- creation and cleanup of a private project-external candidate file; and
- passing the approved plan back to the CLI writer.

The adapter does not treat repository heuristics as user confirmation.

### `navi init`

The CLI owns deterministic behavior:

- canonical target-root resolution;
- input and target path safety;
- Map metadata and anchor validation;
- managed-block recognition;
- exact action planning;
- preview rendering;
- preview-to-write binding;
- pre-write revalidation; and
- activation-last project-local writes.

The integration form is:

```text
navi init --map-file <private-candidate-path>
navi init --map-file <private-candidate-path> --expect-plan <fingerprint> --write
```

The first command is read-only. Its fingerprint binds:

- the exact candidate Map bytes;
- canonical target root;
- current `AGENTS.md` bytes or absence;
- current Project Map bytes or absence;
- planned actions; and
- the relevant init contract version.

The write command recomputes the fingerprint. Any candidate or target drift
causes a nonzero refusal and a new preview. The fingerprint prevents accidental
preview/write drift; it is not cryptographic source attestation.

The candidate file is outside the target project, private to the current
invocation, and removed by the Codex adapter after success or explicit
abandonment. No persistent plan file is written into the project.

### Direct Manual Invocation

Running `navi init` without a confirmed Map payload is a read-only diagnostic.
It does not create a trigger or provisional Map. It explains the missing
confirmed baseline and gives one short next action: use Navi in the current
Codex project session to form and confirm the Project Map.

If a valid confirmed Map already exists but the trigger is missing, direct
invocation may preview trigger activation without requiring a new Map payload.
It still requires `--expect-plan` and `--write` for the durable change.

### Suggested Map Evidence

`navi init --suggest-map` leaves the public product surface. Its bounded local
evidence discovery may remain as an internal adapter/library capability.

The internal scanner may identify candidate evidence files and project-shape
signals. It must not present its heuristic output as a confirmed Map or make it
directly writable.

### `navi doctor`

Doctor distinguishes at least:

- `not-initialized`: trigger and Map absent;
- `map-ready / trigger-missing`: valid confirmed Map without activation;
- `trigger-orphaned / map-missing`: trigger claims Navi but Map is absent;
- `map-invalid`: metadata, version, anchors, or path are unsafe or invalid;
- `trigger-invalid`: managed trigger is edited, duplicate, incomplete, or
  unknown; and
- `healthy`: recognized trigger and valid confirmed Map are both present.

Doctor is read-only. It reports the smallest next repair and never silently
creates, rewrites, deletes, stages, or commits project files.

## Daily Supervision Behavior

### Quiet Execution

For a clear, bounded execution request, Navi stays quiet and Codex continues to
the approved boundary. Ordinary task completion, tests, commits, pushes, and a
still-running worktree are not automatic user decision points.

### Adaptive Supervision

For broad progress, plan-reliability, stop, wait, confusion, or vision-distance
questions, Navi reads the Map and the minimum current evidence needed to detect
material change.

It renders the smallest useful subset:

- next-step questions emphasize Current Position and Next Decision;
- vision-distance questions expand Route To Outcome;
- over-validation questions emphasize Current Boundary and whether enough
  evidence already exists; and
- coordination questions include Parallel Lanes only when they change a
  decision.

Navi does not print all Map fields by default.

### Language

The current user prompt controls response headings, explanation, risk wording,
next steps, and approval questions by default. The stored Map may be written in
the project's language. Its language never forces the response language.

### Stale Or Conflicting Evidence

Fresh project evidence may challenge a confirmed Map. Navi does not silently
let either source dominate. It:

1. identifies the specific challenged judgment;
2. answers from the strongest currently verifiable evidence;
3. states the uncertainty when it affects navigation; and
4. proposes a Map update only at a meaningful boundary.

## Map Maintenance And Authorization

Map updates are considered only when one of these changes materially:

- desired outcome;
- route or working rhythm;
- current project stage;
- current stop boundary;
- next real decision;
- project lifecycle status; or
- a decision-relevant parallel lane.

Tests, commits, pushes, ordinary implementation progress, and short-lived
blockers do not trigger Map updates.

The initial Map write always requires a dedicated preview and approval. Later
updates use bounded authorization:

- if an already approved write scope explicitly covers project documentation or
  Map maintenance, Navi may include the smallest Map patch in that scope;
- otherwise Navi waits for a meaningful boundary, previews the patch, and asks
  for approval; and
- rejection leaves the saved Map unchanged and does not cause repeated prompts.

This reuses explicit scope; it is not general write delegation. This design does
not add a `navi map update` command. Authorized maintenance remains an ordinary
Codex project-file edit governed by the Map contract.

## Parallel Work

Main-session design may continue while an implementation worktree performs
non-conflicting work. Worktree completion creates a review-ready event, not an
automatic interruption.

Navi records a parallel lane only when it is decision-relevant and likely to
survive across sessions. A finished worktree should interrupt the current
conversation only when its result can change the decision presently being
made. Otherwise it remains available for the next natural review boundary.

## Project Lifecycle

### Active

`project_status: active` means the project is advancing. The Map identifies the
current boundary and next decision.

### Paused

`project_status: paused` means the project remains valid but is intentionally
not advancing. The Map states:

- why it is paused;
- the return condition; and
- the first decision required on return.

Navi does not treat intentional inactivity as a blocker or repeatedly urge the
user to resume.

### Closed

`project_status: closed` records:

- whether the desired outcome was achieved, partly achieved, cancelled, or
  replaced;
- the closure outcome;
- deliberately unfinished work; and
- what must be re-evaluated before reopening.

Closed projects keep their Map and trigger by default as a decision record.
Navi stays quiet and does not recommend continuing the old route. Cleanup occurs
only on an explicit user request.

### Reopening

Reopening does not trust the old Current Position as current fact. Navi checks
new evidence, presents a compact reopening preview, and changes
`project_status` to `active` only after confirmation or within an explicit
authorization that covers the lifecycle change.

## Missing, Invalid, And Unsafe States

- **Trigger present, Map missing:** report incomplete initialization; do not
  regenerate automatically.
- **Map present, trigger missing:** treat the Map as inactive; offer trigger
  activation preview.
- **Invalid metadata or anchors:** preserve the file, refuse confident Map use,
  and offer a minimal repair preview.
- **Unknown contract version:** preserve and refuse automatic rewrite.
- **Map conflicts with evidence:** challenge the affected judgment without
  silent update.
- **Manual user edits:** accept them when metadata and anchors remain valid;
  headings and prose need not match generated template bytes.
- **Ambiguous target root:** show the candidate root and require confirmation
  before planning writes.
- **Existing target file:** inspect and classify; never overwrite an unknown or
  unsafe file.
- **Symlink, non-regular file, or path escape:** fail closed and preserve the
  existing path.
- **User rejects repair or update:** continue best-effort read-only supervision
  and do not repeat the same request in the session.

## Implementation Architecture

The implementation should keep these boundaries independently testable:

1. **Project Map contract parser**
   Parses metadata and anchors and returns structured valid/invalid/unsupported
   results without interpreting project meaning.
2. **Init eligibility behavior**
   Lives in the Codex skill/adapter contract and distinguishes ready baseline,
   guided formation, and declined initialization.
3. **Init planner and writer**
   Accepts only a validated confirmed Map, produces deterministic actions and a
   fingerprint, revalidates, then applies Map-first/trigger-last.
4. **Doctor classifier**
   Combines independent trigger and Map states into truthful project status.
5. **Adaptive supervision behavior**
   Reads the confirmed Map and current evidence, then selects only the response
   elements needed for the current request.

The parser and deterministic CLI do not call a model. The Codex adapter does not
duplicate filesystem mutation logic.

## Delivery Sequence

1. Add the Project Map parser, metadata and anchor fixtures.
2. Change init planning to require confirmed Map input and add fingerprinted
   preview/write behavior.
3. Remove the public `--suggest-map` path while preserving bounded evidence
   discovery as an internal capability.
4. Extend doctor with combined trigger/Map classifications.
5. Update canonical and packaged Navi skill behavior for eligibility, guided
   baseline formation, adaptive daily supervision, lifecycle, and Map updates.
6. Update active init/product documentation and explicitly retire conflicting
   alpha.13/alpha.14 guidance.
7. Run bounded calibration in representative projects.

Implementation should use a new real worktree after bootstrap remediation is
integrated. It must not be added to the currently running bootstrap worktree.

## Validation Strategy

### Targeted Automated Tests

Cover:

- valid English and Chinese headings with stable anchors;
- missing, duplicate, out-of-order, and unknown-version Map contracts;
- direct init without payload remaining read-only;
- exact preview fingerprint and drift refusal;
- Map-first/trigger-last partial failure behavior;
- existing valid Map with missing trigger;
- trigger without Map;
- unsafe paths and unknown existing files;
- no public `--suggest-map` write path;
- doctor classifications; and
- canonical/package skill-contract synchronization.

Tests use temporary target roots and no real global Codex state.

### Behavioral Fixtures

Use deterministic fixtures, not live model calls, for:

- insufficient evidence leading to one-question guided formation;
- confirmed baseline becoming initialization-ready;
- clear bounded tasks staying quiet;
- broad questions selecting the relevant Map subset;
- current prompt language overriding saved Map language;
- stale evidence challenging but not silently rewriting the Map;
- routine progress not triggering maintenance; and
- active, paused, closed, and reopening behavior.

### Calibration

Use only a small number of real or temporary projects:

1. an empty project, proving Navi does not initialize without a baseline;
2. an active real project, proving guided formation creates a useful confirmed
   Map; and
3. a fresh session in an initialized project, proving ordinary broad prompts
   restore big-picture supervision.

Calibration observes usefulness. It is not a release checklist and does not
attempt to prove the full system correct.

During implementation, run changed-area tests only. Full tests, packaging
verification, tags, release notes, and publication require an explicit release
mode decision.

## Non-Goals

This design does not add:

- a runtime UI or local app;
- background scanning or an always-on watcher;
- npm publication or marketplace distribution;
- a global plugin installer inside `navi init`;
- arbitrary roadmap adoption;
- a terminal questionnaire wizard;
- stored provisional or draft Maps;
- a separate Project State;
- a `navi map update` command;
- automatic Map rewriting after tests, commits, or pushes;
- automatic Git staging, commits, pushes, or `.gitignore` changes;
- Memory v2;
- another-agent implementation;
- general write delegation; or
- rebranding `src/web` as the current Navi product.

## Risks And Mitigations

### Map Duplicates Project Planning

Mitigation: store only navigation judgments and cite existing project sources.
Do not copy full roadmaps, plans, or logs.

### Initialization Becomes Too Difficult

Mitigation: Codex proposes candidate answers one question at a time. The user
confirms or corrects instead of completing a wizard or schema.

### Map Becomes Another Rule Dump

Mitigation: keep the opening summary compact, store detail only when it supports
vision distance or a real decision, and render adaptively.

### Fingerprint Adds CLI Complexity

Mitigation: keep it an adapter integration detail. Normal users see one preview
and one approval, not the plumbing.

### Saved Judgment Becomes False Authority

Mitigation: current evidence may challenge the Map; uncertain conflicts are
surfaced and require confirmation before durable correction.

### Product Paths Leak Along History

Mitigation: all new Project Maps use `.navi/project-map.md`. Along paths remain
only in historical evidence and explicit migration context.

## Acceptance Criteria

The design is implemented successfully when:

1. a new project cannot be reported as reliably initialized without a valid
   confirmed `.navi/project-map.md` and recognized trigger;
2. insufficient evidence produces guided baseline formation without project
   writes;
3. initial creation uses one exact preview and one approval;
4. preview/write drift is refused;
5. no provisional Map or separate Project State is created;
6. existing roadmaps remain evidence and are not rewritten by initialization;
7. fresh sessions can find one canonical Map at a fixed path;
8. answers follow the current prompt language and use only the relevant Map
   subset;
9. ordinary execution does not produce Map churn or meaningless continuation
   gates;
10. meaningful updates reuse bounded authorization or request one real approval;
11. doctor truthfully distinguishes missing, partial, invalid, unsafe, and
    healthy states;
12. paused and closed projects do not generate unwanted continuation pressure;
13. no automatic Git action occurs; and
14. implementation validation remains targeted unless the user explicitly
    enters release mode.
