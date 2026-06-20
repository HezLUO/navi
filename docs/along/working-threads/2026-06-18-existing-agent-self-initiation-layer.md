# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-20

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, but high-impact drift confirmation needs tightening. The approved Skill Behavior Tightening Pass should make ordinary requests quiet, medium drift lightly contextual, and high drift confirmation-gated before any drifted direction planning.

The next step is implementation of the Skill Behavior Tightening Pass, not Core/MCP or plugin packaging.

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

Implement the Skill Behavior Tightening Pass by updating the Along Working Thread skill, adding drift ladder examples, adding bounded adaptive write-back guidance, and expanding the skill documentation tests. Then repeat real-session validation for resume, drift, wrap-up, and quietness.

## Last Wrap-Up

The Skill Behavior Tightening Pass spec was approved. The accepted behavior is: ordinary and low drift stay quiet; medium drift gets one light note without confirmation; high drift pauses with a short reason and asks for direction-switch confirmation; confirmed direction switches automatically draft a bounded adaptive Working Thread update and write only after user confirmation.

## Open Questions

- Does the tightened high-drift challenge stop planning Core/MCP or plugin packaging until confirmation?
- Does the medium-drift note feel helpful rather than noisy?
- Does ordinary request quietness remain intact?
- After tightening and revalidation, should the next layer be plugin packaging or a minimal Core/MCP contract slice?
