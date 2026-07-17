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

- Failure to create the preauthorized validator leaves the lane validation-pending; it never implies acceptance.
- Host task messaging failure uses one explicit local fallback report. Do not claim delivery, start a timed retry, or create a polling loop.
- Insufficient evidence returns to the Execution Thread only when collecting that evidence is already inside the approved contract and verification budget.
- A missing or mismatched snapshot produces unable-to-verify or stale evidence.
- A formally blocked Execution Thread reports through Lane Handoff instead of waiting for the user to discover it.
- A completed task found without a valid event follows Lane Handoff `delivery-protocol-failure`; recovered terminal facts are not authorization, and any bounded re-delivery remains owned by `lane-handoff-v1.md`.
- Closed Codex tasks have no background continuation or later-delivery guarantee.
