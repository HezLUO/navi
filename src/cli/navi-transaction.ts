import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { assertUnlinkedArtifact, confinedCodexPath } from "./navi-codex-home";

export type TransactionOperation = "create" | "modify" | "remove";
export type TransactionStage = "prepared" | "backed-up" | "published";

export interface NaviTransactionRecord {
  id: string;
  operation: TransactionOperation;
  target: "AGENTS.md";
  stageFile?: string;
  backupFile?: string;
  expectedHash?: string;
  desiredHash?: string;
  stage: TransactionStage;
  createdAt: string;
}

export type TransactionInspection =
  | { kind: "none" }
  | { kind: "live-lock"; lockPath: string }
  | { kind: "recoverable-restore"; record: NaviTransactionRecord; manifestPath: string }
  | { kind: "recoverable-cleanup"; record: NaviTransactionRecord; manifestPath: string }
  | { kind: "conflict"; diagnostic: string; record?: NaviTransactionRecord; manifestPath?: string };

export type RecoverableInspection = Extract<TransactionInspection, { kind: "recoverable-restore" | "recoverable-cleanup" }>;

export interface ApplyTransactionInput {
  root: string;
  operation: TransactionOperation;
  expectedContent?: string;
  desiredContent?: string;
  id?: string;
}

const LOCK = ".AGENTS.md.navi-lock";
const TRANSACTION_PREFIX = ".AGENTS.md.navi-transaction-";

function hash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function artifact(root: string, basename: string): string {
  return confinedCodexPath(root, basename);
}

