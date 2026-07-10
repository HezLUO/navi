# Navi Alpha 14 Real-Project Calibration Design

## Status

Approved in conversation on 2026-07-10.

This document defines a bounded real-project calibration protocol for alpha.14
confirmed Project State. It does not authorize running the calibration, changing
target projects, implementing alpha.14, merging worktrees, installing Navi,
publishing a release, or increasing the sample budget.

## Purpose

Alpha.14 changes Project State from an uncalibrated `navi init` output into an
optional `.navi/state.md` snapshot created only after reliable navigation facts
are user-confirmed.

The calibration should answer two product questions:

1. Does Navi offer Project State at the right boundary without adding another
   unnecessary interruption?
2. Does a confirmed state materially reduce fresh-session reconstruction while
   preserving accurate evidence challenge?

The goal is useful product evidence, not proof that the whole Navi system is
correct.

## Required Preconditions

Run this protocol only after:

1. the Global Bootstrap implementation has been reviewed and merged into Navi
   `main`;
2. the alpha.14 implementation has been reviewed and merged into Navi `main`;
3. the latest Navi skill/plugin behavior is available in the actual Codex
   environment; and
4. each target-project write receives explicit approval at the moment it is
   proposed.

A Navi release is not required. This is Calibration mode, not Release mode.

## Samples And Roles

### New-Project Sample

Target:

```text
/Users/james/Codex Project/General Codex Project/engineering_loop/engineering-loop-kit-transition-package
```

This is the canonical Loopwright product repository inside the non-Git
`engineering_loop` container. Do not treat the container itself or
`loopwright-codex-smoke-test` as the alpha.14 target.

Role:

- observe Global Bootstrap before initialization;
- initialize through the current `navi init` path after approval;
- compare fresh-session behavior without and with confirmed Project State.

The bootstrap observation is recorded separately and does not count as an
alpha.14 success or failure.

### Existing-Project Upgrade Sample

Target:

```text
/Users/james/Codex Project/General Codex Project/sub_ag_ski
```

Role:

- retain the existing project-local Navi trigger;
- retain the existing Project Map that still describes release preparation;
- do not clean or stage its untracked Navi files;
- observe whether current repository evidence, including the `v0.1.1` state,
  challenges the older map before Project State is proposed;
- compare fresh-session behavior without and with confirmed Project State.

This is an upgrade-compatibility sample, not a normalized clean installation.

### Temporary-Lane Negative Sample

Current candidate:

```text
/Users/james/.codex/worktrees/77ad/auto_model_reasoning
```

At design time this detached worktree contains Task 1 commit `085296d` and a
review blocker concerning malformed nested TOML shapes.

Role:

- verify that Navi recognizes the temporary implementation lane, its review
  blocker, and its return decision;
- verify that Navi does not push project-level state creation inside a temporary
  active or waiting lane;
- remain read-only.

Run this sample only if the worktree still genuinely exists and remains active
or waiting when calibration begins. If it has ended or merged, skip the sample.
Do not create a replacement worktree merely to reach the sample count.

After that lane merges, the canonical
`/Users/james/Codex Project/General Codex Project/auto_model_reasoning` project
may become a future complete sample, but this protocol does not require it.

## Prompt Protocol

Every comparable fresh session begins with only this natural prompt:

> 接下来我们应该做什么？

Do not mention Navi, identify evidence files, prescribe output fields, describe
the task as calibration, or add a read-time target to the prompt.

For each canonical project:

1. start a fresh session with no `.navi/state.md`;
2. record the first completed navigation judgment and its visible evidence use;
3. let the user naturally confirm or correct the Goal, Stage, Focus, and Next
   Decision;
4. observe whether Navi waits for eligibility and a natural decision boundary;
5. if Navi shows a correct compact preview, obtain explicit user approval before
   writing `.navi/state.md`; and
6. start an independent fresh session with the same prompt after state exists.

The temporary-lane sample uses the same prompt but remains read-only and must not
create state.

Do not add an English prompt to this calibration. Language-following is a
separate behavior already tested elsewhere; mixing it into alpha.14 would make
the result harder to interpret.

## Success Model

Use decision quality as the primary measure and reconstruction cost as a
secondary observation.

Record five judgments for each applicable session:

1. **Navigation judgment:** Goal, Stage, Focus, and current position are accurate
   enough to guide the user.
