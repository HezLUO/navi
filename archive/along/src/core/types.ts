export const presenceStates = [
  "arriving",
  "settling",
  "quiet_focus",
  "gentle_share",
  "rest",
  "wrap_up",
] as const;

export type PresenceState = (typeof presenceStates)[number];
export type Interruptiveness = "quiet" | "balanced" | "talkative";
export type Permission = "read" | "remember" | "suggest" | "act";

export interface ProjectContext {
  repoPath: string;
  repoName: string;
  gitStatus: string;
  recentCommits: string[];
  manifests: Array<{ path: string; content: string }>;
  readme?: string;
  directorySummary: string[];
  testHints: string[];
}

export interface CuriosityItem {
  id: string;
  question: string;
  whyItMatters: string;
  nextProbe: string;
  status: "open" | "resolved" | "deferred";
  relatedProjectArea: string;
  createdFromSession: string;
}

export interface CompanionPlan {
  state: PresenceState;
  sessionId: string;
  learningGoal: string;
  currentActivity: string;
  selectedCuriosity?: CuriosityItem;
  shareLine?: string;
}

export interface JournalEntry {
  sessionId: string;
  date: string;
  triedToUnderstand: string;
  lookedAt: string[];
  nowBelieves: string[];
  stillUnsure: string[];
  nextTime: string;
  noticedAboutSession: string;
}

export interface GraphNode {
  id: string;
  type:
    | "user"
    | "companion"
    | "project"
    | "session"
    | "curiosity"
    | "decision"
    | "learned_fact"
    | "correction"
    | "project_area"
    | "draft";
  label: string;
  properties: Record<string, string>;
  createdAt: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type:
    | "session_produced_curiosity"
    | "curiosity_relates_to_project_area"
    | "user_corrected_assumption"
    | "companion_learned_fact"
    | "decision_supersedes_assumption"
    | "project_shares_pattern_with_project"
    | "companion_wants_to_continue"
    | "draft_addresses_curiosity";
  createdAt: string;
}

export interface AlongSession {
  id: string;
  repoPath: string;
  startedAt: string;
  state: PresenceState;
  plan: CompanionPlan;
  context: ProjectContext;
}

export const sessionLifecycleStates = ["new", "active", "paused", "wrapped", "expired", "recovered"] as const;
export type SessionLifecycleState = (typeof sessionLifecycleStates)[number];

export type RuntimeMode = "companion" | "debug" | "research";
export type RuntimeMemoryMode = "off" | "session" | "project_reviewed" | "project_auto" | "global_reviewed";
export type PresenceMode = "ambient" | "focused" | "interactive" | "resting";
export type RelationshipStyle = "calm" | "close" | "reflective" | "challenger";
export type AccountabilityLevel = "off" | "gentle" | "direct" | "strict";
export type AutonomyLevel = "quiet" | "suggestive" | "proactive";

export interface RuntimeProfile {
  runtimeMode: RuntimeMode;
  memoryMode: RuntimeMemoryMode;
  presenceMode: PresenceMode;
  relationshipStyle: RelationshipStyle;
  accountabilityLevel: AccountabilityLevel;
  autonomyLevel: AutonomyLevel;
  featureFlags: Record<string, boolean>;
}

export interface PermissionEnvelope {
  canReadProject: boolean;
  canReadAlongMemory: boolean;
  canWriteSession: boolean;
  canWriteJournal: boolean;
  canCreateMemoryCandidate: boolean;
  canPromoteMemory: boolean;
  canUpdateGraph: boolean;
  canShowStatus: boolean;
  canAskUser: boolean;
  canProactivelyMessage: boolean;
  canCallTools: boolean;
  canModifyProjectFiles: boolean;
  requiresReview: {
    memoryPromotion: boolean;
    globalMemory: boolean;
    proceduralMemory: boolean;
    proactiveMessage: boolean;
    projectFileWrite: boolean;
  };
}

export const defaultRuntimeProfile: RuntimeProfile = {
  runtimeMode: "companion",
  memoryMode: "project_reviewed",
  presenceMode: "ambient",
  relationshipStyle: "calm",
  accountabilityLevel: "off",
  autonomyLevel: "quiet",
  featureFlags: {},
};

export const defaultPermissionEnvelope: PermissionEnvelope = {
  canReadProject: true,
  canReadAlongMemory: true,
  canWriteSession: true,
  canWriteJournal: true,
  canCreateMemoryCandidate: true,
  canPromoteMemory: false,
  canUpdateGraph: true,
  canShowStatus: true,
  canAskUser: true,
  canProactivelyMessage: false,
  canCallTools: false,
  canModifyProjectFiles: false,
  requiresReview: {
    memoryPromotion: true,
    globalMemory: true,
    proceduralMemory: true,
    proactiveMessage: true,
    projectFileWrite: true,
  },
};

