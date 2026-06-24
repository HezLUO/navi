# Working Thread Schema Alignment Design

Date: 2026-06-24
Status: Approved for implementation planning

## Summary

Along should align the Working Thread Markdown schema with how the real record is now used.

The Minimal MCP Server client validation found that the active Working Thread record is readable as partial context but malformed under the strict V1 parser, because it contains useful historical sections beyond the seven canonical Working Thread sections. This pass should fix that mismatch without expanding MCP capability.

The approved direction is **canonical sections plus appendices**:

- canonical sections remain strict, required, and writable through confirmed section patches;
- appendix sections are allowed after the canonical core, readable as context, and never patched by V1;
- unknown headings inside the canonical core remain malformed;
- unknown headings after the canonical core become appendix warnings or metadata, not malformed.

## Product Context

Working Threads serve two purposes:

1. They provide a compact, machine-readable coordination shape for resume, drift detection, wrap-up, and confirmed write-back.
2. They preserve judgment history across a long project, which is important for Along's continuity and companion-like behavior.

The current strict parser protects write-back safety, but it makes real records brittle. As soon as the record accumulates extra history sections, the entire record becomes malformed and action tools cannot use it.

The alignment pass should keep the safety of strict core sections while allowing long-running records to retain appendix material.

## Goals

- Allow real Working Thread records with appendix sections to parse as complete `WorkingThread` records.
- Keep the seven canonical sections required and structurally strict.
- Keep confirmed write-back limited to canonical sections only.
- Preserve partial/malformed behavior for genuinely broken records.
- Expose appendix information in parsed output as non-writable context.
- Keep summaries focused on canonical fields.
- Make MCP client validation pass against the real Along Working Thread record.

## Non-Goals

This pass must not:

- add new Working Thread core fields;
- add new MCP tools, resources, prompts, transports, or capabilities;
- add background runtime, watcher, scheduler, presence, adapters, delegation, or Memory v2;
- introduce `.along/` storage;
- let appendices be patched by `applyConfirmedWorkingThreadUpdate`;
- allow arbitrary headings inside canonical section bodies;
- rewrite the whole Working Thread file;
- migrate historical content into a database or structured event log;
- change the Skill-First V1 behavior rules.

## Canonical Core

The canonical core remains the same seven sections:

```text
Why This Matters
Current Judgment
Boundary
Drift Triggers
Next Likely Move
Last Wrap-Up
Open Questions
```

These sections are required. Their existing parsing behavior should remain strict:

- missing canonical section: malformed;
- duplicate canonical section: malformed;
- invalid status: malformed;
- missing or invalid last updated date: malformed;
- heading inside a canonical section body: malformed;
- section patch current-value mismatch: rejected;
- proposed patch value containing Markdown headings: rejected.

The core is the only write-back surface in V1.

## Appendix Model

Appendix sections are Markdown headings that appear after the canonical core is complete.

Examples from the real record:

```text
Validation Notes
Plan Audit
Deferred Capability Map
Packaging Positioning
Packaging Success Criteria
Packaging Metadata
Packaging Source Strategy
```

Appendices are allowed as historical/contextual material. The parser should preserve them as appendix metadata or raw appendix blocks, but they should not become part of the `WorkingThread` contract.

Appendix rules:

- Appendices may appear only after all canonical sections have appeared at least once.
- Appendices may use `##` headings.
- Appendix contents may contain lower-level headings if the implementation can preserve them safely as raw appendix content.
- Appendices should not affect `WorkingThread` summary fields.
- Appendices should not affect drift classification directly unless the calling agent reads the full record and chooses to use them as context.
- Appendices are read-only in V1.

## Malformed Rules

The parser should still mark a record malformed when the core is unsafe or ambiguous.

Malformed examples:

- unknown `##` heading appears before the canonical core is complete;
- a canonical section is missing;
- a canonical section is duplicated;
- a heading appears inside a canonical section body before the core is complete;
- status or last updated metadata is missing or invalid;
- a canonical section cannot be parsed into the expected type.

