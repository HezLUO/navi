# Navi Bounded Dependency Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one explicitly approved, single-attempt `npm ci` dependency restore to bounded Navi Execution Contracts without creating permanent permission state, a package-manager CLI, or Validation Task write authority.

**Architecture:** Extend the existing `supervised-delivery-v1.md` owner with an additive Dependency Restore Extension. The Execution Task verifies an exact trusted baseline and lockfile, performs one host-mediated project-local restore, audits the result, and either continues quietly or emits a direct `decision-required` Lane Handoff event. Canonical skill files remain byte-identical to the packaged plugin mirror, and active documentation records implementation separately from the later natural calibration result.

**Tech Stack:** Markdown skill contracts, TypeScript/Vitest static contract tests, existing Navi canonical/package mirror verifier, Git worktree isolation.

## Global Constraints

- Implement only the approved design in `docs/superpowers/specs/2026-07-18-navi-bounded-dependency-restore-design.md`.
- V1 supports only the exact project-local command `npm ci` with an existing `package-lock.json` and naturally absent `node_modules`.
- The Execution Contract approval is task-local, baseline-specific, lockfile-specific, and valid for one install attempt only.
- Normal lifecycle scripts are allowed only because the user approved the trusted exact baseline; never describe them as risk-free.
- Codex host sandbox and network permissions remain authoritative and may still require a host tool approval.
- A failed preflight, denied host permission, failed command, or post-install drift routes `decision-required`; do not redefine Lane Handoff's formal `blocked` state.
- Do not retry automatically, use `npm install`, mutate package metadata, run audit fixes, change registry or credentials, or clean/revert unexpected effects.
- Validation Tasks remain read-only and never inherit dependency restore authority.
- Do not add pnpm, Yarn, Bun, Python, conda, CLI, runtime, database, queue, daemon, persistent project policy, release, publication, or external-project scope.
- Do not edit `package.json`, `package-lock.json`, `plugins/navi/VERSION.md`, `archive/along`, `src/`, or `work/`.
- Use targeted tests, `npm run verify:plugin-package`, mirror checks, and `git diff --check`; do not run full `npm test` unless targeted evidence exposes a broader regression.
- The implementation candidate must use one true Codex worktree Execution Task and one true read-only Validation Task. The Main Thread owns final integration, push, release, and Product Complete judgment.
- Route the Execution Task as `strong + high` and the independent Level 3 Validation Task as `strong + high`; permission-bearing dependency installation and acceptance both require the strong floor.
- On the current local Codex host, use the already probed and accepted `gpt-5.6-sol + high` combination for both Tasks. On another destination host, apply it only after that host accepts the exact combination; if it rejects the route, report `recommended-not-applied` and return `decision-required` before using the compatible `gpt-5.5 + high` fallback. Never claim that an unaccepted route was applied or silently fall below the strong floor.
- Count the journey as the remaining joint natural Product Complete sample only if direct event return, route application, bounded remediation, zero user relay, zero meaningless `continue`, and final accepted integration all succeed.

## Main-Thread Pre-Dispatch Gate

The current Main checkout contains an unrelated user modification to
`docs/navi/calibration-log.md` and untracked `work/`. Before creating the
Execution Task:

1. obtain a separate explicit decision for the existing tracked calibration-log change;
2. ensure the chosen immutable baseline contains the user's accepted calibration-log content, because Task 3 updates that same file;
3. leave `work/` untracked and outside every plan, commit, worktree, and audit scope;
4. compute the exact baseline with `git rev-parse HEAD`;
5. compute the lockfile digest with `shasum -a 256 package-lock.json`; and
6. put those exact outputs into the Execution Contract's `trusted_baseline` and `lockfile_digest` fields.

Do not create the Execution Task from a dirty working-tree snapshot and do not
silently include the current user changes in an implementation commit.

---

### Task 1: Define The Dependency Restore Contract And Eligibility

**Files:**
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Test: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: the existing `Execution Contract` and additive-extension pattern used by `Model Routing Extension`.
- Produces: one `Dependency Restore Extension` schema plus exact eligibility and preflight rules consumed by Task 2.

- [ ] **Step 1: Add failing contract-schema coverage**

