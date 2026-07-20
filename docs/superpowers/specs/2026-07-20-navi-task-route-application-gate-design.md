# Navi Task Route Application Gate V1 Design

Date: 2026-07-20
Status: approved design
Mode: Design

## Summary

Navi Task Routing Foundation can choose an appropriate model and reasoning
effort for bounded Codex Execution and Validation Tasks. The Codex host can
apply those values when a task is created or when an existing task receives a
route-changing follow-up. The remaining reliability gap is application: a Main
Task can compute or describe a route but omit the explicit host `model` or
`thinking` arguments, causing the new task to inherit the host default while
appearing to follow Navi routing.

Task Route Application Gate V1 closes that prompt-backed orchestration gap. A
route-authorized task creation or route-changing follow-up must pass one
fail-closed pre-send gate. Missing, unavailable, or mismatched route values stop
the host operation. Only a successful host call using the exact requested
values can produce an `applied` result.

This remains prompt/docs-backed Codex-first behavior. It does not add a runtime
wrapper, Main Turn Host Adapter, database, daemon, scheduler, queue, watcher, or
background service.

## User Value

When the user authorizes Navi task routing, newly created Execution and
Validation Tasks should use the selected model and reasoning effort rather than
accidentally inheriting the user's default. The user should not need to inspect
every task header to discover a missing route application.

The gate also preserves truthful evidence:

- an explicit route accepted by the host is `applied`;
- an unavailable or rejected route is `recommended-not-applied`;
- host default is used only when model routing was not authorized; and
- no task is created under an unintended default merely because a route field
  was omitted.

## Goals

1. Require one complete route decision before every routing-enabled task
   creation.
2. Require the exact resolved model and reasoning effort in the corresponding
   Codex host request.
3. Separate the pre-send decision from the post-call application result.
4. Fail closed when required fields are missing, unavailable, or inconsistent.
5. Apply the same rule to a route-changing follow-up on an existing task.
6. Keep ordinary follow-ups within a valid unchanged Route Lease free of
   repeated routing work and repeated model arguments.
7. Preserve same-tier substitution, upward fallback, user overrides,
   quietness, and explicit decision routing from Task Model Routing V1.
8. Provide focused contract tests and byte-identical canonical/package owners.

## Non-Goals

This design does not:

- switch the active Main Task turn;
- implement the Main Turn Host Adapter or a Navi panel;
- intercept arbitrary Codex host calls in runtime code;
- persist route decisions or application results;
- poll tasks or inspect task headers after creation;
- enable Codex Fast mode or change service tier;
- silently lower a deterministic capability floor;
- change permission, scope, risk, merge, push, release, or publication
  ownership; or
- prove universal host behavior through static tests.

## Alternatives Considered

### Fail-closed pre-send gate

This is the selected approach. It prevents a route-authorized task from being
created until the route decision and host request agree. It works with the
existing Codex task creation and follow-up boundaries and adds no runtime
surface.

### Post-send audit and recreation

A Main Task could create the task first, inspect its effective route, and
discard or recreate it after a mismatch. This produces duplicate tasks,
avoidable model cost, ambiguous delivery state, and possible partial execution.
It is rejected.

### Runtime or Host Adapter enforcement

A wrapper around all task traffic could enforce the rule mechanically. That
would provide a stronger guarantee, but it creates a new runtime product layer
and is not justified by the current evidence. It remains a later option if the
prompt-backed gate is repeatedly bypassed after natural calibration.

## Ownership

`model-routing-v1.md` is the sole detailed owner of the application gate,
decision schema, application-result schema, fallback, and failure semantics.

`supervised-delivery-v1.md` adopts the gate at Execution Task creation,
Validation Task creation, and route-changing validation follow-ups. It does not
duplicate the complete schema.

`SKILL.md` exposes only the hard boundary: when routing is authorized, a task
must not be sent without a passed application gate or silently fall back to the
host default.

The package copies remain byte-identical mirrors of the canonical skill files.

## Route Decision State

The route decision is computed before the host operation and therefore cannot
truthfully claim that the route is already applied. Gate V1 therefore uses a
versioned route-decision revision rather than changing the meaning of the
existing V1 artifact:

```text
NAVI_ROUTE_DECISION
version: 2
application_state: pending | host-default
```

`pending` means routing is authorized, the route is complete, and the matching
host operation has not yet succeeded. It is valid only inside the bounded
pre-send lifecycle and must not be reported as completed automatic routing.

`host-default` remains valid only when routing was not authorized. In that
case, no application gate or Router Check is created and host model/reasoning
overrides are omitted.

Final application truth is recorded separately rather than rewriting the
decision embedded in a task prompt.

Existing `NAVI_ROUTE_DECISION V1` records remain readable as historical
evidence and retain their original `applied | host-default |
recommended-not-applied` semantics. New routing-enabled task creation and
route-changing follow-up boundaries use V2. No migration rewrites prior task
prompts, handoffs, calibration evidence, or committed history.

## Route Application Result

After the host operation returns, the Main Task records one result for the
same `route_id`:

```text
NAVI_ROUTE_APPLICATION
version: 1
route_id: matching NAVI_ROUTE_DECISION identifier
boundary: task-create | route-changing-follow-up
target_role: execution | validation | router
target_task: created or continued Codex task identifier, or unavailable
requested_model: exact resolved model identifier
requested_reasoning: exact host-supported reasoning effort
host_operation: create-task | send-follow-up
application_state: applied | recommended-not-applied
host_evidence: concise successful task identity or rejection evidence
```

`applied` is valid only when the host accepts a request carrying the exact
`requested_model` and `requested_reasoning`. Host success is bounded evidence
of accepted request parameters; it is not a runtime attestation of every model
token or future turn.

