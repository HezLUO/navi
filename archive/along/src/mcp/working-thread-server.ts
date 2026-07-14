import { pathToFileURL } from "node:url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type {
  ApplyConfirmedWorkingThreadUpdateInput,
  ClassifyDriftInput,
  DraftWrapUpInput,
  ProposeWorkingThreadUpdateInput,
} from "../core/working-thread-contract";
import {
  createWorkingThreadDocsStore,
  type WorkingThreadDocsStore,
} from "./working-thread-docs-store";
import { summarizeWorkingThread } from "./working-thread-markdown";
import {
  createWorkingThreadOperations,
} from "./working-thread-operations";

export const WORKING_THREAD_RESOURCE_URIS = [
  "working-thread://summaries",
  "working-thread://threads/{threadId}/summary",
  "working-thread://threads/{threadId}/record",
] as const;

export const WORKING_THREAD_TOOL_NAMES = [
  "classifyDrift",
  "draftWrapUp",
  "proposeWorkingThreadUpdate",
  "applyConfirmedWorkingThreadUpdate",
] as const;

export const WORKING_THREAD_PROMPT_NAMES = [] as const;

const jsonMimeType = "application/json";
const classifyDriftInputSchema = {
  thread: z.unknown().optional(),
  userRequest: z.unknown().optional(),
  proposedDirection: z.unknown().optional(),
};
const draftWrapUpInputSchema = {
  thread: z.unknown().optional(),
  sessionSummary: z.unknown().optional(),
  judgmentChange: z.unknown().optional(),
  boundaryChange: z.unknown().optional(),
  nextLikelyMove: z.unknown().optional(),
  openQuestionsChange: z.unknown().optional(),
};
const proposeWorkingThreadUpdateInputSchema = {
  thread: z.unknown().optional(),
  draft: z.unknown().optional(),
};
const applyConfirmedWorkingThreadUpdateInputSchema = {
  proposal: z.unknown().optional(),
  confirmation: z.unknown().optional(),
};

export interface WorkingThreadMcpRegistrar {
  registerResource(
    name: string,
    uriOrTemplate: string | ResourceTemplate,
    config: Record<string, unknown>,
    handler: (uri: URL, variables: Record<string, string | string[]>) => Promise<ReadResourceResult>,
  ): unknown;
  registerTool(
    name: string,
    config: Record<string, unknown>,
    handler: (input: unknown) => Promise<CallToolResult>,
  ): unknown;
}

export interface WorkingThreadMcpSurfaceOperations {
  classifyDrift(input: ClassifyDriftInput): Promise<unknown>;
  draftWrapUp(input: DraftWrapUpInput): Promise<unknown>;
  proposeWorkingThreadUpdate(input: ProposeWorkingThreadUpdateInput): Promise<unknown>;
  applyConfirmedWorkingThreadUpdate(
    input: ApplyConfirmedWorkingThreadUpdateInput,
  ): Promise<unknown>;
}

export function parseWorkspaceArg(argv: string[]): string {
  const workspaceFlagIndex = argv.indexOf("--workspace");
  if (workspaceFlagIndex === -1) {
    throw new Error("Missing required --workspace argument.");
  }

  const workspaceRoot = argv[workspaceFlagIndex + 1];
  if (!workspaceRoot || workspaceRoot.startsWith("--") || !workspaceRoot.trim()) {
    throw new Error("Missing required value for --workspace.");
  }

  return workspaceRoot;
}

export function createWorkingThreadMcpServer(store: WorkingThreadDocsStore): McpServer {
  const server = new McpServer({
    name: "along-working-thread",
    version: "0.1.0",
  });

  registerWorkingThreadMcpSurface(server, store);

  return server;
}

