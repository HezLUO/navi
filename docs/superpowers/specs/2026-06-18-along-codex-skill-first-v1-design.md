# Along Codex Skill-First V1 Design

Date: 2026-06-18
Status: Draft for user review

## Summary

Along V1 should not attempt to become a new coding agent, a full conductor platform, or a background runtime. The first milestone is to validate whether an existing agent, starting with Codex, can feel more Along-like inside an active work session.

This V1 is a **Codex-first, skill-first, docs-backed** experience validation pass. It tests turn-bound self-initiation: when Codex is already active, it can proactively restore a Working Thread, protect accepted direction with drift challenges, and preserve continuity through wrap-up.

The first version intentionally does not build Along Core, an MCP server, plugin packaging, Hermes integration, local/desktop presence, or background self-initiation.

## Product Hypothesis

If Codex can carry project-owned Working Threads across sessions, it may begin to feel less like a stateless execution tool and more like a companion that remembers what matters, notices meaningful drift, and helps preserve judgment over time.

The test is not whether Codex can execute more work. The test is whether Codex can support:

- self-initiation inside active sessions;
- companionship through continuity;
- judgment preservation across design and calibration work;
- restrained intervention when the user appears to drift from accepted direction.

## Scope

### In Scope

- A Codex skill workflow for Along-like behavior.
- Project documentation as the V1 continuity store.
- Working Thread records as judgment-oriented documents.
- Session start / resume briefing.
- Impact-based drift challenge.
- Layered wrap-up write-back.
- User confirmation before first Working Thread creation or durable write-back.
- Future Core/MCP interface sketching at the conceptual level only.

### Out of Scope

- New standalone Along agent.
- Background runtime, watcher, scheduler, or notifications.
- Local/desktop presence surface.
- Full Along Core implementation.
- MCP server implementation.
- Plugin packaging.
- Hermes adapter.
- Delegation candidate or conductor workflow.
- Write delegation.
- Relationship modes or emotional simulation implementation.

## Key Terms

### Turn-Bound Self-Initiation

Turn-bound self-initiation means Codex does not wait for an explicit user question before applying Along's judgment, but the initiative still occurs inside an active user-agent session.

Examples:

- Codex opens a session and proactively restores a relevant Working Thread.
- Codex notices a high-impact direction shift and asks for confirmation.
- Codex suggests wrap-up after a meaningful phase boundary.

This is not background self-initiation. If Codex is closed or inactive, V1 does not observe, wake, notify, or intervene.

### Working Thread

A Working Thread is a cross-session judgment container for an unfinished question, direction, doubt, or creative line that will keep affecting future decisions.

It preserves:

- why the topic matters;
- the current shared judgment;
- accepted boundaries;
- signals of meaningful drift;
- the likely next move;
- the last wrap-up;
- unresolved questions that should carry forward.

A Working Thread is not:

- a chat transcript;
- a todo list;
- an issue ticket;
- an implementation spec;
- generic memory.

The core distinction is:

```text
Chat = where conversation happens.
Working Thread = what important unfinished judgment the conversation carries forward.
```

## Architecture

V1 uses three lightweight layers.

```text
Codex skill workflow
  reads and follows Along-like interaction rules

Project docs
  store reviewable Working Thread continuity

Future Core/MCP sketch
  names future operations without implementing them
```

The design should read as "an existing agent calls or follows Along Core semantics" rather than "Codex has a hard-coded Along mode." Even though V1 is Codex-first, names and concepts should stay generic enough for future Hermes, MCP, plugin, or runtime integrations.

## Working Thread Storage

V1 uses project documentation as the continuity store.

Stable Working Thread state, accepted judgments, important wrap-ups, and unresolved questions should live in reviewable docs. V1 must not rely only on Codex memory or the current chat context.

Default docs layout:

```text
docs/along/working-threads/
  README.md
  YYYY-MM-DD-thread-slug.md
```

The existing `docs/superpowers/notes/` records can continue to preserve design-session continuity, but V1 Working Thread records should use a product-owned path so they are not confused with Superpowers process notes.

Future versions may use a two-layer model:

- project docs for stable, user-reviewable decisions;
- `.along/` ignored local state for temporary, private, unconfirmed, or high-churn thread state.

## Working Thread Record

V1 should use a judgment-oriented record:

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

The record should stay short. It should preserve continuity and drift criteria without becoming a dashboard, meeting log, or full report.

Future expanded records may add context, timeline, evidence, decisions, or detailed history for review, auditability, debugging, longer-running research, or multi-agent handoff.

## Working Thread Creation

V1 uses a dual-entry model.

The user may explicitly ask to start, record, or continue a Working Thread.

Codex may also suggest creating a Working Thread when a strong signal appears:

- the user explicitly indicates long-term continuity;
- the discussion is judgment-heavy;
- the same theme recurs across sessions or a long session;
- the topic will materially affect future multi-turn decisions.

Codex must not silently create the first durable Working Thread record. First creation requires user confirmation.

Suggested wording:

```text
I think this is becoming a Working Thread rather than a one-off question.
Do you want me to record it so future sessions can carry it forward?
```

## Behavior 1: Start / Resume Briefing

When Codex finds a relevant Working Thread at session start or resume, it should give a short briefing.

The briefing should:

- name the relevant Working Thread;
- restate the current shared judgment;
- restate the active boundary when relevant;
- suggest the next likely move;
- avoid full history unless the user asks.

Preferred feel:

```text
I brought this thread back:
we last confirmed V1 is Codex-first, skill-first, and docs-backed.
Current judgment: validate start/resume, drift challenge, and wrap-up before building Core/MCP.
I suggest we define the drift challenge behavior next, without entering implementation yet.
```

