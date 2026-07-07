# Navi Alpha 11 Lane Closure Next-Decision Design

## Status

This design was drafted on 2026-07-07 after a maintainer-side calibration sample where a successful `git push origin main` closed the merge lane but did not show the next user decision.

The first draft was written too early, before the design was discussed with the user. The confirmed design below reflects the later design discussion on 2026-07-07:

- alpha.11 solves lane-closure decision invisibility, not all pause semantics;
- output should default to a light natural-language handoff, not a mandatory menu;
- trigger scope is recognizable lane closure where the next user-relevant decision would otherwise be invisible;
- implementation should stay docs/prompt-backed and narrow.

This is a design artifact only. It does not approve implementation, worktree execution, `navi init` changes, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi has already added several supervision layers:

- alpha.5: continue inside approved boundaries and stop at real decisions;
- alpha.7: distinguish lane-level waiting from whole-session waiting;
- alpha.8: avoid bare completion reports when the session remains active;
- alpha.9: record maintainer-side calibration evidence;
- alpha.10: keep Project/Rhythm Maps as navigation baselines, not task logs.

The remaining gap is narrower than general pause semantics. A lane can close correctly, but the main session can still leave the user with no visible next decision.

The latest evidence sample:

```text
Push succeeded. main is synced. No release mode.
```

That status was true, but it did not answer what the user should decide next. The user had to type `继续`, which was avoidable friction.

## Problem Definition

Alpha.11 solves **lane-closure decision invisibility**.

This means:

```text
A local work lane has closed, but the user cannot tell whether to stop, continue, review, merge, push, start planning, enter release mode, record calibration evidence, or move to a different design question.
```

The problem is not that every answer needs a next-step menu. The problem is that a technically correct closeout can still be incomplete when the session remains active and the next user-relevant decision is hidden.

Good alpha.11 behavior depends on one judgment:

```text
Is the next decision already visible to the user?
```

If yes, keep the answer short and do not add structure. If no, add the smallest useful next-decision signal.

## Product Goal

Alpha.11 should make lane closure handoffs useful when the session remains active.

The goal is:

```text
When a lane closes, Navi should either close the whole line explicitly or surface the smallest useful next decision, so the user is not forced to type "continue" to discover what remains.
```

This is a handoff-quality improvement, not a stronger execution contract.

## Core Principle

The core principle is:

```text
Lane closure is not automatically session closure.
```

A commit, merge, push, worktree completion, review completion, or validation pass can close one lane while the product/design conversation still has useful next decisions.

## Problem Statement

Users often do not know when a technical lane finishing means:

- the whole line is done;
- the next obvious action should happen;
- a new design/calibration loop should start;
- release mode should be considered but not entered automatically;
- the session should stop because no useful non-conflicting work remains.

If Navi only reports status, non-expert users may respond with `continue` because they cannot see the actual choice.

## Expected Behavior

When Codex/Navi closes a lane and the session remains active, it should add a small next-decision handoff.

Alpha.11 should choose the lightest sufficient output shape:

1. **Explicit closure** when the line is genuinely done.
2. **One default recommendation** when one next step is clearly best.
3. **Short options** when real branches exist.
4. **Approval gate** when continuing would cross a boundary.
5. **Blocked reason** when no useful non-conflicting work remains.

The default should be one natural-language sentence. Use 2-4 short options only when there are real branches. Use a Progress Map only when the user asks for broader orientation or the session is visibly losing direction.

Do not include bare `continue` or `继续` as an option. If continuing is meaningful, name the concrete action, boundary, and stop point.

## Lane Closure Moments

Alpha.11 should apply when a recognizable lane closes and the next user-relevant decision would otherwise be invisible.

It should especially apply after:

- commit succeeds;
- merge succeeds;
- push succeeds;
- worktree implementation completes;
- worktree review completes;
- targeted validation passes;
- calibration sample is recorded;
- documentation/design line is written;
- a release-adjacent check finishes but Release mode has not been approved.

These moments are common points where Codex currently says something true but incomplete.

## Non-Trigger Cases

Alpha.11 should not add a lane-closure handoff when:

- the user asked only for a narrow status answer, such as whether a push succeeded;
- the current task is genuinely complete and there is no active follow-up;
- the user gave a clear chained instruction, such as "commit and push";
- the session is inside an already-approved bounded loop with a clear acceptance point;
- the answer already includes explicit closure or a visible next decision;
- adding options would create fake branches;
- continuing would cross a release, push, commit, scope expansion, cross-project edit, or other approval gate.

