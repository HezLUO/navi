# Navi Bounded Dependency Restore Design

Date: 2026-07-18

Status: Approved in design discussion on 2026-07-18

## Summary

Navi should let one explicitly approved Execution Contract preauthorize a
single project-local `npm ci` when a trusted, exact baseline has a matching
`package-lock.json` and no local dependency installation. The Execution Task
verifies the contract, runs the restore once, audits the result, and continues
the already-approved implementation plan without asking the user for another
generic permission or `continue`.

This is a narrow Supervised Delivery capability. It does not create a package
manager, CLI command, project-level permanent permission, background runtime,
or Validation Task write authority. Codex host sandbox and network controls
remain authoritative and may still present their own tool permission request.

This design does not approve implementation, a worktree, dependency
installation, integration, push, tag, release, or publication.

## Product Problem

Clean Codex worktrees commonly contain `package.json` and a lockfile but no
`node_modules`. Planned targeted tests and type checks therefore cannot run
until dependencies are restored. Navi has repeatedly returned this condition
to the user as a new product decision even when all relevant facts were
already known:

- the repository and exact baseline were trusted;
- the lockfile defined the dependency graph;
- the install was project-local;
- no dependency or package-manager change was requested; and
- the implementation plan already required the affected tests.

Repeatedly asking whether to run the same bounded `npm ci` does not add useful
user control. It interrupts the Execution Task, makes the user act as an
approval relay, and creates meaningless continuation friction. The real user
decisions are whether to trust the repository and baseline, allow the bounded
restore in the Execution Contract, accept a host permission request, or react
to a changed premise or unexpected install effect.

## Goals

The V1 capability should:

1. let one Execution Contract carry one bounded dependency-restore approval;
2. support only project-local `npm ci` with an exact `package-lock.json`;
3. preserve normal lifecycle scripts only for an explicitly trusted baseline;
4. keep Codex host network and sandbox permissions authoritative;
5. audit package metadata and repository state after installation;
6. continue the approved implementation automatically after a clean restore;
7. route changed premises, failures, and unexpected writes through structured
   lane events; and
8. avoid persistent permission state or package-manager orchestration scope.

## Non-Goals

V1 does not:

- support pnpm, Yarn, Bun, pip, Poetry, uv, conda, or other package managers;
- repair an existing but suspected-broken `node_modules` tree;
- use `npm install`, dependency updates, lockfile regeneration, or audit fixes;
- force `--ignore-scripts` or claim lifecycle scripts are harmless;
- bypass, suppress, or pre-answer Codex host permissions;
- grant a permanent project-level or user-level dependency-install permission;
- let a Validation Task install dependencies or otherwise write its worktree;
- retry failed installs automatically;
- clean, revert, or commit unexpected installation effects automatically;
- add a Navi CLI dependency command, package-manager abstraction, runtime,
  database, queue, daemon, or background service; or
- authorize merge, push, tag, release, publication, or unrelated scope.

## Ownership

`supervised-delivery-v1.md` is the sole detailed owner of the dependency
restore contract, eligibility rules, execution sequence, audit, and failure
routing. `SKILL.md` may route an approved bounded implementation to that owner
but should not duplicate the schema. Public or product documents may describe
the capability boundary without becoming a second operational authority.

The capability belongs only to an Execution Contract. A project Map,
`AGENTS.md`, global bootstrap, plugin installation, or prior successful restore
must not silently grant it.

## Execution Contract

The Execution Contract may include this optional block:

```yaml
dependency_restore:
  preauthorized: true
  package_manager: npm
  command: npm ci
  trusted_baseline: <exact commit SHA>
  lockfile: package-lock.json
  lockfile_digest: <SHA-256>
  expected_state: node_modules absent
  lifecycle_scripts: allowed
  network: host-mediated
  allowed_install_write: node_modules
  immutable_files:
    - package.json
    - package-lock.json
  post_install_audit: required
```

Every field is required. Missing, additional, ambiguous, or conflicting
values make the preauthorization unavailable. The contract is valid only for
the named Execution Task, exact baseline, exact lockfile digest, and one
install attempt. It does not survive a new task, changed baseline, changed
lockfile, or later implementation plan.

Approval of the implementation plan and its explicit Execution Contract also
approves this bounded restore. Navi must not ask a second product-level
question solely because the worktree lacks `node_modules`.

## Eligibility And Preflight

Before running the command, the Execution Task must confirm:

1. its HEAD equals `trusted_baseline`;
2. the worktree is clean before installation;
3. `package.json` and the named `package-lock.json` exist;
4. the lockfile SHA-256 equals `lockfile_digest`;
5. `node_modules` is absent;
6. the exact command is `npm ci` with no unapproved flags;
7. the installation is project-local and uses no `sudo`, `-g`, global npm
   configuration, private-registry change, credential change, or dependency
   edit; and
8. the contract explicitly allows lifecycle scripts and host-mediated network
   access.

The task must not reinterpret an existing or suspected-broken `node_modules`
tree as an eligible restore. It must not silently broaden the command when
preflight fails.

## Execution And Host Permissions

After preflight passes, the Execution Task runs `npm ci` once. Normal npm
lifecycle scripts are allowed because the user approved the trusted baseline,
but the contract must not describe them as risk-free.

