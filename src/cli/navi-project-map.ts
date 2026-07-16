import { constants, type Stats } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const NAVI_PROJECT_MAP_RELATIVE_PATH = ".navi/project-map.md";
export const LEGACY_PROJECT_MAP_VERSION = 1 as const;
export const CURRENT_PROJECT_MAP_VERSION = 2 as const;

export const LEGACY_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export const REQUIRED_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:outcome-boundary",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export type ProjectMapContractVersion = 1 | 2;
export type OutcomeBoundaryStatus = "legacy-missing" | "confirmed";
export type ProjectLifecycleStatus = "active" | "paused" | "closed";

export interface ProjectMapDocument {
  version: ProjectMapContractVersion;
  mapStatus: "confirmed";
  projectStatus: ProjectLifecycleStatus;
  lastConfirmed: string;
  outcomeBoundaryStatus: OutcomeBoundaryStatus;
  text: string;
}

export type ProjectMapParseResult =
  | { kind: "valid"; document: ProjectMapDocument }
  | { kind: "unsupported"; version: number; diagnostic: string }
  | { kind: "invalid"; diagnostic: string; recognizedVersion?: ProjectMapContractVersion };

export type ProjectMapFileState =
  | { kind: "missing"; mapPath: string }
  | { kind: "valid"; mapPath: string; document: ProjectMapDocument }
  | { kind: "unsupported"; mapPath: string; version: number; diagnostic: string }
  | { kind: "invalid"; mapPath: string; diagnostic: string; recognizedVersion: ProjectMapContractVersion; safelyReadText: string }
  | { kind: "invalid"; mapPath: string; diagnostic: string; recognizedVersion?: undefined }
  | { kind: "unsafe"; mapPath: string; diagnostic: string };

const REQUIRED_FRONTMATTER_KEYS = [
  "navi_map",
  "map_status",
  "project_status",
  "last_confirmed",
] as const;

const FRONTMATTER_SCALAR_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):[ \t]*(\S(?:.*\S)?)[ \t]*$/;

function invalid(diagnostic: string, recognizedVersion?: ProjectMapContractVersion): ProjectMapParseResult {
  return {
    kind: "invalid",
    diagnostic,
    ...(recognizedVersion !== undefined ? { recognizedVersion } : {}),
  };
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function parseProjectMapDocument(text: string): ProjectMapParseResult {
  const lines = text.split(/\r?\n/);
  const delimiters = lines.flatMap((line, index) => line === "---" ? [index] : []);
  if (delimiters.length !== 2 || delimiters[0] !== 0) {
    return invalid("Project Map frontmatter must have one opening and one closing --- delimiter.");
  }

  const metadata = new Map<string, string>();
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

  const rawVersion = metadata.get("navi_map")!;
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
      diagnostic: `Project Map contract version ${version} is not supported.`,
    };
  }

  if (metadata.get("map_status") !== "confirmed") {
    return invalid("Project Map map_status must be confirmed.", version);
  }

  const projectStatus = metadata.get("project_status")!;
  if (projectStatus !== "active" && projectStatus !== "paused" && projectStatus !== "closed") {
    return invalid("Project Map project_status must be active, paused, or closed.", version);
  }

  const lastConfirmed = metadata.get("last_confirmed")!;
  if (!isCalendarDate(lastConfirmed)) {
    return invalid("Project Map last_confirmed must be a valid YYYY-MM-DD calendar date.", version);
  }

  const body = lines.slice(delimiters[1] + 1).join("\n");
  if (version === LEGACY_PROJECT_MAP_VERSION && body.includes("<!-- navi:outcome-boundary -->")) {
    return invalid("Project Map version 1 must not contain the reserved anchor: navi:outcome-boundary", version);
  }
  const requiredAnchors = version === CURRENT_PROJECT_MAP_VERSION
    ? REQUIRED_PROJECT_MAP_ANCHORS
    : LEGACY_PROJECT_MAP_ANCHORS;
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
      text,
    },
  };
}

export function isOutcomeBoundaryOnlyUpgrade(
  current: ProjectMapDocument,
  candidate: ProjectMapDocument,
): boolean {
  if (current.version !== LEGACY_PROJECT_MAP_VERSION) return false;
  if (candidate.version !== CURRENT_PROJECT_MAP_VERSION) return false;
  if (current.projectStatus !== candidate.projectStatus) return false;

  const currentSource = inspectParsedMapComparisonSource(current);
  const candidateSource = inspectParsedMapComparisonSource(candidate);
  if (currentSource === undefined || candidateSource === undefined) return false;

  const normalizedCurrent = canonicalizeUpgradeComparisonSource(currentSource, false);
  const normalizedCandidate = canonicalizeUpgradeComparisonSource(candidateSource, true);

  return normalizedCandidate === normalizedCurrent;
}

