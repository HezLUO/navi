# Navi Post-Delivery Continuity Gate V1 Design

Date: 2026-07-20
Status: approved design
Mode: Design

## Summary

Navi already says that Codex should continue through an approved boundary,
should not collapse lane-level waiting into whole-session waiting, and should
not leave the user with a bare `continue` as the only visible next action. The
remaining reliability gap is application at bounded-task closeout: after a
task, validation, commit, or other accepted delivery completes, the Main
Thread can emit a terminal completion report before it re-evaluates the wider
active product lane.

Post-Delivery Continuity Gate V1 closes that prompt-backed orchestration gap.
Before the Main Thread ends a turn after a bounded delivery, it performs one
turn-local continuity check. The check either continues one concrete
high-priority non-conflicting action, stops at a real user decision, enters a
meaningful wait, or ends because the wider objective is genuinely complete.
A bare completion report is not sufficient evidence that the Main Thread
should stop.

In this design, post-delivery means delivery of the current bounded work to its
acceptance point. It is distinct from Lane Handoff message transport, although
an accepted lane event can trigger this gate.

This remains prompt/docs-backed Codex-first behavior. It does not add a
runtime wrapper, Main Turn Host Adapter, database, daemon, scheduler, queue,
watcher, background service, or automatic permission.

## User Value

The user should not have to keep a long-running product conversation alive by
typing `continue` after every successful task. Navi should preserve momentum
inside approved boundaries while still stopping where the user can exercise
real control.

The gate therefore distinguishes four outcomes:

- continue one already-authorized or read-only non-conflicting action;
- stop at a concrete permission, scope, risk, product-direction, or delivery
  decision;
- wait because every useful action genuinely depends on an unresolved event;
  or
- end because the wider objective is complete and no user decision remains.

The user keeps ownership of new implementation, external writes, task or
worktree creation, merge, push, tag, release, publication, material scope
changes, and risk acceptance.

## Evidence And Problem Statement

The triggering sample occurred immediately after Task Route Application Gate
V1 was implemented, verified, and independently accepted. The Main Thread
returned a completion report and ended the turn even though the wider Navi
product lane remained active and a high-priority non-conflicting supervision
question was already visible: why the user still had to supply another
`continue` after accepted delivery.

The user's `continue` carried no permission, scope, risk, product choice, or
new acceptance criterion. It only restarted work the Main Thread could have
selected before ending. This is a continuation-friction error sample.

Existing pause and decision-visibility prose describes the desired behavior,
but repeated samples show that descriptive rules alone are not reliably
applied at final-response time. The missing element is one explicit
pre-final-response gate with a bounded input, deterministic outcomes, and
focused regression coverage.

## Goals

1. Require one continuity check before a terminal response after accepted
   bounded delivery while the wider source task may still be active.
2. Distinguish bounded-task completion from wider product-lane completion.
3. Continue the highest-priority useful non-conflicting action when its
   authority is already covered or it is read-only design or supervision.
4. Stop only at a real user decision, meaningful whole-session wait, or
   genuine natural end.
5. Preserve Awaiting Direct Event, Main-Task Reconciliation, Next Decision
   Visibility, Plan Reliability, and Task Route Application ownership.
6. Keep ordinary successful continuity checks quiet.
7. Prevent endless work manufacture, scope drift, permission bypass, and
   automatic phase escalation.
8. Add focused contract tests and a natural calibration boundary.

## Non-Goals

This design does not:

- make the Main Thread run forever;
- start a new implementation, calibration, release, task, worktree, or agent
  merely to avoid ending a turn;
- create a general task planner, roadmap parser, queue, or persistent state;
- poll Execution or Validation Tasks for ordinary progress;
- bypass brainstorming, design approval, implementation scope, dependency,
  validation-budget, or Git boundaries;
- turn every completion into a visible Navi map or decision menu;
- reinterpret silence as approval;
- switch the active Main turn's model or reasoning effort;
- implement Runtime Surface or Main Turn Host Adapter behavior; or
- declare Product Complete from static tests alone.

## Alternatives Considered

### Pre-final Post-Delivery Continuity Gate

This is the selected approach. It strengthens the existing supervision owner
at the exact failure boundary and requires no new runtime or persistent
artifact.

### Record Calibration Only

The project could retain the sample and rely on the existing pause rules.
This has the smallest diff, but repeated continuation-friction samples show
that the current descriptive rules do not reliably trigger a closeout check.
It is rejected as insufficient.

### Runtime Or Main Turn Host Adapter

A host wrapper could prevent a Main Thread from ending until it passes a
machine-enforced state transition. This would be stronger, but it introduces a
new product layer and is disproportionate to the current evidence. It remains
a later option only if the prompt-backed gate is repeatedly bypassed after
natural calibration.

