# Navi Supervised Delivery Loop V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the prompt/docs-backed Codex-first three-role delivery loop so every bounded implementation worktree receives one fresh independent review, routine findings return to the same bounded executor-validator pair, and the user is interrupted only for real decisions.

**Architecture:** Add one canonical `supervised-delivery-v1.md` policy owner for Execution Contracts, Validation Contracts, `NAVI_VALIDATION_RESULT`, snapshot identity, verdict routing, and the two-remediation cap. Existing Lane Handoff remains the execution-transition transport; the new owner consumes `review-ready` and directs the active Main Thread to use Codex host task creation and messaging. Mirror the canonical skill package exactly and test the stable schemas and route table deterministically without adding a parser, scheduler, database, watcher, daemon, or automatic Git action.

**Tech Stack:** Codex skill Markdown, Codex host task/worktree operations, Vitest static contract tests, Node.js filesystem APIs, existing source/package mirror verifier.

## Global Constraints

- Execute only after the source-alpha CLI invocation implementation has been independently validated, explicitly integrated, and calibrated once in a real global-install environment.
- Create a new Codex-managed worktree from the then-current clean `main`; do not execute this plan in the persistent Main Thread.
- The persistent Main Thread owns product judgment, scope, priority, acceptance, and user-facing decisions.
- Each bounded implementation goal receives a new Execution Thread; do not create a permanent executor.
- Each `review-ready` snapshot receives at most one fresh Validation Thread under an explicitly preauthorized Execution Contract.
- Reuse the same executor-validator pair for at most two in-scope remediation rounds; a new goal, baseline, architecture, permission, or broader scope returns to the user.
- Validation Threads are read-only. Any validator write invalidates the result and requires a clean review boundary.
- The Validation Contract must exclude the executor's full transcript and private reasoning.
- Planned implementation tests belong to the Execution Thread. Validation reruns only bounded checks needed for a concrete doubt. Full release verification belongs only to explicit Release mode.
- Do not automatically merge, cherry-pick, push, tag, release, publish, change permissions, accept risk, reduce acceptance criteria, or expand scope.
- Do not add a runtime service, scheduler, durable queue, database, watcher, polling loop, notification service, UI, Memory v2, agent adapter, or background continuation claim.
- Do not modify `src/cli`, `package.json`, `package-lock.json`, release metadata, `archive/along`, external target projects, global Codex state, or `work/`.
- Preserve prompt-language following and the quietness rule: no control gain, no Navi surface.
- Keep detailed three-role contracts in `supervised-delivery-v1.md`; other active references may route to that owner but must not become duplicate authorities.
- Use targeted tests, `npm run verify:plugin-package`, `npm run typecheck`, and diff/scope checks. Do not run full `npm test` unless a later premise-changing decision explicitly expands the verification budget.

---

## Planned File Structure

### New canonical owner and mirror

- `.agents/skills/navi/references/supervised-delivery-v1.md`: the only active owner for three-role lifecycle, contracts, validation result schema, route table, remediation cap, and failure handling.
- `plugins/navi/skills/navi/references/supervised-delivery-v1.md`: byte-identical package mirror produced from the canonical owner.

### Existing routing and entry surfaces

- `.agents/skills/navi/references/lane-handoff-v1.md`: retain execution-event transport ownership; route a preauthorized `review-ready` event into validation-pending instead of treating parent read-only review as final acceptance.
- `.agents/skills/navi/references/project-map-v1.md`: state only the user-facing parallel-work consequence and point detailed delivery policy to the new owner.
- `.agents/skills/navi/references/supervision-v1.md`: add a concise Product Stage/Work Mode placement and owner pointer; do not copy schemas or route tables.
- `.agents/skills/navi/SKILL.md`: load the new reference for bounded implementation delivery and enforce its hard boundaries.
- `plugins/navi/skills/navi/...`: exact mirrors of every modified canonical skill file.

### Deterministic contract coverage