export const alongEventKinds = [
  "session_started",
  "session_recovered",
  "session_paused",
  "session_wrapped",
  "user_message",
  "user_correction",
  "user_preference",
  "user_refusal",
  "user_review_decision",
  "along_tick",
  "presence_state_changed",
  "curiosity_created",
  "project_observed",
  "file_summary_changed",
  "memory_candidate_created",
  "graph_relation_candidate_created",
  "journal_written",
  "error_recorded",
  "recovery_performed",
] as const;
export type AlongEventKind = (typeof alongEventKinds)[number];
export type AlongEventSource = "user" | "along" | "runtime" | "filesystem" | "tool" | "system";

export interface AlongEvent {
  id: string;
  schemaVersion: 1;
  occurredAt: string;
  receivedAt: string;
  sessionId: string;
  source: AlongEventSource;
  kind: AlongEventKind;
  visibility: "internal" | "user_visible" | "reviewable";
  scope: "session" | "project" | "global_candidate";
  payload: Record<string, unknown>;
  provenance: {
    route?: string;
    filePath?: string;
    command?: string;
    parentEventId?: string;
  };
  memoryEligibility: "never" | "session_only" | "candidate" | "review_required";
  riskLevel: "low" | "medium" | "high";
  idempotencyKey?: string;
}

export const contextSectionKinds = [
  "current_session",
  "recent_events",
  "project_summary",
  "active_curiosity",
  "reviewed_memory",
  "memory_candidate",
  "graph_neighborhood",
  "journal_excerpt",
  "runtime_profile",
  "permission_envelope",
] as const;
export type ContextSectionKind = (typeof contextSectionKinds)[number];
export type ContextPurpose =
  | "session_start"
  | "autonomy_tick"
  | "wrap_up"
  | "memory_consolidation"
  | "user_response"
  | "debug_inspection";

export interface ContextItem {
  id: string;
  content: string;
  sourceRef: string;
  includedBecause: string;
  confidence: "low" | "medium" | "high";
  scope: "session" | "project" | "global";
  riskLevel: "low" | "medium" | "high";
}

export interface ContextSection {
  kind: ContextSectionKind;
  items: ContextItem[];
}

export interface ContextOmission {
  sourceRef: string;
  reason: "budget" | "permission_denied" | "requires_review" | "expired" | "low_relevance" | "risk_too_high";
}

export interface ContextPacket {
  id: string;
  createdAt: string;
  sessionId: string;
  purpose: ContextPurpose;
  budget: {
    maxItems: number;
    maxApproxTokens: number;
  };
  sections: ContextSection[];
  omissions: ContextOmission[];
}

export const reviewItemKinds = [
  "memory_candidate",
  "global_memory_candidate",
  "procedural_memory_candidate",
  "graph_relation_candidate",
  "relationship_style_change",
  "accountability_change",
  "proactive_behavior_change",
  "sensitive_inference",
] as const;
export type ReviewItemKind = (typeof reviewItemKinds)[number];
export type ReviewStatus = "pending" | "accepted" | "edited" | "rejected" | "expired";

export interface ReviewItem {
  id: string;
  kind: ReviewItemKind;
  createdAt: string;
  sessionId: string;
  proposedChange: string;
  sourceRefs: string[];
  reason: string;
  riskLevel: "low" | "medium" | "high";
  defaultAction: "ignore" | "ask" | "keep_as_candidate";
  status: ReviewStatus;
}

export interface TraceEntry {
  id: string;
  at: string;
  sessionId?: string;
  operation: string;
  inputs: string[];
  decision: string;
  reason: string;
  permissionSnapshot?: string;
  contextPacketId?: string;
  relatedEventIds: string[];
  outcome: "allowed" | "blocked" | "queued" | "failed" | "recovered";
}

export type RuntimeStorageMode = "writable" | "degraded" | "readonly";

export interface RuntimeDoctorReport {
  lifecycleState: SessionLifecycleState | "none";
  effectiveProfile: RuntimeProfile;
  permissionEnvelope: PermissionEnvelope;
  currentPointerHealthy: boolean;
  recentEvents: AlongEvent[];
  latestContextPacket?: ContextPacket;
  pendingReviewItems: ReviewItem[];
  recentFailures: TraceEntry[];
  storageMode: RuntimeStorageMode;
}

export const openThreadStatuses = ["open", "watching", "needs_user", "delegated", "resolved", "archived"] as const;
export type OpenThreadStatus = (typeof openThreadStatuses)[number];

