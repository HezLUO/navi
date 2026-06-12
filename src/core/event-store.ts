import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { AlongEvent, AlongEventKind, AlongEventSource } from "./types";
import { getEventsFilePath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export interface EventInput {
  sessionId: string;
  source: AlongEventSource;
  kind: AlongEventKind;
  visibility: AlongEvent["visibility"];
  scope: AlongEvent["scope"];
  payload: Record<string, unknown>;
  provenance: AlongEvent["provenance"];
  memoryEligibility: AlongEvent["memoryEligibility"];
  riskLevel: AlongEvent["riskLevel"];
  occurredAt?: string;
  idempotencyKey?: string;
}

export class EventStore {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async recordEvent(input: EventInput): Promise<AlongEvent> {
    const now = new Date().toISOString();
    const event: AlongEvent = {
      id: `event-${randomUUID()}`,
      schemaVersion: 1,
      occurredAt: input.occurredAt ?? now,
      receivedAt: now,
      sessionId: input.sessionId,
      source: input.source,
      kind: input.kind,
      visibility: input.visibility,
      scope: input.scope,
      payload: input.payload,
      provenance: input.provenance,
      memoryEligibility: input.memoryEligibility,
      riskLevel: input.riskLevel,
      idempotencyKey: input.idempotencyKey,
    };

    await this.coordinator.appendJsonLine(getEventsFilePath(this.repoPath, input.sessionId), event);
    const events = await this.readEvents(input.sessionId);
    return events.find((item) => item.idempotencyKey && item.idempotencyKey === input.idempotencyKey) ?? event;
  }

  async readEvents(sessionId: string): Promise<AlongEvent[]> {
    let raw: string;
    try {
      raw = await fs.readFile(getEventsFilePath(this.repoPath, sessionId), "utf8");
    } catch (error) {
      if (isNotFoundError(error)) return [];
      throw error;
    }
    return raw.split("\n").filter(Boolean).map((line) => JSON.parse(line) as AlongEvent);
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code?: unknown }).code === "ENOENT";
}
