# Navi Project Initialization

Navi has two separate setup layers:

Navi is installed globally once. navi init initializes a target project, does not install Navi again, and project-local initialization is the reliable path for confirmed navigation in fresh sessions.

- Global capability: install the Navi source package and run `navi setup` once so Codex can discover Navi.
- Project configuration: confirm one project navigation baseline, then activate that project with `.navi/project-map.md` and the managed `AGENTS.md` trigger.

`navi init` configures a target project. It does not install Navi again.

Journey contract: global setup once -> guided confirmed baseline -> one trigger + `.navi/project-map.md` preview -> one approved project init write -> fresh-session natural-language supervision.

## Just-In-Time Entry

Initialization begins when a user asks a broad supervision question in a project that has neither a confirmed Map nor project-local Navi guidance. Typical questions include `what's next?`, `where are we?`, `should we continue?`, `should we stop?`, or a statement that the current progress is unclear.

Navi first runs an eligibility check. The baseline is ready only when it can present these judgments for confirmation:

- Desired Outcome;
- Route To Outcome or working rhythm;
- Current Position; and
- Next Decision or Current Boundary.

When one judgment is missing, Guided Baseline Formation asks one focused question at a time. It names the missing judgment, proposes a candidate from available project evidence, and lets the user confirm or correct it. This stage is read-only.

If the user declines or stops, Navi continues with explicitly uncertain, best-effort read-only supervision and does not repeat the same initialization reminder in that session.

## One Preview And One Approval

When the baseline is confirmable, Navi shows one combined final preview:

1. create or safely repair the confirmed `.navi/project-map.md`; and
2. create or upgrade the exact managed Navi block in `AGENTS.md` while preserving project-owned instructions.

The preview identifies the exact actions and plan fingerprint. One explicit approval can authorize both actions as one bounded project initialization write. The write order is fixed: Map first, trigger last.

If the Map write succeeds but the trigger write fails, the confirmed Map remains in place. Navi reports partial activation and directs the user to inspect `AGENTS.md` before retrying. It never rolls the Map back to hide that partial result.

## Direct CLI Behavior

`navi init` is dry-run by default.

- With no confirmed Map and no candidate payload, it reports `needs-confirmed-map`, lists a small set of local evidence sources when available, makes no changes, and directs the current Codex session to form and confirm the baseline.
- With a valid confirmed Map but no current trigger, it previews the exact trigger activation.
- With a valid confirmed Map and current trigger, it reports the project as healthy.
- With invalid, unsupported, unsafe, or conflicting input, it blocks instead of guessing or overwriting evidence.

The advanced adapter integration passes an already confirmed candidate with `navi init --map-file <candidate>`. The dry-run output includes a fingerprint derived from the exact candidate Map, target, and relevant existing bytes. The approved write uses `navi init --map-file <candidate> --expect-plan <fingerprint> --write`; if the preview inputs changed, the write is rejected and must be previewed again. This is an internal integration detail, not the guided user's baseline-formation interface.

## Fixed Project Map Contract

The canonical path is exactly `.navi/project-map.md`. A valid file has frontmatter with:

```yaml
navi_map: 1
map_status: confirmed
project_status: active | paused | closed
last_confirmed: YYYY-MM-DD
```

Its body contains ordered anchored sections for Desired Outcome, Route To Outcome, Current Position, Current Boundary, Next Decision, and Evidence And Uncertainty. Existing roadmaps, plans, trackers, handoffs, and project records remain evidence; they are not alternate Map paths.

## Doctor States

`navi doctor` reports the project configuration separately from global discovery:

- `not-initialized`: neither confirmed Map nor trigger exists;
- `map-ready`: the Map is valid but the trigger is missing;
- `trigger-orphaned`: a recognized trigger exists without a confirmed Map;
- `map-invalid`: the Map is invalid, unsupported, or unsafe;
- `trigger-invalid`: the trigger is legacy, edited, incomplete, duplicated, or unsafe; and
- `healthy`: the confirmed Map and current trigger are both valid, including the Map lifecycle state.

Doctor diagnoses and gives a bounded repair direction. It does not silently initialize or repair the project.

## Fresh-Session Validation

After the approved write, start a fresh Codex session in the target project and ask an ordinary natural-language supervision question, such as:

```text
What should we do next?
```

The check succeeds when Codex reads the confirmed Map before advising, follows the current prompt language, gives the smallest useful Navi supervision surface, and keeps clear bounded execution requests quiet. The user should not need to name Navi or know its internal vocabulary.
