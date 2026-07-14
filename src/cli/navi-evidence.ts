import { constants, type Dirent } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export interface ProjectEvidenceItem {
  relativePath: string;
  text: string;
}

export interface ProjectEvidenceInspection {
  items: ProjectEvidenceItem[];
  truncated: boolean;
}

const EVIDENCE_SNIPPET_BYTES = 12 * 1024;
const EVIDENCE_TOTAL_BYTES = 160 * 1024;
const MAX_EVIDENCE_CANDIDATES = 50;
const MAX_EVIDENCE_DIRS_VISITED = 120;
const MAX_EVIDENCE_ENTRIES_VISITED = 600;
const MAX_EVIDENCE_ENTRIES_PER_DIR = 160;
const IGNORED_EVIDENCE_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", ".turbo"]);
const KNOWN_EVIDENCE_RELATIVE_PATHS = [
  "AGENTS.md",
  "PROJECT_STATE.md",
  "README.md",
  "README",
  "STATUS.md",
  "TODO.md",
];
const NAVI_AGENTS_BLOCK_START = "<!-- NAVI:START -->";
const NAVI_AGENTS_BLOCK_END = "<!-- NAVI:END -->";

interface EvidenceCollectionState {
  candidates: string[];
  directoriesVisited: number;
  entriesVisited: number;
  truncated: boolean;
}

interface EvidenceReadResult {
  text: string;
  bytesRead: number;
  truncated: boolean;
}

export async function inspectProjectEvidence(targetDir: string): Promise<ProjectEvidenceInspection> {
  const state: EvidenceCollectionState = {
    candidates: [],
    directoriesVisited: 0,
    entriesVisited: 0,
    truncated: false,
  };
  for (const relativePath of KNOWN_EVIDENCE_RELATIVE_PATHS) {
    await addKnownEvidenceCandidateIfFile(targetDir, relativePath, state);
  }
  await collectEvidenceCandidateFiles(targetDir, "docs/along/project-maps", state);
  await collectEvidenceCandidateFiles(targetDir, ".", state);

  const candidates = state.candidates
    .sort((left, right) => evidencePriority(left) - evidencePriority(right) || compareCodePoint(left, right))
    .slice(0, MAX_EVIDENCE_CANDIDATES);
  const items: ProjectEvidenceItem[] = [];
  let remainingBytes = EVIDENCE_TOTAL_BYTES;

  for (let index = 0; index < candidates.length; index += 1) {
    if (remainingBytes <= 0) {
      state.truncated = true;
      break;
    }
    const relativePath = candidates[index];
    const raw = await readEvidenceSnippet(
      resolveTargetPath(targetDir, relativePath),
      Math.min(EVIDENCE_SNIPPET_BYTES, remainingBytes),
    );
    if (raw === undefined) continue;
    remainingBytes -= raw.bytesRead;
    state.truncated ||= raw.truncated;
    const text = relativePath === "AGENTS.md" ? stripNaviAgentsBlock(raw.text) : raw.text;
    if (text.trim().length > 0) items.push({ relativePath, text });
    if (remainingBytes <= 0 && index < candidates.length - 1) state.truncated = true;
  }

  return { items, truncated: state.truncated };
}

async function collectEvidenceCandidateFiles(
  targetDir: string,
  relativeDir: string,
  state: EvidenceCollectionState,
): Promise<void> {
  if (state.directoriesVisited >= MAX_EVIDENCE_DIRS_VISITED || state.entriesVisited >= MAX_EVIDENCE_ENTRIES_VISITED) {
    state.truncated = true;
    return;
  }

  state.directoriesVisited += 1;
  const entries = await readBoundedEvidenceDirectoryEntries(targetDir, relativeDir, state);
  for (const entry of entries.sort((left, right) => compareCodePoint(left.name, right.name))) {
    const relativePath = relativeDir === "." ? entry.name : path.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_EVIDENCE_DIRS.has(entry.name)) {
        await collectEvidenceCandidateFiles(targetDir, relativePath, state);
      }
    } else if (entry.isFile() && isEvidenceCandidate(relativePath)) {
      addEvidenceCandidate(state, relativePath);
    }
  }
}

async function readBoundedEvidenceDirectoryEntries(
  targetDir: string,
  relativeDir: string,
  state: EvidenceCollectionState,
): Promise<Dirent[]> {
  const absoluteDir = relativeDir === "." ? targetDir : resolveTargetPath(targetDir, relativeDir);
  const entries: Dirent[] = [];
  try {
    const directory = await fs.opendir(absoluteDir);
    for await (const entry of directory) {
      if (entries.length >= MAX_EVIDENCE_ENTRIES_PER_DIR || state.entriesVisited >= MAX_EVIDENCE_ENTRIES_VISITED) {
        state.truncated = true;
        break;
      }
      state.entriesVisited += 1;
      entries.push(entry);
    }
  } catch (error) {
    if (isNodeError(error) && ["ENOENT", "EACCES", "EPERM"].includes(error.code ?? "")) return [];
    throw error;
  }
  return entries;
}

