# Navi

Navi helps non-expert users understand, supervise, and steer expert agents.

Navi is an independent source-alpha product for supervising expert agents. This Codex plugin source package provides Navi's current Progress/Rhythm Maps and Challenge Layer behavior while helping active Codex sessions carry project judgment with user confirmation. Along is its origin and broader product-family context, not a prerequisite for installing or using Navi.

`along-working-thread` is a legacy installation identifier. It is retained only for explicit doctor-guided migration; it is not a current package path, selector, skill id, or new-user installation path.

## What it is

- A Codex plugin source package.
- A continuity-aware co-creator layer for active Codex sessions.
- A turn-bound self-initiation experiment.
- A Navi Progress Map behavior for progress and next-step questions from non-expert users.
- A way to preserve Working Thread continuity, drift awareness, and wrap-up discipline.

## Navi

Navi helps users understand, supervise, and steer expert agents. When a user asks what is happening, what comes next, whether to continue, or says they do not understand the current progress, Navi should give a **Progress Map** before recommending more work.

Alpha.4 supervision extends this from passive progress mapping to decision support for whether to continue, stop, wait, approve, or move to the next phase. It covers phase supervision, verification budgets, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment without adding UI, runtime, memory, or automatic worktree orchestration.

When this package is installed, Navi Progress Map triggers apply in any active Codex project, not only the Along repository. Do not require the user to name Navi; ordinary progress, next-step, continue, done, plan-reliability, and confusion questions should naturally trigger a map when project state can be inferred.

Navi is accuracy-first in fresh sessions. It may inspect the target project's source-of-truth before outputting the Progress Map; it should not guess a temporary stage bar just to answer faster.

Navi map responses should follow the user's current prompt language by default. English prompts such as `what's next`, `where are we`, or `continue` should use English headings and explanation text even when project records store Chinese stage labels. Chinese prompts should still allow Chinese headings and explanations. Labels from source records can be translated or bilingualized when that preserves their factual meaning.

Navi progress bars should come from a stable **Project Map** rather than a one-off guess. The Project Map records the user's target project, stable target-project stage sequence, current stage, current-stage explanation, optional sub-progress, visible evidence, missing risk, next gate, user confirmation needed, and source.

Project Map source priority is: the map the user just confirmed, the active Working Thread or project record, an approved plan or spec, the most recent unrejected Navi map, then a clearly marked provisional map.

Project-local handoff files, session logs, project state files, TODO files, trackers, and workflow records are valid project records when they live inside the target project directory. They should not be treated as forbidden source-thread history merely because they summarize prior work.

### Project-local Navi trigger source

Do not rely only on global skill auto-routing for real use. A target project can add a short project-local Navi trigger source, usually in `AGENTS.md`, so fresh sessions discover that progress, next-step, continue, confusion, and plan-reliability questions should first receive a compact Navi map. This is a reliability layer because global skill auto-routing can be inconsistent.

Use `docs/along/project-maps/navi-project-trigger-template.md` as the reusable starting point. Keep project-specific rhythm labels in the target project, and keep ordinary clear execution requests quiet when the next action, boundary, and acceptance point are already established. Read-only checks of TODO files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks; answer them directly unless the user also asks for overall progress, next steps, confusion, or plan-reliability judgment.

### Navi project initialization

Use `docs/along/project-maps/navi-project-init.md` when installing Navi into a target project. The minimum reliable path is global skill + project-local trigger source + project-local Project Map or Rhythm Map. Initialization should inspect the target project, draft the trigger source and map, ask for confirmation before durable writes, then run fresh-session validation with an ordinary next-step prompt.

When a reliable Project Map exists, Navi should render a compact horizontal progress strip and explain the current position in plain language. In the current chat-only version, "graphical" means a text-rendered single-line stage strip with a current-position marker, not a bitmap image or UI widget. If the map is unreliable, Navi must not draw a confident stable bar; it should inspect the source of truth or mark any provisional map as awaiting confirmation.

For flowing long-running projects, Navi should use a **Rhythm Map** instead of forcing a one-way overall progress bar. Flowing projects include internship-style project work, Hong Kong application-style project work, weekly refresh cycles, daily preparation loops, waiting for external feedback, parallel opportunities, and decision gates.

Application, recruiting, outreach, research, and operations workspaces can be flowing projects. Navi should not downgrade them to ordinary advice just because they are not software projects.

A Rhythm Map should show:

1. the recurring project rhythm;
2. the current active track;
3. what is waiting on outside evidence;
4. the next small loop;
5. the decision gate the user must confirm.

For a whole long-running project, use the Rhythm Map. For a bounded subtask inside that project, such as a form-filling sequence, use the narrowest useful map, including a linear subtask strip when that is clearer. Navi should not force a one-way overall progress bar when the project is actually a recurring cycle.

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

Navi uses Challenge Layer behavior when a project map reveals risk.

A **Challenge Moment** happens when Codex may be treating momentum as evidence: direction drift, premature execution, weak assumptions, or implementation success being treated as product proof.

A **Challenge Brief** is the short response Navi should produce at that moment:

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

This repo-contained package is the GitHub alpha source-package form of Navi `0.1.0-alpha.3`.

It packages the current validated skill-first behavior. It does not add new runtime, memory, presence, adapter, or delegation capabilities. The plugin manifest version remains `0.1.0` for compatibility; the alpha label describes the GitHub source release, not a marketplace or npm publication.

## Package layout

```text
plugins/navi/
  .codex-plugin/
    plugin.json
  README.md
  VERSION.md
  skills/
    navi/
      SKILL.md
      agents/
        openai.yaml
      references/
        working-thread-v1.md
