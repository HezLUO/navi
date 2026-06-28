# Navi Current Test Project Map

project_name: Navi current test project
map_status: confirmed
source: user-confirmed current Navi test project map
current_overall_stage: 真实使用校准

## overall_stages

```text
[问题定义] -> [行为设计] -> [文档写入] -> [新会话验证] -> [真实使用校准] -> [稳定产品行为]
```

Do not rename, remove, merge, split, or reorder `overall_stages` without explicit user confirmation.

## current_overall_stage

真实使用校准

## current_stage_explanation

Navi's current test project is no longer defining the basic behavior or merely writing docs. It is validating whether real fresh Codex sessions reliably produce a stable, understandable Progress Map for non-expert users.

## sub_progress

local concerns, fixes, retests, pushes, and fresh-session checks must stay in `sub_progress`; they must not become new overall project stages.

Recent local sub-progress:

```text
[发现总体地图漂移] -> [记录 confirmed Project Map] -> [复测] -> [push] -> [继续真实校准]
                              ^
                           当前小步
```

## visible_evidence

- Navi Progress Map design, stable progress bar design, graphical progress bar design, and implementation guidance are committed.
- The package skill, canonical skill, and README are verified through `npm run verify:plugin-package`.
- Fresh-session calibration found and fixed the single-line horizontal strip gap.

## missing_or_risk

The main risk is treating documentation and fixture tests as product proof. Real-use calibration must continue, especially for repeated progress questions where the overall map should remain unchanged.

## next_gate

Run additional fresh-session calibration prompts and verify that the same `overall_stages` are reused until the user confirms a map change.

## user_confirmation_needed

The user must confirm any proposed change to the six overall stages above before Navi changes the project-level progress bar.
