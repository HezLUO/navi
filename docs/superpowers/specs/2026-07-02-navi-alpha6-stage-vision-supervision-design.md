# Navi Alpha 6 Stage And Vision Supervision Design

## Status

This design was approved in conversation on 2026-07-02. It defines the proposed alpha.6 direction after alpha.5 pause semantics and next-decision visibility.

This is a design artifact only. It does not approve implementation, worktree execution, tagging, release preparation, GitHub Release creation, npm publication, marketplace publication, runtime UI, background automation, Memory v2, agent adapters, delegation, or write delegation.

## Product Context

Navi's current alpha surface is docs-backed skill/plugin behavior, project-local trigger documentation, and `navi init`.

Alpha.4 established Navi as a supervision layer for non-expert users working with expert agents. Alpha.5 tightened pause semantics: continue inside a bounded, already-approved loop, stop at decisions the user can judge, and expose the next meaningful decision after a valid stop.

Fresh design work exposed a broader gap. Even if the user knows the current task and the next small action, they may still lack product-level orientation:

- What is this stage trying to accomplish?
- How much is enough for this stage?
- When should validation stop?
- What happens after this stage?
- How far is the current loop from the original Navi vision?
- Should the main session keep designing while an implementation worktree runs?

Alpha.6 should address that gap without turning Navi into an automatic project manager, a roadmap database, or a runtime system.

## Product Goal

Navi alpha.6 adds stage-and-vision supervision: a lightweight way to explain where the current work sits in the product vision, how close the current stage is to being enough, and which next decision would actually move the product forward.

The goal is not to make every response more structured. The goal is to give the user product-level orientation at the moments when silence would make them lose control of the work.

## Core Model

Alpha.6 should use a three-layer model:

1. **Product Stage**: which layer of the full Navi product the current work advances.
2. **Work Mode**: what kind of work this loop is doing and what validation level is appropriate.
3. **Vision Distance**: how close the current stage is to being enough, and what remains missing from the fuller Navi vision.

These layers are not a mandatory output template. Navi should track them internally and surface only the smallest useful amount.

## Product Stage

Product Stage is a product-coordinate system, not a waterfall process. It explains what layer of the complete Navi product is being advanced.

### Product Definition

This stage covers what Navi is, what it is not, who it serves, how it relates to Along, what the alpha wedge is, and which boundaries define the current product.

It exists because many Navi decisions are not implementation decisions. Questions such as whether Navi is independent, whether UI should come next, or whether the wedge is project navigation or user supervision belong here.

### User Supervision

This stage covers how Navi helps the user supervise Codex or another expert agent.

It includes current-mode judgment, pause reasons, over-validation detection, worktree waiting scope, next-decision visibility, and stage/vision guidance for non-expert users.

This is the current product wedge. Without this layer, Navi risks becoming only a better handoff document. With it, Navi helps the user decide when to continue, stop, wait, switch stage, or challenge the agent's momentum.

### Project Integration

This stage covers how Navi enters and works inside real target projects.

It includes `navi init`, project-local `AGENTS.md` triggers, project maps, handoff/state docs, fresh-session validation, target-project setup, and avoiding confusion between local project integration and a global plugin installer.

Project Integration is separate from User Supervision. User Supervision defines how Navi judges work; Project Integration defines where the trustworthy project context comes from and how a new session activates Navi.

### Behavior Calibration

This stage covers whether Navi's behavior works in real or semi-real use.

It includes observing fresh-session transcripts, language-following behavior, meaningless `continue` friction, over-structured output, worktree/main-session interference, and whether non-expert users gain control.

This is not release-level proof and should not be confused with full testing. The point is to calibrate product behavior, not prove the whole system correct.

### Distribution & Trust

This stage covers how external users obtain, understand, verify, and rely on Navi.

It includes README clarity, GitHub Releases, tags, source packages, source verification wording, alpha exclusions, install paths, CHANGELOG/release notes, npm publication, marketplace distribution, and public trust signals.

