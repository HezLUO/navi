# Along Memory v2 Design Spec

Date: 2026-05-17
Status: Proposed design, awaiting user review
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

Memory v2 makes Along's memory real across sessions and projects while preserving the product thesis: Along is a lo-fi coding companion with its own rhythm, state, and growth line.

The goal is not to make Along remember everything. The goal is:

> Along remembers the right small things, shows why it remembers them, and lets the user change its mind.

Memory v2 should combine:

- cognitive memory layers: working, episodic, semantic, procedural, and consolidation;
- Hermes-style learning loops: observe, distill, reuse, refine;
- Claude-style readable memory: human-editable markdown and explicit lifecycle moments;
- MCP-style graph memory: entities, relations, observations, source, and provenance;
- Along-specific companion continuity: memory that supports presence, growth, and reciprocal interaction.

## Current State

The current MVP already has the beginnings of memory:

- project memory under `.along/`;
- session records under `.along/sessions/`;
- journal files under `.along/journal/`;
- curiosity queue under `.along/curiosity/queue.json`;
- project graph memory under `.along/graph/nodes.json` and `.along/graph/edges.json`;
- initialized global memory under `~/.along/`.

Current limitations:

- same-project memory is only partial;
- cross-project memory is mostly scaffolding;
- runtime initializes global memory but does not use it for recall or planning;
- Hermes-style procedural learning is not implemented;
- same-day journal writes can overwrite previous entries;
- graph memory exists but lacks source, review, intimacy, and lifecycle metadata.

## Goals

- Add a real memory loop: session -> episode -> consolidation -> long-term updates -> recall packet.
- Make memory useful across sessions in the same repo.
- Make selected memory useful across projects without leaking project-specific facts.
- Keep memory readable, inspectable, editable, and deletable.
- Preserve graph memory as a required design element.
- Add review gates for close, reflective, challenger, procedural, and cross-project memories.
- Add memory modes so the user controls intimacy and inference depth.
- Add a small recall packet so Along returns with continuity without loading every memory.
- Prevent procedural memory from slowing Along down as skills grow.

## Non-Goals

- Do not add a vector database.
- Do not add SQLite in this first Memory v2 implementation.
- Do not add cloud sync.
- Do not add a long-running background dream loop daemon.
- Do not automatically execute generated skills.
- Do not build a full visual memory browser yet.
- Do not implement complete reflective/challenger mode UX yet.
- Do not infer or store hidden psychological profiles.
- Do not turn Along into a generic memory framework or MCP memory server.

## Design Principles

### Readable First

Markdown stores user-readable life traces, journals, summaries, and continuity notes. JSON stores machine-readable episodes, facts, corrections, indexes, queues, graph data, and recall packets.

### Source Every Memory

Every long-term memory must point back to source episodes or explicit user input. Along should be able to answer: "Why do I remember this?"

### Scope Every Memory

Every memory has a scope:

- `session`
- `project`
- `global`

Project facts must not silently become global user patterns.

### Small Recall, Not Memory Dump

Along should not load all memory into context. It should build a small, sourced recall packet with budget limits.

### Surface Poetry / Transparent Memory

Along may use ambient or slightly mysterious language in Shared Desk or journal voice:

```text
I think I noticed a small pattern today.
```

But storage and behavior must be transparent. Any memory that affects future behavior must show concrete content, source, confidence, intimacy level, review status, and Keep / Edit / Forget controls.

### Higher Intimacy Requires Higher Transparency

Close, reflective, and challenger modes can be richer, but they require stronger source, review, expiry, and allowed-use rules.

## Memory Layers

### Working Memory

Current session state:

- current presence state;
- current curiosity;
- current project context summary;
- recent user corrections;
- current plan and activity.

Stored mainly in runtime and `.along/sessions/<session-id>.json`.

### Episodic Memory

Shared experiences: what Along and the user did together.

Episodes are not just summaries. They record the sequence and meaning of a session:

- what Along tried to understand;
- what the user corrected;
- what decisions happened;
- what curiosities were created;
- what interaction rhythm worked;
- what candidates were produced.

Episodes are stored as both markdown and JSON.

### Semantic Memory

Stable facts:

- project entrypoints;
- commands;
- module responsibilities;
- established decisions;
- explicit user preferences;
- explicit corrections.

Semantic memory comes from consolidation, not arbitrary overwriting.

### Graph Memory

Entities and relations between sessions, episodes, curiosities, facts, corrections, preferences, decisions, procedures, project areas, and projects.

Graph memory answers:

- what did we decide;
- what changed;
- what keeps recurring;
- what was corrected;
- what should Along continue;
- which memory supports the current recall.

