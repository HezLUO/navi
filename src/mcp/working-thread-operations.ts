import { createHash } from "node:crypto";
import {
  riskLevels,
  workingThreadSections,
  workingThreadStatuses,
} from "../core/working-thread-contract";
import type {
  ApplyConfirmedWorkingThreadUpdateInput,
  ApplyConfirmedWorkingThreadUpdateResult,
  ClassifyDriftInput,
  ClassifyDriftResult,
  ConfirmationEnvelope,
  DriftClassification,
  DraftWrapUpInput,
  DraftWrapUpResult,
  ProposeWorkingThreadUpdateInput,
  ProposeWorkingThreadUpdateResult,
  WorkingThread,
  WorkingThreadSection,
  WorkingThreadContractOperations,
  WorkingThreadSectionChange,
  WorkingThreadSummary,
  WorkingThreadUpdateProposal,
  WrapUpDraft,
} from "../core/working-thread-contract";
import type { WorkingThreadDocsStore } from "./working-thread-docs-store";
import { summarizeWorkingThread } from "./working-thread-markdown";
import { buildWorkingThreadBaseVersion } from "./working-thread-version";

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
  const invalidReason = getInvalidClassifyInputReason(input);
  const threadId = getClassifyInputThreadId(input);
  if (invalidReason) {
    return {
      status: "rejected",
      operation: "classifyDrift",
      threadId,
      reason: invalidReason,
    };
  }

  const typedInput = input as ClassifyDriftInput;
  const drift = buildDriftClassification(typedInput);

  return {
    status: "ok",
    operation: "classifyDrift",
    threadId: typedInput.thread.id,
    data: drift,
  };
}

function getInvalidClassifyInputReason(input: ClassifyDriftInput): string | undefined {
  const value = input as unknown;
  if (!isRecord(value)) {
    return "Classify input is required.";
  }
  if (!isRecord(value.thread)) {
    return "Thread is required.";
  }
  if (typeof value.thread.id !== "string") {
    return "Thread id is required.";
  }
  if (typeof value.userRequest !== "string" || !value.userRequest.trim()) {
    return "User request is required.";
  }
  if ("proposedDirection" in value && typeof value.proposedDirection !== "string") {
    return "Proposed direction must be a string.";
  }
  if ("boundary" in value.thread && !isStringArray(value.thread.boundary)) {
    return "Thread boundary must be a string array.";
  }
  if ("driftTriggers" in value.thread && !isStringArray(value.thread.driftTriggers)) {
    return "Thread driftTriggers must be a string array.";
  }

  return undefined;
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
  const invalidReason = getInvalidDraftWrapUpInputReason(input);
  const threadId = getDraftWrapUpInputThreadId(input);
  if (invalidReason) {
    return {
      status: "rejected",
      operation: "draftWrapUp",
      threadId,
      reason: invalidReason,
    };
  }

  const typedInput = input as DraftWrapUpInput;
  const draft: WrapUpDraft = {
    summary: typedInput.sessionSummary,
    judgmentChange: typedInput.judgmentChange ?? "",
    boundaryChange: typedInput.boundaryChange ?? "",
    nextLikelyMove: typedInput.nextLikelyMove ?? "",
    openQuestionsChange: typedInput.openQuestionsChange ?? "",
    requiresConfirmation: true,
  };

  return {
    status: "ok",
    operation: "draftWrapUp",
    threadId: typedInput.thread.id,
    data: draft,
  };
}

function proposeWorkingThreadUpdate(
  input: ProposeWorkingThreadUpdateInput,
): ProposeWorkingThreadUpdateResult {
  const invalidReason = getInvalidProposeInputReason(input);
  const threadId = getProposeInputThreadId(input);
  if (invalidReason) {
    return {
      status: "rejected",
      operation: "proposeWorkingThreadUpdate",
      threadId,
      reason: invalidReason,
    };
  }

  const typedInput = input as ProposeWorkingThreadUpdateInput;
  const changes = buildSectionChanges(typedInput.thread, typedInput.draft);
  const baseVersion = buildWorkingThreadBaseVersion(typedInput.thread);
  const proposal: WorkingThreadUpdateProposal = {
    proposalId: buildProposalId(typedInput.thread, baseVersion, changes),
    threadId: typedInput.thread.id,
    baseLastUpdated: typedInput.thread.lastUpdated,
    baseVersion,
    changes,
    confirmationPrompt: "Confirm this Working Thread update before any write-back is applied.",
    riskLevel: changes.length > 2 ? "medium" : "low",
  };

  return {
    status: "needsConfirmation",
    operation: "proposeWorkingThreadUpdate",
    threadId: typedInput.thread.id,
    data: proposal,
    message: "Working Thread update proposal requires explicit confirmation.",
  };
}

