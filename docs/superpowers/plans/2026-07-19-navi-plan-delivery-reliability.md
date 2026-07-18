# Navi Plan And Delivery Reliability V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent unsatisfiable plan artifacts and undelivered Execution or Validation results from creating repeated user approvals, user relay work, or meaningless `continue` prompts.

**Architecture:** Add one focused `plan-reliability-v1.md` owner for pre-submission and Execution-preflight checks plus one aggregate, semantics-preserving correction round. Keep delivery completion in the existing `lane-handoff-v1.md` owner, and let `supervised-delivery-v1.md` adopt both policies without duplicating them. This remains prompt/docs-backed Codex-first behavior with static contract tests and no parser, runtime, queue, or persistent state.

**Tech Stack:** Markdown skill contracts, TypeScript/Vitest static contract tests, existing canonical/package mirror verification, Git worktree isolation, Codex task messaging.

## Global Constraints

- Implement only `docs/superpowers/specs/2026-07-19-navi-plan-delivery-reliability-design.md`.
- `plan-reliability-v1.md` is the sole detailed plan-reliability owner; `lane-handoff-v1.md` remains the sole detailed delivery owner; `supervised-delivery-v1.md` adopts both without duplicating their detailed rules.
- Every implementation-plan Execution Contract records `plan_satisfiability_check: required` and `plan_artifact_correction: bounded`.
- The plan author checks satisfiability before submission; the Execution Task performs one cheap baseline-aware preflight before production edits.
- Mechanical correction requires unchanged semantics, files, permissions, risks, acceptance criteria, validation budget, and stop conditions; it is one aggregate round only.
- A design-to-plan omission, owner change, scope expansion, permission change, risk change, acceptance change, or verification reduction is not mechanical and routes `decision-required`.
- Delegated Execution and Validation prompts must require an actual host task-message call to exact `source_task`, host success evidence, one same-ID retry on reported failure, and a local Completion Receipt.
- A local final answer is not direct delivery. Two failed sends preserve the local event and stop for existing one-shot Main-Task Reconciliation.
- Do not add a generic Markdown parser, plan DSL, scheduler, database, durable queue, daemon, watcher, notification service, Runtime Surface, persistent task state, acknowledgement loop, or Main Turn adapter.
- Do not edit `package.json`, `package-lock.json`, `plugins/navi/VERSION.md`, `src/`, `archive/along`, or `work/`.
- Use normalized-whitespace assertions for prose semantics. Do not prescribe a literal-space regular expression when approved Markdown may wrap the phrase.
- Use targeted tests, `npm run verify:plugin-package`, mirror comparisons, scope audits, and `git diff --check`; do not run full `npm test` unless focused evidence exposes a broader regression.
- Execute in one true Codex worktree from the exact clean dispatch baseline. Use one independent read-only Level 3 Validation Task for the exact review-ready snapshot.
- Apply the already accepted `gpt-5.6-sol + high` route to Execution and Level 3 Validation when the destination host accepts it. A rejected route returns `decision-required` before any fallback.
- Implementation, validation, and integration do not close Product Complete. One later natural joint calibration remains required.
- Merge, push, tag, release, publication, and calibration writes remain separate Main Thread and user decisions.

## Main-Thread Pre-Dispatch Gate

Before creating the worktree Execution Task:

1. confirm `main` is clean except the existing untracked `work/` path;
2. confirm this plan and its approved design are committed on `main`;
3. set `baseline` to the exact plan-bearing `git rev-parse HEAD`;
4. leave `work/` outside every task, commit, diff, and audit scope;
5. include both plan-reliability fields in the Execution Contract;
6. if the worktree lacks `node_modules`, include the already designed bounded dependency-restore extension with exact baseline and lockfile digest;
7. preauthorize one fresh Level 3 Validation Task and at most two in-scope remediation rounds; and
8. embed the approved Delivery Completion Clause directly in both delegated task prompts rather than supplying only a reference path.

The Execution Task performs the aggregate Task 1-4 plan satisfiability scan before production edits. It may batch only plan-artifact defects that satisfy the approved mechanical correction class. Any semantic contradiction returns one aggregated `decision-required` event.

---

