import { describe, expect, it } from "vitest";
import {
  applyWorkingThreadSectionPatches,
  createWorkingThreadSectionPatch,
  parseWorkingThreadMarkdown,
  summarizeWorkingThread,
} from "../../src/mcp/working-thread-markdown";
import type { WorkingThreadSectionChange } from "../../src/core/working-thread-contract";

const validRecord = `# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-22

## Why This Matters

Along should help existing agents preserve judgment continuity.

## Current Judgment

The Minimal MCP Server spec is approved and awaiting implementation.

## Boundary

- Do not add background runtime.
- Do not add HTTP/SSE transport.

## Drift Triggers

- The work adds an adapter.
- The work writes outside Working Thread records.

## Next Likely Move

Implement the docs-backed stdio MCP server.

## Last Wrap-Up

The user approved the Minimal MCP Server spec.

## Open Questions

- Which agent client should validate the server first?
`;

const sourcePath = "docs/along/working-threads/existing-agent-self-initiation-layer.md";

describe("Working Thread Markdown", () => {
  it("parses a valid record into the contract shape", () => {
    const parsed = parseWorkingThreadMarkdown({
      id: "existing-agent-self-initiation-layer",
      sourcePath,
      markdown: validRecord,
    });

    expect(parsed.sourcePath).toBe(sourcePath);
    expect(parsed.rawMarkdown).toBe(validRecord);
    expect(parsed.malformed).toBe(false);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.partial.sections.currentJudgment).toBe(
      "The Minimal MCP Server spec is approved and awaiting implementation.",
    );
    expect(parsed.thread).toMatchObject({
      id: "existing-agent-self-initiation-layer",
      title: "Existing-Agent Self-Initiation Layer",
      status: "active",
      lastUpdated: "2026-06-22",
      currentJudgment: "The Minimal MCP Server spec is approved and awaiting implementation.",
      nextLikelyMove: "Implement the docs-backed stdio MCP server.",
    });
    expect(parsed.thread?.boundary).toEqual([
      "Do not add background runtime.",
      "Do not add HTTP/SSE transport.",
    ]);
    expect(parsed.thread?.openQuestions).toEqual([
      "Which agent client should validate the server first?",
    ]);
  });

  it("builds an actionable summary for a valid record", () => {
    const summary = summarizeWorkingThread(parseWorkingThreadMarkdown({
      id: "existing-agent-self-initiation-layer",
      sourcePath,
      markdown: validRecord,
    }));

    expect(summary).toMatchObject({
      id: "existing-agent-self-initiation-layer",
      title: "Existing-Agent Self-Initiation Layer",
      status: "active",
      lastUpdated: "2026-06-22",
      riskLevel: "medium",
      needsUserDecision: true,
    });
    expect(summary.currentJudgmentBrief).toContain("Minimal MCP Server");
  });

  it("returns a partial record with warnings for malformed Markdown", () => {
    const parsed = parseWorkingThreadMarkdown({
      id: "broken-thread",
      sourcePath: "docs/along/working-threads/broken-thread.md",
      markdown: `# Broken Thread

Status: active
Last updated: 2026-06-22

## Current Judgment

Only one section exists.
`,
    });

    expect(parsed.malformed).toBe(true);
    expect(parsed.thread).toBeUndefined();
    expect(parsed.partial.title).toBe("Broken Thread");
    expect(parsed.partial.sections.currentJudgment).toBe("Only one section exists.");
    expect(parsed.warnings.map((warning) => warning.code)).toContain("missing-section");
  });

  it("does not treat metadata inside sections as top-level metadata", () => {
    const parsed = parseWorkingThreadMarkdown({
      id: "nested-metadata-thread",
      sourcePath: "docs/along/working-threads/nested-metadata-thread.md",
      markdown: `# Nested Metadata Thread

## Why This Matters

Status: active
Last updated: 2026-06-22

These lines are section content, not record metadata.

## Current Judgment

The parser should reject misplaced metadata.

## Boundary

- Only top-level metadata is valid.

## Drift Triggers

- Metadata appears inside a section.

## Next Likely Move

Repair the top-level metadata.

## Last Wrap-Up

The record lost its metadata block.

## Open Questions

- Who should repair this record?
`,
    });

    expect(parsed.malformed).toBe(true);
    expect(parsed.thread).toBeUndefined();
    expect(parsed.partial.status).toBeUndefined();
    expect(parsed.partial.lastUpdated).toBeUndefined();
    expect(parsed.warnings.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(["missing-status", "missing-last-updated"]),
    );
  });

  it("marks records with unknown or nested Markdown headings as malformed", () => {
    const withUnknownHeading = validRecord.replace(
      "## Next Likely Move",
      `   ## Hidden Heading

This heading should make the record malformed.

## Next Likely Move`,
    );
    const withNestedHeading = validRecord.replace(
      "The Minimal MCP Server spec is approved and awaiting implementation.",
      `The Minimal MCP Server spec is approved and awaiting implementation.

### Nested Heading

This nested heading should make the record malformed.`,
    );
    const withNestedH1 = validRecord.replace(
      "The Minimal MCP Server spec is approved and awaiting implementation.",
      `The Minimal MCP Server spec is approved and awaiting implementation.

# Nested H1

This nested H1 should make the record malformed.`,
    );
    const withSetextHeading = validRecord.replace(
      "The Minimal MCP Server spec is approved and awaiting implementation.",
      `The Minimal MCP Server spec is approved and awaiting implementation.

Setext Heading
---

This Setext heading should make the record malformed.`,
    );

    const unknownParsed = parseWorkingThreadMarkdown({
      id: "unknown-heading-thread",
      sourcePath: "docs/along/working-threads/unknown-heading-thread.md",
      markdown: withUnknownHeading,
    });
    const nestedParsed = parseWorkingThreadMarkdown({
      id: "nested-heading-thread",
      sourcePath: "docs/along/working-threads/nested-heading-thread.md",
      markdown: withNestedHeading,
    });
    const h1Parsed = parseWorkingThreadMarkdown({
      id: "nested-h1-thread",
      sourcePath: "docs/along/working-threads/nested-h1-thread.md",
      markdown: withNestedH1,
    });
    const setextParsed = parseWorkingThreadMarkdown({
      id: "setext-heading-thread",
      sourcePath: "docs/along/working-threads/setext-heading-thread.md",
      markdown: withSetextHeading,
    });

    expect(unknownParsed.malformed).toBe(true);
    expect(unknownParsed.thread).toBeUndefined();
    expect(unknownParsed.warnings.map((warning) => warning.code)).toContain("unknown-section");
    expect(nestedParsed.malformed).toBe(true);
    expect(nestedParsed.thread).toBeUndefined();
    expect(nestedParsed.warnings.map((warning) => warning.code)).toContain("unknown-section");
    expect(h1Parsed.malformed).toBe(true);
    expect(h1Parsed.thread).toBeUndefined();
    expect(h1Parsed.warnings.map((warning) => warning.code)).toContain("unknown-section");
    expect(setextParsed.malformed).toBe(true);
    expect(setextParsed.thread).toBeUndefined();
    expect(setextParsed.warnings.map((warning) => warning.code)).toContain("unknown-section");
  });

  it("preserves invalid raw status in malformed partial records", () => {
    const parsed = parseWorkingThreadMarkdown({
      id: "archived-thread",
      sourcePath: "docs/along/working-threads/archived-thread.md",
      markdown: validRecord.replace("Status: active", "Status: archived"),
    });
    const summary = summarizeWorkingThread(parsed);

    expect(parsed.malformed).toBe(true);
    expect(parsed.thread).toBeUndefined();
    expect(parsed.partial.status).toBe("archived");
    expect(parsed.warnings.map((warning) => warning.code)).toContain("invalid-status");
    expect(summary.status).toBe("active");
  });

  it("marks records with invalid last-updated dates as malformed", () => {
    const parsed = parseWorkingThreadMarkdown({
      id: "invalid-date-thread",
      sourcePath: "docs/along/working-threads/invalid-date-thread.md",
      markdown: validRecord.replace("Last updated: 2026-06-22", "Last updated: 2026-02-31"),
    });
    const summary = summarizeWorkingThread(parsed);

    expect(parsed.malformed).toBe(true);
    expect(parsed.thread).toBeUndefined();
    expect(parsed.partial.lastUpdated).toBe("2026-02-31");
    expect(parsed.warnings.map((warning) => warning.code)).toContain("invalid-last-updated");
    expect(summary.lastUpdated).toBe("2026-02-31");
  });

  it("builds a high-risk repair summary for malformed Markdown", () => {
    const summary = summarizeWorkingThread(parseWorkingThreadMarkdown({
      id: "broken-thread",
      sourcePath: "docs/along/working-threads/broken-thread.md",
      markdown: `Status: paused

## Current Judgment

Only one section exists.
`,
    }));

    expect(summary).toMatchObject({
      id: "broken-thread",
      title: "broken-thread",
      status: "paused",
      lastUpdated: "unknown",
      riskLevel: "high",
      needsUserDecision: true,
      nextLikelyMove: "Repair the Working Thread record before write-back.",
    });
  });

  it("applies approved section patches without rewriting unrelated sections", () => {
    const changes = [
      {
        section: "currentJudgment",
        currentValue: "The Minimal MCP Server spec is approved and awaiting implementation.",
        proposedValue: "The Markdown parser and section patcher are being implemented.",
        rationale: "Task 2 is now in progress.",
      },
      {
        section: "nextLikelyMove",
        currentValue: "Implement the docs-backed stdio MCP server.",
        proposedValue: "Run parser tests and hand the verified result back to the controller.",
        rationale: "The patching logic is ready for verification.",
      },
    ] satisfies WorkingThreadSectionChange[];

    const patched = applyWorkingThreadSectionPatches(validRecord, changes);

    expect(patched).toContain(
      "The Markdown parser and section patcher are being implemented.",
    );
    expect(patched).toContain(
      "Run parser tests and hand the verified result back to the controller.",
    );
    expect(patched).toContain(`## Boundary

- Do not add background runtime.
- Do not add HTTP/SSE transport.`);
    expect(patched).toContain(`## Last Wrap-Up

The user approved the Minimal MCP Server spec.`);
  });

  it("reports the first changed offset so stores can avoid truncate-to-zero rewrites", () => {
    const result = createWorkingThreadSectionPatch(validRecord, [
      {
        section: "nextLikelyMove",
        currentValue: "Implement the docs-backed stdio MCP server.",
        proposedValue: "Run the final verification suite.",
        rationale: "The implementation is ready for verification.",
      },
    ]);
    const nextLikelyMoveBodyOffset = validRecord.indexOf("Implement the docs-backed stdio MCP server.");

    expect(result.firstChangedOffset).toBe(nextLikelyMoveBodyOffset);
    expect(result.firstChangedOffset).toBeGreaterThan(0);
    expect(result.markdown.slice(0, result.firstChangedOffset)).toBe(
      validRecord.slice(0, result.firstChangedOffset),
    );
  });

  it("rejects stale patches when the current value does not match", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "currentJudgment",
        currentValue: "A stale value.",
        proposedValue: "A replacement.",
        rationale: "Should fail.",
      },
    ])).toThrow(/current value/i);
  });

  it("rejects section patches that would introduce Markdown headings", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "currentJudgment",
        currentValue: "The Minimal MCP Server spec is approved and awaiting implementation.",
        proposedValue: `A proposed judgment.

## Arbitrary Heading

This heading must not be introduced through a section patch.`,
        rationale: "Heading injection should fail.",
      },
    ])).toThrow(/heading/i);
  });

  it("rejects section patches that would introduce indented ATX Markdown headings", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "currentJudgment",
        currentValue: "The Minimal MCP Server spec is approved and awaiting implementation.",
        proposedValue: `A proposed judgment.
   ## Indented Heading

This heading must not be introduced through a section patch.`,
        rationale: "Indented ATX heading injection should fail.",
      },
    ])).toThrow(/heading/i);
  });

  it("rejects section patches that would introduce Setext Markdown headings", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "currentJudgment",
        currentValue: "The Minimal MCP Server spec is approved and awaiting implementation.",
        proposedValue: `Injected heading
---

This Setext heading must not be introduced through a section patch.`,
        rationale: "Setext heading injection should fail.",
      },
    ])).toThrow(/heading/i);
  });

  it("rejects list-valued section patches that would introduce Markdown headings", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "boundary",
        currentValue: [
          "Do not add background runtime.",
          "Do not add HTTP/SSE transport.",
        ],
        proposedValue: [
          "Do not add background runtime.",
          "Do not add HTTP/SSE transport.",
          "## List Heading",
        ],
        rationale: "List heading injection should fail.",
      },
    ])).toThrow(/heading/i);
  });

  it("rejects list-valued section patches with nested multiline headings", () => {
    expect(() => applyWorkingThreadSectionPatches(validRecord, [
      {
        section: "openQuestions",
        currentValue: ["Which agent client should validate the server first?"],
        proposedValue: [
          "Which agent client should validate the server first?",
          `Follow-up question
  ## Nested Heading`,
        ],
        rationale: "Nested list heading injection should fail.",
      },
    ])).toThrow(/heading/i);
  });

  it("rejects patches for missing sections", () => {
    const withoutOpenQuestions = validRecord.replace(/\n## Open Questions[\s\S]*$/, "");

    expect(() => applyWorkingThreadSectionPatches(withoutOpenQuestions, [
      {
        section: "openQuestions",
        currentValue: ["Which agent client should validate the server first?"],
        proposedValue: ["No open questions."],
        rationale: "Should fail.",
      },
    ])).toThrow(/section/i);
  });

  it("rejects ambiguous patches when the target section is duplicated", () => {
    const duplicatedCurrentJudgment = validRecord.replace(
      "## Boundary",
      `## Current Judgment

An accidental duplicate judgment.

## Boundary`,
    );

    expect(() => applyWorkingThreadSectionPatches(duplicatedCurrentJudgment, [
      {
        section: "currentJudgment",
        currentValue: "The Minimal MCP Server spec is approved and awaiting implementation.",
        proposedValue: "A replacement.",
        rationale: "Should fail.",
      },
    ])).toThrow(/duplicate|ambiguous|section/i);
  });
});
