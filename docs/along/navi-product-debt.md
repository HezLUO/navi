# Navi Product Debt Register

Last updated: 2026-07-01

This document tracks known debt that should be handled before Navi is treated as a clear public product surface.

## Current Naming Decision

Use **Navi** as the public product and plugin display name.

Use **Progress Map** as the name of Navi's current V1 output format, not as the whole product name. Progress Map is the clearest current wedge because users can immediately see it when they ask what is happening, what comes next, or whether a plan is trustworthy. It is not the entire long-term selling point.

Recommended naming model:

```text
Navi = public product name
Progress Map = core V1 map output
Rhythm Map = Progress Map variant for flowing long-running projects
Challenge Layer = risk-escalation behavior inside Navi
Working Thread = internal continuity mechanism
Along = parent project or lab context
```

Recommended public plugin surface:

```text
Display name: Navi
Short description: Progress maps and decision guidance for non-expert users supervising expert agents.
Internal or legacy id: along-working-thread
```

Do not rename the internal skill id, package directory, MCP server name, or docs paths in a casual patch. Those names are already used by tests, package verification, and local installation. Treat a full rename as a compatibility migration.

## Debt Items

### 1. Public Naming Debt

Status: open
Priority: high before public release

Problem:

The user-facing behavior is now Navi, but the plugin display name, skill id, package directory, canonical skill path, and several docs still lead with `Along Working Thread`.

Why it matters:

Non-expert users and external adopters should not need to understand "Working Thread" before they understand Navi. Working Thread is an implementation mechanism, not the customer-facing promise.

Recommended fix:

- Change user-facing display name and README title to Navi.
- Keep `along-working-thread` as the internal/legacy id until a migration is intentionally planned.
- Add a short compatibility note wherever the old name remains.

### 2. Top-Level Product Narrative Debt

Status: open
Priority: high before public release

Problem:

Some docs have compressed Navi into Progress Map plus Challenge Layer. The intended hierarchy is broader: Navi is Along's current V1 product surface for non-expert supervision, Progress/Rhythm Maps and Challenge Layer are the current V1 alpha mechanisms, Working Thread is the internal continuity substrate, and Along remains the broader long-term product vision.

Why it matters:

The repository currently tells two different stories. A new reader may not know whether the project is a companion app, a Codex skill, a plugin package, an MCP server, or Navi.

Recommended fix:

- Keep the root README and package docs aligned on the current product hierarchy.
- Make Navi the current V1 surface without reducing Navi to Progress/Rhythm Maps and Challenge Layer.
- Move older companion/runtime ideas into roadmap or historical context.

### 3. Installation And Initialization Debt

Status: partly addressed
Priority: high before broader real-use validation

Problem:

Fresh-session calibration showed that global skill auto-routing can be inconsistent. The reliable V1 path is:

```text
global skill + project-local trigger source + project-local Project Map
```

That path is now partly productized through the narrow project-local `navi init` initializer, but global plugin installation, one-click sync, npm release, marketplace release, and clearer user docs remain open distribution work.

Why it matters:

If a user installs the plugin and expects ordinary questions like `接下来我们应该做什么？` to always trigger Navi, they may see inconsistent behavior unless their target project has a local trigger source and map.

Recommended fix:

- Keep `navi init` narrow: project-local preview by default, `--write` for durable changes, no global plugin install.
- Add clearer "Install Navi into this project" docs around the command.
- Treat global plugin installation, one-click sync, npm release, and marketplace release as separate distribution projects.

### 4. Architecture Boundary Debt

Status: open
Priority: medium-high before public release

Problem:

The current recommended path is skill/plugin plus project-local files, but the repository also contains an MCP server and older runtime/app surfaces. These may be valid future or experimental layers, but the boundary is not obvious enough.

Why it matters:

Users may ask whether Navi is a skill, plugin, MCP server, app, or background agent. The answer should be explicit:

```text
Current V1: skill/plugin behavior with project-local docs
Experimental or later layers: MCP, runtime, app surface, background presence
```

Recommended fix:

- Add an architecture boundary section to root docs.
- Label MCP/runtime surfaces as experimental, historical, or future-facing if they are not the current recommended path.
- Avoid implying background autonomy or always-on supervision.

### 5. Web UI Future-Surface Debt

Status: open
Priority: medium, separate from alpha release prep

Problem:

The repository contains `src/web` Shared Desk code from earlier Along product-expression work. It may be useful evidence for a future Navi or Along local interface, but it is not the current Navi alpha surface.

Why it matters:

If the web UI is casually rebranded as Navi, external readers may think `0.1.0-alpha` includes a runtime UI or local app. That would conflict with the current alpha boundary and weaken the install story, which is currently skill/plugin behavior plus project-local docs.

Recommended fix:

- Keep the root README clear that runtime UI and local app surfaces are later layers.
- Do not include Web UI screenshots, launch instructions, or rebrand language in alpha release notes unless a focused UI exploration is approved.
- If the UI direction is reopened, start a dedicated design/prototype branch such as `explore/navi-web-ui-surface`.
- Define the product question first: Navi map review surface, project supervision console, Along companion desk, or separate local app.
- Require visual and behavioral validation before treating the UI as a shipped Navi capability.

### 6. Validation Debt

Status: open
Priority: medium

Problem:

`npm run verify:plugin-package` verifies package consistency, manifest validity, and documentation expectations. It does not prove real fresh-session product behavior.

Why it matters:

The biggest Navi issues found so far came from real fresh-session calibration, not unit tests. Tests passing should not be treated as product proof.

Recommended fix:

- Keep package tests.
- Add a durable validation log for fresh-session calibration results.
- Track target project, prompt, expected behavior, result, failure reason, and fix decision.

### 7. Target Project Cleanup Debt

Status: open
Priority: low-medium

Problem:

Some external target projects used for validation may contain uncommitted Navi initialization files, such as project-local `AGENTS.md` and `docs/along/project-maps/` records.

Why it matters:

Those files are useful for validation, but each target project needs a decision: keep and commit them, keep them local, or remove them after calibration.

Recommended fix:

- For each target project, decide whether Navi supervision should remain installed.
- Commit only when the project owner wants Navi behavior in that project.
- Do not treat validation leftovers as part of Along itself.

## Suggested Order

1. Make public naming Navi-first while preserving legacy ids.
2. Update the root README product narrative.
3. Clarify the current architecture boundary.
4. Improve the project initialization guide.
5. Keep Web UI future-surface work out of alpha release prep unless explicitly approved.
6. Add a fresh-session validation log.
7. Clean up or commit target-project Navi initialization files case by case.
