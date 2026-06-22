import { constants, lstatSync, realpathSync } from "node:fs";
import { lstat, open, readdir, type FileHandle } from "node:fs/promises";
import path from "node:path";
import type {
  WorkingThreadSummary,
  WorkingThreadUpdateProposal,
} from "../core/working-thread-contract";
import {
  createWorkingThreadSectionPatch,
  parseWorkingThreadMarkdown,
  type ParsedWorkingThreadDocument,
  type WorkingThreadSectionPatchResult,
  summarizeWorkingThread,
} from "./working-thread-markdown";
import { buildWorkingThreadBaseVersion } from "./working-thread-version";

export interface WorkingThreadDocsStoreOptions {
  workspaceRoot: string;
}

export interface WorkingThreadDocsStore {
  readonly workspaceRoot: string;
  readonly recordsDir: string;
  listSummaries(): Promise<WorkingThreadSummary[]>;
  readThread(threadId: string): Promise<ParsedWorkingThreadDocument>;
  applySectionPatchProposal(
    proposal: WorkingThreadUpdateProposal,
  ): Promise<ParsedWorkingThreadDocument>;
}

const recordsDirSegments = ["docs", "along", "working-threads"];
const safeThreadIdPattern = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const baseVersionPattern = /^[a-f0-9]{64}$/;

