# Memory v2 Brainstorm Record

Date: 2026-05-15
Status: Active brainstorming record, not final design spec
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Current Goal

Design Along Memory v2.

The immediate priority is to make Along's memory real and useful across sessions and projects, while preserving the product thesis that Along is a lo-fi coding companion with its own rhythm, state, and growth line.

Approved direction:

> Prioritize making current Along memory real, but use companionship/product judgment and theoretical structure from cognitive science, Hermes-style learning loops, Claude-style readable memory, and MCP-style graph memory.

## Current Implementation Facts

Along MVP is implemented and pushed to GitHub:

```text
https://github.com/HezLUO/along
```

Latest known implementation cleanup commit:

```text
89e37a64a8ad137dbab1a6945e407f52e889576d
```

Current memory implementation:

- Project memory is initialized and used under `.along/`.
- Project session files are written under `.along/sessions/`.
- Project journals are written under `.along/journal/`.
- Project curiosity queue is read and written under `.along/curiosity/queue.json`.
- Project graph memory is written under `.along/graph/nodes.json` and `.along/graph/edges.json`.
- Global memory files are initialized under `~/.along/`.

Important limitation:

- Cross-session memory within the same project partially works through project curiosity, sessions, journals, and graph files.
- Cross-project memory is mostly scaffolding. The runtime initializes `~/.along/`, but does not yet use global memory to influence recall, planning, or cross-project continuity.
- Hermes-style learning loops are reflected in the design, but not yet implemented as real procedural memory or skill distillation.
- Journal files currently use `YYYY-MM-DD.md`; same-day multiple wrap-ups may overwrite earlier entries.

## Key Product Constraints

- Memory must serve both autonomy and companionship.
- Memory must not make Along feel like a productivity dashboard, project manager, or task executor.
- Memory must help Along feel like it has its own rhythm, state, and growth line.
- Memory should support reciprocal interaction: Along can ask the user questions, and the user can ask Along questions.
- Memory must remain readable, inspectable, editable, and deletable.
- Graph memory is required, not optional.
- Memory must avoid hidden psychological profiling, emotional manipulation, guilt, or pressure.
- User-facing settings may allow different memory intimacy levels, but the default must be conservative, transparent, reviewable, and reversible.
- Along should remember共同经历, corrections, decisions, curiosities, and stable project facts, not just summarize chats.
- Along should not stuff all memory into every prompt; it should build a small recall packet.

## External References And What To Borrow

### Hermes Agent

Useful ideas:

- Persistent memory across sessions.
- Learning loop: observe, distill, reuse, refine.
- Procedural memory or skill candidates from repeated successful behavior.

How Along should adapt it:

- Hermes tends toward task competence and automation.
- Along should adapt the loop toward companion continuity, shared effort, and visible growth.
- Along should not automatically execute generated skills in Memory v2; it should first create skill candidates.

### Claude Code Memory

Useful public ideas:

- Readable markdown memory.
- Repo/user/project memory layering.
- Human-editable memory files.
- Session lifecycle hooks such as start, end, and pre-compact style consolidation.
- Subagents or roles can have scoped memory.

Current caveat:

- "Dream Loop" is not clearly documented as an official Claude Code feature in public docs, but the concept is useful as a design pattern: low-frequency memory consolidation after active work.

How Along should adapt it:

- Use a dream/consolidation loop as a lifecycle process, not as a mysterious hidden background behavior.
- Keep outputs visible and correctable.

### MCP Graph Memory

Useful ideas:

- Entity / relation / observation model.
- Graph memory can encode why a memory matters and what it connects to.

How Along should adapt it:

- Use graph memory for sessions, curiosities, corrections, learned facts, project areas, decisions, and cross-project patterns.
- Do not turn Along into a generic memory MCP server.
- Graph memory must support companionship and autonomy.

### Cognitive Science / Neuroscience

Useful mental model:

- Working memory: current session.
- Episodic memory: shared experiences.
- Semantic memory: stable facts.
- Procedural memory: reusable ways of doing things.
- Consolidation: transforming episodes into stable knowledge over time.

