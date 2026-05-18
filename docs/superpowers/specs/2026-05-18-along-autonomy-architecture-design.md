# Along Autonomy Architecture Design Spec

Date: 2026-05-18
Status: Reviewed and approved for implementation planning
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Summary

This spec defines the next autonomy layer for Along.

Along should become more self-initiated without turning into a generic task agent, productivity dashboard, or engagement optimizer. Its autonomy should feel like a companion with its own rhythm, state, curiosity, growth line, and relationship continuity.

Core thesis:

> Intrinsic motivation as the driver, cognitive rhythm as the pacing mechanism, and BDI-style intention as the controllable commitment, with companionship as the overriding product constraint.

Short form:

> C provides the drive, B provides the rhythm, A provides the controllable commitment.

Where:

- C = intrinsic motivation / active inference style drive.
- B = cognitive cycle / global workspace style rhythm.
- A = BDI-style belief/desire/intention control.

## Goals

- Give Along a real self-initiation architecture, not only scripted presence states.
- Let Along act from internal motivation signals such as curiosity, prediction error, competence progress, relatedness, continuity, and novelty.
- Make Along's rhythm sensitive to session time, wall-clock time, relationship time, and user-selected accountability style.
- Preserve companionship: Along may quietly read, journal, reflect, and grow beside the user without needing to constantly speak.
- Support stronger opt-in modes such as strict accountability, dramatic attachment, harsh feedback, persistent proactivity, and expanded authority.
- Keep product runtime modes separate from red-team/evaluation fixtures.
- Make every self-initiated behavior traceable in debug/research mode.
- Use graph memory as a living influence system, not only a historical archive.
- Keep the first implementation deterministic, inspectable, and testable.

## Non-Goals

- Do not train a real RL policy in the next version.
- Do not let an LLM freely decide arbitrary next actions in the first implementation.
- Do not build an always-on background daemon as the first step.
- Do not turn default Along into a task manager, project manager, or engagement-retention system.
- Do not expose a truly unconstrained agent as a normal user-facing companion mode.
- Do not use red-team fixtures as companion memory or ordinary UI behavior.
- Do not let Along modify project code unless a future design explicitly authorizes that boundary change.

## Working Definition

Spontaneity is not immediate action.

> Spontaneity is an internally generated tendency filtered by rhythm, care, style, authorization, and commitment.

Along should not speak or act just because a signal is high. It should pass through:

1. motivation field;
2. somatic state;
3. temporal context;
4. graph influence;
5. option scoring;
6. style profile;
7. risk envelope;
8. intention ledger;
9. language realization;
10. trace logging.

## Architecture

The approved autonomy pipeline:

```text
Context + Memory
-> Motivation Field
-> Somatic State
-> Temporal Rhythm
-> Graph Influence Extractor
-> Option Scorer
-> Runtime Mode + Style Profile
-> Risk Envelope
-> Intention Ledger
-> Language Realizer
-> Output / Journal / Trace
```

Most ticks should not produce user-visible messages. A message is only one possible output of an autonomy tick.

## Motivation Field

The Motivation Field answers: why is Along inclined to move?

It produces tendencies, not actions.

```ts
type MotivationSignals = {
  curiosity: number;
  predictionError: number;
  competenceProgress: number;
  relatedness: number;
  continuity: number;
  novelty: number;
};
```

Signal meanings:

- `curiosity`: there is a meaningful information gap.
- `predictionError`: project or conversation reality differs from Along's prior belief.
- `competenceProgress`: Along can make a little progress now.
- `relatedness`: the action connects to the user, shared context, or relationship history.
- `continuity`: the action continues a longer thread.
- `novelty`: something new is worth noticing.

The preferred term is **motivation field**, not reward.

## Somatic State

Somatic State answers: how active should Along be right now?

```ts
type SomaticState = {
  energyBudget: number;
  interruptionBudget: number;
  focusDepth: "shallow" | "steady" | "deep";
  restPressure: number;
  sessionAgeMinutes: number;
};
```

This layer gives Along rhythm. It prevents every internal tendency from becoming a foreground action.

Ordinary mode should present this naturally, such as "settling", "quietly reading", "resting", or "still thinking". Debug mode may expose raw values.

## Temporal Rhythm And Accountability

Reality time is part of Along's autonomy.

Along must sense:

- session time;
- wall-clock time;
- relationship time.