export function registerWorkingThreadMcpSurface(
  registrar: WorkingThreadMcpRegistrar,
  store: WorkingThreadDocsStore,
  operations: WorkingThreadMcpSurfaceOperations = createWorkingThreadOperations(store),
): void {
  registrar.registerResource(
    "working-thread-summaries",
    WORKING_THREAD_RESOURCE_URIS[0],
    {
      title: "Working Thread summaries",
      description: "JSON summaries for all Working Thread records.",
      mimeType: jsonMimeType,
    },
    async (uri) => jsonResource(uri.toString(), await store.listSummaries()),
  );

  registrar.registerResource(
    "working-thread-summary",
    new ResourceTemplate(WORKING_THREAD_RESOURCE_URIS[1], {
      list: async () => ({
        resources: (await store.listSummaries()).map((summary) => ({
          uri: `working-thread://threads/${summary.id}/summary`,
          name: `working-thread-summary-${summary.id}`,
          title: summary.title,
          mimeType: jsonMimeType,
        })),
      }),
    }),
    {
      title: "Working Thread summary",
      description: "JSON summary for one Working Thread record.",
      mimeType: jsonMimeType,
    },
    async (uri, variables) => {
      const threadId = getThreadIdVariable(variables.threadId);
      const parsed = await store.readThread(threadId);
      return jsonResource(uri.toString(), {
        summary: summarizeWorkingThread(parsed),
        malformed: parsed.malformed,
        warnings: parsed.warnings,
      });
    },
  );

  registrar.registerResource(
    "working-thread-record",
    new ResourceTemplate(WORKING_THREAD_RESOURCE_URIS[2], {
      list: async () => ({
        resources: (await store.listSummaries()).map((summary) => ({
          uri: `working-thread://threads/${summary.id}/record`,
          name: `working-thread-record-${summary.id}`,
          title: summary.title,
          mimeType: jsonMimeType,
        })),
      }),
    }),
    {
      title: "Working Thread record",
      description: "Full parsed JSON Working Thread record.",
      mimeType: jsonMimeType,
    },
    async (uri, variables) => (
      jsonResource(
        uri.toString(),
        await store.readThread(getThreadIdVariable(variables.threadId)),
      )
    ),
  );

  registrar.registerTool(
    "classifyDrift",
    {
      title: "Classify drift",
      description: "Classify a request against a Working Thread boundary.",
      inputSchema: classifyDriftInputSchema,
    },
    async (input) => toolJsonResult(
      await operations.classifyDrift(input as unknown as ClassifyDriftInput),
    ),
  );

  registrar.registerTool(
    "draftWrapUp",
    {
      title: "Draft wrap-up",
      description: "Draft a Working Thread wrap-up without writing it.",
      inputSchema: draftWrapUpInputSchema,
    },
    async (input) => toolJsonResult(
      await operations.draftWrapUp(input as unknown as DraftWrapUpInput),
    ),
  );

  registrar.registerTool(
    "proposeWorkingThreadUpdate",
    {
      title: "Propose Working Thread update",
      description: "Create a confirmation-required Working Thread update proposal.",
      inputSchema: proposeWorkingThreadUpdateInputSchema,
    },
    async (input) => toolJsonResult(
      await operations.proposeWorkingThreadUpdate(input as unknown as ProposeWorkingThreadUpdateInput),
    ),
  );

  registrar.registerTool(
    "applyConfirmedWorkingThreadUpdate",
    {
      title: "Apply confirmed Working Thread update",
      description: "Apply a Working Thread proposal after explicit user confirmation.",
      inputSchema: applyConfirmedWorkingThreadUpdateInputSchema,
    },
    async (input) => toolJsonResult(
      await operations.applyConfirmedWorkingThreadUpdate(
        input as unknown as ApplyConfirmedWorkingThreadUpdateInput,
      ),
    ),
  );
}

export async function main(argv = process.argv): Promise<void> {
  const workspaceRoot = parseWorkspaceArg(argv);
  const store = createWorkingThreadDocsStore({ workspaceRoot });
  const server = createWorkingThreadMcpServer(store);

  await server.connect(new StdioServerTransport());
}

function jsonResource(uri: string, value: unknown): ReadResourceResult {
  return {
    contents: [{
      uri,
      mimeType: jsonMimeType,
      text: JSON.stringify(value, null, 2),
    }],
  };
}

function toolJsonResult(value: unknown): CallToolResult {
  const status = getResultStatus(value);

  return {
    content: [{
      type: "text",
      text: JSON.stringify(value, null, 2),
    }],
    structuredContent: toStructuredContent(value),
    isError: status === "rejected" || status === "conflict" || status === "error",
  };
}

function getThreadIdVariable(threadId: string | string[]): string {
  return Array.isArray(threadId) ? threadId[0] : threadId;
}

function getResultStatus(value: unknown): string | undefined {
  if (value && typeof value === "object" && "status" in value) {
    const status = value.status;
    return typeof status === "string" ? status : undefined;
  }

  return undefined;
}

function toStructuredContent(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return { value };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
