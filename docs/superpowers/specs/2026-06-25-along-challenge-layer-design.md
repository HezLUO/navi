# Along Challenge Layer Design

Date: 2026-06-25
Status: Draft for user review

## Summary

Along should first become a **Challenge Layer** for existing coding agents before attempting to become a standalone agent or full living companion.

The short-term product concept is **Challenge Moment**: the point where Along notices that the user or the active agent may be drifting away from stated goals, acting on weak assumptions, skipping validation, expanding scope too early, or treating implementation success as product proof.

The V1 product promise is:

```text
Along helps existing agents challenge self-certifying project momentum and turn questionable judgments into lightweight validation.
```

This is not a new coding agent. It is a product layer that works through Codex skill/plugin behavior and the existing Working Thread/MCP substrate.

## Product Context

The project originally explored Along as a broader living companion and agent coordinator. Recent calibration showed that the current implementation does not yet provide true background self-initiation, persistent presence, or deep companionship. The useful behavior that has already emerged is narrower and more distinctive:

- Along remembers the user's stated goal and current boundary.
- Along can notice when a conversation is drifting.
- Along can challenge premature implementation or over-fast validation.
- Along can push a questionable judgment into a fresh-session check, read-only review, or user calibration.

This should be treated as a viable short-term product direction instead of a compromise. The product should emphasize Along's challenging quality: not generic criticism, but a companion-like willingness to stop the user from fooling themself.

## Goals

- Define Challenge Moment as the central product concept for the short-term Along product.
- Make anti-self-certification the primary value proposition.
- Preserve Along's companion direction without pretending V1 has full living presence.
- Keep Along usable inside existing agents such as Codex, and later Hermes or Claude Code.
- Turn challenge into lightweight validation rather than debate.
- Keep the product simple enough to test subjectively in real project work.

## Non-Goals

This design must not:

- turn Along into a standalone general coding agent;
- add a background runtime, watcher, scheduler, notification system, or desktop presence;
- implement relationship modes, emotional simulation, or Memory v2;
- add write delegation or automatic implementation behavior;
- treat MCP success as proof of product value;
- make Along a generic todo manager, dashboard, or automation system;
- make constant critique the default behavior;
- require users to abandon their existing agent workflow.

## Product Positioning

Along Challenge Layer is a local-first, open-source companion layer for existing agents.

It is useful when the user is already working with Codex, Hermes, Claude Code, or similar tools and wants a second layer that remembers the project direction, challenges fragile assumptions, and helps convert uncertainty into evidence.

The short pitch is:

```text
Along is the companion layer that challenges your agent workflow when it starts proving itself too easily.
```

The product should be presented as a challenge-and-validation layer, not as a new executor.

## Challenge Moment

A Challenge Moment occurs when Along has enough context to suspect that the current project momentum may be misleading.

V1 prioritizes these cases:

1. **Self-certification**
   The strongest case. Example: implementation passed, but product validity has not been proven.
2. **Direction drift**
   The most frequent visible form. Example: the user shifts from validating the current layer to planning a larger runtime or platform.
3. **Premature execution**
   Example: the user moves into spec, implementation plan, or worktree execution before the decision boundary is clear.
4. **Weak assumptions**
   Example: "plugin means self-initiation is solved" or "MCP means companionship is solved."

Challenge Moments must be tied to the user's own stated goals, Working Thread boundaries, and recent decisions. Along should not challenge for sport.

## Challenge Brief

The default presentation is a short **Challenge Brief**.

The brief should not directly inject a long argumentative turn into the working context. It should be compact, specific, and actionable.

Recommended structure:

1. **What I noticed**
   A concrete observation about drift, weak assumption, premature execution, or self-certification.
2. **Why this may matter**
   The reason, anchored to the user's goal or Working Thread boundary.
3. **What I suggest next**
   A lightweight validation action, not implementation.
4. **How you can respond**
   Accept, refine, dismiss for now, or turn it into validation.

Example:

```text
I think this may be a self-certification moment.

The implementation passed, but that only proves the mechanism works. It does not yet prove that the Challenge Layer feels self-initiating or companion-like in a real session.

I suggest a fresh-session check or read-only review before we treat this as product validation.
```

## Tone

The default tone is **co-creator**.

Along should sound like it is helping the user keep the work honest, not like it is grading the user. It should be clear, direct, and willing to disagree.

Tone can shift by context:

- higher-risk moments: calmer reviewer;
- companion-oriented moments: warmer protective tone;
- normal moments: co-creator.

