# Along Runtime Control Plane Continuity Record

Date: 2026-05-23
Status: Active cross-session record
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Purpose

This record preserves the current design state for the next multi-turn phase. It should be updated whenever the work advances through a design decision, written spec, implementation plan, implementation pass, verification pass, or meaningful reversal.

This file is not the full design spec. It is the continuity anchor so future sessions do not depend only on chat history.

## Current Goal

Design the foundation that Memory v2 and Autonomy can safely mount onto before implementing either one deeply.

The working name is:

> Along Runtime Control Plane and Lifecycle Design

The control plane should define how Along manages session lifecycle, runtime modes, context assembly, permissions, event intake, locks, review gates, observability, and recovery.

## Current Recommendation

Do not jump directly into the existing Memory v2 implementation plan yet.

The external product comparison changed the ordering:

1. First write and approve the Runtime Control Plane and Lifecycle design.
2. Then revise or gate the Memory v2 implementation plan against that foundation.
3. Then implement Memory v2 foundation tasks.
4. Then continue into Autonomy architecture implementation.

Reason: memory and spontaneity both need the same lower-level runtime contracts. Without those contracts, implementation will likely scatter session state, event rules, context selection, permission checks, file writes, and recovery behavior across unrelated modules.

## Key Constraints

- Along is a lo-fi coding companion, not a generic task agent, productivity dashboard, or engagement optimizer.
- Along may have rhythm, curiosity, memory, and self-initiation, but default behavior must remain low-pressure and non-manipulative.
- Along must not modify project code unless a future approved design explicitly authorizes that boundary change.
- Memory must be readable, inspectable, editable, forgettable, and source-backed.
- Higher-intimacy or stronger-accountability modes require stronger transparency, review, expiry, and allowed-use rules.
- Spontaneity is an internally generated tendency filtered by rhythm, care, style, authorization, and commitment; it is not immediate action.
- The first implementation of new foundations should stay deterministic, inspectable, and testable.
- No vector database, cloud sync, always-on daemon, or broad background automation should be introduced in the next foundation pass.
- `.along/` remains local project memory. Generated/internal memory should not be presented as ordinary user project context.
- Existing user or generated work in the repo must not be reverted. Current known untracked item: `.superpowers/`.

## Already Reached Conclusions

### Product Feel Pass

The Product Feel Pass has been implemented in commit `3187d3e feat: make along session rhythm visible`.

Verified:

- `npm test` passed outside the sandbox.
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser verification confirmed the visible rhythm, no sound autoplay, wrap-up feedback, and journal write.

Residual issues from that pass:

- `GET /api/session/current` only restores in-memory state. After API restart it returns no current session and the frontend starts a new one.
- After wrap-up, `currentActivity` can still describe quiet reading.
- `shareLine` can produce awkward punctuation such as `Along?.`.

### Memory v2

Existing spec:

- `docs/superpowers/specs/2026-05-17-memory-v2-design.md`

Existing plan:

- `docs/superpowers/plans/2026-05-17-memory-v2.md`

The design direction remains valid: session -> episode -> consolidation -> long-term updates -> recall packet.

However, Memory v2 should be gated by the new control-plane design because memory needs shared rules for:

- session identity and recovery;
- event intake;
- context packet construction;
- review gates;
- memory modes;
- permission boundaries;
- file locking and atomic writes;
- observability and explainability.

### Autonomy Architecture

Existing spec:

- `docs/superpowers/specs/2026-05-18-along-autonomy-architecture-design.md`

Existing plan:

- `docs/superpowers/plans/2026-05-18-along-autonomy-architecture.md`

The core autonomy model remains approved:

> Context + Memory -> Motivation Field -> Somatic State -> Temporal Rhythm -> Graph Influence Extractor -> Option Scorer -> Runtime Mode + Style Profile -> Risk Envelope -> Intention Ledger -> Language Realizer -> Output / Journal / Trace

Autonomy should not be implemented before the control plane defines lifecycle, permissions, event intake, intention persistence, trace logging, and recovery.

### External Product Gap Review

Compared products:

- OpenAI Codex: memory opt-in, permissions, hooks, skills, subagents, review.
- Claude Code: hierarchical memory/settings, hooks, permissions, subagents, resume behavior.
- OpenClaw: agent loop, context engine, sessions, command queue, file locks, tools/plugins.
- Hermes Agent: bounded curated memory, searchable sessions, skills as procedural memory, security and trust rules.

Main gap found in Along:

Along has strong memory and autonomy concepts, but lacks a runtime control plane that makes those concepts operationally safe and coherent.

## Missing Modules Or Function Designs

Priority P0 before Memory v2 implementation:

- Agent Control Plane: unified runtime mode, memory mode, style profile, permissions, feature flags, and debug visibility.
- Durable Session Manager: session index, current pointer, paused/wrapped/expired states, resume picker, API restart recovery, same-day multi-session handling.
- Context Engine: rules for assembling, budgeting, trimming, and explaining model/tick context from recall, graph, journal, events, and tool outputs.
- Event Intake Layer: normalized events for user corrections, wrap-up notes, repo changes, Along ticks, refusals, silence, and file-summary changes.
- Concurrency / Queue / File Locking: atomic writes, locks, queues, and idempotency for `.along/`.

Priority P1 after P0 shape is accepted:

- Memory Governance: capacity, expiry, duplicate detection, prompt-injection checks, sensitive memory rules, and rejected-memory suppression.
- Review UX: inbox and Keep / Edit / Forget controls for memories that affect future behavior.
- Observability / Doctor / Context Inspector: status, context usage, memory usage, action reasons, and failure visibility.
- Retry / Error / Recovery Policy: clear rules for retries and duplicate prevention.
- Procedure / Skill Memory: generate, activate, verify, deprecate, and prevent procedural memory pollution.

Priority P2 later:

- Multi-agent decomposition.
- Cross-platform messages.
- Chronicle-like screen observation.
- Long-running background automation.

## Pending Decisions

These need explicit design decisions in the next spec:

- Where the runtime control plane stores canonical settings: `.along/state.json`, `.along/settings.json`, a new control-plane file, or split files.
- Whether the current session pointer is a file, an index entry, or both.
- Exact session lifecycle states and transitions.
- Exact event schema and which events are eligible for memory consolidation.
- How context packets expose "why this was included" without overwhelming the UI.
- How permission levels map to visible controls.
- Default memory mode and whether close/reflective/challenger/accountability modes are separate dimensions or a combined profile.
- Locking strategy for local JSON/Markdown writes.
- How much UI is needed in the first pass versus debug-only tooling.
- Whether existing Memory v2 plan should be revised before implementation or superseded by a new plan after the control-plane spec.

## Design Progress

Approved sections:

- Section 1: Goal, boundary, and system split.
  - The Runtime Control Plane is a thin but strict runtime foundation, not a large orchestrator.
  - It defines contracts for lifecycle, runtime profile, permissions, event intake, context assembly, coordinated writes, review gates, trace/doctor output, and recovery.
  - It does not directly implement Memory v2 algorithms, Autonomy scoring, or UI voice.
- Section 2: Session lifecycle and recovery rules.
  - Session lifecycle states are `new`, `active`, `paused`, `wrapped`, `expired`, and `recovered`.
  - The current session pointer must be durable on disk, not only runtime memory.
  - Proposed files are `.along/state.json`, `.along/sessions/current.json`, `.along/sessions/index.json`, and `.along/sessions/<session-id>.json`.
  - Page refresh and API restart should recover from disk when the current session is valid; explicit wrap-up closes the lifecycle and should not silently resume as active.
  - Same-day multi-session behavior requires stable session IDs rather than date-only names.
- Section 3: Runtime Profile and Permission Envelope.
  - Runtime Profile uses independent dimensions rather than one large mode: runtime, memory, presence, relationship style, accountability, autonomy, and feature flags.
  - Default profile is conservative: companion runtime, reviewed project memory, ambient presence, calm relationship style, accountability off, quiet autonomy.
  - Permission Envelope is derived from the effective profile and records what the current session/tick may read, write, ask, remember, message, or call.
  - `canModifyProjectFiles` defaults to `false`; strict accountability and debug visibility do not grant extra file, tool, or memory permissions.
  - Global memory and procedural memory require review gates.
- Section 4: Event Intake and event model.
  - Event Intake normalizes user, Along, runtime, filesystem, tool, and system activity into standard events before memory, graph, journal, or autonomy consume them.
  - Events are not automatically memories; they carry visibility, scope, memory eligibility, risk, and provenance.
  - First implementation should use append-only per-session JSONL logs at `.along/events/<session-id>.jsonl`.
  - User corrections, preferences, refusals, review decisions, Along ticks, project observations, memory candidates, journal writes, errors, and recovery actions should be explicit event kinds.
  - The first version should remain a local deterministic pipeline, not a full message queue.
- Section 5: Context Engine and context packets.
  - Context Engine builds small, sourced, budgeted, explainable context packets for session start, autonomy ticks, wrap-up, memory consolidation, user responses, and debug inspection.
  - Context packets must include source references, inclusion reasons, confidence, scope, risk, and omissions.
  - Reviewed memory can influence ordinary behavior; unreviewed candidates are limited to review or consolidation contexts.
  - The first implementation should use deterministic scoring, not embeddings or a vector database.
  - Context Engine must obey the Permission Envelope and cannot expand permissions through debug mode.
- Section 6: Write Coordinator, locking, and recovery.
  - All `.along/` state writes should go through Write Coordinator via write intents rather than direct scattered writes.
  - JSON state files use atomic temp-write and rename; JSONL events are append-only with ids and idempotency keys.
  - First implementation should use a simple project-level lock at `.along/locks/runtime.lock`.
  - Startup and pre-write recovery should detect stale locks, inspect current pointer/session/event consistency, repair safe index drift, and record recovery events.
  - Repeated start, wrap-up, event append, graph update, and memory candidate operations must be idempotent.
