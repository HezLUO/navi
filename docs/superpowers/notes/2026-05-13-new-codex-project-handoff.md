# New Codex Project Handoff

Date: 2026-05-13
Repository: `https://github.com/HezLUO/along`
Local project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Purpose

This note hands Along from the product/design brainstorming session into a fresh Codex project dedicated to implementation.

The current conversation should remain the product/design record. The new Codex project should focus on implementing the approved MVP plan.

## Start The New Codex Project

Create or open a Codex project rooted at:

```text
/Users/james/Codex Project/General Codex Project/Along
```

Then start a new chat with this prompt:

```text
We are implementing Along, a local-first lo-fi coding companion.

Please read these files first:
- docs/superpowers/specs/2026-05-13-along-design.md
- docs/superpowers/plans/2026-05-13-along-mvp.md
- docs/superpowers/notes/2026-05-13-ambient-coding-companion-brainstorm.md
- docs/superpowers/notes/2026-05-13-new-codex-project-handoff.md

Then execute the implementation plan task-by-task.

Use superpowers:subagent-driven-development if the environment supports it. Keep ownership scopes disjoint when using subagents. The main agent remains responsible for integration, verification, commits, and final reporting.

Do not restart brainstorming. The design spec is approved. Implement the MVP plan unless you find a concrete blocker.
```

## Critical Product Constraints

- Along is not a general autonomous coding agent.
- Along is not an AI coworker, employee, productivity dashboard, or therapy companion.
- The MVP must preserve both autonomy and companionship.
- The companion has its own rhythm, state, and growth line.
- The companion can ask the user questions, and the user can ask it questions.
- The companion must not pressure, judge, guilt, or evaluate the user.
- The MVP may read bounded project context, remember, and suggest.
- The MVP must not modify user project code.
- Graph memory is required in the design, not optional.
- Optional lo-fi soundscape is part of the MVP.

## Implementation Source Of Truth

Primary plan:

```text
docs/superpowers/plans/2026-05-13-along-mvp.md
```

Primary design spec:

```text
docs/superpowers/specs/2026-05-13-along-design.md
```

## Recommended Execution

Use the implementation plan exactly:

1. Start with Task 1.
2. Follow the test-first steps.
3. Commit after each task, as the plan specifies.
4. Push periodically to `origin/main`.
5. Run full verification at the end.

Recommended mode:

```text
Subagent-Driven
```

Use subagents for independent implementation tasks only when they have clear ownership and non-overlapping files. Keep final integration, verification, and git operations in the main session.

## Environment Notes

- Node and npm are available in the current environment:
  - Node: `v22.22.2`
  - npm: `10.9.7`
- The repository is initialized and pushed to GitHub.
- The current remote uses HTTPS:

```text
origin https://github.com/HezLUO/along.git
```

- GitHub CLI has been authenticated as `HezLUO` in this environment.

## Current Git State At Handoff

Expected latest commits:

```text
bb31984 docs: add along mvp implementation plan
516f837 docs: add along design spec
```

The new implementation session should run:

```bash
git status --short --branch
git pull --ff-only
```

Expected: clean `main` tracking `origin/main`.

## What This Current Session Should Not Do

- Do not start implementation here.
- Do not create application scaffolding here.
- Do not split or revise the approved spec unless the user explicitly asks.
- Do not keep important implementation decisions only in chat.

If additional product decisions happen in this current session, update the brainstorm record and this handoff note, then commit and push.
