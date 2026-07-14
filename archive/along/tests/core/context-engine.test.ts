import { describe, expect, it } from "vitest";
import { buildContextPacket } from "../../src/core/context-engine";
import { defaultPermissionEnvelope, defaultRuntimeProfile, type AlongEvent, type AlongSession } from "../../src/core/types";

const session: AlongSession = {
  id: "session-1",
  repoPath: "/tmp/demo",
  startedAt: "2026-06-01T00:00:00.000Z",
  state: "arriving",
  context: {
    repoPath: "/tmp/demo",
    repoName: "demo",
    gitStatus: "clean",
    recentCommits: [],
    manifests: [],
    directorySummary: ["src/"],
    testHints: ["npm test"],
  },
  plan: {
    state: "arriving",
    sessionId: "session-1",
    learningGoal: "understand demo",
    currentActivity: "quietly reading",
    shareLine: "I am reading the project shape.",
  },
};

function event(id: string, kind: AlongEvent["kind"], memoryEligibility: AlongEvent["memoryEligibility"]): AlongEvent {
  return {
    id,
    schemaVersion: 1,
    occurredAt: "2026-06-01T00:00:00.000Z",
    receivedAt: "2026-06-01T00:00:00.000Z",
    sessionId: "session-1",
    source: "user",
    kind,
    visibility: "reviewable",
    scope: "session",
    payload: { text: id },
    provenance: {},
    memoryEligibility,
    riskLevel: "low",
  };
}

function projectEvent(id: string): AlongEvent {
  return {
    ...event(id, "project_observed", "candidate"),
    scope: "project",
    payload: { text: id, filePath: "src/index.ts" },
  };
}

