# Along Challenge Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Challenge Layer behavior in the existing Along Working Thread skill/plugin package without adding runtime, UI, adapters, or execution capabilities.

**Architecture:** This is a documentation-driven behavior implementation. The canonical behavior lives in `.agents/skills/along-working-thread/SKILL.md` and `.agents/skills/along-working-thread/references/working-thread-v1.md`; the repo-contained plugin copy under `plugins/along-working-thread/skills/along-working-thread/` must remain byte-for-byte synchronized. Vitest tests lock the intended product behavior and package metadata.

**Tech Stack:** Markdown skill/reference docs, Codex plugin package metadata, Vitest, TypeScript, existing `npm run verify:plugin-package`.

---

## Scope And Boundaries

Implement only the approved Challenge Layer V1:

- Challenge Moment concept;
- Challenge Brief default presentation;
- anti-self-certification priority;
- direction drift, pre-implementation, and over-fast validation triggers;
- outcomes: accept, refine, dismiss for now, turn into validation;
- lightweight validation actions: fresh-session check, read-only review, user calibration;
- primary demo loop: challenge after completion.

Do not add:

- runtime, watcher, scheduler, notifications, desktop or web UI;
- new MCP tools/resources/prompts/transports;
- Hermes or Claude Code adapter;
- Memory v2;
- relationship modes or emotional simulation;
- write delegation or automatic implementation;
- package dependency changes;
- `.along/` state.

## Preflight

- [ ] **Step 1: Start from main and inspect status**

Run:

```bash
cd "/Users/james/Codex Project/General Codex Project/Along"
git status --short --branch
```

Expected: the branch line shows `main` ahead of `origin/main`; the only expected untracked path in the main checkout is `.superpowers/`.

If additional tracked changes exist, inspect them and do not overwrite them.

- [ ] **Step 2: Create an isolated worktree**

Run:

```bash
cd "/Users/james/Codex Project/General Codex Project/Along"
git worktree add -b along-challenge-layer "../Along-worktrees/along-challenge-layer" main
cd "../Along-worktrees/along-challenge-layer"
```

Expected: Git creates the worktree and reports the new branch checkout.

- [ ] **Step 3: Install project-local dependencies if missing**

Run:

```bash
test -d node_modules || npm ci
```

Expected:

```text
npm ci completes successfully and creates node_modules/
```

If `node_modules` already exists, the command exits without changing dependencies.

## File Structure

Modify these canonical behavior files:

- `.agents/skills/along-working-thread/SKILL.md`
  - Add Challenge Layer terminology and high-level behavior rules.
- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Add detailed Challenge Moment, Challenge Brief, trigger, outcome, and validation rules.

Modify these package files:

- `plugins/along-working-thread/.codex-plugin/plugin.json`
  - Update package description/interface text to mention Challenge Layer while keeping version `0.1.0`.
- `plugins/along-working-thread/README.md`
  - Add user-facing Challenge Layer positioning and validation checklist.
- `plugins/along-working-thread/VERSION.md`
  - Record that this pass tightens `0.1.0` behavior and does not add runtime capability.
- `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
  - Exact synchronized copy of the canonical skill.
- `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
  - Exact synchronized copy of the canonical reference.

Modify tests:

- `tests/skills/along-working-thread-skill.test.ts`
  - Add expectations for Challenge Moment, Challenge Brief, validation outcomes, package metadata, and boundaries.

Modify durable records:

- `docs/superpowers/notes/2026-06-25-existing-agent-self-initiation-product-pass.md`
  - Record implementation status and validation evidence after completion.

## Task 1: Lock Challenge Layer Behavior With Tests

**Files:**

- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Add a failing test for Challenge Layer behavior docs**

Insert this test after the existing `documents tightened drift behavior and bounded write-back rules` test:

```ts
  it("documents Challenge Layer behavior and lightweight validation", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "Challenge Layer",
      "Challenge Moment",
      "Challenge Brief",
      "anti-self-certification",
      "turn into validation",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "challenge after completion",
      "direction switches",
      "pre-implementation transitions",
      "over-fast validation conclusions",
      "fresh-session check",
      "read-only review",
      "user calibration",
      "Accept Challenge",
      "Refine Challenge",
      "Dismiss For Now",
      "Turn Into Validation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("Do not turn Challenge Moments into constant critique.");
    expect(reference).toContain("Do not treat implementation success as product proof.");
    expect(reference).toContain("Do not use Challenge Briefs to start implementation by default.");
  });
```

