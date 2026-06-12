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

Living Conductor Foundation is merged locally into `main`, verified, and product-calibrated against Along itself. The current goal is Product Expression Tightening before any new capability expansion.

Default next step: user review of the Product Expression Tightening spec. Do not start Memory v2, Hermes adapter, Conductor Packs, write delegation, or implementation planning until that spec is approved.

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

The plan superseded directly executing the older Memory v2 and Autonomy plans for this implementation pass. It absorbed their useful pieces through Open Threads, attention scoring, Judgment Merge, and runtime-triggered heartbeats.

Current next step: decide whether to push, create a PR, keep the local branch/worktree for reference, or clean it up. Do not push, delete the worktree, or rewrite branch history unless explicitly requested.

## Focused Execution Record

Execution session started on 2026-06-12.

Implementation worktree:

`/Users/james/Codex Project/General Codex Project/Along-worktrees/runtime-control-plane-implementation`

Implementation branch:

`runtime-control-plane-implementation`

Execution mode:

- Use `superpowers:subagent-driven-development`.
- Use one fresh implementer subagent per task.
- Do not dispatch multiple implementation subagents in parallel.
- After each task, run two fresh reviews before marking complete:
  1. spec compliance review;
  2. code quality review.
- If a review fails, return to the implementer, fix, commit, and repeat both reviews as required.
- Do not push, merge, delete worktrees, or rewrite history unless explicitly requested.
- Keep implementation on the runtime control plane implementation worktree, not directly on `main`.

Current execution status:

- Runtime prerequisite Task 9 completed: Doctor, runtime Doctor API, review API aliases, and pause/session endpoints were added and hardened.
- Runtime prerequisite Task 10 completed: runtime compatibility and verification coverage were added.
- Living Conductor Task 1 completed: conductor/open thread/delegation/judgment contracts.
- Living Conductor Task 2 completed: Open Thread storage with strict queued writes.
- Living Conductor Task 3 completed: deterministic attention scoring.
- Living Conductor Task 4 completed: read-only Codex delegation adapter.
- Living Conductor Task 5 completed: deterministic Judgment Merge.
- Living Conductor Task 6 completed after spec and code quality reviews passed at implementation HEAD `457ab27`.
- Living Conductor Task 7 completed after spec and code quality reviews passed at implementation HEAD `1193fd1`.
- Living Conductor Task 8 completed after spec and code quality reviews passed at implementation HEAD `3eca4db`.
- Living Conductor Task 9 completed: final integration and validation passed with spec and code quality reviews.
- Final whole-branch review found one safety-boundary blocker in malformed review inbox mutation handling.
- Final review remediation completed at `feda20a`: mutating JSON updates now fail closed on malformed existing JSON, with regression coverage for generic JSON updates and review inbox updates.
- Final whole-branch re-review passed at `feda20a` with no blockers.

Final implementation HEAD:

`feda20a8e6f9d52256571d0f0e581996a105aa12` `Fail closed on malformed JSON updates`

Task 9 created no source commit because no source changes were required.

Post-review remediation commit:

- `feda20a` `Fail closed on malformed JSON updates`

Important Task 6 implementation commits so far:

- `f860d00` `feat: orchestrate conductor heartbeat`
- `5f61b30` `fix: harden conductor delegation orchestration`
- `ebc3d05` `fix: serialize conductor result ingestion`
- `9e4968e` `fix: make conductor result ingestion retryable`
- `b712868` `fix: require active session for conductor heartbeat`
- `6a64ef9` `fix: enforce conductor replay identity`
- `051a6b0` `fix: reject ambiguous conductor replays`
- `9c55c0a` `fix: prevent delegation status downgrades`
- `d21a454` `fix: preserve conductor terminal state`
- `bb443e5` `fix: preserve attention on cancelled delegation`
- `d694c14` `fix: close conductor heartbeat races`
- `457ab27` `fix: guard conductor session identity`

Resolved Task 6 review findings:

- Missing or mismatched delegation results now fail before thread mutation.
- Failed and cancelled terminal results are recorded without merging judgment.
- Cancelled delegation no longer leaves an Open Thread publicly marked as `delegated`.
- Concurrent completed results for one thread preserve both judgment updates and evidence.
- Terminal result timestamps advance thread `updatedAt` for staleness scoring.
- Terminal result retry is idempotent and can converge missing thread state.
- Conflicting terminal replays are rejected before thread mutation, including digestless legacy terminal requests that already have recorded thread state.
- `conductorHeartbeat` rejects wrapped, paused, and paused-then-recovered sessions before creating delegations or traces.
- Stale pending delegation records no longer downgrade completed/failed/cancelled thread history or status.
- Heartbeat lifecycle gating was hardened with a post-`current()` check to close the pause/recovery TOCTOU gap.
- Open Threads that already require user attention remain `needs_user` when a later completed delegation is low-signal.
- Open Threads that already require user attention remain `needs_user` when a later delegation is cancelled.
- Runtime-guarded conductor heartbeat can execute final lifecycle validation and conductor side effects under one repo-level lock.
- Blank-summary completed delegation replay no longer duplicates Judgment Merge fallback text.
- Conductor heartbeat revalidates durable current session identity inside the guarded section before side effects.
- Stale pending delegation refs no longer clear `needs_user` when the effective existing terminal history is `completed`.

