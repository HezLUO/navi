import type { HeartbeatTrigger, OpenThread, ThreadAttentionScore } from "./types";

interface ScoreInput {
  trigger: HeartbeatTrigger;
  now: Date;
  lastInterventionAt?: string;
  allowReadOnlyDelegation: boolean;
  canProactivelyMessage: boolean;
}

const dayMs = 24 * 60 * 60 * 1000;

export function scoreOpenThread(thread: OpenThread, input: ScoreInput): ThreadAttentionScore {
  const latestTime = Date.parse(thread.updatedAt);
  const ageDays = Number.isFinite(latestTime) ? Math.max(0, (input.now.getTime() - latestTime) / dayMs) : 0;
  const highRiskCount = thread.risks.filter((risk) => risk.severity === "high").length;
  const mediumRiskCount = thread.risks.filter((risk) => risk.severity === "medium").length;
  const strongEvidenceCount = thread.evidence.filter((evidence) => evidence.strength === "strong").length;
  const recentInterventionMinutes = minutesSince(input.lastInterventionAt, input.now);

  const factors = {
    riskDelta: Math.min(4, highRiskCount * 4 + mediumRiskCount * 2),
    judgmentDelta: input.trigger === "delegation_result" || input.trigger === "user_event" ? 2 : 0,
    staleness: Math.min(3, Math.floor(ageDays / 3)),
    continuity: thread.whyItMatters.length > 0 ? 2 : 0,
    evidenceGap: thread.evidence.length === 0 ? 3 : strongEvidenceCount === 0 ? 1 : 0,
    delegationValue: input.allowReadOnlyDelegation && thread.evidence.length === 0 && thread.delegationHistory.length === 0 ? 2 : 0,
    interruptionCost: recentInterventionMinutes !== undefined && recentInterventionMinutes < 60
      ? 4
      : input.trigger === "interval"
        ? 2
        : 0,
    userPreferenceFit: input.canProactivelyMessage ? 1 : 0,
  };

  const score = factors.riskDelta
    + factors.judgmentDelta
    + factors.staleness
    + factors.continuity
    + factors.evidenceGap
    + factors.delegationValue
    + factors.userPreferenceFit
    - factors.interruptionCost;

  const reasons = reasonsFor(thread, factors);
  let action: ThreadAttentionScore["action"] = "silent";

  if (factors.riskDelta >= 4 && input.canProactivelyMessage && score >= 5) {
    action = "intervention";
  } else if (input.allowReadOnlyDelegation && factors.delegationValue > 0 && factors.evidenceGap > 0 && score >= 5) {
    action = "read_only_delegation";
  } else if (score >= 5 && input.canProactivelyMessage) {
    action = "digest";
  } else if (score >= 3) {
    action = "thread_update";
  }

  return {
    threadId: thread.id,
    trigger: input.trigger,
    score,
    action,
    factors,
    reasons,
  };
}

function reasonsFor(thread: OpenThread, factors: ThreadAttentionScore["factors"]): string[] {
  const reasons: string[] = [];
  if (factors.riskDelta >= 4) reasons.push("high risk evidence is present");
  if (factors.staleness > 0) reasons.push("thread has not been revisited recently");
  if (factors.evidenceGap > 0) reasons.push("thread needs stronger evidence");
  if (factors.delegationValue > 0) reasons.push("read-only delegation can reduce uncertainty");
  if (thread.whyItMatters.length > 0) reasons.push(`continuity: ${thread.whyItMatters}`);
  return reasons;
}

function minutesSince(timestamp: string | undefined, now: Date): number | undefined {
  if (!timestamp) return undefined;
  const time = Date.parse(timestamp);
  if (!Number.isFinite(time)) return undefined;
  return Math.max(0, (now.getTime() - time) / 60_000);
}
