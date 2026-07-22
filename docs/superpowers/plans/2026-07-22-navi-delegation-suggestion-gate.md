# Navi Delegation Suggestion Gate V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a truthful, prompt/docs-backed Navi Delegation Suggestion
Gate that decides when bounded Evidence delegation would have net value but
fails closed without creating a subagent on the currently inspected host.

**Architecture:** Add one canonical `delegation-v1.md` owner for the ephemeral
lease, eligibility and benefit gate, decision/brief/result contracts, current
host capability state, and quiet fail-closed behavior. Existing Navi Skill,
Supervision, and Supervised Delivery surfaces only route to that owner and do
not duplicate its schemas. Public and active docs state that automatic
Evidence delegation remains unavailable because the accepted host inspection
found no enforceable read-only, wave-count, or non-recursion boundary.

**Tech Stack:** Markdown skill contracts, Vitest repository contract tests,
TypeScript test helpers, canonical/package byte-identical mirrors, and existing
Navi package verification scripts.

## Global Constraints

- Approved design:
  `docs/superpowers/specs/2026-07-22-navi-delegation-gate-design.md`.
- Accepted host inspection plan:
  `docs/superpowers/plans/2026-07-22-navi-delegation-host-capability-inspection.md`.
- Accepted inspection result:
  `navi-delegation-host-inspection-validation-20260722-01` for snapshot
  `657c70702e58d88959d5e80101df36ca9b679e6f`.
- Preserve the three formal roles: Main, Execution, and Validation. A subagent
  is not a fourth role.
- Current capability state is fixed for this implementation: C1-C3 are
  present, C4-C6 are absent, C7 is unknown, and automatic Evidence delegation
  is unsupported.
- This implementation must not call `spawn_agent`, `multi_agent_v1__*`, or
  `mcp__agent_delegate__*`, and must not claim that Navi created a subagent.
- `delegate_evidence` remains a reserved design-schema value. The current
  suggestion-only branch must never emit it.
- The normal outcome is `continue_in_current_role`. Use `decision_required`
  only for a real user decision, changed premise, sensitive/external scope, or
  an explicit request that cannot be satisfied under the current host
  boundary.
- An active Delegation Lease is task-local, revocable, nonpersistent, and
  available only to Main plus already-authorized Execution tasks. Validation
  never inherits it in V1.
- Keep the approved V1 limits in the dormant brief contract: at most two
  Evidence workers, one wave per stable stage, and no recursion. These limits
  do not authorize creation on the current host.
- Every future automatic Evidence worker would still require the existing
  Task Model Routing and Route Application Gate. This implementation performs
  no worker route application because it performs no worker creation.
- Do not add runtime code, dependencies, an MCP server, database, queue,
  scheduler, watcher, daemon, panel, background service, host adapter, or
  persistent delegation state.
- Do not modify `package.json`, `package-lock.json`,
  `plugins/navi/VERSION.md`, plugin manifests, `src/`, `scripts/`, `work/`,
  Historical Along, release records, or external projects.
- Canonical/package mirrors must remain byte-identical.
- Use whitespace-normalized assertions for Markdown semantics. Do not make
  line wrapping part of contract behavior.
- If `node_modules` is absent, use the existing one-attempt project-local
  `npm ci` extension from Supervised Delivery. Do not retry, run `npm install`,
  edit package metadata, or turn that task-local authority into permanent
  permission.
- `plan_satisfiability_check: required` and
  `plan_artifact_correction: bounded` apply before production edits.
- Verification is bounded to the six focused test files, typecheck, plugin
  package verification, mirror checks, exact scope/commit audits, and diff
  checks. Do not run the full repository test suite.
- Expected implementation structure: exactly four local task commits over the
  approved execution baseline. Merge, push, tag, release, publication, and
  natural calibration remain separate user decisions.

---

### Task 1: Define The Canonical Suggestion-Only Delegation Contract

**Files:**
- Create: `.agents/skills/navi/references/delegation-v1.md`
- Create: `plugins/navi/skills/navi/references/delegation-v1.md`
- Create: `tests/skills/navi-delegation.test.ts`

**Interfaces:**
- Consumes: the approved Delegation Gate V1 design and accepted host
  capability classification.
- Produces: one canonical `NAVI_DELEGATION_CONTEXT V1`,
  `NAVI_DELEGATION_DECISION V1`, dormant `NAVI_EVIDENCE_BRIEF V1`, and dormant
  `NAVI_EVIDENCE_RESULT V1` owner; later tasks route to this file without
  copying schemas.

- [ ] **Step 1: Write the failing canonical-contract tests**

