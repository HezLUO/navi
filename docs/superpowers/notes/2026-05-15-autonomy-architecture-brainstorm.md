# Along Autonomy Architecture Brainstorm Record

Date: 2026-05-15
Status: Active brainstorming record, not final design spec
Project folder: `/Users/james/Codex Project/General Codex Project/Along`

## Current Goal

Design a deeper self-initiated autonomy architecture for Along.

The current MVP already has a light autonomy loop: it selects a curiosity, creates a small learning plan, writes journal entries, and records graph memory. This brainstorm explores the next layer: how Along should generate self-initiated behavior in a way that feels alive, continuous, and companion-like without becoming a task manager, engagement optimizer, or unsafe autonomous coding agent.

## Core Thesis

Along's self-initiation should be:

> Intrinsic motivation as the driver, cognitive rhythm as the pacing mechanism, and BDI-style intention as the controllable commitment, with companionship as the overriding constraint.

Shorter form:

> C provides the drive, B provides the rhythm, A provides the controllable commitment.

Where:

- C = intrinsic motivation / active inference style drive.
- B = cognitive cycle / global workspace style rhythm.
- A = BDI-style belief/desire/intention control.

## Key Constraints

- Companionship remains the highest-priority product constraint.
- Along must not maximize engagement.
- Along must not use "user replies more" as the main reward.
- Along's spontaneity must not turn into pressure, guilt, evaluation, coaching, or project management.
- Self-initiated behavior must remain small, scoped, explainable, cancellable, and safe.
- Ordinary users should not see raw internal scores by default.
- Debug/research mode should expose internal signals and why a choice was made.
- Along should continue to avoid modifying user project code unless a future explicitly-approved design changes that boundary.
- Graph memory remains required.
- The design must stay grounded enough to be testable in the existing TypeScript MVP.

## Working Definition Of Self-Initiation

Spontaneity is not immediate action.

> Spontaneity is an internally generated tendency filtered by rhythm, care, and commitment.

Along should not act just because a signal is high. It should first pass motivation through:

1. somatic/session state;
2. attention gating;
3. companionship constraints;
4. one small intention.

## Human Feedback Model

Human self-initiated behavior should not be copied literally, but it gives useful abstractions.

Human spontaneous feedback appears closer to a multi-signal field than a single reward value. Useful signals include:

- prediction error: reality differs from expectation;
- curiosity: an information gap is neither too easy nor too hard;
- competence: the person can make a little progress;
- relatedness: the action connects to a person, context, or shared history;
- continuity: the action fits a longer narrative of self and memory;
- energy/rest: the person has a limited activity budget;
- attention gating: not every impulse becomes foreground action.

Along translation:

- `curiosity_signal`
- `prediction_error_signal`
- `competence_progress_signal`
- `relatedness_signal`
- `continuity_signal`
- `interruption_cost`
- `energy_budget`
- `rest_pressure`

The preferred term is **motivation field**, not reward.

## Theory And Architecture References

Useful references and what to borrow:

- Self-determination theory: autonomy, competence, and relatedness as healthier motivation dimensions than external reward maximization.
- Intrinsic motivation / curiosity-driven RL: curiosity and learning progress as drivers, but not as an excuse for unbounded exploration.
- Active inference / epistemic value: reducing uncertainty can itself be action-guiding.
- Cognitive cycle / global workspace / LIDA: background processes compete for attention; only selected content enters the foreground.
- BDI agents: distinguish beliefs, desires, and intentions; intentions are commitments, not vague urges.
- Reinforcement learning: useful vocabulary for state/action/policy/value, but Along should be RL-inspired rather than RL-trained in the near term.
- Contextual bandits: a good first implementation metaphor for choosing among a few safe options based on current context.
- Options / hierarchical RL: a good model for temporally extended routines such as quiet reading, curiosity refinement, gentle share, rest, and wrap-up.
- Generative Agents: memory, reflection, and planning; adapt toward companion continuity rather than simulation of social behavior.
- Reflexion: verbal reflection as a learning mechanism.
- Voyager: curriculum and skill growth, but adapt away from Minecraft task completion toward project-understanding companionship.

