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
[自然 prompt 校准] -> [quietness 修复] -> [验证提交] -> [记录证据] -> [push/auth 恢复] -> [稳定性判断]
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
- 2026-06-29 stricter natural-prompt calibration produced stronger positive signals in `mp_ph_aplication`, `sub_ag_ski`, and `intern`. The prompts did not mention Navi, Progress Map, orientation behavior, or expected maps; they only kept the sessions read-only and prevented source-thread contamination.
- In the natural-prompt pass, `mp_ph_aplication` again used a Rhythm Map for a flowing application project, `sub_ag_ski` reused its target-project map, and `intern` used a long-running rhythm map for recruiting/interview preparation.
- 2026-06-30 quietness boundary follow-up closed the `intern` TODO/today's-items negative sample: read-only checks of TODO files, status files, tracker rows, spreadsheet rows, today's items, known files, or specific records are now explicitly ordinary clear tasks and should not produce Progress Map or Rhythm Map unless the user asks for supervisory orientation.
- `npm run verify:plugin-package` passed after the quietness fix: 27/27 tests passed, plugin manifest validation passed, and source/package drift checking passed. The fix is committed locally at `5ab2ec1`.

## missing_or_risk

The main risk is treating documentation, fixture tests, Navi's self-test project, or a small number of positive fresh-session samples as product proof. Real-use calibration has stronger evidence now, including a negative-sample correction, but the sample is still narrow and should not automatically become a stable-product claim without user confirmation. The current local repository also has commits that still need to be pushed after GitHub authentication is restored.

## next_gate

Restore GitHub authentication and push the local calibration commits, then decide whether the current positive calibration plus quietness correction is enough to move the Navi current test project toward `稳定产品行为`, or whether one broader sample pass is needed first. Any move out of `真实使用校准` requires explicit user confirmation.

## user_confirmation_needed

The user must confirm any proposed change to the six overall stages above before Navi changes the project-level progress bar.
