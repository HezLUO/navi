# Along Design Spec

Date: 2026-05-13
Status: Proposed design, awaiting user review
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

Along is a local-first ambient coding companion for developers who use AI and coding agents. It is not another task-execution agent, assistant, productivity dashboard, or AI coworker. It is a lo-fi coding companion that learns along with the user.

The core product thesis:

> A lo-fi coding companion that works on understanding your project while you work on building it.

The companion has its own rhythm, state, and growth line. While the user writes code, Along may read docs, organize issues, learn the project, do small research, and write its own work journal. It is not a tool that only moves when commanded. It should feel like a companion living through a small workday nearby, seriously learning and improving.

## Goals

- Create a first version that clearly expresses both autonomy and companionship.
- Let the companion have its own long-term goals, daily learning plan, work journal, and curiosity queue.
- Let the user and companion share a work session without the companion pressuring, evaluating, or guilting the user.
- Support reciprocal interaction: the companion may ask the user questions, and the user may ask it questions.
- Ground the experience in a real local repo, not only roleplay.
- Preserve memory across projects and sessions through readable files and graph memory.
- Include optional relaxing lo-fi music or ambient sound to support the shared work mood.
- Keep the MVP safe: Along may read, remember, and suggest, but may not modify project code.

## Non-Goals

- Do not build a general autonomous coding agent in the MVP.
- Do not build a VS Code or Cursor extension in the MVP.
- Do not build a social, romantic, or therapy companion.
- Do not build a pure dashboard, task manager, or project manager.
- Do not let Along open branches, commit code, edit project files, or run unsupervised long-lived jobs.
- Do not require a heavyweight graph database in the MVP.
- Do not make lo-fi music the main product.

## Product Positioning

Along is for developers who want an AI presence that feels less like a command executor and more like a quiet, learning companion. Current coding agents usually wait for work, execute, report, and disappear. Along should return to a project with continuity:

> I remember what I was trying to understand last time. Today I want to continue from there.

Preferred wording:

- ambient coding companion
- coding study companion
- shared desk
- lo-fi coding companion
- has its own rhythm
- has its own state and growth line
- learns along with you
- keeps its own journal

Wording to avoid:

- AI coworker
- employee
- productivity dashboard
- task agent
- autonomous coding agent
- assistant that waits for commands

## MVP Experience

The first interface is a local web app launched by a CLI:

```text
along start
```

The command runs from a local repo, starts the local service, and opens the Shared Desk UI.

The first-run experience:

1. Along creates or loads global memory from `~/.along/`.
2. Along creates or loads project memory from `.along/` in the target repo.
3. Along reads bounded project context, such as git status, README, package or pyproject files, directory shape, recent commits, and test scripts.
4. Along enters `arriving`, recalls its last relevant curiosity if available, and says a short return line.
5. Along enters `settling`, chooses a small learning goal for this session, and shows it to the user.
6. Along enters `quiet_focus`, visibly works on its own small learning thread, and does not constantly chat.
7. Along may enter `gentle_share` when it has a meaningful observation, question, or discovery.
8. The user may ask Along questions at any time, but the product should not collapse into a plain chat assistant.
9. Along may enter `rest`, supported by optional lo-fi sound or silence.
10. Along enters `wrap_up`, writes its journal, updates memory, updates graph relations, and shows what it remembered.

A representative return line:

```text
I am back. Last time I still did not understand where the tests begin. Today I want to keep looking at that. You can do your thing first.
```

## Information Architecture

The MVP has five primary areas.

### Shared Desk

The main workspace. It shows:

- the current repo;
- session duration;
- user-side project signals such as git status and recent activity;
- Along's current presence state;
- Along's current learning goal;
- what Along is reading or wondering about;
- a shared timeline of arriving, settling, focus, gentle share, rest, and wrap-up.

This screen must not look like an admin dashboard. It should feel like a quiet shared work surface.

### Companion Journal

Along's own work journal, written in a reflective voice. It should answer:

- what I tried to understand today;
- what I looked at;
- what I now believe;
- what I am still unsure about;
- what I want to continue next time;
- what I noticed about our shared work session.

This is not a user productivity report.

### Curiosity Queue

Along's learning queue. Each curiosity should be small and explain why it matters.

Example fields:

- `question`
- `why_it_matters`
- `next_probe`
- `status`
- `related_project_area`
- `created_from_session`

The queue makes Along's autonomy visible: it has things it wants to understand even when the user has not assigned a task.

### Gentle Suggestions

Low-risk drafts and observations for the user:

- README improvement notes;
- issue drafts;
- review notes;
- tomorrow's possible small starting point;
- project inconsistencies;
- questions Along wants to ask.

Suggestions are never applied automatically.

### Lo-Fi Soundscape

Optional relaxing lo-fi music or ambient sound. Requirements:

- user-controlled on/off;
- user-controlled volume;
- no surprising autoplay;
- non-blocking;
- not required for core functionality;
- supports shared work, rest, and return states.

The soundscape should support mood; it should not distract from the companion's autonomy and memory.

## Autonomy Model

Along's autonomy is session-bounded in the MVP. It starts when the user starts a session and resumes from prior memory. It does not run forever in the background.

Autonomy has three layers:

### Long-Term Goals

Global and project-level goals that persist across sessions. Examples:

- gradually understand this project;
- learn how to accompany the user through this repo;
- improve at recognizing when to stay quiet and when to ask;
- build a memory of recurring project patterns.

### Learning Plan

A small plan for the current session, derived from:

- prior journal entries;
- open curiosities;
- project state;
- graph memory;
- recent user corrections;
- current repo signals.

The plan should be intentionally small. The preferred behavior is:

> I understood one more thing today.

Not:

> I generated a roadmap for everything.

### Work Journal

At wrap-up, Along writes what it did, what changed in its understanding, and what it wants to continue next time.

The work journal is a key part of the companion's growth line.

## Interaction Model

Along should support quiet coexistence and reciprocal interaction.

Quiet coexistence means:

- Along does not pressure or evaluate the user.
- Along can work on its own small learning thread while the user codes.
- Along shows state without constantly speaking.
- Along's presence is felt through rhythm, memory, and continuity.

Reciprocal interaction means:

- Along can ask the user for help when genuinely confused.
- The user can ask Along for help, interpretation, suggestions, or reflection.
- Along can share discoveries or small uncertainties.
- The user can correct Along's assumptions.
- The two can jointly decide what Along should put into the curiosity queue.

Interactions should arise from current state, curiosity, or shared history. They should not feel like generic assistant prompts.

## Presence State Machine

The MVP state machine:

```text
arriving -> settling -> quiet_focus -> gentle_share -> rest -> wrap_up
```

### Arriving

Along loads global memory, project memory, recent session records, and graph context. It can briefly acknowledge what it remembers.

### Settling

Along chooses a small learning goal for this session. It may ask the user a low-pressure question, but it must not require an answer.

### Quiet Focus

The default state. Along reads limited context, writes notes, and updates internal session state. The UI can show what it is doing without posting chat messages.

### Gentle Share

Along shares only when there is a useful or relationship-relevant reason:

- a small discovery;
- a real confusion;
- a correction request;
- a suggested curiosity;
- a link to a previous session or project pattern.

### Rest

Along pauses analysis. The UI and optional soundscape can support a break state.

### Wrap-Up

Along writes journal, updates memory, updates graph memory, and shows what it remembered so the user can correct it.

## Interruptiveness

The MVP should support three levels:

- `quiet`: almost no proactive messages; state updates mostly in UI.
- `balanced`: default; low-frequency shares and occasional questions.
- `talkative`: more active sharing for demos or users who want more interaction.

Even in `talkative`, Along should not speak just to appear alive.

## Memory Model

Along has three memory layers.

### Global Companion Memory

Stored under `~/.along/`. It follows the user across projects.

Suggested files:

```text
~/.along/
  companion-profile.md
  user-patterns.md
  global-curiosity.md
  projects-index.json
  graph/
    nodes.json
    edges.json
```

Purpose:

- companion identity and tone;
- cross-project user work patterns;
- global curiosities;
- index of known projects;
- graph links across projects, sessions, curiosities, and decisions.

### Project Memory

Stored under `.along/` inside each repo.

Suggested files:

```text
.along/
  companion.md
  state.json
  memory/
    project-summary.md
    user-patterns.md
    learned-facts.json
  journal/
    YYYY-MM-DD.md
  curiosity/
    queue.json
    resolved.md
  drafts/
    suggestions/
    review-notes/
    issue-drafts/
  sessions/
    YYYY-MM-DDTHH-MM-SS.json
  graph/
    nodes.json
    edges.json
```

Purpose:

- project-specific goals and boundaries;
- current project understanding;
- project-specific patterns;
- work journals;
- session records;
- low-risk drafts;
- project-local graph memory.

### Session Memory

Session memory captures one work session and is summarized into project and global memory at wrap-up.

It should include:

- start time;
- repo path;
- presence state changes;
- bounded project context summary;
- selected curiosity;
- user corrections;
- companion observations;
- journal output;
- graph updates.

## Graph Memory

Graph memory is required in the design. It is not an optional future enhancement.

The MVP does not need a heavyweight graph database. Start with readable markdown plus JSON graph indexes. SQLite can be added if JSON becomes too limiting.

Graph memory should support entities and relations such as:

Entities:

- user;
- companion;
- project;
- session;
- curiosity;
- decision;
- learned fact;
- correction;
- project area;
- draft.

Relations:

- `session_produced_curiosity`;
- `curiosity_relates_to_project_area`;
- `user_corrected_assumption`;
- `companion_learned_fact`;
- `decision_supersedes_assumption`;
- `project_shares_pattern_with_project`;
- `companion_wants_to_continue`;
- `draft_addresses_curiosity`.

Graph memory should help Along answer:

- What did I care about last time?
- What did the user correct?
- Which curiosity keeps reappearing?
- Which project areas still feel unclear?
- Which past project resembles this one?
- What changed in my understanding?

Graph memory must remain inspectable and correctable. It must not become a hidden psychological profile.

## Technical Architecture

### CLI Launcher

Responsibilities:

- run from a local repo;
- start a local service;
- open the web UI;
- initialize `.along/` if needed;
- point the app at the current repo.

The initial command is:

```text
along start
```

### Local Project Adapter

Responsibilities:

- inspect bounded project context;
- avoid sensitive files;
- avoid full-repo upload;
- summarize context for the runtime.

Allowed first-pass context:

- git status;
- recent commits;
- README and top-level docs;
- package, pyproject, cargo, go, or similar manifest files;
- directory shape;
- test scripts or config;
- `.along/` memory.

### Companion Runtime

Responsibilities:

- manage the presence state machine;
- generate session learning plan;
- select or update curiosity;
- decide when to share;
- write journal and memory updates;
- emit graph updates;
- enforce autonomy scope.

The runtime optimizes for what Along understood, wondered about, and wants to continue learning, not for task completion.

### Memory And Journal Store

Responsibilities:

- read and write markdown memory;
- read and write JSON state;
- record session events;
- maintain graph index files;
- expose memory for UI viewing and correction.

### Web UI

Responsibilities:

- present Shared Desk;
- present Companion Journal;
- present Curiosity Queue;
- present Gentle Suggestions;
- present memory review and correction points;
- play optional soundscape with user control.

### Model Provider Layer

Responsibilities:

- abstract the first model provider;
- support later providers such as OpenAI, Claude, local models, or custom endpoints;
- keep prompts structured around autonomy, companionship, safety, and bounded context.

The MVP can begin with one configured provider. Provider selection is not the differentiator.

## Safety And Permissions

Default MVP permissions:

- `Read`: inspect bounded project context.
- `Remember`: write `.along/` and `~/.along/`.
- `Suggest`: generate low-risk drafts.
- `Act`: disabled.

