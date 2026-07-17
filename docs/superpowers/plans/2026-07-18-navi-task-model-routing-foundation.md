# Navi Task Model Routing Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` in one true Codex-managed worktree task. Do not
> execute this plan in the persistent Main Thread, and do not reinterpret it as
> `subagent-driven-development` inside the Main Thread. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Add the prompt/docs-backed Task Routing Foundation that applies one
user-authorized model-and-reasoning route to bounded Navi Execution and
Validation Tasks while preserving deterministic capability floors, truthful
host fallback, and quiet user control.

**Architecture:** Create one canonical `model-routing-v1.md` owner for Routing
Context, capability floors, exceptional Router Checks, Route Decisions, stage
leases, host catalog resolution, and failure semantics. Adopt that owner from
the existing Supervised Delivery contracts and Navi skill without adding a
runtime scheduler or changing Main Thread dispatch. Keep canonical and packaged
skill trees byte-identical, enforce behavior with focused static contract tests,
and leave real model/task execution to a separately authorized post-integration
calibration.

**Tech Stack:** Markdown skill/reference contracts, Codex task creation and
follow-up model/thinking fields, TypeScript, Vitest, existing Navi canonical and
packaged plugin mirrors, Git worktrees.

## Global Constraints

- The approved design is
  `docs/superpowers/specs/2026-07-18-navi-codex-model-reasoning-routing-design.md`.
- This plan implements only Milestone 1, Task Routing Foundation. It does not
  implement the Main Turn Host Adapter or claim three-role routing V1 complete.
- Execute in one true Codex-managed worktree from the exact clean commit that
  contains the approved design and this plan. The persistent Main Thread may
  continue only non-conflicting design or supervision work.
- Use exactly four local task commits with the subjects specified below. Do not
  rewrite shared history, merge, or push from the Execution Task.
- At final `review-ready`, create one fresh Level 2 read-only Validation Task
  for the exact candidate snapshot. Reuse it for at most two in-scope
  remediation rounds.
- Model routing is opt-in. A routing-enabled Execution Contract must contain an
  explicit user-authorized policy. Existing contracts without the additive
  routing extension remain valid and use the host default without a Router
  Check.
- The balanced target mapping is GPT-5.6 Luna for `fast`, GPT-5.6 Terra for
  `standard`, and GPT-5.6 Sol for `strong`; GPT-5.4 mini, GPT-5.4, and GPT-5.5
  are compatible fallbacks. These are preferences, not a static model catalog.
- GPT-5.3 Codex Spark is an exceptional `ultra-fast/text-only` route, not the
  default `fast` route. Experimental or preview use must be authorized and
  visible.
- The target Codex host remains authoritative for model availability,
  supported reasoning efforts, tools, modalities, context, and entitlement.
- Never silently route below a deterministic capability floor. Try a valid
  same-tier model, then a stronger tier, then return a user decision.
- Do not let a fast model approve its own downgrade, extend its own lease, or
  replace required independent validation.
- Do not switch an active turn. Task creation and existing-task follow-up may
  apply a route only at a turn boundary.
- Do not enable or disable Codex Fast mode, change service tier, write global
  Codex config, persist a route lease in a project, or create a permanent Router
  Task.
- Do not add a database, queue, daemon, scheduler, watcher, notification
  service, background retry, new dependency, CLI command, MCP server, Runtime
  Surface, UI, or other-agent adapter.
- Do not add real model invocation tests, create real Codex tasks from Vitest,
  or use a mock-model suite as product proof. Natural host behavior belongs to
  post-integration Calibration mode.
- Preserve the existing three-role ownership, Validation Levels 1-3,
  exact-snapshot validation, at-most-two remediation rule, Lane Handoff,
  Awaiting Direct Event, and Main-Task Reconciliation behavior.
- Canonical and packaged Navi skill trees remain byte-identical.
- Project-local `npm ci` is preauthorized only when the isolated worktree lacks
  `node_modules`. It may write only ignored project-local dependency state and
  must not modify `package.json`, `package-lock.json`, global npm, or Codex.
- Do not touch `work/`, the user's uncommitted Main Thread calibration-log
  change, Historical Along, package or dependency metadata, generated init
  bytes, distribution staging, release metadata, or external projects.
- Do not run full `npm test` or a release checklist. Use only the focused tests,
  plugin-package verification, mirror checks, diff checks, and scope audits in
  this plan.
- Do not integrate, push, tag, release, publish, or start calibration without a
  separate explicit Main Thread decision.

## Execution Contract