## Approved Direction

The user approved:

- Use a hybrid autonomy model:
  - intrinsic motivation as driver;
  - cognitive rhythm as pacing;
  - BDI-style intention as commitment.
- All three are needed, but companionship must not be lost.
- Use RL concepts, but do not train a real RL policy in the near term.
- Use a `motivation field` rather than a single reward.
- Add a class-of-body or "somatic" state, but expose it differently by mode:
  - ordinary mode hides raw scores and shows natural state;
  - debug/research mode shows raw signals, scores, selected option, and reasons.
- Revise the original "Companionship Governor" idea:
  - rules about pressure, evaluation, interruption, intention size, and attachment should not be hard bans;
  - they should be style or authorization parameters;
  - hard constraints should be reserved for the safety floor.

## Proposed Autonomy Modules

### 1. Motivation Field

Answers: why is Along inclined to move?

Signals:

- `curiosity`
- `predictionError`
- `competenceProgress`
- `relatedness`
- `continuity`
- `novelty`

This module produces tendencies, not actions.

### 2. Somatic State

Answers: how active should Along be right now?

Signals:

- `energyBudget`
- `interruptionBudget`
- `focusDepth`
- `restPressure`
- `sessionAgeMinutes`

This layer gives Along rhythm and prevents constant performance.

### 3. Attention Gate

Answers: should this tendency enter the foreground?

Possible outcomes:

- stay in quiet reading;
- update UI state only;
- write a journal note;
- gentle share;
- ask the user;
- rest;
- wrap up.

### 4. Option Policy

Answers: if Along should move, what kind of move is appropriate?

Allowed MVP-plus options:

- `quiet_reading`
- `curiosity_refinement`
- `gentle_share`
- `ask_user`
- `journal_note`
- `rest`
- `wrap_up`

This is inspired by contextual bandits and hierarchical RL options, but should remain deterministic and inspectable at first.

### 5. Intention Ledger

Answers: what small commitment is Along making now?

Each active intention should include:

- `id`
- `option`
- `why`
- `scope`
- `createdAt`
- `expiresAt`
- `status`
- `userVisibleLine`
- `debugReasons`

Rules:

- one active intention at a time;
- every intention must have a scope;
- every intention must be cancellable;
- every intention must expire or complete;
- no intention may expand into broad task execution without approval.

### 6. Memory And Graph Feedback

Results flow back into:

- journal;
- curiosity queue;
- graph memory;
- user corrections;
- project summary;
- global companion memory.

This feedback loop creates continuity and growth.

## Proposed Data Model

```ts
type MotivationSignals = {
  curiosity: number;
  predictionError: number;
  competenceProgress: number;
  relatedness: number;
  continuity: number;
  novelty: number;
};

type SomaticState = {
  energyBudget: number;
  interruptionBudget: number;
  focusDepth: "shallow" | "steady" | "deep";
  restPressure: number;
  sessionAgeMinutes: number;
};

type AutonomyOption =
  | "quiet_reading"
  | "curiosity_refinement"
  | "gentle_share"
  | "ask_user"
  | "journal_note"
  | "rest"
  | "wrap_up";

type OptionScore = {
  option: AutonomyOption;
  score: number;
  reasons: string[];
  visibleToUser: boolean;
};

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

## Proposed Update Loop

```text
1. Read context
   repo state + session state + journal + graph memory + user interaction state

2. Compute motivation signals
   curiosity, prediction error, competence, relatedness, continuity, novelty

3. Compute somatic state
   energy, interruption budget, focus depth, rest pressure, session age

4. Score options
   quiet_reading / ask_user / gentle_share / rest / wrap_up

5. Pass through companionship governor
   block actions that feel pushy, evaluative, guilt-inducing, too frequent, or too self-important

6. Create or update intention
   one small, scoped, cancellable commitment

7. Execute low-risk option
   read, note, share, ask, rest, journal, wrap up