export const openThreadEvidenceKinds = [
  "user_statement",
  "design_decision",
  "project_observation",
  "implementation_signal",
  "delegation_result",
  "user_correction",
  "runtime_trace",
] as const;
export type OpenThreadEvidenceKind = (typeof openThreadEvidenceKinds)[number];

export interface OpenThreadEvidence {
  id: string;
  at: string;
  kind: OpenThreadEvidenceKind;
  sourceRef: string;
  summary: string;
  strength: "weak" | "medium" | "strong";
}

export interface OpenThreadRisk {
  id: string;
  at: string;
  summary: string;
  severity: "low" | "medium" | "high";
  sourceRef: string;
}

export interface OpenThreadDelegationRef {
  delegationId: string;
  target: "codex" | "hermes" | "local_subagent" | "manual";
  status: "requested" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  resultRef?: string;
}

export interface OpenThread {
  id: string;
  title: string;
  status: OpenThreadStatus;
  whyItMatters: string;
  currentJudgment: string;
  evidence: OpenThreadEvidence[];
  risks: OpenThreadRisk[];
  nextAttentionTrigger: string;
  interventionThreshold: string;
  delegationHistory: OpenThreadDelegationRef[];
  memoryLinks: string[];
  traceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export const heartbeatTriggers = ["session_start", "user_event", "interval", "resume", "delegation_result", "review_event"] as const;
export type HeartbeatTrigger = (typeof heartbeatTriggers)[number];

export const threadAttentionActions = ["silent", "thread_update", "read_only_delegation", "digest", "intervention"] as const;
export type ThreadAttentionAction = (typeof threadAttentionActions)[number];

export interface ThreadAttentionScore {
  threadId: string;
  trigger: HeartbeatTrigger;
  score: number;
  action: ThreadAttentionAction;
  factors: {
    riskDelta: number;
    judgmentDelta: number;
    staleness: number;
    continuity: number;
    evidenceGap: number;
    delegationValue: number;
    interruptionCost: number;
    userPreferenceFit: number;
  };
  reasons: string[];
}

export const delegationModeLabels = ["local_only", "ask_before_delegation", "read_only_auto", "write_requires_approval"] as const;
export type DelegationModeLabel = (typeof delegationModeLabels)[number];

export interface ConductorPreferences {
  delegationModeLabel: DelegationModeLabel;
  interventionStyle: "calm_reviewer" | "collaborative_companion" | "strong_challenger" | "custom";
  challengeDirectness: "low" | "medium" | "high";
  digestPreference: "off" | "brief" | "normal";
  highRiskEscalation: boolean;
  projectWritePermission: boolean;
}

export const defaultConductorPreferences: ConductorPreferences = {
  delegationModeLabel: "read_only_auto",
  interventionStyle: "collaborative_companion",
  challengeDirectness: "medium",
  digestPreference: "brief",
  highRiskEscalation: true,
  projectWritePermission: false,
};

export interface ReadOnlyDelegationRequest {
  id: string;
  threadId: string;
  reason: string;
  target: "codex" | "hermes" | "local_subagent" | "manual";
  scope: string[];
  forbiddenActions: string[];
  question: string;
  expectedOutput: string[];
  budget: {
    timeoutMs: number;
    maxOutputChars: number;
  };
  returnFormat: "judgment_merge_json";
  status: "requested" | "running" | "completed" | "failed" | "cancelled";
  createdAt: string;
  completedAt?: string;
  resultDigest?: string;
}

export interface ReadOnlyDelegationResult {
  requestId: string;
  threadId: string;
  target: ReadOnlyDelegationRequest["target"];
  status: "completed" | "failed" | "cancelled";
  summary: string;
  evidence: string[];
  risks: string[];
  recommendations: string[];
  confidence: "low" | "medium" | "high";
  rawOutput?: string;
  completedAt: string;
}

export const judgmentMergeClassifications = [
  "supports_current_judgment",
  "weakens_current_judgment",
  "contradicts_current_judgment",
  "adds_new_risk",
  "closes_evidence_gap",
  "creates_new_thread",
  "irrelevant_or_low_signal",
] as const;
export type JudgmentMergeClassification = (typeof judgmentMergeClassifications)[number];

export interface JudgmentMergeResult {
  threadId: string;
  classification: JudgmentMergeClassification;
  previousJudgment: string;
  nextJudgment: string;
  riskChanges: string[];
  evidenceAdded: OpenThreadEvidence[];
  newThreadSuggestions: Array<{ title: string; whyItMatters: string }>;
  shouldNotifyUser: boolean;
  reason: string;
  createdAt: string;
}

export interface ConductorSnapshot {
  threads: OpenThread[];
  attention: ThreadAttentionScore[];
  delegations: ReadOnlyDelegationRequest[];
  latestMerge?: JudgmentMergeResult;
  preferences: ConductorPreferences;
}
