# Navi Alpha 8 Decision Handoff Quality Design

## Status

This design was approved in conversation on 2026-07-03. It defines the proposed alpha.8 direction after alpha.5 pause semantics, alpha.6 stage-and-vision supervision, and alpha.7 coordination layer.

This is a design artifact only. It does not approve implementation, worktree execution, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi has been moving toward a supervision layer for non-expert users working with expert agents.

Recent work addressed several adjacent problems:

- Alpha.5: whether a lane should continue or stop, and why.
- Alpha.6: which Product Stage, Work Mode, and Vision Distance the current loop occupies.
- Alpha.7: how the main session coordinates multiple lanes such as worktrees, calibration, review/merge, release, and external waiting.

Real use exposed a remaining handoff-quality problem. Even when a stop is technically valid, the user can still be forced to type `continue` because the response only reports completion and does not reveal what decision, if any, is now needed.

The failure shape is:

```text
Done.
```

when the useful handoff should be:

```text
This loop is complete. Next decision: push this commit, start implementation planning, or close the line.
```

Alpha.8 should improve the quality of control handoff when Codex stops.

## Product Goal

Navi alpha.8 should ensure that when Codex returns control to the user, the user can see a real next decision, a clear default next step, or explicit loop closure.

The goal is:

```text
Stop with a decision, a recommendation, or closure; do not stop with a bare completion report when the session is still active.
```

This is not a rule to always print menus. It is a rule to make the next user judgment visible when the agent stops.

## Relationship To Earlier Layers

Alpha.8 does not replace alpha.5, alpha.6, or alpha.7.

Alpha.5 answers:

```text
Should this lane continue or stop?
```

Alpha.6 answers:

```text
Where does this work sit in the product stage, work mode, and vision distance?
```

Alpha.7 answers:

```text
How should the main session coordinate multiple lanes without losing user control?
```

Alpha.8 answers:

```text
When Codex gives control back, is the next decision visible and useful?
```

Together:

- Alpha.5 decides whether stopping is legitimate.
- Alpha.6 gives product-level context when needed.
- Alpha.7 coordinates lanes and waiting scope.
- Alpha.8 makes the handoff back to the user usable.

## Core Principle

The core principle is:

```text
Completion is not always a handoff.
```

Reporting that an action completed is not enough when the session remains active and the user still needs to choose what happens next. A useful handoff should tell the user what control they now have.

## Handoff Outcomes

Alpha.8 should choose one of three lightweight handoff outcomes.

### Default Next Step

Use this when one direction is clearly best and does not cross an unapproved boundary.

Example:

```text
Recommended next step: commit the narrative spec. This stays in design mode and does not start implementation or release work.
```

Default Next Step should reduce decision fatigue. It should not pretend the user approved an action that still needs approval.

### Decision Options

Use this when there are real branches the user can judge.

Example:

```text
Next decision:
1. Push the two design commits.
2. Start implementation planning.
3. Stop at design committed.
```

Options should be few, concrete, and materially different. Do not include `continue` as a fake option unless the meaning of continuing is explicit.

### Loop Closure

Use this when the current line is actually complete.

Example:

```text
This alpha.7 design/plan line is closed. Remaining open tracks are public narrative implementation review and alpha.8 design.
```

Loop Closure should prevent the user from wondering whether there is hidden unfinished work.

## Handoff Rules

### Stop With Decision Rule

If Codex proactively stops while the session remains active, the response should include one of:

- a default recommended next step;
- a small set of real decision options;
- explicit loop closure;
- a blocked reason and the condition needed to proceed.

Bare completion reports should be avoided unless the user explicitly asked only for a status report.

### One Clear Path Rule

When there is one clearly better next step, give a recommendation instead of a menu.

Good:

```text
Recommended next step: push main. The work is already committed and verified; this does not start release mode.
```

Too weak:

```text
What next?
```

### Real Branches Rule

When multiple reasonable paths exist, show two to four real options.

Good:

```text
Next decision:
1. Push the current docs commits.
2. Create the implementation worktree.
3. Pause with design and plan committed.
```

Bad:

```text
1. Continue.
2. Do something else.
```

### No Menu Inside Approved Boundary Rule

If the user already approved a bounded loop with a clear acceptance point, do not stop with a menu at every intermediate completion.

For example, if the stated contract is:

```text
I will write the spec, self-review it, run diff check, then stop at the commit decision.
```

then successful spec write and diff check should not require user decisions. The handoff happens at the commit decision.

### Close Finished Lines Rule

When a line is complete, say so explicitly and name any remaining open lines if the session continues.

Example:

```text
This calibration line is closed. No further validation is needed unless you want a natural-prompt sample later.
```

### Blocked Means Actually Blocked Rule

Do not say the session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, or external state.

