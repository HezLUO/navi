# Navi Plan Reliability V1

Use this reference for implementation plans inside Navi Supervised Delivery.
It owns plan satisfiability, strictly mechanical plan-artifact correction, and
their quiet evidence. It does not own product design, delivery transport,
validation verdicts, or user risk acceptance.

This is prompt/docs-backed Codex-first policy. It is not a general Markdown
parser, plan DSL, scheduler, database, queue, daemon, or Runtime Surface.

## Ownership And Scope

This reference is the sole detailed owner for the pre-submission plan check,
Execution preflight check, mechanical correction eligibility, one aggregate
correction round, and compact plan-check evidence.

`supervised-delivery-v1.md` adopts this owner. `lane-handoff-v1.md` owns
direct delivery and decision transport.

## Execution Contract Fields

Every implementation-plan Execution Contract records exactly:

plan_satisfiability_check: required
plan_artifact_correction: bounded

These fields are default Navi Supervised Delivery policy rather than a new
per-defect user permission. They apply only to the named task, approved plan,
exact baseline, and authorized scope. Missing or conflicting values disable
automatic correction and return to Main Thread judgment.

## Plan Checkpoints

### Checkpoint 1: Before Plan Submission

Before presenting a plan as implementation-ready, check that prescribed prose,
assertions, RED and GREEN expectations, command timing, file lists, commit
scopes, design requirements, acceptance conditions, and forbidden scope can
all coexist. Evaluate explicit regular expressions against the exact rendered
prose. Compare explicit path sets and command ranges with bounded native tools
when the claim can be evaluated cheaply.

### Checkpoint 2: Execution Preflight

Before production edits, verify that the plan still matches the exact baseline,
named files, available commands, task ordering, and prescribed fragments. On
the first defect, complete one aggregate scan before reporting or correcting
any defect. A clean preflight remains quiet. Do not build a general parser.

## Mechanical Correction Eligibility

A correction is mechanical only when all of these remain unchanged:

- product meaning;
- authorized files and ownership;
- permissions and risk;
- acceptance criteria and validation budget; and
- stop conditions.

The artifacts must be demonstrably equivalent for the approved purpose and
remain inside existing task scope. If equivalence is unclear, classify the
issue as semantic.

## Classification Fixtures

| Situation | Class | Route |
| --- | --- | --- |
| Hard-wrapped Markdown breaks a literal-space assertion | Mechanical | Use an equivalent whitespace-tolerant assertion |
| A scope-audit command runs before its intended commit | Mechanical | Run it after that commit and record the timing correction |
| An approved safety requirement is missing from the plan | Semantic | Return one aggregated decision-required event |
| A change reduces verification or expands files | Semantic | Return one aggregated decision-required event |

## Aggregate Correction Lifecycle

The Execution Task may perform at most one aggregate correction round. First
collect the complete related mechanical defect set, then apply directed checks
and continue the approved plan without a user prompt.

If the plan file is outside authorized scope, do not edit it. Record an
equivalent command-timing correction in task evidence. A new plan-artifact
defect after that round returns to Main Thread premise judgment. Do not start
an unbounded correction loop.

## Evidence And Quietness

Review-ready evidence records only:

plan_check: passed | corrected
plan_corrections: none | concise bounded list

`corrected` must name the equivalent artifacts or command timing and the
bounded evidence used to prove equivalence. It must not contain hidden
reasoning or a full execution transcript.

A passing check and successful bounded correction are quiet. The task must not
request `continue` after a passing check or successful bounded correction.
Surface one aggregated decision only for semantic, scope, permission, risk,
acceptance, validation-budget, or exhausted-correction questions.

## Hard Boundaries

Plan reliability does not authorize lowered acceptance, reduced verification,
new files outside allowed scope, dependency changes, cleanup, merge, push,
tag, release, publication, or automatic user-risk acceptance.
