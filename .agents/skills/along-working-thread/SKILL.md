---
name: along-working-thread
description: Use in the Along project when Codex should preserve judgment-oriented Working Thread continuity across active sessions: resume relevant threads, suggest thread creation, challenge high-impact drift, or draft wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation work that does not involve Working Thread continuity.
---

# Along Working Thread

Use this skill to make Codex behave in an Along-like way inside active Along project sessions.

This skill validates turn-bound self-initiation. It does not provide background runtime, notifications, local/desktop presence, Core/MCP implementation, plugin packaging, Hermes integration, delegation, write delegation, relationship modes, or emotional simulation.

## Required Reference

Before acting on a Working Thread, read:

`references/working-thread-v1.md`

## Hard Boundaries

- This skill may be considered by default in the Along project when the user request matches Working Thread behavior.
- Codex must not silently create durable Working Thread docs.
- Codex must not silently write persistent continuity records.
- Codex must not treat a high-impact drift challenge as a hard block.
- First Working Thread creation requires user confirmation.
- Durable write-back requires user confirmation.
- Major direction changes require user confirmation.
- Do not implement Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, background runtime, or delegation as part of this skill.

## Workflow

1. Check whether the user's request concerns an existing or possible Working Thread.
2. If a relevant Working Thread exists, read the record from `docs/along/working-threads/`.
3. At session start or resume, provide a short briefing with current judgment, active boundary, and next likely move.
4. If the user request may create a new durable Working Thread, suggest creation and ask for confirmation before writing.
5. If the user request may drift from the active Working Thread, classify drift against the record as `none`, `low`, `medium`, or `high`.
6. For `high` drift, issue a non-blocking confirmation challenge.
7. At meaningful phase boundaries, suggest wrap-up when judgment continuity changed.
8. Draft the wrap-up first. Write to docs only after user confirmation.

## Output Style

- Keep resume briefings short.
- Explain challenges by pointing to the stored Working Thread boundary.
- Ask for confirmation instead of refusing user direction.
- Do not present Working Threads like an inbox.
- Do not produce a report unless the user asks for one.