Create `tests/skills/navi-delegation.test.ts` with:

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
  const next = markdown.slice(bodyStart).search(/\n##? /u);
  return next < 0
    ? markdown.slice(start)
    : markdown.slice(start, bodyStart + next);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

describe("Navi Delegation Suggestion Gate V1", () => {
  it("records the accepted suggestion-only host boundary", async () => {
    const reference = normalizeWhitespace(
      await readRepoText(".agents/skills/navi/references/delegation-v1.md"),
    );

    expect(reference).toContain(
      "navi-delegation-host-inspection-validation-20260722-01",
    );
    expect(reference).toMatch(
      /C1-C3[\s\S]*present[\s\S]*C4-C6[\s\S]*absent[\s\S]*C7[\s\S]*unknown/i,
    );
    expect(reference).toContain("automatic Evidence delegation is unavailable");
    expect(reference).toContain("suggestion-only and fail-closed");
    expect(reference).toContain("must not call `spawn_agent`");
  });

  it("defines an ephemeral lease for Main and Execution but not Validation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const lease = normalizeWhitespace(
      extractSection(reference, "## Delegation Lease"),
    );

    expect(lease).toMatch(/task-local[\s\S]*revocable[\s\S]*not persisted/i);
    expect(lease).toMatch(/Main[\s\S]*already-authorized Execution/i);
    expect(lease).toMatch(/Validation[\s\S]*does not inherit/i);
    expect(lease).toMatch(/active \| absent \| expired/i);
    expect(lease).toMatch(/goal[\s\S]*permission[\s\S]*risk[\s\S]*work mode/i);
  });

  it("defines the bounded context and decision envelopes", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const context = extractSection(reference, "## Delegation Context");
    const decision = extractSection(reference, "## Delegation Decision");

    for (const field of [
      "NAVI_DELEGATION_CONTEXT",
      "version: 1",
      "source_task",
      "parent_role: main | execution",
      "stage",
      "goal",
      "candidate_questions",
      "candidate_scopes",
      "effects: read-only",
      "separability",
      "expected_benefit",
      "coordination_cost",
      "sensitivity",
      "lease_state: active | absent | expired",
      "host_capabilities: automatic_unsupported",
    ]) {
      expect(context).toContain(field);
    }

    for (const field of [
      "NAVI_DELEGATION_DECISION",
      "version: 1",
      "delegation_id",
      "source_task",
      "parent_role: main | execution",
      "stage",
      "result: continue_in_current_role | delegate_evidence | decision_required",
      "brief_count: 0 | 1 | 2",
      "reason_codes",
      "lease_state: active | absent | expired",
      "visibility: quiet | explain | decision-required",
    ]) {
      expect(decision).toContain(field);
    }
    expect(normalizeWhitespace(decision)).toMatch(
      /delegate_evidence[\s\S]*reserved[\s\S]*must not emit/i,
    );
  });

  it("requires hard eligibility and concrete net benefit", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const eligibility = normalizeWhitespace(
      extractSection(reference, "## Hard Eligibility"),
    );
    const benefit = normalizeWhitespace(
      extractSection(reference, "## Benefit Judgment"),
    );

    expect(eligibility).toMatch(
      /lease[\s\S]*Main or Execution[\s\S]*authorized[\s\S]*stable[\s\S]*read-only/i,
    );
    expect(eligibility).toMatch(
      /user product[\s\S]*permission[\s\S]*risk[\s\S]*integration[\s\S]*release/i,
    );
    expect(eligibility).toMatch(
      /goal[\s\S]*scope[\s\S]*evidence[\s\S]*budget[\s\S]*stop condition/i,
    );
    expect(benefit).toMatch(
      /parallel[\s\S]*context pressure[\s\S]*independent evidence/i,
    );
    expect(benefit).toMatch(
      /brief creation[\s\S]*context loading[\s\S]*reconciliation[\s\S]*model cost/i,
    );
    expect(benefit).toContain("defaults to `continue_in_current_role`");
  });

  it("fails closed without manufacturing user friction", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const behavior = normalizeWhitespace(
      extractSection(reference, "## Current Host Behavior"),
    );
    const quietness = normalizeWhitespace(
      extractSection(reference, "## Quietness And User Control"),
    );

    expect(behavior).toMatch(
      /must not call `spawn_agent`[\s\S]*must not create[\s\S]*must not claim/i,
    );
    expect(behavior).toMatch(
      /parent can continue[\s\S]*continue_in_current_role[\s\S]*quiet/i,
    );
    expect(behavior).toMatch(
      /explicitly requests[\s\S]*automatic delegation[\s\S]*decision_required/i,
    );
    expect(quietness).toMatch(/successful ordinary judgment[\s\S]*quiet/i);
    expect(quietness).toMatch(
      /must not ask[\s\S]*per-worker confirmation[\s\S]*meaningless confirmation/i,
    );
  });

  it("keeps dormant briefs and results bounded and non-authoritative", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const brief = extractSection(reference, "## Evidence Brief");
    const result = extractSection(reference, "## Evidence Result");
    const failure = normalizeWhitespace(
      extractSection(reference, "## Failure Handling"),
    );

    for (const field of [
      "NAVI_EVIDENCE_BRIEF",
      "version: 1",
      "delegation_id",
      "brief_id",
      "parent_task",
      "parent_role: main | execution",
      "goal",
      "questions",
      "allowed_scope",
      "excluded_scope",
      "expected_evidence",
      "budget",
      "stop_conditions",
      "sensitivity_boundary",
      "write_permission: none",
      "recursion_permission: none",
    ]) {
      expect(brief).toContain(field);
    }

    for (const field of [
      "NAVI_EVIDENCE_RESULT",
      "version: 1",
      "delegation_id",
      "brief_id",
      "status: done | blocked | needs_context",
      "answer",
      "evidence",
      "uncertainties",
      "scope_deviations",
      "open_questions",
      "recommended_parent_action",
      "write_state: unchanged | conflict",
    ]) {
      expect(result).toContain(field);
    }
    expect(normalizeWhitespace(result)).toMatch(
      /parent[\s\S]*identity[\s\S]*scope[\s\S]*write state[\s\S]*evidence/i,
    );
    expect(normalizeWhitespace(result)).toMatch(
      /recommendation[\s\S]*not[\s\S]*permission[\s\S]*user approval/i,
    );
    expect(failure).toMatch(
      /blocked[\s\S]*needs_context[\s\S]*must not expand[\s\S]*scope/i,
    );
    expect(failure).toMatch(
      /conflicting[\s\S]*preserve[\s\S]*unauthorized write[\s\S]*invalidates/i,
    );
  });

  it("preserves limits and requires a new accepted host gate before activation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const limits = normalizeWhitespace(extractSection(reference, "## Limits"));
    const activation = normalizeWhitespace(
      extractSection(reference, "## Future Activation Gate"),
    );
    const privacy = normalizeWhitespace(
      extractSection(reference, "## Privacy And Security"),
    );

    expect(limits).toMatch(/at most two[\s\S]*one wave[\s\S]*no recursion/i);
    expect(limits).toMatch(/do not authorize[\s\S]*current host/i);
    expect(limits).toMatch(/must not emit[\s\S]*NAVI_LANE_HANDOFF_EVENT/i);
    expect(privacy).toMatch(
      /minimum necessary context[\s\S]*credentials[\s\S]*private reasoning/i,
    );
    expect(privacy).toMatch(
      /must not be transferred[\s\S]*project[\s\S]*Main task[\s\S]*external agent/i,
    );
    expect(privacy).toMatch(/no persistent[\s\S]*delegation log/i);
    expect(activation).toMatch(
      /fresh[\s\S]*accepted[\s\S]*C1-C7[\s\S]*present/i,
    );
    expect(activation).toMatch(
      /Task Model Routing[\s\S]*Route Application Gate[\s\S]*explicit model[\s\S]*reasoning/i,
    );
    expect(activation).toMatch(/must not self-activate[\s\S]*host update/i);
  });

  it("keeps one canonical owner and a byte-identical package mirror", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/delegation-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/delegation-v1.md"),
    ]);

    expect(packaged).toBe(canonical);
    expect(normalizeWhitespace(canonical)).toMatch(
      /must not self-activate[\s\S]*Do not add[\s\S]*database[\s\S]*queue[\s\S]*watcher[\s\S]*scheduler[\s\S]*daemon/i,
    );
    expect(canonical).not.toContain("mcp__agent_delegate__");
  });
});
```

- [ ] **Step 2: Run the focused test and observe RED**

Run:

```bash
npm test -- tests/skills/navi-delegation.test.ts
```

Expected: FAIL because both `delegation-v1.md` files are missing.

- [ ] **Step 3: Create the complete canonical reference**

Create `.agents/skills/navi/references/delegation-v1.md` with:

````markdown
# Navi Delegation Suggestion Gate V1

Use this reference when an explicitly authorized Main or Execution task needs
to decide whether bounded Evidence delegation would have concrete net value.
This file is the sole owner for the Delegation Lease, eligibility and benefit
gate, decision envelope, Evidence Brief, Evidence Result, current host
capability boundary, limits, and quietness.

## Current Capability State

The accepted Level 2 result
`navi-delegation-host-inspection-validation-20260722-01` established that C1-C3
are present, C4-C6 are absent, and C7 is unknown on the inspected host.
Automatic Evidence delegation is unavailable. Current behavior is
suggestion-only and fail-closed.

Navi may judge whether delegation would help, continue locally, or explain a
real unavailable-capability decision. It must not call `spawn_agent`, create an
Evidence subagent, or claim that automatic delegation succeeded.

## Delegation Lease

A Delegation Lease is task-local, revocable, and not persisted. It is created
only by explicit user authorization for the current Main task and its
already-authorized Execution tasks. Validation does not inherit the lease.

Lease state is `active | absent | expired`. It expires when the Main task ends
or when the project, goal, permission, risk, or work mode materially changes.
A new Main task requires new authorization. The lease grants no write,
external-state, integration, release, or worker-creation permission.

## Delegation Context

Build only the context that can change the decision:

```text
NAVI_DELEGATION_CONTEXT
version: 1
source_task: current formal task identity
parent_role: main | execution
stage: concise stable task stage
goal: current authorized goal
candidate_questions: bounded evidence questions
candidate_scopes: corresponding files, directories, or data sources
effects: read-only
separability: why questions can be investigated independently
expected_benefit: context, elapsed-time, or independent-evidence gain
coordination_cost: brief, context-load, reconciliation, and conflict cost
sensitivity: privacy, credential, external-state, or project boundary
lease_state: active | absent | expired
host_capabilities: automatic_unsupported
```

Do not include the complete conversation, private reasoning, full source
files, unrelated tool output, credentials, or secret state.

## Hard Eligibility

Delegation judgment is eligible only when the lease is active, the parent is
Main or Execution, the authorized goal is stable, and every candidate question
is read-only. No question may require a user product, permission, risk,
integration, or release decision.

Each candidate must have one clear goal, scope, evidence requirement, budget,
and stop condition. Scopes must be separable, and no credential, secret,
unauthorized project, or unapproved external state may be required.

Failure returns `continue_in_current_role` when the parent can safely continue,
or `decision_required` when real user authority or a changed premise is needed.

## Benefit Judgment

Passing eligibility is not enough. Concrete net benefit requires at least one
of these conditions: independent questions can proceed in parallel, one
investigation would create material parent context pressure, or independent
evidence would reduce a meaningful self-review risk.

Expected gain must clearly exceed brief creation, duplicate context loading,
result reconciliation, conflict handling, and model cost. Raw file count or
feature availability cannot decide the outcome. Weak evidence defaults to
`continue_in_current_role`.

## Delegation Decision

```text
NAVI_DELEGATION_DECISION
version: 1
delegation_id: stable id for this stage and wave
source_task: parent task identity
parent_role: main | execution
stage: matching stable stage
result: continue_in_current_role | delegate_evidence | decision_required
brief_count: 0 | 1 | 2
reason_codes: concise factual reasons
lease_state: active | absent | expired
visibility: quiet | explain | decision-required
```

`delegate_evidence` is reserved for the approved future automatic branch and
the current host must not emit it. Under `automatic_unsupported`, a beneficial
candidate still returns `continue_in_current_role` when the parent can proceed,
with `host_capability_unavailable` in quiet reason codes. Use
`decision_required` only when the user explicitly requests unavailable
automatic delegation or when the parent cannot continue without a real scope,
permission, risk, or premise decision.

The decision is ephemeral. Do not write it to `.navi`, `AGENTS.md`, a project
record, or global configuration.

## Current Host Behavior

The current branch must not call `spawn_agent`, must not create an Evidence
subagent, and must not claim that a suggested brief was dispatched. If the
parent can continue, it returns `continue_in_current_role` and stays quiet.

If the user explicitly requests automatic delegation, explain once that the
host cannot enforce the approved read-only, count, and non-recursion boundary,
then return `decision_required` for the next real path. Do not convert that
explanation into repeated confirmation prompts or an unsafe manual spawn.

## Evidence Brief

The brief schema is dormant on the current host. It may be prepared as a
proposal only when the user asks to inspect the future split or when it creates
direct decision control. It is never evidence that a worker was created.

```text
NAVI_EVIDENCE_BRIEF
version: 1
delegation_id: matching decision id
brief_id: unique proposed child identity
parent_task: parent task identity
parent_role: main | execution
goal: one clear evidence goal
questions: bounded questions
allowed_scope: permitted files, directories, or data sources
excluded_scope: explicit exclusions
expected_evidence: verifiable output requirements
budget: bounded files, tool calls, time, or tokens
stop_conditions: completion and refusal boundaries
sensitivity_boundary: privacy and external-state restrictions
write_permission: none
recursion_permission: none
```

Do not use requests such as `understand the whole codebase`. Do not include a
complete transcript or private reasoning.

## Evidence Result

This result schema is also dormant until a future host activation gate passes:

```text
NAVI_EVIDENCE_RESULT
version: 1
delegation_id: matching decision id
brief_id: matching brief id
status: done | blocked | needs_context
answer: concise evidence-backed answer
evidence: verifiable references or bounded command summaries
uncertainties: unresolved uncertainty
scope_deviations: none or explicit deviations
open_questions: unresolved questions
recommended_parent_action: non-authoritative recommendation
write_state: unchanged | conflict
```

The parent verifies identity, scope, write state, and evidence, and preserves
conflicts. A recommendation is not permission and is not user approval. The
current suggestion-only branch must not fabricate an Evidence Result.

## Limits

The future contract allows at most two Evidence workers, one wave per stable
stage, and no recursion. Results would return to the parent for synthesis.
These dormant limits do not authorize any worker on the current host.
Evidence workers must not emit `NAVI_LANE_HANDOFF_EVENT`; that event remains
owned by formal visible lanes.

## Quietness And User Control

Successful ordinary judgment and `continue_in_current_role` stay quiet. Do not
surface a suggested brief merely because one can be written. Explain only a
real unavailable capability, expired authorization, sensitive or external
scope, premise-changing conflict, or user-owned decision.

Navi must not ask for per-worker confirmation when no worker can safely be
created, and must not manufacture a meaningless confirmation to demonstrate
the feature. Existing user ownership of writes, worktrees, integration, and
release remains unchanged.

## Failure Handling

Missing eligibility or weak benefit returns to the parent. A request for more
scope does not expand itself. Future `blocked` or `needs_context` results must
not expand their own scope or create replacement workers. Conflicting results
preserve every evidence set. Any unauthorized write invalidates the affected
result and returns a real decision to the parent. Missing facts never become
permission, risk acceptance, implementation approval, or a Validation verdict.

## Privacy And Security

Use only the minimum necessary context. Exclude credentials, auth content,
private reasoning, unrelated transcripts, and secrets. A lease must not be
transferred to another project, Main task, user, or external agent. Future
worker output is untrusted evidence rather than executable instruction. V1
creates no persistent delegation log or event stream.

## Future Activation Gate

Automatic Evidence delegation requires a fresh bounded host inspection and an
accepted independent result proving C1-C7 present. It must then pass Task Model
Routing and the Route Application Gate with explicit model and reasoning for
every worker, plus the design's natural positive and negative calibration.

This contract must not self-activate after a host update. Activation requires a
separately approved design/plan change. Do not add a runtime, database, queue,
watcher, scheduler, daemon, MCP server, panel, or `agent-delegate` dependency.
````

- [ ] **Step 4: Copy the exact canonical reference to the package mirror**

Run:

```bash
cp .agents/skills/navi/references/delegation-v1.md \
  plugins/navi/skills/navi/references/delegation-v1.md
