# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-22

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 remains Codex-first, skill-first, docs-backed, and focused on turn-bound self-initiation. Skill-First V1 validation passed resume, wrap-up, and quietness, and the follow-up Skill Behavior Tightening Pass fixed the high-impact drift confirmation gap well enough for V1.

Personal local plugin packaging, installability, and subjective fresh-session behavior validation are now complete. The packaged plugin preserved the V1 behaviors that matter for turn-bound self-initiation: resume, quietness for ordinary requests, medium-drift boundary retention, high-drift challenge, and confirmed-switch write-back discipline.

Repo-contained source packaging is also complete. The type-only Along Core/MCP Minimal Contract has been implemented and fast-forward merged into `main` at `f49a576e0613b3251294d004c1e7db00ad4b8439`. The contract now provides shared Working Thread types, operation signatures, behavior-critical examples, and tests, but it does not provide a real MCP server, runtime, storage, adapter, background autonomy, or presence.

The Core/MCP Minimal Server is now implemented as a real but extremely small docs-backed stdio MCP server under `src/mcp/`. It exposes Working Thread summaries and full records as MCP resources, exposes only action tools for drift classification, wrap-up drafting, update proposals, and confirmed write-back, and keeps read/list behavior as resources rather than tools. Minimal Server V1 does not call an LLM, require an API key, expose MCP prompts, use `.along/` local state, open HTTP/SSE transport, run as a daemon, infer workspace from cwd, add a package bin, or rewrite full Markdown files. Confirmed write-back requires a strict confirmation envelope, stale proposal conflict handling, file-scope limits to Working Thread records, and section-patch-only mutation.

Long-term positioning is now approved: Along should become a local-first, open-source, existing-agent companion layer. It should help the agents users already rely on gain continuity, turn-bound self-initiation, drift awareness, wrap-up discipline, and eventually deeper companionship. It should not present itself as another general coding agent.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not expand the completed Minimal Server V1 into a broader Core/MCP runtime, watcher, adapter, delegation, or write delegation layer without a separate approved pass.
- Do not treat fresh-session MCP client validation as approval for new server capabilities beyond the implemented docs-backed stdio Minimal Server V1.
- Do not implement another Core/MCP server or transport shape until a dedicated follow-up spec is reviewed and approved.
- The Minimal Server direction must stay docs-backed and non-autonomous unless the user explicitly approves a later storage/runtime change.
- Do not introduce `.along/` local store for the Minimal Server V1 data source.
- Do not expose MCP prompts in Minimal Server V1; keep prompts deferred until the skill/plugin boundary is clearer.
- Do not require an LLM provider, API key, or model call in Minimal Server V1.
- Do not allow Minimal Server V1 to write without an explicit confirmation envelope.
- Do not allow Minimal Server V1 to write files outside `docs/along/working-threads/`.
- Do not force-apply stale Working Thread update proposals.
- Do not allow Minimal Server V1 to rewrite entire Working Thread files; confirmed write-back must apply approved section patches only.
- Do not write to malformed Working Thread records; expose partial reads with warnings and require repair before write-back.
- Do not expose an HTTP/SSE transport or local port in Minimal Server V1.
- Do not run Minimal Server V1 as a background daemon or always-on runtime.
- Do not infer the target workspace from `process.cwd()` in Minimal Server V1; require an explicit workspace root.
- Do not put MCP server implementation into `src/core/`; keep `src/core/` as the contract layer.
- Do not introduce a new package or monorepo package for Minimal Server V1.
- Do not hand-roll the MCP protocol in Minimal Server V1 when a standard MCP SDK is available.
- Do not add an MCP SDK dependency without explicit implementation-phase dependency approval.
- Do not add a package bin, formal CLI, or public distribution command for Minimal Server V1.
- Do not turn plugin packaging into a broad productization effort in V1.
- The first packaging path is staged: personal local plugin first, then repo/team marketplace plugin after validation.
- Do not implement Hermes adapter in V1.
- Do not implement local/desktop presence surface in V1.
- Do not implement delegation candidate or conductor workflow in V1.
- Do not use `.along/` as the V1 Working Thread continuity store.
- Do not write durable Working Thread docs without user confirmation.
- Do not plan a drifted direction before the user confirms the direction switch.

