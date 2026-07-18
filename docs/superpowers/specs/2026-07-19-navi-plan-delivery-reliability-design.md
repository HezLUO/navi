# Navi Plan And Delivery Reliability V1 Design

Date: 2026-07-19

Status: Approved in design discussion on 2026-07-19

## Summary

Navi should prevent two recurring sources of meaningless user interruption in
Codex-first Supervised Delivery:

1. an approved implementation plan contains prescribed prose, assertions,
   command ordering, scope, or acceptance conditions that cannot all be true;
   and
2. an Execution or Validation Task prints a valid handoff in its own task but
   never uses host task messaging to deliver it to the Source Main Task.

V1 adds a contract-first Plan Satisfiability Check, a strictly bounded
Plan-Artifact Correction Class, and a Delivery Completion Clause. Plan checks
run before plan submission and again at Execution preflight. Strictly
mechanical, semantics-preserving plan-artifact defects may be corrected once
as one aggregate batch. Direct host delivery becomes a task completion
condition rather than an optional final-answer convention.

This design does not add a general Markdown plan parser, a plan DSL, a
background runtime, a queue, persistent task state, or a new user message
entry. It does not approve implementation, a worktree, integration, push,
release, publication, or calibration writes.

## Product Problem

### Unsatisfiable Plan Artifacts

The bounded dependency-restore implementation exposed repeated failures where
plan-prescribed regular expressions could not match plan-prescribed Markdown.
Line wrapping split phrases such as `Execution Task`, while literal-space
assertions required them to remain on one line. The Execution Task reported
each mismatch separately, requiring repeated user approvals for changes that
did not alter product meaning.

The same execution later found a real design-to-plan omission: the plan had
failed to carry two approved post-install audit requirements. That issue was
not mechanical and correctly required Main Thread judgment. Navi therefore
needs to distinguish harmless plan-artifact defects from semantic plan
changes, rather than treating both as identical user decisions.

### Undelivered Task Results

The independent Validation Task for that candidate produced a valid
`NAVI_VALIDATION_RESULT` in its own final answer but did not call the available
host task-messaging capability. The result reached the Source Main Task only
after the user noticed the missing delivery. Existing Lane Handoff prose
already required direct delivery, but the delegated task prompt did not turn
that rule into a concrete completion operation with host-success evidence.

This made the user an information-bus and showed that a locally complete task
is not necessarily a delivered task.

## Goals

V1 should:

1. detect prescribed-test, prescribed-prose, command-order, file-scope, and
   acceptance-condition contradictions before implementation edits begin;
2. run one plan check before plan submission and one cheap baseline-aware
   check at Execution preflight;
3. batch strictly mechanical plan-artifact corrections instead of asking the
   user about each equivalent assertion or sequencing defect;
4. preserve Main Thread and user ownership of semantic, permission, scope,
   risk, validation-budget, and acceptance changes;
5. require actual host task-message delivery and host success evidence before
   an Execution or Validation Task claims handoff completion;
6. recover one locally preserved result at a relevant Main Thread checkpoint
   without asking the user to relay it when direct delivery fails; and
7. keep the normal path quiet and avoid new `continue` prompts.

## Non-Goals

V1 does not:

- parse arbitrary Markdown plans into a universal schema;
- introduce a plan DSL, generic plan parser, scheduler, database, durable
  queue, daemon, watcher, notification service, or Runtime Surface;
- guarantee background wakeup after the Main Thread has no further turn;
- automatically repair product semantics, architecture, permissions, scope,
  risks, acceptance criteria, or validation budgets;
- expand a task's authorized file set to edit the plan document;
- grant permanent plan-correction or dependency-install permission;
- add acknowledgement messages or a task-to-task conversation loop;
- switch the active Main Thread model or change the user's message entry;
- authorize merge, push, tag, release, publication, or unrelated work; or
- claim Codex-first Product Complete before a natural joint calibration.

## Ownership

`plan-reliability-v1.md` is the sole detailed owner of:

- plan-submission satisfiability checks;
- Execution preflight plan checks;
- mechanical versus semantic classification;
- the bounded Plan-Artifact Correction Class;
- correction evidence and exhaustion; and
- plan-reliability quietness.

`lane-handoff-v1.md` remains the sole detailed owner of task-message delivery,
retry, fallback, reconciliation, and the new Delivery Completion Clause.

`supervised-delivery-v1.md` adopts both owners for the three-role workflow. It
may define when the checks and delivery clause apply, but must not duplicate
their detailed policy. `SKILL.md` routes to the owners without becoming a
second schema authority. Public documents may describe the behavior but do
not own it.

This adds one focused owner instead of continuing to enlarge
`supervised-delivery-v1.md` with unrelated responsibilities.

