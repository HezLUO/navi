# Navi Codex-First Supervision Contract Design

Date: 2026-07-13

Status: Approved in design discussion on 2026-07-13

## Summary

Navi should define an internal supervision contract that makes its Codex behavior coherent without turning the current product into a cross-agent framework.

The product is **Codex-first**: the current implementation, installation path, calibration, and support promise target Codex only. The contract may use capabilities that Codex actually provides, including project instructions, skills/plugins, worktrees, task messaging, tool approvals, and Git-aware sessions.

The internal boundaries should nevertheless preserve future portability. Evidence, supervision judgments, authorization, control decisions, rendering, blocker semantics, and Codex tool execution remain distinct concepts. If a real second-agent requirement appears later, Navi can map those concepts to another host without first undoing Codex-specific product logic.

This design does not authorize implementation, an implementation plan, another agent adapter, a public SDK, npm publication, a runtime service, a UI, a release, or changes to the active bootstrap worktree.

## Product Decision

Use this positioning:

```text
Navi is built and calibrated for Codex first.
Its internal supervision semantics do not depend on Codex tool-call shapes.
Other agents are a future extension point, not a current supported surface.
```

This avoids two bad extremes:

- a host-neutral framework that adds capability negotiation, packaging, and conformance work before a second host exists; and
- deeply coupled Codex prompt rules that would require rewriting Navi's supervision model before another agent could use it.

The contract is a product-coherence layer, not a distribution claim.

## Relationship To Along

Navi Core is independent from Along's Working Thread contract.

The existing `src/core/working-thread-contract.ts` describes Along Working Thread continuity, drift classification, wrap-up proposals, and confirmed write-back. It must not be renamed or expanded into the Navi supervision contract merely to reuse an existing type surface.

Working Thread may provide evidence to Navi through the same evidence boundary as:

- a Project Map or Rhythm Map;
- `.navi/state.md` Project State;
- an approved design or implementation plan;
- Git and filesystem observations;
- a Codex task or worktree status; and
- explicit user confirmation.

Navi users do not need to understand or install Along to use the supervision contract. Along remains an origin, lab, possible product-family context, and optional continuity provider.

## Architecture

The first version uses **contract plus policy validation**, not a new agent runtime:

```text
Codex adapter
  -> collect the current prompt, active boundary, Codex capabilities, and evidence
  -> normalize a minimal supervision request
  -> use Codex reasoning to form a candidate supervision judgment
  -> validate that judgment against Navi contract and control policy
  -> receive a normalized control decision
  -> render the lightest useful response in the current prompt language
  -> execute only through Codex's own tools and approval system
```

Navi does not pretend that a deterministic rules engine can derive the correct professional judgment from a few fields. Codex still interprets project evidence and user intent. The contract makes that interpretation inspectable and prevents internally inconsistent or unauthorized control conclusions.

The architecture has five responsibilities:

1. **Evidence normalization** separates source facts from agent inference.
2. **Supervision judgment** expresses the current orientation and proposed intervention.
3. **Control policy** validates continuation, stopping, authorization, and uncertainty semantics.
4. **Adaptive rendering** preserves quietness and current-prompt language behavior.
5. **Codex execution mapping** keeps tool calls and thread transport outside the supervision semantics.

## Core Envelopes

The first version defines five primary envelopes plus one bounded authorization envelope. Names below describe semantic contracts; implementation may refine field spelling without changing their meaning.

### SupervisionRequest

A request contains only the context needed for the current supervision decision:

- request identifier;
- current user prompt and detected response language;
- active goal, scope, stop point, and loop state when known;
- Codex capabilities relevant to the request;
- `EvidenceItem[]`;
- compact lane summaries; and
- any pending formal blocker event.

It must not require a complete transcript, hidden reasoning, or unrelated project content.

### EvidenceItem

Each evidence item contains:

- stable item identifier;
- evidence kind;
- source reference;
- project, lane, session, or global scope;
- observed timestamp when available;
- authority classification;
- freshness classification;
- minimal factual summary; and
- whether the item is a source fact or agent inference.

Initial evidence kinds should cover:

```text
user-confirmed
project-record
approved-plan
live-tool-result
lane-event
agent-inference
```

Authority and freshness are separate. A user-confirmed Project Map may have high authority and still be stale. A recent Git observation may challenge it without silently rewriting it. Evidence conflict becomes part of the supervision judgment.

The envelope stores source references and minimal summaries, not full project files or hidden chain-of-thought.

### CandidateSupervisionJudgment

Codex proposes a candidate judgment containing:

- current goal and position when inferable;
- Work Mode;
- relevant lane state;
- whether Navi intervention provides control gain;
- uncertainty and evidence conflicts;
- the next real user decision, if one exists;
- proposed control action;
- proposed rendering strength; and
- supporting evidence references.

Product Stage and Vision Distance are optional. They appear only when broad orientation improves user control.

