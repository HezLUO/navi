# Along Working Threads

This directory stores docs-backed Working Thread continuity for Along.

Working Threads are cross-session judgment containers. They preserve important unfinished judgment, accepted boundaries, drift triggers, and next moves so Codex can resume the work without relying only on chat context or model memory.

Do not store chat transcripts here.
Do not store task-management logs here.
Do not create or update a durable record without user confirmation.

## Record Template

Use this shape for V1 records:

```md
# Working Thread Title

Status: active | quiet | closed
Last updated: YYYY-MM-DD

## Why This Matters

Briefly state why this unfinished question, direction, doubt, or creative line affects future decisions.

## Current Judgment

State the best current shared judgment.

## Boundary

State what this thread is and is not allowed to pull into the current phase.

## Drift Triggers

- List signals that should cause Codex to consider a drift challenge.

## Next Likely Move

State the next useful direction if the thread resumes.

## Last Wrap-Up

Record the most recent compact continuity update.

## Open Questions

- List unresolved questions that should carry forward.
```

## Write Rules

- Keep records short and judgment-oriented.
- Update only fields that changed.
- Use `Decision notes`, `Rejected options`, and `Reason for change` only for major direction changes.
- Confirm with the user before creating or durably updating a record.
- Do not use `.along/` for V1 Working Thread continuity.
