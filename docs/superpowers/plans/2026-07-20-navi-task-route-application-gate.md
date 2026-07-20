# Navi Task Route Application Gate V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every user-authorized Navi Execution or Validation route fail
closed before task creation or a route-changing follow-up unless the Codex host
request carries the exact selected model and reasoning effort.

**Architecture:** Upgrade new routing boundaries to `NAVI_ROUTE_DECISION V2`
with a truthful pre-send `pending` state, then record host acceptance in a
separate ephemeral `NAVI_ROUTE_APPLICATION V1`. Keep
`model-routing-v1.md` as the sole detailed owner, adopt the gate from
Supervised Delivery and the Navi skill, and preserve historical V1 route
evidence plus lightweight unchanged-lease follow-ups.

**Tech Stack:** Markdown skill/reference contracts, Codex task creation and
follow-up model/thinking fields, TypeScript, Vitest, Git, canonical/package
skill mirrors.

## Global Constraints

- Approved design:
  `docs/superpowers/specs/2026-07-20-navi-task-route-application-gate-design.md`.
- Use exactly three implementation task commits with the subjects specified in
  this plan. The plan commit is separate from those implementation commits.
- Do not rewrite historical `NAVI_ROUTE_DECISION V1` evidence. New
  routing-enabled task creation and route-changing follow-ups use V2.
- `NAVI_ROUTE_APPLICATION V1` is ephemeral coordination evidence. Do not
  persist it in project files, `.navi`, `AGENTS.md`, or global state.
- Routing-authorized task creation fails closed when a decision, model,
  reasoning effort, route id, or exact argument match is missing.
- `host-default` is valid only when routing was not authorized.
- Ordinary follow-ups inside an unchanged valid Route Lease omit model and
  thinking overrides and do not reroute.
- A route-changing follow-up repeats the gate and carries explicit model and
  thinking arguments.
- Preserve deterministic floors, same-tier-then-upward fallback, user
  overrides, independent Execution/Validation routing, validation-pending
  semantics, quietness, and at-most-two remediation rounds.
- Do not switch an active Main Task turn, enable Fast mode, change service
  tier, or implement a Main Turn Host Adapter.
- Do not add runtime code, a database, queue, daemon, scheduler, watcher,
  background service, UI, MCP server, CLI behavior, dependency, package
  metadata, Distribution behavior, Update Host behavior, or external-project
  mutation.
- Do not touch `work/`, Historical Along, package or lock metadata, release
  metadata, generated plugin-init bytes, or real Codex global state.
- Keep canonical and packaged Navi skill files byte-identical.
- Use whitespace-normalized semantic assertions for new Markdown behavior.
  Do not make line wrapping part of acceptance.
- Use focused tests, typecheck, plugin-package verification, mirror checks,
  diff checks, and exact scope audits. Do not run full `npm test`.
- Do not merge, push, tag, release, publish, or start natural calibration.
- Final independent validation is Level 2 and read-only. Reuse the same
  Validation Task for at most two in-scope remediation rounds.

## Execution Contract

```text
goal: implement Navi Task Route Application Gate V1
user_value: routing-authorized Execution and Validation Tasks cannot accidentally inherit the host default because model or reasoning arguments were omitted
source_task: 019f1cc8-2630-7d72-94ba-d12f5b12508b
baseline: exact clean main commit containing the approved Gate V1 design and this plan
allowed_scope: exactly the 13 canonical/package route-owner, adoption, focused-test, and current-authority paths listed in Tasks 1-3
forbidden_scope: runtime, Main Turn Host Adapter, active Main turn switching, Fast mode, service tier, global config, persistence, polling, background retry, CLI, dependency, package metadata, Distribution, Update Host, external project, work/, Historical Along, merge, push, tag, release, publication, natural calibration
implementation_plan: docs/superpowers/plans/2026-07-20-navi-task-route-application-gate.md
verification_budget: exact focused tests, typecheck, plugin-package verification, mirror checks, diff and exact scope audits; no full npm test
validation_level: 2
validation_preauthorized: true
remediation_limit: 2
plan_satisfiability_check: required
plan_artifact_correction: bounded
stop_conditions: decision-required, formally blocked, or review-ready
handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready
```

