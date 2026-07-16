# Navi Adaptive Project Entry Design

## Status

Approved product design. This document does not approve implementation, a new
worktree, target-project writes, full-suite verification, release preparation,
tagging, publication, runtime UI, a background scanner, a database, or a second
project-initialization command.

Implementation requires a separate implementation plan and explicit approval.
The first calibration should use a mature real project. A new or evidence-poor
project should follow afterward as a separate calibration of the fallback path.

## Summary

Navi should expose one project-entry experience for both mature and new
projects:

```text
natural supervision question or navi init
-> project-local Navi state check
-> bounded evidence scan
-> Evidence Profile
-> adaptive baseline formation
-> one confirmed Project Map preview
-> one fingerprint-bound approved write
-> fresh-session supervision
```

The user does not choose between a new-project flow and a mature-project flow.
Navi selects an internal baseline-formation strategy from available evidence:

- mature projects receive an evidence-first candidate;
- conflicting projects receive a focused direction decision;
- evidence-poor projects receive Guided Baseline Formation; and
- apparently stale evidence may receive a targeted code check.

Both paths converge on the existing `.navi/project-map.md` contract, managed
`AGENTS.md` trigger, preview, fingerprint, write ordering, and fresh-session
acceptance behavior. The design adds an evidence-classification and routing
contract, not a second installation mechanism.

## Product Problem

Most users are likely to adopt Navi in an existing project with code, plans,
status records, and partially conflicting history. A new project has the
opposite problem: it may have a desired outcome but no reliable route or status
evidence. Treating both projects as if they have the same evidence either makes
mature-project initialization unnecessarily interrogative or makes new-project
initialization invent a false map.

Separate user-facing entrypoints would reduce implementation ambiguity but add
the wrong burden. Users may not know whether their project is "new" or
"mature," and many projects sit between those categories. Navi should own the
evidence judgment while preserving user authority over project direction.

## Product Decisions

1. Navi has one user-visible project-entry journey.
2. The internal baseline strategy adapts to a bounded Evidence Profile.
3. Users do not classify their project before Navi can help.
4. Direction conflicts always return to the user; recency and fixed file order
   do not silently determine authority.
5. Repository code is checked only when documents are insufficient,
   contradictory, or apparently stale.
6. Existing roadmaps, specs, trackers, and code retain their domain ownership.
   The confirmed Project Map owns Navi's supervision baseline.
7. New projects may confirm an explicitly provisional route or working rhythm.
   Unknown details remain uncertainty, not blank placeholders or invented fact.
8. Both strategies use the existing combined preview and fingerprint-bound
   write path.
9. Map updates are proposed only after a material navigation change.
10. The first calibration uses a mature project; the evidence-poor fallback is
    calibrated second.

## Goals

- Give mature-project users a useful candidate without making them restate
  evidence Navi can read.
- Give new-project users a useful path without requiring a complete roadmap.
- Make conflicts, missing judgments, stale evidence, and uncertainty visible.
- Preserve one Project Map schema and one initialization safety boundary.
- Keep initialization bounded enough to avoid becoming a repository audit.
- Preserve quiet, read-only fallback behavior when initialization is declined.

## Non-Goals

- A background repository indexer, watcher, scheduler, or always-on service.
- Full-repository semantic analysis before Navi can respond.
- A second command such as `navi init --new` or `navi init --existing`.
- Automatic selection of product direction from timestamps, file names, code,
  or model confidence.
- Replacement or rewriting of project-owned roadmaps, specs, or trackers.
- Automatic Project Map writes, commits, pushes, or release actions.
- Runtime UI, local app, Memory v2, or support for agents other than Codex.

## Adaptive Entry Architecture

The adaptive layer sits between project-state discovery and the existing
confirmed-Map journey:

```text
Entry Trigger
  -> Project State Check
  -> Bounded Evidence Scan
  -> Evidence Profile
       coherent     -> Evidence-First Candidate
       conflicting  -> Conflict Resolution
       insufficient -> Guided Baseline Formation
       stale        -> Targeted Code Check, then reclassify
  -> Confirmable Baseline
  -> Existing Preview And Approved Write
  -> Fresh-Session Use
```

The Evidence Profile selects a strategy. It does not write files, establish
project direction, or make the candidate authoritative.

### Evidence Profile Output

