# Along Product Expression Tightening Design Spec

Date: 2026-06-12
Status: Draft written from approved design conversation, pending user review
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

This pass tightens how Along expresses its existing Living Conductor Foundation.

It does not expand Along's capabilities. It changes the first-level product experience so Along feels more like a self-initiated companion and conductor, and less like a dashboard that happens to contain Open Threads, attention scores, and delegation requests.

The approved direction is **Shared Desk First**:

> Along's first screen should answer "what are we holding together right now?" rather than "which system modules exist?"

Shared Desk keeps the practical usefulness of Project Intelligence and Delegation Live View, but moves them behind a more companion-like first layer:

- Along chooses what deserves attention;
- Along explains its judgment in user-relevant terms;
- Along offers read-only delegation as a controlled action;
- the user can easily reject, redirect, hide, or ask why;
- quiet state is allowed when no thread deserves attention.

## Background

The 2026-06-12 Along-self product calibration concluded that Living Conductor Foundation is mechanically valid but not yet fully convincing as a living companion.

Validated mechanics:

- Open Threads can carry unresolved product questions.
- Heartbeat can score threads and create read-only delegation requests.
- Delegation requests preserve read-only boundaries.
- Delegation results can merge back into Along's own judgment.
- Doctor and trace explain runtime permission boundaries.
- Wrap-up writes a journal entry and review-gated memory candidate.

Experience gap:

- the current UI feels more like a useful conductor dashboard than a living companion;
- `Check threads` makes self-initiation feel manually triggered;
- delegation reasons expose system mechanics before user stakes;
- multiple similarly scored threads can appear indiscriminately;
- user control exists conceptually but is not first-class in the main surface.

This spec addresses product expression only.

## Goals

1. Make Along's first screen feel like a shared working surface between user and companion.
2. Put Along's current judgment and active Open Thread attention ahead of raw module panels.
3. Preserve conductor identity: Along coordinates read-only analysis instead of becoming the executor.
4. Preserve user agency with lightweight controls.
5. Preserve quietness: no thread should be shown only to fill a layout.
6. Keep the design compatible with future LLM-assisted attention, Ambient Presence, Living Desktop, and richer user preferences without implementing them now.

## Non-Goals

This pass must not implement or require:

- Memory v2;
- Hermes adapter;
- write-capable delegation;
- Living Desktop;
- Ambient Presence First as the primary UI;
- full Intervention Style settings;
- full Attention Density settings;
- full Open Thread management UI;
- multi-agent execution platform behavior;
- Marvis-style broad assistant positioning;
- automatic project writes, commits, pushes, dependency installs, or destructive commands.

The core boundary is:

> This pass changes how Along expresses existing capability, not what Along is allowed to do.

## Approved Product Direction

Three directions were compared:

1. **Dashboard refinement**: keep current modules and make them calmer.
2. **Shared Desk / Living Desk**: put Along's current attention and judgment first.
3. **Ambient Presence First**: make Along feel alive through a quiet event stream.

The approved V1 direction is **Shared Desk First**.

Ambient Presence First remains an interesting future exploration. It should not become the main V1 structure, but later work may use it for:

- ambient activity timeline;
- "why I stayed silent";
- "what I carried forward";
- Living Desktop or ambient UI experiments.

The term "Living Desktop" is also reserved as a future UI idea. It is not part of this V1 product-expression pass.

## Shared Desk Core Structure

The first screen should be organized around what Along and the user are holding together.

### Your Side

Shows the user's immediate project context:

- current project;
- git status;
- recent activity;
- relevant local context;
- current session state.

This area should remain useful, but it should not dominate the page.

### Along's Side

Shows Along's immediate companion state:

- what Along is currently paying attention to;
- why it thinks the current attention matters;
- whether it is quiet, watching, asking for input, or ready to delegate.

This should read as Along's stance, not as a debug panel.

### Main Thread

The Main Thread is the Open Thread Along currently believes most deserves to be visible.

Rules:

- maximum one Main Thread;
- not required to exist;
- never created just to fill the UI;
- selected by Along by default;
- changeable by the user.

The Main Thread should show:

- title;
- current judgment;
- why now;
- boundary;
- suggested next action;
- lightweight controls.

Example shape:

```text
Along's judgment:
I think product feeling should come before Hermes or Memory v2 right now.

Why now:
The foundation works mechanically, but the current surface still feels like a dashboard.

Boundary:
I will not modify project files or open write delegation.

Actions:
Review why | Ask read-only | Not now
```

### Watch Threads

