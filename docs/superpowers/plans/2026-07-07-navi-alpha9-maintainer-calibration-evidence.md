# Navi Alpha 9 Maintainer Calibration Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add maintainer-side calibration evidence docs so real Navi usage samples are recorded with categories and explicit product decisions without changing user-facing Navi behavior.

**Architecture:** Keep alpha.9 as docs-only product infrastructure. Create a dedicated `docs/along/calibration/` directory with a decision rubric and evidence log, migrate the most representative historical samples from the existing calibration/debt records into the new schema, and add targeted text assertions. Do not change skill behavior, `navi init`, runtime code, release docs, README, or target projects.

**Tech Stack:** Markdown documentation, Vitest text assertions, existing repository doc test patterns.

## Global Constraints

- Implementation must run in a true Codex worktree session, not in the main design session.
- This is a maintainer-side evidence layer, not an end-user feature.
- Do not change Navi prompt behavior, runtime behavior, `navi init`, target-project files, README files, release notes, GitHub Release bodies, package ids, skill ids, CLI aliases, `src/web`, npm publication, or marketplace publication.
- Do not delete or rewrite `docs/along/navi-calibration-log.md`; it is historical source material.
- Do not touch or stage untracked `work/`.
- Allowed validation: `npm test -- tests/skills/along-working-thread-skill.test.ts`, `git diff --check`.
- Do not run full test suite, typecheck, release checklist, tag, release, publish, or push.

---

## Navi-Specific Execution Boundary

Start the implementation worktree from current `main`, which includes:

```text
eb707a0 docs: add navi alpha 9 calibration evidence design
```

If that commit has not been pushed when the worktree is created, the worktree must start from the local working tree/current main state, not from `origin/main`.

The final worktree commit message should be:

```text
docs: add navi alpha 9 calibration evidence
```

## File Structure

Create these files:

- `docs/along/calibration/decision-rubric.md`
  - Defines what counts as evidence, what does not, categories, decision outcomes, interruption rules, non-goals, and review cadence.
- `docs/along/calibration/evidence-log.md`
  - Records the initial representative historical evidence set using the alpha.9 schema.

Modify this file:

- `tests/skills/along-working-thread-skill.test.ts`
  - Adds targeted assertions that the new maintainer calibration evidence docs exist and contain the required schema/rubric/initial samples.

Do not modify:

- `.agents/skills/**`
- `plugins/**`
- `src/cli/navi-init.ts`
- `docs/along/project-maps/**`
- `README.md`
- `README.zh-CN.md`
- `docs/releases/**`
- `src/web/**`
- external target projects
- untracked `work/`

Existing context:

- `docs/along/navi-calibration-log.md` already contains useful historical calibration records. Treat it as source material, not as the canonical alpha.9 file.
- `docs/along/navi-product-debt.md` and `docs/along/roadmaps/navi-post-alpha-roadmap.md` already mention calibration/evidence needs. Do not update them in this plan; keep alpha.9 focused on the new maintainer evidence docs.

---

### Task 1: Add Failing Tests For Alpha.9 Evidence Docs

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**

- Consumes: existing `readRepoText(path: string)` helper in `tests/skills/along-working-thread-skill.test.ts`.
- Produces: failing assertions for the new docs before they are created.

- [ ] **Step 1: Add the alpha.9 docs test**

In `tests/skills/along-working-thread-skill.test.ts`, insert this test inside `describe("Along Working Thread repo-contained plugin package", () => {` before the existing `"documents the current Navi-first public narrative in the root README"` test:

```ts
  it("documents alpha 9 maintainer calibration evidence", async () => {
    const rubric = await readRepoText("docs/along/calibration/decision-rubric.md");
    const evidenceLog = await readRepoText("docs/along/calibration/evidence-log.md");

    for (const expected of [
      "# Navi Maintainer Calibration Decision Rubric",
      "Maintainer-side only",
      "This is not an end-user feature",
      "What Counts As Evidence",
      "What Does Not Count As Evidence",
      "Success",
      "Friction",
      "Miss",
      "Overreach",
      "Boundary Confusion",
      "Product Signal",
      "Close",
      "Watch",
      "Roadmap",
      "Design",
      "Implement",
      "Defer",
      "Every evidence entry must end in a decision",
      "Do not let a single non-urgent evidence item interrupt the current design loop",
      "Evidence logging does not trigger full tests, typecheck, tag, release, npm publication, or marketplace work",
      "Do not add this log to `navi init`",
    ]) {
      expect(rubric).toContain(expected);
    }

    for (const expected of [
      "# Navi Maintainer Calibration Evidence Log",
      "Status: maintainer-side calibration evidence",
      "This log is not a release checklist",
      "Date",
      "Source",
      "Prompt / event",
      "Project shape",
      "Expected Navi behavior",
      "Actual behavior",
      "User / maintainer judgment",
      "Category",
      "Decision",
      "Follow-up",
      "English `what's next` produced a Chinese Navi map",
      "Repeated meaningless `continue` prompts",
      "Completed worktree raised whether the main session should wait",
      "External readers could confuse Navi with Along",
      "Validation and testing consumed too much workflow space",
      "Implemented in alpha.3",
      "alpha.5 pause semantics",
      "alpha.8 decision handoff quality",
      "alpha.7 coordination layer",
      "public narrative alignment",
      "alpha.6 Work Mode",
    ]) {
      expect(evidenceLog).toContain(expected);
    }
  });
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL. The first failure should be from missing `docs/along/calibration/decision-rubric.md` or `docs/along/calibration/evidence-log.md`.

Do not commit failing tests yet.

---

### Task 2: Create Decision Rubric

**Files:**

- Create: `docs/along/calibration/decision-rubric.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**

- Produces: the canonical maintainer-side classification and decision rules used by `evidence-log.md`.

- [ ] **Step 1: Create the calibration directory and rubric**

Create `docs/along/calibration/decision-rubric.md` with this exact content:

````markdown
# Navi Maintainer Calibration Decision Rubric

Status: maintainer-side alpha calibration rubric
Last updated: 2026-07-07

This rubric turns real or semi-real Navi usage samples into product decisions. It is for Navi maintainers and product designers during alpha development.

Maintainer-side only. This is not an end-user feature, not a target-project workflow, and not something ordinary Navi users need to fill in.

## Purpose

Use this rubric to decide what a real sample means for Navi:

- close it as a useful or irrelevant sample;
- watch for repeats;
- add it to the roadmap;
- start a design pass;
- approve a bounded implementation;
- defer it because it is outside the current alpha wedge.

Every evidence entry must end in a decision.

## What Counts As Evidence

Record a sample when it changes product judgment or could change a future decision.

Good evidence includes:

- real or semi-real target-project prompts;
- fresh-session behavior;
- external reader confusion;
- repeated user-control friction;
- trigger misses;
- language-following failures;
- over-structured or noisy Navi output;
- over-validation or release-mode leakage;
- boundary confusion around mode, lane, release, target project, or Navi/Along naming;
- maintainer observations that explain why a product decision changed.

## What Does Not Count As Evidence

Do not record ordinary workflow noise.

Avoid logging:

- every test result;
- every commit, push, or status update;
- ordinary implementation progress;
- chat transcripts without product judgment;
- one-off tool failures that do not change Navi behavior;
- feedback already captured in a clearer evidence entry;
- target-project private details that are not needed for the product decision.

## Categories

Choose one primary category for each evidence entry. Add secondary tags only when useful.

### Success

Navi behaved as intended and the sample can serve as a positive baseline.

Typical decision: Close, or keep as a calibration baseline.

### Friction

The user could complete the work, but Navi or Codex created unnecessary effort.

Examples:

- unnecessary `continue`;
- repeated confirmation without a real decision;
- unclear next step;
- valid stop with poor handoff;
- too much effort required to understand what Codex needs.

Typical decision: Watch for repeats, or Design if the pattern is already repeated.

### Miss

Navi should have triggered or used available evidence but did not.

Examples:

- language following failed;
- project records were ignored;
- wrong map type was chosen;
- a progress or next-step prompt received ordinary task advice only;
- source records existed but were not used.

Typical decision: Design, or Implement if the expected behavior is already specified.

### Overreach

Navi or Codex did too much.

Examples:

- over-structured output for a simple task;
- release-level verification in Design mode;
- Challenge Moment used as constant critique;
- implementation started from a design discussion;
- a default recommendation sounded like approval.

Typical decision: Design a tighter boundary, or Watch if isolated.

### Boundary Confusion

The product, mode, lane, release, target-project, or naming boundary became unclear.

Examples:

- lane-level waiting was treated as whole-session blocked;
- the user could not tell whether work was Design, Calibration, Implementation, or Release;
- Along and Navi relationship confused external readers;
- `along-working-thread` internal naming confused the public product surface.

Typical decision: Design, docs correction, or Implement if the rule is already approved.

### Product Signal

The sample is not necessarily a bug, but it points to a possible future direction.

Examples:

- project-local evidence log;
- runtime UI;
- installer workflow;
- adapter support;
- stronger execution contract;
- public distribution or trust signal.

Typical decision: Roadmap or Defer unless it blocks the current product wedge.

## Decision Outcomes

Each entry must choose one outcome:

- Close: no further action.
- Watch: keep for repeat evidence.
- Roadmap: record as future direction.
- Design: start or propose a design pass.
- Implement: proceed only when the behavior is already specified and implementation is explicitly approved.
- Defer: valid signal, but not useful for the current alpha wedge.

## Interruption Rules

Do not let a single non-urgent evidence item interrupt the current design loop.

Evidence may interrupt current work only when it reveals:

- a publishing or release error;
- a safety or data-loss risk;
- a misleading public claim;
- a product premise that invalidates the current design;
- repeated user-control friction that blocks the current task.

Otherwise, record the sample and continue to the next real decision point.

## Release And Validation Boundary

Evidence logging does not trigger full tests, typecheck, tag, release, npm publication, or marketplace work.

For docs-only evidence updates, the default validation is:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
git diff --check
```