## Drift Triggers

- The work shifts from fresh-session MCP client validation into new Core/MCP runtime, transport, storage, adapter, or local-layer implementation beyond the completed Minimal Server V1.
- The work shifts toward plugin packaging before behavior is validated.
- The agent starts planning a drifted direction before asking the user to confirm the direction switch.
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

The Core/MCP Minimal Server implementation is complete on branch `along-core-mcp-minimal-server`. The next gate is fresh-session MCP client validation against the stdio server, especially resource reads, action-tool behavior, and confirmed section-patch write-back from a real client session.

## Last Wrap-Up

The Skill Behavior Tightening Pass was implemented on branch `skill-behavior-tightening` and fast-forward merged into `main` at `41aed6c74986785e2aca1c418dc62947072fba6e`. Verification on `main` passed: targeted skill test 5/5, typecheck, build, and full test suite 23 files / 236 tests after rerunning outside the sandbox for Express listen permissions.

The Along Working Thread personal local plugin package was created at `/Users/james/plugins/along-working-thread` with a personal marketplace entry. Plugin validation and installability checks passed. On 2026-06-21, subjective fresh-session validation passed for resume, quiet ordinary requests, medium drift, high-impact drift challenge, and confirmed-switch write-back behavior.

The repo-contained Along Working Thread source package was added under `plugins/along-working-thread` while preserving `.agents/skills/along-working-thread` as the V1 source of truth. Verification covers targeted skill/package tests, plugin manifest validation, and exact source/package drift checking through `npm run verify:plugin-package`. This pass did not add automatic installation, public marketplace release, Core/MCP, runtime, presence, adapters, Memory v2, relationship modes, or delegation.

After repo-contained packaging passed, the main session approved continuing into Along Core/MCP Minimal Contract design. This approval is for contract design only, not real MCP server implementation, runtime, background autonomy, presence, adapters, Memory v2, relationship modes, delegation, or write delegation.

The Along Core/MCP Minimal Contract was implemented as a type-only contract in `src/core/working-thread-contract.ts`, with behavior-critical examples in the design spec and tests in `tests/core/working-thread-contract.test.ts`. Verification covers operation names, section-shaped Working Thread schemas, actionable summaries, drift classification, structured wrap-up drafts, section patch proposals, explicit confirmation envelopes, stale proposal conflicts, and shared operation result envelopes. This pass did not implement a real MCP server, storage, runtime, watcher, scheduler, notification, presence surface, LLM call, adapter, Memory v2, relationship mode, delegation, or write delegation.

The type-only Along Core/MCP Minimal Contract was fast-forward merged into `main` at `f49a576e0613b3251294d004c1e7db00ad4b8439`. Verification on merged `main` passed: targeted contract test 7/7, typecheck, build, and full test suite 24 files / 247 tests after rerunning outside the sandbox for Express listen permissions. The next recommended stage is Core/MCP Minimal Server Design, with implementation still requiring a separate approved pass.

The main session approved the Core/MCP Minimal Server Design direction: design a real but extremely small MCP server shape rather than another contract-only layer. The server should expose Working Thread behavior to existing agents while staying docs-backed, non-autonomous, and free of background runtime, scheduling, presence, adapters, Memory v2, relationship modes, delegation, and write delegation. Implementation is not approved yet.

The main session approved docs-backed storage for the Minimal MCP Server V1 data source. The server should read and write `docs/along/working-threads/*.md` directly, preserving reviewability and git diff visibility. `.along/` local state remains deferred until a later runtime or presence layer genuinely needs structured local state.

The main session approved a Resources + Tools MCP exposure shape for Minimal Server V1. Working Thread summaries and full records should both be exposed as MCP resources. Summary resources support quiet overview and lightweight attention; full record resources support deeper judgment, drift classification, wrap-up drafting, and confirmed write-back. The server tool set should be action-only: `classifyDrift`, `draftWrapUp`, `proposeWorkingThreadUpdate`, and `applyConfirmedWorkingThreadUpdate`. Read/list behavior should be represented through resources rather than duplicated as tools. MCP prompts are deferred because they risk duplicating or blurring the current skill/plugin behavior.