describe("buildContextPacket", () => {
  it("builds sourced session_start context", () => {
    const packet = buildContextPacket({
      session,
      purpose: "session_start",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [event("event-1", "session_started", "never")],
      reviewedMemory: ["Project uses Vitest."],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.purpose).toBe("session_start");
    expect(packet.sections.find((section) => section.kind === "current_session")?.items[0].sourceRef).toBe("session:session-1");
    expect(packet.sections.find((section) => section.kind === "permission_envelope")).toBeTruthy();
  });

  it("omits unreviewed candidates from ordinary user response context", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [event("event-2", "user_preference", "review_required")],
      reviewedMemory: [],
      memoryCandidates: ["Unreviewed candidate"],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Unreviewed candidate")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "memory_candidate:0", reason: "requires_review" });
  });

  it("builds deterministic packets for identical inputs", () => {
    const input = {
      session,
      purpose: "debug_inspection" as const,
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [
        {
          ...event("event-5", "user_message", "never"),
          occurredAt: "2026-06-01T00:01:00.000Z",
          receivedAt: "2026-06-01T00:02:00.000Z",
        },
      ],
      reviewedMemory: ["Project uses Vitest."],
      memoryCandidates: ["Candidate for inspection"],
      maxItems: 8,
      maxApproxTokens: 1000,
    };

    const first = buildContextPacket(input);
    const second = buildContextPacket(input);

    expect(first.id).toBe("context:session-1:debug_inspection");
    expect(first.createdAt).toBe("2026-06-01T00:02:00.000Z");
    expect(first.sections.flatMap((section) => section.items).map((item) => item.id)).toEqual([
      "context-item:current_session:session:session-1",
      "context-item:runtime_profile:.along_settings.json",
      "context-item:permission_envelope:derived:permission_envelope",
      "context-item:recent_events:event:event-5",
      "context-item:reviewed_memory:reviewed_memory:0",
      "context-item:memory_candidate:memory_candidate:0",
    ]);
    expect(second).toEqual(first);
  });

  it("omits project-derived context when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false },
      recentEvents: [
        event("event-6", "user_message", "never"),
        projectEvent("event-7"),
      ],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    const items = packet.sections.flatMap((section) => section.items);
    expect(items.some((item) => item.sourceRef === "session:session-1")).toBe(false);
    expect(items.some((item) => item.sourceRef === ".along/settings.json")).toBe(false);
    expect(items.some((item) => item.sourceRef === "event:event-7")).toBe(false);
    expect(items.some((item) => item.sourceRef === "derived:permission_envelope")).toBe(true);
    expect(items.some((item) => item.sourceRef === "event:event-6")).toBe(true);
    expect(packet.omissions).toContainEqual({ sourceRef: "session:session-1", reason: "permission_denied" });
    expect(packet.omissions).toContainEqual({ sourceRef: ".along/settings.json", reason: "permission_denied" });
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-7", reason: "permission_denied" });
  });

  it("omits session-scoped event payloads with project fields when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false },
      recentEvents: [{
        ...event("event-14", "user_message", "never"),
        payload: { text: "look here", repoPath: "/tmp/demo", filePath: "src/index.ts" },
      }],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.sourceRef === "event:event-14")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-14", reason: "permission_denied" });
  });

  it("omits session-scoped event payloads with repoName when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false },
      recentEvents: [{
        ...event("event-17", "user_message", "never"),
        payload: { repoName: "demo" },
      }],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.sourceRef === "event:event-17")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-17", reason: "permission_denied" });
  });

  it("omits event provenance file paths when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false },
      recentEvents: [{
        ...event("event-15", "user_message", "never"),
        provenance: { filePath: "src/index.ts" },
      }],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.sourceRef === "event:event-15")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-15", reason: "permission_denied" });
  });

  it("includes normal non-project session events when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false },
      recentEvents: [event("event-16", "user_message", "never")],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.find((section) => section.kind === "recent_events")?.items[0]).toMatchObject({
      sourceRef: "event:event-16",
      content: 'user_message: {"text":"event-16"}',
    });
    expect(packet.omissions).not.toContainEqual({ sourceRef: "event:event-16", reason: "permission_denied" });
  });

  it("omits reviewed memory when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false, canReadAlongMemory: true },
      recentEvents: [],
      reviewedMemory: ["Project memory requires project read permission."],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.find((section) => section.kind === "reviewed_memory")).toBeUndefined();
    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Project memory requires project read permission.")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "reviewed_memory:0", reason: "permission_denied" });
  });

  it("omits memory candidates when project reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "debug_inspection",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadProject: false, canReadAlongMemory: true },
      recentEvents: [],
      reviewedMemory: [],
      memoryCandidates: ["Project candidate requires project read permission."],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.find((section) => section.kind === "memory_candidate")).toBeUndefined();
    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Project candidate requires project read permission.")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "memory_candidate:0", reason: "permission_denied" });
  });

  it("omits global candidate recent events when memory reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadAlongMemory: false },
      recentEvents: [{ ...event("event-8", "user_message", "never"), scope: "global_candidate" }],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.sourceRef === "event:event-8")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-8", reason: "permission_denied" });
  });

  it("omits memory candidate event kinds when memory reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadAlongMemory: false },
      recentEvents: [
        event("event-9", "memory_candidate_created", "never"),
        event("event-10", "graph_relation_candidate_created", "never"),
      ],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    const sourceRefs = packet.sections.flatMap((section) => section.items).map((item) => item.sourceRef);
    expect(sourceRefs).not.toContain("event:event-9");
    expect(sourceRefs).not.toContain("event:event-10");
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-9", reason: "permission_denied" });
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-10", reason: "permission_denied" });
  });

  it("omits memory-eligible recent events when memory reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadAlongMemory: false },
      recentEvents: [
        event("event-11", "user_preference", "candidate"),
        event("event-12", "user_preference", "review_required"),
      ],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    const sourceRefs = packet.sections.flatMap((section) => section.items).map((item) => item.sourceRef);
    expect(sourceRefs).not.toContain("event:event-11");
    expect(sourceRefs).not.toContain("event:event-12");
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-11", reason: "permission_denied" });
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-12", reason: "permission_denied" });
  });

  it("includes normal session recent events when memory reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "user_response",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadAlongMemory: false },
      recentEvents: [event("event-13", "user_message", "never")],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.find((section) => section.kind === "recent_events")?.items[0]).toMatchObject({
      sourceRef: "event:event-13",
      content: 'user_message: {"text":"event-13"}',
    });
    expect(packet.omissions).not.toContainEqual({ sourceRef: "event:event-13", reason: "permission_denied" });
  });

  it("denies memory-derived content when memory reads are disabled", () => {
    const packet = buildContextPacket({
      session,
      purpose: "debug_inspection",
      profile: defaultRuntimeProfile,
      permissionEnvelope: { ...defaultPermissionEnvelope, canReadAlongMemory: false },
      recentEvents: [],
      reviewedMemory: ["Reviewed memory"],
      memoryCandidates: ["Debug candidate"],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Reviewed memory")).toBe(false);
    expect(packet.sections.flatMap((section) => section.items).some((item) => item.content === "Debug candidate")).toBe(false);
    expect(packet.omissions).toContainEqual({ sourceRef: "reviewed_memory:0", reason: "permission_denied" });
    expect(packet.omissions).toContainEqual({ sourceRef: "memory_candidate:0", reason: "permission_denied" });
  });

  it("includes memory candidates for debug inspection when memory reads are allowed", () => {
    const packet = buildContextPacket({
      session,
      purpose: "debug_inspection",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [],
      reviewedMemory: [],
      memoryCandidates: ["Debug candidate"],
      maxItems: 8,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.find((section) => section.kind === "memory_candidate")?.items[0]).toMatchObject({
      content: "Debug candidate",
      sourceRef: "memory_candidate:0",
    });
  });

  it("applies maxItems to items and records budget omissions", () => {
    const packet = buildContextPacket({
      session,
      purpose: "debug_inspection",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [
        event("event-3", "user_message", "never"),
        event("event-4", "project_observed", "never"),
      ],
      reviewedMemory: ["Reviewed memory"],
      memoryCandidates: ["Debug candidate"],
      maxItems: 4,
      maxApproxTokens: 1000,
    });

    expect(packet.sections.flatMap((section) => section.items)).toHaveLength(4);
    expect(packet.sections.find((section) => section.kind === "recent_events")?.items).toHaveLength(1);
    expect(packet.omissions).toContainEqual({ sourceRef: "event:event-4", reason: "budget" });
    expect(packet.omissions).toContainEqual({ sourceRef: "reviewed_memory:0", reason: "budget" });
    expect(packet.omissions).toContainEqual({ sourceRef: "memory_candidate:0", reason: "budget" });
  });

  it("applies maxApproxTokens and records budget omissions", () => {
    const packet = buildContextPacket({
      session,
      purpose: "session_start",
      profile: defaultRuntimeProfile,
      permissionEnvelope: defaultPermissionEnvelope,
      recentEvents: [],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1,
    });

    expect(packet.sections.flatMap((section) => section.items)).toHaveLength(0);
    expect(packet.omissions).toContainEqual({ sourceRef: "session:session-1", reason: "budget" });
    expect(packet.omissions).toContainEqual({ sourceRef: ".along/settings.json", reason: "budget" });
    expect(packet.omissions).toContainEqual({ sourceRef: "derived:permission_envelope", reason: "budget" });
  });
});
