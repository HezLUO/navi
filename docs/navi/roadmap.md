# Navi Post-Alpha Backlog / Roadmap

Status: active backlog with Product Complete calibration open and Distribution feasibility separately approved
Last updated: 2026-07-18

This roadmap records what remains after the first Navi open-source alpha. It is not implementation approval. Each future implementation pass still needs an explicit scope, boundary, and verification gate.

## Current Phase

Supervised Delivery Loop V1 is integrated, and adaptive project entry is integrated. Outcome Boundary real-project calibration remains part of the open gate. Codex-first Product Complete now has one remaining gate: one genuine, bounded implementation journey that naturally combines project supervision, actual Execution/Validation model and reasoning routing, direct event return, bounded remediation, no meaningless continue, and a final real acceptance or integration decision.

Distribution feasibility is separately approved as an unreleased implementation lane. Its next Distribution gate is bounded real-installation Calibration after independent validation and explicit integration—not automatic Release preparation. Product Complete calibration is neither replaced nor declared complete. Real installation, permission, scope, risk, merge, push, tag, release, and publication decisions remain explicit.

Plan And Delivery Reliability V1 is the current bounded reliability closeout: implementation and independent validation establish the contract, then one natural joint calibration must demonstrate zero user relay, zero meaningless continue, aggregate plan-artifact handling, direct Execution and Validation delivery, and preserved real user decisions. This does not close Product Complete by itself and does not authorize Runtime or Release work.

## Product Positioning

Navi should be treated as an independent product surface for non-expert users supervising expert agents.

Along remains the parent project or lab context and may remain the broader product family, but external readers should not need to understand Along before they understand Navi. `along-working-thread` should be treated as a legacy/internal implementation id unless a future compatibility migration intentionally changes it.

The public narrative should be Navi-first:

```text
Navi helps non-expert users understand, supervise, and steer expert agents.
```

This positioning keeps future Along integration possible without making Along the entrypoint for current users.

## Challenge Moment Integration

Challenge Moment is already integrated into Navi through the Challenge Layer.

Navi's V1 alpha behavior centers on Progress/Rhythm Maps, Challenge Layer, pause semantics, stage-and-vision supervision, and coordination guidance. Challenge Moment is the escalation behavior inside a map when the current path shows drift, weak assumptions, premature execution, over-validation, coordination conflict, or self-certifying momentum. It should appear as a useful risk note and validation suggestion, not as a separate lecture or constant critique.

The alpha claim is limited: the docs-backed skill behavior is stable enough to use as the V1 baseline. This does not prove long-term product feeling, every professional domain, or future runtime/UI surfaces.

## Alpha 4 Supervision Focus

Goal: strengthen Navi as a supervision layer before expanding into a full project navigation console.

- P0: Add phase supervision so Navi can explain whether the current work is design, calibration, implementation, release, closeout, or exploration.
- P0: Add verification budget guidance so Navi can tell the user when targeted validation is enough and when continued checks have become release-level work.
- P0: Add proactive decision signals for stop, wait, approval, phase-change, and over-validation moments.
- P0: Add parallel work supervision so the main session does not default to waiting for every bounded worktree.
- P1: Add lightweight vision-distance judgment so Navi can place current work on the path from the user's original goal to the fuller Navi vision.

This is not approval to implement runtime UI, background watchers, Memory v2, agent adapters, delegation, marketplace distribution, or release automation.

## Alpha Feedback

Goal: learn whether Navi stays useful, self-initiating, companion-like, and non-annoying in real repeated use.

- P0: Run long-term real-use calibration across ordinary work sessions, not only controlled fresh-session prompts.
- P0: Record when Progress Maps help the user regain control and when they feel too heavy, too frequent, or unnecessary.
- P0: Record when Challenge Moments correctly prevent self-certification, drift, or premature execution.
- P0: Record false positives: moments where Navi challenged too much, interrupted clear execution, or overread a low-risk situation.
- P0: Record continuation friction: moments where the user repeatedly has to type `continue` or `继续`, why Codex stopped, whether the pause was necessary, whether there was a real decision point, and whether Navi should explain or reduce that pause.
- P0: Validate the alpha clone/install/verify path from a clean local checkout.
- P0: Keep the external-reader GitHub homepage and Release-page check postponed but not deleted.
- P1: Expand calibration beyond the current limited cross-project sample into more target-project shapes, including coding, applications, research, operations, and document-heavy work.
- P1: Add a small evidence log for real-use calibration: prompt, project shape, expected behavior, actual behavior, and user judgment.
- P1: Keep quietness regression samples active, especially TODO/status/tracker/today's-items checks that should remain ordinary factual requests.
- P1: Explore bounded continuation contracts: when safe, Navi may tell the user what will happen if they continue through several steps and where Codex should stop again.
- P1: Explore decision-point stopping guidance: Codex should keep moving inside an approved boundary and pause when user judgment is actually needed.

## Distribution Improvements

Goal: carry the unreleased Distribution feasibility candidate through independent validation and later real-installation calibration without overstating release readiness.

