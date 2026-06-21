# Along Core/MCP Minimal Contract Design

Date: 2026-06-21
Status: Draft for user review

## Summary

Along should define a minimal Core/MCP contract for Working Thread continuity before implementing a real MCP server, runtime, watcher, adapter, or desktop presence layer.

This pass creates the smallest stable contract that future Codex plugins, other agent adapters, and local runtime layers can share. It focuses on Working Thread shape, drift classification, wrap-up drafting, confirmed write-back, conflict handling, and validation examples.

The contract is not the full Along runtime. It is a boundary-setting layer that makes the current skill-first behavior precise enough to reuse later.

## Product Context

Along is moving toward a local-first, open-source companion layer for existing agents. It should help the agents users already rely on gain continuity, turn-bound self-initiation, drift awareness, wrap-up discipline, and eventually deeper companionship.

The current layer remains narrow:

- Codex-first and skill-first in current behavior.
- Docs-backed for Working Thread continuity.
- Turn-bound rather than background autonomous.
- Focused on preserving judgment, boundaries, and next steps across active sessions.

This contract should support that direction without implying that Along already has background autonomy, always-on presence, cross-agent memory, emotional companionship, or a general coding agent runtime.

## Goals

- Define reusable TypeScript contract types for Working Thread continuity.
- Define operation names and input/output shapes for the minimal Core/MCP surface.
- Define structured drift classification that maps to concrete next actions.
- Define structured wrap-up drafting and update proposal behavior.
- Require explicit confirmation evidence before durable write-back.
- Define stale proposal conflict behavior that refuses unsafe writes.
- Provide behavior-critical examples for resume, quietness, drift, wrap-up, proposal, confirmed write-back, and stale write conflict.
- Validate the contract with type-level tests and readable spec examples.

## Non-Goals

This pass must not implement:

- a real MCP server;
- MCP tool registration;
- storage or persistence logic;
- `.along/` as the Working Thread store;
- background runtime, watcher, scheduler, notifications, or out-of-session attention;
- local, browser, desktop, or ambient presence surface;
- LLM calls;
- Hermes, Claude Code, or other agent adapters;
- delegation, write delegation, or conductor workflows;
- Memory v2;
- relationship modes, tone settings, or emotional simulation;
- a new package such as `packages/along-core-contract`;
- public SDK or release packaging.

## File Organization

The implementation should add one standalone TypeScript contract file and this Markdown spec.

Expected TypeScript file:

```text
src/core/working-thread-contract.ts
```

The TypeScript file should contain only:

- exported string literal unions;
- exported interfaces and type aliases;
- operation name constants or operation signature types;
- small example-safe constants if useful for tests.

It must not contain:

- file IO;
- storage adapters;
- MCP server setup;
- tool registration;
- runtime behavior;
- LLM calls;
- watchers or schedulers;
- notification code;
- agent adapter code.

## Contract Operations

The first-pass operation set is:

```text
readWorkingThread
listWorkingThreads
classifyDrift
draftWrapUp
proposeWorkingThreadUpdate
applyConfirmedWorkingThreadUpdate
```

### readWorkingThread

Returns a full `WorkingThread` by id. This is for cases where an agent needs the complete judgment, boundary, drift triggers, next move, and open questions.

It should not create, mutate, archive, merge, or delete threads.

### listWorkingThreads

Returns `WorkingThreadSummary[]`. This supports resume, lightweight attention, and deciding which thread is relevant without loading every full record.

Summaries are compact views over full records. They are not durable record replacements.

### classifyDrift

Classifies the current user request or proposed direction against a Working Thread.

It should return a drift level, explanation, recommended action, and whether user confirmation is required.

### draftWrapUp

Creates a structured wrap-up draft from a session or phase. It prepares the judgment changes that may later become a Working Thread update, but it does not write.

### proposeWorkingThreadUpdate

Turns a wrap-up draft or proposed change into a section-level patch proposal. It should show what would change, why, and what the user is being asked to approve.

It does not write.

### applyConfirmedWorkingThreadUpdate

Applies a section patch only when the caller provides explicit confirmation evidence. It must reject stale proposals and must not support silent durable write-back.

## Excluded Operations

The minimal contract must exclude destructive, memory, notification, scheduling, and delegation operations.

Excluded examples:

```text
deleteWorkingThread
archiveWorkingThread
mergeWorkingThreads
searchMemory
notifyUser
scheduleAttention
delegateToAgent
```

These may become future capabilities, but including them now would pull the design into runtime, memory, automation, or delegation layers too early.

## WorkingThread Schema

Use a section-shaped `WorkingThread` model as the primary schema.

Core fields:

```text
id
title
status
lastUpdated
whyThisMatters
currentJudgment
boundary
driftTriggers
nextLikelyMove
lastWrapUp
openQuestions
```

The schema should map closely to the current Working Thread Markdown record sections. This preserves Along's core semantics: shared judgment, boundary, next move, and unresolved questions.

Do not use a generic body-only document model as the primary schema. That would lose the judgment-oriented structure that makes Along useful.

Do not use an event-sourced model in the minimal pass. Event sourcing may be derived later from section changes if runtime or audit needs justify it.

## WorkingThreadSummary Schema

Use a brief-but-actionable `WorkingThreadSummary` model for listing, resume, and lightweight attention decisions.

Core fields:

```text
id
title
status
lastUpdated
currentJudgmentBrief
nextLikelyMove
riskLevel
needsUserDecision
```

This should be enough for an agent to decide whether a thread matters now without pulling the full record into every interaction.

Do not use an extreme minimal index as the primary summary because the agent would lack enough context to act.

Do not return near-complete thread content in summaries because it would make resume and listing too noisy.

## Drift Classification

`classifyDrift` should return a level, reason, recommended action, and explicit confirmation requirement.

Drift levels:

```text
none
low
medium
high
```

Recommended actions:

```text
answerDirectly
answerWithBoundary
askConfirmation
proposeWrapUp
```

The result should include:

```text
driftLevel
reason
recommendedAction
needsUserConfirmation
```

Mapping guidance:

- `none` + `answerDirectly`: ordinary request; do not force Working Thread ceremony.
- `low` + `answerDirectly` or `answerWithBoundary`: small tangent; answer while staying light.
- `medium` + `answerWithBoundary`: useful related discussion; preserve boundary without treating it as a direction switch.
- `high` + `askConfirmation`: real direction switch; do not plan or write until the user confirms.
- `proposeWrapUp`: useful when a phase ends or a judgment materially changes.

Do not use a binary drift result because it cannot distinguish quietness, medium drift, and high-impact direction shifts.

Do not use a numeric score in the minimal contract because it creates false precision without improving the next action.

## Wrap-Up Draft

`draftWrapUp` should return a structured draft rather than plain text or a full thread replacement.

Core fields:

```text
summary
judgmentChange
boundaryChange
nextLikelyMove
openQuestionsChange
requiresConfirmation
```

`requiresConfirmation` should be `true` for drafts intended for durable write-back.

The output should be suitable input for `proposeWorkingThreadUpdate`, so the user can see which Working Thread sections may change before anything is written.

Do not use plain text as the primary output because later callers would need ad hoc parsing to update specific sections.

Do not generate a complete replacement `WorkingThread` because it risks overwriting existing judgment or boundaries.

## Update Proposal

`proposeWorkingThreadUpdate` should return a section patch proposal.

Core fields:

```text
proposalId
threadId
baseLastUpdated
baseVersion?
changes[]
confirmationPrompt
riskLevel
```

Each `changes[]` item should include:

```text
section
currentValue
proposedValue
rationale
```

The proposal must make it clear:

- which section will change;
- what the current value is;
- what the proposed replacement is;
- why the change is being suggested.

Do not use a plain-text proposal as the primary shape because future tools and adapters could not reliably inspect or validate it.

Do not use full `WorkingThread` replacement updates by default because they risk overwriting existing judgment, boundaries, or open questions.

## Confirmation Envelope

`applyConfirmedWorkingThreadUpdate` must require an explicit confirmation envelope.

Core fields:

```text
proposalId
approved
approvedAt
approvedBy
sourceSessionId
sourceTurnId
approvedIntent
baseLastUpdated
baseVersion?
```

`approved` must be `true`.

`approvedBy` should be `user` in the minimal contract.

The envelope must prove that the user approved this specific proposal, in this source context, against this known thread state.

`baseLastUpdated` is required because the current Working Thread record already has `lastUpdated`. `baseVersion` is optional for future stores that provide a stronger version id. If `baseVersion` is present, stale checks should prefer it over `baseLastUpdated`.

Do not accept `confirmed: true` alone because it cannot prove what the user approved.

Do not use free-text confirmation as the primary proof shape because adapters could not reliably validate it.

Future versions may let users configure write policy, but the minimal contract should keep explicit confirmation as the default requirement.

## Conflict Handling

If `applyConfirmedWorkingThreadUpdate` receives a stale `baseVersion` when present, or otherwise a stale `baseLastUpdated`, it must return a conflict and must not apply the update.

Conflict results should include:

```text
status: conflict
reason
currentThreadSummary
staleProposal
recommendedAction: regenerateProposal
```

The caller should regenerate a fresh proposal against the current thread state and ask for confirmation again when needed.

Do not force-apply stale proposals because the user approved changes against an older thread state.

