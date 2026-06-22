import { describe, expect, it } from "vitest";
import { z, type ZodRawShape } from "zod";
import type {
  WorkingThread,
  WorkingThreadSummary,
} from "../../src/core/working-thread-contract";
import type { ParsedWorkingThreadDocument } from "../../src/mcp/working-thread-markdown";
import {
  parseWorkspaceArg,
  registerWorkingThreadMcpSurface,
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

  it("wires the summaries resource handler to store.listSummaries", async () => {
    const { registrar, store } = createRegisteredSurface();

    const result = await registrar.resources["working-thread-summaries"].handler(
      new URL("working-thread://summaries"),
      {},
    );

    expect(store.listSummariesCalls).toBe(1);
    expect(result.contents[0]).toMatchObject({
      uri: "working-thread://summaries",
      mimeType: "application/json",
    });
    expect(JSON.parse(result.contents[0].text)).toEqual([summary]);
  });

  it("wires per-thread summary and record resources to store.readThread", async () => {
    const { registrar, store } = createRegisteredSurface();

    const summaryResult = await registrar.resources["working-thread-summary"].handler(
      new URL("working-thread://threads/thread-1/summary"),
      { threadId: "thread-1" },
    );
    const recordResult = await registrar.resources["working-thread-record"].handler(
      new URL("working-thread://threads/thread-1/record"),
      { threadId: "thread-1" },
    );

    expect(store.readThreadCalls).toEqual(["thread-1", "thread-1"]);
    expect(JSON.parse(summaryResult.contents[0].text)).toMatchObject({
      summary: {
        id: "thread-1",
        title: "Thread One",
      },
      malformed: false,
      warnings: [{ code: "duplicate-section", message: "Duplicate section." }],
    });
    expect(JSON.parse(recordResult.contents[0].text)).toMatchObject({
      id: "thread-1",
      thread,
      warnings: [{ code: "duplicate-section", message: "Duplicate section." }],
    });
  });

  it("wires tool handlers to operations and returns JSON text plus structured content", async () => {
    const { operations, registrar } = createRegisteredSurface();

    const result = await registrar.tools.classifyDrift.handler({
      thread,
      userRequest: "Summarize this thread.",
    });

    expect(operations.classifyDriftInputs).toEqual([{
      thread,
      userRequest: "Summarize this thread.",
    }]);
    expect(result.isError).toBe(false);
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent).toMatchObject({
      status: "ok",
      operation: "classifyDrift",
      threadId: "thread-1",
    });
  });

  it("returns structured rejection for malformed propose tool input", async () => {
    const registrar = createFakeRegistrar();
    registerWorkingThreadMcpSurface(registrar, createFakeStore());
    const schema = getToolSchema(registrar, "proposeWorkingThreadUpdate");

    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ thread: "bad", draft: {} }).success).toBe(true);
    const result = await registrar.tools.proposeWorkingThreadUpdate.handler({
      thread: { id: "thread-1" },
      draft: {},
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent).toMatchObject({
      status: "rejected",
      operation: "proposeWorkingThreadUpdate",
      threadId: "thread-1",
      reason: expect.stringMatching(/thread|draft/i),
    });
  });

  it("returns structured rejection for malformed classify tool input", async () => {
    const registrar = createFakeRegistrar();
    registerWorkingThreadMcpSurface(registrar, createFakeStore());
    const schema = getToolSchema(registrar, "classifyDrift");

    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ thread: { id: "thread-1" } }).success).toBe(true);
    const result = await registrar.tools.classifyDrift.handler({
      thread: {
        id: "thread-1",
        boundary: "No HTTP transport.",
      },
      userRequest: "Add HTTP transport.",
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent).toMatchObject({
      status: "rejected",
      operation: "classifyDrift",
      threadId: "thread-1",
      reason: expect.stringMatching(/boundary/i),
    });
  });

  it("returns structured rejection for malformed draft wrap-up tool input", async () => {
    const registrar = createFakeRegistrar();
    registerWorkingThreadMcpSurface(registrar, createFakeStore());
    const schema = getToolSchema(registrar, "draftWrapUp");

    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ thread: { id: "thread-1" }, sessionSummary: 123 }).success).toBe(true);
    const result = await registrar.tools.draftWrapUp.handler({
      thread: { id: "thread-1" },
      sessionSummary: 123,
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent).toMatchObject({
      status: "rejected",
      operation: "draftWrapUp",
      threadId: "thread-1",
      reason: expect.stringMatching(/thread|session/i),
    });
  });

  it("returns structured rejection for malformed apply tool input", async () => {
    const registrar = createFakeRegistrar();
    registerWorkingThreadMcpSurface(registrar, createFakeStore());
    const schema = getToolSchema(registrar, "applyConfirmedWorkingThreadUpdate");
    const proposalResult = await registrar.tools.proposeWorkingThreadUpdate.handler({
      thread,
      draft: {
        summary: "A valid proposed wrap-up.",
        judgmentChange: "A valid proposed judgment.",
        boundaryChange: "",
        nextLikelyMove: "",
        openQuestionsChange: "",
        requiresConfirmation: true,
      },
    });
    const proposal = JSON.parse(proposalResult.content[0].text).data;

    expect(schema.safeParse({}).success).toBe(true);
    expect(schema.safeParse({ proposal, confirmation: "bad" }).success).toBe(true);
    const result = await registrar.tools.applyConfirmedWorkingThreadUpdate.handler({
      proposal,
      confirmation: "bad",
    });

    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text)).toEqual(result.structuredContent);
    expect(result.structuredContent).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: "thread-1",
      reason: expect.stringMatching(/confirmation/i),
    });
  });

  it.each(["rejected", "conflict", "error"] as const)(
    "marks %s tool results as isError",
    async (status) => {
      const { operations, registrar } = createRegisteredSurface();
      operations.applyConfirmedWorkingThreadUpdateResult = {
        status,
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: "thread-1",
        reason: `${status} result`,
      };

      const result = await registrar.tools.applyConfirmedWorkingThreadUpdate.handler({
        proposal: { proposalId: "proposal-1", threadId: "thread-1" },
        confirmation: { approved: true },
      });

      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text)).toMatchObject({
        status,
        reason: `${status} result`,
      });
      expect(result.structuredContent).toMatchObject({
        status,
        reason: `${status} result`,
      });
    },
  );
});