The profile contains these judgments conceptually; this design does not require
a new persistent JSON or YAML artifact:

```text
profile: coherent | conflicting | insufficient | stale
sources: bounded evidence used for the judgment
supported_judgments: baseline judgments the evidence supports
missing_judgments: baseline judgments that still need user input
conflicts: material incompatible claims, if any
uncertainty: evidence that may be incomplete or outdated
next_baseline_action: candidate | resolve conflict | ask one question | inspect code
```

The profile is turn-local unless an approved Project Map write later records
the confirmed result. Navi does not add an evidence-profile file to the target
project.

## Bounded Evidence Scan

The default scan uses the smallest likely supervision sources, in this order:

1. existing `.navi/project-map.md` and project-local Navi trigger state;
2. `AGENTS.md` and root project instructions;
3. README, active roadmap, and active specification or implementation plan;
4. current status records, handoffs, trackers, or task files;
5. Git status, current branch, and recent commits; and
6. targeted relevant code only when documentary evidence is insufficient,
   conflicting, or apparently stale.

The scan is complete when Navi can judge whether the evidence supports these
four baseline areas:

- Desired Outcome;
- Route To Outcome or current working rhythm;
- Current Position; and
- Current Boundary plus Next Decision.

The scan is not an instruction to read every matching document. Navi should
prefer files named or linked by active project instructions and stop gathering
evidence when additional reading is unlikely to change the profile.

### Code As Evidence

Code can demonstrate implemented capability or contradict an outdated status
claim. It cannot establish the user's desired outcome or choose between product
directions. A targeted code check must name the disputed claim it is checking
and remain limited to the relevant component, test, or recent change.

## Evidence Classification

### Coherent

Evidence is coherent when it supports a candidate for every required baseline
area and contains no unresolved material conflict. Different levels of detail
or compatible wording do not create a conflict.

### Conflicting

Evidence is conflicting when incompatible claims would change the desired
outcome, major route, current phase, stopping boundary, or next decision. Navi
must present:

- the incompatible claims and their sources;
- why the difference affects supervision;
- a recommendation when one is supportable; and
- the decision the user must confirm.

Navi must not resolve a direction conflict from the latest modification time or
a fixed preference for README, roadmap, plan, code, or Git history.

### Insufficient

Evidence is insufficient when one or more required baseline areas cannot be
made confirmable. The project may be new, minimally documented, or simply
missing the relevant current judgment. Navi switches to Guided Baseline
Formation rather than refusing all help or writing placeholders.

### Stale

Evidence is stale when a source appears authoritative but current repository
facts plausibly show that its phase or status has passed. Navi may perform a
targeted code or Git check and then reclassify the profile. If the check cannot
resolve the issue, Navi records uncertainty or asks the user; it does not
silently demote the source.

## Baseline Formation Strategies

### Evidence-First Candidate For Mature Projects

Navi builds a complete candidate from coherent evidence before questioning the
user. It should:

- avoid asking the user to repeat supported facts;
- ask only about missing, conflicting, or route-changing judgments;
- distinguish observed implementation state from intended product direction;
- provide evidence references and uncertainty; and
- show one complete candidate for final confirmation.

The candidate is not a confirmed Project Map until the user accepts it and the
existing preview-to-write contract is satisfied.

### Conflict Resolution

Navi asks one focused direction question at a time. A recommendation must state
its basis and remain visibly distinct from user approval. Until the conflict is
resolved, Navi must not produce a `map_status: confirmed` write candidate.

### Guided Baseline Formation For New Or Evidence-Poor Projects

Navi asks one focused question for one missing judgment at a time. It begins
with Desired Outcome and then establishes the smallest truthful route, current
position, boundary, and next decision.

A user who does not know the full route may confirm:

- a known Desired Outcome;
- an exploration, design, or validation stage as Current Position;
- a provisional route or working rhythm;
- the current stopping boundary;
- the nearest real decision; and
- explicit unknowns that later work must resolve.

Provisional means the user has confirmed that this is the current working
route, not that Navi has proved the final route correct. Empty placeholders and
fabricated certainty are invalid.

## Layered Authority

Project-owned documents keep their existing responsibilities:

- roadmaps own detailed product sequencing;
- specs own approved design decisions;
- implementation plans own bounded execution steps;
- trackers own item status; and
- code and tests own implemented behavior evidence.

