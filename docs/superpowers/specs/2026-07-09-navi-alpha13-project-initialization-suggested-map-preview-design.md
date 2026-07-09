# Navi Alpha 13 Project Initialization And Suggested Map Preview Design

## Status

This design was discussed and approved in conversation on 2026-07-09 after the alpha.12 Quietness / Rule Density Control design and implementation planning.

This is a design artifact only. It does not approve implementation, worktree execution, README edits, release preparation, GitHub Release changes, npm publication, marketplace publication, runtime UI, telemetry, background automation, Memory v2, agent adapters, delegation, or write delegation.

Alpha.13 belongs to the **Project Integration** product layer. It should not become another broad User Supervision rule layer.

## Product Context

Navi's current alpha wedge is skill/plugin behavior plus project-local docs and `navi init`.

Alpha.12 is intended to cap the User Supervision rule stack by adding a quietness gate before Navi surfaces. After alpha.12, the next product risk is not missing another supervision concept. The next risk is that Navi may be hard to enter reliably from a real target project, especially in fresh sessions.

Users can reasonably ask:

```text
If Navi is globally installed, why do I need to run navi init in a project?
Does that install Navi twice?
```

Alpha.13 should answer that product-model confusion and make project initialization more useful without pretending the CLI can fully understand a project.

## Product Model

Alpha.13 uses this model:

```text
Install Navi once.
Initialize Navi for each project where reliable fresh-session behavior matters.
```

More explicitly:

```text
Global install = enables the Navi skill/plugin capability.
navi init      = initializes a target project with project-local guidance and a starter map.
```

`navi init` is not a second Navi installation. It is project configuration.

Recommended user-facing wording:

```text
This does not install Navi again.
It adds project-local guidance and a starter map for this project.
```

Chinese product-language equivalent:

```text
这不是重复安装 Navi。
这是给当前项目添加 Navi 的本地配置和起始地图。
```

## Problem Definition

Alpha.13 solves two connected Project Integration problems.

### 1. Initialization Confusion

Global Navi installation and project-local initialization can look like duplicate installation steps.

The product needs a clear distinction:

- install once globally so Navi exists as a capability;
- initialize per project so fresh sessions know how to trigger Navi and where to read local evidence.

### 2. Fresh-Session Trigger Reliability

In a fresh target-project session, ordinary next-step and progress prompts should reliably trigger Navi after project initialization.

Examples:

- `接下来做什么？`
- `现在做到哪了？`
- `where are we?`
- `what's next?`
- `what should we do next?`

The user should not need to say "Navi", "Progress Map", "Project Map", or "Work Mode".

## Product Goal

Alpha.13 should make project initialization understandable and make initialized projects more reliable in fresh sessions.

The goal is:

```text
After Navi is globally installed, navi init initializes a target project so fresh sessions can recognize ordinary progress/next-step prompts and read project-local evidence before drawing a map.
```

## Core Principles

### Project Initialization Is Not Installation

`navi init` should always be described as project initialization or project-local configuration, not as installing Navi again.

### Project-Local Evidence Comes Before Stable Maps

After project initialization, Navi should prefer project-local evidence before drawing a map:

- `AGENTS.md`;
- `README*`;
- `PROJECT_STATE.md`;
- `docs/along/project-maps/*.md`;
- `TODO*`;
- `STATUS*`;
- workflow records;
- handoff records;
- plan/spec records.

If evidence is insufficient, Navi should say what is missing instead of drawing a confident stable map.

### Suggestions Are Not Confirmed Maps

Suggested maps are previews. They are not confirmed Project Maps or Rhythm Maps until the user explicitly confirms or edits them.

### Quietness Still Applies

Alpha.13 must preserve alpha.12 quietness. Ordinary factual, read-only, status, or execution prompts should stay quiet unless the user asks what those facts mean for overall progress or next steps.

Examples that should stay quiet:

- "What branch are we on?"
- "Read this TODO file."
- "What does this file say?"
- "Run this command."
- "What changed in this diff?"

## Global-Only Behavior

When Navi is globally installed but the current project has no project-local Navi initialization, Navi should not draw a confident stable map for broad progress prompts.

Preferred behavior:

```text
This project does not appear to be initialized for Navi yet.
I can make a one-time provisional judgment, but reliable fresh-session maps need project-local guidance and a starter map.
Recommended next step: run navi init for this project.
```

This is not a hard refusal. The user may still ask for a one-time provisional judgment.

Global-only behavior should:

- avoid confident stable maps;
- recommend project initialization first;
- allow a provisional judgment if the user chooses;
- explain that `navi init` is project configuration, not a second install.

## Initialized-Project Behavior

After `navi init`, ordinary progress and next-step prompts should trigger Navi more reliably in fresh sessions.

Initialized-project behavior should:

- recognize ordinary progress and next-step prompts without requiring Navi-specific vocabulary;
- read project-local evidence before drawing a map;
- use existing Project Map or Rhythm Map records when available;
- keep starter maps provisional until user confirmation;
- keep ordinary factual or execution tasks quiet.

## `navi init` Output Requirements

Dry-run and write output should make the product model explicit.

Required wording:

```text
This does not install Navi again.
It adds project-local guidance and a starter map for this project.
```

The output should also keep the existing safety model:

- default dry-run changes no files;
- `--write` is required for durable writes;
- existing project files are preserved;
- generated maps are provisional unless the user confirms a stable map.

## Suggested Map Preview

Alpha.13 introduces a proposed `--suggest-map` option.

Command shape:

```text
navi init [--target <path>] [--write] [--suggest-map]
```

`--suggest-map` should perform read-only evidence discovery and print a suggested map preview.

It should not:

- write the suggestion to disk;
- overwrite an existing map;
- mark a map as confirmed;
- call a model;
- read other Codex threads or source-thread history;
- treat temporary tasks, tests, commits, or local follow-ups as overall project stages.

## `--suggest-map --write`

`--suggest-map` and `--write` may be combined, but their effects stay separate.

When the user runs:

```text
navi init --target . --suggest-map --write
```

Navi should:

1. write the standard project-local initialization output:
   - `AGENTS.md` trigger block;
   - provisional starter map;
2. print the suggested map preview in the terminal;
3. not write the suggestion into `navi-project-map.md`;
4. not treat the suggested map as confirmed.

Core CLI semantics:

```text
--write controls durable project-local initialization.
--suggest-map controls read-only project-shape preview.
Suggestions are never written automatically.
```

## Evidence Discovery

`--suggest-map` should use a hybrid approach:

```text
deterministic evidence discovery
+ shape hints
+ structured provisional preview scaffold
+ later user/Codex confirmation
```

It should not use a model or pretend to fully understand the project.

### Candidate Files

The first version should scan filenames and read small leading snippets from candidate files such as:

- `README*`;
- `AGENTS.md`;
- `PROJECT_STATE.md`;
- `TODO*`;
- `STATUS*`;
- `docs/along/project-maps/*.md`;
- `docs/**/handoff*.md`;
- `docs/**/workflow*.md`;
- `docs/**/plan*.md`;
- package/build metadata such as `package.json` or `pyproject.toml`.

### Read Limits

Evidence discovery should:

- read only the leading snippet of each candidate file;
- use a per-file limit such as 8-16 KB;
- use a total read budget such as 100-200 KB;
- ignore `.git`, `node_modules`, `dist`, `build`, `.next`, binary/media files, and lockfiles;
- list `Evidence read` in the output.

Exact byte limits can be chosen in implementation, but the first version must avoid full project scans.

## Shape Hints

`--suggest-map` should output a shape hint, not a verdict.

Allowed shape hints:

```text
linear | flowing | mixed | unclear
```

Allowed confidence levels:

```text
high | medium | low
```

Recommended output wording:

```text
Project shape hint: flowing (medium confidence)
Needs confirmation before becoming a stable map.
```

### Conservative Signal Rules

Flowing signals may include:

- application, internship, recruiting, outreach, research, or operations language;
- TODO/status/workflow/handoff records;
- words such as waiting, follow-up, feedback, screening, refresh, or cycle.

Linear signals may include:

- README plus package/build/test structure;
- milestone, plan, spec, implementation, validation, or release language;
- one-time deliverable language.

Mixed means both flowing and linear signals appear.

Unclear means evidence is too sparse or contradictory for a useful preview.

## Preview Rules

High or medium confidence should generate one preview that matches the shape hint.

Low confidence or unclear shape should not generate a concrete map. It should output starter guidance and missing evidence.

### Linear Preview

For a linear hint, output a provisional Project Map preview:

```text
Project progress
[Goal] -> [Design/plan] -> [Implementation] -> [Validation] -> [Delivery]
                         ^
                    Current position
```

The labels should be adapted only when evidence supports it. Otherwise keep them generic and mark the preview provisional.

### Flowing Preview

For a flowing hint, output a provisional Rhythm Map preview:

```text
Project rhythm
[Cycle/source refresh] + [Screening/selection] + [Preparation/execution] + [Follow-up/feedback]
                                      ^
                                  Current focus

Current track
[Read records] -> [Choose small loop] -> [Execute] -> [Record/wait]
```

The labels should be adapted only when evidence supports it. Otherwise keep them generic and mark the preview provisional.

### Mixed Preview

For a mixed hint, output one suggested starting view and ask for confirmation:

```text
Project shape hint: mixed (medium confidence)
This project has both bounded delivery work and recurring workflow signals.
Suggested starting view: Rhythm Map
Needs confirmation: should Navi orient this project as a recurring workflow or a bounded delivery?
```

