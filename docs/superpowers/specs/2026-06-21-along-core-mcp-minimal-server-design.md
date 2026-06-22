# Along Core/MCP Minimal Server Design

Date: 2026-06-21
Status: Approved and implemented

## Summary

Along should add a real but extremely small MCP server layer for Working Thread continuity.

This pass moves beyond the type-only Core/MCP contract by defining an actual stdio MCP server shape. The server should expose docs-backed Working Thread records to existing agents through MCP resources and tools, while preserving the core Along boundaries: no background runtime, no always-on presence, no scheduler, no adapter expansion, no Memory v2, no relationship modes, and no LLM calls.

The server is not a standalone agent. It is a local coordination layer that lets agents such as Codex interact with Along's Working Thread continuity in a structured way.

## Product Context

Along's current direction is to become a local-first, open-source companion layer for existing agents. It should help the tools users already rely on gain continuity, turn-bound self-initiation, drift awareness, wrap-up discipline, and eventually deeper companionship.

The current validated path is:

- Codex-first;
- skill-first;
- docs-backed;
- turn-bound rather than background autonomous;
- focused on Working Thread continuity rather than general task execution.

The type-only Core/MCP Minimal Contract already defines shared Working Thread types, operation shapes, confirmation envelopes, section patch proposals, and stale proposal conflict behavior. This pass should implement the smallest real MCP server shape that uses those concepts without expanding into a full runtime.

## Goals

- Expose Working Thread summaries and full records through MCP resources.
- Expose only judgment or state-change actions through MCP tools.
- Keep the data source docs-backed under `docs/along/working-threads/`.
- Support confirmed write-back with strict confirmation envelope validation.
- Apply only section-level patches to Working Thread Markdown.
- Reject stale proposals rather than force-applying or auto-merging them.
- Allow malformed records to be read partially with warnings while rejecting writes until repaired.
- Provide a stdio MCP server launch path with an explicit workspace root.
- Use a standard MCP SDK rather than hand-rolling protocol handling.
- Add a repo-level npm script for local validation and MCP client configuration.

## Non-Goals

This pass must not implement:

- a background runtime, watcher, scheduler, or notification system;
- HTTP, SSE, local-port, daemon, or always-on server behavior;
- `.along/` local state as the Working Thread store;
- LLM calls, API keys, model routing, or provider configuration;
- MCP prompts;
- Hermes, Claude Code, or other agent-specific adapters;
- delegation, write delegation, or conductor workflows;
- Memory v2;
- relationship modes, tone settings, or emotional simulation;
- package bin, formal CLI distribution, public marketplace release, or a new package;
- full-file Markdown rewrites;
- automatic repair of malformed Working Thread documents;
- arbitrary file edits outside `docs/along/working-threads/`.

## Approved Server Shape

The server should be a stdio MCP server launched by an MCP client or a repo npm script.

It should receive an explicit workspace root argument:

```text
--workspace /path/to/repo
```

The server must read and write only:

```text
<workspace>/docs/along/working-threads/
```

It must not infer the target repo from `process.cwd()`. Confirmed write-back makes accidental workspace selection too risky.

The server should not open an HTTP/SSE port. It should not run as a background daemon. It should not claim background autonomy or presence behavior.

## MCP Exposure Model

Use MCP resources plus MCP tools.

### Resources

Resources represent readable Working Thread state.

Expose two resource levels:

1. summary resources;
2. full record resources.

Summary resources support quiet overview, resume, and lightweight attention decisions. Full record resources support deeper judgment, drift classification, wrap-up drafting, proposal creation, and confirmed write-back.

Do not expose read/list as server tools in V1. Reading belongs to resources.

The exact MCP SDK API may influence naming, but the conceptual resource set should be:

```text
working-thread://summaries
working-thread://threads/{threadId}/summary
working-thread://threads/{threadId}/record
```

`working-thread://summaries` returns all visible summaries. The per-thread summary resource returns one summary. The full record resource returns the complete parsed Working Thread, raw source metadata if useful, and parse warnings when applicable.

### Tools

Tools represent judgment or state-change actions.

The V1 tool set is:

```text
classifyDrift
draftWrapUp
proposeWorkingThreadUpdate
applyConfirmedWorkingThreadUpdate
```

Do not add:

```text
createWorkingThread
deleteWorkingThread
archiveWorkingThread
mergeWorkingThreads
searchMemory
notifyUser
scheduleAttention
delegateToAgent
```

Those operations would pull the design into creation workflows, memory, runtime, notifications, scheduling, or delegation before the minimal server layer is proven.

### Prompts

Do not expose MCP prompts in V1.

Prompt behavior currently belongs to the skill/plugin layer. Adding MCP prompts now would blur the line between the behavior guidance layer and the server capability layer.

## Data Source

The Minimal Server V1 data source is docs-backed.

The canonical record directory is:

```text
docs/along/working-threads/
```

Each Working Thread record should continue to use the established section shape:

```text
Title
Status
Last updated
Why This Matters
Current Judgment
Boundary
Drift Triggers
Next Likely Move
Last Wrap-Up
Open Questions
```