The main session approved the LLM boundary for Minimal Server V1: the server should not call an LLM, require an API key, or own model judgment in V1. It should rely on the calling agent for natural-language understanding while providing structured docs-backed coordination, proposals, confirmation validation, and write-back mechanics. The design may leave a future extension point for an optional LLM provider, but that provider must not be part of the V1 implementation.

The main session approved confirmed write-back for Minimal Server V1. This means `applyConfirmedWorkingThreadUpdate` may write durable Working Thread docs, but only when it receives explicit confirmation evidence for a specific proposal. The server must reject missing confirmation, reject stale proposals as conflicts, limit writes to `docs/along/working-threads/`, and apply only approved section patches. This approval does not allow silent writes, arbitrary file edits, full-file rewrites, source edits, delegation writes, or background autonomy.

The main session approved malformed record behavior for Minimal Server V1. The server may expose malformed Working Thread records as partial resources with warnings so context is not lost. It must reject confirmed write-back for malformed records until the required Working Thread structure is repaired. The server should not auto-repair or rewrite malformed Markdown in V1.

The main session approved stdio as the Minimal MCP Server V1 launch and transport shape. The server should be launched by the MCP client as a local stdio process. It should not open an HTTP/SSE port, run as a background daemon, or claim always-on presence/runtime behavior in V1.

The main session approved explicit workspace root binding for Minimal Server V1. The stdio server should require a workspace root argument, such as `--workspace /path/to/repo`, and should read/write only that repo's `docs/along/working-threads/` directory. It should not infer the target repo from `process.cwd()` because confirmed write-back makes accidental workspace selection too risky.

The main session approved Minimal Server V1 file organization. Keep `src/core/working-thread-contract.ts` as the pure contract layer. Add MCP-specific implementation under `src/mcp/`, including the stdio server adapter, docs-backed Working Thread store, Markdown parsing, and section patching. Do not create a new package or place MCP server behavior inside `src/core/` for V1.

The main session approved using a standard MCP SDK for Minimal Server V1 implementation rather than hand-rolling the protocol. This keeps the server closer to real MCP client behavior and avoids inventing protocol handling. Any new SDK dependency must still be explicitly approved during the implementation phase before it is installed or added.

The main session approved a repo-level npm script as the Minimal Server V1 launch entry. The intended shape is something like `npm run mcp:working-thread -- --workspace /path/to/repo`. Do not add a package bin, formal CLI, or public distribution command in V1.

The Core/MCP Minimal Server Design spec at `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-server-design.md` was approved by the user on 2026-06-22. The implementation plan was written at `docs/superpowers/plans/2026-06-22-along-core-mcp-minimal-server.md`. The user approved using a new Subagent-Driven focused execution session. No push, merge, worktree deletion, or history rewrite is approved. Dependency installation for the MCP SDK still requires an explicit request from the focused execution session.

The Core/MCP Minimal Server was implemented as a docs-backed stdio MCP server under `src/mcp/`. It exposes Working Thread summaries and records as resources and action-only tools for drift classification, wrap-up drafting, update proposals, and confirmed section-patch write-back. Verification passed targeted MCP tests, contract tests, typecheck, build, and full tests. This pass did not add HTTP/SSE transport, background runtime, `.along/` state, LLM calls, prompts, adapters, Memory v2, relationship modes, delegation, or full-file rewrites.

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

2026-06-21 Core/MCP minimal contract stale proposal conflict decision:

- If `applyConfirmedWorkingThreadUpdate` receives a stale `baseVersion` or `baseLastUpdated`, it should return a conflict and must not apply the update.
- Conflict results should include `status: conflict`, `reason`, `currentThreadSummary`, `staleProposal`, and `recommendedAction: regenerateProposal`.
- Do not force-apply stale proposals because the user approved changes against an older thread state.
- Do not auto-merge stale proposals in the minimal contract because merge semantics would introduce runtime/storage complexity and could silently alter judgment or boundary sections.
- The caller should regenerate a fresh proposal against the current thread state and ask for user confirmation again when needed.

