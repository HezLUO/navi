# Navi Graphical Progress Bar Design

Date: 2026-06-28
Status: Approved design for user review

## Summary

Navi needs a more visual progress expression for non-expert users, but the first step should not be a decorative image or a one-off chart. The first version should define a stable `Project Map` data model and a consistent horizontal chat rendering. Future graphical UI can render from the same model.

The product goal is to help users understand where their supervised project stands, what the current position means, what remains uncertain, and what they need to confirm before moving on.

## Core Decision

Use a data-model-first approach:

1. define a stable `Project Map`;
2. render that map as a compact horizontal progress strip in chat;
3. later render the same map as a richer graphical UI or image component.

This prevents Navi from inventing a different overall progress bar on each response.

## Project Map Model

Navi's progress bar should be generated from a stable project map, not improvised from the latest message alone.

```text
Project Map
- project_name: the user's current supervised project
- map_status: confirmed | provisional
- overall_stages: stable target-project stages
- current_overall_stage: the active overall stage
- current_stage_explanation: what the current stage means in plain language
- sub_progress: optional local steps inside the current stage
- visible_evidence: completed work the user can verify
- missing_or_risk: current gap, uncertainty, or main risk
- next_gate: acceptance point before moving to the next stage
- user_confirmation_needed: what the user needs to confirm now
- source: where this map came from
```

The overall progress bar describes the target project, not Navi's own internal answering process.

Local concerns, document fixes, retests, validation loops, or calibration tasks belong in `sub_progress`. They must not rewrite the stable `overall_stages`.

## Source Priority

When building the `Project Map`, Navi should use this priority order:

1. the project map the user just confirmed;
2. the active Working Thread or project record;
3. an approved plan or spec;
4. the most recent Navi map that the user did not reject;
5. a provisional inferred map, clearly marked as awaiting confirmation.

If sources conflict, the more recently confirmed user-facing project map wins over older inferred state.

If no reliable project-level stage sequence exists, Navi should not draw a confident stable bar. It should explain which source is needed, such as the project record, active plan, or user confirmation.

## Horizontal Chat Rendering

The first graphical form is a compact horizontal strip that can render safely in normal chat:

```text
项目总体进度
[需求澄清] -> [方案比较] -> [原型设计] -> [可行性验证] -> [交付准备]
                ▲
              当前位置
```

If the current overall stage has meaningful local work, add a second strip:

```text
当前阶段内部
[列出方案] -> [比较风险] -> [确认推荐] -> [进入原型]
                ▲
              当前位置
```

Every current position must be followed by a plain-language explanation. The strip answers "where am I"; the explanation answers "what does this position mean?"

Example:

```text
当前位置：
你现在站在“方案比较”阶段。意思是：我们正在判断这个方案是否值得继续投入，而不是默认它已经正确。

当前要确认：
这个方案有没有清楚说明收益、风险、替代方案和验收标准。
```

## Trigger Rules

Navi should show the horizontal progress strip when the user needs supervisory orientation, especially for prompts like:

```text
现在做到哪了？
我看不懂。
接下来做什么？
接下来我们应该做什么？
还差什么？
这个方案可以吗？我不懂技术。
```

For `继续吧`, Navi should continue directly when the previous context clearly established the next action, purpose, boundary, and acceptance point. If that context is missing or stale, Navi should first provide a short map before continuing.

Navi should not show a progress strip for ordinary clear task commands, such as running a test, editing a specific file, explaining a function, or submitting an already-confirmed change.

## Degraded State

When Navi cannot reliably determine the project map, it should avoid a confident bar and say something like:

```text
我现在还没有可靠的项目地图。为了避免误导，我需要先看项目记录、当前计划或最近确认的目标，然后再画进度条。
```

It may provide a provisional map only if clearly labeled:

```text
临时判断，待你确认后才会作为稳定项目地图。
```

Accuracy is more important than immediate visual confidence.

## Future Graphical UI

A later UI can render the same `Project Map` as a more polished graphical progress component:

- compact horizontal stage strip;
- active stage marker;
- optional nested sub-progress;
- risk or confidence indicator;
- acceptance gate before the next stage;
- source label showing whether the map is confirmed or provisional.

The future UI should not introduce a separate progress logic. It should be a presentation layer over the same stable model.

## Non-Goals

- Do not build the graphical UI in this design step.
- Do not add runtime, MCP behavior, or background state storage.
- Do not define one universal stage sequence for every user project.
- Do not replace domain expertise or professional review.
- Do not make every Navi response include a progress bar.

## Success Criteria

This design is successful if:

- repeated progress questions produce the same overall project stages unless the user confirms a map change;
- non-expert users can see the current position and understand what that position means;
- temporary concerns appear as sub-progress, not as new overall project phases;
- Navi can explain what source the map came from;
- Navi refuses to draw a confident stable bar when it lacks a reliable project map.

It is not successful if:

- Navi changes the overall bar every time;
- the bar contains labels without plain-language explanation;
- visual polish hides weak or provisional project understanding;
- Navi hardcodes Navi-specific stages for unrelated user projects.
