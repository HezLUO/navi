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