Final verification results:

- Focused Living Conductor suite passed after sandbox escalation: 7 test files, 56 tests.
- Full `npm test` passed after sandbox escalation before final remediation: 21 test files, 223 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- API smoke passed for `POST /api/session/start`, `GET /api/conductor/snapshot`, and `POST /api/conductor/heartbeat` with `{"trigger":"user_event"}`.
- Seeded API smoke also covered delegation-result ingestion and Judgment Merge convergence.
- Browser verification passed in the main session:
  - existing session rhythm appeared;
  - Project Intelligence appeared;
  - Delegation Live View appeared;
  - "Check threads" did not cause layout overlap on desktop or mobile;
  - sound did not autoplay;
  - wrap-up wrote a journal entry under `.along/journal/2026-06-12.md`.
- A fresh browser tab with both services running reported zero console errors. Earlier browser console errors were stale API connection failures from before server startup plus a favicon 404.
- Sandbox-only failures and escalations were recorded:
  - Express `listen EPERM` blocked server tests in sandbox;
  - `tsx`/API server listen was blocked in sandbox;
  - Vite listen was blocked in sandbox;
  - escalated reruns were bounded to the required verification commands and passed.

Post-remediation verification results:

- RED/GREEN remediation tests:
  - `npm test -- tests/core/review-gate.test.ts` failed before the fix because malformed inbox update resolved instead of rejecting, then passed after the fix.
  - `npm test -- tests/core/write-coordinator.test.ts` failed before the fix because malformed JSON update resolved as fallback, then passed after the fix.
- `npm test -- tests/core/write-coordinator.test.ts tests/core/review-gate.test.ts tests/core/runtime.test.ts` passed: 3 test files, 74 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- Full `npm test` failed in sandbox only because Express server tests hit `listen EPERM`, then passed after sandbox escalation: 21 test files, 225 tests.
- Ports `4317` and `5173` were checked closed after verification.
- Final whole-branch re-review passed and confirmed the prior malformed review inbox blocker is fixed.

Current pending question:

- No implementation blocker remains after post-remediation review, main-session verification, and local merge to `main`.
- Next decision: keep the implementation branch/worktree as reference, push, create a PR, or clean up later.

Next execution steps:

1. Preserve implementation worktree and branch as-is until cleanup is explicitly requested.
2. Continue future Along design or implementation work from merged `main`.
3. If asked to push or open a PR, verify branch state first and use the GitHub workflow.
4. If asked to clean up, remove the worktree and delete the branch only after confirmation.

## Main Merge Record

Merged locally into `main` on 2026-06-12.

Merge commit:

`445b1b3` `Merge branch 'runtime-control-plane-implementation'`

Post-merge verification on `main`:

- `npm run typecheck` passed.
- `npm run build` passed.
- Full `npm test` passed after sandbox escalation for Express server listening: 21 test files, 225 tests.

Implementation worktree remains preserved:

`/Users/james/Codex Project/General Codex Project/Along-worktrees/runtime-control-plane-implementation`

## Product Calibration Record

First Along-self calibration completed on 2026-06-12.

Report:

`docs/superpowers/notes/2026-06-12-living-conductor-product-calibration.md`

Calibration scenario:

- used Along itself as the project under observation;
- created five real strategic Open Threads under ignored `.along/` runtime state;
- ran a recovered runtime session, user-event heartbeat, interval heartbeat, delegation-result ingestion, Doctor inspection, UI inspection, and wrap-up;
- allowed `.along/` runtime data but made no source code changes during observation.

Key evidence:

- `POST /api/conductor/heartbeat` with `trigger=user_event` selected `read_only_delegation` for five Open Threads.
- Delegation requests preserved read-only scope and forbade file modification, commits, pushes, dependency installs, destructive commands, and project state changes.
- A delegation result for `along-self-initiation` merged as `adds_new_risk` and moved the live Open Thread to `needs_user`.
- A second `trigger=interval` heartbeat did not duplicate pending delegation requests, but still returned `thread_update` for all five threads.
- `POST /api/session/wrap-up` wrote `.along/journal/2026-06-12.md` and queued a review-gated memory candidate.
- Doctor preserved the runtime boundary: `companion`, `project_reviewed`, `ambient`, `canModifyProjectFiles=false`, `canCallTools=false`, `canPromoteMemory=false`.

Calibration conclusion:

Living Conductor Foundation is mechanically sound and should be kept. It proves Open Threads, heartbeat attention, read-only conductor delegation, Judgment Merge, traces, Doctor, journal, and review-gated memory can work together.

