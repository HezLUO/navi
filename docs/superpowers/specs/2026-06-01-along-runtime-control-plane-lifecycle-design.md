# Along Runtime Control Plane and Lifecycle Design Spec

Date: 2026-06-01
Status: Approved for implementation planning
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

This spec defines the runtime foundation that Memory v2 and Autonomy must mount onto.

Along already has approved directions for memory and autonomy, but both depend on the same lower-level contracts:

- what session is currently active;
- which runtime mode and memory mode are in effect;
- what Along is allowed to read, write, remember, ask, or initiate;
- which events are eligible for context, review, graph, journal, or memory;
- how context is assembled and explained;
- how `.along/` writes stay consistent;
- how review, trace, diagnosis, and recovery work.

The Runtime Control Plane is that shared foundation. It is a thin but strict contract layer, not a large orchestrator.

Core framing:

> When Along has memory, state, spontaneity, permissions, context, and write behavior, the Runtime Control Plane decides what session is active, what is allowed, what context is used, where state is written, how failures recover, and why a decision happened.

## Goals

- Add a durable session lifecycle that survives page refresh and API restart.
- Centralize runtime profile, memory mode, style, accountability, autonomy level, and feature flags.
- Derive a concrete Permission Envelope for each session or tick.
- Normalize all meaningful runtime activity into structured events.
- Build small, sourced, budgeted, explainable context packets.
- Coordinate `.along/` writes through atomic, idempotent, lock-aware behavior.
- Gate memory promotion, global memory, procedural memory, graph relations, style changes, and proactive behavior through review.
- Record trace entries that explain runtime decisions.
- Provide a Doctor surface for debugging and trust.
- Keep the first implementation deterministic, inspectable, and testable.

## Non-Goals

- Do not implement Memory v2 algorithms in this layer.
- Do not implement Autonomy motivation, scoring, or language realization in this layer.
- Do not add vector retrieval.
- Do not add SQLite or another database.
- Do not add cloud sync.
- Do not add an always-on background daemon.
- Do not add multi-agent execution.
- Do not build a full settings UI.
- Do not auto-execute generated skills.
- Do not automatically promote global memory.
- Do not grant project code modification permission.
- Do not use debug or research mode to bypass review or permissions.

## Design Principles

### Thin But Strict

The control plane should stay small, but all memory, autonomy, session, event, context, and write behavior must obey it.

### Local And Durable

Project runtime state lives under `.along/`. The current session pointer must be stored on disk, not only in process memory.

### Review Before Influence

Candidates may be created automatically when allowed, but anything that affects future behavior, relationship tone, global memory, procedural memory, or proactive behavior must pass through Review Gate.

### Explainability Is A Runtime Contract

Along should be able to answer why it restored a session, why it included context, why it did not message, why it created a memory candidate, and why it entered recovery or read-only mode.

### Permissions Are Not Personality

Close style, strict accountability, debug visibility, and proactive behavior do not automatically grant broader file, tool, memory, or write permissions.

## Architecture

```text
Runtime Control Plane
|- Lifecycle Manager
|- Runtime Profile
|- Permission Envelope
|- Event Intake
|- Context Engine
|- Write Coordinator
|- Review Gate
|- Trace / Doctor
`- Recovery Policy
```

### Lifecycle Manager

Owns session state, current pointer, session index, pause, wrap-up, expiration, and API restart recovery.

### Runtime Profile

Owns the effective runtime mode, memory mode, presence mode, relationship style, accountability level, autonomy level, debug mode, and feature flags.

### Permission Envelope

Derives what the current session or tick may do from the effective Runtime Profile.

### Event Intake

Normalizes user, Along, runtime, filesystem, tool, and system activity into standard events before memory, graph, journal, context, or autonomy consumes them.

### Context Engine

Builds small context packets with source references, inclusion reasons, confidence, scope, risk, and omissions.

### Write Coordinator

Coordinates all `.along/` state writes through atomic updates, append-only event logs, idempotency keys, and a project-level lock.

### Review Gate

Controls promotion or activation of memory, global memory, procedural memory, graph relations, relationship style changes, accountability changes, proactive behavior changes, and sensitive inferences.

### Trace / Doctor

Records runtime decisions and exposes current state, failures, pending review, permissions, and context health.

### Recovery Policy

Handles stale locks, missing files, corrupt state, index drift, repeated requests, and degraded read-only mode.

## File Layout

```text
.along/
  state.json
  settings.json
  sessions/
    current.json
    index.json
    <session-id>.json
  events/
    <session-id>.jsonl
  context/
    <context-packet-id>.json
  review/
    inbox.json
  traces/
    <session-id>.jsonl
  locks/
    runtime.lock
