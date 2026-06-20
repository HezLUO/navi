# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-20

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 should remain Codex-first, skill-first, and docs-backed for now. Initial subjective validation showed that turn-bound self-initiation works for resume, wrap-up, and quietness behavior in ordinary Codex sessions. Drift challenge only partially passed because Codex detected the boundary shift but started planning Core/MCP/plugin work before first asking for explicit direction-switch confirmation.

The next step is a Skill Behavior Tightening Pass, not Core/MCP or plugin packaging.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not implement Core/MCP in V1.
- Do not package a plugin in V1.
- Do not implement Hermes adapter in V1.
- Do not implement local/desktop presence surface in V1.
- Do not implement delegation candidate or conductor workflow in V1.
- Do not use `.along/` as the V1 Working Thread continuity store.
- Do not write durable Working Thread docs without user confirmation.

## Drift Triggers

- The work shifts from skill-first validation into Core/MCP implementation.
- The work shifts toward plugin packaging before behavior is validated.
- The agent starts planning a drifted direction before asking the user to confirm the direction switch.
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

Design a Skill Behavior Tightening Pass focused on high-impact drift confirmation, concise co-creator wording, and preserving quietness for ordinary requests. Defer Core/MCP and plugin packaging until the drift challenge behavior is tightened and revalidated.

## Last Wrap-Up

Skill-First V1 validation completed in ordinary Codex sessions. Resume passed: Codex restored the Working Thread and current judgment. Wrap-up passed: Codex drafted a write-back and waited for confirmation. Quietness passed: Codex answered a normal `package.json` question without over-triggering. Drift partially passed: Codex noticed the boundary shift, but started planning Core/MCP/plugin work before asking for explicit confirmation.

## Open Questions

- What exact wording should high-impact drift challenge use before planning a drifted direction?
- Should high-impact drift always require an explicit direction-switch confirmation?
- How can the challenge feel like co-creator judgment rather than process enforcement?
- After tightening and revalidation, should the next layer be plugin packaging or a minimal Core/MCP contract slice?
