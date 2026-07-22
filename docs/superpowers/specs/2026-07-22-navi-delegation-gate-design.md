# Navi Delegation Gate V1 Design

## Status

Approved product design. The design discussion was completed on 2026-07-22.

This design defines when Navi may automatically create bounded read-only
Evidence subagents inside an authorized Main or Execution task. It preserves
the existing Main, Execution, and Validation governance model and treats
subagents as optional role-local workers rather than a fourth formal role.

This design does not authorize implementation, an implementation plan, a
worktree, dependency installation, model turns, external-state access, release,
publication, or changes to another project. Those remain separate decisions.

## Context

Navi already separates product judgment, implementation, and independent
acceptance through three formal roles:

```text
Main
|- Execution
`- Validation
```

That structure already provides the important governance boundaries:

- Main retains product direction, permission, risk, and integration decisions.
- Execution owns authorized project changes in an isolated worktree when
  required.
- Validation independently reviews an exact candidate and remains read-only.

Subagents do not replace those boundaries. Their possible additional value is
smaller in scope: a Main or Execution task may contain multiple independent
evidence questions whose investigation would otherwise create avoidable
context pressure or serial delay.

Automatic subagent creation is not required for correctness. It is an
efficiency mechanism whose normal result may be not to delegate. Navi must use
it only when the expected benefit is clearly greater than brief creation,
context loading, result reconciliation, conflict handling, and model cost.

## Evidence And Prior Art

The separate `agent-delegate` repository is a useful historical prototype. It
demonstrates several sound ideas: ambiguous goals should not be delegated,
briefs should be bounded, evidence should be required, stop conditions should
be explicit, and summarized results should preserve conflicts.

It is not an implementation dependency or product authority for Navi:

- its current V1 is a read-only MCP advisor for advanced users;
- its heuristic thresholds are not calibrated for Navi's three-role model;
- it does not own Navi Execution Contracts, worktrees, model routing,
  independent Validation, or user decisions;
- it does not create subagents; and
- its optional stateful path would add a runtime and persistence boundary that
  Navi does not need for this milestone.

Navi therefore takes only the useful problem framing. V1 does not call, bundle,
copy, require, or advertise the `agent-delegate` MCP or core package.

The supervision error recorded in
`docs/navi/supervision-error-samples.md` also remains relevant process evidence:
an active delegated lane must not be mistaken for closure of the whole Main
task. Delegation and Main-task continuity are separate judgments.

## Product Decision

Navi adds a contract-first Delegation Gate with one task-local, revocable
Delegation Lease.

The default is `continue_in_current_role`. After explicit user authorization,
Navi may automatically create a small, single wave of Evidence subagents only
when strict eligibility and benefit checks pass. The parent Main or Execution
task remains responsible for result synthesis and every subsequent decision.

V1 automatically dispatches only Evidence subagents. It may recognize that an
approved implementation plan could benefit from write-capable implementer
subagents, but those workers remain governed by the existing formal Execution
Contract and implementation workflow. The Delegation Lease grants them no
authority and does not create them.

## Goals

- Let Navi decide when a Main or Execution task is already sufficient and when
  bounded evidence delegation has clear net value.
- Reduce unnecessary context growth and serial investigation inside one formal
  role.
- Avoid low-value user confirmations for already-authorized, task-local,
  read-only delegation.
- Preserve explicit model and reasoning application for every automatically
  created Evidence subagent.
- Keep the parent role responsible for scope, evidence quality, conflicts, and
  next actions.
- Keep successful ordinary delegation quiet.
- Produce truthful degradation when the Codex host cannot enforce required
  routing, read-only behavior, limits, or structured completion.

## Non-Goals

- A fourth permanent Navi role.
- Replacing a formal Execution or Validation task.
- Automatic write-capable subagent creation.
- Automatic external-state, credential, configuration, deployment, merge,
  push, tag, release, or publication work.
- Persistent global or project delegation permission.
- A subagent tree, recursive dispatch, repeated background waves, polling, or
  monitoring.
- A new MCP server, database, queue, daemon, scheduler, watcher, panel, or
  Runtime Surface.
- Integration with or packaging of `agent-delegate`.
- A claim that subagents improve every task.

## Terms

### Formal Role

A formal role is Main, Execution, or Validation. A formal role has a defined
governance responsibility and lifecycle. It is not merely a model invocation.

### Evidence Subagent

An Evidence subagent is a temporary read-only worker owned by one parent Main
or Execution task. It answers one bounded evidence goal and returns a
structured result. It cannot approve work, alter files, create another
subagent, or become a formal Validation task.

### Workspace-Change Worker

A Workspace-Change worker may edit assigned project paths only inside an
already-authorized formal Execution workflow. Existing implementation plans may
use such workers. This design does not create, authorize, or govern them through
the Delegation Lease.

### Privileged Operation

A Privileged Operation changes global state, credentials, external projects or
services, repository integration state, or release state. It must be promoted
to a visible formal task or direct user-owned operation with its own approval.
It is never an automatic Evidence delegation.

### Delegation Lease

A Delegation Lease is ephemeral coordination authority for one current Main
task and its already-approved Execution tasks. It permits only automatic
Evidence delegation under this design.

The lease is revocable, is not persisted, and expires when the Main task ends
or when the project, goal, permission, risk, or work-mode boundary materially
changes. A new Main task requires a new authorization.

### Delegation Stage

A Delegation Stage is one stable task phase with one coherent goal and evidence
boundary. Design, implementation investigation, debugging, and task-level
review are different stages when their premises or evidence needs differ.

## Role Boundaries

### Main

Main may use the lease to create Evidence subagents for independent product,
architecture, repository, or project questions. Main retains every product,
permission, risk, worktree, integration, and release decision.

### Execution

Execution may use the inherited task-local lease to create Evidence subagents
for independent module investigation, failure analysis, or task-level read-only
review. The lease does not broaden the Execution Contract or authorize writes.

### Validation

Validation does not inherit the automatic Delegation Lease in V1. Validation is
already a fresh, independent evidence role and must directly own the final
verdict. A later explicit validation plan may evaluate read-only helpers, but
ordinary automatic delegation cannot introduce them.

## Delegation Gate

The gate is turn-bound and contract-backed. It is not a background observer.

### Inputs

```text
NAVI_DELEGATION_CONTEXT
version: 1
source_task: current formal task identity
parent_role: main | execution
stage: concise stable task stage
goal: current authorized goal
candidate_questions: bounded evidence questions
candidate_scopes: corresponding files, directories, or data sources
effects: read-only effect declaration
separability: why questions can be investigated independently
expected_benefit: context, elapsed-time, or independent-evidence gain
coordination_cost: brief, context-load, reconciliation, and conflict cost
sensitivity: relevant privacy, credential, or external-state boundary
lease_state: active | absent | expired
host_capabilities: routing, read-only, count, and completion support
```

The context contains only facts that can change the decision. It must not carry
the complete Main transcript, private reasoning, full source files, unrelated
tool output, credentials, or secret state.

### Hard Eligibility

Automatic delegation is ineligible unless all of the following are true:

- the Delegation Lease is active;
- the parent role is Main or Execution;
- the parent goal is already authorized and stable;
- every candidate question is read-only;
- no candidate requires a user product, permission, risk, integration, or
  release decision;
- each brief can state a clear goal, scope, evidence requirement, budget, and
  stop condition;
- candidate scopes are independent enough for bounded reconciliation;
- no credential, secret, unauthorized project, or unapproved external state is
  needed;
- the host can enforce read-only execution and bounded creation; and
- the host can apply an explicit permitted model and reasoning route.

Failure of a hard condition returns `continue_in_current_role` when the parent
can safely continue, or `decision_required` when user authority or a changed
premise is needed.

### Benefit Judgment

Passing hard eligibility is not sufficient. Navi must identify concrete net
benefit from at least one of these conditions:

- multiple independent evidence questions can proceed in parallel;
- one investigation would create material context pressure in the parent; or
- independent evidence is needed to reduce a meaningful self-review risk.

The expected gain must be clearly greater than brief creation, duplicate
context loading, result reconciliation, conflict resolution, and model cost.
Fixed thresholds such as a raw file count cannot decide the outcome by
themselves. Missing or weak evidence defaults to `continue_in_current_role`.

### Outcomes

```text
NAVI_DELEGATION_DECISION
version: 1
delegation_id: stable id for this stage and wave
source_task: parent task identity
parent_role: main | execution
stage: matching Delegation Stage
result: continue_in_current_role | delegate_evidence | decision_required
brief_count: 0 | 1 | 2
reason_codes: concise factual reasons
lease_state: active | absent | expired
visibility: quiet | explain | decision-required
```

The decision is ephemeral and must not be written to `.navi`, `AGENTS.md`, a
project database, or global configuration.

## Dispatch Limits

- One gate may create at most two Evidence subagents.
- One automatic wave is allowed per Delegation Stage.
- Evidence subagents cannot create subagents.
- Results return to the parent role, which must synthesize before any new
  delegation decision.
- A materially new stage or premise may establish a new gate. Unresolved work
  from the same stage cannot be renamed merely to obtain another wave.
- The limits control width, duration, cost, and authority provenance. They are
  V1 calibration boundaries, not claims of an eternal optimal number.

## Evidence Brief

Each worker receives only the minimum context required for one goal:

```text
NAVI_EVIDENCE_BRIEF
version: 1
delegation_id: matching decision id
brief_id: unique child identity
parent_task: parent task identity
parent_role: main | execution
goal: one clear evidence goal
questions: bounded questions
allowed_scope: permitted files, directories, or data sources
excluded_scope: explicit exclusions
expected_evidence: verifiable output requirements
budget: bounded files, tool calls, time, or tokens
stop_conditions: completion and refusal boundaries
sensitivity_boundary: privacy and external-state restrictions
write_permission: none
recursion_permission: none
```

`allowed_scope` must not use requests such as `understand the whole codebase`.
The brief does not include a complete conversation or private reasoning.

## Evidence Result

Each worker returns:

```text
NAVI_EVIDENCE_RESULT
version: 1
delegation_id: matching decision id
brief_id: matching brief id
status: done | blocked | needs_context
answer: concise evidence-backed answer
evidence: verifiable references or bounded command summaries
uncertainties: unresolved uncertainty
scope_deviations: none or explicit deviations
open_questions: unresolved questions
recommended_parent_action: non-authoritative recommendation
write_state: unchanged | conflict
```

The parent verifies identity, scope, write state, and evidence. It preserves
disagreements rather than selecting an answer by majority or confidence alone.
Recommendations do not grant permission and do not become user approval.

## Model And Reasoning Routing

Every automatically created Evidence subagent passes the existing Navi Task
Model Routing and Route Application Gate at its creation boundary.

The delegation contract identifies the parent role, task kind, scope,
uncertainty, required tools, and evidence sensitivity. The model-routing owner
resolves the current host-supported model and reasoning effort. The Delegation
Gate does not hardcode model ids.

The host request must explicitly carry the resolved model and reasoning. It
must not silently inherit `host-default`. If a permitted same-tier substitute
and the existing upward fallback cannot satisfy the route, automatic dispatch
does not occur. High-cost, experimental, preview, or policy-exceeding routes
remain user decisions.

If the current host subagent API cannot accept explicit model and reasoning
arguments, V1 degrades to `continue_in_current_role` and does not claim that
automatic routing or delegation succeeded.

## Execution Flow

```text
authorized Main task
-> task-local Delegation Lease
-> Main or Execution identifies bounded evidence questions
-> Delegation Gate checks eligibility and net benefit
-> no delegation, decision-required, or one bounded Evidence wave
-> create one or two minimal Evidence Briefs
-> route each brief through Model Routing and the application gate
-> host creates read-only non-recursive workers
-> workers return structured Evidence Results
-> parent checks identity, scope, write state, evidence, and conflicts
-> parent continues, asks for a real decision, or enters a formal workflow
```

Evidence workers do not emit `NAVI_LANE_HANDOFF_EVENT`. That event remains for
formal visible lanes. Evidence completion is internal to the parent task.

## Failure Handling

- A dispatch operation gets one bounded creation attempt. V1 does not retry in
  the background.
- Failure to enforce read-only execution prevents automatic creation.
- Route application follows the existing same-tier-then-upward policy; failure
  to apply an eligible route returns control to the parent.
- `blocked` or `needs_context` results do not expand their own scope and do not
  create replacement workers.
- A request for additional scope is returned as evidence for the parent.
- One successful and one failed result may be used only with the missing
  evidence stated explicitly.
- Conflicting results retain both evidence sets. The parent investigates,
  continues conservatively, or requests a real decision.
- Any unauthorized write invalidates the affected result and returns
  `decision_required` to the parent.
- A worker cannot turn a missing fact into permission, risk acceptance, scope
  expansion, implementation approval, or a final Validation verdict.

## Quietness And User Control

Normal `continue_in_current_role`, a passed gate, successful route application,
ordinary worker completion, and successful result synthesis stay quiet.

Navi explains delegation only when it changes something the user can control:

- authorization is absent or expired;
- model cost or capability exceeds policy;
- sensitive or external-state access is required;
- the host cannot enforce the promised boundary;
- results conflict in a premise-changing way; or
- user permission, product judgment, integration, or risk acceptance is needed.

Navi must not ask for per-worker confirmation after a valid lease merely to
make the user reply `yes`. It must also not create low-value work merely to
avoid waiting.

## Privacy And Security

- Briefs use the minimum necessary context.
- Credentials, auth contents, private reasoning, and unrelated transcripts are
  excluded.
- Sensitive evidence remains subject to the parent task's existing sandbox and
  approval policy.
- A lease cannot be transferred to another project, Main task, user, or
  external agent.
- Worker output is evidence, not trusted executable instruction.
- V1 introduces no delegation log database or persistent event stream.

## Host Capability Inspection

Before implementation can claim automatic Evidence delegation, one bounded
read-only inspection must establish whether the current Codex host exposes:

- role-local subagent creation;
- explicit model and reasoning arguments;
- enforceable read-only behavior;
- bounded child count;
- non-recursive ownership or a way to prohibit child creation; and
- structured completion, failure, and result delivery to the parent.

Unproved capabilities remain unavailable. Navi may retain a suggestion-only
fallback, but it must not describe suggestion as automatic delegation.

## Verification And Acceptance

### Contract Tests

Tests must cover:

- lease absence, expiry, revocation, and boundary changes;
- Main and Execution eligibility plus Validation exclusion;
- simple tasks staying in the current role;
- user-decision, write, sensitive, and external-state refusals;
- bounded questions, scopes, briefs, evidence, budgets, and stops;
- at most two workers, one wave, and no recursion;
- explicit model and reasoning application without `host-default`;
- blocked, needs-context, partial, conflicting, and unauthorized-write results;
- quiet successful behavior; and
- no duplicated authority across delegation, supervision, model routing, and
  formal delivery owners.

### Host Capability Evidence

Read-only host inspection must classify each required creation, routing,
read-only, limit, and completion capability as present, absent, or unknown.
Unknown does not count as implemented behavior.

### Natural Calibration

V1 requires two natural samples rather than an artificial routing-only task:

1. one simple real task where Navi correctly avoids delegation; and
2. one real task with at least two independent evidence questions where a
   bounded wave produces useful evidence with no write, recursion, meaningless
   confirmation, or three-role boundary regression.

The positive sample must show applied model and reasoning routes, useful result
compression, and a real reduction in elapsed serial work or parent context.
The negative sample must show that the presence of the feature does not create
subagents merely because it can.

Contract tests, host capability evidence, and both natural samples are required
before Navi calls automatic Evidence delegation an active product capability.

## Deferred Risk: Instruction Density

The user identified a real deferred concern: Navi's growing prompt and rule
surface may reduce consistent adherence to individual product contracts.

This design does not authorize a prompt-runtime rewrite or instruction
compression project. Its implementation and natural calibration must still
observe discoverability, duplicated authority, conflicting rules, and missed
Gate behavior. A failure caused by instruction density is product evidence,
not merely model error, and should inform a separate later design.

## Future Boundaries

Later evidence may justify:

- increasing a wave from two to three workers;
- an explicitly planned read-only helper path inside Validation;
- bounded Workspace-Change worker recommendation or orchestration;
- persistent project delegation preferences;
- a host adapter; or
- selected reuse of independently proven external delegation logic.

None is implied by V1. Each requires a separate design, permission boundary,
host-capability proof, and natural calibration.
