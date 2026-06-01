import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WriteCoordinator } from "../../src/core/write-coordinator";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-write-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

async function readJsonLines(filePath: string) {
  return (await fs.readFile(filePath, "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("WriteCoordinator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("writes JSON atomically and reads fallback when missing", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "state.json");

    await expect(coordinator.readJson(filePath, { ok: false })).resolves.toEqual({ ok: false });
    await coordinator.atomicWriteJson(filePath, { ok: true });

    await expect(coordinator.readJson(filePath, { ok: false })).resolves.toEqual({ ok: true });
  });

  it("updates JSON with concurrent read-transform-write operations serialized", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "state.json");

    await Promise.all(Array.from({ length: 20 }, () => (
      coordinator.updateJson(filePath, { count: 0 }, (current) => ({ count: current.count + 1 }))
    )));

    await expect(coordinator.readJson(filePath, { count: 0 })).resolves.toEqual({ count: 20 });
  });

  it("deduplicates JSONL appends by idempotency key", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "events", "session-1.jsonl");

    await coordinator.appendJsonLine(filePath, { id: "event-1", idempotencyKey: "same-key", value: 1 });
    await coordinator.appendJsonLine(filePath, { id: "event-2", idempotencyKey: "same-key", value: 2 });

    const lines = (await fs.readFile(filePath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ id: "event-1", value: 1 });
  });

  it("deduplicates concurrent JSONL appends by idempotency key", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "events", "session-1.jsonl");

    await Promise.all(Array.from({ length: 20 }, (_, index) => (
      coordinator.appendJsonLine(filePath, {
        id: `event-${index}`,
        idempotencyKey: "same-key",
        value: index,
      })
    )));

    const lines = await readJsonLines(filePath);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ idempotencyKey: "same-key" });
  });

  it("deduplicates concurrent JSONL appends inside an active runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "events", "session-1.jsonl");

    await coordinator.withRuntimeLock("append-events", async () => {
      await Promise.all(Array.from({ length: 20 }, (_, index) => (
        coordinator.appendJsonLine(filePath, {
          id: `event-${index}`,
          idempotencyKey: "same-key",
          value: index,
        })
      )));
    });

    const lines = await readJsonLines(filePath);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ idempotencyKey: "same-key" });
  });

  it("uses unique temp paths for same-millisecond atomic writes", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "state.json");
    const openedTempPaths: string[] = [];
    const originalOpen = fs.open.bind(fs);

    vi.spyOn(Date, "now").mockReturnValue(123);
    vi.spyOn(fs, "open").mockImplementation(((...args: Parameters<typeof fs.open>) => {
      const candidatePath = String(args[0]);
      if (candidatePath.endsWith(".tmp")) openedTempPaths.push(candidatePath);
      return originalOpen(...args);
    }) as typeof fs.open);

    await Promise.all([
      coordinator.atomicWriteJson(filePath, { value: 1 }),
      coordinator.atomicWriteJson(filePath, { value: 2 }),
    ]);

    expect(new Set(openedTempPaths).size).toBe(2);
  });

  it("cleans up temp files when atomic write rename fails", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "state.json");

    vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("rename failed"));

    await expect(coordinator.atomicWriteJson(filePath, { ok: true })).rejects.toThrow("rename failed");

    const entries = await fs.readdir(path.dirname(filePath));
    expect(entries.filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("blocks a second active runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);

    await expect(coordinator.withRuntimeLock("outer", async () => {
      await expect(coordinator.withRuntimeLock("inner", async () => "nope")).rejects.toThrow("Runtime lock is active");
      return "done";
    })).resolves.toBe("done");
  });

  it("recovers a stale runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    await fs.writeFile(lockPath, JSON.stringify({
      owner: "old",
      operation: "stale",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:01:00.000Z",
    }));

    const result = await coordinator.withRuntimeLock("recovery", async (lock) => lock.recoveredStaleLock);
    await expect(fs.access(lockPath)).rejects.toThrow();
    expect(result).toBe(true);
  });

  it("recovers a malformed old runtime lock", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    await fs.writeFile(lockPath, "{not json");
    const old = new Date("2026-01-01T00:00:00.000Z");
    await fs.utimes(lockPath, old, old);

    const result = await coordinator.withRuntimeLock("recovery", async (lock) => lock.recoveredStaleLock);
    await expect(fs.access(lockPath)).rejects.toThrow();
    expect(result).toBe(true);
  });

  it("does not recover an expired runtime lock owned by a live process", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    await fs.mkdir(path.dirname(lockPath), { recursive: true });
    await fs.writeFile(lockPath, JSON.stringify({
      owner: `${process.pid}:live-owner`,
      operation: "live",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:01:00.000Z",
    }));

    await expect(coordinator.withRuntimeLock("contender", async () => "nope")).rejects.toThrow("Runtime lock is active");
    await expect(coordinator.readJson(lockPath, { owner: "missing" })).resolves.toMatchObject({
      owner: `${process.pid}:live-owner`,
    });
  });

  it("renews an active runtime lock while the callback is still running", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const repo = await makeRepo();
    const owner = new WriteCoordinator(repo);
    const contender = new WriteCoordinator(repo);
    let releaseLock!: () => void;
    let enteredLock!: () => void;
    const enteredLockPromise = new Promise<void>((resolve) => {
      enteredLock = resolve;
    });

    const activeLock = owner.withRuntimeLock("long-running", async () => {
      enteredLock();
      await new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
      return "done";
    });

    await enteredLockPromise;
    await vi.advanceTimersByTimeAsync(31_000);

    await expect(contender.withRuntimeLock("contender", async () => "nope")).rejects.toThrow("Runtime lock is active");

    releaseLock();
    await expect(activeLock).resolves.toBe("done");
  });

  it("preserves a valid runtime lock when heartbeat renewal rename fails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    const originalRename = fs.rename.bind(fs);
    let failedHeartbeatRename = false;
    let releaseLock!: () => void;
    let enteredLock!: () => void;
    const enteredLockPromise = new Promise<void>((resolve) => {
      enteredLock = resolve;
    });

    const activeLock = coordinator.withRuntimeLock("long-running", async () => {
      enteredLock();
      await new Promise<void>((resolve) => {
        releaseLock = resolve;
      });
    });

    await enteredLockPromise;
    const originalLock = await coordinator.readJson<{ owner: string }>(lockPath, { owner: "missing" });

    vi.spyOn(fs, "rename").mockImplementation((async (...args: Parameters<typeof fs.rename>) => {
      if (!failedHeartbeatRename && String(args[0]).includes("runtime.lock.") && String(args[0]).endsWith(".tmp")) {
        failedHeartbeatRename = true;
        throw new Error("heartbeat rename failed");
      }
      return originalRename(...args);
    }) as typeof fs.rename);

    await vi.advanceTimersByTimeAsync(10_000);

    await expect(coordinator.readJson(lockPath, { owner: "missing" })).resolves.toMatchObject({
      owner: originalLock.owner,
    });

    releaseLock();
    await activeLock;
    expect(failedHeartbeatRename).toBe(true);
  });

  it("does not use inherited lock context after the runtime lock is released", async () => {
    const repo = await makeRepo();
    const owner = new WriteCoordinator(repo);
    const holder = new WriteCoordinator(repo);
    const filePath = path.join(repo, ".along", "events", "session-1.jsonl");
    let releaseDeferred!: () => void;
    let deferredWrite!: Promise<void>;

    await owner.withRuntimeLock("schedule-write", async () => {
      const deferred = new Promise<void>((resolve) => {
        releaseDeferred = resolve;
      });
      deferredWrite = (async () => {
        await deferred;
        await owner.appendJsonLine(filePath, {
          id: "event-1",
          idempotencyKey: "same-key",
        });
      })();
    });

    let releaseHolder!: () => void;
    let enteredHolder!: () => void;
    const enteredHolderPromise = new Promise<void>((resolve) => {
      enteredHolder = resolve;
    });
    const activeHolder = holder.withRuntimeLock("holder", async () => {
      enteredHolder();
      await new Promise<void>((resolve) => {
        releaseHolder = resolve;
      });
    });

    await enteredHolderPromise;
    releaseDeferred();
    await expect(deferredWrite).rejects.toThrow("Runtime lock is active");
    await expect(fs.access(filePath)).rejects.toThrow();

    releaseHolder();
    await activeHolder;
  });

  it("recovers an orphaned stale runtime lock guard", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    await fs.mkdir(path.dirname(guardPath), { recursive: true });
    await fs.writeFile(guardPath, JSON.stringify({
      owner: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    await expect(coordinator.withRuntimeLock("recovery", async () => "done")).resolves.toBe("done");
    await expect(fs.access(guardPath)).rejects.toThrow();
  });

  it("recovers a malformed old runtime lock guard", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    await fs.mkdir(path.dirname(guardPath), { recursive: true });
    await fs.writeFile(guardPath, "{not json");
    const old = new Date("2026-01-01T00:00:00.000Z");
    await fs.utimes(guardPath, old, old);

    await expect(coordinator.withRuntimeLock("recovery", async () => "done")).resolves.toBe("done");
    await expect(fs.access(guardPath)).rejects.toThrow();
  });

  it("does not recover an expired runtime lock guard owned by a live process", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    await fs.mkdir(path.dirname(guardPath), { recursive: true });
    await fs.writeFile(guardPath, JSON.stringify({
      owner: `${process.pid}:live-guard`,
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    await expect(coordinator.withRuntimeLock("contender", async () => "nope")).rejects.toThrow("Runtime lock is active");
    await expect(coordinator.readJson(guardPath, { owner: "missing" })).resolves.toMatchObject({
      owner: `${process.pid}:live-guard`,
    });
  });

  it("does not acquire a runtime lock while guard recovery is active", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const recoveryPath = path.join(repo, ".along", "locks", "runtime.lock.guard.recovery");
    await fs.mkdir(path.dirname(recoveryPath), { recursive: true });
    await fs.writeFile(recoveryPath, JSON.stringify({
      owner: `${process.pid}:live-recovery`,
      createdAt: new Date().toISOString(),
    }));

    await expect(coordinator.withRuntimeLock("contender", async () => "nope")).rejects.toThrow("Runtime lock is active");
    await expect(coordinator.readJson(recoveryPath, { owner: "missing" })).resolves.toMatchObject({
      owner: `${process.pid}:live-recovery`,
    });
  });

  it("fails closed if recovery starts while acquiring a normal guard", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    const recoveryPath = `${guardPath}.recovery`;
    const originalWriteFile = fs.writeFile.bind(fs);
    let injectedRecovery = false;

    vi.spyOn(fs, "writeFile").mockImplementation((async (...args: Parameters<typeof fs.writeFile>) => {
      const options = args[2];
      const isGuardCreate = String(args[0]) === guardPath
        && typeof options === "object"
        && options !== null
        && "flag" in options
        && options.flag === "wx";
      if (isGuardCreate && !injectedRecovery) {
        injectedRecovery = true;
        await originalWriteFile(recoveryPath, JSON.stringify({
          owner: `${process.pid}:live-recovery`,
          createdAt: new Date().toISOString(),
        }));
      }
      return originalWriteFile(...args);
    }) as typeof fs.writeFile);

    await expect(coordinator.withRuntimeLock("contender", async () => "nope")).rejects.toThrow("Runtime lock is active");
    await expect(fs.access(guardPath)).rejects.toThrow();
    await expect(fs.access(recoveryPath)).resolves.toBeUndefined();
  });

  it("recovers a malformed old runtime lock guard recovery sentinel", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    const recoveryPath = `${guardPath}.recovery`;
    await fs.mkdir(path.dirname(guardPath), { recursive: true });
    await fs.writeFile(guardPath, JSON.stringify({
      owner: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));
    await fs.writeFile(recoveryPath, "{not json");
    const old = new Date("2026-01-01T00:00:00.000Z");
    await fs.utimes(recoveryPath, old, old);

    await expect(coordinator.withRuntimeLock("recovery", async () => "done")).resolves.toBe("done");
    await expect(fs.access(guardPath)).rejects.toThrow();
    await expect(fs.access(recoveryPath)).rejects.toThrow();
  });

  it("retries release cleanup after transient guard contention", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    const guardPath = `${lockPath}.guard`;
    const originalWriteFile = fs.writeFile.bind(fs);
    let failCleanupGuardAttempts = 2;

    await coordinator.withRuntimeLock("release", async () => {
      vi.spyOn(fs, "writeFile").mockImplementation((async (...args: Parameters<typeof fs.writeFile>) => {
        const options = args[2];
        const isGuardCreate = String(args[0]) === guardPath
          && typeof options === "object"
          && options !== null
          && "flag" in options
          && options.flag === "wx";
        if (isGuardCreate && failCleanupGuardAttempts > 0) {
          failCleanupGuardAttempts -= 1;
          const error = new Error("transient guard contention") as NodeJS.ErrnoException;
          error.code = "EEXIST";
          throw error;
        }
        return originalWriteFile(...args);
      }) as typeof fs.writeFile);
    });

    await expect(fs.access(lockPath)).rejects.toThrow();
    expect(failCleanupGuardAttempts).toBe(0);
  });

  it("waits through brief guard contention during release cleanup", async () => {
    const repo = await makeRepo();
    const coordinator = new WriteCoordinator(repo);
    const lockPath = path.join(repo, ".along", "locks", "runtime.lock");
    const guardPath = `${lockPath}.guard`;

    await expect(coordinator.withRuntimeLock("release", async () => {
      await fs.writeFile(guardPath, JSON.stringify({
        owner: `${process.pid}:temporary-guard`,
        createdAt: new Date().toISOString(),
      }), { flag: "wx" });

      setTimeout(() => {
        void fs.unlink(guardPath);
      }, 50);
    })).resolves.toBeUndefined();

    await expect(fs.access(lockPath)).rejects.toThrow();
  });

  it("does not allow concurrent stale guard recovery to enter locks at the same time", async () => {
    const repo = await makeRepo();
    const first = new WriteCoordinator(repo);
    const second = new WriteCoordinator(repo);
    const guardPath = path.join(repo, ".along", "locks", "runtime.lock.guard");
    await fs.mkdir(path.dirname(guardPath), { recursive: true });
    await fs.writeFile(guardPath, JSON.stringify({
      owner: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
    }));

    let activeLocks = 0;
    let maxActiveLocks = 0;
    async function holdLock(coordinator: WriteCoordinator) {
      return coordinator.withRuntimeLock("contender", async () => {
        activeLocks += 1;
        maxActiveLocks = Math.max(maxActiveLocks, activeLocks);
        await new Promise((resolve) => setTimeout(resolve, 5));
        activeLocks -= 1;
      });
    }

    const results = await Promise.allSettled([
      holdLock(first),
      holdLock(second),
    ]);

    expect(maxActiveLocks).toBe(1);
    expect(results.some((result) => result.status === "fulfilled")).toBe(true);
    await expect(fs.access(guardPath)).rejects.toThrow();
    await expect(fs.access(`${guardPath}.recovery`)).rejects.toThrow();
    await expect(fs.access(path.join(repo, ".along", "locks", "runtime.lock"))).rejects.toThrow();
  });
});
