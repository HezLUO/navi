# Navi Supervised Delivery Loop V1

Use this reference for an approved bounded implementation or worktree plan whose Execution Contract preauthorizes one independent Validation Thread. Navi defines role, contract, routing, and decision boundaries; the Codex host provides task identity, worktree isolation, task creation, transcript persistence, and task messaging.

This is active-session, prompt/docs-backed Codex-first coordination. It is not a runtime scheduler, durable queue, watcher, daemon, notification service, automatic Git flow, or background continuation promise.

## Roles

- Main Thread: owns goal, scope, priority, acceptance, routing, and user decisions.
- Execution Thread: owns bounded file changes, planned verification, a clean snapshot, and the review-ready evidence package.
- Validation Thread: owns fresh independent read-only review of the exact snapshot, risks, omissions, and evidence.

The three roles are workflow responsibilities, not new Work Modes. The Main Thread may continue non-conflicting design or supervision while Execution or Validation runs.

## Execution Contract

Before worktree creation, record exactly:

goal: one bounded implementation outcome
user_value: why this outcome matters
source_task: persistent Main Thread task identifier
baseline: exact commit or immutable snapshot
allowed_scope: files, components, and behavior the executor may change
forbidden_scope: excluded files, actions, and escalation boundaries
implementation_plan: expected implementation plan or bounded task list
verification_budget: exact required checks and maximum expansion
validation_level: 1 | 2 | 3
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready

Preauthorization covers creating one fresh independent Validation Thread only for the initial valid review-ready transition and reusing the same Validation Thread for up to two in-scope remediation re-reviews. It does not authorize permissions, scope expansion, risk acceptance, merge, push, tag, release, publication, or reduced acceptance criteria.

## Dependency Restore Extension

Dependency restore is an optional additive part of the approved Execution
Contract. It records exactly:

dependency_restore:
  preauthorized: true
  package_manager: npm
  command: npm ci
  trusted_baseline: exact commit SHA
  lockfile: package-lock.json
  lockfile_digest: SHA-256
  expected_state: node_modules absent
  lifecycle_scripts: allowed
  network: host-mediated
  allowed_install_write: node_modules
  immutable_files:
    - package.json
    - package-lock.json
  post_install_audit: required

Every field is required. Missing, additional, ambiguous, or conflicting values
make the preauthorization unavailable. The approval applies to one Execution
Task, the exact baseline and lockfile digest, and one install attempt. It does
not survive a new task, changed baseline, changed lockfile, or later plan.

This extension does not grant persistent project permission, Validation Task
write authority, another package manager, package changes, global npm changes,
credential changes, merge, push, release, or publication authority.

## Dependency Restore Preflight

Before running the restore, the Execution Task confirms that HEAD equals
`trusted_baseline`, the worktree is clean, `package.json` and
`package-lock.json` exist, the lockfile digest matches, `node_modules` is
absent, and the exact command is `npm ci` with no unapproved flags.

The install must be project-local. It uses no `sudo`, `-g`, global npm
configuration, private registry change, credential change, dependency edit,
or lockfile regeneration. The contract must explicitly allow lifecycle scripts
and host-mediated network access.

An existing or suspected-broken `node_modules` tree is not an eligible restore.
Do not reinterpret it as absent, delete it, switch commands, or widen the
contract when preflight fails.

## Model Routing Extension

Model routing is additive to the existing Execution Contract, which remains valid. This opt-in extension records exactly:

model_routing_policy: balanced
model_routing_authorized: true
execution_route: NAVI_ROUTE_DECISION V1
validation_route: derive at review-ready from validation_level
router_check_preauthorized: true

When this extension is absent, omit model and thinking overrides, use `application_state: host-default`, and create no Router Check. The extension does not authorize an experimental model, Fast mode, service-tier changes, a lower capability floor, new permissions, scope expansion, risk acceptance, merge, push, tag, release, or publication.

## Task Route Lifecycle

