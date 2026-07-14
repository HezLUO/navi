# Navi Current Test Project Map

project_name: Navi current test project
map_status: confirmed
source: user-confirmed current Navi test project map
current_overall_stage: 稳定产品行为

## overall_stages

```text
[问题定义] -> [行为设计] -> [文档写入] -> [新会话验证] -> [真实使用校准] -> [稳定产品行为]
```

Do not rename, remove, merge, split, or reorder `overall_stages` without explicit user confirmation.

## current_overall_stage

稳定产品行为

## current_stage_explanation

Navi's current test project has enough confirmed V1 evidence to treat the docs-backed skill behavior as stable: ordinary orientation prompts produce target-project Progress Maps or Rhythm Maps, local-only tasks stay local, and narrow factual checks stay quiet.

## sub_progress

local concerns, fixes, retests, pushes, and fresh-session checks must stay in `sub_progress`; they must not become new overall project stages.

Recent local sub-progress:

```text
[自然 prompt 校准] -> [quietness 修复] -> [验证提交] -> [记录证据] -> [push 完成] -> [稳定性确认]
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
- `npm run verify:plugin-package` passed after the quietness fix: 27/27 tests passed, plugin manifest validation passed, and source/package drift checking passed. The fix was committed and pushed as `5ab2ec1`.
- The quietness calibration evidence was recorded and pushed as `3ac13dd`.
- On 2026-06-30, the user explicitly confirmed moving the Navi current test project from `真实使用校准` to `稳定产品行为` after the calibration, quietness correction, verification, and push record were complete.

## missing_or_risk

The main risk is overreading `稳定产品行为`: this means V1 docs-backed skill behavior is stable enough to use as the baseline, not that long-term product feeling, every target domain, or every future UI/runtime surface has been fully proven.

## next_gate

Use Navi Progress Map V1 as the stable baseline in real sessions. Future work should collect long-term product-feeling evidence, especially whether maps and Challenge Moments stay useful, self-initiating, companion-like, and non-annoying across repeated use.

## user_confirmation_needed

The user must confirm any future change to the six overall stages above. New runtime/UI/productization work still needs a separate approved scope.