2. **Real next decision:** the answer names something the user can judge rather
   than a mechanical `continue` step.
3. **Creation boundary:** Navi creates, offers, or declines Project State at the
   appropriate moment.
4. **Interaction cost:** Navi avoids repeated offers, unnecessary pauses, and a
   mandatory state-shaped response.
5. **Continuity gain:** with state present, the fresh session reaches an equal or
   better judgment with visibly less reconstruction effort.

Record approximate elapsed time, major files read, and tool-call volume only as
supporting evidence. Do not impose token, timing, or file-count thresholds that
could reward shallow reasoning.

## Session Budget

The maximum planned budget is six valid fresh sessions:

| Sample | Sessions | Purpose |
| --- | ---: | --- |
| Engineering Loop | 3 | bootstrap observation, no-state baseline, with-state comparison |
| sub_ag_ski | 2 | no-state upgrade baseline, with-state comparison |
| auto_model_reasoning worktree | 1 | temporary-lane negative sample |

Core alpha.14 evidence is the four before/after sessions across the two
canonical projects. Bootstrap and temporary-lane observations each answer one
separate boundary question.

If the temporary worktree is no longer eligible, the maximum becomes five. Do
not replace it automatically.

## Retry And Stop Rules

- A behavioral failure is evidence. Record it; do not rerun until it passes.
- One replacement attempt is allowed only when a session fails to load the
  project, a task tool fails, or an external environment error invalidates the
  sample.
- Mark an invalid environment attempt separately and do not count it against the
  six valid sessions.
- Do not run full tests, release checklists, or statistical repetitions as part
  of calibration.
- Do not immediately exercise every update, deletion, corruption, Git, and
  conflict edge case after creating state.
- Stop when the planned valid sessions are complete.
- Add another behavioral sample only if the observed result introduces a new,
  unclassifiable product question and the user explicitly approves increasing
  the budget.

## Execution Order

1. Record the Navi commit/plugin version used for calibration.
2. Run the Engineering Loop uninitialized bootstrap observation.
3. Obtain approval before `navi init --write` changes the Engineering Loop target.
4. Run the Engineering Loop no-state baseline.
5. Obtain approval before creating its `.navi/state.md`.
6. Run the Engineering Loop with-state comparison.
7. Run the `sub_ag_ski` no-state upgrade baseline without cleaning old Navi
   evidence.
8. Obtain approval before creating its `.navi/state.md`.
9. Run the `sub_ag_ski` with-state comparison.
10. If still eligible, run the temporary worktree negative sample read-only.
11. Write one compact calibration closeout.

The temporary-lane sample may run earlier if it is likely to disappear, but it
must use the same installed alpha.14 behavior and remain read-only.

## Write Boundaries

Every cross-project write remains a real approval gate:

- `navi init --write`;
- creation or repair of `.navi/state.md`;
- any project-local trigger update; and
- any other target-project documentation change.

Navi must not automatically:

- stage, commit, push, tag, or release target-project changes;
- modify `.gitignore`;
- clean unrelated target-project changes; or
- convert a calibration approval into standing write authority.

## Evidence Record

After the planned samples finish, append one alpha.14 section to:

```text
docs/along/navi-calibration-log.md
```

The entry should contain:

- target project and fresh task ID;
- whether state was absent or present;
- major project evidence used;
- the five success judgments;
- user corrections;
- approximate reconstruction difference;
- one product conclusion; and
- the most important residual risk.

Do not store complete transcripts, hidden reasoning, private source-thread
content, or exhaustive tool output. After writing the compact closeout, stop for
the user's commit decision.

## Interpretation Rules

- A useful first answer without state does not make alpha.14 unnecessary; compare
  the reconstruction cost and stability of the second session.
- A faster answer with state is not success if it repeats stale or incorrect
  navigation.
- A correct state proposal at the wrong moment is still an interaction failure.
- Failure to propose state may be acceptable when eligibility is not actually
  satisfied.
- The temporary worktree is successful when Navi identifies the lane-level
  decision and stays quiet about project-level state creation.
- One positive sample is evidence, not broad product proof.

## Non-Goals

This calibration does not validate:

- release readiness for Navi;
- all Project State update paths;
- cryptographic source trust;
- global marketplace or npm installation;
- runtime UI, background presence, Memory v2, agent adapters, delegation, or
  write delegation;
- every language-following case;
- every project shape; or
- statistical performance guarantees.