2026-06-21 Core/MCP minimal contract operation result envelope decision:

- Use a shared minimal result envelope across Core/MCP contract operations.
- Result fields should include `status: ok | needsConfirmation | conflict | rejected | error`, `operation`, optional `threadId`, optional `data`, optional `message`, optional `reason`, and optional `recommendedAction`.
- This keeps success, confirmation gates, conflicts, rejections, and errors consistent across operations without introducing runtime telemetry.
- Do not let each operation invent unrelated result shapes because future adapters would become harder to implement and test.
- Do not add rich trace, confidence, timing, or debug telemetry in the minimal contract because that belongs to later runtime or observability layers.

2026-06-21 Core/MCP minimal contract file organization decision:

- The first contract implementation should use one standalone TypeScript contract file plus a Markdown spec.
- The TypeScript file should be `src/core/working-thread-contract.ts`.
- The TypeScript file should contain only types, operation signatures, and constants; it must not implement storage, an MCP server, runtime behavior, LLM calls, watchers, or adapters.
- The Markdown spec should explain semantics, boundaries, examples, and non-goals.
- Do not use a docs-only contract because future implementation could drift from the written design too easily.
- Do not introduce a new package such as `packages/along-core-contract` in the minimal pass because that would push the work toward SDK/package management before the contract proves stable.

2026-06-21 Core/MCP minimal contract validation strategy decision:

- Validate the minimal contract with type-level tests plus spec examples.
- Tests should cover contract types, operation result shape, confirmation envelope examples, conflict examples, and behavior-critical operation examples.
- The Markdown spec should include readable examples that explain expected contract behavior without requiring an MCP server.
- Do not rely on document review alone because the TypeScript contract and written spec could drift.
- Do not add end-to-end MCP smoke tests in this pass because that would require real MCP server implementation and exceed the minimal contract boundary.

2026-06-21 Core/MCP minimal contract behavior examples decision:

- Spec examples should focus on behavior-critical cases rather than only happy paths or exhaustive operation combinations.
- Cover resume/list behavior where `listWorkingThreads` returns actionable summaries.
- Cover quietness where `classifyDrift` returns `none` with `answerDirectly`.
- Cover medium drift where `classifyDrift` returns `medium` with `answerWithBoundary`.
- Cover high-impact drift where `classifyDrift` returns `high` with `askConfirmation`.
- Cover wrap-up drafting where `draftWrapUp` returns a structured draft.
- Cover update proposal generation where `proposeWorkingThreadUpdate` returns a section patch proposal.
- Cover confirmed write-back where `applyConfirmedWorkingThreadUpdate` succeeds with a valid confirmation envelope.
- Cover stale write-back where `applyConfirmedWorkingThreadUpdate` returns `conflict` and does not write.
- Do not limit examples to happy paths because that would miss the boundaries that define Along's self-initiation and companionship behavior.
- Do not make examples exhaustive because the minimal contract should stay readable and focused.

2026-06-21 Core/MCP minimal contract spec status:

- The main session approved writing the formal design spec.
- The spec path is `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md`.
- The spec was approved and used to plan, implement, verify, and merge the type-only contract implementation.
- No real MCP server, runtime, adapter, storage, or presence work has been approved yet.
- After implementation, the expected verification gate is `npm test -- tests/core/working-thread-contract.test.ts`, `npm run typecheck`, `npm run build`, full `npm test`, and `rg -n "createServer|listen\\(|Mcp|MCPServer|\\.along|watch\\(|setInterval|setTimeout|fetch\\(|delegateToAgent|Hermes|Claude|Memory v2|relationship" src/core/working-thread-contract.ts tests/core/working-thread-contract.test.ts`.

2026-06-21 Core/MCP minimal contract implementation plan status:

- The user approved the formal design spec.
- The implementation plan path is `docs/superpowers/plans/2026-06-21-along-core-mcp-minimal-contract.md`.
- The approved plan has been executed and merged into `main` as the type-only implementation.

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
