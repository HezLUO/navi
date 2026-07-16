# Navi Codex-First Product Completion Design

## Status

Approved product design. This document defines when Codex-first Navi may be
considered product-complete. It does not approve implementation, a new
worktree, target-project writes, calibration execution, integration, pushing,
tagging, publication, or release preparation.

Codex-first Product Complete is a reachable product boundary, not the permanent
end of the full Navi vision. Distribution, runtime, UI, and support for agents
other than Codex remain separate decisions.

## Summary

Navi should stop using feature count, version number, or elapsed time as the
primary definition of product completion. Completion should instead require a
closed user journey, a small portfolio of natural evidence, and no unresolved
Critical or Important product issue.

The completion model has two independent gates:

1. **Codex-first Product Complete** proves that a Codex user can independently
   install and use Navi through the complete chat-native supervision journey.
2. **Distribution Ready** proves that public installation, upgrade, release,
   and trust surfaces are ready for broader external adoption.

Runtime Surface, a local UI, a background service, and other-agent adapters are
not prerequisites for Codex-first Product Complete. They become candidates only
when product evidence or a separately approved expansion direction justifies
them.

## Product Problem

Navi has accumulated substantial supervision, project-entry, CLI, coordination,
and delivery behavior. Without an explicit completion boundary, every observed
friction can become another rule, alpha milestone, test cycle, or future module.
That makes it difficult for a non-expert user to know:

- what Navi itself is trying to become;
- which capabilities are still genuinely missing;
- when validation is sufficient;
- when the current product loop may stop; and
- which future ideas should remain outside the current completion path.

The completion boundary must therefore do two jobs: prove that the product is
useful, and prevent proof-seeking from becoming an endless source of product
complexity.

## Product Decisions

1. Codex-first Product Complete and Distribution Ready are separate gates.
2. Product completion is judged from user outcomes and natural evidence, not
   from feature count, a target alpha number, or a fixed usage duration.
3. Product Complete requires a full chat-native loop, not an independent Navi
   runtime or UI.
4. Project Understanding, User Supervision, and Supervised Delivery are equal
   first-class product pillars.
5. Supervised Delivery uses one long-lived but recoverable Main Thread plus one
   task-scoped Execution Thread and one candidate-scoped Validation Thread.
6. The existing task-scoped three-role model is an implemented capability that
   needs natural product evidence; it is not a new implementation project.
7. Source installation, activation inspection, `navi init`, diagnosis, and
   migration guidance are part of Product Complete.
8. Public npm publication, marketplace distribution, low-friction public
   upgrades, and release trust are part of Distribution Ready.
9. A small representative evidence portfolio is sufficient. Product Complete
   does not require one or two months of use.
10. Product Complete permits documented non-blocking Minor debt, but no open
    Critical or Important issue.
11. A completed project lane must be able to close explicitly and become quiet;
    Navi must not manufacture a next phase merely to preserve momentum.
12. The user owns the final Product Complete decision. Execution and Validation
    Threads provide evidence but cannot accept product risk for the user.

## Completion Gates

### Codex-First Product Complete

Codex-first Product Complete means a Codex user can independently follow this
journey:

```text
enter a project
-> establish a trustworthy Project Map
-> understand stage, vision distance, boundary, and next decision
-> supervise daily work without unnecessary interruption
-> deliver bounded implementation through independent validation
-> update the Map after material change
-> close the achieved project lane
-> remain quiet until a new goal or material change appears
```

The same user must be able to operate the source product without creator-only
assistance: install it, confirm which Navi source is active, initialize project
guidance, diagnose an invalid or conflicting state, and follow bounded migration
guidance.

### Distribution Ready

Distribution Ready is evaluated only after Product Complete or through a
separately approved parallel product decision. It may include:

- public npm publication;
- marketplace availability;
- low-friction installation and upgrade;
- release identity and provenance communication;
- compatibility and rollback policy; and
- sustainable release-note and documentation maintenance.

Distribution engineering must not be used to postpone judging whether the core
Navi experience works.

## Three Product Pillars

### Project Understanding

Navi must:

- enter mature, new, evidence-poor, stale, and conflicting projects through one
  understandable experience;
- establish a truthful Project Map without requiring the user to classify the
  project first;
- explain Desired Outcome, Current Position, route or working rhythm, Current
  Boundary, Next Decision, and material uncertainty;
- make distance from the original vision visible rather than reporting only the
  current action;
- update the Map after a material navigation change; and
- close the current lane when its outcome and acceptance conditions are met.

### User Supervision

Navi must help the user decide when to continue, stop, wait, validate, redirect,
or approve. It must:

- distinguish Product Stage from Work Mode;
- explain what is enough for the current stage and what remains;
- match verification strength to the task and decision;
- avoid meaningless continuation requests;
- avoid turning every response into a heavy supervision report;
- interrupt only for real permission, scope, risk, integration, publication, or
  direction decisions; and
- enter a quiet state after closure instead of creating an artificial next
  phase.

### Supervised Delivery

Navi must preserve three stable roles with task-scoped thread instances:

- the **Main Thread** owns goals, scope, priority, user decisions, acceptance,
  and integration judgment;
- the **Execution Thread** owns one bounded implementation task in an isolated
  worktree and returns evidence for an exact candidate snapshot; and
- the **Validation Thread** independently and read-only reviews that snapshot,
  risks, omissions, and contract compliance.

The Main Thread is long-lived but logically recoverable through project-local
state and structured handoff; it need not be one permanent chat window. One
Execution Thread lasts through its task and bounded remediation. One Validation
Thread is created for the first review-ready snapshot and reused for at most two
in-scope re-reviews. Both temporary threads end when the task is integrated,
rejected, or abandoned.

