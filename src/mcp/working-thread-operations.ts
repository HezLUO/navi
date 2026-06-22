import { createHash } from "node:crypto";
import type {
  ApplyConfirmedWorkingThreadUpdateInput,
  ApplyConfirmedWorkingThreadUpdateResult,
  ClassifyDriftInput,
  ClassifyDriftResult,
  DriftClassification,
  DraftWrapUpInput,
  DraftWrapUpResult,
  ProposeWorkingThreadUpdateInput,
  ProposeWorkingThreadUpdateResult,
  WorkingThread,
  WorkingThreadContractOperations,
  WorkingThreadSectionChange,
  WorkingThreadSummary,
  WorkingThreadUpdateProposal,
  WrapUpDraft,
} from "../core/working-thread-contract";
import type { WorkingThreadDocsStore } from "./working-thread-docs-store";
import { summarizeWorkingThread } from "./working-thread-markdown";

export type WorkingThreadMcpOperations = Pick<
  WorkingThreadContractOperations,
  | "classifyDrift"
  | "draftWrapUp"
  | "proposeWorkingThreadUpdate"
  | "applyConfirmedWorkingThreadUpdate"
>;

const boundarySignals = [
  "http",
  "sse",
  "daemon",
  "background",
  "hermes",
  "adapter",
  "delegation",
  "memory v2",
  ".along",
] as const;

export function createWorkingThreadOperations(
  store: WorkingThreadDocsStore,
): WorkingThreadMcpOperations {
  return {
    async classifyDrift(input) {
      return classifyDrift(input);
    },

    async draftWrapUp(input) {
      return draftWrapUp(input);
    },

    async proposeWorkingThreadUpdate(input) {
      return proposeWorkingThreadUpdate(input);
    },

    async applyConfirmedWorkingThreadUpdate(input) {
      return applyConfirmedWorkingThreadUpdate(store, input);
    },
  };
}

function classifyDrift(input: ClassifyDriftInput): ClassifyDriftResult {
  const drift = buildDriftClassification(input);

  return {
    status: "ok",
    operation: "classifyDrift",
    threadId: input.thread.id,
    data: drift,
  };
}

function buildDriftClassification(input: ClassifyDriftInput): DriftClassification {
  const requestText = normalizeText([
    input.userRequest,
    input.proposedDirection ?? "",
  ].join(" "));
  const threadBoundaryText = normalizeText([
    "boundary" in input.thread ? input.thread.boundary.join(" ") : "",
    "driftTriggers" in input.thread ? input.thread.driftTriggers.join(" ") : "",
  ].join(" "));
  const matchedSignal = boundarySignals.find((signal) => (
    containsSignal(requestText, signal) && containsSignal(threadBoundaryText, signal)
  ));

  if (matchedSignal) {
    return {
      driftLevel: "high",
      reason: `Request mentions boundary signal "${matchedSignal}" already present in this Working Thread.`,
      recommendedAction: "askConfirmation",
      needsUserConfirmation: true,
    };
  }

  if (input.proposedDirection?.trim()) {
    return {
      driftLevel: "medium",
      reason: "A proposed direction was supplied without a detected boundary crossing.",
      recommendedAction: "answerWithBoundary",
      needsUserConfirmation: false,
    };
  }

  return {
    driftLevel: "none",
    reason: "No boundary signal from this Working Thread was detected in the request.",
    recommendedAction: "answerDirectly",
    needsUserConfirmation: false,
  };
}

function draftWrapUp(input: DraftWrapUpInput): DraftWrapUpResult {
  const draft: WrapUpDraft = {
    summary: input.sessionSummary,
    judgmentChange: input.judgmentChange ?? "",
    boundaryChange: input.boundaryChange ?? "",
    nextLikelyMove: input.nextLikelyMove ?? "",
    openQuestionsChange: input.openQuestionsChange ?? "",
    requiresConfirmation: true,
  };

  return {
    status: "ok",
    operation: "draftWrapUp",
    threadId: input.thread.id,
    data: draft,
  };
}

function proposeWorkingThreadUpdate(
  input: ProposeWorkingThreadUpdateInput,
): ProposeWorkingThreadUpdateResult {
  const changes = buildSectionChanges(input.thread, input.draft);
  const proposal: WorkingThreadUpdateProposal = {
    proposalId: buildProposalId(input.thread, changes),
    threadId: input.thread.id,
    baseLastUpdated: input.thread.lastUpdated,
    changes,
    confirmationPrompt: "Confirm this Working Thread update before any write-back is applied.",
    riskLevel: changes.length > 2 ? "medium" : "low",
  };

  return {
    status: "needsConfirmation",
    operation: "proposeWorkingThreadUpdate",
    threadId: input.thread.id,
    data: proposal,
    message: "Working Thread update proposal requires explicit confirmation.",
  };
}

async function applyConfirmedWorkingThreadUpdate(
  store: WorkingThreadDocsStore,
  input: ApplyConfirmedWorkingThreadUpdateInput,
): Promise<ApplyConfirmedWorkingThreadUpdateResult> {
  const invalidReason = getInvalidConfirmationReason(input);
  if (invalidReason) {
    return {
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: input.proposal.threadId,
      reason: invalidReason,
    };
  }

  try {
    const parsed = await store.applySectionPatchProposal(input.proposal);
    if (!parsed.thread) {
      return {
        status: "rejected",
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: input.proposal.threadId,
        reason: "Store returned a malformed Working Thread after applying the proposal.",
      };
    }

    return {
      status: "ok",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: input.proposal.threadId,
      data: {
        appliedProposalId: input.proposal.proposalId,
        thread: parsed.thread,
      },
    };
  } catch (error) {
    if (isStaleError(error)) {
      const currentThreadSummary = await readCurrentThreadSummary(store, input.proposal);
      return {
        status: "conflict",
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: input.proposal.threadId,
        reason: getErrorMessage(error),
        recommendedAction: "regenerateProposal",
        data: {
          status: "conflict",
          reason: getErrorMessage(error),
          currentThreadSummary,
          staleProposal: input.proposal,
          recommendedAction: "regenerateProposal",
        },
      };
    }

    return {
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: input.proposal.threadId,
      reason: getErrorMessage(error),
    };
  }
}