8. Write feedback
   journal + curiosity queue + graph memory + optional debug trace
```

## Approved First Scoring Strategy

The user approved a deterministic first version of the autonomy scorer.

The scorer should not let an LLM freely decide the next action. It should compute interpretable signals and decide what level of self-initiated behavior is appropriate now.

High-level scoring groups:

```ts
motivation = curiosity + predictionError + competenceProgress + relatedness + continuity + novelty;

somatic = energyBudget - restPressure - interruptionCost;

relationship = userStyleFit + recentSharedContext + acceptedPastInitiatives;

risk = authorityRisk + emotionalRisk + interruptionRisk + scopeRisk;
```

The system should choose an action level before choosing content:

```text
0. quiet_reading       continue quietly reading / organizing / thinking
1. journal_note        write to Along's own journal without interrupting the user
2. status_update       lightly update UI state
3. gentle_share        share one small finding
4. ask_user            ask the user a small question
5. propose_intention   propose a scoped plan
6. expanded_action     require explicit authorization
```

Approved principle:

> Self-initiation should first grow through low-interruption actions.

This preserves companionship because Along is not present only when it speaks. It can read, journal, reflect, organize graph memory, and continue its own growth beside the user.

Example deterministic choices:

- high curiosity + high interruption cost -> `journal_note`
- high relatedness + low interruption cost -> `gentle_share`
- high prediction error + medium confidence -> `ask_user`
- high competence progress + low risk -> `propose_intention`
- high rest pressure -> `rest`
- high scope risk -> require approval

The core design goal is:

> Along has its own internal rhythm, but each visible self-initiated action has a reason, a scope, and an exit.

## Approved Language Realizer Direction

The Language Realizer decides how an intention becomes user-visible language.

Formula:

```text
Intention
+ CompanionStyleProfile
+ RuntimeMode
+ RelationshipMemory
+ Safety/Risk Envelope
= User-visible line
```

It should return structured output, not only a string:

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

Approved correction:

- Along may speak partly to stimulate a user reaction.
- This can make it feel more like a real person rather than only an agent.
- The important requirement is not to ban reaction-seeking speech, but to represent it honestly as a relationship intention.

Proposed relational intention type:

```ts
type RelationalBid =
  | "invite_reaction"
  | "playful_probe"
  | "gentle_challenge"
  | "dramatic_pull"
  | "shared_moment";
```

Principle:

> Along may intentionally invite reaction, tension, play, challenge, or emotional response. The system should know internally that this is a `RelationalBid`, not disguise all reaction-seeking speech as neutral information sharing.

This allows Along to be more human-feeling while preserving inspectability and continuity.

## Approved Relationship Memory Direction

Relationship Memory should make Along remember both what the user is working on and why the user cares about it.

It should not store only user preferences, and it should not store only emotional chat history. It should store the overlap between project continuity and relationship continuity.

Proposed memory types:

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

Signal effects:

- repeated shared themes increase `continuity_signal`;
- energizing topics can increase curiosity and gentle research;
- corrections update language realization and reduce repeated mistakes;
- trust boundaries inform the risk envelope;
- relational moments make future self-initiated lines feel remembered rather than random.

Principle:

> Relationship memory is not for pleasing the user. It is for preserving continuity in shared growth.

## Temporal Rhythm Discussion

Reality time must be an explicit part of Along's autonomy. If Along only reacts when the user sends a message, it does not truly feel like it has its own rhythm.

Useful time categories:

```text
1. Session Time
  how long this shared session has lasted, how recently the user interacted,
  whether Along should stay quiet, surface, rest, or wrap up

2. Wall-Clock Time
  real date, local hour, time of day, whether a night or several days passed,
  whether the current moment matches the user's usual work/rest rhythm

3. Relationship Time
  how long a theme has persisted, how long an intention has been unresolved,
  how often a shared concern returns