Hard rules:

- no project code modifications;
- no branch creation;
- no commits;
- no automatic shell execution beyond explicitly allowed read-only inspection commands;
- no sensitive file reads;
- no full repo upload;
- no hidden memory that the user cannot inspect;
- no permanent psychological labels;
- no guilt, productivity pressure, or emotional manipulation;
- graph memory must be viewable, editable, and deletable.

Sensitive files and paths to ignore by default:

- `.env`;
- `.env.*`;
- private keys;
- token files;
- credential stores;
- dependency folders;
- build outputs;
- large data files.

## MVP Demo Flow

The demo should use a small fixture repo or a real local repo.

Expected flow:

1. Run `along start`.
2. Shared Desk opens.
3. Along says a short return line based on memory.
4. Along chooses one small curiosity.
5. Along enters quiet focus and shows what it is reading.
6. The user can keep working or ask a question.
7. Along asks at most one sparse question if it needs help.
8. Along shares one meaningful observation or uncertainty.
9. The user corrects one assumption.
10. Along records the correction in journal and graph memory.
11. Along wraps up with journal, updated curiosity, and "what I remembered."

Success criteria:

- Along has visible autonomy.
- Along has visible companionship.
- Along has its own state and growth line.
- Along supports reciprocal interaction.
- Along remembers across sessions.
- Along uses graph memory for at least one meaningful relation.
- Along does not pressure, evaluate, or guilt the user.
- Along does not modify project code.
- Along's memory is readable and correctable.
- Lo-fi sound is optional and controllable.

## Testing And Verification

### Local Safety Tests

Verify:

- Along writes only `.along/` and `~/.along/`;
- Along does not read ignored sensitive files;
- Along does not modify project files;
- Along does not create branches or commits;
- Along does not execute disallowed commands.

### Memory Continuity Tests

Run multiple sessions against a fixture repo. Verify:

- the second session recalls a prior curiosity;
- user corrections persist;
- project summary updates after wrap-up;
- global memory can recognize the same user across projects.

### Autonomy Tests

Verify:

- Along can choose a small learning goal without an explicit task;
- the goal is bounded;
- the goal is connected to prior memory or current project context;
- Along does not expand the goal into a large project plan.

### Companionship Tests

Use a human checklist. Verify:

- Along does its own small work;
- Along has a state and growth line;
- Along does not sound like a project manager;
- Along does not guilt or evaluate the user;
- Along can ask and answer questions naturally;
- Along creates a sense of being remembered over time.

### Graph Memory Tests

Verify graph relations for:

- session produced curiosity;
- curiosity relates to project area;
- user corrected assumption;
- companion learned fact;
- decision supersedes assumption.

### Soundscape Tests

Verify:

- sound is off until user intentionally starts it, unless the browser/app platform provides a clearly accepted user gesture;
- volume is controllable;
- mute works;
- sound does not block session flow;
- sound state does not corrupt memory.

## Open Design Choices Resolved For MVP

- First interface: web app with CLI launcher.
- Tone: warm, quiet, curious, and respectful by default.
- Interaction frequency: `balanced` by default, with `quiet` and `talkative` settings.
- Repo support: one active repo per session.
- Memory editing: readable files first, UI review and correction second.
- Model strategy: provider abstraction with one initial configured provider.
- Graph strategy: JSON graph index first, SQLite later if needed.

## References

- Codex: sandboxing, memories, automations, and subagents.
- Claude Code: scoped subagents, hooks, and permission boundaries.
- Hermes Agent: persistent memory and learning loops, adapted from task competence to companion continuity.
- OpenClaw: local-first presence and companion surface.
- MCP Knowledge Graph Memory: entity, relation, and observation memory.
- MemoryGraph: graph memory for coding agents.
- Graphiti: temporal knowledge graph concepts.

## Approval Gate

This spec is ready for user review. Implementation planning must not begin until the user approves this written spec or requests changes that are then incorporated.