```

Existing Memory v2 paths such as `journal/`, `episodes/`, `memory/`, `graph/`, `recall/`, and `procedures/` remain valid, but this control plane defines how future writes to those areas should be authorized, coordinated, and traced.

## Session Lifecycle

```ts
type SessionLifecycleState =
  | "new"
  | "active"
  | "paused"
  | "wrapped"
  | "expired"
  | "recovered";
```

State meanings:

- `new`: created but not fully restored or initialized.
- `active`: currently accompanying the user.
- `paused`: user left, browser disconnected, or idle time passed, but the session is still recoverable.
- `wrapped`: user explicitly ended the session through wrap-up.
- `expired`: session is too old to auto-resume as active.
- `recovered`: session was restored from disk after page refresh, API restart, or runtime recovery.

### Durable Session Files

`.along/state.json` stores project-level runtime state:

- schema version;
- runtime version;
- last active session id;
- last opened time;
- coarse health status;
- effective profile summary.

`.along/sessions/current.json` stores only the current pointer:

- session id;
- lifecycle state;
- updated time;
- project path;
- recovery hint.

`.along/sessions/index.json` stores session metadata for restore, history, same-day multi-session behavior, and future resume picker.

`.along/sessions/<session-id>.json` stores the complete session record.

### Recovery Rules

```text
Page load / API start
-> read current.json
-> read session file
-> validate projectPath + state + age
-> if active/paused/recovered and not expired: restore
-> if wrapped: show last wrap-up summary, then offer or start a new session
-> if missing/corrupt/expired: create new session with recovery trace
```

Default time behavior:

- Page refresh restores the current session.
- API restart restores the current session from `.along/sessions/current.json`.
- Idle for 30 minutes marks the session `paused`, but still recoverable.
- More than 12 hours or a natural-day boundary prevents silent auto-resume as active.
- Explicit wrap-up marks the session `wrapped` and closes the lifecycle.

Same-day sessions must use stable session ids. Date-only names are not unique enough.

## Runtime Profile

Runtime Profile is split into independent dimensions rather than one large mode.

```ts
type RuntimeProfile = {
  runtimeMode: "companion" | "debug" | "research";
  memoryMode: "off" | "session" | "project_reviewed" | "project_auto" | "global_reviewed";
  presenceMode: "ambient" | "focused" | "interactive" | "resting";
  relationshipStyle: "calm" | "close" | "reflective" | "challenger";
  accountabilityLevel: "off" | "gentle" | "direct" | "strict";
  autonomyLevel: "quiet" | "suggestive" | "proactive";
  featureFlags: Record<string, boolean>;
};
```

Default profile:

```ts
{
  runtimeMode: "companion",
  memoryMode: "project_reviewed",
  presenceMode: "ambient",
  relationshipStyle: "calm",
  accountabilityLevel: "off",
  autonomyLevel: "quiet",
  featureFlags: {}
}
```

Profile storage:

```text
.along/settings.json
```

The runtime reads settings at session start, derives an effective profile, and records that effective profile in session trace.

`project_auto` is a recognized future mode, but it is not part of the first implementation. The first implementation should keep project memory in reviewed flow unless a later approved design explicitly enables automatic project memory promotion.

## Permission Envelope

Permission Envelope is derived from the effective profile.

```ts
type PermissionEnvelope = {
  canReadProject: boolean;
  canReadAlongMemory: boolean;
  canWriteSession: boolean;
  canWriteJournal: boolean;
  canCreateMemoryCandidate: boolean;
  canPromoteMemory: boolean;
  canUpdateGraph: boolean;
  canShowStatus: boolean;
  canAskUser: boolean;
  canProactivelyMessage: boolean;
  canCallTools: boolean;
  canModifyProjectFiles: boolean;
  requiresReview: {
    memoryPromotion: boolean;
    globalMemory: boolean;
    proceduralMemory: boolean;
    proactiveMessage: boolean;
    projectFileWrite: boolean;
  };
};
```

Hard rules:

- `canModifyProjectFiles` defaults to `false`.
- Future project file modification requires a separate approved design and explicit authorization.
- Global memory always requires review.
- Procedural memory always starts as a candidate and is never auto-executed.
- Strict accountability may affect language and prompting frequency, but not file, tool, or memory permissions.
- Debug and research modes increase visibility, not authority.

## Event Intake

Event Intake standardizes meaningful runtime activity.

```ts
type AlongEvent = {
  id: string;
  schemaVersion: 1;
  occurredAt: string;
  receivedAt: string;
  sessionId: string;
  source: "user" | "along" | "runtime" | "filesystem" | "tool" | "system";
  kind: AlongEventKind;
  visibility: "internal" | "user_visible" | "reviewable";
  scope: "session" | "project" | "global_candidate";
  payload: Record<string, unknown>;
  provenance: {
    route?: string;
    filePath?: string;
    command?: string;
    parentEventId?: string;
  };
  memoryEligibility: "never" | "session_only" | "candidate" | "review_required";
  riskLevel: "low" | "medium" | "high";
};
```

First-version event kinds:

```ts
type AlongEventKind =
  | "session_started"
  | "session_recovered"
  | "session_paused"
  | "session_wrapped"
  | "user_message"
  | "user_correction"
  | "user_preference"
  | "user_refusal"
  | "user_review_decision"
  | "along_tick"
  | "presence_state_changed"
  | "curiosity_created"
  | "project_observed"
  | "file_summary_changed"
  | "memory_candidate_created"
  | "graph_relation_candidate_created"
  | "journal_written"
  | "error_recorded"
  | "recovery_performed";