```text
goal: implement the bounded Navi Task Routing Foundation
user_value: Execution and Validation Tasks can use an appropriate user-authorized model and reasoning effort without making the user route every task or allowing a fast model to self-certify
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved model-routing design and this plan
allowed_scope: the exact canonical/package routing, supervised-delivery, supervision, skill, focused-test, and current-doc paths listed in Tasks 1-4
forbidden_scope: Main Turn Host Adapter, active-turn switching, Fast mode, global config, runtime, queue, daemon, scheduler, CLI, dependency, package metadata, distribution staging, release, publication, external project, work/, Historical Along
implementation_plan: docs/superpowers/plans/2026-07-18-navi-task-model-routing-foundation.md
verification_budget: exact Task 1-4 focused tests, final bounded skill/repository suite, plugin-package verification, mirror checks, diff and scope audits; no full npm test
validation_level: 2
validation_preauthorized: true
remediation_limit: 2
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

This implementation task itself is not Task Routing calibration. Start it with
the user's current/default task configuration and do not claim that its model
choice is product evidence. A new dependency, runtime component, Main Thread
dispatch change, real Codex model call, external-project write, broader test
budget, or user-policy persistence mechanism is premise-changing and returns
to the Main Thread.

## Preconditions

Before Task 1, run:

```bash
git status --short --branch
git rev-parse HEAD
test -f docs/superpowers/specs/2026-07-18-navi-codex-model-reasoning-routing-design.md
test -f docs/superpowers/plans/2026-07-18-navi-task-model-routing-foundation.md
test -f .agents/skills/navi/references/supervised-delivery-v1.md
test -f plugins/navi/skills/navi/references/supervised-delivery-v1.md
test -f tests/skills/navi-supervised-delivery.test.ts
```

Expected: a clean isolated worktree at the supplied baseline with every required
file present. If the worktree is dirty before implementation, stop as
`decision-required`; do not clean or reset unknown changes.

If `node_modules` is absent, run exactly:

```bash
npm ci
git diff --exit-code -- package.json package-lock.json
```

Expected: dependency installation succeeds and package metadata remains
unchanged. Existing audit findings do not authorize remediation.

Run the bounded baseline:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: baseline PASS. Do not run full `npm test`.

## Planned File Structure And Ownership

### Canonical routing owner

- `.agents/skills/navi/references/model-routing-v1.md`: sole detailed owner for
  Routing Context, capability floors, Router Check, Route Decision, Route Lease,
  host catalog resolution, user overrides, quietness, and failure behavior.
- `plugins/navi/skills/navi/references/model-routing-v1.md`: byte-identical
  package mirror.
- `tests/skills/navi-model-routing.test.ts`: focused owner, schema, floor,
  fallback, lease, mirror, and non-goal regression coverage.

### Supervised Delivery adoption

- `.agents/skills/navi/references/supervised-delivery-v1.md`: owns the additive
  routing-enabled Execution Contract extension and independent Execution /
  Validation task route lifecycle.
- `plugins/navi/skills/navi/references/supervised-delivery-v1.md`: byte-identical
  package mirror.
- `tests/skills/navi-supervised-delivery.test.ts`: routing-extension,
  backward-compatibility, validation-level, and host-application coverage.

### Navi routing and supervision adoption

- `.agents/skills/navi/SKILL.md`: routes model-and-reasoning questions to the
  new owner and states short hard boundaries without copying the contract.
- `plugins/navi/skills/navi/SKILL.md`: byte-identical package mirror.
- `.agents/skills/navi/references/supervision-v1.md`: tells work-mode and
  coordination supervision when to invoke the owner while retaining existing
  quietness and user-decision policy.
- `plugins/navi/skills/navi/references/supervision-v1.md`: byte-identical package
  mirror.
- `tests/skills/navi-supervision.test.ts` and `tests/skills/navi-skill.test.ts`:
  adoption and one-owner regression coverage.

### Current-source truthfulness

- `README.md`, `README.zh-CN.md`, and `plugins/navi/README.md`: describe the
  unreleased task-level foundation without claiming Main Thread automation,
  Runtime Surface, Fast mode control, or a released capability.
- `docs/navi/design-history.md`: lists the approved design and plan as active
  navigation metadata without rewriting earlier design history.
- `docs/navi/roadmap.md`: records Task Routing Foundation as the current bounded
  model-routing milestone and Main Turn Host Adapter as the next separate gate.
- `docs/navi/product-debt.md`: records host-catalog, Main Adapter, and natural
  calibration debt without treating them as implementation failures.
- `tests/skills/navi-capability-truthfulness.test.ts` and
  `tests/repository/current-surface.test.ts`: external-copy and active-index
  truthfulness coverage.

---

### Task 1: Define The Canonical Model Routing Contract

**Files:**
- Create: `.agents/skills/navi/references/model-routing-v1.md`
- Create: `plugins/navi/skills/navi/references/model-routing-v1.md`
- Create: `tests/skills/navi-model-routing.test.ts`

**Interfaces:**
- Produces: `NAVI_ROUTING_CONTEXT` version 1.
- Produces: `NAVI_ROUTE_DECISION` version 1.
- Produces: role and Validation Level capability-floor table.
- Produces: task-local stage lease and truthful host application states.
- Produces: one exceptional, short-lived, read-only Router Check contract.
- Does not consume or modify Supervised Delivery until Task 2.

- [ ] **Step 1: Write failing owner and schema tests**

Create `tests/skills/navi-model-routing.test.ts`:

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

describe("Navi Task Model Routing V1", () => {
  it("defines the exact bounded routing context", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const context = extractSection(reference, "## Routing Context");

    for (const field of [
      "NAVI_ROUTING_CONTEXT",
      "version: 1",
      "role: main | execution | validation | router",
      "work_mode: design | calibration | implementation | release",
      "task_kind: status | exploration | edit | debug | review | decision",
      "scope: narrow | multi-file | cross-module | external-state",
      "reversibility: reversible | costly | irreversible",
      "uncertainty: low | medium | high",
      "evidence_conflict: true | false",
      "validation_level: 1 | 2 | 3 | none",
      "required_capabilities",
      "recent_failures: 0 | 1 | 2+",
      "user_policy: balanced",
      "user_override",
      "current_lease",
    ]) {
      expect(context).toContain(field);
    }
    expect(context).toMatch(
      /must not include[\s\S]*complete conversation[\s\S]*private reasoning[\s\S]*full test transcript/i,
    );
  });

  it("defines one exact route decision and truthful application state", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const decision = extractSection(reference, "## Route Decision");

    for (const field of [
      "NAVI_ROUTE_DECISION",
      "version: 1",
      "route_id",
      "source_task",
      "target_role",
      "work_mode",
      "task_kind",
      "capability_floor",
      "selected_tier: fast | standard | strong",
      "resolved_model",
      "reasoning_effort",
      "lease_scope",
      "reason_codes",
      "visibility: quiet | explain | decision-required",
      "escalate_on",
      "downgrade_after",
      "fallback: same-tier-then-upward",
      "application_state: applied | host-default | recommended-not-applied",
    ]) {
      expect(decision).toContain(field);
    }
  });

  it("sets deterministic role and validation floors", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const floors = extractSection(reference, "## Deterministic Floors");

    const rows = [
      ["Main design, architecture, or acceptance", "strong + high"],
      ["Mechanical reversible execution", "fast + medium"],
      ["Ordinary bounded execution", "standard + medium"],
      ["Shared-core or complex-debug execution", "strong + high"],
      ["Validation Level 1", "fast + medium"],
      ["Validation Level 2", "standard + high"],
      ["Validation Level 3", "strong + high"],
    ];
    for (const row of rows) {
      for (const cell of row) expect(floors).toContain(cell);
    }
    expect(floors).toMatch(/permission[\s\S]*irreversible[\s\S]*strong/i);
  });

  it("keeps Router Check exceptional and non-recursive", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const router = extractSection(reference, "## Router Check");

    expect(router).toMatch(/only when deterministic rules[\s\S]*more than one valid route/i);
    expect(router).toMatch(/strong \+ low[\s\S]*strong \+ medium/i);
    expect(router).toMatch(/short-lived[\s\S]*read-only[\s\S]*tool-free/i);
    expect(router).toMatch(/cannot lower[\s\S]*deterministic floor/i);
    expect(router).toMatch(/must not create another Router Check/i);
    expect(router).toMatch(/strong \+ high[\s\S]*route the actual task/i);
  });

  it("uses stage leases, upward-only fallback, and explicit user control", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const lease = extractSection(reference, "## Route Lease");
    const fallback = extractSection(reference, "## Host Resolution And Fallback");
    const overrides = extractSection(reference, "## User Overrides");

    expect(lease).toMatch(/task-local[\s\S]*stage-bound/i);
    expect(lease).toMatch(/must not[\s\S]*project file[\s\S]*global database/i);
    expect(lease).toMatch(/fast model[\s\S]*must not[\s\S]*downgrade[\s\S]*extend/i);
    expect(fallback).toMatch(/same tier[\s\S]*stronger tier[\s\S]*never silently/i);
    expect(fallback).toMatch(/recommended-not-applied[\s\S]*must not claim/i);
    expect(overrides).toMatch(/task[\s\S]*stage[\s\S]*session/i);
    expect(overrides).toMatch(/below the floor[\s\S]*explicit confirmation/i);
    expect(overrides).toMatch(/cannot replace[\s\S]*independent validation/i);
  });

  it("keeps model mappings dynamic and Fast mode user-controlled", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const catalog = extractSection(reference, "## Host Model Catalog");
    const boundaries = extractSection(reference, "## Boundaries");

    expect(catalog).toMatch(/GPT-5\.6 Luna[\s\S]*GPT-5\.6 Terra[\s\S]*GPT-5\.6 Sol/i);
    expect(catalog).toMatch(/preferences[\s\S]*not a static model catalog/i);
    expect(catalog).toMatch(/Codex Spark[\s\S]*ultra-fast\/text-only/i);
    expect(catalog).toMatch(/deprecated[\s\S]*must not/i);
    expect(boundaries).toMatch(/Fast mode[\s\S]*user-controlled/i);
    expect(boundaries).toMatch(/not a database[\s\S]*not a daemon[\s\S]*not a scheduler/i);
    expect(boundaries).toMatch(/must not switch[\s\S]*active turn/i);
  });

  it("keeps one canonical owner and a byte-identical package mirror", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/model-routing-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/model-routing-v1.md"),
    ]);
    expect(packaged).toBe(canonical);
  });
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts
```