- `tests/skills/navi-supervised-delivery.test.ts`: focused schema, lifecycle, routing, idempotency, snapshot, remediation-cap, read-only, and release-boundary tests.
- `tests/skills/navi-supervision.test.ts`: integration assertions connecting Lane Handoff, Project Map, Supervision, and the new owner.
- `tests/skills/navi-capability-truthfulness.test.ts`: public-surface truthfulness and no-runtime assertions.
- `tests/repository/current-surface.test.ts`: active design/plan index and one-owner boundary assertions.

### Product truthfulness and navigation

- `README.md`: describe the current-main Supervised Delivery Loop as unreleased, active-session, Codex-host-backed behavior.
- `README.zh-CN.md`: synchronized Chinese truthfulness statement.
- `plugins/navi/README.md`: package-facing statement matching the canonical boundary.
- `docs/navi/design-history.md`: list the approved design and this implementation plan together as active.

---

### Task 1: Define The Canonical Three-Role Contracts

**Files:**
- Create: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Create: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: `NAVI_LANE_HANDOFF_EVENT` V1 `review-ready` fields from `.agents/skills/navi/references/lane-handoff-v1.md`.
- Produces: one canonical Execution Contract, Validation Contract, `NAVI_VALIDATION_RESULT` wire schema, validation levels, and verdict vocabulary used by Tasks 2-4.

- [ ] **Step 1: Add the failing contract-schema test**

Create `tests/skills/navi-supervised-delivery.test.ts` with the following initial test:

```ts
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const bodyStart = start + heading.length;
  const next = markdown.slice(bodyStart).search(/\n##? /);
  return next < 0
    ? markdown.slice(start)
    : markdown.slice(start, bodyStart + next);
}

describe("Navi Supervised Delivery Loop V1", () => {
  it("defines one canonical execution and validation contract", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );

    const execution = extractSection(reference, "## Execution Contract");
    for (const field of [
      "goal",
      "user_value",
      "source_task",
      "baseline",
      "allowed_scope",
      "forbidden_scope",
      "verification_budget",
      "validation_level: 1 | 2 | 3",
      "validation_preauthorized: true",
      "remediation_limit: 2",
      "stop_conditions",
    ]) {
      expect(execution).toContain(field);
    }

    const validation = extractSection(reference, "## Validation Contract");
    for (const field of [
      "reviewed_event_id",
      "execution_contract",
      "reviewed_snapshot",
      "changed_scope",
      "evidence",
      "validation_level",
      "command_budget",
      "read_only: true",
      "report_to: source_task",
    ]) {
      expect(validation).toContain(field);
    }
    expect(validation).toMatch(/must not include[\s\S]*full transcript[\s\S]*private reasoning/i);
  });

  it("defines the exact Navi validation-result envelope", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const result = extractSection(reference, "## Findings Package");

    for (const field of [
      "NAVI_VALIDATION_RESULT",
      "version: 1",
      "result_id",
      "reviewed_event_id",
      "source_task",
      "execution_lane",
      "validation_lane",
      "reviewed_snapshot",
      "assigned_level: 1 | 2 | 3",
      "used_level: 1 | 2 | 3",
      "verdict: accept | remediation-required | decision-required | unable-to-verify",
      "findings",
      "checks",
      "evidence_gaps",
      "validator_write_state: clean | invalidated",
      "recommendation",
    ]) {
      expect(result).toContain(field);
    }
  });

  it("requires a conformant bare validation-result payload", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const wire = extractSection(
      reference,
      "## Pre-Send Validation Wire-Format Check",
    );

    expect(wire).toMatch(/begin exactly with `NAVI_VALIDATION_RESULT`/i);
    expect(wire).toMatch(/bare plain text[\s\S]*no XML\/Markdown wrapper/i);
    expect(wire).toMatch(/exact field names[\s\S]*no aliases/i);
    expect(wire).toMatch(/same transition[\s\S]*same result_id/i);
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because `.agents/skills/navi/references/supervised-delivery-v1.md` does not exist.

- [ ] **Step 3: Create the minimal canonical contract owner**

Create `.agents/skills/navi/references/supervised-delivery-v1.md` with these exact owned sections and schemas:

```markdown
# Navi Supervised Delivery Loop V1