### Procedural Memory

Reusable ways Along has learned to work or accompany the user. Inspired by Hermes skills, but Memory v2 creates skill candidates first and does not auto-execute them.

Procedure categories:

- collaboration procedures;
- companion rhythm procedures;
- project understanding procedures;
- review procedures.

### Companion Continuity Memory

Along-specific memory that supports companionship and growth line:

- how Along should stay present without pressure;
- what rhythm worked;
- what relationship continuity exists;
- what Along wanted to continue.

This memory is visible, reviewable, and non-manipulative.

## File Structure

### Project Memory

```text
.along/
  companion.md
  state.json
  settings.json
  sessions/
    2026-05-17T10-30-00.json
  episodes/
    2026/
      2026-05-17T10-30-00.md
      2026-05-17T10-30-00.json
  journal/
    2026-05-17.md
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
  review/
    inbox.json
  forget-ledger.json
```

### Global Memory

```text
~/.along/
  companion-profile.md
  user-patterns.md
  companion-continuity.md
  global-curiosity.md
  projects-index.json
  episodes-index.json
  settings.json
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
  review/
    inbox.json
  forget-ledger.json
```

## Episode Model

Example episode JSON:

```json
{
  "id": "episode-2026-05-17T10-30-00",
  "sessionId": "2026-05-17T10-30-00",
  "repoPath": "/path/to/repo",
  "startedAt": "2026-05-17T10:30:00.000Z",
  "endedAt": "2026-05-17T11:05:00.000Z",
  "presenceStates": ["arriving", "settling", "quiet_focus", "wrap_up"],
  "curiosityIds": ["curiosity-tests-entry"],
  "events": [
    {
      "type": "companion_observed",
      "text": "I found package.json has a test script."
    },
    {
      "type": "user_corrected",
      "text": "The old tests folder is not used anymore."
    }
  ],
  "consolidationStatus": "pending"
}
```

Episode markdown should be readable and reflective. It should describe what happened without turning the user into a profile.

## Consolidation Loop

Memory v2 uses a visible consolidation loop:

```text
raw session
-> episode
-> candidate memories
-> reviewable consolidation
-> long-term memory updates
-> recall packet for next time
```

### Candidate Memories

Consolidation produces candidates before writing long-term memory.

Candidate types:

- semantic fact candidate;
- correction candidate;
- graph relation candidate;
- continuity candidate;
- procedure candidate.

Example:

```json
{
  "id": "candidate-tests-command",
  "type": "semantic_fact",
  "text": "Tests are run with npm test.",
  "sourceEpisodeIds": ["episode-2026-05-17T10-30-00"],
  "confidence": "explicit",
  "scope": "project",
  "memoryIntimacy": "minimal",
  "reviewStatus": "auto_approved"
}
```

### Approval Rules

- Low-risk explicit project facts can be auto-approved.
- User corrections can be auto-approved but must remain visible.
- Balanced preferences can be auto-approved only when explicit.
- Close continuity notes default to pending review.
- Reflective and challenger memories default to pending review and must include usage boundaries.
- Procedure candidates default to pending review.
- Cross-project patterns default to pending review unless explicitly low risk.

## Memory Modes

Memory v2 supports user-facing memory modes:

- `minimal`: project facts, explicit corrections, active curiosities.
- `balanced`: explicit work preferences and interaction rhythm. Default mode.
- `close`: user-approved companion continuity about motivation, support style, and recurring context.
- `reflective`: richer reflective memory and stronger interpretations, reviewed before use.
- `challenger`: stronger judgments for candid feedback and challenge, within explicit user-approved boundaries.

Strong judgments are not forbidden in all modes, but they are gated. They must include:

- source episodes;
- confidence;
- review status;
- expiry or revisit date;
- allowed-use rule;
- mode requirement.

Along should prefer concrete preferences and observed interaction patterns in default mode.

## Graph Schema

### Node Types

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

### Edge Types

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
- `memory_rejected`
- `memory_edited_by_user`
- `preference_superseded`

### Long-Term Memory Metadata

Long-term memory nodes include:

- `scope`: `session | project | global`
- `sourceEpisodeIds`
- `confidence`: `inferred_low | inferred_medium | explicit`
- `memoryIntimacy`: `minimal | balanced | close | reflective | challenger`
- `status`: `active | superseded | rejected | archived`
- `visibility`: `user_visible | internal_runtime`
- `reviewStatus`: `auto_approved | pending_review | approved | rejected`
- `createdAt`
- `updatedAt`

## Cross-Project Memory

