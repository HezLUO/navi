# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-19

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 should be Codex-first, skill-first, and docs-backed. It should validate turn-bound self-initiation through start/resume briefing, impact-based drift challenge, and layered wrap-up before building Core/MCP, plugin packaging, Hermes integration, local/desktop presence, or background runtime.

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
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

Run subjective validation in real Codex sessions: check whether resume briefing feels useful rather than report-like, whether impact-based drift challenge is clear and non-blocking, and whether layered wrap-up preserves judgment continuity without becoming a log. Defer Core/MCP and plugin packaging until this behavior is validated.

## Last Wrap-Up

The repo-scoped Codex skill, Working Thread reference, docs-backed record template, seed record, and Vitest coverage are implemented. Verification passed for the focused skill test, typecheck, build, and escalated full test after sandbox Express `listen` hit `EPERM`.

## Open Questions

- Does resume briefing feel like companionship rather than a report during real use?
- Does impact-based drift challenge feel helpful rather than supervisory?
- Does layered wrap-up preserve continuity without becoming a log?
- After validation, should Along Core/MCP or plugin packaging come next?
