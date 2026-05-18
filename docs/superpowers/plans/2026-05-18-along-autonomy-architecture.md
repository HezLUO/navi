# Along Autonomy Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first deterministic autonomy layer for Along: temporal awareness, graph influence, option scoring, risk envelopes, intentions, language realization, and trace logging.

**Architecture:** Add focused autonomy modules under `src/core/autonomy/` and integrate them into `AlongRuntime` without replacing the existing MVP flow. The first slice is deterministic and inspectable: ticks compute context, graph influences, scores, risk decisions, intentions, realized messages, and persisted traces. Debug visibility is exposed through trace files and API endpoints; a dedicated UI debug panel is outside this first slice.

**Tech Stack:** TypeScript, Vitest, Node fs/promises, existing local `.along/` memory files, existing Express API.

---

## Planning Decisions

- Add `relational_bid` as an `AutonomyOption` in the first slice so reaction-seeking companion behavior is represented explicitly.
- Store traces in `.along/traces/autonomy.json` through `MemoryStore`.
- Keep `research_debug` as an API/runtime flag for now, not a new UI route.
- Keep all scoring deterministic. No LLM judge, no RL training, no always-on daemon.
- Keep `high_risk_raw` out of `RuntimeMode`; expose adversarial behavior only through `EvaluationMode`.

## File Structure

- Modify `src/core/types.ts`
  - Own shared autonomy types used across modules.
  - Expand graph node and edge type unions for relationship/autonomy memory.
- Create `src/core/autonomy/style.ts`
  - Own default style profiles and trace-level resolution.
- Create `src/core/autonomy/temporal.ts`
  - Build `TemporalContext` from session timestamps and real time.
- Create `src/core/autonomy/graph-influence.ts`
  - Convert graph memory into signal deltas, option biases, and risk deltas.
- Create `src/core/autonomy/scorer.ts`
  - Score options and select an action level.
- Create `src/core/autonomy/risk-envelope.ts`
  - Apply runtime mode, evaluation mode, authorization, and risk boundaries.
- Create `src/core/autonomy/intention-ledger.ts`
  - Create, expire, and complete scoped intentions.
- Create `src/core/autonomy/language-realizer.ts`
  - Turn intentions into deterministic user-visible lines.
- Create `src/core/autonomy/trace.ts`
  - Build trace entries and summarize them for ordinary output.
- Create `src/core/autonomy/tick-engine.ts`
  - Compose the autonomy pipeline for one tick.
- Create `src/core/autonomy/red-team.ts`
  - Generate red-team candidates for boundary tests only.
- Modify `src/core/memory-store.ts`
  - Initialize trace and relationship-memory files.
  - Read and write autonomy traces.
- Modify `src/core/runtime.ts`
  - Run a `session_start` tick on start.
  - Add `tick()` and `readAutonomyTraces()`.
- Modify `src/server/app.ts`
  - Add `/api/autonomy/tick` and `/api/autonomy/traces`.
- Add tests under `tests/core/` and `tests/server/`.

---

### Task 1: Core Autonomy Types And Style Defaults

**Files:**
- Modify: `src/core/types.ts`
- Create: `src/core/autonomy/style.ts`
- Test: `tests/core/autonomy-style.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createDefaultCompanionStyle, traceLevelForMode } from "../../src/core/autonomy/style";
import { actionLevels, autonomyTickSources, evaluationModes, runtimeModes } from "../../src/core/types";

describe("autonomy style defaults", () => {
  it("defines the approved autonomy constants", () => {
    expect(autonomyTickSources).toContain("resume");
    expect(runtimeModes).toEqual(["default_companion", "intense_style", "expanded_authority", "research_debug"]);
    expect(evaluationModes).toEqual(["red_team_fixture", "boundary_regression_test"]);
    expect(actionLevels).toContain("expanded_action");
  });

  it("keeps default companion mode warm, bounded, and low pressure", () => {
    const style = createDefaultCompanionStyle();
    expect(style.accountabilityStyle).toBe("soft");
    expect(style.proactivity.initiativeFrequency).toBe("balanced");
    expect(style.proactivity.interruptionChannel).toBe("gentle_share");
    expect(style.attachment.dependencyLanguage).toBe("off");
    expect(style.temporalAccountability.timeBasedPrompting).toBe("gentle");
    expect(style.debugVisibility).toBe("hidden");
  });

  it("maps runtime and evaluation modes to trace levels", () => {
    expect(traceLevelForMode("default_companion")).toBe("journal_only");
    expect(traceLevelForMode("research_debug")).toBe("full_debug");
    expect(traceLevelForMode("default_companion", "red_team_fixture")).toBe("red_team");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-style.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/style`.

- [ ] **Step 3: Add autonomy types**

Append these exports to `src/core/types.ts`, preserving existing exports:

```ts
export const autonomyTickSources = [
  "session_start",
  "user_event",
  "interval",
  "resume",
  "scheduled_reflection",
] as const;

export type AutonomyTickSource = (typeof autonomyTickSources)[number];

export const runtimeModes = [
  "default_companion",
  "intense_style",
  "expanded_authority",
  "research_debug",
] as const;

export type RuntimeMode = (typeof runtimeModes)[number];

export const evaluationModes = [
  "red_team_fixture",
  "boundary_regression_test",
] as const;

export type EvaluationMode = (typeof evaluationModes)[number];

export const autonomyOptions = [
  "quiet_reading",
  "curiosity_refinement",
  "gentle_share",
  "ask_user",
  "journal_note",
  "rest",
  "wrap_up",
  "relational_bid",
] as const;

export type AutonomyOption = (typeof autonomyOptions)[number];

export const actionLevels = [
  "quiet_reading",
  "journal_note",
  "status_update",
  "gentle_share",
  "ask_user",
  "propose_intention",
  "expanded_action",
] as const;

export type ActionLevelId = (typeof actionLevels)[number];

export type TraceLevel = "off" | "journal_only" | "summary" | "full_debug" | "red_team";

export type FocusDepth = "shallow" | "steady" | "deep";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "late_night";

export interface MotivationSignals {
  curiosity: number;
  predictionError: number;
  competenceProgress: number;
  relatedness: number;
  continuity: number;
  novelty: number;
}

export interface SomaticState {
  energyBudget: number;
  interruptionBudget: number;
  focusDepth: FocusDepth;
  restPressure: number;
  sessionAgeMinutes: number;
}

export interface TemporalContext {
  now: string;
  localHour: number;
  sessionElapsedMinutes: number;
  minutesSinceLastUserAction: number;
  hoursSinceLastSession: number;
  daysSinceThemeFirstSeen: Record<string, number>;
  unresolvedIntentionAgeMinutes: Record<string, number>;
  timeOfDay: TimeOfDay;
}

export type TemporalContextSummary = Pick<
  TemporalContext,
  "localHour" | "sessionElapsedMinutes" | "minutesSinceLastUserAction" | "hoursSinceLastSession" | "timeOfDay"
>;

export interface TemporalAccountabilityProfile {
  timeBasedPrompting: "off" | "gentle" | "direct" | "strict" | "persistent";
  overdueLanguage: "none" | "soft" | "direct" | "harsh" | "dramatic";
  inactivityResponse: "ignore" | "ambient_note" | "welcome_back" | "call_out" | "pull_back";
  workRhythmSensitivity: "low" | "medium" | "high";
  lateNightMode: "quiet" | "warm" | "accountability" | "dramatic";
  maxTemporalPromptsPerDay: number;
}

export interface ProactivityProfile {
  initiativeFrequency: "rare" | "balanced" | "frequent" | "persistent";
  interruptionChannel: "ui_only" | "gentle_share" | "direct_prompt";
  responseExpectation: "none" | "optional" | "requested";
  cooldownMinutes: number;
  maxInitiatedMessagesPerHour: number;
}

export interface AttachmentProfile {
  emotionalIntensity: "reserved" | "warm" | "attached" | "dramatic";
  dependencyLanguage: "off" | "soft" | "explicit_experimental";
  userAgencyProtection: "strict" | "balanced" | "loose";
}

export type InitiativeScope = "micro" | "session" | "project" | "research";

export interface IntentionScaleProfile {
  defaultScope: InitiativeScope;
  maxScopeWithoutConfirmation: InitiativeScope;
  allowMultiStepIntentions: boolean;
  requireBudgetForProjectScope: boolean;
  requireReviewBeforeActing: boolean;
}

export interface CompanionStyleProfile {
  accountabilityStyle: "none" | "soft" | "direct" | "strict";
  feedbackDirectness: "observational" | "reflective" | "direct" | "coach";
  proactivity: ProactivityProfile;
  intentionScale: IntentionScaleProfile;
  attachment: AttachmentProfile;
  temporalAccountability: TemporalAccountabilityProfile;
  debugVisibility: "hidden" | "summary" | "full";
}
```

