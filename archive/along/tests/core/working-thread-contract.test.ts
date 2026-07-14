import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  driftLevels,
  driftRecommendedActions,
  operationResultStatuses,
  workingThreadOperations,
  workingThreadSections,
  type ApplyConfirmedWorkingThreadUpdateInput,
  type ApplyConfirmedWorkingThreadUpdateResult,
  type ConfirmationEnvelope,
  type DriftClassification,
  type ReadWorkingThreadResult,
  type StaleProposalConflict,
  type WorkingThread,
  type WorkingThreadContractOperations,
  type WorkingThreadSummary,
  type WorkingThreadUpdateProposal,
  type WrapUpDraft,
} from "../../src/core/working-thread-contract";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const designSpecPath = "docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8");
}

const baseThread = {
  id: "thread-existing-agent-self-initiation",
  title: "Existing-Agent Self-Initiation Layer",
  status: "active",
  lastUpdated: "2026-06-21T12:00:00.000Z",
  whyThisMatters: "Along should help existing agents preserve judgment and self-initiation.",
  currentJudgment: "The next layer is a type-only Core/MCP minimal contract.",
  boundary: [
    "Do not implement a real MCP server in this pass.",
    "Do not add runtime, adapters, storage, or presence.",
  ],
  driftTriggers: [
    "The work shifts into server implementation.",
    "The work adds adapter or runtime behavior.",
  ],
  nextLikelyMove: "Add the type-only contract, tests, and spec examples.",
  lastWrapUp: "The Core/MCP minimal contract spec was approved.",
  openQuestions: [
    "When should the real MCP server be implemented after the contract stabilizes?",
  ],
} satisfies WorkingThread;

const baseSummary = {
  id: baseThread.id,
  title: baseThread.title,
  status: "active",
  lastUpdated: baseThread.lastUpdated,
  currentJudgmentBrief: "Type-only contract next; no real server yet.",
  nextLikelyMove: baseThread.nextLikelyMove,
  riskLevel: "medium",
  needsUserDecision: false,
} satisfies WorkingThreadSummary;

const baseProposal = {
  proposalId: "proposal-1",
  threadId: baseThread.id,
  baseLastUpdated: baseThread.lastUpdated,
  changes: [
    {
      section: "currentJudgment",
      currentValue: baseThread.currentJudgment,
      proposedValue: "The type-only contract has been implemented and verified.",
      rationale: "Implementation completed without crossing runtime boundaries.",
    },
    {
      section: "nextLikelyMove",
      currentValue: baseThread.nextLikelyMove,
      proposedValue: "Review whether to design the real MCP server layer.",
      rationale: "The minimal contract is now ready to become a dependency.",
    },
  ],
  confirmationPrompt: "Write these Working Thread updates?",
  riskLevel: "medium",
} satisfies WorkingThreadUpdateProposal;

