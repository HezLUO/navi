import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { assertUnlinkedArtifact, confinedCodexPath } from "./navi-codex-home";

export type TransactionOperation = "create" | "modify" | "remove";
export type TransactionStage = "prepared" | "backed-up" | "published";
export type TransactionCheckpoint = "after-plan-verification" | "after-backup-move" | "before-publish" | "after-publish" | "before-cleanup";
export interface TransactionCheckpointPaths { targetPath: string; transactionDir: string; manifestPath: string; stagePath: string; backupPath: string; lockPath: string; }
export interface TransactionDependencies { isProcessAlive?: (pid: number) => Promise<boolean | undefined>; checkpoint?: (name: TransactionCheckpoint, paths: TransactionCheckpointPaths) => Promise<void>; syncDirectory?: (directory: string) => Promise<void>; }
export interface NaviTransactionManifest { version: 1; id: string; operation: TransactionOperation; target: "AGENTS.md"; stage: TransactionStage; expectedHash?: string; desiredHash?: string; pid: number; createdAt: string; }
export interface NaviTransactionLock { version: 1; id: string; pid: number; }
/** @deprecated Compatibility name for callers that consumed the prior manifest type. */
export type NaviTransactionRecord = NaviTransactionManifest;
export type TransactionInspection =
  | { kind: "none" } | { kind: "live-lock"; lockPath: string }
  | { kind: "recoverable-restore"; record: NaviTransactionManifest; manifestPath: string }
  | { kind: "recoverable-cleanup"; record: NaviTransactionManifest; manifestPath: string }
  | { kind: "conflict"; diagnostic: string; record?: NaviTransactionManifest; manifestPath?: string };
export type RecoverableInspection = Extract<TransactionInspection, { kind: "recoverable-restore" | "recoverable-cleanup" }>;
export interface ApplyTransactionInput { root: string; operation: TransactionOperation; expectedContent?: string; desiredContent?: string; id?: string; dependencies?: TransactionDependencies; }

const PREFIX = ".AGENTS.md.navi-transaction-"; const LOCK = ".AGENTS.md.navi-lock";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const isHash = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/i.test(value);
const artifact = (root: string, name: string) => confinedCodexPath(root, name);
async function syncDirectory(root: string) { const handle = await fs.open(root, "r"); try { await handle.sync(); } finally { await handle.close(); } }
async function durabilityBarrier(directory: string, dependencies: TransactionDependencies) { await (dependencies.syncDirectory ?? syncDirectory)(directory); }
async function writeExclusive(file: string, text: string, dependencies: TransactionDependencies, mode = 0o600) { const handle = await fs.open(file, "wx", mode); try { await handle.writeFile(text); await handle.sync(); } finally { await handle.close(); } await durabilityBarrier(path.dirname(file), dependencies); }
async function replaceOwned(file: string, text: string, dependencies: TransactionDependencies) { const handle = await fs.open(file, "r+"); try { await handle.truncate(0); await handle.writeFile(text); await handle.sync(); } finally { await handle.close(); } await durabilityBarrier(path.dirname(file), dependencies); }
async function content(file: string): Promise<string | undefined> { try { if (await assertUnlinkedArtifact(file) !== "file") return undefined; return await fs.readFile(file, "utf8"); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; } }
function paths(root: string, id: string): TransactionCheckpointPaths { const transactionDir = artifact(root, `${PREFIX}${id}`); return { targetPath: artifact(root, "AGENTS.md"), transactionDir, manifestPath: path.join(transactionDir, "manifest.json"), stagePath: path.join(transactionDir, "stage"), backupPath: path.join(transactionDir, "backup"), lockPath: artifact(root, LOCK) }; }
function assertManifest(value: unknown, expectedId: string): asserts value is NaviTransactionManifest {
  const m = value as Partial<NaviTransactionManifest> & Record<string, unknown>;
  if (m.version !== 1 || m.id !== expectedId || m.target !== "AGENTS.md" || !["create", "modify", "remove"].includes(m.operation ?? "") || !["prepared", "backed-up", "published"].includes(m.stage ?? "") || !Number.isInteger(m.pid) || m.pid! <= 0 || typeof m.createdAt !== "string" || !m.createdAt || "stageFile" in m || "backupFile" in m) throw new Error("Transaction manifest is invalid or names unowned artifacts.");
  if (m.operation === "create") { if (!isHash(m.desiredHash) || m.expectedHash !== undefined) throw new Error("Create manifest has invalid hashes."); }
  if (m.operation === "modify" && (!isHash(m.expectedHash) || !isHash(m.desiredHash))) throw new Error("Modify manifest has invalid hashes.");
  if (m.operation === "remove" && (!isHash(m.expectedHash) || m.desiredHash !== undefined)) throw new Error("Remove manifest has invalid hashes.");
}
async function findManifest(root: string): Promise<{ record: NaviTransactionManifest; manifestPath: string; paths: TransactionCheckpointPaths } | undefined> {
  const entries = await fs.readdir(root, { withFileTypes: true }); const found = entries.filter((entry) => entry.name.startsWith(PREFIX));
  if (!found.length) return undefined; if (found.length !== 1) throw new Error("Multiple Navi transaction directories require manual resolution.");
  const entry = found[0]; if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error("Transaction directory is not a regular directory.");
  const id = entry.name.slice(PREFIX.length); if (!id || path.basename(id) !== id) throw new Error("Transaction directory has an invalid owner.");
  const p = paths(root, id); const raw = await content(p.manifestPath); if (!raw) throw new Error("Transaction manifest is missing."); let record: unknown; try { record = JSON.parse(raw); } catch { throw new Error("Transaction manifest is not valid JSON."); } assertManifest(record, id); return { record, manifestPath: p.manifestPath, paths: p };
}
async function alive(pid: number, dependencies: TransactionDependencies) { if (dependencies.isProcessAlive) return dependencies.isProcessAlive(pid); try { process.kill(pid, 0); return true; } catch (error) { return (error as NodeJS.ErrnoException).code === "ESRCH" ? false : undefined; } }
function assertLock(value: unknown, record: NaviTransactionManifest): asserts value is NaviTransactionLock {
  const lock = value as Partial<NaviTransactionLock>;
  if (lock.version !== 1 || lock.id !== record.id || lock.pid !== record.pid || !Number.isInteger(lock.pid) || lock.pid <= 0) throw new Error("Transaction lock does not match its manifest.");
}
async function clean(root: string, p: TransactionCheckpointPaths, record: NaviTransactionManifest, dependencies: TransactionDependencies) {
  const lock = await content(p.lockPath);
  if (lock !== undefined) {
    let parsed: unknown;
    try { parsed = JSON.parse(lock); } catch { throw new Error("Transaction lock is malformed."); }
    assertLock(parsed, record);
  }
  await fs.rm(p.transactionDir, { recursive: true });
  await durabilityBarrier(root, dependencies);
  if (lock !== undefined) { await fs.unlink(p.lockPath); await durabilityBarrier(root, dependencies); }
}

