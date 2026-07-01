# Navi

Navi helps non-expert users understand, supervise, and steer expert agents.

Navi is an independent open-source product and the first V1 product surface from the broader Along vision. Along is the long-term companion-layer vision; Navi is the current alpha product you can inspect, install, and test today.

This repository is the canonical open-source alpha home for Navi. Navi's V1 alpha behavior centers on **Progress/Rhythm Maps** and **Challenge Layer** behavior inside active Codex sessions: it explains where a target project stands, what is missing, what comes next, what the user needs to confirm, and when expert-agent momentum needs a lightweight challenge.

## Try Navi Alpha In 5 Minutes

This alpha is a GitHub source package for Codex users and developers who are comfortable testing from a repository. It is not yet an npm package, public marketplace listing, or one-click global installer.

```bash
git clone https://github.com/HezLUO/navi.git
cd navi
npm install
npm run verify:plugin-package
```

That verifies the repo-contained Navi plugin source package.

To try Navi in a real target project, preview the project-local setup:

```bash
npm run navi -- init --target /path/to/target-project
```

Apply the setup only after reviewing the preview:

```bash
npm run navi -- init --target /path/to/target-project --write
```

Project-local setup is explicit and dry-run by default. `navi init` prepares `AGENTS.md`, `docs/along/project-maps/`, and a fresh-session validation prompt inside the target project. It does not install the global Codex plugin or skill.

For more setup detail, follow:

- `docs/along/project-maps/navi-project-init.md`
- `docs/along/project-maps/navi-project-trigger-template.md`

The minimum reliable setup is: global skill/plugin availability, a short project-local trigger source in `AGENTS.md`, and a confirmed Project Map or Rhythm Map for that target project. After that setup, ordinary questions like `接下来我们应该做什么？`, `现在做到哪了？我看不懂。`, or unclear `继续吧。` should produce a Navi map before ordinary task advice.

## Who This Alpha Is For

Use this alpha if you want to test Navi's current supervision behavior in active Codex sessions, review the plugin source package, or give feedback on whether Progress/Rhythm Maps and Challenge Layer behavior help non-expert users steer expert-agent work.

Wait for a later release if you need npm distribution, public marketplace installation, global Codex plugin installation, one-click sync, runtime UI, background watching, notifications, or adapters for agents outside Codex.

## Alpha Status

`0.1.0-alpha.1` is ready as the latest GitHub source release for developers and early testers.

What is stable in this alpha:

- Navi Progress Maps for progress, next-step, continue, done, confusion, and plan-reliability questions.
- Rhythm Maps for flowing long-running projects with recurring cycles, waiting states, parallel opportunities, and decision gates.
- Challenge Layer behavior for anti-self-certification moments.
- Working Thread continuity for project judgment that needs durable carry-forward.
- Project-local Navi initialization through `navi init`, `AGENTS.md`, and `docs/along/project-maps/`.
- Codex skill/plugin behavior with project-local docs.

What is not included:

- npm package publication.
- Public Codex marketplace release.
- Global Codex plugin installation or one-click sync.
- Background autonomy, notifications, or always-on presence.
- A future UI/runtime surface.
- Hermes, Claude Code, or other agent adapters.
- Memory v2, relationship modes, delegation, or write delegation.

The root `package.json` intentionally remains `"private": true` to prevent accidental npm publication. The source is available under the MIT license for GitHub alpha use.

## Relationship To Along

Along is the broader long-term product vision: a local-first, open-source companion layer for existing agents.

Navi is the first independent V1 product surface from that vision. It is not the whole Along roadmap. The current Navi alpha focuses on non-expert supervision through Progress/Rhythm Maps, Challenge Layer behavior, and Working Thread continuity.

The internal package id remains `along-working-thread` for alpha compatibility. Treat that as an implementation and migration name, not the customer-facing product name.

## Current V1 shape

Current V1 uses skill/plugin behavior with project-local docs. The repo-contained Codex plugin source package lives at:

```text
plugins/along-working-thread
```

The internal package id remains `along-working-thread` for compatibility with existing skill paths, local installs, and tests. The customer-facing product name is Navi.

Navi V1 is docs-backed and turn-bound. It works while an active agent session is running; it does not watch files, send notifications, or act when Codex is closed.

## What Navi Does

Navi Progress Maps are for questions like:

```text
接下来我们应该做什么？
现在做到哪了？我看不懂。
继续吧。
这个方案可以吗？我不懂技术。
```

For a bounded project, Navi should use a compact project map:

```text
[需求] -> [设计] -> [执行] -> [验证] -> [交付]
                         ^
                      当前位置
```

For a flowing long-running project, Navi should use a Rhythm Map instead of forcing a completion bar:

```text
[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]
                                      ^
                                   当前焦点
```

Challenge Layer behavior appears when the map reveals drift, weak assumptions, premature execution, or self-certifying momentum. Its job is to turn questionable momentum into lightweight validation, not to criticize every decision.

## Verify The Source Package

Install dependencies:

```bash
npm install
```

Verify the repo-contained Navi plugin source package:

```bash
npm run verify:plugin-package
```

Run the full local checks:

```bash
npm test
npm run typecheck
```

For local Codex plugin experimentation, use this package source directory:

```text
plugins/along-working-thread
```

This alpha includes a narrow project-local initializer:

```bash
npm run navi -- init --target /path/to/target-project
```

The initializer is dry-run by default and only writes with `--write`. It prepares the target project for Navi behavior; it does not install or sync the global Codex plugin or skill.

## Alpha Feedback We Want

The most useful alpha feedback is evidence from real or realistic target projects:

- Did ordinary progress, next-step, confusion, continue, and plan-reliability questions trigger a useful Navi map?
- Did flowing projects use Rhythm Maps instead of misleading completion bars?
- Did Challenge Layer behavior catch weak assumptions or self-certifying momentum without becoming constant critique?
- Did narrow factual checks and clear execution requests stay quiet?
- Did the `along-working-thread` compatibility name confuse installation or review?

## Project-Local Setup

For reliable Navi behavior in a target project, use:

- a project-local trigger source in `AGENTS.md`;
- a confirmed Project Map or Rhythm Map under `docs/along/project-maps/`;
- the target project's source records, such as state files, TODO files, trackers, workflow records, and handoffs.

Reusable setup docs:

- `docs/along/project-maps/navi-project-init.md`
- `docs/along/project-maps/navi-project-trigger-template.md`
- `docs/along/project-maps/README.md`

## Architecture Boundary

MCP, runtime, local app, background presence, companion memory, and adapter surfaces are experimental or later layers unless explicitly called out for a focused validation pass.

The repository still contains older Along companion ideas, including local memory, Shared Desk, soundscape, and `.along/` runtime concepts. Treat those as historical or future-facing context, not the current recommended Navi installation path.

## Release Notes

See `CHANGELOG.md` for the latest alpha release notes.

## License

MIT. See `LICENSE`.