## Preconditions

Run:

```bash
git status --short --branch
git rev-parse HEAD
test -f docs/superpowers/specs/2026-07-20-navi-task-route-application-gate-design.md
test -f docs/superpowers/plans/2026-07-20-navi-task-route-application-gate.md
test -f .agents/skills/navi/references/model-routing-v1.md
test -f .agents/skills/navi/references/supervised-delivery-v1.md
test -f tests/skills/navi-model-routing.test.ts
test -f tests/skills/navi-supervised-delivery.test.ts
```

Expected: the exact supplied baseline, only the known pre-existing untracked
`work/` directory, and all required files. Do not clean, stage, read, or modify
`work/`.

If `node_modules` is absent, the existing user-approved bounded dependency
restore policy may authorize one project-local `npm ci` only after its complete
preflight. Otherwise do not reinstall dependencies.

Run the bounded baseline:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts tests/repository/current-surface.test.ts
```

Expected: PASS before production edits.

## Planned File Structure And Ownership

### Task 1: canonical gate owner

- `.agents/skills/navi/references/model-routing-v1.md`: sole detailed owner of
  V1 compatibility, V2 pending decisions, the fail-closed gate,
  `NAVI_ROUTE_APPLICATION V1`, application lifecycle, fallback, and quietness.
- `plugins/navi/skills/navi/references/model-routing-v1.md`: byte-identical
  package mirror.
- `tests/skills/navi-model-routing.test.ts`: focused schema, gate, lifecycle,
  failure, compatibility, and mirror assertions.

### Task 2: supervised adoption

- `.agents/skills/navi/references/supervised-delivery-v1.md`: invokes the owner
  at Execution creation, Validation creation, and route-changing follow-up
  boundaries.
- `plugins/navi/skills/navi/references/supervised-delivery-v1.md`:
  byte-identical mirror.
- `.agents/skills/navi/SKILL.md`: concise fail-closed hard boundary and owner
  routing.
- `plugins/navi/skills/navi/SKILL.md`: byte-identical mirror.
- `tests/skills/navi-supervised-delivery.test.ts`: independent role and
  lifecycle adoption tests.
- `tests/skills/navi-skill.test.ts`: concise boundary and no-duplication test.

### Task 3: current authority

- `docs/navi/design-history.md`: indexes the approved design and plan and
  records the implemented-but-uncalibrated state.
- `docs/navi/roadmap.md`: makes Gate V1 the current task-routing reliability
  boundary while preserving the one natural joint Product Complete sample.
- `docs/navi/product-debt.md`: records prompt adherence and natural application
  as remaining evidence debt, not Runtime approval.
- `tests/repository/current-surface.test.ts`: locks the current authority and
  deferral boundaries.

---

### Task 1: Define The Fail-Closed Route Application Owner

**Files:**
- Modify: `.agents/skills/navi/references/model-routing-v1.md`
- Modify: `plugins/navi/skills/navi/references/model-routing-v1.md`
- Modify: `tests/skills/navi-model-routing.test.ts`

**Interfaces:**
- Consumes: existing `NAVI_ROUTING_CONTEXT V1`, deterministic floors, Router
  Check, Route Lease, host resolution, and V1 compatibility.
- Produces: `NAVI_ROUTE_DECISION V2` with pre-send `pending | host-default`.
- Produces: `NAVI_ROUTE_APPLICATION V1` with post-call
  `applied | recommended-not-applied`.
- Produces: `## Route Application Gate` and `## Route Application Lifecycle`.

- [ ] **Step 1: Add whitespace normalization and failing owner tests**

Add this helper after `extractSection` in
`tests/skills/navi-model-routing.test.ts`:

```ts
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}
```

Replace the existing route-decision test with these tests:

```ts
it("versions pending decisions separately from final application evidence", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/model-routing-v1.md",
  );
  const decision = normalizeWhitespace(
    extractSection(reference, "## Route Decision"),
  );
  const application = normalizeWhitespace(
    extractSection(reference, "## Route Application Result"),
  );

  for (const field of [
    "NAVI_ROUTE_DECISION",
    "version: 2",
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
    "fallback",
    "application_state: pending | host-default",
  ]) {
    expect(decision).toContain(field);
  }
    expect(decision).toContain("NAVI_ROUTE_DECISION V1");
    expect(decision).toContain("records remain readable");

  for (const field of [
    "NAVI_ROUTE_APPLICATION",
    "version: 1",
    "route_id",
    "boundary: task-create | route-changing-follow-up",
    "target_role: execution | validation | router",
    "target_task",
    "requested_model",
    "requested_reasoning",
    "host_operation: create-task | send-follow-up",
    "application_state: applied | recommended-not-applied",
    "host_evidence",
  ]) {
    expect(application).toContain(field);
  }
  expect(application).toContain("ephemeral coordination evidence");
  expect(application).toContain("Do not write it to a project file");
});

it("fails closed before a route-authorized host operation", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/model-routing-v1.md",
  );
  const gate = normalizeWhitespace(
    extractSection(reference, "## Route Application Gate"),
  );

  for (const requirement of [
    "routing is explicitly authorized",
    "one complete NAVI_ROUTE_DECISION V2",
    "application_state is pending",
    "model and thinking arguments",
    "exactly equal resolved_model and reasoning_effort",
    "neither value is unavailable",
    "at or above the deterministic floor",
    "same route_id",
  ]) {
    expect(gate).toContain(requirement);
  }
  expect(gate).toContain("must not send the host operation");
  expect(gate).toContain("must not omit the overrides and inherit host default");
});

it("records application only after host acceptance", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/model-routing-v1.md",
  );
  const lifecycle = normalizeWhitespace(
    extractSection(reference, "## Route Application Lifecycle"),
  );
  const quietness = normalizeWhitespace(
    extractSection(reference, "## Quietness"),
  );

  expect(lifecycle).toContain(
    "Host acceptance of the exact request produces applied",
  );
  expect(lifecycle).toContain(
    "Host rejection or an unsupported combination produces recommended-not-applied",
  );
  expect(lifecycle).toContain(
    "unchanged valid Route Lease omits model and thinking overrides",
  );
  expect(lifecycle).toContain(
    "route-changing follow-up creates a new V2 decision and repeats the gate",
  );
  expect(quietness).toContain(
    "A passed ordinary Route Application Gate is quiet",
  );
});
```

Keep the existing context, floor, Router Check, lease, catalog, boundary, and
mirror tests unchanged.

- [ ] **Step 2: Run the focused RED test**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts
```

Expected: FAIL because V2, the two new sections, and their required semantics
do not exist.

- [ ] **Step 3: Replace the Route Decision section with V2 plus compatibility**

In `.agents/skills/navi/references/model-routing-v1.md`, replace
`## Route Decision` through the paragraph before `## Route Lease` with:

```markdown
## Route Decision

Emit exactly one pending decision for one task-and-stage boundary:

NAVI_ROUTE_DECISION
version: 2
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
application_state: pending | host-default

`pending` is valid only after routing is authorized and the complete route is
ready for the matching host operation. It must not be described as completed
automatic routing. `host-default` is valid only when model routing was not
authorized; no Router Check or application gate is created for that path.

Existing `NAVI_ROUTE_DECISION V1` records remain readable as historical
evidence with their original `applied | host-default |
recommended-not-applied` meanings. New routing-authorized task creation and
route-changing follow-up boundaries use V2. Do not rewrite historical task
prompts, handoffs, calibration evidence, or committed records.

## Route Application Result

After the host operation returns, the Main Thread records exactly one result
for the same route id:

NAVI_ROUTE_APPLICATION
version: 1
route_id: matching NAVI_ROUTE_DECISION V2 identifier
boundary: task-create | route-changing-follow-up
target_role: execution | validation | router
target_task: created or continued Codex task identifier, or unavailable
requested_model: exact resolved model identifier
requested_reasoning: exact host-supported reasoning effort
host_operation: create-task | send-follow-up
application_state: applied | recommended-not-applied
host_evidence: concise successful task identity or rejection evidence

`applied` is valid only after the Codex host accepts a request carrying the
exact requested model and reasoning effort. Host acceptance is bounded request
evidence, not a runtime attestation for every generated token or later turn.
`recommended-not-applied` records rejection, an unsupported combination, or an
unresolved route and must not be described as automatic switching.

The application result is ephemeral coordination evidence. Do not write it to
a project file, `.navi`, `AGENTS.md`, or global route state.

## Route Application Gate

Run this gate immediately before every routing-authorized task creation or
route-changing follow-up. It passes only when routing is explicitly authorized,
one complete NAVI_ROUTE_DECISION V2 exists for the exact role and stage,
application_state is pending, resolved_model and reasoning_effort are concrete,
the host request includes model and thinking arguments that exactly equal
resolved_model and reasoning_effort and neither value is unavailable, the route is at or above the deterministic
floor and satisfies required capabilities and user overrides, and the task
prompt carries the same route_id.

If any condition fails, the Main Thread must not send the host operation. It
may resolve an allowed same-tier substitute, move upward, or return
decision-required. It must not omit the overrides and inherit host default.

## Route Application Lifecycle

For a new task, build the Routing Context, resolve one V2 decision with
application_state pending, pass the gate against the exact host arguments, and
then send the task. Host acceptance of the exact request produces applied with
the created task identity. Host rejection or an unsupported combination
produces recommended-not-applied and follows same-tier-then-upward fallback;
it does not create a host-default task.

An ordinary follow-up inside an unchanged valid Route Lease omits model and
thinking overrides and does not reroute. A route-changing follow-up creates a
new V2 decision and repeats the gate before sending explicit model and thinking
arguments. The result records boundary route-changing-follow-up.
```

Prepend this sentence to `## Quietness`:

```markdown
A passed ordinary Route Application Gate is quiet and does not add a visible
route report merely because explicit host arguments were accepted.
```

- [ ] **Step 4: Synchronize the package mirror**

Copy the complete canonical file bytes to:

```text
plugins/navi/skills/navi/references/model-routing-v1.md
```

Do not maintain the mirror with independent prose edits.

- [ ] **Step 5: Run the focused GREEN test and mirror check**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts
diff -q .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md
```

Expected: all model-routing tests PASS and `diff -q` prints nothing.

- [ ] **Step 6: Review Task 1**

Review the complete Task 1 diff against the design. Reject any hidden runtime,
persistence, polling, active-Main-turn, or host-default fallback claim. Resolve
all Critical and Important findings before committing.

- [ ] **Step 7: Commit Task 1**

```bash
git add .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md tests/skills/navi-model-routing.test.ts
git commit -m "feat: gate navi task route application"
```

---

### Task 2: Enforce The Gate At Supervised Task Boundaries

**Files:**
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `tests/skills/navi-supervised-delivery.test.ts`
- Modify: `tests/skills/navi-skill.test.ts`

**Interfaces:**
- Consumes: `NAVI_ROUTE_DECISION V2`, `NAVI_ROUTE_APPLICATION V1`, and the
  canonical Application Gate from Task 1.
- Produces: fail-closed Execution and Validation creation behavior.
- Produces: unchanged-lease versus route-changing follow-up distinction.
- Does not duplicate the complete route schemas outside the canonical owner.

- [ ] **Step 1: Add failing adoption tests**

Add `normalizeWhitespace` after `extractSection` in
`tests/skills/navi-supervised-delivery.test.ts`:

```ts
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}
```

Replace the existing two routing lifecycle tests beginning with
`routes execution and validation independently before task creation` with:

```ts
it("gates execution and validation independently before task creation", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const extension = normalizeWhitespace(
    extractSection(reference, "## Model Routing Extension"),
  );
  const lifecycle = normalizeWhitespace(
    extractSection(reference, "## Task Route Lifecycle"),
  );

  expect(extension).toContain("execution_route: NAVI_ROUTE_DECISION V2");
  expect(extension).toContain(
    "route_application: NAVI_ROUTE_APPLICATION V1 after host response",
  );
  expect(lifecycle).toContain(
    "Before creating the Execution Thread's Codex task",
  );
  expect(lifecycle).toContain("Pass the Route Application Gate");
  expect(lifecycle).toContain("exact model and thinking arguments");
  expect(lifecycle).toContain(
    "derive the Validation route from validation_level independently",
  );
  expect(lifecycle).toContain(
    "must not inherit the Execution Thread's Route Decision or application result",
  );
});

