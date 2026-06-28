# Navi Stable Project Progress Bar Design

Date: 2026-06-28
Status: Approved design for user review

## Summary

Navi Progress Map needs a stable progress bar for the user's current project. The current behavior can generate a different horizontal bar each time because the docs require a stage bar when stages can be inferred, but they do not define how the project-level stage sequence should stay stable across repeated maps.

This design fixes the product expression: Navi should use one stable overall progress bar for the target project being supervised, and a separate current-stage sub-progress bar when the active stage has local work such as concerns, fixes, retests, or submission.

The Navi project itself is only the current test case for this design. In real use, the target project may be a user's software build, research workflow, application process, design project, analysis, or another expert-agent task.

## Problem

Non-expert users use the Progress Map to regain orientation. If the stage names change every time, the map feels improvised and the user cannot build a stable mental model of where their project is.

Some local work genuinely changes inside a phase. For example, during fresh-session validation, a concern may appear, leading to a small cycle of checklist repair, test assertion, retest, and commit. That local cycle should not rewrite the target project's overall progress bar.

## Design

Use a two-level progress structure.

### Overall Target Project Progress

The overall bar is stable for the target project:

```text
项目总体进度
[阶段 1] -> [阶段 2] -> [阶段 3] -> [阶段 4] -> [阶段 5]
                         ^
                      当前阶段
```

Purpose:

- show where the user's current project is overall;
- preserve a stable user-facing mental model;
- avoid mixing the target project with Navi's own implementation work;
- avoid changing stage names for temporary concerns or local fixes.

The stage labels should be derived from the project context, active Working Thread, project plan, or recent accepted map. Once established, they should remain stable until the project direction changes enough to require a new map and the user accepts that change.

### Current-Stage Sub-Progress

When the active overall stage has meaningful local steps, add a second bar:

```text
当前阶段子进度
[发现问题] -> [修正规则/清单] -> [复测] -> [提交/记录] -> [进入下一阶段]
                              ^
                           当前小步
```

The sub-progress bar is allowed to change because it describes work inside the current stage. It should use plain-language stage names that a non-expert user can understand.

If there are no meaningful local steps, omit the sub-progress bar and explain the current stage in prose.

## Example: Current Test Project

```text
项目总体进度（当前测试项目：Navi）
[问题定义] -> [行为设计] -> [文档写入] -> [新会话验证] -> [真实使用校准] -> [稳定产品行为]
                                              ^
                                           当前阶段

当前阶段子进度
[发现 checklist 缺口] -> [补 README] -> [补测试断言] -> [复测通过] -> [提交完成]
                                                                            ^
                                                                         当前小步
```

Explanation:

```text
总体位置：
当前测试项目 Navi 已经完成问题定义、行为设计和文档写入，现在处在新会话验证阶段。

当前阶段内部：
我们发现 fresh-session checklist 漏掉两个关键 prompt，已经补 README、补测试断言、复测并提交。这个小修复完成后，下一步应回到新会话验证，看这次是否不再出现 concern。
```

## Rules

- Do not generate a new overall progress bar every time.
- Do not hardcode Navi's own stages when the user is asking about a different target project.
- Do not include Along project stages unless Along itself is the target project being discussed.
- Use the stable target-project overall bar for progress and next-step orientation questions.
- Keep local concerns, fixes, retests, and follow-up tasks inside the current-stage sub-progress bar.
- The overall bar answers: where is the target project?
- The sub-progress bar answers: what is happening inside the current target-project stage?
- Every marked current position must be followed by a plain-language explanation of what that stage is doing.
- Do not use internal labels alone without translating what they mean for the user's goal.
- If no stable project-level stage sequence exists yet, Navi should say that it needs the project record, active plan, or user confirmation before drawing a reliable overall bar.

## Non-Goals

- This design does not add a graphical UI.
- This design does not define one universal stage sequence for all user projects.
- This design does not change Working Thread schema.
- This design does not add runtime, MCP, background behavior, or visual rendering.
- This design does not prove Navi product feeling; it only stabilizes the map structure to validate.

## Success Criteria

The design is successful if a non-expert user can see:

- the same target-project stage sequence across repeated Progress Maps;
- the current overall stage;
- any local work happening inside that stage;
- why local concerns do not change the overall project position;
- what must happen before the project moves to the next overall stage.

It is not successful if:

- each answer invents a new overall progress bar;
- temporary concerns become new overall stages;
- Navi implementation stages are shown for an unrelated user project;
- the bar shows labels without explaining what the current stage means.