Use Release mode only when the user explicitly asks to prepare a version, tag, release, or external publication.

## Target-Project Boundary

Do not add this log to `navi init`.

Do not create target-project evidence logs by default. A future design may explore optional project-local evidence if maintainer-side evidence shows ordinary users benefit from it.
````

- [ ] **Step 2: Run the targeted test and confirm the rubric strings pass**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL only because `docs/along/calibration/evidence-log.md` is still missing or incomplete.

---

### Task 3: Create Evidence Log With Initial Representative Samples

**Files:**

- Create: `docs/along/calibration/evidence-log.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

**Interfaces:**

- Consumes: category and decision vocabulary from `decision-rubric.md`.
- Produces: maintainer-side evidence examples in the alpha.9 schema.

- [ ] **Step 1: Create the evidence log**

Create `docs/along/calibration/evidence-log.md` with this exact content:

````markdown
# Navi Maintainer Calibration Evidence Log

Status: maintainer-side calibration evidence
Last updated: 2026-07-07

This log records real or semi-real Navi usage samples that change product judgment. This log is not a release checklist, not a test report, and not proof of full product correctness.

Use `docs/along/calibration/decision-rubric.md` to classify entries. Every entry must end in a product decision.

## Entry Template

```markdown
## YYYY-MM-DD - Short evidence title

- Date:
- Source:
- Prompt / event:
- Project shape:
- Expected Navi behavior:
- Actual behavior:
- User / maintainer judgment:
- Category:
- Decision:
- Follow-up:
```

## 2026-07-01 - English `what's next` produced a Chinese Navi map

- Date: 2026-07-01
- Source: Maintainer screenshot and fresh-session observation.
- Prompt / event: The user asked `what's next` in English, but Navi returned a Chinese project rhythm/map because the saved project evidence was Chinese.
- Project shape: Long-running application/advising flow with Chinese project records.
- Expected Navi behavior: Navi should follow the user's current prompt language for headings, explanation, recommended next step, confirmation gate, and risk wording while translating or bilingualizing saved labels when needed.
- Actual behavior: The map headings and explanation stayed Chinese.
- User / maintainer judgment: This was a real language-following miss. Project record language should be source evidence, not the answer-language controller.
- Category: Miss.
- Decision: Implemented.
- Follow-up: Implemented in alpha.3 language-following fix; see `44b301c docs: make navi maps follow prompt language` and release `v0.1.0-alpha.3`.

## 2026-07-02 - Repeated meaningless `continue` prompts