it("fails closed and distinguishes unchanged from changed follow-ups", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const lifecycle = normalizeWhitespace(
    extractSection(reference, "## Task Route Lifecycle"),
  );
  const failure = normalizeWhitespace(
    extractSection(reference, "## Failure Handling"),
  );

  expect(lifecycle).toContain(
    "unchanged valid Route Lease omits model and thinking overrides",
  );
  expect(lifecycle).toContain(
    "route-changing follow-up must create a new V2 decision and pass the gate",
  );
  expect(failure).toContain(
    "missing or mismatched model or thinking argument is a pre-send failure",
  );
  expect(failure).toContain("must not create a host-default task");
  expect(failure).toContain("decision-required");
});

it("keeps validation floors and truthful application evidence", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const lifecycle = normalizeWhitespace(
    extractSection(reference, "## Task Route Lifecycle"),
  );

  expect(lifecycle).toContain("Level 1 uses fast + medium");
  expect(lifecycle).toContain("Level 2 uses standard + high");
  expect(lifecycle).toContain("Level 3 uses strong + high");
  expect(lifecycle).toContain(
    "applied only after the host accepts the exact requested combination",
  );
});
```

Add this test to `tests/skills/navi-skill.test.ts` after the existing routing
boundary test:

```ts
it("requires the route application gate without duplicating its schema", async () => {
  const skill = normalizeWhitespace(
    await readRepoText(".agents/skills/navi/SKILL.md"),
  );

  expect(skill).toContain(
    "routing is authorized, Navi must pass the Route Application Gate before creating",
  );
  expect(skill).toContain("must not silently inherit the host default");
  expect(skill).not.toContain("NAVI_ROUTE_APPLICATION version: 1");
});
```

If `tests/skills/navi-skill.test.ts` does not already define
`normalizeWhitespace`, add:

```ts
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}
```

- [ ] **Step 2: Run the focused RED tests**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts
```

Expected: FAIL because Supervised Delivery still names V1 and does not invoke
the fail-closed gate, while SKILL lacks the concise hard boundary.

- [ ] **Step 3: Update the routing extension and lifecycle**

In `.agents/skills/navi/references/supervised-delivery-v1.md`, replace the five
extension fields with:

```text
model_routing_policy: balanced
model_routing_authorized: true
execution_route: NAVI_ROUTE_DECISION V2
validation_route: derive at review-ready from validation_level
route_application: NAVI_ROUTE_APPLICATION V1 after host response
router_check_preauthorized: true
```

Replace `## Task Route Lifecycle` with:

```markdown
## Task Route Lifecycle

Before creating the Execution Thread's Codex task, build its
NAVI_ROUTE_DECISION V2 from the approved Execution Contract and
`model-routing-v1.md`. Pass the Route Application Gate against the exact model
and thinking arguments before sending the task. Record NAVI_ROUTE_APPLICATION
V1 as applied only after the host accepts the exact requested combination.

After the exact snapshot reaches review-ready, derive the Validation route from
validation_level independently before creating the Validation Thread. Level 1
uses fast + medium; Level 2 uses standard + high; Level 3 uses strong + high,
optionally xhigh only when the host supports it and the costly failure boundary
warrants it. Validation must not inherit the Execution Thread's Route Decision
or application result, and the executor does not choose the capability needed
to accept its own work. The Main Thread passes the gate against the Validation
task's own exact model and thinking arguments.

An ordinary follow-up inside an unchanged valid Route Lease omits model and
thinking overrides and retains the current task settings. A route-changing
follow-up must create a new V2 decision and pass the gate before sending the
explicit replacement model and thinking arguments. Reuse the same Validation
Thread for bounded remediation re-review unless another existing lifecycle
boundary invalidates it.

Route schemas, application evidence, host resolution, fallback, leases, user
overrides, and quietness remain owned by `model-routing-v1.md`; do not duplicate
them here.
```

Update the Validation Contract field to:

```text
route_decision: NAVI_ROUTE_DECISION V2 when the routing extension is active; otherwise host-default
```

In `## Failure Handling`, add before the existing bullet list:

```markdown
When routing is authorized, a missing or mismatched model or thinking argument
is a pre-send failure. The Main Thread must not create a host-default task. It
uses the owner-defined same-tier-then-upward fallback or returns
`decision-required`; it does not claim automatic switching succeeded.
```

- [ ] **Step 4: Add the concise Navi skill boundary**

In `.agents/skills/navi/SKILL.md`, extend the first Hard Boundaries paragraph
with these sentences:

```markdown
When routing is authorized, Navi must pass the Route Application Gate before
creating an Execution, Validation, or Router Task or sending a route-changing
follow-up. It must not silently inherit the host default. Detailed gate and
application-result semantics remain owned by `references/model-routing-v1.md`.
```

Do not copy the V2 or application-result schemas into SKILL.md.

- [ ] **Step 5: Synchronize both package mirrors**

Copy complete canonical bytes to:

```text
plugins/navi/skills/navi/references/supervised-delivery-v1.md
plugins/navi/skills/navi/SKILL.md
```

- [ ] **Step 6: Run focused GREEN tests and mirror checks**

Run:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts
diff -q .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
```

Expected: all focused tests PASS and every `diff -q` prints nothing.

- [ ] **Step 7: Review Task 2**

Verify one-owner boundaries, independent Execution/Validation routes,
unchanged-lease behavior, exact route-changing follow-up behavior, fail-closed
host-default handling, and no new runtime or permission claim. Resolve all
Critical and Important findings before committing.

- [ ] **Step 8: Commit Task 2**

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts
git commit -m "feat: enforce navi route application"
```

---

### Task 3: Activate The Gate Without Overstating Product Proof

**Files:**
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/roadmap.md`
- Modify: `docs/navi/product-debt.md`
- Modify: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: implemented Gate V1 contract and existing Product Complete natural
  calibration boundary.
- Produces: current authority that distinguishes static implementation from
  natural route-application proof.
- Preserves: deferred Main Turn Host Adapter, local panel, Runtime Surface,
  Distribution, Update Host, and Release work.

- [ ] **Step 1: Add failing current-authority assertions**

In `tests/repository/current-surface.test.ts`, extend the existing task-routing
current-surface test with:

```ts
expect(active).toContain(
  "`docs/superpowers/specs/2026-07-20-navi-task-route-application-gate-design.md`",
);
expect(active).toContain(
  "`docs/superpowers/plans/2026-07-20-navi-task-route-application-gate.md`",
);
expect(history).toMatch(
  /Task Route Application Gate V1[\s\S]*implemented[\s\S]*naturally uncalibrated/i,
);
expect(roadmap).toMatch(
  /Route Application Gate V1[\s\S]*fail closed[\s\S]*host default/i,
);
expect(roadmap).toMatch(
  /does not implement[\s\S]*Main Turn Host Adapter[\s\S]*Runtime Surface/i,
);
expect(debt).toMatch(
  /application gate[\s\S]*prompt\/docs-backed[\s\S]*natural joint calibration/i,
);
```

- [ ] **Step 2: Run the focused RED test**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because the new design/plan are not indexed and the current
authority does not yet name the implemented-but-uncalibrated gate.

- [ ] **Step 3: Update current authority**

In `docs/navi/design-history.md`:

1. Add this current-phase paragraph after the existing Task Routing Foundation
   paragraph:

```markdown
Task Route Application Gate V1 is implemented as the current prompt/docs-backed
fail-closed boundary for routing-authorized Execution, Validation, and Router
Task creation plus route-changing follow-ups. It is naturally uncalibrated and
does not implement Main Turn Host Adapter or Runtime Surface enforcement.
```

2. Add these entries to `## Active`:

```markdown
- `docs/superpowers/specs/2026-07-20-navi-task-route-application-gate-design.md`
- `docs/superpowers/plans/2026-07-20-navi-task-route-application-gate.md`
```

In `docs/navi/roadmap.md`, add this paragraph under
`## Codex Model And Reasoning Routing` after the first paragraph:

```markdown
Route Application Gate V1 makes authorized task creation and route-changing
follow-ups fail closed when the explicit host model or reasoning arguments are
missing or do not match the selected route; Navi must not silently inherit the
host default. This remains prompt/docs-backed enforcement and does not implement
the Main Turn Host Adapter, Runtime Surface, task persistence, or active Main
turn switching.
```

In `docs/navi/product-debt.md`, add this paragraph to
`### 9. Task Model Routing Calibration Debt` before its final paragraph:

```markdown
The application gate closes the known omission path at the contract level, but
it remains prompt/docs-backed. One natural joint calibration must still show
that the Main Task consistently emits V2, passes exact model and reasoning
arguments, receives host acceptance, and records truthful application evidence
for independent Execution and Validation routes. Repeated omission after this
gate, rather than static implementation alone, would justify reconsidering a
Host Adapter or Runtime Surface.
```

- [ ] **Step 4: Run the focused GREEN test**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: PASS.

- [ ] **Step 5: Review Task 3**

Verify the new authority says implemented but naturally uncalibrated, preserves
the one genuine joint Product Complete sample, and does not authorize Runtime,
Update Host, Distribution, Release, or publication. Resolve all Critical and
Important findings before committing.

- [ ] **Step 6: Commit Task 3**

```bash
git add docs/navi/design-history.md docs/navi/roadmap.md docs/navi/product-debt.md tests/repository/current-surface.test.ts
git commit -m "docs: activate navi route application gate"
```

---

## Final Bounded Verification

Run exactly:

```bash
npm test -- tests/skills/navi-model-routing.test.ts tests/skills/navi-supervised-delivery.test.ts tests/skills/navi-skill.test.ts tests/skills/navi-supervision.test.ts tests/skills/navi-capability-truthfulness.test.ts tests/repository/current-surface.test.ts
npm run typecheck
npm run verify:plugin-package
diff -q .agents/skills/navi/references/model-routing-v1.md plugins/navi/skills/navi/references/model-routing-v1.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
git diff --check HEAD~3..HEAD
git rev-list --count HEAD~3..HEAD
git diff --name-only HEAD~3..HEAD
git status --short
```

Expected:

- all six focused test files pass;
- typecheck passes;
- plugin-package verification, manifest validation, and source/package drift
  checks pass;
- all three mirror comparisons print nothing;
- diff check prints nothing;
- commit count is exactly 3;
- implementation scope is exactly these 13 paths:

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/model-routing-v1.md
.agents/skills/navi/references/supervised-delivery-v1.md
docs/navi/design-history.md
docs/navi/product-debt.md
docs/navi/roadmap.md
plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/model-routing-v1.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
tests/repository/current-surface.test.ts
tests/skills/navi-model-routing.test.ts
tests/skills/navi-skill.test.ts
tests/skills/navi-supervised-delivery.test.ts
```

- `git status --short` shows only the pre-existing untracked `work/` directory.

Run the forbidden-scope audit:

```bash
git diff --exit-code HEAD~3..HEAD -- package.json package-lock.json plugins/navi/VERSION.md src scripts .agents/plugins .codex archive work
```

Expected: no diff.

Perform one fresh whole-candidate read-only review against the approved design
and this plan. Findings are ordered Critical, Important, then Minor. Resolve
Critical or Important findings only inside the exact 13-path scope and at most
two remediation rounds; otherwise return `decision-required`.

At review-ready, deliver one `NAVI_LANE_HANDOFF_EVENT V1` directly to the Main
Task with:

- exact baseline and reviewed snapshot;
- exactly three commit hashes and subjects;
- exact 13-path scope;
- RED/GREEN and final verification evidence;
- model-route application state for the Execution Task itself, reported
  truthfully as `applied` only if this plan was dispatched with explicit host
  model and thinking arguments;
- findings and residual risks; and
- no merge, push, tag, release, publication, Runtime, or calibration authority.

The Main Task then creates one fresh independent Level 2 read-only Validation
Task for the exact review-ready snapshot. Validation acceptance returns control
to the Main Task for the separate integration decision; it does not authorize
merge, push, release, or natural calibration.
