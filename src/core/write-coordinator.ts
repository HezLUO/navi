import fs from "node:fs/promises";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { getRuntimeLockPath } from "./paths";

interface RuntimeLockFile {
  owner: string;
  operation: string;
  createdAt: string;
  expiresAt: string;
}

interface RuntimeLockToken {
  active: boolean;
}

type StaleFileCandidate =
  | { kind: "json"; raw: string; owner?: string; createdAt: string }
  | { kind: "malformed"; raw: string; mtimeMs: number; size: number };

export interface RuntimeLockContext {
  operation: string;
  recoveredStaleLock: boolean;
}

export class WriteCoordinator {
  private static readonly lockTtlMs = 30_000;
  private static readonly lockHeartbeatMs = 10_000;

  private static readonly fileQueues = new Map<string, Promise<unknown>>();
  private static readonly runtimeQueues = new Map<string, Promise<unknown>>();

  private readonly runtimeLockContext = new AsyncLocalStorage<RuntimeLockToken>();

  constructor(private readonly repoPath: string) {}

  async readJson<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  async readJsonStrict<T>(filePath: string, fallback: T): Promise<T> {
    let raw: string;
    try {
      raw = await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return fallback;
      throw error;
    }
    return JSON.parse(raw) as T;
  }

  async updateJson<T>(filePath: string, fallback: T, transform: (current: T) => T | Promise<T>): Promise<T> {
    return this.runExclusiveFileWrite(filePath, () => (
      this.runWithRuntimeLockIfNeeded("update-json", async () => {
        const current = await this.readJson(filePath, fallback);
        const next = await transform(current);
        await this.atomicWriteJsonUnlocked(filePath, next);
        return next;
      })
    ));
  }

  async updateJsonStrict<T>(filePath: string, fallback: T, transform: (current: T) => T | Promise<T>): Promise<T> {
    return this.runExclusiveFileWrite(filePath, () => (
      this.runWithRuntimeLockIfNeeded("update-json-strict", async () => {
        const current = await this.readJsonStrict(filePath, fallback);
        const next = await transform(current);
        await this.atomicWriteJsonUnlocked(filePath, next);
        return next;
      })
    ));
  }

  async atomicWriteJson(filePath: string, value: unknown): Promise<void> {
    return this.runExclusiveFileWrite(filePath, () => (
      this.runWithRuntimeLockIfNeeded("atomic-write-json", () => this.atomicWriteJsonUnlocked(filePath, value))
    ));
  }

  async appendJsonLine(filePath: string, value: unknown): Promise<void> {
    return this.runExclusiveFileWrite(filePath, () => (
      this.runWithRuntimeLockIfNeeded("append-json-line", () => this.appendJsonLineUnlocked(filePath, value))
    ));
  }

  async withRuntimeLock<T>(operation: string, fn: (context: RuntimeLockContext) => Promise<T>): Promise<T> {
    if (this.isInsideRuntimeLock()) throw new Error("Runtime lock is active");

    const lockPath = getRuntimeLockPath(this.repoPath);
    await fs.mkdir(path.dirname(lockPath), { recursive: true });

    const guard = await this.acquireLockAcquisitionGuard(lockPath);
    let recoveredStaleLock = false;
    let lock: RuntimeLockFile | undefined;

    try {
      recoveredStaleLock = await this.recoverStaleLockIfNeeded(lockPath);
      lock = {
        owner: `${process.pid}:${randomUUID()}`,
        operation,
        createdAt: new Date().toISOString(),
        expiresAt: this.getLockExpiresAt(),
      };
      await fs.writeFile(lockPath, JSON.stringify(lock, null, 2), { flag: "wx" });
    } catch {
      throw new Error("Runtime lock is active");
    } finally {
      await this.removeLockAcquisitionGuardIfOwned(guard.path, guard.owner);
    }

    const stopHeartbeat = this.startLockHeartbeat(lockPath, lock.owner);
    const token: RuntimeLockToken = { active: true };
    try {
      return await this.runtimeLockContext.run(token, () => fn({ operation, recoveredStaleLock }));
    } finally {
      token.active = false;
      await stopHeartbeat();
      await this.removeLockIfOwned(lockPath, lock.owner);
    }
  }