Expected: FAIL because both `model-routing-v1.md` files are absent.

- [ ] **Step 3: Write the canonical routing owner**

Create `.agents/skills/navi/references/model-routing-v1.md` with this complete
content:

```markdown
# Navi Task Model Routing V1

Use this reference only when the user has explicitly authorized a Navi model-routing policy for bounded Codex tasks. Navi owns capability judgment and route contracts; the Codex host owns the available model catalog, task creation, follow-up delivery, and whether a requested model-and-reasoning combination is accepted.

This is active-session, prompt/docs-backed task routing. It is not Main Turn Host Adapter behavior, active-turn switching, Fast mode control, a database, a daemon, a scheduler, or a background service.

## Routing Context

Build the smallest factual context that can change a route. It may include one concise task summary. It must not include the complete conversation, private reasoning, or a full test transcript.

NAVI_ROUTING_CONTEXT
version: 1
role: main | execution | validation | router
work_mode: design | calibration | implementation | release
task_kind: status | exploration | edit | debug | review | decision
scope: narrow | multi-file | cross-module | external-state
reversibility: reversible | costly | irreversible
uncertainty: low | medium | high
evidence_conflict: true | false
validation_level: 1 | 2 | 3 | none
required_capabilities: concise list of required tools, modality, or context
recent_failures: 0 | 1 | 2+
user_policy: balanced
user_override: optional task, stage, or session override
current_lease: optional current NAVI_ROUTE_DECISION identifier

## Deterministic Floors

Apply deterministic floors before model judgment. Work Mode is one input; role, scope, reversibility, uncertainty, required capabilities, validation level, and recent failures also constrain the route.

| Work | Minimum route |
| --- | --- |
| Main design, architecture, or acceptance | strong + high |
| Mechanical reversible execution | fast + medium |
| Ordinary bounded execution | standard + medium |
| Shared-core or complex-debug execution | strong + high |
| Validation Level 1 | fast + medium |
| Validation Level 2 | standard + high |
| Validation Level 3 | strong + high, optionally xhigh when the host supports it |

Permission-bearing or irreversible work has a strong floor. Architecture, final acceptance, high-impact risk, external-state mutation, and repeated material failure also route directly to a strong floor. Required tools, modality, context, or entitlement can raise a floor or invalidate a concrete model. A deterministic floor does not need a Router Check.

## Router Check

Create a Router Check only when deterministic rules leave more than one valid route and the remaining choice materially affects quality, latency, or cost. Ordinary ambiguity uses strong + low. Conflicting route evidence may use strong + medium.

A Router Check is short-lived, read-only, tool-free, receives only NAVI_ROUTING_CONTEXT, and returns only one NAVI_ROUTE_DECISION. It cannot lower the deterministic floor, modify files, approve an operation, or extend a fast lease. It must not create another Router Check. Missing evidence defaults upward. When route judgment itself would require strong + high, route the actual task to strong + high instead of creating a recursive Router Check.

## Route Decision

Emit exactly one decision for one task-and-stage boundary:

NAVI_ROUTE_DECISION
version: 1
route_id: one stable identifier for this task-and-stage route
source_task: persistent Main Thread task identifier
target_role: main | execution | validation | router
work_mode: design | calibration | implementation | release
task_kind: status | exploration | edit | debug | review | decision
capability_floor: minimum tier plus reasoning effort
selected_tier: fast | standard | strong
resolved_model: host-validated model identifier or unavailable
reasoning_effort: host-supported effort or unavailable
lease_scope: named task stage or one Router Check
reason_codes: concise factual route reasons
visibility: quiet | explain | decision-required
escalate_on: stage-invalidating conditions
downgrade_after: explicit completed stage condition
fallback: same-tier-then-upward
application_state: applied | host-default | recommended-not-applied

`applied` is valid only after the Codex host accepts the requested model-and-reasoning combination. `host-default` is valid only when model routing was not authorized. `recommended-not-applied` records truthful failure evidence and must not be described as automatic routing.

## Route Lease

A Route Lease is task-local and stage-bound. Bind `route_id`, resolved model, reasoning effort, `lease_scope`, reason codes, visibility, escalation triggers, and downgrade condition to that stage. Keep the route stable until the stage ends or a listed trigger invalidates it.

A lease must not be persisted in a project file, `.navi`, `AGENTS.md`, or a global database. A lost lease is recomputed conservatively. A fast model may request upward escalation, but it must not approve its own downgrade or extend its own lease. A downgrade requires a completed stage, no unresolved Important or Critical risk, a lower next-stage floor, and no stronger user override. A narrow status turn does not invalidate a stronger current-stage lease.

## Host Model Catalog

Treat `fast`, `standard`, and `strong` as abstract capability tiers. For the approved current Pro-user environment, prefer GPT-5.6 Luna for fast, GPT-5.6 Terra for standard, and GPT-5.6 Sol for strong. Compatible fallbacks are GPT-5.4 mini, GPT-5.4, and GPT-5.5 respectively. These are preferences, not a static model catalog.

The Codex host is authoritative for current availability, reasoning efforts, tools, modalities, context, entitlement, preview policy, and deprecation. GPT-5.3 Codex Spark is an exceptional ultra-fast/text-only route, not the default fast route. Do not place a deprecated model into a new route. Experimental or preview use requires policy permission and visible selection.

## Host Resolution And Fallback

Filter host models by the deterministic floor and every required capability. Try another valid model in the same tier, then a stronger tier. Never silently fall below the floor. If only a below-floor route remains, return `decision-required` to the Main Thread.

Apply the route only at task creation or an existing-task follow-up turn boundary by supplying the host-supported model and reasoning fields. If the host rejects or cannot apply the route, return `application_state: recommended-not-applied`; this state must not claim the model changed. Do not guess an unavailable model identifier.

## User Overrides

The user may override model or reasoning for the current task, stage, or session. Apply an override at or above the floor directly. An override below the floor requires one concise risk explanation and one explicit confirmation. It may govern approved reversible exploration, but it cannot replace required independent validation or final acceptance. Expire the override at its stated scope; do not turn it into a global preference.

## Quietness

Keep ordinary routes and valid same-tier substitutions quiet. Explain only a material stage change, policy or budget exceedance, experimental selection, unavailable required tier, below-floor override, or a material cost, delay, capability, target, scope, or risk change. Keep the explanation concise. Do not print a route table, score, private reasoning, or repeated route status unless the user asks and it creates control gain.

## Failure Handling

Return `decision-required` when a required route cannot be applied, the available route is below the floor, policy permission is missing, or host evidence conflicts. Preserve the current valid lease until a turn boundary when possible. Do not silently lower the tier, retry in the background, create duplicate Router Checks, widen scope, grant permission, or claim automatic switching succeeded. Routing failure does not authorize merge, push, tag, release, publication, or product-risk acceptance.

## Boundaries

Task Model Routing V1 is prompt/docs-backed supervision for bounded Codex tasks. It is not a database, not a daemon, and not a scheduler. It is not a queue, watcher, background service, Runtime Surface, UI, MCP server, or other-agent adapter.

Codex Fast mode is user-controlled; Navi must not enable, disable, purchase, or change its service tier. Navi must not switch an active turn. This milestone does not implement the Main Turn Host Adapter, persist route policy, create a permanent Router Task, or prove natural host behavior through static tests.
```