- Section 7: Review Gate, Trace, and Doctor.
  - Review Gate governs anything that can affect future behavior, relationship tone, project understanding, global memory, procedural memory, graph relations, or proactive behavior.
  - Project memory can enter candidate state, but global memory and procedural memory always require explicit review.
  - Trace records runtime decisions, permission snapshots, context packet references, related events, and outcomes.
  - Doctor explains current lifecycle, effective profile, permission envelope, current pointer health, recent events/context, pending review items, write/recovery failures, and `.along/` mode.
  - Doctor and debug/research visibility cannot bypass Review Gate or expand permissions.
- Section 8: First-version scope, end-to-end flows, and testing.
  - First implementation should cover durable session lifecycle, Runtime Profile, Permission Envelope, Event Intake, Context Packet Builder, Write Coordinator, project lock, Review Inbox structure, Trace, and Doctor API.
  - First implementation should not include vector retrieval, SQLite/database storage, cloud sync, always-on daemon, multi-agent execution, full settings UI, automatic skill execution, automatic global memory promotion, or project code modification permission.
  - Startup, tick, wrap-up, and recovery-failure flows must all pass through lifecycle, permission, event, context, write, review, and trace contracts.
  - Tests should cover recovery after API restart, wrap-up idempotency, schema-valid event logging, permission derivation, context omissions, stale-lock recovery, review-gate enforcement, Doctor output, and existing product behavior.

## Next Plan

1. User reviews the written Runtime Control Plane and Lifecycle spec:

   `docs/superpowers/specs/2026-06-01-along-runtime-control-plane-lifecycle-design.md`

2. If changes are requested, revise the spec and run the spec self-review again.
3. User chooses execution mode for the implementation plan:

   `docs/superpowers/plans/2026-06-01-along-runtime-control-plane-lifecycle.md`

4. Only after execution mode is chosen, begin implementation.

## Update Policy

Keep this file current during the multi-turn effort.

Update it when:

- a design section is approved or rejected;
- a pending decision is resolved;
- the next plan changes;
- a spec or plan is written;
- implementation starts or completes;
- verification finds an important issue;
- external comparison changes the ordering.

Use short entries in the change log below rather than relying on chat memory.

## Change Log

- 2026-05-23: Created continuity record after user approved the recommendation to design the Runtime Control Plane and Lifecycle foundation before Memory v2 implementation.
- 2026-05-23: Section 1 of the Runtime Control Plane design approved: goal, boundary, and system split.
- 2026-05-23: Section 2 approved: durable session lifecycle, current pointer, recovery, pause, wrap-up, expiration, and same-day multi-session rules.
- 2026-05-23: Section 3 approved: Runtime Profile dimensions, conservative defaults, derived Permission Envelope, and strict permission boundaries.
- 2026-05-23: Section 4 approved: Event Intake, event schema, JSONL event logs, memory eligibility, provenance, and deterministic routing.
- 2026-05-23: Section 5 approved: Context Engine, explainable context packets, omission reasons, deterministic scoring, and strict permission adherence.
- 2026-06-01: Section 6 approved: Write Coordinator, project-level lock, atomic writes, idempotency, stale-lock recovery, and read-only degradation.
- 2026-06-01: Updated target spec path to use the current date: `docs/superpowers/specs/2026-06-01-along-runtime-control-plane-lifecycle-design.md`.
- 2026-06-01: Section 7 approved: Review Gate, Trace, Doctor, review item scope, trace entries, and debug visibility boundaries.
- 2026-06-01: Section 8 approved: first-version scope, end-to-end runtime flows, test coverage, and explicit non-goals.
- 2026-06-01: Written spec created at `docs/superpowers/specs/2026-06-01-along-runtime-control-plane-lifecycle-design.md` and moved to user-review stage.
- 2026-06-01: User approved the written spec for implementation planning.
- 2026-06-01: Implementation plan created at `docs/superpowers/plans/2026-06-01-along-runtime-control-plane-lifecycle.md`; next decision is Subagent-Driven versus Inline Execution.
- 2026-06-11: Implementation progress checked. Worktree `../Along-worktrees/runtime-control-plane-implementation` on branch `runtime-control-plane-implementation` is at `7f838de feat: integrate runtime control plane`.
  Tasks 1-8 have implementation commits: contracts, Write Coordinator, Runtime Profile, Event/Trace stores, Review Gate, Context Engine, Session Lifecycle, and Runtime integration.
  Tasks 9-10 are not yet implemented: no `src/core/doctor.ts`, no Doctor/review/pause API endpoints in `src/server/app.ts`, and no final frontend/API regression task commit.
  Verification in the implementation worktree: `npm test` passed outside the sandbox with 13 files / 154 tests; `npm run typecheck` passed; `npm run build` passed.
