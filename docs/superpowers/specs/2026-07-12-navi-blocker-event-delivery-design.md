# Navi Blocker Event Delivery Design

Date: 2026-07-12

Status: Approved in conversation; design documentation only

## Summary

Navi should stop requiring the user to carry blocker information from an
implementation worktree back to the main session. When a bounded worktree goal
is formally blocked, a Codex adapter may deliver one structured blocker event
to the source main session.

The event is coordination evidence, not a user command or new authorization.
The main session decides whether the blocker affects the current premise and
must be handled immediately, or is lane-local and can wait until the current
non-conflicting design segment closes.

The first version is an adapter contract built on host-provided thread
messaging. It does not add a Supervisor session, background process, durable
queue, watcher, database, MCP server, or runtime controller.

## Problem

The Global Bootstrap remediation worktree correctly marked its bounded goal
blocked after determining that the requested atomic filesystem guarantee could
not be proved with the current Node public filesystem API. The main session did
not learn this automatically. The user had to tell the main session that the
worktree was blocked.

That makes the user an information bus between two agent lanes. It also creates
two bad alternatives:

- the main session polls the worktree and stops useful non-conflicting design;
  or
- the main session continues without knowing that a pending implementation
  premise now needs a decision.

A separate blocker inbox task does not solve this if the user must open it,
interpret it, and relay its contents. The missing capability is automatic
machine-to-machine event delivery, not another place to store messages.

## Product Decision

Implement a narrow **Lane Blocker Event Delivery** contract for the Codex
adapter.

```text
bounded worktree goal becomes blocked
  -> worktree sends one structured event to source main session
  -> main session classifies current-session impact
  -> main handles now or defers to the next natural decision point
  -> user sees the blocker only when a real decision is needed
```

Only formal blockers qualify. Ordinary waiting, a child still running, a test
failure that remains in scope, task completion, review readiness, and worktree
completion do not emit blocker events.

## Event Contract

The event uses this semantic envelope:

```text
NAVI_LANE_BLOCKER_EVENT

event_id: <stable identifier for this blocked goal>
source_lane: <worktree task identifier>
goal: <bounded goal summary>
status: blocked
reason: <one concrete blocking condition>
evidence: <minimal verified evidence>
worktree_state: <clean, or exact uncommitted files>
decision_needed: <the decision required to resume>
declared_impact: lane-local | premise-changing
```

The angle-bracket entries describe required runtime values; they are not open
design placeholders.

`declared_impact` is the worktree's bounded assessment, not the final routing
decision. A worktree normally lacks enough context to know whether the main
session is in the middle of unrelated design. The main session remains
responsible for classifying current-session impact.

The event must not contain hidden reasoning, exhaustive logs, a request to
`continue`, implementation instructions, or implied approval for a dependency,
scope expansion, architecture choice, risk acceptance, merge, push, tag, or
release.

## Emission Rules

The worktree emits an event only when all of these are true:

1. the lane has a bounded goal;
2. the same blocking condition has met the host goal's formal blocked rule;
3. the goal has been marked blocked;
4. delegation metadata identifies a source main session; and
5. the host exposes a thread-messaging capability.

One blocked goal emits at most one event. Automatic goal continuation turns do
not emit duplicates. The event ID must remain stable across retries.

After delivery, the worktree remains blocked. Delivery does not authorize it to
resume, weaken the acceptance criteria, change scope, or choose the requested
architecture decision.

If source-session metadata or thread messaging is unavailable, or delivery
fails, the worktree keeps its ordinary blocked final answer and states that the
blocker was not delivered to the main session. It must not claim successful
delivery without host evidence.

## Main-Session Handling

Receiving a blocker event does not automatically make the whole session
blocked.

The main session should handle the event immediately when it changes the active
product premise, safety judgment, allowed file scope, acceptance criteria, or a
decision currently being discussed.

When the blocker affects only its implementation lane and the main session has
useful non-conflicting design work, the main session records the pending blocker
and continues that design. It presents the blocker at the next natural decision
point rather than requiring the user to say `continue` or manually relay the
message.

