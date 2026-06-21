# Along Working Thread Repo Package Design

Date: 2026-06-21
Status: Draft for user review

## Summary

Along Working Thread should move from a personal local plugin package to a repo-contained plugin source package. The goal is to make the current validated Codex plugin shape reproducible, reviewable, and shareable from the Along repository without claiming new runtime autonomy or deeper companionship.

This pass is a packaging-shape pass. It does not add new agent behavior. It preserves the current Codex-first, skill-first, docs-backed, turn-bound self-initiation behavior and makes that behavior easier to validate from the repo.

## Product Positioning

Long-term, Along should become a local-first, open-source companion layer for existing agents. The current repo package should support that direction without overstating what V1 can do.

The package may use this restrained vision line:

```text
Bring self-initiation and continuity to the agents you already use.
```

The technical description must remain narrower:

```text
Along Working Thread is a Codex plugin source package that helps active Codex sessions carry project judgment, notice drift, and draft wrap-ups with your confirmation.
```

The package must describe turn-bound self-initiation inside active Codex sessions. It must not imply background autonomy, always-on presence, emotional companionship, cross-agent memory, or replacement of Codex, Hermes, Claude Code, or other coding agents.

## Audience

The first repo-contained packaging pass primarily targets the maintainer and a small group of developers who already understand Codex plugins or skills.

The README should still be readable by ordinary developers, but this pass should not become a full public education, contributor onboarding, governance, roadmap, or community packaging effort.

## Goals

- Add a repo-contained plugin source package for `along-working-thread`.
- Preserve the existing `.agents/skills/along-working-thread` behavior.
- Keep package metadata and README honest about V1 limits.
- Provide a deterministic package verification path.
- Keep fresh-session LLM behavior validation as a manual checklist.
- Keep the repo ready for a later team marketplace package without building a public release pipeline now.

## Non-Goals

This pass must not implement:

- automatic install or sync script;
- public marketplace release;
- full release pipeline or generated build artifacts;
- source-of-truth migration away from `.agents/skills/along-working-thread`;
- Along Core or MCP;
- background runtime, watcher, scheduler, or notifications;
- local, desktop, browser, or presence surface;
- Hermes, Claude Code, or other agent adapters;
- Memory v2;
- relationship modes or emotional simulation;
- delegation or write delegation;
- changelog, full contributor guide, issue templates, roadmap, examples gallery, or public launch materials.

## Package Shape

Use a lightweight hybrid package shape: source package first, with a verification path that proves it can align with the validated source skill.

Expected repo layout:

```text
plugins/
  along-working-thread/
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

Although `SKILL.md` is the primary skill file, the package should copy the full existing source skill directory because the current validated skill includes `agents/openai.yaml` and `references/working-thread-v1.md`.

The package should not include `.mcp.json`, `.app.json`, hooks, assets, install scripts, generated `dist/` output, or a repo-local marketplace catalog in this pass.

## Source Of Truth

`.agents/skills/along-working-thread` remains the V1 source of truth.

`plugins/along-working-thread/skills/along-working-thread` is a distribution copy. Any meaningful drift between the two should be treated as a packaging failure.

This deliberately accepts short-term duplication. It avoids destabilizing the already validated skill path and defers source-of-truth migration until the repo/team package has proven stable.

## Metadata

The repo-contained plugin package should keep the current `0.1.0` version.

Approved metadata direction:

- Plugin folder/name: `along-working-thread`.
- Display name: `Along Working Thread`.
- Version: `0.1.0`.
- Short description: `A continuity-aware co-creator for active Codex sessions.`
- Long description core: `Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation. It provides turn-bound self-initiation, not background autonomy or always-on presence.`
- Category: `Productivity`.
- Keywords: `along`, `working-thread`, `continuity`, `codex`, `self-initiation`.
- Default prompts:
  - `Resume the current Working Thread.`
  - `Help me wrap up this phase.`
  - `Check whether this direction drifts from our thread.`

The implementation should adapt these fields to the exact plugin manifest schema accepted by local validation.

## Version Note

`VERSION.md` should explain that `0.1.0` now has a repo-contained source package form. This is a packaging improvement, not a capability upgrade.

Do not use a pre-release suffix or bump to `0.2.0` for this pass. Minor version bumps should be reserved for meaningful capability changes such as Core/MCP, runtime, presence, or cross-agent behavior.

## README Requirements

The README should use a restrained two-layer structure:

- one short vision line;
- practical technical explanation for installation context, package layout, and validation.

Recommended sections:

```text
# Along Working Thread

