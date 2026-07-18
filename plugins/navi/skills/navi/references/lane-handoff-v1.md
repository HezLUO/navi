# Navi Lane Handoff Event Delivery V1

Use this reference only for a bounded Codex lane whose delegation metadata identifies its source main task. Navi defines transition meaning and routing policy; the Codex host provides task identity, transcript persistence, and task messaging.

This is task-to-task coordination while Codex is active. It is not a background process, watcher, notification service, durable queue, Supervisor Inbox, or runtime controller.

## Delegation Metadata

The source main task includes its task ID, the bounded lane goal, file and action scope, validation budget, authority boundaries, stop conditions, and a pointer to this reference in the worktree delegation. Missing source-task metadata disables delivery and uses the honest local fallback.

## Unified Event

NAVI_LANE_HANDOFF_EVENT

version: 1
event_id: one stable identifier chosen once for this lane transition
kind: decision-required | blocked | review-ready
source_task: the source main task identifier from delegation metadata
source_lane: the bounded worktree task identifier
goal: the bounded lane goal
summary: one minimal factual transition summary
evidence: minimal verified evidence or source references
worktree_state: clean, or the exact uncommitted files
declared_impact: lane-local | premise-changing

The event contains facts and source references, not hidden reasoning, exhaustive logs, or implied authorization. The worktree's declared impact is evidence; the source main task makes the final routing judgment.

## Pre-Send Wire-Format Check

Before each send, inspect the rendered wire payload:

- The payload must begin exactly with `NAVI_LANE_HANDOFF_EVENT`.
- Send bare plain text with no XML/Markdown wrapper, code fence, or other wrapper.
- Use exact field names only and no aliases. `source_task_id`, `source_lane_id`, and singular `commit` are invalid.
- Confirm all common fields and all fields required for the selected kind are present before sending.

A malformed payload is not a valid delivery. Correct the same transition and resend it with the same event_id; this correction is not a new meaningful transition or review cycle.

## Delivery Completion Clause

Every delegated Execution or Validation Task prompt must include this operation
directly. A reference path alone is insufficient:

1. render the complete valid event or result;
2. call the available Codex host task-messaging capability;
3. send to the exact `source_task` and obtain host success evidence;
4. on a reported delivery failure, retry once immediately with the same
   identifier and semantically identical payload; and
5. refuse to claim handoff completion when neither attempt succeeds.

A payload printed only in the task's own final answer is a local report, not
direct delivery. It does not satisfy this completion condition.

After the host call, record one local Completion Receipt:

delivery_attempts: 1 | 2
delivery_state: delivered | failed

`delivered` requires host tool success; `failed` requires two reported
delivery failures. The wire payload does not claim its own delivery outcome,
because that outcome exists only after the send operation.

Host success plus the local receipt completes the handoff. Do not send an
acknowledgement or a second message only to confirm receipt.

## Decision Required

Use `kind: decision-required` only when the lane cannot continue without a real user decision about permission, external or cross-project writes, unplanned scope, acceptance-criteria reduction, material risk, product direction, merge, push, tag, release, or publication.

Add:

decision_needed: one decision only the user can make
recommendation: one bounded recommendation, or none when no default is justified
continuation: what the lane will do if the decision authorizes it

Ordinary engineering uncertainty is not decision-required. The lane remains paused after delivery.

## Blocked

Use `kind: blocked` only after the bounded goal satisfies the host goal lifecycle's formal blocked rule.

Add:

reason: one concrete blocking condition
attempts: minimal verified attempts already made
decision_needed: the decision required to resume, replace, or close the lane

An in-scope failure, routine waiting, review readiness, and worktree completion are not blocked. The lane remains blocked after delivery.

## Review Ready

Use `kind: review-ready` only after the lane reaches its stated implementation acceptance point and completes its final scope and worktree-state audit.

Add:

reviewed_snapshot: exact commit or immutable snapshot
commits: exact implementation commits
changed_scope: exact files or bounded components changed
verification: targeted checks and exact results
residual_risks: known remaining risks, or none

Review-ready means ready for source-side review. It does not mean merged, released, or proved correct.

## Non-Events

Do not emit for ordinary progress, routine waiting, an in-scope failure, test passing, a local task commit, a running child, a routine acknowledgement, or intermediate task completion. A completed bounded implementation emits review-ready only after its acceptance and scope audit.

## Delivery, Retry, And Fallback

Choose the event_id once, render the complete event, and use the available Codex task-messaging capability to send it to source_task. On a reported delivery failure, retry once immediately with the same event_id and identical semantic payload. Do not use timed retries, polling, a resend loop, or durable storage.

The delegated task follows Delivery Completion Clause before it reports
completion. After two failed attempts, preserve the complete local transition
report, record `delivery_state: failed`, and stop. The Source Main Task may
recover that report only through existing one-shot Main-Task Reconciliation at
a relevant dependent checkpoint.

A later meaningful transition after a lane resumes uses a new event_id. A second `review-ready` after bounded remediation is a new review cycle.

If source-task metadata or task messaging is unavailable, or both attempts fail, keep the ordinary local transition report and state that delivery failed. Never claim delivery without host tool evidence.