Use this reference for an approved bounded implementation or worktree plan whose Execution Contract preauthorizes one independent Validation Thread. Navi defines role, contract, routing, and decision boundaries; the Codex host provides task identity, worktree isolation, task creation, transcript persistence, and task messaging.

This is active-session, prompt/docs-backed Codex-first coordination. It is not a runtime scheduler, durable queue, watcher, daemon, notification service, automatic Git flow, or background continuation promise.

## Roles

- Main Thread: owns goal, scope, priority, acceptance, routing, and user decisions.
- Execution Thread: owns bounded file changes, planned verification, a clean snapshot, and the review-ready evidence package.
- Validation Thread: owns fresh independent read-only review of the exact snapshot, risks, omissions, and evidence.

The three roles are workflow responsibilities, not new Work Modes. The Main Thread may continue non-conflicting design or supervision while Execution or Validation runs.

## Execution Contract

Before worktree creation, record exactly:

goal: one bounded implementation outcome
user_value: why this outcome matters
source_task: persistent Main Thread task identifier
baseline: exact commit or immutable snapshot
allowed_scope: files, components, and behavior the executor may change
forbidden_scope: excluded files, actions, and escalation boundaries
verification_budget: exact required checks and maximum expansion
validation_level: 1 | 2 | 3
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready

Preauthorization covers creating one fresh Validation Thread for each new review-ready snapshot and routing in-scope remediation through the same executor-validator pair. It does not authorize permissions, scope expansion, risk acceptance, merge, push, tag, release, publication, or reduced acceptance criteria.

## Validation Contract

Create the fresh Validation Thread only after a valid review-ready event. Send exactly:

reviewed_event_id: the triggering Lane Handoff event identifier
execution_contract: the approved bounded contract
reviewed_snapshot: the exact commit or immutable snapshot
changed_scope: executor-declared files or components
evidence: verification results and residual risks
validation_level: 1 | 2 | 3
command_budget: bounded checks permitted for concrete doubts
read_only: true
report_to: source_task

The Validation Contract must not include the executor's full transcript, private reasoning, or self-review conversation. It may include repository specs, plans, diffs, commands, and evidence needed to judge the contract.

## Findings Package

NAVI_VALIDATION_RESULT
version: 1
result_id: one stable identifier for this validation result
reviewed_event_id: the review-ready event being judged
source_task: persistent Main Thread task identifier
execution_lane: bounded Execution Thread identifier
validation_lane: fresh Validation Thread identifier
reviewed_snapshot: exact commit or immutable snapshot
assigned_level: 1 | 2 | 3
used_level: 1 | 2 | 3
verdict: accept | remediation-required | decision-required | unable-to-verify
findings: severity-ordered findings with evidence, or none
checks: commands or read-only inspections actually performed
evidence_gaps: missing evidence, or none
validator_write_state: clean | invalidated
recommendation: accept, remediate, decide, or stop

The payload is bare plain text. Field aliases and wrapper formats are invalid. A result for another snapshot or an invalidated validator write state cannot support acceptance.

## Pre-Send Validation Wire-Format Check

Before sending, confirm the payload begins exactly with `NAVI_VALIDATION_RESULT`, is bare plain text with no XML/Markdown wrapper or code fence, uses exact field names with no aliases, and includes every findings-package field. A malformed payload is not a valid result. Correct the same transition and resend it with the same result_id; the correction is not a second review.

## Validation Levels

- Level 1 reads the contract, exact diff, and supplied evidence; it runs no commands by default.
- Level 2 traces affected owners and may run focused checks for a concrete uncertainty.
- Level 3 examines authorization, filesystem, migration, or other costly failure boundaries and may run one approved bounded integration suite.

