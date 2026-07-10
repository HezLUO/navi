# Navi Global Bootstrap And Init Discovery Design

Date: 2026-07-10

Status: Approved in design discussion; awaiting written spec review

## Summary

Navi needs an always-visible, lightweight bootstrap path between global capability installation and reliable project-local behavior.

The current skill, plugin, and future MCP layers remain useful after Navi is selected, but they cannot by themselves guarantee that an ordinary prompt in an uninitialized project will select Navi. The bootstrap must therefore live in a minimal managed block in the user's global Codex instructions. It should stay quiet for ordinary tasks, recognize broad supervision prompts, detect missing project-local Navi guidance, provide a provisional judgment, and ask whether to initialize the correct project root.

The user-facing product model remains deliberately smaller than the internal architecture:

```text
Setup once -> Approve project init once -> Use natural language
```

This design is a source-alpha bootstrap prerequisite. It does not approve npm publication, a public marketplace, a cross-platform one-click installer, MCP work, runtime UI, background behavior, or alpha.14 Project State implementation.

## Problem

### Intended first-use path

```text
Navi is available globally
  -> user asks a broad supervision question
  -> Navi notices that the project lacks local guidance
  -> Navi gives a provisional judgment and offers navi init
  -> the user approves the project-local write
  -> future fresh sessions use project-local evidence reliably
```

### Observed first-use path

Real calibration on 2026-07-10 produced three different results:

1. A desktop-created task in `engineering_loop` suggested `navi init`, but the task inherited delegation metadata and read the source thread containing the expected answer. This proved that the alpha.13 rule works after Navi is selected, but it was not an independent fresh-session result.
2. An independent `codex exec --ephemeral` session in uninitialized `engineering_loop` received only `what's next?`. It did not select Navi and did not recommend init. It read the project and gave useful ordinary Codex advice instead.
3. An independent session in initialized `sub_ag_ski` loaded the project-local Navi guidance, selected `along-working-thread`, and produced a Navi map with a next decision.

The evidence supports this narrower conclusion:

> Alpha.13 init guidance works once Navi is active, while global-only implicit discovery remains unreliable.

The current machine also had no executable `navi` command. The only documented source-alpha path was:

```bash
npm run navi -- init --target /path/to/project
```

An init recommendation is incomplete when the recommended command is not available in the user's shell.

Runtime inspection also found that the plugin manifest declared seven default prompts while the current Codex runtime accepts at most three. Codex ignored that field. Skill descriptions were shortened to fit the global skills context budget. Metadata cleanup is necessary, but metadata-only routing remains best effort and is not the bootstrap guarantee.

## Product Decision

Use a two-level activation architecture:

1. A global, always-visible bootstrap block handles first-use discovery only.
2. Project-local Navi guidance handles full supervision after initialization.

Keep the plugin and skill as Navi's packaged behavior layer. Keep MCP outside this bootstrap scope. A future MCP can support state, tools, diagnostics, or cross-session data after activation, but it does not remove the model's need to select or call it.

The global bootstrap remains prompt-backed, not a runtime interceptor. It should be materially more reliable than implicit skill routing because it is loaded as a user instruction, but this design must not claim deterministic pre-turn execution or always-on presence.

## Complexity Budget

Internal architecture may contain a CLI, plugin, skill, global instructions, and project-local instructions. Ordinary users must not need to understand those layers.

The primary experience has at most two user-visible actions:

1. Set up Navi globally once.
2. Approve project initialization once when Navi first becomes useful in that project.

Afterward, the user works through ordinary language such as:

- `what's next?`
- `where are we?`
- `should we stop?`
- `接下来做什么？`

`doctor`, removal, manual marketplace configuration, cache inspection, managed markers, and advanced map previews belong in troubleshooting or developer documentation, not the primary onboarding path.

The source alpha may temporarily require clone/install/link steps. Those are developer distribution constraints and must not become the long-term product mental model.

## Architecture

### 1. Global Bootstrap Layer

`navi setup --write` manages a compact block in `$CODEX_HOME/AGENTS.md`, defaulting to `~/.codex/AGENTS.md`:

```text
<!-- NAVI:GLOBAL-BOOTSTRAP:START -->
...
<!-- NAVI:GLOBAL-BOOTSTRAP:END -->
```

The block has one responsibility: route first-use supervision when project-local Navi guidance is absent.

It should instruct Codex to:

- stay quiet for narrow factual checks and clear bounded execution requests;
- react to broad progress, next-step, stop, wait, continue, confusion, or plan-reliability questions;
- perform a minimal read-only check for project-local Navi guidance;
- avoid a confident stable map when that guidance is missing;
- provide at most one short provisional judgment;
- identify the likely project root;
- ask whether to initialize that project with Navi;
- avoid repeating the reminder in the same session after the user declines.

The global block must not duplicate full Navi behavior. It must not draw a full Progress Map or Rhythm Map, maintain project state, write files, run init automatically, create worktrees, switch Work Modes, or introduce runtime/background claims.

