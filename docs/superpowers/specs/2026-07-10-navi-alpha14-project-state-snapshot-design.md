# Navi Alpha 14 Project State Snapshot Design

## Status

This design was discussed and approved in conversation on 2026-07-10 while alpha.13 implementation remediation continued in a separate worktree.

This is a design artifact only. It does not approve implementation, worktree execution, commits, pushes, release preparation, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

Alpha.14 belongs primarily to the **Project Integration** product layer. It introduces the first project-local state snapshot for independent Navi. It should not become another broad User Supervision rule layer or a hidden runtime database.

## Product Context

Navi should stand independently as a product. Along may integrate Navi later, but Navi must not depend on Along for its identity, project state, installation model, or core behavior.

The current alpha surface is still:

```text
skill/plugin behavior
+ project-local guidance
+ project maps
+ navi init
```

Alpha.13 improves how Navi initializes and reads a target project. The next gap is continuity: a Project Map explains the route, but it does not reliably say what the project is trying to achieve now, which work currently matters, what is happening in parallel, or which decision should come next in a fresh session.

Alpha.14 adds a compact, human-readable project state snapshot without introducing runtime storage.

## Problem Definition

Project evidence is usually distributed across README files, specs, plans, commits, task records, handoffs, and conversation context. A fresh session can inspect those sources, but it may still reconstruct the current situation incorrectly or spend too much time rediscovering it.

Three existing artifacts solve different problems:

- a Project Map describes the stable route or rhythm of the project;
- a handoff transfers detailed context between sessions or owners;
- ordinary project documents contain evidence and history.

None of them is a deliberately compact answer to:

```text
What is this project trying to achieve?
What stage is it in?
What is the main focus now?
What relevant work is running in parallel?
What is the next real decision?
When should the agent continue, and when should it stop?
```

Without this snapshot, Navi can have a map but still lose the user's current navigation state.

## Product Goal

Alpha.14 should give initialized projects one compact project-local state snapshot that fresh Navi sessions can read first, challenge against newer evidence, and propose updating only when future navigation would materially change.

The goal is:

```text
Create a small, readable navigation snapshot for the current project.
Treat it as a useful declared state, not unquestionable truth.
Keep durable updates user-approved.
```

## Core Product Model

Alpha.14 distinguishes three artifacts.

| Artifact | Primary question | Expected stability | Detail level |
| --- | --- | --- | --- |
| Project Map | What route or rhythm does this project follow? | Relatively stable | Structural |
| Project State | Where are we now, and what decision matters next? | Changes at meaningful boundaries | Compact |
| Handoff | What context does another session or owner need to continue safely? | Written for a transfer event | Detailed |

Project State must not replace the Project Map or handoff.

```text
Project Map   = route and structure
Project State = current navigation snapshot
Handoff       = session-transfer package
```

## State Location And Format

The first version uses:

```text
.navi/state.md
```

The file is Markdown, not JSON.

Markdown is preferred because the state must remain:

- readable and editable by the user;
- inspectable by an agent without a runtime;
- suitable for ordinary source control when the user chooses to track it;
- compatible with Navi's current docs-backed alpha surface;
- independent of Along-specific storage paths.

The file must not contain secrets, hidden model memory, private conversation history, or source-thread data that does not already belong in the target project.

## State Structure

The initial structure is:

```md
# Navi Project State

## Project Goal
Unclear - needs calibration.

## Current Stage
Unclear - needs calibration.

## Current Focus
Unclear - review project evidence and choose the current focus.

## Parallel Work
None.

## Next Decision
Confirm the project goal, current stage, current focus, and next real decision.

## Stop / Continue Policy
Continue through reversible inspection and drafting. Stop before irreversible writes, broad scope changes, release decisions, or when the next decision is unclear.

## Evidence
- Created by `navi init --write`.
- Review README, project docs, specs, plans, recent commits, and user instructions before treating this state as current.

## Last Updated
Created by `navi init --write`; not yet calibrated.
```

### Project Goal

Names the outcome the project is currently trying to achieve. It should describe the target, not the latest task.

### Current Stage

Names the target project's current product or delivery stage. It is not Navi's Work Mode and should not silently substitute Navi's own alpha stages for the target project's stages.

### Current Focus

Names the single main focus that should guide the current main session. This replaces internal lane terminology in the user-facing state file.

### Parallel Work

Lists only concurrent work that may affect a later decision, such as an implementation worktree, external review, calibration session, CI result, or stakeholder response.

