import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  ConfirmationEnvelope,
  WorkingThreadUpdateProposal,
} from "../../src/core/working-thread-contract";
import { createWorkingThreadDocsStore } from "../../src/mcp/working-thread-docs-store";
import { createWorkingThreadOperations } from "../../src/mcp/working-thread-operations";

const threadId = "operation-test-thread";
const validRecord = `# Operation Test Thread

Status: active
Last updated: 2026-06-22

## Why This Matters

Operation handlers should keep Working Thread updates deterministic.

## Current Judgment

The operation handler task is ready for implementation.

## Boundary

- Do not add HTTP/SSE transport.
- Do not add background runtime.

## Drift Triggers

- The work adds HTTP transport.
- The work adds Hermes adapter.

## Next Likely Move

Write action-only operation handlers.

## Last Wrap-Up

Task 3 completed the docs-backed store.

## Open Questions

- Should the caller confirm write-back?
`;

const tempRoots: string[] = [];

describe("Working Thread operation handlers", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, {
      force: true,
      recursive: true,
    })));
  });

  it("classifies an ordinary request as no drift", async () => {
    const { operations, thread } = await createTempOperations();

    const result = await operations.classifyDrift({
      thread,
      userRequest: "Please summarize the current Working Thread state.",
    });

    expect(result).toMatchObject({
      status: "ok",
      operation: "classifyDrift",
      threadId,
      data: {
        driftLevel: "none",
        recommendedAction: "answerDirectly",
        needsUserConfirmation: false,
      },
    });
  });

  it("classifies explicit boundary crossing as high drift", async () => {
    const { operations, thread } = await createTempOperations();

    const result = await operations.classifyDrift({
      thread,
      userRequest: "Add HTTP transport and wire it through a Hermes adapter.",
    });

    expect(result).toMatchObject({
      status: "ok",
      operation: "classifyDrift",
      threadId,
      data: {
        driftLevel: "high",
        recommendedAction: "askConfirmation",
        needsUserConfirmation: true,
      },
    });
  });

  it("rejects malformed classify inputs without throwing", async () => {
    const { operations } = await createTempOperations();

    const result = await operations.classifyDrift({
      thread: {
        id: threadId,
        boundary: "Do not add HTTP transport.",
      },
      userRequest: "Add HTTP transport.",
    } as never);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "classifyDrift",
      threadId,
      reason: expect.stringMatching(/boundary/i),
    });
  });

  it("drafts wrap-up fields and proposes ordered confirmation changes", async () => {
    const { operations, thread } = await createTempOperations();

    const draftResult = await operations.draftWrapUp({
      thread,
      sessionSummary: "The operation handlers now have a concrete test target.",
      judgmentChange: "Action-only handlers are ready to implement.",
      boundaryChange: "Keep operation handlers deterministic.",
      nextLikelyMove: "Run the operation handler tests.",
      openQuestionsChange: "Should stale proposal conflicts include a summary?",
    });

    expect(draftResult).toMatchObject({
      status: "ok",
      operation: "draftWrapUp",
      threadId,
      data: {
        summary: "The operation handlers now have a concrete test target.",
        judgmentChange: "Action-only handlers are ready to implement.",
        boundaryChange: "Keep operation handlers deterministic.",
        nextLikelyMove: "Run the operation handler tests.",
        openQuestionsChange: "Should stale proposal conflicts include a summary?",
        requiresConfirmation: true,
      },
    });

    const proposalResult = await operations.proposeWorkingThreadUpdate({
      thread,
      draft: draftResult.data!,
    });

    expect(proposalResult.status).toBe("needsConfirmation");
    expect(proposalResult.operation).toBe("proposeWorkingThreadUpdate");
    expect(proposalResult.threadId).toBe(threadId);
    expect(proposalResult.data).toMatchObject({
      proposalId: expect.stringMatching(/^operation-test-thread-2026-06-22-[a-f0-9]{12}$/),
      threadId,
      baseLastUpdated: "2026-06-22",
      baseVersion: expect.stringMatching(/^[a-f0-9]{64}$/),
      riskLevel: "medium",
    });
    expect(proposalResult.data?.changes.map((change) => change.section)).toEqual([
      "currentJudgment",
      "boundary",
      "nextLikelyMove",
      "lastWrapUp",
      "openQuestions",
    ]);
    expect(proposalResult.data?.changes[1]).toMatchObject({
      currentValue: [
        "Do not add HTTP/SSE transport.",
        "Do not add background runtime.",
      ],
      proposedValue: [
        "Do not add HTTP/SSE transport.",
        "Do not add background runtime.",
        "Keep operation handlers deterministic.",
      ],
    });
  });

  it("rejects malformed draft wrap-up inputs without throwing", async () => {
    const { operations } = await createTempOperations();

    const result = await operations.draftWrapUp({
      thread: { id: threadId },
      sessionSummary: 123,
    } as never);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "draftWrapUp",
      threadId,
      reason: expect.stringMatching(/thread|session/i),
    });
  });

  it("generates distinct deterministic proposal ids for different changes", async () => {
    const { operations, thread } = await createTempOperations();
    const firstDraft = await operations.draftWrapUp({
      thread,
      sessionSummary: "First summary.",
      judgmentChange: "First judgment.",
    });
    const secondDraft = await operations.draftWrapUp({
      thread,
      sessionSummary: "Second summary.",
      judgmentChange: "Second judgment.",
    });

    const firstProposal = await operations.proposeWorkingThreadUpdate({
      thread,
      draft: firstDraft.data!,
    });
    const secondProposal = await operations.proposeWorkingThreadUpdate({
      thread,
      draft: secondDraft.data!,
    });

    expect(firstProposal.data?.proposalId).toMatch(
      /^operation-test-thread-2026-06-22-[a-f0-9]{12}$/,
    );
    expect(secondProposal.data?.proposalId).toMatch(
      /^operation-test-thread-2026-06-22-[a-f0-9]{12}$/,
    );
    expect(firstProposal.data?.proposalId).not.toBe(secondProposal.data?.proposalId);
  });

  it("rejects malformed propose inputs without throwing", async () => {
    const { operations } = await createTempOperations();

    const result = await operations.proposeWorkingThreadUpdate({
      thread: { id: threadId },
      draft: {},
    } as never);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "proposeWorkingThreadUpdate",
      threadId,
      reason: expect.stringMatching(/thread|draft/i),
    });
  });

  it("rejects write-back without explicit usable confirmation", async () => {
    const { operations, proposal } = await createTempProposal();

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal,
      confirmation: {
        ...validConfirmation(proposal),
        sourceSessionId: "",
      },
    });

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
    });
  });

  it("rejects root-level malformed apply inputs without throwing", async () => {
    const { operations } = await createTempOperations();

    const result = await operations.applyConfirmedWorkingThreadUpdate(undefined as never);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      reason: expect.stringMatching(/apply input/i),
    });
  });

  it("rejects write-back when approvedAt is blank", async () => {
    const { operations, proposal } = await createTempProposal();

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal,
      confirmation: {
        ...validConfirmation(proposal),
        approvedAt: "   ",
      },
    });

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
    });
  });

  it("rejects write-back when confirmation baseVersion does not match proposal", async () => {
    const { operations, proposal } = await createTempProposal();
    const versionedProposal = {
      ...proposal,
      baseVersion: "version-1",
    };

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal: versionedProposal,
      confirmation: {
        ...validConfirmation(versionedProposal),
        baseVersion: "version-2",
      },
    });

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
    });
  });

  it("rejects malformed confirmation envelopes without throwing", async () => {
    const { operations, proposal } = await createTempProposal();

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal,
      confirmation: {
        ...validConfirmation(proposal),
        approvedAt: 123,
      } as never,
    });

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      reason: expect.stringMatching(/approvedAt/i),
    });
  });

  it("rejects malformed proposals that omit required display fields", async () => {
    const { operations, proposal, store } = await createTempProposal();
    const malformedProposal = {
      ...proposal,
      confirmationPrompt: undefined,
      riskLevel: undefined,
    };

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal: malformedProposal as never,
      confirmation: validConfirmation(proposal),
    });
    const persisted = await store.readThread(threadId);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      reason: expect.stringMatching(/confirmationPrompt|riskLevel/i),
    });
    expect(persisted.thread?.currentJudgment).toBe(
      "The operation handler task is ready for implementation.",
    );
  });

  it("rejects write-back when proposal changes no longer match the proposal id", async () => {
    const { operations, proposal, store } = await createTempProposal();
    const tamperedProposal = {
      ...proposal,
      changes: proposal.changes.map((change, index) => (
        index === 0
          ? { ...change, proposedValue: "A tampered judgment after confirmation." }
          : change
      )),
    };

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal: tamperedProposal,
      confirmation: validConfirmation(tamperedProposal),
    });
    const persisted = await store.readThread(threadId);

    expect(result).toMatchObject({
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
    });
    expect(result.reason).toMatch(/proposal id|content/i);
    expect(persisted.thread?.currentJudgment).toBe(
      "The operation handler task is ready for implementation.",
    );
  });

  it("returns a conflict when another confirmed write changed the base record", async () => {
    const { operations, store, thread } = await createTempOperations();
    const firstProposalResult = await operations.proposeWorkingThreadUpdate({
      thread,
      draft: {
        summary: "",
        judgmentChange: "The first proposal updated judgment.",
        boundaryChange: "",
        nextLikelyMove: "",
        openQuestionsChange: "",
        requiresConfirmation: true,
      },
    });
    const secondProposalResult = await operations.proposeWorkingThreadUpdate({
      thread,
      draft: {
        summary: "",
        judgmentChange: "",
        boundaryChange: "",
        nextLikelyMove: "The second proposal should be regenerated.",
        openQuestionsChange: "",
        requiresConfirmation: true,
      },
    });
    const firstProposal = firstProposalResult.data!;
    const secondProposal = secondProposalResult.data!;

    const firstApply = await operations.applyConfirmedWorkingThreadUpdate({
      proposal: firstProposal,
      confirmation: validConfirmation(firstProposal),
    });
    const secondApply = await operations.applyConfirmedWorkingThreadUpdate({
      proposal: secondProposal,
      confirmation: validConfirmation(secondProposal),
    });
    const persisted = await store.readThread(threadId);

    expect(firstApply.status).toBe("ok");
    expect(secondApply).toMatchObject({
      status: "conflict",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      recommendedAction: "regenerateProposal",
    });
    expect(persisted.thread?.currentJudgment).toBe("The first proposal updated judgment.");
    expect(persisted.thread?.nextLikelyMove).toBe("Write action-only operation handlers.");
  });

  it("applies confirmed section patches and returns the updated thread", async () => {
    const { operations, proposal, store } = await createTempProposal();

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal,
      confirmation: validConfirmation(proposal),
    });
    const persisted = await store.readThread(threadId);

    expect(result).toMatchObject({
      status: "ok",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      data: {
        appliedProposalId: proposal.proposalId,
        thread: {
          id: threadId,
          currentJudgment: "Action-only handlers are ready to implement.",
        },
      },
    });
    expect(persisted.thread?.currentJudgment).toBe(
      "Action-only handlers are ready to implement.",
    );
  });

  it("returns a stale conflict when the record changed before confirmed apply", async () => {
    const { operations, proposal, recordsDir } = await createTempProposal();
    await writeFile(
      path.join(recordsDir, `${threadId}.md`),
      validRecord.replace("Last updated: 2026-06-22", "Last updated: 2026-06-23"),
    );

    const result = await operations.applyConfirmedWorkingThreadUpdate({
      proposal,
      confirmation: validConfirmation(proposal),
    });

    expect(result).toMatchObject({
      status: "conflict",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      recommendedAction: "regenerateProposal",
      data: {
        staleProposal: {
          proposalId: proposal.proposalId,
        },
        currentThreadSummary: {
          lastUpdated: "2026-06-23",
        },
      },
    });
  });
});