Add these tests after the existing execution-contract test in
`tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("defines one additive dependency restore extension", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const extension = extractSection(reference, "## Dependency Restore Extension");

  for (const field of [
    "dependency_restore:",
    "preauthorized: true",
    "package_manager: npm",
    "command: npm ci",
    "trusted_baseline: exact commit SHA",
    "lockfile: package-lock.json",
    "lockfile_digest: SHA-256",
    "expected_state: node_modules absent",
    "lifecycle_scripts: allowed",
    "network: host-mediated",
    "allowed_install_write: node_modules",
    "immutable_files:",
    "- package.json",
    "- package-lock.json",
    "post_install_audit: required",
  ]) {
    expect(extension).toContain(field);
  }
  expect(extension).toMatch(/optional[\s\S]*additive/i);
  expect(extension).toMatch(/every field[\s\S]*required/i);
  expect(extension).toMatch(/one Execution Task[\s\S]*one install attempt/i);
  expect(extension).toMatch(/does not survive[\s\S]*new task[\s\S]*changed baseline/i);
});

it("limits dependency restore to an exact trusted npm ci preflight", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const preflight = extractSection(reference, "## Dependency Restore Preflight");

  expect(preflight).toMatch(/HEAD[\s\S]*trusted_baseline/i);
  expect(preflight).toMatch(/clean worktree/i);
  expect(preflight).toMatch(/lockfile[\s\S]*digest/i);
  expect(preflight).toMatch(/node_modules[\s\S]*absent/i);
  expect(preflight).toMatch(/exact command[\s\S]*`npm ci`/i);
  expect(preflight).toMatch(/no `sudo`[\s\S]*`-g`[\s\S]*global npm/i);
  expect(preflight).toMatch(/private registry[\s\S]*credential[\s\S]*dependency edit/i);
  expect(preflight).toMatch(/existing[\s\S]*node_modules[\s\S]*not an eligible restore/i);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because `## Dependency Restore Extension` and
`## Dependency Restore Preflight` are absent.

- [ ] **Step 3: Add the canonical contract and preflight sections**

Insert after `## Execution Contract` and before `## Model Routing Extension`
in `.agents/skills/navi/references/supervised-delivery-v1.md`:

```markdown
## Dependency Restore Extension

Dependency restore is an optional additive part of the approved Execution
Contract. It records exactly:

dependency_restore:
  preauthorized: true
  package_manager: npm
  command: npm ci
  trusted_baseline: exact commit SHA
  lockfile: package-lock.json
  lockfile_digest: SHA-256
  expected_state: node_modules absent
  lifecycle_scripts: allowed
  network: host-mediated
  allowed_install_write: node_modules
  immutable_files:
    - package.json
    - package-lock.json
  post_install_audit: required

Every field is required. Missing, additional, ambiguous, or conflicting values
make the preauthorization unavailable. The approval applies to one Execution
Task, the exact baseline and lockfile digest, and one install attempt. It does
not survive a new task, changed baseline, changed lockfile, or later plan.

This extension does not grant persistent project permission, Validation Task
write authority, another package manager, package changes, global npm changes,
credential changes, merge, push, release, or publication authority.

## Dependency Restore Preflight

Before running the restore, the Execution Task confirms that HEAD equals
`trusted_baseline`, the worktree is clean, `package.json` and
`package-lock.json` exist, the lockfile digest matches, `node_modules` is
absent, and the exact command is `npm ci` with no unapproved flags.

The install must be project-local. It uses no `sudo`, `-g`, global npm
configuration, private registry change, credential change, dependency edit,
or lockfile regeneration. The contract must explicitly allow lifecycle scripts
and host-mediated network access.

An existing or suspected-broken `node_modules` tree is not an eligible restore.
Do not reinterpret it as absent, delete it, switch commands, or widen the
contract when preflight fails.
```

- [ ] **Step 4: Copy the canonical owner to the package mirror**

Run:

```bash
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

- [ ] **Step 5: Run the focused GREEN check and mirror check**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: all tests PASS and `diff -q` prints nothing.

- [ ] **Step 6: Review and commit Task 1**

Review the exact three-file diff, confirm no existing execution, validation,
model-routing, or remediation semantics were removed, then run:

```bash
git add .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: define navi dependency restore contract"
```

---

### Task 2: Route Restore Execution, Audit, Failures, And Quiet Success

**Files:**
- Modify: `.agents/skills/navi/SKILL.md`
- Modify: `.agents/skills/navi/references/supervised-delivery-v1.md`
- Modify: `plugins/navi/skills/navi/SKILL.md`
- Modify: `plugins/navi/skills/navi/references/supervised-delivery-v1.md`
- Test: `tests/skills/navi-supervised-delivery.test.ts`

**Interfaces:**
- Consumes: `Dependency Restore Extension` and `Dependency Restore Preflight` from Task 1; existing `NAVI_LANE_HANDOFF_EVENT V1` `decision-required` routing.
- Produces: one execution/audit lifecycle, role boundary, quiet-success rule, and failure routing that Task 3 documents as active behavior.

- [ ] **Step 1: Add failing lifecycle and role-boundary coverage**

Append these tests in `tests/skills/navi-supervised-delivery.test.ts`:

```ts
it("runs one host-mediated restore and audits the result", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const lifecycle = extractSection(reference, "## Dependency Restore Lifecycle");

  expect(lifecycle).toMatch(/run `npm ci` once/i);
  expect(lifecycle).toMatch(/lifecycle scripts[\s\S]*not risk-free/i);
  expect(lifecycle).toMatch(/host[\s\S]*network or sandbox[\s\S]*authoritative/i);
  expect(lifecycle).toMatch(/package\.json[\s\S]*package-lock\.json[\s\S]*byte-identical/i);
  expect(lifecycle).toMatch(/no tracked file changed/i);
  expect(lifecycle).toMatch(/no untracked path[\s\S]*outside[\s\S]*node_modules/i);
  expect(lifecycle).toMatch(/continue[\s\S]*approved implementation plan[\s\S]*without[\s\S]*continue/i);
});

it("routes every restore failure without redefining blocked", async () => {
  const reference = await readRepoText(
    ".agents/skills/navi/references/supervised-delivery-v1.md",
  );
  const failure = extractSection(reference, "## Dependency Restore Failure Routing");

  for (const cause of [
    "preflight mismatch",
    "host permission",
    "nonzero",
    "post-install drift",
  ]) {
    expect(failure.toLowerCase()).toContain(cause);
  }
  expect(failure).toMatch(/decision-required/i);
  expect(failure).toMatch(/one preauthorized attempt[\s\S]*exhausted/i);
  expect(failure).toMatch(/do not[\s\S]*retry[\s\S]*`npm install`/i);
  expect(failure).toMatch(/do not[\s\S]*commit[\s\S]*auto-revert[\s\S]*clean/i);
  expect(failure).toMatch(/formal `blocked`[\s\S]*existing[\s\S]*lifecycle rule/i);
});