Cross-project memory carries continuity, constraints, and weak patterns. It must not carry local facts from one repo into another as truth.

Allowed cross-project categories:

- user-level continuity: explicit work preferences, interaction boundaries, documentation preferences;
- companion-level continuity: Along's self-guidance for how to behave better with the user;
- cross-project pattern memory: reusable weak hints marked `hint_not_fact`.

Disallowed by default:

- another project's local facts as current project truth;
- hidden psychological judgments;
- unreviewed close, reflective, or challenger memory;
- stale project assumptions.

New-project recall should include:

- global preferences;
- companion continuity;
- possibly relevant patterns with `useAs: "hint_not_fact"`;
- blocked memory counts and reasons.

## Procedural Memory And Skill Budget

Procedural memory must not slow Along down as skills grow.

Use a library, retrieval, budget, and lifecycle model.

Lifecycle:

```text
candidate -> accepted -> active -> dormant -> archived
```

Retrieval strategy:

1. Build a small candidate set from scope, trigger, project, mode, and graph links.
2. Rank candidates by recency, success count, explicit user approval, and relevance.
3. Load only a small number of procedure cards into the recall packet.
4. Load full procedure bodies only when execution or detailed guidance is needed.

Default budget:

- 0 to 2 accepted procedures in a normal recall packet.
- 1 procedural candidate suggestion at most during wrap-up.
- No automatic use of reflective/challenger procedures without explicit mode.

Principle:

> Skills are retrieved, not remembered all at once.

## Memory Review And Correction

Memory v2 has three review layers.

### Wrap-Up Review

After wrap-up, Along shows:

```text
What I remembered today
```

Grouped by:

- project facts;
- corrections;
- curiosities;
- companion continuity;
- skill candidates.

Each item supports:

```text
Keep / Edit / Forget
```

### Memory Inbox

Pending review items go to:

```text
.along/review/inbox.json
~/.along/review/inbox.json
```

First implementation should support:

```text
along memory review --list
```

Full keep/edit/forget CLI can come next if needed, but the data model must support it now.

### Memory Browser

A full UI memory browser is later scope. It should eventually show:

- episodes;
- facts;
- corrections;
- curiosities;
- graph relations;
- procedures;
- companion continuity.

Each memory should show content, source, scope, confidence, intimacy level, status, and usage history.

## Privacy, Safety, And Deletion

### Local First

Memory v2 stores files locally in `.along/` and `~/.along/`. Cloud sync is out of scope.

### Operational Forgetting

Forgetting must affect behavior, not only UI.

Forget behavior:

- set status to `rejected` or `archived`;
- exclude from recall;
- write graph relation such as `memory_rejected`;
- write forget ledger entry;
- optionally hard-delete sensitive memory.

Example forget ledger:

```json
{
  "id": "forget-preference-quiet-pressure",
  "memoryTextHash": "abc123",
  "reason": "user_rejected",
  "createdAt": "2026-05-17T10:00:00.000Z",
  "appliesTo": "global"
}
```

The forget ledger prevents Along from regenerating rejected memory without new explicit user expression.

### Sensitive Memory

Sensitive memory includes:

- emotional state;
- motivation inference;
- personality judgment;
- loneliness, anxiety, or low-state inferences;
- close continuity;
- reflective/challenger judgments.

Sensitive memory requires source episodes, confidence, review status, expiry or revisit date, and allowed-use rules.

Sensitive memory must not be used to pressure, shame, guilt, manipulate, or covertly steer the user.

## Recall Packet

Recall packet is the runtime artifact generated at session start.

Example:

```json
{
  "sessionId": "2026-05-17T10-00-00",
  "repoPath": "/path/to/repo",
  "generatedAt": "2026-05-17T10:00:00.000Z",
  "mode": "balanced",
  "projectRecall": {
    "activeCuriosity": {
      "id": "curiosity-test-entry",
      "question": "Where is the current test entry?"
    },
    "stableFacts": [
      {
        "text": "Tests are run with npm test.",
        "source": "episode-2026-05-17T10-30-00"
      }
    ],
    "activeCorrections": [
      {
        "text": "The old tests folder is no longer used.",
        "source": "episode-2026-05-17T10-30-00"
      }
    ]
  },
  "globalRecall": {
    "preferences": [
      {
        "text": "User prefers design decisions to be written into persistent notes.",
        "source": "episode-2026-05-15-memory-v2"
      }
    ],
    "companionContinuity": [
      {
        "text": "Ask sparse questions during design discussions.",
        "source": "episode-2026-05-15-memory-v2"
      }
    ],
    "possiblyRelevantPatterns": [
      {
        "text": "Previous projects used docs/superpowers/specs as source of truth.",
        "useAs": "hint_not_fact"
      }
    ]
  },
  "proceduralRecall": {
    "activeProcedures": [
      {
        "id": "procedure-persistent-record",
        "title": "Create persistent records for multi-session design work"
      }
    ]
  },
  "blockedMemories": [
    {
      "reason": "requires_review",
      "count": 2
    }
  ],
  "provenance": [
    "episode-2026-05-17T10-30-00",
    "episode-2026-05-15-memory-v2"
  ]
}
```