No validation level silently enters Release mode or repeats the executor's complete test transcript merely to obtain a second green run.
```

- [ ] **Step 4: Run the focused contract tests and confirm GREEN**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: PASS, 1 file and 3 tests.

- [ ] **Step 5: Commit Task 1**

```bash
git add .agents/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: define navi supervised delivery contracts"
```

---

### Task 2: Make Review And Remediation Routing Deterministic

**Files:**
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `.agents/skills/navi/references/lane-handoff-v1.md`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: Task 1's `NAVI_VALIDATION_RESULT` fields and existing Lane Handoff `review-ready` event.
- Produces: exact-snapshot validator creation, event/result deduplication, verdict routing, pair reuse, and two-remediation termination behavior.

- [ ] **Step 1: Add failing lifecycle and route-table tests**

Append these tests inside the existing `describe` block in `tests/skills/navi-supervised-delivery.test.ts`:

```ts
  it("creates at most one validator for one review-ready snapshot", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const lifecycle = extractSection(reference, "## Lifecycle And Identity");

    expect(lifecycle).toMatch(/one fresh Validation Thread[\s\S]*one reviewed_event_id/i);
    expect(lifecycle).toMatch(/duplicate handoff event IDs[\s\S]*ignore/i);
    expect(lifecycle).toMatch(/duplicate validation result IDs[\s\S]*ignore/i);
    expect(lifecycle).toMatch(/wrong reviewed_snapshot[\s\S]*stale evidence/i);
    expect(lifecycle).toMatch(/same executor-validator pair[\s\S]*at most two/i);
  });

  it("routes every validation verdict to one next owner", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const routing = extractSection(reference, "## Verdict Routing");

    const expectedRows = [
      ["accept", "Main Thread", "merge or acceptance decision"],
      ["remediation-required", "same Execution Thread", "same Validation Thread"],
      ["decision-required", "user", "scope, permission, architecture, or risk"],
      ["unable-to-verify", "Main Thread", "evidence or premise"],
    ];
    for (const row of expectedRows) {
      for (const cell of row) expect(routing).toContain(cell);
    }
  });

  it("invalidates validator writes and caps remediation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    expect(reference).toMatch(/validator_write_state: invalidated[\s\S]*cannot support acceptance/i);
    expect(reference).toMatch(/two remediation rounds[\s\S]*reassess the plan, architecture, or acceptance criteria/i);
    expect(reference).toMatch(/planned tests[\s\S]*Execution Thread[\s\S]*Release mode/i);
  });

  it("keeps failed coordination honest and bounded", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const failure = extractSection(reference, "## Failure Handling");

    expect(failure).toMatch(/failure to create[\s\S]*validation-pending/i);
    expect(failure).toMatch(/messaging failure[\s\S]*explicit local fallback/i);
    expect(failure).toMatch(/timed retry[\s\S]*polling loop/i);
    expect(failure).toMatch(/insufficient evidence[\s\S]*approved contract/i);
    expect(failure).toMatch(/formally blocked[\s\S]*Lane Handoff/i);
  });
```

Also extend the test file's imports only if the current Vitest formatter requires no change; do not introduce a helper dependency.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because lifecycle, verdict-routing, invalidation, and remediation-cap sections are absent.

- [ ] **Step 3: Add the canonical lifecycle and route table**

Append these sections to `.agents/skills/navi/references/supervised-delivery-v1.md`:

```markdown
## Lifecycle And Identity

For one valid preauthorized review-ready transition, the active Main Thread creates one fresh Validation Thread for one reviewed_event_id and exact reviewed_snapshot. Mark the lane validation-pending until a valid result returns; review-ready alone is not acceptance.

Ignore duplicate handoff event IDs and duplicate validation result IDs idempotently. A result with the wrong reviewed_event_id or wrong reviewed_snapshot is stale evidence and cannot change acceptance state. A second review-ready event after bounded remediation uses a new event ID and snapshot.

Reuse the same executor-validator pair for in-scope remediation and focused re-review. The pair may perform at most two remediation rounds. New scope, permission, architecture, baseline, goal, validation-budget expansion, or known-risk acceptance returns to the user instead of mutating the pair's contract.

Do not create the validator when implementation starts, poll for ordinary progress, or create multiple validators for the same event. Host task creation and messaging are the transport; Navi makes no background-delivery promise after active tasks close.

