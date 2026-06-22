import { constants } from "node:fs";
import { lstat, open, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type {
  WorkingThreadSummary,
  WorkingThreadUpdateProposal,
} from "../core/working-thread-contract";
import {
  applyWorkingThreadSectionPatches,
  parseWorkingThreadMarkdown,
  type ParsedWorkingThreadDocument,
  summarizeWorkingThread,
} from "./working-thread-markdown";

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
      const parsed = await readParsedThread(recordsDir, proposal.threadId);

      if (parsed.malformed || !parsed.thread) {
        throw new Error(`Cannot apply Working Thread proposal to malformed record: ${proposal.threadId}.`);
      }

      if (parsed.thread.lastUpdated !== proposal.baseLastUpdated) {
        throw new Error(
          `Stale Working Thread proposal ${proposal.proposalId}: base last updated ${proposal.baseLastUpdated} does not match current ${parsed.thread.lastUpdated}.`,
        );
      }

      const patchedMarkdown = applyWorkingThreadSectionPatches(
        parsed.rawMarkdown,
        proposal.changes,
      );
      const recordPath = resolveRecordPath(recordsDir, proposal.threadId);
      const patched = parseWorkingThreadMarkdown({
        id: proposal.threadId,
        sourcePath: recordPath,
        markdown: patchedMarkdown,
      });

      if (patched.malformed || !patched.thread) {
        throw new Error(`Cannot apply Working Thread proposal because patched record is malformed: ${proposal.threadId}.`);
      }

      await writeRecordFile(recordsDir, proposal.threadId, patchedMarkdown);

      return patched;
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

  return resolved;
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
  return readFile(recordPath, "utf8");
}

async function writeRecordFile(
  recordsDir: string,
  threadId: string,
  markdown: string,
): Promise<void> {
  const recordPath = await ensureRecordFileSafe(recordsDir, threadId);
  const file = await open(recordPath, getNoFollowWriteFlags());

  try {
    await file.writeFile(markdown, "utf8");
  } finally {
    await file.close();
  }
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

  return recordPath;
}

async function ensureRecordsDirSafe(
  recordsDir: string,
  options: { allowMissing: boolean },
): Promise<boolean> {
  const pathsToCheck = [
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

function getNoFollowWriteFlags(): number {
  if (typeof constants.O_NOFOLLOW !== "number") {
    throw new Error("Cannot safely write Working Thread record: O_NOFOLLOW is unavailable.");
  }

  return constants.O_WRONLY | constants.O_TRUNC | constants.O_NOFOLLOW;
}
