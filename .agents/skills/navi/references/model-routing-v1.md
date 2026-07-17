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

Emit exactly one decision for one task-and-stage boundary:

NAVI_ROUTE_DECISION
version: 1
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
application_state: applied | host-default | recommended-not-applied

`applied` is valid only after the Codex host accepts the requested model-and-reasoning combination. `host-default` is valid only when model routing was not authorized. `recommended-not-applied` records truthful failure evidence and must not be described as automatic routing.

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

Keep ordinary routes and valid same-tier substitutions quiet. Explain only a material stage change, policy or budget exceedance, experimental selection, unavailable required tier, below-floor override, or a material cost, delay, capability, target, scope, or risk change. Keep the explanation concise. Do not print a route table, score, private reasoning, or repeated route status unless the user asks and it creates control gain.

## Failure Handling

Return `decision-required` when a required route cannot be applied, the available route is below the floor, policy permission is missing, or host evidence conflicts. Preserve the current valid lease until a turn boundary when possible. Do not silently lower the tier, retry in the background, create duplicate Router Checks, widen scope, grant permission, or claim automatic switching succeeded. Routing failure does not authorize merge, push, tag, release, publication, or product-risk acceptance.

## Boundaries

Task Model Routing V1 is prompt/docs-backed supervision for bounded Codex tasks. It is not a database, not a daemon, and not a scheduler. It is not a queue, watcher, background service, Runtime Surface, UI, MCP server, or other-agent adapter.

Codex Fast mode is user-controlled; Navi must not enable, disable, purchase, or change its service tier. Navi must not switch an active turn. This milestone does not implement the Main Turn Host Adapter, persist route policy, create a permanent Router Task, or prove natural host behavior through static tests.