Watch Threads are nearby Open Threads Along is still holding, but not asking the user to focus on first.

V1 default:

- maximum two Watch Threads;
- not required to exist;
- lower visual priority than Main Thread;
- never used as a generic todo list.

Watch Threads should summarize:

- short title;
- why Along is watching it;
- current status;
- a way to make it main.

### Conductor Tools

Conductor tools should be available from the Shared Desk, but they should not be the first screen's central framing.

They include:

- read-only delegation suggestion;
- delegation status;
- scope;
- forbidden actions;
- evidence/result summary;
- Doctor/trace links or diagnostics when needed.

Project Intelligence and Delegation Live View can remain as secondary or expanded surfaces.

### Memory And Wrap-up

Wrap-up remains part of the Shared Desk because it is one of the strongest companion behaviors.

It should capture:

- the Main Thread's current judgment;
- relevant Watch Thread state;
- user corrections;
- whether Along's judgment changed;
- next time's continuation point.

Memory promotion remains review-gated.

## Main Thread Selection

V1 may continue to use deterministic attention scoring as the selection foundation.

Candidate factors:

- impact on next direction;
- unresolved status;
- staleness;
- new evidence;
- new risk;
- evidence gap;
- relation to recent user concerns;
- whether the user needs to judge rather than the agent continuing alone;
- interruption cost.

The selected Main Thread should not be a raw highest-score dump. The UI copy should translate the reason into user-relevant stakes.

Important V1 constraint:

- deterministic scoring is acceptable for V1;
- it is a safety and testability foundation;
- it is not the long-term final product form.

Long-term direction:

- deterministic scorer filters and gates candidates;
- LLM-assisted judgment decides semantic priority, tone, silence, and whether to challenge;
- all high-impact attention decisions remain traceable through Doctor/trace;
- permission envelope and user preferences still constrain output.

This long-term LLM-assisted attention design is explicitly out of scope for this pass.

## Attention Density Preference

The current V1 default is **Focused**:

- at most one Main Thread;
- at most two Watch Threads.

This is a default, not a permanent structural limit.

Long-term preference model:

- `Quiet`: only show one Main Thread when there is a strong reason;
- `Focused`: one Main Thread plus up to two Watch Threads;
- `Overview`: allow more active threads for complex projects;
- `Custom`: user configures count and trigger behavior.

This pass should not implement the full settings system. It should avoid hard-coding assumptions that make future density preferences difficult.

## User Control Model

Along chooses by default, and the user can override.

V1 should emphasize lightweight controls:

- `Not now`: temporarily suppress this Main Thread;
- `Hide`: remove it from Shared Desk visibility;
- `Ask why`: explain Along's selection;
- `Make this main`: promote a Watch Thread;
- `Delegate read-only`: approve or trigger a read-only analysis request where appropriate.

Natural language correction should be treated as an auxiliary path:

```text
Don't look at this right now. Focus on Hermes adapter instead.
```

V1 should not make a full thread management interface the first interaction. A richer management surface can exist later, but the main experience should stay lightweight.

## Intervention Voice

V1 default voice is **Judgment First**.

Along should not primarily speak like an alert, notification, or task reminder. It should state a judgment and explain why it is worth seeing now.

Default intervention structure:

1. **Judgment**: Along's current best judgment.
2. **Why now**: user-relevant stakes, not raw scoring factors.
3. **Boundary**: what Along will not do.
4. **Suggested action**: small next step.
5. **User control**: clear refusal or redirection path.

Example:

```text
I think product feeling should come before Hermes or Memory v2 right now.
The foundation works, but the current surface still feels like a dashboard.
I will not modify files or open write delegation.
You can review why, ask for read-only analysis, or set this aside.
```

Voice variants:

- **Soft Notice**: lighter, closer to a gentle reminder;
- **Quiet Offer**: more restrained, focused on asking permission.

Long-term:

- users should be able to adjust intervention voice;
- future modes may include Soft Notice, Judgment First, Quiet Offer, Strong Challenger, and Custom.

The settings system is out of scope for this pass.

## Delegation And Conductor Surface

Delegation means Along asks another agent or tool to perform a bounded analysis task, then Along integrates the result into its own judgment.

In V1, delegation remains read-only.

Shared Desk should express delegation as Along's controlled action suggestion, not as an unattended background job list.

Main Thread delegation block should answer:

- what Along wants to ask;
- which target will inspect;
- what scope is allowed;
- what actions are forbidden;
- what the user can do next.

Example:

```text
I can ask Codex to inspect this read-only.
Scope: docs, src, tests, .along
Will not: modify files, commit, push, install dependencies
Actions: Ask read-only | View request | Not now
```

If a delegation is already active or completed, Shared Desk should show:

- target;
- status;
- reason;
- compact result summary;
- link or expansion for scope, forbidden actions, evidence, and result details.

Project Intelligence and Delegation Live View become secondary surfaces for:

- all Open Threads;
- evidence and history;
- delegation history;
- attention decisions;
- Doctor/trace inspection.

## Quiet State And Noise Control

Along should be allowed to be present without speaking.

Quiet State examples:

```text
I'm here. I do not see a thread worth interrupting you for right now.
```

```text
I'm still holding the product-feeling question, but I do not have a new judgment yet.
```

Noise-control rules:

- do not show a thread only because it exists;
- do not output only because heartbeat ran;
- do not delegate all equally scored threads by default;
- do not repeat the same low-change thread;
- do not promote low-signal Watch Threads into Main Thread;
- do not surface internal scoring language as user-facing intervention text.

An intervention should generally require at least one of:

- new risk;
- new evidence;
- recent user relevance;
- impact on current direction;
- changed Along judgment;
- delegation result needing user judgment.

## Data And Runtime Fit

This pass should consume existing runtime structures first:

- Open Threads;
- attention scores;
- delegation requests;
- delegation results;
- session state;
- Doctor/trace;
- wrap-up review items.

It may introduce view-model helpers if needed, but should avoid broad data model expansion.

Candidate derived concepts:

- `mainThread`;
- `watchThreads`;
- `quietState`;
- `attentionExplanation`;
- `delegationSuggestion`.

These can be computed from existing conductor snapshots and thread state.

## Success Criteria

1. First glance no longer reads as a module dashboard.
2. Along visibly chooses what matters instead of listing everything.
3. User can refuse, redirect, ask why, or change the Main Thread.
4. Read-only delegation is understandable and controlled.
5. Companion voice appears across Shared Desk, intervention, delegation, and wrap-up.
6. Quiet state is possible and does not look broken.
7. UI does not imply unauthorized write power.
8. The pass does not expand capability scope beyond product expression.

## Test Scenarios

### Cold Start / Resume

- Open Along.
- Runtime recovers or starts a session.
- Shared Desk shows Main/Watch Threads or Quiet State.
- User can understand what Along is currently holding.

### Strong Main Thread

- Provide one high-priority Open Thread.
- Along presents it as Main Thread.
- Watch Threads do not compete visually.

### No Strong Thread

- Provide no thread with enough attention signal.
- Along shows Quiet State.
- UI does not fake a Main Thread.

### User Override

- User chooses `Not now`, `Hide`, `Ask why`, or `Make this main`.
- UI reflects the change.
- Along does not immediately re-push a suppressed low-signal thread.

### Read-Only Delegation

- Main Thread needs external analysis.
- Along offers read-only delegation.
- Scope and forbidden actions are visible.
- User can understand that Along will not modify the project.

### Delegation Result

- A delegation result returns evidence, risk, and recommendation.
- Along integrates it into the thread judgment.
- Shared Desk updates the Main Thread explanation or asks for user judgment.

### Wrap-up

- User writes wrap-up.
- Journal captures shared judgment, not just log text.
- Review-gated memory candidate is created.

### Mobile

- Main Thread remains first.
- Watch Threads and delegation details do not crowd the page.
- Secondary surfaces can collapse or move below.

### Noise Check

- Repeated heartbeat does not create duplicate low-value prompts.
- Low-change Watch Threads are not repeatedly elevated.

### Permission Boundary

- UI does not show unauthorized write capability.
- Delegation remains read-only.
- Doctor/trace can still explain relevant decisions.

## Future Follow-ups

These are deliberately deferred:

- LLM-assisted attention judgment;
- Ambient Presence layer;
- Living Desktop UI exploration;
- configurable Intervention Voice;
- configurable Attention Density;
- Hermes adapter;
- write-capable delegation with explicit approval;
- richer Open Thread management;
- Project Intelligence as an advanced library surface.

## Final Design Direction

Use **Shared Desk First** for V1 Product Expression Tightening, pending user review of this written spec.

Use a focused first screen with:

- Along-selected Main Thread;
- up to two Watch Threads by default;
- lightweight user controls;
- Judgment First voice;
- read-only conductor suggestion surface;
- Quiet State when appropriate;
- wrap-up as shared judgment.

Do not expand capabilities in this pass.
