# Navi Rhythm Map Design

## Purpose

Navi currently handles stable, one-way project progress with a compact horizontal progress strip. Real calibration with `intern` and `mp_ph_aplication` showed a different project shape: some supervised projects do not have one overall completion path. They move through recurring cycles, parallel opportunities, waiting states, and user decision gates.

This design adds a **Rhythm Map** behavior for flowing projects. It preserves Navi's promise to help non-expert users understand, supervise, and steer expert agents without forcing misleading one-way progress bars.

## Problem

For projects such as internship applications or Hong Kong MPhil/PhD applications, a fixed overall progress bar can be misleading:

- job pools or supervisor pools refresh weekly;
- interview, coding, or application preparation happens daily;
- multiple opportunities run in parallel;
- external feedback controls next actions;
- work often returns to screening, waiting, follow-up, and decision states.

In these cases, Navi should not imply that the whole project is simply moving from "start" to "done". It should show the current rhythm, active focus, waiting states, and user confirmation gate.

## Project Shape Selection

Navi should first identify the layer the user is asking about:

```text
Whole long-running project? -> classify project shape
Specific subtask?           -> classify subtask shape
```

Use a **linear progress strip** when the work is a one-time delivery or a bounded subtask:

```text
[需求] -> [设计] -> [执行] -> [验证] -> [交付]
```

Use a **Rhythm Map** when the work is a flowing long-running project with signals such as:

- recurring daily, weekly, or periodic actions;
- multiple parallel opportunities, routes, targets, or stakeholders;
- external feedback that controls the next step;
- repeated loops of refresh, screen, prepare, wait, follow up, and decide;
- a goal of ongoing stewardship rather than one fixed deliverable.

If uncertain, Navi should mark the map as provisional instead of presenting a confident stable map:

```text
临时判断，待你确认后才会作为稳定项目地图。
```

## Rhythm Map Structure

A Rhythm Map has two layers:

```text
项目节奏
[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]
                                      ▲
                                   当前焦点

当前主线
[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]
                         ▲
                      当前动作
```

The upper layer answers: what repeating rhythm is this long-running project currently in?

The lower layer answers: what specific track or action is active in this conversation?

This map does not express completion percentage. It expresses:

- the current cycle;
- the current focus;
- what is waiting on outside evidence;
- what the user must confirm;
- where continuing will lead.

## Example: Internship Project

For `intern`, the project is flowing because it combines weekly job-pool refresh, daily interview preparation, active application waiting, and evidence-driven status updates.

```text
项目节奏
[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]
                                      ▲
                                   当前焦点

当前主线
[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]
                     ▲
                  当前动作
```

Navi should then explain in plain language:

- today is not about "finishing the project";
- the next useful move is a small daily loop;
- status changes require evidence such as email, portal state, or screenshots;
- material customization should wait until a specific target job is selected.

## Example: Hong Kong Application Project

For `mp_ph_aplication`, the overall project is flowing because supervisor screening, direction planning, materials, forms, and follow-ups continue in parallel.

```text
项目节奏
[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]
                                ▲
                             当前焦点

当前主线
[HKUST 表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]
                       ▲
                    当前动作
```

The overall project uses a Rhythm Map, but a bounded subtask such as `HKUST CSE Early 表单填报` can still use a linear subtask strip:

```text
[预检] -> [填表] -> [附件核对] -> [最终确认] -> [提交后记录]
```

## Trigger Rules

Navi should use a Progress Map or Rhythm Map when the user needs supervisory orientation, including:

- `接下来我们应该做什么？`
- `现在做到哪了？我看不懂。`
- `继续吧。` when the next action, boundary, or acceptance point is unclear;
- `这个方案可以吗？我不懂技术。`
- `这个结果算完成了吗？`
- `我们是不是该换方向？`

Navi should stay quiet and answer directly when the user gives a clear small task, such as checking one tracker row, editing one paragraph, or opening one known file.

## Output Requirements

A valid Rhythm Map response must include:

- a compact rhythm strip;
- a compact active-track or current-action strip when useful;
- a plain-language explanation of the current focus;
- what has changed or stayed stable;
- the recommended next small loop;
- what the user must confirm;
- any main risk, especially if the agent may otherwise over-execute or update status without evidence.

The answer should not use internal labels alone. If it says `每日准备`, it should explain what that means for the user's actual goal.

## Error Handling And Downgrade Behavior

If no reliable project records exist, Navi should not draw a confident map. It should say what source is needed:

```text
我现在还没有可靠的项目地图。为了避免误导，我需要先看项目记录、当前计划或最近确认的目标，然后再画进度条。
```

If the project is mixed, Navi should pick the narrowest useful map:

- whole long-running project: Rhythm Map;
- bounded subtask: linear subtask strip;
- unclear scope: provisional map plus a confirmation question.

If the user has already confirmed the next action and the purpose, boundary, and acceptance point are clear, Navi can continue without re-rendering a map.

## Testing And Validation

Fixture-style documentation tests should cover:

- flowing projects do not force a one-way overall progress strip;
- `intern`-style prompts produce a Rhythm Map with weekly, daily, waiting, and decision loops;
- `mp_ph_aplication`-style prompts produce a Rhythm Map for the whole project but a linear strip for bounded form-filling subtasks;
- `接下来我们应该做什么？` triggers supervisory orientation when the project is long-running and ambiguous;
- clear small execution requests do not trigger a map;
- provisional language appears when the stage sequence or rhythm is inferred rather than confirmed.

Fresh-session calibration should verify that Navi does not reuse Navi's own test-project map for unrelated flowing projects.

## Non-Goals

This design does not add runtime state, background memory, MCP behavior, UI components, or bitmap progress graphics. It only defines chat behavior and documentation-test expectations for Navi's map selection.