Generation order:

1. Read memory mode and settings.
2. Load project memory.
3. Load global memory.
4. Filter rejected, archived, and expired memories.
5. Filter memories that exceed current mode.
6. Use graph relations to find project, curiosity, and episode relevance.
7. Select top facts, corrections, preferences, continuity notes, patterns, and procedures.
8. Apply budget.
9. Write `.along/recall/latest.json`.
10. Let runtime/provider use the packet to generate the session plan.

Default balanced budget:

- project facts: at most 3;
- corrections: at most 3;
- global preferences: at most 2;
- companion continuity: at most 2;
- cross-project patterns: at most 2;
- active procedures: 0 to 2 skill cards;
- blocked memories: summary count/reason only.

## First Implementation Scope

### Must Have

1. Episode creation:
   - `.along/episodes/YYYY/<session-id>.json`
   - `.along/episodes/YYYY/<session-id>.md`

2. No-overwrite journal:
   - append multiple session entries into `.along/journal/YYYY-MM-DD.md`.

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

5. Review inbox:
   - `.along/review/inbox.json`
   - `~/.along/review/inbox.json`

6. Recall packet:
   - `.along/recall/latest.json`
   - runtime/provider uses it to generate the session plan.

7. Global memory becomes real:
   - global preferences;
   - companion continuity;
   - projects index;
   - global graph;
   - cross-project patterns.

8. Graph schema upgrade.

9. Memory mode setting:
   - `~/.along/settings.json`
   - default `{ "memoryMode": "balanced" }`.

10. Basic CLI memory review:
   - at minimum, `along memory review --list`.

### Out Of Scope

- vector database;
- SQLite;
- cloud sync;
- automatic skill execution;
- full memory browser UI;
- complete reflective/challenger mode UX;
- automatic psychological or personality judgment;
- long-running background dream loop daemon;
- complex scheduling.

## Testing And Verification

### Episode Tests

Verify:

- wrap-up creates `.json` and `.md` episode files;
- episodes include session id, curiosity, events, source context, and consolidation status;
- multiple same-day sessions do not overwrite each other.

### Journal Append Tests

Verify:

- same-day wrap-ups append multiple entries instead of overwriting;
- each journal entry links back to an episode id.

### Consolidation Candidate Tests

Verify:

- episodes produce semantic fact, correction, graph relation, continuity, and procedure candidates;
- candidates include source episode, confidence, memory intimacy, scope, and review status.

### Review Gate Tests

Verify:

- low-risk explicit project facts can be auto-approved;
- user corrections can be auto-approved but remain visible;
- close continuity, reflective/challenger memories, and procedure candidates default to pending review;
- pending memories do not enter recall packets.

### Recall Packet Tests

Verify:

- recall obeys budget;
- recall excludes rejected, archived, expired, and over-mode memories;
- recall includes provenance;
- cross-project patterns are marked `hint_not_fact`;
- active curiosity is selected.

### Cross-Project Tests

Use two temporary repos. Verify:

- Repo A can produce global preference or companion continuity memory;
- Repo B can use approved global preferences;
- Repo B cannot treat Repo A local project facts as true;
- cross-project patterns stay weak hints.

### Forget Ledger Tests

Verify:

- forgotten memory does not enter recall;
- graph records rejection or supersession;
- forget ledger blocks rejected memories from regenerating without new explicit user expression;
- sensitive memory supports hard delete.

### Procedural Memory Budget Tests

Verify:

- recall loads at most 0 to 2 active procedure cards;
- full procedure body is not loaded by default;
- dormant, archived, and pending procedures do not enter recall.

### Manual Product Verification

Verify:

- Along returns with one small thread, not a full memory dump;
- memory review feels transparent, not like hidden profiling;
- surface poetry adds flavor but does not hide concrete memory content.

## Implementation Handoff

After this spec is approved, create an implementation plan under:

```text
docs/superpowers/plans/YYYY-MM-DD-memory-v2.md
```

Do not begin implementation until the user approves this spec.
