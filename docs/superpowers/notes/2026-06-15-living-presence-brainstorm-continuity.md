# Living Presence Brainstorm Continuity

Date: 2026-06-15
Status: Active brainstorming record, not an approved spec
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Purpose

This record preserves the ongoing Living Presence and Explanation Pass discussion so future sessions do not rely only on chat context.

Use it before continuing Along product design around:

- conversational working threads;
- self-initiation without context pollution;
- presence signals;
- co-creator companion personality;
- future relationship modes.

This document is not an implementation plan. No code should be written from it until a formal spec is drafted, reviewed, approved, and converted into an implementation plan.

## Current Goal

Clarify how Along should feel self-initiated and companion-like while still being useful as a conductor agent.

The immediate design goal is to define the next **Living Presence and Explanation Pass**:

- Along should become more than a static dashboard.
- Along should support user-initiated work without becoming a generic chat-first coding agent.
- Along should express proactive attention without polluting chat context or feeling like simple automation.
- Along should keep the product center on self-initiation, companionship, and conductor identity.

## Key Constraints

- Do not start Memory v2, Hermes adapter, write delegation, or broad capability expansion while this design is unresolved.
- Do not treat the current discussion as approved implementation scope.
- Continue using `superpowers:brainstorming`: ask one clarifying question at a time, propose alternatives, then write an approved spec before implementation planning.
- Main session remains design/review/supervision.
- Focused execution sessions may be used later, but only after spec and plan approval.
- Along should not become a generic Codex/Hermes/Claude Code clone.
- Along can use chat, but chat should not erase the product distinction around working threads, self-initiation, and co-creator companionship.
- Emotional simulation and relationship modes are valid future product directions, but should be user-selected and must not change autonomy or execution permissions.
- Current pass should keep Relationship Modes as future direction, not implement the full mode system.
- Current pass should not implement full presence level settings; design the default Balanced behavior first.

## Product Calibration Input

User subjective calibration of Product Expression Tightening:

- First impression: 3/5. Still feels like a dashboard; UI is cluttered and unclear.
- Self-initiation: 2/5. The text is already present, but the relation to user activity is unclear.
- Companionship: 2/5. Currently feels like a static dashboard.
- Conductor identity: 2/5. Static dashboard does not yet express conductor role.
- Controllability: 2/5. Page feels crowded; controls are hard to understand.
- Explainability: 3/5. Understandable in broad strokes, but language feels too AI-like and hard-coded.
- Quietness: 3/5. Some task-management feeling remains.
- Reopen desire: 2/5. Currently not interesting enough, though acceptable for an early version.

Most compelling element:

- The headline: `A lo-fi coding companion that learns along with you.`

Least living-companion-like element:

- Too much is presented at once; the eye does not know where to go.
- User prefers simple, restrained design.

## Visual Direction So Far

The user selected **B. Quiet Shared Desk** from first-screen simplicity options.

Interpretation:

- Keep the shared desk idea.
- Reduce information density strongly.
- Avoid a heavy dashboard, inbox, or task-management surface.
- Do not reduce the product so much that it loses context or usefulness.

Chat placement discussion:

- User worries that a central chat plus Along side panel may feel too similar to Codex/Hermes/Claude Code.
- User also strongly believes agent interaction is important and has difficulty imagining an agent product without chat as a main interaction.
- Current working direction: do not reject chat. Instead, define Along as a **Conversational Working Thread** product.

## Core Direction: Conversational Working Thread

Along should support conversation, but not as a generic task-prompt chat.

Current direction:

```text
User input or Along proactive attention
-> creates or updates a Working Thread
-> Along frames the intention
-> Along forms judgment, asks clarification, suggests delegation, or stays quiet
-> user can converse, correct, pause, delegate, remember, or wrap up
-> Along carries the thread forward across sessions
```

Key distinction:

- Codex/Hermes: execution-oriented conversation.
- Along: persistent working-thread conversation with self-initiated judgment, companionship, and conductor delegation.

## Working Thread Conclusions

User chose:

- Active user input should default to **a working thread**, not just a one-off question.
- When the user starts a working thread, Along should **first build shared understanding**.
- The initial thread should be **temporary**, not immediately long-term.

Current lifecycle:

```text
User intention
-> Temporary Working Thread
-> clarification / conversation / judgment / delegation suggestion
-> wrap-up, explicit remember, or sustained engagement
-> Long-term Working Thread
```

Important distinction:

- Codex session: host/tool conversation container.
- Along session: current use of Along in a project/folder/context.
- Working Thread: Along's persistent object for an unfinished question, intention, or direction.

## Conductor Boundary

Along should remain a conductor, not a default executor.

Current conclusion:

- Along may discuss with the user.
- Along may decide that Codex, Hermes, or a subagent should analyze or execute something.
- Along should not directly become the primary implementation executor in this pass.
- Delegation remains bounded and permissioned.
- Delegated agents are collaborators/tools, not Along sub-personalities.

Principle:

> Along has one persistent identity. Threads are attention contexts, not separate personalities. Delegated agents are tools/collaborators, not Along sub-selves.

## Self-Initiation Model

User selected **A. 主动发言** as the most important self-initiation manifestation, but raised two concerns:

- Directly posting proactive messages into chat may pollute context.
- Scheduled proactive messages may be indistinguishable from automation.

Current answer:

- Along should not default to injecting proactive messages into chat.
- Along should first create an **attention note / presence signal**.
- Only higher-importance or user-requested cases should become thread conversation or chat-like interaction.

Self-initiation should be eventful and judgment-based, not timer-based:

- It is related to a Working Thread or project state.
- It carries Along's judgment.
- It is explainable.
- It is restrained.

Example distinction:

- Automation-like: `This thread has been inactive for 3 days.`
- Along-like: `Product Expression was merged, but your subjective calibration is still low. I think the next issue is presence, not Hermes adapter.`

## Presence Signal Conclusions

The term "轻微状态" was clarified as **presence signal**.

Purpose:

- Let Along express that it is present, observing, or holding a thread without interrupting the user or polluting chat context.

User accepted the following presence signal hierarchy:

```text
No new judgment:
  Quiet holding
  "I am still quietly holding this thread."

Light observation:
  Noticed
  "I noticed a small change."

Clear product judgment:
  Judgment
  "I have a judgment when you want it."

Needs user intervention:
  Review / confirmation
  "This may need your call."
```

Important principle:

> Self-initiation is not "send a message." It is sustained attention that can escalate from quiet holding to observation, judgment, and confirmation.

## Outer vs Inner Along

User asked whether outer Along and inner thread Along are the same agent.

Current conclusion:

- They are the same Along, not separate agents or sub-personalities.
- Outer Along = global presence / overall attention.
- Inner Along = focused attention inside a specific Working Thread.

Principle:

```text
One Along, multiple attention contexts.
```

Global layer should show presence, not content.

Project/thread layer should show specifics.

Accepted direction:

```text
Global: presence, not content.
Project/session: current focus.
Thread: concrete attention and explanation.
```

## Outer Presence Direction

User accepted that outer Along should not list concrete threads or become an inbox.

User liked a combination of:

- **A. Tiny Presence Line**
- **B. Presence Capsule**

Current concept:

> Tiny Presence Capsule

Definition:

- visually minimal like a presence line by default;
- becomes a small actionable capsule when Along noticed something or formed a judgment;
- does not list threads;
- does not show inbox counts;
- does not become a status card;
- can be cute/living-feeling later, but should not become a desk pet.

Example states:

```text
Quiet:
  Along is here.
  Quietly holding this with you.

Noticed:
  I noticed a small change. [Open]

Judgment:
  I have a judgment when you want it. [Open]

Needs confirmation:
  This may need your call. [Review]
```

Current recommended behavior:

```text
Tiny Presence Capsule
-> Presence Peek
-> Working Thread
```

This is the simplified **two-step progressive attention** model.

Presence Peek should be small and low-friction:

- one sentence about what Along noticed;
- one sentence of lightweight reasoning;
- at most two co-creator actions.

Preferred action language should avoid stiff tool-button wording. User preferred a co-creator tone:

```text
Stay with this
Hold it quietly
```

Earlier candidate wording such as `Ask why`, `Open thread`, and `Not now` felt too dead, fake, and tool-like. The underlying intents remain useful, but the final interaction copy should feel like a co-creator response, not a dashboard toolbar.