Copy the completed file byte-for-byte to
`plugins/navi/skills/navi/references/model-routing-v1.md`.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts
```

Expected: PASS, 1 file and 7 tests.

- [ ] **Step 5: Check Task 1 scope and commit**

Run:

```bash
git diff --check
git diff --name-only
cmp .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md
git add .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md tests/skills/navi-model-routing.test.ts
git diff --cached --check
git commit -m "feat: define navi task model routing"
```

Expected: exactly the three Task 1 paths are committed.

---

### Task 2: Apply Independent Routes To Supervised Delivery Tasks

**Files:**
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: `NAVI_ROUTE_DECISION` V1 from Task 1.
- Consumes: deterministic Execution and Validation floors from Task 1.
- Produces: an optional additive routing-enabled Execution Contract extension.
- Produces: independent route application before Execution and Validation Task
  creation.
- Preserves: all existing contracts without the extension as valid host-default
  behavior.

- [ ] **Step 1: Add failing Supervised Delivery routing tests**

Append these tests inside the existing `describe` block in
`tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("keeps model routing additive and explicitly authorized", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const extension = extractSection(reference, "## Model Routing Extension");

  for (const field of [
    "model_routing_policy: balanced",
    "model_routing_authorized: true",
    "execution_route: NAVI_ROUTE_DECISION V1",
    "validation_route: derive at review-ready from validation_level",
    "router_check_preauthorized: true",
  ]) {
    expect(extension).toContain(field);
  }
  expect(extension).toMatch(/additive[\s\S]*existing Execution Contract/i);
  expect(extension).toMatch(/absent[\s\S]*host-default[\s\S]*no Router Check/i);
  expect(extension).toMatch(/does not authorize[\s\S]*experimental[\s\S]*Fast mode/i);
});

