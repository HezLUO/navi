# Changelog

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