How Along should adapt it:

- Treat raw sessions as episodes.
- Distill stable facts and relationship continuity during wrap-up or low-frequency consolidation.
- Keep raw and consolidated memory separate so mistakes can be corrected.

## Approved Memory Layer Model

Memory v2 should have six conceptual layers:

1. **Working Memory**
   - Current session state.
   - Current curiosity.
   - Current presence state.
   - Recent user corrections.
   - Stored mainly in runtime and `.along/sessions/<session>.json`.

2. **Episodic Memory**
   - Shared experiences: what Along and the user did together.
   - Includes meaningful events, corrections, decisions, questions, and emotional/product context when safe and explicit.
   - Must not become hidden chat logs or psychological labels.

3. **Semantic Memory**
   - Stable facts about projects, user workflow preferences, known commands, module responsibilities, and established decisions.
   - Comes from consolidation, not arbitrary overwriting.

4. **Graph Memory**
   - Entities and relations.
   - Tracks sessions, curiosities, project areas, learned facts, corrections, decisions, drafts, and cross-project patterns.
   - Should help answer: what did we decide, what changed, what keeps recurring, what should Along continue?

5. **Procedural Memory**
   - Reusable ways Along has learned to behave or work.
   - Inspired by Hermes skills.
   - Memory v2 should produce skill candidates, not auto-executing skills.

6. **Companion Continuity Memory**
   - Along-specific layer for companionship and growth line.
   - Tracks how Along should stay present without pressure, what relationship continuity exists, what rhythm worked, and what it wanted to continue.
   - Must be conservative, visible, editable, and non-manipulative.

## Proposed Memory Flow

The emerging Memory v2 flow:

```text
session
-> episode
-> consolidation
-> semantic / graph / procedural / continuity updates
-> recall packet
```

Along should not load all memory into context. It should build a small recall packet at session start:

- What Along cared about last time in this project.
- Stable project facts.
- User corrections that should prevent repeated mistakes.
- Relevant cross-project patterns.
- One small curiosity to continue.
- Guidance for the right companionship rhythm.

## Approved Data Model Direction

Memory v2 should remain readable-first:

- Markdown stores user-readable life traces, journals, summaries, and continuity notes.
- JSON stores machine-readable episodes, facts, corrections, indexes, queues, and graph data.
- Graph memory stores relations between sessions, curiosities, corrections, learned facts, decisions, project areas, and cross-project patterns.
- SQLite is deferred until JSON becomes painful enough to justify it.

Approved project memory layout:

```text
.along/
  companion.md
  state.json
  sessions/
    2026-05-15T10-30-00.json
  episodes/
    2026/
      2026-05-15T10-30-00.md
      2026-05-15T10-30-00.json
  journal/
    2026-05-15.md
  memory/
    project-summary.md
    semantic-facts.json
    user-corrections.json
    companion-continuity.md
  curiosity/
    queue.json
    resolved.md
  procedures/
    skill-candidates.json
    accepted.md
  graph/
    nodes.json
    edges.json
  recall/
    latest.json
```

Approved global memory layout:

```text
~/.along/
  companion-profile.md
  user-patterns.md
  companion-continuity.md
  global-curiosity.md
  projects-index.json
  episodes-index.json
  memory/
    semantic-facts.json
    user-corrections.json
  procedures/
    skill-candidates.json
    accepted.md
  graph/
    nodes.json
    edges.json
  recall/
    latest-global.json
```

Important distinction:

- `sessions/` are raw runtime state.
- `episodes/` are shared experiences.
- `journal/` is Along's reflective voice.
- `semantic-facts.json` stores stable facts only after consolidation.
- `user-corrections.json` prevents repeated mistakes.
- `companion-continuity.md` stores conservative relationship and rhythm continuity.
- `procedures/` stores Hermes-inspired skill candidates without auto-execution.
- `recall/` stores generated recall packets, not permanent truth.

## Open Questions

