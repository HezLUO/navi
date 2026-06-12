import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { CuriosityItem, JournalEntry } from "./types";
import { defaultRuntimeProfile } from "./types";
import { getGlobalAlongDir, getProjectAlongDir, getProjectGraphDir } from "./paths";
import { GraphStore } from "./graph-store";

export class MemoryStore {
  readonly projectDir: string;
  readonly globalDir: string;
  readonly projectGraph: GraphStore;

  constructor(
    readonly repoPath: string,
    readonly homeDir: string,
  ) {
    this.projectDir = getProjectAlongDir(repoPath);
    this.globalDir = getGlobalAlongDir(homeDir);
    this.projectGraph = new GraphStore(getProjectGraphDir(repoPath));
  }

  async ensureInitialized(): Promise<void> {
    await Promise.all([
      fs.mkdir(path.join(this.projectDir, "memory"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "journal"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "curiosity"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "drafts", "suggestions"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "drafts", "review-notes"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "drafts", "issue-drafts"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "sessions"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "events"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "context"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "review"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "traces"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "locks"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "graph"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "threads"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "delegations"), { recursive: true }),
      fs.mkdir(path.join(this.projectDir, "conductor"), { recursive: true }),
      fs.mkdir(path.join(this.globalDir, "graph"), { recursive: true }),
    ]);

    await this.writeIfMissing(path.join(this.projectDir, "companion.md"), "# Along In This Project\n\nAlong learns this project quietly and keeps its own work journal.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "project-summary.md"), "# Project Summary\n\nAlong has not summarized this project yet.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "user-patterns.md"), "# Project-Specific User Patterns\n\nNo project-specific patterns recorded yet.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "learned-facts.json"), "[]\n");
    await this.writeIfMissing(path.join(this.projectDir, "curiosity", "queue.json"), "[]\n");
    await this.writeIfMissing(path.join(this.projectDir, "threads", "open-threads.json"), "[]\n");
    await this.writeIfMissing(path.join(this.projectDir, "delegations", "requests.json"), "[]\n");
    await this.writeIfMissing(path.join(this.projectDir, "curiosity", "resolved.md"), "# Resolved Curiosities\n\n");
    await this.writeIfMissing(path.join(this.projectDir, "settings.json"), `${JSON.stringify(defaultRuntimeProfile, null, 2)}\n`);
    await this.writeIfMissing(path.join(this.projectDir, "state.json"), `${JSON.stringify({
      schemaVersion: 1,
      runtimeVersion: "control-plane-v1",
      lastActiveSessionId: undefined,
      lastOpenedAt: undefined,
      health: "writable",
      effectiveProfile: defaultRuntimeProfile,
    }, null, 2)}\n`);
    await this.writeIfMissing(path.join(this.projectDir, "sessions", "index.json"), "[]\n");
    await this.writeIfMissing(path.join(this.globalDir, "companion-profile.md"), "# Along\n\nAlong is a lo-fi coding companion that learns along with the user.\n");
    await this.writeIfMissing(path.join(this.globalDir, "user-patterns.md"), "# User Patterns\n\nNo cross-project patterns recorded yet.\n");
    await this.writeIfMissing(path.join(this.globalDir, "global-curiosity.md"), "# Global Curiosity\n\n");
    await this.writeIfMissing(path.join(this.globalDir, "projects-index.json"), "[]\n");
  }

  async readCuriosities(): Promise<CuriosityItem[]> {
    await this.ensureInitialized();
    const raw = await fs.readFile(path.join(this.projectDir, "curiosity", "queue.json"), "utf8");
    return JSON.parse(raw) as CuriosityItem[];
  }

  async writeCuriosities(items: CuriosityItem[]): Promise<void> {
    await this.ensureInitialized();
    await fs.writeFile(path.join(this.projectDir, "curiosity", "queue.json"), `${JSON.stringify(items, null, 2)}\n`);
  }

  async writeJournal(entry: JournalEntry): Promise<string> {
    await this.ensureInitialized();
    const filePath = path.join(this.projectDir, "journal", `${entry.date}.md`);
    const section = this.formatJournalSection(entry);
    let existing = "";
    try {
      existing = await fs.readFile(filePath, "utf8");
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }

    const header = `# ${entry.date} Along Journal\n\n`;
    const existingSections = this.findJournalSessionSections(existing, entry.sessionId);
    if (existingSections.length > 0) {
      const currentSection = existing.slice(existingSections[0].start, existingSections[0].end);
      if (
        existingSections.length === 1
        && this.normalizeJournalSection(currentSection) === this.normalizeJournalSection(section)
      ) {
        return filePath;
      }
      await this.writeFileAtomic(filePath, this.replaceJournalSessionSections(existing, existingSections, section, header));
      return filePath;
    }

    const body = existing.trim().length > 0
      ? `${existing.replace(/\s*$/, "\n\n")}${section}\n`
      : `${header}${section}\n`;
    await this.writeFileAtomic(filePath, body);
    return filePath;
  }

  async writeSession(sessionId: string, value: unknown): Promise<string> {
    await this.ensureInitialized();
    const filePath = path.join(this.projectDir, "sessions", `${sessionId}.json`);
    await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
    return filePath;
  }

  private async writeIfMissing(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, { flag: "wx" });
    } catch (error) {
      if (!isAlreadyExistsError(error)) throw error;
    }
  }

  private formatJournalSection(entry: JournalEntry): string {
    return [
      `## Session ${entry.sessionId}`,
      "",
      "### I Tried To Understand",
      entry.triedToUnderstand,
      "",
      "### I Looked At",
      ...entry.lookedAt.map((item) => `- ${item}`),
      "",
      "### I Now Believe",
      ...entry.nowBelieves.map((item) => `- ${item}`),
      "",
      "### I Am Still Unsure About",
      ...entry.stillUnsure.map((item) => `- ${item}`),
      "",
      "### Next Time",
      entry.nextTime,
      "",
      "### What I Noticed About Our Session",
      entry.noticedAboutSession,
      "",
    ].join("\n");
  }

  private findJournalSessionSections(content: string, sessionId: string): Array<{ start: number; end: number }> {
    if (content.length === 0) return [];

    const markers = this.findJournalSessionMarkers(content);
    return markers.flatMap((marker, index) => (
      marker.sessionId === sessionId
        ? [{ start: marker.start, end: markers[index + 1]?.start ?? content.length }]
        : []
    ));
  }

  private findJournalSessionMarkers(content: string): Array<{ start: number; sessionId: string }> {
    const markers: Array<{ start: number; sessionId: string }> = [];
    let lineStart = 0;
    while (lineStart <= content.length) {
      const nextNewline = content.indexOf("\n", lineStart);
      const lineEnd = nextNewline === -1 ? content.length : nextNewline;
      const line = content.slice(lineStart, lineEnd);
      const sessionId = this.sessionIdFromJournalMarkerLine(line);
      if (sessionId.length > 0) markers.push({ start: lineStart, sessionId });
      if (nextNewline === -1) break;
      lineStart = nextNewline + 1;
    }
    return markers;
  }

  private sessionIdFromJournalMarkerLine(line: string): string {
    if (line.startsWith("## Session ")) return line.slice("## Session ".length).trim();
    if (line.startsWith("Session: ")) return line.slice("Session: ".length).trim();
    return "";
  }

  private replaceJournalSessionSections(
    existing: string,
    ranges: Array<{ start: number; end: number }>,
    section: string,
    header: string,
  ): string {
    const sorted = [...ranges].sort((left, right) => left.start - right.start);
    const parts: string[] = [];
    let cursor = 0;
    sorted.forEach((range, index) => {
      const before = existing.slice(cursor, range.start).trim();
      if (before.length > 0) parts.push(before);
      if (index === 0) parts.push(section.trimEnd());
      cursor = range.end;
    });
    const after = existing.slice(cursor).trim();
    if (after.length > 0) parts.push(after);
    if (parts.length === 1 && parts[0] === section.trimEnd()) parts.unshift(header.trimEnd());
    return `${parts.join("\n\n")}\n`;
  }

  private normalizeJournalSection(content: string): string {
    return content.replace(/\r\n/g, "\n").trim();
  }

  private async writeFileAtomic(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
    let handle: fs.FileHandle | undefined;

    try {
      handle = await fs.open(tempPath, "wx");
      await handle.writeFile(content);
      await handle.sync();
      await handle.close();
      handle = undefined;
      await fs.rename(tempPath, filePath);
    } catch (error) {
      if (handle) await handle.close().catch(() => undefined);
      await fs.unlink(tempPath).catch(() => undefined);
      throw error;
    }
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}

function isAlreadyExistsError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "EEXIST";
}
