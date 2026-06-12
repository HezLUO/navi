import { describe, expect, it } from "vitest";
import { scoreOpenThread } from "../../src/core/attention-score";
import type { OpenThread } from "../../src/core/types";

function thread(overrides: Partial<OpenThread> = {}): OpenThread {
  return {
    id: "thread-1",
    title: "Runtime plan drift",
    status: "open",
    whyItMatters: "The project foundation depends on runtime completion.",
    currentJudgment: "Finish Runtime Doctor before Memory v2.",
    evidence: [],
    risks: [],
    nextAttentionTrigger: "Runtime implementation status changes.",
    interventionThreshold: "Approved plan and implementation differ.",
    delegationHistory: [],
    memoryLinks: [],
    traceRefs: [],
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("scoreOpenThread", () => {
  it("recommends read-only delegation for stale high-value threads with evidence gaps", () => {
    const result = scoreOpenThread(thread(), {
      trigger: "resume",
      now: new Date("2026-06-12T00:00:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: false,
    });

    expect(result.action).toBe("read_only_delegation");
    expect(result.factors.staleness).toBeGreaterThan(0);
    expect(result.factors.evidenceGap).toBeGreaterThan(0);
  });

  it("recommends intervention when high risk evidence appears and messages are allowed", () => {
    const result = scoreOpenThread(thread({
      risks: [{
        id: "risk-1",
        at: "2026-06-12T00:00:00.000Z",
        summary: "Implementation diverged from the approved plan.",
        severity: "high",
        sourceRef: "delegation:codex",
      }],
      evidence: [{
        id: "evidence-1",
        at: "2026-06-12T00:00:00.000Z",
        kind: "delegation_result",
        sourceRef: "delegation:codex",
        summary: "Doctor API is missing.",
        strength: "strong",
      }],
      updatedAt: "2026-06-12T00:00:00.000Z",
    }), {
      trigger: "delegation_result",
      now: new Date("2026-06-12T00:01:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: true,
    });

    expect(result.action).toBe("intervention");
    expect(result.reasons.join(" ")).toContain("high risk");
  });

  it("stays silent for recently updated low-risk threads", () => {
    const result = scoreOpenThread(thread({
      evidence: [{
        id: "evidence-1",
        at: "2026-06-12T00:00:00.000Z",
        kind: "user_statement",
        sourceRef: "chat:1",
        summary: "User approved the current direction.",
        strength: "medium",
      }],
      updatedAt: "2026-06-12T00:00:00.000Z",
    }), {
      trigger: "interval",
      now: new Date("2026-06-12T00:02:00.000Z"),
      lastInterventionAt: undefined,
      allowReadOnlyDelegation: true,
      canProactivelyMessage: true,
    });

    expect(result.action).toBe("silent");
  });
});