const thread: WorkingThread = {
  id: "thread-1",
  title: "Thread One",
  status: "active",
  lastUpdated: "2026-06-22",
  whyThisMatters: "This thread matters.",
  currentJudgment: "Keep MCP surface minimal.",
  boundary: ["No HTTP transport."],
  driftTriggers: ["HTTP transport."],
  nextLikelyMove: "Test server registration.",
  lastWrapUp: "Store and operations exist.",
  openQuestions: ["How much server coverage is enough?"],
};

const summary: WorkingThreadSummary = {
  id: "thread-1",
  title: "Thread One",
  status: "active",
  lastUpdated: "2026-06-22",
  currentJudgmentBrief: "Keep MCP surface minimal.",
  nextLikelyMove: "Test server registration.",
  riskLevel: "low",
  needsUserDecision: true,
};

const parsedThread: ParsedWorkingThreadDocument = {
  id: "thread-1",
  sourcePath: "/tmp/thread-1.md",
  rawMarkdown: "# Thread One",
  malformed: false,
  warnings: [{ code: "duplicate-section", message: "Duplicate section." }],
  partial: {
    id: "thread-1",
    title: "Thread One",
    status: "active",
    lastUpdated: "2026-06-22",
    sections: {
      currentJudgment: "Keep MCP surface minimal.",
    },
  },
  thread,
};

function createRegisteredSurface() {
  const registrar = createFakeRegistrar();
  const store = createFakeStore();
  const operations = {
    classifyDriftInputs: [] as unknown[],
    applyConfirmedWorkingThreadUpdateResult: {
      status: "ok",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: "thread-1",
      data: { appliedProposalId: "proposal-1", thread },
    } as Record<string, unknown>,
    async classifyDrift(input: unknown) {
      this.classifyDriftInputs.push(input);
      return {
        status: "ok",
        operation: "classifyDrift",
        threadId: "thread-1",
        data: {
          driftLevel: "none",
          reason: "No drift.",
          recommendedAction: "answerDirectly",
          needsUserConfirmation: false,
        },
      };
    },
    async draftWrapUp() {
      return { status: "ok", operation: "draftWrapUp", threadId: "thread-1" };
    },
    async proposeWorkingThreadUpdate() {
      return {
        status: "needsConfirmation",
        operation: "proposeWorkingThreadUpdate",
        threadId: "thread-1",
      };
    },
    async applyConfirmedWorkingThreadUpdate() {
      return this.applyConfirmedWorkingThreadUpdateResult;
    },
  };

  registerWorkingThreadMcpSurface(registrar, store, operations);

  return { operations, registrar, store };
}

function getToolSchema(
  registrar: ReturnType<typeof createFakeRegistrar>,
  toolName: string,
) {
  const config = registrar.tools[toolName].config as { inputSchema: ZodRawShape };
  return z.object(config.inputSchema);
}

function createFakeStore() {
  return {
    workspaceRoot: "/tmp/workspace",
    recordsDir: "/tmp/workspace/docs/along/working-threads",
    listSummariesCalls: 0,
    readThreadCalls: [] as string[],
    async listSummaries() {
      this.listSummariesCalls += 1;
      return [summary];
    },
    async readThread(threadId: string) {
      this.readThreadCalls.push(threadId);
      return parsedThread;
    },
    async applySectionPatchProposal() {
      return parsedThread;
    },
  };
}

function createFakeRegistrar() {
  return {
    resources: {} as Record<string, {
      uriOrTemplate: unknown;
      config: unknown;
      handler: (uri: URL, variables: Record<string, string>) => Promise<{
        contents: Array<{ uri: string; mimeType?: string; text: string }>;
      }>;
    }>,
    tools: {} as Record<string, {
      config: unknown;
      handler: (input: unknown) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        structuredContent?: Record<string, unknown>;
        isError?: boolean;
      }>;
    }>,
    registerResource(
      name: string,
      uriOrTemplate: unknown,
      config: unknown,
      handler: (uri: URL, variables: Record<string, string>) => Promise<{
        contents: Array<{ uri: string; mimeType?: string; text: string }>;
      }>,
    ) {
      this.resources[name] = { uriOrTemplate, config, handler };
    },
    registerTool(
      name: string,
      config: unknown,
      handler: (input: unknown) => Promise<{
        content: Array<{ type: "text"; text: string }>;
        structuredContent?: Record<string, unknown>;
        isError?: boolean;
      }>,
    ) {
      this.tools[name] = { config, handler };
    },
  };
}