it("routes execution and validation independently before task creation", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const lifecycle = extractSection(reference, "## Task Route Lifecycle");

  expect(lifecycle).toMatch(
    /before creating[\s\S]*Execution Thread[\s\S]*NAVI_ROUTE_DECISION/i,
  );
  expect(lifecycle).toMatch(
    /review-ready[\s\S]*validation_level[\s\S]*independent[\s\S]*Validation Thread/i,
  );
  expect(lifecycle).toMatch(/Codex host[\s\S]*model[\s\S]*thinking/i);
  expect(lifecycle).toMatch(/application_state: applied[\s\S]*host accepted/i);
  expect(lifecycle).toMatch(/must not[\s\S]*inherit[\s\S]*Execution[\s\S]*fast lease/i);
  expect(lifecycle).toMatch(/same Validation Thread[\s\S]*follow-up turn boundary/i);
});

it("preserves validation-level floors and truthful routing failure", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const lifecycle = extractSection(reference, "## Task Route Lifecycle");
  const failure = extractSection(reference, "## Failure Handling");

  expect(lifecycle).toMatch(/Level 1[\s\S]*fast \+ medium/i);
  expect(lifecycle).toMatch(/Level 2[\s\S]*standard \+ high/i);
  expect(lifecycle).toMatch(/Level 3[\s\S]*strong \+ high/i);
  expect(failure).toMatch(/required route[\s\S]*cannot be applied[\s\S]*decision-required/i);
  expect(failure).toMatch(/must not claim[\s\S]*automatic switching/i);
  expect(failure).toMatch(/must not silently[\s\S]*lower tier/i);
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because `## Model Routing Extension` and
`## Task Route Lifecycle` are absent.

- [ ] **Step 3: Add the additive routing extension and lifecycle**

In `.agents/skills/navi/references/supervised-delivery-v1.md`, add after the
base Execution Contract:

```markdown
## Model Routing Extension

The base Execution Contract remains valid. Model routing is an additive opt-in extension. A routing-enabled contract records exactly:

model_routing_policy: balanced
model_routing_authorized: true
execution_route: NAVI_ROUTE_DECISION V1
validation_route: derive at review-ready from validation_level
router_check_preauthorized: true

When this extension is absent, omit model and thinking overrides, use `application_state: host-default`, and create no Router Check. The extension does not authorize an experimental model, Fast mode, service-tier changes, a lower capability floor, new permissions, scope expansion, risk acceptance, merge, push, tag, release, or publication.
```

Add this exact `## Task Route Lifecycle` section:

```markdown
## Task Route Lifecycle

Before creating the Execution Thread's Codex task, build its NAVI_ROUTE_DECISION from the approved Execution Contract and `model-routing-v1.md`. Supply the resolved `model` and `thinking` fields to the Codex host. Record `application_state: applied` only after the host accepted the requested combination.

After the exact snapshot reaches review-ready, derive the Validation route from `validation_level` independently before creating the Validation Thread. Level 1 uses `fast + medium`; Level 2 uses `standard + high`; Level 3 uses `strong + high`, optionally `xhigh` only when the host supports it and the costly failure boundary warrants it. Validation must not inherit the Execution Thread's fast lease, and the executor does not choose the capability needed to accept its own work.

Reuse the same Validation Thread for bounded remediation re-review. Re-evaluate its floor and apply any changed route only at a follow-up turn boundary. Route schemas, host resolution, fallback, leases, user overrides, and quietness remain owned by `model-routing-v1.md`; do not duplicate them here.
```

Extend `## Validation Contract` with this conditional field description:

```text
route_decision: NAVI_ROUTE_DECISION V1 when the routing extension is active; otherwise host-default
```

Extend `## Failure Handling` with this paragraph:

```markdown
When a required route cannot be applied, return `decision-required` to the Main Thread. Do not silently lower the tier, widen scope, or claim automatic switching succeeded. Preserve `recommended-not-applied` as truthful evidence and leave merge, push, tag, release, publication, permission, and risk decisions with their existing owners.
```

Copy the completed canonical reference byte-for-byte to the packaged path.

- [ ] **Step 4: Run Task 2 coverage to verify GREEN**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts
```

Expected: PASS, 2 files.

- [ ] **Step 5: Check Task 2 scope and commit**

Run:

```bash
git diff --check
cmp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff HEAD --name-only
git add .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervised-delivery.test.ts
git diff --cached --check
git commit -m "feat: route navi supervised delivery tasks"
```

Expected: exactly the three Task 2 paths are committed.

---

### Task 3: Adopt Task Routing In Navi Supervision

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/supervision-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervision-v1.md`
- Modify: `tests/skills/navi-supervision.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: canonical Task Model Routing owner from Task 1.
- Consumes: routing-enabled Supervised Delivery extension from Task 2.
- Produces: one skill routing entry and concise global hard boundaries.
- Produces: Work Mode, quietness, and user-decision adoption without copying
  schemas into `supervision-v1.md`.

- [ ] **Step 1: Add failing skill and supervision adoption tests**

Append to `tests/skills/navi-supervision.test.ts`:

```ts
it("routes task model decisions to one canonical owner", async () => {
  const [skill, supervision, routing, packagedSkill, packagedSupervision] =
    await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervision-v1.md"),
      readRepoText(".agents/skills/navi/references/model-routing-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/references/supervision-v1.md"),
    ]);

  expect(skill).toContain("references/model-routing-v1.md");
  expect(supervision).toMatch(
    /Task Model Routing[\s\S]*model-routing-v1\.md[\s\S]*Supervised Delivery/i,
  );
  expect(supervision).toMatch(/Design[\s\S]*Calibration[\s\S]*Implementation[\s\S]*Release/i);
  expect(supervision).toMatch(/ordinary routing[\s\S]*quiet/i);
  expect(supervision).not.toContain("NAVI_ROUTE_DECISION\nversion: 1");
  expect(routing).toContain("NAVI_ROUTE_DECISION\nversion: 1");
  expect(packagedSkill).toBe(skill);
  expect(packagedSupervision).toBe(supervision);
});
```

Add to `tests/skills/navi-skill.test.ts` inside its existing Navi skill suite:

```ts
it("keeps task routing bounded to explicit user authorization", async () => {
  const skill = await readRepoText(".agents/skills/navi/SKILL.md");

  expect(skill).toMatch(/model routing[\s\S]*explicit user-authorized policy/i);
  expect(skill).toMatch(/must not switch[\s\S]*active turn/i);
  expect(skill).toMatch(/fast model[\s\S]*must not[\s\S]*downgrade[\s\S]*extend/i);
  expect(skill).toMatch(/must not enable[\s\S]*Fast mode/i);
  expect(skill).toMatch(/Main Turn Host Adapter[\s\S]*not implemented/i);
});
```

If `tests/skills/navi-skill.test.ts` uses a different local reader name, use
that existing helper rather than adding a duplicate.

- [ ] **Step 2: Run the focused tests to verify RED**

Run:

```bash
npm test -- tests/skills/navi-supervision.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because the skill and supervision owner do not adopt Task Model
Routing.