The confirmed `.navi/project-map.md` owns the compact supervision baseline:
what outcome the user is pursuing, the route or rhythm currently accepted, the
current position, the active boundary, the next decision, and the evidence or
uncertainty supporting those judgments.

The Map references source evidence instead of copying complete plans. It does
not replace an existing roadmap or become the sole authority for all project
facts.

## Confirmation And Write Path

Both baseline strategies reuse the established confirmed-Map journey:

1. render one combined `.navi/project-map.md` and managed `AGENTS.md` trigger
   preview;
2. bind the candidate, target, and relevant existing bytes into a fingerprint;
3. obtain one explicit approval for the exact preview;
4. write the Map first and the trigger second; and
5. reject the write when preview inputs no longer match the fingerprint.

Evidence confidence never replaces user approval. The adaptive layer does not
change path-safety, conflict, transaction, partial-activation, or fingerprint
rules already owned by `navi init`.

If the user declines or stops, Navi remains read-only, provides a short
best-effort judgment with explicit uncertainty, and does not repeat the same
initialization reminder in that session.

## Material Map Updates

After initialization, Navi proposes a bounded Map update only when at least one
of these supervision judgments materially changes:

- Desired Outcome;
- major route or Product Stage;
- Current Boundary;
- Next Decision; or
- an evidence conflict that invalidates the confirmed baseline.

Ordinary commits, local task completion, passing tests, wording changes, and
routine progress do not independently justify a Map update. Proposed updates
use an exact bounded diff and require user confirmation before write-back.
Navi does not regenerate the entire Map merely because a new session starts.

## Error And Safety Behavior

- Unsafe paths, unsupported Map versions, unknown triggers, duplicate managed
  blocks, and changed preview inputs continue to block writes.
- A successful Map write followed by trigger failure remains partial
  activation. The Map is preserved and the trigger problem is reported.
- An unresolved direction conflict cannot produce a confirmed Map.
- Stale evidence that cannot be resolved remains explicit uncertainty.
- Failure to initialize does not prevent truthful, provisional, read-only
  supervision.
- Adaptive entry never stages, commits, pushes, tags, releases, or mutates
  global Codex or plugin state.

## Calibration Order

### First: Mature Real Project

The first calibration uses a real project with substantial code and project
records. It succeeds when:

- an ordinary broad supervision question reaches project-entry judgment;
- the scan stays bounded to likely current evidence;
- compatible, conflicting, stale, and missing evidence are distinguished;
- direction conflicts return to the user;
- the candidate Map truthfully captures the five navigation judgments and
  uncertainty; and
- a fresh session reads the confirmed Map, follows the current prompt language,
  and keeps narrow requests quiet.

### Second: New Or Evidence-Poor Project

The second calibration succeeds when:

- insufficient evidence routes to Guided Baseline Formation;
- each question targets one genuinely missing judgment;
- a provisional route can be confirmed without becoming false certainty;
- no blank or invented map content is written; and
- declining initialization leaves useful read-only guidance without repeated
  reminders.

Calibration records the prompt, project shape, evidence read, expected behavior,
actual behavior, and user judgment. It does not run a release checklist or
treat one successful project as universal product proof.

## Relationship To Supervised Delivery

The first implementation gap found by calibration should become a bounded
implementation contract. The Main Thread owns the product decision and scope;
an isolated Execution Thread owns changes and planned verification; and one
fresh read-only Validation Thread independently judges the exact review-ready
snapshot. This natural task is the first post-integration calibration of the
Codex-first Supervised Delivery Loop V1.

The calibration must observe whether evidence and approved contract amendments
move directly between tasks, whether the validator stays read-only, and whether
the user is asked only about permission, scope, risk, integration, or another
real decision. It must not manufacture a no-value implementation solely to test
the workflow.

## Acceptance Boundary

This design is ready for implementation planning when:

- one visible entry and two internal strategies remain explicit;
- the evidence scan and four profiles are bounded and deterministic enough for
  prompt/docs-backed Codex behavior;
- conflict and layered-authority rules preserve user and project ownership;
- the existing preview, fingerprint, and safe-write journey remains unchanged;
- mature-project and evidence-poor calibration have separate success criteria;
  and
- no runtime, second command, database, release, or other-agent scope has been
  introduced.
