import { buildContextPacket } from "./context-engine";
import { EventStore } from "./event-store";
import { getCurrentSessionPath } from "./paths";
import { ReviewGate } from "./review-gate";
import { derivePermissionEnvelope, loadRuntimeProfile } from "./runtime-profile";
import { SessionLifecycle } from "./session-lifecycle";
import { TraceStore } from "./trace-store";
import type { RuntimeDoctorReport } from "./types";
import { WriteCoordinator } from "./write-coordinator";

export async function getRuntimeDoctorReport(repoPath: string): Promise<RuntimeDoctorReport> {
  const coordinator = new WriteCoordinator(repoPath);
  const lifecycle = new SessionLifecycle(repoPath);
  const profile = await loadRuntimeProfile(repoPath);
  const permissionEnvelope = derivePermissionEnvelope(profile);
  const pointer = await coordinator.readJson<{ sessionId: string; state: RuntimeDoctorReport["lifecycleState"] } | null>(getCurrentSessionPath(repoPath), null);
  const recovered = await lifecycle.recoverCurrentSession();
  const session = recovered.session;
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
    lifecycleState: pointer?.state ?? recovered.lifecycleState,
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