- [ ] **Step 3: Add concise skill routing and hard boundaries**

In `.agents/skills/navi/SKILL.md`:

1. add `references/model-routing-v1.md` to Required References as the sole owner
   for Codex task model tiers, reasoning effort, capability floors, Router
   Checks, Route Leases, host model resolution, and task-level route failure;
2. add this concise hard-boundary paragraph in the existing routing/boundary
   area:

```markdown
Task model routing requires an explicit user-authorized policy and remains owned by `references/model-routing-v1.md`. Navi must not switch an active turn, and a fast model must not approve its own downgrade or extend its own lease. Navi must not enable Fast mode or change service tier. The Main Turn Host Adapter is not implemented. Do not turn task routing into runtime, persistence, polling, or a visible route report on every response.
```

In `.agents/skills/navi/references/supervision-v1.md`, add a concise
`### Task Model Routing` subsection near Work Mode / coordination policy with
this content:

```markdown
### Task Model Routing

Work Mode (`Design`, `Calibration`, `Implementation`, or `Release`) is one Routing Context input; it does not replace role, scope, reversibility, uncertainty, or Validation Level. A routing-enabled Supervised Delivery contract invokes `model-routing-v1.md` for the Execution and Validation tasks. Keep ordinary routing quiet. An unavailable required route or a route below the deterministic floor becomes a real user decision with a recommendation. Main Thread turn routing remains the separate Main Turn Host Adapter milestone.
```