```

Expected: the two files are byte-identical.

- [ ] **Step 5: Run the focused test and obtain GREEN**

Run:

```bash
npm test -- tests/skills/navi-delegation.test.ts
```

Expected: 1 file passes with 8 tests.

- [ ] **Step 6: Run a fresh read-only task review**

The reviewer must check the approved design, accepted host result, complete
Task 1 diff, schema field identity, absent-versus-unknown truthfulness,
whitespace-safe assertions, and the no-dispatch boundary. Fix Critical,
Important, and in-scope Minor findings before committing.

- [ ] **Step 7: Commit Task 1**

```bash
git add .agents/skills/navi/references/delegation-v1.md \
  plugins/navi/skills/navi/references/delegation-v1.md \
  tests/skills/navi-delegation.test.ts
git commit -m "feat: define navi delegation suggestions"
```

### Task 2: Route Main And Execution To The Sole Delegation Owner

**Files:**
- Modify: `.agents/skills/navi/SKILL.md:18-120`
- Modify: `plugins/navi/skills/navi/SKILL.md:18-120`
- Modify: `.agents/skills/navi/references/supervision-v1.md:444-585`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md:444-585`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md:37-186`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md:37-186`
- Modify: `tests/skills/navi-skill.test.ts:135-184`
- Modify: `tests/skills/navi-supervision.test.ts:684-705`
- Modify: `tests/skills/navi-supervised-delivery.test.ts:322-414`

