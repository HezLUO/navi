import { describe, expect, it } from "vitest";
import { mergeDelegationResultIntoJudgment } from "../../src/core/judgment-merge";
import type { OpenThread, ReadOnlyDelegationResult } from "../../src/core/types";

function thread(): OpenThread {
  return {
    id: "thread-1",
    title: "Runtime plan drift",
    status: "delegated",
    whyItMatters: "The foundation must be coherent before Memory v2.",
    currentJudgment: "Runtime implementation may be incomplete.",
    evidence: [],
    risks: [],
    nextAttentionTrigger: "Codex read-only review returns.",
    interventionThreshold: "The review finds missing runtime APIs.",
    delegationHistory: [],
    memoryLinks: [],
    traceRefs: [],
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
  };
}

function completedResult(overrides: Partial<ReadOnlyDelegationResult> = {}): ReadOnlyDelegationResult {
  return {
    requestId: "delegation-1",
    threadId: "thread-1",
    target: "codex",
    status: "completed",
    summary: "Doctor API is missing.",
    evidence: ["No src/core/doctor.ts exists."],
    risks: ["Runtime plan remains incomplete."],
    recommendations: ["Finish Doctor and review endpoints before Memory v2."],
    confidence: "high",
    completedAt: "2026-06-12T00:05:00.000Z",
    ...overrides,
  };
}

describe("mergeDelegationResultIntoJudgment", () => {
  it("adds evidence and risk when a delegation finds a gap", () => {
    const result = completedResult();

    const merge = mergeDelegationResultIntoJudgment(thread(), result);
    expect(merge.classification).toBe("adds_new_risk");
    expect(merge.shouldNotifyUser).toBe(true);
    expect(merge.nextJudgment).toContain("Doctor API is missing");
    expect(merge.evidenceAdded[0].kind).toBe("delegation_result");
  });

  it("stays low signal when result has no evidence or risks", () => {
    const merge = mergeDelegationResultIntoJudgment(thread(), {
      requestId: "delegation-1",
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "No material drift found.",
      evidence: [],
      risks: [],
      recommendations: [],
      confidence: "medium",
      completedAt: "2026-06-12T00:05:00.000Z",
    });

    expect(merge.classification).toBe("irrelevant_or_low_signal");
    expect(merge.shouldNotifyUser).toBe(false);
  });

  it("rejects delegation results for a different thread", () => {
    expect(() => mergeDelegationResultIntoJudgment(thread(), completedResult({ threadId: "thread-2" }))).toThrow(
      /thread mismatch.*thread-1.*thread-2/i,
    );
  });

  it("rejects failed delegation results before merging evidence or risk", () => {
    expect(() => mergeDelegationResultIntoJudgment(thread(), completedResult({ status: "failed" }))).toThrow(
      /completed.*failed/i,
    );
  });

  it("rejects cancelled delegation results before merging evidence or risk", () => {
    expect(() => mergeDelegationResultIntoJudgment(thread(), completedResult({ status: "cancelled" }))).toThrow(
      /completed.*cancelled/i,
    );
  });

  it("uses a fallback risk summary when delegation summary is blank", () => {
    const merge = mergeDelegationResultIntoJudgment(thread(), completedResult({ summary: "   " }));

    expect(merge.nextJudgment).toContain("Delegation returned risk signal.");
    expect(merge.nextJudgment).not.toContain("Delegation update:    ");
  });
});