export async function inspectTransaction(root: string, dependencies: TransactionDependencies = {}): Promise<TransactionInspection> {
  let found: Awaited<ReturnType<typeof findManifest>>; try { found = await findManifest(root); } catch (error) { return { kind: "conflict", diagnostic: (error as Error).message }; }
  const lockPath = artifact(root, LOCK); let lockRaw: string | undefined; try { lockRaw = await content(lockPath); } catch (error) { return { kind: "conflict", diagnostic: (error as Error).message }; }
  if (lockRaw !== undefined) {
    let lock: unknown; try { lock = JSON.parse(lockRaw); } catch { return { kind: "conflict", diagnostic: "Transaction lock is malformed." }; }
    try { if (!found) throw new Error("Transaction lock does not match its manifest."); assertLock(lock, found.record); } catch { return { kind: "conflict", diagnostic: "Transaction lock does not match its manifest.", ...(found ? { record: found.record, manifestPath: found.manifestPath } : {}) }; }
    const pairedLock = lock as NaviTransactionLock;
    const running = await alive(pairedLock.pid, dependencies); if (running === true) return { kind: "live-lock", lockPath }; if (running === undefined) return { kind: "conflict", diagnostic: "Transaction lock liveness cannot be determined.", record: found.record, manifestPath: found.manifestPath };
  }
  if (!found) return { kind: "none" }; const { record, manifestPath, paths: p } = found; const target = await content(p.targetPath); const stage = await content(p.stagePath); const backup = await content(p.backupPath);
  const conflict = (diagnostic: string): TransactionInspection => ({ kind: "conflict", diagnostic, record, manifestPath });
  if (record.operation === "create") { if (stage === undefined || digest(stage) !== record.desiredHash) return conflict("Create transaction stage is missing or has unexpected content."); if (target === undefined || digest(target) === record.desiredHash) return { kind: "recoverable-cleanup", record, manifestPath }; return conflict("Create transaction requires manual resolution."); }
  if (record.operation === "modify") {
    if (stage === undefined || digest(stage) !== record.desiredHash) return conflict("Modify transaction stage is missing or has unexpected content.");
    if (record.stage === "prepared" && target !== undefined && digest(target) === record.expectedHash) return { kind: "recoverable-cleanup", record, manifestPath };
    if (backup === undefined || digest(backup) !== record.expectedHash) return conflict("Transaction backup is missing or has unexpected content.");
    if (target === undefined && record.stage !== "published") return { kind: "recoverable-restore", record, manifestPath };
    if (target !== undefined && digest(target) === record.desiredHash) return { kind: "recoverable-cleanup", record, manifestPath };
    return conflict("Transaction target has unexpected content.");
  }
  if (record.stage === "prepared" && target !== undefined && digest(target) === record.expectedHash) return { kind: "recoverable-cleanup", record, manifestPath };
  if (backup === undefined || digest(backup) !== record.expectedHash) return conflict("Transaction backup is missing or has unexpected content.");
  if (target === undefined) return record.stage === "prepared" ? { kind: "recoverable-restore", record, manifestPath } : { kind: "recoverable-cleanup", record, manifestPath };
  return conflict("Transaction target has unexpected content.");
}
export async function recoverTransaction(root: string, inspection: RecoverableInspection): Promise<void> {
  const current = await inspectTransaction(root);
  if (current.kind !== inspection.kind || current.record.id !== inspection.record.id || current.manifestPath !== inspection.manifestPath) throw new Error("Transaction recovery evidence changed; resolve manually.");
  const p = paths(root, current.record.id);
  if (current.kind === "recoverable-restore") { if (await content(p.targetPath) !== undefined) throw new Error("Transaction recovery evidence changed; resolve manually."); await fs.link(p.backupPath, p.targetPath); await syncDirectory(root); }
  await clean(root, p, current.record, {});
}
export async function applyAgentsTransaction(input: ApplyTransactionInput): Promise<void> {
  const root = path.resolve(input.root); const id = input.id ?? randomUUID(); if (path.basename(id) !== id) throw new Error("Transaction id must be a basename."); const p = paths(root, id); const deps = input.dependencies ?? {}; let lockOwned = false;
  await fs.mkdir(p.transactionDir, { mode: 0o700 }); await durabilityBarrier(root, deps);
  try { await writeExclusive(p.lockPath, JSON.stringify({ version: 1, id, pid: process.pid } satisfies NaviTransactionLock), deps); lockOwned = true; const initial = await content(p.targetPath); if ((input.operation === "create" && initial !== undefined) || (input.operation !== "create" && initial !== input.expectedContent)) throw new Error("Global AGENTS.md changed after setup was planned."); if (input.operation !== "remove" && input.desiredContent === undefined) throw new Error("Transaction desired content is required."); const record: NaviTransactionManifest = { version: 1, id, operation: input.operation, target: "AGENTS.md", pid: process.pid, ...(input.operation === "create" ? { desiredHash: digest(input.desiredContent!) } : { expectedHash: digest(input.expectedContent ?? ""), ...(input.operation === "modify" ? { desiredHash: digest(input.desiredContent!) } : {}) }), stage: "prepared", createdAt: new Date().toISOString() }; if (input.operation !== "remove") await writeExclusive(p.stagePath, input.desiredContent!, deps); await writeExclusive(p.manifestPath, JSON.stringify(record), deps); await deps.checkpoint?.("after-plan-verification", p);
    if (input.operation !== "create") { if (await content(p.targetPath) !== input.expectedContent) throw new Error("Global AGENTS.md changed after setup was planned."); await fs.rename(p.targetPath, p.backupPath); await durabilityBarrier(root, deps); if (await content(p.backupPath) !== input.expectedContent) throw new Error("Global AGENTS.md backup has unexpected content."); record.stage = "backed-up"; await replaceOwned(p.manifestPath, JSON.stringify(record), deps); await deps.checkpoint?.("after-backup-move", p); }
    if (input.operation !== "remove") { await deps.checkpoint?.("before-publish", p); if (await content(p.targetPath) !== undefined) throw new Error("Global AGENTS.md appeared before publication."); await fs.link(p.stagePath, p.targetPath); await durabilityBarrier(root, deps); if (await content(p.targetPath) !== input.desiredContent) throw new Error("Global AGENTS.md publication has unexpected content."); }
    record.stage = "published"; await replaceOwned(p.manifestPath, JSON.stringify(record), deps); await deps.checkpoint?.("after-publish", p); await deps.checkpoint?.("before-cleanup", p);
    if (input.operation !== "remove" && await content(p.targetPath) !== input.desiredContent) throw new Error("Global AGENTS.md changed after publication.");
    if (input.operation === "remove" && await content(p.targetPath) !== undefined) throw new Error("Global AGENTS.md reappeared after removal.");
    await clean(root, p, record, deps);
  } catch (error) { if (!lockOwned) { try { await fs.rmdir(p.transactionDir); await durabilityBarrier(root, deps); } catch {} } else await durabilityBarrier(root, deps); throw error; }
}
