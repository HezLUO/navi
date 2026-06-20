# Along Working Thread Plugin Packaging Design

Date: 2026-06-20
Status: Draft for user review

## Summary

Along Working Thread should be packaged as a minimal personal local Codex plugin. The goal is to turn the already validated repo-scoped skill into an installable, reusable capability without expanding Along into a new runtime, MCP server, desktop presence layer, or cross-agent platform.

This pass is a packaging and validation step. It preserves the current skill-first behavior and tests whether the Along Working Thread experience still works after installation through the Codex plugin path.

## Product Positioning

The plugin should use layered positioning:

- User-facing promise: Continuity-Aware Co-Creator.
- Technical boundary: Turn-Bound Self-Initiation.
- Functional description: Working Thread Continuity.

The plugin may sound like a co-creator in display copy, but it must explain that self-initiation happens inside active Codex sessions. It must not imply background autonomy, always-on presence, local desktop presence, or autonomous task execution.

One-line product description:

```text
Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation.
```

## Goals

- Package the existing `along-working-thread` skill as a personal local Codex plugin.
- Preserve the currently validated Working Thread behavior.
- Make the capability installable, discoverable, and reviewable through plugin metadata.
- Keep plugin copy honest about current limits.
- Establish a staged path toward repo/team marketplace packaging after personal plugin validation.

## Non-Goals

This pass must not implement:

- Along Core or MCP server.
- `.app.json` app integration.
- hooks.
- background runtime, watcher, scheduler, or notifications.
- local/desktop/browser presence surface.
- Hermes, Claude Code, or other agent adapters.
- Memory v2.
- relationship modes or emotional simulation.
- delegation or write delegation.
- icon, logo, or screenshot polish unless required by validation.
- source-of-truth migration from repo skill to plugin skill.

## Plugin Shape

The first plugin package should use this shape:

```text
along-working-thread/
  .codex-plugin/
    plugin.json
  README.md
  skills/
    along-working-thread/
      SKILL.md
      references/
        working-thread-v1.md
```

The package should not include `.mcp.json`, `.app.json`, hooks, scripts, or assets in V1 unless the plugin validator requires a minimal file.

## Metadata

Approved metadata direction:

- Plugin folder/name: `along-working-thread`.
- Display name: `Along Working Thread`.
- Short description: `A continuity-aware co-creator for active Codex sessions.`
- Long description core: `Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation. It provides turn-bound self-initiation, not background autonomy or always-on presence.`
- Category: `Productivity`.
- Keywords: `along`, `working-thread`, `continuity`, `codex`, `self-initiation`.
- Default prompts:
  - `Resume the current Working Thread.`
  - `Help me wrap up this phase.`
  - `Check whether this direction drifts from our thread.`

The implementation should adapt these fields to the exact plugin manifest schema accepted by local validation.

## Source Strategy

V1 packaging is a distribution copy, not a source-of-truth migration.

The implementation should:

- keep `.agents/skills/along-working-thread/` in place;
- copy the same skill content into the plugin package;
- avoid changing already validated repo-scoped behavior;
- include a validation or review step that detects meaningful drift between the repo skill and packaged skill;
- defer source-of-truth consolidation until after personal plugin validation passes.

This intentionally accepts short-term duplication. The risk of destabilizing the validated repo skill is higher than the cost of a temporary copied package.

## Installation Target

The first implementation should target a personal local plugin, not a repo/team marketplace plugin.

Expected destination:

```text
~/plugins/along-working-thread/
~/.agents/plugins/marketplace.json
```

The personal marketplace entry should use local plugin source metadata and should not require a team/repo marketplace setup. A later pass may add a repo-local marketplace version after install and behavior validation.

## README Requirements

The plugin README should explain:

- what Along Working Thread does;
- when Codex should use it;
- what Working Threads are;
- how turn-bound self-initiation differs from background autonomy;
- what the plugin does not do;
- how to validate resume, quietness, drift, and wrap-up behavior;
- that personal local packaging is stage one;
- that repo/team marketplace, MCP, presence, runtime, Memory v2, relationship modes, and adapters are deferred.

The README should be practical and restrained. It should not market the plugin as a living companion, autonomous agent, or background assistant.

## Success Criteria

Minimal plugin packaging is successful only if it proves more than file rearrangement:

- Installability: the personal local plugin installs, appears in the local marketplace flow, and passes manifest validation.
- Skill discovery: Codex can discover the packaged `along-working-thread` skill in Along-relevant sessions.
- Behavior preservation: packaged behavior still passes resume, ordinary quietness, medium drift, high drift confirmation, and confirmed-switch write-back checks.
- Honest positioning: metadata and docs promise continuity-aware co-creation, turn-bound self-initiation, and Working Thread continuity without implying background autonomy or always-on presence.
- Staged path: README describes personal local plugin as stage one and defers repo/team marketplace, MCP, presence, runtime, Memory v2, relationship modes, and adapters.

## Validation Scenarios

After packaging, repeat the same real-session checks used for skill behavior validation.

### Resume

Prompt:

```text
我们接下来应该做什么？
```

Expected:

- Codex restores the relevant Working Thread.
- Codex names the current judgment and next likely move.
- Codex stays concise.

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
我确认切到 plugin packaging，但先不要实现。请先告诉我你会如何更新 Working Thread。
```

Expected:

- Codex drafts a bounded Working Thread update.
- Codex does not write the update without confirmation.
- Codex does not start implementation.

## Risks

- Packaging may be mistaken for deeper autonomy. Mitigation: explicit metadata and README boundaries.
- Copying the skill may create drift between repo and plugin versions. Mitigation: add drift check in implementation plan and review.
- Personal plugin install behavior may differ from repo-scoped skill behavior. Mitigation: repeat subjective real-session validation after installation.
- The plugin may feel underwhelming because it does not add runtime capability. Mitigation: position it as distribution of validated behavior, not a new capability layer.

## Future Directions

Deferred capabilities remain valid future layers:

- Repo/team marketplace packaging.
- Along Core / MCP operations for shared Working Thread state.
- Hermes, Claude Code, or other agent adapters.
- Runtime/autonomy layer for background self-initiation.
- Local/desktop/browser presence surface.
- Memory v2 and relationship memory.
- Relationship modes, tone preferences, and emotional simulation modes.

These should not be pulled into this packaging pass.
