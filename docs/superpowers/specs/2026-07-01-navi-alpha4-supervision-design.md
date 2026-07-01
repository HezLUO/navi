# Navi Alpha 4 Supervision Design

## Status

This design was approved in conversation on 2026-07-01. It defines the next Navi direction after `v0.1.0-alpha.3`. It is a design artifact only: it does not start implementation, release preparation, tagging, or publication.

## Product Direction

Navi should become an independent product surface. It may later remain part of Along, or it may become separate. The near-term product wedge is:

> Navi helps non-expert users supervise expert agents.

The natural expansion is project navigation: helping users understand project state, active threads, handoffs, decisions, risks, and next phases. That expansion should grow from real supervision needs instead of starting as a full project dashboard.

The next alpha should therefore strengthen Navi as a supervision layer before investing in UI, runtime, memory, background presence, agent adapters, or marketplace distribution.

## Core Problem

The existing Navi alpha can answer local progress questions such as "what's next" or "where are we". That is useful but insufficient for non-expert users.

The missing product value is broader:

- Users do not know what the current stage is trying to accomplish.
- Users do not know how much work is enough for the current stage.
- Users do not know when to stop Codex from continuing tests or validation loops.
- Users do not know whether the main session should wait for a worktree session.
- Users do not know how far the current work is from their original goal or full Navi vision.
- Users often do not know which question to ask, so a purely passive map is not enough.

Navi alpha.4 should address these gaps without turning into a large automation system.

## Alpha 4 Promise

Navi alpha.4 should help the user decide whether to continue, stop, wait, or move to the next phase.

More specifically, Navi should help answer:

- What stage are we in?
- What is this stage trying to prove or complete?
- Has this stage reached enough evidence to stop?
- Is Codex over-validating or under-validating?
- Should the main session wait for a parallel worktree?
- Is the current loop still serving the original goal?
- What should happen after this stage ends?
- What action requires explicit user approval?

## Non-Goals

Alpha.4 does not include:

- Automatic worktree orchestration.
- Automatic scheduling of Codex sessions.
- A thread dashboard.
- A runtime watcher.
- A local app or web UI.
- Memory v2.
- Agent adapters.
- Delegation or write delegation.
- npm publication.
- Public marketplace distribution.
- Release automation.
- Rebranding `src/web` as Navi alpha UI.
- A final decision that Navi must or must not remain part of Along.

## Capability Modules

### 1. Phase Supervision

Navi should identify the current work stage before advising the user. The initial stage set is:

- Design: decide what to do, why, and what not to do.
- Calibration: observe real or semi-real behavior without proving the whole system.
- Implementation: make a bounded change for a confirmed problem.
- Release: prepare an external version that users may rely on.
- Closeout: record outcome, risks, and next steps without adding new validation loops.
- Exploration: investigate future directions without committing to implementation.

For each stage, Navi should understand:

- The stage goal.
- Allowed actions.
- Actions that should not happen in that stage.
- Stop criteria.
- The likely next stage.

This is how Navi tells a non-expert user when the current loop is complete enough.

### 2. Verification Budget And Stop Mechanism

Navi should treat validation strength as a stage-dependent budget, not as an always-increase quality signal.

Default verification budget:

- Design: no tests, no implementation, no release checklist.
- Calibration: small real or semi-real observations; no proof of full correctness.
- Implementation: targeted tests around changed behavior.
- Release: full tests, typecheck, package verification, release notes, tag, push, release checks.
- Closeout: record the result; do not add new validation unless a blocking inconsistency appears.
- Exploration: read, compare, reason; do not validate nonexistent implementation.

Navi should recommend stopping when continued validation will not change the current decision. For example:

> Current targeted validation is enough for implementation mode. Continuing into full test would be release-level validation. Unless you are preparing a release, stop here and return to design or closeout.

This mechanism is reactive. It notices when Codex is already drifting into excessive validation.

### 3. Verification Budget Contract

Navi should also set a preventive contract before bounded execution starts.

Before a worktree or implementation task begins, Navi should state:

- The task goal.
- The allowed edit scope.
- The allowed validation level.
- Explicitly forbidden escalations.
- Stop criteria.
- Expected return format.

Example:

> Only fix the language-following behavior. Allow prompt/template edits and targeted behavior tests. Do not run full test, tag, release, or update unrelated docs. Stop when English prompts produce English maps and Chinese prompts remain Chinese. Return changed files, tests run, residual risk, and merge recommendation.

This contract prevents the execution session from turning a narrow task into a full release cycle.

### 4. Parallel Work Supervision

Navi should distinguish the main session from execution worktrees.

Main session responsibilities:

- Product direction.
- Stage judgment.
- Worktree task boundaries.
- Whether to wait or continue.
- Merge, release, and roadmap decisions.

Worktree session responsibilities:

- One bounded execution task.
- One bounded validation budget.
- A concise result report.

The main session should not default to waiting for every worktree. It should wait only when the worktree result is blocking:

- The result will change the current design direction.
- The result is required before a merge, release, or irreversible decision.
- The worktree discovered a blocking fact that invalidates the current assumption.

Otherwise, the main session can continue design work under an explicit assumption:

> The language-following worktree is still validating. Main design can continue assuming it passes; if it fails, the failure becomes an alpha.4 prerequisite, not a reason to stop all planning.

This keeps design work from being swallowed by testing and verification loops.

### 5. Vision-Distance Judgment

Navi should place current work on the path from the user's original goal to the fuller Navi vision.

For alpha.4 this should stay lightweight. Navi does not need a complete roadmap database. It should be able to say:

- What small capability the current work advances.
- What larger product stage it belongs to.
- What major capabilities remain missing.
- Whether the current loop is central or peripheral.
- What next phase would most improve progress toward the vision.

For the current Navi vision, the rough distance is:

- Current alpha: skill/plugin behavior, project-local docs, and `navi init`.
- Alpha.4 target: phase, verification, vision, and parallel-work supervision.
- Natural alpha.5 direction: lightweight project state and multi-thread navigation.
- Natural alpha.6 direction: product packaging, naming clarity, installation, and external reader clarity.
- Later exploration: UI, runtime, memory, presence, conductor behavior, agent adapters, and relationship to Along.

Navi should not pretend that a small bugfix or release check is equivalent to progress on the full vision.

### 6. Proactive Decision Signals

Navi should not wait for users to know which question to ask. It should proactively surface signals when silence would cause loss of control.

Proactive prompts are appropriate when:

- The current stage has met its stop criteria.
- Codex is exceeding the verification budget.
- Work is drifting from design into implementation, or from implementation into release.
- A write, commit, push, release, external-project edit, or destructive action needs approval.
- A worktree result is blocking the main session.
- The current loop is moving away from the original goal.
- The next phase is clear and continuing the current loop has low value.

These prompts should be short and decision-oriented. Navi should not print a full map every time.

Example:

> Current implementation validation is enough. Continuing into full tests would make this release-level work. Stop here unless you explicitly want to prepare a release.

## Output Strategy

Navi should maintain a supervision checklist internally, but user output should be situation-dependent.

The internal checklist includes:

- Current stage.
- Stage goal.
- Stop criteria.
- Validation budget.
- Whether current validation is enough.
- Whether worktree results are blocking.
- Whether the current loop serves the vision.
- Whether user approval is needed.
- Recommended next phase.

The external answer should be the smallest useful intervention:

- If the user asks a simple progress question, answer briefly.
- If the user is about to lose control, proactively surface the decision signal.
- If the project state is complex, expand into a fuller map.
- If the user asks about distance from the vision, explain the roadmap position.
- If a worktree is running, state whether it is blocking or non-blocking.

The goal is active supervision without turning every response into a rigid report.

## Source Evidence Priority

Navi should use evidence in this order:

1. User's current prompt.
2. The explicitly stated current work mode.
3. Current project rules such as `AGENTS.md`.
4. Current roadmap or vision documents.
5. Recent handoff and closeout records.
6. Older design documents and historical context.

Rules:

- Project records cannot override the user's current prompt.
- Old handoffs cannot override new goals.
- Release-mode habits cannot contaminate design mode.
- Project record language cannot force answer language.
- Unreturned worktree results should be treated as assumptions, not facts.
- Missing evidence should be stated as uncertainty rather than filled with confident invention.

## Alpha 4 Acceptance

Alpha.4 should be accepted by scenario behavior, not by release-level validation.

Scenario acceptance:

- In design mode, Navi prevents drift into implementation.
- In implementation mode, Navi recommends targeted validation and stops before release-level checks.
- In release mode, Navi allows full verification but stops after the release goal is satisfied.
- When a worktree is running, Navi states whether the main session should wait.
- When the user has not asked the right question, Navi still surfaces a decision-relevant stop, wait, approval, or phase-change signal.
- When asked about the full Navi vision, Navi can place the current work on the roadmap without exaggerating maturity.

Rule acceptance:

- `navi init` or the project trigger describes modes, validation budgets, approval gates, proactive supervision, and worktree boundaries clearly.
- The generated guidance does not imply global plugin installation when only project-local trigger setup happened.
- The guidance does not imply UI/runtime/memory features that alpha.4 does not provide.

Targeted behavior acceptance:

- English prompts still receive English answers by default.
- Chinese prompts still receive Chinese answers by default.
- Mixed-language project records do not override the user's current prompt language.
- Prompt examples include stop, wait, approve, continue, and vision-distance questions.
- No real model-call tests are introduced for this alpha.4 behavior.

## Roadmap Timing

### Now: Alpha 4 Design

Define phase supervision, validation budgets, proactive decision signals, and parallel-work boundaries. Do not begin implementation until this design is reviewed and an implementation plan is approved.

### Alpha 4 Implementation

Implement only the supervision-layer behavior needed to support the approved design. Expected implementation areas are likely project-local trigger text, skill instructions, `navi init` generated guidance, and targeted tests around generated behavior. Full release verification is not part of implementation unless release mode is explicitly entered.

### Alpha 4 Calibration

Use real or semi-real transcripts to observe whether Navi improves user control:

- Does it stop excessive validation?
- Does it preserve design time while worktrees execute?
- Does it help the user understand phase completion?
- Does it place current work on the vision path?

Calibration should produce notes and decision changes, not automatic release work.

### Alpha 5 Candidate Direction

If alpha.4 proves useful, alpha.5 can add lightweight project navigation:

- Current project state.
- Active and paused threads.
- Worktree inventory.
- Decision log.
- Open risks.
- Handoff quality.

This should remain lightweight until real supervision use cases justify a stronger state model.

### Alpha 6 Candidate Direction

If alpha.4 and alpha.5 are useful, alpha.6 can focus on productization:

- Navi naming clarity.
- Along/Navi relationship narrative.
- Installation and distribution path.
- README and release consistency.
- Chinese documentation sync policy.
- Public package or marketplace decision.

### Later Design Exploration

These areas require separate design work and should not be pulled into alpha.4:

- UI or local app.
- Runtime presence.
- Background watcher.
- Memory v2.
- Conductor behavior.
- Agent adapters.
- Delegation.
- The final product relationship between Navi and Along.

## Implementation Planning Notes

The implementation plan should be narrow. It should start from the text surfaces that already define Navi behavior and avoid creating new infrastructure unless the existing surfaces cannot express the supervision contract.

Likely first implementation targets:

- Navi skill instructions.
- `navi init` generated `AGENTS.md` guidance.
- Targeted tests for generated guidance or prompt behavior.
- Examples or docs that explain phase supervision and validation budget.

Likely out-of-scope implementation targets:

- `src/web`.
- Runtime services.
- Persistent databases.
- Automatic thread/worktree orchestration.
- Full release machinery.

## Spec Self-Review

This spec has a focused alpha.4 scope: strengthen Navi as a supervision layer before project-navigation expansion. It avoids placeholders, does not require UI/runtime/memory, and separates implementation, calibration, and release work. The main ambiguity is whether vision-distance judgment needs a dedicated roadmap file; for alpha.4 this is intentionally kept lightweight and should be revisited only if existing roadmap and project rules are insufficient during implementation planning.
