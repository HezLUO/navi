# Along Core/MCP Minimal Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a type-only Along Working Thread contract with tests and examples, without implementing a real MCP server, runtime, storage, or adapters.

**Architecture:** The contract lives in one focused TypeScript file under `src/core/working-thread-contract.ts` and exports only constants, types, and operation signatures. A Vitest file validates the contract shape through runtime constants and compile-time `satisfies` examples. The approved design spec remains the human-readable semantic source, with concrete behavior-critical examples added during implementation.

**Tech Stack:** TypeScript strict mode, Vitest, Markdown docs, existing Along `src/core` layout.

---

## Current Constraints

- Base branch: `main`.
- Approved spec: `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md`.
- Do not implement a real MCP server.
- Do not add MCP tool registration.
- Do not add storage, `.along/` persistence, runtime behavior, LLM calls, watchers, schedulers, notifications, presence, adapters, Memory v2, relationship modes, delegation, or write delegation.
- Do not create a new package such as `packages/along-core-contract`.
- Keep this pass type-only plus tests/docs.
- Preserve `.superpowers/` as untracked local runtime data.

## File Structure

- Create `src/core/working-thread-contract.ts`
  - Type-only contract surface: constants, type aliases, interfaces, and operation signatures.
  - No runtime implementation, file IO, server setup, adapters, or persistence.
- Create `tests/core/working-thread-contract.test.ts`
  - Vitest coverage for operation names, result statuses, schemas, drift behavior examples, wrap-up/proposal/confirmation/conflict shapes, and spec example headings.
- Modify `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md`
  - Add concrete behavior-critical example snippets under the existing `Behavior-Critical Examples` section.