- What exact files should Memory v2 add or change under `.along/` and `~/.along/`?
- Should episodic memory be markdown-first, JSON-first, or both?
- Should graph memory stay JSON-only, or move to SQLite now?
- How should consolidation be triggered: every wrap-up, explicit command, scheduled local job, or after N sessions?
- How should the user review and correct memory updates?
- What should count as procedural memory versus ordinary notes?
- How should Along prevent stale or incorrect semantic facts from persisting?
- How should cross-project memory choose what is relevant without over-sharing or overfitting?
- How visible should companion continuity memory be in the UI?
- Should Memory v2 include a CLI command such as `along memory review`?
- What memory intimacy / inference-depth settings should exist, and which memory types require explicit user approval at each level?

## Emerging Consent, Memory Intimacy, And Agent Mode Model

The user clarified that strong user inferences may be worth remembering depending on the chosen agent mode. The design should not treat strong judgments as absolutely forbidden. Instead, it should separate default behavior from opt-in modes.

Directionally approved:

- Default should remain conservative.
- Any setting that allows deeper personal inference or stronger judgments must be explicit.
- The user must be able to inspect, edit, delete, and disable these memories.
- Along should prefer concrete preferences and observed interaction patterns in default mode, but deeper modes may allow stronger interpretations when the user explicitly chooses that mode.
- Sensitive memories should keep source episodes and confidence levels.
- Strong judgments should be stored separately from facts, labeled as interpretations, and gated by mode.

Possible settings:

- `minimal`: remember only project facts, explicit corrections, and active curiosities.
- `balanced`: additionally remember explicit work preferences and interaction rhythm.
- `close`: additionally allow user-approved companion continuity notes about motivation, preferred support style, and recurring emotional context.
- `reflective`: allow richer reflective memory and stronger interpretations, but require review before use.
- `challenger`: allow Along to remember and use stronger judgments for candid feedback and challenge, but only within explicit user-approved boundaries.

Even at higher levels, Along should avoid manipulative behavior and should never use memory to pressure, guilt, or covertly steer the user.

Important distinction:

- Facts: stable, externally grounded statements.
- Preferences: user-expressed working style and interaction choices.
- Corrections: user corrections to Along's assumptions.
- Interpretations: Along's inferred understanding of patterns or motivations.
- Strong judgments: higher-impact interpretations about the user's tendencies, risks, or recurring patterns.

Strong judgments may exist in `reflective` or `challenger` mode, but they must include source episodes, confidence, review status, expiry or revisit date, and a clear rule for how Along is allowed to use them.

## Approved Graph Memory Schema Direction

Graph memory should make time, source, confidence, intimacy, and review status first-class.

Approved node types:

- `user`
- `companion`
- `project`
- `session`
- `episode`
- `curiosity`
- `project_area`
- `learned_fact`
- `correction`
- `decision`
- `preference`
- `continuity_note`
- `procedure_candidate`
- `draft`

Approved edge types:

- `session_created_episode`
- `episode_produced_curiosity`
- `episode_supported_fact`
- `episode_recorded_correction`
- `episode_created_preference`
- `episode_created_continuity_note`
- `curiosity_relates_to_project_area`
- `correction_invalidates_fact`
- `decision_supersedes_assumption`
- `fact_about_project_area`
- `preference_applies_to_interaction`
- `continuity_note_guides_rhythm`
- `procedure_candidate_derived_from_episode`
- `project_shares_pattern_with_project`

Long-term memory nodes should include metadata:

- `scope`: `session | project | global`
- `sourceEpisodeIds`
- `confidence`: `inferred_low | inferred_medium | explicit`
- `memoryIntimacy`: `minimal | balanced | close | reflective | challenger`
- `status`: `active | superseded | rejected | archived`
- `visibility`: `user_visible | internal_runtime`
- `reviewStatus`: `auto_approved | pending_review | approved | rejected`
- `createdAt`
- `updatedAt`

Approval rules:

- Minimal explicit project facts can be auto-approved.
- User corrections can be auto-approved but must remain visible.
- Balanced preferences can be auto-approved only when explicit.
- Close continuity notes are pending review by default.
- Reflective and challenger memories are pending review by default and must include usage boundaries.
- Identity-level judgments should be avoided by default and only allowed in explicitly selected modes.

