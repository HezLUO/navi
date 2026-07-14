import type { AlongEvent, AlongSession, ContextPacket, ContextPurpose, PermissionEnvelope, RuntimeProfile } from "./types";

type ContextItem = ContextPacket["sections"][number]["items"][number];
type ContextSectionKind = ContextPacket["sections"][number]["kind"];
type ContextItemInput = Omit<ContextItem, "id">;

interface ContextInput {
  session: AlongSession;
  purpose: ContextPurpose;
  profile: RuntimeProfile;
  permissionEnvelope: PermissionEnvelope;
  recentEvents: AlongEvent[];
  reviewedMemory: string[];
  memoryCandidates: string[];
  maxItems: number;
  maxApproxTokens: number;
}

function approximateTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function normalizeIdSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9:._-]+/g, "_");
}

function createContextItem(kind: ContextSectionKind, item: ContextItemInput): ContextItem {
  return {
    id: `context-item:${normalizeIdSegment(kind)}:${normalizeIdSegment(item.sourceRef)}`,
    ...item,
  };
}

function resolveCreatedAt(session: AlongSession, recentEvents: AlongEvent[]): string {
  // Derive packet time from input timestamps so repeated builds are inspectable and deterministic.
  let latest = session.startedAt;
  let latestTime = Date.parse(latest);

  for (const timestamp of recentEvents.flatMap((event) => [event.occurredAt, event.receivedAt])) {
    const time = Date.parse(timestamp);
    if (Number.isFinite(time) && (!Number.isFinite(latestTime) || time > latestTime)) {
      latest = timestamp;
      latestTime = time;
    }
  }

  return latest;
}

function isMemoryDerivedEvent(event: AlongEvent): boolean {
  return event.scope === "global_candidate"
    || event.kind === "memory_candidate_created"
    || event.kind === "graph_relation_candidate_created"
    || event.memoryEligibility === "candidate"
    || event.memoryEligibility === "review_required";
}

const projectPayloadKeys = new Set([
  "repoPath",
  "repoName",
  "filePath",
  "path",
  "paths",
  "gitStatus",
  "recentCommits",
  "directorySummary",
  "manifests",
  "readme",
  "testHints",
  "command",
  "output",
]);

function payloadHasProjectField(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => payloadHasProjectField(item));
  }

  if (value === null || typeof value !== "object") {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).some(([key, item]) => (
    projectPayloadKeys.has(key) || payloadHasProjectField(item)
  ));
}

function isProjectDerivedEvent(event: AlongEvent): boolean {
  return event.scope === "project"
    || event.source === "filesystem"
    || event.kind === "project_observed"
    || event.kind === "file_summary_changed"
    || Boolean(event.provenance.filePath)
    || Boolean(event.provenance.command)
    || payloadHasProjectField(event.payload);
}

export function buildContextPacket(input: ContextInput): ContextPacket {
  const sections: ContextPacket["sections"] = [];
  const omissions: ContextPacket["omissions"] = [];
  let includedItems = 0;
  let usedApproxTokens = 0;

  function addItem(kind: ContextSectionKind, item: ContextItem): void {
    const itemApproxTokens = approximateTokens(item.content);

    if (includedItems >= input.maxItems || usedApproxTokens + itemApproxTokens > input.maxApproxTokens) {
      omissions.push({ sourceRef: item.sourceRef, reason: "budget" });
      return;
    }

    let section = sections.find((entry) => entry.kind === kind);
    if (!section) {
      section = { kind, items: [] };
      sections.push(section);
    }

    section.items.push(item);
    includedItems += 1;
    usedApproxTokens += itemApproxTokens;
  }

  if (input.permissionEnvelope.canReadProject) {
    addItem("current_session", createContextItem("current_session", {
      content: `${input.session.context.repoName}: ${input.session.plan.learningGoal}`,
      sourceRef: `session:${input.session.id}`,
      includedBecause: `${input.purpose} needs the active session identity and learning goal.`,
      confidence: "high",
      scope: "session",
      riskLevel: "low",
    }));

    addItem("runtime_profile", createContextItem("runtime_profile", {
      content: JSON.stringify(input.profile),
      sourceRef: ".along/settings.json",
      includedBecause: "Runtime behavior must reflect the effective profile.",
      confidence: "high",
      scope: "project",
      riskLevel: "low",
    }));
  } else {
    omissions.push({ sourceRef: `session:${input.session.id}`, reason: "permission_denied" });
    omissions.push({ sourceRef: ".along/settings.json", reason: "permission_denied" });
  }

  addItem("permission_envelope", createContextItem("permission_envelope", {
    content: JSON.stringify(input.permissionEnvelope),
    sourceRef: "derived:permission_envelope",
    includedBecause: "Every runtime operation must obey permissions.",
    confidence: "high",
    scope: "session",
    riskLevel: "low",
  }));

  for (const event of input.recentEvents) {
    const sourceRef = `event:${event.id}`;

    if (!input.permissionEnvelope.canReadAlongMemory && isMemoryDerivedEvent(event)) {
      omissions.push({ sourceRef, reason: "permission_denied" });
      continue;
    }

    if (!input.permissionEnvelope.canReadProject && isProjectDerivedEvent(event)) {
      omissions.push({ sourceRef, reason: "permission_denied" });
      continue;
    }

    addItem("recent_events", createContextItem("recent_events", {
      content: `${event.kind}: ${JSON.stringify(event.payload)}`,
      sourceRef,
      includedBecause: `${input.purpose} uses recent explicit runtime events.`,
      confidence: "high",
      scope: event.scope === "global_candidate" ? "global" : event.scope,
      riskLevel: event.riskLevel,
    }));
  }

  if (!input.permissionEnvelope.canReadAlongMemory || !input.permissionEnvelope.canReadProject) {
    for (const [index] of input.reviewedMemory.entries()) {
      omissions.push({ sourceRef: `reviewed_memory:${index}`, reason: "permission_denied" });
    }
    for (const [index] of input.memoryCandidates.entries()) {
      omissions.push({ sourceRef: `memory_candidate:${index}`, reason: "permission_denied" });
    }
  } else {
    for (const [index, memory] of input.reviewedMemory.entries()) {
      addItem("reviewed_memory", createContextItem("reviewed_memory", {
        content: memory,
        sourceRef: `reviewed_memory:${index}`,
        includedBecause: "Reviewed memory may influence ordinary Along behavior.",
        confidence: "medium",
        scope: "project",
        riskLevel: "low",
      }));
    }

    for (const [index, candidate] of input.memoryCandidates.entries()) {
      const sourceRef = `memory_candidate:${index}`;

      if (input.purpose === "memory_consolidation" || input.purpose === "debug_inspection") {
        addItem("memory_candidate", createContextItem("memory_candidate", {
          content: candidate,
          sourceRef,
          includedBecause: `${input.purpose} is allowed to inspect memory candidates.`,
          confidence: "low",
          scope: "project",
          riskLevel: "medium",
        }));
      } else {
        omissions.push({ sourceRef, reason: "requires_review" });
      }
    }
  }

  return {
    id: `context:${normalizeIdSegment(input.session.id)}:${normalizeIdSegment(input.purpose)}`,
    createdAt: resolveCreatedAt(input.session, input.recentEvents),
    sessionId: input.session.id,
    purpose: input.purpose,
    budget: {
      maxItems: input.maxItems,
      maxApproxTokens: input.maxApproxTokens,
    },
    sections,
    omissions,
  };
}