Before creating the Execution Thread's Codex task, build its NAVI_ROUTE_DECISION from the approved Execution Contract and `model-routing-v1.md`. Ask the Codex host to apply the resolved `model` and `thinking` fields. Record `application_state: applied` only after the host accepted the requested combination.

After the exact snapshot reaches review-ready, derive the Validation route from `validation_level` independently before creating the Validation Thread. Level 1 uses `fast + medium`; Level 2 uses `standard + high`; Level 3 uses `strong + high`, optionally `xhigh` only when the host supports it and the costly failure boundary warrants it. Validation must not inherit the Execution Thread's fast lease, and the executor does not choose the capability needed to accept its own work.

Reuse the same Validation Thread for bounded remediation re-review. Re-evaluate its floor and apply any changed route only at a follow-up turn boundary. Route schemas, host resolution, fallback, leases, user overrides, and quietness remain owned by `model-routing-v1.md`; do not duplicate them here.

## Validation Contract

Create the fresh Validation Thread only for the initial valid review-ready transition. Send exactly:

reviewed_event_id: the triggering Lane Handoff event identifier
execution_contract: the approved bounded contract
reviewed_snapshot: the exact commit or immutable snapshot
changed_scope: executor-declared files or components
evidence: verification results and residual risks
validation_level: 1 | 2 | 3
command_budget: bounded checks permitted for concrete doubts
read_only: true
report_to: source_task
route_decision: NAVI_ROUTE_DECISION V1 when the routing extension is active; otherwise host-default

The Validation Contract must not include the executor's full transcript, private reasoning, or self-review conversation. It may include repository specs, plans, diffs, commands, and evidence needed to judge the contract.

## Findings Package

NAVI_VALIDATION_RESULT
version: 1
result_id: one stable identifier for this validation result
reviewed_event_id: the review-ready event being judged
source_task: persistent Main Thread task identifier
execution_lane: bounded Execution Thread identifier
validation_lane: fresh Validation Thread identifier
reviewed_snapshot: exact commit or immutable snapshot
assigned_level: 1 | 2 | 3
used_level: 1 | 2 | 3
verdict: accept | remediation-required | decision-required | unable-to-verify
checks: commands or read-only inspections actually performed
evidence_gaps: missing evidence, or none
validator_write_state: clean | invalidated
recommendation: accept, remediate, decide, or stop

Use either `findings: none` with no record-only fields, or `findings:` followed by one or more severity-ordered `finding:` records. Each `finding:` record contains exactly:

finding:
severity: Critical | Important | Minor
file: affected file or source reference
evidence: concrete evidence reference

The payload is bare plain text. Field aliases and wrapper formats are invalid. A result for another snapshot or an invalidated validator write state cannot support acceptance.

## Pre-Send Validation Wire-Format Check

Before sending, confirm the payload must begin exactly with `NAVI_VALIDATION_RESULT`, is bare plain text with no XML/Markdown wrapper or code fence, uses exact field names with no aliases, and includes every common findings-package field and one valid findings branch. `findings: none` must omit the record-only fields `finding:`, `severity:`, `file:`, and `evidence:`; `findings:` must contain one or more severity-ordered `finding:` records. A malformed payload is not a valid result. Correct the same transition and resend it with the same result_id; the correction is not a second review.

## Validation Levels

- Level 1 reads the contract, exact diff, and supplied evidence; it runs no commands by default.
- Level 2 traces affected owners and may run focused checks for a concrete uncertainty.
- Level 3 examines authorization, filesystem, migration, or other costly failure boundaries and may run one approved bounded integration suite.

No validation level silently enters Release mode or repeats the executor's complete test transcript merely to obtain a second green run.

## Lifecycle And Identity

For one valid preauthorized review-ready transition, the active Main Thread creates one fresh Validation Thread for one reviewed_event_id and exact reviewed_snapshot. Mark the lane validation-pending until a valid result returns; review-ready alone is not acceptance.