Do not output two full competing maps by default.

### Unclear Preview

For low confidence or unclear shape:

```text
Not enough evidence for a reliable map preview.
Suggested next step:
- Add or confirm PROJECT_STATE.md, README, TODO/status file, or a project map.
- Then rerun navi init --suggest-map.
```

Hard rule:

```text
Never generate a concrete map preview when confidence is low.
```

## Suggested Output Shape

Recommended `--suggest-map` output:

```text
Navi suggested project map preview
Target: <path>
No files were changed.

Evidence read:
- README.md
- AGENTS.md
- PROJECT_STATE.md

Project shape hint: flowing (medium confidence)

Suggested map:
...

Why this map:
...

Uncertain or missing:
...

Next step:
Run navi init --target . --write to add project-local guidance and a starter map.
Review or edit the suggested map before treating it as stable.
```

When combined with `--write`, replace `No files were changed` with the normal write summary, but still say the suggested map was not written.

## Global Skill Boundary

Alpha.13 should make only a minimal global skill update.

The global skill may state:

- Navi is installed globally once;
- `navi init` initializes a target project for reliable fresh-session behavior;
- `navi init` does not install Navi again;
- global-only sessions can provide best-effort supervision, but project-local initialization is the reliable path for project evidence and trigger behavior.

The global skill should not receive the full `--suggest-map` implementation rules. Those belong in CLI docs, init docs, project-local trigger guidance, and targeted tests.

This keeps alpha.13 in Project Integration rather than expanding User Supervision rule density.

## Implementation Surface

If implemented, alpha.13 should touch:

- `src/cli/navi-init.ts`;
- `tests/cli/navi-init.test.ts`;
- `docs/along/project-maps/navi-project-trigger-template.md`;
- `docs/along/project-maps/navi-project-init.md`;
- minimal global skill/reference wording if needed;
- plugin package copy sync if global skill files change.

It may add small CLI helper functions for:

- candidate evidence discovery;
- snippet reading with limits;
- shape hint calculation;
- preview rendering.

It should not touch:

- `src/web`;
- MCP runtime/server behavior;
- README or release notes unless a later Release-mode decision explicitly requires it;
- GitHub Release bodies;
- external target projects;
- npm publication or marketplace configuration.

## Testing

Implementation should add targeted CLI fixture tests.

Required fixture shapes:

1. Linear target fixture:
   - has README/package/spec/implementation/test/release signals;
   - expects `Project shape hint: linear`;
   - expects Project Map preview;
   - does not write files without `--write`;
   - does not mark suggestion as confirmed.

2. Flowing target fixture:
   - has application/recruiting/outreach/workflow/status/handoff signals;
   - expects `Project shape hint: flowing`;
   - expects Rhythm Map preview;
   - does not write files without `--write`;
   - does not mark suggestion as confirmed.

3. Unclear target fixture:
   - has sparse evidence;
   - expects `Project shape hint: unclear`;
   - does not output a concrete map preview;
   - outputs missing evidence guidance.

4. `--suggest-map --write` fixture:
   - writes standard project-local trigger plus starter map;
   - prints suggested preview;
   - leaves the written map as provisional starter;
   - does not write the suggested preview into the map file.

Validation should stay targeted:

```bash
npm test -- tests/cli/navi-init.test.ts
git diff --check
```

Run `npm run verify:plugin-package` only if canonical skill files or packaged skill copies are touched.

Do not run full release validation unless Release mode is explicitly approved.

## Risks And Controls

Risk: users think `navi init` installs Navi a second time.

Control: CLI and docs explicitly say it does not install Navi again; it adds project-local guidance and a starter map.

Risk: `--suggest-map` output looks like a confirmed project map.

Control: label it as a suggested preview, keep written maps provisional, and require user confirmation before treating any map as stable.

Risk: shape heuristics overfit filenames or shallow snippets.

Control: use conservative confidence levels, avoid concrete maps at low confidence, and list evidence read.

Risk: alpha.13 re-expands User Supervision rule density right after alpha.12.

Control: keep global skill changes minimal and put detailed behavior in Project Integration surfaces.

Risk: `--suggest-map --write` silently writes the suggestion.

Control: suggestions are never written automatically. `--write` controls only standard initialization.

## Non-Goals

Alpha.13 is not:

- a full project understanding engine;
- a model-backed project analyzer;
- confirmed map generation;
- automatic map acceptance;
- global plugin installation;
- npm publication;
- marketplace publication;
- runtime UI;
- local app behavior;
- background watcher behavior;
- Memory v2;
- agent adapters;
- delegation or write delegation;
- release preparation.

## Open Future Direction

A future design may add a stronger confirmation flow such as:

```text
navi init --suggest-map --accept-suggested-map
```

That is intentionally out of alpha.13. Writing an inferred map should require a separate design because it changes the durability and trust boundary.
