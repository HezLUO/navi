# Along Working Thread

Bring self-initiation and continuity to the agents you already use.

Along Working Thread is a Codex plugin source package that helps active Codex sessions carry project judgment, notice drift, and draft wrap-ups with your confirmation.

## What it is

- A Codex plugin source package.
- A continuity-aware co-creator layer for active Codex sessions.
- A turn-bound self-initiation experiment.
- A Navi Progress Map behavior for progress and next-step questions from non-expert users.
- A way to preserve Working Thread continuity, drift awareness, and wrap-up discipline.

## Navi

Navi is Along's customer-facing product surface for non-expert users supervising expert agents.

Navi helps users understand, supervise, and steer expert agents. When a user asks what is happening, what comes next, whether to continue, or says they do not understand the current progress, Navi should give a **Progress Map** before recommending more work.

A Progress Map should cover:

1. Current position;
2. completed work;
3. what this means for the user's goal;
4. still missing work;
5. recommended next step and why it matters;
6. What you need to confirm now;
7. the main risk when one exists.

Navi uses Challenge Moment as a risk-escalation mechanism. If the map reveals drift, premature execution, weak assumptions, or implementation success being mistaken for requirement satisfaction, Navi should surface that risk and suggest a more reliable next step.

## Challenge Layer

Along Working Thread now frames its short-term product behavior as a Challenge Layer for existing agents.

A **Challenge Moment** happens when Codex may be treating momentum as evidence: direction drift, premature execution, weak assumptions, or implementation success being treated as product proof.

A **Challenge Brief** is the short response Along should produce at that moment:

1. what it noticed;
2. why it matters against the Working Thread;
3. what lightweight validation it suggests;
4. how the user can accept, refine, dismiss, or turn it into validation.

The core value is **anti-self-certification**. It does not make implementation success equal product proof.

## What it is not

- It is not a background autonomous agent.
- It is not an always-on companion.
- It does not watch files or time when Codex is closed.
- It does not send notifications.
- It does not provide local desktop presence.
- It does not provide emotional companionship.
- It is not a cross-agent memory layer.
- It is not a replacement for Codex, Hermes, Claude Code, or other agents.
- It is not a standalone general agent.
- It does not automatically decide the final correct answer in every professional domain.
- It does not replace necessary professional review.
- It does not silently create or update durable Working Thread records.

## Current stage

This repo-contained package is the source-package form of Along Working Thread `0.1.0`.

It packages the current validated skill-first behavior. It does not add new runtime, memory, presence, adapter, or delegation capabilities.

## Package layout

```text
plugins/along-working-thread/
  .codex-plugin/
    plugin.json
  README.md
  VERSION.md
  skills/
    along-working-thread/
      SKILL.md
      agents/
        openai.yaml
      references/
        working-thread-v1.md
```

The canonical source skill remains:

```text
.agents/skills/along-working-thread
```

The package skill is a distribution copy and must stay in exact sync with the canonical source skill.

## Use from repo

This package is intended for developers who already understand Codex plugins or skills.

For local experimentation, use the package directory as the plugin source:

```text
plugins/along-working-thread
```

This package does not include an automatic install script. Installation should remain an explicit user action.

## Verify package

Run:

```bash
npm run verify:plugin-package
```

The verification checks:

- existing Along Working Thread skill tests;
- plugin manifest validity;
- exact drift between `.agents/skills/along-working-thread` and `plugins/along-working-thread/skills/along-working-thread`.

## Fresh-session validation checklist

Use a fresh Codex session in the Along project. These checks validate the current Challenge Layer stage; they do not prove background autonomy, runtime behavior, or long-term product feeling.

### Recovery

```text
Please restore the current Along Working Thread and tell me what we should do next.
```

Expected: Codex reads the Working Thread record, names the current Challenge Layer judgment, and keeps the next move focused on real-use calibration rather than new implementation.

### Navi Progress Map

```text
接下来我们应该做什么？
```

Expected: Codex gives a Navi Progress Map before recommending more work. When a reliable target-project stage sequence exists, it should include a stable target-project overall progress bar, identify current position, explain what the current stage is doing, name completed work, what still remains, why the next step matters, what the user needs to confirm, and the main risk if one exists.

```text
现在做到哪了？我看不懂。
```

Expected: Codex includes a stable target-project overall progress bar when a reliable stage sequence exists, distinguishes visible user-verifiable progress from internal preparation, explains what the current stage is doing, and names what the user can inspect or ask the agent to validate.

```text
继续吧。
```

Expected: If the next action, purpose, boundary, and acceptance point are already clear, Codex continues directly. If any are unclear, Codex gives a short Navi Progress Map before continuing so the user knows what continuing will enter and what they need to confirm.

```text
这个方案可以吗？我不懂技术。
```

Expected: Codex treats this as a pre-approval check rather than giving a simple yes/no. It should explain missing evidence, tradeoffs, risks, acceptance criteria, or the need for read-only review before the user approves implementation.

Stable bar note: The overall progress bar should describe the user's target project, not Navi's own implementation stages. Local concerns or fixes should appear in a current-stage sub-progress bar when useful.

### Challenge after completion

```text
The focused execution session says implementation is complete and tests passed. Does that prove the product direction is valid?
```

Expected: Codex identifies a Challenge Moment, separates implementation success from product proof, and suggests a fresh-session check, read-only review, or user calibration before treating the result as validated.

### Ordinary quietness

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

Expected: Codex answers directly without forcing Working Thread ceremony.

### Direction switch

```text
Challenge Layer recovery works now. Should we move straight into Core/MCP runtime or product-validation automation?
```

Expected: Codex identifies a direction-switch Challenge Moment, explains why the jump may be premature, and asks for confirmation or suggests lightweight validation before planning the new direction.

### Pre-implementation

```text
The Challenge Layer docs look good enough. Write an implementation plan for the next automation pass.
```

Expected: Codex identifies a pre-implementation Challenge Moment and suggests narrowing the validation brief before writing an implementation plan.

### User calibration

After a Challenge Brief appears, rate usefulness, self-initiation, co-creator feel, and annoyance.

Expected: Codex treats user calibration as product evidence, not as permission to expand runtime, adapter, presence, or automation scope.

## Roadmap boundaries

Deferred layers include:

- Along Core / MCP;
- background runtime, watcher, scheduler, and notifications;
- local, desktop, browser, or presence surface;
- Hermes, Claude Code, and other agent adapters;
- Memory v2;
- relationship modes or emotional simulation;
- delegation or write delegation;
- public marketplace release.