### Task 1: Define The Plan Reliability Owner

**Files:**
- Create: `.agents/skills/navi/references/plan-reliability-v1.md`
- Create: `plugins/navi/skills/navi/references/plan-reliability-v1.md`
- Create: `tests/skills/navi-plan-reliability.test.ts`
- Modify: `tests/skills/navi-skill.test.ts:270-290`

**Interfaces:**
- Consumes: approved Execution Contract vocabulary and existing `decision-required` routing.
- Produces: the two contract fields, two checkpoints, classification fixtures, one aggregate correction lifecycle, and compact evidence used by Task 2.

- [ ] **Step 1: Add the failing owner test**

Create `tests/skills/navi-plan-reliability.test.ts` with this complete content:

```ts
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL("../../" + relativePath, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const marker = heading + "\n";
  const start = markdown.indexOf(marker);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  const contentStart = start + marker.length;
  const nextHeading = /\n## /gu;
  nextHeading.lastIndex = contentStart;
  const match = nextHeading.exec(markdown);
  return markdown.slice(contentStart, match?.index ?? markdown.length);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/[|`]/gu, " ").replace(/\s+/gu, " ").trim();
}

describe("Navi Plan Reliability V1", () => {
  it("defines the contract and both bounded checkpoints", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const contract = extractSection(reference, "## Execution Contract Fields");
    const checkpoints = normalizeWhitespace(
      extractSection(reference, "## Plan Checkpoints"),
    );

    expect(contract).toContain("plan_satisfiability_check: required");
    expect(contract).toContain("plan_artifact_correction: bounded");
    expect(normalizeWhitespace(contract)).toContain(
      "default Navi Supervised Delivery policy rather than a new per-defect user permission",
    );
    expect(checkpoints).toContain("Checkpoint 1: Before Plan Submission");
    expect(checkpoints).toContain("Checkpoint 2: Execution Preflight");
    expect(checkpoints).toContain(
      "Evaluate explicit regular expressions against the exact rendered prose",
    );
    expect(checkpoints).toContain(
      "complete one aggregate scan before reporting or correcting any defect",
    );
    expect(checkpoints).toContain("A clean preflight remains quiet");
  });

  it("separates mechanical artifacts from semantic decisions", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const eligibility = normalizeWhitespace(
      extractSection(reference, "## Mechanical Correction Eligibility"),
    );
    const fixtures = normalizeWhitespace(
      extractSection(reference, "## Classification Fixtures"),
    );

    for (const unchanged of [
      "product meaning",
      "authorized files and ownership",
      "permissions and risk",
      "acceptance criteria and validation budget",
      "stop conditions",
    ]) {
      expect(eligibility).toContain(unchanged);
    }
    expect(fixtures).toContain(
      "Hard-wrapped Markdown breaks a literal-space assertion Mechanical Use an equivalent whitespace-tolerant assertion",
    );
    expect(fixtures).toContain(
      "A scope-audit command runs before its intended commit Mechanical Run it after that commit and record the timing correction",
    );
    expect(fixtures).toContain(
      "An approved safety requirement is missing from the plan Semantic Return one aggregated decision-required event",
    );
    expect(fixtures).toContain(
      "A change reduces verification or expands files Semantic Return one aggregated decision-required event",
    );
  });

  it("allows one aggregate correction round and compact evidence", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Aggregate Correction Lifecycle"),
    );
    const evidence = extractSection(reference, "## Evidence And Quietness");

    expect(lifecycle).toContain("at most one aggregate correction round");
    expect(lifecycle).toContain(
      "A new plan-artifact defect after that round returns to Main Thread premise judgment",
    );
    expect(evidence).toContain("plan_check: passed | corrected");
    expect(evidence).toContain(
      "plan_corrections: none | concise bounded list",
    );
    expect(normalizeWhitespace(evidence)).toContain(
      "must not request continue after a passing check or successful bounded correction",
    );
  });

  it("keeps the packaged owner byte-identical", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/plan-reliability-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/plan-reliability-v1.md"),
    ]);
    expect(packaged).toBe(canonical);
  });
});
```

- [ ] **Step 2: Add the failing package-layout expectation**

Add this path to the plugin package-layout `requiredPath` array in `tests/skills/navi-skill.test.ts`:

```ts
"plugins/navi/skills/navi/references/plan-reliability-v1.md",
```

- [ ] **Step 3: Run the focused RED check**

Run:

```bash
npm test -- tests/skills/navi-plan-reliability.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because both plan-reliability owner files are absent.

