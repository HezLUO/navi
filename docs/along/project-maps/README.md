# Along Project Maps

> **Historical location:** Navi's active initialization guide and managed trigger template now live at [`docs/navi/project-init.md`](../../navi/project-init.md) and [`docs/navi/project-trigger-template.md`](../../navi/project-trigger-template.md). The older documents and project records in this directory are retained as Along-origin design and calibration evidence.

New target projects use the canonical confirmed Project Map at `.navi/project-map.md`. Files in this directory are not alternate active Map paths and should not be copied into new projects as initialization output.

The records below preserve the earlier map format used by the current Navi test project. Do not rewrite `overall_stages` without user confirmation. Use current-stage sub-progress for local concerns, fixes, retests, pushes, fresh-session checks, or other temporary work inside the current overall stage.

## Record Shape

```text
project_name:
map_status: confirmed
source:
overall_stages:
current_overall_stage:
current_stage_explanation:
sub_progress:
visible_evidence:
missing_or_risk:
next_gate:
user_confirmation_needed:
```
