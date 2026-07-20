# Navi Task Model Routing V1

Use this reference only when the user has explicitly authorized a Navi model-routing policy for bounded Codex tasks. Navi owns capability judgment and route contracts; the Codex host owns the available model catalog, task creation, follow-up delivery, and whether a requested model-and-reasoning combination is accepted.

This is active-session, prompt/docs-backed task routing. It is not Main Turn Host Adapter behavior, active-turn switching, Fast mode control, a database, a daemon, a scheduler, or a background service.

## Routing Context

Build the smallest factual context that can change a route. It may include one concise task summary. It must not include the complete conversation, private reasoning, or a full test transcript.

NAVI_ROUTING_CONTEXT
version: 1
role: main | execution | validation | router
work_mode: design | calibration | implementation | release
task_kind: status | exploration | edit | debug | review | decision
scope: narrow | multi-file | cross-module | external-state
reversibility: reversible | costly | irreversible
uncertainty: low | medium | high
evidence_conflict: true | false
validation_level: 1 | 2 | 3 | none
required_capabilities: concise list of required tools, modality, or context
recent_failures: 0 | 1 | 2+
user_policy: balanced
user_override: optional task, stage, or session override
current_lease: optional current NAVI_ROUTE_DECISION identifier

## Deterministic Floors

Apply deterministic floors before model judgment. Work Mode is one input; role, scope, reversibility, uncertainty, required capabilities, validation level, and recent failures also constrain the route.

| Work | Minimum route |
| --- | --- |
| Main design, architecture, or acceptance | strong + high |
| Mechanical reversible execution | fast + medium |
| Ordinary bounded execution | standard + medium |
| Shared-core or complex-debug execution | strong + high |
| Validation Level 1 | fast + medium |
| Validation Level 2 | standard + high |
| Validation Level 3 | strong + high, optionally xhigh when the host supports it |

Permission-bearing or irreversible work has a strong floor. Architecture, final acceptance, high-impact risk, external-state mutation, and repeated material failure also route directly to a strong floor. Required tools, modality, context, or entitlement can raise a floor or invalidate a concrete model. A deterministic floor does not need a Router Check.

## Router Check

Create a Router Check only when deterministic rules leave more than one valid route and the remaining choice materially affects quality, latency, or cost. Ordinary ambiguity uses strong + low. Conflicting route evidence may use strong + medium.

A Router Check is short-lived, read-only, tool-free, receives only NAVI_ROUTING_CONTEXT, and returns only one NAVI_ROUTE_DECISION. It cannot lower the deterministic floor, modify files, approve an operation, or extend a fast lease. It must not create another Router Check. Missing evidence defaults upward. When route judgment itself would require strong + high, route the actual task to strong + high instead of creating a recursive Router Check.

## Route Decision

Emit exactly one pending decision for one task-and-stage boundary:

NAVI_ROUTE_DECISION
version: 2
route_id: one stable identifier for this task-and-stage route
source_task: persistent Main Thread task identifier
target_role: main | execution | validation | router
work_mode: design | calibration | implementation | release
task_kind: status | exploration | edit | debug | review | decision
capability_floor: minimum tier plus reasoning effort
selected_tier: fast | standard | strong
resolved_model: host-validated model identifier or unavailable
reasoning_effort: host-supported effort or unavailable
lease_scope: named task stage or one Router Check
reason_codes: concise factual route reasons
visibility: quiet | explain | decision-required
escalate_on: stage-invalidating conditions
downgrade_after: explicit completed stage condition
fallback: same-tier-then-upward
application_state: pending | host-default

`pending` is valid only after routing is authorized and the complete route is
ready for the matching host operation. It must not be described as completed
automatic routing. `host-default` is valid only when model routing was not
authorized; no Router Check or application gate is created for that path.

Existing `NAVI_ROUTE_DECISION V1` records remain readable as historical
evidence with their original `applied | host-default |
recommended-not-applied` meanings. New routing-authorized task creation and
route-changing follow-up boundaries use V2. Do not rewrite historical task
prompts, handoffs, calibration evidence, or committed records.

Legacy-readable V1 evidence begins with this header:

```
NAVI_ROUTE_DECISION
version: 1
```

## Route Application Result

After the host operation returns, the Main Thread records exactly one result
for the same route id:

NAVI_ROUTE_APPLICATION
version: 1
route_id: matching NAVI_ROUTE_DECISION V2 identifier
boundary: task-create | route-changing-follow-up
target_role: execution | validation | router
target_task: created or continued Codex task identifier, or unavailable
requested_model: exact resolved model identifier
requested_reasoning: exact host-supported reasoning effort
host_operation: create-task | send-follow-up
application_state: applied | recommended-not-applied
host_evidence: concise successful task identity or rejection evidence

`applied` is valid only after the Codex host accepts a request carrying the
exact requested model and reasoning effort. Host acceptance is bounded request
evidence, not a runtime attestation for every generated token or later turn.
`recommended-not-applied` records rejection, an unsupported combination, or an
unresolved route and must not be described as automatic switching.