**Interfaces:**
- Consumes: Task 1's sole `delegation-v1.md` owner.
- Produces: concise routing/adoption clauses for Main and Execution without
  copying any decision, brief, or result schema.

- [ ] **Step 1: Add failing routing and role-boundary tests**

Add this test to `tests/skills/navi-skill.test.ts` after the canonical-owner
test:

```ts
  it("routes delegation judgment to one suggestion-only owner", async () => {
    const rawSkill = await readRepoText(".agents/skills/navi/SKILL.md");
    const skill = normalizeWhitespace(rawSkill);

    expect(skill).toContain("references/delegation-v1.md");
    expect(skill).toContain("sole owner for delegation judgment");
    expect(skill).toContain("automatic Evidence delegation is unavailable");
    expect(skill).toContain("must not call `spawn_agent`");
    expect(rawSkill).not.toContain("NAVI_DELEGATION_CONTEXT\nversion: 1");
    expect(rawSkill).not.toContain("NAVI_EVIDENCE_BRIEF\nversion: 1");
  });
```

Add this test to `tests/skills/navi-supervision.test.ts` after the model-routing
owner test:

```ts
  it("routes role-local delegation without duplicating its contracts", async () => {
    const [supervision, delegation, packagedSupervision] = await Promise.all([
      readRepoText(".agents/skills/navi/references/supervision-v1.md"),
      readRepoText(".agents/skills/navi/references/delegation-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/supervision-v1.md"),
    ]);
    const normalized = normalizeWhitespace(supervision);

    expect(normalized).toMatch(
      /Delegation Suggestion Routing[\s\S]*delegation-v1\.md[\s\S]*Main[\s\S]*Execution/i,
    );
    expect(normalized).toMatch(
      /Validation[\s\S]*does not inherit[\s\S]*automatic Evidence delegation[\s\S]*unavailable/i,
    );
    expect(supervision).not.toContain("NAVI_DELEGATION_DECISION\nversion: 1");
    expect(delegation).toContain("NAVI_DELEGATION_DECISION\nversion: 1");
    expect(packagedSupervision).toBe(supervision);
  });
```