Delivery is coordination evidence, not authorization. It does not authorize resume, recovery, scope expansion, acceptance-criteria reduction, risk acceptance, merge, push, tag, release, or publication.

## Awaiting Direct Event

After successful direct task-message delivery to a live Codex task, the sender
enters `Awaiting Direct Event` for that lane. This is a workflow state, not a
Work Mode, Product Stage, scheduler, watcher, notification service, queue, or
Runtime Surface.

While this state is active, do not call `read_thread`, `list_threads`,
`wait_agent`, schedule a timer, or build a polling loop merely to observe
ordinary progress. Continue useful non-conflicting design or supervision. If
no useful non-conflicting work remains, end the current turn and wait for the
direct inbound event.

One bounded inspection is allowed when the user explicitly requests task
status, the host reports task-message delivery failure or messaging is
unavailable, or the approved contract declares a concrete safety deadline for
temporary external or global state. These exceptions do not exhaust dependent
checkpoints; use `Main-Task Reconciliation` below for that owner. An allowed
inspection is one-shot evidence, not a loop, recurring timer, or substitute for
direct delivery.

An inbound event, an allowed inspection result, or a reported delivery failure
exits `Awaiting Direct Event` and returns the lane to ordinary Source Main Task
routing. Silence is not new evidence, user approval, a blocker, or permission
to expand scope.

## Main-Task Reconciliation

Direct task messaging remains the primary path. The Source Main Task keeps
only turn-local context for each unresolved relevant task: `task_id`, `goal`,
`declared_impact`, `expected_transition`, `last_handled_event_id`,
`delivery_state`, and `last_reconciliation_reason`. This is not persistent
state, a task database, or a queue.

`delivery_state` is `awaiting-direct-event` while direct delivery is primary,
`reconciliation-needed` at one dependent checkpoint before inspection, and
`closed` after the recovered or directly delivered transition is handled.

An unresolved task is reconciliation-relevant only when its next transition
may change the product premise, acceptance, authorized scope, material risk,
merge/push/tag/release/publication readiness, temporary global or external state,
or the next real user decision. Ordinary progress and unrelated exploration do
not qualify.

A dependent control checkpoint occurs only before the Main Task presents a
dependent user decision; will create, replace, cancel, or redirect a related
task; performs a merge, push, tag, release, or publish action on affected work;
claims that the only useful remaining action is waiting; or will close the affected product lane or session phase. Completing an ordinary design section is not itself a checkpoint.

At one checkpoint, use the known `task_id` directly. Prefer a host one-shot
completion snapshot or bounded wait when available; otherwise perform one read-only task inspection. Inspect one relevant task at most once for one checkpoint. Do not list or search tasks when the identifier is known. A task that is still running remains quiet and the Main Task must not read it again at that checkpoint.

A complete valid directly delivered event follows existing deduplication and
routing without recording `delivery-protocol-failure`. A complete valid local
fallback with `delivery_state: failed` is recovered and routed while recording
`delivery-protocol-failure`. Terminal facts remain non-authorizing. Request at
most one bounded redelivery from the same task only when a required field is
missing. Do not ask the user to relay the result and do not create a duplicate
task.

For a completed task, a valid event still uses the existing routing under this
provenance distinction. Terminal facts are not user authorization. The existing
one bounded re-delivery allowance from the same task remains limited to a
missing required field.

On task unavailability or read failure, do not retry in a loop. Stop a
dependent high-impact action, or continue independent work with the state
unresolved. A duplicate `event_id` is silently ignored.

Successful reconciliation is quiet. Surface only a recovered
decision-changing event, a delivery-protocol failure, or a host capability gap
that prevents a dependent high-impact action. Do not add a timer, periodic polling, durable queue, watcher, daemon, or Runtime Surface.

When the Main Task receives no further turn and the host exposes no completion wakeup, V1 cannot reconcile by itself. Keep that limit explicit rather than claiming background delivery.

## Source Main Task

The source main task tracks handled event IDs in its task context and must silently ignore duplicate receipt. Receiving an event does not make the whole session blocked and does not force a mid-response interruption.

A premise-changing event is handled at the first available turn when it changes a current premise, safety judgment, file scope, acceptance criterion, or user decision. A lane-local event may wait until the next natural checkpoint while useful non-conflicting design continues.

For decision-required, present the one real decision and send the result directly back to the lane. For blocked, present the resume, replace, or close decision only when user judgment is required. For review-ready, first perform the bounded source-side scope and snapshot audit at the next natural checkpoint; this is the read-only parent review. When the originating Execution Contract includes `validation_preauthorized: true`, follow `supervised-delivery-v1.md`: mark the lane validation-pending and create at most one fresh read-only Validation Thread for the exact event and snapshot. Without that preauthorization, do not create a task automatically; present the applicable review decision.

If review finds a defect inside the original goal, scope, validation budget, authority, and risk boundaries, send one strictly bounded remediation to the same lane. If remediation changes product design, expands scope, requires permission, lowers acceptance criteria, or accepts new risk, present a real user decision instead.

Do not send a routine acknowledgement. Reply only with an applicable user decision, a strictly bounded remediation, or an explicit resume, replace, or close instruction. Do not create a task-to-task conversation loop.