## Approved Cross-Project Memory Direction

Cross-project memory should not carry project-specific facts from one repo into another repo as truth. It should carry continuity, constraints, and weak patterns.

Allowed cross-project memory categories:

1. User-level continuity:
   - Explicitly expressed work preferences.
   - Interaction boundaries.
   - Documentation preferences.
   - Examples: design-first workflow, avoid pressure, document key decisions for context compaction.

2. Companion-level continuity:
   - Along's self-guidance for how to behave better with the user.
   - Examples: ask sparse questions during design flow; preserve emotionally important wording; keep memory updates visible.

3. Cross-project pattern memory:
   - Reusable weak hints across projects.
   - Examples: previous projects used `docs/superpowers/specs` as source of truth; README may lag behind actual project state.
   - Must be used as `hint_not_fact`.

Disallowed by default:

- Treating another project's local facts as true in the current repo.
- Hidden psychological judgments.
- Unreviewed close, reflective, or challenger memories.
- Stale project assumptions.

New-project recall packet should include:

- global preferences;
- companion continuity;
- possibly relevant patterns with `useAs: "hint_not_fact"`;
- blocked memories that require review.

## Approved Procedural Memory Direction

Procedural memory should produce skill candidates, inspired by Hermes-style learning loops, but Along should not auto-execute generated skills in Memory v2.

Procedure categories:

- Collaboration procedures.
- Companion rhythm procedures.
- Project understanding procedures.
- Review procedures.

Skill candidates should be generated from repeated or explicitly approved episodes, then reviewed before becoming accepted procedures.

Important performance and quality constraint:

- Skill growth must not mean loading all skills into context.
- Along should use a skill budget and retrieval system.
- Accepted procedures should have metadata for cheap selection before any full body is loaded.
- Duplicate, stale, or low-value procedures should be merged, archived, or kept dormant.

Suggested lifecycle:

```text
candidate -> accepted -> active -> dormant -> archived
```

Suggested retrieval strategy:

1. Build a small candidate set from scope, trigger, project, mode, and graph links.
2. Rank candidates using recency, success count, explicit user approval, and current task relevance.
3. Load only a small number of procedure cards into the recall packet.
4. Load full procedure bodies only when execution or detailed guidance is needed.

Recommended default budget:

- 0 to 2 accepted procedures in a normal recall packet.
- 1 procedural candidate suggestion at most during wrap-up.
- No automatic use of reflective/challenger procedures without explicit mode.

This addresses the Hermes-style slowdown problem when skill count grows too large.

## Approved Memory Review And Correction Direction

Memory v2 needs a review mechanism so memory intimacy, strong judgments, and skill candidates do not become hidden behavior.

Approved review layers:

1. Wrap-up review:
   - Shows "What I remembered today".
   - Groups project facts, corrections, curiosities, companion continuity, and skill candidates.
   - Each item supports Keep / Edit / Forget.

2. Memory inbox:
   - Pending review items go to `.along/review/inbox.json` or `~/.along/review/inbox.json`.
   - Useful for close continuity notes, reflective/challenger interpretations, procedural candidates, cross-project patterns, and stale fact conflicts.
   - CLI command `along memory review` is preferred before a full UI browser.

3. Memory browser:
   - Later UI for episodes, facts, corrections, curiosities, graph relations, procedures, and companion continuity.
   - Every long-term memory should show content, source episode, scope, confidence, intimacy level, status, and usage history.

Correction behavior:

- Edits and forgetting should update graph memory, not silently overwrite history.
- Useful relations include `memory_rejected`, `memory_edited_by_user`, `correction_invalidates_fact`, and `preference_superseded`.

Approved expression principle:

> Mystery is allowed in expression, not in storage or behavior.

Along can use ambient, poetic, or slightly mysterious phrases in Shared Desk or journal voice, such as "I think I noticed a small pattern today." But whenever a memory affects future behavior, the review layer must show the concrete memory, source, confidence, intimacy level, and Keep / Edit / Forget controls.