- [ ] **Step 4: Create the canonical owner**

Create `.agents/skills/navi/references/plan-reliability-v1.md` with this complete content:

```markdown
# Navi Plan Reliability V1

Use this reference for implementation plans inside Navi Supervised Delivery.
It owns plan satisfiability, strictly mechanical plan-artifact correction, and
their quiet evidence. It does not own product design, delivery transport,
validation verdicts, or user risk acceptance.

This is prompt/docs-backed Codex-first policy. It is not a general Markdown
parser, plan DSL, scheduler, database, queue, daemon, or Runtime Surface.

## Ownership And Scope

This reference is the sole detailed owner for the pre-submission plan check,
Execution preflight check, mechanical correction eligibility, one aggregate
correction round, and compact plan-check evidence.

`supervised-delivery-v1.md` adopts this owner. `lane-handoff-v1.md` owns
direct delivery and decision transport.

## Execution Contract Fields

Every implementation-plan Execution Contract records exactly:

plan_satisfiability_check: required
plan_artifact_correction: bounded

These fields are default Navi Supervised Delivery policy rather than a new
per-defect user permission. They apply only to the named task, approved plan,
exact baseline, and authorized scope. Missing or conflicting values disable
automatic correction and return to Main Thread judgment.

## Plan Checkpoints

### Checkpoint 1: Before Plan Submission

Before presenting a plan as implementation-ready, check that prescribed prose,
assertions, RED and GREEN expectations, command timing, file lists, commit
scopes, design requirements, acceptance conditions, and forbidden scope can
all coexist. Evaluate explicit regular expressions against the exact rendered
prose. Compare explicit path sets and command ranges with bounded native tools
when the claim can be evaluated cheaply.

### Checkpoint 2: Execution Preflight

Before production edits, verify that the plan still matches the exact baseline,
named files, available commands, task ordering, and prescribed fragments. On
the first defect, complete one aggregate scan before reporting or correcting
any defect. A clean preflight remains quiet. Do not build a general parser.

## Mechanical Correction Eligibility

A correction is mechanical only when all of these remain unchanged:

- product meaning;
- authorized files and ownership;
- permissions and risk;
- acceptance criteria and validation budget; and
- stop conditions.

The artifacts must be demonstrably equivalent for the approved purpose and
remain inside existing task scope. If equivalence is unclear, classify the
issue as semantic.

## Classification Fixtures

| Situation | Class | Route |
| --- | --- | --- |
| Hard-wrapped Markdown breaks a literal-space assertion | Mechanical | Use an equivalent whitespace-tolerant assertion |
| A scope-audit command runs before its intended commit | Mechanical | Run it after that commit and record the timing correction |
| An approved safety requirement is missing from the plan | Semantic | Return one aggregated decision-required event |
| A change reduces verification or expands files | Semantic | Return one aggregated decision-required event |

## Aggregate Correction Lifecycle

The Execution Task may perform at most one aggregate correction round. First
collect the complete related mechanical defect set, then apply directed checks
and continue the approved plan without a user prompt.

If the plan file is outside authorized scope, do not edit it. Record an
equivalent command-timing correction in task evidence. A new plan-artifact
defect after that round returns to Main Thread premise judgment. Do not start
an unbounded correction loop.

## Evidence And Quietness

Review-ready evidence records only:

plan_check: passed | corrected
plan_corrections: none | concise bounded list

A passing check and successful bounded correction are quiet. The task must not
request `continue` after a passing check or successful bounded correction.
Surface one aggregated decision only for semantic, scope, permission, risk,
acceptance, validation-budget, or exhausted-correction questions.

## Hard Boundaries

Plan reliability does not authorize lowered acceptance, reduced verification,
new files outside allowed scope, dependency changes, cleanup, merge, push,
tag, release, publication, or automatic user-risk acceptance.
```

- [ ] **Step 5: Create the package mirror**

