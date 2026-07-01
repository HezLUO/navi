# Navi Post-Alpha Backlog / Roadmap

Status: draft backlog after the `0.1.0-alpha` GitHub source release
Last updated: 2026-07-01

This roadmap records what remains after the first Navi open-source alpha. It is not implementation approval. Each future implementation pass still needs an explicit scope, boundary, and verification gate.

## Challenge Moment Integration

Challenge Moment is already integrated into Navi through the Challenge Layer.

Navi is Along's current V1 product surface, not the whole long-term Along product. Navi's V1 alpha behavior centers on Progress/Rhythm Maps and Challenge Layer. Challenge Moment is the escalation behavior inside a map when the current path shows drift, weak assumptions, premature execution, or self-certifying momentum. It should appear as a useful risk note and validation suggestion, not as a separate lecture or constant critique.

The alpha claim is limited: the docs-backed skill behavior is stable enough to use as the V1 baseline. This does not prove long-term product feeling, every professional domain, or future runtime/UI surfaces.

## Alpha Feedback

Goal: learn whether Navi stays useful, self-initiating, companion-like, and non-annoying in real repeated use.

- P0: Run long-term real-use calibration across ordinary work sessions, not only controlled fresh-session prompts.
- P0: Record when Progress Maps help the user regain control and when they feel too heavy, too frequent, or unnecessary.
- P0: Record when Challenge Moments correctly prevent self-certification, drift, or premature execution.
- P0: Record false positives: moments where Navi challenged too much, interrupted clear execution, or overread a low-risk situation.
- P0: Validate the alpha clone/install/verify path from a clean local checkout.
- P0: Keep the external-reader GitHub homepage and Release-page check postponed but not deleted.
- P1: Expand calibration beyond the current limited cross-project sample into more target-project shapes, including coding, applications, research, operations, and document-heavy work.
- P1: Add a small evidence log for real-use calibration: prompt, project shape, expected behavior, actual behavior, and user judgment.
- P1: Keep quietness regression samples active, especially TODO/status/tracker/today's-items checks that should remain ordinary factual requests.

## Distribution Improvements

Goal: make the current source alpha easier to inspect, install, and verify without overstating distribution readiness.

- P0: Clarify the manual Codex plugin install path for users who already understand local Codex plugin or skill workflows.
- P0: Add a short "verify this checkout" path that starts from a fresh clone and ends with `npm run verify:plugin-package`.
- P0: Validate the narrow `navi init` project-local initializer with clean temporary target projects and at least one real target project.
- Repository split follow-through: `HezLUO/navi` is the canonical Navi alpha product repository; `HezLUO/along` remains the lightweight umbrella and long-term product vision repository.
- P1: Add contributor basics: `CONTRIBUTING.md`, issue templates, PR template, and a short maintainer release checklist.
- P1: Decide whether the repo should expose a public roadmap file from the root README.
- P1: Improve installer ergonomics without broadening scope: clearer preview, conflict reporting, and source-record hints.
- P1: Prepare a public Codex marketplace readiness checklist without treating marketplace publication as approved.
- P2: Define version policy after `0.1.0-alpha`: alpha patches for documentation/packaging fixes, minor version bumps only for meaningful capability changes.
- P2: Decide whether future release notes should separate product behavior, package shape, and validation evidence.

## Future Capability Layers

Goal: keep larger product layers visible without letting them slip into the alpha maintenance scope.

- MCP client validation: test the existing docs-backed stdio Minimal Server V1 from a real MCP client session, especially resource reads, action tools, and confirmed section-patch write-back.
- Navi project initialization workflow: extend the shipped narrow `navi init` surface only after real-use feedback confirms the dry-run and write model.
- Web UI / local app surface: treat the existing Shared Desk web code as historical Along product-expression work and a possible future Navi capability layer, not as part of the current alpha. A future branch should first define whether the interface is a Navi map review surface, an Along companion surface, or a separate local app.
- Local companion runtime: evaluate whether Navi should ever gain watcher, scheduler, notification, or always-on presence behavior.
- Agent adapters: investigate whether Hermes, Claude Code, or other agents can call the same Working Thread and Navi coordination behavior.
- Memory v2 and relationship modes: explore long-term personalization only after the V1 process boundary remains reliable.
- Delegation and write delegation: investigate agent-to-agent coordination only after confirmed write-back and user supervision rules are stronger.
- Marketplace or npm packaging: treat these as separate distribution projects, not as automatic follow-ups to the alpha release.

### Web UI Exploration Gate

Do not rebrand or ship the existing `src/web` surface as Navi until a focused exploration answers:

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
- Public Codex marketplace publication.
- Global plugin installation, one-click sync, npm distribution, or marketplace installation.
- Background runtime, watcher, scheduler, notifications, or always-on presence.
- Runtime UI, local app surface, or Web UI rebrand.
- Hermes, Claude Code, or other agent adapters.
- Memory v2, relationship modes, delegation, or write delegation.
- Automatic final decision-making across every professional domain.
- Replacement for legal, medical, financial, engineering, or other expert review.
- A claim that implementation success, tests passing, or package verification proves product feeling.
- A claim that long-term product feeling or every target domain is fully validated.
