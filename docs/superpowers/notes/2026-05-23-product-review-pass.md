# Along Product Review Pass

Date: 2026-05-23
Reviewer: Codex product/design supervision session
Reviewed local branch: `main`
Reviewed local head: `3032072 docs: add autonomy implementation plan`

## Purpose

This note records the first product review pass after the MVP implementation. It should be used by the next implementation session as the source of truth for a bounded product-feel improvement pass.

This is not a request to add broad new features. The MVP technical skeleton works, but Along still needs to better express its core product idea:

> Along has its own rhythm, state, and growth line. The user does their work, Along does its own small work nearby, and the two can naturally interact without pressure or evaluation.

## Review Context

Commands and checks run during review:

- `npm run typecheck`: passed.
- `npm test`: failed in the ordinary sandbox because the server test cannot bind a port there.
- `npm test` outside the sandbox: passed, 6 test files and 11 tests.
- Local API server started with `npm run dev`.
- Local Vite server started with `npm run web`.
- Browser review used `http://127.0.0.1:5173/`.
- Desktop and mobile viewport snapshots were inspected.
- Lo-fi sound button was clicked and confirmed to start from user action.
- Wrap-up was executed and generated journal/memory files.
- `.along/` and `/Users/james/.along/` memory files were inspected.

Local state observed during review:

- `main` was ahead of `origin/main` by 2 commits.
- `.superpowers/` was untracked.
- The review did not modify code or intentionally modify tracked source files.
- Review generated local `.along/` and `/Users/james/.along/` memory artifacts.

## Scorecard

### Autonomy: 2/5

Evidence:

- Along creates a learning goal.
- Along exposes a state value.
- Along selects a curiosity.

Issue:

- The state is mostly static at `settling`.
- The timeline is a static list rather than a visible progression.
- The learning goal is deterministic and generic, so Along does not yet feel like it is living through a small workday.

### Companionship: 2.5/5

Evidence:

- The tone is calm.
- The top-level message is aligned with the product thesis.
- The experience does not pressure, guilt, or evaluate the user.

Issue:

- The interface still feels like a clean information panel.
- There is little natural reciprocal interaction.
- The user can see Along's output, but not yet feel much shared presence.

### Own Rhythm / State / Growth Line: 2/5

Evidence:

- The UI has Along's side.
- The UI shows a learning goal and current activity.
- The journal records what Along tried to understand.

Issue:

- Along does not visibly move through states.
- There is no sense of time passing or Along progressing from one small thought to another.
- The growth line is mostly stored in files, not felt in the UI.

### Memory Continuity: 3/5

Evidence:

- `.along/journal/` exists.
- `.along/curiosity/queue.json` exists.
- `.along/sessions/` exists.
- Previous sessions are present.

Issue:

- Page reload creates or can create a fresh session instead of first trying to resume the current session.
- The UI does not show continuity from prior sessions.
- The user does not see "I remember where we left off" as a first-class product moment.

### Graph Memory: 2/5

Evidence:

- `.along/graph/nodes.json` and `.along/graph/edges.json` exist.
- The graph records project, session, curiosity, and `session_produced_curiosity` relations.

Issue:

- Graph memory is technically present but product-invisible.
- Current relations are shallow and repetitive.
- There are no visible correction, learned fact, decision, or growth relations yet.

### Lo-Fi Soundscape: 2/5

Evidence:

- The sound button exists.
- It starts off.
- It changes to `Sound on` after a user click.
- There is no autoplay.

Issue:

- There is no volume control.
- The soundscape does not yet feel integrated with Along's states.
- The review did not judge audio quality beyond confirming user-triggered behavior.

### Safety / Trust: 4/5

Evidence:

- Tests pass outside the sandbox.
- Along writes project memory under `.along/`.
- Along writes global memory under `~/.along/`.
- The MVP does not modify project code.

Issue:

- Along currently presents `.along/` and `.superpowers/` as user-facing project context and writes `.along/` into the journal `I Looked At` list.
- This weakens trust and the sense that Along is carefully reading the project rather than inspecting its own generated artifacts.

## Product Findings

### P1: Along's rhythm is not yet real

Along has the approved state names, but the product experience does not yet show a real workday progression. The UI shows `settling`, but the companion does not visibly arrive, settle, focus, gently share, rest, and wrap up.

This is the highest-priority product issue because Along's core differentiator is "it has its own rhythm, state, and growth line."

### P1: Page load should resume before starting a new session

The UI currently starts a session on page load. A companion product should first try to resume the current session, then start a new one only when needed.

Expected behavior:

1. Page load calls `GET /api/session/current`.
2. If a current session exists, use it.
3. If none exists, call `POST /api/session/start`.
4. User can explicitly start a new session later, but refresh should not imply a new workday.

### P1: Wrap-up needs visible feedback

Wrap-up writes the journal, but the UI does not clearly show that Along moved to `wrap_up`, what it remembered, or where the journal went.

Expected behavior:

- After wrap-up, UI state updates to `wrap_up`.
- User sees a short "what I remembered" confirmation.
- User sees a journal path or short journal preview.

### P1: Local dates should respect user timezone

The generated journal date used UTC behavior from `toISOString().slice(0, 10)`. For a companion journal, the date should match the user's local date and timezone.

Expected behavior:

- Journal date respects local timezone.
- Add a test if feasible.

### P1: Internal/generated folders should not appear as project context

Along currently includes `.along/` and `.superpowers/` in directory summary and journal context. This makes it feel like Along is reading its own implementation artifacts rather than the user's project.

Expected behavior:

- Do not show `.along/`, `.superpowers/`, `node_modules/`, or `dist/` in user-facing project context.
- Along can still use MemoryStore internally.
- Generated memory should remain inspectable, but not be presented as source project context.

### P2: Graph memory needs a product-facing foothold

Graph memory should not remain purely technical. The next product iteration should expose at least one relation in a simple, human-readable way.

Examples:

- "This session continued curiosity: What is the smallest useful entry point in Along?"
- "I remembered this from last time."
- "This note came from today's wrap-up."

This can be a second pass after the first product-feel pass.

### P2: The UI still feels too card-grid-like

The current layout is clean and readable, but still resembles a dashboard. It needs more of a shared-desk feeling over time.

Do not do a broad redesign in the next pass. First fix rhythm, resume, wrap-up feedback, local date, and filtering. Reassess visual direction after those product mechanics are visible.

### P2: Add favicon

The browser console showed a missing `favicon.ico`. This is low priority.

## Recommended Next Implementation Pass

The next implementation session should do a bounded Product Feel Pass. It should not add real LLM providers, broaden permissions, or redesign the whole app.

Implement only this first pass:

1. Resume current session before starting a new one.
2. Make presence rhythm visibly progress.
3. Improve wrap-up feedback.
4. Fix local timezone journal date.
5. Filter internal/generated folders from user-facing project context and journal `I Looked At`.

Defer:

- Graph memory UI expansion beyond a very small foothold.
- Full visual redesign.
- Real LLM providers.
- New agent permissions.
- Complex background autonomy.

## Prompt For New Implementation Session

```text
We are doing a bounded Product Feel Pass for Along.

Do not add real LLM providers, do not broaden agent permissions, and do not redesign the whole app.

Read first:
- docs/superpowers/specs/2026-05-13-along-design.md
- docs/superpowers/plans/2026-05-13-along-mvp.md
- docs/superpowers/notes/2026-05-13-ambient-coding-companion-brainstorm.md
- docs/superpowers/notes/2026-05-23-product-review-pass.md

Product review found that the MVP technical skeleton works, but Along still feels too static and dashboard-like.

Implement only this first pass:

1. Resume current session instead of always creating a new one:
   - On page load, call `GET /api/session/current`.
   - If a session exists, use it.
   - If none exists, then call `POST /api/session/start`.
   - Add tests where appropriate.

2. Make the rhythm visible:
   - Along should progress through presence states in a bounded way.
   - The Shared timeline should clearly show current state and completed prior states.
   - Do not make it noisy or chatty.

3. Improve wrap-up feedback:
   - After wrap-up, update UI state to `wrap_up`.
   - Show a short "what I remembered" confirmation.
   - Show journal path or journal preview if available.

4. Fix local journal date:
   - Journal date should respect local timezone, not UTC `toISOString().slice(0, 10)`.
   - Add a test for this if feasible.

5. Filter internal/generated folders from user-facing project context:
   - Do not show `.along/`, `.superpowers/`, `node_modules/`, or `dist/` in "Your side" or journal `I Looked At`.
   - Along can still use memory internally through MemoryStore.

Verification:
- npm test
- npm run typecheck
- npm run build
- browser check at desktop and mobile widths
- confirm no sound autoplay
- confirm wrap-up writes journal and UI shows feedback

After completion, commit and report:
- commit hash
- files changed
- verification results
- any deviations
- remaining product issues
```

## Notes For Product Supervision

When reviewing the next pass, do not only check tests. Verify whether these statements feel more true:

- Along came back to the current workday instead of resetting.
- Along visibly moved through a small rhythm.
- Along's wrap-up felt like it remembered something.
- Along looked at the user's project, not its own generated artifacts.
- Along still felt calm and non-judgmental.

