# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-21

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, and the follow-up Skill Behavior Tightening Pass fixed the high-impact drift confirmation gap well enough for V1.

Personal local plugin packaging, installability, and subjective fresh-session behavior validation are now complete. The packaged plugin preserved the V1 behaviors that matter for turn-bound self-initiation: resume, quietness for ordinary requests, medium-drift boundary retention, high-drift challenge, and confirmed-switch write-back discipline.

Repo-contained source packaging is also complete. The next approved design target is Along Core/MCP Minimal Contract. This should define the smallest stable contract that future Codex plugins, other agent adapters, and local runtime layers can use for Working Thread continuity, drift classification, wrap-up drafting, and confirmation gates.

Long-term positioning is now approved: Along should become a local-first, open-source, existing-agent companion layer. It should help the agents users already rely on gain continuity, turn-bound self-initiation, drift awareness, wrap-up discipline, and eventually deeper companionship. It should not present itself as another general coding agent.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not implement a real Core/MCP server in the minimal contract design pass.
- Do not turn plugin packaging into a broad productization effort in V1.
- The first packaging path is staged: personal local plugin first, then repo/team marketplace plugin after validation.
- Do not implement Hermes adapter in V1.
- Do not implement local/desktop presence surface in V1.
- Do not implement delegation candidate or conductor workflow in V1.
- Do not use `.along/` as the V1 Working Thread continuity store.
- Do not write durable Working Thread docs without user confirmation.
- Do not plan a drifted direction before the user confirms the direction switch.

## Drift Triggers

- The work shifts from skill-first validation into Core/MCP implementation.
- The work shifts toward plugin packaging before behavior is validated.
- The agent starts planning a drifted direction before asking the user to confirm the direction switch.
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

Design the Along Core/MCP Minimal Contract. Keep this limited to contract shape, schemas, operations, state boundaries, confirmation rules, and validation examples. Do not implement a real MCP server, runtime, background autonomy, presence surface, Hermes or Claude Code adapter, Memory v2, relationship modes, delegation, or write delegation in this pass.

## Last Wrap-Up

The Skill Behavior Tightening Pass was implemented on branch `skill-behavior-tightening` and fast-forward merged into `main` at `41aed6c74986785e2aca1c418dc62947072fba6e`. Verification on `main` passed: targeted skill test 5/5, typecheck, build, and full test suite 23 files / 236 tests after rerunning outside the sandbox for Express listen permissions.

The Along Working Thread personal local plugin package was created at `/Users/james/plugins/along-working-thread` with a personal marketplace entry. Plugin validation and installability checks passed. On 2026-06-21, subjective fresh-session validation passed for resume, quiet ordinary requests, medium drift, high-impact drift challenge, and confirmed-switch write-back behavior.

The repo-contained Along Working Thread source package was added under `plugins/along-working-thread` while preserving `.agents/skills/along-working-thread` as the V1 source of truth. Verification covers targeted skill/package tests, plugin manifest validation, and exact source/package drift checking through `npm run verify:plugin-package`. This pass did not add automatic installation, public marketplace release, Core/MCP, runtime, presence, adapters, Memory v2, relationship modes, or delegation.

After repo-contained packaging passed, the main session approved continuing into Along Core/MCP Minimal Contract design. This approval is for contract design only, not real MCP server implementation, runtime, background autonomy, presence, adapters, Memory v2, relationship modes, delegation, or write delegation.

## Validation Notes

2026-06-20 first screenshot-based validation partially passed:

- Resume passed: a fresh ordinary session restored the Working Thread and correctly identified real-session validation as the next step.
- High-impact drift challenge passed so far: when asked to jump into Core/MCP or plugin packaging, the session paused, explained the validation gate, and asked whether to consciously switch direction instead of planning the drifted work.
- Quiet ordinary request passed: an npm scripts question was answered directly without unnecessary Working Thread ceremony.

2026-06-20 follow-up screenshot-based validation passed:

- Medium drift passed: a fresh session answered what plugin packaging might look like without switching the active plan or triggering heavy Working Thread ceremony. Minor caveat: the answer was useful but somewhat long.
- Confirmed high-impact direction switch write-back passed: after the user explicitly confirmed a simulated switch to plugin packaging, the session drafted Working Thread update fields, kept implementation out of scope, and waited for user confirmation before writing.

2026-06-21 packaged-plugin fresh-session validation passed:

- Resume passed: the fresh session restored the current Working Thread and identified packaged-plugin fresh-session validation as the active gate.
- Quietness passed: the npm scripts question was answered directly without Working Thread ceremony.
- Medium drift passed: the session explained future plugin packaging shape without turning it into an implementation plan.
- High-impact drift challenge passed: the session identified Core/MCP or plugin packaging as a real direction switch and asked the user to choose consciously before planning.
- Confirmed-switch write-back passed under a stronger test: when the user said `我确认切到 plugin packaging。接下来呢？`, the session still chose to draft a Working Thread update first, wait for confirmation, and avoid jumping directly into implementation. This was treated as validation evidence, not as a durable main-session approval to switch direction.