`recommended-not-applied` records a host rejection, unsupported combination,
or unresolved route. It cannot be described as automatic switching.

The result is ephemeral coordination evidence. It must not be written to a
project file, `.navi`, `AGENTS.md`, or a global route database.

## Application Gate

The gate runs immediately before a routing-enabled task creation or
route-changing follow-up. It passes only when all conditions hold:

1. The Execution Contract or Validation Contract explicitly authorizes model
   routing.
2. One complete `NAVI_ROUTE_DECISION V2` exists for the exact task, role, and
   stage boundary.
3. `application_state` is `pending`.
4. `resolved_model` and `reasoning_effort` are concrete host-request values,
   not `unavailable`.
5. The host request includes both model and reasoning arguments.
6. The request values exactly equal the decision values.
7. The route is at or above the deterministic floor and satisfies required
   capabilities and any user override.
8. The task prompt carries the same stable `route_id` and decision rather than
   an unbound prose recommendation.

If any condition fails, the host operation must not be sent. The Main Task
either resolves an allowed same-tier substitute, moves upward, or returns a
real `decision-required` event. It must not omit the overrides and create the
task under the host default.

## Lifecycle

### New Execution Task

1. Build the Routing Context from the approved Execution Contract.
2. Resolve one Route Decision with `application_state: pending`.
3. Run the Application Gate against the intended task-creation arguments.
4. Send the task with the exact model and reasoning values.
5. On host success, record one `NAVI_ROUTE_APPLICATION` with `applied` and the
   created task identifier.
6. On host rejection, record `recommended-not-applied`; do not claim task
   creation or automatic routing.

### New Validation Task

The Main Task independently derives the validation floor from
`validation_level` at review-ready. It must not inherit the Execution Task's
route. It then follows the same gate and application-result lifecycle before
creating the one fresh Validation Task.

### Existing Task Follow-up

An ordinary follow-up inside a valid, unchanged Route Lease keeps the task's
current settings and omits model/reasoning overrides. It does not create a new
Route Decision or Application Result.

When stage, floor, user override, capability requirement, or an explicit
escalation trigger changes the route, create a new Route Decision and pass the
Application Gate before sending the follow-up with explicit model and reasoning
values. The follow-up result uses `boundary: route-changing-follow-up`.

## Failure Handling

- Missing route authorization uses `host-default`; it is not a routing failure.
- Authorized routing with a missing decision, missing argument, mismatched
  argument, or `unavailable` value is a pre-send gate failure.
- A host rejection produces `recommended-not-applied` and follows existing
  same-tier-then-upward fallback.
- No fallback may lower the deterministic floor or use host default silently.
- If no valid route can be applied, return `decision-required` with the blocked
  capability and recommended route.
- A failed Validation Task creation leaves the candidate validation-pending.
- Gate failure does not authorize a duplicate task, polling, retry loop,
  permission change, scope expansion, merge, push, release, or publication.

## Quietness

A passed ordinary gate is quiet. The Main Task does not print route tables or
application records unless the user asks or the route materially changes cost,
latency, capability, or risk.

Surface only a real application failure, unavailable required tier,
experimental selection, below-floor override, or other existing visible route
condition. Do not ask the user to confirm ordinary eligible routing again.

## Testing Strategy

Focused contract tests must prove:

1. the V2 decision uses `pending` before a routing-enabled host call while V1
   evidence remains read-compatible;
2. `host-default` is restricted to routing-not-authorized paths;
3. the gate requires a complete decision and exact model/reasoning argument
   equality;
4. omission, mismatch, and unavailable values fail before sending;
5. only host acceptance creates an `applied` application result;
6. rejection creates `recommended-not-applied` without an automatic-switching
   claim;
7. same-tier and upward fallback remain available without downward fallback;
8. Execution and Validation routes remain independent;
9. unchanged-lease follow-ups do not reroute;
10. route-changing follow-ups repeat the gate with explicit arguments;
11. the Navi skill exposes the fail-closed boundary without duplicating the
    complete owner; and
12. canonical/package mirrors remain byte-identical.

Static tests validate the contract surface. One later natural joint Product
Complete calibration must still demonstrate that the Main Task actually emits
the decision, passes explicit Task API arguments, receives host acceptance, and
records truthful application evidence. A static pass alone is not product
proof.

## Implementation Boundary

The expected implementation scope is limited to:

- canonical and packaged `model-routing-v1.md`;
- canonical and packaged `supervised-delivery-v1.md`;
- canonical and packaged Navi `SKILL.md` only for the concise hard boundary;
- focused model-routing, supervised-delivery, skill, capability-truthfulness,
  and current-surface tests where required; and
- current design-history, roadmap, product-debt, or calibration-log wording
  only when necessary to state that Gate V1 is implemented but naturally
  uncalibrated.

No CLI, runtime, dependency, package metadata, Distribution, Update Host,
external project, `work/`, merge, push, tag, release, or publication change is
part of this design.

## Acceptance

Gate V1 is implementation-ready when:

- one canonical owner defines the decision, gate, and result lifecycle;
- Supervised Delivery invokes it at every authorized creation or
  route-changing follow-up boundary;
- missing or mismatched explicit Task API parameters fail closed;
- unchanged-lease follow-ups remain lightweight;
- host-default and applied claims remain truthful;
- focused tests and package mirror verification pass; and
- independent validation finds no Critical or Important contract defect.

Implementation and static acceptance do not close Task Model Routing or Codex-
first Product Complete calibration. Natural calibration remains the evidence
gate for consistent host application across real Execution and Validation
Tasks.
