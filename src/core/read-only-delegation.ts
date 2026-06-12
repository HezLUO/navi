import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ReadOnlyDelegationRequest, ReadOnlyDelegationResult } from "./types";

const execFileAsync = promisify(execFile);

export const defaultForbiddenReadOnlyActions = [
  "Do not modify files.",
  "Do not create commits.",
  "Do not push branches.",
  "Do not install dependencies.",
  "Do not run destructive commands.",
  "Do not change project state.",
];

export interface AgentAdapter {
  name: string;
  capabilities: string[];
  canRun(input: ReadOnlyDelegationRequest): Promise<boolean>;
  buildPrompt(input: ReadOnlyDelegationRequest): Promise<string>;
  runReadOnly(input: ReadOnlyDelegationRequest): Promise<ReadOnlyDelegationResult>;
}

interface CodexReadOnlyAdapterOptions {
  runCodex?: (prompt: string, timeoutMs: number) => Promise<string>;
}

export class CodexReadOnlyAdapter implements AgentAdapter {
  readonly name = "codex";
  readonly capabilities = ["read_only_analysis", "review", "diagnosis", "plan_comparison"];

  constructor(private readonly options: CodexReadOnlyAdapterOptions = {}) {}

  async canRun(input: ReadOnlyDelegationRequest): Promise<boolean> {
    return input.target === "codex" && input.status === "requested";
  }

  async buildPrompt(input: ReadOnlyDelegationRequest): Promise<string> {
    return buildReadOnlyDelegationPrompt(input);
  }

  async runReadOnly(input: ReadOnlyDelegationRequest): Promise<ReadOnlyDelegationResult> {
    const prompt = await this.buildPrompt(input);
    const rawOutput = await (this.options.runCodex ?? runCodexCli)(prompt, input.budget.timeoutMs);
    const finalMessage = parseCodexJsonlFinalMessage(rawOutput);
    const parsed = parseDelegationJson(finalMessage);
    return {
      requestId: input.id,
      threadId: input.threadId,
      target: input.target,
      status: "completed",
      summary: parsed.summary,
      evidence: parsed.evidence,
      risks: parsed.risks,
      recommendations: parsed.recommendations,
      confidence: parsed.confidence,
      rawOutput: rawOutput.slice(0, input.budget.maxOutputChars),
      completedAt: new Date().toISOString(),
    };
  }
}

export function buildReadOnlyDelegationPrompt(input: ReadOnlyDelegationRequest): string {
  return [
    "You are being called by Along as a READ-ONLY analysis delegate.",
    "",
    `Open Thread: ${input.threadId}`,
    `Reason: ${input.reason}`,
    "",
    "Allowed scope:",
    ...input.scope.map((item) => `- ${item}`),
    "",
    "Forbidden actions:",
    ...input.forbiddenActions.map((item) => `- ${item}`),
    "",
    "Question:",
    input.question,
    "",
    "Expected output:",
    ...input.expectedOutput.map((item) => `- ${item}`),
    "",
    "Return only JSON with this exact shape:",
    "{\"summary\":\"string\",\"evidence\":[\"string\"],\"risks\":[\"string\"],\"recommendations\":[\"string\"],\"confidence\":\"low|medium|high\"}",
  ].join("\n");
}

export function parseCodexJsonlFinalMessage(jsonl: string): string {
  let finalMessage = "";
  for (const line of jsonl.split("\n").filter(Boolean)) {
    const parsed = JSON.parse(line) as { item?: { type?: string; text?: string } };
    if (parsed.item?.type === "agent_message" && typeof parsed.item.text === "string") {
      finalMessage = parsed.item.text;
    }
  }
  if (finalMessage.length === 0) throw new Error("Codex read-only delegation returned no final agent message.");
  return finalMessage;
}

async function runCodexCli(prompt: string, timeoutMs: number): Promise<string> {
  const { stdout } = await execFileAsync("codex", ["exec", "--json", "--sandbox", "read-only", prompt], {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024 * 4,
  });
  return stdout;
}

function parseDelegationJson(
  text: string,
): Omit<ReadOnlyDelegationResult, "requestId" | "threadId" | "target" | "status" | "rawOutput" | "completedAt"> {
  const parsed = JSON.parse(text) as {
    summary?: unknown;
    evidence?: unknown;
    risks?: unknown;
    recommendations?: unknown;
    confidence?: unknown;
  };
  const confidence =
    parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high"
      ? parsed.confidence
      : "low";
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "Codex returned an unstructured summary.",
    evidence: toStringArray(parsed.evidence),
    risks: toStringArray(parsed.risks),
    recommendations: toStringArray(parsed.recommendations),
    confidence,
  };
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