Design shorthand:

```text
surface poetry / transparent memory
```

## Approved Privacy, Safety, And Deletion Direction

Memory v2 safety is based on being understandable, controllable, and reversible.

Hard rules:

1. Local-first by default:
   - Memory v2 stores files under `.along/` and `~/.along/`.
   - Cloud sync is out of scope unless separately designed.

2. Explicit scopes:
   - Every memory item has `session`, `project`, or `global` scope.
   - Project memories must not silently become global patterns.

3. Operational forgetting:
   - Forgetting must remove memory from recall behavior, not only hide it in UI.
   - Graph should record rejection or supersession where useful.
   - Sensitive memories may support hard delete.
   - A forget ledger should prevent rejected memories from being regenerated without new explicit user expression.

4. Sensitive memory restrictions:
   - Emotional state, motivation inference, personality judgment, loneliness, anxiety, close continuity, reflective/challenger judgments are sensitive by default.
   - Sensitive memories require source episodes, confidence, review status, expiry or revisit date, and allowed-use rules.
   - Sensitive memories must not be used to pressure, shame, guilt, manipulate, or covertly steer the user.

5. Recall provenance:
   - Along should be able to show which memories influenced the current recall packet.

Deletion levels:

- Forget this item.
- Forget this episode.
- Reset memory scope.

Principle:

> Higher memory intimacy requires higher transparency.

## Approved Recall Packet Direction

Recall packet is the main runtime artifact for Memory v2. It should be small, sourced, and useful for presence.

It should include:

- session id;
- repo path;
- generated time;
- current memory mode / intimacy level;
- project recall:
  - active curiosity;
  - stable facts;
  - active corrections;
- global recall:
  - preferences;
  - companion continuity;
  - possibly relevant cross-project patterns marked as `hint_not_fact`;
- procedural recall:
  - 0 to 2 active procedure cards;
- blocked memories:
  - counts and reasons for memories not used because they require review;
- provenance:
  - source episode ids and memory ids.

Generation order:

1. Read memory mode / intimacy settings.
2. Load project memory.
3. Load global memory.
4. Filter rejected, archived, and expired memories.
5. Filter memories that exceed current mode permissions.
6. Use graph relations to find project, curiosity, and episode relevance.
7. Select top facts, corrections, preferences, continuity notes, patterns, and procedures.
8. Apply budget.
9. Write `.along/recall/latest.json`.
10. Let runtime/provider use the recall packet to generate the session plan.

Default balanced budget:

- project facts: at most 3;
- corrections: at most 3;
- global preferences: at most 2;
- companion continuity: at most 2;
- cross-project patterns: at most 2;
- active procedures: 0 to 2 skill cards;
- blocked memories: summary count/reason only.

Recall should help Along return with continuity, not with a full memory dump.

## Approved First Implementation Scope

Memory v2 first implementation should make Along remember across sessions and projects through episodes, consolidation candidates, graph relations, and recall packets.

Must have:

1. Episode creation:
   - `.along/episodes/YYYY/<session-id>.json`
   - `.along/episodes/YYYY/<session-id>.md`

2. No-overwrite journal:
   - Prefer appending multiple session entries into `.along/journal/YYYY-MM-DD.md`.

3. Consolidation candidates:
   - semantic fact candidates;
   - correction candidates;
   - continuity candidates;
   - procedure candidates;
   - graph relation candidates.

4. Auto-approve low-risk memory:
   - explicit project facts;
   - user corrections;
   - graph session/episode/curiosity relations.

5. Pending review:
   - companion continuity;
   - cross-project user patterns;
   - procedure candidates;
   - close / reflective / challenger memories.

6. Review inbox:
   - `.along/review/inbox.json`
   - `~/.along/review/inbox.json`

7. Recall packet:
   - `.along/recall/latest.json`
   - runtime/provider uses it to generate the session plan.

8. Global memory becomes real:
   - global preferences;
   - companion continuity;
   - projects index;
   - global graph;
   - cross-project patterns.