If Codex requires network or sandbox escalation, the task directly requests
that host permission. This is a host control, not a second Navi product-scope
decision. Approval resumes the same command and implementation plan. Denial or
unavailable permission follows the decision-required route below. Navi must
not claim that its contract bypasses the host.

## Post-Install Audit

After a zero exit, the Execution Task must verify:

- `package.json` and `package-lock.json` are byte-identical to preflight;
- the lockfile digest is unchanged;
- no tracked file changed;
- no untracked path appeared outside the contract's allowed install write;
- no global npm, shell-profile, credential, or external-project state was
  intentionally changed; and
- the worktree remains suitable for the approved implementation plan.

An ignored project-local `node_modules` tree is the expected installation
effect. The task records the command, baseline, lockfile digest, exit status,
and audit result as lane evidence, then continues the approved plan without a
separate completion prompt.

## Failure Routing

### Preflight Mismatch

Do not run `npm ci`. Emit a `decision-required` Lane Handoff event that names
the failed premise and states what contract change or task replacement would
be required.

### Host Permission Failure

If the required host permission is denied or unavailable, emit
`decision-required`. The Main Thread presents the concrete authorization,
environment-change, or lane-closure decision. Do not reframe the denial as
product approval, retry through another transport, or request a generic
`continue`.

### Command Failure

If `npm ci` exits nonzero, do not retry, switch to `npm install`, modify the
lockfile, or run an audit fix. The contract's one preauthorized attempt is
exhausted. Emit `decision-required` with the exit status and a credential-safe
error summary so the Main Thread can present retry, environment-investigation,
or lane-closure choices. Leave the lane-local install state unchanged for
source-task judgment.

Dependency restore does not redefine Lane Handoff's formal `blocked` state.
Use `blocked` only when the existing host goal lifecycle rule is independently
satisfied.

### Post-Install Drift

If immutable metadata, tracked files, or an undeclared path changed, stop the
implementation and emit `decision-required` with the exact changed-path
summary. Do not commit, auto-revert, or silently clean the effects. The Main
Thread decides whether to accept expanded scope, authorize cleanup, replace
the task, or close the lane.

## Role Boundaries

### Main Thread

The Main Thread decides whether the repository and exact baseline are trusted
and presents the dependency restore inside the implementation plan's Execution
Contract. It does not create permanent project policy from that approval.

### Execution Task

The Execution Task alone may use the contract. It owns preflight, the one
install attempt, post-install audit, evidence, and direct failure handoff.

### Validation Task

The Validation Task remains read-only and receives no dependency restore
authority. It may inspect the contract, exact candidate, executor-reported test
evidence, and available static evidence. It must not install dependencies just
to duplicate the Execution Task's green run.

## Quietness And User Experience

The successful path is quiet. Navi does not show a new status table, repeat a
lifecycle-script explanation, or stop after installation with "dependency
restore complete; continue?" The restore is supporting work inside an already
approved implementation boundary.

Navi surfaces only:

- the dependency restore clause when the implementation plan is approved;
- a real Codex host permission prompt;
- a preflight premise change;
- a command failure;
- an unexpected installation effect; or
- final evidence when it materially affects acceptance.

## Verification Strategy

Implementation verification should remain bounded to the changed policy
surface:

- contract tests for every required field and single-task/single-attempt scope;
- refusal tests for unsupported package managers, commands, missing or changed
  baseline evidence, lockfile mismatch, present `node_modules`, and forbidden
  global or credential behavior;
- routing tests for preflight mismatch, host denial, command failure, and
  post-install drift;
- quiet-success tests that require continuation of the approved plan without a
  new user prompt;
- tests that prevent Validation Tasks from inheriting restore authority;
- canonical/package mirror verification;
- relevant skill tests, plugin-package verification, and `git diff --check`.

Full repository tests are not the default for this contract-only change unless
implementation touches a shared executable owner or targeted evidence exposes
a broader regression.

## Joint Natural Calibration

Implementing this approved product task may count as the one remaining
Codex-first Product Complete natural sample only if the actual journey:

1. creates the Execution Task with the approved model and reasoning route;
2. uses dependency restore only if the clean worktree naturally lacks
   `node_modules`, without manufacturing that state;
3. receives `review-ready` directly without user relay;
4. creates one independently routed, read-only Validation Task for the exact
   snapshot and receives its result directly;
5. uses at most two bounded remediation rounds and no duplicate validator;
6. requires no meaningless `continue`;
7. ends at a real user acceptance and integration decision; and
8. is accepted and integrated before the Main Thread decides whether the
   Product Complete gate is satisfied.

Failure to satisfy the calibration criteria does not automatically invalidate
an otherwise correct implementation candidate. It only prevents that journey
from being counted as the successful joint natural sample.

## Acceptance Criteria

The design is implemented when:

1. `supervised-delivery-v1.md` owns the exact V1 contract and boundaries;
2. an approved eligible Execution Task can run one `npm ci` without a second
   Navi product approval;
3. host permission remains explicit and authoritative;
4. success continues quietly into the approved implementation plan;
5. every changed premise or unexpected effect stops through the correct direct
   event;
6. Validation Tasks remain read-only;
7. no persistent permission, CLI package manager, runtime, or additional
   package-manager support is introduced; and
8. focused policy tests and mirror verification pass within the approved
   verification budget.