- Date: 2026-07-02
- Source: Main Navi maintainer session.
- Prompt / event: The user repeatedly had to type `continue` or `继续` after local sub-steps even though the broader approved loop had not reached a real decision point.
- Project shape: Navi product design and implementation supervision.
- Expected Navi behavior: Codex should continue inside an already-approved boundary and stop only at a real user decision such as write approval, commit, push, release, mode change, scope expansion, validation-budget escalation, or risk acceptance.
- Actual behavior: Several responses stopped after local completion reports or small documentation/checking steps, leaving the user to say `continue`.
- User / maintainer judgment: This was avoidable continuation friction. The user adaptation was not the product goal; Navi should reduce opaque stopping.
- Category: Friction.
- Decision: Implemented.
- Follow-up: Addressed through alpha.5 pause semantics and alpha.8 decision handoff quality.

## 2026-07-02 - Completed worktree raised whether the main session should wait

- Date: 2026-07-02
- Source: Main Navi maintainer session during alpha.5 worktree supervision.
- Prompt / event: After a true worktree session had been created, the main session described itself as stopped at a waiting point until the worktree completed.
- Project shape: Multi-lane Navi development with main session design/supervision and implementation worktree execution.
- Expected Navi behavior: Navi should distinguish lane-level waiting from whole-session blocked. Review/merge may wait for a worktree, but the main session can continue non-conflicting design, supervision, acceptance criteria, roadmap, or risk work.
- Actual behavior: The wording collapsed a review/merge wait into a whole-session wait.
- User / maintainer judgment: This exposed a coordination boundary problem rather than an implementation bug.
- Category: Boundary Confusion.
- Decision: Implemented.
- Follow-up: Addressed through alpha.7 coordination layer.

## 2026-07-03 - External readers could confuse Navi with Along

- Date: 2026-07-03
- Source: External-reader review and public narrative design.
- Prompt / event: The repository still contained public-facing Along and `along-working-thread` names near Navi installation and product explanation.
- Project shape: GitHub source alpha and public README/release narrative.
- Expected Navi behavior: A new reader should understand Navi as an independent product surface without first understanding Along. Along should be origin or parent/lab context, and `along-working-thread` should be explained as legacy/internal naming.
- Actual behavior: The relationship could still be confusing for new readers.
- User / maintainer judgment: This was boundary confusion in public narrative, not a runtime behavior issue.
- Category: Boundary Confusion.
- Decision: Implemented.
- Follow-up: Public narrative alignment implemented in `b72a7cb docs: align navi public narrative`.

## 2026-07-03 - Validation and testing consumed too much workflow space

- Date: 2026-07-03
- Source: Maintainer feedback during Navi planning.
- Prompt / event: The user observed that Codex often spent much more time testing and verifying than designing, and asked whether that was normal or a workflow problem.
- Project shape: Navi alpha product development and release-adjacent work.
- Expected Navi behavior: Validation strength should match Work Mode. Design should not be blocked by release-grade tests; Implementation should use targeted tests; Release is the place for full checklists.
- Actual behavior: Release-level habits could leak into design and ordinary implementation loops.
- User / maintainer judgment: This was overreach and validation-budget confusion. More tests are not automatically better when the task is product judgment.
- Category: Overreach.
- Decision: Implemented.
- Follow-up: Addressed through alpha.6 Work Mode and release-mode boundary.
````

- [ ] **Step 2: Run the targeted test and confirm alpha.9 docs pass**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for the alpha.9 assertions.

---

### Task 4: Final Verification And Commit

**Files:**

- Verify all modified/created files from Tasks 1-3.

**Interfaces:**

- Produces: one local worktree commit ready for main-session review/merge.

- [ ] **Step 1: Run targeted test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run whitespace check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 3: Inspect changed files**

Run:

```bash
git status --short
git diff --stat
git diff --name-only
```

Expected tracked changed files:

```text
docs/along/calibration/decision-rubric.md
docs/along/calibration/evidence-log.md
tests/skills/along-working-thread-skill.test.ts
```

The untracked `work/` directory may exist. Do not stage it.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/along/calibration/decision-rubric.md \
  docs/along/calibration/evidence-log.md \
  tests/skills/along-working-thread-skill.test.ts
git commit -m "docs: add navi alpha 9 calibration evidence"
```

Expected: one commit with only the approved files staged.

- [ ] **Step 5: Return implementation handoff**

Final response must include:

- commit hash;
- changed files summary;
- validation commands and pass/fail;
- any deviations from this plan;
- residual risk;
- whether review/merge is ready.

Do not push, tag, release, clean up the Codex-managed worktree, or modify `docs/along/navi-calibration-log.md`.