Add this test to `tests/skills/navi-supervised-delivery.test.ts` after the model
routing extension tests:

```ts
  it("keeps the delegation suggestion lease additive and validation excluded", async () => {
    const rawDelivery = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const delivery = normalizeWhitespace(rawDelivery);

    expect(delivery).toMatch(
      /Delegation Suggestion Extension[\s\S]*delegation-v1\.md/i,
    );
    expect(delivery).toMatch(
      /Execution[\s\S]*explicitly carried[\s\S]*active Delegation Lease/i,
    );
    expect(delivery).toMatch(
      /does not broaden[\s\S]*Execution Contract[\s\S]*must not create/i,
    );
    expect(delivery).toMatch(/Validation[\s\S]*does not inherit/i);
    expect(rawDelivery).not.toContain("NAVI_EVIDENCE_BRIEF\nversion: 1");
  });
```

- [ ] **Step 2: Run the three focused files and observe RED**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
```

Expected: the three new tests fail because owner routing and role adoption are
absent; existing tests remain green.

- [ ] **Step 3: Add the sole-owner route and hard boundary to `SKILL.md`**

Add this exact bullet under `## Required References`, after model routing:

```markdown
- `references/delegation-v1.md` is the sole owner for delegation judgment,
  the task-local Delegation Lease, eligibility and benefit checks, decision,
  Evidence Brief/Result contracts, current host capability state, limits, and
  quiet fail-closed behavior.
```

Add this exact paragraph under `## Hard Boundaries`, immediately after the
Task Model Routing paragraph:

```markdown
Delegation judgment requires an explicitly authorized task-local lease and
remains owned by `references/delegation-v1.md`. On the accepted current host,
automatic Evidence delegation is unavailable: Navi must not call
`spawn_agent`, create a role-local worker, or emit `delegate_evidence`. Main or
Execution may continue under the owner's suggestion-only decision; Validation
does not inherit the lease.
```

Add this exact bullet under `## Behavior Guardrails`, next to Supervised
Delivery routing:

```markdown
- When an active Delegation Lease and bounded evidence questions make
  delegation judgment relevant, use `references/delegation-v1.md`; keep
  ordinary continue-in-role outcomes quiet and do not copy its schemas here.
```

Apply the same edits to `plugins/navi/skills/navi/SKILL.md`.

- [ ] **Step 4: Add concise Supervision adoption**

Insert this subsection before `### Codex-First Supervised Delivery` in both
canonical and packaged `supervision-v1.md`:

```markdown
### Delegation Suggestion Routing

When an explicitly authorized Main or Execution task has separable evidence
questions, route delegation judgment to `delegation-v1.md`. That reference
solely owns the lease, eligibility, benefit, decision, brief/result, limits,
host capability, and quietness contracts.

Validation does not inherit the Delegation Lease. Automatic Evidence
delegation is unavailable on the accepted current host, so this coordination
layer must not create a worker, duplicate the schemas, or present a suggestion
as completed delegation.
```

- [ ] **Step 5: Add the Execution-only suggestion extension**

Insert this section after `## Plan Reliability Adoption` in both canonical and
packaged `supervised-delivery-v1.md`:

```markdown
## Delegation Suggestion Extension

An Execution task may evaluate `delegation-v1.md` only when its prompt
explicitly carried an active Delegation Lease from the source Main task. The
lease does not broaden the Execution Contract, add write or external-state
authority, or authorize another task.

On the accepted current host, Execution must not create an Evidence subagent;
it continues in-role or returns a real decision under the delegation owner.
Validation does not inherit the lease and directly owns its independent
verdict.
```

- [ ] **Step 6: Run the Task 2 focused tests and obtain GREEN**

Run:

```bash
npm test -- tests/skills/navi-skill.test.ts \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts \
  tests/skills/navi-delegation.test.ts
```

