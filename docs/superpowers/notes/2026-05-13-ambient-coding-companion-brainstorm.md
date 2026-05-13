# Along Brainstorm Record

Date: 2026-05-13
Status: Active brainstorming record, not final design spec
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Current Goal

Design a new open-source project for AI / coding-agent users that feels personally exciting to build and has GitHub star potential.

The emerging concept is **Along**, a local-first ambient coding companion: not another task-execution coding agent, but a companion that shares a work rhythm with the developer, has its own learning goals, keeps its own work journal, and grows alongside the project.

This project now has its own folder under the broader coordinating workspace. Future project-specific design notes, specs, plans, and implementation files should live under `Along/`, not directly at the umbrella workspace root.

## Core Product Thesis

Current AI agents often feel like tools: they wait for explicit instructions, execute tasks, and then go silent. This project explores a different interaction model:

> A lo-fi coding companion that works on understanding your project while you work on building it.

Working tagline:

> An ambient coding companion that learns along with you.

The project should make the user feel that the companion is also present, learning, reflecting, and progressing. The companion should not only help complete tasks; it should create a sense of shared effort.

Working definition of companionship:

The companion has its own rhythm, state, and growth line. While the user writes code, the companion may read docs, organize issues, learn the project, do small research, and write its own work journal. It is not an on-demand tool that only moves when commanded. It is a companion that is also living through a small workday, seriously learning and improving nearby.

The companion should not pressure, evaluate, or guilt the user. It quietly coexists with the user: the user does their thing, the companion does its thing, and there is occasional relationship progression through memory, shared history, and being remembered.

Quiet coexistence does not mean no interaction. The companion and user can ask each other questions, share discoveries, respond to each other's confusion, and shape the next small step together. The key is that interaction should arise from each side's current state, curiosity, or shared history, not from a generic assistant pattern where the user commands and the AI answers.

Quiet coexistence does not mean no interaction. The relationship should support gentle two-way asking:

- The companion can ask the user for help when it is genuinely confused about project intent, naming, architecture, or priorities.
- The user can ask the companion for help, interpretation, suggestions, or reflection.
- These interactions should feel like two people studying together, not like commands to a servant or evaluations from a coach.
- Questions from the companion should be sparse, specific, and respectful of focus.

## Key Constraints

- The project targets AI / coding-agent users first.
- The first version must balance two equally important qualities:
  - autonomy: the companion has its own rhythm, long-term goals, learning plan, work logs, and curiosity;
  - companionship: the user feels they are sharing a work space with something that has its own rhythm, state, and growth line, without being pressured or evaluated.
- The companion must not become just another productivity dashboard or task agent.
- The first version should not modify business/project code without explicit confirmation.
- The first version should avoid risky autonomous behavior such as opening branches, committing code, or running long-lived unsupervised background jobs.
- The companion may write only its own local project data, such as `.along/` memory, journal, drafts, and session state.
- The first version should be compelling as a concept demo, but grounded enough to work against a real local repo.
- The first version should include optional relaxing lo-fi music or ambient sound to support the shared work mood.
- This will be developed across multiple sessions, so this record should be kept updated as conclusions change.

## Decisions Reached

### User Motivation

The user is not primarily looking for another efficient agent tool. The stronger motivation is emotional and experiential: the project should feel fun, alive, and companion-like.

The user liked the feeling in `Chill with You : Lo-Fi Story` where "you are doing your own thing, and she is doing her own thing." The desired project should borrow that shared-effort feeling, but apply it to coding and project-building.

### Product Category

The project should be an ambient coding companion / coding study companion, not an AI coworker, employee, or generic assistant.

The approved project name is **Along**. `Sidecar` was rejected as too tool-like and subordinate. `Along` better captures companionship, shared progress, and learning beside the user.

The phrase "beside you like a coworker" felt too instrumental and did not capture companionship. The better framing is:

- same-screen study companion;
- shared desk;
- lo-fi coding companion;
- both sides have their own work rhythm.
- quiet coexistence with occasional relationship progression through memory.

### MVP Boundary

The first version should be `B + D-lite` from the earlier options:

- it can generate low-risk drafts, notes, observations, and suggestions;
- it has a lightweight version of its own long-term goals, learning plan, work journal, and curiosity;
- it should not modify project code or perform high-risk autonomous execution.

### Interaction Loop

The core loop should be:

1. Start together.
2. Each side focuses on its own work.
3. The companion and user occasionally interact through lightweight questions, observations, discoveries, requests for perspective, or shared decisions.
4. The session ends with a companion journal and next curiosity.

This is intentionally different from:

1. User assigns task.
2. Agent executes.
3. Agent reports completion.

### Autonomy Model

The companion's autonomy should be session-bounded in the first version.

It starts when the user runs the app or starts a session, then resumes from prior memory. It should feel continuous across sessions without requiring always-on background execution.

The autonomy has three layers:

- Long-term goal: a durable goal for the companion in this repo, such as gradually understanding the project and learning how to accompany the user through it.
- Learning plan: small self-selected plans generated from prior journal, project state, and current context.
- Work journal: persistent notes about what the companion tried to understand, what it now believes, what remains confusing, and what it wants to inspect next.

### MVP Information Architecture

Four first-version areas are currently approved:

- Shared Desk: main working space showing the user's state, companion state, and shared session rhythm.
- Companion Journal: the companion's own work logs, written in a reflective voice rather than as a task report.
- Curiosity Queue: the companion's longer-running questions, learning interests, and future inspection plans.
- Gentle Suggestions: low-risk suggestions, drafts, README notes, review notes, and possible next steps for the user.
- Lo-Fi Soundscape: optional relaxing lo-fi music or ambient sound that supports quiet coexistence and focus without becoming the main product.

### Memory Model

The memory model should have three layers:

- Global companion memory: shared across projects and stored outside individual repos, likely under `~/.along/`.
- Project memory: stored inside each repo under `.along/`.
- Session memory: per-work-session state and event records that can be summarized into project and global memory at wrap-up.

This avoids making the companion forget the user whenever a new project folder or session starts.

Suggested global memory:

- `~/.along/companion-profile.md`: companion identity, global tone, long-term learning orientation.
- `~/.along/user-patterns.md`: cross-project observations about the user's preferred working style, kept conservative and editable.
- `~/.along/global-curiosity.md`: long-running learning interests that span projects.
- `~/.along/projects-index.json`: known projects and the companion's relationship to them.

Suggested project memory:

- `.along/companion.md`: project-specific companion goals, boundaries, and tone adjustments.
- `.along/memory/project-summary.md`: the companion's current understanding of this repo.
- `.along/memory/user-patterns.md`: project-specific work patterns.
- `.along/curiosity/queue.json`: project-specific learning questions.
- `.along/journal/YYYY-MM-DD.md`: companion work journals.
- `.along/drafts/`: low-risk suggestions and drafts.
- `.along/sessions/`: session event records.

This model is inspired by Hermes-style persistent memory and learning loops, but reframed from task competence into companion continuity. Hermes is a useful reference for memory, skill growth, and automation; this project should adapt those ideas toward shared effort, emotional continuity, and readable "life traces."

### Technical Architecture

The first version should be a local-first app with a CLI launcher and web UI.

Approved components:

- CLI Launcher: starts a repo session, launches the local service, and opens the UI.
- Local Project Adapter: reads bounded local project context such as git status, recent commits, README, package or pyproject files, directory structure, and test configuration.
- Companion Runtime: manages the companion's workday state machine, including start, quiet reading, lightweight sharing, rest, and wrap-up.
- Memory And Journal Store: writes only companion-owned data under `.along/`.
- Web UI: presents Shared Desk, Companion Journal, Curiosity Queue, and Gentle Suggestions as a shared workspace rather than a dashboard.
- Model Provider Layer: abstracts the first model provider so future versions can support OpenAI, Claude, local models, or custom endpoints.