- Resolved foundation: project initialization now uses a guided confirmed baseline, one combined `.navi/project-map.md` plus managed-trigger preview, and one fingerprint-bound approved write with Map-first/trigger-last ordering.
- Implemented candidate: one generated package-local init entry and one staging tool feed the Git-backed `navi-source` catalog and local-marketplace bundle from identical plugin bytes.
- Open gate: prove Node availability, installed-copy path resolution, and both marketplace journeys in separately authorized real-installation Calibration.
- Later Release work: choose version identity, create ZIP and checksums, activate the public catalog, and document update, rollback, and uninstall.
- Optional channel: prepare Public Plugin Directory materials only after the controlled GitHub path works; Directory acceptance is not a prerequisite.
- P0: Clarify the manual Codex plugin install path for users who already understand local Codex plugin or skill workflows.
- P0: Add a short "verify this checkout" path that starts from a fresh clone and ends with `npm run verify:plugin-package`.
- P0: Calibrate the confirmed-Map init journey in fresh Codex sessions, especially guided baseline questions, declined initialization, partial activation diagnosis, and natural-language supervision after activation.
- Repository split follow-through: `HezLUO/navi` is the canonical Navi alpha product repository; `HezLUO/along` remains the lightweight umbrella and long-term product vision repository.
- P1: Add contributor basics: `CONTRIBUTING.md`, issue templates, PR template, and a short maintainer release checklist.
- P1: Decide whether the repo should expose a public roadmap file from the root README.
- P1: Improve installer ergonomics without broadening scope: clearer preview, conflict reporting, and source-record hints.
- P1: Preserve the approved feasibility evidence needed before a later explicit Release plan.
- P2: Define version policy after `0.1.0-alpha`: alpha patches for documentation/packaging fixes, minor version bumps only for meaningful capability changes.
- P2: Decide whether future release notes should separate product behavior, package shape, and validation evidence.

## Codex Model And Reasoning Routing

Task model routing remains applicable at task-creation and follow-up boundaries for bounded Execution and Validation Tasks. Stock Codex App Main turns keep the user's selected model; Navi may give one quiet recommendation when a materially stronger stage floor is needed, but it does not switch the active Main turn.

Route Application Gate V1 makes authorized task creation and route-changing
follow-ups fail closed when the explicit host model or reasoning arguments are
missing or do not match the selected route; Navi must not silently inherit the
host default. This remains prompt/docs-backed enforcement and does not implement
the Main Turn Host Adapter, Runtime Surface, task persistence, or active Main
turn switching.

The Main Turn Host Adapter and a Navi local panel are deferred and are not part of the current Codex-first Product Complete gate. One passing joint natural sample is sufficient to close Codex-first Product Complete; do not create an artificial task merely to test routing. Shadow calibration, task-level natural calibration, and any later main-turn calibration remain separate gates; static contract tests do not replace them.

A future Navi local panel may still become a separate supervision or orchestration product if it later proves broader value, but it is not justified solely for Main-turn model switching. Runtime surfaces should be reconsidered only if future natural calibration shows that the current Codex-first boundary is insufficient for task routing, task recovery, or concurrent-lane correctness.

## Future Capability Layers

Goal: keep larger product layers visible without letting them slip into the alpha maintenance scope.

- MCP client validation: test the existing docs-backed stdio Minimal Server V1 from a real MCP client session, especially resource reads, action tools, and confirmed section-patch write-back.
- Navi project initialization workflow: calibrate the shipped confirmed-Map journey before considering any extension to its guided confirmation, dry-run, fingerprinted write, or doctor surfaces.
- Web UI / local app surface: treat the existing Shared Desk web code as historical Along product-expression work and a possible future Navi capability layer, not as part of the current alpha. A future branch should first define whether the interface is a Navi map review surface, an Along companion surface, or a separate local app.
- Local companion runtime: evaluate whether Navi should ever gain watcher, scheduler, notification, or always-on presence behavior.
- Agent adapters: investigate whether Hermes, Claude Code, or other agents can call the same Working Thread and Navi coordination behavior.
- Pause reason visibility: evaluate whether Navi should explain why Codex stopped, whether the stop was necessary, and whether the next `continue` would cross a supervision boundary.
- Decision-point stopping: evaluate whether Navi can reduce meaningless `continue` prompts by distinguishing permission/risk/phase boundaries from ordinary execution momentum.
- Memory v2 and relationship modes: explore long-term personalization only after the V1 process boundary remains reliable.
- Delegation and write delegation: investigate agent-to-agent coordination only after confirmed write-back and user supervision rules are stronger.
- Marketplace release activation or npm publication: treat these as separate Release decisions, not automatic follow-ups to feasibility implementation.

### Web UI Exploration Gate

Do not rebrand or ship the existing `archive/along/src/web` surface as Navi until a focused exploration answers:

- What user problem the UI solves better than chat-only Navi maps.
- Whether the first screen should show a map review surface, a project supervision console, or an Along-style companion desk.
- What current alpha boundary must remain visible: no background watcher, no always-on presence, no implicit write authority, and no claim that runtime UI is included in `0.1.0-alpha`.
- Whether the implementation belongs in this Navi repo, the broader Along repo, or a separate prototype branch.
- What validation evidence is required before the UI appears in the README, release notes, or marketplace/narrative copy.

Recommended branch shape when approved:

```text
explore/navi-web-ui-surface
```

That branch should start as a design/prototype branch, not a release-prep branch.

## Explicitly Out Of Current Scope

The current alpha does not include and should not imply:

- npm package publication.
- An activated public Git-backed catalog or Public Plugin Directory publication.
- Real marketplace installation/calibration, one-click sync, or npm distribution.
- Background runtime, watcher, scheduler, notifications, or always-on presence.
- Runtime UI, local app surface, or Web UI rebrand.
- Hermes, Claude Code, or other agent adapters.
- Memory v2, relationship modes, delegation, or write delegation.
- Automatic final decision-making across every professional domain.
- Replacement for legal, medical, financial, engineering, or other expert review.
- A claim that implementation success, tests passing, or package verification proves product feeling.
- A claim that long-term product feeling or every target domain is fully validated.