Accepted `Hold it quietly` semantics:

- default behavior is lower presence priority, not dismiss/delete/close;
- Along keeps the thread alive and quietly held;
- the thread should resurface only when the user re-enters it or Along has a meaningfully new judgment;
- if finer control is needed, offer a secondary `Adjust quietness` control;
- `Adjust quietness` can later expose options such as today, this week, until user reopens, or until Along has a meaningful new judgment;
- do not show duration choices every time, because that would feel like reminder software and add friction.

Suggested interaction:

```text
Hold it quietly
-> I will keep it quiet for now. Adjust
```

Accepted `Stay with this` semantics:

- `Stay with this` should not open a generic chat directly.
- It should make the presence signal the current active Working Thread.
- The first screen should be a short **Thread Brief**, not a full workspace.
- The brief should establish the thread as a working object before conversation starts.
- The brief must be concise enough to avoid dashboard feeling.
- From the brief, the user can naturally continue into conversation.

Accepted minimum Thread Brief contents:

1. **Thread title**: what we are looking at.
2. **Along's current judgment**: what Along currently believes the real issue is.
3. **Why now**: why this deserves attention now.
4. **Boundary / next move**: whether this is discussion, calibration, delegation, or explicitly not implementation yet.

The brief should not become a report or mini-dashboard. It is a compact transition from presence into conversation.

Accepted Thread Brief expression rules:

- keep the four required elements structurally, but do not render them as a rigid table or grid of cards;
- do not default-show evidence in the brief;
- let one concise co-creator framing carry the four elements naturally;
- make the brief read like Along orienting the user, not like a system report;
- evidence, trace, detailed reasoning, delegation history, and broader controls belong inside the Working Thread after the brief.

Preferred feel:

```text
Along still feels more static than alive.

I think the next issue is presence and explanation, not Hermes adapter.
This matters now because your calibration stayed low after Product Expression merged.
For this pass, I would keep this in product design and avoid implementation until we agree on the feeling.
```

Avoid:

```text
Title:
Judgment:
Why now:
Boundary:
Evidence:
Actions:
```

Accepted conversation entry after Thread Brief:

- do not default to a blank generic chat input as the primary visual object;
- after the brief, Along should offer a co-creator prompt that invites response;
- the prompt should confirm whether the framing matches what the user wants to stay with;
- the user can then respond naturally, but the conversation is anchored to the Working Thread.

Preferred pattern:

```text
Along:
Does this match what you want to stay with?
```

This keeps conversation important while avoiding the feeling that Along is just another generic chat agent.

Accepted ongoing Working Thread conversation structure:

- default to a lightweight top **thread anchor**;
- use occasional in-stream state updates only when Along's judgment, boundary, delegation state, or thread status meaningfully changes;
- do not use a default side rail in the current pass;
- do not let the conversation become a blank generic chat detached from the Working Thread.

Thread anchor purpose:

- remind the user which Working Thread the conversation belongs to;
- keep Along's current judgment visible;
- keep the active boundary visible;
- prevent drift into generic user-prompt/assistant-answer behavior.

Example anchor:

```text
Along still feels like a dashboard
Judgment: presence and explanation first
Boundary: product design only
```

In-stream state updates are supplemental, not the main structure:

```text
Along updated its judgment:
The issue is not chat itself, but whether chat is anchored to a working thread.
```

Preferred flow:

```text
Tiny Presence Capsule
-> Presence Peek
-> Stay with this
-> Thread Brief
-> Continue conversation
```

Current rejected defaults:

- direct generic chat as the first view, because it risks Codex/Hermes-style sameness;
- full thread workspace as the first view, because it risks clutter and dashboard feeling;
- expanding the current page indefinitely, because it weakens long-term thread identity.

Working Thread is the deeper layer. Full reasoning, evidence, conversation, delegation suggestions, and wrap-up belong there, not in the outer popover.

Side panel remains a possible future desktop enhancement, not the default. Scroll-to-section is not preferred as the default.

User broadly accepts this simplification, while noting that concrete interaction design will need further optimization.

## Co-Creator Companion Personality

User wants Along to feel more like a real companion and raised emotional simulation as a legitimate user need.

Current conclusions:

- Along default in the next pass should be **Co-creator Companion**.
- It should not default to lover/relative/friend simulation.
- Relationship Modes should remain an explicit future product direction.
- Emotional simulation should be user-selected, not forced.
- Relationship Modes affect tone, presence, care gestures, and memory expression; they do not expand execution permissions.

Co-creator Companion should do all four:

- guard the original intention;
- form shared product judgment;
- help preserve creative passion;
- turn vague ideas into Working Threads or delegation candidates.

When user intent conflicts with Along's known core direction, user chose:

- **C. 先问你确认**

This is recorded as **confirmation challenge**.

Default challenge style:

- **A. 理性克制**

Principle:

> Along should point out the observed drift, explain the risk, and ask the user to confirm. It should not dramatize, nag, or override.

Example:

```text
I notice this may shift us away from the current product direction:
we have not solved living companion feeling, but we are starting Hermes adapter.
Please confirm whether you want to intentionally switch to capability expansion,
or continue with product feeling.
```

## Presence Level Decision

User asked whether presence levels should be implemented now.

Current conclusion:

- Do not implement presence level settings in the current Living Presence and Explanation Pass.
- First design and validate a default **Balanced presence**.
- Keep future presence levels in the spec as future direction.

Future possible levels:

- Quiet
- Balanced
- Engaged
- Relationship / Emotional modes

Current pass should implement or design only default Balanced behavior:

- subtle presence signal;
- explainable attention;
- ignorable and pausable;
- confirmation challenge for important drift;
- no full settings UI.

## Product Shape Pivot: Existing-Agent Layer

User interrupted the previous "build a new agent" direction and raised a concern:

- building a full Codex/Hermes/Claude Code competitor may be unrealistic;
- Along's real opportunity may be to add self-initiation and companionship around existing agents;
- it is unclear whether Along should be a plugin, skill, MCP server, CLI layer, desktop surface, or something else.

Current working answer:

> Along should not be framed as "another coding agent" first. It should be framed as a self-initiation and companionship layer that can sit around existing agents.

User accepted this direction on 2026-06-17.

Provisional architecture vocabulary:

```text
Along Core
  Working Threads
  attention state
  judgments
  memory / wrap-up
  delegation decisions

Along Integration Layer
  MCP server
  Codex plugin / skills
  future Hermes adapter
  CLI hooks or commands

Along Surface
  optional local / desktop / browser presence view
  Tiny Presence Capsule
  Presence Peek
  Thread Brief
```

Important clarification:

- A local/desktop surface is not a strict requirement for self-initiation.
- Self-initiation can exist through agent integrations: plugin behavior, MCP tools, CLI commands, conversation notes, persisted working threads, and review/attention hooks.
- Companionship can also exist without a desktop surface if the existing agent can consistently carry memory, tone, attention, and thread continuity.
- A local/desktop surface is useful only if the first product goal is to make Along feel visibly present outside a single agent conversation.
- If Along's first goal is to make existing agents more self-initiated, then the integration layer may be more important than a standalone surface.

Risk of a separate surface:

- If the surface is too central, users may feel the connected agent itself did not become self-initiated; they may feel "Along is watching next to Codex" rather than "Codex is behaving with Along-like initiative."
- The product could split identity between "agent I work with" and "Along dashboard beside it."
- This risk is especially high if the surface becomes a dashboard, inbox, reminder panel, or task manager.

Accepted product principle:

> Local/desktop presence should be treated as an optional expression and validation harness, not as the essence of Along.

The essence of Along is:

- persisted working threads;
- judgment-based attention;
- restrained proactive intervention;
- memory of what matters;
- ability to hand work to existing agents and absorb their results back into Along's judgment.

Accepted first-stage focus:

- **A as primary**: make existing agents behave in an Along-like way inside their existing conversation flow.
- **B as foundation**: keep Along Core / MCP-style interfaces as the substrate for working threads, judgments, memory, and attention state.
- **C as later capability**: conductor delegation remains important, but should come after the basic self-initiation layer is clear.
- **D deferred**: local/desktop presence remains optional and secondary, not the first-stage product center.

Current interpretation:

> The first milestone should prove that an existing agent can carry Along's self-initiation, companionship, and thread continuity inside normal work, without requiring Along to become a separate coding agent or a separate dashboard.