If only one lane is blocked, name that lane and say what the main session can still do.

### Mode-Sensitive Handoff Rule

The handoff shape should match the current Work Mode:

- Design: recommend refining, writing, committing, or moving to implementation planning.
- Calibration: recommend recording evidence, running one more sample, or closing the calibration line.
- Implementation: recommend commit, review, merge, targeted follow-up, or stopping at verification.
- Release: recommend release-gate decisions such as tag, release notes, source package verification, or stop.

Do not let implementation or release options appear in Design mode unless the user has approved that mode transition.

## Trigger Rules

Alpha.8 should trigger when Codex is about to stop and the next decision would otherwise be invisible.

Appropriate triggers:

- after writing, checking, committing, pushing, merging, validating, or creating a worktree;
- after a worktree reports completion;
- after a review finds no blockers;
- after a calibration sample is recorded;
- after a valid stop where the user may not know what to do next;
- after repeated `continue` or `继续` prompts that indicate the handoff was unclear.

Non-triggers:

- ordinary direct answers;
- simple requested status reports;
- mid-loop progress updates inside an already-approved boundary;
- cases where the user explicitly asked for no next steps;
- cases where a tool or safety boundary requires a separate platform approval.

## Output Strategy

Alpha.8 should use the smallest useful handoff.

### Silent Completion

Use only when the user asked for a narrow status report or the task is genuinely done with no active follow-up.

### One-Sentence Handoff

Use when a default next step is obvious.

Example:

```text
Recommended next step: push this commit; no release work is involved.
```

### Short Decision Options

Use when multiple real branches exist.

Keep options short. Prefer two or three options. Four is the upper bound.

### Closure Note

Use when the line is complete and the next best action is to switch tracks or stop.

## Non-Goals

Alpha.8 does not include:

- a mandatory menu in every response;
- a fixed checklist after every action;
- automatic mode switching;
- automatic implementation planning;
- automatic worktree creation;
- automatic commit, push, merge, tag, or release;
- task database behavior;
- runtime UI;
- local app behavior;
- background watcher behavior;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- release automation;
- npm publication;
- marketplace distribution.

Alpha.8 should improve the final step of supervision, not create a new project-management layer.

## Implementation Surface

If implemented, the likely surface should remain docs-backed:

- `.agents/skills/along-working-thread/SKILL.md`;
- `.agents/skills/along-working-thread/references/working-thread-v1.md`;
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`;
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`;
- `docs/along/project-maps/navi-project-trigger-template.md`;
- `src/cli/navi-init.ts`;
- targeted tests that inspect skill/reference/init behavior.

Implementation should not touch runtime UI, `src/web`, release docs, external target projects, package publication, release automation, or thread-creation tooling unless a later implementation plan explicitly approves that scope.

## Testing And Calibration

Recommended implementation validation, if implementation is later approved:

- targeted skill/reference text tests;
- targeted `navi init` generated-trigger tests;
- plugin package consistency verification if packaged skill files are touched;
- `git diff --check`.

Not default for alpha.8 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Recommended calibration after implementation:

- one completion-report sample where the right behavior is Default Next Step;
- one branch sample where the right behavior is Decision Options;
- one closure sample where the right behavior is Loop Closure;
- one negative sample where no menu should appear because the loop boundary is already approved.

Calibration should remain lightweight and should not attempt to prove full product correctness.

## Success Criteria

Alpha.8 succeeds if Navi can:

- avoid bare completion reports when the session remains active;
- provide a default next step when there is one clear path;
- provide two to four real options when there are real branches;
- avoid menus inside already-approved bounded loops;
- close completed lines explicitly;
- distinguish lane-level waiting from whole-session blocked when handing control back;
- match handoff strength to Work Mode;
- reduce meaningless `continue` prompts without adding heavy structure to every response.

## Risks

### Menu Spam

If Navi prints options after every small action, alpha.8 fails. Mitigation: use Silent Completion and One-Sentence Handoff when enough.

### False Choice

If options include fake branches such as bare `continue`, they do not help the user. Mitigation: options must be concrete and materially different.

### Overstepping Approval

If default recommendations sound like actions already approved, Navi may weaken user control. Mitigation: recommendations should say what approval would do and preserve gates for writes, commits, pushes, releases, mode changes, and scope changes.

### Overlap With Alpha.5 And Alpha.7

Alpha.8 could duplicate pause semantics or coordination logic. Mitigation: alpha.5 decides stop/continue legitimacy, alpha.7 decides lane coordination, alpha.8 decides whether the final handoff is useful.

## Open Product Judgment

Alpha.8 should be treated as a narrow handoff-quality improvement. If future calibration shows users still need to type `continue` repeatedly, the next question should be whether Navi needs a stronger persistent execution contract. That should be a separate design, not scope creep inside alpha.8.
