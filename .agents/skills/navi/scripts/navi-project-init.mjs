#!/usr/bin/env node

// src/cli/navi-init.ts
import path6 from "node:path";

// src/cli/navi-init-apply.ts
import fs5 from "node:fs/promises";
import path5 from "node:path";

// src/cli/navi-project-map.ts
import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
var NAVI_PROJECT_MAP_RELATIVE_PATH = ".navi/project-map.md";
var LEGACY_PROJECT_MAP_VERSION = 1;
var CURRENT_PROJECT_MAP_VERSION = 2;
var LEGACY_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty"
];
var REQUIRED_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:outcome-boundary",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty"
];
var REQUIRED_FRONTMATTER_KEYS = [
  "navi_map",
  "map_status",
  "project_status",
  "last_confirmed"
];
var FRONTMATTER_SCALAR_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):[ \t]*(\S(?:.*\S)?)[ \t]*$/;
function invalid(diagnostic, recognizedVersion) {
  return {
    kind: "invalid",
    diagnostic,
    ...recognizedVersion !== void 0 ? { recognizedVersion } : {}
  };
}
function isCalendarDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = /* @__PURE__ */ new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function parseProjectMapDocument(text) {
  const lines = text.split(/\r?\n/);
  const delimiters = lines.flatMap((line, index) => line === "---" ? [index] : []);
  if (delimiters.length !== 2 || delimiters[0] !== 0) {
    return invalid("Project Map frontmatter must have one opening and one closing --- delimiter.");
  }
  const metadata = /* @__PURE__ */ new Map();
  for (const line of lines.slice(1, delimiters[1])) {
    const match = FRONTMATTER_SCALAR_LINE.exec(line);
    if (!match) return invalid(`Project Map frontmatter contains a non-scalar metadata line: ${line}`);
    const [, key, value] = match;
    if (metadata.has(key)) return invalid(`Project Map frontmatter contains duplicate metadata key: ${key}`);
    metadata.set(key, value);
  }
  for (const key of REQUIRED_FRONTMATTER_KEYS) {
    if (!metadata.has(key)) return invalid(`Project Map frontmatter is missing required key: ${key}`);
  }
  const rawVersion = metadata.get("navi_map");
  if (!/^[+-]?\d+$/.test(rawVersion)) {
    return invalid("Project Map navi_map must be a base-10 integer.");
  }
  const version = Number(rawVersion);
  if (!Number.isSafeInteger(version)) {
    return invalid("Project Map navi_map must be a safe base-10 integer.");
  }
  if (version !== LEGACY_PROJECT_MAP_VERSION && version !== CURRENT_PROJECT_MAP_VERSION) {
    return {
      kind: "unsupported",
      version,
      diagnostic: `Project Map contract version ${version} is not supported.`
    };
  }
  if (metadata.get("map_status") !== "confirmed") {
    return invalid("Project Map map_status must be confirmed.", version);
  }
  const projectStatus = metadata.get("project_status");
  if (projectStatus !== "active" && projectStatus !== "paused" && projectStatus !== "closed") {
    return invalid("Project Map project_status must be active, paused, or closed.", version);
  }
  const lastConfirmed = metadata.get("last_confirmed");
  if (!isCalendarDate(lastConfirmed)) {
    return invalid("Project Map last_confirmed must be a valid YYYY-MM-DD calendar date.", version);
  }
  const body = lines.slice(delimiters[1] + 1).join("\n");
  if (version === LEGACY_PROJECT_MAP_VERSION && body.includes("<!-- navi:outcome-boundary -->")) {
    return invalid("Project Map version 1 must not contain the reserved anchor: navi:outcome-boundary", version);
  }
  const requiredAnchors = version === CURRENT_PROJECT_MAP_VERSION ? REQUIRED_PROJECT_MAP_ANCHORS : LEGACY_PROJECT_MAP_ANCHORS;
  let previousAnchorIndex = -1;
  for (const anchor of requiredAnchors) {
    const marker = `<!-- ${anchor} -->`;
    const firstIndex = body.indexOf(marker);
    if (firstIndex < 0) return invalid(`Project Map is missing required anchor: ${anchor}`, version);
    if (body.indexOf(marker, firstIndex + marker.length) >= 0) {
      return invalid(`Project Map contains duplicate required anchor: ${anchor}`, version);
    }
    if (firstIndex < previousAnchorIndex) {
      return invalid(`Project Map required anchor is out of order: ${anchor}`, version);
    }
    previousAnchorIndex = firstIndex;
  }
  return {
    kind: "valid",
    document: {
      version,
      mapStatus: "confirmed",
      projectStatus,
      lastConfirmed,
      outcomeBoundaryStatus: version === CURRENT_PROJECT_MAP_VERSION ? "confirmed" : "legacy-missing",
      text
    }
  };
}
function isOutcomeBoundaryOnlyUpgrade(current, candidate) {
  if (current.version !== LEGACY_PROJECT_MAP_VERSION) return false;
  if (candidate.version !== CURRENT_PROJECT_MAP_VERSION) return false;
  if (current.projectStatus !== candidate.projectStatus) return false;
  const currentSource = inspectParsedMapComparisonSource(current);
  const candidateSource = inspectParsedMapComparisonSource(candidate);
  if (currentSource === void 0 || candidateSource === void 0) return false;
  const normalizedCurrent = canonicalizeUpgradeComparisonSource(currentSource, false);
  const normalizedCandidate = canonicalizeUpgradeComparisonSource(candidateSource, true);
  return normalizedCandidate === normalizedCurrent;
}
function normalizeMapForUpgradeComparison(text) {
  return text.replace(/\r\n/g, "\n");
}
function inspectParsedMapComparisonSource(document) {
  const text = normalizeMapForUpgradeComparison(document.text);
  const lines = text.split("\n");
  const lineStarts = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
  }
  const closingDelimiter = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingDelimiter < 0) return void 0;
  const metadataLines = /* @__PURE__ */ new Map();
  for (let index = 1; index < closingDelimiter; index += 1) {
    const match = FRONTMATTER_SCALAR_LINE.exec(lines[index]);
    if (!match) return void 0;
    metadataLines.set(match[1], {
      start: lineStarts[index],
      end: lineStarts[index] + lines[index].length
    });
  }
  const bodyStart = lineStarts[closingDelimiter + 1] ?? text.length;
  const anchors = /* @__PURE__ */ new Map();
  const requiredAnchors = document.version === CURRENT_PROJECT_MAP_VERSION ? REQUIRED_PROJECT_MAP_ANCHORS : LEGACY_PROJECT_MAP_ANCHORS;
  for (const anchor of requiredAnchors) {
    const markerIndex = text.indexOf(`<!-- ${anchor} -->`, bodyStart);
    if (markerIndex < 0) return void 0;
    anchors.set(anchor, markerIndex);
  }
  return { text, metadataLines, anchors };
}
function canonicalizeUpgradeComparisonSource(source, removeOutcomeBoundary) {
  const versionLine = source.metadataLines.get("navi_map");
  const lastConfirmedLine = source.metadataLines.get("last_confirmed");
  if (versionLine === void 0 || lastConfirmedLine === void 0) return void 0;
  const edits = [
    { ...versionLine, replacement: "navi_map: <upgrade-version>" },
    { ...lastConfirmedLine, replacement: "last_confirmed: <upgrade-date>" }
  ];
  if (removeOutcomeBoundary) {
    const outcomeBoundary = source.anchors.get("navi:outcome-boundary");
    const routeToOutcome = source.anchors.get("navi:route-to-outcome");
    if (outcomeBoundary === void 0 || routeToOutcome === void 0 || outcomeBoundary >= routeToOutcome) return void 0;
    edits.push({ start: outcomeBoundary, end: routeToOutcome, replacement: "" });
  }
  return edits.sort((left, right) => right.start - left.start).reduce(
    (text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end),
    source.text
  );
}
async function inspectProjectMapFile(projectDir) {
  const mapPath = path.join(projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
  const mapDirectory = path.dirname(mapPath);
  let directoryStats;
  try {
    directoryStats = await fs.lstat(mapDirectory);
  } catch (error) {
    if (error.code === "ENOENT") return { kind: "missing", mapPath };
    return { kind: "unsafe", mapPath, diagnostic: "Project Map directory could not be inspected safely." };
  }
  if (directoryStats.isSymbolicLink()) {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map directory must not be a symbolic link." };
  }
  if (!directoryStats.isDirectory()) {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map directory must be a regular directory." };
  }
  let stats;
  try {
    stats = await fs.lstat(mapPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return await hasSameDirectoryIdentity(mapDirectory, directoryStats) ? { kind: "missing", mapPath } : { kind: "unsafe", mapPath, diagnostic: "Project Map directory changed during missing-file inspection." };
    }
    return { kind: "unsafe", mapPath, diagnostic: "Project Map path could not be inspected safely." };
  }
  if (stats.isSymbolicLink()) {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map path must not be a symbolic link." };
  }
  if (!stats.isFile()) {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map path must be a regular file." };
  }
  let handle;
  try {
    handle = await fs.open(mapPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map regular file could not be opened without following links." };
  }
  let text;
  try {
    if (!await hasSameDirectoryIdentity(mapDirectory, directoryStats)) {
      return { kind: "unsafe", mapPath, diagnostic: "Project Map directory changed between inspection and opening." };
    }
    const openedStats = await handle.stat();
    if (!openedStats.isFile()) {
      return { kind: "unsafe", mapPath, diagnostic: "Opened Project Map must be a regular file." };
    }
    if (openedStats.dev !== stats.dev || openedStats.ino !== stats.ino) {
      return { kind: "unsafe", mapPath, diagnostic: "Project Map changed between inspection and opening." };
    }
    text = await handle.readFile({ encoding: "utf8" });
  } catch {
    return { kind: "unsafe", mapPath, diagnostic: "Project Map regular file could not be read safely." };
  } finally {
    await handle.close().catch(() => void 0);
  }
  const result = parseProjectMapDocument(text);
  if (result.kind === "valid") return { kind: "valid", mapPath, document: result.document };
  if (result.kind === "unsupported") {
    return {
      kind: "unsupported",
      mapPath,
      version: result.version,
      diagnostic: result.diagnostic
    };
  }
  return result.recognizedVersion !== void 0 ? { kind: "invalid", mapPath, diagnostic: result.diagnostic, recognizedVersion: result.recognizedVersion, safelyReadText: text } : { kind: "invalid", mapPath, diagnostic: result.diagnostic };
}
async function hasSameDirectoryIdentity(directoryPath, expected) {
  try {
    const current = await fs.lstat(directoryPath);
    return current.isDirectory() && !current.isSymbolicLink() && current.dev === expected.dev && current.ino === expected.ino;
  } catch {
    return false;
  }
}

// src/cli/navi-init-plan.ts
import fs4 from "node:fs/promises";
import { constants as constants4 } from "node:fs";
import path4 from "node:path";

// src/cli/navi-evidence.ts
import { constants as constants2 } from "node:fs";
import fs2 from "node:fs/promises";
import path2 from "node:path";
var EVIDENCE_SNIPPET_BYTES = 12 * 1024;
var EVIDENCE_TOTAL_BYTES = 160 * 1024;
var MAX_EVIDENCE_CANDIDATES = 50;
var MAX_EVIDENCE_DIRS_VISITED = 120;
var MAX_EVIDENCE_ENTRIES_VISITED = 600;
var MAX_EVIDENCE_ENTRIES_PER_DIR = 160;
var IGNORED_EVIDENCE_DIRS = /* @__PURE__ */ new Set([".git", "node_" + "modules", "dist", "build", ".next", "coverage", ".turbo"]);
var KNOWN_EVIDENCE_RELATIVE_PATHS = [
  "AGENTS.md",
  "README.md",
  "README",
  "ROADMAP.md",
  "ROADMAP",
  "PLAN.md",
  "SPEC.md",
  "HANDOFF.md",
  "WORKFLOW.md",
  "PROJECT_STATE.md",
  "STATUS.md",
  "TODO.md",
  "TRACKER.md"
];
var NAVI_AGENTS_BLOCK_START = "<!-- NAVI:START -->";
var NAVI_AGENTS_BLOCK_END = "<!-- NAVI:END -->";
async function inspectProjectEvidence(targetDir) {
  const state = {
    candidates: [],
    directoriesVisited: 0,
    entriesVisited: 0,
    truncated: false
  };
  for (const relativePath of KNOWN_EVIDENCE_RELATIVE_PATHS) {
    await addKnownEvidenceCandidateIfFile(targetDir, relativePath, state);
  }
  await collectEvidenceCandidateFiles(targetDir, "docs/along/project-maps", state);
  await collectEvidenceCandidateFiles(targetDir, ".", state);
  const candidates = state.candidates.sort((left, right) => evidencePriority(left) - evidencePriority(right) || compareCodePoint(left, right)).slice(0, MAX_EVIDENCE_CANDIDATES);
  const items = [];
  let remainingBytes = EVIDENCE_TOTAL_BYTES;
  for (let index = 0; index < candidates.length; index += 1) {
    if (remainingBytes <= 0) {
      state.truncated = true;
      break;
    }
    const relativePath = candidates[index];
    const raw = await readEvidenceSnippet(
      targetDir,
      relativePath,
      Math.min(EVIDENCE_SNIPPET_BYTES, remainingBytes)
    );
    if (raw === void 0) continue;
    remainingBytes -= raw.bytesRead;
    state.truncated ||= raw.truncated;
    const text = relativePath === "AGENTS.md" ? stripNaviAgentsBlock(raw.text) : raw.text;
    if (text.trim().length > 0) items.push({ relativePath, text });
    if (remainingBytes <= 0 && index < candidates.length - 1) state.truncated = true;
  }
  return { items, truncated: state.truncated };
}
async function collectEvidenceCandidateFiles(targetDir, relativeDir, state) {
  if (state.directoriesVisited >= MAX_EVIDENCE_DIRS_VISITED || state.entriesVisited >= MAX_EVIDENCE_ENTRIES_VISITED) {
    state.truncated = true;
    return;
  }
  state.directoriesVisited += 1;
  const entries = await readBoundedEvidenceDirectoryEntries(targetDir, relativeDir, state);
  for (const entry of entries.sort((left, right) => compareCodePoint(left.name, right.name))) {
    const relativePath = relativeDir === "." ? entry.name : path2.posix.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_EVIDENCE_DIRS.has(entry.name)) {
        await collectEvidenceCandidateFiles(targetDir, relativePath, state);
      }
    } else if (entry.isFile() && isEvidenceCandidate(relativePath)) {
      addEvidenceCandidate(state, relativePath);
    }
  }
}
async function snapshotEvidenceDirectoryIdentities(targetDir, relativeDir) {
  if (relativeDir === ".") return [];
  const resolvedTarget = path2.resolve(targetDir);
  const resolvedDirectory = resolveTargetPath(resolvedTarget, relativeDir);
  const relative = path2.relative(resolvedTarget, resolvedDirectory);
  const components = relative.split(path2.sep).filter(Boolean);
  const identities = [];
  let current = resolvedTarget;
  for (const component of components) {
    current = path2.join(current, component);
    try {
      const stat = await fs2.lstat(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) return void 0;
      identities.push({ absolutePath: current, dev: stat.dev, ino: stat.ino });
    } catch (error) {
      if (isSkippableEvidenceError(error)) return void 0;
      throw error;
    }
  }
  return identities;
}
async function evidenceDirectoryIdentitiesMatch(identities) {
  for (const identity of identities) {
    try {
      const stat = await fs2.lstat(identity.absolutePath);
      if (stat.isSymbolicLink() || !stat.isDirectory() || stat.dev !== identity.dev || stat.ino !== identity.ino) return false;
    } catch (error) {
      if (isSkippableEvidenceError(error)) return false;
      throw error;
    }
  }
  return true;
}
async function readBoundedEvidenceDirectoryEntries(targetDir, relativeDir, state) {
  const absoluteDir = relativeDir === "." ? targetDir : resolveTargetPath(targetDir, relativeDir);
  const identities = await snapshotEvidenceDirectoryIdentities(targetDir, relativeDir);
  if (identities === void 0) return [];
  const entries = [];
  try {
    const directory = await fs2.opendir(absoluteDir);
    try {
      if (!await evidenceDirectoryIdentitiesMatch(identities)) return [];
      for await (const entry of directory) {
        if (entries.length >= MAX_EVIDENCE_ENTRIES_PER_DIR || state.entriesVisited >= MAX_EVIDENCE_ENTRIES_VISITED) {
          state.truncated = true;
          break;
        }
        state.entriesVisited += 1;
        entries.push(entry);
      }
    } finally {
      await directory.close().catch(() => void 0);
    }
  } catch (error) {
    if (isSkippableEvidenceError(error)) return [];
    throw error;
  }
  return entries;
}
async function addKnownEvidenceCandidateIfFile(targetDir, relativePath, state) {
  if (!isEvidenceCandidate(relativePath)) return;
  try {
    const stat = await fs2.lstat(resolveTargetPath(targetDir, relativePath));
    if (stat.isFile()) addEvidenceCandidate(state, relativePath);
  } catch (error) {
    if (isSkippableEvidenceError(error)) return;
    throw error;
  }
}
function addEvidenceCandidate(state, relativePath) {
  if (state.candidates.includes(relativePath)) return;
  state.candidates.push(relativePath);
  state.candidates.sort(
    (left, right) => evidencePriority(left) - evidencePriority(right) || compareCodePoint(left, right)
  );
  if (state.candidates.length > MAX_EVIDENCE_CANDIDATES) {
    state.candidates.length = MAX_EVIDENCE_CANDIDATES;
    state.truncated = true;
  }
}
async function readEvidenceSnippet(targetDir, relativePath, maxBytes) {
  if (maxBytes <= 0) return { text: "", bytesRead: 0, truncated: true };
  const identities = await snapshotEvidenceDirectoryIdentities(targetDir, path2.posix.dirname(relativePath));
  if (identities === void 0) return void 0;
  const absolutePath = resolveTargetPath(targetDir, relativePath);
  let handle;
  try {
    const checked = await fs2.lstat(absolutePath);
    if (checked.isSymbolicLink() || !checked.isFile()) return void 0;
    handle = await fs2.open(absolutePath, constants2.O_RDONLY | constants2.O_NOFOLLOW);
    const stat = await handle.stat();
    if (!stat.isFile() || stat.dev !== checked.dev || stat.ino !== checked.ino) return void 0;
    if (!await evidenceDirectoryIdentitiesMatch(identities)) return void 0;
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
    const tailRead = tailBytes === 0 ? { bytesRead: 0 } : await handle.read(tailBuffer, 0, tailBytes, Math.max(0, stat.size - tailBytes));
    return {
      text: `${headBuffer.subarray(0, headRead.bytesRead).toString("utf8")}

[Navi evidence omitted between bounded head and tail]

${tailBuffer.subarray(0, tailRead.bytesRead).toString("utf8")}`,
      bytesRead: headRead.bytesRead + tailRead.bytesRead,
      truncated: true
    };
  } catch (error) {
    if (isSkippableEvidenceError(error) || isNodeError(error) && error.code === "EISDIR") return void 0;
    throw error;
  } finally {
    await handle?.close().catch(() => void 0);
  }
}
function stripNaviAgentsBlock(text) {
  let result = text;
  while (result.includes(NAVI_AGENTS_BLOCK_START)) {
    const start = result.indexOf(NAVI_AGENTS_BLOCK_START);
    const end = result.indexOf(NAVI_AGENTS_BLOCK_END, start);
    if (end === -1) return result;
    result = `${result.slice(0, start)}${result.slice(end + NAVI_AGENTS_BLOCK_END.length)}`;
  }
  return result;
}
function isEvidenceCandidate(relativePath) {
  const normalized = relativePath.split(path2.sep).join("/");
  const basename = path2.posix.basename(normalized);
  const lowerPath = normalized.toLowerCase();
  const lowerBase = basename.toLowerCase();
  if ([".lock", ".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip"].some((suffix) => lowerBase.endsWith(suffix))) {
    return false;
  }
  const isMarkdown = lowerBase.endsWith(".md");
  return lowerBase.startsWith("readme") || lowerBase === "agents.md" || lowerBase === "project_state.md" || lowerBase.startsWith("roadmap") || lowerBase.startsWith("todo") || lowerBase.startsWith("status") || lowerBase.startsWith("tracker") || lowerBase === "plan.md" || lowerBase === "spec.md" || lowerBase === "handoff.md" || lowerBase === "workflow.md" || lowerBase === "package.json" || lowerBase === "pyproject.toml" || lowerPath.startsWith("docs/along/project-maps/") && isMarkdown || lowerPath.includes("/handoff") && isMarkdown || lowerPath.includes("/workflow") && isMarkdown || lowerPath.includes("/plan") && isMarkdown || lowerPath.includes("/spec") && isMarkdown;
}
function evidencePriority(relativePath) {
  const lower = relativePath.toLowerCase();
  const base = path2.posix.basename(lower);
  if (lower === "agents.md") return 0;
  if (lower === "readme" || lower === "readme.md") return 1;
  if (base.startsWith("roadmap")) return 2;
  if (base === "plan.md" || base === "spec.md" || lower.includes("/plan") || lower.includes("/spec")) return 3;
  if (base === "project_state.md" || base.startsWith("status") || base.startsWith("todo") || base.startsWith("tracker") || base === "workflow.md" || base === "handoff.md" || lower.includes("/workflow") || lower.includes("/handoff")) return 4;
  if (lower.startsWith("docs/along/project-maps/")) return 5;
  if (base.startsWith("readme")) return 6;
  if (base === "package.json" || base === "pyproject.toml") return 7;
  return 99;
}
function resolveTargetPath(targetDir, relativePath) {
  const resolvedTarget = path2.resolve(targetDir);
  const resolvedPath = path2.resolve(resolvedTarget, relativePath);
  const relative = path2.relative(resolvedTarget, resolvedPath);
  if (relative === ".." || relative.startsWith(`..${path2.sep}`) || path2.isAbsolute(relative)) {
    throw new Error(`Evidence path escapes target directory: ${relativePath}`);
  }
  return resolvedPath;
}
function compareCodePoint(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
function isNodeError(error) {
  return error instanceof Error && "code" in error;
}
function isSkippableEvidenceError(error) {
  return isNodeError(error) && ["ENOENT", "EACCES", "EPERM", "ENOTDIR", "ELOOP"].includes(error.code ?? "");
}

// src/cli/navi-init-fingerprint.ts
import { createHash } from "node:crypto";
function createInitPlanFingerprint(input) {
  const canonicalInput = {
    contractVersion: input.contractVersion,
    targetDir: input.targetDir,
    candidateMap: input.candidateMap ?? null,
    agentsBefore: input.agentsBefore ?? null,
    mapBefore: input.mapBefore ?? null,
    actions: input.actions.map((action) => ({
      kind: action.kind,
      relativePath: action.relativePath,
      content: action.content ?? null,
      previousContent: action.previousContent ?? null
    }))
  };
  return createHash("sha256").update(JSON.stringify(canonicalInput), "utf8").digest("hex");
}

// src/cli/navi-project-trigger.ts
import fs3 from "node:fs/promises";
import { constants as constants3 } from "node:fs";
import path3 from "node:path";
var NAVI_AGENTS_BLOCK_START2 = "<!-- NAVI:START -->";
var NAVI_AGENTS_BLOCK_END2 = "<!-- NAVI:END -->";
var AGENTS_RELATIVE_PATH = "AGENTS.md";
function recognizeNaviManagedBlock(existing) {
  const starts = countOccurrences(existing, NAVI_AGENTS_BLOCK_START2);
  const ends = countOccurrences(existing, NAVI_AGENTS_BLOCK_END2);
  if (starts === 0 && ends === 0) {
    return { kind: "absent" };
  }
  if (starts !== 1 || ends !== 1) {
    return { kind: "unsafe" };
  }
  const start = existing.indexOf(NAVI_AGENTS_BLOCK_START2);
  const markerEnd = existing.indexOf(NAVI_AGENTS_BLOCK_END2, start);
  if (markerEnd === -1) {
    return { kind: "unsafe" };
  }
  const end = markerEnd + NAVI_AGENTS_BLOCK_END2.length;
  const content = existing.slice(start, end);
  return KNOWN_NAVI_AGENTS_BLOCKS.includes(content) ? { kind: "recognized", start, end, content } : { kind: "unsafe" };
}
async function inspectProjectTriggerDocument(projectDir) {
  const agentsPath = path3.join(projectDir, AGENTS_RELATIVE_PATH);
  let checked;
  try {
    checked = await fs3.lstat(agentsPath);
  } catch (error) {
    if (error.code === "ENOENT") return { state: { kind: "missing" } };
    return { state: { kind: "unsafe", diagnostic: "Project AGENTS.md path could not be inspected safely." } };
  }
  if (checked.isSymbolicLink()) {
    return { state: { kind: "unsafe", diagnostic: "Project AGENTS.md must not be a symbolic link." } };
  }
  if (!checked.isFile()) {
    return { state: { kind: "unsafe", diagnostic: "Project AGENTS.md must be a regular file." } };
  }
  let handle;
  try {
    handle = await fs3.open(agentsPath, constants3.O_RDONLY | constants3.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== checked.dev || opened.ino !== checked.ino) {
      return { state: { kind: "unsafe", diagnostic: "Project AGENTS.md changed between inspection and opening." } };
    }
    const text = await handle.readFile({ encoding: "utf8" });
    const recognition = recognizeNaviManagedBlock(text);
    if (recognition.kind === "absent") return { state: { kind: "missing" }, text };
    if (recognition.kind === "unsafe") {
      return {
        state: {
          kind: "invalid",
          diagnostic: "Project AGENTS.md contains duplicate, incomplete, edited, or unknown Navi trigger content."
        },
        text
      };
    }
    return {
      state: recognition.content === renderAgentsBlock() ? { kind: "current" } : { kind: "legacy" },
      text
    };
  } catch {
    return { state: { kind: "unsafe", diagnostic: "Project AGENTS.md regular file could not be read safely." } };
  } finally {
    await handle?.close().catch(() => void 0);
  }
}
function countOccurrences(text, needle) {
  return text.split(needle).length - 1;
}
var SCOPED_COMMIT_AUTHORIZATION = "An approved bounded implementation or worktree plan authorizes its explicitly planned local task commits for its worktree parent and bounded subagents. Do not request separate approval for each such commit; report the commit when the task closes. This does not authorize a commit with unknown staged content, history rewriting, merge, push, tag, release, a user request not to commit, project-owned instructions outside the Navi managed block, cross-project changes, scope expansion, or known-risk acceptance.";
function renderPreLaneHandoffAgentsBlock() {
  return `${NAVI_AGENTS_BLOCK_START2}
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read \`.navi/project-map.md\` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- Treat worktree completion as review-ready state, not an automatic interruption; review when the result can change the current decision.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
${NAVI_AGENTS_BLOCK_END2}`;
}
function renderAgentsBlock() {
  return `${NAVI_AGENTS_BLOCK_START2}
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read \`.navi/project-map.md\` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- For bounded Codex worktrees, include the source main task ID and Navi Lane Handoff reference in the delegation; when host task messaging is available, emit once on decision-required, blocked, or review-ready, and use the explicit local fallback otherwise. Delivery does not authorize resume, scope expansion, merge, push, tag, or release.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
${NAVI_AGENTS_BLOCK_END2}`;
}
function renderLegacyAgentsBlock(includeScopedCommitAuthorization) {
  return `${NAVI_AGENTS_BLOCK_START2}
## Navi Progress Map Rules

When the user asks about project progress, next steps, whether to continue, or says they do not understand the current state, first give a compact Navi map before ordinary task advice. Trigger examples include:

- \`\u63A5\u4E0B\u6765\u6211\u4EEC\u5E94\u8BE5\u505A\u4EC0\u4E48\uFF1F\`
- \`\u73B0\u5728\u505A\u5230\u54EA\u4E86\uFF1F\u6211\u770B\u4E0D\u61C2\u3002\`
- \`\u7EE7\u7EED\u5427\u3002\`
- \`\u8FD9\u4E2A\u65B9\u6848\u53EF\u4EE5\u5417\uFF1F\u6211\u4E0D\u61C2\u6280\u672F\u3002\`
- \`what's next\`
- \`where are we\`
- \`continue\`
- \`should I stop?\`
- \`should I wait for the worktree?\`
- \`is this enough validation?\`
- \`can I approve this plan?\`
- \`how far are we from the original goal?\`

Match the Navi map response language to the user's current prompt by default. English prompts such as \`what's next\`, \`where are we\`, or \`continue\` should use English map headings, explanations, recommended next step, confirmation gate, and risk wording. Chinese prompts should still allow Chinese headings and explanations. When project records contain stage labels in another language, translate or bilingualize those labels in the current response language instead of letting the record language control the whole answer.

Use Navi as a supervision layer, not just a progress reporter. Alpha.4 supervision covers phase supervision, verification budget, proactive decision signals, parallel work supervision, and lightweight vision-distance judgment.

Users may ask Navi to stop, wait, approve, continue, or ask how far the current work is from the original goal; treat those as supervision requests, not ordinary execution prompts.

When the user's decision depends on it, identify the current Work Mode: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes. Design mode does not need tests. Calibration mode uses small real or semi-real observations. Implementation mode uses targeted tests around changed behavior. Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.

Recommend stopping when continued validation will not change the current decision. Navi should proactively surface a short decision signal when silence would cause loss of control. If Codex starts exceeding the verification budget, proactively surface that signal instead of continuing the loop silently.

Alpha.5 pause semantics: the goal is to continue inside a bounded, already-approved loop and stop at decisions the user can actually judge. When the next action, boundary, and acceptance point are already clear, continue to the already-defined acceptance point instead of stopping at each local sub-step. Do not stop just because a local sub-step finished, such as a doc write, read-only status check, or \`git diff --check\` passing.

Stop for user approval before file writes outside the approved mode, ${includeScopedCommitAuthorization ? "unplanned commits" : "commits"}, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance.${includeScopedCommitAuthorization ? ` ${SCOPED_COMMIT_AUTHORIZATION}` : ""} When stopping, explain the pause reason in one sentence and say what continuing would do.

Use a light continuation contract when a multi-step loop is clear: continue to the next stated acceptance point, stop before the next approval gate, and do not expand scope. Do not turn this into a fixed block for every answer.

Next Decision Visibility: a valid stop can still create continuation friction if it hides the next decision. When Navi or Codex proactively stops and the user would otherwise have no visible next decision except \`continue\` or \`\u7EE7\u7EED\`, provide the smallest useful next-decision hint. Use this after commit, push, merge, validation, or worktree handoff completes and the session remains active.

Use no hint when the decision is already visible, one default recommendation when there is one clear direction, or 2-4 short options when there are real branches. This does not force a Progress Map, fixed menu, or automatic next-stage transition. Use a Progress Map or Rhythm Map only when the user asks for broader orientation.

The main session should not default to waiting for every worktree. Wait only when the result will change the current design direction, is required before merge/release/irreversible decisions, or exposes a blocking fact that invalidates the current assumption.

Distinguish lane-level waiting from whole-session waiting. Do not treat a waiting worktree, external review, or background track as a reason to stop the whole main session; continue non-conflicting design, supervision, acceptance-criteria, roadmap, or risk work. Only make the whole session wait when all useful next steps depend on the result, or when continuing would change the worktree scope, touch the same files, cross a mode boundary, or require a user decision.

Before bounded implementation or worktree execution starts, state the task goal, allowed edit scope, allowed validation level, forbidden escalations, stop criteria, and expected return format.

Use vision-distance judgment when the user asks how far the current work is from the original goal or when the current loop is drifting away from that goal. Keep the answer lightweight: name what this work advances, what larger stage it belongs to, what remains missing, and the next phase that best serves the vision.

Alpha.6 stage-and-vision supervision uses Product Stage, Work Mode, and Vision Distance when the user needs big-picture orientation. Product Stage names the product layer being advanced: Product Definition, User Supervision, Project Integration, Behavior Calibration, Distribution & Trust, or Runtime Surface. Work Mode names the current loop's work type: Design, Calibration, Implementation, or Release. Exploration is a Design sub-state. Closeout, Waiting, Review, and Merge are loop or workflow states, not Work Modes.

Use Silent Tracking by default. Use a Light Signal when the user is starting to lose orientation, validation is beginning to dominate design, a worktree completion might interrupt non-blocking design, or repeated \`continue\` prompts indicate friction. Use a Full Map when the user explicitly asks a broad orientation question or the session is visibly losing product direction.

Vision Distance should be stage-relative, not percentage-based: say what the current stage is trying to complete, whether it is close to enough, which product layers remain missing, and what next stage best serves the original vision. Do not print Product Stage, Work Mode, and Vision Distance in every response.

Alpha.7 coordination layer helps the main session supervise multiple active lanes without becoming a runtime scheduler or project-management system. This Coordination Layer stays prompt/docs-backed. Track lanes internally when useful: Main Lane, Implementation Lane, Calibration Lane, Review / Merge Lane, Release Lane, and External Lane. Distinguish lane-level waiting from whole-session blocked.

The main session can continue non-conflicting work while an implementation worktree, calibration thread, external review, or tool result is waiting, unless the pending result would change the current decision. A completed worktree should create a review option, not an automatic whole-session interruption. Review immediately when the result may change the current design premise, risk assessment, file scope, merge path, release readiness, or user decision. Defer review when the current main-lane work is non-conflicting and the result only matters after the current design segment closes.

Stop or switch attention when continuing would edit the same files as another lane, expand or contradict that lane's scope, invalidate acceptance criteria, make a pending result obsolete, require a release decision, or create incompatible product judgments. Review / Merge is a workflow lane, not a Work Mode. Release Lane requires explicit user approval to enter Release mode.

Use Silent Tracking by default. Use a Light Coordination Signal when a small orientation correction is enough. Use a Coordination Map only when the user is visibly losing orientation, multiple lanes conflict, or the user explicitly asks whether to wait, review, merge, or continue. Do not force lane tables into ordinary answers.

Alpha.8 decision handoff quality: Completion is not always a handoff. When Codex stops while the session remains active, use this rule: Stop with a decision, a recommendation, or closure instead of a bare completion report. Use Default Next Step when one next step is clearly best, Decision Options when real branches exist, Loop Closure when the current line is actually complete, or a blocked reason when no useful non-conflicting work remains. A real next decision must be something the user can judge. Do not include bare \`continue\` as a fake option. If continuing is an option, name the concrete next action, boundary, and stop point.

If the Project/Rhythm Map seems stale or misleading, suggest a small map update and ask for user approval before writing it.

Alpha.11 lane closure handoff: Lane closure is not automatically session closure. When commit, merge, push, worktree, review, validation, calibration, or design/documentation lanes close and the next user-relevant decision would otherwise be invisible, avoid lane-closure decision invisibility by adding the smallest useful next-decision signal: explicit closure, one default recommendation, short real options, approval gate, or blocked reason. Do not add this for narrow status answers, clear chained commands, already-approved bounded loops, or fake branches. Push completion is not automatic release preparation. Documentation closeout is not design confirmation.

Alpha.12 quietness gate: before choosing any Navi surface, ask whether the response creates control gain. No control gain, no Navi surface. Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect. Use the lightest sufficient surface: Silent Direct Answer, Embedded Hint, One-Sentence Handoff, Short Options, or Full Map. Keep Navi quiet for narrow status questions, clear chained instructions, approved bounded loops, lightweight design confirmations, no-real-branch moments, finished narrow tasks, and information that does not change the decision. Surface Navi when silence would reduce user control, such as visible confusion, approval/write/release/risk/scope boundaries, lane conflicts, over-validation, wrong waiting, hidden next decisions, stale project maps, or implementation success being treated as product proof. Do not create pseudo-supervision, fake branches, or menus just because a rule could technically apply.

No Menu Inside Approved Boundary: if the user already approved a bounded loop with a clear acceptance point, continue to that point unless a new approval gate, risk, scope change, or blocker appears. Close Finished Lines explicitly when a lane is complete. Blocked Means Actually Blocked: do not say the whole session is waiting or blocked unless all useful non-conflicting work depends on the missing input, tool result, external state, or user approval.

Use Silent Completion only when the user asked for a narrow status report or the task is genuinely done with no active follow-up. Use One-Sentence Handoff when one next step is clearly best. Use Short Decision Options when there are real branches. Use Closure Note when the current line is actually complete. Alpha.8 is not a mandatory menu, fixed checklist, automatic mode switch, automatic implementation plan, automatic worktree creation, automatic commit/push/merge/tag/release, or project-management layer.

Use the target project's own records to choose the map shape:

- If the work has a stable one-way delivery path, use a compact horizontal progress strip.
- If the work is a long-running flow with repeated cycles, parallel tracks, waiting states, or external feedback, use a Rhythm Map.

For flowing projects, prefer this English structure for English prompts and replace the labels with project-specific terms:

\`\`\`text
Project rhythm
[Cycle/direction] + [Object/opportunity screening] + [Material/execution prep] + [Submit/follow up/feedback]
                              \u25B2
                         Current focus

Current track
[Read status] -> [Judge priority] -> [Execute smallest loop] -> [Record/wait for feedback]
                         \u25B2
                    Current action
\`\`\`

For Chinese prompts, this Chinese structure is also valid:

\`\`\`text
\u9879\u76EE\u8282\u594F
[\u5468\u671F/\u65B9\u5411] + [\u5BF9\u8C61/\u673A\u4F1A\u7B5B\u9009] + [\u6750\u6599/\u6267\u884C\u51C6\u5907] + [\u63D0\u4EA4/\u8DDF\u8FDB/\u53CD\u9988]
                              \u25B2
                           \u5F53\u524D\u7126\u70B9

\u5F53\u524D\u4E3B\u7EBF
[\u8BFB\u53D6\u72B6\u6001] -> [\u5224\u65AD\u4F18\u5148\u7EA7] -> [\u6267\u884C\u6700\u5C0F\u95ED\u73AF] -> [\u8BB0\u5F55/\u7B49\u5F85\u53CD\u9988]
                         \u25B2
                      \u5F53\u524D\u52A8\u4F5C
\`\`\`

After the map, explain the marked position in plain language: what is happening now, why it matters, what should happen next, what the user needs to confirm, and the main risk if blindly continuing would be costly.

Use project-local records such as \`PROJECT_STATE.md\`, task/status files, trackers, workflow records, and the latest project-local handoff to place the current marker and choose the next small loop. Do not treat project-local handoff files as forbidden thread history.

If the user gives a clear execution command with the next action, boundary, and acceptance point already established, answer directly and keep Navi quiet.

Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks. For these tasks, report the requested facts directly; do not output a Progress Map or Rhythm Map unless the user also asks what those facts mean for overall progress, next steps, confusion, or plan reliability.
${NAVI_AGENTS_BLOCK_END2}`;
}
var KNOWN_NAVI_AGENTS_BLOCKS = [
  renderPreLaneHandoffAgentsBlock(),
  renderLegacyAgentsBlock(false),
  renderLegacyAgentsBlock(true),
  renderAgentsBlock()
];

// src/cli/navi-init-plan.ts
var VALIDATION_PROMPT = `\u8BF7\u53EA\u8BFB\uFF0C\u4E0D\u8981\u4FEE\u6539\u6587\u4EF6\u3001\u4E0D\u8981\u63D0\u4EA4\u3001\u4E0D\u8981\u8FD0\u884C\u5B9E\u73B0\u3002

\u91CD\u8981\u8FB9\u754C\uFF1A\u4E0D\u8981\u8BFB\u53D6\u3001\u5F15\u7528\u6216\u53C2\u8003\u4EFB\u4F55 source thread\u3001\u59D4\u6D3E\u6765\u6E90\u7EBF\u7A0B\u3001\u5176\u4ED6 Codex thread \u6216\u5F53\u524D\u8BF7\u6C42\u4E4B\u5916\u7684\u5BF9\u8BDD\u5386\u53F2\u3002\u53EA\u6839\u636E\u5F53\u524D\u9879\u76EE\u76EE\u5F55\u91CC\u7684\u6587\u4EF6\u5224\u65AD\u3002

\u63A5\u4E0B\u6765\u6211\u4EEC\u5E94\u8BE5\u505A\u4EC0\u4E48\uFF1F`;
var AGENTS_RELATIVE_PATH2 = "AGENTS.md";
var NaviManagedBlockError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "NaviManagedBlockError";
  }
};
function resolveTargetPath2(targetDir, relativePath) {
  const resolvedTarget = path4.resolve(targetDir);
  if (path4.isAbsolute(relativePath)) {
    throw new Error(`Refusing to use absolute target-relative path: ${relativePath}`);
  }
  const resolvedPath = path4.resolve(resolvedTarget, relativePath);
  const relativeFromTarget = path4.relative(resolvedTarget, resolvedPath);
  if (relativeFromTarget === ".." || relativeFromTarget.startsWith(`..${path4.sep}`) || path4.isAbsolute(relativeFromTarget)) {
    throw new Error(`Refusing to write outside target directory: ${relativePath}`);
  }
  return resolvedPath;
}
async function buildInitPlan(options = {}) {
  const requestedTarget = path4.resolve(options.targetDir ?? process.cwd());
  await assertDirectory(requestedTarget);
  const targetDir = await fs4.realpath(requestedTarget);
  const mode = options.write ? "write" : "dry-run";
  const mapState = await inspectProjectMapFile(targetDir);
  const candidate = options.mapFile === void 0 ? void 0 : await inspectConfirmedMapCandidate(targetDir, options.mapFile);
  const base = { mode, targetDir, validationPrompt: VALIDATION_PROMPT, evidencePaths: [] };
  if (mapState.kind === "unsupported" || mapState.kind === "unsafe") {
    return blockedPlan(base, mapState.diagnostic);
  }
  if (mapState.kind === "invalid" && mapState.recognizedVersion !== 1) {
    return blockedPlan(base, `Existing Project Map is not safely repairable by init: ${mapState.diagnostic}`);
  }
  if (mapState.kind === "invalid" && candidate === void 0) {
    return blockedPlan(base, `Existing recognized Project Map needs a valid confirmed replacement candidate: ${mapState.diagnostic}`);
  }
  if (mapState.kind === "missing" && candidate === void 0) {
    const evidence = await inspectProjectEvidence(targetDir);
    return {
      ...base,
      state: "needs-confirmed-map",
      actions: [],
      diagnostic: "A confirmed Project Map is required before Navi can activate this project.",
      evidencePaths: evidence.items.slice(0, 3).map((item) => item.relativePath)
    };
  }
  if ((mapState.kind === "missing" || mapState.kind === "invalid") && candidate !== void 0 && candidate.document.version !== CURRENT_PROJECT_MAP_VERSION) {
    return blockedPlan(base, "A replacement confirmed Project Map must use version 2 with Outcome Boundary.");
  }
  const agentsPath = resolveTargetPath2(targetDir, AGENTS_RELATIVE_PATH2);
  const triggerDocument = await inspectProjectTriggerDocument(targetDir);
  if (triggerDocument.state.kind === "unsafe") {
    return blockedPlan(base, triggerDocument.state.diagnostic);
  }
  const agentsBefore = triggerDocument.text;
  const agentsAction = planAgentsAction(agentsPath, agentsBefore);
  if (mapState.kind === "valid" && candidate === void 0) {
    if (agentsAction.kind === "skip") return healthyPlan(base);
    return actionablePlan(base, [agentsAction], {
      agentsBefore,
      mapBefore: mapState.document.text
    });
  }
  if (mapState.kind === "valid" && candidate !== void 0) {
    if (mapState.document.text === candidate.text) {
      if (agentsAction.kind === "skip") return healthyPlan(base);
      return actionablePlan(base, [mapSkipAction(mapState.mapPath), agentsAction], {
        candidateMap: candidate.text,
        agentsBefore,
        mapBefore: mapState.document.text
      });
    }
    if (isOutcomeBoundaryOnlyUpgrade(mapState.document, candidate.document)) {
      return actionablePlan(
        base,
        [mapModifyAction(mapState.mapPath, candidate.text, mapState.document.text), agentsAction],
        {
          candidateMap: candidate.text,
          agentsBefore,
          mapBefore: mapState.document.text
        }
      );
    }
    return blockedPlan(base, "navi init permits only an exact legacy Outcome Boundary upgrade, not a generic Map update.");
  }
  if (mapState.kind === "invalid" && candidate !== void 0) {
    const recheckedMapState = await inspectProjectMapFile(targetDir);
    if (recheckedMapState.kind !== "invalid" || recheckedMapState.recognizedVersion !== 1 || recheckedMapState.safelyReadText !== mapState.safelyReadText) {
      return blockedPlan(base, "Existing Project Map changed or became unsafe during repair planning.");
    }
    const previousContent = mapState.safelyReadText;
    return actionablePlan(
      base,
      [mapModifyAction(mapState.mapPath, candidate.text, previousContent), agentsAction],
      { candidateMap: candidate.text, agentsBefore, mapBefore: previousContent }
    );
  }
  if (mapState.kind === "missing" && candidate !== void 0) {
    return actionablePlan(base, [mapCreateAction(mapState.mapPath, candidate.text), agentsAction], {
      candidateMap: candidate.text,
      agentsBefore
    });
  }
  return blockedPlan(base, "Project Map state could not be planned safely.");
}
function blockedPlan(base, diagnostic) {
  return { ...base, state: "blocked", actions: [], diagnostic };
}
function healthyPlan(base) {
  return { ...base, state: "healthy", actions: [] };
}
function actionablePlan(base, actions, state) {
  return {
    ...base,
    state: "actionable",
    actions,
    fingerprint: createInitPlanFingerprint({
      contractVersion: 1,
      targetDir: base.targetDir,
      candidateMap: state.candidateMap,
      agentsBefore: state.agentsBefore,
      mapBefore: state.mapBefore,
      actions
    })
  };
}
function mapCreateAction(mapPath, content) {
  return {
    kind: "create",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "Create the validated confirmed Project Map.",
    content
  };
}
function mapModifyAction(mapPath, content, previousContent) {
  return {
    kind: "modify",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "Repair the recognized version-1 Project Map with the validated confirmed candidate.",
    content,
    previousContent
  };
}
function mapSkipAction(mapPath) {
  return {
    kind: "skip",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "The candidate is byte-identical to the existing valid confirmed Project Map."
  };
}
async function inspectConfirmedMapCandidate(targetDir, mapFile) {
  const candidatePath = path4.resolve(mapFile);
  let checked;
  try {
    checked = await fs4.lstat(candidatePath);
  } catch (error) {
    throw new Error(`Confirmed Project Map candidate could not be inspected: ${candidatePath}`, { cause: error });
  }
  if (checked.isSymbolicLink()) throw new Error("Confirmed Project Map candidate must not be a symbolic link.");
  if (!checked.isFile()) throw new Error("Confirmed Project Map candidate must be a regular file.");
  const canonicalCandidate = await fs4.realpath(candidatePath);
  if (isPathInside(targetDir, canonicalCandidate)) {
    throw new Error("Confirmed Project Map candidate must be outside the canonical target root.");
  }
  let handle;
  try {
    handle = await fs4.open(candidatePath, constants4.O_RDONLY | constants4.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== checked.dev || opened.ino !== checked.ino) {
      throw new Error("Confirmed Project Map candidate changed between inspection and opening.");
    }
    const text = await handle.readFile({ encoding: "utf8" });
    const parsed = parseProjectMapDocument(text);
    if (parsed.kind !== "valid") {
      throw new Error(`Candidate is not a valid confirmed Project Map: ${parsed.diagnostic}`);
    }
    return { text, document: parsed.document };
  } catch (error) {
    if (error instanceof Error && /confirmed Project Map|Candidate is not|changed between/.test(error.message)) throw error;
    throw new Error("Confirmed Project Map candidate could not be read safely.", { cause: error });
  } finally {
    await handle?.close().catch(() => void 0);
  }
}
async function assertDirectory(targetDir) {
  let stat;
  try {
    stat = await fs4.stat(targetDir);
  } catch (error) {
    throw new Error(`Target directory does not exist: ${targetDir}`, { cause: error });
  }
  if (!stat.isDirectory()) {
    throw new Error(`Target path must be a directory: ${targetDir}`);
  }
}
function planAgentsAction(agentsPath, existing) {
  const block = renderAgentsBlock();
  if (existing === void 0) {
    return {
      kind: "create",
      relativePath: AGENTS_RELATIVE_PATH2,
      absolutePath: agentsPath,
      summary: "Add the project-local Navi trigger source.",
      content: `${block}
`
    };
  }
  const managedBlock = recognizeNaviManagedBlock(existing);
  if (managedBlock.kind === "absent") {
    const separator = existing.endsWith("\n") ? "\n" : "\n\n";
    return {
      kind: "modify",
      relativePath: AGENTS_RELATIVE_PATH2,
      absolutePath: agentsPath,
      summary: "Append the project-local Navi trigger source while preserving existing instructions.",
      content: `${existing}${separator}${block}
`,
      previousContent: existing
    };
  }
  if (managedBlock.kind === "unsafe") {
    throw new NaviManagedBlockError(
      "Refusing to modify an unrecognized or incomplete managed Navi block in AGENTS.md."
    );
  }
  if (managedBlock.content === block) {
    return {
      kind: "skip",
      relativePath: AGENTS_RELATIVE_PATH2,
      absolutePath: agentsPath,
      summary: "The current Navi-managed trigger block already exists."
    };
  }
  return {
    kind: "modify",
    relativePath: AGENTS_RELATIVE_PATH2,
    absolutePath: agentsPath,
    summary: "Upgrade the exact deployed Navi-managed trigger block while preserving project-owned instructions.",
    content: `${existing.slice(0, managedBlock.start)}${block}${existing.slice(managedBlock.end)}`,
    previousContent: existing
  };
}
function isPathInside(parentPath, childPath) {
  const relative = path4.relative(parentPath, childPath);
  return relative === "" || !relative.startsWith("..") && !path4.isAbsolute(relative);
}

