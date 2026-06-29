# Along Project Maps

This directory stores confirmed Project Map records for current Navi-supervised target projects.

A confirmed Project Map is the source of truth for stable overall progress bars. Do not rewrite `overall_stages` without user confirmation.

Use current-stage sub-progress for local concerns, fixes, retests, pushes, fresh-session checks, or other temporary work inside the current overall stage.

Use `navi-project-trigger-template.md` when a target project needs a lightweight project-local Navi trigger source. This is useful because global skill auto-routing can be inconsistent in fresh sessions; a short rule in the target project's `AGENTS.md` makes Progress Map and Rhythm Map behavior discoverable from the project itself.

## Record Shape

```text
project_name:
map_status: confirmed | provisional
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