  private async atomicWriteJsonUnlocked(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
    let handle: fs.FileHandle | undefined;

    try {
      handle = await fs.open(tempPath, "wx");
      await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
      await handle.sync();
      await handle.close();
      handle = undefined;
      await fs.rename(tempPath, filePath);
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => undefined);
      }
      await fs.unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }

  private async appendJsonLineUnlocked(filePath: string, value: unknown): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const key = this.getIdempotencyKey(value);
    if (key && await this.hasJsonLineWithKey(filePath, key)) return;
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error("Value is not JSON serializable");
    await fs.appendFile(filePath, `${serialized}\n`);
  }

  private isInsideRuntimeLock(): boolean {
    return this.runtimeLockContext.getStore()?.active === true;
  }

  private async runWithRuntimeLockIfNeeded<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    if (this.isInsideRuntimeLock()) return fn();
    return this.runExclusiveRuntimeWrite(() => this.withRuntimeLock(operation, async () => fn()));
  }

  private async runExclusiveFileWrite<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
    return WriteCoordinator.enqueue(WriteCoordinator.fileQueues, filePath, fn);
  }

  private async runExclusiveRuntimeWrite<T>(fn: () => Promise<T>): Promise<T> {
    return WriteCoordinator.enqueue(WriteCoordinator.runtimeQueues, this.repoPath, fn);
  }

  private static async enqueue<T>(
    queues: Map<string, Promise<unknown>>,
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const previous = queues.get(key) ?? Promise.resolve();
    const next = previous.then(fn, fn);
    queues.set(key, next);

    try {
      return await next;
    } finally {
      if (queues.get(key) === next) queues.delete(key);
    }
  }

  private async acquireLockAcquisitionGuard(lockPath: string): Promise<{ path: string; owner: string }> {
    const guardPath = `${lockPath}.guard`;
    const owner = `${process.pid}:${randomUUID()}`;
    const guard = {
      owner,
      createdAt: new Date().toISOString(),
    };

    await this.ensureNoActiveGuardRecovery(guardPath);

    try {
      await fs.writeFile(guardPath, JSON.stringify(guard, null, 2), { flag: "wx" });
      try {
        await this.ensureNoActiveGuardRecovery(guardPath);
      } catch (error) {
        await this.removeLockAcquisitionGuardIfOwned(guardPath, owner);
        throw error;
      }
      return { path: guardPath, owner };
    } catch {
      return this.acquireGuardAfterStaleRecovery(guardPath, guard, owner);
    }
  }

  private async acquireGuardAfterStaleRecovery(
    guardPath: string,
    guard: { owner: string; createdAt: string },
    owner: string,
  ): Promise<{ path: string; owner: string }> {
    const recovery = await this.acquireGuardRecoverySentinel(guardPath);

    try {
      if (!await this.recoverStaleLockAcquisitionGuardIfNeeded(guardPath)) {
        throw new Error("Runtime lock is active");
      }
      await fs.writeFile(guardPath, JSON.stringify(guard, null, 2), { flag: "wx" });
      if (!await this.isLockAcquisitionGuardOwned(recovery.path, recovery.owner)) {
        await this.removeLockAcquisitionGuardIfOwned(guardPath, owner);
        throw new Error("Runtime lock is active");
      }
      return { path: guardPath, owner };
    } catch {
      throw new Error("Runtime lock is active");
    } finally {
      await this.removeLockAcquisitionGuardIfOwned(recovery.path, recovery.owner);
    }
  }

  private async ensureNoActiveGuardRecovery(guardPath: string): Promise<void> {
    const recoveryPath = this.getGuardRecoveryPath(guardPath);

    try {
      await fs.access(recoveryPath);
    } catch {
      return;
    }

    if (!await this.recoverStaleFileIfNeeded(recoveryPath)) {
      throw new Error("Runtime lock is active");
    }
  }

  private async acquireGuardRecoverySentinel(guardPath: string): Promise<{ path: string; owner: string }> {
    const recoveryPath = this.getGuardRecoveryPath(guardPath);
    const owner = `${process.pid}:${randomUUID()}`;
    const sentinel = {
      owner,
      createdAt: new Date().toISOString(),
    };

    await this.ensureNoActiveGuardRecovery(guardPath);

    try {
      await fs.writeFile(recoveryPath, JSON.stringify(sentinel, null, 2), { flag: "wx" });
      return { path: recoveryPath, owner };
    } catch {
      throw new Error("Runtime lock is active");
    }
  }

  private async hasJsonLineWithKey(filePath: string, key: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .some((line) => {
          try {
            const parsed = JSON.parse(line) as { idempotencyKey?: unknown };
            return parsed.idempotencyKey === key;
          } catch {
            return false;
          }
        });
    } catch {
      return false;
    }
  }

  private getIdempotencyKey(value: unknown): string | undefined {
    if (typeof value !== "object" || value === null || !("idempotencyKey" in value)) return undefined;
    const key = (value as { idempotencyKey?: unknown }).idempotencyKey;
    return typeof key === "string" ? key : undefined;
  }

  private async recoverStaleLockIfNeeded(lockPath: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(lockPath, "utf8");
      try {
        const lock = JSON.parse(raw) as RuntimeLockFile;
        if (Date.parse(lock.expiresAt) > Date.now()) return false;
        if (this.isOwnerProcessAlive(lock.owner)) return false;
      } catch {
        const stat = await fs.stat(lockPath);
        if (stat.mtimeMs + WriteCoordinator.lockTtlMs > Date.now()) return false;
      }

      await fs.unlink(lockPath);
      return true;
    } catch {
      return false;
    }
  }

  private startLockHeartbeat(lockPath: string, owner: string): () => Promise<void> {
    let active = true;
    let renewal = Promise.resolve();
    const heartbeat = setInterval(() => {
      renewal = renewal.then(() => (
        active ? this.renewLockIfOwned(lockPath, owner) : undefined
      ));
    }, WriteCoordinator.lockHeartbeatMs);
    heartbeat.unref?.();

    return async () => {
      active = false;
      clearInterval(heartbeat);
      await renewal.catch(() => undefined);
    };
  }

  private async renewLockIfOwned(lockPath: string, owner: string): Promise<void> {
    let guard: { path: string; owner: string } | undefined;
    try {
      guard = await this.acquireLockAcquisitionGuard(lockPath);
      const raw = await fs.readFile(lockPath, "utf8");
      const lock = JSON.parse(raw) as RuntimeLockFile;
      if (lock.owner !== owner) return;

      const renewedLock: RuntimeLockFile = {
        ...lock,
        expiresAt: this.getLockExpiresAt(),
      };
      await this.atomicReplaceFile(lockPath, `${JSON.stringify(renewedLock, null, 2)}\n`);
    } catch {
      return;
    } finally {
      if (guard) await this.removeLockAcquisitionGuardIfOwned(guard.path, guard.owner);
    }
  }

  private async recoverStaleLockAcquisitionGuardIfNeeded(guardPath: string): Promise<boolean> {
    return this.recoverStaleFileIfNeeded(guardPath);
  }

  private async recoverStaleFileIfNeeded(filePath: string): Promise<boolean> {
    try {
      const candidate = await this.readStaleFileCandidate(filePath);
      if (!candidate || !this.isRecoverableStaleCandidate(candidate)) return false;

      const current = await this.readStaleFileCandidate(filePath);
      if (!current || !this.sameStaleFileCandidate(candidate, current)) return false;

      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async readStaleFileCandidate(filePath: string): Promise<StaleFileCandidate | undefined> {
    try {
      const [raw, stat] = await Promise.all([
        fs.readFile(filePath, "utf8"),
        fs.stat(filePath),
      ]);

      try {
        const parsed = JSON.parse(raw) as { owner?: unknown; createdAt?: unknown };
        if (typeof parsed.createdAt !== "string") {
          return { kind: "malformed", raw, mtimeMs: stat.mtimeMs, size: stat.size };
        }

        return {
          kind: "json",
          raw,
          owner: typeof parsed.owner === "string" ? parsed.owner : undefined,
          createdAt: parsed.createdAt,
        };
      } catch {
        return { kind: "malformed", raw, mtimeMs: stat.mtimeMs, size: stat.size };
      }
    } catch {
      return undefined;
    }
  }

  private isRecoverableStaleCandidate(candidate: StaleFileCandidate): boolean {
    if (candidate.kind === "json") {
      if (candidate.owner && this.isOwnerProcessAlive(candidate.owner)) return false;
      const createdAt = Date.parse(candidate.createdAt);
      if (!Number.isFinite(createdAt)) return false;
      return createdAt + WriteCoordinator.lockTtlMs <= Date.now();
    }

    return candidate.mtimeMs + WriteCoordinator.lockTtlMs <= Date.now();
  }

  private sameStaleFileCandidate(left: StaleFileCandidate, right: StaleFileCandidate): boolean {
    if (left.kind !== right.kind) return false;
    if (left.kind === "json" && right.kind === "json") {
      return left.raw === right.raw && left.owner === right.owner && left.createdAt === right.createdAt;
    }

    if (left.kind === "malformed" && right.kind === "malformed") {
      return left.raw === right.raw && left.size === right.size && left.mtimeMs === right.mtimeMs;
    }

    return false;
  }

  private getLockExpiresAt(): string {
    return new Date(Date.now() + WriteCoordinator.lockTtlMs).toISOString();
  }

  private getGuardRecoveryPath(guardPath: string): string {
    return `${guardPath}.recovery`;
  }

  private async atomicReplaceFile(filePath: string, contents: string): Promise<void> {
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
    let handle: fs.FileHandle | undefined;

    try {
      handle = await fs.open(tempPath, "wx");
      await handle.writeFile(contents);
      await handle.sync();
      await handle.close();
      handle = undefined;
      await fs.rename(tempPath, filePath);
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => undefined);
      }
      await fs.unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }

  private async removeLockIfOwned(lockPath: string, owner: string): Promise<void> {
    let lastError: unknown;
    const startedAt = Date.now();
    const maxWaitMs = 350;
    const delays = [5, 10, 20, 40, 80];
    let attempt = 0;

    while (Date.now() - startedAt <= maxWaitMs) {
      let guard: { path: string; owner: string } | undefined;
      try {
        guard = await this.acquireLockAcquisitionGuard(lockPath);
        let raw: string;
        try {
          raw = await fs.readFile(lockPath, "utf8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
          throw error;
        }
        const lock = JSON.parse(raw) as RuntimeLockFile;
        if (lock.owner === owner) await fs.unlink(lockPath);
        return;
      } catch (error) {
        lastError = error;
        await this.delay(0);
      } finally {
        if (guard) await this.removeLockAcquisitionGuardIfOwned(guard.path, guard.owner);
      }

      const delayMs = delays[Math.min(attempt, delays.length - 1)];
      attempt += 1;
      await this.delay(delayMs);
    }

    throw lastError instanceof Error ? lastError : new Error("Runtime lock cleanup failed");
  }

  private parseOwnerPid(owner: string): number | undefined {
    const [pid] = owner.split(":", 1);
    if (!pid || !/^\d+$/.test(pid)) return undefined;
    const parsed = Number(pid);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
  }

  private isOwnerProcessAlive(owner: string): boolean {
    const pid = this.parseOwnerPid(owner);
    if (!pid) return false;

    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EPERM") return true;
      return false;
    }
  }

  private async removeLockAcquisitionGuardIfOwned(guardPath: string, owner: string): Promise<void> {
    try {
      const raw = await fs.readFile(guardPath, "utf8");
      const guard = JSON.parse(raw) as { owner?: unknown };
      if (guard.owner === owner) await fs.unlink(guardPath);
    } catch {
      return;
    }
  }

  private async isLockAcquisitionGuardOwned(guardPath: string, owner: string): Promise<boolean> {
    try {
      const raw = await fs.readFile(guardPath, "utf8");
      const guard = JSON.parse(raw) as { owner?: unknown };
      return guard.owner === owner;
    } catch {
      return false;
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
