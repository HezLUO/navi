# Navi Alpha 5 Next Decision Visibility Follow-Up Design

## Status

Approved in conversation on 2026-07-02 as an alpha.5 follow-up design.

This is a design artifact only. It does not approve implementation, worktree execution, tagging, release preparation, GitHub Release creation, npm publication, marketplace publication, runtime UI, background automation, or automatic execution.

## Product Context

Navi alpha.5 pause semantics already defines the main behavior line:

> Continue inside a bounded, already-approved loop; stop at decisions the user can actually judge.

The current alpha.5 design covers:

- continue-through behavior;
- decision-point stopping;
- pause reason visibility;
- no-local-completion stops;
- lane-level versus whole-session waiting.

Fresh main-session calibration exposed one missing piece: after a valid stop, the user may still be forced to type `continue` if the response does not make the next decision visible.

The observed example happened after alpha.5 was merged into `main`, validated, and pushed to GitHub. Reporting the push result was correct. The problem was that the response ended without saying what the user could decide next. The user had to type `continue` only to ask for the next decision.

## Product Judgment

This should be an alpha.5 follow-up patch, not an alpha.6 direction.

It directly completes the existing alpha.5 promise: stopping at decisions the user can judge. Alpha.5 already says where to stop and why to stop. This follow-up adds what must be visible when stopping:

> If the session is still active, make the next meaningful decision visible.

This is not a new automation system, planner, or always-on execution feature.

## Problem

A valid stop can still create continuation friction.

The issue is not always that Codex stopped too early. Sometimes the stop is legitimate: commit, push, merge, release, or mode change may all be real boundaries. The failure is that the response gives a status report but does not expose the next decision.

For a non-expert user, this creates the same symptom as an avoidable pause: the only obvious reply is `continue` or `继续`.

## Design Goal

When Navi or Codex stops and the session has not naturally ended, it should prevent "what now?" friction by showing the smallest useful next-decision hint.

The goal is not to produce a menu after every turn. The goal is to avoid leaving the user with no visible choice except `continue`.

## Behavior Rule

### Next Decision Visibility Rule

When Navi or Codex proactively stops, and the user would otherwise have no visible next decision except `continue` / `继续`, provide a minimal next-decision hint.

The hint should appear only when useful:

- after commit, push, merge, validation, or worktree handoff completes and the session remains active;
- when Navi stops but the pause reason itself does not reveal what the user can choose next;
- when multiple reasonable tracks exist, such as closeout, calibration, design, implementation planning, or release preparation;
- when recent interaction shows the user repeatedly has to ask `continue` to get direction.

The hint should not appear when:

- the user already gave the next instruction;
- the stop is already a clear approval gate, such as "approve git push";
- the session naturally ends;
- the current loop should continue to an already-defined acceptance point;
- adding a hint would become fixed boilerplate or a heavy map.

## Output Strategy

Use the smallest useful form.

### No Hint

If the next decision is already visible, do not add extra structure.

Example:

```text
I am stopping because the next action is `git push origin main`.
```

This already exposes the decision.

### One Default Recommendation

Use this when there is one clear next direction.

Example:

```text
Next decision: close this alpha.5 follow-up here, or approve a small implementation plan to add this rule.
```

### Short Option Set

Use this when there are real branches.

Example:

```text
Next decision: commit this note, keep collecting examples, or switch back to product design.
```

The option set should usually be 2-4 short choices.

### Compact Map

Use a Progress Map or Rhythm Map only when the user asks where the project is, asks what comes next, or says they do not understand the broader project state. Next Decision Visibility should not force a map.

## Boundaries

This follow-up must not:

- turn every response into a menu;
- replace pause reason visibility;
- bypass write, commit, push, tag, release, tool, mode, scope, validation-budget, or cross-project approval gates;
- start new work automatically;
- create a runtime planner, scheduler, watcher, local app, or UI;
- change `src/web`;
- change MCP server behavior;
- trigger release notes, CHANGELOG, tags, GitHub Releases, npm publication, or marketplace work.

## Implementation Surface

If implemented, the scope should stay prompt/docs-backed:

- `.agents/skills/along-working-thread/SKILL.md`;
- `.agents/skills/along-working-thread/references/working-thread-v1.md`;
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`;
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`;
- `docs/along/project-maps/navi-project-trigger-template.md`;
- `src/cli/navi-init.ts`;
- targeted text tests for skill/reference/init behavior.

The implementation should not touch runtime UI, `src/web`, MCP server behavior, distribution, release automation, or external target projects.

## Testing And Calibration

Recommended implementation validation:

- targeted skill/reference text tests;
- targeted `navi init` generated-trigger tests;
- plugin package consistency verification if packaged skill files are touched;
- `git diff --check`.

Not default:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication.

Fresh-session calibration can be done after implementation, but it should remain a small calibration sample, not release-level proof.

## Success Criteria

This follow-up is successful if Navi guidance makes these points clear:

- a valid stop can still create friction if it hides the next decision;
- if the user can only reply `continue`, the pause likely failed to expose a decision;
- after commit, push, merge, validation, or worktree handoff, a still-active session should show the smallest useful next-decision hint;
- the hint can be one default recommendation or 2-4 short options;
- no fixed menu, heavy map, or automatic next-stage transition is required.

## Risks

### Menu Noise

If every stop includes a menu, Navi becomes heavier. Mitigation: use the hint only when the user would otherwise have no visible next decision.

### False Choices

If the hint lists choices that are not real decision points, it becomes ceremony. Mitigation: only list true branches or one default recommendation.

### Overlap With Progress Maps

Next Decision Visibility may look like a mini map. Mitigation: keep it to the smallest useful hint; use Progress/Rhythm Maps only for broader orientation requests.

### Prompt-Only Reliability

This remains docs-backed guidance, not a runtime guarantee. Mitigation: add targeted text tests and one small calibration sample after implementation.