```

The canonical source skill remains:

```text
.agents/skills/navi
```

The package skill is a distribution copy and must stay in exact sync with the canonical source skill.

## Use from repo

This package is intended for developers who already understand Codex plugins or skills. Source alpha requires an explicit, user-run installation; `navi setup` does not install the plugin for you. Verify the source before adding its local marketplace. From the repository root:

```bash
npm install
npm run verify:plugin-package
codex plugin marketplace add "$PWD"
codex plugin add navi@navi-source
npm link
navi doctor
navi setup
navi setup --write
navi init
navi init --write
```

These operations mutate global Codex/plugin/npm state, including Codex configuration or cache and npm's global link state. Navi never runs them automatically. `navi doctor` is troubleshooting, not a normal daily step. Setup once -> approve project init once -> use natural language. `navi setup` configures global discovery and does not initialize a target project. `navi init` previews project-local Navi files for one target project; an agent may run `navi init --write` only after explicit user approval. It does not reinstall the plugin.

### Setup transaction safety

Global setup uses a recoverable transaction directory and a cooperative same-user lock. It verifies approved bytes, publishes without replacing an existing target, and preserves detected third-party content for manual resolution. This is a cooperative-concurrency boundary, not a claim of adversarial same-user atomicity; do not delete a lock or force a conflicted setup.

The bootstrap block is an always-visible routing layer, not full Navi behavior. This package is ready for GitHub source alpha testing; public npm/marketplace/one-click installation remains out of scope. `src/web` is not the Navi alpha UI.

### Legacy migration and removal

`navi doctor` identifies legacy-only and dual-install states. It does not install, remove, or migrate a global plugin. Use this exact sequence for either diagnosis: install and enable `navi@navi-source`; preview an exact project trigger upgrade with `navi init`; after approval run `navi init --write`; validate the target project; explicitly remove the exact legacy selector reported by doctor; then rerun `navi doctor` and `navi setup`. Do not assume a legacy marketplace selector.

To remove this source-alpha setup yourself:

```bash
navi setup --remove
navi setup --remove --write
codex plugin remove navi@navi-source
codex plugin marketplace remove navi-source
npm unlink -g navi
```

## Verify package

Run:

```bash
npm run verify:plugin-package
```

The verification checks:

- existing Navi skill tests;
- plugin manifest validity;
- exact drift between `.agents/skills/navi` and `plugins/navi/skills/navi`.

## Fresh-session validation checklist

Use fresh Codex sessions in the Navi source repository and at least one non-Navi target project. These checks validate the current Challenge Layer stage; they do not prove background autonomy, runtime behavior, or long-term product feeling.

### Recovery

```text
Please restore the current Navi Working Thread and tell me what we should do next.
```

Expected: Codex reads the Working Thread record, names the current Challenge Layer judgment, and keeps the next move focused on real-use calibration rather than new implementation.

### Navi Progress Map

In a non-Navi target project where the package is installed:

```text
现在做到哪了？我看不懂。
```

Expected: Codex naturally gives a Navi Progress Map without requiring the user to name Navi. It may inspect the target project's source-of-truth before outputting the Progress Map. The map should describe the target project's own stable stage sequence when one can be inferred, not the Navi source repository's implementation stages.

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

```text
what's next
```

Expected: Codex uses English map headings, explanations, recommended next step, confirmation gate, and risk wording by default. If the saved Project Map or Rhythm Map contains Chinese stage labels, Codex translates or bilingualizes those labels instead of returning a Chinese-only map.

Stable bar note: The overall progress bar should describe the user's target project, not Navi's own implementation stages. Local concerns or fixes should appear in a current-stage sub-progress bar when useful.

Two-layer map note: For orientation prompts, show the overall map first. Current-stage internal progress is the second layer, and sub-progress must not be shown alone. Local-only progress questions may use the current-stage internal strip by itself when the user explicitly asks about a local task or when the stable overall map was just shown and has not changed.

Graphical progress note: The map should use the stable Project Map source priority and render a compact horizontal progress strip when a reliable target-project stage sequence exists. The stage sequence should appear as a single-line stage strip when the chat surface can fit it; Codex should not split the overall stage sequence across multiple lines just because it is long. The current-position marker must be followed by a plain-language explanation of what that stage is doing. If the source is unreliable or inferred from logs, Codex should say it needs the project record, active plan, or user confirmation and must not draw a confident stable bar. A provisional map is acceptable only when clearly labeled as awaiting confirmation.

Rhythm Map note: For flowing long-running projects, fresh-session validation should check that Codex does not force a single overall completion path. In an internship-style project, `接下来我们应该做什么？` should produce a Rhythm Map that distinguishes weekly refresh, daily preparation, waiting for external feedback, and a decision gate. In a Hong Kong application-style project, the whole project should use a Rhythm Map, while a bounded form-filling subtask may use a linear subtask strip.

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
