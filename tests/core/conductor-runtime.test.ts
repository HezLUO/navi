import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ConductorRuntime } from "../../src/core/conductor-runtime";
import { OpenThreadStore } from "../../src/core/open-thread-store";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-conductor-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("ConductorRuntime", () => {
  it("runs heartbeat and prepares read-only delegation for a stale thread", async () => {
    const repo = await makeRepo();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });

    const conductor = new ConductorRuntime({ repoPath: repo });
    const result = await conductor.runHeartbeat({
      trigger: "resume",
      sessionId: "session-1",
      now: new Date("2026-06-20T00:00:00.000Z"),
    });

    expect(result.attention[0].action).toBe("read_only_delegation");
    expect(result.delegations[0]).toMatchObject({ threadId: "thread-1", target: "codex", status: "requested" });
  });

  it("ingests a delegation result and updates the thread judgment", async () => {
    const repo = await makeRepo();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Runtime plan drift blocks conductor work.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    const conductor = new ConductorRuntime({ repoPath: repo });
    const request = await conductor.createReadOnlyDelegation({
      threadId: "thread-1",
      sessionId: "session-1",
      reason: "Need review.",
      question: "Check runtime progress.",
      scope: ["src/core"],
    });

    const merge = await conductor.ingestDelegationResult({
      requestId: request.id,
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "Doctor API is missing.",
      evidence: ["No doctor endpoint."],
      risks: ["Runtime plan incomplete."],
      recommendations: ["Finish Doctor."],
      confidence: "high",
      completedAt: "2026-06-12T00:05:00.000Z",
    });

    const [thread] = await threads.readAll();
    expect(merge.shouldNotifyUser).toBe(true);
    expect(thread.currentJudgment).toContain("Doctor API is missing");
  });
});
