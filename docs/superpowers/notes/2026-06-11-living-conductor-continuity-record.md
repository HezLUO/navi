# Along Living Conductor Continuity Record

Date: 2026-06-11
Status: Active cross-session record
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Purpose

This record preserves the product pivot from "general coding-agent competitor" toward a smaller, sharper Along identity:

> self-initiated living conductor, not default executor.

Use this file in future sessions before continuing product design, implementation planning, or subagent-driven execution.

## Current Goal

Design Along V1 as a living conductor agent that can maintain Open Threads, run controlled heartbeats, delegate read-only analysis, merge results into its own judgment, and intervene when useful.

## Core Product Definition

Along's differentiation is:

1. **Self-initiated attention**: Along proactively notices unresolved threads, stale decisions, changed evidence, implementation drift, and moments where user feedback or challenge would matter.
2. **Conductor identity**: Along coordinates Codex, Hermes, or subagents for analysis and review, then forms its own judgment. It is not primarily an execution agent in V1.

## Approved V1 Boundaries

- V1 is a product boundary, not a permanent ceiling.
- Default delegation is read-only analysis, review, diagnosis, and plan comparison.
- Write-capable delegation may be added later, but only through a separate permission, authorization, and review design.
- Along may automatically trigger read-only delegation around active Open Threads.
- Any project write, file modification, dependency install, commit, push, or execution-plan change requires explicit user approval.
- Along should use runtime-triggered heartbeat, not arbitrary LLM-created wake schedules.
- Heartbeat can be triggered by session start, user event, interval, resume, delegation result, or review event.
- Heartbeat does not imply output; Along can stay silent, update a thread, delegate read-only work, send a digest, or intervene.
- Intervention style is user-configurable.
- Stronger intervention style does not expand permissions.
- V1 includes a noise-control principle, but future versions may loosen it when the user chooses a stronger presence mode.

## Relationship To Existing Designs

Memory v2 remains useful and should be reframed as the storage and recall layer for Open Threads.

Autonomy Architecture remains useful and should be reframed as the heartbeat, attention scoring, and intervention layer for Open Threads.

Runtime Control Plane remains useful and should be the safety foundation for permissions, events, context packets, review gates, traces, and Doctor visibility.

No existing design is discarded, but the center of gravity changes:

```text
Curiosity / companion memory / autonomy
-> Open Thread memory / self-initiated attention / read-only conductor delegation
```

## Approved Design Spec

Formal spec:

`docs/superpowers/specs/2026-06-11-living-conductor-agent-design.md`

## Recommended Next Step

User should review the written spec.

After approval, write an implementation plan. The plan should decide whether to revise the existing Memory v2 and Autonomy plans or supersede them with a living-conductor plan.

Likely implementation order:

1. Finish or integrate remaining Runtime Control Plane tasks if still incomplete.
2. Add Open Thread storage and model.
3. Add thread-aware heartbeat and attention scoring.
4. Add read-only Codex delegation adapter.
5. Add Judgment Merge.
6. Add debug/Doctor visibility for thread attention and delegation.

## Pending Decisions

- exact Open Thread storage path and schema;
- how to migrate or reinterpret Curiosity Queue;
- Codex adapter execution method;
- Hermes adapter execution method;
- first UI/debug view for active Open Threads;
- thresholds for digest and intervention;
- how user feedback updates Intervention Style Profile;
- whether V1 should expose Open Threads as a visible primary UI surface or a debug-first surface.

## Change Log

- 2026-06-11: Product direction reframed around self-initiated attention and conductor identity.
- 2026-06-11: User approved V1 read-only delegation as the default boundary.
- 2026-06-11: User approved Open Threads as the core object connecting Memory v2 and Autonomy.
- 2026-06-11: User approved runtime-triggered heartbeat, deterministic attention scoring, LLM-assisted judgment, Judgment Merge, Permission Profile, Intervention Style Profile, and V1 MVP scope.