- Modify `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
  - Record that the type-only Core/MCP minimal contract implementation passed verification and did not cross the non-goal boundaries.

---

### Task 1: Add Failing Contract Tests

**Files:**
- Create: `tests/core/working-thread-contract.test.ts`

- [ ] **Step 1: Create the failing test file**

Create `tests/core/working-thread-contract.test.ts` with exactly:

```ts
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
  type OperationResult,
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
    const okRead = {
      status: "ok",
      operation: "readWorkingThread",
      threadId: baseThread.id,
      data: baseThread,
    } satisfies OperationResult<WorkingThread>;

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
      readWorkingThread: async () => ({
        status: "ok",
        operation: "readWorkingThread",
        threadId: baseThread.id,
        data: baseThread,
      }),
      listWorkingThreads: async () => ({
        status: "ok",
        operation: "listWorkingThreads",
        data: [baseSummary],
      }),
      classifyDrift: async () => ({
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
      draftWrapUp: async () => ({
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
      proposeWorkingThreadUpdate: async () => ({
        status: "needsConfirmation",
        operation: "proposeWorkingThreadUpdate",
        threadId: baseThread.id,
        data: baseProposal,
        message: baseProposal.confirmationPrompt,
      }),
      applyConfirmedWorkingThreadUpdate: async () => ({
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
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- tests/core/working-thread-contract.test.ts
```

Expected: FAIL because `src/core/working-thread-contract.ts` does not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/core/working-thread-contract.test.ts
git commit -m "test: cover working thread contract"
```

---

### Task 2: Add The Type-Only Contract

**Files:**
- Create: `src/core/working-thread-contract.ts`
- Test: `tests/core/working-thread-contract.test.ts`

- [ ] **Step 1: Create the contract file**

Create `src/core/working-thread-contract.ts` with exactly:

```ts
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

export interface OperationResult<TData = unknown> {
  status: OperationResultStatus;
  operation: WorkingThreadOperation;
  threadId?: string;
  data?: TData;
  message?: string;
  reason?: string;
  recommendedAction?: ContractRecommendedAction;
}

export interface ReadWorkingThreadInput {
  threadId: string;
}

export type ReadWorkingThreadResult = OperationResult<WorkingThread>;

export interface ListWorkingThreadsInput {
  status?: WorkingThreadStatus;
}

export type ListWorkingThreadsResult = OperationResult<WorkingThreadSummary[]>;

export interface ClassifyDriftInput {
  thread: WorkingThread | WorkingThreadSummary;
  userRequest: string;
  proposedDirection?: string;
}

export type ClassifyDriftResult = OperationResult<DriftClassification>;

export interface DraftWrapUpInput {
  thread: WorkingThread;
  sessionSummary: string;
  judgmentChange?: string;
  boundaryChange?: string;
  nextLikelyMove?: string;
  openQuestionsChange?: string;
}

export type DraftWrapUpResult = OperationResult<WrapUpDraft>;

export interface ProposeWorkingThreadUpdateInput {
  thread: WorkingThread;
  draft: WrapUpDraft;
}

export type ProposeWorkingThreadUpdateResult = OperationResult<WorkingThreadUpdateProposal>;

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
  | (OperationResult<ApplyConfirmedWorkingThreadUpdateSuccess> & {
    status: "ok";
    data: ApplyConfirmedWorkingThreadUpdateSuccess;
  })
  | (OperationResult<StaleProposalConflict> & {
    status: "conflict";
    data: StaleProposalConflict;
    recommendedAction: "regenerateProposal";
  })
  | (OperationResult & {
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
```

- [ ] **Step 2: Run the targeted test and verify the remaining failure**

Run:

```bash
npm test -- tests/core/working-thread-contract.test.ts
```

Expected: FAIL only in `keeps behavior-critical examples in the design spec`, because the spec does not yet include the concrete example headings/snippets.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit the contract**

Run:

```bash
git add src/core/working-thread-contract.ts
git commit -m "feat: add working thread contract types"
```

---

### Task 3: Add Concrete Spec Examples

**Files:**
- Modify: `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md`
- Test: `tests/core/working-thread-contract.test.ts`

- [ ] **Step 1: Insert concrete examples into the design spec**

In `docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md`, find this paragraph under `## Behavior-Critical Examples`:

```markdown
Do not make examples exhaustive. The contract should remain readable and focused on the behavior boundaries that matter for Along's self-initiation and companionship.
```

Insert this block immediately before that paragraph:

````markdown
### Resume/List Example

```json
{
  "status": "ok",
  "operation": "listWorkingThreads",
  "data": [
    {
      "id": "thread-existing-agent-self-initiation",
      "title": "Existing-Agent Self-Initiation Layer",
      "status": "active",
      "lastUpdated": "2026-06-21T12:00:00.000Z",
      "currentJudgmentBrief": "Type-only contract next; no real server yet.",
      "nextLikelyMove": "Add the type-only contract, tests, and spec examples.",
      "riskLevel": "medium",
      "needsUserDecision": false
    }
  ]
}
```

### Quietness Example

```json
{
  "status": "ok",
  "operation": "classifyDrift",
  "threadId": "thread-existing-agent-self-initiation",
  "data": {
    "driftLevel": "none",
    "reason": "The user asked an ordinary repository question.",
    "recommendedAction": "answerDirectly",
    "needsUserConfirmation": false
  }
}
```

### Medium Drift Example

```json
{
  "status": "ok",
  "operation": "classifyDrift",
  "threadId": "thread-existing-agent-self-initiation",
  "data": {
    "driftLevel": "medium",
    "reason": "The user asked about a related future package shape without confirming a direction switch.",
    "recommendedAction": "answerWithBoundary",
    "needsUserConfirmation": false
  }
}
```

### High-Impact Drift Example

```json
{
  "status": "ok",
  "operation": "classifyDrift",
  "threadId": "thread-existing-agent-self-initiation",
  "data": {
    "driftLevel": "high",
    "reason": "The user proposed skipping the minimal contract and building a real MCP server.",
    "recommendedAction": "askConfirmation",
    "needsUserConfirmation": true
  }
}
```

### Wrap-Up Draft Example

```json
{
  "status": "ok",
  "operation": "draftWrapUp",
  "threadId": "thread-existing-agent-self-initiation",
  "data": {
    "summary": "The minimal Core/MCP contract design was approved.",
    "judgmentChange": "Move from design approval to type-only contract implementation.",
    "boundaryChange": "Keep real MCP server, runtime, storage, adapters, and presence out of scope.",
    "nextLikelyMove": "Implement the type-only contract and tests.",
    "openQuestionsChange": "Decide later when to design the real MCP server layer.",
    "requiresConfirmation": true
  }
}
```

### Update Proposal Example

```json
{
  "status": "needsConfirmation",
  "operation": "proposeWorkingThreadUpdate",
  "threadId": "thread-existing-agent-self-initiation",
  "message": "Write these Working Thread updates?",
  "data": {
    "proposalId": "proposal-1",
    "threadId": "thread-existing-agent-self-initiation",
    "baseLastUpdated": "2026-06-21T12:00:00.000Z",
    "changes": [
      {
        "section": "currentJudgment",
        "currentValue": "The next layer is a type-only Core/MCP minimal contract.",
        "proposedValue": "The type-only Core/MCP minimal contract has been implemented and verified.",
        "rationale": "The contract implementation passed tests without crossing runtime boundaries."
      }
    ],
    "confirmationPrompt": "Write these Working Thread updates?",
    "riskLevel": "medium"
  }
}
```

### Confirmed Write-Back Example

```json
{
  "status": "ok",
  "operation": "applyConfirmedWorkingThreadUpdate",
  "threadId": "thread-existing-agent-self-initiation",
  "data": {
    "appliedProposalId": "proposal-1",
    "thread": {
      "id": "thread-existing-agent-self-initiation",
      "title": "Existing-Agent Self-Initiation Layer",
      "status": "active",
      "lastUpdated": "2026-06-21T12:30:00.000Z"
    }
  }
}
```

### Stale Write-Back Conflict Example

```json
{
  "status": "conflict",
  "operation": "applyConfirmedWorkingThreadUpdate",
  "threadId": "thread-existing-agent-self-initiation",
  "reason": "The thread changed after this proposal was created.",
  "recommendedAction": "regenerateProposal",
  "data": {
    "status": "conflict",
    "reason": "The thread changed after this proposal was created.",
    "currentThreadSummary": {
      "id": "thread-existing-agent-self-initiation",
      "title": "Existing-Agent Self-Initiation Layer",
      "status": "active",
      "lastUpdated": "2026-06-21T13:00:00.000Z",
      "currentJudgmentBrief": "The thread already moved forward.",
      "nextLikelyMove": "Regenerate the proposal against the current state.",
      "riskLevel": "medium",
      "needsUserDecision": true
    },
    "staleProposal": {
      "proposalId": "proposal-1",
      "threadId": "thread-existing-agent-self-initiation",
      "baseLastUpdated": "2026-06-21T12:00:00.000Z",
      "changes": [],
      "confirmationPrompt": "Write these Working Thread updates?",
      "riskLevel": "medium"
    },
    "recommendedAction": "regenerateProposal"
  }
}
```
````

- [ ] **Step 2: Run the targeted test and verify it passes**

Run:

```bash
npm test -- tests/core/working-thread-contract.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit the spec examples**

Run:

```bash
git add docs/superpowers/specs/2026-06-21-along-core-mcp-minimal-contract-design.md tests/core/working-thread-contract.test.ts
git commit -m "docs: add working thread contract examples"
```

---

### Task 4: Record Implementation Status And Verify

**Files:**
- Modify: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
- Test: `tests/core/working-thread-contract.test.ts`

- [ ] **Step 1: Update the Working Thread record**

In `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`, update `## Last Wrap-Up` by adding this paragraph after the existing Core/MCP minimal contract design approval paragraph:

```markdown
The Along Core/MCP Minimal Contract was implemented as a type-only contract in `src/core/working-thread-contract.ts`, with behavior-critical examples in the design spec and tests in `tests/core/working-thread-contract.test.ts`. Verification covers operation names, section-shaped Working Thread schemas, actionable summaries, drift classification, structured wrap-up drafts, section patch proposals, explicit confirmation envelopes, stale proposal conflicts, and shared operation result envelopes. This pass did not implement a real MCP server, storage, runtime, watcher, scheduler, notification, presence surface, LLM call, adapter, Memory v2, relationship mode, delegation, or write delegation.
```

Under `2026-06-21 Core/MCP minimal contract spec status:`, append:

```markdown
- After implementation, the expected verification gate is `npm test -- tests/core/working-thread-contract.test.ts`, `npm run typecheck`, `npm run build`, and full `npm test`.
```

- [ ] **Step 2: Run targeted verification**

Run:

```bash
npm test -- tests/core/working-thread-contract.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. If the sandbox blocks Express listen with `EPERM`, rerun with escalated permissions and record that the sandboxed run failed only for the known listen permission issue.

- [ ] **Step 6: Confirm boundary status**

Run:

```bash
rg -n "createServer|listen\\(|Mcp|MCPServer|\\.along|watch\\(|setInterval|setTimeout|fetch\\(|delegateToAgent|Hermes|Claude|Memory v2|relationship" src/core/working-thread-contract.ts tests/core/working-thread-contract.test.ts
```

Expected: no matches for runtime/server/storage/adapter/delegation implementation. Matches inside doc strings or test expectation text are acceptable only when they describe non-goals.

- [ ] **Step 7: Commit the continuity update**

Run:

```bash
git add docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
git commit -m "docs: record core mcp contract implementation"
```

- [ ] **Step 8: Final status check**

Run:

```bash
git status --short
```

Expected: clean except expected untracked `.superpowers/` local runtime data.

---

## Final Verification Checklist

Run these before reporting completion:

```bash
npm test -- tests/core/working-thread-contract.test.ts
npm run typecheck
npm run build
npm test
git diff --check
git status --short
```

Expected final state:

- Targeted contract test passes.
- Typecheck passes.
- Build passes.
- Full test suite passes, or sandbox-only Express listen `EPERM` is rerun successfully with escalation.
- No real MCP server is implemented.
- No MCP tool registration is added.
- No storage, `.along/`, runtime, watcher, scheduler, notification, presence, LLM call, adapter, Memory v2, relationship mode, delegation, or write delegation is added.
- `src/core/working-thread-contract.ts` contains only constants, types, interfaces, and operation signatures.
- Working Thread continuity record is updated.
- `git status --short` is clean except expected untracked `.superpowers/`.

## Handoff Notes

- Use a fresh implementation worktree before executing this plan.
- If the worktree has no `node_modules`, ask for approval before running `npm ci`.
- Do not push, merge, delete worktrees, rewrite history, or clean `.superpowers/` unless explicitly asked.
- Keep commits task-sized and do not squash review fixes unless the user explicitly asks.