export function createWorkingThreadDocsStore(
  options: WorkingThreadDocsStoreOptions,
): WorkingThreadDocsStore {
  const workspaceRoot = resolveWorkspaceRoot(options.workspaceRoot);
  const recordsDir = path.join(workspaceRoot, ...recordsDirSegments);

  return {
    workspaceRoot,
    recordsDir,

    async listSummaries() {
      const recordsDirExists = await ensureRecordsDirSafe(recordsDir, { allowMissing: true });
      if (!recordsDirExists) {
        return [];
      }

      const entries = await readdir(recordsDir, { withFileTypes: true }).catch((error: unknown) => {
        if (isNodeError(error) && error.code === "ENOENT") {
          return [];
        }

        throw error;
      });
      const summaries = await Promise.all(entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .filter((name) => name.endsWith(".md") && name !== "README.md")
        .map(async (name) => {
          const threadId = name.slice(0, -".md".length);
          const parsed = await readParsedThread(recordsDir, threadId);
          return summarizeWorkingThread(parsed);
        }));

      return summaries.sort((left, right) => left.id.localeCompare(right.id));
    },

    readThread(threadId) {
      return readParsedThread(recordsDir, threadId);
    },

    async applySectionPatchProposal(proposal) {
      return applyPatchProposalToRecordFile(recordsDir, proposal);
    },
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function resolveWorkspaceRoot(workspaceRoot: string): string {
  if (!workspaceRoot.trim()) {
    throw new Error("An explicit workspace root is required.");
  }

  const resolved = path.resolve(workspaceRoot);
  if (resolved === path.parse(resolved).root) {
    throw new Error("Workspace root must not be the filesystem root.");
  }

  const stats = lstatSync(resolved);
  if (stats.isSymbolicLink()) {
    throw new Error(`Refusing to use symbolic link workspace root: ${resolved}.`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`Workspace root is not a directory: ${resolved}.`);
  }

  return realpathSync(resolved);
}

async function readParsedThread(
  recordsDir: string,
  threadId: string,
): Promise<ParsedWorkingThreadDocument> {
  const recordPath = resolveRecordPath(recordsDir, threadId);
  const markdown = await readRecordFile(recordsDir, threadId);

  return parseWorkingThreadMarkdown({
    id: threadId,
    sourcePath: recordPath,
    markdown,
  });
}

function resolveRecordPath(recordsDir: string, threadId: string): string {
  if (!safeThreadIdPattern.test(threadId) || path.isAbsolute(threadId)) {
    throw new Error(`Invalid thread id: ${threadId}.`);
  }

  const resolvedRecordsDir = path.resolve(recordsDir);
  const recordPath = path.resolve(resolvedRecordsDir, `${threadId}.md`);
  const relativePath = path.relative(resolvedRecordsDir, recordPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid thread id: ${threadId}.`);
  }

  return recordPath;
}

async function readRecordFile(recordsDir: string, threadId: string): Promise<string> {
  const recordPath = await ensureRecordFileSafe(recordsDir, threadId);
  const file = await open(recordPath, getNoFollowReadFlags());

  try {
    await ensureOpenedRecordFileStillSafe(file, recordsDir, recordPath, threadId);
    return await readOpenFile(file);
  } finally {
    await file.close();
  }
}

async function applyPatchProposalToRecordFile(
  recordsDir: string,
  proposal: WorkingThreadUpdateProposal,
): Promise<ParsedWorkingThreadDocument> {
  const recordPath = await ensureRecordFileSafe(recordsDir, proposal.threadId);
  const file = await open(recordPath, getNoFollowReadWriteFlags());

  try {
    await ensureOpenedRecordFileStillSafe(file, recordsDir, recordPath, proposal.threadId);

    const currentMarkdown = await readOpenFile(file);
    const parsed = parseWorkingThreadMarkdown({
      id: proposal.threadId,
      sourcePath: recordPath,
      markdown: currentMarkdown,
    });

    validateProposalBase(parsed, proposal);

    const patch = createWorkingThreadSectionPatch(
      currentMarkdown,
      proposal.changes,
    );
    const patchedMarkdown = patch.markdown;
    const patched = parseWorkingThreadMarkdown({
      id: proposal.threadId,
      sourcePath: recordPath,
      markdown: patchedMarkdown,
    });

    if (patched.malformed || !patched.thread) {
      throw new Error(`Cannot apply Working Thread proposal because patched record is malformed: ${proposal.threadId}.`);
    }

    await createBaseVersionWriteClaim(recordsDir, proposal);

    await ensureOpenedRecordFileStillSafe(file, recordsDir, recordPath, proposal.threadId);
    const latestMarkdown = await readOpenFile(file);
    if (latestMarkdown !== currentMarkdown) {
      throw new Error(`Stale Working Thread proposal ${proposal.proposalId}: record changed before write.`);
    }

    await writeOpenFilePatch(file, currentMarkdown, patch);

    return patched;
  } finally {
    await file.close();
  }
}

async function createBaseVersionWriteClaim(
  recordsDir: string,
  proposal: WorkingThreadUpdateProposal,
): Promise<void> {
  await ensureRecordsDirSafe(recordsDir, { allowMissing: false });
  const claimPath = resolveWriteClaimPath(recordsDir, proposal);
  let claimFile: FileHandle;

  try {
    claimFile = await open(claimPath, getNoFollowExclusiveCreateFlags());
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") {
      throw new Error(
        `Stale Working Thread proposal ${proposal.proposalId}: base version is already claimed by another concurrent write.`,
      );
    }

    throw error;
  }

  try {
    await claimFile.writeFile(`${JSON.stringify({
      proposalId: proposal.proposalId,
      threadId: proposal.threadId,
      baseVersion: proposal.baseVersion,
      createdAt: new Date().toISOString(),
    })}\n`);
    await claimFile.sync();
  } finally {
    await claimFile.close();
  }
}

function resolveWriteClaimPath(
  recordsDir: string,
  proposal: WorkingThreadUpdateProposal,
): string {
  if (!safeThreadIdPattern.test(proposal.threadId) || path.isAbsolute(proposal.threadId)) {
    throw new Error(`Invalid thread id: ${proposal.threadId}.`);
  }

  if (!proposal.baseVersion || !baseVersionPattern.test(proposal.baseVersion)) {
    throw new Error(`Invalid Working Thread proposal base version: ${proposal.proposalId}.`);
  }

  const resolvedRecordsDir = path.resolve(recordsDir);
  const claimPath = path.resolve(
    resolvedRecordsDir,
    `.${proposal.threadId}.${proposal.baseVersion}.write-claim`,
  );
  const relativePath = path.relative(resolvedRecordsDir, claimPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid Working Thread proposal claim path: ${proposal.proposalId}.`);
  }

  return claimPath;
}

async function ensureRecordFileSafe(
  recordsDir: string,
  threadId: string,
): Promise<string> {
  await ensureRecordsDirSafe(recordsDir, { allowMissing: false });
  const recordPath = resolveRecordPath(recordsDir, threadId);
  const stats = await lstat(recordPath);

  if (stats.isSymbolicLink()) {
    throw new Error(`Refusing to access symbolic link Working Thread record: ${threadId}.`);
  }

  if (!stats.isFile()) {
    throw new Error(`Working Thread record is not a regular file: ${threadId}.`);
  }

  if (stats.nlink > 1) {
    throw new Error(`Refusing to access hard-linked Working Thread record alias outside the trusted scope: ${threadId}.`);
  }

  return recordPath;
}

async function ensureRecordsDirSafe(
  recordsDir: string,
  options: { allowMissing: boolean },
): Promise<boolean> {
  const pathsToCheck = [
    path.dirname(path.dirname(path.dirname(recordsDir))),
    path.dirname(path.dirname(recordsDir)),
    path.dirname(recordsDir),
    recordsDir,
  ];

  for (const currentPath of pathsToCheck) {
    try {
      const stats = await lstat(currentPath);
      if (stats.isSymbolicLink()) {
        throw new Error(`Refusing to access symbolic link in Working Thread records path: ${currentPath}.`);
      }
    } catch (error) {
      if (options.allowMissing && isNodeError(error) && error.code === "ENOENT") {
        return false;
      }

      throw error;
    }
  }

  const recordsDirStats = await lstat(recordsDir);
  if (!recordsDirStats.isDirectory()) {
    throw new Error(`Working Thread records path is not a directory: ${recordsDir}.`);
  }

  return true;
}

function validateProposalBase(
  parsed: ParsedWorkingThreadDocument,
  proposal: WorkingThreadUpdateProposal,
): void {
  if (parsed.malformed || !parsed.thread) {
    throw new Error(`Cannot apply Working Thread proposal to malformed record: ${proposal.threadId}.`);
  }

  if (parsed.thread.lastUpdated !== proposal.baseLastUpdated) {
    throw new Error(
      `Stale Working Thread proposal ${proposal.proposalId}: base last updated ${proposal.baseLastUpdated} does not match current ${parsed.thread.lastUpdated}.`,
    );
  }

  const currentBaseVersion = buildWorkingThreadBaseVersion(parsed.thread);
  if (!proposal.baseVersion || currentBaseVersion !== proposal.baseVersion) {
    throw new Error(
      `Stale Working Thread proposal ${proposal.proposalId}: base version does not match current Working Thread content.`,
    );
  }
}

async function ensureOpenedRecordFileStillSafe(
  file: FileHandle,
  recordsDir: string,
  recordPath: string,
  threadId: string,
): Promise<void> {
  const openedStats = await file.stat();
  await ensureRecordsDirSafe(recordsDir, { allowMissing: false });
  const pathStats = await lstat(recordPath);

  if (!openedStats.isFile()) {
    throw new Error(`Opened Working Thread record is not a regular file: ${threadId}.`);
  }

  if (openedStats.nlink > 1) {
    throw new Error(`Refusing to write hard-linked Working Thread record alias outside the trusted scope: ${threadId}.`);
  }

  if (pathStats.isSymbolicLink()) {
    throw new Error(`Refusing to write symbolic link Working Thread record: ${threadId}.`);
  }

  if (!pathStats.isFile()) {
    throw new Error(`Working Thread record is not a regular file: ${threadId}.`);
  }

  if (pathStats.nlink > 1) {
    throw new Error(`Refusing to write hard-linked Working Thread record alias outside the trusted scope: ${threadId}.`);
  }

  if (openedStats.dev !== pathStats.dev || openedStats.ino !== pathStats.ino) {
    throw new Error(`Refusing to write swapped Working Thread record: ${threadId}.`);
  }
}

async function readOpenFile(file: FileHandle): Promise<string> {
  const stats = await file.stat();
  const buffer = Buffer.alloc(stats.size);
  let offset = 0;

  while (offset < buffer.length) {
    const result = await file.read(
      buffer,
      offset,
      buffer.length - offset,
      offset,
    );
    if (result.bytesRead === 0) {
      break;
    }
    offset += result.bytesRead;
  }

  return buffer.subarray(0, offset).toString("utf8");
}

async function writeOpenFilePatch(
  file: FileHandle,
  currentMarkdown: string,
  patch: WorkingThreadSectionPatchResult,
): Promise<void> {
  const unchangedPrefix = currentMarkdown.slice(0, patch.firstChangedOffset);
  if (!patch.markdown.startsWith(unchangedPrefix)) {
    throw new Error("Cannot apply Working Thread patch because the unchanged prefix shifted.");
  }

  const writePosition = Buffer.byteLength(unchangedPrefix, "utf8");
  await file.truncate(writePosition);
  await writeOpenFile(file, patch.markdown.slice(patch.firstChangedOffset), writePosition);
}

async function writeOpenFile(
  file: FileHandle,
  markdown: string,
  position = 0,
): Promise<void> {
  const buffer = Buffer.from(markdown, "utf8");
  let offset = 0;

  while (offset < buffer.length) {
    const result = await file.write(
      buffer,
      offset,
      buffer.length - offset,
      position + offset,
    );
    offset += result.bytesWritten;
  }
}

function getNoFollowReadFlags(): number {
  if (typeof constants.O_NOFOLLOW !== "number") {
    throw new Error("Cannot safely read Working Thread record: O_NOFOLLOW is unavailable.");
  }

  return constants.O_RDONLY | constants.O_NOFOLLOW;
}

function getNoFollowReadWriteFlags(): number {
  if (typeof constants.O_NOFOLLOW !== "number") {
    throw new Error("Cannot safely write Working Thread record: O_NOFOLLOW is unavailable.");
  }

  return constants.O_RDWR | constants.O_NOFOLLOW;
}

function getNoFollowExclusiveCreateFlags(): number {
  if (typeof constants.O_NOFOLLOW !== "number") {
    throw new Error("Cannot safely claim Working Thread record write: O_NOFOLLOW is unavailable.");
  }

  return constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW;
}