async function syncDirectory(root: string): Promise<void> {
  const handle = await fs.open(root, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function writeExclusive(filePath: string, content: string): Promise<void> {
  const handle = await fs.open(filePath, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function updateOwnedFile(filePath: string, content: string): Promise<void> {
  const handle = await fs.open(filePath, "r+");
  try {
    await handle.truncate(0);
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function readContent(filePath: string): Promise<string | undefined> {
  try {
    await assertUnlinkedArtifact(filePath);
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function removeOwned(paths: Iterable<string>): Promise<void> {
  for (const filePath of paths) {
    try {
      await assertUnlinkedArtifact(filePath);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

function assertRecord(record: NaviTransactionRecord): void {
  if (!record.id || record.target !== "AGENTS.md" || !["create", "modify", "remove"].includes(record.operation) || !["prepared", "backed-up", "published"].includes(record.stage)) {
    throw new Error("Transaction manifest is invalid.");
  }
  for (const name of [record.stageFile, record.backupFile]) {
    if (name && path.basename(name) !== name) throw new Error("Transaction manifest contains an unsafe artifact path.");
  }
}

async function readManifest(root: string): Promise<{ record: NaviTransactionRecord; manifestPath: string } | undefined> {
  const entries = await fs.readdir(root);
  const manifests = entries.filter((entry) => entry.startsWith(TRANSACTION_PREFIX) && entry.endsWith(".json"));
  if (manifests.length === 0) return undefined;
  if (manifests.length !== 1) throw new Error("Multiple Navi transaction manifests require manual resolution.");
  const manifestPath = artifact(root, manifests[0]);
  const contents = await readContent(manifestPath);
  if (!contents) throw new Error("Transaction manifest disappeared during inspection.");
  let record: NaviTransactionRecord;
  try {
    record = JSON.parse(contents) as NaviTransactionRecord;
  } catch {
    throw new Error("Transaction manifest is not valid JSON.");
  }
  assertRecord(record);
  return { record, manifestPath };
}

async function cleanupRecord(root: string, record: NaviTransactionRecord, manifestPath: string): Promise<void> {
  const paths = [record.stageFile, record.backupFile].filter((name): name is string => Boolean(name)).map((name) => artifact(root, name));
  await removeOwned([...paths, manifestPath]);
  await syncDirectory(root);
}

export async function inspectTransaction(root: string): Promise<TransactionInspection> {
  const lockPath = artifact(root, LOCK);
  const lock = await assertUnlinkedArtifact(lockPath);
  if (lock === "file") return { kind: "live-lock", lockPath };

  let manifest: { record: NaviTransactionRecord; manifestPath: string } | undefined;
  try {
    manifest = await readManifest(root);
  } catch (error) {
    return { kind: "conflict", diagnostic: (error as Error).message };
  }
  if (!manifest) return { kind: "none" };

  const { record, manifestPath } = manifest;
  const target = await readContent(artifact(root, record.target));
  const backup = record.backupFile ? await readContent(artifact(root, record.backupFile)) : undefined;
  if (record.operation === "create") {
    if (target !== undefined && record.desiredHash && hash(target) === record.desiredHash) {
      return { kind: "recoverable-cleanup", record, manifestPath };
    }
    return { kind: "conflict", diagnostic: "Create transaction requires manual resolution.", record, manifestPath };
  }
  if (!record.expectedHash || !record.backupFile || backup === undefined || hash(backup) !== record.expectedHash) {
    return { kind: "conflict", diagnostic: "Transaction backup is missing or has unexpected content.", record, manifestPath };
  }
  if (target === undefined) return { kind: "recoverable-restore", record, manifestPath };
  if (record.operation === "modify" && record.desiredHash && hash(target) === record.desiredHash) {
    return { kind: "recoverable-cleanup", record, manifestPath };
  }
  if (record.operation === "remove" && target === undefined) return { kind: "recoverable-cleanup", record, manifestPath };
  return { kind: "conflict", diagnostic: "Transaction target has unexpected content.", record, manifestPath };
}

export async function recoverTransaction(root: string, inspection: RecoverableInspection): Promise<void> {
  const targetPath = artifact(root, "AGENTS.md");
  const backupPath = artifact(root, inspection.record.backupFile!);
  if (inspection.kind === "recoverable-restore") {
    await assertUnlinkedArtifact(targetPath);
    await assertUnlinkedArtifact(backupPath);
    await fs.link(backupPath, targetPath);
    await syncDirectory(root);
  }
  await cleanupRecord(root, inspection.record, inspection.manifestPath);
}

export async function applyAgentsTransaction(input: ApplyTransactionInput): Promise<void> {
  const root = path.resolve(input.root);
  const targetPath = artifact(root, "AGENTS.md");
  const id = input.id ?? randomUUID();
  if (path.basename(id) !== id) throw new Error("Transaction id must be a basename.");
  const lockPath = artifact(root, LOCK);
  const manifestPath = artifact(root, `${TRANSACTION_PREFIX}${id}.json`);
  const stageFile = `.AGENTS.md.navi-stage-${id}`;
  const backupFile = `.AGENTS.md.navi-backup-${id}`;
  const stagePath = artifact(root, stageFile);
  const backupPath = artifact(root, backupFile);
  const owned = new Set<string>();

  await assertUnlinkedArtifact(targetPath);
  await writeExclusive(lockPath, id);
  owned.add(lockPath);
  try {
    const initial = await readContent(targetPath);
    if (input.operation === "create" ? initial !== undefined : initial !== input.expectedContent) {
      throw new Error("Global AGENTS.md changed after setup was planned.");
    }
    if (input.operation !== "remove" && input.desiredContent === undefined) throw new Error("Transaction desired content is required.");
    const record: NaviTransactionRecord = {
      id,
      operation: input.operation,
      target: "AGENTS.md",
      ...(input.operation === "remove" ? {} : { stageFile }),
      ...(input.operation === "create" ? {} : { backupFile, expectedHash: hash(input.expectedContent ?? "") }),
      ...(input.operation === "remove" ? {} : { desiredHash: hash(input.desiredContent!) }),
      stage: "prepared",
      createdAt: new Date().toISOString(),
    };
    if (record.stageFile) {
      await writeExclusive(stagePath, input.desiredContent!);
      owned.add(stagePath);
    }
    await writeExclusive(manifestPath, JSON.stringify(record));
    owned.add(manifestPath);

    if (input.operation !== "create") {
      const current = await readContent(targetPath);
      if (current !== input.expectedContent) throw new Error("Global AGENTS.md changed after setup was planned.");
      await fs.link(targetPath, backupPath);
      owned.add(backupPath);
      if (await readContent(backupPath) !== input.expectedContent) throw new Error("Global AGENTS.md backup has unexpected content.");
      await fs.unlink(targetPath);
      record.stage = "backed-up";
      await updateOwnedFile(manifestPath, JSON.stringify(record));
    }
    if (record.stageFile) {
      await fs.link(stagePath, targetPath);
      record.stage = "published";
      await updateOwnedFile(manifestPath, JSON.stringify(record));
    }
    await syncDirectory(root);
    await removeOwned([...owned].filter((filePath) => filePath !== lockPath));
    await removeOwned([lockPath]);
    await syncDirectory(root);
  } catch (error) {
    await removeOwned([...owned].filter((filePath) => filePath === stagePath || filePath === lockPath));
    throw error;
  }
}
