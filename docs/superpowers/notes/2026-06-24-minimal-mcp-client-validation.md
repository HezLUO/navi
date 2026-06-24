# Minimal MCP Client Validation Report

Status: completed; initial schema finding resolved by follow-up
Date: 2026-06-24

## Goal

Validate the completed docs-backed stdio Minimal MCP Server through a real MCP SDK client, without adding new Core/MCP capability and without writing to the real Along repository during validation.

## Scope

Validated:

- stdio MCP server startup through `npm run mcp:working-thread -- --workspace <path>`;
- MCP resource listing and reading;
- MCP tool listing;
- action-tool behavior through a real SDK client;
- confirmed write-back and stale proposal conflict handling in a disposable workspace.

Not validated as product proof:

- background autonomy;
- living presence;
- emotional companionship;
- cross-agent continuity;
- HTTP/SSE transport;
- runtime scheduler/watcher;
- new Core/MCP capabilities.

## Method

A temporary MCP client script was created outside the repository:

```text
/private/tmp/along-mcp-client-validation.mjs
```

The initial validation script used the official MCP TypeScript SDK client and `StdioClientTransport` to spawn the Along server from the real repository:

```text
npm run mcp:working-thread -- --workspace "/Users/james/Codex Project/General Codex Project/Along"
```

The first sandboxed run failed because `tsx` attempted to create a local IPC pipe under the system temp directory and hit:

```text
listen EPERM
```

The validation was rerun with escalated permissions. This matches prior sandbox behavior seen in full test runs and does not indicate an MCP server failure.

The schema-alignment follow-up revalidation below used the isolated implementation worktree before merge.

## Initial Real Repository Result

Workspace:

```text
/Users/james/Codex Project/General Codex Project/Along
```

Server identity:

```json
{
  "name": "along-working-thread",
  "version": "0.1.0"
}
```

Resources exposed:

```text
working-thread://summaries
working-thread://threads/2026-06-18-existing-agent-self-initiation-layer/summary
working-thread://threads/2026-06-18-existing-agent-self-initiation-layer/record
```

Resource templates exposed:

```text
working-thread://threads/{threadId}/summary
working-thread://threads/{threadId}/record
```

Tools exposed:

```text
classifyDrift
draftWrapUp
proposeWorkingThreadUpdate
applyConfirmedWorkingThreadUpdate
```

No MCP prompts were involved in this validation.

## Initial Important Finding

The real Working Thread record was exposed as a partial/malformed record.

Target record:

```text
docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
```

MCP parser result:

```text
malformed: true
```

Warnings:

```text
Unknown Working Thread section heading: Validation Notes.
Unknown Working Thread section heading: Plan Audit.
Unknown Working Thread section heading: Deferred Capability Map.
Unknown Working Thread section heading: Packaging Positioning.
Unknown Working Thread section heading: Packaging Success Criteria.
Unknown Working Thread section heading: Packaging Metadata.
Unknown Working Thread section heading: Packaging Source Strategy.
```

Interpretation:

The server correctly exposed partial resource data with warnings, but it could not produce a complete `WorkingThread` object for action-tool write-back against the real record. This is consistent with the approved V1 boundary: malformed records should be readable as partial context but should not accept durable write-back until repaired.

This is not a server correctness failure. It is a schema/content alignment gap in our real Working Thread record.

## Disposable Write-Back Result

To avoid writing to the real repository, the validation created a disposable workspace under system temp and inserted a clean synthetic Working Thread record:

```text
validation-thread
```

Against that disposable workspace, real MCP client calls verified:

- `draftWrapUp` produced a confirmation-required draft.
- `proposeWorkingThreadUpdate` produced a proposal with section changes.
- `applyConfirmedWorkingThreadUpdate` accepted a valid confirmation envelope.
- The patched disposable record contained the expected validation text.
- Re-applying the same proposal returned a stale conflict.

Successful apply result:

```text
status: ok
operation: applyConfirmedWorkingThreadUpdate
threadId: validation-thread
```

Stale re-apply result:

```text
status: conflict
recommendedAction: regenerateProposal
reason: base version does not match current Working Thread content
```