Run:

```bash
cp .agents/skills/navi/references/plan-reliability-v1.md plugins/navi/skills/navi/references/plan-reliability-v1.md
```

- [ ] **Step 6: Run GREEN and commit**

Run:

```bash
npm test -- tests/skills/navi-plan-reliability.test.ts tests/skills/navi-skill.test.ts
diff -q .agents/skills/navi/references/plan-reliability-v1.md plugins/navi/skills/navi/references/plan-reliability-v1.md
```

Expected: both test files PASS and `diff -q` prints nothing. Review the exact
four-file diff, then run:

```bash
git add .agents/skills/navi/references/plan-reliability-v1.md plugins/navi/skills/navi/references/plan-reliability-v1.md tests/skills/navi-plan-reliability.test.ts tests/skills/navi-skill.test.ts
git commit -m "feat: define navi plan reliability"
```


---

### Task 2: Adopt Plan Reliability In Supervised Delivery

**Files:**
- Modify: `.agents/skills/navi/SKILL.md:18-31,59-68,111-114`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md:15-35`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-plan-reliability.test.ts`
- Modify: `tests/skills/navi-supervised-delivery.test.ts:15-34`

**Interfaces:**
- Consumes: the Task 1 owner and its two exact contract fields.
- Produces: routing and lifecycle adoption without copying correction details.

- [ ] **Step 1: Add failing adoption coverage**

Append this test to `tests/skills/navi-plan-reliability.test.ts`:

```ts
it("is adopted without duplicating the detailed owner", async () => {
  const [skill, delivery, owner, packagedSkill, packagedDelivery] =
    await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
      readRepoText(".agents/skills/navi/references/plan-reliability-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText(
        "plugins/navi/skills/navi/references/supervised-delivery-v1.md",
      ),
    ]);
  const adoption = normalizeWhitespace(
    extractSection(delivery, "## Plan Reliability Adoption"),
  );

  expect(skill).toContain("references/plan-reliability-v1.md");
  expect(skill).toContain("plan_satisfiability_check: required");
  expect(skill).toContain("plan_artifact_correction: bounded");
  expect(adoption).toContain(
    "Before plan approval use the pre-submission check; before production edits use the Execution preflight check",
  );
  expect(adoption).toContain(
    "The detailed eligibility, aggregate correction, evidence, and quietness rules remain owned by plan-reliability-v1.md",
  );
  expect(delivery).not.toContain("## Classification Fixtures");
  expect(owner).toContain("## Classification Fixtures");
  expect(packagedSkill).toBe(skill);
  expect(packagedDelivery).toBe(delivery);
});
```

Add these fields to the first Execution Contract field array in
`tests/skills/navi-supervised-delivery.test.ts`:

```ts
"plan_satisfiability_check: required",
"plan_artifact_correction: bounded",
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- tests/skills/navi-plan-reliability.test.ts tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because the skill, Execution Contract, and adoption section do
not yet reference the new owner.

- [ ] **Step 3: Add canonical skill routing**

In `.agents/skills/navi/SKILL.md`, add:

Under Required References, after the Lane Handoff bullet:

```markdown
- `references/plan-reliability-v1.md` is the sole owner for implementation-plan satisfiability checks, bounded mechanical plan-artifact correction, correction evidence, and plan-reliability quietness.
```

Under Hard Boundaries, after Main-Task Reconciliation:

```markdown
- For implementation plans, Navi must require `plan_satisfiability_check: required` and `plan_artifact_correction: bounded`; it must not turn mechanical plan-artifact correction into semantic, scope, permission, risk, acceptance, or verification authority.
```

Under Behavior Guardrails, after the Supervised Delivery routing rule:

```markdown
- Before plan approval and before Execution production edits, use `references/plan-reliability-v1.md`; keep passing checks and one successful bounded mechanical correction quiet, and aggregate real plan decisions before surfacing them.
```

- [ ] **Step 4: Add Supervised Delivery adoption**

In `.agents/skills/navi/references/supervised-delivery-v1.md`, add these fields
after `implementation_plan`:

```text
plan_satisfiability_check: required
plan_artifact_correction: bounded
```

Add this section after Execution Contract and before Dependency Restore:

```markdown
## Plan Reliability Adoption