```

Event logs are append-only JSONL:

```text
.along/events/<session-id>.jsonl
```

Event flow:

```text
Raw input
-> normalize
-> validate schema
-> assign id/session/source/kind
-> classify visibility/scope/memoryEligibility/risk
-> append event log
-> route to session/context/review/memory/graph/trace
```

Rules:

- User corrections default to `review_required`.
- User preferences default to `review_required` unless they only affect the current session.
- User refusals must be recorded to suppress repeated proposals.
- Along ticks default to `session_only` or `never`; they do not automatically become long-term memory.
- Project observations record what Along saw, not inferred user intent.
- Errors and recovery actions must be events.

The first version is a local deterministic pipeline, not a full queue system.

## Context Engine

Context Engine builds context packets for a specific purpose.

```ts
type ContextPacket = {
  id: string;
  createdAt: string;
  sessionId: string;
  purpose:
    | "session_start"
    | "autonomy_tick"
    | "wrap_up"
    | "memory_consolidation"
    | "user_response"
    | "debug_inspection";
  budget: {
    maxItems: number;
    maxApproxTokens: number;
  };
  sections: ContextSection[];
  omissions: ContextOmission[];
};
```

```ts
type ContextSection = {
  kind:
    | "current_session"
    | "recent_events"
    | "project_summary"
    | "active_curiosity"
    | "reviewed_memory"
    | "memory_candidate"
    | "graph_neighborhood"
    | "journal_excerpt"
    | "runtime_profile"
    | "permission_envelope";
  items: ContextItem[];
};