The application result is ephemeral coordination evidence. Do not write it to
a project file, `.navi`, `AGENTS.md`, or global route state.

## Route Application Gate

Run this gate immediately before every routing-authorized task creation or
route-changing follow-up. It passes only when routing is explicitly authorized,
one complete NAVI_ROUTE_DECISION V2 exists for the exact role and stage,
application_state is pending, resolved_model and reasoning_effort are concrete,
the host request includes model and thinking arguments that exactly equal
resolved_model and reasoning_effort and neither value is unavailable, the route
is at or above the deterministic floor and satisfies required capabilities and
user overrides, and the task prompt carries the same route_id.

If any condition fails, the Main Thread must not send the host operation. It
may resolve an allowed same-tier substitute, move upward, or return
decision-required. It must not omit the overrides and inherit host default.

## Route Application Lifecycle

For a new task, build the Routing Context, resolve one V2 decision with
application_state pending, pass the gate against the exact host arguments, and
then send the task. Host acceptance of the exact request produces applied with
the created task identity. Host rejection or an unsupported combination
produces recommended-not-applied and follows same-tier-then-upward fallback;
it does not create a host-default task.

An ordinary follow-up inside an unchanged valid Route Lease omits model and
thinking overrides and does not reroute. A route-changing follow-up creates a
new V2 decision and repeats the gate before sending explicit model and thinking
arguments. The result records boundary route-changing-follow-up.

## Route Lease

A Route Lease is task-local and stage-bound. Bind `route_id`, resolved model, reasoning effort, `lease_scope`, reason codes, visibility, escalation triggers, and downgrade condition to that stage. Keep the route stable until the stage ends or a listed trigger invalidates it.

A lease must not be persisted in a project file, `.navi`, `AGENTS.md`, or a global database. A lost lease is recomputed conservatively. A fast model may request upward escalation, but it must not approve its own downgrade or extend its own lease. A downgrade requires a completed stage, no unresolved Important or Critical risk, a lower next-stage floor, and no stronger user override. A narrow status turn does not invalidate a stronger current-stage lease.

## Host Model Catalog

Treat `fast`, `standard`, and `strong` as abstract capability tiers. For the approved current Pro-user environment, prefer GPT-5.6 Luna for fast, GPT-5.6 Terra for standard, and GPT-5.6 Sol for strong. Compatible fallbacks are GPT-5.4 mini, GPT-5.4, and GPT-5.5 respectively. These are preferences, not a static model catalog.

The Codex host is authoritative for current availability, reasoning efforts, tools, modalities, context, entitlement, preview policy, and deprecation. GPT-5.3 Codex Spark is an exceptional ultra-fast/text-only route, not the default fast route. A deprecated model must not enter a new route. Experimental or preview use requires policy permission and visible selection.

## Host Resolution And Fallback

Filter host models by the deterministic floor and every required capability. Try another valid model in the same tier, then a stronger tier. Never silently fall below the floor. If only a below-floor route remains, return `decision-required` to the Main Thread.

Apply the route only at task creation or an existing-task follow-up turn boundary by supplying the host-supported model and reasoning fields. If the host rejects or cannot apply the route, return `application_state: recommended-not-applied`; this state must not claim the model changed. Do not guess an unavailable model identifier.

## User Overrides

The user may override model or reasoning for the current task, stage, or session. Apply an override at or above the floor directly. An override below the floor requires one concise risk explanation and one explicit confirmation. It may govern approved reversible exploration, but it cannot replace required independent validation or final acceptance. Expire the override at its stated scope; do not turn it into a global preference.

## Quietness

A passed ordinary Route Application Gate is quiet and does not add a visible
route report merely because explicit host arguments were accepted.

Keep ordinary routes and valid same-tier substitutions quiet. Explain only a material stage change, policy or budget exceedance, experimental selection, unavailable required tier, below-floor override, or a material cost, delay, capability, target, scope, or risk change. Keep the explanation concise. Do not print a route table, score, private reasoning, or repeated route status unless the user asks and it creates control gain.

## Failure Handling

Return `decision-required` when a required route cannot be applied, the available route is below the floor, policy permission is missing, or host evidence conflicts. Preserve the current valid lease until a turn boundary when possible. Do not silently lower the tier, retry in the background, create duplicate Router Checks, widen scope, grant permission, or claim automatic switching succeeded. Routing failure does not authorize merge, push, tag, release, publication, or product-risk acceptance.

## Boundaries

Task Model Routing V1 is prompt/docs-backed supervision for bounded Codex tasks. It is not a database, not a daemon, and not a scheduler. It is not a queue, watcher, background service, Runtime Surface, UI, MCP server, or other-agent adapter.

Codex Fast mode is user-controlled; Navi must not enable, disable, purchase, or change its service tier. Navi must not switch an active turn. This milestone does not implement the Main Turn Host Adapter, persist route policy, create a permanent Router Task, or prove natural host behavior through static tests.