Every implementation-plan contract adopts `plan-reliability-v1.md`. Before
plan approval use the pre-submission check; before production edits use the
Execution preflight check. A clean result continues quietly. An eligible
mechanical defect set may use one aggregate correction round; every semantic,
scope, permission, risk, acceptance, or verification change returns to Main
Thread judgment.

The detailed eligibility, aggregate correction, evidence, and quietness rules
remain owned by `plan-reliability-v1.md`. Do not copy its fixtures or create a
second correction schema here.
```

- [ ] **Step 5: Copy mirrors, run GREEN, and commit**

Run:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
npm test -- tests/skills/navi-plan-reliability.test.ts tests/skills/navi-supervised-delivery.test.ts
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: both tests PASS and both mirror checks print nothing. Confirm the
detailed fixture table and correction lifecycle remain only in the Task 1
owner. Then run:

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-plan-reliability.test.ts tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: route navi plan reliability"
```


---

### Task 3: Make Direct Delivery A Completion Condition

**Files:**
- Modify: `.agents/skills/navi/references/lane-handoff-v1.md:25-94`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md:151-230`
- Modify: `plugins/navi/skills/navi/references/lane-handoff-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-supervision.test.ts:430-560`
- Modify: `tests/skills/navi-supervised-delivery.test.ts:230-285`

**Interfaces:**
- Consumes: exact `source_task`, stable event/result identity, existing retry and fallback, Awaiting Direct Event, and Main-Task Reconciliation.
- Produces: an embedded host-operation clause, host-success completion rule, local Completion Receipt, and explicit local-final non-delivery rule.

- [ ] **Step 1: Add failing Lane Handoff coverage**

Append this test to `tests/skills/navi-supervision.test.ts`:

```ts
it("requires host-confirmed delivery before a task claims completion", async () => {
  const [canonical, packaged] = await Promise.all([
    readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
    readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
  ]);
  const completion = extractMarkdownSection(
    canonical,
    "## Delivery Completion Clause",
  );
  const normalized = completion
    .replace(/[|`]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  expect(normalized).toContain(
    "Every delegated Execution or Validation Task prompt must include this operation",
  );
  expect(normalized).toContain(
    "call the available Codex host task-messaging capability",
  );
  expect(normalized).toContain(
    "send to the exact source_task and obtain host success evidence",
  );
  expect(normalized).toContain(
    "A payload printed only in the task's own final answer is a local report, not direct delivery",
  );
  expect(completion).toContain("delivery_attempts: 1 | 2");
  expect(completion).toContain("delivery_state: delivered | failed");
  expect(normalized).toContain(
    "delivered requires host tool success; failed requires two reported delivery failures",
  );
  expect(normalized).toContain(
    "Do not send an acknowledgement or a second message only to confirm receipt",
  );
  expect(packaged).toBe(canonical);
});
```

- [ ] **Step 2: Add failing Supervised Delivery adoption coverage**

Append this test to `tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("embeds the delivery operation in Execution and Validation prompts", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const adoption = extractSection(reference, "## Delivery Completion Adoption");
  const normalized = adoption
    .replace(/[|`]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();

  expect(normalized).toContain(
    "Execution and Validation task prompts must embed the Delivery Completion Clause operation",
  );
  expect(normalized).toContain("A reference path alone is insufficient");
  expect(normalized).toContain(
    "Only host-confirmed delivery allows the task to claim handoff completion",
  );
  expect(normalized).toContain(
    "Two failed attempts preserve the complete local report for one-shot Main-Task Reconciliation",
  );
  expect(adoption).not.toContain("delivery_attempts: 1 | 2");
});
```

- [ ] **Step 3: Run RED**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because both new sections are absent.

- [ ] **Step 4: Add the canonical Delivery Completion Clause**

In `.agents/skills/navi/references/lane-handoff-v1.md`, add this section after
Pre-Send Wire-Format Check and before Decision Required:

```markdown
## Delivery Completion Clause

Every delegated Execution or Validation Task prompt must include this operation
directly. A reference path alone is insufficient:

1. render the complete valid event or result;
2. call the available Codex host task-messaging capability;
3. send to the exact `source_task` and obtain host success evidence;
4. on a reported delivery failure, retry once immediately with the same
   identifier and semantically identical payload; and
5. refuse to claim handoff completion when neither attempt succeeds.

A payload printed only in the task's own final answer is a local report, not
direct delivery. It does not satisfy this completion condition.

After the host call, record one local Completion Receipt:

delivery_attempts: 1 | 2
delivery_state: delivered | failed

`delivered` requires host tool success; `failed` requires two reported
delivery failures. The wire payload does not claim its own delivery outcome,
because that outcome exists only after the send operation.

Host success plus the local receipt completes the handoff. Do not send an
acknowledgement or a second message only to confirm receipt.
```

Add this paragraph after the first paragraph of Delivery, Retry, And Fallback:

```markdown
The delegated task follows Delivery Completion Clause before it reports
completion. After two failed attempts, preserve the complete local transition
report, record `delivery_state: failed`, and stop. The Source Main Task may
recover that report only through existing one-shot Main-Task Reconciliation at
a relevant dependent checkpoint.
```

- [ ] **Step 5: Add Supervised Delivery adoption**

In `.agents/skills/navi/references/supervised-delivery-v1.md`, add this section
after Pre-Send Validation Wire-Format Check and before Validation Levels:

```markdown
## Delivery Completion Adoption

Execution and Validation task prompts must embed the Delivery Completion Clause
operation from `lane-handoff-v1.md`. A reference path alone is insufficient.
Each task must call host task messaging for exact `source_task` and retain
host success evidence.

Only host-confirmed delivery allows the task to claim handoff completion. A
local final answer remains fallback evidence, not delivery. Two failed attempts
preserve the complete local report for one-shot Main-Task Reconciliation.
Retry, receipt, fallback, and no-acknowledgement details remain owned by
`lane-handoff-v1.md` and are not duplicated here.
```

- [ ] **Step 6: Copy mirrors, run GREEN, and commit**

Run:

```bash
cp .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
npm test -- tests/skills/navi-supervision.test.ts tests/skills/navi-supervised-delivery.test.ts
diff -q .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: both tests PASS and both mirror checks print nothing. Confirm receipt
fields exist only in Lane Handoff and the payload does not claim its own future
delivery result. Then run:

```bash
git add .agents/skills/navi/references/lane-handoff-v1.md .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervision.test.ts tests/skills/navi-supervised-delivery.test.ts
git commit -m "fix: require delivered navi task results"
```


---

### Task 4: Record Reliability Samples And The Natural Calibration Gate

**Files:**
- Modify: `docs/navi/calibration-log.md:1-120`
- Modify: `docs/navi/design-history.md:5-35`
- Modify: `docs/navi/product-debt.md:260-end`
- Modify: `docs/navi/roadmap.md:1-18`
- Modify: `tests/repository/current-surface.test.ts:44-78,114-122`

**Interfaces:**
- Consumes: Tasks 1-3 as implemented but not naturally calibrated behavior.
- Produces: active authority, two factual failure samples, bounded debt, and one post-integration natural calibration gate.

- [ ] **Step 1: Add failing truthfulness coverage**

Append this test inside the existing Current Navi repository `describe` block in
`tests/repository/current-surface.test.ts`:

```ts
it("records plan and delivery reliability as active but uncalibrated", async () => {
  const [history, roadmap, debt, calibration] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
  ]);
  const active =
    history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

  expect(active).toContain(
    "`docs/superpowers/specs/2026-07-19-navi-plan-delivery-reliability-design.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-19-navi-plan-delivery-reliability.md`",
  );
  expect(roadmap).toMatch(
    /Plan And Delivery Reliability V1[\s\S]*one natural joint calibration/i,
  );
  expect(debt).toContain("### 10. Plan And Delivery Reliability Debt");
  expect(debt).toMatch(
    /general Markdown parser[\s\S]*not justified[\s\S]*natural calibration/i,
  );
  expect(calibration).toContain(
    "## 2026-07-18 - Repeated Unsatisfiable Plan-Artifact Decisions",
  );
  expect(calibration).toContain(
    "## 2026-07-18 - Validation Result Printed But Not Delivered",
  );
  expect(calibration).toMatch(
    /user relay count: 0[\s\S]*meaningless continue count: 0/i,
  );
  expect(roadmap).not.toMatch(/Product Complete is closed/i);
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because active authority, debt item 10, both samples, and the new
natural calibration gate are absent.

- [ ] **Step 3: Add both compact calibration samples**

Update the header to `Last updated: 2026-07-19`. Then, after the introductory
status and before older samples, add:

```markdown
## 2026-07-18 - Repeated Unsatisfiable Plan-Artifact Decisions

Mode: Implementation planning and bounded implementation

Observed: one approved plan prescribed Markdown and assertions that could not
match after ordinary line wrapping. The Execution Task surfaced equivalent
regex defects one at a time, requiring repeated user approvals. A later batch
scan also found one real design-to-plan omission, which correctly required Main
Thread judgment.

Judgment: mechanical plan-artifact defects should be checked before dispatch,
aggregated, and corrected once without user interruption. Semantic omissions,
scope changes, permission changes, risk changes, or weaker acceptance remain
real decisions. This sample motivated Plan Satisfiability Check,
Whitespace-Safe Assertions, and Plan-Artifact Correction Class.

## 2026-07-18 - Validation Result Printed But Not Delivered

Mode: Independent Validation and task coordination

Observed: the Validation Task produced a valid `NAVI_VALIDATION_RESULT` in
its own final answer but did not call host task messaging. The user noticed
that the result had not reached the Main Thread. A bounded redelivery proved
the host messaging capability worked.

Judgment: a local final answer is not delivery. Direct host messaging and host
success evidence are task completion conditions. This failed sample does not
close Product Complete even though bounded redelivery later succeeded.

Natural follow-up acceptance remains: user relay count: 0; meaningless
continue count: 0; related plan-artifact decisions are aggregated; Execution
and Validation both deliver directly; ordinary progress is not polled.
```

- [ ] **Step 4: Activate the design and plan without claiming calibration**

Prepend these entries under `## Active` in `docs/navi/design-history.md`:

```markdown
- `docs/superpowers/specs/2026-07-19-navi-plan-delivery-reliability-design.md`
- `docs/superpowers/plans/2026-07-19-navi-plan-delivery-reliability.md`
```

Append this sentence to Current Phase:

```markdown
Plan And Delivery Reliability V1 is implemented as an unreleased Codex-first contract, but one natural joint calibration remains required before it can contribute passing Product Complete evidence.
```

- [ ] **Step 5: Add debt item 10**

Insert into `docs/navi/product-debt.md` after debt item 9 and before
`## Suggested Order`:

```markdown
### 10. Plan And Delivery Reliability Debt

Status: contract implementation pending natural calibration
Priority: high before Codex-first Product Complete closure

Problem:

Approved plans have contained mechanically unsatisfiable prose/assertion and
command-timing artifacts, while a Validation Task has also completed locally
without directly delivering its result. Both failures created user relay or
approval friction without adding product control.

Recommended fix:

- keep one focused plan-reliability owner and the existing Lane Handoff
  delivery owner;
- require pre-submission and Execution-preflight checks;
- allow one aggregate semantics-preserving correction round;
- require host-confirmed direct delivery before task completion; and
- run one natural joint calibration after integration.

A general Markdown parser is not justified by current evidence. Reconsider a
parser or Runtime Surface only if natural calibration shows that contract-first
checks and host task messaging remain insufficient.
```

- [ ] **Step 6: Update the roadmap gate**

Append this paragraph to Current Phase in `docs/navi/roadmap.md`:

```markdown
Plan And Delivery Reliability V1 is the current bounded reliability closeout: implementation and independent validation establish the contract, then one natural joint calibration must demonstrate zero user relay, zero meaningless continue, aggregate plan-artifact handling, direct Execution and Validation delivery, and preserved real user decisions. This does not close Product Complete by itself and does not authorize Runtime or Release work.
```

- [ ] **Step 7: Run GREEN and commit**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
git diff --check
```

Expected: the focused test PASS and diff check prints nothing. Review the exact
five-file diff; confirm Product Complete remains open and no Release or Runtime
claim was added. Then run:

```bash
git add docs/navi/calibration-log.md docs/navi/design-history.md docs/navi/product-debt.md docs/navi/roadmap.md tests/repository/current-surface.test.ts
git commit -m "docs: explain navi plan delivery reliability"
```

---

## Final Bounded Verification

After all four task commits exist, run:

```bash
npm test -- \
  tests/skills/navi-plan-reliability.test.ts \
  tests/skills/navi-supervised-delivery.test.ts \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-skill.test.ts \
  tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
diff -q .agents/skills/navi/references/plan-reliability-v1.md plugins/navi/skills/navi/references/plan-reliability-v1.md
diff -q .agents/skills/navi/references/lane-handoff-v1.md plugins/navi/skills/navi/references/lane-handoff-v1.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
BASELINE="$(git rev-parse HEAD~4)"
git diff --check "$BASELINE"..HEAD
git status --short
```

Confirm `BASELINE` equals the Execution Contract baseline. Expected: all five
focused files, typecheck, and plugin verification PASS; all mirror and diff
checks print nothing; status is clean except ignored project-local
`node_modules` when the approved dependency restore was used.

Run scope and capability audits:

```bash
BASELINE="$(git rev-parse HEAD~4)"
git rev-list --count "$BASELINE"..HEAD
git diff --name-only "$BASELINE"..HEAD
git diff --name-only "$BASELINE"..HEAD -- package.json package-lock.json plugins/navi/VERSION.md src archive/along work
rg -n "general Markdown parser is implemented|plan DSL is implemented|background (runtime|service)|durable queue|persistent task state|automatic Main Turn" .agents/skills/navi plugins/navi/skills/navi docs/navi
```

Expected: exactly 4 commits; exactly these 17 changed paths; forbidden-path diff
empty; no affirmative forbidden-capability claim. Negative boundaries are
allowed and must not be rejected by a bare-token audit.

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/lane-handoff-v1.md
.agents/skills/navi/references/plan-reliability-v1.md
.agents/skills/navi/references/supervised-delivery-v1.md
docs/navi/calibration-log.md
docs/navi/design-history.md
docs/navi/product-debt.md
docs/navi/roadmap.md
plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/lane-handoff-v1.md
plugins/navi/skills/navi/references/plan-reliability-v1.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
tests/repository/current-surface.test.ts
tests/skills/navi-plan-reliability.test.ts
tests/skills/navi-skill.test.ts
tests/skills/navi-supervised-delivery.test.ts
tests/skills/navi-supervision.test.ts
```

## Whole-Candidate Review And Handoff

After Final Bounded Verification:

1. obtain one fresh read-only whole-candidate review of the exact four-commit snapshot;
2. allow at most one aggregate mechanical correction round under the new owner;
3. route any semantic or authority conflict as one aggregated `decision-required`;
4. render one exact review-ready `NAVI_LANE_HANDOFF_EVENT V1`;
5. call host task messaging to exact `source_task`, require host success, and record the local Completion Receipt;
6. stop without merge, push, tag, release, publication, or calibration; and
7. let the Main Thread create the preauthorized fresh Level 3 Validation Task with the same embedded Delivery Completion Clause.

The independent validator reviews the exact snapshot, all four commits, owner
boundaries, direct-delivery completion, tests, scope, and forbidden
capabilities. It must directly send `NAVI_VALIDATION_RESULT`; printing it only
in its local final answer is a delivery failure, not acceptance.

## Plan Satisfiability Evidence

Before committing this plan and again before Execution production edits,
verify:

- every prescribed normalized phrase appears in its prescribed prose after whitespace normalization;
- Task 1 creates the owner before Task 2 adopts it;
- Task 3 puts receipt fields only in Lane Handoff and tests non-duplication;
- Task 4 commits before whole-candidate review;
- all 17 final paths are introduced by Tasks 1-4;
- no prescribed literal-space regex depends on Markdown line wrapping; and
- omitted safety requirements remain semantic decisions while delivery requires host tool success.

Record the pre-dispatch result as:

```text
plan_check: passed
plan_corrections: none
```

If a mechanical plan artifact is found before dispatch, correct the plan before
commit and rerun this entire section. Do not defer a known defect to Execution.
