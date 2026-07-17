# Navi Codex Model And Reasoning Routing Design

Date: 2026-07-18

Status: Approved in design discussion on 2026-07-18

## Summary

Navi should add Codex-first automatic model and reasoning routing across its
three-role workflow:

1. the persistent Main Thread;
2. each bounded Execution Task; and
3. each independent Validation Task.

The router chooses a capability tier and reasoning effort from structured task
evidence, then a thin Codex Host Adapter resolves that abstract route to a
model available on the target host. Routine routes remain quiet. Capability
floors, user overrides, stage leases, and upward-only fallback prevent a fast
model from silently taking ownership of work that requires stronger judgment.

V1 is complete only when all three roles can apply a route. Task-level routing
comes first because current Codex task interfaces already accept model and
reasoning overrides. Main Thread routing follows through a thin Host Adapter
that applies a route to the same thread at a turn boundary. It does not switch
models during an active response, create a replacement Main Thread, or require
a database, daemon, durable queue, or full Navi Runtime Surface.

This design does not approve implementation, a worktree, dependencies,
external-project changes, integration, push, tag, release, publication, or
Fast mode changes.

## Product Problem

Navi already separates product judgment, file-changing execution, and
independent validation. Those roles have materially different model needs:

- narrow evidence gathering and mechanical edits benefit from low latency;
- ordinary implementation needs balanced coding and tool ability;
- product direction, architecture, difficult debugging, and final acceptance
  need stronger judgment; and
- independent validation must not inherit an executor's underpowered route or
  allow that executor to certify its own capability choice.

Using the strongest model and highest reasoning for every task wastes time and
credits. Using a fast model everywhere risks weak planning, missed failure
boundaries, and false confidence. Asking the user to select a model for every
temporary task turns the user into the routing layer and adds another source
of meaningless approvals.

The Main Thread has an additional constraint. A model is selected before an
active turn begins, so a prompt-backed Navi skill cannot change the model that
is already producing the current response. Current Codex task transports can,
however, specify model and reasoning for a new task or the next turn of an
existing task. Main Thread automation therefore belongs at the pre-dispatch
turn boundary, not inside the active response.

## Current Codex Platform Basis

This design is based on a read-only inspection of Codex 0.144.5 and the current
Codex App task interfaces on 2026-07-18:

- task creation accepts model and reasoning overrides;
- follow-up delivery to an existing task accepts model and reasoning
  overrides;
- `codex exec resume` accepts a model override, while a one-run config override
  can set `model_reasoning_effort`; and
- the current Pro-user target environment can access the GPT-5.6 family.

The official Codex material also describes model and intelligence selection in
the composer, `model` and `model_reasoning_effort` in agent configuration, and
different model choices for demanding agents and lighter subagent work:

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents.md)
- [Configuration basics](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference)

These capabilities prove turn-boundary route application, not self-modification
of an active model call. No inspected skill or plugin interface can replace the
model after the current response has begun. The Host Adapter must therefore
own pre-dispatch application and must revalidate the target host when Codex
interfaces or model catalogs change.

## Goals

The routing system should:

1. choose an appropriate model tier and reasoning effort for each Navi role;
2. preserve a stable Main Thread while allowing turn-boundary route changes;
3. reduce latency and resource use for genuinely narrow work;
4. preserve strong capability floors for design, risk, and acceptance;
5. prevent a fast model from silently downgrading or extending its own lease;
6. preserve explicit user control over task-, stage-, and session-level
   overrides;
7. adapt to the models actually available on each Codex host and account;
8. remain quiet unless a route changes user-visible cost, delay, risk, or
   capability; and
9. earn broader runtime complexity only if natural calibration proves a thin
   Host Adapter insufficient.

## Non-Goals

V1 does not:

- switch the model during an active response;
- create a second Main Thread merely to obtain another model;
- let a prompt-only skill claim that a host route was applied when it was not;
- build a permanent Router Thread;
- persist route leases in project files or a global database;
- store full conversations, private reasoning, or complete test transcripts in
  routing records;
- automatically control Codex Fast mode or service tier;
- hardcode one permanent list of model IDs;
- silently use a model below the required capability floor;
- automatically merge, push, tag, release, publish, accept product risk, or
  grant new permissions; or
- generalize routing to other agent hosts before Codex-first behavior is
  calibrated.

## Terminology