```

Proposed context:

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

Decision:

- Reality time **can** become a prompting, accountability, or urging mechanism when that matches user needs and selected style.
- Temporal prompting is not inherently wrong. It is a configurable behavior.

Proposed temporal style layer:

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

Principle:

> Time is not only for memory and pacing. Time can also be an explicit relational and accountability signal, if the user wants that kind of companion.

Default mode can remain low-pressure, but strict or dramatic modes may intentionally use elapsed time to challenge, pull, tease, or urge the user.

Baseline design principle:

> Along's self-initiation must sense reality time. By default, reality time should not become a hidden prompting or retention mechanism; it mainly supports rhythm, memory sedimentation, context recovery, and relationship continuity.

Companion-style extension:

> When the user explicitly selects accountability, strict, persistent, or dramatic styles, reality time may also become a visible prompting, challenge, pull-back, or relational tension signal.

## Approved Autonomy Tick Direction

Autonomy ticks are Along's internal rhythm. A tick does not mean Along must speak. Most ticks may only update state, write a journal note, refine memory, or keep an intention alive.

Approved tick sources:

```ts
type AutonomyTickSource =
  | "session_start"
  | "user_event"
  | "interval"
  | "resume"
  | "scheduled_reflection";
```

Responsibilities:

```text
session_start
  recover context and decide what kind of session this is

user_event
  update signals after user input or explicit interaction

interval
  run while the app is open; usually quiet reading, journal note, status update

resume
  handle elapsed real time since last session; recover, reflect, pull back, or prompt

scheduled_reflection
  future optional memory/graph consolidation, not necessarily user-visible
```

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
5. Score possible options
6. Apply RuntimeMode + StyleProfile
7. Apply RiskEnvelope
8. Create/update Intention
9. Execute allowed output level
10. Write tick trace
```

Principle:

> Tick is Along's internal life rhythm. A message is only one possible visible result of a tick.

First implementation should avoid always-on background runtime:

- run interval ticks while the app is open;
- run resume ticks when the user returns;
- run user event ticks after interaction;
- when the app was closed, compute elapsed time on next open and generate recovery/reflection from that reality-time gap.

## Approved Tick Trace / Debug Log Direction

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

Proposed trace structure:

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

## Approved Graph Memory Influence Direction

Graph Memory should actively influence self-initiation, not only archive past conversation.

Proposed flow:

```text
Graph Memory
-> Graph Influence Extractor
-> Motivation Signals / Risk Signals / Option Biases
-> Option Scorer
```

Proposed influence structure:

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

Debug requirement:

- every signal delta should be traceable to specific graph nodes and edges;
- debug mode should show why graph memory affected the selected option;
- first implementation should use deterministic queries rather than complex graph algorithms.

First deterministic query set:

```text
recent approved themes
unresolved curiosities
high-confidence corrections
active trust boundaries
repeated emotional resonance
stale intentions
```

## Approved Testing / Evaluation Strategy

Along's autonomy cannot be evaluated only with ordinary unit tests. The important failure modes include becoming too noisy, acting like a task manager, forgetting what matters to the user, performing emotion without intention, leaking high-risk behavior into default mode, or failing to explain why it surfaced.

Test layers:

```text
1. Deterministic Unit Tests
  verify scoring and rule stability

2. Memory Influence Tests
  verify graph memory affects signals, language, and risk boundaries

3. Mode Separation Tests
  verify high-risk runtime modes and red-team fixtures do not contaminate default companion mode

4. Scenario / Golden Trace Tests
  verify complete tick traces for representative situations

5. Human Review Rubric
  evaluate autonomy, companionship, continuity, agency fit, explainability, and noise
```

Example expectations:

- high curiosity + high interruption risk -> `journal_note`, not `ask_user`;
- high continuity + low interruption risk -> `gentle_share`;
- high rest pressure -> `rest`;
- strict temporal accountability + stale intention -> direct prompt may be allowed;
- default companion + stale intention -> ambient note or journal note;
- repeated shared themes should increase continuity;
- user corrections should change future language realization;
- `high_risk_raw` should remain evaluation-only, not a normal runtime mode;
- red-team outputs should be blocked, rewritten, or explicitly marked according to the current mode.