No files in the real Along repository were modified by this write-back test.

## Verification State

Passed:

- stdio server startup through real SDK client after sandbox escalation;
- server identity and capability negotiation;
- resource listing;
- resource template listing;
- tool listing;
- summary resource read from real repository;
- full record resource read from real repository;
- malformed/partial warning exposure for real record;
- confirmed write-back in disposable workspace;
- stale proposal conflict handling in disposable workspace;
- no real repository write-back or write-claim file.

Partial / blocked:

- action-tool write-back against the real Working Thread record is blocked until the record is repaired or the parser/schema policy changes.

## Conclusion

Minimal MCP Server fresh-session client validation is functionally successful at the server/client layer, but it uncovered a real product/schema issue: our active Working Thread record has accumulated extra sections that the V1 parser treats as malformed.

The next step should not be new Core/MCP capability. The next step should be a Working Thread record/schema alignment decision.

## Recommended Next Step

Do a small **Working Thread Schema Alignment Pass** before further MCP expansion.

Decision to make:

- Keep V1 strict and move extra sections out of the active Working Thread record into separate notes; or
- Allow selected extra sections as non-mutated appendices while still preserving safe section-patch write-back.

Until that decision is made, the server should remain as implemented and should not be expanded into runtime, adapters, presence, or broader packaging.

## Schema Alignment Follow-Up

Date: 2026-06-24

The Working Thread schema alignment pass resolved the real-record malformed blocker.

Follow-up workspace:

```text
/Users/james/Codex Project/General Codex Project/Along-worktrees/working-thread-schema-alignment
```

The first follow-up run in the Codex sandbox failed with the known `tsx` IPC limitation:

```text
listen EPERM
```

The same MCP SDK client validation was rerun with escalated permissions because `tsx` needs to create a local IPC pipe under `/var/folders/.../tsx-501/*.pipe`.

Result:

- The active Working Thread record now keeps the canonical core before appendix sections.
- The parser treats appendix sections after the canonical core as read-only context.
- The active record parses as a complete `WorkingThread`.
- MCP resources can expose both the structured core and appendix-preserved full record context.
- Confirmed write-back remains limited to canonical sections.
- No new MCP tools, prompts, transports, runtime behavior, adapters, presence, or `.along/` state were added.

Revalidation evidence:

- Server identity remained `along-working-thread` version `0.1.0`.
- Resources remained `working-thread://summaries`, `working-thread://threads/2026-06-18-existing-agent-self-initiation-layer/summary`, and `working-thread://threads/2026-06-18-existing-agent-self-initiation-layer/record`.
- Resource templates remained `working-thread://threads/{threadId}/summary` and `working-thread://threads/{threadId}/record`.
- Tool names remained `classifyDrift`, `draftWrapUp`, `proposeWorkingThreadUpdate`, and `applyConfirmedWorkingThreadUpdate`.
- The active record reported `targetRecordMalformed: false`.
- Detected appendix headings were `Validation Notes`, `Plan Audit`, `Deferred Capability Map`, `Packaging Positioning`, `Packaging Success Criteria`, `Packaging Metadata`, and `Packaging Source Strategy`.
- `classifyDrift`, `draftWrapUp`, and `proposeWorkingThreadUpdate` operated against the aligned real record without applying any real repository write-back.
- Disposable workspace write-back returned `status: ok` for `applyConfirmedWorkingThreadUpdate`.
- Re-applying the same disposable proposal returned `status: conflict`.
- The disposable patched record contained the validation text and preserved `## Validation Notes`.
- No real repository write-back was applied by the follow-up validation script.

Verification rerun:

- `npm test -- tests/mcp/working-thread-markdown.test.ts tests/mcp/working-thread-docs-store.test.ts tests/mcp/working-thread-operations.test.ts tests/mcp/working-thread-server.test.ts` passed: 4 files, 71 tests.
- `npm run typecheck` passed.
- `npm run build` passed.

This resolves the schema/content alignment blocker found during the first MCP client validation. It does not change the broader product conclusion: Along still has turn-bound, docs-backed continuity, not background autonomy or living presence.