## Ownership

`supervision-v1.md` remains the sole detailed owner of pause semantics,
non-conflicting-work priority, next-decision visibility, and the new
Post-Delivery Continuity Gate.

`SKILL.md` exposes only the hard boundary: accepted bounded delivery must not
be treated as automatic Main Thread closure while a useful non-conflicting
action or real next decision remains.

`lane-handoff-v1.md` continues to own direct event delivery, Awaiting Direct
Event, and Main-Task Reconciliation. It does not duplicate the continuity
check.

`model-routing-v1.md` continues to own model and reasoning application if a
separately authorized continuity outcome later creates or reroutes a task.

Canonical and packaged skill files remain byte-identical mirrors.

## Turn-Local Continuity Check

The Main Thread builds one ephemeral check immediately before a terminal
response after accepted bounded delivery:

```text
NAVI_POST_DELIVERY_CONTINUITY
version: 1
completed_boundary: concise accepted delivery
source_task_state: active | complete | uncertain
highest_priority_candidate: concrete action or none
candidate_class: covered-action | read-only-design | read-only-supervision | real-decision | dependent-wait | natural-end
conflict_state: none | file-scope | premise | acceptance | lane | unknown
authority_state: covered | user-required | none
result: continue | decision-required | wait | end
stop_point: next concrete acceptance or decision boundary
```

The record is turn-local coordination evidence. It is not printed by default,
written to the repository, stored in `.navi`, added to `AGENTS.md`, or treated
as a durable task queue.

## Gate Inputs

Use only evidence already available at closeout or one bounded read-only
orientation pass:

- the user-approved objective and current bounded acceptance point;
- whether the wider source product lane remains active;
- known unresolved task events and their declared impact;
- the current roadmap, design, or product-debt authority already used by the
  active task;
- the highest-priority concrete next candidate;
- file, premise, acceptance, and lane conflicts; and
- existing permission, scope, phase, and Git boundaries.

Do not scan every document, invent a general plan, read unrelated private
records, or poll tasks merely to populate the check. If the source state is
uncertain and one short read-only orientation cannot resolve it, route a
concrete user decision rather than pretending continuity is proved.

## Decision Order

Apply this order exactly once at the closeout boundary:

1. **Continue an already-approved action.** If the completed delivery is an
   intermediate point inside a still-active bounded loop, continue to the
   declared acceptance point without a menu or user prompt.
2. **Handle a premise-changing event.** If an inbound result changes scope,
   risk, acceptance, product direction, or the next user decision, process it
   before unrelated work.
3. **Continue useful non-conflicting work.** Select the highest-priority
   concrete read-only design or supervision action that does not alter the
   completed candidate or a live lane's premise.
4. **Stop at a real decision.** Name the exact action, boundary, and
   consequence. Do not offer bare `continue`.
5. **Enter a meaningful wait.** Use this only when every useful action depends
   on an unresolved relevant event and no safe non-conflicting work remains.
6. **End naturally.** Use this only when the wider objective is complete and
   no unresolved user-relevant decision remains.

Do not select low-priority cleanup, unrelated feature work, extra validation,
or speculative runtime design merely to avoid waiting or ending.

## Continue Outcome

`result: continue` is allowed when either:

- the next step is inside an already-approved bounded loop; or
- the next step is read-only design or supervision that is high priority,
  concrete, and non-conflicting.

The Main Thread performs the action in the same turn and reruns ordinary
workflow judgment at its next real boundary. It does not emit a completion
report first and wait for another user message.

If the continued analysis reaches a new product design choice, implementation
scope, permission, external-state mutation, task/worktree creation, Git
boundary, or release action, it stops there with the concrete decision.

## Decision-Required Outcome

`result: decision-required` names one real user-owned transition, such as:

- approve or revise a product design;
- authorize implementation or a changed file scope;
- choose between materially different product directions;
- accept material risk or reduced acceptance criteria;
- authorize external or cross-project state change;
- create a task or worktree when that creation is not already authorized; or
- merge, push, tag, release, or publish.

The response must state the recommended option and why. It must not disguise
the decision as `continue`, ask for generic confirmation, or include fake
branches.

## Wait And End Outcomes

`result: wait` requires an unresolved relevant event and proof that all useful
next actions depend on it. The Main Thread names the dependency and expected
direct transition. It does not ask the user to keep the session alive with
`continue` and does not poll ordinary progress.

`result: end` requires the wider source objective to be complete. The response
may summarize the accepted result, but it must not imply that a still-open
product lane is complete or manufacture a next menu where no decision exists.

## Relationship To Existing Workflow States

