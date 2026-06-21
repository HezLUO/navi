export const workingThreadOperations = [
  "readWorkingThread",
  "listWorkingThreads",
  "classifyDrift",
  "draftWrapUp",
  "proposeWorkingThreadUpdate",
  "applyConfirmedWorkingThreadUpdate",
] as const;

export type WorkingThreadOperation = (typeof workingThreadOperations)[number];

export const workingThreadStatuses = ["active", "paused", "closed"] as const;
export type WorkingThreadStatus = (typeof workingThreadStatuses)[number];

export const workingThreadSections = [
  "whyThisMatters",
  "currentJudgment",
  "boundary",
  "driftTriggers",
  "nextLikelyMove",
  "lastWrapUp",
  "openQuestions",
] as const;

export type WorkingThreadSection = (typeof workingThreadSections)[number];

export const riskLevels = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof riskLevels)[number];

export const driftLevels = ["none", "low", "medium", "high"] as const;
export type DriftLevel = (typeof driftLevels)[number];

export const driftRecommendedActions = [
  "answerDirectly",
  "answerWithBoundary",
  "askConfirmation",
  "proposeWrapUp",
] as const;

export type DriftRecommendedAction = (typeof driftRecommendedActions)[number];

export type ContractRecommendedAction = DriftRecommendedAction | "regenerateProposal";

export const operationResultStatuses = [
  "ok",
  "needsConfirmation",
  "conflict",
  "rejected",
  "error",
] as const;

export type OperationResultStatus = (typeof operationResultStatuses)[number];

export interface WorkingThread {
  id: string;
  title: string;
  status: WorkingThreadStatus;
  lastUpdated: string;
  whyThisMatters: string;
  currentJudgment: string;
  boundary: string[];
  driftTriggers: string[];
  nextLikelyMove: string;
  lastWrapUp: string;
  openQuestions: string[];
}

export interface WorkingThreadSummary {
  id: string;
  title: string;
  status: WorkingThreadStatus;
  lastUpdated: string;
  currentJudgmentBrief: string;
  nextLikelyMove: string;
  riskLevel: RiskLevel;
  needsUserDecision: boolean;
}

export interface DriftClassification {
  driftLevel: DriftLevel;
  reason: string;
  recommendedAction: DriftRecommendedAction;
  needsUserConfirmation: boolean;
}

export interface WrapUpDraft {
  summary: string;
  judgmentChange: string;
  boundaryChange: string;
  nextLikelyMove: string;
  openQuestionsChange: string;
  requiresConfirmation: true;
}

export interface WorkingThreadSectionChange {
  section: WorkingThreadSection;
  currentValue: string | string[];
  proposedValue: string | string[];
  rationale: string;
}

export interface WorkingThreadUpdateProposal {
  proposalId: string;
  threadId: string;
  baseLastUpdated: string;
  baseVersion?: string;
  changes: WorkingThreadSectionChange[];
  confirmationPrompt: string;
  riskLevel: RiskLevel;
}

export interface ConfirmationEnvelope {
  proposalId: string;
  approved: true;
  approvedAt: string;
  approvedBy: "user";
  sourceSessionId: string;
  sourceTurnId: string;
  approvedIntent: string;
  baseLastUpdated: string;
  baseVersion?: string;
}

export interface OperationResult<
  TData = unknown,
  TOperation extends WorkingThreadOperation = WorkingThreadOperation,
> {
  status: OperationResultStatus;
  operation: TOperation;
  threadId?: string;
  data?: TData;
  message?: string;
  reason?: string;
  recommendedAction?: ContractRecommendedAction;
}

export interface ReadWorkingThreadInput {
  threadId: string;
}

export type ReadWorkingThreadResult = OperationResult<WorkingThread, "readWorkingThread">;

export interface ListWorkingThreadsInput {
  status?: WorkingThreadStatus;
}

export type ListWorkingThreadsResult = OperationResult<WorkingThreadSummary[], "listWorkingThreads">;

export interface ClassifyDriftInput {
  thread: WorkingThread | WorkingThreadSummary;
  userRequest: string;
  proposedDirection?: string;
}

export type ClassifyDriftResult = OperationResult<DriftClassification, "classifyDrift">;

export interface DraftWrapUpInput {
  thread: WorkingThread;
  sessionSummary: string;
  judgmentChange?: string;
  boundaryChange?: string;
  nextLikelyMove?: string;
  openQuestionsChange?: string;
}

export type DraftWrapUpResult = OperationResult<WrapUpDraft, "draftWrapUp">;

export interface ProposeWorkingThreadUpdateInput {
  thread: WorkingThread;
  draft: WrapUpDraft;
}

export type ProposeWorkingThreadUpdateResult = OperationResult<
  WorkingThreadUpdateProposal,
  "proposeWorkingThreadUpdate"
>;

export interface ApplyConfirmedWorkingThreadUpdateInput {
  proposal: WorkingThreadUpdateProposal;
  confirmation: ConfirmationEnvelope;
}

export interface ApplyConfirmedWorkingThreadUpdateSuccess {
  thread: WorkingThread;
  appliedProposalId: string;
}

export interface StaleProposalConflict {
  status: "conflict";
  reason: string;
  currentThreadSummary: WorkingThreadSummary;
  staleProposal: WorkingThreadUpdateProposal;
  recommendedAction: "regenerateProposal";
}

export type ApplyConfirmedWorkingThreadUpdateResult =
  | (OperationResult<
    ApplyConfirmedWorkingThreadUpdateSuccess,
    "applyConfirmedWorkingThreadUpdate"
  > & {
    status: "ok";
    data: ApplyConfirmedWorkingThreadUpdateSuccess;
  })
  | (OperationResult<StaleProposalConflict, "applyConfirmedWorkingThreadUpdate"> & {
    status: "conflict";
    data: StaleProposalConflict;
    recommendedAction: "regenerateProposal";
  })
  | (OperationResult<unknown, "applyConfirmedWorkingThreadUpdate"> & {
    status: "rejected" | "error";
  });

export interface WorkingThreadContractOperations {
  readWorkingThread(input: ReadWorkingThreadInput): Promise<ReadWorkingThreadResult>;
  listWorkingThreads(input: ListWorkingThreadsInput): Promise<ListWorkingThreadsResult>;
  classifyDrift(input: ClassifyDriftInput): Promise<ClassifyDriftResult>;
  draftWrapUp(input: DraftWrapUpInput): Promise<DraftWrapUpResult>;
  proposeWorkingThreadUpdate(input: ProposeWorkingThreadUpdateInput): Promise<ProposeWorkingThreadUpdateResult>;
  applyConfirmedWorkingThreadUpdate(
    input: ApplyConfirmedWorkingThreadUpdateInput,
  ): Promise<ApplyConfirmedWorkingThreadUpdateResult>;
}