async function addKnownEvidenceCandidateIfFile(
  targetDir: string,
  relativePath: string,
  state: EvidenceCollectionState,
): Promise<void> {
  if (!isEvidenceCandidate(relativePath)) return;
  try {
    const stat = await fs.lstat(resolveTargetPath(targetDir, relativePath));
    if (stat.isFile()) addEvidenceCandidate(state, relativePath);
  } catch (error) {
    if (isNodeError(error) && ["ENOENT", "EACCES", "EPERM"].includes(error.code ?? "")) return;
    throw error;
  }
}

function addEvidenceCandidate(state: EvidenceCollectionState, relativePath: string): void {
  if (state.candidates.includes(relativePath)) return;
  state.candidates.push(relativePath);
  state.candidates.sort(
    (left, right) => evidencePriority(left) - evidencePriority(right) || compareCodePoint(left, right),
  );
  if (state.candidates.length > MAX_EVIDENCE_CANDIDATES) {
    state.candidates.length = MAX_EVIDENCE_CANDIDATES;
    state.truncated = true;
  }
}

async function readEvidenceSnippet(absolutePath: string, maxBytes: number): Promise<EvidenceReadResult | undefined> {
  if (maxBytes <= 0) return { text: "", bytesRead: 0, truncated: true };
  let handle;
  try {
    handle = await fs.open(absolutePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile()) return undefined;
    if (stat.size <= maxBytes) {
      const buffer = Buffer.alloc(maxBytes);
      const { bytesRead } = await handle.read(buffer, 0, maxBytes, 0);
      return { text: buffer.subarray(0, bytesRead).toString("utf8"), bytesRead, truncated: false };
    }

    const headBytes = Math.ceil(maxBytes / 2);
    const tailBytes = maxBytes - headBytes;
    const headBuffer = Buffer.alloc(headBytes);
    const headRead = await handle.read(headBuffer, 0, headBytes, 0);
    const tailBuffer = Buffer.alloc(tailBytes);
    const tailRead = tailBytes === 0
      ? { bytesRead: 0 }
      : await handle.read(tailBuffer, 0, tailBytes, Math.max(0, stat.size - tailBytes));
    return {
      text: `${headBuffer.subarray(0, headRead.bytesRead).toString("utf8")}\n\n[Navi evidence omitted between bounded head and tail]\n\n${tailBuffer.subarray(0, tailRead.bytesRead).toString("utf8")}`,
      bytesRead: headRead.bytesRead + tailRead.bytesRead,
      truncated: true,
    };
  } catch (error) {
    if (isNodeError(error) && ["ENOENT", "EACCES", "EPERM", "EISDIR", "ELOOP"].includes(error.code ?? "")) return undefined;
    throw error;
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

function stripNaviAgentsBlock(text: string): string {
  let result = text;
  while (result.includes(NAVI_AGENTS_BLOCK_START)) {
    const start = result.indexOf(NAVI_AGENTS_BLOCK_START);
    const end = result.indexOf(NAVI_AGENTS_BLOCK_END, start);
    if (end === -1) return result;
    result = `${result.slice(0, start)}${result.slice(end + NAVI_AGENTS_BLOCK_END.length)}`;
  }
  return result;
}

function isEvidenceCandidate(relativePath: string): boolean {
  const normalized = relativePath.split(path.sep).join("/");
  const basename = path.posix.basename(normalized);
  const lowerPath = normalized.toLowerCase();
  const lowerBase = basename.toLowerCase();
  if ([".lock", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip"].some((suffix) => lowerBase.endsWith(suffix))) {
    return false;
  }
  return lowerBase.startsWith("readme")
    || lowerBase === "agents.md"
    || lowerBase === "project_state.md"
    || lowerBase.startsWith("todo")
    || lowerBase.startsWith("status")
    || lowerBase === "package.json"
    || lowerBase === "pyproject.toml"
    || (lowerPath.startsWith("docs/along/project-maps/") && lowerBase.endsWith(".md"))
    || (lowerPath.includes("/handoff") && lowerBase.endsWith(".md"))
    || (lowerPath.includes("/workflow") && lowerBase.endsWith(".md"))
    || (lowerPath.includes("/plan") && lowerBase.endsWith(".md"));
}

function evidencePriority(relativePath: string): number {
  const lower = relativePath.toLowerCase();
  if (lower === "agents.md") return 0;
  if (lower.startsWith("docs/along/project-maps/")) return 1;
  if (lower === "project_state.md") return 2;
  if (lower.startsWith("readme")) return 3;
  if (lower.startsWith("todo") || lower.startsWith("status")) return 4;
  if (lower.includes("/workflow") || lower.includes("/handoff") || lower.includes("/plan")) return 5;
  if (lower === "package.json" || lower === "pyproject.toml") return 6;
  return 99;
}

function resolveTargetPath(targetDir: string, relativePath: string): string {
  const resolvedTarget = path.resolve(targetDir);
  const resolvedPath = path.resolve(resolvedTarget, relativePath);
  const relative = path.relative(resolvedTarget, resolvedPath);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Evidence path escapes target directory: ${relativePath}`);
  }
  return resolvedPath;
}

function compareCodePoint(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
