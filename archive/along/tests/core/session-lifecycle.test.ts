import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { SessionLifecycle } from "../../src/core/session-lifecycle";
import { getCurrentSessionPath, getSessionFilePath, getSessionIndexPath } from "../../src/core/paths";
import type { AlongSession } from "../../src/core/types";
import { WriteCoordinator } from "../../src/core/write-coordinator";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-lifecycle-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
  return repo;
}

function session(repo: string, id = "session-1", startedAt = "2026-06-01T00:00:00.000Z"): AlongSession {
  return {
    id,
    repoPath: repo,
    startedAt,
    state: "arriving",
    context: {
      repoPath: repo,
      repoName: "repo",
      gitStatus: "clean",
      recentCommits: [],
      manifests: [],
      directorySummary: ["src/"],
      testHints: ["npm test"],
    },
    plan: {
      state: "arriving",
      sessionId: id,
      learningGoal: "understand repo",
      currentActivity: "quietly reading",
    },
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function withFakeTimers<T>(fn: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    return await fn();
  } finally {
    vi.useRealTimers();
  }
}

describe("SessionLifecycle", () => {
  it("persists and recovers an active current session within the allowed age", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const startedAt = new Date(2026, 5, 1, 9, 0, 0).toISOString();
      vi.setSystemTime(new Date(2026, 5, 1, 10, 0, 0));
      await lifecycle.startSession(session(repo, "session-1", startedAt));

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
      const index = await lifecycle.readIndex();

      expect(recovered.session?.id).toBe("session-1");
      expect(recovered.lifecycleState).toBe("recovered");
      expect(recovered.reason).toBe("current session recovered");
      expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("recovered");
    });
  });

  it("recovers a paused current session within the allowed age", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const startedAt = new Date(2026, 5, 1, 9, 0, 0).toISOString();
      vi.setSystemTime(new Date(2026, 5, 1, 9, 15, 0));
      await lifecycle.startSession(session(repo, "session-1", startedAt));
      await lifecycle.markPaused("session-1");
      vi.setSystemTime(new Date(2026, 5, 1, 10, 0, 0));

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
      const index = await lifecycle.readIndex();

      expect(recovered.session?.id).toBe("session-1");
      expect(recovered.lifecycleState).toBe("recovered");
      expect(recovered.reason).toBe("current session recovered");
      expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("recovered");
    });
  });

  it("does not silently recover a wrapped session as active", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await lifecycle.markWrapped("session-1");

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    expect(recovered.session?.id).toBe("session-1");
    expect(recovered.lifecycleState).toBe("wrapped");
    expect(recovered.reason).toBe("current session is wrapped");
  });

  it("updates session index without duplicating same session id", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await lifecycle.startSession(session(repo));

    const index = await lifecycle.readIndex();
    expect(index.filter((item) => item.sessionId === "session-1")).toHaveLength(1);
  });

  it("rejects startSession for sessions copied from another project before writing", async () => {
    const repo = await makeRepo();
    const otherRepo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const copied = session(repo);
    copied.repoPath = otherRepo;

    await expect(lifecycle.startSession(copied)).rejects.toThrow("Session malformed: session-1");

    await expect(fs.access(getCurrentSessionPath(repo))).rejects.toThrow();
  });

  it("rejects startSession for context repo path mismatch before writing", async () => {
    const repo = await makeRepo();
    const otherRepo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const copied = session(repo);
    copied.context.repoPath = otherRepo;

    await expect(lifecycle.startSession(copied)).rejects.toThrow("Session malformed: session-1");

    await expect(fs.access(getCurrentSessionPath(repo))).rejects.toThrow();
  });

  it("rejects startSession for plan session id mismatch before writing", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const mismatched = session(repo);
    mismatched.plan.sessionId = "session-2";

    await expect(lifecycle.startSession(mismatched)).rejects.toThrow("Session malformed: session-1");

    await expect(fs.access(getCurrentSessionPath(repo))).rejects.toThrow();
  });

  it("rejects stale pause transition when current pointer has moved to another session", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo, "session-1"));
    await lifecycle.startSession(session(repo, "session-2"));

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Current session mismatch: session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(pointer).toMatchObject({ sessionId: "session-2", state: "active" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
    expect(index.find((item) => item.sessionId === "session-2")?.state).toBe("active");
  });

  it("rejects stale wrap transition when current pointer has moved to another session", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo, "session-1"));
    await lifecycle.startSession(session(repo, "session-2"));

    await expect(lifecycle.markWrapped("session-1")).rejects.toThrow("Current session mismatch: session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(pointer).toMatchObject({ sessionId: "session-2", state: "active" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
    expect(index.find((item) => item.sessionId === "session-2")?.state).toBe("active");
  });

  it("rejects transition when current pointer is malformed", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getCurrentSessionPath(repo), "{}\n");

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Current session pointer malformed");

    const index = await lifecycle.readIndex();
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not allow pause to regress a wrapped current session", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await lifecycle.markWrapped("session-1");

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Current session state incompatible: session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(pointer).toMatchObject({ sessionId: "session-1", state: "wrapped" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("wrapped");
  });

  it("does not allow wrap to regress an expired current session", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "expired" }, null, 2)}\n`);

    await expect(lifecycle.markWrapped("session-1")).rejects.toThrow("Current session state incompatible: session-1");

    const nextPointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(nextPointer).toMatchObject({ sessionId: "session-1", state: "expired" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("rejects unsafe session ids before writing session files", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const unsafeIds = ["", ".", "..", "current", "index", "nested/session"];

    for (const unsafeId of unsafeIds) {
      await expect(lifecycle.startSession(session(repo, unsafeId))).rejects.toThrow(`Invalid session id: ${unsafeId}`);
    }

    await expect(fs.access(path.join(repo, ".along", "escape.json"))).rejects.toThrow();
  });

  it("rejects unsafe transition ids before resolving session paths", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));

    await expect(lifecycle.markPaused("../escape")).rejects.toThrow("Invalid session id: ../escape");
    await expect(lifecycle.markWrapped("current")).rejects.toThrow("Invalid session id: current");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    expect(pointer).toMatchObject({ sessionId: "session-1", state: "active" });
    await expect(fs.access(path.join(repo, ".along", "escape.json"))).rejects.toThrow();
  });

  it("treats unsafe current pointer session ids as malformed during recovery", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, sessionId: "../escape" }, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
    await expect(fs.access(path.join(repo, ".along", "escape.json"))).rejects.toThrow();
  });

  it("repairs pointer and index when recovering a partially wrapped session file", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo);
    wrapped.state = "wrap_up";
    wrapped.plan.state = "wrap_up";

    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const pointer = await readJson<{ state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();

    expect(recovered.session?.id).toBe("session-1");
    expect(recovered.lifecycleState).toBe("wrapped");
    expect(recovered.reason).toBe("current session is wrapped");
    expect(pointer.state).toBe("wrapped");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("wrapped");
  });

  it("normalizes session file when recovery sees only top-level wrap_up", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo);
    wrapped.state = "wrap_up";
    wrapped.plan.state = "arriving";

    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));

    expect(recovered.lifecycleState).toBe("wrapped");
    expect(recovered.session?.state).toBe("wrap_up");
    expect(recovered.session?.plan.state).toBe("wrap_up");
    expect(persisted.state).toBe("wrap_up");
    expect(persisted.plan.state).toBe("wrap_up");
  });

  it("normalizes session file when recovery sees only plan wrap_up", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo);
    wrapped.state = "arriving";
    wrapped.plan.state = "wrap_up";

    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));

    expect(recovered.lifecycleState).toBe("wrapped");
    expect(recovered.session?.state).toBe("wrap_up");
    expect(recovered.session?.plan.state).toBe("wrap_up");
    expect(persisted.state).toBe("wrap_up");
    expect(persisted.plan.state).toBe("wrap_up");
  });

  it("does not repair wrapped recovery when pointer updatedAt is invalid", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({
      ...pointer,
      state: "wrapped",
      updatedAt: "not-a-date",
    }, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
    expect(nextPointer).toMatchObject({ state: "wrapped", updatedAt: "not-a-date" });
    expect(persisted.state).toBe("arriving");
    expect(persisted.plan.state).toBe("arriving");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair partial wrapped recovery when pointer updatedAt is an impossible ISO date", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo);
    wrapped.state = "wrap_up";
    wrapped.plan.state = "arriving";
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({
      ...pointer,
      updatedAt: "2026-02-31T00:00:00.000Z",
    }, null, 2)}\n`);
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
    expect(nextPointer).toMatchObject({ state: "active", updatedAt: "2026-02-31T00:00:00.000Z" });
    expect(persisted.state).toBe("wrap_up");
    expect(persisted.plan.state).toBe("arriving");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair wrapped recovery when session startedAt is invalid", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo, "session-1", "not-a-date");
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "wrapped" }, null, 2)}\n`);
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
    expect(nextPointer.state).toBe("wrapped");
    expect(persisted.startedAt).toBe("not-a-date");
    expect(persisted.state).toBe("arriving");
    expect(persisted.plan.state).toBe("arriving");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair partial wrapped recovery when session startedAt is an impossible ISO date", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const wrapped = session(repo, "session-1", "2026-02-31T00:00:00.000Z");
    wrapped.state = "arriving";
    wrapped.plan.state = "wrap_up";
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(wrapped, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
    expect(pointer.state).toBe("active");
    expect(persisted.startedAt).toBe("2026-02-31T00:00:00.000Z");
    expect(persisted.state).toBe("arriving");
    expect(persisted.plan.state).toBe("wrap_up");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("persists expected pointer, index, and session file shapes", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));

    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const index = await readJson<Array<Record<string, unknown>>>(getSessionIndexPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));

    expect(pointer).toMatchObject({
      sessionId: "session-1",
      state: "active",
      projectPath: repo,
      recoveryHint: "session started",
    });
    expect(typeof pointer.updatedAt).toBe("string");
    expect(index).toHaveLength(1);
    expect(index[0]).toMatchObject({
      sessionId: "session-1",
      state: "active",
      startedAt: "2026-06-01T00:00:00.000Z",
      projectPath: repo,
    });
    expect(typeof index[0].updatedAt).toBe("string");
    expect(persisted).toMatchObject({
      id: "session-1",
      repoPath: repo,
      state: "arriving",
      plan: { state: "arriving", sessionId: "session-1" },
    });
  });

  it("wrap transition preserves session changes written before the transition lock", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const originalWithRuntimeLock = WriteCoordinator.prototype.withRuntimeLock;
    const spy = vi.spyOn(WriteCoordinator.prototype, "withRuntimeLock").mockImplementation(async function (
      this: WriteCoordinator,
      operation,
      fn,
    ) {
      if (operation === "session:wrapped") {
        const updated = session(repo);
        updated.context.gitStatus = "dirty-before-lock";
        await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(updated, null, 2)}\n`);
      }

      return await originalWithRuntimeLock.call(this, operation, fn);
    });

    try {
      await lifecycle.startSession(session(repo));
      await lifecycle.markWrapped("session-1");
    } finally {
      spy.mockRestore();
    }

    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, "session-1"));
    expect(persisted.context.gitStatus).toBe("dirty-before-lock");
    expect(persisted.state).toBe("wrap_up");
    expect(persisted.plan.state).toBe("wrap_up");
  });

  it("returns a safe malformed result when current session file is an object without session shape", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), "{}\n");

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
  });

  it("returns a safe malformed result when current session has invalid presence state", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const malformed = { ...session(repo), state: "sleeping" };
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(malformed, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
  });

  it("returns a safe malformed result when current session has inconsistent non-wrap presence states", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const malformed = session(repo);
    malformed.state = "quiet_focus";
    malformed.plan.state = "arriving";
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(malformed, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
  });

  it("returns recovered sessions with top-level and plan states aligned", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const focused = session(repo);
      focused.state = "quiet_focus";
      focused.plan.state = "quiet_focus";
      vi.setSystemTime(new Date(2026, 5, 1, 10, 0, 0));
      await lifecycle.startSession(focused);

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

      expect(recovered.session?.state).toBe("arriving");
      expect(recovered.session?.plan.state).toBe("arriving");
    });
  });

  it("returns a conservative result for malformed current pointer shape", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getCurrentSessionPath(repo), "{}\n");

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
  });

  it("returns a conservative result for invalid current pointer state", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "sleeping" }, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
  });

  it("does not recover new pointer states", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "new" }, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer not recoverable");
  });

  it("repairs stale index when current pointer is already expired", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "expired" }, null, 2)}\n`);
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-1",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const index = await lifecycle.readIndex();

    expect(recovered.session?.id).toBe("session-1");
    expect(recovered.lifecycleState).toBe("expired");
    expect(recovered.reason).toBe("current session expired");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("expired");
  });

  it("does not repair expired pointer state when pointer updatedAt is invalid", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({
      ...pointer,
      state: "expired",
      updatedAt: "not-a-date",
    }, null, 2)}\n`);
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-1",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
    expect(nextPointer.updatedAt).toBe("not-a-date");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair expired pointer state when pointer updatedAt is an impossible ISO date", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({
      ...pointer,
      state: "expired",
      updatedAt: "2026-02-31T00:00:00.000Z",
    }, null, 2)}\n`);
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-1",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session pointer malformed");
    expect(nextPointer.updatedAt).toBe("2026-02-31T00:00:00.000Z");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair expired pointer state when session startedAt is invalid", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, state: "expired" }, null, 2)}\n`);
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(session(repo, "session-1", "not-a-date"), null, 2)}\n`);
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-1",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("does not repair expired pointer state when session startedAt is an impossible ISO date", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({
      ...pointer,
      state: "expired",
      updatedAt: "2026-06-01T01:00:00.000Z",
    }, null, 2)}\n`);
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(session(repo, "session-1", "2026-02-31T00:00:00.000Z"), null, 2)}\n`);
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-1",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
    const nextPointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
    expect(nextPointer.updatedAt).toBe("2026-06-01T01:00:00.000Z");
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("marks and returns an older than twelve hours session as expired", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const startedAt = new Date(2026, 5, 1, 8, 0, 0).toISOString();
      vi.setSystemTime(new Date(2026, 5, 1, 8, 0, 0));
      await lifecycle.startSession(session(repo, "session-1", startedAt));
      vi.setSystemTime(new Date(2026, 5, 1, 20, 1, 0));

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
      const pointer = await readJson<{ state: string }>(getCurrentSessionPath(repo));
      const index = await lifecycle.readIndex();

      expect(recovered.session?.id).toBe("session-1");
      expect(recovered.lifecycleState).toBe("expired");
      expect(recovered.reason).toBe("current session expired");
      expect(pointer.state).toBe("expired");
      expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("expired");
    });
  });

  it("marks and returns a session crossing a natural-day boundary as expired", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const startedAtDate = new Date(2026, 5, 1, 23, 30, 0);
      const startedAt = startedAtDate.toISOString();
      vi.setSystemTime(startedAtDate);
      await lifecycle.startSession(session(repo, "session-1", startedAt));
      vi.setSystemTime(new Date(2026, 5, 2, 0, 30, 0));

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
      const pointer = await readJson<{ state: string }>(getCurrentSessionPath(repo));
      const index = await lifecycle.readIndex();

      expect(recovered.session?.id).toBe("session-1");
      expect(recovered.lifecycleState).toBe("expired");
      expect(recovered.reason).toBe("current session expired");
      expect(pointer.state).toBe("expired");
      expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("expired");
    });
  });

  it("keeps wrapped sessions wrapped even when they are older than the recovery age", async () => {
    await withFakeTimers(async () => {
      const repo = await makeRepo();
      const lifecycle = new SessionLifecycle(repo);
      const startedAt = new Date(2026, 5, 1, 8, 0, 0).toISOString();
      vi.setSystemTime(new Date(2026, 5, 1, 8, 0, 0));
      await lifecycle.startSession(session(repo, "session-1", startedAt));
      await lifecycle.markWrapped("session-1");
      vi.setSystemTime(new Date(2026, 5, 2, 10, 0, 0));

      const recovered = await new SessionLifecycle(repo).recoverCurrentSession();
      const pointer = await readJson<{ state: string }>(getCurrentSessionPath(repo));
      const index = await lifecycle.readIndex();

      expect(recovered.session?.id).toBe("session-1");
      expect(recovered.lifecycleState).toBe("wrapped");
      expect(recovered.reason).toBe("current session is wrapped");
      expect(pointer.state).toBe("wrapped");
      expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("wrapped");
    });
  });

  it("returns a safe malformed result when current session plan is null", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const malformed = { ...session(repo), plan: null };
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(malformed, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file malformed");
  });

  it("treats session project path mismatches as malformed during recovery", async () => {
    const repo = await makeRepo();
    const otherRepo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const copied = session(repo);
    copied.repoPath = otherRepo;
    copied.context.repoPath = otherRepo;
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(copied, null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file mismatch");
  });

  it("rejects pause transition for malformed session without corrupting pointer or index", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), "{}\n");

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Session malformed: session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    await expect(fs.access(getSessionFilePath(repo, "undefined"))).rejects.toThrow();
    expect(pointer).toMatchObject({ sessionId: "session-1", state: "active" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("rejects transition for invalid presence states with a controlled error", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const malformed = { ...session(repo), state: "sleeping" };
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(malformed, null, 2)}\n`);

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Session malformed: session-1");
  });

  it("rejects wrap transition for malformed session with a controlled error", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const malformed = { ...session(repo), plan: null };
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(malformed, null, 2)}\n`);

    await expect(lifecycle.markWrapped("session-1")).rejects.toThrow("Session malformed: session-1");
  });

  it("rejects transition for session copied from another project before writing state", async () => {
    const repo = await makeRepo();
    const otherRepo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    const copied = session(repo);
    copied.repoPath = otherRepo;
    copied.context.repoPath = otherRepo;
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(copied, null, 2)}\n`);

    await expect(lifecycle.markPaused("session-1")).rejects.toThrow("Session malformed: session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(pointer).toMatchObject({ sessionId: "session-1", state: "active" });
    expect(index.find((item) => item.sessionId === "session-1")?.state).toBe("active");
  });

  it("treats current session id mismatches as malformed during recovery", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionFilePath(repo, "session-1"), `${JSON.stringify(session(repo, "session-2"), null, 2)}\n`);

    const recovered = await new SessionLifecycle(repo).recoverCurrentSession();

    expect(recovered.session).toBeUndefined();
    expect(recovered.lifecycleState).toBe("none");
    expect(recovered.reason).toBe("current session file mismatch");
  });

  it("recovers a malformed index as empty before writing lifecycle updates", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionIndexPath(repo), "{}\n");

    await lifecycle.markPaused("session-1");

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const index = await lifecycle.readIndex();
    expect(pointer).toMatchObject({ sessionId: "session-1", state: "paused" });
    expect(index).toHaveLength(1);
    expect(index[0]).toMatchObject({ sessionId: "session-1", state: "paused" });
  });

  it("drops unsafe, invalid-state, and other-project index entries during lifecycle writes", async () => {
    const repo = await makeRepo();
    const otherRepo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-previous",
        state: "paused",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "../escape",
        state: "paused",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "session-invalid-state",
        state: "sleeping",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "session-other-project",
        state: "paused",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: otherRepo,
      },
    ], null, 2)}\n`);

    await lifecycle.markPaused("session-1");

    const index = await lifecycle.readIndex();
    expect(index.map((item) => item.sessionId)).toEqual(["session-1", "session-previous"]);
    expect(index.find((item) => item.sessionId === "session-previous")?.state).toBe("paused");
  });

  it("dedupes existing valid index entries for other sessions during lifecycle writes", async () => {
    const repo = await makeRepo();
    const lifecycle = new SessionLifecycle(repo);
    await lifecycle.startSession(session(repo));
    await fs.writeFile(getSessionIndexPath(repo), `${JSON.stringify([
      {
        sessionId: "session-previous",
        state: "paused",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T01:00:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "session-previous",
        state: "active",
        startedAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-01T00:30:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "session-older",
        state: "wrapped",
        startedAt: "2026-05-31T00:00:00.000Z",
        updatedAt: "2026-05-31T01:00:00.000Z",
        projectPath: repo,
      },
      {
        sessionId: "session-older",
        state: "paused",
        startedAt: "2026-05-31T00:00:00.000Z",
        updatedAt: "2026-05-31T00:30:00.000Z",
        projectPath: repo,
      },
    ], null, 2)}\n`);

    await lifecycle.markPaused("session-1");

    const index = await lifecycle.readIndex();
    expect(index.map((item) => item.sessionId)).toEqual(["session-1", "session-previous", "session-older"]);
    expect(index.find((item) => item.sessionId === "session-previous")?.state).toBe("paused");
    expect(index.find((item) => item.sessionId === "session-older")?.state).toBe("wrapped");
  });
});