When continuing would cross an approval gate, the correct behavior is to name that gate and ask for approval, not to present it as ordinary continuation.

## Decision Selection

Use the smallest useful next-decision signal:

1. If the lane and whole line are complete, use explicit closure.
2. If one next step is clearly best, recommend that step.
3. If there are real branches, give 2-4 short options.
4. If continuing would require approval, name the approval gate.
5. If no useful non-conflicting work remains, say why the session is blocked.

Do not include bare `continue` or `继续` as an option. If continuing is meaningful, name the concrete action, boundary, and stop point.

## Examples

### Push Succeeded

Bad:

```text
Pushed to origin/main. No release mode.
```

Good:

```text
Pushed to origin/main. The alpha.10 implementation lane is closed and we are not in release mode. Next recommended step: record this push-handoff sample and start alpha.11 design, because the missing next decision created another meaningless continue.
```

### Worktree Completed

Good:

```text
The worktree completed. This creates a review/merge option; the main session does not need to stop unless the result changes the current design premise. Next decision: review now, defer review until the current design segment closes, or stop.
```

### Commit Completed

Good:

```text
Commit is created. Next decision: push it, create a worktree to implement the next plan, or stop here.
```

## Relationship To Earlier Layers

Alpha.11 does not replace alpha.5, alpha.7, or alpha.8.

- Alpha.5 decides whether Codex should keep going inside an approved boundary.
- Alpha.7 decides whether a lane wait blocks the whole session.
- Alpha.8 says a stop should include a decision, recommendation, closure, or blocked reason.
- Alpha.11 specializes the rule for lane-closure moments after technical actions succeed.

The distinction matters because alpha.8 is broad. Alpha.11 provides a sharper trigger for the specific moment where status-only closeouts still produce meaningless `continue`.

## Product Boundary

Alpha.11 should not force a structured menu after every response.

It should not:

- print a Progress Map by default;
- print Product Stage, Work Mode, and Vision Distance every time;
- create a mandatory numbered menu after every command;
- automatically enter implementation planning;
- automatically create a worktree;
- automatically commit, push, merge, tag, release, or update target-project files;
- turn Navi into a project manager or scheduler.

It should only improve the final sentence or short handoff when a lane just closed.

Push completion is not automatic release preparation. After push, Navi may say release planning is an available option when relevant, but it must not imply Release mode is the default next step unless the user has explicitly chosen release work.

Documentation closeout is not design confirmation. A written or committed design draft should not be called complete until the user has had the intended design discussion and approved the design direction.

## Implementation Surface

If implemented, the likely surface should remain docs-backed and narrow:

- canonical Along Working Thread skill guidance;
- canonical reference docs;
- project trigger template;
- `navi init` generated trigger text;
- targeted text assertions.

Implementation should not touch:

- `src/web`;
- runtime server/MCP files;
- README or release notes unless a later release-mode decision explicitly requires them;
- GitHub Release bodies;
- external target projects;
- package ids, skill ids, or CLI aliases.

## Testing And Calibration

Recommended implementation validation, if implementation is later approved:

- targeted skill/reference/template text tests;
- targeted `navi init` generated-trigger tests;
- `npm run verify:plugin-package` only if plugin skill copies are touched;
- `git diff --check`.

Not default for alpha.11 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Recommended calibration after implementation:

- one commit-success closeout sample;
- one push-success closeout sample;
- one worktree-completed closeout sample;
- one negative sample where a narrow status answer should stay short because the user asked only for status.

## Success Criteria

Alpha.11 succeeds if:

- push/commit/merge/worktree completion no longer leaves the user with only `continue`;
- the next decision is visible when the session remains active;
- closure is explicit when the line is genuinely done;
- real options appear only when real branches exist;
- Navi does not add heavy structure to ordinary short answers;
- Release mode is still explicit and never implied by a successful push.
- written design artifacts are not mistaken for approved design decisions.

## Risks

### Menu Creep

If every response ends with options, Navi becomes noisy. Mitigation: only apply after lane closure or when the user lacks a visible next decision.

### False Continuation Pressure

If Navi always recommends another step, users may feel the project never closes. Mitigation: explicit closure is a valid and preferred outcome when the line is done.

### Release Boundary Leakage

After push, Codex may imply that release is the next automatic step. Mitigation: mention release only as an option when relevant, and do not enter Release mode without explicit approval.

### Product-Manager Drift

Lane closure handoff could expand into scheduling, task tracking, or project management. Mitigation: keep alpha.11 as a short handoff rule, not a persistent planner.