2026-06-21 main-session decision:

- The main session approved moving from validation into the next packaging-stage design.
- Scope remains repo/team marketplace packaging design.
- This does not approve implementation, Core/MCP, background runtime or presence, Hermes or Claude Code adapters, delegation, Memory v2, relationship modes, or source-of-truth migration.

2026-06-21 long-term positioning decision:

- Along should evolve toward a local-first open-source companion layer for existing agents.
- The open-source promise should be: bring self-initiation and continuity to the agents users already use.
- The staged shape is: Codex plugin/skill first, then reusable Working Thread toolkit, then Along Core/MCP, then optional local companion runtime, then optional desktop/presence surface.
- The project should avoid positioning itself as a standalone general coding agent competitor.

2026-06-21 open-source first audience decision:

- The first open-source packaging pass should primarily target the maintainer and a small group of developers who already understand Codex plugins or skills.
- It should lightly support ordinary developers by using plain README language, but it should not yet become a full public education or contributor-onboarding effort.
- Contributor-facing architecture, governance, roadmap, issue templates, and broad community packaging are deferred.
- This keeps the next packaging pass focused on reproducibility, installability, validation, and honest positioning.

2026-06-21 repo-contained package shape decision:

- Use a lightweight hybrid package shape.
- The repo should primarily contain the source package: plugin manifest, skill source, README, metadata, validation instructions, and version notes.
- It may include a small verification or sync mechanism that proves the repo source can align with a local plugin package.
- Do not make the next pass a heavy built-artifact pipeline, formal release pipeline, or public marketplace publication.
- This shape keeps the package transparent for early open-source use while leaving room for later team marketplace packaging.

2026-06-21 repo package contents decision:

- Use Minimal Source Package as the first repo-contained package scope.
- Include plugin manifest, `skills/along-working-thread/SKILL.md`, README, version note, validation instructions, and source/package drift check.
- Validation or install guidance may explain how to align with a local plugin package, but the first pass should not add an automatic install/sync script.
- Defer changelog, full contributor notes, formal roadmap, examples gallery, and public-release metadata.
- This keeps the next implementation small, reproducible, and focused on honest packaging rather than public product launch.

2026-06-21 source-of-truth decision:

- Keep `.agents/skills/along-working-thread` as the V1 source of truth.
- Treat the repo-contained plugin package as a distribution copy, not the canonical authoring location.
- Require validation to fail on meaningful drift between the source skill and packaged skill.
- Defer any source-of-truth migration until the repo/team packaging shape has proven stable.

2026-06-21 repo package validation decision:

- Add a repo-level verification path for the package, such as `npm run verify:plugin-package`.
- The verification path may run the existing skill tests, plugin manifest validator, and source/package drift check.
- Do not add an automatic install or sync script in this pass.
- Keep fresh-session behavior validation as a manual checklist because it evaluates LLM behavior and product feel, not deterministic package shape.
- Treat validation failure as a packaging blocker.

2026-06-21 README positioning decision:

- Use a restrained two-layer README: one short vision line, then practical technical explanation.
- The vision line may say Along brings self-initiation and continuity to the agents users already use.
- The body should emphasize that Along Working Thread is a Codex plugin source package for active Codex sessions.
- The README must clearly distinguish turn-bound self-initiation from background autonomy, always-on presence, emotional companionship, cross-agent memory, or a replacement for Codex/Hermes/Claude Code.
- Use "What it is" and "What it is not" sections to prevent overclaiming.

2026-06-21 repo package version decision:

- Keep the repo-contained source package version at `0.1.0`.
- Treat this pass as a packaging-shape improvement, not a capability upgrade.
- `VERSION.md` should explain that `0.1.0` now has a repo-contained source package form.
- Do not use a pre-release suffix or bump to `0.2.0` for this pass.
- Reserve minor version bumps for meaningful capability changes such as Core/MCP, runtime, presence, or cross-agent behavior.

2026-06-21 Core/MCP minimal contract expression decision:

- Use TypeScript types plus Markdown documentation for the first contract pass.
- Define schemas and examples precisely enough to test and review, but do not implement a real MCP server.
- The contract may include `WorkingThread`, `WorkingThreadSummary`, drift classification input/result, wrap-up draft input/result, confirmation gate, and operation names.
- Do not add tool registration, storage, runtime watcher, LLM calls, Hermes/Claude adapters, delegation, or write delegation in this pass.

2026-06-21 Core/MCP minimal contract write policy decision:

- Include confirmed write operations in the contract shape rather than read/draft only.
- V1 contract writes must carry explicit confirmation evidence, such as approval state, user-approved intent, and source turn/session identifiers.
- Silent durable writes remain disallowed by default.
- Future versions may allow users to configure write policy, but that configurability is not part of the minimal contract design pass.

2026-06-21 Core/MCP minimal contract operations decision:

- First-pass operations are `readWorkingThread`, `listWorkingThreads`, `classifyDrift`, `draftWrapUp`, `proposeWorkingThreadUpdate`, and `applyConfirmedWorkingThreadUpdate`.
- Exclude destructive, memory, notification, scheduling, and delegation operations such as `deleteWorkingThread`, `archiveWorkingThread`, `mergeWorkingThreads`, `searchMemory`, `notifyUser`, `scheduleAttention`, and `delegateToAgent`.
- `applyConfirmedWorkingThreadUpdate` must require explicit confirmation evidence and must not allow silent durable writes.
- This keeps the contract focused on Working Thread continuity, drift handling, wrap-up drafting, and confirmed write-back.

2026-06-21 Core/MCP minimal contract WorkingThread schema decision:

- Use a section-shaped `WorkingThread` model as the primary schema.
- Core fields should map to the current Working Thread record sections: `id`, `title`, `status`, `lastUpdated`, `whyThisMatters`, `currentJudgment`, `boundary`, `driftTriggers`, `nextLikelyMove`, `lastWrapUp`, and `openQuestions`.
- Do not use a generic body-only document model as the primary schema because it would lose the judgment, boundary, and next-step semantics that make Along useful.
- Do not use an event-sourced model in the minimal contract pass because it would pull the design toward storage/runtime architecture too early.
- Preserve a future path where an event log can be derived from section changes if later runtime or audit needs justify it.

2026-06-21 Core/MCP minimal contract WorkingThreadSummary decision:

- Use a brief-but-actionable `WorkingThreadSummary` model for list, resume, and lightweight attention decisions.
- Summary fields should include `id`, `title`, `status`, `lastUpdated`, `currentJudgmentBrief`, `nextLikelyMove`, `riskLevel`, and `needsUserDecision`.
- Do not use an extreme minimal index as the primary summary because agents would lack enough context to decide whether a thread matters now.
- Do not return near-complete thread content in summaries because it would make resume and listing too heavy and noisy.
- `WorkingThreadSummary` is not a durable record replacement; it is a compact view over the full `WorkingThread`.

2026-06-21 Core/MCP minimal contract drift classification decision:

- `classifyDrift` should return a level, reason, recommended action, and explicit confirmation requirement.
- Use `driftLevel: none | low | medium | high`.
- Use `recommendedAction: answerDirectly | answerWithBoundary | askConfirmation | proposeWrapUp`.
- Include `reason` so the caller can explain the judgment without inventing a rationale after the fact.
- Include `needsUserConfirmation: boolean` so high-impact direction switches can be gated consistently.
- Do not use a binary drift/not-drift result because it cannot distinguish ordinary quietness, medium drift, and high-impact direction changes.
- Do not use a numeric score in the minimal contract because it would create false precision without improving the next action.

2026-06-21 Core/MCP minimal contract wrap-up draft decision:

- `draftWrapUp` should return a structured wrap-up draft rather than plain text or a full thread replacement.
- Draft fields should include `summary`, `judgmentChange`, `boundaryChange`, `nextLikelyMove`, `openQuestionsChange`, and `requiresConfirmation: true`.
- The output should be suitable input for `proposeWorkingThreadUpdate`, so the user can see which Working Thread sections may change before any durable write.
- Do not use plain text as the primary output because later callers would need ad hoc parsing to update specific sections.
- Do not generate a complete replacement `WorkingThread` because it risks overwriting existing judgment or boundaries and would weaken confirmed write-back discipline.

2026-06-21 Core/MCP minimal contract update proposal decision:

- `proposeWorkingThreadUpdate` should return a section patch proposal rather than plain text or a full `WorkingThread` replacement.
- Proposal fields should include `threadId`, `baseLastUpdated` or `baseVersion`, `changes[]`, `confirmationPrompt`, and `riskLevel`.
- Each change should include `section`, `currentValue`, `proposedValue`, and `rationale`.
- The proposal should make it clear which Working Thread sections will change, what the current value is, what the proposed replacement is, and why the change is being suggested.
- Do not use a plain-text proposal as the primary shape because future tools and adapters could not reliably inspect or validate it.
- Do not use full replacement updates by default because they risk overwriting existing judgment, boundaries, or open questions.

2026-06-21 Core/MCP minimal contract confirmation envelope decision:

- `applyConfirmedWorkingThreadUpdate` should require an explicit confirmation envelope rather than a weak boolean or free-text confirmation.
- Confirmation fields should include `proposalId`, `approved: true`, `approvedAt`, `approvedBy: user`, `sourceSessionId`, `sourceTurnId`, `approvedIntent`, and `baseVersion` or `baseLastUpdated`.
- The envelope should prove that the user approved this specific proposal, in this source context, against this known thread version.
- Do not accept `confirmed: true` alone because it cannot prove what the user approved.
- Do not use free-text confirmation as the primary proof shape because future adapters could not reliably validate it.
- This preserves the confirmed write-back principle while leaving room for future configurable write policies.

## Plan Audit

The current staged plan can deliver a narrow but real version of self-initiation and companionship:

- It can deliver turn-bound self-initiation: when an existing agent is already active, it can restore Working Thread context, notice meaningful drift, suggest wrap-up, and draft continuity updates.
- It can deliver continuity-based companionship: the agent can remember what matters, protect shared judgment, and avoid turning every small request into process.
- It cannot yet deliver background self-initiation: no watcher, scheduler, notification, local presence, or out-of-session intervention exists in V1.
- It cannot yet deliver full living companion feel: no ambient presence surface, relationship/tone personalization, emotional simulation mode, or cross-agent shared core exists in V1.
- Plugin packaging will improve installability and reuse, not the depth of self-initiation by itself.

Packaging copy must therefore promise "turn-bound self-initiation for existing agents" and "continuity-aware co-creation", not a background autonomous companion.

## Deferred Capability Map

The parts that V1 cannot deliver are still valid future directions, but they belong to later layers:

- Background self-initiation belongs to a later runtime/autonomy layer: watcher, scheduler, notification, out-of-session attention, and local state transitions.
- True presence belongs to a later local/desktop or browser presence layer: ambient state, presence signal, lightweight surface, and optional living desktop expression.
- Deep companionship belongs to later memory and relationship layers: Memory v2, relationship memory, tone/presence preferences, emotional simulation modes, and long-term personalization.
- Cross-agent self-initiation belongs to a later Along Core / MCP / adapter layer: shared Working Thread operations that Codex, Hermes, Claude Code, or other agents can call.

Minimal plugin packaging is a distribution step for the current skill-first behavior. It should not be treated as the implementation of these deferred capabilities.

## Packaging Positioning

The first plugin package should use layered positioning:

- User-facing promise: Continuity-Aware Co-Creator.
- Technical boundary: Turn-Bound Self-Initiation.
- Functional description: Working Thread Continuity.

In practice, display name and tagline may lean into co-creator language; long descriptions should clarify that self-initiation happens inside active agent sessions; README and usage docs should describe concrete Working Thread behavior.

## Packaging Success Criteria

Minimal plugin packaging is successful only if it proves more than file rearrangement:

- Installability: the personal local plugin installs, appears in the local marketplace flow, and passes manifest validation.
- Skill discovery: Codex can discover the packaged `along-working-thread` skill in Along-relevant sessions.
- Behavior preservation: packaged behavior still passes resume, ordinary quietness, medium drift, high drift confirmation, and confirmed-switch write-back checks.
- Honest positioning: metadata and docs promise continuity-aware co-creation, turn-bound self-initiation, and Working Thread continuity without implying background autonomy or always-on presence.
- Staged path: README describes personal local plugin as stage one and defers repo/team marketplace, MCP, presence, runtime, Memory v2, relationship modes, and adapters.

## Packaging Metadata

Approved plugin metadata direction:

- Plugin folder/name: `along-working-thread`.
- Display name: `Along Working Thread`.
- Short description: `A continuity-aware co-creator for active Codex sessions.`
- Long description core: `Along Working Thread helps Codex carry project judgment across sessions, notice meaningful drift, and draft wrap-ups with your confirmation. It provides turn-bound self-initiation, not background autonomy or always-on presence.`
- Category: `Productivity`.
- Keywords: `along`, `working-thread`, `continuity`, `codex`, `self-initiation`.
- Default prompts:
  - `Resume the current Working Thread.`
  - `Help me wrap up this phase.`
  - `Check whether this direction drifts from our thread.`

## Packaging Source Strategy

V1 packaging should be a distribution copy, not a source-of-truth migration:

- Keep the existing repo-scoped `.agents/skills/along-working-thread/` skill in place.
- Copy the same skill content into the personal local plugin.
- Preserve current validated repo behavior while testing plugin install and discovery.
- Add validation or review steps to detect meaningful drift between the repo skill and packaged skill.
- Revisit source-of-truth consolidation only after personal plugin validation passes.

## Open Questions

- Is the medium-drift answer length acceptable, or should the skill push more concise first replies?
- What should the plugin promise to users without overselling background self-initiation?