## Execution Contract Adoption

Every Navi Supervised Delivery Execution Contract with an implementation plan
records:

```text
plan_satisfiability_check: required
plan_artifact_correction: bounded
```

These fields are part of the default Navi workflow rather than a new
per-defect user permission. Missing or conflicting fields disable automatic
plan-artifact correction and require Main Thread judgment before implementation
continues.

The bounded correction authority belongs only to the named Execution Task,
approved implementation plan, exact baseline, and approved scope. It does not
survive a new task, changed baseline, replaced plan, or expanded goal.

## Plan Satisfiability Check

### Checkpoint 1: Before Plan Submission

Before a plan is presented as implementation-ready, the plan author checks
that its prescribed artifacts can coexist:

- prescribed prose and prescribed assertions match after intended Markdown
  whitespace semantics;
- example regular expressions are evaluated against the exact rendered text;
- commands appear at a lifecycle point where their expected commit or file
  state exists;
- task file lists, commit scopes, and final changed-path expectations agree;
- RED and GREEN expectations are reachable in their stated order;
- design requirements are represented in plan tasks and acceptance checks;
  and
- verification commands do not contradict the plan's forbidden scope or
  authority boundaries.

The author performs real bounded evaluation for explicit snippets, regular
expressions, paths, or command ranges. A visual read of the plan is not enough
when the claim can be cheaply evaluated. The check does not run the full
implementation test suite.

### Checkpoint 2: Execution Preflight

Before production edits, the Execution Task performs one cheap, baseline-aware
recheck. It confirms that the plan still matches the exact baseline, named
files, available commands, task ordering, and prescribed fragments.

If the first defect is found, the task completes one aggregate scan for all
related plan-artifact defects before acting. It must not report one whitespace
or sequencing problem at a time. A clean preflight remains quiet.

No general parser is required. Codex may use native bounded tools to evaluate
explicit snippets and assertions, compare path sets, and inspect command
ordering. Semantic design-to-plan consistency remains a read-only judgment.

## Plan-Artifact Correction Class

A correction is eligible only when all of these conditions are true:

1. approved product meaning is unchanged;
2. authorized files and ownership are unchanged;
3. permissions, risk, acceptance criteria, validation budget, and stop
   conditions are unchanged;
4. the before-and-after artifacts are demonstrably equivalent for their
   approved purpose; and
5. the correction fits inside the existing task scope.

Examples of eligible corrections include:

- replacing a literal-space assertion with an equivalent whitespace-tolerant
  assertion for hard-wrapped Markdown;
- reversing an assertion's equivalent phrase order to match prescribed prose;
- running a scope-audit command after the commit it is intended to inspect
  rather than before that commit; and
- correcting a test-only matcher that does not weaken the approved semantic
  requirement.

Examples that are not eligible include:

- adding a design requirement omitted from the plan;
- changing public behavior, architecture, or owner boundaries;
- adding files or reducing verification;
- changing permission, dependency, filesystem, security, or release scope; or
- weakening an acceptance condition so implementation can pass.

The Execution Task may perform at most one aggregate correction round. It
records the complete bounded set, applies directed checks, and continues the
approved plan without a user prompt when the set remains eligible.

If the plan document itself is outside the authorized file scope, the task
does not edit it. An equivalent command-timing correction is recorded in task
evidence. Any required durable plan rewrite returns to the Main Thread unless
the plan file was already authorized.

A new plan-artifact defect after the aggregate correction round means the
preflight was insufficient. The task stops automatic correction and returns
to Main Thread premise judgment rather than starting an unbounded repair loop.

## Plan Check Evidence

Review-ready evidence includes only the compact result:

```text
plan_check: passed | corrected
plan_corrections: none | concise bounded list
```

`corrected` must name the equivalent artifacts or command timing and the
bounded evidence used to prove equivalence. It must not contain hidden
reasoning or a full execution transcript.

If a semantic or scope conflict prevents continuation, the existing Lane
Handoff `decision-required` event carries one aggregated decision, the complete
relevant conflict bundle, and one recommendation when supportable.

## Delivery Completion Clause

Every delegated Execution and Validation Task prompt must include an explicit
host-operation clause. A reference pointer alone is insufficient. The clause
requires the task to:

1. render the exact valid structured event or result;
2. call the available Codex host task-messaging capability;
3. address the message to the contract's exact `source_task`;
4. obtain host success evidence;
5. retry once immediately with the same identifier and semantically identical
   payload only when the host reports delivery failure; and
6. refuse to claim handoff completion when neither attempt succeeds.

Printing the payload in the task's own final answer is a local report, not
direct delivery. The task prompt must state this explicitly.

