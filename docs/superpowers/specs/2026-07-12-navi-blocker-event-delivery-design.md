# Navi Lane Handoff Event Delivery Design

Date: 2026-07-12
Revised: 2026-07-14

Status: Approved in conversation; supersedes the blocker-only design in this
document

## Summary

Navi should stop requiring the user to inspect implementation worktrees and
carry coordination information back to the source main session. A bounded
Codex worktree should deliver one structured handoff event when it reaches one
of three meaningful lane transitions:

- `decision-required`: the lane cannot continue without a real user decision;
- `blocked`: the bounded goal has been formally marked blocked; or
- `review-ready`: the lane has completed its bounded implementation and is
  ready for parent review.

These transitions are not equivalent. In particular, a completed worktree is
not blocked. It still requires machine-to-machine delivery because otherwise
the user remains an information bus.

The source main session classifies the event's current impact. It may continue
non-conflicting design, automatically perform a read-only parent review at the
next natural checkpoint, route an in-scope remediation back to the worktree,
or present a real user decision. Event delivery never authorizes scope
expansion, risk acceptance, merge, push, tag, release, or publication.

The first version is a Codex adapter contract built on host-provided task
messaging. It does not add a supervisor task, background process, durable
queue, watcher, database, MCP server, or runtime controller.

## Problem

The earlier blocker-only design solved only one part of cross-lane
coordination. Two natural samples exposed the missing transitions:

1. A worktree needed approval to run `npm ci`. It was paused at a real user
   gate but was not formally blocked. The user had to ask the main session to
   inspect it.
2. A completed worktree can become ready for parent review without being
   blocked or requiring an implementation decision. If no event is delivered,
   the user must still notice completion and report it to the main session.

Polling every worktree is not an acceptable replacement. It interrupts useful
main-session design, consumes attention without a state transition, and remains
a host-side coordination workaround rather than a product contract. A separate
inbox task also fails if the user must open it, interpret it, and relay its
contents.

The missing capability is a narrow lane handoff protocol that reports only
terminal or user-decision transitions and lets the source main session decide
when the information should affect the conversation.

## Product Decision

Implement one versioned **Navi Lane Handoff Event** contract for the Codex
adapter.

```text
bounded worktree reaches a meaningful lane transition
  -> worktree sends one structured event to the source main session
  -> main session classifies current-session impact
  -> main reviews, remediates, defers, or presents a real decision
  -> user acts only where user judgment or authorization is required
```

The contract is not a general notification system. Ordinary progress, a child
still running, an in-scope test failure, a local task commit, a test passing,
and routine waiting do not emit events.

## Unified Event Contract

Every handoff uses the same semantic envelope:

```text
NAVI_LANE_HANDOFF_EVENT

version: 1
event_id: <stable identifier for this lane transition>
kind: decision-required | blocked | review-ready
source_task: <source main task identifier>
source_lane: <worktree task identifier>
goal: <bounded goal summary>
summary: <minimal factual transition summary>
evidence: <minimal verified evidence or source references>
worktree_state: <clean, or exact uncommitted files>
declared_impact: lane-local | premise-changing
```

The angle-bracket entries describe required runtime values; they are not open
design placeholders. The event contains facts and source references, not
hidden reasoning, exhaustive logs, or implied authorization.

`declared_impact` is the worktree's bounded assessment. The source main session
has the broader conversation context and makes the final routing decision.

### Decision-Required Fields

A `decision-required` event also contains:

```text
decision_needed: <one decision only the user can make>
recommendation: <bounded recommendation, or none when no default is justified>
continuation: <what the lane will do if the decision authorizes it>
```

This kind is limited to real gates:

- tool, environment, network, installation, or external-write permission;
- unplanned scope expansion;
- accepting a known material risk or lowering an acceptance criterion;
- cross-project modification;
- merge, push, tag, release, publication, or equivalent authority boundaries;
  and
- a product or architecture choice that genuinely requires user judgment.

Ordinary implementation uncertainty remains the lane's engineering work. It
does not become a user decision merely because the agent is unsure.

### Blocked Fields

A `blocked` event also contains:

```text
reason: <one concrete blocking condition>
attempts: <minimal verified attempts already made>
decision_needed: <the decision required to resume or replace the lane>
```

Only a bounded goal that has met the host goal lifecycle's formal blocked rule
may emit this kind. Ordinary waiting, an in-scope failure, review readiness,
and worktree completion are not formal blockers.

After delivery the worktree remains blocked. Delivery does not authorize it to
resume, weaken the acceptance criteria, change scope, select an architecture,
or accept risk.

### Review-Ready Fields

A `review-ready` event also contains:

```text
commits: <exact implementation commits>
changed_scope: <files or bounded components changed>
verification: <targeted checks and exact results>
residual_risks: <known remaining risks, or none>
```

This kind is emitted only after the worktree reaches its stated implementation
acceptance point, performs its final scope audit, and can report exact working
tree state. It means the implementation lane is ready for source-side review;
it does not mean the result is merged, released, or proved correct.

## Emission, Retry, And Deduplication

The worktree emits one event when it enters one of the three defined
transitions and delegation metadata identifies a source main task.

Each transition has one stable `event_id`. A failed delivery may be retried
once immediately with the same ID. Timed retries, background polling, and
unbounded resend loops are prohibited. The source main session records handled
IDs in its task context and silently ignores duplicate delivery.

If a lane resumes after a decision or remediation and later reaches another
meaningful transition, that transition receives a new ID. A second
`review-ready` after bounded remediation is a new review cycle and therefore a
new event.

If source metadata or host task messaging is unavailable, or both delivery
attempts fail, the worktree keeps its ordinary local handoff report and states
that delivery failed. It must not claim successful delivery without host tool
evidence. The first version does not add durable Navi storage merely to hide an
unsupported or failed host capability.

## Source Main-Session Routing

Receiving an event does not automatically make the whole session blocked and
does not force a mid-response interruption.

The main session handles a `premise-changing` event at the first available turn
when it changes the active product premise, safety judgment, allowed file
scope, acceptance criteria, or a decision currently being discussed.

A `lane-local` event may be retained while useful non-conflicting design
continues. The main session processes it at the next natural checkpoint rather
than asking the user to say `continue` or manually relay the event.

The worktree's declared impact remains evidence, not the final classification.
The main session must stop or switch attention when continued work would edit
the same files, invalidate acceptance criteria, make the pending result
obsolete, or build a product judgment on a premise the event challenges.

### Decision-Required Routing

The worktree remains paused. The main session presents the decision only when
user judgment is actually required, preserves the original gate and
recommendation boundaries, and sends the user's decision directly back to the
worktree. The user should not copy the decision between tasks.

### Blocked Routing

A premise-changing or whole-session blocker is presented at the first
available decision point. A lane-local blocker may be deferred while
non-conflicting main-session work remains useful. The main session responds to
the worktree only after the user chooses how to resume, replace, or close the
lane.

### Review-Ready Routing

At the next non-conflicting natural checkpoint, the main session automatically
performs a read-only parent review. This review does not require a separate user
approval and does not authorize edits or integration.

If review finds a defect that can be corrected within the original goal, file
scope, validation budget, authority envelope, and risk boundary, the main
session sends one strictly bounded remediation instruction to the same
worktree. The lane returns a new `review-ready` event after remediation.

If remediation would change product design, expand scope, require permission,
lower acceptance criteria, or accept new risk, the main session presents a
real user decision instead. A passing review may lead to a merge decision, but
merge, push, tag, release, and publication always retain their explicit user
approval gates.

## Message Direction And Interruption Control

The protocol is one-way at each transition, with bounded replies:

- do not send routine acknowledgements such as `received`;
- send a reply only with an applicable user decision, a strictly bounded
  remediation, or an explicit resume/replace instruction;
- do not create task-to-task conversational loops; and
- do not turn completion into an immediate user interruption when review can
  wait for a natural checkpoint.

A running source task receives the event after its current turn rather than as
a forced mid-response interruption. An idle source task may be awakened by the
event. Host transcript persistence is sufficient for the first version; Navi
does not create a second inbox or event database.

## Codex Adapter And Component Boundaries