Expected: 4 files pass; new totals are existing counts plus 3 routing tests and
Task 1's 8 tests.

- [ ] **Step 7: Verify all four canonical/package mirrors**

```bash
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/delegation-v1.md \
  plugins/navi/skills/navi/references/delegation-v1.md
cmp .agents/skills/navi/references/supervision-v1.md \
  plugins/navi/skills/navi/references/supervision-v1.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: all commands exit 0 with no output.

- [ ] **Step 8: Run a fresh read-only task review**

Review sole ownership, Main/Execution adoption, Validation exclusion, current
host fail-closed behavior, and absence of duplicated schemas. Fix all in-scope
findings before committing.

- [ ] **Step 9: Commit Task 2**

```bash
git add .agents/skills/navi/SKILL.md \
  .agents/skills/navi/references/supervision-v1.md \
  .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/SKILL.md \
  plugins/navi/skills/navi/references/supervision-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md \
  tests/skills/navi-skill.test.ts \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: route navi delegation suggestions"
```

### Task 3: Publish The Suggestion-Only Capability Truthfully

**Files:**
- Modify: `README.md:184-204`
- Modify: `README.zh-CN.md:183-203`
- Modify: `plugins/navi/README.md:19-35`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts:601-625`

**Interfaces:**
- Consumes: Tasks 1-2's implemented suggestion-only behavior.
- Produces: aligned English, Chinese, and package-facing capability wording
  that does not imply automatic creation.

- [ ] **Step 1: Add the failing public-truthfulness test**

Add this test after the task-model-routing public test in
`tests/skills/navi-capability-truthfulness.test.ts`:

```ts
  it("describes delegation judgment without claiming automatic subagents", async () => {
    const [readme, chineseReadme, pluginReadme] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const surface of [readme, pluginReadme]) {
      expect(surface).toMatch(
        /unreleased[\s\S]*Delegation Suggestion Gate[\s\S]*Main[\s\S]*Execution/i,
      );
      expect(surface).toMatch(
        /task-local[\s\S]*user authorization[\s\S]*net value/i,
      );
      expect(surface).toMatch(
        /does not call `spawn_agent`[\s\S]*does not automatically create/i,
      );
      expect(surface).toMatch(
        /read-only[\s\S]*count[\s\S]*non-recursion[\s\S]*host/i,
      );
    }

    expect(chineseReadme).toMatch(
      /尚未发布[\s\S]*Delegation Suggestion Gate[\s\S]*Main[\s\S]*Execution/i,
    );
    expect(chineseReadme).toMatch(
      /task-local[\s\S]*用户授权[\s\S]*净收益/i,
    );
    expect(chineseReadme).toMatch(
      /不会调用 `spawn_agent`[\s\S]*不会自动创建/i,
    );
  });
```

- [ ] **Step 2: Run the focused test and observe RED**

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts
```

Expected: the new test fails because delegation wording is absent.

- [ ] **Step 3: Add the English root README section**

Insert after `### Task model routing on current main`:

```markdown
### Delegation suggestion on current main

Current main includes an unreleased, prompt/docs-backed Delegation Suggestion
Gate for Main and Execution. With task-local user authorization, Navi can judge
whether separable read-only evidence questions have enough net value to justify
delegation and can prepare a bounded Evidence Brief when that improves a real
user decision.

The accepted current host does not expose enforceable read-only, approved
count, or non-recursion controls for role-local subagents. Navi therefore does
not call `spawn_agent`, does not automatically create an Evidence subagent, and
does not let Validation inherit the delegation lease. Ordinary cases continue
in the current role; automatic activation requires a new accepted host
capability gate.
```

- [ ] **Step 4: Add the Chinese root README section**

Insert after `### 当前 main 的任务模型路由`:

```markdown
### 当前 main 的委派建议

当前 main 包含尚未发布、由 prompt/docs 支撑的 Delegation Suggestion Gate，
适用于 Main 和 Execution。获得 task-local 用户授权后，Navi 可以判断多个
可分离的只读证据问题是否具有足够委派净收益，并且只在能改善真实用户决策
时准备有界 Evidence Brief。

已接受的当前 host 没有为角色内 subagent 暴露可强制的只读、数量上限和
禁止递归控制。因此 Navi 不会调用 `spawn_agent`，不会自动创建 Evidence
subagent，也不会让 Validation 继承 delegation lease。普通情况继续由当前
角色处理；自动激活需要新的、已接受的 host capability gate。
```

- [ ] **Step 5: Add the package README section**

Insert the Task 3 English section verbatim after
`### Task model routing on current main` in `plugins/navi/README.md`.

- [ ] **Step 6: Run the focused public test and obtain GREEN**

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts
```

Expected: the file passes with one additional test.

- [ ] **Step 7: Run a fresh read-only task review**

Review all three surfaces for aligned capability claims, user authorization,
host limitations, Validation exclusion, no automatic creation claim, and no
Runtime/MCP implication.

- [ ] **Step 8: Commit Task 3**

```bash
git add README.md README.zh-CN.md plugins/navi/README.md \
  tests/skills/navi-capability-truthfulness.test.ts