Do not introduce `.along/` local state in this pass. `.along/` may become useful later for runtime state, presence, or higher-frequency local data, but this server pass should keep continuity transparent, reviewable, and git-diffable.

## LLM Boundary

The server must not call an LLM in V1.

It should not require:

- an API key;
- model configuration;
- provider routing;
- network access for model calls;
- nondeterministic model behavior in tests.

Natural-language understanding should remain with the calling agent. The server should provide structured local coordination: parsing docs, exposing resources, validating inputs, shaping proposals, enforcing confirmation, and applying approved section patches.

The design may leave a future extension point for optional LLM providers, but that provider must not be part of this V1 server.

## Confirmed Write-Back

`applyConfirmedWorkingThreadUpdate` is allowed in V1, but only under strict constraints.

The tool must require an explicit confirmation envelope for a specific proposal. The envelope should include the already-approved contract fields:

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

Rules:

- `approved` must be `true`.
- `approvedBy` must represent the user in V1.
- `proposalId` must match the proposal being applied.
- `baseLastUpdated` or `baseVersion` must match the current Working Thread state.
- missing confirmation must return `rejected`;
- stale proposal state must return `conflict`;
- malformed target records must return `rejected` or `error` and must not be written.

This is the core safety line: the server may write durable Working Thread docs only after a user-approved proposal is provided.

## Write Mutation Shape

Confirmed write-back must apply section patches only.

`proposeWorkingThreadUpdate` should produce changes where each item names:

```text
section
currentValue
proposedValue
rationale
```

`applyConfirmedWorkingThreadUpdate` must apply only the approved section patches. It must not rewrite the whole Markdown file.

Allowed section patch targets are the established Working Thread sections, such as:

```text
Current Judgment
Boundary
Next Likely Move
Last Wrap-Up
Open Questions
```

The implementation should preserve unrelated sections and original document structure as much as practical.

Do not support full file replacement in V1. Do not support arbitrary Markdown editing in V1.

## Malformed Record Behavior

The parser should be tolerant for reads and strict for writes.

If a Working Thread record is malformed, the server may expose it as a partial resource with warnings. This prevents context from disappearing because of a formatting issue.

Examples of malformed conditions:

- missing required section;
- duplicate required section;
- invalid or missing status line;
- missing or invalid last-updated value;
- section ordering or heading structure that prevents reliable patching.

For malformed records:

- summary resources may include warnings and partial extracted fields;
- full record resources may include raw content plus parse warnings;
- write-back must be rejected until the required structure is repaired;
- the server must not auto-repair or rewrite the file in V1.

## Stale Proposal Conflict

If the Working Thread changed after a proposal was created, `applyConfirmedWorkingThreadUpdate` must reject the write as a conflict.

Conflict results should include:

```text
status: conflict
reason
currentThreadSummary
staleProposal
recommendedAction: regenerateProposal
```

Do not force-apply stale proposals. Do not auto-merge stale proposals in V1. A calling agent should regenerate the proposal against the current record and ask for confirmation again.

## File Organization

Keep `src/core/working-thread-contract.ts` as the pure contract layer.

Add MCP-specific implementation under:

```text
src/mcp/
```

Expected responsibilities:

```text
src/mcp/working-thread-server.ts
```

MCP server setup, stdio transport wiring, resource registration, and tool registration.

```text
src/mcp/working-thread-docs-store.ts
```

Workspace-root validation, Working Thread file discovery, scoped file reads, and scoped section-patch writes.

```text
src/mcp/working-thread-markdown.ts
```

Markdown parsing, summary extraction, malformed-record warnings, and section patch application.

Exact file names can change during implementation if the implementation plan justifies it, but the boundary should remain: `src/core/` is contract-only, `src/mcp/` owns MCP and docs-backed behavior.

Do not introduce a new package such as `packages/along-mcp-server` in this pass.

## Dependency Strategy

Use a standard MCP SDK for stdio transport, resource registration, and tool registration.

Do not hand-roll the MCP protocol when a standard MCP SDK is available. The purpose of this pass is to validate a real MCP server shape, not a custom protocol implementation.

Any new dependency must still be explicitly approved during implementation before installation or `package.json` changes. The implementation session should state:

- package name;
- why it is needed;
- whether it is project-local;
- whether it affects `package.json` and `package-lock.json`;
- any network or install implications.

## Launch Exposure

Expose the server through a repo-level npm script named `mcp:working-thread`.

Intended shape:

```text
npm run mcp:working-thread -- --workspace /path/to/repo
```

The script may point to the implementation entry file chosen in the implementation plan, but the user-facing script name should be `mcp:working-thread`. V1 should avoid package bin, global install, public CLI, or formal distribution command.

The script is for local validation and MCP client configuration. It is not a public product surface yet.

## Data Flows

### Resume / Lightweight Attention

1. MCP client lists Working Thread summary resources.
2. Calling agent reads a relevant summary.
3. Calling agent decides whether to read the full record.
4. Calling agent briefs the user with current judgment and next likely move.

