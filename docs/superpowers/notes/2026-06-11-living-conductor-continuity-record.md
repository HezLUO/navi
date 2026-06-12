# Along Living Conductor Continuity Record

Date: 2026-06-11
Status: Active cross-session record
Last updated: 2026-06-12
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Purpose

This record preserves the product pivot from "general coding-agent competitor" toward a smaller, sharper Along identity:

> self-initiated living conductor and companion, not default executor.

Use this file in future sessions before continuing product design, implementation planning, or subagent-driven execution.

## Current Goal

Prepare implementation planning for Along V1 as a living conductor agent that can maintain Open Threads, run controlled heartbeats, delegate read-only analysis, merge results into its own judgment, and intervene when useful.

## Core Product Definition

Along's differentiation is:

1. **Self-initiated attention**: Along proactively notices unresolved threads, stale decisions, changed evidence, implementation drift, and moments where user feedback or challenge would matter.
2. **Conductor identity**: Along coordinates Codex, Hermes, or subagents for analysis and review, then forms its own judgment. It is not primarily an execution agent in V1.
3. **Companionship**: Along's autonomy should feel like staying with the user across unfinished questions, not like surveillance, task enforcement, or generic productivity automation.

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
- Along's core remains self-initiation and companionship. Product surfaces inspired by other assistants must serve that core rather than broaden Along into a general consumer assistant.

## Marvis Reference Conclusion

Marvis is useful as a product-expression reference, not as a positioning target.

Useful ideas to absorb:

- user-readable privacy/delegation modes over the precise Permission Profile;
- Delegation Live View or debug equivalent so the user can watch, stop, edit, rerun, or take over delegated analysis;
- Project Intelligence Library as a visible surface for Open Threads, evidence, judgments, risks, corrections, and delegation results;
- Conductor Packs that express Along's self-initiation in understandable presets such as Implementation Watcher, Design Critic, Research Scout, Memory Curator, and Challenge Mode.

Ideas not to absorb into V1:

- broad consumer assistant positioning;
- PC-butler scenarios;
- always-on daemon just to claim constant presence;
- replacing self-initiation and companionship with generic automation.

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

The living conductor spec is approved, including the 2026-06-12 Marvis-inspired product-expression addendum.

Implementation plan written:

`docs/superpowers/plans/2026-06-12-living-conductor-foundation.md`

The plan supersedes directly executing the older Memory v2 and Autonomy plans for the next implementation pass. It absorbs their useful pieces through Open Threads, attention scoring, Judgment Merge, and runtime-triggered heartbeats.

Next step: execute the living conductor foundation plan in a separate implementation session, preferably with the subagent-driven workflow.

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
- whether Delegation Live View is a standalone surface or part of Doctor/debug.
- which Conductor Pack ships first, if any.

## Change Log

- 2026-06-11: Product direction reframed around self-initiated attention and conductor identity.
- 2026-06-11: User approved V1 read-only delegation as the default boundary.
- 2026-06-11: User approved Open Threads as the core object connecting Memory v2 and Autonomy.
- 2026-06-11: User approved runtime-triggered heartbeat, deterministic attention scoring, LLM-assisted judgment, Judgment Merge, Permission Profile, Intervention Style Profile, and V1 MVP scope.
- 2026-06-12: User approved the written living conductor spec.
- 2026-06-12: Marvis reviewed as product-expression reference. Added privacy/delegation modes, Delegation Live View, Project Intelligence Library, and Conductor Packs as supporting surfaces while preserving self-initiation and companionship as the core.
- 2026-06-12: Wrote the Living Conductor Foundation implementation plan for Open Threads, attention scoring, read-only delegation, Judgment Merge, runtime/API integration, and minimal project-intelligence UI.
