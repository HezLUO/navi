# Navi Async Event Reconciliation V1 Design

## Status

Approved design. This document defines a bounded receiver-side safety net for
Navi's Codex-first task coordination.

This design does not authorize implementation, worktree creation, target
project writes, merge, push, release, publication, Runtime Surface work, a
background service, or a persistent event queue.

## Problem

Navi Lane Handoff already defines structured task-to-task events and the
`Awaiting Direct Event` workflow state. A real Git-backed installation
calibration exposed a remaining delivery gap:

1. the Calibration Task completed and used host task messaging;
2. the sender received a successful delivery result and believed the Source
   Main Task had received the event;
3. no corresponding event became visible in the active Main Task context; and
4. the user had to ask the Main Task to inspect the Calibration Task.

The missing capability is not forced interruption or unconditional wakeup.
The Main Task is usually active in design or supervision work. The missing
capability is **asynchronous event visibility and continuation**: an important
event must either enter the Main Task context or be recovered at the next
relevant control checkpoint without making the user an information bus.

## Product Decision

Use direct task messaging as the primary delivery path and add one bounded
receiver-side reconciliation at natural control checkpoints.

Do not use timers, periodic polling, repeated transcript reads, a durable
inbox, a database, a daemon, or Runtime Surface in V1.

If the host eventually provides a reliable one-shot task wait or completion
snapshot, Navi may prefer that capability. The product contract remains the
same: direct delivery first, one bounded reconciliation only when the next
control action depends on an unresolved task.

## Scope

This design applies only to a Main Task that has created or accepted ownership
of a bounded Codex task and knows its exact task identifier.

An outstanding task is reconciliation-relevant only when its next transition
may change at least one of:

- the current product premise or acceptance conclusion;
- the authorized file or action scope;
- a material risk or safety judgment;
- merge, push, tag, release, or publication readiness;
- temporary global state or external-project safety; or
- the next real user decision.

Ordinary research, low-priority exploration, routine progress, and a task that
cannot affect the current control path do not enter the reconciliation set.

## Main-Task State

The Main Task tracks each relevant task in turn-local context with the minimum
fields needed for routing:

```text
task_id
goal
declared_impact
expected_transition
last_handled_event_id
delivery_state
last_reconciliation_reason
```

`delivery_state` has three values:

- `awaiting-direct-event`: the task is open and direct delivery is primary;
- `reconciliation-needed`: a relevant control checkpoint requires one bounded
  status read because no event has become visible; and
- `closed`: the event or recovered terminal result has been handled.

This state is not written to the repository, Project Map, `state.md`, or a
global queue. It is not guaranteed to survive a new Main Task. Cross-task
durability remains outside V1.

## Normal Delivery Path

```text
bounded task reaches a meaningful transition
-> task sends one conformant structured event
-> event becomes visible to the Main Task
-> Main Task deduplicates by event_id
-> Main Task routes it at the first appropriate control checkpoint
-> task closes or enters its next explicit state
```

A premise-changing event is handled at the first safe opportunity. A
lane-local event may wait until a natural checkpoint while useful
non-conflicting work continues. Direct delivery does not imply immediate
mid-sentence interruption.

## Reconciliation Checkpoints

The Main Task may reconcile an unresolved relevant task once when it is about
to:

1. present a user decision that depends on that task;
2. create, replace, cancel, or redirect a related execution or validation
   task;
3. merge, push, tag, release, or publish affected work;
4. claim that the session has no useful work other than waiting; or
5. close the affected product lane or session phase.

Completing an ordinary design paragraph is not itself a checkpoint. A
checkpoint exists only when the next control action could be wrong if the task
has already changed state.

The real calibration sample would have been recovered before the Main Task
again claimed it was waiting for the Git-backed calibration result.

## One-Shot Reconciliation

At a checkpoint:

1. use the known `task_id` directly;
2. prefer a host one-shot completion snapshot or bounded wait when available;
3. otherwise perform one read-only task inspection;
4. inspect each relevant task at most once for that checkpoint;
5. never repeat the read because the task is still running; and
6. do not list or search tasks when the exact identifier is already known.

A later read is allowed only at a distinct checkpoint whose control action
again depends on the unresolved result. No timer, sleep, resend loop, or
progress-monitoring loop is permitted.

## Result Routing

### Running

Return silently to useful non-conflicting work. Do not tell the user that the
task is merely still running.

### Completed With A Valid Event

Recover the event, deduplicate by `event_id`, and route it through the existing
Lane Handoff or Supervised Delivery contract.

### Completed Without A Valid Event

Mark `delivery-protocol-failure`.

Verified terminal facts may inform supervision, but the final report cannot be
treated as user approval. If an exact event field is required for a safe next
action, the Main Task may request one bounded re-delivery from the same task.
It must not ask the user to copy the result or create a duplicate task.

### Task Unavailable Or Read Failure

Do not retry in a loop. If the next action depends on the result, stop that
action and expose the capability gap. If the next action is independent,
continue while retaining the unresolved state.

### Duplicate Event

Silently ignore an already handled `event_id`.

## Quietness

Successful reconciliation is internal and quiet. Surface it only when:

- a recovered event changes a user decision;
- the task completed but violated the delivery protocol; or
- host capability is insufficient for a dependent high-impact action.

Do not print lane tables, reconciliation counters, running-state reports, or
internal task metadata merely to prove that Navi checked.

## Ownership

- `lane-handoff-v1.md` is the sole policy owner for direct delivery,
  `Awaiting Direct Event`, reconciliation checkpoints, one-shot inspection,
  and delivery-failure recovery.
- `SKILL.md` routes relevant coordination cases to that owner without copying
  the policy.
- `supervised-delivery-v1.md` states that execution and validation tasks use
  Lane Handoff delivery; it does not duplicate reconciliation rules.
- Existing event wire formats remain unchanged.

## Verification

Implementation verification should remain targeted and contract-focused. It
must establish:

- all five checkpoint categories;
- ordinary progress does not trigger reconciliation;
- one read per relevant task per checkpoint;
- running tasks remain quiet;
- completed missed events are recoverable;
- invalid terminal delivery is classified without implied authorization;
- duplicates remain quiet;
- canonical and packaged skill mirrors are identical; and
- no timer, polling loop, queue, watcher, daemon, or Runtime Surface claim is
  introduced.

Full repository tests, release checks, tags, and publication are not required
by this bounded behavior change unless implementation review finds shared-core
impact beyond the approved scope.

## Natural Calibration

Use the next natural multi-task product activity rather than a synthetic task:

1. the Main Task continues useful non-conflicting work;
2. a relevant bounded task reaches a meaningful transition;
3. direct delivery is observed if it becomes visible;
4. otherwise the first dependent checkpoint performs one reconciliation; and
5. the result records whether the user had to relay information or prompt a
   meaningless continuation.

Acceptance targets:

- user relay count: zero;
- meaningless continuation count caused by missed delivery: zero;
- duplicate task count: zero;
- repeated reads at one checkpoint: zero;
- running-state progress reports: zero; and
- an important missed event is recovered at the first relevant checkpoint.

The existing Git-backed calibration sample is failure evidence for the design.
It is not post-implementation PASS evidence.

## Explicit Limits

V1 cannot inspect or wake a Main Task when the Main Task receives no further
turn and the host exposes no completion wakeup. That gap must remain truthful.
Only repeated natural evidence that host-native delivery plus bounded
reconciliation cannot support the workflow may justify Runtime Surface design.