Thread events must be routed directly when host messaging is available. The
user must not relay review-ready events, findings, or remediation results. The
user remains responsible for genuine permission, scope, risk, merge, push,
tag, release, and publication decisions.

Narrow low-risk work does not require three visible threads. Supervised Delivery
applies when isolated implementation and independent acceptance materially
improve user control.

## Natural Evidence Portfolio

Product Complete requires a small representative portfolio, not an exhaustive
test campaign:

1. one mature-project entry with stale or conflicting evidence;
2. one new or evidence-poor project using Guided Baseline Formation; and
3. one natural implementation task completing the full Supervised Delivery
   loop.

The same project may cover more than one requirement. The portfolio must not be
replaced by a specially manufactured demonstration task.

The portfolio must also contain one natural closure observation. It may reuse
one of the three samples and must show that Navi can:

- explain why the current goal is complete;
- identify accepted remaining Minor debt;
- close the current lane without silently inventing a successor; and
- remain quiet until the user supplies a new goal or evidence materially
  changes.

For the Supervised Delivery sample, the expected observable outcomes are:

- user event-relay count: zero;
- meaningless continuation count: zero;
- duplicate Validation Thread count for one event and snapshot: zero;
- Validation Thread write count: zero; and
- genuine user decisions remain under user control.

## Acceptance And Debt Policy

Product Complete requires:

- all three product pillars to have sufficient natural evidence;
- the source operation journey to be usable without creator-only intervention;
- no unresolved Critical or Important product issue; and
- no recurrence of the same Important issue class after its accepted repair
  inside the completion evidence portfolio.

A known issue may remain as Minor debt only when it:

- does not misdirect the project or its next decision;
- does not bypass a genuine user decision;
- does not cause unsafe writes, integration, or publication;
- does not break direct thread coordination;
- does not block installation, project entry, supervision, delivery, or closure;
  and
- records its impact, deferral reason, and revisit condition.

Examples include imprecise non-authoritative wording, branch-specific test debt
when shared behavior is already covered, a regression assertion that is weaker
than the correct implementation, or manual translation-maintenance burden.

Wrong-language supervision, stale-map misdirection, user-as-information-bus
behavior, meaningless continuation, validator writes, destructive
initialization, or an unusable installation path cannot be classified as Minor.

## Completion State And Routing

The completion assessment reuses existing Navi documentation and event
surfaces. It does not require a new runtime state store. Each product pillar may
be summarized as:

- `Unproven`: capability may exist but lacks natural evidence;
- `Calibrating`: a representative real scenario is in progress;
- `Satisfied`: the approved evidence requirement is met; or
- `Blocked`: an unresolved Critical or Important issue prevents completion.

Findings route by type:

- a missing product capability returns to Design mode;
- a confirmed bounded defect enters Implementation mode and independent
  validation;
- insufficient evidence enters Calibration mode rather than generating code;
- Minor debt is recorded without blocking completion;
- a repeated Important issue returns to premise and design review; and
- a demonstrated host reliability limit may open a Runtime Surface decision.

Neither test success nor a validator's `accept` result declares Product
Complete. When all gates appear satisfied, the Main Thread presents the
evidence, remaining debt, and recommendation. The user decides whether to
accept completion or require another bounded correction.

## Runtime Surface Trigger

Runtime Surface is not a Product Complete prerequisite. It becomes a design
candidate only if repeated natural evidence shows that the Codex host plus
prompt/docs-backed contracts cannot reliably provide one or more of:

- cross-session supervision recovery;
- exact-snapshot event routing and deduplication;
- task and validation lifecycle continuity;
- bounded remediation routing without a user information bus; or
- truthful project-state maintenance.

A single implementation defect, missing instruction, or malformed test does not
justify a runtime. The failure must remain after bounded correction and must
represent a host-level reliability ceiling. Any runtime proposal then receives
its own product design, installation, storage, recovery, and complexity review.

## Complexity Control

The completion gate also limits future product growth:

1. A new rule must improve what the user can understand, decide, stop, approve,
   or redirect. More structure or explanation alone is not product value.
2. Passing Product Complete does not automatically create another alpha feature
   line because further optimization is possible.
3. Product Complete, Distribution Ready, Runtime Surface, UI, and other-agent
   support remain separate product decisions.
4. More tests are not automatically stronger evidence. Validation effort must
   match the current Work Mode and decision.
5. Existing capabilities should be calibrated before a new supervision concept
   is added to solve the same problem.

## Completion Route At Approval

At the time this design was approved, the remaining bounded route was:

1. complete independent validation and integration judgment for Adaptive
   Project Entry;
2. calibrate mature-project stale or conflicting entry in `sub_ag_ski`;
3. calibrate Guided Baseline Formation in a new or evidence-poor project;
4. complete one natural Supervised Delivery cycle, including direct event
   routing, independent validation, and a natural closure observation;
5. correct any remaining Critical or Important issue within an explicitly
   approved boundary; and
6. present the three-pillar evidence and accepted Minor debt for the user's
   Product Complete decision.

If these observations reveal no new structural defect, the remaining distance
is a small number of real closed loops, not a preset multi-month development
period.

## Non-Goals

- Defining a specific public release number or publication date.
- Requiring full-suite or release-level verification for ordinary design,
  calibration, or bounded implementation work.
- Reimplementing the existing Supervised Delivery Loop.
- Creating an independent scheduler, queue, database, daemon, or local app.
- Building runtime UI, Memory v2, relationship modes, delegation, or write
  delegation.
- Supporting agents other than Codex in the current completion gate.
- Rebranding Historical Along source as the current Navi product.
- Treating source-package verification as cryptographic attestation.
- Automatically starting Distribution Ready work after Product Complete.

