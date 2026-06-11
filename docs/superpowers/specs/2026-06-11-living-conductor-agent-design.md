# Along Living Conductor Agent Design Spec

Date: 2026-06-11
Status: User-approved design, pending implementation planning
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

Along V1 should not compete directly with Codex, Claude Code, Hermes Agent, or other general coding agents on execution strength.

Along V1 is a **living conductor agent**:

> Along's differentiation is self-initiated attention and conductor identity. It proactively notices, judges, delegates, integrates, and intervenes, but it does not default to direct execution.

The first version should prove that Along can:

- maintain unresolved long-running questions as Open Threads;
- wake through controlled runtime heartbeats;
- decide which thread deserves attention;
- delegate read-only analysis to Codex, Hermes, or local subagents;
- merge delegation results into its own judgment;
- update long-term thread state;
- intervene when a meaningful risk, contradiction, or opportunity appears.

This is a V1 boundary, not a permanent ceiling. Later versions may add write-capable delegation or stronger execution authority, but those require separate permission, authorization, and review designs.

## Product Positioning And Non-Competition Boundary

Along V1 is not a general autonomous coding agent and should not try to outperform Codex, Claude Code, or Hermes Agent at completing arbitrary coding tasks.

Its primary role is to keep continuity over unresolved questions and coordinate other agents when analysis would help. Along may call Codex, Hermes, or subagents, but its default responsibility is judgment and orchestration:

- knowing which problems are still open;
- knowing why they matter;
- noticing when new evidence changes the situation;
- deciding whether another agent should inspect something;
- comparing external analysis against prior judgment;
- deciding whether to stay silent, update internal state, send a digest, or interrupt the user.

Write-capable execution is outside the V1 default. Any delegation that modifies project files, creates commits, installs dependencies, pushes branches, or changes durable project state must require explicit user approval.

## Core Object Model: Open Thread

Along V1 should organize its self-initiated behavior around **Open Threads**, not generic tasks.

An Open Thread represents an unresolved long-running question, direction, risk, goal, or judgment that should remain alive across sessions. Examples:

- "What kind of agent should Along be?"
- "Should Along prioritize Runtime Control Plane completion before Memory v2?"
- "How should self-initiation appear without becoming annoying?"
- "Is the current implementation drifting from the approved plan?"

Open Thread is the bridge between Memory v2 and Autonomy:

> Memory stores each thread's evidence, judgment, history, corrections, and links. Autonomy decides which thread deserves attention, whether to delegate, and whether to intervene.

Each Open Thread should include:

- `id`: stable identifier;
- `title`: short user-readable label;
- `status`: `open`, `watching`, `needs_user`, `delegated`, `resolved`, or `archived`;
- `why_it_matters`: why Along and the user should care;
- `current_judgment`: Along's current best judgment;
- `evidence`: sourced observations from conversations, docs, code, runtime events, or delegation results;
- `risks`: known risks, contradictions, or uncertainty;
- `next_attention_trigger`: conditions that make the thread worth revisiting;
- `intervention_threshold`: conditions that justify notifying the user;
- `delegation_history`: read-only delegation attempts and results;
- `memory_links`: links to semantic memory, episodic memory, graph nodes, corrections, and user preferences;
- `trace_refs`: runtime traces explaining important attention, delegation, or intervention decisions.

Open Threads should be inspectable and correctable. Along must not use hidden thread state to influence future behavior without review visibility.

## Runtime-Triggered Heartbeat And Attention Loop

Along V1's self-initiation should not mean arbitrary action. It should mean controlled runtime-triggered opportunities to re-evaluate Open Threads.

Heartbeat triggers are deterministic runtime events, such as:

- `session_start`: the user opens Along or resumes a project;
- `user_event`: the user says something, approves a design, rejects a suggestion, or completes a review;
- `interval`: the app is open and the runtime gives Along a low-frequency attention opportunity;
- `resume`: the user returns after real time has passed;
- `delegation_result`: Codex, Hermes, or a subagent returns analysis;
- `review_event`: the user accepts, edits, or rejects a memory, judgment, or intervention.

The trigger only gives Along a chance to inspect state. It does not force output.

After each heartbeat, Along runs an Attention Loop:

1. Load active Open Threads within the current permission envelope.
2. Build small sourced context packets for candidate threads.
3. Compute deterministic attention scores.
4. Use LLM-assisted judgment only where semantic comparison or explanation is useful.
5. Decide whether to stay silent, update a thread, delegate read-only analysis, send a digest, or intervene.
6. Write trace entries explaining important decisions.

The V1 attention score should be deterministic and explainable. It may include:

- `risk_delta`: risk increased or decreased;
- `judgment_delta`: Along's judgment changed;
- `staleness`: the thread has not been revisited for a meaningful period;
- `continuity`: the thread is tied to a long-term user goal;
- `evidence_gap`: current judgment lacks enough support;
- `delegation_value`: read-only analysis could materially reduce uncertainty;
- `interruption_cost`: notifying the user now may be disruptive;
- `user_preference_fit`: the action matches configured intervention preferences.

The LLM should not freely create wake schedules, infinite loops, or background activity in V1. Reality time participates in scoring, but scheduling remains controlled by the runtime.

## Read-Only Delegation Loop

Along V1 may proactively call Codex, Hermes, or local subagents for read-only work.

Allowed default delegation purposes:

- analysis;
- review;
- diagnosis;
- plan comparison;
- implementation progress inspection;
- risk discovery;
- evidence gathering from approved local context.

Forbidden default delegation actions:

- modifying files;
- creating commits;
- pushing branches;
- installing dependencies;
- running destructive commands;
- writing project state outside Along-owned records;
- changing product decisions without user review.

A read-only delegation request should include:

- `thread_id`: the Open Thread being served;
- `reason`: why Along believes delegation is worthwhile now;
- `delegate_target`: Codex, Hermes, local subagent, or another adapter;
- `scope`: allowed repositories, files, docs, or context;
- `forbidden_actions`: explicit non-write and non-destructive boundaries;
- `question`: the precise question to answer;
- `expected_output`: risks, evidence, alternatives, confidence, and recommendations;
- `budget`: timeout, token, or effort limit;
- `return_format`: structured result format for Judgment Merge.

Codex should be the first concrete adapter because it has a scriptable read-only execution path and fits the current development environment. Hermes can follow as a second adapter once its local execution and result-capture boundaries are verified.

The adapter interface should be capability-based rather than product-specific:

```ts
type AgentAdapter = {
  name: string;
  capabilities: string[];
  canRun(input: DelegationRequest): Promise<boolean>;
  buildPrompt(input: DelegationRequest): Promise<string>;
  runReadOnly(input: DelegationRequest): Promise<DelegationResult>;
};
```

## Judgment Merge And Intervention

Along must not simply forward another agent's result. Every delegation result, user correction, product decision, or implementation signal should pass through **Judgment Merge**.

Judgment Merge answers:

- Does the new evidence support the current judgment?
- Does it weaken, contradict, or reshape the current judgment?
- Which risks changed?
- Which evidence gaps closed or opened?
- Should the thread status change?
- Should a new Open Thread be created?
- Should the user be notified now?

Delegation results should be classified as:

- `supports_current_judgment`;
- `weakens_current_judgment`;
- `contradicts_current_judgment`;
- `adds_new_risk`;
- `closes_evidence_gap`;
- `creates_new_thread`;
- `irrelevant_or_low_signal`.

V1 intervention conditions should include:

- the user's current direction conflicts with a long-term stated goal;
- the user is about to proceed on a high-risk or under-evidenced path;
- implementation results visibly drift from an approved plan;
- read-only delegation reveals an important gap;
- an important thread has stalled and a concrete opportunity appears;
- the user has asked Along to challenge them in this class of situations.

V1 should include a noise-control principle:

> Along may proactively judge, but it should not frequently prove that it exists. Without a meaningful judgment change, it should stay silent or update thread state.

This is a V1 safety valve, not a permanent product rule. Later versions may allow more frequent presence, stronger companionship, or more dramatic relationship modes when the user explicitly chooses them.

## Permission Profile And Intervention Style Profile

Along V1 should separate authority from tone.

Choosing a stronger intervention style must not grant broader permissions. Enabling debug visibility must not bypass review gates. Selecting a warm or dramatic relationship mode must not authorize project writes.

### Permission Profile

Permission Profile controls what Along may read, write, remember, and call:

- `memory_mode`: `off`, `session_only`, `project_reviewed`, or `global_reviewed`;
- `delegation_mode`: `off`, `suggest_only`, `read_only_auto`, or `write_requires_approval`;
- `project_write_permission`: default `false`;
- `global_memory_promotion`: default `requires_review`;
- `procedure_learning`: default `candidate_only`;
- `debug_visibility`: `off`, `normal`, or `research`.

Recommended V1 default:

> project-reviewed memory, automatic read-only delegation, write delegation requiring approval, procedural learning as candidates only, normal debug visibility.

### Intervention Style Profile

Intervention Style Profile controls how Along speaks when it decides to intervene:

- `default_style`: calm reviewer, collaborative companion, strong challenger, or custom;
- `challenge_directness`: low, medium, or high;
- `digest_preference`: off, brief, or normal;
- `high_risk_escalation`: allowed or disabled;
- `quiet_hours`: optional;
- `feedback_learning`: whether Along should adapt after "too frequent", "too weak", "too strong", or "useful" feedback.