Non-malformed examples:

- extra `##` headings after the complete canonical core;
- appendix content after `Open Questions`;
- historical validation notes after the canonical core;
- packaging notes after the canonical core.

This keeps malformed status reserved for records whose core cannot be safely summarized or patched.

## Parsed Output

`ParsedWorkingThreadDocument` should continue to expose:

```text
thread
partial
warnings
rawMarkdown
sourcePath
malformed
```

It may add an `appendices` field if needed:

```ts
appendices?: Array<{
  heading: string;
  markdown: string;
  startOffset: number;
  endOffset: number;
}>;
```

Appendices should be visible to clients reading full records, but they should not be required for existing clients. If adding a field would cause broad churn, a minimal implementation may preserve appendix context only in `rawMarkdown` and emit non-fatal warnings.

Preferred behavior:

- `warnings` may include non-fatal appendix warnings;
- `malformed` should be `false` when only appendix headings are present after the core;
- `thread` should be present when the canonical core is valid.

## Write-Back Behavior

Confirmed write-back remains limited to canonical section patches.

`proposeWorkingThreadUpdate` should continue to produce changes only for:

```text
currentJudgment
boundary
nextLikelyMove
lastWrapUp
openQuestions
```

or the already approved canonical section set used by the existing implementation.

`applyConfirmedWorkingThreadUpdate` must:

- validate the current canonical section values before patching;
- apply only the proposed canonical section changes;
- preserve appendix material byte-for-byte when possible;
- reject proposals that target appendix sections;
- reject proposed values that introduce headings;
- preserve stale proposal conflict handling.

This means the MCP server can update the living core while leaving historical appendices intact.

## Real Record Alignment

After implementation, the active record should parse as:

```text
malformed: false
thread: present
appendix sections: present or preserved in rawMarkdown
```

The current extra sections should not require migration before MCP write-back can work.

If an implementation finds that one or more extra sections appear before `Open Questions`, it should either:

- move them after the canonical core as part of an explicit docs-only cleanup; or
- keep the parser strict and report the record as malformed until the ordering is fixed.

The current observed real record has the extra sections before `Open Questions`, so the implementation plan must explicitly decide whether to:

- treat `Open Questions` as allowed to appear after appendices; or
- move `Open Questions` before appendix sections in a docs cleanup step.

The preferred choice is to keep canonical section order strict and move `Open Questions` before appendices if necessary. This preserves parser simplicity and write-back safety.

## Testing

Add focused tests for:

- valid canonical record with appendices after `Open Questions`;
- real-record shape or fixture containing validation/packaging appendix sections;
- unknown heading before canonical core completion remains malformed;
- heading inside canonical section body remains malformed;
- appendix sections do not enter `WorkingThread` fields;
- section patches preserve appendix content;
- confirmed write-back works on a record with appendices;
- stale proposal conflict still works on a record with appendices.

Run at minimum:

```text
npm test -- tests/mcp/working-thread-markdown.test.ts tests/mcp/working-thread-docs-store.test.ts tests/mcp/working-thread-operations.test.ts tests/mcp/working-thread-server.test.ts
npm run typecheck
npm run build
```

If the implementation modifies the real Working Thread record ordering, also run the MCP client validation again against the real repository.

## Risks

- If appendix handling is too permissive, malformed core content could be hidden as context.
- If appendix handling is too strict, long-running Working Threads will remain brittle.
- If write-back accidentally patches appendix material, the server could mutate historical evidence.
- If the real record is reordered without care, valuable chronology may become harder to read.

The mitigation is to keep the writable core small and deterministic, and treat appendices as read-only evidence.

## Success Criteria

- The active Working Thread record can parse as a complete `WorkingThread` after either parser alignment or minimal ordering cleanup.
- MCP resources still expose summaries and full records.
- MCP action tools can operate on the real record when the core is valid.
- Confirmed write-back preserves appendix content.
- No new MCP capabilities or runtime behavior are added.
- The validation report can be updated to say the schema/content alignment blocker is resolved.
