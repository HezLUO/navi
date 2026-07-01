# Changelog

## 0.1.0-alpha.3 - 2026-07-01

Navi `0.1.0-alpha.3` is a GitHub source-alpha maintenance checkpoint for prompt-language following in Navi maps.

### Changed

- Clarified that Navi map responses should follow the user's current prompt language by default.
- Clarified that saved Project Map or Rhythm Map records are source evidence, not the answer-language selector.
- Updated the repo skill, packaged plugin skill, project-map docs, and `navi init` generated trigger block with the language-following rule.
- Updated README guidance so multilingual target projects do not imply that saved Chinese records require English prompts to receive Chinese maps.

### Validated

- `npm run verify:plugin-package` passed.
- `npm test -- tests/cli/navi-init.test.ts tests/skills/along-working-thread-skill.test.ts` passed.
- `npm run typecheck` passed.
- Fresh-session validation against a real target-project copy confirmed that English `what's next` receives an English map and Chinese prompts keep a Chinese map.

### Not Included

- No npm package publication.
- No public Codex marketplace publication.
- No global plugin installation, one-click sync, or npm distribution.
- No runtime UI, local app surface, Web UI rebrand, background watcher, notifications, or always-on presence.
- No Hermes, Claude Code, or other agent adapters.
- No Memory v2, relationship modes, delegation, or write delegation.

## 0.1.0-alpha.2 - 2026-07-01

Navi `0.1.0-alpha.2` is a GitHub source-alpha checkpoint after the standalone Navi repository split and project-local initializer validation.

### Added

- Added the narrow `navi init` project-local initializer with dry-run preview by default and explicit `--write` application.
- Added target-project setup docs for `AGENTS.md`, `docs/along/project-maps/navi-project-map.md`, and fresh-session validation.
- Added homepage polish with English/Chinese README entry points and a Progress Map preview asset.
- Added Web UI future-surface guidance that keeps existing `src/web` Shared Desk code out of the current alpha surface.

### Changed

- Clarified that `navi init` does not install the global Codex plugin or skill.
- Clarified existing project-map-directory preview wording so Navi does not imply every Markdown record is a confirmed project map.
- Tightened release, README, roadmap, and product-debt language around alpha boundaries, source verification, and the Navi/Along relationship.
- Synced package metadata so the lockfile includes the shipped `navi` bin entry.

### Validated

- `npm run verify:plugin-package` passed.
- `npm test -- tests/cli/navi-init.test.ts` passed.
- `npm run typecheck` passed.
- Full `npm test` passed outside the sandbox after sandbox-local TCP listener restrictions blocked server tests.
- Clean target dry-run/write validation confirmed `navi init` previews without writing, then writes only `AGENTS.md` and `docs/along/project-maps/navi-project-map.md` with `--write`.

### Not Included

- No npm package publication.
- No public Codex marketplace publication.
- No global plugin installation, one-click sync, or npm distribution.
- No runtime UI, local app surface, Web UI rebrand, background watcher, notifications, or always-on presence.
- No Hermes, Claude Code, or other agent adapters.
- No Memory v2, relationship modes, delegation, or write delegation.

## 0.1.0-alpha.1 - 2026-06-30

Navi `0.1.0-alpha.1` clarifies the product hierarchy after the first alpha release.

### Changed

- Clarified that Navi is the current V1 product surface of Along, not the full long-term Along product.
- Clarified that Navi's V1 alpha behavior centers on Progress/Rhythm Maps and Challenge Layer, rather than equating Navi itself with those mechanisms.
- Added the post-alpha backlog / roadmap covering alpha feedback, distribution improvements, future capability layers, and current non-goals.
- Synced the Navi / Along hierarchy wording across the root README, canonical skill, repo-contained plugin package, product debt register, and package tests.

### Not Included

- No npm package publication.
- No public Codex marketplace publication.
- No runtime, UI, adapter, memory, relationship, delegation, or background autonomy expansion.

## 0.1.0-alpha - 2026-06-30

Navi `0.1.0-alpha` is the first GitHub source release prepared for external readers and early testers.

### Added

- Navi Progress Map behavior for non-expert progress, next-step, continue, done, confusion, and plan-reliability questions.
- Rhythm Map behavior for flowing long-running projects with recurring cycles, parallel opportunities, external waits, and user decision gates.
- Challenge Layer behavior for drift, weak assumptions, premature execution, and self-certifying momentum.
- Project-local Navi initialization guidance through `AGENTS.md`, `docs/along/project-maps/`, and reusable trigger templates.
- Repo-contained Codex plugin source package at `plugins/along-working-thread`.
- Verification command `npm run verify:plugin-package` for skill tests, plugin manifest validation, and canonical/package drift checking.
- MIT license for GitHub source release.

### Validated

- Fresh-session Navi behavior in the Navi test project and non-Along target projects.
- Two-layer orientation: stable target-project map first, current-stage sub-progress second.
- Quietness boundary: ordinary factual checks such as TODO files, status files, tracker rows, spreadsheet rows, today's items, known files, or specific records stay quiet unless the user asks for supervisory orientation.
- Package verification: `27/27` targeted skill tests passed during the release preparation pass.

### Not Included

- npm package publication.
- Public Codex marketplace publication.
- Automatic install or sync script.
- Background autonomy, watcher, scheduler, notifications, or always-on presence.
- Future UI/runtime surface.
- Hermes, Claude Code, or other agent adapters.
- Memory v2, relationship modes, delegation, or write delegation.
- A claim that long-term product feeling or every professional domain is fully validated.
