# Navi Outcome Boundary Design

## Status

Approved product design. This document defines a dual-boundary Project Map
capability for Codex-first Navi. It does not approve implementation, a new
worktree, target-project writes, calibration execution, migration, integration,
pushing, tagging, publication, or release preparation.

The active Adaptive Project Entry candidate remains independently bounded. This
design must not expand or invalidate that candidate while it is under review.
Any implementation begins only after an explicit plan and integration decision.

## Summary

Navi currently distinguishes the user's Desired Outcome, Current Position,
Current Boundary, and Next Decision. This helps a user understand when the
current stage should stop, but it does not always state what level of the whole
current goal is enough.

Navi should add an `Outcome Boundary` to the confirmed Project Map while
retaining the existing `Current Boundary`:

- `Outcome Boundary` defines when the whole current goal is sufficiently
  complete;
- `Current Boundary` defines when the current stage or loop should stop; and
- `Next Decision` defines what the user must decide after that stop.

The Outcome Boundary is a user-confirmed, evidence-backed working completion
hypothesis. New projects may use a provisional boundary with an explicit revisit
trigger. Mature projects may receive an evidence-first candidate. Navi must not
turn early uncertainty into a permanent contract or a detailed duplicate
roadmap.

## Product Problem

A non-expert user may understand what an agent is doing now and what the nearest
next step is while still lacking the larger completion judgment:

- what level of result is enough for the original need;
- how the current work contributes to that result;
- when the project can stop rather than move automatically into another phase;
- which attractive features remain outside the current goal; and
- what new evidence would justify changing the completion line.

Without an overall boundary, local supervision can still produce endless
momentum. Every completed stage creates another possible stage, and additional
tests or features can appear useful without changing the evidence needed for
the user's actual outcome.

An immutable boundary defined at project creation would create the opposite
problem. Early projects have limited evidence, uncertain users, and unresolved
product choices. False precision can lock the project into the wrong target.

Navi therefore needs a completion boundary that is mandatory enough to support
supervision and provisional enough to remain truthful during discovery.

## Product Decisions

1. Navi uses a dual-boundary model rather than overloading Current Boundary.
2. Every newly confirmed Project Map contains a minimum Outcome Boundary.
3. An Outcome Boundary may be provisional when evidence is insufficient, but
   the user must confirm it as the current working completion hypothesis.
4. The boundary contains four compact judgments: Enough Outcome, Acceptance
   Evidence, Outside This Boundary, and Revisit Trigger.
5. The boundary defines outcomes and evidence, not an implementation task list
   or a second roadmap.
6. Navi proposes two or three reasonable completion levels when an
   evidence-poor user cannot define one unaided.
7. Material evidence may trigger a boundary-change candidate, but only the user
   can approve the change.
8. Ordinary commits, tests, refactors, and task completion do not trigger
   boundary reconfirmation.
9. Existing Maps remain readable. New and subsequently approved writes use the
   new structure.
10. Missing Outcome Boundary is uncertainty to resolve, not Map corruption and
    not a reason to force reinitialization.
11. Outcome Boundary appears proactively only when it improves user control.
12. Reaching the boundary leads to a completion decision, not automatic
    creation of a successor phase.

## Dual-Boundary Model

The confirmed Project Map uses this conceptual order:

```text
Desired Outcome
Outcome Boundary
Route To Outcome / Working Rhythm
Current Position
Current Boundary
Next Decision
Evidence And Uncertainty
```

### Outcome Boundary

Outcome Boundary defines the completion line for the whole current goal. It
contains:

```text
Enough Outcome:
The user result that makes the current goal sufficiently complete.

Acceptance Evidence:
The real evidence that can support the completion judgment.

Outside This Boundary:
Capabilities or work explicitly excluded from the current completion line.

Revisit Trigger:
New information that requires the completion line to be reconsidered.
```

These are compact judgments inside one Map section. The design does not require
four new persistent files, a machine-readable state store, or a new runtime.

### Current Boundary

Current Boundary keeps its existing responsibility: the stopping condition for
the current Product Stage, Work Mode, or bounded loop. It must not silently
expand into the entire project definition of done.

### Next Decision

Next Decision describes the genuine user judgment after Current Boundary is
reached. It may be a stage transition, scope decision, completion decision,
risk acceptance, or approved correction. It must not be a disguised bare
`continue` prompt.

## Boundary Formation

### Mature Coherent Projects

Navi uses active project evidence to propose a complete Outcome Boundary
candidate before questioning the user. Likely evidence includes current
roadmaps, approved specifications, acceptance records, product-stage documents,
and current status records.

Navi asks only about unsupported or conflicting completion judgments. Code and
tests can support implementation and acceptance evidence, but they cannot choose
the user's Desired Outcome or silently define the desired product level.

### Conflicting Projects

When evidence supports incompatible completion lines, Navi presents:

- each material candidate and source;
- how the difference changes scope, route, and completion distance;
- a recommendation only when the evidence supports one; and
- the decision the user must confirm.

Modification time, file name, test count, or implemented code does not silently
choose the boundary.

### New Or Evidence-Poor Projects

Navi proposes two or three completion levels appropriate to the known outcome.
Examples may include:

- enough exploration to make a product-direction decision;
- a prototype that resolves the highest-risk assumption; or
- a V1 that a named target user can complete end to end.

The options must be concrete for the project and must state their trade-offs.
They are not a fixed Navi maturity ladder that every project must follow.

If the final route is unknown, the nearest exploration decision can be the
Enough Outcome. For example:

```text
Enough Outcome:
Identify the target user, verify the core problem in three interviews, and
choose whether to build a prototype.

Acceptance Evidence:
Interview notes plus one explicit product-direction decision.

Outside This Boundary:
Implementation, public distribution, pricing, and team administration.

Revisit Trigger:
The product-direction decision is made or the interviews contradict the assumed
problem.
```

Provisional means the user confirms the boundary as the current working line.
It does not mean Navi has proved the permanent final product boundary.

## Boundary Revision

Navi may propose a revised Outcome Boundary when:

- Desired Outcome or target user changes;
- the intended product level materially changes;
- new evidence invalidates an acceptance assumption;
- current work repeatedly crosses Outside This Boundary;
- the declared Revisit Trigger occurs; or
- the user explicitly asks to expand, narrow, or redefine the goal.

The proposal must show:

```text
Existing Boundary
Proposed Boundary
Reason For Change
Impact On Current Route And Completion Distance
Decision Required
```

The existing confirmed boundary remains authoritative until the user approves
the candidate. Navi must not infer approval from implementation momentum,
passing tests, or the user's acceptance of a different local action.

## Supervision Behavior

Outcome Boundary is silently tracked by default. Navi surfaces only the portion
that increases user control when:

- the user asks about progress or distance from the original goal;
- an agent proposes work outside the current completion line;
- verification continues without increasing Acceptance Evidence;
- Current Boundary is reached and a completion or stage decision is due;
- Enough Outcome appears satisfied;
- Revisit Trigger occurs; or
- the user asks whether the project can stop.

The boundary should support concise judgments such as:

```text
The current stage boundary is satisfied. The remaining public-distribution work
is outside this Outcome Boundary, so the next decision is whether to accept the
current goal as complete rather than begin another validation loop.
```

Navi must not print the complete boundary on every turn, use it to obstruct
clear bounded execution, or treat every attractive future feature as scope
drift.

## Completion And Error Handling

At a completion decision:

- if Acceptance Evidence is sufficient, Navi recommends closure, records
  accepted Minor debt, and enters a quiet state;
- if evidence is insufficient, Navi names the missing evidence rather than
  inventing more features;
- if a Critical or Important issue remains, Navi identifies the concrete
  blocker;
- if the boundary is no longer credible, Navi requests a boundary decision
  before declaring completion; and
- if only outside-boundary work remains, Navi presents it as a future option
  rather than an automatic successor phase.

Outcome Boundary is not a professional correctness guarantee. In legal,
medical, financial, engineering, or other high-risk work, Acceptance Evidence
may require qualified review. Navi cannot substitute its own completion
judgment for that review.

## Compatibility And Migration

The migration policy is `read-compatible, write-new`:

- a structurally valid existing Map without Outcome Boundary remains readable;
- Navi reports that overall completion is not yet confirmed only when that
  missing judgment affects the current supervision request;
- the next approved Map candidate includes Outcome Boundary;
- new initialization candidates require Outcome Boundary;
- declining the addition leaves read-only supervision available and suppresses
  repeated reminders in the same session; and
- no automatic rewrite, reinitialization, commit, push, or background migration
  occurs.

Doctor or init behavior must distinguish a legacy-readable Map from a damaged
or unsupported Map. Missing Outcome Boundary alone must not cause destructive
repair guidance.

## Implementation Boundary

Implementation begins only after Adaptive Project Entry has completed its own
independent validation and integration decision. The bounded implementation may
touch:

- canonical and packaged Project Map contracts;
- Adaptive Entry confirmable-baseline behavior;
- `navi init` preview, fingerprint, and legacy-Map compatibility;
- supervision behavior for vision distance, scope drift, over-validation, and
  closure;
- focused CLI, skill, repository, and package-mirror tests; and
- current truthful documentation.

It must not add a runtime, database, background watcher, second Map file, new
project-entry command, automatic target-project write, global mutation, release
work, or other-agent support.

## Calibration

Natural calibration should reuse the Codex-first Product Complete evidence
portfolio:

1. add an Outcome Boundary candidate to one existing legacy-readable Map without
   forcing reinitialization;
2. form one provisional Outcome Boundary in a new or evidence-poor project;
3. identify one real outside-boundary expansion or low-value verification loop;
   and
4. use Acceptance Evidence to support one natural closure and quiet state.

Success means the user gains a visible completion line without having to manage
a second roadmap or repeatedly reconfirm the same boundary. Calibration should
measure interruption cost as well as correctness.

## Non-Goals

- A complete roadmap, backlog, or feature checklist generated at project start.
- An immutable contract that prevents exploration or product learning.
- A universal maturity ladder for every project type.
- Automatic scope enforcement or refusal to perform approved boundary changes.
- A new database, daemon, queue, scheduler, local app, or runtime UI.
- Automatic migration, project writes, commits, pushes, releases, or
  publication.
- Requiring all existing projects to rerun `navi init` immediately.
- Expanding current support beyond Codex.