The wire payload cannot truthfully contain its own final delivery outcome,
because the outcome exists only after the send operation. After the host call,
the task records a local Completion Receipt:

```text
delivery_attempts: 1 | 2
delivery_state: delivered | failed
```

Host tool success plus this local receipt proves completion. The Source Main
Task does not acknowledge successful delivery, and no second message is sent
solely to confirm receipt.

## Delivery Failure And Reconciliation

On the first reported delivery failure, retry once immediately with the same
event or result identifier and semantic payload. Do not poll, wait on a timer,
or create a resend loop.

After a second failure, keep the complete local transition report, record
`delivery_state: failed`, and stop the task. At the next relevant dependent
control checkpoint, the Source Main Task uses the existing one-shot
Main-Task Reconciliation policy:

- if the local report is complete and valid, recover and route it as the
  transition while recording a delivery-protocol failure;
- if only a required field is missing, request at most one bounded redelivery
  from the same task;
- do not create a duplicate task or ask the user to relay the result; and
- if host messaging and task inspection are both unavailable, stop the
  dependent high-impact action and surface the real host capability gap.

When the Source Main Task receives no further turn and the host exposes no
completion wakeup, V1 cannot reconcile by itself. This remains an explicit
host limitation rather than a claimed background guarantee.

## Quietness

The normal path is quiet:

- a passing plan-submission check adds no user-facing report;
- a passing Execution preflight adds no status table;
- one successful aggregate mechanical correction does not request approval or
  `continue`;
- first-attempt delivery success does not create an acknowledgement loop; and
- ordinary running-task progress does not trigger polling.

Surface only a semantic or scope decision, exhausted correction authority,
two failed delivery attempts, a recovered decision-changing event, or a host
capability gap that blocks a relevant high-impact checkpoint.

## Role Boundaries

### Main Thread

The Main Thread approves product meaning, scope, authority, risk, acceptance,
integration, and release decisions. It supplies the two plan-reliability
fields in the Execution Contract, receives direct events, and performs only
the existing bounded reconciliation at relevant checkpoints.

### Plan Author

The plan author performs the first satisfiability check before presenting the
plan as implementation-ready. It does not declare implementation success or
use the check to weaken the approved design.

### Execution Task

The Execution Task performs the baseline-aware preflight, owns one bounded
mechanical correction round, implements the approved plan, and directly
delivers its transition. It cannot broaden its own correction authority.

### Validation Task

The Validation Task remains read-only. It checks the exact snapshot and
contract, then directly delivers its result. It may identify a plan or
delivery defect but cannot repair files or accept changed product risk.

## Verification Strategy

Implementation verification should include:

- one-owner and adoption tests for `plan-reliability-v1.md`;
- canonical/package mirror checks;
- contract tests for both required Execution Contract fields;
- bounded fixtures distinguishing mechanical defects from semantic changes;
- whitespace-safe assertion examples for hard-wrapped Markdown;
- command-lifecycle examples that distinguish equivalent timing corrections
  from scope changes;
- tests that require aggregate scanning and one correction round;
- Delivery Completion Clause tests that require a host messaging action,
  exact `source_task`, host success evidence, and the local receipt;
- tests proving that a local final answer alone is not delivered;
- retry, local fallback, and one-shot reconciliation tests;
- quietness tests that prohibit acknowledgement loops, ordinary polling, and
  new `continue` prompts;
- plugin-package verification and `git diff --check`; and
- forbidden-capability audits for parser, DSL, database, queue, daemon,
  Runtime Surface, or persistent task state additions.

The fixtures test contract semantics. They do not implement or imply a parser
for arbitrary plans.

## Natural Joint Calibration

After independent validation and integration, use the next real bounded
product implementation as one natural joint calibration. Do not manufacture a
routing-only or reliability-only task.

The sample passes when:

- the user relays zero task events or validation results;
- meaningless `continue` count is zero;
- related plan-artifact defects do not interrupt the user one by one;
- Execution and Validation both use direct host delivery;
- the Main Thread does not poll for ordinary progress; and
- real permission, scope, risk, integration, or release decisions remain with
  the user.

A clean plan with no mechanical correction still provides valid evidence that
both plan checkpoints ran quietly. Mechanical correction behavior is covered
by bounded fixtures and remains open for continued natural observation.

## Product Position And Completion Line

Plan And Delivery Reliability V1 is a reliability closeout inside the current
Codex-first Product Complete path, not a new Product Stage or Runtime
milestone. Product Complete remains open until this design is implemented,
independently validated, integrated, and exercised through one passing natural
joint calibration.

Distribution publication, Public Plugin Directory work, Runtime Surface, a
local panel, automatic Main Turn model switching, other-agent support, push,
tag, release, and publication remain separate decisions.