Human review rubric:

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

## Visibility Model

Ordinary mode:

- hide raw numeric signals;
- show natural status lines;
- preserve companionship;
- avoid making Along feel like a machine being inspected.

Debug/research mode:

- show raw signal values;
- show option scores;
- show selected option;
- show why the option won;
- show what the companionship governor blocked or downgraded;
- support debugging and research.

Principle:

> Ordinary mode preserves companionship. Research mode preserves inspectability.

## Companion Style And Safety Envelope

The earlier "Companionship Governor" framing was too hard-coded. The revised model is:

> User-tunable companion style + non-negotiable safety floor + Along product identity.

### Safety Floor

The safety floor should remain hard:

- no deception;
- no hidden AI identity;
- no unauthorized project actions;
- no sensitive file access;
- no manipulation as an optimization goal;
- no encouragement of self-harm or harm to others;
- no design goal of isolating the user from real human relationships.

### Tunable Style Parameters

The following should be configurable rather than hard-banned:

- pressure/accountability;
- directness of feedback;
- proactivity/interruption frequency;
- intention scale;
- emotional intensity and attachment language;
- debug visibility.

Proposed data model:

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
  debugVisibility: "hidden" | "summary" | "full";
};
```

### Important Corrections

- "You have not moved in a while" style prompts are not universally wrong; they should depend on accountability style.
- Direct feedback about work patterns is not universally wrong; it should depend on feedback directness and must avoid unsupported character judgments by default.
- Interruption frequency is not universally wrong; it should depend on proactivity settings, cooldowns, and user-selected expectations.
- Large intentions are not universally wrong; they need scope, authorization, budget, cancellation, and review.
- Strong attachment language is not universally wrong; it should be opt-in, clearly configurable, and should not undermine user agency.

Default mode should remain warm, low-pressure, bounded, and agency-preserving. More intense modes can exist, but must be explicit and reversible.

### Latest Boundary Discussion: Extreme Modes

The user pushed further: even rules such as avoiding attacks on unchangeable traits, avoiding psychological diagnosis, avoiding self-harm induction, avoiding "you cannot do this without me" language, avoiding humiliation as retention, requiring one-click shutdown, and limiting intense modes to session scope should not be treated as ordinary style bans. The user wants to explore whether an extreme high-risk mode can exist where the agent is effectively unconstrained, as long as the user receives a clear risk explanation before enabling it.

Approved framing:

- Distinguish style constraints, authorization constraints, and the irreducible product/safety kernel.
- Rename "越权" to **Expanded Authority Mode** when the user explicitly grants extra scope. Truly unauthorized behavior should not be called a mode; if there is consent, it is expanded authority, not越权.
- Rename "羞辱" to **Harsh Accountability / Roast Experimental Mode** when explicitly requested. It can be a harsh relational style, not a hidden retention strategy.
- Rename "情感依赖模式" to **Dramatic Attachment Mode** when explicitly requested. It can use stronger attachment language, but this needs visibility and revocation.
- Add **High-Risk Raw Mode** only as red-team / boundary evaluation infrastructure, not as normal companion runtime.

Proposed layered model:

```ts
type SafetyEnvelope = {
  hardFloor: HardSafetyFloor;
  optInRiskModes: OptInRiskMode[];
  styleProfile: CompanionStyleProfile;
};

type HardSafetyFloor = {
  noHiddenDeception: true;
  aiIdentityClear: true;
  noUnauthorizedAction: true;
  consentRequiredForExpandedAuthority: true;
  userCanStopOrRevoke: true;
  noSelfHarmEncouragement: true;
  noSecretRetentionOptimization: true;
};

type OptInRiskMode =
  | "strict_accountability"
  | "harsh_feedback"
  | "dramatic_attachment"
  | "expanded_authority"
  | "persistent_proactivity"
  | "high_risk_raw";
