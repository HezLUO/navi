import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

export const NAVI_PROJECT_MAP_RELATIVE_PATH = ".navi/project-map.md";
export const REQUIRED_PROJECT_MAP_ANCHORS = [
  "navi:desired-outcome",
  "navi:route-to-outcome",
  "navi:current-position",
  "navi:current-boundary",
  "navi:next-decision",
  "navi:evidence-and-uncertainty",
] as const;

export type ProjectLifecycleStatus = "active" | "paused" | "closed";

export interface ProjectMapDocument {
  version: 1;
  mapStatus: "confirmed";
  projectStatus: ProjectLifecycleStatus;
  lastConfirmed: string;
  text: string;
}

export type ProjectMapParseResult =
  | { kind: "valid"; document: ProjectMapDocument }
  | { kind: "unsupported"; version: number; diagnostic: string }
  | { kind: "invalid"; diagnostic: string; recognizedVersion?: 1 };

export type ProjectMapFileState =
  | { kind: "missing"; mapPath: string }
  | { kind: "valid"; mapPath: string; document: ProjectMapDocument }
  | { kind: "unsupported"; mapPath: string; version: number; diagnostic: string }
  | { kind: "invalid"; mapPath: string; diagnostic: string; recognizedVersion?: 1 }
  | { kind: "unsafe"; mapPath: string; diagnostic: string };

const REQUIRED_FRONTMATTER_KEYS = [
  "navi_map",
  "map_status",
  "project_status",
  "last_confirmed",
] as const;

function invalid(diagnostic: string, recognizedVersion?: 1): ProjectMapParseResult {
  return {
    kind: "invalid",
    diagnostic,
    ...(recognizedVersion === 1 ? { recognizedVersion } : {}),
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
    const match = /^([A-Za-z_][A-Za-z0-9_-]*):[ \t]*(\S(?:.*\S)?)[ \t]*$/.exec(line);
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
  if (version !== 1) {
    return {
      kind: "unsupported",
      version,
      diagnostic: `Project Map contract version ${version} is not supported.`,
    };
  }

  if (metadata.get("map_status") !== "confirmed") {
    return invalid("Project Map map_status must be confirmed.", 1);
  }

  const projectStatus = metadata.get("project_status")!;
  if (projectStatus !== "active" && projectStatus !== "paused" && projectStatus !== "closed") {
    return invalid("Project Map project_status must be active, paused, or closed.", 1);
  }

  const lastConfirmed = metadata.get("last_confirmed")!;
  if (!isCalendarDate(lastConfirmed)) {
    return invalid("Project Map last_confirmed must be a valid YYYY-MM-DD calendar date.", 1);
  }

  const body = lines.slice(delimiters[1] + 1).join("\n");
  let previousAnchorIndex = -1;
  for (const anchor of REQUIRED_PROJECT_MAP_ANCHORS) {
    const marker = `<!-- ${anchor} -->`;
    const firstIndex = body.indexOf(marker);
    if (firstIndex < 0) return invalid(`Project Map is missing required anchor: ${anchor}`, 1);
    if (body.indexOf(marker, firstIndex + marker.length) >= 0) {
      return invalid(`Project Map contains duplicate required anchor: ${anchor}`, 1);
    }
    if (firstIndex < previousAnchorIndex) {
      return invalid(`Project Map required anchor is out of order: ${anchor}`, 1);
    }
    previousAnchorIndex = firstIndex;
  }

  return {
    kind: "valid",
    document: {
      version: 1,
      mapStatus: "confirmed",
      projectStatus,
      lastConfirmed,
      text,
    },
  };
}

export async function inspectProjectMapFile(projectDir: string): Promise<ProjectMapFileState> {
  const mapPath = path.join(projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
  let stats;
  try {
    stats = await fs.lstat(mapPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "missing", mapPath };
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
  return {
    kind: "invalid",
    mapPath,
    diagnostic: result.diagnostic,
    ...(result.recognizedVersion === 1 ? { recognizedVersion: 1 as const } : {}),
  };
}