The main session must not send routine acknowledgement messages back to the
worktree. A response is appropriate only after the user makes the decision
needed to resume or replace that lane. This prevents thread-to-thread ping-pong.

If the source main session is idle when the event arrives, idle is already a
natural checkpoint. The main session may present the blocker and its real
decision directly.

## Codex Adapter

The first version relies on existing Codex thread messaging:

1. the main session includes its task ID and this blocker contract in the
   bounded worktree delegation prompt;
2. the worktree sends the event to that source task only after formal blocking;
3. a running source task receives the event as a later turn rather than a forced
   mid-response interruption; and
4. an idle source task may be awakened by the delivered event.

Navi core defines the event semantics. Codex-specific thread IDs and messaging
tools remain adapter details. Other agent hosts may provide a different event
transport or may support only the fallback blocked report.

Pending blocker state initially remains in main-session context. Context loss is
a known limitation. The first version does not add durable storage merely to
solve that hypothetical failure. A durable event queue becomes a design
candidate only after real evidence shows that delivered pending blockers are
lost or mishandled.

## Component Boundaries

### Canonical And Packaged Navi Skill

Add the blocker-event semantics, emission conditions, fallback, and
main-session handling rule to the canonical Navi reference and keep the packaged
copy exactly synchronized.

### Project-Local Trigger

Keep generated project guidance small. It should say that when a main session
creates a bounded worktree and the host supports thread messaging, the
delegation prompt should carry the source task ID and blocker-event contract.
Do not duplicate the complete event schema in every generated project file.

### Delegation Prompt

The detailed event contract belongs in the worktree delegation prompt because
that is the lane that must emit it. The prompt must preserve the existing goal,
scope, validation, commit, and escalation boundaries.

### Global Bootstrap

Do not add blocker delivery to the global bootstrap. Its only responsibility is
first-use discovery and project-init routing.

## Validation

Targeted static tests should verify:

- canonical and packaged skill/reference content remain synchronized;
- generated project guidance contains only the concise delegation requirement;
- the detailed contract requires every event field;
- only a formally blocked bounded goal emits an event;
- ordinary waiting, local failures, task completion, and review readiness do not
  emit events;
- delivery is not represented as authorization or automatic recovery;
- missing source metadata or messaging capability uses an explicit fallback;
  and
- the global bootstrap does not contain blocker delivery behavior.

The implementation does not need a synthetic messaging runtime or a mocked
background scheduler merely to satisfy tests.

## Real Calibration

Use one future natural worktree blocker after implementation. Do not manufacture
a blocker solely to obtain a passing result.

Observe whether:

1. the event reaches the source main session without user relay;
2. it is delivered only once;
3. the main session distinguishes lane-local blocking from whole-session
   blocking;
4. non-conflicting design continues without being hijacked;
5. the user sees a decision only when their judgment is actually required; and
6. no reply loop, scope expansion, or implied approval occurs.

The current Global Bootstrap blocker is problem evidence, not a valid success
sample, because the user already carried it to the main session before this
contract existed.

If the first version still interrupts unrelated design or loses delivered
events, stop adding prompt rules. The next design question is a host-supported
durable event queue or controller with an explicit installation and complexity
budget.

## Non-Goals

This design does not authorize:

- a Supervisor Inbox task that the user must inspect;
- a blocker-solving agent or second product-decision center;
- completion, progress, waiting, or review-ready notifications;
- polling the worktree from the main session;
- automatic worktree resume;
- automatic architecture or risk decisions;
- a background watcher, scheduler, database, durable queue, MCP service, or
  runtime controller;
- product code changes outside the Codex adapter contract;
- full tests, release preparation, merge, push, tag, or publication.

## Acceptance Criteria

The design is successfully implemented when:

- a Codex bounded worktree has a clear path to notify its source main session
  after formal blocking;
- the user no longer needs to relay the blocker manually;
- the event cannot authorize work or expand scope;
- duplicate and non-blocker notifications are prohibited;
- the main session can defer lane-local blockers while continuing useful design;
- unsupported hosts degrade honestly; and
- Navi gains no new runtime or installation burden in this version.