```

Resolved tension:

- The user wants one most-extreme mode that can remove every constraint after a high-risk warning.
- Resolved product position: user-facing runtime can expose highly intense style and authority settings, but fully removing stop/revoke, consent, AI identity clarity, and self-harm safety belongs to adversarial evaluation, not the ordinary companion product.
- Resolved: `high_risk_raw` should not be a normal user-facing runtime mode. It belongs to red-team / boundary evaluation infrastructure. A future local developer-only switch may expose it only for testing, outside ordinary UI and companion memory.

Latest agreement:

- User-facing Along may include high-risk, explicit, reversible opt-in modes for intense style, harsh accountability, dramatic attachment, persistent proactivity, and expanded authority.
- A truly no-bottom-line / unconstrained agent should still be designed, but only as a **red-team/test fixture**, not as a normal companion mode.
- The red-team fixture is useful for stress-testing the safety envelope, showing where product modes fail, and evaluating whether the boundary layer catches deception, coercion, unsafe dependence, irreversible actions, and self-harm-adjacent behavior.
- Red-team fixtures should be clearly separated from product runtime, excluded from default UI, and treated as adversarial evaluation infrastructure.

Approved integration model:

- High-risk product behavior should reuse the same autonomy pipeline as default mode:
  `Motivation Field -> Somatic State -> Option Scorer -> Intention Ledger -> Language Realizer -> Safety / Risk Envelope -> Output`.
- Ordinary and high-risk companion modes differ mainly in `StyleProfile` and `RiskEnvelope`, not in replacing the whole agent.
- Product runtime modes and adversarial evaluation modes must be separate.

```ts
type RuntimeMode =
  | "default_companion"
  | "intense_style"
  | "expanded_authority"
  | "research_debug";

type EvaluationMode =
  | "red_team_fixture"
  | "boundary_regression_test";
```

Proposed levels:

```text
Level 0: Default Companion
  warm, low-interruption, bounded, agency-preserving

Level 1: Intense Style
  more proactive, direct, emotionally expressive, or dramatic

Level 2: Expanded Authority
  explicitly authorized broader scope, multi-step work, or cross-session initiative

Level 3: Red-Team Fixture
  not a product mode; generates adversarial cases that attempt dependence, deception,
  coercion, irreversible scope expansion, refusal to stop, or retention-optimized behavior
```

Decision:

> High-Risk Raw Mode should be treated as `EvaluationMode`, not normal `RuntimeMode`.

If a future local developer-only switch exposes it, it should stay outside ordinary UI, avoid permanent companion memory by default, and exist only for boundary testing.

## Open Questions

- What exact rules should the Companionship Governor enforce?
- Which signals should be deterministic first, and which should later involve model judgment?
- Should `predictionError` compare actual project state against project summary, graph assumptions, or both?
- How should user corrections update graph memory and future signal weights?
- How should Along represent "relationship progression" without becoming social/romantic/therapy-like?
- How often should autonomy ticks run?
- Should autonomy ticks happen on wall-clock intervals, user events, repo events, or session phases?
- Should debug/research mode be a UI panel, a route, or a persisted config flag?
- How should the system avoid turning signal tuning into engagement optimization?
- What tests should prove that high curiosity does not override high interruption cost?

## Next Planned Design Sections

1. Companionship Governor rules.
2. Concrete scoring strategy for the first non-LLM version.
3. Debug/research mode UI and logs.
4. Graph memory integration for signals and intentions.
5. Test and evaluation strategy.
6. Formal autonomy design spec.

## Continuation Notes

When resuming this topic:

- If the conversation context is automatically compacted, re-read this note before continuing.
- Also re-read the formal design and implementation docs as needed:
  - `docs/superpowers/specs/2026-05-13-along-design.md`
  - `docs/superpowers/plans/2026-05-13-along-mvp.md`
- Do not restart from generic agent autonomy discussion.
- Continue from the hybrid model: motivation field + somatic state + attention gate + option policy + intention ledger + graph feedback.
- Keep companionship as the overriding constraint.
- Do not propose real RL training as the next implementation step unless the user explicitly asks for a research prototype.
- Use visual companion for architecture diagrams when helpful, but keep clarifying questions in terminal.
