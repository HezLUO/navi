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

## Key Open Questions

Continue from these questions, one at a time:

1. How exactly should Tiny Presence Capsule expand?
   - Current broad direction: Tiny Presence Capsule -> Presence Peek -> Working Thread.
   - `Hold it quietly` semantics are broadly accepted.
   - `Stay with this` semantics are broadly accepted: open a concise Thread Brief before conversation.
   - Thread Brief minimum contents are broadly accepted: title, current judgment, why now, boundary/next move.
   - Thread Brief expression is broadly accepted: short co-creator briefing, not dashboard/table/report.
   - Conversation entry after Thread Brief is broadly accepted: Along asks a co-creator prompt rather than showing a generic blank chat first.
   - Still needs concrete design for peek content and final action wording.

2. What is the minimum Working Thread UI needed to make conversation feel thread-based rather than generic chat?
   - Current direction: conversation is anchored by Thread Brief and starts from a co-creator prompt.
   - Ongoing conversation should default to a lightweight top thread anchor plus occasional in-stream state updates.
   - Still needs concrete design for controls and delegation affordances.

3. How should user-initiated Working Thread creation appear?
   - input field?
   - `Start thread` action?
   - project/session entry?
   - conversation-first page?

4. What does "cute but not desk pet" mean for presence?
   - visual motion?
   - soft copy?
   - small icon/state?
   - warmth without decorative mascot?

5. How should Along explain why it noticed something?
   - Current broad direction: one lightweight reasoning sentence in Presence Peek; full reasoning/evidence in Working Thread.
   - Still needs concrete design for how much evidence appears by default inside the Working Thread.

6. When should a presence signal escalate to confirmation challenge?

7. How should Along avoid notification/inbox/task-manager feeling?

8. How should relationship modes be documented as future direction without pulling this pass into emotional simulation implementation?

## Recommended Next Step

Continue brainstorming before writing a formal spec.

The next immediate discussion should continue clarifying **Tiny Presence Capsule -> Presence Peek -> Working Thread**:

- what the Presence Peek should contain;
- exact co-creator action wording;
- concrete Working Thread controls and delegation affordances after the co-creator prompt;
- how `Adjust quietness` should work later, without making the default flow feel like reminders;
- how this differs from chat messages and automation reminders.

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
