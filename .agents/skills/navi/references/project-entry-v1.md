# Navi Adaptive Project Entry V1

Use this reference when a broad supervision need appears in a project without reliable project-local Navi guidance or a confirmed Project Map.

Navi exposes one user-visible project-entry journey. Evidence Profile is turn-local, prompt/docs-backed Codex judgment; it is not a persisted profile, runtime classifier, repository index, or automatic authority selector.

## Entry Boundary

Apply the quietness gate first. Narrow factual or bounded execution requests stay quiet. A broad progress, next-step, stop, wait, continue, confusion, or plan-reliability request may enter project initialization judgment when reliable project-local Navi guidance is missing.

Never initialize automatically. A declined entry receives explicitly uncertain best-effort read-only supervision, and Navi does not repeat the same reminder in that session.

## Project State Fast Path

Inspect project state before forming an Evidence Profile: check `.navi/project-map.md` and the managed project-local trigger first. A valid confirmed `.navi/project-map.md` skips Evidence Profile and baseline formation and uses the existing Project Map behavior.

If the Map is valid and confirmed but only the managed trigger is missing, hand
that state to `project-map-v1.md` and use its formal init entry for the
trigger-only preview and activation. Do not copy invocation detail here. Navi
must not reconfirm or regenerate the baseline. Form an Evidence Profile only
when there is no valid confirmed Map to reuse.

## Evidence Profile

Record conceptually:

profile: coherent | conflicting | insufficient | stale
sources: bounded evidence used
supported_judgments: Desired Outcome, Outcome Boundary for version 2, route or rhythm, Current Position, Current Boundary, or Next Decision supported by evidence
missing_judgments: required judgments still needing user input
conflicts: incompatible decision-relevant claims
uncertainty: incomplete or apparently outdated evidence
next_baseline_action: candidate | resolve conflict | ask one question | inspect code

Do not persist the profile as a project file.

Classify the evidence using these criteria:

- `coherent`: evidence supports every required baseline area, including the Outcome Boundary required for a version 2 candidate, with no unresolved material conflict.
- `conflicting`: incompatible claims would change the Desired Outcome, Outcome Boundary, major route, current phase, stopping boundary, or Next Decision.
- `insufficient`: one or more required baseline areas cannot be made confirmable.
- `stale`: an apparently authoritative source is plausibly passed by current repository facts. Perform a targeted code or Git check, then reclassify. If the check cannot resolve the issue, preserve uncertainty or ask the user; do not silently demote the source.

## Bounded Evidence Scan

Inspect in order: existing `.navi/project-map.md` and project-local trigger state; `AGENTS.md`; README; active roadmap and active specification or implementation plan; status records, handoffs, trackers, or task files; then Git status, current branch, and recent commits.

Stop gathering evidence when additional reading is unlikely to change the profile. Do not perform a full-repository audit.

Use a targeted code check only when documents are insufficient, conflicting, or apparently stale. Name the disputed claim. Code may show implemented state but cannot establish the user's desired outcome or choose product direction.

## Profile Routing

coherent -> Evidence-First Candidate
conflicting -> Conflict Resolution
insufficient -> Guided Baseline Formation
stale -> Targeted Code Check, then reclassify

Navi must not use modification time, fixed filename priority, code state, or model confidence to settle a direction conflict. Present the claims, sources, and impact. Provide a recommendation only when supportable; any supportable recommendation must state its evidence basis and remain visibly distinct from user approval. Otherwise explicitly state that the evidence supports no default recommendation. Never invent a recommendation to satisfy the structure. Then ask one focused direction question at a time. The user confirms the direction. Navi must not produce a `map_status: confirmed` candidate until the conflict is resolved.

## Evidence-First Candidate

Build a complete candidate before questioning the user. For version 2, only coherent evidence forms a complete Outcome Boundary candidate; code and tests may support implementation state and Acceptance Evidence but cannot choose the whole-goal completion line. Do not ask the user to repeat supported facts. Ask only about missing, conflicting, or route-changing judgments. Distinguish observed implementation state from intended direction, preserve evidence and uncertainty, then show one complete candidate for final confirmation.

## Guided Baseline Formation

Ask about one missing judgment at a time. Confirm Desired Outcome, Outcome Boundary, Current Position, Current Boundary, Next Decision, and either a route or working rhythm. When the Outcome Boundary lacks enough evidence, offer two or three project-specific completion levels with concrete trade-offs rather than a fixed Navi maturity ladder. A new project may confirm an explicitly provisional route or working rhythm, or a provisional Outcome Boundary. Provisional means the user confirms the boundary as the current working completion hypothesis and it includes a Revisit Trigger; it does not claim a permanent product boundary. Record unknowns in Evidence And Uncertainty; a stored candidate must not contain a blank placeholder or fabricated certainty.

## Layered Authority

Project roadmaps own detailed product sequencing; specs own design; plans own bounded execution; trackers own item state; code and tests provide implemented-behavior evidence. The confirmed `.navi/project-map.md` owns Navi's compact supervision baseline and does not replace a project roadmap. The Map references source evidence instead of copying complete plans and does not become the sole authority for all project facts.

## Confirmed Exit

Both strategies use one combined Map and managed-trigger preview, one
fingerprint-bound explicit approval, Map first, and trigger second. Hand the
confirmed candidate to the package-local init entry owned by
`project-map-v1.md`. Do not copy its path-resolution contract here, bypass the
formal init entry, stage, commit, push, or mutate global state.

## Material Updates

Propose a bounded Map diff only when Desired Outcome, Outcome Boundary, major route or Product Stage, Current Boundary, Next Decision, or decision-relevant evidence conflict materially changes. Routine commits, tests, and local completion do not independently trigger a Map update.