Do not use this section as a general task list. If a parallel item has its own future decision or return condition, record it with that item instead of creating a second project-wide `Next Decision`.

### Next Decision

Contains one primary next decision for the project. It should name something the user can actually judge, not `continue`, `keep working`, or a local mechanical step.

### Stop / Continue Policy

States the current bounded continuation rule: what can proceed without another interruption and which boundary requires user control.

### Evidence

Names the project-local sources that support or should challenge the snapshot. It is a source guide, not a transcript or test log.

### Last Updated

Explains when and why the navigation snapshot last changed. It should make an uncalibrated starter state visibly different from a user-confirmed state.

## Compactness Rule

`state.md` should stay compact and quickly readable, but alpha.14 does not impose a literal one-screen or line-count limit.

The governing rule is:

```text
Only information that directly changes current navigation belongs in state.md.
```

Detailed background, test output, risk analysis, long task lists, rejected alternatives, implementation history, and transfer instructions belong in README files, specs, plans, issue trackers, or handoffs.

Compactness matters because a long state file recreates the reconstruction problem alpha.14 is meant to solve. Readability matters more than an arbitrary visual limit.

## `navi init` Behavior

`navi init --write` should create `.navi/state.md` by default as part of project initialization.

The first write uses the conservative starter state shown above.

It must not:

- infer a complete project state from shallow evidence;
- convert the alpha.13 suggested map into a confirmed state;
- overwrite an existing `.navi/state.md`;
- silently calibrate unclear fields;
- mark the starter state as user-confirmed;
- write anything in default dry-run mode.

The starter state is intentionally useful but incomplete. Its job is to establish the state contract and make missing calibration visible.

Alpha.13 semantics remain separate:

```text
--write       = durable standard project initialization, including starter state
--suggest-map = terminal-only project-shape preview
```

`--suggest-map` must not populate or rewrite `.navi/state.md` automatically.

## Reading Strategy

Navi should read `.navi/state.md` early when orienting in an initialized project, then compare it with relevant project evidence.

Reading state first does not make state authoritative forever.

```text
Read the declared snapshot first.
Check whether current user instructions or newer project evidence challenge it.
Use the conflict to reduce confidence or suggest calibration.
Do not silently rewrite the file.
```

Current user instructions take precedence over stored state. Newer approved specs, plans, handoffs, project records, or clearly relevant repository changes may show that the state is stale. Ordinary low-level activity should not automatically displace a still-valid state.

## Stale-State Suspicion

Alpha.14 uses trigger-based suspicion, not an algorithmic freshness score.

Treat `.navi/state.md` as possibly stale when one or more of these conditions appears:

- the user changes the goal, priority, or current focus;
- a recent lane closure means the recorded focus or next decision has ended;
- the user's prompt conflicts with the recorded `Next Decision`;
- a newer approved spec, plan, handoff, or project record materially changes navigation;
- clearly relevant recent repository evidence shows the recorded lane is complete or superseded;
- the file still contains starter or unclear values;
- the state and Project Map disagree about the current route or stage.

Stale suspicion should change Navi's confidence and may justify an update proposal. It must not trigger automatic writes.

Alpha.14 does not add:

- modification-time scoring;
- automatic Git history parsing on every prompt;
- background file watching;
- confidence percentages;
- a freshness daemon;
- automatic state repair.

## Update Policy

`.navi/state.md` is manually or semi-manually maintained. Navi may notice that navigation changed and propose a patch, but the file is not an automatically synchronized status feed.

Navi should suggest updating `.navi/state.md` only when the change would improve future fresh-session navigation.

Good update moments include:

- the project goal changes;
- the current stage changes;
- the main focus changes materially;
- a relevant parallel lane starts, finishes, blocks, or changes the next decision;
- the primary next decision changes;
- the stop/continue boundary changes;
- a lane or phase closes and the old state would mislead a fresh session;
- the starter state is calibrated for the first time.

Do not suggest an update for:

- ordinary file edits;
- targeted test results that do not change navigation;
- routine commits or pushes;
- temporary debugging progress;
- small implementation details;
- a user saying `continue` inside an already-bounded loop;
- information that belongs only in a handoff or task log.

Durable updates require explicit user approval. After approval, Navi should make the smallest sufficient patch and preserve unrelated user-authored content.

## Quietness And Output Behavior

Project State is primarily a reading and continuity input. It is not a mandatory response template.

