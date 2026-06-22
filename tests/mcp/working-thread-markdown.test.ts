import { describe, expect, it } from "vitest";
import {
  applyWorkingThreadSectionPatches,
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
});