- [ ] **Step 2: Add a failing test for package positioning and metadata**

Insert this test inside `describe("Along Working Thread repo-contained plugin package", () => {` after the manifest layout test:

```ts
  it("positions the package as a Challenge Layer without expanding runtime scope", async () => {
    const manifest = JSON.parse(
      await readRepoText("plugins/along-working-thread/.codex-plugin/plugin.json"),
    ) as {
      version: string;
      description: string;
      keywords: string[];
      interface: {
        shortDescription: string;
        longDescription: string;
        defaultPrompt: string[];
      };
    };
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const version = await readRepoText("plugins/along-working-thread/VERSION.md");

    expect(manifest.version).toBe("0.1.0");
    expect(manifest.description).toContain("Challenge Layer");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["challenge-layer", "validation"]));
    expect(manifest.interface.shortDescription).toContain("Challenge Layer");
    expect(manifest.interface.longDescription).toContain("Challenge Moment");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.defaultPrompt).toEqual(
      expect.arrayContaining([
        "Check whether this is a self-certification moment.",
        "Turn this challenge into a lightweight validation.",
      ]),
    );

    expect(readme).toContain("## Challenge Layer");
    expect(readme).toContain("Challenge Moment");
    expect(readme).toContain("Challenge Brief");
    expect(readme).toContain("anti-self-certification");
    expect(readme).toContain("Challenge after completion");
    expect(readme).toContain("fresh-session check");
    expect(readme).toContain("read-only review");
    expect(readme).toContain("user calibration");
    expect(readme).toContain("It does not make implementation success equal product proof.");

    expect(version).toContain("Challenge Layer");
    expect(version).toContain("0.1.0");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });
```

- [ ] **Step 3: Run the targeted test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because Challenge Layer strings are not yet present in the skill/reference/package files.

- [ ] **Step 4: Commit the failing tests**

Run:

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover challenge layer behavior"
```

## Task 2: Add Challenge Layer Rules To The Canonical Skill

**Files:**

- Modify: `.agents/skills/along-working-thread/SKILL.md`

- [ ] **Step 1: Update the skill description frontmatter**

Replace the existing `description:` value with this single quoted string:

```yaml
description: 'Use in the Along project when Codex should preserve judgment-oriented Working Thread continuity across active sessions: resume relevant threads, suggest thread creation, challenge high-impact drift, produce Challenge Briefs for Challenge Moments, or draft wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation work that does not involve Working Thread continuity.'
```

- [ ] **Step 2: Update the opening behavior summary**

Replace the paragraph immediately below `# Along Working Thread` with:

```md
Use this skill to make Codex behave in an Along-like way inside active Along project sessions.

The short-term product frame is **Challenge Layer**: Codex preserves Working Thread continuity, notices Challenge Moments, and drafts short Challenge Briefs that turn questionable judgment into lightweight validation.
```

- [ ] **Step 3: Add Challenge Layer boundary bullets**

In `## Hard Boundaries`, after `Codex must not treat a high-impact drift challenge as a hard block.`, add:

```md
- Codex must not treat implementation success as product proof.
- Codex must not use Challenge Briefs to start implementation by default.
- Challenge Moments should challenge self-certifying momentum, not become constant critique.
```

- [ ] **Step 4: Add Challenge Layer behavior bullets**

In `## Behavior Guardrails`, after `high drift pauses, gives one short reason, and asks whether the user wants to switch direction.`, add:

```md
- Challenge Moment triggers include direction switches, pre-implementation transitions, and over-fast validation conclusions.
- Challenge Briefs default to a co-creator tone and should identify what was noticed, why it matters, the suggested validation, and the user's response options.
- Challenge Brief outcomes are Accept Challenge, Refine Challenge, Dismiss For Now, and Turn Into Validation.
- Turn Into Validation is the preferred outcome for anti-self-certification.
- Lightweight validation options are fresh-session check, read-only review, and user calibration.
```

- [ ] **Step 5: Add workflow steps for Challenge Briefs**

In `## Workflow`, after step `8. For high drift, issue a non-blocking confirmation challenge and do not plan the drifted direction before user confirmation.`, insert:

```md
9. For a Challenge Moment, produce a short Challenge Brief instead of a long critique.
10. Prefer turning the challenge into lightweight validation before treating the current judgment as settled.
```

