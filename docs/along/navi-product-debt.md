# Navi Product Debt Register

Last updated: 2026-07-03

This document tracks known debt that should be handled before Navi is treated as a clear public product surface.

## Current Naming Decision

Use **Navi** as the public product and plugin display name.

Use **Navi as an independent product surface**. Along is the parent project or lab context, not a prerequisite concept for understanding Navi. Navi may remain part of Along's broader product family, but external readers should be able to understand, install, and evaluate Navi without first learning Along.

Use **Progress Map** as the name of Navi's current V1 output format, not as the whole product name. Progress Map is the clearest current wedge because users can immediately see it when they ask what is happening, what comes next, or whether a plan is trustworthy. It is not the entire long-term selling point.

Recommended naming model:

```text
Navi = public product name
Progress Map = core V1 map output
Rhythm Map = Progress Map variant for flowing long-running projects
Challenge Layer = risk-escalation behavior inside Navi
Working Thread = internal continuity mechanism
Along = parent project or lab context, not the user-facing prerequisite
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

Some docs have compressed Navi into Progress Map plus Challenge Layer, while others still imply that the reader must understand Along first. The intended hierarchy is broader and Navi-first: Navi is an independent product surface for non-expert supervision of expert agents. Progress/Rhythm Maps and Challenge Layer are current V1 alpha mechanisms, Working Thread is the internal continuity substrate, and Along remains the parent/lab context or broader long-term product family.

Why it matters:

The repository currently tells two different stories. A new reader may not know whether the project is a companion app, a Codex skill, a plugin package, an MCP server, or Navi.

Recommended fix:

- Keep the root README and package docs aligned on the current product hierarchy.
- Make Navi the public entrypoint without reducing Navi to Progress/Rhythm Maps and Challenge Layer.
- Explain Along as origin, parent/lab context, or broader family, not as prerequisite user knowledge.
- Move older companion/runtime ideas into roadmap or historical context.
- Add a short compatibility note for `along-working-thread` as a legacy/internal id.

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

### 8. Continuation Friction And Pause Reason Debt

Status: open
Priority: medium-high for supervision calibration

Problem:

Users may need to repeatedly type `continue` or `继续` to make Codex keep executing. From the user's perspective, it is often unclear why Codex stopped, whether the stop was necessary, and whether continuing is safe or just restarting another validation loop.

Observed scenario:

The user may reasonably feel that many pauses do not need approval. If the only useful response is `continue`, the pause is probably not serving the user. The right stop point should be a real decision point: permission to write, commit, push, release, change phase, spend meaningful verification budget, touch another project, or choose between materially different directions.

Calibration seed:

After the continuation-friction issue was already written into the docs and a lightweight `git diff --check` had passed, the user still had to type `continue` to make the session keep moving. This is an example of avoidable pause friction: no new user judgment was needed to continue the same design-recording task, and the next useful action was simply to record the example as calibration evidence.

The same friction immediately repeated: after the first calibration seed was recorded and checked, the user again had to type `continue` and explicitly pointed out that the session should keep moving until the next real decision point. This strengthens the product signal: Navi should not stop merely because a local recording/checking step completed; it should stop when the user must decide whether to commit, push, change scope, spend more budget, or cross a mode boundary.

Another sharper variant appeared during alpha.5 worktree supervision. After a true worktree session had been created for implementation, the main session described itself as stopped at a real waiting point because review/merge depended on the worktree result. The user challenged this: review/merge was waiting, but the main session did not need to wait for unrelated design or supervision work. The correct distinction is lane-level waiting versus session-level waiting. Navi should not collapse "one workstream is blocked until a worktree returns" into "the whole user conversation should stop."

The friction repeated again after the main session committed the waiting-scope documentation change and notified the alpha.5 worktree. The user had to type `continue` only to point out that this stop was also meaningless. The useful next action was still inside the already-approved supervision loop: record the new example, or continue checking whether the worktree follow-up had completed. No new approval was needed merely because the previous response had reported a completed commit and notification.

The same pattern repeated once more after the completion-pause example itself was committed. The response reported the commit hash and current branch state, then stopped, leaving the user to type `continue` only to say that this was another meaningless continuation. This shows that "I committed the record" is not automatically a real stop point when the broader active loop still has non-conflicting follow-up work.

It repeated yet again after an additional completion-pause sample was written but not committed. The response treated "the docs now have modified files; should we commit?" as the next stop. Commit is normally a real boundary, but in this specific loop the user had already asked to keep recording meaningless `continue` samples until the next meaningful decision. Navi should be able to batch evidence collection instead of forcing a commit decision after every small observation.

Another variant appeared after `main` was pushed successfully. The response correctly reported the push result and that no release/tag had happened, but it did not offer the next decision. The user then had to type `continue` to explain that the missing next-step decision was the problem. This shows that a stop can still create friction even when the previous action was valid: if the agent stops, it should make the next decision visible, not leave the user to ask what the decision is.

Why it matters:

Repeated manual continuation creates friction and shifts supervisory burden back onto the user. A non-expert user may not know whether Codex paused because it needs approval, reached a safe stop point, hit a tool/runtime boundary, exceeded the current verification budget, or simply lost execution momentum.

Product judgment:

This is not primarily a user behavior problem. Repeated `continue` is a user adaptation to opaque stopping behavior. Navi should not teach users to micromanage every step; it should help Codex continue inside an already-approved boundary and stop only when there is a reason the user can actually judge.

This should be a Navi supervision capability, but not as "never stop" automation. Navi should help the user understand and control pauses:

- explain why Codex is stopping now;
- classify whether the pause is necessary, optional, or avoidable;
- state what would happen if the user says `continue`;
- identify whether continuing would cross a mode boundary such as design to implementation, implementation to release, or read-only to write;
- identify the scope of the wait: a specific lane, a review/merge path, or the whole session;
- offer a bounded continuation contract when safe, such as "continue through these three steps, then stop at this acceptance point";
- recommend stopping when another `continue` would only restart low-value validation or execution loops.

Recommended fix:

- Add "pause reason visibility" to future Navi supervision calibration.
- Collect real examples where the user had to repeatedly type `continue`.
- For each example, record whether there was a real decision, permission, risk, mode boundary, or verification-budget boundary.
- Treat "the user can only reply continue" as evidence of avoidable pause friction unless a platform, permission, or safety boundary explains the stop.
- Distinguish necessary pauses from avoidable friction.
- Distinguish lane-level blocked states from whole-session blocked states, especially when implementation runs in a worktree while the main session can continue design or supervision.
- Do not treat a completion report as a mandatory stop when the next useful action remains inside the same approved supervision loop and does not require commit, push, mode change, scope change, or risk acceptance.
- When the user explicitly asks to keep collecting pause-friction evidence, batch small doc observations and stop for a commit decision only when the batch is ready, the user switches tasks, or continuing would create review risk.
- When stopping after a completed action, provide the next meaningful decision options if the session is not otherwise closed.
- Consider adding a concise pause explanation to Navi output when Codex stops at a decision gate.
- Consider adding bounded continuation contracts to `navi init` guidance only after calibration shows the wording reduces friction without weakening user control.

## Suggested Order

1. Make public naming Navi-first while preserving legacy ids.
2. Update the root README product narrative.
3. Clarify the current architecture boundary.
4. Improve the project initialization guide.
5. Keep Web UI future-surface work out of alpha release prep unless explicitly approved.
6. Add a fresh-session validation log.
7. Clean up or commit target-project Navi initialization files case by case.
8. Calibrate continuation friction and pause reason visibility before adding stronger continuous-execution behavior.