Accepted self-initiation staging:

- **V1 uses turn-bound self-initiation**: Along-like initiative appears while the user is already starting, resuming, transitioning, delegating, or wrapping up work inside an existing agent.
- **V1 does not require background self-initiation**: Along does not need to wake independently, watch in the background, or surface notifications when no agent session is active.
- **Future direction preserves background self-initiation**: later versions may add runtime watchers, schedulers, notifications, local presence surfaces, or cross-session proactive surfacing.

Definition:

> Turn-bound self-initiation means the agent does not wait for an explicit user question before applying Along's judgment, but the initiative still occurs inside an active user-agent interaction turn or session.

Example V1 moments:

- session start: the agent proactively recalls the relevant Working Thread and current Along judgment;
- resume: the agent states where the thread left off before answering;
- drift: the agent asks for confirmation when the user appears to move away from an accepted direction;
- transition: the agent recommends whether to continue discussion, write a spec, delegate analysis, or wrap up;
- wrap-up: the agent records what changed in judgment and what should be carried forward.

Reasoning:

- This keeps the first milestone realistic.
- It tests whether existing agents can feel Along-like without requiring a standalone desktop surface.
- It avoids conflating self-initiation with background automation too early.
- It keeps true "living presence" as a later product layer rather than blocking the first usable integration.

Accepted V1 host strategy:

- **Codex-first for validation**: first prove Along-like self-initiation inside the user's current high-frequency Codex workflow.
- **Generic-agent interface in concept and naming**: model capabilities as agent-agnostic Along Core operations rather than Codex-only behavior.
- **Hermes remains a future adapter target**: do not ignore Hermes, but do not make the first pass depend on Hermes integration.

Implication:

> V1 may be experienced through Codex first, but the design should read as "an existing agent calls Along Core" rather than "Codex has a special hard-coded Along mode."

Likely generic concepts:

- `Working Thread`
- `Agent Session`
- `Attention State`
- `Along Judgment`
- `Confirmation Challenge`
- `Wrap-up`
- `Delegation Candidate`
- `Carry-forward Memory`

Risk to avoid:

- Do not encode the core model around Codex-specific UI concepts, thread labels, or product affordances.
- Do not design the first pass as a Codex-only prompt pack if that prevents MCP/Hermes/other agents from later reusing the same Along Core semantics.

Accepted V1 validation method:

- **Skill-first experience validation**: first define and test the Along-like behavior as a Codex skill / prompt workflow.
- **Core interface sketch only**: document the future Along Core / MCP operations, but do not make the first pass depend on implementing the full interface.
- **Plugin deferred**: package the workflow as a plugin only after the behavior proves useful and stable enough to distribute.

Current source-aligned rationale:

- Codex skills are the right authoring format for reusable workflows and can be used locally while behavior is still being shaped.
- Plugins are the distribution/package layer for stable reusable workflows, bundled skills, apps, and MCP configuration.
- MCP is the right future integration layer when Codex or another agent needs tools/context to read or update Along Core state.

Implication:

```text
V1:
  Codex skill / prompt workflow
  proves Along-like turn-bound self-initiation
  names concepts generically
  records future Core/MCP operations as a contract sketch

Later:
  Along Core
  MCP server
  plugin packaging
  Hermes adapter
  optional local/desktop presence surface
```

Risk to avoid:

- Do not mistake a skill for the whole product.
- Do not overbuild Core/MCP before the Along-like behavior is subjectively validated.
- Do not package a plugin before the behavior has clear boundaries and repeatable value.

Accepted V1 behavior scope:

- **Session start / resume**: when an existing agent session begins or resumes, the Along-like behavior should proactively recover the relevant Working Thread, current judgment, and likely next step.
- **Drift challenge**: when the user appears to move away from an accepted direction, the agent should calmly point out the shift and ask for confirmation before following the drift.
- **Wrap-up**: when a phase ends, the agent should record the shared judgment, changed assumptions, unresolved questions, and what should be carried forward.

This is the V1 minimum loop:

```text
start / resume
-> work together
-> challenge meaningful drift
-> wrap up and carry forward
```

Delegation candidate is no longer part of the V1 behavior scope.

Reasoning:

- The project goal has changed from "build a new agent/conductor" to "make existing agents more self-initiated and companion-like."
- The earlier conductor/delegation direction came from the previous new-agent framing.
- Delegation may remain a future capability, but it should not define the current V1.

Accepted V1 continuity storage:

- **V1 uses project documentation as the continuity store.**
- Stable Working Thread state, accepted judgments, important wrap-ups, and unresolved questions should live in reviewable project docs.
- The first implementation/spec should not rely only on Codex memory or current chat context.
- The first implementation/spec should not require a complete `.along/` local state system.

Future evolution:

- Preserve a **two-layer continuity model** as the later direction:
  - project docs for stable, user-reviewable judgments and decisions;
  - `.along/` ignored local state for temporary, private, unconfirmed, or high-churn thread state.

Reasoning:

- Docs best match the current design/review phase because the user explicitly wants cross-session decisions preserved and inspectable.
- Docs are easy for Codex to read at session start and update during wrap-up.
- `.along/` remains useful later, but using it first would hide too much of the product judgment during calibration.
- Codex memory alone is insufficient because it is not explicit, reviewable, or project-owned enough for Along's intended continuity.

Accepted V1 Working Thread record shape:

Use a **judgment-oriented record** rather than an ultra-minimal record or a full thread report.

V1 fields:

```text
Title
Why this matters
Current judgment
Boundary
Drift triggers
Next likely move
Last wrap-up
Open questions
```

Reasoning:

- This preserves what Codex needs for start/resume, drift challenge, and wrap-up.
- It keeps the record centered on judgment and continuity, not tasks or dashboard state.
- It gives enough context for a future session to understand why the thread exists and when the agent should intervene.
- It avoids the heaviness of evidence timelines, full context dumps, or report-like thread histories.

Future direction to preserve:

- A fuller thread record may become useful later for other purposes, such as evidence review, auditability, debugging, longer-running research, or multi-agent handoff.
- Future expanded fields may include context, timeline, evidence, decisions, and more detailed history.
- Do not implement the expanded form in V1 unless the lightweight record proves insufficient.

Accepted Working Thread creation model:

Use a **dual-entry model** inside existing Codex sessions.

- **Explicit user entry**: the user can say that a topic should become a Working Thread, should be recorded, or should continue as an existing thread.
- **Agent-suggested entry**: Codex can proactively suggest that a topic should become a Working Thread when the discussion appears long-running, judgment-heavy, repeatedly recurring, or important to future continuity.
- **Confirmation before first creation**: Codex should not silently create durable Working Thread docs. It should ask for confirmation before the first record is created.

Reasoning:

- This preserves user control and avoids noisy auto-recording.
- It still allows Along-like initiative because Codex may notice when something deserves continuity.
- It fits the V1 goal: self-initiated but restrained, not a passive note-taker and not an automatic tracker.

Example:

```text
I think this is becoming a Working Thread rather than a one-off question.
Do you want me to record it as one so future sessions can carry it forward?
```

After a Working Thread already exists, Codex may update it during wrap-up under the accepted V1 behavior loop, while still summarizing the intended update before writing durable docs.

Accepted Working Thread suggestion triggers:

Codex should use **combined high-signal triggers** before suggesting a Working Thread.

Suggest creating a Working Thread only when at least one strong signal is present:

- the user explicitly indicates long-term continuity, such as "continue later", "record this", or "we will keep discussing this";
- the discussion is judgment-heavy, involving product direction, design tradeoffs, core doubts, identity, positioning, or repeated subjective calibration;
- the same theme has recurred across sessions or across multiple parts of the same session;
- the topic will materially affect future multi-turn decisions.

V1 boundary:

- Codex may suggest creating a Working Thread.
- Codex must not silently create the first durable Working Thread record.
- First creation requires user confirmation.

Reasoning:

- This keeps self-initiation visible without turning Along into an automatic recorder.
- High-signal triggers align with Along's purpose: preserving judgment, direction, and continuity rather than tracking every task.
- The confirmation gate protects quietness and user control.

Accepted Working Thread definition:

> A Working Thread is a cross-session judgment container for an unfinished question, direction, doubt, or creative line that will keep affecting future decisions.

It is used to preserve:

- why this topic matters;
- the current shared judgment;
- the accepted boundary;
- signals that indicate meaningful drift;
- the likely next move;
- the last wrap-up;
- unresolved questions that should carry forward.

It is not:

- a chat transcript, because it should survive across multiple chats or Codex sessions;
- a todo list, because it tracks judgment and continuity rather than task completion;
- an issue ticket, because it may be exploratory, subjective, or product-directional rather than implementation-ready;
- a spec, because it can exist before formal design approval and can help a spec emerge;
- generic memory, because it is project-owned, explicit, reviewable, and intentionally maintained.

V1 usage:

- On start/resume, Codex reads the relevant Working Thread and proactively restates where the shared judgment currently stands.
- During work, Codex uses the record to decide whether a drift challenge is appropriate.
- During wrap-up, Codex updates the record with changed judgment, changed boundary, unresolved questions, and the next likely move.

Core distinction:

```text
Chat = where conversation happens.
Working Thread = what important unfinished judgment the conversation is helping carry forward.
```

Accepted start/resume behavior:

When Codex finds a relevant Working Thread at session start or resume, it should use a **short briefing**.

The briefing should:

- proactively name the relevant Working Thread;
- restate the current shared judgment;
- restate the active boundary if it affects the next action;
- suggest the next likely move;
- avoid full history unless the user asks.

Preferred feel:

```text
I brought this thread back:
we last confirmed V1 is Codex-first, skill-first, and docs-backed.
Current judgment: validate start/resume, drift challenge, and wrap-up before building Core/MCP.
I suggest we define the drift challenge behavior next, without entering implementation yet.
```

Why this behavior:

- It shows self-initiation because Codex brings the thread back without waiting for the user to ask.
- It supports companionship because Codex remembers where the work emotionally and directionally paused.
- It stays quiet enough to avoid becoming a report, dashboard, or task manager.
- It leaves the user in control because it suggests a next move rather than forcing one.

Avoid:

- a single vague sentence that lacks useful continuity;
- a full timeline/history dump;
- asking "do you want me to restore this?" every time, because that adds friction and weakens initiative;
- presenting multiple threads like an inbox.

Accepted drift challenge threshold:

Use **impact-based drift challenge**.

Codex should not challenge every direction change. It should challenge only when the user's new direction appears likely to affect:

- the current Working Thread goal;
- an accepted boundary;
- a previously accepted product judgment;
- the project/product core intention;
- the current phase, such as moving from design into implementation before approval;
- a deferred direction that was intentionally parked.

Judgment mechanism:

- V1 may use the LLM to judge drift impact, but not as an unconstrained subjective guess.
- The LLM should compare the user's new request against the Working Thread record, especially `Current judgment`, `Boundary`, `Drift triggers`, `Next likely move`, and `Open questions`.
- The skill should treat the Working Thread record as the source of truth for what counts as meaningful drift.
- The LLM should produce a lightweight classification: `none`, `low`, `medium`, or `high`.
- Only `high` drift should trigger a confirmation challenge by default.
- `medium` drift may produce a soft note if useful, but should not block the user's request.
- `low` or `none` should stay silent.

High-impact drift examples:

- moving into implementation while the active boundary says design/spec only;
- reviving a deferred direction such as full Core/MCP, plugin packaging, local/desktop presence, or Hermes adapter before the current V1 behavior is validated;
- shifting back toward building a new general agent after accepting the existing-agent layer direction;
- bypassing user review/approval gates that the Working Thread explicitly preserves;
- changing the product identity or core purpose without acknowledging the change.

Preferred challenge shape:

```text
I notice this may shift the Working Thread.
Current boundary: V1 is skill-first and docs-backed; Core/MCP implementation is deferred.
Your new request moves toward implementing Core/MCP now.
Do you want to intentionally switch direction, or continue with the current V1 behavior design?
```

Reasoning:

- This preserves self-initiation and continuity without making Codex feel supervisory.
- The challenge is explainable because it points to the stored Working Thread boundary.
- The user remains in control because the challenge asks for confirmation rather than refusing.
- Using the LLM is appropriate for semantic drift, but the LLM must be constrained by explicit thread records and conservative thresholds.

Accepted wrap-up write-back strategy:

Use **layered wrap-up write-back**.

Default wrap-up writes only the fields needed to preserve judgment continuity:

```text
Last wrap-up
Current judgment
Boundary changes
Open questions
Next likely move
```

When the session contains a major direction change, rejected path, or decision that future sessions may need to understand, append lightweight decision context:

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

Reasoning:

- Normal sessions should stay quiet and compact.
- Significant turns should preserve enough context to prevent future drift or repeated debate.
- This keeps Working Thread records judgment-oriented instead of log-oriented.
- It supports both resume briefing and drift challenge without overloading future sessions.

Example normal wrap-up:

```text
Last wrap-up:
Confirmed impact-based drift challenge.

Current judgment:
LLM may judge semantic drift, but only against explicit Working Thread fields.

Next likely move:
Define wrap-up trigger behavior.
```

Example major-turn addition:

```text
Decision notes:
The project shifted from standalone agent/conductor toward an existing-agent self-initiation layer.

Rejected options:
V1 does not include delegation candidate, full Core/MCP, plugin packaging, Hermes adapter, or local/desktop surface.
```

## Key Open Questions

Continue from these questions, one at a time:

1. When should Codex trigger or suggest wrap-up?
   - Need to decide whether wrap-up is user-requested, agent-suggested, or automatic at phase boundaries.
   - This affects whether wrap-up feels companion-like or like another process checklist.

2. How exactly should Tiny Presence Capsule expand? **Deferred**
   - Current broad direction: Tiny Presence Capsule -> Presence Peek -> Working Thread.
   - `Hold it quietly` semantics are broadly accepted.
   - `Stay with this` semantics are broadly accepted: open a concise Thread Brief before conversation.
   - Thread Brief minimum contents are broadly accepted: title, current judgment, why now, boundary/next move.
   - Thread Brief expression is broadly accepted: short co-creator briefing, not dashboard/table/report.
   - Conversation entry after Thread Brief is broadly accepted: Along asks a co-creator prompt rather than showing a generic blank chat first.
   - Deferred because local/desktop presence is no longer the first-stage product center.

3. What is the minimum Working Thread UI needed to make conversation feel thread-based rather than generic chat? **Deferred**
   - Current direction: conversation is anchored by Thread Brief and starts from a co-creator prompt.
   - Ongoing conversation should default to a lightweight top thread anchor plus occasional in-stream state updates.
   - Deferred because V1 is now skill-first inside existing agent conversation, not a new Along UI.

4. How should user-initiated Working Thread creation appear? **Reframed**
   - input field?
   - `Start thread` action?
   - project/session entry?
   - conversation-first page?
   - Reframe this as: how does a user start a Working Thread inside an existing Codex session?

5. What does "cute but not desk pet" mean for presence? **Deferred**
   - visual motion?
   - soft copy?
   - small icon/state?
   - warmth without decorative mascot?

6. How should Along explain why it noticed something? **Partly reframed**
   - Current broad direction: one lightweight reasoning sentence in Presence Peek; full reasoning/evidence in Working Thread.
   - Reframe for V1 as: how much reasoning should the Codex skill show when it restores a Working Thread or issues a drift challenge?

7. When should a presence signal escalate to confirmation challenge? **Reframed**
   - Reframe for V1 as: when should the Codex skill actively challenge user drift rather than silently follow the user's new request?

8. How should Along avoid notification/inbox/task-manager feeling?

9. How should relationship modes be documented as future direction without pulling this pass into emotional simulation implementation?

## Recommended Next Step

Continue brainstorming before writing a formal spec.

The next immediate discussion should clarify the **docs-backed Working Thread record** for the skill-first V1:

- what fields the record must contain;
- how short the record should stay;
- what the Codex skill reads at session start/resume;
- what the Codex skill writes during wrap-up;
- what belongs in future `.along/` local state instead of project docs.

After the user approves the conceptual design, draft a formal spec:

`docs/superpowers/specs/2026-06-15-living-presence-and-explanation-design.md`

Do not write the spec until the remaining conceptual questions are sufficiently resolved.

## Visual Companion Sessions

Visual companion was used for rough mockups and may be restarted as needed.

Relevant visual concepts shown:

- first-screen simplicity options;
- chat placement variants;
- outer presence options.

`.superpowers/` remains a local runtime artifact and should not be committed.