9. Graph schema upgrade:
   - episode;
   - preference;
   - continuity note;
   - procedure candidate;
   - new edges such as `session_created_episode`, `episode_recorded_correction`, and related relations.

10. Memory mode setting:
   - `~/.along/settings.json`
   - default `{ "memoryMode": "balanced" }`.

11. Basic CLI memory review:
   - `along memory review`
   - At minimum, `along memory review --list`.

Out of scope for Memory v2 first implementation:

- Vector database.
- SQLite.
- Cloud sync.
- Automatic skill execution.
- Full memory browser UI.
- Complete reflective/challenger mode UX.
- Automatic psychological or personality judgment.
- Long-running background dream loop daemon.
- Complex scheduling.

## Approved Testing And Verification Direction

Memory v2 tests should verify that Along can remember, distinguish scopes, stay bounded, and allow correction.

Required test categories:

1. Episode tests:
   - Wrap-up creates `.json` and `.md` episode files.
   - Episodes include session id, curiosity, events, source context, and consolidation status.
   - Multiple same-day sessions do not overwrite each other.

2. Journal append tests:
   - Same-day wrap-ups append multiple entries instead of overwriting.
   - Each journal entry links back to an episode id.

3. Consolidation candidate tests:
   - Episodes produce semantic fact, correction, graph relation, continuity, and procedure candidates.
   - Candidates include source episode, confidence, memory intimacy, scope, and review status.

4. Review gate tests:
   - Low-risk explicit project facts can be auto-approved.
   - User corrections can be auto-approved but remain visible.
   - Close continuity, reflective/challenger memories, and procedure candidates default to pending review.
   - Pending memories do not enter recall packets.

5. Recall packet tests:
   - Recall obeys budget.
   - Recall excludes rejected, archived, expired, and over-mode memories.
   - Recall includes provenance.
   - Cross-project patterns are marked `hint_not_fact`.
   - Active curiosity is selected.

6. Cross-project tests:
   - Repo A can produce global preference or companion continuity memory.
   - Repo B can use approved global preferences.
   - Repo B cannot treat Repo A local project facts as true.
   - Cross-project patterns stay weak hints.

7. Forget ledger tests:
   - Forgotten memory does not enter recall.
   - Graph records rejection or supersession.
   - Forget ledger blocks rejected memories from being regenerated without new explicit user expression.
   - Sensitive memory supports hard delete.

8. Procedural memory budget tests:
   - Recall loads at most 0 to 2 active procedure cards.
   - Full procedure body is not loaded by default.
   - Dormant, archived, and pending procedures do not enter recall.

Manual product verification:

- Along returns with one small thread, not a full memory dump.
- Memory review feels transparent, not like hidden profiling.
- Surface poetry adds flavor but does not hide concrete memory content.

Success sentence:

> Along remembers the right small things, shows why it remembers them, and lets the user change its mind.

## Next Planned Design Sections

1. Data model and file structure for Memory v2.
2. Consolidation loop and recall packet design.
3. Graph memory schema and relation types.
4. Cross-project memory design.
5. Procedural memory / skill candidate design.
6. Memory review and correction UX.
7. Privacy, safety, and deletion model.
8. Testing and verification strategy.
9. Formal Memory v2 design spec.

## Continuation Notes

When resuming, do not restart from first-principles memory theory. Continue from the approved direction:

> Make memory real first, using companionship judgment and cognitive/Hermes/Claude/MCP graph ideas as structure.

Memory v2 must remain product-specific to Along. It should not become a generic memory framework unless that directly supports Along's autonomy, companionship, and growth line.

If context is automatically compacted, first re-read this file, the original design spec, and current implementation files before continuing:

- `docs/superpowers/notes/2026-05-15-memory-v2-brainstorm.md`
- `docs/superpowers/specs/2026-05-13-along-design.md`
- `src/core/memory-store.ts`
- `src/core/runtime.ts`
- `src/core/graph-store.ts`
- `src/core/types.ts`

Do not rely only on the compacted conversation summary.