## Verdict Routing

| Verdict | Next owner | Required transition |
| --- | --- | --- |
| accept | Main Thread | Present supportable evidence and the real merge or acceptance decision. |
| remediation-required | same Execution Thread | Route only in-scope findings, then return the new snapshot to the same Validation Thread for focused re-review. |
| decision-required | user | Present the concrete scope, permission, architecture, or risk decision with a recommendation. |
| unable-to-verify | Main Thread | Decide whether missing evidence is already authorized, whether the environment must change, or whether the premise must be reconsidered. |

`validator_write_state: invalidated` cannot support acceptance. Restore a clean exact-snapshot review boundary before another result is considered.

Planned tests remain owned by the Execution Thread. Validation may run only bounded checks needed for a concrete doubt. Full release verification remains owned by explicit Release mode.

## Findings Severity

- Critical means an authorization violation, unsafe behavior, data loss, or a premise that cannot be accepted as designed.
- Important means the approved contract is not met, a meaningful regression or omission exists, or evidence is insufficient for acceptance.
- Minor means a bounded quality issue that does not invalidate acceptance and normally becomes explicit debt.

## Remediation Stop Rule

After two remediation rounds, any remaining Critical or Important issue stops automatic routing. The Main Thread must reassess the plan, architecture, or acceptance criteria and present a real decision. Minor findings default to explicit debt unless they materially affect the current decision.

## Failure Handling

- Failure to create the preauthorized validator leaves the lane validation-pending; it never implies acceptance.
- Host task messaging failure uses one explicit local fallback report. Do not claim delivery, start a timed retry, or create a polling loop.
- Insufficient evidence returns to the Execution Thread only when collecting that evidence is already inside the approved contract and verification budget.
- A missing or mismatched snapshot produces unable-to-verify or stale evidence.
- A formally blocked Execution Thread reports through Lane Handoff instead of waiting for the user to discover it.
- Closed Codex tasks have no background continuation or later-delivery guarantee.
```

- [ ] **Step 4: Route preauthorized review-ready events from Lane Handoff**

In `.agents/skills/navi/references/lane-handoff-v1.md`, replace only the `review-ready` action inside `## Source Main Task` with this ownership-preserving wording:

```markdown
For review-ready, first perform the bounded source-side scope and snapshot audit at the next natural checkpoint. When the originating Execution Contract includes `validation_preauthorized: true`, follow `supervised-delivery-v1.md`: mark the lane validation-pending and create at most one fresh read-only Validation Thread for the exact event and snapshot. Without that preauthorization, do not create a task automatically; present the applicable review decision.
```

