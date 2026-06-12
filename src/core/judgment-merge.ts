import type { JudgmentMergeResult, OpenThread, OpenThreadEvidence, ReadOnlyDelegationResult } from "./types";

export function mergeDelegationResultIntoJudgment(
  thread: OpenThread,
  result: ReadOnlyDelegationResult,
): JudgmentMergeResult {
  assertMergeable(thread, result);

  const at = result.completedAt;
  const evidenceAdded: OpenThreadEvidence[] = result.evidence.map((summary, index) => ({
    id: `evidence:${result.requestId}:${index}`,
    at,
    kind: "delegation_result",
    sourceRef: `delegation:${result.requestId}`,
    summary,
    strength: result.confidence === "high" ? "strong" : result.confidence === "medium" ? "medium" : "weak",
  }));

  const classification = classify(result);
  const nextJudgment = buildNextJudgment(thread, result);
  return {
    threadId: thread.id,
    classification,
    previousJudgment: thread.currentJudgment,
    nextJudgment,
    riskChanges: result.risks,
    evidenceAdded,
    newThreadSuggestions: [],
    shouldNotifyUser: classification === "adds_new_risk" || classification === "contradicts_current_judgment",
    reason: reasonFor(classification, result),
    createdAt: at,
  };
}

function assertMergeable(thread: OpenThread, result: ReadOnlyDelegationResult): void {
  if (result.threadId !== thread.id) {
    throw new Error(`Cannot merge delegation result: thread mismatch (${thread.id} !== ${result.threadId}).`);
  }
  if (result.status !== "completed") {
    throw new Error(`Cannot merge delegation result: expected completed status, received ${result.status}.`);
  }
}

function classify(result: ReadOnlyDelegationResult): JudgmentMergeResult["classification"] {
  if (result.risks.length > 0) return "adds_new_risk";
  if (result.evidence.length > 0 && result.recommendations.length > 0) return "closes_evidence_gap";
  if (result.evidence.length > 0) return "supports_current_judgment";
  return "irrelevant_or_low_signal";
}

function buildNextJudgment(thread: OpenThread, result: ReadOnlyDelegationResult): string {
  const summary = summaryForJudgment(result);
  if (result.risks.length > 0) {
    return `${thread.currentJudgment} Delegation update: ${summary} Recommended next step: ${result.recommendations[0] ?? "review the new risk."}`;
  }
  if (result.evidence.length > 0) {
    return `${thread.currentJudgment} Delegation added evidence: ${summary}`;
  }
  return thread.currentJudgment;
}

function summaryForJudgment(result: ReadOnlyDelegationResult): string {
  const summary = result.summary.trim();
  if (summary.length > 0) return summary;
  if (result.risks.length > 0) return "Delegation returned risk signal.";
  return "Delegation returned evidence signal.";
}

function reasonFor(classification: JudgmentMergeResult["classification"], result: ReadOnlyDelegationResult): string {
  if (classification === "adds_new_risk") return `Delegation found ${result.risks.length} risk(s).`;
  if (classification === "closes_evidence_gap") return "Delegation added evidence and a concrete recommendation.";
  if (classification === "supports_current_judgment") return "Delegation added supporting evidence.";
  return "Delegation did not materially change Along's judgment.";
}