Do not auto-merge stale proposals in the minimal contract because merge semantics would introduce runtime and storage complexity and could silently alter judgment or boundary sections.

## Operation Result Envelope

Use a shared minimal result envelope across operations.

Core fields:

```text
status: ok | needsConfirmation | conflict | rejected | error
operation
threadId?
data?
message?
reason?
recommendedAction?
```

This keeps success, confirmation gates, conflicts, rejections, and errors consistent without introducing runtime telemetry.

Do not let each operation invent unrelated result shapes because future adapters would become harder to implement and test.

Do not add rich trace, confidence, timing, or debug telemetry in the minimal contract. Those belong to later runtime or observability layers.

## Data Flow

### Resume

1. Agent calls `listWorkingThreads`.
2. Contract returns actionable summaries.
3. Agent decides which thread to restore.
4. Agent calls `readWorkingThread` when it needs the full thread.
5. Agent briefs the user with current judgment and next likely move.

### Ordinary Quietness

1. User asks an ordinary repo question.
2. Agent classifies against the active thread.
3. `classifyDrift` returns `none` with `answerDirectly`.
4. Agent answers directly and does not force Working Thread ceremony.

### Direction Shift

1. User proposes a high-impact change of direction.
2. `classifyDrift` returns `high` with `askConfirmation`.
3. Agent asks the user to confirm the direction switch.
4. Agent does not plan or write the drifted direction until confirmation exists.

### Wrap-Up And Confirmed Write-Back

1. Agent calls `draftWrapUp`.
2. Agent calls `proposeWorkingThreadUpdate`.
3. User reviews the section patch proposal.
4. User explicitly approves the proposal.
5. Agent calls `applyConfirmedWorkingThreadUpdate` with a confirmation envelope.
6. Contract applies only if the base version is current.

## Behavior-Critical Examples

The spec examples should cover behavior-critical cases rather than only happy paths or exhaustive operation combinations.

Required examples:

- Resume/list: `listWorkingThreads` returns actionable summaries.
- Quietness: `classifyDrift` returns `none` with `answerDirectly`.
- Medium drift: `classifyDrift` returns `medium` with `answerWithBoundary`.
- High-impact drift: `classifyDrift` returns `high` with `askConfirmation`.
- Wrap-up: `draftWrapUp` returns a structured draft.
- Proposal: `proposeWorkingThreadUpdate` returns a section patch proposal.
- Confirmed write-back: `applyConfirmedWorkingThreadUpdate` succeeds with a valid confirmation envelope.
- Stale write-back: `applyConfirmedWorkingThreadUpdate` returns `conflict` and does not write.

Do not make examples exhaustive. The contract should remain readable and focused on the behavior boundaries that matter for Along's self-initiation and companionship.

## Validation Strategy

Validate this pass with type-level tests plus spec examples.

Expected tests should cover:

- exported contract types compile;
- operation names are stable;
- operation result envelope supports `ok`, `needsConfirmation`, `conflict`, `rejected`, and `error`;
- `WorkingThread` requires the section-shaped fields;
- `WorkingThreadSummary` includes actionable summary fields;
- drift classification supports the approved levels and recommended actions;
- wrap-up draft examples are structured;
- update proposals include section patch details;
- confirmation envelope examples include explicit approval evidence;
- stale proposal examples return conflict instead of write success.

The tests should not start a server, register MCP tools, call an LLM, read or write `.along/`, or depend on external network access.

Run at least:

```text
npm test -- tests/core/working-thread-contract.test.ts
npm run typecheck
```

If the implementation touches exports consumed by the rest of the repo, run the broader relevant test set and build as appropriate.

## Risks

- The contract may look like real Core/MCP implementation. Mitigation: keep file content to types and operation signatures only.
- The schema may overfit the current Markdown record. Mitigation: keep fields section-shaped but not Markdown-specific.
- Confirmation flow may feel heavy. Mitigation: keep it mandatory only for durable write-back, not for ordinary answers.
- Summary fields may invite attention scoring too early. Mitigation: keep `riskLevel` and `needsUserDecision` descriptive, not a scheduler.
- Examples may become a test matrix. Mitigation: cover behavior-critical cases only.

## Future Directions

Deferred layers remain valid after this contract is stable:

- real MCP server implementation;
- `.along/` or another local Working Thread store;
- Codex, Hermes, Claude Code, or other adapters;
- background runtime, watcher, scheduler, and notifications;
- local or desktop presence surface;
- Memory v2 and relationship memory;
- relationship modes, tone preferences, and emotional simulation;
- delegation and conductor workflows;
- richer event log or audit model derived from section changes.

Those future layers should depend on this contract rather than being pulled into the minimal contract pass.