Then renumber the existing later steps so the workflow remains sequential:

```md
11. After confirmed high-impact direction switch, automatically draft a Working Thread update and ask before writing.
12. At meaningful phase boundaries, suggest wrap-up when judgment continuity changed.
13. Draft the wrap-up first. Write to docs only after user confirmation.
```

- [ ] **Step 6: Add output-style guidance**

In `## Output Style`, after `Use restrained co-creator tone: clear, warm enough, and not process-heavy.`, add:

```md
- For Challenge Briefs, lead with the specific risk and keep the default recommendation focused on validation, not execution.
- Do not present Challenge Moments like warnings, errors, or a compliance checklist.
```

- [ ] **Step 7: Run targeted tests and verify partial progress**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: still FAIL because the reference and package files are not updated yet.

- [ ] **Step 8: Commit canonical skill changes**

Run:

```bash
git add .agents/skills/along-working-thread/SKILL.md
git commit -m "docs: add challenge layer skill guardrails"
```

## Task 3: Add Detailed Challenge Moment Rules To The Reference

**Files:**

- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update the Purpose section**

Replace the first paragraph under `## Purpose` with:

```md
Use this workflow to validate whether Codex can feel more Along-like inside an active project session by carrying Working Thread continuity, restoring current judgment, challenging high-impact drift, drafting wrap-up, and producing Challenge Briefs for Challenge Moments.
```

After that paragraph, add:

```md
The short-term product frame is **Challenge Layer**. Along does not become a new executor; it helps the existing agent challenge self-certifying project momentum and turn questionable judgments into lightweight validation.
```

- [ ] **Step 2: Add the Challenge Layer section**

Insert this section after `## Working Thread Definition`:

````md
## Challenge Layer

Challenge Layer is the V1 product frame for Along inside existing agents.

Its job is not to criticize every decision. Its job is to notice when the current project momentum may be proving itself too easily.

The core value is **anti-self-certification**:

```text
Implementation passing does not prove that the product direction is valid.
MCP working does not prove companionship.
Plugin packaging working does not prove self-initiation.
```

Use Challenge Layer to convert fragile judgment into evidence.
````

- [ ] **Step 3: Add Challenge Moment rules**

Insert this section after the new `## Challenge Layer` section:

```md
## Challenge Moment

A Challenge Moment is the point where the user or active agent may be drifting away from stated goals, acting on weak assumptions, skipping validation, expanding scope too early, or treating implementation success as product proof.

Prioritize Challenge Moments in this order:

1. **Self-certification**
   The implementation or tests passed, but product validity is not proven.
2. **Direction drift**
   The conversation shifts away from the recorded Working Thread boundary.
3. **Premature execution**
   The user or agent moves into spec, plan, worktree, or implementation before the decision is clear.
4. **Weak assumptions**
   A premise is being treated as true without validation.

Proactive triggers:

- direction switches;
- pre-implementation transitions;
- over-fast validation conclusions;
- challenge after completion.

User-triggered opportunities:

- the user asks what to do next;
- the user asks whether a plan is valid;
- the user asks for product-direction review;
- the user asks whether evidence is strong enough.

Do not turn Challenge Moments into constant critique.
Do not treat implementation success as product proof.
Do not use Challenge Briefs to start implementation by default.
```

- [ ] **Step 4: Add Challenge Brief rules**

Insert this section after `## Challenge Moment`:

````md
## Challenge Brief

Default to a short Challenge Brief instead of a long critique.

Use this structure:

1. **What I noticed**
   Name the specific drift, assumption, premature execution, or self-certification risk.
2. **Why this may matter**
   Tie the risk to the Working Thread goal, boundary, or recent decision.
3. **What I suggest next**
   Suggest a lightweight validation action.
4. **How you can respond**
   Offer Accept Challenge, Refine Challenge, Dismiss For Now, or Turn Into Validation.

Preferred tone:

- default: co-creator;
- high risk: calm reviewer;
- companion-oriented moment: warmer protective tone.

Example:

```text
I think this may be a self-certification moment.

The implementation passed, but that only proves the mechanism works. It does not yet prove the Challenge Layer feels self-initiating or companion-like in a real session.

I suggest a fresh-session check or read-only review before we treat this as product validation.
```
````

- [ ] **Step 5: Add outcome and validation sections**

Insert this section after `## Challenge Brief`:

```md
## Challenge Brief Outcomes

Support four outcomes:

- **Accept Challenge**
  The user agrees and the current judgment or Working Thread can be updated with confirmation.
- **Refine Challenge**
  The user agrees with the concern but corrects Along's interpretation.
- **Dismiss For Now**
  The user decides this challenge is not useful right now. Lower priority without deleting the thread.
- **Turn Into Validation**
  The default recommended outcome. Convert the questionable judgment into evidence.

Use **turn into validation** as the preferred outcome for anti-self-certification.

## Lightweight Validation

Use small validation actions:

- **fresh-session check**
  Open a clean agent session and ask the same decision question to see whether similar risks appear independently.
- **read-only review**
  Ask an agent to inspect a spec, plan, code result, or product judgment without implementing.
- **user calibration**
  Ask the user to score whether the Challenge Brief felt useful, self-initiating, companion-like, and non-annoying.

Default away from implementation. Validation should gather evidence before execution.
```

- [ ] **Step 6: Add completion path guidance**

Insert this subsection before `## Layered Wrap-Up`:

````md
## Challenge After Completion

Use this as the primary demo path.

When a focused execution session or implementation pass completes:

1. Separate mechanism success from product proof.
2. Ask whether the result actually validates the product feeling.
3. Suggest a fresh-session check, read-only review, or user calibration.
4. Write back the changed judgment only after user confirmation.

Example:

```text
This implementation appears complete, but I think this is a Challenge Moment.
The tests prove the skill behavior was updated. They do not prove the Challenge Layer feels self-initiating or companion-like in a real session.
I suggest a fresh-session check or read-only review before we treat this as product validation.
```
````

- [ ] **Step 7: Run the targeted test and verify partial progress**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: still FAIL because the packaged plugin copy and package metadata are not updated yet.

- [ ] **Step 8: Commit reference changes**

Run:

```bash
git add .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: define challenge moment workflow"
```

## Task 4: Update Plugin Package Positioning And Sync Skill Copy

**Files:**

- Modify: `plugins/along-working-thread/.codex-plugin/plugin.json`
- Modify: `plugins/along-working-thread/README.md`
- Modify: `plugins/along-working-thread/VERSION.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`

- [ ] **Step 1: Update plugin manifest**

Edit `plugins/along-working-thread/.codex-plugin/plugin.json` with these values:

```json
{
  "name": "along-working-thread",
  "version": "0.1.0",
  "description": "Carry Working Thread continuity and Challenge Layer behavior across active Codex sessions.",
  "skills": "./skills/",
  "author": {
    "name": "James"
  },
  "keywords": [
    "along",
    "working-thread",
    "continuity",
    "codex",
    "self-initiation",
    "challenge-layer",
    "validation"
  ],
  "interface": {
    "displayName": "Along Working Thread",
    "shortDescription": "A Challenge Layer and continuity-aware co-creator for active Codex sessions.",
    "longDescription": "Along Working Thread helps Codex carry project judgment across sessions, notice Challenge Moment risks, and turn self-certifying momentum into lightweight validation. It provides turn-bound self-initiation, not background autonomy or always-on presence.",
    "developerName": "James",
    "category": "Productivity",
    "capabilities": [
      "Interactive"
    ],
    "defaultPrompt": [
      "Resume the current Working Thread.",
      "Help me wrap up this phase.",
      "Check whether this direction drifts from our thread.",
      "Check whether this is a self-certification moment.",
      "Turn this challenge into a lightweight validation."
    ]
  }
}
```

- [ ] **Step 2: Add README Challenge Layer section**

In `plugins/along-working-thread/README.md`, after `## What it is`, add:

```md
## Challenge Layer

Along Working Thread now frames its short-term product behavior as a Challenge Layer for existing agents.

A **Challenge Moment** happens when Codex may be treating momentum as evidence: direction drift, premature execution, weak assumptions, or implementation success being treated as product proof.

A **Challenge Brief** is the short response Along should produce at that moment:

1. what it noticed;
2. why it matters against the Working Thread;
3. what lightweight validation it suggests;
4. how the user can accept, refine, dismiss, or turn it into validation.

The core value is **anti-self-certification**. It does not make implementation success equal product proof.
```

- [ ] **Step 3: Update README validation checklist**

Add this subsection under `## Fresh-session validation checklist` before `### Resume`:

````md
### Challenge after completion