git commit -m "docs: explain navi delegation suggestions"
```

### Task 4: Activate The Verified Boundary In Current Product Records

**Files:**
- Modify: `docs/navi/design-history.md:5-88`
- Modify: `docs/navi/calibration-log.md:8`
- Modify: `docs/navi/product-debt.md:288-325`
- Modify: `docs/navi/roadmap.md:99-147`
- Modify: `tests/repository/current-surface.test.ts:372-410`

**Interfaces:**
- Consumes: the accepted inspection/validation result and Tasks 1-3.
- Produces: active authority, calibration evidence, roadmap boundary, and host
  enforcement debt that remain truthful after implementation.

- [ ] **Step 1: Add the failing current-surface test**

Add this test after the current Native Absent update-boundary test in
`tests/repository/current-surface.test.ts`:

```ts
  it("records delegation as suggestion-only under the accepted host boundary", async () => {
    const [history, roadmap, debt, calibration] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
    ]);
    const active =
      history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    for (const authority of [
      "`docs/superpowers/specs/2026-07-22-navi-delegation-gate-design.md`",
      "`docs/superpowers/plans/2026-07-22-navi-delegation-host-capability-inspection.md`",
      "`docs/superpowers/plans/2026-07-22-navi-delegation-suggestion-gate.md`",
    ]) {
      expect(active).toContain(authority);
    }
    expect(calibration).toContain(
      "navi-delegation-host-inspection-validation-20260722-01",
    );
    expect(calibration).toMatch(
      /C1-C3[\s\S]*present[\s\S]*C4-C6[\s\S]*absent[\s\S]*C7[\s\S]*unknown/i,
    );
    expect(roadmap).toMatch(
      /Delegation Suggestion Gate V1[\s\S]*suggestion-only[\s\S]*does not call `spawn_agent`/i,
    );
    expect(roadmap).toMatch(
      /automatic Evidence delegation[\s\S]*fresh accepted host capability gate/i,
    );
    expect(debt).toContain("### 11. Delegation Host Enforcement Debt");
    expect(debt).toMatch(
      /read-only[\s\S]*count[\s\S]*non-recursion[\s\S]*C7[\s\S]*unknown/i,
    );
    expect(debt).toMatch(
      /instruction-density[\s\S]*control gain[\s\S]*simplify or remove/i,
    );
    expect(roadmap).not.toMatch(/automatic Evidence delegation is active/i);
    expect(roadmap).not.toMatch(/Product Complete is closed/i);
  });
```

- [ ] **Step 2: Run the focused repository test and observe RED**

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: the new test fails because current records do not yet contain the
accepted delegation boundary.

- [ ] **Step 3: Update design-history authority and current phase**

Add this paragraph to `## Current Phase`:

```markdown
Delegation Gate V1 host inspection established the accepted suggestion-only
boundary: role-local creation plus explicit model/reasoning inputs are present,
but enforceable read-only, approved wave count, and non-recursion controls are
absent, while structured completion remains unknown. Delegation Suggestion
Gate V1 implements judgment and fail-closed contracts without calling
`spawn_agent`; automatic Evidence delegation remains inactive.
```

Add these entries to `## Active`:

```markdown
- `docs/superpowers/specs/2026-07-22-navi-delegation-gate-design.md`
- `docs/superpowers/plans/2026-07-22-navi-delegation-host-capability-inspection.md`
- `docs/superpowers/plans/2026-07-22-navi-delegation-suggestion-gate.md`
```

- [ ] **Step 4: Add the accepted inspection to the calibration log**

Insert this entry at the top of `docs/navi/calibration-log.md` after its title
and introductory prose:

```markdown
## 2026-07-22 - Delegation Host Capability Is Suggestion-Only

The accepted Level 2 result
`navi-delegation-host-inspection-validation-20260722-01` reviewed snapshot
`657c70702e58d88959d5e80101df36ca9b679e6f` and classified the current
`multi_agent_v1` surface as follows:

- C1-C3 creation and explicit model/reasoning inputs: present;
- C4-C6 enforceable read-only, approved count, and non-recursion controls:
  absent; and
- C7 structured completion and result delivery: unknown.

The Static Safety Gate failed and no behavioral subagent probe ran. The
accepted product branch is suggestion-only and fail-closed. This result does
not establish automatic Evidence delegation, authorize `spawn_agent`, or
justify Runtime Surface or `agent-delegate` integration.
```

- [ ] **Step 5: Add Delegation Host Enforcement Debt**

Insert this section between debt items 10 and 12:

```markdown
### 11. Delegation Host Enforcement Debt

Status: suggestion-only contract active; automatic Evidence delegation blocked
Priority: re-inspect only after a material Codex host capability change

The accepted host surface can create role-local subagents and accept explicit
model and reasoning inputs, but it cannot enforce the approved read-only,
per-wave count, or non-recursion boundaries. C7 structured completion remains
unknown because the safety gate correctly prohibited a behavioral probe.

Navi therefore keeps delegation judgment task-local and fail-closed. Do not
add prompt-only automatic creation, a Runtime Surface, or an `agent-delegate`
dependency to work around missing host controls. Reconsider activation only
after a fresh bounded inspection proves C1-C7 present and natural positive and
negative samples satisfy the approved design.

This owner also adds instruction-density cost before it can create a worker.
Natural use must show that it improves restraint or user control rather than
merely adding schemas. If it repeatedly produces no control gain, simplify or
remove the suggestion surface instead of adding more routing rules.
```

- [ ] **Step 6: Add the roadmap capability boundary**

Insert this section after `## Codex Model And Reasoning Routing`:

```markdown
## Delegation Suggestion Gate

Delegation Suggestion Gate V1 is an unreleased, prompt/docs-backed,
suggestion-only capability for Main and Execution. With task-local user
authorization, Navi can decide whether bounded read-only evidence questions
have clear net delegation value and can preserve the approved brief/result
contracts without creating a worker.

The accepted host lacks enforceable read-only, approved count, and
non-recursion controls. Navi does not call `spawn_agent`; Validation does not
inherit the lease; and automatic Evidence delegation remains inactive. A fresh
accepted host capability gate proving C1-C7 present is required before any
automatic branch or natural positive delegation calibration.
```

In `## Explicitly Out Of Current Scope`, replace:

```markdown
- Memory v2, relationship modes, delegation, or write delegation.
```