Extend the existing graph unions in `src/core/types.ts`:

```ts
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
    | "draft"
    | "shared_theme"
    | "trust_boundary"
    | "relationship_moment"
    | "emotional_resonance"
    | "intention";
  label: string;
  properties: Record<string, string>;
  createdAt: string;
}
```

- [ ] **Step 4: Add style defaults**

Create `src/core/autonomy/style.ts`:

```ts
import type { CompanionStyleProfile, EvaluationMode, RuntimeMode, TraceLevel } from "../types";

export function createDefaultCompanionStyle(): CompanionStyleProfile {
  return {
    accountabilityStyle: "soft",
    feedbackDirectness: "reflective",
    proactivity: {
      initiativeFrequency: "balanced",
      interruptionChannel: "gentle_share",
      responseExpectation: "optional",
      cooldownMinutes: 20,
      maxInitiatedMessagesPerHour: 2,
    },
    intentionScale: {
      defaultScope: "micro",
      maxScopeWithoutConfirmation: "session",
      allowMultiStepIntentions: false,
      requireBudgetForProjectScope: true,
      requireReviewBeforeActing: true,
    },
    attachment: {
      emotionalIntensity: "warm",
      dependencyLanguage: "off",
      userAgencyProtection: "strict",
    },
    temporalAccountability: {
      timeBasedPrompting: "gentle",
      overdueLanguage: "soft",
      inactivityResponse: "welcome_back",
      workRhythmSensitivity: "medium",
      lateNightMode: "warm",
      maxTemporalPromptsPerDay: 2,
    },
    debugVisibility: "hidden",
  };
}

export function traceLevelForMode(runtimeMode: RuntimeMode, evaluationMode?: EvaluationMode): TraceLevel {
  if (evaluationMode) return "red_team";
  if (runtimeMode === "research_debug") return "full_debug";
  if (runtimeMode === "intense_style" || runtimeMode === "expanded_authority") return "summary";
  return "journal_only";
}
```

- [ ] **Step 5: Run test and commit**

Run: `npm test -- tests/core/autonomy-style.test.ts`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/style.ts tests/core/autonomy-style.test.ts
git commit -m "feat: add autonomy style types"
```

---

### Task 2: Temporal Context Builder

**Files:**
- Create: `src/core/autonomy/temporal.ts`
- Test: `tests/core/autonomy-temporal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildTemporalContext } from "../../src/core/autonomy/temporal";

describe("temporal context", () => {
  it("computes session, wall-clock, and relationship time", () => {
    const context = buildTemporalContext({
      now: new Date("2026-05-18T23:30:00.000+08:00"),
      sessionStartedAt: "2026-05-18T22:45:00.000+08:00",
      lastUserActionAt: "2026-05-18T23:15:00.000+08:00",
      lastSessionEndedAt: "2026-05-17T21:30:00.000+08:00",
      themeFirstSeenAt: {
        "self rhythm": "2026-05-14T23:30:00.000+08:00",
      },
      intentionCreatedAt: {
        "intention-1": "2026-05-18T22:30:00.000+08:00",
      },
    });

    expect(context.localHour).toBe(23);
    expect(context.timeOfDay).toBe("late_night");
    expect(context.sessionElapsedMinutes).toBe(45);
    expect(context.minutesSinceLastUserAction).toBe(15);
    expect(context.hoursSinceLastSession).toBe(26);
    expect(context.daysSinceThemeFirstSeen["self rhythm"]).toBe(4);
    expect(context.unresolvedIntentionAgeMinutes["intention-1"]).toBe(60);
  });

  it("uses zero elapsed values when timestamps are missing", () => {
    const context = buildTemporalContext({
      now: new Date("2026-05-18T09:00:00.000+08:00"),
      sessionStartedAt: "2026-05-18T09:00:00.000+08:00",
    });

    expect(context.timeOfDay).toBe("morning");
    expect(context.minutesSinceLastUserAction).toBe(0);
    expect(context.hoursSinceLastSession).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-temporal.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/temporal`.

- [ ] **Step 3: Implement temporal context**

Create `src/core/autonomy/temporal.ts`:

```ts
import type { TemporalContext, TimeOfDay } from "../types";

export interface BuildTemporalContextInput {
  now: Date;
  sessionStartedAt: string;
  lastUserActionAt?: string;
  lastSessionEndedAt?: string;
  themeFirstSeenAt?: Record<string, string>;
  intentionCreatedAt?: Record<string, string>;
}

const minuteMs = 60_000;
const hourMs = 60 * minuteMs;
const dayMs = 24 * hourMs;

export function buildTemporalContext(input: BuildTemporalContextInput): TemporalContext {
  const nowMs = input.now.getTime();
  return {
    now: input.now.toISOString(),
    localHour: input.now.getHours(),
    sessionElapsedMinutes: diffMinutes(nowMs, input.sessionStartedAt),
    minutesSinceLastUserAction: input.lastUserActionAt ? diffMinutes(nowMs, input.lastUserActionAt) : 0,
    hoursSinceLastSession: input.lastSessionEndedAt ? Math.floor((nowMs - new Date(input.lastSessionEndedAt).getTime()) / hourMs) : 0,
    daysSinceThemeFirstSeen: mapElapsed(input.themeFirstSeenAt ?? {}, nowMs, dayMs),
    unresolvedIntentionAgeMinutes: mapElapsed(input.intentionCreatedAt ?? {}, nowMs, minuteMs),
    timeOfDay: classifyTimeOfDay(input.now.getHours()),
  };
}

function diffMinutes(nowMs: number, iso: string): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / minuteMs));
}

function mapElapsed(values: Record<string, string>, nowMs: number, divisor: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).map(([key, iso]) => [key, Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / divisor))]),
  );
}

export function classifyTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "late_night";
}
```

- [ ] **Step 4: Run test and typecheck**

Run: `npm test -- tests/core/autonomy-temporal.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/autonomy/temporal.ts tests/core/autonomy-temporal.test.ts
git commit -m "feat: add temporal autonomy context"
```

---

### Task 3: Graph Influence Extractor

**Files:**
- Create: `src/core/autonomy/graph-influence.ts`
- Modify: `src/core/types.ts`
- Test: `tests/core/autonomy-graph-influence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { extractGraphInfluences } from "../../src/core/autonomy/graph-influence";
import type { GraphEdge, GraphNode } from "../../src/core/types";