describe("Working Thread contract", () => {
  it("exports stable operation, section, status, and action constants", () => {
    expect(workingThreadOperations).toEqual([
      "readWorkingThread",
      "listWorkingThreads",
      "classifyDrift",
      "draftWrapUp",
      "proposeWorkingThreadUpdate",
      "applyConfirmedWorkingThreadUpdate",
    ]);
    expect(workingThreadSections).toEqual([
      "whyThisMatters",
      "currentJudgment",
      "boundary",
      "driftTriggers",
      "nextLikelyMove",
      "lastWrapUp",
      "openQuestions",
    ]);
    expect(driftLevels).toEqual(["none", "low", "medium", "high"]);
    expect(driftRecommendedActions).toEqual([
      "answerDirectly",
      "answerWithBoundary",
      "askConfirmation",
      "proposeWrapUp",
    ]);
    expect(operationResultStatuses).toEqual([
      "ok",
      "needsConfirmation",
      "conflict",
      "rejected",
      "error",
    ]);
  });

  it("models full and summary Working Thread shapes", () => {
    expect(baseThread.boundary).toContain("Do not implement a real MCP server in this pass.");
    expect(baseThread.openQuestions).toHaveLength(1);
    expect(baseSummary.currentJudgmentBrief).toContain("Type-only contract");
    expect(baseSummary.needsUserDecision).toBe(false);
  });

  it("models drift levels with concrete recommended actions", () => {
    const quiet = {
      driftLevel: "none",
      reason: "The user asked an ordinary package question.",
      recommendedAction: "answerDirectly",
      needsUserConfirmation: false,
    } satisfies DriftClassification;

    const medium = {
      driftLevel: "medium",
      reason: "The user asked about a related future package shape.",
      recommendedAction: "answerWithBoundary",
      needsUserConfirmation: false,
    } satisfies DriftClassification;

    const high = {
      driftLevel: "high",
      reason: "The user proposed skipping the contract and building a real MCP server.",
      recommendedAction: "askConfirmation",
      needsUserConfirmation: true,
    } satisfies DriftClassification;

    expect(quiet.recommendedAction).toBe("answerDirectly");
    expect(medium.recommendedAction).toBe("answerWithBoundary");
    expect(high.needsUserConfirmation).toBe(true);
  });

  it("models wrap-up drafts, update proposals, and confirmation envelopes", () => {
    const draft = {
      summary: "The minimal contract design was approved.",
      judgmentChange: "Move from design approval to type-only contract implementation.",
      boundaryChange: "Keep real MCP server and runtime out of scope.",
      nextLikelyMove: "Implement type-only contract and tests.",
      openQuestionsChange: "Decide later when to design real MCP server.",
      requiresConfirmation: true,
    } satisfies WrapUpDraft;

    const confirmation = {
      proposalId: baseProposal.proposalId,
      approved: true,
      approvedAt: "2026-06-21T12:30:00.000Z",
      approvedBy: "user",
      sourceSessionId: "session-main",
      sourceTurnId: "turn-42",
      approvedIntent: "Record that the type-only contract implementation is complete.",
      baseLastUpdated: baseProposal.baseLastUpdated,
    } satisfies ConfirmationEnvelope;

    expect(draft.requiresConfirmation).toBe(true);
    expect(baseProposal.changes.map((change) => change.section)).toEqual([
      "currentJudgment",
      "nextLikelyMove",
    ]);
    expect(confirmation.approved).toBe(true);
    expect(confirmation.approvedBy).toBe("user");
  });

  it("models operation results, successful writes, and stale proposal conflicts", () => {
    const mismatchedReadOperation = {
      status: "ok",
      // @ts-expect-error Read results must use the readWorkingThread operation discriminator.
      operation: "listWorkingThreads",
      threadId: baseThread.id,
      data: baseThread,
    } satisfies ReadWorkingThreadResult;

    const okRead = {
      status: "ok",
      operation: "readWorkingThread",
      threadId: baseThread.id,
      data: baseThread,
    } satisfies ReadWorkingThreadResult;

    const confirmationInput = {
      proposal: baseProposal,
      confirmation: {
        proposalId: baseProposal.proposalId,
        approved: true,
        approvedAt: "2026-06-21T12:30:00.000Z",
        approvedBy: "user",
        sourceSessionId: "session-main",
        sourceTurnId: "turn-42",
        approvedIntent: "Apply the verified Working Thread update.",
        baseLastUpdated: baseProposal.baseLastUpdated,
      },
    } satisfies ApplyConfirmedWorkingThreadUpdateInput;

    const writeSuccess = {
      status: "ok",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: baseThread.id,
      data: {
        thread: {
          ...baseThread,
          currentJudgment: "The type-only contract has been implemented and verified.",
        },
        appliedProposalId: baseProposal.proposalId,
      },
    } satisfies ApplyConfirmedWorkingThreadUpdateResult;

    const conflictData = {
      status: "conflict",
      reason: "The thread changed after this proposal was created.",
      currentThreadSummary: {
        ...baseSummary,
        lastUpdated: "2026-06-21T13:00:00.000Z",
      },
      staleProposal: baseProposal,
      recommendedAction: "regenerateProposal",
    } satisfies StaleProposalConflict;

    const conflict = {
      status: "conflict",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: baseThread.id,
      reason: conflictData.reason,
      recommendedAction: "regenerateProposal",
      data: conflictData,
    } satisfies ApplyConfirmedWorkingThreadUpdateResult;

    expect(okRead.data.currentJudgment).toContain("type-only");
    expect(confirmationInput.confirmation.baseLastUpdated).toBe(baseProposal.baseLastUpdated);
    expect(writeSuccess.data.appliedProposalId).toBe(baseProposal.proposalId);
    expect(conflict.status).toBe("conflict");
    expect(conflict.data.recommendedAction).toBe("regenerateProposal");
  });

  it("allows adapters to type against operation signatures without providing implementation", async () => {
    const operations = {
      readWorkingThread: async (_input) => ({
        status: "ok",
        operation: "readWorkingThread",
        threadId: baseThread.id,
        data: baseThread,
      }),
      listWorkingThreads: async (_input) => ({
        status: "ok",
        operation: "listWorkingThreads",
        data: [baseSummary],
      }),
      classifyDrift: async (_input) => ({
        status: "ok",
        operation: "classifyDrift",
        threadId: baseThread.id,
        data: {
          driftLevel: "high",
          reason: "The request asks to implement a real MCP server now.",
          recommendedAction: "askConfirmation",
          needsUserConfirmation: true,
        },
      }),
      draftWrapUp: async (_input) => ({
        status: "ok",
        operation: "draftWrapUp",
        threadId: baseThread.id,
        data: {
          summary: "The contract is ready for implementation.",
          judgmentChange: "Move from design to type-only contract implementation.",
          boundaryChange: "Keep runtime and real MCP server out of scope.",
          nextLikelyMove: "Add the contract file and tests.",
          openQuestionsChange: "When to design the real MCP server remains open.",
          requiresConfirmation: true,
        },
      }),
      proposeWorkingThreadUpdate: async (_input) => ({
        status: "needsConfirmation",
        operation: "proposeWorkingThreadUpdate",
        threadId: baseThread.id,
        data: baseProposal,
        message: baseProposal.confirmationPrompt,
      }),
      applyConfirmedWorkingThreadUpdate: async (_input) => ({
        status: "conflict",
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: baseThread.id,
        reason: "Stale baseLastUpdated.",
        recommendedAction: "regenerateProposal",
        data: {
          status: "conflict",
          reason: "Stale baseLastUpdated.",
          currentThreadSummary: baseSummary,
          staleProposal: baseProposal,
          recommendedAction: "regenerateProposal",
        },
      }),
    } satisfies WorkingThreadContractOperations;

    await expect(operations.listWorkingThreads({})).resolves.toMatchObject({
      status: "ok",
      data: [baseSummary],
    });
    await expect(operations.classifyDrift({
      thread: baseThread,
      userRequest: "Let's build the real MCP server now.",
    })).resolves.toMatchObject({
      data: {
        driftLevel: "high",
        recommendedAction: "askConfirmation",
      },
    });
  });

  it("keeps behavior-critical examples in the design spec", async () => {
    const spec = await readRepoText(designSpecPath);

    for (const expectedHeading of [
      "### Resume/List Example",
      "### Quietness Example",
      "### Medium Drift Example",
      "### High-Impact Drift Example",
      "### Wrap-Up Draft Example",
      "### Update Proposal Example",
      "### Confirmed Write-Back Example",
      "### Stale Write-Back Conflict Example",
    ]) {
      expect(spec).toContain(expectedHeading);
    }

    for (const expectedSnippet of [
      '"recommendedAction": "answerDirectly"',
      '"recommendedAction": "answerWithBoundary"',
      '"recommendedAction": "askConfirmation"',
      '"requiresConfirmation": true',
      '"status": "conflict"',
      '"recommendedAction": "regenerateProposal"',
    ]) {
      expect(spec).toContain(expectedSnippet);
    }
  });
});