Do not copy either exact schema into supervision. Copy both canonical files
byte-for-byte to their packaged paths.

- [ ] **Step 4: Run Task 3 coverage to verify GREEN**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-skill.test.ts
```

Expected: PASS, 4 files.

- [ ] **Step 5: Check Task 3 scope and commit**

Run:

```bash
git diff --check
cmp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cmp .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md
git diff HEAD --name-only
git add .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md .agents/skills/navi/references/supervision-v1.md plugins/navi/skills/navi/references/supervision-v1.md tests/skills/navi-supervision.test.ts tests/skills/navi-skill.test.ts
git diff --cached --check
git commit -m "feat: supervise navi task model routing"
```

Expected: exactly the six Task 3 paths are committed.

---

### Task 4: Document The Unreleased Task-Level Boundary

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `plugins/navi/README.md`
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `tests/skills/navi-capability-truthfulness.test.ts`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: implemented Task Routing Foundation from Tasks 1-3.
- Produces: truthful English, Chinese, plugin, roadmap, debt, and active-index
  descriptions.
- Preserves: latest tagged release truth, Distribution history, Product Complete
  calibration status, and the separate Main Turn Host Adapter gate.

- [ ] **Step 1: Add failing current-source truthfulness tests**

Append to `tests/skills/navi-capability-truthfulness.test.ts`:

```ts
it("describes task model routing without claiming complete main-thread automation", async () => {
  const [readme, chineseReadme, pluginReadme] = await Promise.all([
    readRepoText("README.md"),
    readRepoText("README.zh-CN.md"),
    readRepoText("plugins/navi/README.md"),
  ]);

  for (const surface of [readme, pluginReadme]) {
    expect(surface).toMatch(
      /unreleased[\s\S]*Task Routing Foundation[\s\S]*Execution[\s\S]*Validation/i,
    );
    expect(surface).toMatch(/explicit user-authorized[\s\S]*model[\s\S]*reasoning/i);
    expect(surface).toMatch(/Main Turn Host Adapter[\s\S]*not implemented/i);
    expect(surface).toMatch(
      /does not control Fast mode[\s\S]*does not provide a runtime scheduler/i,
    );
  }

  expect(chineseReadme).toMatch(
    /尚未发布[\s\S]*Task Routing Foundation[\s\S]*Execution[\s\S]*Validation/i,
  );
  expect(chineseReadme).toMatch(/用户明确授权[\s\S]*模型[\s\S]*reasoning/i);
  expect(chineseReadme).toMatch(/Main Turn Host Adapter[\s\S]*尚未实现/i);
});
```

Append to `tests/repository/current-surface.test.ts`:

```ts
it("indexes task model routing while keeping the main adapter as a separate gate", async () => {
  const [history, roadmap, debt] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
  ]);
  const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

  expect(active).toContain(
    "`docs/superpowers/specs/2026-07-18-navi-codex-model-reasoning-routing-design.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-18-navi-task-model-routing-foundation.md`",
  );
  expect(roadmap).toMatch(/Task Routing Foundation[\s\S]*Main Turn Host Adapter/i);
  expect(roadmap).toMatch(/Task-level[\s\S]*does not complete[\s\S]*three-role/i);
  expect(debt).toMatch(/host model catalog[\s\S]*natural calibration/i);
  expect(debt).toMatch(/Main Turn Host Adapter[\s\S]*separate/i);
});
```

- [ ] **Step 2: Run the focused tests to verify RED**

Run:

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: FAIL because current docs do not describe or index the foundation.

- [ ] **Step 3: Add truthful current-main documentation**

Add a short `Task model routing on current main` subsection to `README.md` and
`plugins/navi/README.md` that states:

```text
Current main contains an unreleased, prompt/docs-backed Task Routing Foundation for Supervised Delivery work with an explicit user-authorized routing policy. It can resolve and apply model plus reasoning choices when Codex creates bounded Execution and Validation Tasks. Validation derives its route independently from Validation Level rather than inheriting the executor's route.

