import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { TraceEntry } from "./types";
import { getTraceFilePath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export type TraceInput = Omit<TraceEntry, "id" | "at">;

export class TraceStore {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async recordTrace(input: TraceInput): Promise<TraceEntry> {
    const trace: TraceEntry = {
      id: `trace-${randomUUID()}`,
      at: new Date().toISOString(),
      ...input,
    };
    const sessionId = input.sessionId ?? "runtime";
    await this.coordinator.appendJsonLine(getTraceFilePath(this.repoPath, sessionId), trace);
    return trace;
  }

  async readTraces(sessionId: string): Promise<TraceEntry[]> {
    let raw: string;
    try {
      raw = await fs.readFile(getTraceFilePath(this.repoPath, sessionId), "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
    return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line) as TraceEntry);
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