function normalizeMapForUpgradeComparison(text: string): string {
  return text.replace(/\r\n/g, "\n");
}

interface TextRange {
  start: number;
  end: number;
}

interface ParsedMapComparisonSource {
  text: string;
  metadataLines: Map<string, TextRange>;
  anchors: Map<string, number>;
}

function inspectParsedMapComparisonSource(
  document: ProjectMapDocument,
): ParsedMapComparisonSource | undefined {
  const text = normalizeMapForUpgradeComparison(document.text);
  const lines = text.split("\n");
  const lineStarts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
  }

  const closingDelimiter = lines.findIndex((line, index) => index > 0 && line === "---");
  if (closingDelimiter < 0) return undefined;

  const metadataLines = new Map<string, TextRange>();
  for (let index = 1; index < closingDelimiter; index += 1) {
    const match = FRONTMATTER_SCALAR_LINE.exec(lines[index]!);
    if (!match) return undefined;
    metadataLines.set(match[1]!, {
      start: lineStarts[index]!,
      end: lineStarts[index]! + lines[index]!.length,
    });
  }

  const bodyStart = lineStarts[closingDelimiter + 1] ?? text.length;
  const anchors = new Map<string, number>();
  const requiredAnchors = document.version === CURRENT_PROJECT_MAP_VERSION
    ? REQUIRED_PROJECT_MAP_ANCHORS
    : LEGACY_PROJECT_MAP_ANCHORS;
  for (const anchor of requiredAnchors) {
    const markerIndex = text.indexOf(`<!-- ${anchor} -->`, bodyStart);
    if (markerIndex < 0) return undefined;
    anchors.set(anchor, markerIndex);
  }

  return { text, metadataLines, anchors };
}

function canonicalizeUpgradeComparisonSource(
  source: ParsedMapComparisonSource,
  removeOutcomeBoundary: boolean,
): string | undefined {
  const versionLine = source.metadataLines.get("navi_map");
  const lastConfirmedLine = source.metadataLines.get("last_confirmed");
  if (versionLine === undefined || lastConfirmedLine === undefined) return undefined;

  const edits: Array<TextRange & { replacement: string }> = [
    { ...versionLine, replacement: "navi_map: <upgrade-version>" },
    { ...lastConfirmedLine, replacement: "last_confirmed: <upgrade-date>" },
  ];
  if (removeOutcomeBoundary) {
    const outcomeBoundary = source.anchors.get("navi:outcome-boundary");
    const routeToOutcome = source.anchors.get("navi:route-to-outcome");
    if (
      outcomeBoundary === undefined
      || routeToOutcome === undefined
      || outcomeBoundary >= routeToOutcome
    ) return undefined;
    edits.push({ start: outcomeBoundary, end: routeToOutcome, replacement: "" });
  }

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (text, edit) => text.slice(0, edit.start) + edit.replacement + text.slice(edit.end),
      source.text,
    );
}

export async function inspectProjectMapFile(projectDir: string): Promise<ProjectMapFileState> {
  const mapPath = path.join(projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
  const mapDirectory = path.dirname(mapPath);
  let directoryStats;
  try {
    directoryStats = await fs.lstat(mapDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "missing", mapPath };
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
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return await hasSameDirectoryIdentity(mapDirectory, directoryStats)
        ? { kind: "missing", mapPath }
        : { kind: "unsafe", mapPath, diagnostic: "Project Map directory changed during missing-file inspection." };
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

  let text: string;
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
    await handle.close().catch(() => undefined);
  }

  const result = parseProjectMapDocument(text);
  if (result.kind === "valid") return { kind: "valid", mapPath, document: result.document };
  if (result.kind === "unsupported") {
    return {
      kind: "unsupported",
      mapPath,
      version: result.version,
      diagnostic: result.diagnostic,
    };
  }
  return result.recognizedVersion !== undefined
    ? { kind: "invalid", mapPath, diagnostic: result.diagnostic, recognizedVersion: result.recognizedVersion, safelyReadText: text }
    : { kind: "invalid", mapPath, diagnostic: result.diagnostic };
}

async function hasSameDirectoryIdentity(directoryPath: string, expected: Stats): Promise<boolean> {
  try {
    const current = await fs.lstat(directoryPath);
    return current.isDirectory()
      && !current.isSymbolicLink()
      && current.dev === expected.dev
      && current.ino === expected.ino;
  } catch {
    return false;
  }
}