This is not complete three-role automatic routing. The Main Turn Host Adapter is not implemented, active turns cannot switch models, Navi does not control Fast mode, and it does not provide a runtime scheduler, database, queue, daemon, or background service. Real host behavior still requires post-integration natural calibration.
```

Add this equivalent concise Chinese subsection to `README.zh-CN.md`, preserving
the stable technical terms:

```text
当前 main 包含尚未发布的、由 prompt/docs 支撑的 Task Routing Foundation；它只对具有用户明确授权路由策略的 Supervised Delivery 工作生效。当 Codex 创建有界的 Execution 和 Validation 任务时，它可以解析并应用模型与 reasoning 选择。Validation 根据 Validation Level 独立推导路由，而不是继承执行者的路由。

这还不是完整的三角色自动路由。Main Turn Host Adapter 尚未实现，活跃 turn 不能切换模型，Navi 不控制 Fast mode，也不提供 runtime scheduler、database、queue、daemon 或后台服务。真实 host 行为仍需在集成后进行自然校准。
```

In `docs/navi/design-history.md`, add the approved model-routing spec and this
plan to `## Active`. Do not remove or rewrite historical entries.

In `docs/navi/roadmap.md`, add a focused `## Codex Model And Reasoning Routing`
section that records:

- Task Routing Foundation is the first bounded milestone;
- Task-level completion does not complete three-role automatic routing;
- Main Turn Host Adapter is the next separate milestone;
- Shadow, task-level, and main-turn natural calibration remain separate gates;
  and
- Runtime Surface is reconsidered only if the thin adapter proves insufficient.

Include the exact sentence: `Task-level completion does not complete
three-role automatic routing.`

In `docs/navi/product-debt.md`, add bounded debt for dynamic host-catalog truth,
actual route-application calibration, the unimplemented Main Turn Host Adapter,
and cross-surface behavior. Do not call those items current implementation
failures or release blockers. Include the exact sentences: `The host model
catalog remains dynamic and requires natural calibration.` and `The Main Turn
Host Adapter remains a separate milestone.`

- [ ] **Step 4: Run Task 4 coverage to verify GREEN**

Run:

```bash
npm test -- tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
```

Expected: PASS, 2 files.

- [ ] **Step 5: Check Task 4 scope and commit**

Run:

```bash
git diff --check
git diff HEAD --name-only
git add README.md README.zh-CN.md plugins/navi/README.md docs/navi/design-history.md docs/navi/roadmap.md docs/navi/product-debt.md tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
git diff --cached --check
git commit -m "docs: explain navi task model routing"
```

Expected: exactly the eight Task 4 paths are committed.

## Final Bounded Verification

After Task 4, run exactly:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run verify:plugin-package
git diff --check
diff -rq .agents/skills/navi plugins/navi/skills/navi
git rev-list --count BASELINE..HEAD
git diff --name-only BASELINE..HEAD
git status --short --branch
```

Replace `BASELINE` with the exact preflight commit. Expected:

- the focused six-file suite passes;
- plugin-package verification passes, including manifest and source/package
  drift checks;
- diff and mirror checks pass;
- exactly four planned commits exist above the baseline;
- the changed paths are exactly the 20 unique paths listed by Tasks 1-4;
- no package, lockfile, generated init, distribution, Historical Along,
  external-project, or `work/` path changed; and
- the worktree is clean.

Run the forbidden-scope audit:

```bash
git diff --name-only BASELINE..HEAD -- package.json package-lock.json src/cli scripts .agents/plugins plugins/navi/.codex-plugin plugins/navi/VERSION.md archive/along work
git diff BASELINE..HEAD -- .agents/skills/navi plugins/navi/skills/navi README.md README.zh-CN.md plugins/navi/README.md docs/navi tests/skills tests/repository | rg -n "service_tier|/fast on|writeFile|appendFile|config\.toml|background retry|automatic merge|automatic push|automatic release"
```

Expected: the forbidden path audit is empty. The content audit may match only
explicit negative boundaries such as “do not control Fast mode”; inspect every
match and reject any affirmative runtime, config-write, service-tier, or
automatic Git/release behavior.

## Execution Review And Handoff

The Execution Task performs a final read-only whole-candidate review against:

- the approved design;
- this implementation plan;
- the complete baseline-to-HEAD diff;
- the canonical/package mirror;
- the additive backward-compatible Supervised Delivery contract;
- the explicit user-authorization boundary;
- the Main Turn Host Adapter exclusion; and
- the exact final verification evidence.

The final review must distinguish:

- implementation defects that violate this plan;
- natural-host evidence intentionally deferred to calibration; and
- Main Turn Host Adapter work intentionally deferred to Milestone 2.

If no Critical or Important finding remains, send one conformant bare
`NAVI_LANE_HANDOFF_EVENT V1` `review-ready` payload to the Main Thread with the
exact baseline, reviewed snapshot, four commits, changed paths, verification,
residual risks, and explicit statement that no real model/task calibration ran.

The Main Thread then performs its bounded source-side scope/snapshot audit and
creates one fresh Level 2 read-only Validation Task for the exact snapshot under
the existing Supervised Delivery preauthorization. The validator reads the
design, plan, full diff, contract owners, focused tests, and executor evidence.
It does not install dependencies silently, repeat the complete executor test
transcript merely for a second green run, write files, implement fixes, merge,
push, tag, release, or accept product risk.

After validator acceptance, return to the Main Thread for the explicit
integration decision. Do not automatically start Shadow Calibration, Task-Level
Live Calibration, the Main Turn Host Adapter plan, merge, push, tag, release, or
publication.
