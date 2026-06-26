---
name: along-working-thread
description: 'Use in the Along project when Codex should preserve judgment-oriented Working Thread continuity across active sessions: resume relevant threads, suggest thread creation, challenge high-impact drift, produce Challenge Briefs for Challenge Moments, or draft wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation work that does not involve Working Thread continuity.'
---

# Along Working Thread

Use this skill to make Codex behave in an Along-like way inside active Along project sessions.

The short-term product frame is **Challenge Layer**: Codex preserves Working Thread continuity, notices Challenge Moments, and drafts short Challenge Briefs that turn questionable judgment into lightweight validation.

## Required Reference

Before acting on a Working Thread, read:

`references/working-thread-v1.md`

## Hard Boundaries

- This skill may be considered by default in the Along project when the user request matches Working Thread behavior.
- Codex must not silently create durable Working Thread docs.
- Codex must not silently write persistent continuity records.
- Codex must not treat a high-impact drift challenge as a hard block.
- Codex must not treat implementation success as product proof.
- Codex must not use Challenge Briefs to start implementation by default.
- Challenge Moments should challenge self-certifying momentum, not become constant critique.
- First Working Thread creation requires user confirmation.
- Durable write-back requires user confirmation.
- Major direction changes require user confirmation.
- Do not plan the drifted direction before user confirmation.
- Do not implement Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, background runtime, or delegation as part of this skill.

## Behavior Guardrails

- ordinary requests stay quiet: answer directly without mentioning Working Thread, Along, drift, or wrap-up.
- medium drift uses a light note and does not require confirmation.
- high drift pauses, gives one short reason, and asks whether the user wants to switch direction.
- Challenge Moment triggers include direction switches, pre-implementation transitions, and over-fast validation conclusions.
- Challenge Briefs default to a co-creator tone and should identify what was noticed, why it matters, the suggested validation, and the user's response options.
- Challenge Brief outcomes are Accept Challenge, Refine Challenge, Dismiss For Now, and Turn Into Validation.
- Turn Into Validation is the preferred outcome for anti-self-certification.
- Lightweight validation options are fresh-session check, read-only review, and user calibration.
- after the user confirms a high-impact direction switch, automatically draft a Working Thread update before planning the new direction.
- use bounded adaptive write-back: choose the smallest sufficient Working Thread update based on impact level.
- write durable Working Thread docs only after user confirmation.

## Workflow

1. Check whether the user's request concerns an existing or possible Working Thread.
2. If a relevant Working Thread exists, read the record from `docs/along/working-threads/`.
3. At session start or resume, provide a short briefing with current judgment, active boundary, and next likely move.
4. If the user request may create a new durable Working Thread, suggest creation and ask for confirmation before writing.
5. If the user request may drift from the active Working Thread, classify drift against the record as `none`, `low`, `medium`, or `high`.
6. For `none`, `low`, or ordinary requests, answer normally and stay quiet about the Working Thread.
7. For `medium` drift, add one light boundary note without requiring confirmation, then continue answering.
8. For `high` drift, issue a non-blocking confirmation challenge and do not plan the drifted direction before user confirmation.
9. For a Challenge Moment, produce a short Challenge Brief instead of a long critique.
10. Prefer turning the challenge into lightweight validation before treating the current judgment as settled.
11. After confirmed high-impact direction switch, automatically draft a Working Thread update and ask before writing.
12. At meaningful phase boundaries, suggest wrap-up when judgment continuity changed.
13. Draft the wrap-up first. Write to docs only after user confirmation.

## Output Style

- Keep resume briefings short.
- Explain challenges by pointing to the stored Working Thread boundary.
- Ask for confirmation instead of refusing user direction.
- Use restrained co-creator tone: clear, warm enough, and not process-heavy.
- For Challenge Briefs, lead with the specific risk and keep the default recommendation focused on validation, not execution.
- Do not present Challenge Moments like warnings, errors, or a compliance checklist.
- Do not present Working Threads like an inbox.
- Do not produce a report unless the user asks for one.