type ContextItem = {
  id: string;
  content: string;
  sourceRef: string;
  includedBecause: string;
  confidence: "low" | "medium" | "high";
  scope: "session" | "project" | "global";
  riskLevel: "low" | "medium" | "high";
};
```

Omissions are required:

```ts
type ContextOmission = {
  sourceRef: string;
  reason:
    | "budget"
    | "permission_denied"
    | "requires_review"
    | "expired"
    | "low_relevance"
    | "risk_too_high";
};
```

Default purpose policies:

- `session_start`: current pointer, last wrap-up summary, active curiosity, and a small amount of reviewed project memory.
- `autonomy_tick`: current session, recent events, Permission Envelope, active curiosity, and necessary graph influence.
- `wrap_up`: session events, curiosity, presence transitions, user corrections/refusals, and journal inputs.
- `memory_consolidation`: eligible events, review decisions, source episodes, existing facts, and candidate generation context.
- `user_response`: current session, recent user messages/corrections, and necessary project summary.
- `debug_inspection`: provenance, omissions, budget, and trace-linked context without expanded permissions.

The first implementation should use deterministic scoring, not embeddings:

```text
score = recency + explicitness + reviewedStatus + purposeMatch + graphDistanceBonus - riskPenalty
```

Context Engine does not generate memory, bypass permissions, or allow unreviewed candidates to influence ordinary companionship behavior.

## Write Coordinator

All `.along/` state writes should pass through Write Coordinator.

```ts
type WriteIntent = {
  id: string;
  sessionId?: string;
  kind:
    | "append_event"
    | "update_session"
    | "update_current_pointer"
    | "update_session_index"
    | "write_journal"
    | "create_memory_candidate"
    | "update_review_inbox"
    | "update_graph"
    | "write_trace";
  targetPath: string;
  idempotencyKey: string;
  payload: unknown;
};
```

Write behavior:

- JSON state files use temp-write, close, then rename.
- JSONL event logs are append-only.
- Markdown journals must avoid same-day overwrite by using session-specific sections or anchors.
- Session file, current pointer, and index updates are one logical operation.
- Graph and review inbox updates start as candidates when review is required.

## Locking

First version uses a project-level single-writer lock:

```text
.along/locks/runtime.lock
```

Lock file metadata should include:

- owner;
- process hint;
- created time;
- expiration time;
- operation.

Lock rules:

- Stale locks may be recovered, but recovery must be traced.
- Lock conflicts should return explainable errors or bounded retries.
- No module should implement its own independent `.along/` lock.

## Idempotency

Every API write operation should have an idempotency key.

Required guarantees:

- Repeated wrap-up does not write duplicate journal entries.
- Repeated session start does not create two active sessions unless explicitly requested.
- Repeated event append is recognized as retry or duplicate.
- Graph edges and memory candidates use stable de-duplication keys.

## Recovery Policy

```text
On startup / before write
-> inspect locks
-> detect stale lock
-> inspect current pointer + session file + event log
-> repair index if safe
-> mark session recovered if needed
-> record recovery_performed event
```

Failure policy:

```ts
type WriteFailurePolicy =
  | "fail_fast"
  | "retry_once"
  | "recover_then_retry"
  | "degrade_readonly";
```

Meanings:

- `fail_fast`: schema, permission, target path, or authorization is invalid.
- `retry_once`: short lock conflict or temporary IO failure.
- `recover_then_retry`: stale lock or repairable index drift.
- `degrade_readonly`: write state is not trustworthy enough to keep mutating.

If `.along/` is untrusted, Along should enter read-only or low-capability mode rather than continue producing new memory.

## Review Gate

Review Gate governs changes that affect future behavior, project understanding, relationship tone, memory, graph, procedural knowledge, or proactive behavior.

```ts
type ReviewItemKind =
  | "memory_candidate"
  | "global_memory_candidate"
  | "procedural_memory_candidate"
  | "graph_relation_candidate"
  | "relationship_style_change"
  | "accountability_change"
  | "proactive_behavior_change"
  | "sensitive_inference";
