# Navi Alpha 7 Coordination Layer Design

## Status

This design was approved in conversation on 2026-07-03. It defines the proposed alpha.7 direction after alpha.5 pause semantics and alpha.6 stage-and-vision supervision.

This is a design artifact only. It does not approve implementation, worktree execution, tagging, release preparation, GitHub Release creation, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, write delegation, or automatic thread orchestration.

## Product Context

Navi's current alpha surface remains docs-backed skill/plugin behavior, project-local trigger documentation, and `navi init`.

Alpha.5 made stops and continuations more legible: continue inside a bounded approved loop, stop at real decision points, and explain necessary pauses. Alpha.6 added Product Stage, Work Mode, and Vision Distance so non-expert users can understand how the current work relates to the larger product direction.

Real use then exposed a coordination gap. When implementation work runs in a true worktree while the main conversation continues design, the user needs to know whether the main session should wait, continue, review, merge, or switch attention. A completed worktree is not always an immediate interruption. A running worktree is not always a whole-session blocker. A valid push or commit report can still create friction if it does not reveal the next decision.

Alpha.7 should address that gap with a Coordination Layer.

## Product Goal

Navi alpha.7 helps the main session supervise multiple active work lanes without becoming a runtime scheduler or project-management system.

The goal is:

```text
Keep the main session useful while bounded lanes run elsewhere; interrupt only when a lane result changes the current decision, creates risk, or reaches a real review/merge gate.
```

Alpha.7 should help answer:

- Which work lanes are active?
- Which lane is waiting, blocked, complete, or ready for review?
- Can the main session continue non-conflicting design or supervision?
- Would continuing now invalidate, duplicate, or contaminate a worktree lane?
- Does a completed worktree need immediate review, or can review wait until the current design segment closes?
- What next decision should the user see instead of being forced to type `continue`?

## Core Model

Alpha.7 uses two concepts:

1. **Lane**: a bounded stream of work with a purpose, scope, owner, and state.
2. **Coordination Decision**: the main-session judgment about whether to continue, wait, switch attention, review, merge, or ask the user.

These are supervision concepts, not a mandatory output template. Navi should track them internally and surface only the smallest useful signal.

## Lane Types

Lane types describe the workstream being coordinated. They do not replace Work Mode. A lane can run inside any Work Mode.

### Main Lane

The main conversation lane. It covers design, supervision, roadmap judgment, user decisions, acceptance criteria, review planning, and non-conflicting coordination.

The Main Lane should not stop merely because another lane is running. It should stop only when every useful next action depends on the pending lane, or when continuing would cross a real decision boundary.

### Implementation Lane

A bounded implementation lane, usually a true Codex worktree session. It handles scoped code or docs changes after the main session has approved a plan.

The Implementation Lane can be active, waiting, completed, needs follow-up, blocked, or superseded. Its existence does not automatically block the Main Lane.

### Calibration Lane

A lane for real or semi-real observations, such as fresh-session transcripts, natural prompt checks, target-project behavior samples, or continuation-friction examples.

Calibration lanes should remain lightweight. They should not silently become release validation.

### Review / Merge Lane

A lane that appears when a worktree or implementation result is ready to inspect, cherry-pick, merge, or reject.

Review / Merge is a workflow lane, not a Work Mode. The Work Mode may still be Implementation or Calibration depending on what is being integrated.

### Release Lane

A lane for external-version readiness: release notes, version bumps, tags, source packages, GitHub Releases, npm, marketplace, or full release checks.

Release Lane work must not start just because implementation or calibration completed. It requires explicit user approval to enter Release mode.

### External Lane

A lane waiting on external state: user feedback, GitHub, CI, another Codex thread, another repository, browser state, network access, or a tool result.

External waiting should be scoped. If only one lane is waiting, the whole session is not necessarily blocked.

## Lane State

Alpha.7 should reason about lane state without forcing a status table into every response.

Useful states:

- **active**: currently being worked.
- **waiting**: dependent on a tool, user, external system, or another thread.
- **completed**: local lane work is done, but no integration decision has been made.
- **needs review**: result may affect main-session decisions and should be inspected.
- **blocked**: cannot progress without a specific decision or external change.
- **conflicting**: continuing another lane may modify the same files, change the same premise, or invalidate this lane.
- **deferred**: intentionally left for later because it is not needed for the current decision.

