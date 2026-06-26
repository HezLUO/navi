# Existing-Agent Self-Initiation Product Pass

Status: active
Date: 2026-06-25

## Current Goal

Design how Along should feel and behave when the user is already working inside existing agents such as Codex, Hermes, or Claude Code.

The key question is:

```text
What does the user experience that makes Along feel self-initiating and companion-like while using existing agents?
```

This pass is product design and calibration. It is not an implementation pass.

## Key Constraints

- Do not design Along as a standalone general coding agent competitor.
- Do not expand Core/MCP by default.
- Do not add runtime, watcher, scheduler, notification, desktop surface, adapter, Memory v2, relationship modes, or emotional simulation in this pass.
- Do not treat MCP implementation success as proof of product value.
- Preserve the anti-self-certification evidence hierarchy: user subjective experience and controlled comparisons outrank Along-generated records.
- Keep the main conversation as a neutral supervisor.
- Continue recording decisions in durable docs instead of relying only on conversation context.

## Current Foundation

Validated:

- Codex skill/plugin can provide turn-bound Working Thread continuity.
- Packaged personal plugin can independently reproduce Skill-First V1 behavior.
- Minimal MCP Server exposes Working Thread resources and action tools.
- Confirmed write-back works with stale conflict handling.
- Schema alignment now lets long-running Working Thread records keep read-only appendices.

Current limitation:

- Along still does not have true background self-initiation.
- Along still does not have living presence.
- Along still does not produce companion feeling by itself.
- MCP is a substrate, not the product experience.

## Working Product Thesis

Along should become a local-first, open-source companion layer for existing agents.

It should help the agents the user already relies on gain:

- continuity;
- turn-bound self-initiation;
- drift awareness;
- wrap-up discipline;
- eventually deeper companionship.

It should not replace Codex, Hermes, or Claude Code.

## Design Questions To Resolve

1. Where does Along appear in the existing-agent workflow?
2. What counts as self-initiation when Along is not yet always-on?
3. How should Along avoid becoming a dashboard, todo system, or automation?
4. How should Along express companionship without fake emotional overreach?
5. What is the minimum product loop that would feel meaningfully different from normal Codex/Hermes usage?
6. Which layer owns which behavior: skill/plugin, MCP, future local runtime, or future UI/presence surface?
7. What should be deferred until runtime/presence exists?

## Current Recommendation

Start with the user-facing loop before designing more infrastructure.

Potential next direction:

```text
Working Thread as living conversation context:
Along appears through existing agents as a light companion behavior that resumes, notices drift, suggests wrap-up, and preserves judgment without dominating the conversation.
```

This must be validated against the user's desired feeling: simple, useful, self-initiating, and companion-like rather than procedural.

## Next Step

Ask the user to choose the first product frame for Along inside existing agents:

- a thread-centered companion;
- a lightweight side presence;
- a project continuity layer;
- or a hybrid.

Record decisions here as the pass progresses.

## Decisions During Product Pass

2026-06-25:

- Product frame: use a **Hybrid** frame.
- Short-term emphasis: the short-term product should emphasize Along's **challenging** quality.
- Interpretation: Along should not merely remember or summarize. It should be willing to interrupt the user's momentum when it detects drift, weak assumptions, premature implementation, or self-certifying conclusions.
- Boundary: this does not mean aggressive interruption, always-on critique, or generic debate. The challenge should be tied to the user's own stated goals, Working Thread boundaries, and recent decisions.
- Product-layer concept: use **Challenge Moment** as the short-term product concept. A Challenge Moment is the point where Along notices the user or agent may be drifting away from stated goals, acting on weak assumptions, skipping validation, over-expanding scope, or treating implementation success as product proof.
- Short-term product framing: Along can first become a Challenge Layer for existing agents before it becomes a fuller living companion.
- Challenge Moment priority: make **anti-self-certification** the core. Direction drift is the most frequent visible form. Premature execution and weak assumptions are supporting triggers that explain why a challenge is warranted.
- Challenge Moment presentation: default to a short **Challenge Brief** instead of directly injecting a full conversation turn. Use an execution gate only for high-risk moments. Use wrap-up challenges as a later-stage supplement, not the primary self-initiation surface. Do not make direct in-chat challenge insertion the V1 default because it risks polluting the working context.
- Challenge Brief tone: use a variable tone with **co-creator** as the default. For higher-risk moments, shift toward a calmer reviewer tone. For companion-oriented moments, allow a warmer protective tone. Do not make emotional simulation or relationship modes part of this V1 pass.
- Challenge Moment triggers: treat direction switches, pre-implementation transitions, and over-fast validation conclusions as proactive triggers. Treat explicit user requests for judgment as user-triggered challenge opportunities. Do not make general ongoing critique the default behavior.
- Challenge Brief outcomes: support accepting the challenge, refining the challenge, dismissing it for now, and turning it into validation. Make **turn into validation** the default recommended outcome because it best expresses anti-self-certification: Along should help convert questionable judgment into lightweight evidence instead of merely trying to persuade the user.
- Lightweight validation actions: use fresh-session checks and read-only reviews as the primary validation actions. Use user calibration for product-experience judgments such as whether a moment felt self-initiating, companion-like, annoying, or useful. Do not make implementation or write delegation part of the default validation action.
- Minimum demo loop: support challenge before implementation, challenge on direction switch, and challenge after completion. Make **challenge after completion** the primary demo path because it targets the strongest anti-self-certification moment: implementation passed, but product validity may still be unproven.
- Formal spec: wrote `docs/superpowers/specs/2026-06-25-along-challenge-layer-design.md` for user review. The spec keeps V1 scoped to a turn-bound Challenge Layer for existing agents, not a standalone agent, background runtime, emotional companion, or automatic executor.
- Implementation status: Challenge Layer behavior was implemented as skill/plugin documentation and validation tests. The implementation remains turn-bound and docs-backed; it does not add runtime, UI, adapters, write delegation, or automatic execution.
- Implementation plan: wrote `docs/superpowers/plans/2026-06-25-along-challenge-layer.md`. The plan keeps implementation scoped to skill/reference/package documentation, validation tests, package metadata, and continuity records.

## Next Design Question

Clarify what kind of challenge makes Along feel valuable rather than annoying.
