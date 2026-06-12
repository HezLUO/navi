import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EventStore } from "../../src/core/event-store";
import { TraceStore } from "../../src/core/trace-store";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-events-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("EventStore", () => {
  it("records schema-versioned runtime events", async () => {
    const repo = await makeRepo();
    const store = new EventStore(repo);
    const event = await store.recordEvent({
      sessionId: "session-1",
      source: "runtime",
      kind: "session_recovered",
      visibility: "internal",
      scope: "session",
      payload: { reason: "api_restart" },
      provenance: { route: "GET /api/session/current" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: "recover-session-1",
    });

    expect(event.schemaVersion).toBe(1);
    expect(event.kind).toBe("session_recovered");
    expect(event.receivedAt).toBeTruthy();
    expect(await store.readEvents("session-1")).toHaveLength(1);
  });

  it("deduplicates events by idempotency key", async () => {
    const repo = await makeRepo();
    const store = new EventStore(repo);
    const input = {
      sessionId: "session-1",
      source: "user" as const,
      kind: "user_refusal" as const,
      visibility: "reviewable" as const,
      scope: "session" as const,
      payload: { refused: "global memory" },
      provenance: {},
      memoryEligibility: "session_only" as const,
      riskLevel: "low" as const,
      idempotencyKey: "refusal-1",
    };

    const first = await store.recordEvent(input);
    const second = await store.recordEvent(input);

    expect(second.id).toBe(first.id);
    expect(await store.readEvents("session-1")).toHaveLength(1);
  });

  it("throws when event JSONL is malformed", async () => {
    const repo = await makeRepo();
    const store = new EventStore(repo);
    await fs.mkdir(path.join(repo, ".along", "events"), { recursive: true });
    await fs.writeFile(path.join(repo, ".along", "events", "session-1.jsonl"), "{not json\n");

    await expect(store.readEvents("session-1")).rejects.toThrow();
  });
});

describe("TraceStore", () => {
  it("records trace entries for runtime decisions", async () => {
    const repo = await makeRepo();
    const store = new TraceStore(repo);
    await store.recordTrace({
      sessionId: "session-1",
      operation: "recoverCurrentSession",
      inputs: ["current.json", "sessions/session-1.json"],
      decision: "restore",
      reason: "current pointer is valid",
      relatedEventIds: ["event-1"],
      outcome: "recovered",
    });

    const traces = await store.readTraces("session-1");
    expect(traces[0]).toMatchObject({
      operation: "recoverCurrentSession",
      decision: "restore",
      outcome: "recovered",
    });
  });

  it("throws when trace JSONL is malformed", async () => {
    const repo = await makeRepo();
    const store = new TraceStore(repo);
    await fs.mkdir(path.join(repo, ".along", "traces"), { recursive: true });
    await fs.writeFile(path.join(repo, ".along", "traces", "session-1.jsonl"), "{not json\n");

    await expect(store.readTraces("session-1")).rejects.toThrow();
  });
});
