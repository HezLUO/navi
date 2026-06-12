import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { OpenThreadStore } from "../../src/core/open-thread-store";
import { getOpenThreadsPath } from "../../src/core/paths";
import type { OpenThread } from "../../src/core/types";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-threads-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("OpenThreadStore", () => {
  it("initializes with no active threads", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);

    expect(await store.readAll()).toEqual([]);
  });

  it("upserts and sorts threads by update time", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert(makeThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Implementation order affects Along's foundation.",
      currentJudgment: "Runtime Doctor should be finished before Memory v2.",
      nextAttentionTrigger: "Runtime implementation progress changes.",
      interventionThreshold: "Approved plan and implementation diverge.",
    }));

    await store.appendEvidence("thread-1", {
      id: "evidence-1",
      at: "2026-06-12T00:05:00.000Z",
      kind: "implementation_signal",
      sourceRef: "docs:runtime-progress",
      summary: "Doctor API is still missing.",
      strength: "strong",
    });

    const [thread] = await store.readActive();
    expect(thread.title).toBe("Runtime plan drift");
    expect(thread.evidence).toHaveLength(1);
    expect(thread.updatedAt).toBe("2026-06-12T00:05:00.000Z");
  });

  it("records delegation references without duplicating them", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.createSeedThread({
      id: "thread-1",
      title: "Agent identity",
      whyItMatters: "Along should stay focused on self-initiation and companionship.",
      currentJudgment: "Along is a conductor companion, not a default executor.",
    });

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "requested",
      createdAt: "2026-06-12T00:00:00.000Z",
    });
    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "requested",
      createdAt: "2026-06-12T00:00:00.000Z",
    });

    const [thread] = await store.readAll();
    expect(thread.delegationHistory).toHaveLength(1);
  });

  it("maps cancelled delegation references to watching instead of delegated", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.createSeedThread({
      id: "thread-1",
      title: "Agent identity",
      whyItMatters: "Along should stay focused on self-initiation and companionship.",
      currentJudgment: "Along is a conductor companion, not a default executor.",
    });

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "cancelled",
      createdAt: "2026-06-12T00:00:00.000Z",
      resultRef: "delegation:delegation-1:result",
    });

    const [thread] = await store.readAll();
    expect(thread.status).toBe("watching");
    expect(thread.delegationHistory[0]).toMatchObject({ status: "cancelled" });
  });

  it("maps completed delegation references on non-needs_user threads to watching", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.createSeedThread({
      id: "thread-1",
      title: "Agent identity",
      whyItMatters: "Along should stay focused on self-initiation and companionship.",
      currentJudgment: "Along is a conductor companion, not a default executor.",
    });

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "completed",
      createdAt: "2026-06-12T00:00:00.000Z",
      resultRef: "delegation:delegation-1:result",
    });

    const [thread] = await store.readAll();
    expect(thread.status).toBe("watching");
    expect(thread.delegationHistory[0]).toMatchObject({ status: "completed" });
  });

  it("preserves needs_user when recording a cancelled delegation reference", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert(makeThread({
      id: "thread-1",
      status: "needs_user",
      currentJudgment: "Runtime implementation needs user attention.",
      updatedAt: "2026-06-12T00:05:00.000Z",
    }));

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "cancelled",
      createdAt: "2026-06-12T00:06:00.000Z",
      resultRef: "delegation:delegation-1:result",
    }, "2026-06-12T00:06:00.000Z");

    const [thread] = await store.readAll();
    expect(thread.status).toBe("needs_user");
    expect(thread.delegationHistory[0]).toMatchObject({ status: "cancelled" });
  });

  it("preserves needs_user when stale requested ref hits completed delegation history", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert(makeThread({
      id: "thread-1",
      status: "needs_user",
      currentJudgment: "Runtime implementation needs user attention.",
      updatedAt: "2026-06-12T00:05:00.000Z",
      delegationHistory: [{
        delegationId: "delegation-1",
        target: "codex",
        status: "completed",
        createdAt: "2026-06-12T00:01:00.000Z",
        resultRef: "delegation:delegation-1:result",
      }],
    }));

    await store.recordDelegation("thread-1", {
      delegationId: "delegation-1",
      target: "codex",
      status: "requested",
      createdAt: "2026-06-12T00:01:00.000Z",
    });

    const [thread] = await store.readAll();
    expect(thread.status).toBe("needs_user");
    expect(thread.delegationHistory).toHaveLength(1);
    expect(thread.delegationHistory[0]).toMatchObject({
      delegationId: "delegation-1",
      status: "completed",
      resultRef: "delegation:delegation-1:result",
    });
  });

  it.each(["completed", "failed", "cancelled"] as const)(
    "does not downgrade %s delegation history when stale requested ref arrives",
    async (status) => {
      const repo = await makeRepo();
      const store = new OpenThreadStore(repo);
      await store.createSeedThread({
        id: "thread-1",
        title: "Agent identity",
        whyItMatters: "Along should stay focused on self-initiation and companionship.",
        currentJudgment: "Along is a conductor companion, not a default executor.",
      });

      await store.recordDelegation("thread-1", {
        delegationId: "delegation-1",
        target: "codex",
        status,
        createdAt: "2026-06-12T00:05:00.000Z",
        resultRef: "delegation:delegation-1:result",
      });
      await store.recordDelegation("thread-1", {
        delegationId: "delegation-1",
        target: "codex",
        status: "requested",
        createdAt: "2026-06-12T00:01:00.000Z",
      });

      const [thread] = await store.readAll();
      expect(thread.status).toBe(status === "failed" ? "needs_user" : "watching");
      expect(thread.delegationHistory).toHaveLength(1);
      expect(thread.delegationHistory[0]).toMatchObject({
        status,
        resultRef: "delegation:delegation-1:result",
      });
    },
  );

  it("does not clobber malformed open thread storage on mutation", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    const threadsPath = getOpenThreadsPath(repo);
    const invalidContent = "{ invalid json\n";
    await fs.mkdir(path.dirname(threadsPath), { recursive: true });
    await fs.writeFile(threadsPath, invalidContent);

    await expect(store.upsert(makeThread({ id: "thread-1" }))).rejects.toThrow();
    await expect(fs.readFile(threadsPath, "utf8")).resolves.toBe(invalidContent);
  });

  it("does not move updatedAt backward when appending older evidence", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert(makeThread({
      id: "thread-1",
      updatedAt: "2026-06-12T00:10:00.000Z",
    }));

    await store.appendEvidence("thread-1", {
      id: "evidence-1",
      at: "2026-06-12T00:05:00.000Z",
      kind: "implementation_signal",
      sourceRef: "docs:runtime-progress",
      summary: "Older imported evidence.",
      strength: "medium",
    });

    const [thread] = await store.readAll();
    expect(thread.updatedAt).toBe("2026-06-12T00:10:00.000Z");
    expect(thread.evidence).toHaveLength(1);
  });

  it("does not duplicate evidence or update timestamp for duplicate evidence ids", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);
    await store.upsert(makeThread({
      id: "thread-1",
      updatedAt: "2026-06-12T00:10:00.000Z",
    }));

    await store.appendEvidence("thread-1", {
      id: "evidence-1",
      at: "2026-06-12T00:15:00.000Z",
      kind: "implementation_signal",
      sourceRef: "docs:runtime-progress",
      summary: "First evidence.",
      strength: "strong",
    });
    await store.appendEvidence("thread-1", {
      id: "evidence-1",
      at: "2026-06-12T00:20:00.000Z",
      kind: "implementation_signal",
      sourceRef: "docs:runtime-progress",
      summary: "Duplicate evidence.",
      strength: "strong",
    });

    const [thread] = await store.readAll();
    expect(thread.evidence).toHaveLength(1);
    expect(thread.updatedAt).toBe("2026-06-12T00:15:00.000Z");
  });

  it("serializes concurrent open thread mutations", async () => {
    const repo = await makeRepo();
    const store = new OpenThreadStore(repo);

    await Promise.all(Array.from({ length: 20 }, (_, index) => (
      store.upsert(makeThread({
        id: `thread-${index}`,
        updatedAt: `2026-06-12T00:${String(index).padStart(2, "0")}:00.000Z`,
      }))
    )));

    const threads = await store.readAll();
    expect(threads).toHaveLength(20);
    expect(new Set(threads.map((thread) => thread.id)).size).toBe(20);
  });
});

function makeThread(input: Partial<OpenThread> & { id: string }): OpenThread {
  return {
    title: "Runtime plan drift",
    status: "open",
    whyItMatters: "Implementation order affects Along's foundation.",
    currentJudgment: "Runtime Doctor should be finished before Memory v2.",
    evidence: [],
    risks: [],
    nextAttentionTrigger: "Runtime implementation progress changes.",
    interventionThreshold: "Approved plan and implementation diverge.",
    delegationHistory: [],
    memoryLinks: [],
    traceRefs: [],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    ...input,
  };
}
