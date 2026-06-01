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
      fs.mkdir(path.join(this.globalDir, "graph"), { recursive: true }),
    ]);

    await this.writeIfMissing(path.join(this.projectDir, "companion.md"), "# Along In This Project\n\nAlong learns this project quietly and keeps its own work journal.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "project-summary.md"), "# Project Summary\n\nAlong has not summarized this project yet.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "user-patterns.md"), "# Project-Specific User Patterns\n\nNo project-specific patterns recorded yet.\n");
    await this.writeIfMissing(path.join(this.projectDir, "memory", "learned-facts.json"), "[]\n");
    await this.writeIfMissing(path.join(this.projectDir, "curiosity", "queue.json"), "[]\n");
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
    const body = [
      `# ${entry.date} Along Journal`,
      "",
      `Session: ${entry.sessionId}`,
      "",
      "## I Tried To Understand",
      entry.triedToUnderstand,
      "",
      "## I Looked At",
      ...entry.lookedAt.map((item) => `- ${item}`),
      "",
      "## I Now Believe",
      ...entry.nowBelieves.map((item) => `- ${item}`),
      "",
      "## I Am Still Unsure About",
      ...entry.stillUnsure.map((item) => `- ${item}`),
      "",
      "## Next Time",
      entry.nextTime,
      "",
      "## What I Noticed About Our Session",
      entry.noticedAboutSession,
      "",
    ].join("\n");
    await fs.writeFile(filePath, body);
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
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, content);
    }
  }
}