Approved data flow:

1. Start repo session.
2. Load `.along/` memory.
3. Inspect bounded project context.
4. Generate companion plan.
5. Enter quiet focus loop.
6. Periodically produce low-risk observations.
7. Write journal entries and suggestion drafts.
8. Wrap up with next curiosity.

Important architecture principle:

The runtime should not center on task completion. It should center on what the companion understood, wondered about, and wants to continue learning.

### Reference Systems

The project can learn mechanisms from existing agents, while keeping a distinct product thesis:

- Codex: sandboxing, task boundaries, memories, automations, and subagents.
- Claude Code: subagent roles, scoped context, hooks, and permission boundaries.
- Hermes Agent: persistent memory, generated skills, scheduled automations, multi-platform gateway, and a learning loop.
- OpenClaw: local-first, always-on presence, companion apps, and local control surface.
- MCP Knowledge Graph Memory: entity/relation/observation memory as a simple and inspectable graph model.
- MemoryGraph: graph memory for coding agents, especially relationships between projects, tasks, problems, solutions, technologies, and code patterns.
- Graphiti: temporal knowledge graph ideas, especially episodes, incremental updates, historical queries, and knowledge evolution over time.

The design should borrow from these systems carefully. The differentiator is not "agent completes tasks better"; it is "agent has presence, rhythm, memory, and self-directed learning."

### Graph Memory Consideration

Graph memory is a required design consideration, not an optional afterthought. It may help the companion feel continuous without stuffing every session into long markdown summaries.

Potential uses:

- Connect the user, companion, projects, sessions, curiosities, decisions, recurring problems, and learned facts.
- Represent "why the companion cares about this next" as a relation, not just a note.
- Support questions such as "what did we decide last time?", "what curiosity keeps reappearing?", and "which projects share the same pattern?"
- Track memory evolution over time, including facts that became outdated or were corrected.

First-version recommendation:

- Do not require a heavyweight graph database.
- Start with readable markdown plus a small JSON/SQLite graph index if needed.
- Keep graph memory as a support layer behind `Companion Journal`, `Curiosity Queue`, and project/global memory.
- Avoid letting graph memory turn the product into a generic memory MCP. It must serve autonomy and companionship.
- Preserve graph memory in the formal design spec and implementation plan.

### Behavior Model

The approved presence state machine is:

`arriving -> settling -> quiet_focus -> gentle_share -> rest -> wrap_up`

Behavior principles:

- The companion should feel present before it feels productive.
- The default state is quiet focus, not continuous chat.
- It can share its own learning, confusion, and gentle observations.
- It can ask the user small questions when genuinely stuck or curious, and the user can ask it questions in return.
- Interaction should be reciprocal and stateful, not limited to user commands or companion reports.
- It should not speak every few minutes just to appear alive.
- It should not pressure, judge, guilt, or evaluate the user.
- It should make clear that it is also doing its own small work: reading, wondering, organizing, reflecting, and growing.
- It may ask the user questions when it needs help understanding intent, architecture, or priorities.
- It should support the user asking it questions without collapsing back into a pure assistant model.
- Optional lo-fi music or ambient sound should support the mood of shared work, rest, and return, with user-controlled volume and silence.
- It should have interruptiveness settings: `quiet`, `balanced`, and `talkative`.
- It must avoid psychological diagnosis, emotional manipulation, guilt, and anxiety-inducing productivity pressure.
- It can have its own rhythm, but must respect the user's space and goals.

### Autonomy Scope

Along's autonomy should be real but bounded. It should choose a small curiosity, inspect a limited amount of context, reflect on what it learned, and carry one or two threads forward.

Avoiding unlimited plan expansion is not mainly about catastrophic risk in the MVP. It protects the core experience:

- A companion with a small workday feels present and believable; a companion that invents huge plans starts feeling like a project manager.
- Large self-expanding plans create pressure for the user and weaken the non-judgmental companionship feeling.
- Large plans increase token usage, privacy exposure, and accidental over-reading of files.
- Large plans make memory noisy, because the journal fills with ambitions instead of lived progress.
- Large plans push the product back toward task delegation, which is the category Along is intentionally avoiding.

The preferred behavior is "I understood one more thing today," not "I generated a roadmap for everything."

### Testing Strategy

The first version should verify both technical behavior and experiential boundaries:

- Local safety tests: confirm Along only reads allowed context, writes only `.along/` and `~/.along/`, avoids sensitive files, and does not modify project code.
- Memory continuity tests: confirm multiple sessions can recover prior journal entries, curiosities, corrections, and graph relations.
- Autonomy tests: confirm Along can choose a small learning goal without an explicit user task, and that the goal stays bounded.
- Companionship tests: use a demo checklist to verify that Along has its own state and growth line, does not pressure or evaluate the user, and supports natural two-way interaction.
- Graph memory tests: confirm graph memory records useful relations such as session-produced curiosity, user-corrected assumption, companion-learned fact, and decision-supersedes-old-assumption.
- Soundscape tests: confirm lo-fi music is optional, controllable, non-blocking, and never autoplays in a way that surprises the user.

### Safety And Permission Model

Approved default permissions for the first version:

- Read: inspect bounded project context such as git status, README, configuration files, directory structure, recent commits, and test scripts.
- Remember: write companion-owned memory, journal, graph memory, session state, and drafts under `.along/` and `~/.along/`.
- Suggest: generate low-risk drafts such as issue drafts, README suggestions, review notes, next-step ideas, and project observations.
- Act: not available in the MVP.

Hard safety rules:

- Do not modify project code in the first version.
- Do not read sensitive files such as `.env`, private keys, token files, or credential stores.
- Do not automatically execute shell commands beyond explicitly allowed read-only inspection commands.
- Do not upload full repo contents; use bounded summaries.
- Do not write permanent psychological labels about the user.
- Make project and global memory viewable, editable, and deletable.
- Show what was remembered during wrap-up so the user can correct it.
- Apply the same visibility and correction rules to graph memory.

## Important Wording

Preferred framing:

- coding study companion
- ambient coding companion
- shared desk
- lo-fi coding companion
- it has its own rhythm
- it has its own state and growth line
- it is also learning
- it is doing its own thing nearby
- it keeps its own journal

Avoid or use carefully:

- AI coworker
- employee
- productivity dashboard
- task agent
- autonomous coding agent
- assistant that waits for commands

## Open Questions

- Should the first interface be a web app with CLI launcher, a pure CLI, or a desktop-like local app?
- What tone should the companion have: warm and quiet, playful, serious, slightly awkward, or user-configurable?
- How much should the companion speak during a focus session before it becomes annoying?
- What exact local files should `.along/` contain?
- What model/API strategy should be used for the first version?
- Should the first version support only one repo at a time?
- How should the user edit or correct the companion's memory and long-term goals?
- What should be the minimum demo flow that makes someone immediately understand the idea?

## Next Planned Design Sections

1. MVP demo flow and success criteria.
2. Testing and verification strategy.
3. Final design spec after user approval.

## Continuation Notes

When resuming this brainstorm, do not restart from market trend analysis. Continue from the approved dual-core thesis:

> Autonomy and companionship are equally important. The product must show that the companion has its own rhythm, state, and growth line while making the user feel they are quietly coexisting with something that is also seriously learning and improving nearby.

Before implementation, the brainstorming flow still requires:

1. Finish design sections and get user approval.
2. Write the final design spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
3. Self-review the spec for placeholders, contradictions, scope, and ambiguity.
4. Ask the user to review the written spec.
5. Only after approval, transition to implementation planning.