Product feel is not yet strong enough. The UI currently reads more like a useful conductor dashboard than a living companion. Self-initiation is present in mechanics, but still weak as a felt experience. Companionship is strongest in wrap-up and journal, weaker in Project Intelligence and Delegation Live View.

Recommended next step:

Run a Product Expression Tightening Pass before Memory v2, Hermes adapter, Conductor Packs, or write delegation.

Focus areas:

- make ambient attention visible without requiring the user to press `Check threads`;
- rank or batch Open Threads instead of delegating all equally eligible threads;
- add clearer stop, edit, rerun, and takeover controls;
- rewrite dense delegation reasons into companion-readable language;
- explain attention decisions through user-relevant stakes, not only scoring factors;
- decide whether `Project intelligence` is a primary product surface or an advanced/debug surface.

## Product Expression Tightening Record

Product Expression Tightening design was drafted on 2026-06-12.

Spec:

`docs/superpowers/specs/2026-06-12-product-expression-tightening-design.md`

Status:

- written from approved design conversation;
- pending user review;
- not yet implementation-planned.

Approved direction:

- Shared Desk First is the V1 direction.
- First screen should answer "what are we holding together right now?" instead of "which modules exist?"
- Along defaults to choosing the Main Thread, and the user can override.
- V1 default attention density is Focused: up to one Main Thread plus up to two Watch Threads.
- This count is a V1 default, not a permanent product limit.
- Lightweight controls are preferred: `Not now`, `Hide`, `Ask why`, `Make this main`, and read-only delegation actions.
- Intervention voice defaults to Judgment First, with Soft Notice and Quiet Offer as variants.
- Delegation remains read-only and should appear as Along's controlled action suggestion, not as a background task list.
- Quiet State is required when no thread deserves attention.

Deferred but interesting future directions:

- Ambient Presence First;
- Living Desktop;
- LLM-assisted attention judgment;
- configurable voice;
- configurable attention density.

## Pending Decisions

- how to migrate or reinterpret Curiosity Queue beyond this foundation;
- Hermes adapter execution method;
- thresholds for digest and intervention beyond deterministic V1 defaults;
- how to express self-initiation as ambient presence rather than a manual dashboard action;
- how to batch, prioritize, or suppress multiple equally eligible Open Threads;
- how stop, edit, rerun, and takeover controls should appear in Delegation Live View;
- whether persisted conductor snapshots should update after delegation-result ingestion or remain heartbeat snapshots only;
- how Shared Desk should persist user overrides such as `Not now`, `Hide`, and `Make this main`;
- whether Project Intelligence should become an advanced library surface after Shared Desk becomes primary;
- how user feedback updates Intervention Style Profile beyond the current preference model;
- whether Open Threads becomes a visible primary UI surface or remains a debug/product-intelligence surface;
- whether Delegation Live View becomes a standalone surface or remains part of the current UI/debug model;
- which Conductor Pack ships first, if any;
- whether and when write-capable delegation gets a separate permission, authorization, and review design.

## Change Log

- 2026-06-11: Product direction reframed around self-initiated attention and conductor identity.
- 2026-06-11: User approved V1 read-only delegation as the default boundary.
- 2026-06-11: User approved Open Threads as the core object connecting Memory v2 and Autonomy.
- 2026-06-11: User approved runtime-triggered heartbeat, deterministic attention scoring, LLM-assisted judgment, Judgment Merge, Permission Profile, Intervention Style Profile, and V1 MVP scope.
- 2026-06-12: User approved the written living conductor spec.
- 2026-06-12: Marvis reviewed as product-expression reference. Added privacy/delegation modes, Delegation Live View, Project Intelligence Library, and Conductor Packs as supporting surfaces while preserving self-initiation and companionship as the core.
- 2026-06-12: Wrote the Living Conductor Foundation implementation plan for Open Threads, attention scoring, read-only delegation, Judgment Merge, runtime/API integration, and minimal project-intelligence UI.
- 2026-06-12: Completed Runtime Control Plane prerequisite tasks 9-10 in the `runtime-control-plane-implementation` worktree.
- 2026-06-12: Completed Living Conductor Foundation Tasks 1-9 using subagent-driven implementation, spec review, and code quality review for each task.
- 2026-06-12: Final validation passed: focused suite, full tests, typecheck, build, API smoke, and browser verification.
- 2026-06-12: Final whole-branch review found and remediated a malformed review inbox data-loss blocker in `feda20a`; post-remediation tests, typecheck, and build passed.
- 2026-06-12: Final whole-branch re-review passed at `feda20a`; no blockers remain.
- 2026-06-12: Main session independently reviewed implementation worktree, reran focused tests, typecheck, build, and full test suite.
- 2026-06-12: Merged `runtime-control-plane-implementation` into `main` locally at `445b1b3`, then reran typecheck, build, and full test suite on merged `main`; all passed.
- 2026-06-12: First Along-self product calibration completed; recommendation is Product Expression Tightening before capability expansion.
- 2026-06-12: Drafted Product Expression Tightening spec around Shared Desk First; pending user review before implementation planning.