The server does not decide when to interrupt the user. It exposes the state needed for the calling agent to make that turn-bound decision.

### Full Thread Review

1. Calling agent opens a full Working Thread resource.
2. Server parses the Markdown record.
3. Server returns structured fields, raw or normalized content as appropriate, and warnings if the record is partially malformed.
4. Calling agent uses the record to continue the conversation.

### Drift Classification

1. Calling agent reads the relevant Working Thread full record.
2. Calling agent calls `classifyDrift` with the user request, current thread context, and proposed direction.
3. Server returns a structured result using the contract's drift level and recommended action.
4. Calling agent decides how to phrase the response.

Because V1 server does not call an LLM, `classifyDrift` must not pretend to semantically understand arbitrary conversation by itself. It may normalize caller-provided analysis, apply deterministic boundary checks, and return a contract-shaped result. The calling agent remains responsible for natural-language judgment.

### Wrap-Up Proposal

1. Calling agent calls `draftWrapUp` with phase-end context.
2. Server returns a structured draft.
3. Calling agent calls `proposeWorkingThreadUpdate`.
4. Server returns section patch proposal details and a confirmation prompt.
5. Calling agent shows the proposal to the user.

Because V1 server does not call an LLM, `draftWrapUp` must not summarize raw conversation by itself. The calling agent should provide the session summary and any judgment, boundary, next-step, or open-question changes it believes should be recorded. The server shapes that input into the approved contract format.

### Confirmed Write-Back

1. User explicitly approves the proposal.
2. Calling agent calls `applyConfirmedWorkingThreadUpdate` with a confirmation envelope.
3. Server verifies workspace scope, target record validity, proposal identity, confirmation evidence, and base version.
4. Server applies only approved section patches.
5. Server returns the updated Working Thread summary or full record.

## Error Handling

Use the shared operation result envelope from the type-only contract:

```text
status: ok | needsConfirmation | conflict | rejected | error
operation
threadId?
data?
message?
reason?
recommendedAction?
```

Expected error classes:

- `rejected`: missing confirmation, invalid workspace root, write attempt outside allowed path, malformed record write attempt.
- `conflict`: stale proposal or changed `baseLastUpdated`/`baseVersion`.
- `error`: unexpected parse, IO, SDK, or registration failure.

Errors should be explicit enough for the calling agent to explain what happened without inventing a reason.

## Validation Strategy

Validation should cover server behavior without requiring background services, network model calls, or `.along/` state.

Expected tests:

- Markdown parser extracts full Working Thread fields.
- Markdown parser extracts summaries.
- Malformed records produce warnings and partial read results.
- Malformed records reject write-back.
- Section patch application changes only approved sections.
- Full-file rewrite is not supported.
- Stale proposals return `conflict`.
- Missing confirmation returns `rejected`.
- Writes outside `docs/along/working-threads/` are rejected.
- Explicit workspace root is required.
- MCP resource registration exposes summary and full record resources.
- MCP tool registration exposes only the four approved tools.
- No MCP prompts are registered.

Expected verification commands after implementation:

```text
npm test -- tests/core/working-thread-contract.test.ts
npm test -- tests/mcp/working-thread-markdown.test.ts
npm test -- tests/mcp/working-thread-server.test.ts
npm run typecheck
npm run build
```

If the MCP SDK or repo wiring affects broader behavior, run the full test suite. If full tests hit known sandbox restrictions for local server binding, rerun only after appropriate approval and document the reason.

## Risks

- The server may be mistaken for real background autonomy. Mitigation: stdio only, no daemon, no scheduler, no notifications, no presence claims.
- Confirmed write-back may be too powerful for V1. Mitigation: explicit confirmation envelope, stale checks, section patches only, workspace scoping, and malformed-record write rejection.
- Docs-backed parsing may be brittle. Mitigation: tolerate reads with warnings, reject writes when structure is unreliable, and test malformed cases.
- MCP SDK dependency may introduce install friction. Mitigation: require explicit implementation-phase dependency approval and keep usage narrow.
- `classifyDrift` may appear smarter than it is without LLM calls. Mitigation: document that V1 relies on the calling agent for natural-language judgment.
- Resources and tools may duplicate the contract's read/list operations. Mitigation: server exposure uses resources for read/list while preserving the broader contract for future adapters.

## Future Directions

Deferred layers remain valid after this server is stable:

- `.along/` local state for runtime or presence needs;
- optional LLM provider for Along-owned judgment;
- MCP prompts if the skill/plugin boundary becomes clearer;
- package bin or formal CLI distribution;
- HTTP/SSE transport if a future client requires it;
- Codex, Hermes, Claude Code, or other specific adapters;
- background runtime, watcher, scheduler, and notifications;
- local or desktop presence surface;
- Memory v2 and relationship memory;
- relationship modes, tone preferences, and emotional simulation;
- delegation and conductor workflows.

Those layers should be designed as separate passes. They should not be pulled into the Minimal Server V1 implementation.
