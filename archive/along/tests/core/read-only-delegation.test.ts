import { describe, expect, it } from "vitest";
import {
  buildReadOnlyDelegationPrompt,
  CodexReadOnlyAdapter,
  defaultForbiddenReadOnlyActions,
  parseCodexJsonlFinalMessage,
} from "../../src/core/read-only-delegation";
import type { ReadOnlyDelegationRequest } from "../../src/core/types";

function request(): ReadOnlyDelegationRequest {
  return {
    id: "delegation-1",
    threadId: "thread-1",
    reason: "Runtime plan drift needs external review.",
    target: "codex",
    scope: ["docs/superpowers/plans/2026-06-01-along-runtime-control-plane-lifecycle.md", "src/core"],
    forbiddenActions: defaultForbiddenReadOnlyActions,
    question: "Inspect whether runtime implementation matches the approved plan.",
    expectedOutput: ["risks", "missing tasks", "confidence"],
    budget: { timeoutMs: 120_000, maxOutputChars: 12_000 },
    returnFormat: "judgment_merge_json",
    status: "requested",
    createdAt: "2026-06-12T00:00:00.000Z",
  };
}

describe("read-only delegation", () => {
  it("builds prompts with explicit forbidden actions", () => {
    const prompt = buildReadOnlyDelegationPrompt(request());
    expect(prompt).toContain("READ-ONLY");
    expect(prompt).toContain("Do not modify files");
    expect(prompt).toContain("Inspect whether runtime implementation matches the approved plan");
  });

  it("always includes default forbidden actions even when request actions are empty", () => {
    const prompt = buildReadOnlyDelegationPrompt({ ...request(), forbiddenActions: [] });

    for (const forbiddenAction of defaultForbiddenReadOnlyActions) {
      expect(prompt).toContain(forbiddenAction);
    }
  });

  it("parses the final Codex JSONL agent message", () => {
    const jsonl = [
      JSON.stringify({ type: "thread.started", thread_id: "abc" }),
      JSON.stringify({
        type: "item.completed",
        item: {
          type: "agent_message",
          text: "{\"summary\":\"Doctor API missing\",\"evidence\":[\"No doctor.ts\"],\"risks\":[\"Plan drift\"],\"recommendations\":[\"Finish Doctor\"],\"confidence\":\"high\"}",
        },
      }),
      JSON.stringify({ type: "turn.completed" }),
    ].join("\n");

    expect(parseCodexJsonlFinalMessage(jsonl)).toContain("Doctor API missing");
  });

  it("runs through an injected Codex runner without touching files", async () => {
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) =>
        [
          JSON.stringify({
            type: "item.completed",
            item: {
              type: "agent_message",
              text: "{\"summary\":\"Reviewed\",\"evidence\":[],\"risks\":[],\"recommendations\":[],\"confidence\":\"medium\"}",
            },
          }),
        ].join("\n"),
    });

    const result = await adapter.runReadOnly(request());
    expect(result.status).toBe("completed");
    expect(result.summary).toBe("Reviewed");
    expect(result.confidence).toBe("medium");
  });

  it("rejects malformed structured output instead of completing with fallbacks", async () => {
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) =>
        [
          JSON.stringify({
            type: "item.completed",
            item: { type: "agent_message", text: "{\"summary\":\"Reviewed\"}" },
          }),
        ].join("\n"),
    });

    await expect(adapter.runReadOnly(request())).rejects.toThrow("malformed");
  });

  it("rejects invalid confidence values", async () => {
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) =>
        [
          JSON.stringify({
            type: "item.completed",
            item: {
              type: "agent_message",
              text: "{\"summary\":\"Reviewed\",\"evidence\":[],\"risks\":[],\"recommendations\":[],\"confidence\":\"certain\"}",
            },
          }),
        ].join("\n"),
    });

    await expect(adapter.runReadOnly(request())).rejects.toThrow("confidence");
  });

  it("rejects output with no final agent message", async () => {
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) =>
        [JSON.stringify({ type: "thread.started", thread_id: "abc" }), JSON.stringify({ type: "turn.completed" })].join(
          "\n",
        ),
    });

    await expect(adapter.runReadOnly(request())).rejects.toThrow("no final agent message");
  });

  it("rejects unsupported targets before invoking the runner", async () => {
    let called = false;
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) => {
        called = true;
        return "";
      },
    });

    await expect(adapter.runReadOnly({ ...request(), target: "manual" })).rejects.toThrow("Unsupported");
    expect(called).toBe(false);
  });

  it("rejects non-requested statuses before invoking the runner", async () => {
    let called = false;
    const adapter = new CodexReadOnlyAdapter({
      runCodex: async (_prompt) => {
        called = true;
        return "";
      },
    });

    await expect(adapter.runReadOnly({ ...request(), status: "completed" })).rejects.toThrow("requested");
    expect(called).toBe(false);
  });
});