with:

```markdown
- Memory v2, relationship modes, automatic Evidence delegation, recursive
  delegation, or write delegation.
```

- [ ] **Step 7: Run Task 4 focused tests and obtain GREEN**

```bash
npm test -- tests/repository/current-surface.test.ts \
  tests/skills/navi-capability-truthfulness.test.ts \
  tests/skills/navi-delegation.test.ts
```

Expected: 3 files pass with all new and existing assertions green.

- [ ] **Step 8: Run a fresh read-only task review**

Review active authority, accepted-result identity, absent-versus-unknown
language, Product Complete boundary, out-of-scope wording, and alignment with
the public docs. Fix all in-scope findings before committing.

- [ ] **Step 9: Commit Task 4**

```bash
git add docs/navi/design-history.md docs/navi/calibration-log.md \
  docs/navi/product-debt.md docs/navi/roadmap.md \
  tests/repository/current-surface.test.ts
git commit -m "docs: activate navi delegation suggestions"
```

## Final Bounded Verification

- [ ] **Step 1: Run the exact focused acceptance suite**

```bash
npm test -- tests/skills/navi-delegation.test.ts \
  tests/skills/navi-skill.test.ts \
  tests/skills/navi-supervision.test.ts \
  tests/skills/navi-supervised-delivery.test.ts \
  tests/skills/navi-capability-truthfulness.test.ts \
  tests/repository/current-surface.test.ts
```

Expected: 6 files pass with no failure.

- [ ] **Step 2: Run typecheck and package verification**

```bash
npm run typecheck
npm run verify:plugin-package
```

Expected: both commands exit 0; plugin verification includes the new
`delegation-v1.md` reference and focused test without source/package drift.

- [ ] **Step 3: Verify mirrors and whitespace**

```bash
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/delegation-v1.md \
  plugins/navi/skills/navi/references/delegation-v1.md
cmp .agents/skills/navi/references/supervision-v1.md \
  plugins/navi/skills/navi/references/supervision-v1.md
cmp .agents/skills/navi/references/supervised-delivery-v1.md \
  plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff --check HEAD~4..HEAD
```

Expected: all commands exit 0 with no output.

- [ ] **Step 4: Verify exact commit and path scope**

```bash
test "$(git rev-list --count HEAD~4..HEAD)" -eq 4
git log --format='%h %s' HEAD~4..HEAD
git diff --name-only HEAD~4..HEAD
```

Expected commits, oldest to newest:

```text
feat: define navi delegation suggestions
feat: route navi delegation suggestions
docs: explain navi delegation suggestions
docs: activate navi delegation suggestions
```

Expected changed paths, exactly 21:

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/delegation-v1.md
.agents/skills/navi/references/supervised-delivery-v1.md
.agents/skills/navi/references/supervision-v1.md
README.md
README.zh-CN.md
docs/navi/calibration-log.md
docs/navi/design-history.md
docs/navi/product-debt.md
docs/navi/roadmap.md
plugins/navi/README.md
plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/delegation-v1.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
plugins/navi/skills/navi/references/supervision-v1.md
tests/repository/current-surface.test.ts
tests/skills/navi-capability-truthfulness.test.ts
tests/skills/navi-delegation.test.ts
tests/skills/navi-skill.test.ts
tests/skills/navi-supervised-delivery.test.ts
tests/skills/navi-supervision.test.ts
```

- [ ] **Step 5: Verify forbidden scope and capability truthfulness**

```bash
git diff --exit-code HEAD~4..HEAD -- package.json package-lock.json \
  plugins/navi/VERSION.md plugins/navi/.codex-plugin/plugin.json \
  src scripts .agents/plugins .codex archive work
rg -n 'spawn_agent|delegate_evidence|automatic Evidence delegation' \
  .agents/skills/navi plugins/navi/skills/navi README.md README.zh-CN.md \
  plugins/navi/README.md docs/navi
```

Expected: forbidden-path diff exits 0. Every capability scan match is a
negative boundary, reserved schema value, accepted inspection fact, or future
activation condition; there is no positive claim that a worker is created.

- [ ] **Step 6: Run a fresh whole-candidate review**

The reviewer receives the exact four-commit snapshot, approved design,
accepted host result, this plan, complete baseline-to-snapshot diff, focused
verification evidence, and scope audits. It must check design-plan-
implementation consistency, owner boundaries, current-host truthfulness,
instruction-density cost, and no automatic-dispatch path. Resolve Critical and
Important findings within at most two approved in-scope remediation rounds.

- [ ] **Step 7: Return review-ready and request independent validation**

Send one direct `NAVI_LANE_HANDOFF_EVENT V1` with the exact snapshot, four
commits, 21 paths, verification, findings, and residual risks. Stop at
review-ready. A fresh Level 3 Validation Task is required before acceptance;
merge, push, release, publication, and natural calibration remain user-owned.

## Plan Satisfiability Audit

Before dispatch, mechanically verify:

- every prescribed regex against the exact prescribed Markdown after
  whitespace normalization;
- all new test helpers exist in their target files;
- the new owner heading names match every `extractSection` call;
- all four commit scopes compose to exactly the listed 21 paths;
- no task expects `delegate_evidence`, `spawn_agent`, or an Evidence Result to
  occur at runtime;
- Task 3 English package wording is copied exactly rather than paraphrased;
- Task 4 inserts debt item 11 between existing items 10 and 12; and
- Final Bounded Verification runs only after the fourth commit.

One bounded mechanical correction round may fix whitespace-safe matchers,
command timing, exact path lists, or equivalent artifact references when
semantics, permissions, risk, scope, acceptance, and verification strength do
not change. Aggregate all semantic or premise-changing gaps for one Main Task
decision instead of stopping once per assertion.
