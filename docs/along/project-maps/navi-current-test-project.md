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
[两层地图修复] -> [安装态同步] -> [self-test 复测] -> [跨项目复测] -> [记录结果] -> [自然 prompt 校准]
                                                                                         ^
                                                                                      当前小步
```

This sub-progress is a calibration/debugging record for Navi's own test project. It is not a user-facing product roadmap; future user projects should define their own target-project stages and use this record only as an example of stable-map behavior.

## visible_evidence

- Navi Progress Map design, stable progress bar design, graphical progress bar design, and implementation guidance are committed.
- The package skill, canonical skill, and README are verified through `npm run verify:plugin-package`.
- Fresh-session calibration found and fixed the single-line horizontal strip gap.
- 2026-06-29 fresh-session calibration verified the two-layer map rule in the Navi current test project: orientation prompts produced the stable overall map before current-stage internal progress, while an explicitly local task question used local-only progress.
- The two-layer map rule was synced to the personal plugin source and Codex plugin cache, then pushed to `origin/main` at `7beb487`.
- 2026-06-29 cross-project calibration produced positive signals in `mp_ph_aplication` and `sub_ag_ski`: `mp_ph_aplication` used a Rhythm Map for a flowing application project and did not mark unsubmitted applications as done; `sub_ag_ski` reused its target-project map and identified open-source release preparation as the current stage.

## missing_or_risk

The main risk is treating documentation, fixture tests, Navi's self-test project, or lightly guided validation prompts as product proof. Real-use calibration must continue with more natural ordinary prompts in non-Navi target projects, especially for repeated progress questions where the target-project map should remain stable and for flowing projects where a Rhythm Map is more appropriate than a one-way completion bar.

## next_gate

Run a stricter cross-project fresh-session calibration pass with less validation framing and more natural ordinary prompts, while still preventing source-thread contamination. Verify whether `mp_ph_aplication`, `sub_ag_ski`, and another non-Navi project trigger the right target-project map without relying on Navi-specific context.

## user_confirmation_needed

The user must confirm any proposed change to the six overall stages above before Navi changes the project-level progress bar.