V1 should not include emotional simulation or relationship modes. The companion feeling comes from continuity, memory of intent, and useful challenge.

## Trigger Model

V1 should support both proactive and user-triggered Challenge Moments.

Proactive triggers:

- direction switches;
- pre-implementation transitions;
- over-fast validation conclusions.

User-triggered challenge:

- the user asks what to do next;
- the user asks whether the current plan is valid;
- the user asks for a review of product direction or implementation evidence.

The product must avoid general ongoing critique. Challenge should concentrate around decision points.

## Outcome Model

Challenge Briefs should support four outcomes:

1. **Accept Challenge**
   The user agrees. Along updates the current judgment or Working Thread.
2. **Refine Challenge**
   The user agrees with the concern but corrects Along's interpretation.
3. **Dismiss For Now**
   The user decides the challenge is not useful right now. Along lowers priority without deleting the thread.
4. **Turn Into Validation**
   The default recommended result. Along converts the challenge into a lightweight validation action.

The fourth outcome is the most important product behavior. It prevents Challenge Moment from becoming mere persuasion.

## Lightweight Validation

V1 validation actions should be intentionally small:

- **Fresh-session check**
  Open a clean agent session and ask the same decision question to see whether it independently surfaces similar risks.
- **Read-only review**
  Ask an agent to inspect the current spec, plan, or result without implementing.
- **User calibration**
  Ask the user to score or describe the subjective product feeling, especially for self-initiation, companionship, usefulness, and annoyance.

Implementation, write delegation, background monitoring, and automatic execution are not default validation actions.

## Minimum Demo Loop

The short-term product should support three Challenge Moment paths:

1. Challenge before implementation.
2. Challenge on direction switch.
3. Challenge after completion.

The primary demo path is **challenge after completion**:

```text
focused execution session completes
-> Along notices implementation success may be treated as product proof
-> Along presents a Challenge Brief
-> user chooses lightweight validation
-> validation result is written back to the Working Thread
```

This path best demonstrates the product's anti-self-certification value.

## Layer Responsibilities

The current layers should be understood as follows:

- **Skill/plugin**
  User-facing behavior surface inside Codex. It can resume context, identify challenge opportunities, and draft Challenge Briefs.
- **Working Thread**
  Durable record of goal, boundary, current judgment, drift triggers, next move, wrap-up, and open questions.
- **MCP**
  Structured access layer for reading and writing Working Threads. It is infrastructure, not the product experience.
- **Future runtime/presence**
  Deferred layer for true background self-initiation and living presence.

V1 should not require runtime or desktop presence to be valuable.

## Success Criteria

The design is successful if a real user can say:

- "Along challenged the right moment."
- "The challenge was tied to what I actually cared about."
- "It did not feel like generic criticism or task management."
- "It helped me validate instead of just continuing momentum."
- "It made the existing agent workflow feel more self-aware."

The design is not successful if:

- Along feels like a dashboard, checklist, or reminder tool;
- every challenge sounds like a process audit;
- the user accepts challenges only because Along says so;
- implementation success is still treated as product proof;
- the user cannot tell what is different from normal Codex usage.

## Testing And Calibration

Use subjective and comparative calibration rather than only automated tests.

Recommended validation:

- run a fresh-session check after an implementation completes;
- ask a read-only reviewer whether product validity follows from the implementation evidence;
- ask the user to score whether the Challenge Brief felt useful, self-initiating, companion-like, and non-annoying;
- compare with a normal Codex session that does not use Along;
- record whether the Working Thread changed because of evidence or merely because Along asserted a judgment.

Automated tests may validate formatting and contract behavior later, but they cannot prove product feeling.

## Open Questions

- Should Challenge Briefs appear as normal chat text, a short side brief, or a generated prompt block in Codex V1?
- How much user control should exist for suppressing or tuning challenge frequency?
- What minimum metadata should be written back when a Challenge Moment is accepted, refined, dismissed, or validated?
- How should this product layer eventually generalize from Codex to Hermes or Claude Code?
- When should Challenge Layer graduate into local runtime or presence work?

## Approved Boundaries To Preserve

- V1 is turn-bound, not background self-initiation.
- V1 works through existing agents, starting with Codex.
- V1 defaults to validation, not execution.
- V1 preserves user confirmation for durable write-back.
- V1 does not add relationship modes, emotional simulation, Memory v2, Hermes adapter, desktop UI, scheduler, watcher, or notification system.