### Awaiting Direct Event

After dispatch, Awaiting Direct Event still prevents polling. The Main Thread
may continue useful non-conflicting design or supervision. When the direct
event arrives and the bounded delivery is accepted, this gate decides whether
the wider Main Thread continues, stops at a decision, waits on another event,
or ends.

### Main-Task Reconciliation

If the Main Thread is about to claim that waiting or ending is the only useful
outcome while a relevant task remains unresolved, that claim is a dependent
control checkpoint. Main-Task Reconciliation runs once before this gate can
return `wait` or close the affected lane.

### Task Route Application Gate

Continuity judgment does not authorize task creation. If a separately approved
outcome creates an Execution, Validation, or Router Task, the Task Route
Application Gate must still pass with explicit host model and reasoning
arguments.

## Conflict Rules

Non-conflicting work must not:

- edit the same files as a live or validation-pending candidate;
- change an accepted plan, premise, scope, or acceptance criterion behind an
  active lane;
- make a pending result obsolete;
- consume a user-owned implementation, external-state, Git, or release
  decision;
- expand the verification budget without authority; or
- create a contradictory product judgment.

When conflict is uncertain, prefer one short read-only clarification. If it
remains uncertain, stop at a concrete decision instead of continuing.

## Quietness

A passing continuity check is quiet. The Main Thread simply continues the
concrete action. Do not print the schema, announce that a gate passed, or add a
Progress Map merely because a task completed.

Surface structure only when it improves control: a real decision, meaningful
wait, conflict, uncertain source state, or material product-direction choice.

## Failure Handling

- Missing a continuity check is a supervision-protocol failure and should be
  recorded when the user must provide a content-free `continue`.
- An invalid `continue` result that crosses authority or conflict boundaries
  must stop before the action and route the real decision.
- An invalid `wait` or `end` result must be corrected by continuing the known
  high-priority non-conflicting action or exposing the real next decision.
- The gate must not retry tasks, poll, create a background loop, or persist a
  queue.
- Repeated prompt-backed gate failures after natural calibration are evidence
  for reconsidering a Host Adapter or Runtime Surface, not authorization to
  build one automatically.

## Testing Strategy

Focused contract tests must prove:

1. the continuity check runs before a terminal response after accepted bounded
   delivery;
2. bounded-task completion is not treated as wider source-task completion;
3. an already-approved next action continues to its acceptance point;
4. high-priority read-only design or supervision continues when non-conflicting;
5. file, premise, acceptance, and lane conflicts prevent continuation;
6. implementation, task creation, external state, Git, and release boundaries
   remain user-owned;
7. a real decision is concrete and does not use bare `continue`;
8. `wait` requires every useful action to depend on an unresolved event;
9. `end` requires the wider source objective to be complete;
10. Awaiting Direct Event and Main-Task Reconciliation ownership remains
    unchanged;
11. successful ordinary checks remain quiet; and
12. canonical/package owners remain byte-identical.

Tests should normalize Markdown whitespace where phrase continuity matters.
They must not depend on natural line wrapping.

## Natural Calibration

Implementation and static tests do not prove Main Thread adherence. The first
natural calibration should use a genuine bounded product task, not an
artificial continuity-only exercise.

The implementation journey may count as the remaining joint Codex-first
Product Complete sample only when all of the following are observed together:

- the user relay count is zero;
- the meaningless `continue` count is zero;
- Execution and Validation tasks use explicit accepted model and reasoning
  routes;
- review-ready and validation results return directly;
- plan-artifact corrections are aggregated and bounded;
- remediation stays within its approved limit;
- accepted delivery triggers this continuity check before terminal closeout;
- the Main Thread continues useful non-conflicting work or stops at one real
  user decision; and
- the user confirms that the final supervision behavior was acceptable.

The triggering 2026-07-20 sample is negative baseline evidence. It does not
count as a passing calibration because the user had to supply `continue`.

## Acceptance Criteria

Post-Delivery Continuity Gate V1 is implementation-ready when:

1. this design is approved and committed;
2. the implementation plan passes Plan Reliability satisfiability checks;
3. `supervision-v1.md` owns one exact turn-local gate and decision order;
4. `SKILL.md` exposes the pre-final hard boundary without duplicating the full
   schema;
5. focused tests cover continue, decision, wait, end, conflict, authority,
   quietness, and whitespace-safe semantics;
6. package mirrors are byte-identical;
7. current roadmap, debt, design-history, and calibration records describe the
   active-but-uncalibrated state truthfully; and
8. one independent Validation Task accepts the exact implementation snapshot.

Implementation acceptance does not itself authorize merge, push, tag,
release, publication, Runtime Surface, or a Product Complete claim.
