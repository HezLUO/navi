import { describe, expect, it } from "vitest";
import {
  parseWorkspaceArg,
  WORKING_THREAD_PROMPT_NAMES,
  WORKING_THREAD_RESOURCE_URIS,
  WORKING_THREAD_TOOL_NAMES,
} from "../../src/mcp/working-thread-server";

describe("Working Thread MCP server surface", () => {
  it("exposes read and list behavior as resources", () => {
    expect(WORKING_THREAD_RESOURCE_URIS).toEqual([
      "working-thread://summaries",
      "working-thread://threads/{threadId}/summary",
      "working-thread://threads/{threadId}/record",
    ]);
  });

  it("exposes only the four action tools", () => {
    expect(WORKING_THREAD_TOOL_NAMES).toEqual([
      "classifyDrift",
      "draftWrapUp",
      "proposeWorkingThreadUpdate",
      "applyConfirmedWorkingThreadUpdate",
    ]);
    expect(WORKING_THREAD_TOOL_NAMES).not.toContain("readWorkingThread");
    expect(WORKING_THREAD_TOOL_NAMES).not.toContain("listWorkingThreads");
    expect(WORKING_THREAD_TOOL_NAMES).not.toContain("deleteWorkingThread");
    expect(WORKING_THREAD_TOOL_NAMES).not.toContain("delegateToAgent");
  });

  it("requires an explicit workspace argument", () => {
    expect(() => parseWorkspaceArg(["node", "server"])).toThrow(/--workspace/i);
    expect(parseWorkspaceArg(["node", "server", "--workspace", "/tmp/along"])).toBe(
      "/tmp/along",
    );
  });

  it("does not register MCP prompts", () => {
    expect(WORKING_THREAD_PROMPT_NAMES).toEqual([]);
  });
});