async function createTempOperations() {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-operations-"));
  tempRoots.push(workspaceRoot);
  const recordsDir = path.join(workspaceRoot, "docs/along/working-threads");
  await mkdir(recordsDir, { recursive: true });
  await writeFile(path.join(recordsDir, `${threadId}.md`), validRecord);

  const store = createWorkingThreadDocsStore({ workspaceRoot });
  const operations = createWorkingThreadOperations(store);
  const parsed = await store.readThread(threadId);
  if (!parsed.thread) {
    throw new Error("Expected valid operation test thread.");
  }

  return {
    operations,
    recordsDir,
    store,
    thread: parsed.thread,
    workspaceRoot,
  };
}

async function createTempProposal() {
  const { operations, recordsDir, store, thread } = await createTempOperations();
  const draftResult = await operations.draftWrapUp({
    thread,
    sessionSummary: "The operation handlers now have a concrete test target.",
    judgmentChange: "Action-only handlers are ready to implement.",
    boundaryChange: "Keep operation handlers deterministic.",
    nextLikelyMove: "Run the operation handler tests.",
    openQuestionsChange: "Should stale proposal conflicts include a summary?",
  });
  const proposalResult = await operations.proposeWorkingThreadUpdate({
    thread,
    draft: draftResult.data!,
  });

  if (!proposalResult.data) {
    throw new Error("Expected update proposal.");
  }

  return {
    operations,
    proposal: proposalResult.data,
    recordsDir,
    store,
  };
}

function validConfirmation(
  proposal: WorkingThreadUpdateProposal,
): ConfirmationEnvelope {
  return {
    proposalId: proposal.proposalId,
    approved: true,
    approvedAt: "2026-06-22T00:00:00.000Z",
    approvedBy: "user",
    sourceSessionId: "session-1",
    sourceTurnId: "turn-1",
    approvedIntent: "Apply the deterministic Working Thread update.",
    baseLastUpdated: proposal.baseLastUpdated,
    baseVersion: proposal.baseVersion,
  };
}