### 2. Project-Local Navi Layer

`navi init --write` continues to manage project-local guidance, including:

- the Navi trigger block in project `AGENTS.md`;
- the provisional project map;
- any later approved project-local state artifact.

Once the local marker exists, the global bootstrap should stop offering init. The project-local trigger and installed skill own maps, quietness, supervision, decision visibility, and project evidence use.

Global setup and project init are not duplicate installations:

```text
global setup = makes Navi discoverable and callable
project init = configures reliable behavior for one target project
```

### 3. Plugin And Skill Layer

The plugin remains the distribution unit for the Navi skill. The skill remains the full behavior contract after activation.

This design also cleans up discovery metadata:

- plugin `defaultPrompt` contains no more than three entries;
- trigger-relevant language appears early in the skill metadata;
- the short description is concise and non-repetitive;
- `allow_implicit_invocation: true` remains enabled;
- documentation labels implicit invocation as best effort, not a guarantee.

Default prompts are UI affordances, not an automatic router. Metadata cleanup supplements the global bootstrap and does not replace it.

### 4. MCP Boundary

MCP is excluded from this bootstrap implementation.

An MCP server can expose state, tools, resources, diagnostics, or future project integration after the model chooses it. It cannot currently guarantee that every ordinary prompt is intercepted before skill/tool selection. Building MCP for this problem would add complexity without closing the activation loop.

## CLI Surface

The customer-facing `navi` CLI must be separated from the historical `along` runtime entrypoint.

```text
navi
  setup
  doctor
  init

along
  existing legacy start behavior
```

Running `navi` must not start the historical Along server, open `src/web`, or imply that the Navi alpha includes a runtime UI.

### `navi setup`

`navi setup` is dry-run by default. It checks and previews:

- whether the Navi plugin is installed and enabled;
- whether the global AGENTS file exists;
- whether the managed block would be created, updated, skipped, removed, or rejected as conflicted;
- whether the current CLI source and plugin/cache state are coherent.

`navi setup --write` applies the managed block change.

For the source alpha, setup does not install a missing plugin, register a marketplace, edit PATH, or implement a public installer. It must refuse to write a bootstrap that claims Navi is available when the plugin prerequisite is missing.

### `navi setup --remove`

Removal is also dry-run by default:

```bash
navi setup --remove
navi setup --remove --write
```

The write form removes only a complete, recognized managed block. It does not remove unrelated global instructions, uninstall the plugin, delete the CLI, or remove project-local Navi files.

### `navi doctor`

`navi doctor` is read-only. It reports:

- CLI availability and source/version;
- plugin installed/enabled state;
- package source/cache drift when inspectable;
- global bootstrap presence, duplication, or marker damage;
- current project initialization state;
- known manifest constraints such as excessive default prompts;
- the smallest relevant repair command.

Doctor is a troubleshooting surface, not a normal onboarding requirement.

### `navi init`

The existing project-local contract remains:

```bash
navi init
navi init --write
navi init --suggest-map
```

Dry-run remains the default. Suggested maps remain terminal-only. Init does not install the global plugin, manage the global bootstrap, publish packages, or expose runtime UI.

### Source-Alpha CLI Availability

The source-alpha documentation may use a repository-linked CLI such as:

```bash
npm install
npm link
```

This is a developer testing path and may require the repository to remain in place. A future Distribution & Trust project should replace it with a stable public installation path without changing the command contract.

## First-Use Interaction

For an uninitialized project, the first broad supervision answer should contain no more than:

1. a statement that reliable project-local Navi guidance is missing;
2. one short provisional judgment;
3. the likely target project root;
4. one approval question.

Example:

> Navi is available globally, but this project is not initialized for reliable project evidence. Provisional judgment: the next step appears to be the adoption smoke test. The active project appears to be `engineering-loop-kit-transition-package`. Initialize Navi there?

If the user approves, Codex may run the explicit write command within that approval boundary:

```bash
navi init --target "/actual/project/path" --write
```

If the user declines, Codex should continue with ordinary help and avoid repeating the reminder in that session.

## Project Root Selection

Bootstrap must not assume that the current directory is the target project root.

Use this priority:

1. an explicit user-selected target;
2. the current Git or clear project root;
3. one unique, obvious nested project root;
4. one clarification question when more than one target remains plausible.

The `engineering_loop` calibration is the reference edge case: its top-level directory is a wrapper, while `engineering-loop-kit-transition-package` is the actual Git project. Bootstrap should recommend the nested project rather than initialize the wrapper.

Explicit `--target` remains authoritative. Bootstrap must ask before writing to an inferred nested target.

## Managed Block Safety

Global setup writes outside the target repository and therefore requires explicit user approval in addition to the CLI write flag.

The global AGENTS lifecycle follows these rules:

- create the file only with explicit write approval when it does not exist;
- append the block without changing existing user content when no block exists;
- skip an exact current block;
- update only a complete, recognized older managed block;
- reject duplicate, nested, incomplete, or user-modified managed regions;
- reject unsafe symlinked targets or parents rather than following them;
- use atomic replacement so failure cannot leave a partially written file;
- preserve content outside the managed region byte-for-byte;
- remove only a complete recognized block;
- never format, reorder, or clean unrelated global instructions.

The project-local init safety model remains separate and continues to use its own marker and write protections.

## Failure Behavior

Bootstrap failure must not prevent ordinary Codex help.

- Plugin missing: do not write a misleading global block; report the source-alpha prerequisite.
- CLI unavailable: do not recommend a command that cannot run; report the exact source-alpha path.
- Global marker conflict: keep the file untouched and identify the conflict location.
- Project root ambiguous: ask one question before init.
- User declines init: remain quiet for the rest of the session.
- Init write fails: report the actual partial/no-write state and never claim initialization succeeded.
- Global bootstrap exists but project evidence is weak: give only a provisional judgment.

## Scope

### Included

- a clean Navi CLI entrypoint for `setup`, `doctor`, and `init`;
- global bootstrap block rendering and lifecycle;
- dry-run/write/remove safety behavior;
- plugin and CLI prerequisite checks;
- project-root guidance for first-use interaction;
- plugin discovery metadata cleanup;
- source-alpha setup and troubleshooting documentation;
- targeted automated tests;
- bounded real-project calibration in `engineering_loop` and `sub_ag_ski`.

### Excluded

- MCP implementation;
- npm publication;
- public marketplace publication;
- a cross-platform one-click installer;
- automatic PATH editing;
- automatic marketplace registration;
- runtime UI or `src/web` rebranding;
- background watchers, notifications, or always-on presence;
- agent adapters outside the current Codex surface;
- alpha.14 `.navi/state.md` implementation;
- tag, release, or publish work.

The existing alpha.14 design and implementation plan remain in the repository, but alpha.14 implementation waits until bootstrap calibration closes.

## Validation Strategy

This is Implementation-mode validation, not Release-mode validation.

### Targeted automated checks

Cover:

- setup dry-run performs no writes;
- global block create, update, skip, conflict, remove, and remove-conflict behavior;
- incomplete/duplicate markers are preserved and rejected;
- symlink and partial-write safety;
- plugin-missing preflight;
- doctor remains read-only;
- `navi` and `along` entrypoint separation;
- manifest default-prompt count and concise discovery metadata;
- generated bootstrap wording enforces quietness, provisional judgment, and one approval gate;
- initialized projects do not receive init guidance.

Do not default to full tests, release checklists, tags, or package publication. Run the targeted suites for the files and contracts changed. Broaden validation only if implementation changes shared core behavior outside this design.

### Real-project calibration

Use exactly two roles:

#### `engineering_loop`: uninitialized sample

1. Start a context-independent fresh session with `what's next?`.
2. Confirm the global bootstrap appears without source-thread contamination.
3. Confirm it identifies the nested Git project.
4. Confirm it gives a provisional judgment and one init approval question.
5. Confirm no write occurs before approval.
6. After explicit approval, initialize the nested project.
7. Start one fresh session and confirm project-local Navi takes over.

#### `sub_ag_ski`: initialized control

1. Start a context-independent fresh session with a broad supervision prompt.
2. Confirm no init reminder appears.
3. Confirm the existing project map is read.
4. Confirm the response language follows the current prompt.
5. Confirm one narrow factual prompt remains quiet.

### Stop criteria

Close bootstrap validation when:

- an uninitialized project receives one usable init suggestion;
- the suggestion targets the correct project root;
- no write occurs without approval;
- the approved init produces stable project-local behavior in one fresh session;
- an initialized project does not receive another init suggestion;
- an ordinary narrow task remains unaffected.

Do not add more samples after these decisions are supported. Return to product planning and choose whether to resume alpha.14 or open a separate Distribution & Trust project.

## Risks And Residual Limits

- Global AGENTS remains a model-followed instruction surface, not a runtime hook. It improves first-use reliability but cannot honestly be called an always-on interceptor.
- Writing global user instructions is sensitive. Marker ownership, conflict refusal, dry-run defaults, and explicit approval are required.
- Source-alpha CLI linking is not a final distribution experience.
- Plugin discovery metadata competes with other installed skills and may still be truncated.
- The internal `along-working-thread` compatibility name remains visible in some technical surfaces.
- Repeated reminders across separate fresh sessions remain possible because the first version does not persist an "init declined" preference.
- Project-root inference must remain conservative; ambiguous wrappers and monorepos require confirmation.

## Sequencing

1. Review and approve this written design.
2. Produce an implementation plan in Implementation Planning.
3. Commit and push the design and plan if explicitly approved.
4. Execute implementation in a real worktree session.
5. Run targeted validation only.
6. Run the two bounded real-project calibration roles.
7. Decide whether bootstrap is sufficient to resume alpha.14.

No step automatically enters Release mode.