Navi should not print every state section on every turn. Alpha.12 quietness still applies:

```text
No control gain, no Navi surface.
```

State should become visible only when it materially improves orientation, exposes a conflict, clarifies a stop/continue boundary, identifies a real next decision, or supports a user-approved update.

## Multi-Lane Behavior

Alpha.14 does not turn Navi into a scheduler.

For concurrent work:

- `Current Focus` names the main-session focus;
- `Parallel Work` records only relevant concurrent lanes;
- `Next Decision` remains the single primary project decision;
- a parallel lane's future return condition stays inside its `Parallel Work` entry;
- a completed worktree creates a review option but does not automatically replace the main focus.

This keeps the state understandable without flattening every task into one queue.

## Navi And Along Boundary

The `.navi/state.md` path is owned by Navi's independent product model.

Along may later consume, display, or enrich Navi project state, but alpha.14 must not require:

- an Along runtime;
- `.along/` storage;
- Along Shared Desk;
- Along relationship modes;
- Along memory or delegation systems.

This preserves the possibility that Navi remains a standalone product or becomes one component inside Along later.

## Expected Implementation Surface

A later implementation plan may touch only the smallest relevant surfaces:

- `src/cli/navi-init.ts` for starter-state planning and safe writes;
- targeted CLI tests for dry-run, creation, preservation, and option separation;
- the canonical Navi skill/reference for state reading, stale suspicion, and update approval rules;
- exact packaged skill copies when canonical files change;
- project-initialization documentation and targeted documentation tests.

Implementation should use targeted validation. Alpha.14 design does not authorize full tests, release preparation, tags, pushes, publication, or external target-project writes.

## Acceptance Criteria

Alpha.14 implementation will be acceptable when:

1. default `navi init` dry-run previews `.navi/state.md` without writing it;
2. `navi init --write` creates the conservative starter state when absent;
3. an existing `.navi/state.md` is preserved;
4. `--suggest-map` remains terminal-only and does not populate state;
5. fresh-session guidance reads state early but challenges it when newer evidence conflicts;
6. starter or conflicting state is clearly treated as uncalibrated or possibly stale;
7. Navi suggests state updates only at meaningful navigation boundaries;
8. every durable state update requires explicit user approval;
9. state remains distinct from Project Map, handoff, task log, and runtime memory;
10. canonical and packaged skill copies remain synchronized when changed.

## Risks And Mitigations

### Stale State Becomes False Authority

Risk: a compact file may look more authoritative than the evidence supporting it.

Mitigation: state-first reading is paired with evidence challenge, visible starter status, trigger-based stale suspicion, and user-approved updates.

### State Duplicates Other Documents

Risk: the snapshot becomes another long project report.

Mitigation: keep only navigation-changing information in state; route detail to the Project Map and transfer detail to handoffs.

### Rule Density Increases Again

Risk: alpha.14 adds more prompt-backed behavior after alpha.12 capped supervision noise.

Mitigation: treat state as a compact input, preserve quietness, and avoid mandatory state-shaped responses.

### Parallel Work Turns Into Project Management

Risk: `Parallel Work` becomes a task database or scheduler.

Mitigation: include only lanes that affect later decisions and keep one primary `Next Decision`.

### Sensitive Information Enters Source Control

Risk: users may place private context in a project-local state file.

Mitigation: generated content contains no secrets or conversation history; documentation should tell users to keep sensitive information out and choose whether the file belongs in source control.

## Non-Goals

Alpha.14 is not:

- a runtime state database;
- JSON schema infrastructure;
- automatic project-state inference;
- automatic Git or filesystem monitoring;
- a background watcher;
- a project-management system;
- a task queue;
- a worktree scheduler;
- a replacement for Project Maps or handoffs;
- automatic state write-back;
- Memory v2;
- an agent adapter;
- delegation or write delegation;
- a local or desktop Navi UI;
- an Along Shared Desk rebrand;
- a release decision.

`src/web` remains historical Along Shared Desk / future capability evidence and is outside this design.

## Deferred Directions

The following questions are intentionally deferred until the Markdown snapshot proves useful in real projects:

- whether Navi needs a dedicated `navi state` command;
- whether structured metadata should accompany Markdown later;
- whether a runtime should watch or reconcile state;
- whether Along should display or enrich Navi state;
- whether state should support cross-project aggregation;
- whether agents should propose state patches through a formal adapter.

These are later product decisions, not alpha.14 implementation requirements.
