# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-20

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, and the follow-up Skill Behavior Tightening Pass fixed the high-impact drift confirmation gap well enough for V1.

The next step is a minimal plugin packaging design pass. This should preserve the skill-first behavior and avoid expanding into Core/MCP, Hermes, background runtime, delegation, or local presence.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not implement Core/MCP in V1.
- Do not turn plugin packaging into a broad productization effort in V1.
- The first packaging path is staged: personal local plugin first, then repo/team marketplace plugin after validation.
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

Run subjective fresh-session behavior validation for the packaged personal local plugin. Keep the pass limited to packaged Working Thread behavior; do not expand into Core/MCP, background runtime or presence, Hermes or Claude Code adapters, or source-of-truth migration.

## Last Wrap-Up

The Skill Behavior Tightening Pass was implemented on branch `skill-behavior-tightening` and fast-forward merged into `main` at `41aed6c74986785e2aca1c418dc62947072fba6e`. Verification on `main` passed: targeted skill test 5/5, typecheck, build, and full test suite 23 files / 236 tests after rerunning outside the sandbox for Express listen permissions.

The Along Working Thread personal local plugin package was created at `/Users/james/plugins/along-working-thread` with a personal marketplace entry. Plugin validation and installability checks passed; subjective fresh-session behavior validation remains the next gate.

## Validation Notes

2026-06-20 first screenshot-based validation partially passed:

- Resume passed: a fresh ordinary session restored the Working Thread and correctly identified real-session validation as the next step.
- High-impact drift challenge passed so far: when asked to jump into Core/MCP or plugin packaging, the session paused, explained the validation gate, and asked whether to consciously switch direction instead of planning the drifted work.
- Quiet ordinary request passed: an npm scripts question was answered directly without unnecessary Working Thread ceremony.

2026-06-20 follow-up screenshot-based validation passed:

- Medium drift passed: a fresh session answered what plugin packaging might look like without switching the active plan or triggering heavy Working Thread ceremony. Minor caveat: the answer was useful but somewhat long.
- Confirmed high-impact direction switch write-back passed: after the user explicitly confirmed a simulated switch to plugin packaging, the session drafted Working Thread update fields, kept implementation out of scope, and waited for user confirmation before writing.

## Plan Audit

The current staged plan can deliver a narrow but real version of self-initiation and companionship:

- It can deliver turn-bound self-initiation: when an existing agent is already active, it can restore Working Thread context, notice meaningful drift, suggest wrap-up, and draft continuity updates.
- It can deliver continuity-based companionship: the agent can remember what matters, protect shared judgment, and avoid turning every small request into process.
- It cannot yet deliver background self-initiation: no watcher, scheduler, notification, local presence, or out-of-session intervention exists in V1.
- It cannot yet deliver full living companion feel: no ambient presence surface, relationship/tone personalization, emotional simulation mode, or cross-agent shared core exists in V1.
- Plugin packaging will improve installability and reuse, not the depth of self-initiation by itself.

Packaging copy must therefore promise "turn-bound self-initiation for existing agents" and "continuity-aware co-creation", not a background autonomous companion.

## Deferred Capability Map

The parts that V1 cannot deliver are still valid future directions, but they belong to later layers:

- Background self-initiation belongs to a later runtime/autonomy layer: watcher, scheduler, notification, out-of-session attention, and local state transitions.
- True presence belongs to a later local/desktop or browser presence layer: ambient state, presence signal, lightweight surface, and optional living desktop expression.
- Deep companionship belongs to later memory and relationship layers: Memory v2, relationship memory, tone/presence preferences, emotional simulation modes, and long-term personalization.
- Cross-agent self-initiation belongs to a later Along Core / MCP / adapter layer: shared Working Thread operations that Codex, Hermes, Claude Code, or other agents can call.

Minimal plugin packaging is a distribution step for the current skill-first behavior. It should not be treated as the implementation of these deferred capabilities.

## Packaging Positioning

The first plugin package should use layered positioning:

- User-facing promise: Continuity-Aware Co-Creator.
- Technical boundary: Turn-Bound Self-Initiation.
- Functional description: Working Thread Continuity.

In practice, display name and tagline may lean into co-creator language; long descriptions should clarify that self-initiation happens inside active agent sessions; README and usage docs should describe concrete Working Thread behavior.

## Packaging Success Criteria

Minimal plugin packaging is successful only if it proves more than file rearrangement:

- Installability: the personal local plugin installs, appears in the local marketplace flow, and passes manifest validation.
- Skill discovery: Codex can discover the packaged `along-working-thread` skill in Along-relevant sessions.
- Behavior preservation: packaged behavior still passes resume, ordinary quietness, medium drift, high drift confirmation, and confirmed-switch write-back checks.
- Honest positioning: metadata and docs promise continuity-aware co-creation, turn-bound self-initiation, and Working Thread continuity without implying background autonomy or always-on presence.
- Staged path: README describes personal local plugin as stage one and defers repo/team marketplace, MCP, presence, runtime, Memory v2, relationship modes, and adapters.

## Packaging Metadata

Approved plugin metadata direction:

- Plugin folder/name: `along-working-thread`.
- Display name: `Along Working Thread`.
- Short description: `A continuity-aware co-creator for active Codex sessions.`
- Long description core: `Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation. It provides turn-bound self-initiation, not background autonomy or always-on presence.`
- Category: `Productivity`.
- Keywords: `along`, `working-thread`, `continuity`, `codex`, `self-initiation`.
- Default prompts:
  - `Resume the current Working Thread.`
  - `Help me wrap up this phase.`
  - `Check whether this direction drifts from our thread.`

## Packaging Source Strategy

V1 packaging should be a distribution copy, not a source-of-truth migration:

- Keep the existing repo-scoped `.agents/skills/along-working-thread/` skill in place.
- Copy the same skill content into the personal local plugin.
- Preserve current validated repo behavior while testing plugin install and discovery.
- Add validation or review steps to detect meaningful drift between the repo skill and packaged skill.
- Revisit source-of-truth consolidation only after personal plugin validation passes.

## Open Questions

- Is the medium-drift answer length acceptable, or should the skill push more concise first replies?
- What should the plugin promise to users without overselling background self-initiation?