Keep the rest of Lane Handoff's delivery, retry, non-event, and authority rules unchanged.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts
```

Expected: PASS. Existing Lane Handoff tests remain green and the new file passes 7 tests.

- [ ] **Step 6: Commit Task 2**

```bash
git add .agents/skills/navi/references/supervised-delivery-v1.md .agents/skills/navi/references/lane-handoff-v1.md tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: route navi independent validation"
```

---

### Task 3: Activate The Loop Without Creating A Second Policy Owner

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/project-map-v1.md`
- Modify: `.agents/skills/navi/references/supervision-v1.md`
- Create: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/lane-handoff-v1.md`
- Modify: `plugins/navi/skills/navi/references/project-map-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`
- Modify: `tests/skills/navi-supervision.test.ts`

**Interfaces:**
- Consumes: Task 2's canonical owner and Lane Handoff route.
- Produces: active skill routing, quietness and approval boundaries, and a byte-identical packaged skill surface.

- [ ] **Step 1: Add failing owner-integration and mirror tests**

Append to `tests/skills/navi-supervised-delivery.test.ts`:

```ts
  it("keeps one detailed owner and a byte-identical package mirror", async () => {
    const [skill, delivery, packagedDelivery, projectMap, supervision] =
      await Promise.all([
        readRepoText(".agents/skills/navi/SKILL.md"),
        readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
        readRepoText("plugins/navi/skills/navi/references/supervised-delivery-v1.md"),
        readRepoText(".agents/skills/navi/references/project-map-v1.md"),
        readRepoText(".agents/skills/navi/references/supervision-v1.md"),
      ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(skill).toMatch(/do not create more than one Validation Thread/i);
    expect(skill).toMatch(/do not let a Validation Thread write/i);
    expect(packagedDelivery).toBe(delivery);
    expect(projectMap).toContain("supervised-delivery-v1.md");
    expect(supervision).toContain("supervised-delivery-v1.md");
    expect(supervision).not.toContain("NAVI_VALIDATION_RESULT\nversion: 1");
  });
```

In `tests/skills/navi-supervision.test.ts`, add one focused integration test:

```ts
  it("connects review-ready coordination to independent validation", async () => {
    const [skill, projectMap, laneHandoff, delivery] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
    ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(projectMap).toMatch(/review-ready[\s\S]*independent Validation Thread/i);
    expect(laneHandoff).toMatch(/validation_preauthorized: true[\s\S]*validation-pending/i);
    expect(delivery).toMatch(/Main Thread[\s\S]*Execution Thread[\s\S]*Validation Thread/i);
  });
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts
```

Expected: FAIL because the skill routing, package mirror, and reference pointers do not exist.

- [ ] **Step 3: Activate the new owner in the canonical skill**

Add this bullet to `.agents/skills/navi/SKILL.md` under `## Required References`:

```markdown
- `references/supervised-delivery-v1.md` for preauthorized independent validation, exact-snapshot review, findings routing, and bounded remediation.
```

Add these hard boundaries near the existing worktree and Lane Handoff boundaries:

```markdown
- Codex must not create more than one Validation Thread for the same review-ready event and exact snapshot.
- Codex must not let a Validation Thread write files, implement fixes, merge, push, tag, release, or accept product risk.
- Codex must not ask the user to relay review-ready events, validation results, or in-scope remediation between tasks when host task messaging is available.
- Codex must not treat review-ready as accepted; a preauthorized Supervised Delivery Loop remains validation-pending until a valid exact-snapshot result returns.
- Codex must not exceed two in-scope remediation rounds without returning to product or user judgment.
```

Add this behavior guardrail after the existing Lane Handoff guidance:

```markdown
- For an approved bounded implementation contract with validation preauthorization, use `references/supervised-delivery-v1.md`; create the fresh validator only at review-ready, route routine in-scope findings without asking for another `continue`, and preserve explicit user control over permission, scope, risk, merge, push, tag, release, and publication.
```

- [ ] **Step 4: Add concise owner pointers to Project Map and Supervision**

In `.agents/skills/navi/references/project-map-v1.md`, revise `### Parallel Work And Review Readiness` so it includes this sentence without copying schemas:

```markdown
When an approved Execution Contract preauthorizes independent validation, a valid review-ready event enters the Codex-first Supervised Delivery Loop: the source Main Thread creates one fresh read-only Validation Thread for the exact snapshot under `supervised-delivery-v1.md`. The user does not relay the event or approve routine in-scope review routing.
```

In `.agents/skills/navi/references/supervision-v1.md`, add a short section after the Coordination Layer boundaries:

```markdown
### Codex-First Supervised Delivery

For approved bounded implementation delivery, Lane Handoff transports execution transitions and `supervised-delivery-v1.md` owns independent validation contracts, results, and remediation routing. This is a User Supervision workflow state, not a fifth Work Mode, a release lane, or Runtime Surface.

The Main Thread remains useful during non-conflicting execution and validation. Only permission, scope, architecture, risk, acceptance, merge, push, tag, release, publication, or a genuinely blocked whole session requires user interruption.
```

- [ ] **Step 5: Create exact package mirrors**

Copy only the canonical skill files changed by Tasks 1-3 to their corresponding `plugins/navi/skills/navi/` paths:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
cp .agents/skills/navi/references/project-map-v1.md plugins/navi/skills/navi/references/project-map-v1.md
cp .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Do not manually maintain divergent package wording.

- [ ] **Step 6: Run focused tests and package verification**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts
npm run verify:plugin-package
```

Expected: both focused files pass; the package verifier passes skill tests, plugin manifest validation, and exact source/package drift checks.

- [ ] **Step 7: Commit Task 3**

```bash
git add .agents/skills/navi plugins/navi/skills/navi tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts
git commit -m "feat: activate navi supervised delivery"
```

---

### Task 4: Make Current-Main Capability And Product Boundaries Truthful

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/navi/design-history.md`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: the implemented prompt/docs-backed loop from Tasks 1-3.
- Produces: external-reader truthfulness, active design navigation, and final bounded acceptance evidence.

- [ ] **Step 1: Add failing truthfulness and active-index tests**

Append this test to `tests/skills/navi-capability-truthfulness.test.ts`:

```ts
  it("describes supervised delivery as unreleased active-session behavior", async () => {
    const [readme, chineseReadme, pluginReadme] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const surface of [readme, pluginReadme]) {
      expect(surface).toMatch(/Supervised Delivery Loop[\s\S]*Main Thread[\s\S]*Execution Thread[\s\S]*Validation Thread/i);
      expect(surface).toMatch(/Codex host[\s\S]*active session/i);
      expect(surface).toMatch(/unreleased[\s\S]*not a scheduler[\s\S]*not a background service/i);
      expect(surface).toMatch(/does not automatically merge, push, tag, or release/i);
    }

    expect(chineseReadme).toMatch(/Supervised Delivery Loop[\s\S]*主线程[\s\S]*执行线程[\s\S]*验证线程/i);
    expect(chineseReadme).toMatch(/Codex host[\s\S]*活跃会话/i);
    expect(chineseReadme).toMatch(/尚未发布[\s\S]*不是调度器[\s\S]*不是后台服务/i);
  });
```

Extend the active-design test in `tests/repository/current-surface.test.ts`:

```ts
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-15-navi-supervised-delivery-loop.md`",
    );
```

Add one owner-boundary assertion in the same repository test file:

```ts
  it("keeps supervised delivery contracts in one active owner", async () => {
    const [skill, delivery, supervision] = await Promise.all([
      fs.readFile(path.join(root, ".agents/skills/navi/SKILL.md"), "utf8"),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervised-delivery-v1.md"),
        "utf8",
      ),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervision-v1.md"),
        "utf8",
      ),
    ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(delivery).toContain("NAVI_VALIDATION_RESULT");
    expect(supervision).not.toContain("NAVI_VALIDATION_RESULT\nversion: 1");
  });
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: FAIL because the public surfaces and active plan entry are absent.

- [ ] **Step 3: Update current-main truthfulness without changing release identity**

Update the three README surfaces with one compact section. The English canonical wording is:

```markdown
### Codex-first Supervised Delivery Loop

Current main includes an unreleased, prompt/docs-backed Supervised Delivery Loop for approved bounded implementation work. The persistent Main Thread owns goals and decisions, a worktree Execution Thread changes files and returns evidence, and one fresh read-only Validation Thread independently reviews the exact snapshot before acceptance.

The loop uses Codex host task creation and task-to-task messaging while the source task is active. It is not a scheduler, durable queue, watcher, or background service, and it does not automatically merge, push, tag, or release. Permission, scope, architecture, known-risk, integration, and publication decisions remain explicit.
```

Use this synchronized Chinese wording in `README.zh-CN.md`:

```markdown
### Codex-first Supervised Delivery Loop

当前 main 包含一个尚未发布、由 prompt/docs 支撑的 Supervised Delivery Loop，用于已批准且边界明确的实现工作。持续存在的主线程负责目标和决策，worktree 执行线程负责修改文件并返回证据，一个新建的只读验证线程在接受结果前独立审查精确 snapshot。

该闭环只在来源任务活跃时使用 Codex host 的任务创建和任务间消息能力。它不是调度器、持久队列、watcher 或后台服务，也不会自动 merge、push、tag 或 release。权限、范围、架构、已知风险、集成和发布决策仍需明确处理。
```

Place the section near the existing Lane Handoff architecture boundary. Keep `0.1.0-alpha.3` as the latest tagged release and state that both Lane Handoff and Supervised Delivery are unreleased current-main behavior. Do not change `package.json`, version files, changelog, release notes, or publication metadata.

- [ ] **Step 4: Index the active plan**

Add this exact entry under `## Active` in `docs/navi/design-history.md`, directly after the approved design:

```markdown
- `docs/superpowers/plans/2026-07-15-navi-supervised-delivery-loop.md`
```

Do not rewrite historical statuses or change the current Product Stage solely for this implementation.

- [ ] **Step 5: Run the exact bounded acceptance suite**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
git diff --check
```

Expected:

- all four focused test files pass;
- typecheck exits 0;
- plugin package verification passes skill tests, manifest validation, and byte-identical mirror checks;
- `git diff --check` exits 0.

Do not run full `npm test`, release verification, npm pack, tag checks, or external project mutation.

- [ ] **Step 6: Audit exact scope and forbidden capabilities**

Run:

```bash
git diff --name-only HEAD~3
rg -n "setInterval|setTimeout|chokidar|sqlite|database|background service|automatic merge|automatic push|automatic release" src package.json package-lock.json .agents/skills/navi plugins/navi/skills/navi
git status --short --branch
```

Expected:

- changed files are limited to the paths listed in Tasks 1-4;
- no runtime, dependency, CLI, package metadata, release metadata, external target, Historical Along, or `work/` changes exist;
- forbidden runtime/API patterns have no new implementation match; descriptive boundary wording may match Markdown and must be inspected rather than deleted;
- before the Task 4 commit, status contains only the six intended Task 4 files.

- [ ] **Step 7: Commit Task 4**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md docs/navi/design-history.md tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
git commit -m "docs: explain navi supervised delivery boundaries"
```

- [ ] **Step 8: Confirm the four-commit candidate is clean**

Run:

```bash
git diff --name-only HEAD~4 HEAD
git diff HEAD~4 HEAD --check
git status --short --branch
```

Expected:

- the base-to-HEAD path list matches the complete planned scope;
- the four-commit diff check exits 0;
- the worktree is clean at the exact candidate HEAD.

---

## Parent Review And Independent Validation Gate

After the Execution Thread sends one `review-ready` `NAVI_LANE_HANDOFF_EVENT`, the parent Main Thread performs a bounded read-only scope/snapshot audit and then creates one fresh Validation Thread under the plan's preauthorization. This gate is part of accepting the implementation, not a fifth implementation task or a reason for the Main Thread to stop non-conflicting work.

The validator receives only:

- this plan and the approved design spec;
- the exact implementation baseline and candidate HEAD;
- the Execution Contract and review-ready event;
- the base-to-HEAD diff and changed-file list;
- the exact bounded verification commands and evidence;
- the assigned validation level, read-only rule, and command budget.

The validator does not receive the executor's full transcript or private reasoning. It returns `NAVI_VALIDATION_RESULT` directly to the source Main Thread. The parent deduplicates by `result_id`, rejects a mismatched snapshot, and routes the verdict exactly as specified in the new owner.

Integration, merge, push, tag, release, publication, new permissions, scope expansion, and known-risk acceptance remain separate explicit user decisions.

## First Real Calibration Gate

After explicit integration, use the first natural bounded Navi implementation as calibration rather than creating an artificial release checklist. Record only:

- manual user message relays: expected `0`;
- extra `continue` prompts caused by hidden routing: expected `0`;
- validators created for one review-ready snapshot: expected `1`;
- validator writes: expected `0`;
- extra approvals for in-scope remediation: expected `0`;
- unauthorized release-level checks: expected `0`;
- whether the Main Thread continued useful non-conflicting work;
- whether real permission, scope, risk, merge, push, tag, and release decisions remained explicit.

Run two additional natural bounded tasks only if the first sample leaves a concrete uncertainty. Stop calibration after two or three samples; do not pursue a zero-friction proof or use calibration to enter Release mode.