async function applyConfirmedWorkingThreadUpdate(
  store: WorkingThreadDocsStore,
  input: ApplyConfirmedWorkingThreadUpdateInput,
): Promise<ApplyConfirmedWorkingThreadUpdateResult> {
  const invalidReason = getInvalidConfirmationReason(input);
  const threadId = getApplyInputThreadId(input);
  if (invalidReason) {
    return {
      status: "rejected",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
      reason: invalidReason,
    };
  }

  const typedInput = input as ApplyConfirmedWorkingThreadUpdateInput;
  try {
    const parsed = await store.applySectionPatchProposal(typedInput.proposal);
    if (!parsed.thread) {
      return {
        status: "rejected",
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: typedInput.proposal.threadId,
        reason: "Store returned a malformed Working Thread after applying the proposal.",
      };
    }

    return {
      status: "ok",
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId: typedInput.proposal.threadId,
      data: {
        appliedProposalId: typedInput.proposal.proposalId,
        thread: parsed.thread,
      },
    };
  } catch (error) {
    if (isStaleError(error)) {
      const currentThreadSummary = await readCurrentThreadSummary(store, typedInput.proposal);
      return {
        status: "conflict",
        operation: "applyConfirmedWorkingThreadUpdate",
        threadId: typedInput.proposal.threadId,
        reason: getErrorMessage(error),
        recommendedAction: "regenerateProposal",
        data: {
          status: "conflict",
          reason: getErrorMessage(error),
          currentThreadSummary,
          staleProposal: typedInput.proposal,
          recommendedAction: "regenerateProposal",
        },
      };
    }

    const status = getNonStaleApplyFailureStatus(error);
    return {
      status,
      operation: "applyConfirmedWorkingThreadUpdate",
      threadId,
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
  const value = input as unknown;
  if (!isRecord(value)) {
    return "Apply input is required.";
  }

  const proposal = value.proposal;
  const confirmation = value.confirmation;
  const invalidProposalReason = getInvalidProposalReason(proposal);
  if (invalidProposalReason) {
    return invalidProposalReason;
  }
  const invalidConfirmationShapeReason = getInvalidConfirmationShapeReason(confirmation);
  if (invalidConfirmationShapeReason) {
    return invalidConfirmationShapeReason;
  }
  const typedProposal = proposal as WorkingThreadUpdateProposal;
  const typedConfirmation = confirmation as ConfirmationEnvelope;
  const expectedProposalId = buildProposalIdForProposal(typedProposal);

  if (typedConfirmation.approved !== true) {
    return "Confirmation must explicitly approve the proposal.";
  }
  if (typedProposal.proposalId !== expectedProposalId) {
    return "Proposal id does not match the proposal content.";
  }
  if (typedConfirmation.proposalId !== typedProposal.proposalId) {
    return "Confirmation proposalId does not match the proposal.";
  }
  if (typedConfirmation.baseLastUpdated !== typedProposal.baseLastUpdated) {
    return "Confirmation baseLastUpdated does not match the proposal.";
  }
  if (typedConfirmation.baseVersion !== typedProposal.baseVersion) {
    return "Confirmation baseVersion does not match the proposal.";
  }
  if (typedConfirmation.approvedBy !== "user") {
    return "Confirmation must be approved by the user.";
  }
  if (!typedConfirmation.approvedAt.trim()) {
    return "Confirmation approvedAt is required.";
  }
  if (!typedConfirmation.sourceSessionId.trim()) {
    return "Confirmation sourceSessionId is required.";
  }
  if (!typedConfirmation.sourceTurnId.trim()) {
    return "Confirmation sourceTurnId is required.";
  }
  if (!typedConfirmation.approvedIntent.trim()) {
    return "Confirmation approvedIntent is required.";
  }

  return undefined;
}

function getInvalidProposeInputReason(
  input: ProposeWorkingThreadUpdateInput,
): string | undefined {
  const value = input as unknown;
  if (!isRecord(value)) {
    return "Propose input is required.";
  }

  const invalidThreadReason = getInvalidWorkingThreadReason(value.thread);
  if (invalidThreadReason) {
    return invalidThreadReason;
  }

  const invalidDraftReason = getInvalidWrapUpDraftReason(value.draft);
  if (invalidDraftReason) {
    return invalidDraftReason;
  }

  return undefined;
}

function getInvalidDraftWrapUpInputReason(
  input: DraftWrapUpInput,
): string | undefined {
  const value = input as unknown;
  if (!isRecord(value)) {
    return "Draft wrap-up input is required.";
  }

  const invalidThreadReason = getInvalidWorkingThreadReason(value.thread);
  if (invalidThreadReason) {
    return invalidThreadReason;
  }

  if (typeof value.sessionSummary !== "string" || !value.sessionSummary.trim()) {
    return "Session summary is required.";
  }

  for (
    const field of [
      "judgmentChange",
      "boundaryChange",
      "nextLikelyMove",
      "openQuestionsChange",
    ] as const
  ) {
    if (field in value && typeof value[field] !== "string") {
      return `Draft wrap-up ${field} must be a string.`;
    }
  }

  return undefined;
}

function getInvalidWorkingThreadReason(thread: unknown): string | undefined {
  if (!isRecord(thread)) {
    return "Thread is required.";
  }

  const requiredStringFields = [
    "id",
    "title",
    "lastUpdated",
    "whyThisMatters",
    "currentJudgment",
    "nextLikelyMove",
    "lastWrapUp",
  ] as const;
  for (const field of requiredStringFields) {
    if (typeof thread[field] !== "string") {
      return `Thread ${field} is required.`;
    }
  }

  if (
    typeof thread.status !== "string"
    || !workingThreadStatuses.includes(thread.status as WorkingThread["status"])
  ) {
    return "Thread status is invalid.";
  }

  for (const field of ["boundary", "driftTriggers", "openQuestions"] as const) {
    if (!isStringArray(thread[field])) {
      return `Thread ${field} must be a string array.`;
    }
  }

  return undefined;
}

function getInvalidWrapUpDraftReason(draft: unknown): string | undefined {
  if (!isRecord(draft)) {
    return "Draft is required.";
  }

  const requiredStringFields = [
    "summary",
    "judgmentChange",
    "boundaryChange",
    "nextLikelyMove",
    "openQuestionsChange",
  ] as const;
  for (const field of requiredStringFields) {
    if (typeof draft[field] !== "string") {
      return `Draft ${field} is required.`;
    }
  }

  if (draft.requiresConfirmation !== true) {
    return "Draft requiresConfirmation must be true.";
  }

  return undefined;
}

function getInvalidProposalReason(
  proposal: unknown,
): string | undefined {
  if (!isRecord(proposal)) {
    return "Proposal is required.";
  }
  if (!isNonEmptyString(proposal.proposalId)) {
    return "Proposal proposalId is required.";
  }
  if (!isNonEmptyString(proposal.threadId)) {
    return "Proposal threadId is required.";
  }
  if (!isNonEmptyString(proposal.baseLastUpdated)) {
    return "Proposal baseLastUpdated is required.";
  }
  if (!isNonEmptyString(proposal.baseVersion)) {
    return "Proposal baseVersion is required.";
  }
  if (!Array.isArray(proposal.changes)) {
    return "Proposal changes are required.";
  }
  if (!isNonEmptyString(proposal.confirmationPrompt)) {
    return "Proposal confirmationPrompt is required.";
  }
  if (
    typeof proposal.riskLevel !== "string"
    || !riskLevels.includes(proposal.riskLevel as WorkingThreadUpdateProposal["riskLevel"])
  ) {
    return "Proposal riskLevel is invalid.";
  }

  for (const [index, change] of proposal.changes.entries()) {
    const invalidChangeReason = getInvalidSectionChangeReason(change, index);
    if (invalidChangeReason) {
      return invalidChangeReason;
    }
  }

  return undefined;
}

function getInvalidSectionChangeReason(
  change: unknown,
  index: number,
): string | undefined {
  if (!isRecord(change)) {
    return `Proposal change ${index} is invalid.`;
  }
  if (
    typeof change.section !== "string"
    || !workingThreadSections.includes(change.section as WorkingThreadSection)
  ) {
    return `Proposal change ${index} has an invalid section.`;
  }
  if (!isSectionValue(change.currentValue)) {
    return `Proposal change ${index} currentValue is invalid.`;
  }
  if (!isSectionValue(change.proposedValue)) {
    return `Proposal change ${index} proposedValue is invalid.`;
  }
  if (!isNonEmptyString(change.rationale)) {
    return `Proposal change ${index} rationale is required.`;
  }

  return undefined;
}

function getInvalidConfirmationShapeReason(
  confirmation: unknown,
): string | undefined {
  if (!isRecord(confirmation)) {
    return "Confirmation is required.";
  }
  if (confirmation.approved !== true) {
    return "Confirmation must explicitly approve the proposal.";
  }
  if (!isNonEmptyString(confirmation.proposalId)) {
    return "Confirmation proposalId is required.";
  }
  if (!isNonEmptyString(confirmation.baseLastUpdated)) {
    return "Confirmation baseLastUpdated is required.";
  }
  if (!isNonEmptyString(confirmation.baseVersion)) {
    return "Confirmation baseVersion is required.";
  }
  if (confirmation.approvedBy !== "user") {
    return "Confirmation must be approved by the user.";
  }
  if (!isNonEmptyString(confirmation.approvedAt)) {
    return "Confirmation approvedAt is required.";
  }
  if (!isNonEmptyString(confirmation.sourceSessionId)) {
    return "Confirmation sourceSessionId is required.";
  }
  if (!isNonEmptyString(confirmation.sourceTurnId)) {
    return "Confirmation sourceTurnId is required.";
  }
  if (!isNonEmptyString(confirmation.approvedIntent)) {
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
  baseVersion: string,
  changes: WorkingThreadSectionChange[],
): string {
  return buildProposalIdFromParts(thread.id, thread.lastUpdated, baseVersion, changes);
}

function buildProposalIdForProposal(
  proposal: WorkingThreadUpdateProposal,
): string {
  return buildProposalIdFromParts(
    proposal.threadId,
    proposal.baseLastUpdated,
    proposal.baseVersion ?? "",
    proposal.changes,
  );
}

function buildProposalIdFromParts(
  threadId: string,
  baseLastUpdated: string,
  baseVersion: string,
  changes: WorkingThreadSectionChange[],
): string {
  const digest = createHash("sha256")
    .update(JSON.stringify({
      baseVersion,
      changes: canonicalizeProposalChanges(changes),
    }))
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

function getApplyInputThreadId(
  input: ApplyConfirmedWorkingThreadUpdateInput,
): string | undefined {
  const value = input as unknown;
  const proposal = isRecord(value) ? value.proposal : undefined;
  if (isRecord(proposal) && typeof proposal.threadId === "string") {
    return proposal.threadId;
  }

  return undefined;
}

function getClassifyInputThreadId(
  input: ClassifyDriftInput,
): string | undefined {
  const value = input as unknown;
  if (isRecord(value) && isRecord(value.thread) && typeof value.thread.id === "string") {
    return value.thread.id;
  }

  return undefined;
}

function getDraftWrapUpInputThreadId(
  input: DraftWrapUpInput,
): string | undefined {
  const value = input as unknown;
  if (isRecord(value) && isRecord(value.thread) && typeof value.thread.id === "string") {
    return value.thread.id;
  }

  return undefined;
}

function getProposeInputThreadId(
  input: ProposeWorkingThreadUpdateInput,
): string | undefined {
  const value = input as unknown;
  if (isRecord(value) && isRecord(value.thread) && typeof value.thread.id === "string") {
    return value.thread.id;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSectionValue(value: unknown): value is string | string[] {
  return typeof value === "string"
    || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isStaleError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.startsWith("Stale Working Thread proposal ") ||
    message.includes("record changed before write")
  );
}

function getNonStaleApplyFailureStatus(error: unknown): "rejected" | "error" {
  if (isNodeError(error)) {
    return "error";
  }

  return "rejected";
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Working Thread update failed.";
}