Avoid:

- vague one-line restoration;
- full timeline dumps;
- asking whether to restore the thread every time;
- presenting multiple threads like an inbox.

## Behavior 2: Impact-Based Drift Challenge

Codex should not challenge every direction change. It should challenge only when the user's new direction appears likely to affect:

- the current Working Thread goal;
- an accepted boundary;
- a previously accepted product judgment;
- the project or product core intention;
- the current phase, such as moving from design into implementation before approval;
- a deferred direction that was intentionally parked.

V1 may use the LLM to judge semantic drift, but not as an unconstrained guess. The LLM should compare the user's request against the Working Thread record, especially:

- `Current judgment`
- `Boundary`
- `Drift triggers`
- `Next likely move`
- `Open questions`

The skill should classify drift as:

```text
none
low
medium
high
```

Default behavior:

- `none` or `low`: stay silent.
- `medium`: optionally add a soft note, but do not block.
- `high`: issue a confirmation challenge.

Preferred challenge shape:

```text
I notice this may shift the Working Thread.
Current boundary: V1 is skill-first and docs-backed; Core/MCP implementation is deferred.
Your new request moves toward implementing Core/MCP now.
Do you want to intentionally switch direction, or continue with the current V1 behavior design?
```

The challenge asks for confirmation. It should not refuse, nag, or override the user.

## Behavior 3: Layered Wrap-Up

Wrap-up is a phase-end continuity update. It is not a chat summary, log, or meeting transcript.

Default wrap-up writes only fields needed to preserve judgment continuity:

```text
Last wrap-up
Current judgment
Boundary changes
Open questions
Next likely move
```

When a session contains a major direction change, rejected path, or decision future sessions may need to understand, append lightweight decision context:

```text
Decision notes
Rejected options
Reason for change
```

Avoid:

- full chat summaries;
- minute-by-minute timelines;
- task-management logs;
- updating every field when only one judgment changed;
- treating wrap-up as a report.

## Wrap-Up Trigger Strategy

Use layered trigger plus confirmation before durable write.

Trigger behavior:

- Small or routine changes should not trigger proactive wrap-up.
- The user can explicitly request wrap-up at any time.
- At a meaningful phase boundary, Codex may proactively suggest wrap-up.
- At a major judgment or boundary change, Codex should proactively suggest wrap-up.
- If the user clearly ends the session or asks to pause after meaningful progress, Codex may prepare a wrap-up draft.
- Durable Working Thread docs should be updated only after user confirmation.

Meaningful phase boundaries include:

- a design choice is accepted;
- a subjective calibration round ends;
- the user says "approved", "recognized", "continue next time", or "stop here";
- the conversation is about to switch to a different Working Thread;
- the current turn changes `Current judgment`, `Boundary`, `Open questions`, or `Next likely move`.

## Skill Invocation

V1 uses project-level default consideration plus confirmation for first or persistent actions.

In the Along project, Codex may consider the Along-like skill by default when the request matches Working Thread behavior.

The skill must not silently:

- create durable Working Thread docs;
- write persistent continuity records;
- turn high-impact drift challenges into hard blocks.

First Working Thread creation, durable write-back, and major direction changes require user confirmation.

## Future Core / MCP Sketch

V1 should name future operations without implementing them.

Likely future operations:

```text
list_working_threads(project)
read_working_thread(id)
suggest_working_thread(candidate)
create_working_thread(record)
classify_drift(thread, request)
draft_wrap_up(thread, session_delta)
commit_wrap_up(thread, approved_update)
```

These operations belong to a future Along Core or MCP layer. They should not block V1 skill validation.

## Success Criteria

V1 is successful if, during real Codex use:

- start/resume briefing feels useful rather than report-like;
- Codex can carry an accepted judgment across sessions through docs;
- drift challenge catches meaningful direction shifts without feeling supervisory;
- wrap-up creates useful continuity without becoming a log;
- the user feels Codex is more companion-like and self-initiated inside active work;
- the user does not feel the skill is a dashboard, reminder system, or generic task manager.

## Risks

- Skill-first may be mistaken for full self-initiation. The spec must state clearly that it validates only turn-bound self-initiation.
- Docs-backed state may become too heavy if Working Thread records grow into reports.
- Implicit skill consideration may trigger too often unless the description and thresholds are conservative.
- Drift challenge may feel annoying if `medium` cases are treated like `high`.
- Wrap-up may feel procedural if Codex suggests it after minor changes.
- Future Core/MCP work may be pulled forward before the behavior has been validated.

## Validation Plan

Validation is subjective and workflow-based, not only automated.

Test scenarios:

- Open a Codex session in the Along project with an existing Working Thread and check whether the resume briefing is short and useful.
- Ask for a direction that violates the Working Thread boundary and confirm Codex issues a clear, non-blocking drift challenge.
- Make a small direction change and confirm Codex does not overreact.
- End a meaningful design phase and confirm Codex suggests wrap-up.
- Review the drafted wrap-up and confirm the durable update requires approval before writing.
- Reopen a later session and verify the updated record supports a better resume briefing.

## Open Questions Deferred

- Tiny Presence Capsule and local/desktop surface.
- Full Working Thread UI.
- Background self-initiation.
- Along Core / MCP implementation.
- Plugin packaging.
- Hermes adapter.
- Delegation or conductor workflows.
- Relationship modes and emotional simulation.

These are future directions and should not be included in the V1 implementation plan unless explicitly reopened and approved.