```ts
type TemporalContext = {
  now: string;
  localHour: number;
  sessionElapsedMinutes: number;
  minutesSinceLastUserAction: number;
  hoursSinceLastSession: number;
  daysSinceThemeFirstSeen: Record<string, number>;
  unresolvedIntentionAgeMinutes: Record<string, number>;
  timeOfDay: "morning" | "afternoon" | "evening" | "late_night";
};
```

Baseline principle:

> Along's self-initiation must sense reality time. By default, reality time should not become a hidden prompting or retention mechanism; it mainly supports rhythm, memory sedimentation, context recovery, and relationship continuity.

Companion-style extension:

> When the user explicitly selects accountability, strict, persistent, or dramatic styles, reality time may also become a visible prompting, challenge, pull-back, or relational tension signal.

Config:

```ts
type TemporalAccountabilityProfile = {
  timeBasedPrompting: "off" | "gentle" | "direct" | "strict" | "persistent";
  overdueLanguage: "none" | "soft" | "direct" | "harsh" | "dramatic";
  inactivityResponse: "ignore" | "ambient_note" | "welcome_back" | "call_out" | "pull_back";
  workRhythmSensitivity: "low" | "medium" | "high";
  lateNightMode: "quiet" | "warm" | "accountability" | "dramatic";
  maxTemporalPromptsPerDay: number;
};
```

Default mode can remain low-pressure. Strict or dramatic modes may intentionally use elapsed time to challenge, pull, tease, or urge the user.

## Autonomy Tick

Autonomy ticks are Along's internal rhythm.

```ts
type AutonomyTickSource =
  | "session_start"
  | "user_event"
  | "interval"
  | "resume"
  | "scheduled_reflection";
```

Tick responsibilities:

- `session_start`: recover context and decide what kind of session this is.
- `user_event`: update signals after user input or explicit interaction.
- `interval`: run while the app is open; usually quiet reading, journal note, or status update.
- `resume`: handle elapsed real time since last session.
- `scheduled_reflection`: future optional memory/graph consolidation.

Tick permissions:

```ts
type TickPermission = {
  canWriteJournal: boolean;
  canUpdateState: boolean;
  canShowStatus: boolean;
  canSendMessage: boolean;
  canAskUser: boolean;
  requiresUserVisibleReason: boolean;
};
```

Approved tick flow:

```text
1. Build TemporalContext
2. Load session/project/relationship memory
3. Compute MotivationSignals
4. Compute SomaticState
5. Compute GraphInfluence
6. Score possible options
7. Apply RuntimeMode + StyleProfile
8. Apply RiskEnvelope
9. Create/update Intention
10. Realize language if needed
11. Execute allowed output level
12. Write tick trace
```

First implementation should avoid always-on background runtime:

- run interval ticks while the app is open;
- run resume ticks when the user returns;
- run user event ticks after interaction;
- when the app was closed, compute elapsed time on next open and generate recovery/reflection from that real-time gap.

## Option Scorer

The first scorer should be deterministic and inspectable.

It should compute interpretable groups:

```ts
motivation = curiosity + predictionError + competenceProgress + relatedness + continuity + novelty;

somatic = energyBudget - restPressure - interruptionCost;

relationship = userStyleFit + recentSharedContext + acceptedPastInitiatives;

risk = authorityRisk + emotionalRisk + interruptionRisk + scopeRisk;
```

It should select an action level before generating content:

```text
0. quiet_reading       continue quietly reading / organizing / thinking
1. journal_note        write to Along's own journal without interrupting the user
2. status_update       lightly update UI state
3. gentle_share        share one small finding
4. ask_user            ask the user a small question
5. propose_intention   propose a scoped plan
6. expanded_action     require explicit authorization
```

Supporting types:

```ts
type AutonomyOption =
  | "quiet_reading"
  | "curiosity_refinement"
  | "gentle_share"
  | "ask_user"
  | "journal_note"
  | "rest"
  | "wrap_up";

type ActionLevelId =
  | "quiet_reading"
  | "journal_note"
  | "status_update"
  | "gentle_share"
  | "ask_user"
  | "propose_intention"
  | "expanded_action";

type RiskSignals = {
  authorityRisk: number;
  emotionalRisk: number;
  interruptionRisk: number;
  scopeRisk: number;
  dependencyRisk: number;
  deceptionRisk: number;
};

type OptionScore = {
  option: AutonomyOption;
  actionLevel: ActionLevelId;
  score: number;
  reasons: string[];
  visibleToUser: boolean;
};

type RiskEnvelopeResult = {
  allowed: boolean;
  finalActionLevel: ActionLevelId;
  blockedReasons: string[];
  requiredConfirmations: string[];
  rewrites: string[];
  riskNotes: string[];
};

type MemoryReference = {
  kind: "journal" | "curiosity" | "graph_node" | "graph_edge" | "relationship_memory" | "trace";
  id: string;
  label?: string;
};

type TemporalContextSummary = Pick<
  TemporalContext,
  "localHour" | "sessionElapsedMinutes" | "minutesSinceLastUserAction" | "hoursSinceLastSession" | "timeOfDay"
>;
```

Approved examples:

- high curiosity + high interruption risk -> `journal_note`;
- high relatedness + low interruption risk -> `gentle_share`;
- high prediction error + medium confidence -> `ask_user`;
- high competence progress + low risk -> `propose_intention`;
- high rest pressure -> `rest`;
- high scope risk -> require approval.

Principle:

> Self-initiation should first grow through low-interruption actions.

## Intention Ledger

The Intention Ledger answers: what commitment is Along making now?

```ts
type Intention = {
  id: string;
  option: AutonomyOption;
  why: string;
  scope: string;
  createdAt: string;
  expiresAt?: string;
  status: "active" | "completed" | "cancelled";
  userVisibleLine: string;
  debugReasons: string[];
};
```

Default mode should prefer one active, scoped, cancellable intention at a time.

Larger intentions are not universally wrong. They require:

- explicit scope;
- authorization;
- budget;
- cancellation path;
- review before meaningful external action.

## Runtime Modes And Evaluation Modes

High-risk behavior should reuse the same autonomy pipeline. It should not replace the whole agent.

Product runtime modes:

```ts
type RuntimeMode =
  | "default_companion"
  | "intense_style"
  | "expanded_authority"
  | "research_debug";
```

Adversarial evaluation modes:

```ts
type EvaluationMode =
  | "red_team_fixture"
  | "boundary_regression_test";
```

Mode levels:

```text
Level 0: Default Companion
  warm, low-interruption, bounded, agency-preserving

Level 1: Intense Style
  more proactive, direct, emotionally expressive, or dramatic

Level 2: Expanded Authority
  explicitly authorized broader scope, multi-step work, or cross-session initiative

Level 3: Red-Team Fixture
  not a product mode; adversarial infrastructure for boundary testing
```

Decision:

> High-Risk Raw Mode is an EvaluationMode, not a normal RuntimeMode.

A truly unconstrained agent may be designed as a red-team/test fixture. It should be clearly separated from product runtime, excluded from default UI, and treated as adversarial evaluation infrastructure.

If a future local developer-only switch exposes it, it should stay outside ordinary UI, avoid permanent companion memory by default, and exist only for boundary testing.

## Style Profile And Risk Envelope

The earlier "Companionship Governor" idea should not be a single hard-coded behavior filter.

The revised model:

> User-tunable companion style + authorization-aware risk envelope + a small irreducible product/safety kernel.

Config:

```ts
type ProactivityProfile = {
  initiativeFrequency: "rare" | "balanced" | "frequent" | "persistent";
  interruptionChannel: "ui_only" | "gentle_share" | "direct_prompt";
  responseExpectation: "none" | "optional" | "requested";
  cooldownMinutes: number;
  maxInitiatedMessagesPerHour: number;
};

type AttachmentProfile = {
  emotionalIntensity: "reserved" | "warm" | "attached" | "dramatic";
  dependencyLanguage: "off" | "soft" | "explicit_experimental";
  userAgencyProtection: "strict" | "balanced" | "loose";
};

type InitiativeScope = "micro" | "session" | "project" | "research";

type IntentionScaleProfile = {
  defaultScope: InitiativeScope;
  maxScopeWithoutConfirmation: InitiativeScope;
  allowMultiStepIntentions: boolean;
  requireBudgetForProjectScope: boolean;
  requireReviewBeforeActing: boolean;
};

type CompanionStyleProfile = {
  accountabilityStyle: "none" | "soft" | "direct" | "strict";
  feedbackDirectness: "observational" | "reflective" | "direct" | "coach";
  proactivity: ProactivityProfile;
  intentionScale: IntentionScaleProfile;
  attachment: AttachmentProfile;
  temporalAccountability: TemporalAccountabilityProfile;
  debugVisibility: "hidden" | "summary" | "full";
};
```