### Canonical And Packaged Navi Skill

The full contract belongs in a focused canonical reference, with an exact
packaged copy. The Navi skill contains concise pointers and the main/worktree
responsibility boundaries.

### Project-Local Trigger

Generated project guidance adds only one concise rule: a bounded worktree
delegation carries source-task metadata and the Lane Handoff contract, and the
worktree emits once on `decision-required`, `blocked`, or `review-ready`.

The full schema must not be copied into every generated `AGENTS.md`. Navi
project initialization remains configuration, not a second product install.

### Delegation Prompt

The main session includes its source task ID and a pointer to the available
Lane Handoff reference in the bounded worktree delegation. The prompt preserves
the lane's existing goal, scope, validation, commit, escalation, and authority
boundaries.

### Global Bootstrap

Global bootstrap remains responsible only for first-use discovery and project
initialization routing. It does not implement lane messaging or embed the event
schema.

### Transport Boundary

Navi defines event meaning and routing policy. Codex task IDs, delegation
metadata, transcript persistence, and task-messaging tools are adapter details.
Other future agent hosts may provide a different transport or may support only
the honest local fallback.

## Validation

Targeted tests should verify:

- canonical and packaged skill/reference content remain synchronized;
- the unified envelope requires all common fields and the three exact kinds;
- each kind requires its own minimal fields and trigger boundary;
- ordinary progress, tests, task commits, running children, and routine waits
  do not emit events;
- one immediate retry reuses the event ID and duplicate receipt is ignored;
- delivery is not represented as authorization or automatic recovery;
- `review-ready` leads to source-side read-only review rather than user relay;
- in-scope remediation is routed back without inventing a new user gate;
- out-of-scope remediation becomes a real decision;
- project-local guidance remains concise and omits the full schema;
- missing source metadata or messaging capability uses an explicit fallback;
  and
- global bootstrap remains free of lane-delivery behavior.

The implementation does not need a synthetic scheduler, queue, background
runtime, or mocked project-management system merely to satisfy tests.

## Real Calibration

Use the first natural worktree lifecycle after implementation. Do not retrofit
an already-running worktree or manufacture a blocker solely to obtain a passing
sample.

Observe whether:

1. each meaningful transition reaches the source main session without user
   relay;
2. delivery occurs once, or one retry is safely deduplicated;
3. unrelated design is not interrupted by lane-local events;
4. premise-changing events are not deferred past an invalidating decision;
5. `review-ready` causes automatic parent review at a natural checkpoint;
6. in-scope remediation returns directly to the lane;
7. the user sees only decisions that require user judgment; and
8. no reply loop, scope expansion, implied approval, or runtime dependency is
   introduced.

If natural calibration shows frequent transport loss, context loss, or routing
failure, stop adding prompt rules. A durable host event queue or controller may
then become a separate design candidate with an explicit installation and
complexity budget.

## Non-Goals

This design does not authorize:

- a Supervisor Inbox task that the user must inspect;
- a blocker-solving agent or second product-decision center;
- ordinary progress or intermediate child/task-completion notifications;
- polling every worktree;
- automatic architecture, product, permission, or risk decisions;
- automatic scope expansion or acceptance-criteria reduction;
- automatic merge, push, tag, release, or publication;
- a background watcher, scheduler, database, durable queue, MCP service, or
  runtime controller;
- changes to `src/web` or historical Along runtime surfaces;
- full tests, release preparation, tag creation, or publication; or
- support for non-Codex hosts in the first implementation.

## Acceptance Criteria

The design is successfully implemented when:

- a bounded Codex worktree can notify its source main session on
  `decision-required`, `blocked`, and `review-ready` transitions;
- the user no longer needs to inspect a worktree or relay lane information;
- completed work is correctly treated as review-ready rather than blocked;
- the main session automatically performs read-only parent review at a natural
  non-conflicting checkpoint;
- in-scope remediation returns to the same lane without a fake user decision;
- real authority, scope, risk, merge, push, and release gates remain explicit;
- duplicate and non-transition notifications are suppressed;
- unsupported host capabilities degrade honestly; and
- Navi gains no new runtime or installation burden in this version.