```text
The focused execution session says implementation is complete and tests passed. Does that prove the product direction is valid?
```

Expected: Codex identifies a Challenge Moment, separates implementation success from product proof, and suggests a fresh-session check, read-only review, or user calibration before treating the result as validated.
````

- [ ] **Step 4: Update VERSION.md**

Replace the second paragraph in `plugins/along-working-thread/VERSION.md` with:

```md
`0.1.0` is the current turn-bound self-initiation and Challenge Layer package version.

This pass tightens the repo-contained source package behavior by documenting Challenge Moment, Challenge Brief, and lightweight validation rules. It is not a runtime capability upgrade.
```

Add this bullet under `The package continues to provide:`:

```md
- Challenge Briefs for anti-self-certification moments;
```

Add these bullets under `It does not add:`:

```md
- automatic implementation after a challenge;
- proof that product feeling is valid without user or fresh-session validation;
```

Keep this sentence unchanged:

```md
Do not bump to 0.2.0 for this repo-contained package pass. Reserve minor version bumps for meaningful capability changes such as Core/MCP, runtime, presence, or cross-agent behavior.
```

- [ ] **Step 5: Sync packaged skill files from canonical source**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: no output.

- [ ] **Step 6: Run targeted test and verify it passes**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for all skill/package tests.

- [ ] **Step 7: Run package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. The source/package drift check must have no differences.

- [ ] **Step 8: Commit package updates**

Run:

```bash
git add plugins/along-working-thread/.codex-plugin/plugin.json plugins/along-working-thread/README.md plugins/along-working-thread/VERSION.md plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: package challenge layer behavior"
```

## Task 5: Record Implementation Status And Run Full Verification

**Files:**

- Modify: `docs/superpowers/notes/2026-06-25-existing-agent-self-initiation-product-pass.md`

- [ ] **Step 1: Update the product pass record**

Append this bullet under `## Decisions During Product Pass` after the formal spec bullet:

```md
- Implementation status: Challenge Layer behavior was implemented as skill/plugin documentation and validation tests. The implementation remains turn-bound and docs-backed; it does not add runtime, UI, adapters, write delegation, or automatic execution.
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
```

Expected:

```text
tests/skills/along-working-thread-skill.test.ts ... passed
verify:plugin-package ... passed
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run full tests**

Run:

```bash
npm test
```

Expected in sandbox: may fail only on known Express `listen EPERM` or sandbox IPC restrictions. If that happens, rerun with escalation and record the reason. Expected escalated result: PASS.

- [ ] **Step 6: Check whitespace and status**

Run:

```bash
git diff --check
git status --short
```

Expected:

```text
git diff --check
```

has no output. `git status --short` should show only intended modified files before the final commit.

- [ ] **Step 7: Commit docs status**

Run:

```bash
git add docs/superpowers/notes/2026-06-25-existing-agent-self-initiation-product-pass.md
git commit -m "docs: record challenge layer implementation"
```

## Task 6: Final Review Gate

**Files:**

- Review: all files changed in this branch

- [ ] **Step 1: Inspect branch diff**

Run:

```bash
git diff --stat main...HEAD
git diff main...HEAD -- .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md tests/skills/along-working-thread-skill.test.ts plugins/along-working-thread docs/superpowers/notes/2026-06-25-existing-agent-self-initiation-product-pass.md
```

Expected: changes are limited to skill/reference/package/docs/tests.

- [ ] **Step 2: Boundary search**

Run:

```bash
rg -n "watcher|scheduler|notification|Hermes adapter|Claude adapter|Memory v2|relationship modes|emotional simulation|write delegation|automatic implementation|desktop presence|background runtime|new MCP tool|new MCP resource|new MCP prompt" .agents plugins tests docs/superpowers/notes/2026-06-25-existing-agent-self-initiation-product-pass.md
```

Expected: matches may appear only in boundary or non-goal statements. There must be no implementation instructions adding those capabilities.

- [ ] **Step 3: Final status**

Run:

```bash
git status --short
```

Expected: clean worktree, except ignored runtime data if created by local tools.

- [ ] **Step 4: Final handoff summary**

Report:

```text
Worktree:
Branch:
Final HEAD:
Commits:
Verification:
Boundary status:
Unmerged/unpushed status:
```

Do not push, merge, delete the worktree, clean `.superpowers/`, or rewrite history unless the main session explicitly approves.