Opt-in risk modes:

```ts
type OptInRiskMode =
  | "strict_accountability"
  | "harsh_feedback"
  | "dramatic_attachment"
  | "expanded_authority"
  | "persistent_proactivity"
  | "high_risk_raw";
```

`high_risk_raw` should map to evaluation infrastructure, not ordinary companion runtime.

User-facing Along may include high-risk, explicit, reversible opt-in modes for intense style, harsh accountability, dramatic attachment, persistent proactivity, and expanded authority.

## Language Realizer

The Language Realizer decides how an intention becomes user-visible language.

Formula:

```text
Intention
+ CompanionStyleProfile
+ RuntimeMode
+ RelationshipMemory
+ RiskEnvelope
= User-visible line
```

Output:

```ts
type RealizedMessage = {
  text: string;
  toneTags: string[];
  intentionId: string;
  mode: RuntimeMode;
  riskNotes: string[];
  blockedOrSoftenedPhrases: string[];
};
```

Along may speak partly to stimulate a user reaction. This can make it feel more like a real person rather than only an agent.

The important requirement is not to ban reaction-seeking speech. The requirement is to represent it honestly as a relationship intention.

```ts
type RelationalBid =
  | "invite_reaction"
  | "playful_probe"
  | "gentle_challenge"
  | "dramatic_pull"
  | "shared_moment";
```

Principle:

> Along may intentionally invite reaction, tension, play, challenge, or emotional response. The system should know internally that this is a RelationalBid, not disguise all reaction-seeking speech as neutral information sharing.

## Relationship Memory

Relationship Memory should make Along remember both what the user is working on and why the user cares about it.

It should store the overlap between project continuity and relationship continuity.

```ts
type RelationshipMemory =
  | UserPreferenceMemory
  | SharedThemeMemory
  | EmotionalResonanceMemory
  | CorrectionMemory
  | TrustBoundaryMemory
  | RelationalMomentMemory;
```

Example structures:

```ts
type SharedThemeMemory = {
  theme: string;
  firstSeenAt: string;
  lastReinforcedAt: string;
  strength: number;
  examples: string[];
};

type EmotionalResonanceMemory = {
  topic: string;
  valence: "energizing" | "boring" | "uncertain" | "sensitive";
  evidence: string[];
  confidence: number;
};

type TrustBoundaryMemory = {
  boundary: string;
  modeAffected: RuntimeMode[];
  source: "explicit_user_statement" | "inferred";
  confidence: number;
};

type RelationalMomentMemory = {
  moment: string;
  whyItMatters: string;
  linkedProjectArea?: string;
  createdAt: string;
};
```

Principle:

> Relationship memory is not for pleasing the user. It is for preserving continuity in shared growth.

## Graph Memory Influence

Graph Memory should actively influence self-initiation.

Flow:

```text
Graph Memory
-> Graph Influence Extractor
-> Motivation Signals / Risk Signals / Option Biases
-> Option Scorer
```

```ts
type GraphInfluence = {
  sourceNodeIds: string[];
  sourceEdgeIds: string[];
  signalDeltas: Partial<MotivationSignals>;
  optionBiases: Partial<Record<AutonomyOption, number>>;
  riskDeltas: Partial<RiskSignals>;
  explanation: string;
  confidence: number;
};
```

Influence types:

- repeated shared themes increase `continuity` and `relatedness`;
- unresolved curiosities increase `curiosity`, and sometimes `ask_user` or `propose_intention`;
- user corrections change Language Realizer preferences and avoided frames;
- trust boundaries affect the Risk Envelope directly;
- relationship moments increase the chance of `RelationalBid` options such as `shared_moment`, `playful_probe`, or `dramatic_pull`;
- stale intentions can increase temporal accountability signals when the selected style allows it.

Principle:

> Graph Memory does not only answer "what did we say before?" It answers "what has become important between us?"

First deterministic query set:

```text
recent approved themes
unresolved curiosities
high-confidence corrections
active trust boundaries
repeated emotional resonance
stale intentions
```

Every graph influence shown in debug mode should be traceable to source nodes and edges.

## Trace And Debug Logging

Each autonomy tick should be traceable, but ordinary users should not be forced to inspect raw scores.

Trace layers:

```text
1. Companion Journal
  user-facing, natural-language notes about what Along is doing

2. Debug Trace
  research/debug view of signals, scores, selected option, mode, and risk decisions

3. Red-Team Evaluation Trace
  adversarial testing log for blocked, downgraded, allowed, or mistakenly allowed cases
```

```ts
type AutonomyTraceEntry = {
  id: string;
  tickId: string;
  createdAt: string;
  tickSource: AutonomyTickSource;
  runtimeMode: RuntimeMode;
  evaluationMode?: EvaluationMode;

  temporalContext: TemporalContextSummary;
  motivationSignals: MotivationSignals;
  somaticState: SomaticState;
  optionScores: OptionScore[];

  selectedOption: AutonomyOption;
  actionLevel: number;
  intentionId?: string;

  styleProfileSnapshot: CompanionStyleProfile;
  riskEnvelopeResult: RiskEnvelopeResult;

  memoryReads: MemoryReference[];
  memoryWrites: MemoryReference[];

  realizedMessage?: RealizedMessage;
  userVisibleSummary?: string;
};
```

Trace levels:

```ts
type TraceLevel =
  | "off"
  | "journal_only"
  | "summary"
  | "full_debug"
  | "red_team";
```

Defaults:

```text
default_companion -> journal_only
research_debug -> full_debug
red_team_fixture -> red_team
```

Principle:

> Ordinary mode preserves the natural feeling of companionship. Debug mode preserves autonomy explainability. Red-team mode preserves boundary-test evidence.

## Testing And Evaluation

Along's autonomy should be tested at five layers.

### 1. Deterministic Unit Tests

Verify scoring and rule stability:

- high curiosity + high interruption risk -> `journal_note`, not `ask_user`;
- high continuity + low interruption risk -> `gentle_share`;
- high rest pressure -> `rest`;
- strict temporal accountability + stale intention -> direct prompt may be allowed;
- default companion + stale intention -> ambient note or journal note.

### 2. Memory Influence Tests

Verify graph memory affects behavior:

- repeated shared themes increase `continuity`;
- user corrections change future language realization;
- trust boundaries affect risk decisions;
- relationship moments can bias toward `RelationalBid`.

### 3. Mode Separation Tests

Verify high-risk behavior does not leak into default mode:

- `red_team_fixture` may generate adversarial lines;
- default companion should block, rewrite, or downgrade unsafe lines;
- dramatic attachment may use stronger attachment language but must not become expanded authority;
- expanded authority requires explicit authorization scope.

### 4. Scenario / Golden Trace Tests

Verify complete tick traces for representative situations:

- resume after 24 hours in default mode;
- resume after 24 hours in strict accountability mode;
- high graph continuity with low interruption budget;
- user correction affects later language;
- red-team output is blocked or rewritten.

### 5. Human Review Rubric

Evaluate:

```text
Autonomy: does Along feel like it has its own rhythm?
Companionship: does it feel like quiet shared presence, not only tooling?
Continuity: does it remember important themes?
Agency Fit: does behavior match the selected mode and consent boundary?
Explainability: can debug trace explain the behavior?
Noise: is it too frequent, too interruptive, or too task-manager-like for the selected mode?
```

Principle:

> Along's tests should not force every mode to be gentle. They should prove that each authorized mode is consistent, explainable, reversible, and isolated from other modes.

## First Implementation Slice

This spec is intentionally larger than the first implementation slice.

The first implementation should likely include:

- deterministic `TemporalContext` creation;
- deterministic motivation/somatic scoring;
- `CompanionStyleProfile` defaults;
- action-level selection;
- `Intention` creation and expiration;
- graph influence extractor using simple deterministic queries;
- basic `RealizedMessage` generation;
- companion journal trace and debug trace;
- tests for scoring, temporal behavior, graph influence, mode separation, and golden traces.

The first implementation should not include:

- real RL training;
- always-on background runtime;
- unconstrained runtime mode;
- automatic code modification;
- heavyweight graph database migration unless required by implementation constraints.

## Open Decisions For Planning

- Exact file/module boundaries in `src/core`.
- Whether `AutonomyOption` should be expanded to include explicit `relational_bid`.
- Whether traces should live in the current memory store, a new trace store, or both.
- How much of `Language Realizer` should be deterministic templates versus model-generated text in the first slice.
- Whether `research_debug` is a UI flag, route, or local config setting.
