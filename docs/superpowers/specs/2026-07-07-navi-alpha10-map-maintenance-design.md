# Navi Alpha 10 Project-Local Map Maintenance Design

## Status

This design was approved in conversation on 2026-07-07. It defines the proposed alpha.10 direction after alpha.9 maintainer calibration evidence.

This is a design artifact only. It does not approve implementation, worktree execution, `navi init` changes, target-project writes, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi's current product wedge is project-local supervision for non-expert users working with expert agents. The narrow `navi init` path can already prepare a target project with:

- an `AGENTS.md` trigger source;
- a Project Map or Rhythm Map starter under `docs/along/project-maps/`;
- fresh-session validation guidance.

This makes Navi discoverable in a target project, but it leaves a product gap: after the project changes, users and fresh sessions need to know whether the saved map is still a reliable navigation baseline.

Without maintenance guidance, the map can drift in two bad directions:

- it becomes stale and misleads future sessions;
- it becomes a task log that changes after every local action.

Alpha.10 should define the middle path: Project/Rhythm Maps are durable navigation baselines, not logs, and should be updated only when navigation judgment changes.

## Product Goal

Alpha.10 should add project-local Map Maintenance guidance for projects initialized with Navi.

The goal is:

```text
Help users and Codex know when to suggest, approve, or avoid Project/Rhythm Map updates, without turning Navi into a map-management system.
```

This should improve project integration while keeping the current alpha surface docs-backed and user-controlled.

## Core Principle

The core principle is:

```text
Map is not a log; it is a navigation baseline.
```

A Project/Rhythm Map should not change after every task, test, commit, or push. It should change when the saved navigation baseline would otherwise mislead future orientation.

## Update Triggers

Navi should suggest a map update when navigation judgment changes.

Appropriate triggers:

- current stage or current focus changes;
- next main track changes;
- the project changes from a one-way Project Map to a flowing Rhythm Map, or the reverse;
- a new source-of-truth file appears;
- the saved map no longer explains the current project state;
- the saved map misleads a fresh session;
- a major decision changes the project direction;
- the user explicitly asks to update the map.

These are suggestion triggers, not write authorization.

## Non-Update Cases

Navi should not suggest or perform a map update for ordinary local progress.

Non-update cases:

- ordinary file edits;
- a single test passing;
- a commit or push completing;
- temporary status notes;
- a local subtask finishing;
- a user merely asking what comes next;
- changes that affect only a bounded subtask and not overall navigation;
- any update that lacks user approval.

If the map remains directionally correct, keep it stable.

## Write Boundary

Map updates are durable project writes.

Rules:

- Codex/Navi may diagnose that a map seems stale.
- Codex/Navi may propose a small patch.
- User approval is required before writing a map update.
- The patch should be small and focused on navigation.
- The update should preserve the target project's existing language unless the user asks to translate.
- If the user does not approve, Codex/Navi may answer using current evidence and note that the saved map may need later update.

Navi should not silently rewrite a map because a task completed.

## Placement

Alpha.10 should keep trigger text short and put detailed maintenance rules near the map itself.

### AGENTS.md Trigger

The project-local `AGENTS.md` trigger should only add a short rule:

```text
If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.
```

This keeps `AGENTS.md` from becoming a long product manual.

### Project Map File

The generated Project/Rhythm Map starter should include a section like:

```markdown
## Map Maintenance

This map is a navigation baseline, not a task log.

Update it when navigation judgment changes, such as when the current stage, focus, main track, map type, source-of-truth files, or project direction changes.

Do not update it for ordinary file edits, tests, commits, pushes, temporary status notes, or bounded subtasks that do not change overall navigation.

Map updates are durable project writes. Codex/Navi may suggest a small patch, but user approval is required before writing.
```

Fresh sessions that read the map should also read this rule.

## Decision Authority

Codex/Navi diagnoses; the user approves durable writes.

Suggested behavior:

1. Diagnose why the map may be stale or misleading.
2. Name the proposed small update.
3. Ask for approval before writing.
4. If approval is not given, answer from current evidence and explicitly mark the map uncertainty when relevant.

Example:

```text
The saved map still says release-readiness review is the focus, but the current source records show the release was published and the open question is post-release calibration. I recommend updating current_focus to "post-release calibration". I will not write that unless you approve.
```

## Relationship To Earlier Layers

Alpha.10 builds on earlier layers without replacing them:

- Alpha.5 defines when to continue or stop.
- Alpha.6 defines Work Mode and validation budget.
- Alpha.7 defines lane coordination.
- Alpha.8 defines handoff quality.
- Alpha.9 records maintainer-side calibration evidence.

Alpha.10 adds project-local map maintenance guidance. It should not change alpha.9 evidence logging, release behavior, or runtime capabilities.

## Implementation Surface

If implemented, the likely surface should remain narrow:

- `docs/along/project-maps/navi-project-trigger-template.md`;
- `src/cli/navi-init.ts`;
- project map starter generation;
- targeted `navi init` tests.

Implementation may also add or adjust documentation near the project-map initialization guide if needed.

Implementation should not touch runtime UI, `src/web`, release docs, README, external target projects, package publication, release automation, Memory v2, agent adapters, delegation, or write delegation.

## Testing And Calibration

Recommended implementation validation, if implementation is later approved:

- targeted `navi init` generated-file tests;
- targeted project-map template text tests if existing patterns support them;
- `git diff --check`.

Not default for alpha.10 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Recommended calibration after implementation:

- one initialized temporary target project to inspect generated map maintenance text;
- one real target-project read-only check to see whether the rule helps identify stale maps without writing;
- one negative sample where ordinary task completion should not suggest a map update.

Calibration should stay lightweight.

## Non-Goals

Alpha.10 does not include:

- a `navi map update` command;
- automatic project scanning;
- automatic map rewrite;
- automatic stage inference from git history;
- automatic map updates after commits or pushes;
- turning maps into TODO logs;
- complex schema requirements for every target project;
- a universal stage model for all projects;
- modifying existing external target projects;
- turning fresh-session validation into a release checklist;
- runtime UI;
- local app behavior;
- background watcher behavior;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- changing alpha.9 maintainer evidence logging.

## Success Criteria

Alpha.10 succeeds if:

- a new Navi-initialized project carries lightweight map maintenance guidance;
- fresh sessions can tell when to suggest a map update;
- ordinary local progress does not trigger map updates;
- map updates remain user-approved durable writes;
- the detailed rule lives near the map, not as heavy trigger text;
- the feature improves project integration without becoming a map-management system.

## Risks

### Map Churn

If the map updates too often, it becomes a log. Mitigation: update only when navigation judgment changes.

### Stale Map Trust

If the map is treated as authoritative even when contradicted by current source records, it can mislead future sessions. Mitigation: allow stale-map diagnosis and current-evidence answers without silent writes.

### User Burden

If map maintenance feels like manual project management, alpha.10 fails. Mitigation: keep guidance short and write approval explicit.

### Scope Creep

Map maintenance could expand into commands, automation, UI, or runtime. Mitigation: keep alpha.10 docs-backed and project-local.

## Open Product Judgment

Alpha.10 should prove that project-local maintenance guidance is enough before designing a command-level map update workflow. A future `navi map update` or runtime-assisted map maintenance flow should require separate design and evidence.