```

```ts
type ReviewItem = {
  id: string;
  kind: ReviewItemKind;
  createdAt: string;
  sessionId: string;
  proposedChange: string;
  sourceRefs: string[];
  reason: string;
  riskLevel: "low" | "medium" | "high";
  defaultAction: "ignore" | "ask" | "keep_as_candidate";
  status: "pending" | "accepted" | "edited" | "rejected" | "expired";
};
```

Rules:

- Project memory can enter candidate state, but future influence requires review unless a future explicit mode changes that.
- Global memory always requires review.
- Procedural memory and skill candidates always require review and never auto-execute.
- Relationship style, accountability level, and proactive behavior changes require explicit confirmation.
- Sensitive inferences are not saved by default. Future support requires a separate design.
- Rejections must be recorded to suppress repeated proposals.

Review inbox path:

```text
.along/review/inbox.json
```

## Trace

Trace is the runtime audit trail.

```text
.along/traces/<session-id>.jsonl
```

```ts
type TraceEntry = {
  id: string;
  at: string;
  sessionId?: string;
  operation: string;
  inputs: string[];
  decision: string;
  reason: string;
  permissionSnapshot?: string;
  contextPacketId?: string;
  relatedEventIds: string[];
  outcome: "allowed" | "blocked" | "queued" | "failed" | "recovered";
};
```

Trace should answer:

- why a session was recovered;
- why a memory became a candidate;
- why Along did or did not proactively message;
- why wrap-up wrote specific outputs;
- why runtime entered recovery or read-only mode.

Trace is not product copy. User-facing UI can summarize it.

## Doctor

Doctor exposes runtime health and explanation.

First-version Doctor should show:

- current session lifecycle;
- effective Runtime Profile;
- Permission Envelope;
- current pointer health;
- recent events;
- latest context packet summary;
- pending review items;
- recent write or recovery failures;
- `.along/` mode: writable, degraded, or read-only.

Doctor and debug mode cannot bypass Review Gate or permissions.

## API Surface

First-version API:

```text
GET  /api/session/current
POST /api/session/start
POST /api/session/pause
POST /api/session/wrap-up
GET  /api/runtime/doctor
GET  /api/runtime/traces?sessionId=...
GET  /api/review/inbox
POST /api/review/:id/accept
POST /api/review/:id/reject
POST /api/review/:id/edit
```

`GET /api/session/current` returns a disk-recovered current session when valid, or `null` with a reason.

`POST /api/session/start` creates a new session and updates the session file, current pointer, and index as one logical operation.

`POST /api/session/wrap-up` writes journal/episode outputs, creates eligible review candidates, marks the session wrapped, and is idempotent.

## End-To-End Flows

### App Or API Start

```text
App/API start
-> recover or create runtime state
-> load settings.json
-> derive effective RuntimeProfile
-> derive PermissionEnvelope
-> recover current session if valid
-> record session_started/session_recovered event
-> build session_start ContextPacket
-> expose current state to UI
```

### Tick

```text
tick requested
-> verify session lifecycle is active/recovered
-> derive PermissionEnvelope
-> record along_tick event
-> build autonomy_tick ContextPacket
-> apply permission/review gates
-> write status/trace only if allowed
```

### Wrap-Up

```text
wrap-up requested
-> lock .along runtime
-> record session_wrapped event
-> build wrap_up ContextPacket
-> write journal/episode summary
-> create memory candidates if eligible
-> update review inbox
-> update current pointer to wrapped
-> append trace
-> release lock
```

### Recovery Failure

```text
startup detects missing/corrupt/stale state
-> enter recovered or degraded_readonly mode
-> write recovery_performed event if safe
-> expose reason in Doctor
-> avoid memory promotion until state is healthy
```

## First-Version Scope

Must include:

1. Durable Session Lifecycle.
2. Runtime Profile and Permission Envelope.
3. Event Intake JSONL.
4. Context Packet Builder.
5. Write Coordinator and project lock.
6. Review Inbox basic structure.
7. Trace and Doctor API.

Must not include:

1. Vector retrieval.
2. SQLite or another database.
3. Cloud sync.
4. Always-on daemon.
5. Multi-agent execution.
6. Full settings UI.
7. Automatic skill execution.
8. Automatic global memory promotion.
9. Project code modification permission.

## Testing

Required tests:

- Session recovery: after API restart, current session recovers from `current.json`.
- Wrap-up idempotency: repeated wrap-up does not duplicate journal entries or memory candidates.
- Event logging: key operations produce schema-valid JSONL events.
- Permission derivation: strict or debug modes do not grant project file writes or global memory promotion.
- Context packet: source refs, inclusion reasons, omissions, and permission filtering are present.
- Lock recovery: stale lock can recover and leaves a trace.
- Review gate: global memory and procedural memory candidates cannot auto-promote.
- Doctor: reports session lifecycle, profile, permissions, pending review, and recent errors.
- Product regression: frontend still shows current session, presence rhythm, and wrap-up feedback.

## Acceptance Criteria

The control plane is successful when:

- refreshing the page does not create a needless new session;
- restarting the API can restore the valid current session from disk;
- explicit wrap-up closes the session lifecycle;
- repeated API requests do not duplicate session, journal, event, review, or graph records;
- unreviewed candidates cannot silently influence normal companionship behavior;
- debug and research modes explain more without granting more authority;
- Doctor can explain current session, profile, permissions, pending review, recent context, and recovery state;
- Memory v2 and Autonomy can use the same session, permission, event, context, write, review, trace, and recovery contracts.

## Implementation Order Recommendation

After written-spec review, the implementation plan should start with the lowest shared contracts:

1. File schemas and migration-safe defaults.
2. Write Coordinator, atomic writes, idempotency, and lock recovery.
3. Durable Lifecycle Manager.
4. Runtime Profile and Permission Envelope derivation.
5. Event Intake.
6. Context Packet Builder.
7. Review Inbox.
8. Trace and Doctor.
9. Existing API/UI integration.
10. Regression tests and browser verification.

This keeps Memory v2 and Autonomy from depending on unstable or scattered runtime behavior.