The initial valid review-ready event creates one fresh Validation Thread. Each bounded remediation re-review reuses that same Validation Thread rather than creating a replacement.

Duplicate handoff event IDs: ignore them idempotently. Duplicate validation result IDs: ignore them idempotently. A result with the wrong reviewed_event_id or wrong reviewed_snapshot is stale evidence and cannot change acceptance state. A second review-ready event after bounded remediation uses a new event ID and snapshot.

Reuse the same executor-validator pair for in-scope remediation and focused re-review. The pair may perform at most two remediation rounds. New scope, permission, architecture, baseline, goal, validation-budget expansion, or known-risk acceptance returns to the user instead of mutating the pair's contract.

After the Main Thread sends work to an Execution Thread or Validation Thread
and direct task-message delivery succeeds, enter `Awaiting Direct Event` as
defined by `lane-handoff-v1.md`. Do not poll either task for ordinary progress;
continue non-conflicting Main Thread work or let the inbound event resume
routing. Before a dependent control checkpoint, an unresolved relevant task
uses the `Main-Task Reconciliation` policy in `lane-handoff-v1.md`. Ordinary
progress must not trigger reconciliation. The generic owner defines relevance,
checkpoints, inspection budget, quietness, and exit conditions; do not duplicate
or broaden them here.

Do not create the validator when implementation starts, poll for ordinary progress, or create multiple validators for the same event. Host task creation and messaging are the transport; Navi makes no background-delivery promise after active tasks close.

## Verdict Routing

| Verdict | Next owner | Required transition |
| --- | --- | --- |
| accept | Main Thread | Present supportable evidence and the real merge or acceptance decision. |
| remediation-required | same Execution Thread | Route only in-scope findings, then return the new snapshot to the same Validation Thread for focused re-review. |
| decision-required | user | Present the concrete scope, permission, architecture, or risk decision with a recommendation. |
| unable-to-verify | Main Thread | Decide the evidence or premise question: whether missing evidence is already authorized, whether the environment must change, or whether the premise must be reconsidered. |

`validator_write_state: invalidated` cannot support acceptance. Restore a clean exact-snapshot review boundary before another result is considered.

Planned tests remain owned by the Execution Thread. Validation may run only bounded checks needed for a concrete doubt. Full release verification remains owned by explicit Release mode.

## Findings Severity

- Critical means an authorization violation, unsafe behavior, data loss, or a premise that cannot be accepted as designed.
- Important means the approved contract is not met, a meaningful regression or omission exists, or evidence is insufficient for acceptance.
- Minor means a bounded quality issue that does not invalidate acceptance and normally becomes explicit debt.

## Remediation Stop Rule

After two remediation rounds, any remaining Critical or Important issue stops automatic routing. The Main Thread must reassess the plan, architecture, or acceptance criteria and present a real decision. Minor findings default to explicit debt unless they materially affect the current decision.

## Failure Handling

When a required route cannot be applied, return `decision-required` to the Main Thread. Navi must not claim automatic switching succeeded and must not silently lower tier or widen scope. Preserve `recommended-not-applied` as truthful evidence and leave merge, push, tag, release, publication, permission, and risk decisions with their existing owners.

- Failure to create the preauthorized validator leaves the lane validation-pending; it never implies acceptance.
- Host task messaging failure uses one explicit local fallback report. Do not claim delivery, start a timed retry, or create a polling loop.
- Insufficient evidence returns to the Execution Thread only when collecting that evidence is already inside the approved contract and verification budget.
- A missing or mismatched snapshot produces unable-to-verify or stale evidence.
- A formally blocked Execution Thread reports through Lane Handoff instead of waiting for the user to discover it.
- A completed task found without a valid event follows Lane Handoff `delivery-protocol-failure`; recovered terminal facts are not authorization, and any bounded re-delivery remains owned by `lane-handoff-v1.md`.
- Closed Codex tasks have no background continuation or later-delivery guarantee.
