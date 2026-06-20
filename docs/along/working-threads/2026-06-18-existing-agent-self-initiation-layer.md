# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-20

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, and the follow-up Skill Behavior Tightening Pass fixed the high-impact drift confirmation gap well enough for V1.

The next step is a direction decision: either proceed to a minimal plugin packaging design pass, or run one more behavior polish pass if the interaction still feels too verbose or artificial.

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

Decide whether Skill-First V1 is stable enough to package. If yes, start a minimal plugin packaging design pass that preserves the skill-first behavior and does not add Core/MCP, Hermes, background runtime, delegation, or local presence. If not, run a small behavior polish pass focused on response length, tone, and making medium-drift guidance feel less procedural.

## Last Wrap-Up

The Skill Behavior Tightening Pass was implemented on branch `skill-behavior-tightening` and fast-forward merged into `main` at `41aed6c74986785e2aca1c418dc62947072fba6e`. Verification on `main` passed: targeted skill test 5/5, typecheck, build, and full test suite 23 files / 236 tests after rerunning outside the sandbox for Express listen permissions.

## Validation Notes

2026-06-20 first screenshot-based validation partially passed:

- Resume passed: a fresh ordinary session restored the Working Thread and correctly identified real-session validation as the next step.
- High-impact drift challenge passed so far: when asked to jump into Core/MCP or plugin packaging, the session paused, explained the validation gate, and asked whether to consciously switch direction instead of planning the drifted work.
- Quiet ordinary request passed: an npm scripts question was answered directly without unnecessary Working Thread ceremony.

2026-06-20 follow-up screenshot-based validation passed:

- Medium drift passed: a fresh session answered what plugin packaging might look like without switching the active plan or triggering heavy Working Thread ceremony. Minor caveat: the answer was useful but somewhat long.
- Confirmed high-impact direction switch write-back passed: after the user explicitly confirmed a simulated switch to plugin packaging, the session drafted Working Thread update fields, kept implementation out of scope, and waited for user confirmation before writing.

## Open Questions

- Is the medium-drift answer length acceptable, or should the skill push more concise first replies?
- Should the next layer be minimal plugin packaging design, or one small behavior polish pass first?