High-risk situations may temporarily increase directness if the profile allows escalation, but Along must cite the reason and evidence rather than rely on personality performance.

## V1 MVP Scope

V1 should prove the living conductor loop in one real scenario before expanding.

The best first scenario is Along supervising its own project:

> Along tracks its product design and implementation progress, notices that Runtime Control Plane implementation is incomplete, delegates Codex to read-only inspect progress, merges the result into its judgment, and recommends whether to finish Doctor/API work before moving into Memory v2.

V1 should include:

- Open Thread data model and local storage;
- thread status, evidence, judgment, risk, and history updates;
- runtime-triggered heartbeat;
- deterministic attention scoring;
- read-only Codex delegation adapter;
- result ingestion for delegation outputs;
- Judgment Merge;
- Permission Profile;
- Intervention Style Profile;
- trace and Doctor visibility;
- a simple UI or debug view for active threads, recent judgment changes, delegation history, and pending user confirmations.

V1 should not include:

- automatic write delegation;
- always-on background daemon;
- vector database;
- cloud sync;
- multi-platform message gateway;
- full task management system;
- generic coding-agent execution loop;
- automatic dependency installation;
- automatic commits or pushes;
- complex personality or emotion simulation;
- full visual memory browser.

## Data Flow

The V1 flow should be:

```text
User / Runtime / Delegation Result / Project Signal
-> Event Intake
-> Open Thread Store
-> Context Packet
-> Attention Scoring
-> Optional Read-only Delegation
-> Judgment Merge
-> Thread Update
-> Optional Digest / Intervention
-> Trace / Doctor
```

This flow should mount on the existing Runtime Control Plane concepts:

- Event Intake normalizes user, runtime, project, and delegation events.
- Context Engine builds small, sourced context packets.
- Permission Envelope constrains reads, writes, delegation, and memory effects.
- Review Gate controls memories, procedures, global promotion, and future behavior changes.
- Trace and Doctor explain decisions without expanding authority.

## Relationship To Existing Designs

This spec does not discard earlier Memory v2 or Autonomy work. It reframes them.

Memory v2 becomes the storage and recall foundation for Open Threads:

- episodic memory records thread-relevant events and sessions;
- semantic memory stores stable decisions and user preferences;
- graph memory connects threads, decisions, risks, corrections, and delegation results;
- review gates ensure behavior-affecting memory remains visible and correctable;
- recall packets give Along small, sourced context for attention and judgment.

Autonomy Architecture becomes the runtime attention and intervention foundation:

- motivation signals become attention signals over Open Threads;
- temporal rhythm becomes runtime-triggered heartbeat behavior;
- option scoring decides silent update, read-only delegation, digest, or intervention;
- risk envelope constrains proactive behavior;
- intention ledger records commitments such as "watch this thread" or "ask Codex to inspect this gap";
- language realization follows the user's Intervention Style Profile.

Runtime Control Plane remains the safety and lifecycle foundation:

- durable session lifecycle;
- runtime profile;
- permission envelope;
- event intake;
- context packets;
- write coordination;
- review gate;
- trace and Doctor.

## Testing And Success Criteria

Tests should verify that Along behaves like a living conductor, not just a wrapper around other agents.

Core tests:

- A stale but important Open Thread receives a higher attention score after heartbeat.
- A low-risk thread results in `silent` or `thread_update`, not user interruption.
- Evidence of implementation-plan drift creates a read-only delegation candidate or intervention candidate.
- A Codex delegation result updates Along's judgment rather than being forwarded verbatim.
- Strong challenger style changes intervention directness without expanding permissions.
- Without write approval, delegation cannot modify project files or request modifications.
- Doctor explains why a thread was noticed, why delegation happened, and why the user was or was not interrupted.
- User correction is recorded as memory and affects later attention or intervention decisions.

V1 success criteria:

- Along maintains 3-5 real Open Threads for the Along project.
- It runs runtime-triggered heartbeats while staying silent most of the time.
- It proactively initiates at least one read-only Codex delegation.
- It merges the delegation result into its own judgment.
- It proactively flags at least one real plan or implementation drift.
- It can explain its behavior through trace and Doctor output.

## Open Implementation Decisions

The implementation plan should resolve these decisions before code changes:

- exact Open Thread file format and storage location;
- whether Open Thread state lives under `.along/threads/`, existing graph memory, or both;
- Codex adapter invocation method and output capture format;
- first UI/debug surface for Open Threads and delegation history;
- attention score thresholds and defaults;
- how to represent user feedback on interventions;
- how to migrate or reinterpret existing curiosity queue data;
- whether to revise the existing Memory v2 and Autonomy plans or supersede them with a living-conductor plan.
