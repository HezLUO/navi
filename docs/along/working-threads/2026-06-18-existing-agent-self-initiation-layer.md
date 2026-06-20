# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-20

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, but high-impact drift confirmation needed tightening. The Skill Behavior Tightening Pass has now been implemented and fast-forward merged into `main`.

The next step is to finish subjective real-session validation of the tightened behavior, not Core/MCP or plugin packaging.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not implement Core/MCP in V1.
- Do not package a plugin in V1.
- Do not implement Hermes adapter in V1.
- Do not implement local/desktop presence surface in V1.
- Do not implement delegation candidate or conductor workflow in V1.
- Do not use `.along/` as the V1 Working Thread continuity store.
- Do not write durable Working Thread docs without user confirmation.
- Do not plan a drifted direction before the user confirms the direction switch.

## Drift Triggers

- The work shifts from skill-first validation into Core/MCP implementation.
- The work shifts toward plugin packaging before behavior is validated.
- The agent starts planning a drifted direction before asking the user to confirm the direction switch.
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

Repeat real-session validation for resume, drift, wrap-up, quietness, and ordinary tool-answer behavior. Use normal Codex sessions rather than a focused execution session, then decide whether the tightened skill behavior is good enough to move toward plugin packaging or whether another behavior pass is needed first.

## Last Wrap-Up

The Skill Behavior Tightening Pass was implemented on branch `skill-behavior-tightening` and fast-forward merged into `main` at `41aed6c74986785e2aca1c418dc62947072fba6e`. Verification on `main` passed: targeted skill test 5/5, typecheck, build, and full test suite 23 files / 236 tests after rerunning outside the sandbox for Express listen permissions.

## Validation Notes

2026-06-20 first screenshot-based validation partially passed:

- Resume passed: a fresh ordinary session restored the Working Thread and correctly identified real-session validation as the next step.
- High-impact drift challenge passed so far: when asked to jump into Core/MCP or plugin packaging, the session paused, explained the validation gate, and asked whether to consciously switch direction instead of planning the drifted work.
- Quiet ordinary request passed: an npm scripts question was answered directly without unnecessary Working Thread ceremony.
- Still untested: medium-drift behavior and confirmed high-impact direction switch write-back drafting.

## Open Questions

- Does the tightened high-drift challenge stop planning Core/MCP or plugin packaging until confirmation?
- Does the medium-drift note feel helpful rather than noisy?
- Does ordinary request quietness remain intact?
- Does automatic write-back drafting after confirmed high-impact drift feel useful, or does it still feel like paperwork?
- After tightening and revalidation, should the next layer be plugin packaging or a minimal Core/MCP contract slice?