it("keeps dependency restore execution-only and quiet", async () => {
  const [skill, reference] = await Promise.all([
    readRepoText(".agents/skills/navi/SKILL.md"),
    readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
  ]);
  const roles = extractSection(reference, "## Dependency Restore Role Boundaries");
  const quietness = extractSection(reference, "## Dependency Restore Quietness");

  expect(skill).toMatch(/dependency restore[\s\S]*supervised-delivery-v1\.md/i);
  expect(skill).toMatch(/must not[\s\S]*permanent[\s\S]*dependency-install permission/i);
  expect(roles).toMatch(/Execution Task alone/i);
  expect(roles).toMatch(/Validation Task[\s\S]*read-only[\s\S]*must not install/i);
  expect(quietness).toMatch(/successful path[\s\S]*quiet/i);
  expect(quietness).toMatch(/do not[\s\S]*dependency restore complete[\s\S]*continue/i);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
```

Expected: FAIL because the lifecycle, failure-routing, role-boundary, and
quietness sections are absent.

- [ ] **Step 3: Add execution, audit, failure, role, and quietness sections**

Add the following sections after `## Dependency Restore Preflight` in the
canonical `supervised-delivery-v1.md`:

```markdown
## Dependency Restore Lifecycle

After preflight passes, run `npm ci` once. Normal lifecycle scripts are allowed
because the exact baseline was explicitly trusted, but they are not risk-free.
Codex host network or sandbox permission remains authoritative. If the host
asks, request that tool permission directly; approval resumes the same command
and does not create a second Navi product decision.

After a zero exit, prove `package.json` and `package-lock.json` remain
byte-identical, the lockfile digest is unchanged, no tracked file changed, and
no untracked path appeared outside the allowed project-local `node_modules`.
Record the command, baseline, digest, exit status, and audit result as lane
evidence. Then continue the approved implementation plan without asking the
user for another `continue`.

## Dependency Restore Failure Routing

- A preflight mismatch does not run the command and emits `decision-required`
  with the changed premise.
- A denied or unavailable host permission emits `decision-required` for the
  concrete authorization, environment-change, or lane-closure decision.
- A nonzero command exhausts the one preauthorized attempt and emits
  `decision-required` with its exit status and credential-safe summary.
- Post-install drift stops implementation and emits `decision-required` with
  the exact changed-path summary.

Do not retry automatically or use `npm install`. Do not regenerate the
lockfile, run an audit fix, commit, auto-revert, or clean unexpected effects. Dependency restore
does not redefine formal `blocked`; use it only when the existing host goal
lifecycle rule is independently satisfied.

## Dependency Restore Role Boundaries

The Main Thread decides whether the repository and exact baseline are trusted
and includes the extension in the approved Execution Contract. The Execution
Task alone performs preflight, the one install attempt, audit, evidence, and
direct failure handoff.

The Validation Task remains read-only and must not install dependencies or
inherit dependency restore authority. It reviews the contract, exact snapshot,
executor-reported planned-test evidence, and available static evidence.

## Dependency Restore Quietness

The successful path is quiet. Do not add a status table, repeat lifecycle
warnings, or stop with "dependency restore complete; continue?" Surface only
the initial contract approval, a real host permission, changed premise,
command failure, unexpected effect, or acceptance-relevant final evidence.
```

- [ ] **Step 4: Activate the owner through the canonical skill**

In `.agents/skills/navi/SKILL.md`:

1. extend the existing `supervised-delivery-v1.md` Required References bullet
   so it also names bounded dependency restore; and
2. add this hard boundary near the existing Supervised Delivery boundaries:

```markdown
- Navi must not turn one Execution Contract's dependency restore approval into permanent project permission, let a Validation Task install dependencies, or ask for another product approval after an eligible restore succeeds.
```

Do not copy the detailed schema into `SKILL.md`.

- [ ] **Step 5: Copy both canonical owners to the package mirrors**

Run:

```bash
cp .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
cp .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

- [ ] **Step 6: Run focused GREEN and mirror checks**

Run:

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
```

Expected: all tests PASS and both `diff -q` commands print nothing.

- [ ] **Step 7: Review and commit Task 2**

Confirm the diff does not change Lane Handoff's event schema, formal blocked
definition, validator write boundary, model routing, or remediation cap. Then:

```bash
git add .agents/skills/navi/SKILL.md .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/SKILL.md plugins/navi/skills/navi/references/supervised-delivery-v1.md tests/skills/navi-supervised-delivery.test.ts
git commit -m "feat: route navi dependency restore"
```

---

### Task 3: Record Active Authority Without Claiming Calibration Success

**Files:**
- Modify: `docs/navi/design-history.md`
- Modify: `docs/navi/calibration-log.md`
- Test: `tests/repository/current-surface.test.ts`

**Interfaces:**
- Consumes: the complete canonical behavior from Tasks 1-2 and the approved design/plan paths.
- Produces: current-source authority and truthful calibration status; no public release or Product Complete claim.

- [ ] **Step 1: Add failing current-surface coverage**

Append this test in `tests/repository/current-surface.test.ts`:

```ts
it("records bounded dependency restore as active but uncalibrated", async () => {
  const [history, calibration] = await Promise.all([
    fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
  ]);
  const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
  const dependencyRecord = calibration.match(
    /## 2026-07-16 - Bounded Project-Local `npm ci` Preauthorization\n(?<entry>[\s\S]*?)(?=\n## |$)/,
  )?.groups?.entry ?? "";

  expect(active).toContain(
    "`docs/superpowers/specs/2026-07-18-navi-bounded-dependency-restore-design.md`",
  );
  expect(active).toContain(
    "`docs/superpowers/plans/2026-07-18-navi-bounded-dependency-restore.md`",
  );
  expect(dependencyRecord).toMatch(
    /implemented in current source[\s\S]*natural calibration pending/i,
  );
  expect(dependencyRecord).not.toMatch(/Product Complete[^\n]*closed/i);
});
```

- [ ] **Step 2: Run the focused RED check**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
```

Expected: FAIL because the design/plan are not indexed as Active and the
calibration entry still says the rule is not incorporated.

- [ ] **Step 3: Index the active design and plan**

Add these entries at the top of the `## Active` list in
`docs/navi/design-history.md`:

```markdown
- `docs/superpowers/specs/2026-07-18-navi-bounded-dependency-restore-design.md`
- `docs/superpowers/plans/2026-07-18-navi-bounded-dependency-restore.md`
```

Do not change the Product Complete gate or claim natural calibration passed.

- [ ] **Step 4: Update only the existing dependency-restore calibration entry**

In `docs/navi/calibration-log.md`, change that entry's status to:

```text
Status: implemented in current source; natural calibration pending
```

Replace its Product follow-up list with:

```markdown
Product follow-up:

- Use the active Supervised Delivery dependency-restore extension only when
  every exact contract and preflight condition is present.
- Keep Codex host permissions authoritative and preserve direct
  `decision-required` routing for failed premises, failed commands, or drift.
- Do not claim the remaining joint natural Product Complete sample passed until
  one accepted and integrated implementation journey satisfies every recorded
  calibration criterion.
```

Preserve every unrelated calibration entry byte-for-byte.

- [ ] **Step 5: Run Task 3 GREEN checks**

Run:

```bash
npm test -- tests/repository/current-surface.test.ts
git diff --check
```

Expected: all tests PASS and diff check prints nothing.

- [ ] **Step 6: Review and commit Task 3**

Confirm only the approved historical index, one existing calibration entry,
and its focused test changed. Then:

```bash
git add docs/navi/design-history.md docs/navi/calibration-log.md tests/repository/current-surface.test.ts
git commit -m "docs: activate navi dependency restore"
```

---

## Final Bounded Verification

- [ ] **Step 1: Run the exact focused acceptance suite**

```bash
npm test -- tests/skills/navi-supervised-delivery.test.ts tests/repository/current-surface.test.ts
```

Expected: both files PASS with no skipped or failed test.

- [ ] **Step 2: Verify the packaged plugin mirror**

```bash
npm run verify:plugin-package
```

Expected: focused skill tests, manifest validation, and source/package drift
verification all PASS.

- [ ] **Step 3: Run exact mirror and diff checks**

```bash
diff -q .agents/skills/navi/SKILL.md plugins/navi/skills/navi/SKILL.md
diff -q .agents/skills/navi/references/supervised-delivery-v1.md plugins/navi/skills/navi/references/supervised-delivery-v1.md
git diff --check
```

Expected: no output from mirror or diff checks.

- [ ] **Step 4: Audit commit and path scope**

Confirm the candidate has exactly the three planned commits and that its parent
before those commits equals the Execution Contract baseline:

```bash
git rev-parse HEAD~3
git rev-list --count HEAD~3..HEAD
git diff --name-only HEAD~3..HEAD
```

Expected: the first command equals `trusted_baseline`, the second prints `3`,
and the final command prints exactly these eight paths:

```text
.agents/skills/navi/SKILL.md
.agents/skills/navi/references/supervised-delivery-v1.md
docs/navi/calibration-log.md
docs/navi/design-history.md
plugins/navi/skills/navi/SKILL.md
plugins/navi/skills/navi/references/supervised-delivery-v1.md
tests/repository/current-surface.test.ts
tests/skills/navi-supervised-delivery.test.ts
```

- [ ] **Step 5: Audit forbidden scope and clean state**

Run:

```bash
git diff --name-only HEAD~3..HEAD -- package.json package-lock.json plugins/navi/VERSION.md archive/along src work
git status --short --branch
```

Expected: the forbidden-scope command prints nothing and the worktree is clean
at a detached HEAD.

- [ ] **Step 6: Perform one fresh whole-candidate read-only review**

Review the complete baseline-to-HEAD diff against the approved design and this
plan. Reject the candidate for any Critical or Important issue involving:

- persistent or project-wide permission;
- package-manager scope beyond exact `npm ci`;
- bypassed host permission;
- automatic retry, fallback, cleanup, or metadata mutation;
- Validation Task writes;
- changed Lane Handoff blocked semantics;
- duplicated detailed ownership;
- unsupported Product Complete or release claims; or
- path, commit, mirror, or verification-budget drift.

- [ ] **Step 7: Emit one direct review-ready event**

The Execution Task sends a conformant bare `NAVI_LANE_HANDOFF_EVENT V1` with
the exact baseline, reviewed snapshot, three commits, eight changed paths,
dependency-restore evidence, route application evidence, verification results,
and residual risks directly to the Main Thread. Do not ask the user to relay it
and do not request generic continuation.

## Independent Validation Contract

After source-side scope and snapshot audit, the Main Thread creates one true
Level 3 read-only Validation Task for the exact review-ready event and snapshot:

- resolve and apply the current-host-confirmed `gpt-5.6-sol + high`
  independently from the Execution route, using the visible fallback rule in
  Global Constraints only if the destination host rejects that exact route;
- provide the approved Execution Contract, design, plan, exact snapshot,
  changed scope, and executor evidence;
- do not install dependencies or write the validator worktree;
- inspect detailed-owner uniqueness, exact schema, refusal/failure semantics,
  quiet success, Validation read-only boundaries, docs truthfulness, mirrors,
  and scope;
- return one direct `NAVI_VALIDATION_RESULT V1` to the Main Thread;
- route only in-scope remediation to the same Execution Task and reuse this
  same Validation Task for at most two focused re-reviews.

Acceptance remains a Main Thread and user decision. No result authorizes
cherry-pick, push, tag, release, publication, or Product Complete closure.