### Model Tiers

`fast`, `standard`, and `strong` are Navi capability tiers, not permanent model
names.

- **fast** means the lowest-latency route that still satisfies the task's
  required capabilities and quality floor.
- **standard** balances coding ability, tool use, latency, and cost for ordinary
  bounded work.
- **strong** is the floor for ambiguous planning, architecture, difficult
  debugging, high-impact risk, and final judgment.

A fast route is a model-and-reasoning combination. A smaller model at `xhigh`
may not be fast in wall-clock terms, while a strong model at `low` remains a
strong-tier route rather than becoming a fast model.

### Reasoning Effort

Reasoning effort is selected separately from the model tier. V1 uses the
efforts supported by the resolved host model, principally `low`, `medium`,
`high`, and `xhigh`. Unsupported combinations are invalid routes.

### Fast Mode

Codex Fast mode accelerates a supported model at increased credit cost. It is
not a model tier and remains user-controlled in V1. Navi must not enable,
disable, or purchase Fast mode automatically.

### Route Lease

A Route Lease is a task-local decision that binds a resolved model and
reasoning effort to a named stage. It remains stable until its stage ends or an
explicit escalation trigger invalidates it.

## Default User Policy

The default policy is **balanced**:

- satisfy capability and safety floors first;
- then balance quality, latency, and cost;
- use strong models for design, acceptance, and high-impact uncertainty;
- use faster models only for bounded work that remains above its quality floor;
  and
- expose only route changes that affect user control.

Future quality-first or efficiency-first policies may change preferences above
the floor. They must not weaken permission, safety, irreversibility, or final
acceptance floors.

## Role Routing Table

| Role or validation level | Default route | Intended work |
| --- | --- | --- |
| Main Thread: design, architecture, acceptance | `strong + high` | Goals, boundaries, priority, architecture, and final judgment |
| Main Thread: ordinary coordination | inherit the current stage lease | Avoid route churn for isolated status questions |
| Execution: mechanical, low-risk, reversible | `fast + medium` | Search, extraction, formatting, and explicit small edits |
| Execution: ordinary bounded implementation | `standard + medium` | Normal features and targeted fixes |
| Execution: shared core or complex debugging | `strong + high` | Cross-module or high-uncertainty implementation |
| Validation Level 1 | `fast + medium` | Read the contract, exact diff, and supplied evidence |
| Validation Level 2 | `standard + high` | Trace affected owners and investigate concrete uncertainty |
| Validation Level 3 | `strong + high`, optionally `xhigh` | Permission, filesystem, migration, and costly failure boundaries |
| Router Check | `strong + low`, optionally `medium` | Decide only the minimum valid route |

Validation routes are derived independently from their assigned validation
level. A Validation Task does not inherit an Execution Task's fast lease, and
an executor does not choose the capability required to accept its own work.

## Routing Architecture

### Routing Context Builder

The Context Builder extracts only facts that can change route selection:

```yaml
role: main | execution | validation | router
work_mode: design | calibration | implementation | release
task_kind: status | exploration | edit | debug | review | decision
scope: narrow | multi-file | cross-module | external-state
reversibility: reversible | costly | irreversible
uncertainty: low | medium | high
evidence_conflict: true | false
validation_level: 1 | 2 | 3 | none
required_capabilities:
  - tools
  - vision
  - long-context
recent_failures: 0 | 1 | 2+
user_policy: balanced
user_override: optional
current_lease: optional
```

The builder may include a short task summary. It must not include the complete
conversation, private reasoning, or an executor's full test transcript.

### Capability Floor Engine

The Floor Engine applies deterministic rules before any model judgment. It
sets the lowest allowed tier and reasoning effort from role, work mode, scope,
risk, reversibility, validation level, required capabilities, and recent
failure history.

High-risk, irreversible, permission-bearing, architecture, final-acceptance,
and Level 3 work routes directly to a strong floor. These decisions do not need
a Router Check.

### Router Check

The Router Check exists only when deterministic rules leave more than one valid
route and the choice would materially affect quality, latency, or cost.

It is:

- short-lived;
- read-only;
- tool-free;
- given the structured Routing Context rather than the full conversation; and
- limited to returning a Route Decision.

Ordinary ambiguity uses `strong + low`. Conflicting route evidence may use
`strong + medium`. A question complex enough to require `strong + high` should
route the actual task to `strong + high` instead of spending that budget on
recursive routing.