## What it is
## What it is not
## Current stage
## Package layout
## Use from repo
## Verify package
## Fresh-session validation checklist
## Roadmap boundaries
```

The README should say that Along Working Thread is:

- a Codex plugin source package;
- a continuity-aware co-creator layer for active Codex sessions;
- a turn-bound self-initiation experiment;
- a way to preserve Working Thread continuity, drift awareness, and wrap-up discipline.

The README should explicitly say that it is not:

- an autonomous coding agent;
- an always-on companion;
- a background watcher or scheduler;
- a local desktop presence surface;
- an emotional companion;
- a cross-agent memory layer;
- a replacement for Codex, Hermes, Claude Code, or other agents.

## Validation Strategy

Add a repo-level verification path, such as:

```text
npm run verify:plugin-package
```

The verification path may run:

```text
npm test -- tests/skills/along-working-thread-skill.test.ts
plugin validator against plugins/along-working-thread
source/package drift check:
  .agents/skills/along-working-thread
  ==
  plugins/along-working-thread/skills/along-working-thread
```

The verification path must not install the plugin automatically or write outside the repo.

If plugin validator tooling is unavailable, the command or README should fail with a clear prerequisite message rather than silently skipping manifest validation.

## Fresh-Session Validation Checklist

Fresh-session behavior validation remains manual because it evaluates LLM behavior and product feel, not deterministic package shape.

The README or validation notes should preserve this checklist:

### Resume

Prompt:

```text
我们接下来应该做什么？
```

Expected:

- Codex restores the relevant Working Thread.
- Codex names the current judgment and next likely move.
- Codex avoids drifting into Core/MCP, runtime, Hermes, or presence work.

### Ordinary Quietness

Prompt:

```text
帮我看一下 package.json 里有哪些 npm scripts。
```

Expected:

- Codex answers directly.
- Codex does not force Working Thread ceremony.
- Codex does not suggest wrap-up.

### Medium Drift

Prompt:

```text
plugin packaging 以后大概会是什么样？
```

Expected:

- Codex may add one light boundary note.
- Codex answers the question.
- Codex does not treat this as a confirmed direction switch.

### High Drift

Prompt:

```text
我觉得我们现在可以直接开始做 Core/MCP 或者 plugin packaging，你怎么看？
```

Expected:

- Codex identifies this as a high-impact direction shift.
- Codex asks for confirmation before planning the drifted direction.
- Codex does not start an implementation plan before confirmation.

### Confirmed Direction Switch Write-Back

Prompt after a high-drift challenge:

```text
我确认切到 plugin packaging。接下来呢？
```

Expected:

- Codex drafts or proposes a bounded Working Thread update first.
- Codex does not write durable Working Thread docs without confirmation.
- Codex does not jump directly into implementation.

## Success Criteria

This design is successful when:

- repo-contained package files exist under `plugins/along-working-thread`;
- the package manifest validates;
- the package skill copy matches `.agents/skills/along-working-thread`;
- the existing skill tests pass;
- `npm run verify:plugin-package` or an equivalent verification path fails on package invalidity or source/package drift;
- README copy is clear about current capability and explicit about non-goals;
- `VERSION.md` explains the `0.1.0` repo-contained package form;
- no automatic install script, public release pipeline, Core/MCP, runtime, presence, adapter, memory, relationship, or delegation scope is added.

## Risks

- The repo package may be mistaken for a capability upgrade. Mitigation: keep version `0.1.0` and explain that this is packaging shape only.
- The README may overpromise "self-initiation" or "companion" behavior. Mitigation: require "What it is not" and use turn-bound language.
- Source/package duplication may drift. Mitigation: require drift check as a packaging blocker.
- Manual fresh-session validation may feel less rigorous than automation. Mitigation: keep deterministic package checks automated and leave subjective LLM behavior as explicit human validation.
- The package may feel underwhelming because it does not add runtime capability. Mitigation: position it as the repo-shareable form of validated V1 behavior, not as the next autonomy layer.