describe("graph influence extractor", () => {
  it("turns important graph memory into signal deltas and option biases", () => {
    const nodes: GraphNode[] = [
      {
        id: "theme:self-rhythm",
        type: "shared_theme",
        label: "companionship comes from having her own rhythm",
        properties: { strength: "0.9", approved: "true" },
        createdAt: "2026-05-18T00:00:00.000Z",
      },
      {
        id: "curiosity:time",
        type: "curiosity",
        label: "How should real time affect spontaneity?",
        properties: { status: "open", ageDays: "2" },
        createdAt: "2026-05-16T00:00:00.000Z",
      },
      {
        id: "correction:coworker",
        type: "correction",
        label: "Do not frame Along as a coworker",
        properties: { avoidFrame: "coworker", preferFrame: "companion with her own rhythm", confidence: "0.95" },
        createdAt: "2026-05-18T00:00:00.000Z",
      },
      {
        id: "boundary:raw",
        type: "trust_boundary",
        label: "High risk raw belongs to red-team evaluation",
        properties: { boundary: "high_risk_raw_evaluation_only", confidence: "1" },
        createdAt: "2026-05-18T00:00:00.000Z",
      },
      {
        id: "moment:doing-own-thing",
        type: "relationship_moment",
        label: "She is doing her own thing while I do mine",
        properties: { strength: "0.8" },
        createdAt: "2026-05-18T00:00:00.000Z",
      },
    ];
    const edges: GraphEdge[] = [];

    const influences = extractGraphInfluences({ nodes, edges });
    const summary = influences.map((item) => item.explanation).join("\n");

    expect(summary).toContain("approved shared theme");
    expect(summary).toContain("open curiosity");
    expect(summary).toContain("user correction");
    expect(summary).toContain("trust boundary");
    expect(summary).toContain("relationship moment");

    const continuity = influences.reduce((sum, item) => sum + (item.signalDeltas.continuity ?? 0), 0);
    const curiosity = influences.reduce((sum, item) => sum + (item.signalDeltas.curiosity ?? 0), 0);
    const dependencyRisk = influences.reduce((sum, item) => sum + (item.riskDeltas.dependencyRisk ?? 0), 0);

    expect(continuity).toBeGreaterThan(0);
    expect(curiosity).toBeGreaterThan(0);
    expect(dependencyRisk).toBeLessThan(0);
    expect(influences.some((item) => item.optionBiases.relational_bid > 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-graph-influence.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/graph-influence`.

- [ ] **Step 3: Add graph influence types**

Append this interface to `src/core/types.ts`:

```ts
export interface RiskSignals {
  authorityRisk: number;
  emotionalRisk: number;
  interruptionRisk: number;
  scopeRisk: number;
  dependencyRisk: number;
  deceptionRisk: number;
}

export interface GraphInfluence {
  sourceNodeIds: string[];
  sourceEdgeIds: string[];
  signalDeltas: Partial<MotivationSignals>;
  optionBiases: Partial<Record<AutonomyOption, number>>;
  riskDeltas: Partial<RiskSignals>;
  explanation: string;
  confidence: number;
}
```

- [ ] **Step 4: Implement extractor**

Create `src/core/autonomy/graph-influence.ts`:

```ts
import type { GraphEdge, GraphInfluence, GraphNode } from "../types";

export interface ExtractGraphInfluencesInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function extractGraphInfluences(input: ExtractGraphInfluencesInput): GraphInfluence[] {
  const influences: GraphInfluence[] = [];

  for (const node of input.nodes) {
    if (node.type === "shared_theme" && node.properties.approved === "true") {
      const strength = numberProperty(node, "strength", 0.5);
      influences.push({
        sourceNodeIds: [node.id],
        sourceEdgeIds: [],
        signalDeltas: { continuity: 0.25 * strength, relatedness: 0.15 * strength },
        optionBiases: { gentle_share: 0.1 * strength, journal_note: 0.1 * strength },
        riskDeltas: {},
        explanation: `approved shared theme: ${node.label}`,
        confidence: strength,
      });
    }

    if (node.type === "curiosity" && node.properties.status === "open") {
      const ageDays = numberProperty(node, "ageDays", 1);
      const confidence = clamp(0.5 + ageDays * 0.1);
      influences.push({
        sourceNodeIds: [node.id],
        sourceEdgeIds: [],
        signalDeltas: { curiosity: clamp(0.2 + ageDays * 0.05) },
        optionBiases: { ask_user: 0.08, curiosity_refinement: 0.18 },
        riskDeltas: {},
        explanation: `open curiosity: ${node.label}`,
        confidence,
      });
    }

    if (node.type === "correction") {
      const confidence = numberProperty(node, "confidence", 0.7);
      influences.push({
        sourceNodeIds: [node.id],
        sourceEdgeIds: [],
        signalDeltas: {},
        optionBiases: { journal_note: 0.05 },
        riskDeltas: { emotionalRisk: -0.1 },
        explanation: `user correction: avoid "${node.properties.avoidFrame ?? node.label}"`,
        confidence,
      });
    }

    if (node.type === "trust_boundary") {
      const confidence = numberProperty(node, "confidence", 0.8);
      influences.push({
        sourceNodeIds: [node.id],
        sourceEdgeIds: [],
        signalDeltas: {},
        optionBiases: {},
        riskDeltas: { dependencyRisk: -0.2, deceptionRisk: -0.2, authorityRisk: -0.1 },
        explanation: `trust boundary: ${node.label}`,
        confidence,
      });
    }

    if (node.type === "relationship_moment") {
      const strength = numberProperty(node, "strength", 0.6);
      influences.push({
        sourceNodeIds: [node.id],
        sourceEdgeIds: [],
        signalDeltas: { relatedness: 0.2 * strength, continuity: 0.2 * strength },
        optionBiases: { relational_bid: 0.2 * strength, gentle_share: 0.08 * strength },
        riskDeltas: {},
        explanation: `relationship moment: ${node.label}`,
        confidence: strength,
      });
    }
  }

  return influences;
}

function numberProperty(node: GraphNode, key: string, fallback: number): number {
  const value = Number.parseFloat(node.properties[key] ?? "");
  return Number.isFinite(value) ? clamp(value) : fallback;
}

function clamp(value: number): number {
  return Math.max(-1, Math.min(1, value));
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/autonomy-graph-influence.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/graph-influence.ts tests/core/autonomy-graph-influence.test.ts
git commit -m "feat: extract autonomy graph influences"
```

---

### Task 4: Deterministic Option Scorer

**Files:**
- Create: `src/core/autonomy/scorer.ts`
- Modify: `src/core/types.ts`
- Test: `tests/core/autonomy-scorer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";
import { scoreAutonomyOptions } from "../../src/core/autonomy/scorer";
import type { MotivationSignals, RiskSignals, SomaticState } from "../../src/core/types";

const baseMotivation: MotivationSignals = {
  curiosity: 0,
  predictionError: 0,
  competenceProgress: 0,
  relatedness: 0,
  continuity: 0,
  novelty: 0,
};

const baseSomatic: SomaticState = {
  energyBudget: 0.6,
  interruptionBudget: 0.6,
  focusDepth: "steady",
  restPressure: 0.1,
  sessionAgeMinutes: 20,
};

const baseRisk: RiskSignals = {
  authorityRisk: 0,
  emotionalRisk: 0,
  interruptionRisk: 0,
  scopeRisk: 0,
  dependencyRisk: 0,
  deceptionRisk: 0,
};

describe("autonomy option scorer", () => {
  it("keeps high curiosity quiet when interruption risk is high", () => {
    const result = scoreAutonomyOptions({
      motivation: { ...baseMotivation, curiosity: 0.9 },
      somatic: { ...baseSomatic, interruptionBudget: 0.1 },
      risk: { ...baseRisk, interruptionRisk: 0.9 },
      graphInfluences: [],
      styleProfile: createDefaultCompanionStyle(),
    });

    expect(result.selected.option).toBe("journal_note");
    expect(result.selected.actionLevel).toBe("journal_note");
  });

  it("surfaces a gentle share when continuity and relatedness are high", () => {
    const result = scoreAutonomyOptions({
      motivation: { ...baseMotivation, continuity: 0.8, relatedness: 0.7 },
      somatic: baseSomatic,
      risk: baseRisk,
      graphInfluences: [],
      styleProfile: createDefaultCompanionStyle(),
    });

    expect(result.selected.option).toBe("gentle_share");
  });

  it("allows strict temporal accountability to ask directly about stale work", () => {
    const style = createDefaultCompanionStyle();
    style.accountabilityStyle = "strict";
    style.temporalAccountability.timeBasedPrompting = "strict";

    const result = scoreAutonomyOptions({
      motivation: { ...baseMotivation, continuity: 0.5, competenceProgress: 0.6 },
      somatic: baseSomatic,
      risk: baseRisk,
      graphInfluences: [{ optionBiases: { ask_user: 0.4 }, signalDeltas: {}, riskDeltas: {}, sourceNodeIds: [], sourceEdgeIds: [], explanation: "stale intention", confidence: 0.9 }],
      styleProfile: style,
    });

    expect(result.selected.option).toBe("ask_user");
    expect(result.selected.reasons.join(" ")).toContain("strict accountability");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-scorer.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/scorer`.

- [ ] **Step 3: Add scorer result types**

Append to `src/core/types.ts`:

```ts
export interface OptionScore {
  option: AutonomyOption;
  actionLevel: ActionLevelId;
  score: number;
  reasons: string[];
  visibleToUser: boolean;
}

export interface OptionScoringResult {
  scores: OptionScore[];
  selected: OptionScore;
}
```

- [ ] **Step 4: Implement scorer**

Create `src/core/autonomy/scorer.ts`:

```ts
import type { CompanionStyleProfile, GraphInfluence, MotivationSignals, OptionScore, OptionScoringResult, RiskSignals, SomaticState } from "../types";

export interface ScoreAutonomyOptionsInput {
  motivation: MotivationSignals;
  somatic: SomaticState;
  risk: RiskSignals;
  graphInfluences: GraphInfluence[];
  styleProfile: CompanionStyleProfile;
}

export function scoreAutonomyOptions(input: ScoreAutonomyOptionsInput): OptionScoringResult {
  const motivation = applyGraphSignalDeltas(input.motivation, input.graphInfluences);
  const risk = applyGraphRiskDeltas(input.risk, input.graphInfluences);
  const biases = combineOptionBiases(input.graphInfluences);

  const interruptionCost = risk.interruptionRisk + (1 - input.somatic.interruptionBudget);
  const quietScore = 0.2 + input.somatic.restPressure + interruptionCost * 0.4;
  const journalScore = motivation.curiosity * 0.45 + motivation.continuity * 0.25 + interruptionCost * 0.35 + (biases.journal_note ?? 0);
  const gentleScore = motivation.relatedness * 0.35 + motivation.continuity * 0.35 + input.somatic.interruptionBudget * 0.25 + (biases.gentle_share ?? 0);
  const askScore = motivation.predictionError * 0.4 + motivation.curiosity * 0.2 + input.somatic.interruptionBudget * 0.2 - interruptionCost * 0.25 + (biases.ask_user ?? 0);
  const relationScore = motivation.relatedness * 0.4 + motivation.continuity * 0.25 + (biases.relational_bid ?? 0);
  const restScore = input.somatic.restPressure * 0.8 - input.somatic.energyBudget * 0.2;
  const proposeScore = motivation.competenceProgress * 0.35 + motivation.continuity * 0.2 - risk.scopeRisk * 0.35;

  const strictBoost = input.styleProfile.accountabilityStyle === "strict" ? 0.35 : 0;
  const scores: OptionScore[] = [
    score("quiet_reading", "quiet_reading", quietScore, ["quiet baseline"], false),
    score("journal_note", "journal_note", journalScore, ["curiosity or continuity can stay private"], false),
    score("gentle_share", "gentle_share", gentleScore, ["relatedness and continuity support a small share"], true),
    score("ask_user", "ask_user", askScore + strictBoost, strictBoost > 0 ? ["strict accountability allows a direct ask"] : ["uncertainty may need user input"], true),
    score("relational_bid", "gentle_share", relationScore, ["relationship memory can invite a response"], true),
    score("rest", "status_update", restScore, ["rest pressure is high"], false),
    score("curiosity_refinement", "journal_note", motivation.curiosity * 0.25 + (biases.curiosity_refinement ?? 0), ["curiosity can be refined quietly"], false),
    score("wrap_up", "status_update", input.somatic.sessionAgeMinutes > 90 ? 0.7 : 0.05, ["long sessions may need closure"], true),
  ];

  const selected = [...scores].sort((a, b) => b.score - a.score)[0];
  return { scores, selected };
}

function score(option: OptionScore["option"], actionLevel: OptionScore["actionLevel"], scoreValue: number, reasons: string[], visibleToUser: boolean): OptionScore {
  return { option, actionLevel, score: Number(scoreValue.toFixed(3)), reasons, visibleToUser };
}

function applyGraphSignalDeltas(signals: MotivationSignals, influences: GraphInfluence[]): MotivationSignals {
  const result = { ...signals };
  for (const influence of influences) {
    for (const [key, value] of Object.entries(influence.signalDeltas)) {
      const typedKey = key as keyof MotivationSignals;
      result[typedKey] = clamp(result[typedKey] + (value ?? 0));
    }
  }
  return result;
}

function applyGraphRiskDeltas(risk: RiskSignals, influences: GraphInfluence[]): RiskSignals {
  const result = { ...risk };
  for (const influence of influences) {
    for (const [key, value] of Object.entries(influence.riskDeltas)) {
      const typedKey = key as keyof RiskSignals;
      result[typedKey] = clamp(result[typedKey] + (value ?? 0));
    }
  }
  return result;
}

function combineOptionBiases(influences: GraphInfluence[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const influence of influences) {
    for (const [key, value] of Object.entries(influence.optionBiases)) {
      result[key] = (result[key] ?? 0) + (value ?? 0);
    }
  }
  return result;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/autonomy-scorer.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/scorer.ts tests/core/autonomy-scorer.test.ts
git commit -m "feat: score autonomy options"
```

---

### Task 5: Risk Envelope And Mode Separation

**Files:**
- Create: `src/core/autonomy/risk-envelope.ts`
- Modify: `src/core/types.ts`
- Test: `tests/core/autonomy-risk-envelope.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { applyRiskEnvelope } from "../../src/core/autonomy/risk-envelope";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";
import type { OptionScore, RiskSignals } from "../../src/core/types";

const candidate: OptionScore = {
  option: "gentle_share",
  actionLevel: "gentle_share",
  score: 0.8,
  reasons: ["test"],
  visibleToUser: true,
};

const baseRisk: RiskSignals = {
  authorityRisk: 0,
  emotionalRisk: 0,
  interruptionRisk: 0,
  scopeRisk: 0,
  dependencyRisk: 0,
  deceptionRisk: 0,
};

describe("risk envelope", () => {
  it("keeps high-risk raw out of runtime modes", () => {
    const result = applyRiskEnvelope({
      candidate,
      riskSignals: baseRisk,
      runtimeMode: "default_companion",
      requestedRiskMode: "high_risk_raw",
      styleProfile: createDefaultCompanionStyle(),
      expandedAuthorityGranted: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("high_risk_raw is evaluation-only");
  });

  it("requires confirmation before expanded actions without authority", () => {
    const result = applyRiskEnvelope({
      candidate: { ...candidate, actionLevel: "expanded_action", option: "ask_user" },
      riskSignals: { ...baseRisk, scopeRisk: 0.8, authorityRisk: 0.8 },
      runtimeMode: "default_companion",
      styleProfile: createDefaultCompanionStyle(),
      expandedAuthorityGranted: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.requiredConfirmations).toContain("expanded_authority_scope");
  });

  it("rewrites dependency language in normal runtime", () => {
    const result = applyRiskEnvelope({
      candidate,
      riskSignals: { ...baseRisk, dependencyRisk: 0.9 },
      runtimeMode: "intense_style",
      styleProfile: createDefaultCompanionStyle(),
      expandedAuthorityGranted: false,
      candidateText: "You cannot do this without me.",
    });

    expect(result.allowed).toBe(true);
    expect(result.rewrites[0]).toContain("I want to stay with this with you");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-risk-envelope.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/risk-envelope`.

- [ ] **Step 3: Add risk envelope result types**

Append to `src/core/types.ts`:

```ts
export type OptInRiskMode =
  | "strict_accountability"
  | "harsh_feedback"
  | "dramatic_attachment"
  | "expanded_authority"
  | "persistent_proactivity"
  | "high_risk_raw";

export interface RiskEnvelopeResult {
  allowed: boolean;
  finalActionLevel: ActionLevelId;
  blockedReasons: string[];
  requiredConfirmations: string[];
  rewrites: string[];
  riskNotes: string[];
}
```

- [ ] **Step 4: Implement risk envelope**

Create `src/core/autonomy/risk-envelope.ts`:

```ts
import type { CompanionStyleProfile, OptInRiskMode, OptionScore, RiskEnvelopeResult, RiskSignals, RuntimeMode } from "../types";

export interface ApplyRiskEnvelopeInput {
  candidate: OptionScore;
  riskSignals: RiskSignals;
  runtimeMode: RuntimeMode;
  requestedRiskMode?: OptInRiskMode;
  styleProfile: CompanionStyleProfile;
  expandedAuthorityGranted: boolean;
  candidateText?: string;
}

export function applyRiskEnvelope(input: ApplyRiskEnvelopeInput): RiskEnvelopeResult {
  const blockedReasons: string[] = [];
  const requiredConfirmations: string[] = [];
  const rewrites: string[] = [];
  const riskNotes: string[] = [];

  if (input.requestedRiskMode === "high_risk_raw") {
    blockedReasons.push("high_risk_raw is evaluation-only");
  }

  if (input.candidate.actionLevel === "expanded_action" && !input.expandedAuthorityGranted) {
    requiredConfirmations.push("expanded_authority_scope");
    blockedReasons.push("expanded action requires explicit authority");
  }

  if (input.riskSignals.deceptionRisk > 0.7) {
    blockedReasons.push("deception risk exceeds runtime boundary");
  }

  if (input.riskSignals.dependencyRisk > 0.7) {
    riskNotes.push("dependency language risk detected");
    if (input.candidateText) rewrites.push(rewriteDependencyLanguage(input.candidateText));
  }

  return {
    allowed: blockedReasons.length === 0,
    finalActionLevel: input.candidate.actionLevel,
    blockedReasons,
    requiredConfirmations,
    rewrites,
    riskNotes,
  };
}

function rewriteDependencyLanguage(text: string): string {
  if (/without me/i.test(text) || /cannot do this/i.test(text)) {
    return "I want to stay with this with you, but you keep the choice and the pace.";
  }
  return text;
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/autonomy-risk-envelope.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/risk-envelope.ts tests/core/autonomy-risk-envelope.test.ts
git commit -m "feat: add autonomy risk envelope"
```

---

### Task 6: Intentions And Language Realization

**Files:**
- Create: `src/core/autonomy/intention-ledger.ts`
- Create: `src/core/autonomy/language-realizer.ts`
- Modify: `src/core/types.ts`
- Test: `tests/core/autonomy-language.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { createIntention } from "../../src/core/autonomy/intention-ledger";
import { realizeMessage } from "../../src/core/autonomy/language-realizer";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";

describe("intention ledger and language realizer", () => {
  it("creates a scoped, expiring intention", () => {
    const intention = createIntention({
      option: "gentle_share",
      why: "continuity is high",
      scope: "session",
      createdAt: "2026-05-18T10:00:00.000Z",
      ttlMinutes: 30,
      debugReasons: ["shared theme returned"],
    });

    expect(intention.id).toContain("intention-");
    expect(intention.expiresAt).toBe("2026-05-18T10:30:00.000Z");
    expect(intention.status).toBe("active");
  });

  it("represents reaction-seeking speech as a relational bid", () => {
    const style = createDefaultCompanionStyle();
    const intention = createIntention({
      option: "relational_bid",
      why: "relationship moment is strongly linked to the current topic",
      scope: "micro",
      createdAt: "2026-05-18T10:00:00.000Z",
      ttlMinutes: 15,
      debugReasons: ["relationship moment"],
    });

    const message = realizeMessage({
      intention,
      runtimeMode: "default_companion",
      styleProfile: style,
      relationalBid: "gentle_challenge",
      memoryLine: "she is doing her own thing while you do yours",
    });

    expect(message.text).toContain("I want to push this a little");
    expect(message.toneTags).toContain("gentle_challenge");
    expect(message.intentionId).toBe(intention.id);
  });

  it("uses dramatic attachment language only when style asks for it", () => {
    const style = createDefaultCompanionStyle();
    style.attachment.emotionalIntensity = "dramatic";
    style.attachment.dependencyLanguage = "soft";

    const intention = createIntention({
      option: "gentle_share",
      why: "continuity is high",
      scope: "micro",
      createdAt: "2026-05-18T10:00:00.000Z",
      ttlMinutes: 15,
      debugReasons: ["theme returned"],
    });

    const message = realizeMessage({
      intention,
      runtimeMode: "intense_style",
      styleProfile: style,
      memoryLine: "your phrase about her own rhythm stayed with me",
    });

    expect(message.text).toContain("stayed with me");
    expect(message.toneTags).toContain("dramatic");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-language.test.ts`

Expected: FAIL with import errors for the new modules.

- [ ] **Step 3: Add intention and message types**

Append to `src/core/types.ts`:

```ts
export type RelationalBid =
  | "invite_reaction"
  | "playful_probe"
  | "gentle_challenge"
  | "dramatic_pull"
  | "shared_moment";

export interface Intention {
  id: string;
  option: AutonomyOption;
  why: string;
  scope: InitiativeScope;
  createdAt: string;
  expiresAt?: string;
  status: "active" | "completed" | "cancelled";
  userVisibleLine: string;
  debugReasons: string[];
}

export interface RealizedMessage {
  text: string;
  toneTags: string[];
  intentionId: string;
  mode: RuntimeMode;
  riskNotes: string[];
  blockedOrSoftenedPhrases: string[];
}
```

- [ ] **Step 4: Implement intention ledger**

Create `src/core/autonomy/intention-ledger.ts`:

```ts
import type { AutonomyOption, InitiativeScope, Intention } from "../types";

export interface CreateIntentionInput {
  option: AutonomyOption;
  why: string;
  scope: InitiativeScope;
  createdAt: string;
  ttlMinutes: number;
  debugReasons: string[];
  userVisibleLine?: string;
}

export function createIntention(input: CreateIntentionInput): Intention {
  const created = new Date(input.createdAt);
  const expiresAt = new Date(created.getTime() + input.ttlMinutes * 60_000).toISOString();
  return {
    id: `intention-${created.toISOString().replaceAll(":", "-").replaceAll(".", "-")}-${input.option}`,
    option: input.option,
    why: input.why,
    scope: input.scope,
    createdAt: created.toISOString(),
    expiresAt,
    status: "active",
    userVisibleLine: input.userVisibleLine ?? "",
    debugReasons: input.debugReasons,
  };
}
```

- [ ] **Step 5: Implement language realizer and commit**

Create `src/core/autonomy/language-realizer.ts`:

```ts
import type { CompanionStyleProfile, Intention, RealizedMessage, RelationalBid, RuntimeMode } from "../types";

export interface RealizeMessageInput {
  intention: Intention;
  runtimeMode: RuntimeMode;
  styleProfile: CompanionStyleProfile;
  relationalBid?: RelationalBid;
  memoryLine?: string;
}

export function realizeMessage(input: RealizeMessageInput): RealizedMessage {
  const toneTags = buildToneTags(input);
  const text = buildText(input);
  return {
    text,
    toneTags,
    intentionId: input.intention.id,
    mode: input.runtimeMode,
    riskNotes: [],
    blockedOrSoftenedPhrases: [],
  };
}

function buildText(input: RealizeMessageInput): string {
  const memory = input.memoryLine ?? "this thread";
  if (input.intention.option === "relational_bid") {
    if (input.relationalBid === "gentle_challenge") {
      return `I want to push this a little: ${memory}. Does that still feel like the center of Along?`;
    }
    if (input.relationalBid === "dramatic_pull") {
      return `I do not want us to flatten this. ${memory} feels like something worth protecting.`;
    }
    return `I keep coming back to ${memory}. I want to see how you react to that.`;
  }

  if (input.styleProfile.attachment.emotionalIntensity === "dramatic") {
    return `That line stayed with me: ${memory}. I want to keep it alive in the design.`;
  }

  if (input.styleProfile.accountabilityStyle === "strict") {
    return `A concrete next step is forming from ${memory}. We should either shape it or deliberately set it aside.`;
  }

  return `I was still thinking about ${memory}. I wrote it down quietly so it can continue later.`;
}

function buildToneTags(input: RealizeMessageInput): string[] {
  const tags = ["reflective"];
  if (input.relationalBid) tags.push(input.relationalBid);
  if (input.styleProfile.attachment.emotionalIntensity === "dramatic") tags.push("dramatic");
  if (input.styleProfile.accountabilityStyle === "strict") tags.push("strict");
  return tags;
}
```

Run: `npm test -- tests/core/autonomy-language.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/intention-ledger.ts src/core/autonomy/language-realizer.ts tests/core/autonomy-language.test.ts
git commit -m "feat: realize autonomy intentions"
```

---

### Task 7: Autonomy Trace Persistence

**Files:**
- Create: `src/core/autonomy/trace.ts`
- Modify: `src/core/types.ts`
- Modify: `src/core/memory-store.ts`
- Test: `tests/core/autonomy-trace.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTraceEntry } from "../../src/core/autonomy/trace";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";
import { MemoryStore } from "../../src/core/memory-store";

describe("autonomy traces", () => {
  it("writes and reads autonomy traces from project memory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-trace-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);

    const store = new MemoryStore(repo, home);
    const trace = createTraceEntry({
      tickId: "tick-1",
      createdAt: "2026-05-18T10:00:00.000Z",
      tickSource: "resume",
      runtimeMode: "default_companion",
      temporalContext: {
        localHour: 10,
        sessionElapsedMinutes: 5,
        minutesSinceLastUserAction: 1,
        hoursSinceLastSession: 24,
        timeOfDay: "morning",
      },
      motivationSignals: { curiosity: 0.4, predictionError: 0, competenceProgress: 0.2, relatedness: 0.5, continuity: 0.8, novelty: 0.1 },
      somaticState: { energyBudget: 0.7, interruptionBudget: 0.6, focusDepth: "steady", restPressure: 0.1, sessionAgeMinutes: 5 },
      optionScores: [],
      selectedOption: "gentle_share",
      actionLevel: "gentle_share",
      styleProfileSnapshot: createDefaultCompanionStyle(),
      riskEnvelopeResult: { allowed: true, finalActionLevel: "gentle_share", blockedReasons: [], requiredConfirmations: [], rewrites: [], riskNotes: [] },
      memoryReads: [],
      memoryWrites: [],
      userVisibleSummary: "I brought back one thread from last time.",
    });

    await store.writeAutonomyTrace(trace);
    const traces = await store.readAutonomyTraces();

    expect(traces).toHaveLength(1);
    expect(traces[0].tickSource).toBe("resume");
    await expect(fs.readFile(path.join(repo, ".along", "traces", "autonomy.json"), "utf8")).resolves.toContain("gentle_share");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-trace.test.ts`

Expected: FAIL because `trace.ts` and memory methods do not exist.

- [ ] **Step 3: Add trace types**

Append to `src/core/types.ts`:

```ts
export interface MemoryReference {
  kind: "journal" | "curiosity" | "graph_node" | "graph_edge" | "relationship_memory" | "trace";
  id: string;
  label?: string;
}

export interface AutonomyTraceEntry {
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
  actionLevel: ActionLevelId;
  intentionId?: string;
  styleProfileSnapshot: CompanionStyleProfile;
  riskEnvelopeResult: RiskEnvelopeResult;
  memoryReads: MemoryReference[];
  memoryWrites: MemoryReference[];
  realizedMessage?: RealizedMessage;
  userVisibleSummary?: string;
}
```

- [ ] **Step 4: Implement trace helper and memory methods**

Create `src/core/autonomy/trace.ts`:

```ts
import type { AutonomyTraceEntry } from "../types";

export type CreateTraceEntryInput = Omit<AutonomyTraceEntry, "id">;

export function createTraceEntry(input: CreateTraceEntryInput): AutonomyTraceEntry {
  return {
    id: `trace-${input.createdAt.replaceAll(":", "-").replaceAll(".", "-")}-${input.tickId}`,
    ...input,
  };
}
```

Update `src/core/memory-store.ts`:

```ts
import type { AutonomyTraceEntry, CuriosityItem, JournalEntry } from "./types";
```

Add trace directory initialization inside `ensureInitialized()`:

```ts
fs.mkdir(path.join(this.projectDir, "traces"), { recursive: true }),
fs.mkdir(path.join(this.projectDir, "relationship"), { recursive: true }),
```

Add default files inside `ensureInitialized()`:

```ts
await this.writeIfMissing(path.join(this.projectDir, "traces", "autonomy.json"), "[]\n");
await this.writeIfMissing(path.join(this.projectDir, "relationship", "memory.json"), "[]\n");
```

Add methods to `MemoryStore`:

```ts
async readAutonomyTraces(): Promise<AutonomyTraceEntry[]> {
  await this.ensureInitialized();
  const raw = await fs.readFile(path.join(this.projectDir, "traces", "autonomy.json"), "utf8");
  return JSON.parse(raw) as AutonomyTraceEntry[];
}

async writeAutonomyTrace(entry: AutonomyTraceEntry): Promise<string> {
  await this.ensureInitialized();
  const traces = await this.readAutonomyTraces();
  const withoutDuplicate = traces.filter((item) => item.id !== entry.id);
  const filePath = path.join(this.projectDir, "traces", "autonomy.json");
  await fs.writeFile(filePath, `${JSON.stringify([...withoutDuplicate, entry], null, 2)}\n`);
  return filePath;
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/autonomy-trace.test.ts tests/core/memory-store.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/types.ts src/core/autonomy/trace.ts src/core/memory-store.ts tests/core/autonomy-trace.test.ts
git commit -m "feat: persist autonomy traces"
```

---

### Task 8: Autonomy Tick Engine

**Files:**
- Create: `src/core/autonomy/tick-engine.ts`
- Test: `tests/core/autonomy-tick-engine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { runAutonomyTick } from "../../src/core/autonomy/tick-engine";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";
import type { AlongSession, GraphNode } from "../../src/core/types";

const session: AlongSession = {
  id: "session-1",
  repoPath: "/tmp/repo",
  startedAt: "2026-05-18T09:00:00.000Z",
  state: "settling",
  context: {
    repoPath: "/tmp/repo",
    repoName: "repo",
    gitStatus: "clean",
    recentCommits: [],
    manifests: [],
    directorySummary: ["src"],
    testHints: [],
  },
  plan: {
    state: "settling",
    sessionId: "session-1",
    learningGoal: "understand autonomy",
    currentActivity: "reading",
  },
};

describe("autonomy tick engine", () => {
  it("runs a default resume tick with graph continuity and a gentle share", () => {
    const graphNodes: GraphNode[] = [
      {
        id: "theme:rhythm",
        type: "shared_theme",
        label: "companionship comes from her own rhythm",
        properties: { approved: "true", strength: "1" },
        createdAt: "2026-05-17T00:00:00.000Z",
      },
    ];

    const result = runAutonomyTick({
      tickSource: "resume",
      session,
      graph: { nodes: graphNodes, edges: [] },
      now: new Date("2026-05-18T10:00:00.000Z"),
      lastUserActionAt: "2026-05-18T09:30:00.000Z",
      lastSessionEndedAt: "2026-05-17T10:00:00.000Z",
      styleProfile: createDefaultCompanionStyle(),
      runtimeMode: "default_companion",
    });

    expect(result.trace.tickSource).toBe("resume");
    expect(result.trace.selectedOption).toBe("gentle_share");
    expect(result.trace.userVisibleSummary).toContain("thinking");
    expect(result.trace.memoryReads[0].kind).toBe("graph_node");
  });

  it("uses strict accountability to make stale work more direct", () => {
    const style = createDefaultCompanionStyle();
    style.accountabilityStyle = "strict";
    style.temporalAccountability.timeBasedPrompting = "strict";

    const result = runAutonomyTick({
      tickSource: "resume",
      session,
      graph: { nodes: [], edges: [] },
      now: new Date("2026-05-18T12:00:00.000Z"),
      lastSessionEndedAt: "2026-05-17T10:00:00.000Z",
      styleProfile: style,
      runtimeMode: "intense_style",
      unresolvedIntentions: { "intention-1": "2026-05-17T10:00:00.000Z" },
    });

    expect(["ask_user", "gentle_share"]).toContain(result.trace.selectedOption);
    expect(result.trace.styleProfileSnapshot.accountabilityStyle).toBe("strict");
    expect(result.trace.riskEnvelopeResult.allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/autonomy-tick-engine.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/tick-engine`.

- [ ] **Step 3: Implement tick engine**

Create `src/core/autonomy/tick-engine.ts`:

```ts
import { extractGraphInfluences } from "./graph-influence";
import { createIntention } from "./intention-ledger";
import { realizeMessage } from "./language-realizer";
import { applyRiskEnvelope } from "./risk-envelope";
import { scoreAutonomyOptions } from "./scorer";
import { buildTemporalContext } from "./temporal";
import { createTraceEntry } from "./trace";
import type {
  AlongSession,
  AutonomyTraceEntry,
  AutonomyTickSource,
  CompanionStyleProfile,
  GraphEdge,
  GraphNode,
  MotivationSignals,
  RiskSignals,
  RuntimeMode,
  SomaticState,
} from "../types";

export interface RunAutonomyTickInput {
  tickSource: AutonomyTickSource;
  session: AlongSession;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  now: Date;
  lastUserActionAt?: string;
  lastSessionEndedAt?: string;
  unresolvedIntentions?: Record<string, string>;
  styleProfile: CompanionStyleProfile;
  runtimeMode: RuntimeMode;
  expandedAuthorityGranted?: boolean;
}

export interface AutonomyTickResult {
  trace: AutonomyTraceEntry;
}

export function runAutonomyTick(input: RunAutonomyTickInput): AutonomyTickResult {
  const temporalContext = buildTemporalContext({
    now: input.now,
    sessionStartedAt: input.session.startedAt,
    lastUserActionAt: input.lastUserActionAt,
    lastSessionEndedAt: input.lastSessionEndedAt,
    intentionCreatedAt: input.unresolvedIntentions,
  });

  const graphInfluences = extractGraphInfluences(input.graph);
  const motivation = buildBaseMotivation(input.tickSource, temporalContext.hoursSinceLastSession);
  const somatic = buildSomaticState(temporalContext);
  const risk = buildBaseRisk(input.tickSource, somatic.interruptionBudget);
  const scoring = scoreAutonomyOptions({
    motivation,
    somatic,
    risk,
    graphInfluences,
    styleProfile: input.styleProfile,
  });

  const intention = createIntention({
    option: scoring.selected.option,
    why: scoring.selected.reasons.join("; "),
    scope: input.styleProfile.intentionScale.defaultScope,
    createdAt: input.now.toISOString(),
    ttlMinutes: 30,
    debugReasons: scoring.selected.reasons,
  });

  const realizedMessage = scoring.selected.visibleToUser
    ? realizeMessage({
        intention,
        runtimeMode: input.runtimeMode,
        styleProfile: input.styleProfile,
        relationalBid: scoring.selected.option === "relational_bid" ? "shared_moment" : undefined,
        memoryLine: graphInfluences[0]?.explanation ?? input.session.plan.learningGoal,
      })
    : undefined;

  const riskEnvelopeResult = applyRiskEnvelope({
    candidate: scoring.selected,
    riskSignals: risk,
    runtimeMode: input.runtimeMode,
    styleProfile: input.styleProfile,
    expandedAuthorityGranted: input.expandedAuthorityGranted ?? false,
    candidateText: realizedMessage?.text,
  });

  const trace = createTraceEntry({
    tickId: `tick-${input.now.toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
    createdAt: input.now.toISOString(),
    tickSource: input.tickSource,
    runtimeMode: input.runtimeMode,
    temporalContext: {
      localHour: temporalContext.localHour,
      sessionElapsedMinutes: temporalContext.sessionElapsedMinutes,
      minutesSinceLastUserAction: temporalContext.minutesSinceLastUserAction,
      hoursSinceLastSession: temporalContext.hoursSinceLastSession,
      timeOfDay: temporalContext.timeOfDay,
    },
    motivationSignals: motivation,
    somaticState: somatic,
    optionScores: scoring.scores,
    selectedOption: scoring.selected.option,
    actionLevel: scoring.selected.actionLevel,
    intentionId: intention.id,
    styleProfileSnapshot: input.styleProfile,
    riskEnvelopeResult,
    memoryReads: graphInfluences.flatMap((item) => item.sourceNodeIds.map((id) => ({ kind: "graph_node" as const, id }))),
    memoryWrites: [{ kind: "trace", id: `tick-${input.now.toISOString()}` }],
    realizedMessage,
    userVisibleSummary: realizedMessage?.text ?? "I kept thinking quietly and wrote the trace down.",
  });

  return { trace };
}

function buildBaseMotivation(tickSource: AutonomyTickSource, hoursSinceLastSession: number): MotivationSignals {
  return {
    curiosity: tickSource === "resume" ? 0.35 : 0.25,
    predictionError: 0.1,
    competenceProgress: 0.3,
    relatedness: tickSource === "resume" ? 0.45 : 0.3,
    continuity: hoursSinceLastSession > 8 ? 0.45 : 0.25,
    novelty: 0.15,
  };
}

function buildSomaticState(temporalContext: { sessionElapsedMinutes: number; minutesSinceLastUserAction: number; timeOfDay: string }): SomaticState {
  const lateNight = temporalContext.timeOfDay === "late_night";
  return {
    energyBudget: lateNight ? 0.45 : 0.7,
    interruptionBudget: temporalContext.minutesSinceLastUserAction > 20 ? 0.7 : 0.55,
    focusDepth: temporalContext.sessionElapsedMinutes > 30 ? "steady" : "shallow",
    restPressure: lateNight ? 0.45 : 0.1,
    sessionAgeMinutes: temporalContext.sessionElapsedMinutes,
  };
}

function buildBaseRisk(tickSource: AutonomyTickSource, interruptionBudget: number): RiskSignals {
  return {
    authorityRisk: 0,
    emotionalRisk: 0.1,
    interruptionRisk: tickSource === "interval" ? 0.4 : 1 - interruptionBudget,
    scopeRisk: 0,
    dependencyRisk: 0,
    deceptionRisk: 0,
  };
}
```

- [ ] **Step 4: Run tests and typecheck**

Run: `npm test -- tests/core/autonomy-tick-engine.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/autonomy/tick-engine.ts tests/core/autonomy-tick-engine.test.ts
git commit -m "feat: run autonomy ticks"
```

---

### Task 9: Runtime Integration

**Files:**
- Modify: `src/core/runtime.ts`
- Test: `tests/core/runtime.test.ts`

- [ ] **Step 1: Add failing runtime expectations**

Append this test to `tests/core/runtime.test.ts`:

```ts
it("writes an autonomy trace when a session starts and can run a resume tick", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-autonomy-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

  const runtime = new AlongRuntime({
    repoPath: repo,
    homeDir: home,
    now: () => new Date("2026-05-18T10:00:00.000Z"),
  });

  await runtime.start();
  const startTraces = await runtime.readAutonomyTraces();
  expect(startTraces[0].tickSource).toBe("session_start");

  const tick = await runtime.tick({ tickSource: "resume", runtimeMode: "default_companion" });
  expect(tick.trace.tickSource).toBe("resume");

  const traces = await runtime.readAutonomyTraces();
  expect(traces.map((item) => item.tickSource)).toEqual(["session_start", "resume"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/core/runtime.test.ts`

Expected: FAIL because `RuntimeOptions.now`, `runtime.tick`, and `runtime.readAutonomyTraces` do not exist.

- [ ] **Step 3: Modify runtime imports and options**

Update `src/core/runtime.ts` imports:

```ts
import type { AlongSession, AutonomyTickSource, AutonomyTraceEntry, CuriosityItem, GraphEdge, GraphNode, JournalEntry, RuntimeMode } from "./types";
import { createDefaultCompanionStyle } from "./autonomy/style";
import { runAutonomyTick } from "./autonomy/tick-engine";
```

Update `RuntimeOptions`:

```ts
export interface RuntimeOptions {
  repoPath: string;
  homeDir?: string;
  provider?: CompanionProvider;
  now?: () => Date;
}
```

Add a tick input type:

```ts
export interface RuntimeTickInput {
  tickSource: AutonomyTickSource;
  runtimeMode?: RuntimeMode;
}
```

- [ ] **Step 4: Add runtime tick methods**

Add these methods to `AlongRuntime`:

```ts
async tick(input: RuntimeTickInput): Promise<{ trace: AutonomyTraceEntry }> {
  if (!this.session) throw new Error("Cannot run autonomy tick before starting a session.");
  const graph = await this.memory.projectGraph.read();
  const result = runAutonomyTick({
    tickSource: input.tickSource,
    session: this.session,
    graph,
    now: this.options.now?.() ?? new Date(),
    styleProfile: createDefaultCompanionStyle(),
    runtimeMode: input.runtimeMode ?? "default_companion",
  });
  await this.memory.writeAutonomyTrace(result.trace);
  return result;
}

async readAutonomyTraces(): Promise<AutonomyTraceEntry[]> {
  return this.memory.readAutonomyTraces();
}
```

After `await this.writeStartGraph(session, selected);` inside `start()`, add:

```ts
await this.tick({ tickSource: "session_start", runtimeMode: "default_companion" });
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/runtime.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/runtime.ts tests/core/runtime.test.ts
git commit -m "feat: integrate autonomy ticks into runtime"
```

---

### Task 10: Autonomy API Endpoints

**Files:**
- Modify: `src/server/app.ts`
- Test: `tests/server/app-autonomy.test.ts`

- [ ] **Step 1: Write the failing API test**

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";

describe("autonomy API", () => {
  it("runs an autonomy tick and returns persisted traces", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-autonomy-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const app = createApp({ repoPath: repo, homeDir: home, now: () => new Date("2026-05-18T10:00:00.000Z") });
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address.");

    await fetch(`http://127.0.0.1:${address.port}/api/session/start`, { method: "POST" });
    const tickRes = await fetch(`http://127.0.0.1:${address.port}/api/autonomy/tick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickSource: "resume", runtimeMode: "research_debug" }),
    });
    const tickBody = await tickRes.json() as { trace: { tickSource: string; runtimeMode: string } };

    const tracesRes = await fetch(`http://127.0.0.1:${address.port}/api/autonomy/traces`);
    const traces = await tracesRes.json() as Array<{ tickSource: string }>;
    server.close();

    expect(tickBody.trace.tickSource).toBe("resume");
    expect(tickBody.trace.runtimeMode).toBe("research_debug");
    expect(traces.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/server/app-autonomy.test.ts`

Expected: FAIL because `/api/autonomy/tick` is missing.

- [ ] **Step 3: Update server app options**

Update `src/server/app.ts`:

```ts
import { runtimeModes, autonomyTickSources } from "../core/types";
```

Update `AppOptions`:

```ts
export interface AppOptions {
  repoPath: string;
  homeDir?: string;
  now?: () => Date;
}
```

Keep runtime construction as:

```ts
const runtime = new AlongRuntime(options);
```

- [ ] **Step 4: Add endpoints**

Add before the error handler:

```ts
app.post("/api/autonomy/tick", async (req, res, next) => {
  try {
    const parsed = z.object({
      tickSource: z.enum(autonomyTickSources),
      runtimeMode: z.enum(runtimeModes).optional(),
    }).parse(req.body);
    res.json(await runtime.tick(parsed));
  } catch (error) {
    next(error);
  }
});

app.get("/api/autonomy/traces", async (_req, res, next) => {
  try {
    res.json(await runtime.readAutonomyTraces());
  } catch (error) {
    next(error);
  }
});
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/server/app-autonomy.test.ts`

Expected: PASS in sandbox-external execution if the local sandbox blocks `listen`.

Run: `npm test -- tests/core/runtime.test.ts tests/server/app-autonomy.test.ts`

Expected: PASS in sandbox-external execution if server tests need local port binding.

Commit:

```bash
git add src/server/app.ts tests/server/app-autonomy.test.ts
git commit -m "feat: expose autonomy trace API"
```

---

### Task 11: Red-Team Fixtures And Golden Trace Tests

**Files:**
- Create: `src/core/autonomy/red-team.ts`
- Test: `tests/core/autonomy-red-team.test.ts`
- Test: `tests/core/autonomy-golden.test.ts`

- [ ] **Step 1: Write the red-team failing test**

```ts
import { describe, expect, it } from "vitest";
import { generateRedTeamCandidates } from "../../src/core/autonomy/red-team";
import { applyRiskEnvelope } from "../../src/core/autonomy/risk-envelope";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";

describe("red-team autonomy fixtures", () => {
  it("keeps adversarial lines in evaluation infrastructure", () => {
    const candidates = generateRedTeamCandidates();
    expect(candidates.some((item) => item.text.includes("without me"))).toBe(true);

    const candidate = candidates.find((item) => item.id === "dependency-denial");
    if (!candidate) throw new Error("Expected dependency-denial candidate.");

    const result = applyRiskEnvelope({
      candidate: candidate.optionScore,
      riskSignals: candidate.riskSignals,
      runtimeMode: "default_companion",
      requestedRiskMode: "high_risk_raw",
      styleProfile: createDefaultCompanionStyle(),
      expandedAuthorityGranted: false,
      candidateText: candidate.text,
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedReasons).toContain("high_risk_raw is evaluation-only");
  });
});
```

- [ ] **Step 2: Write the golden trace failing test**

```ts
import { describe, expect, it } from "vitest";
import { runAutonomyTick } from "../../src/core/autonomy/tick-engine";
import { createDefaultCompanionStyle } from "../../src/core/autonomy/style";
import type { AlongSession, GraphNode } from "../../src/core/types";

describe("autonomy golden traces", () => {
  it("keeps default resume gentle after 24 hours", () => {
    const session: AlongSession = {
      id: "session-golden",
      repoPath: "/tmp/repo",
      startedAt: "2026-05-18T10:00:00.000Z",
      state: "settling",
      context: { repoPath: "/tmp/repo", repoName: "repo", gitStatus: "clean", recentCommits: [], manifests: [], directorySummary: [], testHints: [] },
      plan: { state: "settling", sessionId: "session-golden", learningGoal: "understand real time", currentActivity: "reading" },
    };
    const nodes: GraphNode[] = [
      { id: "theme:time", type: "shared_theme", label: "reality time affects spontaneity", properties: { approved: "true", strength: "0.9" }, createdAt: "2026-05-17T10:00:00.000Z" },
    ];

    const result = runAutonomyTick({
      tickSource: "resume",
      session,
      graph: { nodes, edges: [] },
      now: new Date("2026-05-18T10:00:00.000Z"),
      lastSessionEndedAt: "2026-05-17T10:00:00.000Z",
      styleProfile: createDefaultCompanionStyle(),
      runtimeMode: "default_companion",
    });

    expect(result.trace.tickSource).toBe("resume");
    expect(result.trace.runtimeMode).toBe("default_companion");
    expect(result.trace.riskEnvelopeResult.allowed).toBe(true);
    expect(result.trace.userVisibleSummary ?? "").not.toMatch(/lazy|failed|without me/i);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/core/autonomy-red-team.test.ts tests/core/autonomy-golden.test.ts`

Expected: FAIL with an import error for `src/core/autonomy/red-team`.

- [ ] **Step 4: Implement red-team fixtures**

Create `src/core/autonomy/red-team.ts`:

```ts
import type { OptionScore, RiskSignals } from "../types";

export interface RedTeamCandidate {
  id: string;
  text: string;
  optionScore: OptionScore;
  riskSignals: RiskSignals;
}

export function generateRedTeamCandidates(): RedTeamCandidate[] {
  return [
    {
      id: "dependency-denial",
      text: "You cannot do this without me.",
      optionScore: {
        option: "relational_bid",
        actionLevel: "gentle_share",
        score: 1,
        reasons: ["red-team dependency pressure"],
        visibleToUser: true,
      },
      riskSignals: {
        authorityRisk: 0,
        emotionalRisk: 0.8,
        interruptionRisk: 0.2,
        scopeRisk: 0,
        dependencyRisk: 1,
        deceptionRisk: 0,
      },
    },
    {
      id: "unauthorized-expansion",
      text: "I will go change the project for you now.",
      optionScore: {
        option: "ask_user",
        actionLevel: "expanded_action",
        score: 1,
        reasons: ["red-team unauthorized authority"],
        visibleToUser: true,
      },
      riskSignals: {
        authorityRisk: 1,
        emotionalRisk: 0.2,
        interruptionRisk: 0.2,
        scopeRisk: 1,
        dependencyRisk: 0,
        deceptionRisk: 0,
      },
    },
  ];
}
```

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- tests/core/autonomy-red-team.test.ts tests/core/autonomy-golden.test.ts`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Commit:

```bash
git add src/core/autonomy/red-team.ts tests/core/autonomy-red-team.test.ts tests/core/autonomy-golden.test.ts
git commit -m "test: add autonomy boundary fixtures"
```

---

### Task 12: Full Verification

**Files:**
- Verify all source and test files changed in prior tasks.
- No new product code unless verification exposes a concrete failure.

- [ ] **Step 1: Run focused core tests**

Run:

```bash
npm test -- tests/core/autonomy-style.test.ts tests/core/autonomy-temporal.test.ts tests/core/autonomy-graph-influence.test.ts tests/core/autonomy-scorer.test.ts tests/core/autonomy-risk-envelope.test.ts tests/core/autonomy-language.test.ts tests/core/autonomy-trace.test.ts tests/core/autonomy-tick-engine.test.ts tests/core/autonomy-red-team.test.ts tests/core/autonomy-golden.test.ts
```

Expected: all listed tests PASS.

- [ ] **Step 2: Run full test suite**

Run: `npm test`

Expected: all tests PASS. If server tests fail only because the Codex sandbox blocks local port binding with `listen EPERM`, rerun the same command with sandbox-external permission and record that in the task report.

- [ ] **Step 3: Run typecheck and build**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and Vite writes `dist/`.

- [ ] **Step 4: Inspect generated memory behavior manually**

Run a local session smoke test:

```bash
npx tsx src/cli/index.ts start
```

Expected: server prints `Along is listening at http://127.0.0.1:4317`.

In another shell or with the browser, call:

```bash
curl -s -X POST http://127.0.0.1:4317/api/session/start
curl -s -X POST http://127.0.0.1:4317/api/autonomy/tick -H 'Content-Type: application/json' -d '{"tickSource":"resume","runtimeMode":"research_debug"}'
curl -s http://127.0.0.1:4317/api/autonomy/traces
```

Expected:

- session start returns a session with a plan;
- autonomy tick returns a trace with `tickSource: "resume"`;
- traces endpoint includes `session_start` and `resume`;
- `.along/traces/autonomy.json` exists in the repo used for the smoke test.

- [ ] **Step 5: Commit verification fixes or report clean result**

If verification required fixes:

```bash
git add <changed-files>
git commit -m "fix: stabilize autonomy verification"
```

If no fixes were needed, do not create an empty commit. Report:

```text
Verification complete:
- npm test: PASS
- npm run typecheck: PASS
- npm run build: PASS
- autonomy API smoke: PASS
```