The Router Check cannot lower the deterministic floor. Missing or ambiguous
evidence defaults upward. It cannot modify files, start implementation, approve
an operation, extend a fast lease, or create another Router Check.

Navi does not create a permanent Router Thread. A permanent router would add
context synchronization, stale-state risk, a new information bottleneck, and a
recursive routing problem before natural use proves those costs necessary.

### Route Lease

The selected route is task-local and stage-bound. It records:

```yaml
tier: strong
model: gpt-5.6-sol
reasoning: high
lease_scope: current-design-stage
reason_codes:
  - product-design
  - high-uncertainty
visibility: explain
escalate_on:
  - premise-change
  - conflicting-evidence
downgrade_after:
  - stage-accepted
fallback:
  - same-tier
  - upward-only
```

Each decision has a unique ID bound to its task and stage so duplicate Router
Checks and stale-lease reuse can be rejected.

Route leases are not written to `.navi`, `AGENTS.md`, or another project file.
Long-term user preferences may be stored through a separately approved user or
host configuration surface. A lost lease is conservatively recomputed from
current evidence.

### Host Adapter

The Host Adapter:

1. reads the models and reasoning efforts available on the target Codex host;
2. filters them by required tools, modalities, context, account entitlement,
   preview policy, and deprecation state;
3. resolves the abstract tier to one concrete model;
4. applies the route when creating a task or submitting the next turn; and
5. reports truthfully whether the host accepted the route.

Task-level routing uses the model and reasoning fields already exposed by
Codex task creation and follow-up interfaces. Main Thread routing requires a
pre-dispatch adapter that submits the user's next message to the same thread
with the selected model and reasoning effort. It does not replace the Main
Thread or alter an already-running turn.

If the adapter cannot apply a route, it returns `recommended-not-applied` and
must not claim automatic switching succeeded.

## Model Catalog Policy

The Host Adapter does not treat a static tool description or Navi release as a
complete model catalog. It uses the target host's current catalog and validates
the requested combination when applying it.

For the approved Pro-user Codex environment, the preferred current mapping is:

| Navi tier | Preferred model | Compatible fallback |
| --- | --- | --- |
| `fast` | GPT-5.6 Luna | GPT-5.4 mini |
| `standard` | GPT-5.6 Terra | GPT-5.4 |
| `strong` | GPT-5.6 Sol | GPT-5.5 |

GPT-5.3 Codex Spark is a special `ultra-fast/text-only` route for narrow,
near-instant iteration. It is not the default fast route and is not selected
when the task requires broader modality or tool capability.

Deprecated models do not enter a new route. Preview or experimental models
require user policy permission and become visible when selected.

When a preferred model is unavailable, the adapter tries another valid model
in the same tier and then moves upward. It never silently moves below the
capability floor. If only lower-tier models are available, the Main Thread asks
for a real user decision.

## Turn And Lease Lifecycle

Routes are evaluated at these boundaries:

- creation of an Execution, Validation, or Router Task;
- entry into a new Main Thread product stage or Work Mode;
- material scope expansion;
- conflicting evidence or repeated failure;
- transition to irreversible, permission-bearing, or external-state work;
- a validation-level increase; or
- loss of required tools, context, modality, or model availability.

Escalation applies at the next turn boundary and may occur before a stage ends.
The current response completes on its existing model.

Downgrade requires all of the following:

- the current stage is explicitly complete;
- no unresolved Important or Critical risk remains;
- the next stage has a lower capability floor;
- no higher user override remains active; and
- the current fast model is not approving its own downgrade or lease extension.

This hysteresis prevents model oscillation. A narrow status question inside a
strong design lease does not itself cause a temporary downgrade and immediate
upgrade.

## User Overrides

The user may bind a model or reasoning effort to the current task, stage, or
session.

- An override at or above the floor applies directly.
- An override below the floor receives one concise risk explanation and one
  explicit confirmation gate.
- A lower route may perform reversible exploration when approved.
- Its result cannot be described as replacing the required higher-tier
  independent validation or final acceptance.
- The override expires at its stated scope and does not silently become a
  global preference.

Navi must not override an explicit user selection merely to optimize cost or
latency. It may challenge a below-floor choice without pretending that the
challenge is user approval.

## User Experience And Quietness