The key distinction is between **lane-level waiting** and **whole-session blocked**.

Lane-level waiting means one stream cannot continue. Whole-session blocked means no useful non-conflicting work remains without the pending result or user decision.

## Coordination Decision

Alpha.7 should produce a coordination decision when multiple lanes interact.

Possible decisions:

- **continue main lane**: the pending lane does not affect the current design or supervision judgment.
- **continue current execution lane**: the task is inside an approved boundary and should proceed to the stated acceptance point.
- **switch to review**: a completed lane may change the current premise, risk, or merge path.
- **defer review**: the completed lane is relevant but does not need to interrupt the current design segment.
- **pause for user decision**: the next action crosses a write, commit, push, release, mode, scope, risk, or project boundary.
- **stop as whole-session blocked**: all meaningful next work depends on a pending lane or user decision.
- **open a new lane only with approval**: a new worktree, fresh-session thread, or external project action is needed.

The decision should explain why in the smallest useful form.

## Trigger Rules

Alpha.7 should stay silent during ordinary single-lane work. It should trigger when coordination affects user control.

Appropriate triggers:

- a worktree is created, running, completed, failed, or needs follow-up;
- the user asks whether the main session should wait;
- the user repeatedly says `continue` or `继续` because no next decision was visible;
- implementation, testing, or release checks are consuming design time;
- a pending lane may change the current design premise;
- review or merge is possible but not necessarily urgent;
- multiple directions are active and the user does not know which one to inspect;
- a completed action report would otherwise leave the user with no visible next choice;
- continuing the main session might modify the same files or expand the worktree's scope.

Non-triggers:

- ordinary file reads;
- simple direct answers;
- single-lane targeted implementation inside an approved boundary;
- local progress updates that do not affect coordination;
- completed substeps that do not require user judgment.

## Output Strategy

Alpha.7 should use the smallest useful coordination signal.

### Silent Tracking

Default. Navi internally tracks lanes and coordination state but says nothing. Use this for ordinary execution and single-lane work.

### Light Coordination Signal

Use one to three sentences when the user needs a small orientation correction.

Example:

```text
The implementation lane is waiting, but the main design lane can continue because the pending result does not affect this design choice. I will continue with non-conflicting supervision work and stop if review becomes necessary.
```

### Coordination Map

Use only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue.

Example:

```text
Active lanes:
- Main: alpha.7 design
- Worktree: alpha.6 implementation completed, needs review

Coordination decision:
Continue the main design lane unless the worktree result changes the design premise.

Next real decision:
Review now, or defer review until this design section is closed.
```

Coordination Map is not a fixed template for every answer. It is a temporary orientation tool.

## Stop And Continue Rules

Alpha.7 inherits alpha.5 pause semantics and adds multi-lane rules.

### Worktree Running Rule

A running worktree is not a whole-session blocker by default.

The main session should continue non-conflicting design, supervision, acceptance-criteria, roadmap, or calibration-planning work when the pending implementation result does not affect the current judgment.

### Worktree Completed Rule

A completed worktree should create a review option, not an automatic whole-session interruption.

Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision.

Defer review when the current main-lane work is non-conflicting and the worktree result only matters after the current design segment closes.

### Conflict Rule

Stop or switch attention when continuing the main lane would:

- edit the same files as the worktree;
- expand or contradict the worktree scope;
- invalidate the worktree's acceptance criteria;
- make the pending result obsolete;
- require a release decision;
- cause two lanes to make incompatible product judgments.

### Review / Merge Gate Rule

Review, cherry-pick, merge, or conflict resolution requires an explicit decision when it changes repository state or product direction.

The main session may prepare review criteria without approval, but it should not merge or push without user approval.

### External Wait Rule

When a tool, thread, CI job, or external project is waiting, Navi should name what is waiting and whether other lanes can proceed.

If useful non-conflicting work remains, continue it. If no useful work remains, say the whole session is blocked and name the missing condition.

### Next Decision Rule

When stopping after a completed action, Navi should name the next meaningful decision if the session remains active.

Good:

```text
The push is complete. Next decision: close this calibration line, run one more natural prompt, or return to alpha.7 design.
```

Bad:

```text
Pushed.
```

## Relationship To Alpha.5 And Alpha.6

Alpha.7 does not replace alpha.5 or alpha.6.

Alpha.5 answers:

```text
Should this lane continue or stop?
```

Alpha.6 answers:

```text
What product stage, work mode, and vision distance are we in?
```

Alpha.7 answers:

```text
How should the main session coordinate multiple lanes without losing user control?
```

Together:

- Alpha.5 controls pause semantics inside a lane.
- Alpha.6 provides product-level orientation.
- Alpha.7 coordinates attention, waiting, review, and merge across lanes.

## Non-Goals

Alpha.7 does not include:

- automatic creation of worktrees;
- automatic creation of Codex threads;
- automatic polling of all threads;
- automatic merge, cherry-pick, or push;
- a long-term task database;
- a full project-management system;
- runtime UI;
- local app behavior;
- background watcher behavior;
- scheduler or notifications;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- release automation;
- npm publication;
- marketplace distribution;
- rebranding `src/web` as Navi alpha UI;
- forcing lane tables into ordinary answers.

Alpha.7 should improve coordination judgment in the current chat-based alpha surface. It should not become an orchestration engine.

## Implementation Surface

If implemented, the likely surface should remain docs-backed:

- `.agents/skills/along-working-thread/SKILL.md`;
- `.agents/skills/along-working-thread/references/working-thread-v1.md`;
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`;
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`;
- `docs/along/project-maps/navi-project-trigger-template.md`;
- `src/cli/navi-init.ts`;
- targeted tests that inspect skill/reference/init behavior.

Implementation should not touch runtime UI, `src/web`, MCP server behavior, external target projects, package publication, release automation, or thread-creation tooling unless a later implementation plan explicitly approves that scope.

## Testing And Calibration

Recommended implementation validation, if implementation is later approved:

- targeted skill/reference text tests;
- targeted `navi init` generated-trigger tests;
- plugin package consistency verification if packaged skill files are touched;
- `git diff --check`.

Not default for alpha.7 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Recommended calibration after implementation:

- one real or semi-real main-session/worktree coordination sample;
- one completed-worktree review-timing sample;
- one natural `continue` sample where the correct behavior is to continue non-conflicting work or expose the next decision.

Calibration should remain lightweight and should not attempt to prove full product correctness.

## Success Criteria

Alpha.7 succeeds if Navi can:

- distinguish lane-level waiting from whole-session blocked;
- state when the main session can continue non-conflicting work while another lane runs;
- state when a completed worktree should interrupt current design for review;
- defer review when immediate interruption is unnecessary;
- stop when continuing would conflict with worktree scope, files, acceptance criteria, product premise, or release readiness;
- make the next real decision visible after commit, push, merge, validation, or worktree completion;
- avoid forcing users to type `continue` merely because one lane reported progress;
- avoid turning every response into a lane report.

## Risks

### Over-Structuring

If Navi prints lane tables in ordinary answers, alpha.7 fails. Mitigation: default to Silent Tracking and use Light Coordination Signals before Coordination Maps.

### Hidden Conflict

If Navi lets the main session continue while a worktree edits the same files or implements a still-changing premise, it can create merge or design conflict. Mitigation: stop or switch to review when file scope, acceptance criteria, product premise, or risk changes overlap.

### Delayed Review

If completed worktrees are always deferred, important implementation results may be ignored. Mitigation: review immediately when the result affects the current decision or could invalidate continued design.

### False Orchestration Promise

Coordination language can sound like a runtime scheduler. Mitigation: keep alpha.7 explicit that it is prompt/docs-backed supervision, not automatic thread orchestration.

### Release-Mode Drift

Review or merge can accidentally become release preparation. Mitigation: Release Lane requires explicit user approval, and Release mode remains the only default place for full release checks.

## Open Product Judgment

Alpha.7 should be treated as a narrow supervision improvement for multi-lane work. If future calibration shows prompt-level lane coordination is insufficient, the next design question should be whether Navi needs a stronger coordination artifact or runtime support. That should be a separate design, not scope creep inside alpha.7.