### AuthorizationEnvelope

Authorization is scoped rather than blanket. The envelope contains:

- the approved objective;
- allowed action classes;
- allowed project and file scope;
- the current acceptance point;
- explicit forbidden escalations;
- authorization source; and
- whether the authorization is still active.

This envelope prevents Navi from teaching that every local commit always requires a new approval. A bounded implementation plan may authorize its listed local task commits, while project-owned instructions outside Navi-managed content remain authoritative.

### ControlDecision

After validation, the allowed control actions are:

```text
continueWithinBoundary
requestUserDecision
deferLaneEvent
closeLoop
insufficientEvidence
rejectInvalidJudgment
```

The decision also contains:

- required approval class, when any;
- concise user-facing rationale;
- evidence references;
- uncertainty or conflict signal; and
- rendering guidance.

It never contains hidden reasoning or tool authorization. A control decision constrains the Codex adapter; it does not execute an action itself.

### LaneBlockerEvent

The first lane event is the already approved formal blocker event. Its semantic fields remain:

- stable event identifier;
- source lane;
- bounded goal;
- blocked status;
- one concrete reason;
- minimal verified evidence;
- exact worktree state;
- decision needed; and
- declared lane-local or premise-changing impact.

Codex task IDs and thread-messaging calls are transport metadata, not blocker semantics.

The first contract excludes completion, progress, waiting, review-ready, and routine acknowledgement events. It does not become a notification system.

## Control Policy

The policy validator enforces these invariants:

### Continue Inside An Approved Boundary

When the next local action is already covered by an active Authorization Envelope, Codex continues to the stated acceptance point. It does not stop after every file edit, check, test, or listed local task commit.

### Preserve Real Approval Gates

Without explicit applicable authorization, Codex must request a user decision before:

- push, merge, tag, release, or publication;
- cross-project writes;
- scope or mode expansion;
- history rewriting;
- accepting a known material risk; or
- any project-specific boundary required by authoritative project instructions.

The contract must not turn a default recommendation into user approval.

### No Fake Continue Decision

If the user has no meaningful judgment to make, the decision cannot present bare `continue` or `继续` as an option. Codex either continues inside the approved loop or names the concrete next action, boundary, and stop point.

### Quietness Before Structure

When intervention provides no orientation, decision, boundary, risk, or coordination gain, rendering remains silent and the request receives an ordinary direct answer. A technically applicable Navi rule is not enough to justify a map or menu.

### Evidence Before Confidence

Insufficient or conflicting evidence cannot produce a confident stable map. Codex returns a provisional judgment, asks for a real confirmation, or reports `insufficientEvidence` depending on the user's need.

Implementation success, tests passing, package verification, and agent self-assessment are evidence, not product proof.

### Stale State Must Be Challenged

New repository or project facts may challenge a confirmed but stale Project State or Project Map. The contract exposes the conflict and preserves the user's authority to confirm an update; it does not silently let either source dominate.

### Blocked Means Formally Blocked

A formal blocker is distinct from ordinary waiting, an in-scope failure, task completion, or review readiness.

A premise-changing blocker is surfaced at the next available decision point. A lane-local blocker may be deferred while useful non-conflicting main-session design continues. Receiving a blocker event never authorizes automatic recovery, scope expansion, or a response loop between tasks.

### Honest Capability Fallback

If Codex cannot inspect a source, deliver a task message, or perform an operation in the current environment, Navi reports the limitation. It cannot claim delivery, validation, or execution without host evidence.

## Adaptive Rendering

The contract standardizes meaning, not fixed prose.

Rendering guidance uses the lightest sufficient surface:

```text
silent-direct-answer
embedded-hint
one-sentence-handoff
short-options
progress-or-rhythm-map
```

The Codex adapter chooses natural wording based on the current prompt and conversational context. The user's current prompt language controls headings, explanations, next steps, approval gates, and risk wording by default. A Project Map written in another language is evidence, not a response-language command.

The contract must not force Product Stage, Work Mode, Vision Distance, lane tables, or decision menus into every response.

## Codex-First Adapter Boundary

The current adapter may rely on real Codex capabilities:

- project and global `AGENTS.md` instructions;
- Navi skill/plugin discovery;
- project-local Project Maps and Project State;
- Git and filesystem tools;
- worktree tasks;
- task messaging;
- tool approval boundaries; and
- task-local goal state when available.

These mappings remain outside the core semantic envelopes. In particular:

- a Codex task ID is not a Navi lane identity model;
- a Codex tool approval dialog is not an Authorization Envelope definition;
- a Codex message send call is not the blocker event contract;
- an `AGENTS.md` sentence is not the full supervision policy; and
- a model response template is not the Control Decision schema.

The first implementation should not create a generic host capability negotiation framework. It may use a small Codex capability description only where honest fallback requires one.

## Portability Seams

Navi does not support another agent in this phase, but these seams must remain clean:

- evidence facts are not represented as raw Codex transcript items;
- control decisions are not represented as tool-call names;
- authorization semantics are not represented as Codex UI text;
- blocker semantics are not represented as thread transport payload alone;
- rendering strength is not a fixed Codex response template; and
- core contract modules do not import a Codex SDK or desktop-tool type.

These constraints reserve migration space without creating current cross-agent work. If a real second host is later approved, its implementation should first map these existing seams. Only proven shared requirements should be generalized.

## Relationship To Current Navi Surfaces

### Skill And Plugin

The skill/plugin remains the current product delivery surface. It should eventually consume or reflect the contract, not be replaced by a runtime service merely because the contract exists.

### Project Initialization

`navi init` remains project configuration, not a second Navi installation. Generated guidance should stay concise and should not embed the full contract schema.

### Project State

`.navi/state.md` remains an optional confirmed evidence snapshot. It is not the contract's database, and it cannot become authoritative merely because it exists.

### Working Thread And MCP

Along Working Thread and the existing MCP surface remain optional evidence/write-back capabilities. They are not required for ordinary Navi supervision and are not rebranded as Navi Core.

### Historical Runtime And Web UI

`src/web` and the historical Along runtime are not current Navi implementations. This design does not authorize their reuse or rebrand.

## Conformance Validation

The first implementation should use targeted schema, policy, and fixture validation without real model calls.

Required fixture classes include:

- English prompt with Chinese project records still renders English guidance;
- an ordinary factual request produces no Navi surface;
- an approved bounded loop continues without meaningless pauses;
- scoped local commit authorization does not become a blanket commit rule;
- unapproved push or release escalation requests a user decision;
- fresh Git evidence challenges stale Project State;
- lane-local blocker is deferred during non-conflicting design;
- premise-changing blocker becomes a real decision;
- unavailable task messaging uses an explicit fallback;
- insufficient evidence does not produce a stable progress map; and
- a candidate judgment with contradictory control fields is rejected.

Real Codex behavior still requires small fresh-session calibration. Fixtures prove contract consistency, not product usefulness or universal model compliance.

## Delivery Sequence

This design suggests the following future order:

1. Add repository-internal contract types, policy validation, and focused fixtures.
2. Align the Codex skill/plugin and project trigger after the active bootstrap and blocker-delivery implementation scopes no longer conflict.
3. Run bounded real-project Codex calibration.
4. Keep Navi Codex-first until a real second-agent product requirement is explicitly approved.
5. If that requirement appears, build one narrow adapter before considering a public Core package or SDK.

The first three steps require separate implementation planning and approval. Steps four and five are roadmap boundaries, not promised work.

## Non-Goals

This design does not authorize:

- Claude Code, Hermes, or any other agent adapter;
- a generic host capability framework;
- a public `@navi/core` package or SDK;
- npm or marketplace publication;
- a daemon, service, background watcher, scheduler, or notification runtime;
- a UI or local app;
- Memory v2, relationship modes, delegation, or write delegation;
- replacement or renaming of the Along Working Thread contract;
- automatic professional-domain decisions;
- a fixed user-visible response structure;
- automatic writes, commits, pushes, merges, tags, or releases; or
- changes to the active bootstrap worktree.

## Risks And Mitigations

### Contract Becomes Another Rule Dump

Mitigation: keep the first version to the approved envelopes and control invariants. Do not encode every historic prompt sentence as a field.

### Contract Creates False Precision

Mitigation: make uncertainty, conflict, provisional judgment, and insufficient evidence first-class outcomes.

### Codex Adapter Duplicates Policy

Mitigation: keep policy validation and conformance fixtures canonical. The adapter owns evidence collection, reasoning, rendering, and tool mapping, not a second policy definition.

### Portability Work Delays The Codex Product

Mitigation: do not implement another adapter, generic capability negotiation, cross-host tests, or public packaging. Preserve only the named seams.

### Internal Architecture Increases User Complexity

Mitigation: add no new installation step, process, service, configuration file, or mandatory output. Users continue to install and use Navi through the Codex-first surface.

## Acceptance Criteria

The design is successfully implemented only when:

1. Navi supervision and authorization semantics no longer depend solely on duplicated Codex prompt prose.
2. Codex remains the only supported and calibrated host for this phase.
3. Evidence, candidate judgment, authorization, control decision, rendering, blocker semantics, and Codex execution mapping have explicit boundaries.
4. The contract rejects unauthorized escalation, fake continuation decisions, confident maps from insufficient evidence, and contradictory blocker handling.
5. Dynamic quietness and current-prompt language behavior remain intact.
6. Along Working Thread can provide evidence without becoming a Navi prerequisite.
7. No runtime service, UI, second-agent adapter, public SDK, or new user installation burden is introduced.
8. Future portability remains possible through concrete internal seams rather than a speculative host-neutral framework.
