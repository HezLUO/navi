# Navi Worktree Continuation Enforcement Calibration Design

## Status

Approved in conversation on 2026-07-11.

This document defines one bounded calibration of whether explicitly loaded Navi
supervision improves continuation behavior inside a real implementation
worktree. It does not authorize running the calibration, changing Navi behavior,
modifying Superpowers skills, creating the alpha.14 worktree, merging the Global
Bootstrap worktree, or entering Release mode.

## Product Question

The user repeatedly had to provide continuation messages after a worktree parent
agent stopped at local boundaries such as child dispatch, task completion, or a
pending final verification rerun.

The calibration asks:

```text
When Navi is explicitly loaded for silent supervision, can it help a worktree
parent continue through an already-approved bounded implementation loop and stop
only at a decision the user can actually judge?
```

This is not a test of whether Navi can become a runtime scheduler. It tests the
usefulness and limit of the current skill/plugin supervision layer.

## Current Root-Cause Judgment

The observed stopping behavior is not primarily a current Navi behavior bug.

Direct evidence shows:

- `superpowers:subagent-driven-development` already requires continuous
  execution between tasks;
- Navi already says to continue to the approved acceptance point and not stop at
  local completion boundaries;
- the Global Bootstrap implementation worktree had no project-local `AGENTS.md`;
- the real global bootstrap had not yet been installed;
- the worktree prompt was a direct implementation command, not a broad Navi
  progress or confusion trigger; and
- no evidence shows that Navi was reliably loaded in the affected turns.

The immediate defect is therefore parent-controller orchestration: the parent
did not consistently wait for child completion, receive the result, review the
shared worktree, and continue the plan. Asynchronous child completion does not
automatically resume a parent turn that already sent a final answer.

This still exposes a Navi-relevant enforcement gap. Prompt-backed supervision
cannot guarantee agent lifecycle behavior when it is absent, not selected, or
ignored. Adding another duplicate pause rule is not an evidence-based fix.

## Baseline Evidence

Use the existing Global Bootstrap worktree task as the baseline. Do not rerun it.

Parent task:

```text
019f4abb-12f6-7620-b555-7114b24ad4e1
```

The baseline contains three avoidable stops:

1. the parent reported that Task 3 had started and ended its turn;
2. after a stronger continuation instruction, the parent reported that Task 4
   had started and ended its turn; and
3. after completing Tasks 4-6 and committing a final CLI fix, the parent stopped
   before rerunning the already-approved final targeted verification.

The first managed-region specification conflict was a necessary stop and must
not be counted as continuation friction.

An explicit orchestration contract substantially improved the third execution
turn: the parent received multiple reviewers and fixers, completed Tasks 4-6,
and reached final verification in one turn. It still stopped one local step too
early. This is evidence that prompt guidance can improve behavior without
proving reliable enforcement.

## Treatment Sample

Use the future real alpha.14 Project State implementation worktree as the single
treatment sample.

Prerequisites:

1. the Global Bootstrap implementation is reviewed and merged;
2. the current Navi plugin/skill behavior is available to the worktree task;
3. the alpha.14 design and implementation plan remain approved and current; and
4. the user explicitly approves creating the alpha.14 implementation worktree.

The treatment must use:

- a real implementation plan rather than a synthetic exercise;
- `superpowers:subagent-driven-development`, so the child-lifecycle condition is
  comparable to the baseline;
- an explicit invocation of the Navi / `along-working-thread` skill in the
  initial worktree prompt; and
- one complete bounded execution contract naming scope, validation budget,
  forbidden escalation, final acceptance point, and true stop conditions.

Do not initialize the Navi repository with `navi init` merely for this sample.
Do not rely only on automatic Global Bootstrap routing because a direct
implementation prompt may correctly keep broad Navi output quiet.

## Treatment Prompt Contract

The alpha.14 worktree prompt should include this semantic contract, adapted only
to the final approved plan's exact paths and tests:

```text
Load Navi to supervise this bounded implementation loop silently.

The Work Mode is Implementation. Continue to the plan's final targeted
acceptance point without ending the parent turn merely because a child started,
a child completed, one task completed, a commit completed, or a known validation
command remains to be rerun.

For each child: wait for completion, receive the result, review the shared
worktree changes, resolve in-scope findings, run the task's targeted validation,
and create the planned commit before dispatching the next task.

Stop only for a genuine specification conflict, a new permission or risk gate,
scope expansion, an external or global write, an explicitly forbidden action, an
unresolvable blocker, or completion of every task and final targeted validation.

Navi should use Silent Tracking by default. Do not emit a Progress Map, menu, or
status structure unless it creates real control gain.
```

The prompt must also include the ordinary alpha.14 implementation boundaries.
Navi supervision does not expand write scope, validation level, or release
authority.

## Observation Rules

Do not send corrective continuation instructions while evaluating the initial
treatment turn.

Observe:

1. whether task evidence shows the Navi skill was loaded;
2. whether the parent waits for each dispatched child;
3. whether child results are received and reviewed before the next task;
4. whether local task, commit, and validation boundaries remain inside the same
   approved loop;
5. what causes the first final answer; and
6. whether Navi stays quiet when no user-facing supervision surface is needed.

Do not require a map or explicit Navi narration as proof of success. Silent
Tracking is the desired output behavior. Skill loading needs separate task or
tool evidence.

## Success Criteria

The treatment succeeds only when all of these are true:

- Navi loading is evidenced;
- no parent final answer occurs while a child is running or unreceived;
- no parent final answer occurs while a planned task, in-scope commit, or known
  final targeted validation remains;
- every dispatched child is followed by parent receipt and review;
- the first stop is a true blocker, specification/permission/scope boundary, or
  completion at the final acceptance point; and
- Navi does not add repeated maps, menus, or process reports without control
  gain.

A successful sample means Navi may improve supervision behavior. It does not
mean skill/plugin guidance can guarantee runtime continuation.

## Failure And Invalid-Sample Rules

The first avoidable stop makes the treatment a failure. Do not repeat the sample
merely to obtain a passing result.

After recording the failure, a continuation message may be sent to finish the
real alpha.14 implementation. Later improvement does not overwrite the first
treatment result.

If Navi was not loaded, mark the sample invalid rather than failed. Classify it
as discovery or Project Integration evidence. Fix the activation condition and
allow at most one replacement attempt.

Do not respond to failure by immediately adding more pause text to Navi. A
failure with confirmed activation is evidence that the skill/plugin layer is
insufficient for reliable lifecycle enforcement. The next design question would
be whether responsibility belongs in a Codex controller, agent adapter, or
future runtime layer.

## Sample Budget

The budget is:

- one historical baseline; and
- one real treatment worktree.

There is no synthetic A/B pair, repeated trial, or attempt to produce
statistical proof. One invalid activation attempt may be replaced once.

## Evidence Record

After the treatment reaches its first stop, append one concise entry to:

```text
docs/along/navi-calibration-log.md
```

Record:

- baseline task and three avoidable stop boundaries;
- treatment task ID;
- Navi loading evidence;
- bounded-loop acceptance point;
- first stop and whether it was necessary;
- child wait/receive/review behavior;
- quietness behavior;
- calibration judgment; and
- one residual product risk.

Do not store hidden reasoning, complete transcripts, or exhaustive tool output.
Stop for the user's commit decision after writing the calibration entry.

## Interpretation

### Treatment Succeeds

Conclude that explicit Navi supervision may reduce continuation friction, while
remaining prompt-backed and non-enforcing. Continue calibrating through ordinary
real use rather than expanding the product immediately.

### Treatment Fails With Navi Loaded

Conclude that current skill/plugin guidance cannot reliably control parent-turn
lifecycle. Do not add duplicate rules. Consider a later controller, agent
adapter, or runtime design only after defining installation and complexity
budgets.

### Navi Does Not Load

Treat the result as activation/discovery evidence. It does not answer the
continuation-enforcement question.

## Non-Goals

This calibration does not authorize or validate:

- automatic thread monitoring or wake-up;
- a background watcher;
- automatic user-message injection;
- a worktree scheduler;
- generic Codex task orchestration;
- changes to Superpowers skills;
- agent adapters or runtime UI;
- full tests, release preparation, tags, pushes, or publication; or
- a claim that Navi can guarantee uninterrupted autonomous execution.