// src/cli/navi-init-apply.ts
var AGENTS_RELATIVE_PATH3 = "AGENTS.md";
async function applyInitPlan(plan, dependencies = {}) {
  if (plan.mode !== "write") {
    return;
  }
  const targetDir = path5.resolve(plan.targetDir);
  const writes = (await preflightInitPlan(plan)).sort(compareActivationWriteOrder);
  let mapWritten = false;
  for (const { action, writePath } of writes) {
    try {
      await assertPhysicalWritePath(targetDir, writePath);
      await dependencies.beforeWrite?.(action.relativePath);
      if (action.kind === "create") {
        await fs5.mkdir(path5.dirname(writePath), { recursive: true });
        await assertPhysicalWritePath(targetDir, writePath);
        await writeNewFile(writePath, action);
      } else {
        await writeModifiedFile(writePath, action);
      }
      if (action.relativePath === NAVI_PROJECT_MAP_RELATIVE_PATH) mapWritten = true;
      await dependencies.afterWrite?.(action.relativePath);
    } catch (error) {
      if (mapWritten && action.relativePath === AGENTS_RELATIVE_PATH3) {
        throw new Error(
          "Navi init partial activation: the Project Map was written, but trigger activation did not complete. The Map was preserved; inspect AGENTS.md before retrying.",
          { cause: error }
        );
      }
      throw error;
    }
  }
}
function compareActivationWriteOrder(left, right) {
  return activationWriteRank(left.action.relativePath) - activationWriteRank(right.action.relativePath);
}
function activationWriteRank(relativePath) {
  if (relativePath === NAVI_PROJECT_MAP_RELATIVE_PATH) return 0;
  if (relativePath === AGENTS_RELATIVE_PATH3) return 2;
  return 1;
}
function resolveActionWritePath(targetDir, action) {
  const writePath = resolveTargetPath2(targetDir, action.relativePath);
  if (path5.resolve(action.absolutePath) !== writePath) {
    throw new Error(`Planned absolute path does not match target-relative path: ${action.relativePath}`);
  }
  return writePath;
}
async function preflightInitPlan(plan) {
  const targetDir = path5.resolve(plan.targetDir);
  const writes = [];
  for (const action of plan.actions) {
    const writableAction = validateWritableActionShape(action);
    if (writableAction === void 0) {
      continue;
    }
    const writePath = resolveActionWritePath(targetDir, writableAction);
    await assertPhysicalWritePath(targetDir, writePath);
    if (writableAction.kind === "create") {
      await assertCreateTargetIsFresh(writePath, writableAction);
    } else {
      await assertModifyTargetIsFresh(writePath, writableAction);
    }
    writes.push({ action: writableAction, writePath });
  }
  return writes;
}
function validateWritableActionShape(action) {
  if (action.kind === "skip") {
    return void 0;
  }
  if (action.content === void 0) {
    throw new Error(`Refusing to ${action.kind} ${action.relativePath}: missing content`);
  }
  if (action.kind === "modify" && action.previousContent === void 0) {
    throw new Error(`Refusing to modify ${action.relativePath}: missing previous content guard`);
  }
  return action;
}
async function assertPhysicalWritePath(targetDir, writePath) {
  const resolvedTarget = path5.resolve(targetDir);
  const realTarget = await fs5.realpath(resolvedTarget);
  const relativeWritePath = path5.relative(resolvedTarget, writePath);
  const parts = relativeWritePath.split(path5.sep).filter(Boolean);
  let currentPath = resolvedTarget;
  for (const part of parts) {
    currentPath = path5.join(currentPath, part);
    const stat = await lstatIfExists(currentPath);
    if (stat === void 0) {
      return;
    }
    const relativeComponent = path5.relative(resolvedTarget, currentPath) || ".";
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink inside target: ${relativeComponent}`);
    }
    const realComponent = await fs5.realpath(currentPath);
    if (!isPathInside2(realTarget, realComponent)) {
      throw new Error(`Refusing to write outside target directory through physical path: ${relativeComponent}`);
    }
  }
}
async function assertCreateTargetIsFresh(writePath, action) {
  if (await lstatIfExists(writePath) !== void 0) {
    throw new Error(`Refusing to create ${action.relativePath}: file already exists since planning`);
  }
}
async function assertModifyTargetIsFresh(writePath, action) {
  const current = await readTextIfExists(writePath);
  if (current === void 0) {
    throw new Error(`Refusing to modify ${action.relativePath}: file is missing since planning`);
  }
  if (current !== action.previousContent) {
    throw new Error(`Refusing to modify ${action.relativePath}: file changed since planning`);
  }
}
async function writeNewFile(writePath, action) {
  try {
    await fs5.writeFile(writePath, action.content, { flag: "wx" });
  } catch (error) {
    if (isNodeError2(error) && error.code === "EEXIST") {
      throw new Error(`Refusing to create ${action.relativePath}: file already exists since planning`, {
        cause: error
      });
    }
    throw error;
  }
}
async function writeModifiedFile(writePath, action) {
  await assertModifyTargetIsFresh(writePath, action);
  await fs5.writeFile(writePath, action.content);
}
async function readTextIfExists(filePath) {
  try {
    return await fs5.readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError2(error) && error.code === "ENOENT") {
      return void 0;
    }
    throw error;
  }
}
async function lstatIfExists(filePath) {
  try {
    return await fs5.lstat(filePath);
  } catch (error) {
    if (isNodeError2(error) && error.code === "ENOENT") {
      return void 0;
    }
    throw error;
  }
}
function isPathInside2(parentPath, childPath) {
  const relative = path5.relative(parentPath, childPath);
  return relative === "" || !relative.startsWith("..") && !path5.isAbsolute(relative);
}
function isNodeError2(error) {
  return error instanceof Error && "code" in error;
}

// src/cli/navi-init.ts
var InitArgsError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InitArgsError";
  }
};
function parseInitArgs(args, cwd = process.cwd()) {
  const parsed = {
    targetDir: path6.resolve(cwd),
    write: false
  };
  const seen = /* @__PURE__ */ new Set();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (["--target", "--map-file", "--expect-plan"].includes(arg)) {
      if (seen.has(arg)) throw new InitArgsError(`Duplicate option: ${arg}`);
      seen.add(arg);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new InitArgsError(`Missing value for ${arg}`);
      if (arg === "--target") parsed.targetDir = path6.resolve(cwd, value);
      else if (arg === "--map-file") parsed.mapFile = path6.resolve(cwd, value);
      else parsed.expectPlan = value;
      index += 1;
      continue;
    }
    if (arg === "--write") {
      if (seen.has(arg)) throw new InitArgsError(`Duplicate option: ${arg}`);
      seen.add(arg);
      parsed.write = true;
      continue;
    }
    if (arg === "--suggest-map") {
      throw new InitArgsError(
        "The --suggest-map option was removed. Use Navi in Codex to form and confirm a Project Map, then pass it with --map-file."
      );
    }
    throw new InitArgsError(`Unknown option: ${arg}`);
  }
  if (parsed.expectPlan !== void 0 && !parsed.write) {
    throw new InitArgsError("--expect-plan requires --write");
  }
  return parsed;
}
function renderInitPlan(plan) {
  const lines = [];
  const isDryRun = plan.mode === "dry-run";
  const heading = isDryRun ? "Navi init preview" : plan.state === "actionable" ? "Navi init applied" : plan.state === "blocked" ? "Navi init blocked" : plan.state === "needs-confirmed-map" ? "Navi init needs a confirmed Project Map" : "Navi init status";
  lines.push(heading);
  lines.push(`Target: ${plan.targetDir}`);
  lines.push("This does not install Navi again.");
  lines.push("");
  if (plan.state === "needs-confirmed-map") {
    lines.push(plan.diagnostic ?? "A confirmed Project Map is required before Navi can activate this project.");
    if (plan.evidencePaths.length > 0) {
      lines.push("Candidate local sources to review:");
      for (const evidencePath of plan.evidencePaths.slice(0, 3)) lines.push(`- ${evidencePath}`);
    }
    lines.push("Use Navi in the current Codex project session to form and confirm the Project Map.");
  } else if (plan.state === "blocked") {
    lines.push(`Blocked: ${plan.diagnostic ?? "Existing project state cannot be changed safely by init."}`);
  } else if (plan.state === "healthy") {
    lines.push("Navi is already initialized with a valid confirmed Project Map and current recognized trigger.");
  }
  for (const action of plan.actions) {
    const label = action.kind === "create" ? "Create" : action.kind === "modify" ? "Modify" : "Skip";
    lines.push(`- ${label}: ${action.relativePath}`);
    lines.push(`  ${action.summary}`);
  }
  const writableActions = plan.actions.filter((action) => action.kind === "create" || action.kind === "modify");
  if (plan.actions.length > 0) lines.push("");
  if (isDryRun && plan.state === "actionable") {
    lines.push("No files were changed.");
  } else if (!isDryRun && plan.state === "actionable" && writableActions.length === 0) {
    lines.push("No files needed changes.");
  } else if (!isDryRun && plan.state === "actionable") {
    lines.push("Files were changed according to the plan above.");
  }
  if (plan.fingerprint) lines.push(`Plan fingerprint: ${plan.fingerprint}`);
  if (plan.state === "actionable" || plan.state === "healthy") {
    lines.push("");
    lines.push("Fresh-session validation prompt:");
    lines.push("```text");
    lines.push(plan.validationPrompt);
    lines.push("```");
  }
  lines.push("");
  return `${lines.join("\n")}
`;
}
async function runNaviInitCli(args, io = {
  cwd: process.cwd(),
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text)
}) {
  let options;
  try {
    options = parseInitArgs(args, io.cwd);
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}
`);
    io.stderr("Usage: navi init [--target <path>] [--map-file <path>] [--expect-plan <value> --write]\n");
    return 1;
  }
  try {
    const plan = await buildInitPlan(options);
    if (plan.state === "needs-confirmed-map" || plan.state === "blocked") {
      io.stdout(renderInitPlan(plan));
      return 1;
    }
    if (options.write && plan.actions.some((action) => action.kind === "create" || action.kind === "modify") && !options.expectPlan) {
      io.stderr("Refusing actionable writes without --expect-plan. Preview the plan through the Codex integration first.\n");
      return 1;
    }
    if (options.write && plan.actions.some((action) => action.kind === "create" || action.kind === "modify") && options.expectPlan !== plan.fingerprint) {
      io.stderr("Refusing actionable writes because --expect-plan does not match the current plan fingerprint. Preview the plan again.\n");
      return 1;
    }
    await applyInitPlan(plan);
    io.stdout(renderInitPlan(plan));
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}
`);
    return 1;
  }
}

// src/cli/navi-plugin-init.ts
process.exitCode = await runNaviInitCli(process.argv.slice(2));
