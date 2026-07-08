# Navi Alpha 12 Quietness And Rule Density Control Design

## Status

This design was discussed and approved in conversation on 2026-07-08 after alpha.11 lane-closure design and implementation planning.

This is a design artifact only. It does not approve implementation, worktree execution, `navi init` changes, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, telemetry, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi has accumulated several useful supervision layers:

- alpha.5 pause semantics;
- alpha.6 stage-and-vision supervision;
- alpha.7 coordination layer;
- alpha.8 decision handoff quality;
- alpha.10 project-local map maintenance;
- alpha.11 lane-closure next-decision handoff.

These layers solve real control problems, but they create a new product risk: Navi may surface supervision simply because a rule can technically trigger.

The next risk is not missing supervision. The next risk is **pseudo-supervision**: extra process text that looks helpful but does not improve what the user can understand, decide, stop, approve, or redirect.

Alpha.12 should make Navi quieter by default without weakening necessary supervision.

## Problem Definition

Alpha.12 solves **pseudo-supervision**.

Pseudo-supervision means:

```text
Navi surfaces a map, mode label, option set, handoff, or process explanation even though it does not materially increase user control.
```

Structure is not automatically bad. A full Progress Map is correct when the user is lost or needs overall orientation. A short answer can still be pseudo-supervision if it adds a next-step hint that does not change the user's decision.

The central test is:

```text
Does this Navi surface create control gain?
```

If not, Navi should stay quiet and answer the user's immediate request directly.

## Product Goal

Alpha.12 should add a quietness gate before Navi surfaces.

The goal is:

```text
No control gain, no Navi surface. When control gain exists, use the lightest surface that provides it.
```

This is a rule-density control layer. It decides when existing Navi behaviors should stay silent, not a new heavy output format.

## Core Principle

The core principle is:

```text
No control gain, no Navi surface.
```

Navi should not appear just because:

- a previous alpha rule could technically apply;
- more information could be provided;
- the answer would look more complete;
- a workflow label could be named;
- a next step could be invented.

Navi should appear only when it improves user control.

## Control Gain

Control gain exists when Navi changes what the user can understand, decide, stop, approve, or redirect.

Alpha.12 recognizes five control-gain types.

### Orientation Gain

The user cannot see where the work stands, and Navi makes the current position understandable.

Examples:

- user asks "where are we?";
- user says they do not understand progress;
- project state spans several files or lanes.

### Decision Gain

The user cannot see what decision they are being asked to make, and Navi names a real decision.

Examples:

- a lane closed but next choice is hidden;
- a plan is ready and the user needs to approve, revise, or stop;
- multiple real branches exist.

### Boundary Gain

Continuing would cross a boundary, and Navi makes the boundary visible.

Examples:

- durable file write;
- commit, push, tag, or release;
- cross-project modification;
- mode change;
- scope expansion;
- validation-budget escalation;
- risk acceptance.

### Risk Gain

Continuing blindly may create obvious cost, misleading confidence, wrong direction, over-validation, wrong waiting, or premature release pressure.

Examples:

- implementation success is being treated as product proof;
- full release testing is leaking into design;
- a stale map may mislead a fresh session;
- the agent is about to continue despite weak assumptions.

### Coordination Gain

Multiple lanes, worktrees, reviews, waits, or external states could conflict, block, or confuse the main session.

Examples:

- a worktree completed but does not necessarily block main-lane design;
- review/merge result may change the current premise;
- two lanes would touch the same files.

Do not count "more complete", "more professional", "more explanatory", or "more structured" as control gain by itself.

## Quietness Ladder

When control gain exists, Navi should use the lightest sufficient surface.

### 1. Silent Direct Answer

Use when there is no meaningful control gain.

Examples:

```text
Push succeeded.
```

```text
The current branch is main.
```

Do not mention Navi, Work Mode, Product Stage, Progress Map, lane, or handoff.

### 2. Embedded Hint

Use when there is slight control gain and one short phrase is enough.

Example:

```text
Pushed to origin/main. This does not start Release mode.
```

### 3. One-Sentence Handoff

Use when one next decision or boundary matters.

Example:

```text
The plan is committed; the real next decision is whether to create the implementation worktree.
```

### 4. Short Options

Use only when real branches exist.

Example:

```text
Next decision: push the plan, create the implementation worktree, or stop with alpha.12 designed but not implemented.
```

Do not add fake options. Do not include bare `continue` or `继续`.

### 5. Full Map

Use when the user asks for broader orientation, is visibly lost, or multiple control dimensions matter at once.

Examples:

- progress and next-step confusion;
- work mode and validation budget are both unclear;
- multiple lanes affect whether to continue, wait, review, or merge.

The Full Map remains a high-intervention surface, not the default answer shape.

## Evaluation Order

Alpha.12 should act as a gate before choosing a Navi surface.

Recommended order:

1. Identify the request type.
2. Ask whether any control gain exists.
3. If no control gain exists, answer directly.
4. If control gain exists, choose the lightest sufficient surface.
5. Only then select the relevant existing Navi rule.

Existing rule selection examples:

- overall progress or next-step confusion: Progress Map or Rhythm Map;
- stop/continue boundary: pause semantics;
- lane/worktree coordination: coordination layer;
- lane closed and next decision hidden: lane-closure handoff;
- validation budget or release leakage: Work Mode;
- distance from original vision: Vision Distance;
- risky assumptions or self-certifying momentum: Challenge Moment.

Alpha.12 is not another peer rule competing with alpha.5 through alpha.11. It is a quietness gate in front of them.

## Must-Stay-Quiet Cases

Navi should stay quiet in these cases unless the user also asks for orientation, supervision, risk, or next-step judgment.

### Narrow Status Questions

Examples:

- "Did push succeed?"
- "What branch are we on?"
- "Did the test pass?"
- "What files changed?"

Answer the fact directly.

### Clear Chained Instructions

Examples:

- "Commit and push."
- "Write the plan, check diff, then stop at commit."

Do not insert intermediate maps or menus inside the approved chain.

### Approved Bounded Loops

If the user approved a boundary and acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears.

### Lightweight Design Confirmations

When the user replies "符合", "认可", "1", or similar during a design discussion, continue the current design layer. Do not output a Progress Map or full handoff after every confirmation.

### No Real Branch

If only one next step is clearly correct, do not invent options. Use a direct answer or one-sentence handoff.

### Finished Narrow Task

If the task is genuinely complete and there is no active follow-up, close it simply. Do not force a new phase.

### Information Does Not Change The Decision

If more tests, more status, or more explanation would not change the user's next decision, keep the response short.

## Must-Not-Stay-Quiet Cases

Navi should surface when silence would reduce user control.

Do not stay quiet when:

- the user is visibly lost or asks for overall progress;
- continuing would cross an approval, write, release, risk, or scope boundary;
- multiple lanes or worktrees may conflict;
- Codex is over-validating or waiting incorrectly;
- a response would make a lane look complete while hiding a real next decision;
- a stale project map may mislead fresh sessions;
- implementation success is being treated as product proof;
- release-mode work is starting without explicit approval.

Even then, use the lightest sufficient surface.

## Relationship To Earlier Layers

Alpha.12 reduces rule density across earlier layers:

- Alpha.5 says when to continue or stop.
- Alpha.6 gives Work Mode and Vision Distance when needed.
- Alpha.7 coordinates lanes.
- Alpha.8 improves handoff quality.
- Alpha.10 protects map maintenance from churn.
- Alpha.11 handles lane-closure decision invisibility.
- Alpha.12 decides whether any of those surfaces should appear at all.

Alpha.12 should make Navi feel more intelligent by making it quieter, not by removing necessary supervision.

## Product Boundary

Alpha.12 is not:

- a runtime classifier;
- a state machine;
- telemetry;
- UI;
- a background watcher;
- a task database;
- a scheduler;
- automatic mode switching;
- automatic implementation planning;
- automatic worktree creation;
- automatic commit, push, merge, tag, release, or publication;
- a reason to remove necessary warnings.

Quietness does not mean silence when user control is at risk.

## Implementation Surface

If implemented, the likely surface should stay docs-backed and narrow:

- canonical Along Working Thread skill guidance;
- canonical reference docs;
- project trigger template;
- `navi init` generated trigger text;
- targeted text assertions;
- plugin package copy sync if canonical skill files change.

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

Not default for alpha.12 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Recommended calibration after implementation:

- one narrow-status prompt that should stay quiet;
- one design-confirmation prompt that should continue without a map;
- one lane-closure prompt that should use a one-sentence handoff;
- one real-progress confusion prompt that should still use a full map;
- one negative sample where adding options would create fake branches.

## Success Criteria

Alpha.12 succeeds if:

- Navi does not surface for ordinary narrow status answers;
- design confirmations continue the design instead of triggering maps;
- approved loops no longer get process text at each local sub-step;
- multiple applicable rules compress to the smallest useful surface;
- necessary supervision still appears when there is orientation, decision, boundary, risk, or coordination gain;
- users see fewer fake decisions and fewer process-heavy answers.

## Risks

### Under-Supervision

Quietness could suppress necessary warnings. Mitigation: keep must-not-stay-quiet cases explicit, especially approval boundaries, risk, release leakage, and coordination conflicts.

### Subjective Control Gain

Different agents may disagree on whether control gain exists. Mitigation: use the five control-gain categories as concrete checks and default to the lightest surface, not necessarily full silence.

### Hidden Boundary

A narrow answer may accidentally omit an approval or risk boundary. Mitigation: boundary gain overrides quietness.

### Over-Correction

Navi could become too invisible and lose its product value. Mitigation: Progress/Rhythm Maps still appear for broad orientation, next-step confusion, and user-supervision requests.