This stage is separate because a product capability can be useful while still being hard for external readers to trust or install.

### Runtime Surface

This stage covers later product surfaces and long-term capabilities.

It includes runtime UI, local app behavior, background watcher, always-on presence, agent adapters, Memory v2, relationship modes, delegation, write delegation, and future Along/Navi integration.

This stage also protects the current alpha boundary. `src/web` remains historical Along Shared Desk / future capability evidence and must not be rebranded as the current Navi alpha UI.

## Work Mode

Work Mode describes the nature of the current loop and constrains validation strength.

The primary Work Modes are:

- **Design**: decide what to do, why, and what not to do.
- **Calibration**: observe real or semi-real behavior without trying to prove the whole system correct.
- **Implementation**: make a bounded change for a confirmed problem.
- **Release**: prepare an external version that users may rely on.

Alpha.6 should retire the earlier six-mode shape as the main taxonomy.

`Exploration` is a Design sub-state, used when the direction is still uncertain or options are being compared.

`Closeout`, `Waiting`, `Review`, and `Merge` are loop or workflow states, not Work Modes. For example:

```text
Product Stage: User Supervision
Work Mode: Implementation
Loop State: waiting for worktree review
```

This is clearer than treating `Waiting` or `Closeout` as a mode.

Work Mode must affect behavior:

- Design mode does not need tests, implementation, worktrees, or release checklists.
- Calibration mode uses small real or semi-real observations and avoids proving full correctness.
- Implementation mode uses targeted validation around changed behavior.
- Release mode is the only default place for full tests, typecheck, package verification, release notes, tags, pushes, and release checks.

## Vision Distance

Vision Distance explains how the current work relates to the fuller Navi vision.

It should not use percentages. Percentages imply false precision and can make a small bugfix look like measurable progress toward the whole product.

Instead, Vision Distance should be stage-relative:

- What is the current stage trying to complete?
- Is this stage close to enough, not enough, or already beyond useful validation?
- Which major product stages remain missing?
- Would continuing the current loop still advance the original vision?
- What next stage would most improve progress?

Example:

```text
This is close to enough for alpha.6 design: the stage model, mode model, trigger levels, and output rules are defined. It is still far from complete Navi because Project Integration, Distribution & Trust, and Runtime Surface remain only partially addressed.
```

## Trigger Strength

Alpha.6 should use three trigger strengths.

### Silent Tracking

This is the default.

Navi internally tracks Product Stage, Work Mode, and Vision Distance but does not print them. This is appropriate for ordinary execution, direct answers, simple status updates, and cases where structure would add friction.

### Light Signal

Use a short signal when the user is starting to lose orientation, when validation is beginning to dominate design, when a worktree completion might interrupt non-blocking design work, or when repeated `continue` prompts indicate friction.

Example:

```text
Stage signal: this is still User Supervision design. We do not need to wait for the implementation worktree unless its result would change this design decision.
```

Light Signal should usually be one to three sentences.

### Full Map

Use a Full Map when the user explicitly asks a broad orientation question or when the session is visibly losing product direction.

Appropriate triggers include:

- "How far are we from the original vision?"
- "How much is enough for this stage?"
- "Are we spending too much time testing?"
- "What should happen after this stage?"
- "Should the main session wait for the worktree?"
- multiple meaningless `continue` prompts;
- implementation or release work consuming design space;
- a local fix being mistaken for progress on the whole product.

Example:

```text
Product Stage: User Supervision
Work Mode: Design
Vision Distance: close to enough for alpha.6 design; still far from complete Navi because Project Integration, Distribution & Trust, and Runtime Surface remain incomplete.
Next Decision: write the design spec, continue refining stage rules, or pause alpha.6 and return to calibration.
```

## Output Rules

Navi should not default to a full structure.

The output should be the smallest useful intervention:

- no structure for ordinary continuation;
- Light Signal for small drift or early loss of orientation;
- Full Map for explicit big-picture questions or visible stage confusion.

When Navi does surface the three-layer model, the model must guide the recommendation:

- Product Stage affects what kind of next step is relevant.
- Work Mode affects validation budget and allowed actions.
- Vision Distance explains whether current work is enough for the stage and what remains missing from the larger product.

Full Map output should end with a real next decision when the session remains active. The next decision must be something the user can judge, not a bare `continue`.

## Non-Goals

Alpha.6 does not include:

- a complete roadmap management system;
- automatic project management;
- automatic scheduling;
- a long-term task database;
- runtime UI;
- local app behavior;
- background watcher behavior;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- automatic product-direction decisions;
- automatic implementation;
- automatic worktree creation;
- automatic escalation to Release mode;
- npm publication;
- marketplace distribution;
- rebranding `src/web` as Navi alpha UI;
- a requirement to print Product Stage, Work Mode, and Vision Distance in every response.

Alpha.6 should make Navi better at supervising the user's product judgment. It should not replace the user's judgment.

## Implementation Surface

If implemented, the likely surface should remain docs-backed:

- `.agents/skills/along-working-thread/SKILL.md`;
- `.agents/skills/along-working-thread/references/working-thread-v1.md`;
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`;
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`;
- `docs/along/project-maps/navi-project-trigger-template.md`;
- `src/cli/navi-init.ts`;
- targeted tests that inspect skill/reference/init behavior.

Implementation should not touch runtime UI, `src/web`, MCP server behavior, release automation, external target projects, or package publication unless a later plan explicitly approves that scope.

## Testing And Calibration

Recommended implementation validation, if implementation is later approved:

- targeted skill/reference text tests;
- targeted `navi init` generated-trigger tests;
- plugin package consistency verification if packaged skill files are touched;
- `git diff --check`.

Not default for alpha.6 implementation:

- full test suite;
- typecheck;
- release checklist;
- tag;
- GitHub Release;
- npm publication;
- marketplace work.

Behavior calibration can follow implementation, but it should remain small. The purpose is to observe whether the model helps users regain orientation without adding heavy structure to every answer.

## Success Criteria

Alpha.6 succeeds if Navi can:

- distinguish Product Stage from Work Mode;
- use four primary Work Modes instead of overlapping six-mode guidance;
- treat Exploration as a Design sub-state;
- treat Closeout, Waiting, Review, and Merge as loop/workflow states;
- explain stage-relative Vision Distance without fake percentages;
- stay silent when structure would add noise;
- provide Light Signals before the user fully loses orientation;
- provide Full Maps when the user asks broad orientation questions;
- make over-validation and unnecessary waiting easier to detect;
- end valid stops with a next decision the user can judge.

## Risks

### Output Heaviness

If Navi prints the three-layer model every time, alpha.6 fails. Mitigation: default to Silent Tracking and use Light Signal before Full Map.

### Taxonomy Confusion

Product Stage and Work Mode can be confused if names are too similar. Mitigation: Product Stage names describe product layers; Work Mode names describe the current loop's work type.

### False Roadmap Authority

Vision Distance can sound like a fixed roadmap. Mitigation: describe stage-relative distance and remaining product layers, not exact dates or completion percentages.

### Release-Mode Drift

Implementation or calibration can drift into release-level testing. Mitigation: Work Mode must constrain validation strength, and Release mode remains the only default place for full release checks.

### Runtime Boundary Drift

Long-term Runtime Surface discussion can accidentally rebrand existing historical web code as Navi alpha UI. Mitigation: keep `src/web` explicitly outside the current alpha surface.

## Next Decision

After this design is reviewed, the next meaningful decision is whether to:

1. close alpha.6 at design-spec level for now;
2. enter implementation planning for a small docs-backed alpha.6 behavior update;
3. run a small calibration pass before implementation planning.