function buildSectionChanges(
  thread: WorkingThread,
  draft: WrapUpDraft,
): WorkingThreadSectionChange[] {
  const changes: WorkingThreadSectionChange[] = [];
  const judgmentChange = draft.judgmentChange.trim();
  const boundaryChange = draft.boundaryChange.trim();
  const nextLikelyMove = draft.nextLikelyMove.trim();
  const summary = draft.summary.trim();
  const openQuestionsChange = draft.openQuestionsChange.trim();

  if (judgmentChange) {
    changes.push({
      section: "currentJudgment",
      currentValue: thread.currentJudgment,
      proposedValue: judgmentChange,
      rationale: "Caller supplied a current judgment change.",
    });
  }

  if (boundaryChange) {
    changes.push({
      section: "boundary",
      currentValue: thread.boundary,
      proposedValue: [...thread.boundary, boundaryChange],
      rationale: "Caller supplied a boundary addition.",
    });
  }

  if (nextLikelyMove) {
    changes.push({
      section: "nextLikelyMove",
      currentValue: thread.nextLikelyMove,
      proposedValue: nextLikelyMove,
      rationale: "Caller supplied the next likely move.",
    });
  }

  if (summary) {
    changes.push({
      section: "lastWrapUp",
      currentValue: thread.lastWrapUp,
      proposedValue: summary,
      rationale: "Caller supplied a wrap-up summary.",
    });
  }

  if (openQuestionsChange) {
    changes.push({
      section: "openQuestions",
      currentValue: thread.openQuestions,
      proposedValue: [...thread.openQuestions, openQuestionsChange],
      rationale: "Caller supplied an open question addition.",
    });
  }

  return changes;
}

function getInvalidConfirmationReason(
  input: ApplyConfirmedWorkingThreadUpdateInput,
): string | undefined {
  const { confirmation, proposal } = input;
  const expectedProposalId = buildProposalIdForProposal(proposal);

  if (confirmation.approved !== true) {
    return "Confirmation must explicitly approve the proposal.";
  }
  if (proposal.proposalId !== expectedProposalId) {
    return "Proposal id does not match the proposal content.";
  }
  if (confirmation.proposalId !== proposal.proposalId) {
    return "Confirmation proposalId does not match the proposal.";
  }
  if (confirmation.baseLastUpdated !== proposal.baseLastUpdated) {
    return "Confirmation baseLastUpdated does not match the proposal.";
  }
  if (confirmation.baseVersion !== proposal.baseVersion) {
    return "Confirmation baseVersion does not match the proposal.";
  }
  if (confirmation.approvedBy !== "user") {
    return "Confirmation must be approved by the user.";
  }
  if (!confirmation.approvedAt.trim()) {
    return "Confirmation approvedAt is required.";
  }
  if (!confirmation.sourceSessionId.trim()) {
    return "Confirmation sourceSessionId is required.";
  }
  if (!confirmation.sourceTurnId.trim()) {
    return "Confirmation sourceTurnId is required.";
  }
  if (!confirmation.approvedIntent.trim()) {
    return "Confirmation approvedIntent is required.";
  }

  return undefined;
}

async function readCurrentThreadSummary(
  store: WorkingThreadDocsStore,
  proposal: WorkingThreadUpdateProposal,
): Promise<WorkingThreadSummary> {
  try {
    return summarizeWorkingThread(await store.readThread(proposal.threadId));
  } catch {
    return {
      id: proposal.threadId,
      title: proposal.threadId,
      status: "active",
      lastUpdated: "unknown",
      currentJudgmentBrief: "Unable to read current Working Thread summary.",
      nextLikelyMove: "Regenerate the proposal after re-reading the Working Thread.",
      riskLevel: "high",
      needsUserDecision: true,
    };
  }
}

function buildProposalId(
  thread: WorkingThread,
  changes: WorkingThreadSectionChange[],
): string {
  return buildProposalIdFromParts(thread.id, thread.lastUpdated, changes);
}

function buildProposalIdForProposal(
  proposal: WorkingThreadUpdateProposal,
): string {
  return buildProposalIdFromParts(
    proposal.threadId,
    proposal.baseLastUpdated,
    proposal.changes,
  );
}

function buildProposalIdFromParts(
  threadId: string,
  baseLastUpdated: string,
  changes: WorkingThreadSectionChange[],
): string {
  const digest = createHash("sha256")
    .update(canonicalizeProposalChanges(changes))
    .digest("hex")
    .slice(0, 12);

  return `${threadId}-${baseLastUpdated}-${digest}`;
}

function canonicalizeProposalChanges(changes: WorkingThreadSectionChange[]): string {
  return JSON.stringify(changes.map((change) => ({
    currentValue: change.currentValue,
    proposedValue: change.proposedValue,
    rationale: change.rationale,
    section: change.section,
  })));
}

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function containsSignal(text: string, signal: string): boolean {
  return text.includes(signal);
}

function isStaleError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.startsWith("Stale Working Thread proposal ") ||
    message.includes("record changed before write")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Working Thread update failed.";
}
