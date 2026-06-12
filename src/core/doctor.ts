import { buildContextPacket } from "./context-engine";
import { EventStore } from "./event-store";
import { getCurrentSessionPath, getSessionFilePath } from "./paths";
import { ReviewGate } from "./review-gate";
import { derivePermissionEnvelope, loadRuntimeProfile } from "./runtime-profile";
import { TraceStore } from "./trace-store";
import type { AlongSession, RuntimeDoctorReport, SessionLifecycleState } from "./types";
import { WriteCoordinator } from "./write-coordinator";

interface CurrentSessionPointer {
  sessionId: string;
  state: SessionLifecycleState;
  projectPath: string;
}

export async function getRuntimeDoctorReport(repoPath: string): Promise<RuntimeDoctorReport> {
  const coordinator = new WriteCoordinator(repoPath);
  const profile = await loadRuntimeProfile(repoPath);
  const permissionEnvelope = derivePermissionEnvelope(profile);
  const rawPointer = await coordinator.readJson<unknown | null>(getCurrentSessionPath(repoPath), null);
  const pointer = asCurrentPointer(rawPointer, repoPath);
  const rawSession = pointer ? await coordinator.readJson<unknown | null>(getSessionFilePath(repoPath, pointer.sessionId), null) : null;
  const session = pointer ? asAlongSession(rawSession, repoPath, pointer.sessionId) : undefined;
  const events = session ? await new EventStore(repoPath).readEvents(session.id) : [];
  const traces = session ? await new TraceStore(repoPath).readTraces(session.id) : [];
  const review = await new ReviewGate(repoPath).readInbox();
  const latestContextPacket = session ? buildContextPacket({
    session,
    purpose: "debug_inspection",
    profile,
    permissionEnvelope,
    recentEvents: events.slice(-5),
    reviewedMemory: [],
    memoryCandidates: review.filter((item) => item.status === "pending").map((item) => item.proposedChange),
    maxItems: 12,
    maxApproxTokens: 1500,
  }) : undefined;

  return {
    lifecycleState: pointer && session ? pointer.state : "none",
    effectiveProfile: profile,
    permissionEnvelope,
    currentPointerHealthy: Boolean(pointer && session),
    recentEvents: events.slice(-10),
    latestContextPacket,
    pendingReviewItems: review.filter((item) => item.status === "pending"),
    recentFailures: traces.filter((trace) => trace.outcome === "failed").slice(-5),
    storageMode: "writable",
  };
}

function asCurrentPointer(value: unknown, repoPath: string): CurrentSessionPointer | undefined {
  if (!isRecord(value)) return undefined;
  if (!isSafeSessionId(value.sessionId)) return undefined;
  if (!isSessionLifecycleState(value.state)) return undefined;
  if (value.projectPath !== repoPath) return undefined;
  return {
    sessionId: value.sessionId,
    state: value.state,
    projectPath: value.projectPath,
  };
}

function asAlongSession(value: unknown, repoPath: string, sessionId: string): AlongSession | undefined {
  if (!isRecord(value)) return undefined;
  if (value.id !== sessionId || value.repoPath !== repoPath) return undefined;
  if (!hasString(value, "startedAt") || !hasString(value, "state")) return undefined;

  const plan = value.plan;
  if (!isRecord(plan) || !hasString(plan, "learningGoal") || !hasString(plan, "state")) return undefined;

  const context = value.context;
  if (!isRecord(context) || !hasString(context, "repoName")) return undefined;

  return value as unknown as AlongSession;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string";
}

function isSafeSessionId(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value !== "."
    && value !== ".."
    && value !== "current"
    && value !== "index"
    && !value.includes("/")
    && !value.includes("\\")
    && /^[A-Za-z0-9_-]+$/.test(value);
}

function isSessionLifecycleState(value: unknown): value is SessionLifecycleState {
  return value === "new"
    || value === "active"
    || value === "paused"
    || value === "wrapped"
    || value === "expired"
    || value === "recovered";
}