Ordinary routing is silent. Codex's existing model indicator is sufficient for
routine task creation and same-tier substitution.

Navi surfaces a route when:

- a material stage-boundary change occurs;
- a route exceeds the preauthorized budget or policy;
- an experimental model is selected;
- the required tier is unavailable;
- the user selects below the capability floor;
- a route materially changes expected delay or cost; or
- routing exposes a target, scope, or risk conflict.

Visible explanations remain short:

```text
Entering architecture judgment; the next turn uses Sol + high.
```

```text
Validation is Level 2, so it uses Terra + high independently of the executor.
```

The user does not need to learn Navi's tier taxonomy for ordinary use. Navi
does not print route tables, scores, private reasoning, or a supervision panel
unless the user asks and the structure creates control gain.

## Delivery Sequence And Completion Line

### Milestone 1: Task Routing Foundation

Implement and calibrate automatic routing for:

- bounded Execution Tasks;
- independent Validation Tasks; and
- exceptional Router Checks.

This milestone may be described as task-level model routing. It is not the
completed three-role feature.

### Milestone 2: Main Turn Host Adapter

Apply a Route Lease to the same Main Thread at the next-turn dispatch boundary.
The adapter preserves thread identity, completed history, and user decisions.

If the host cannot apply a route, the product remains recommendation-only for
that surface and must say so. V1 is not complete until Main, Execution, and
Validation routes are all applied in the target Codex environment.

### Runtime Reconsideration Gate

Do not add a database, background service, persistent queue, or full Runtime
Surface merely to implement these two milestones. Reconsider a runtime only if
natural calibration shows that the thin Host Adapter cannot reliably preserve
turn-boundary routing, task recovery, or concurrent-lane correctness.

## Calibration And Acceptance

Calibration proceeds in three bounded stages.

### Shadow Calibration

Compute routes without applying them during a small set of natural design,
implementation, and validation tasks. Compare the proposed route with the
human-selected route and inspect false downgrades, unnecessary escalation, and
Router Check frequency.

### Task-Level Live Calibration

Apply routing to Execution, Validation, and Router Tasks in two or three natural
product tasks. Do not manufacture a release or large test task solely to
exercise routing.

### Main-Turn Live Calibration

Use one persistent Main Thread to cover:

- design to implementation;
- implementation to validation; and
- an ordinary coordination turn that should preserve its current lease.

V1 acceptance requires:

- capability-floor violations: zero;
- fast-model self-downgrades or lease extensions: zero;
- meaningless same-stage oscillations: zero;
- user relays of routine routing information: zero;
- meaningless routing confirmations: zero;
- recursive or duplicate Router Checks: zero;
- low-tier results misrepresented as high-confidence acceptance: zero;
- no material quality regression against a fixed-strong baseline;
- observable latency or resource improvement on light work; and
- preserved user override and meaningful-switch visibility.

Automated tests cover deterministic floors, lease invalidation, fallback,
deduplication, capability filtering, and Routing Contract structure. They do
not attempt to simulate every model judgment. Natural calibration, not a large
mock-model suite or full repository test run, owns product-behavior evidence.

Task-Level instability blocks the Main Host Adapter milestone. Main routing
that proves to require durable runtime primitives returns to product design
rather than silently expanding implementation scope.

## Residual Risks

- Model catalogs, account entitlements, and host APIs can change independently
  of Navi.
- A deterministic floor can still encode a weak product assumption.
- A short Router Check can over-escalate or miss ambiguity despite conservative
  defaults.
- Prompt-backed task classification remains model-mediated even when the route
  floor is deterministic.
- Main Thread pre-dispatch integration may differ across Codex App, CLI, IDE,
  and future surfaces.
- Faster routes can reduce quality in ways that small calibrations do not
  reveal.
- Static route mappings become stale unless the Host Adapter treats them as
  preferences rather than authority.

These risks justify bounded calibration and truthful fallback. They do not yet
justify a permanent router, background service, or full Navi Runtime Surface.

## Next Gate

After this approved design is recorded, the next separate decision is whether
to enter implementation planning for Milestone 1, Task Routing Foundation.
Implementation planning must define the exact Codex adapter boundary, model
catalog probe, deterministic floor owner, Routing Contract owner, focused test
budget, and natural calibration stop point. It must not silently include the
Main Turn Host Adapter implementation, Runtime Surface, Fast mode automation,
release preparation, or publication.
