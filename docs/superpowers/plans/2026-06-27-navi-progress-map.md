# Navi Progress Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Navi V1 behavior to Along Working Thread so progress and next-step questions produce a non-expert Progress Map, with Challenge Moment as risk escalation.

**Architecture:** Implement Navi V1 as documentation-driven skill behavior only. The canonical source remains `.agents/skills/along-working-thread`; the repo-contained plugin skill copy must stay in exact sync. Package manifest, README, and version notes should present Navi as the customer-facing surface without adding runtime, UI, MCP tools/resources, Working Thread schema fields, background monitoring, or automatic write-back.

**Tech Stack:** Markdown skill/reference docs, Codex plugin manifest JSON, Vitest documentation assertions, existing `npm run verify:plugin-package`.

---

## File Structure

- Modify `tests/skills/along-working-thread-skill.test.ts`
  - Add source-skill assertions for Navi, Progress Map, non-expert progress guidance, professional judgment boundaries, and Challenge Moment escalation inside Progress Map.
  - Add package assertions for Navi positioning, README validation checklist, manifest prompts, and version boundary.
- Modify `.agents/skills/along-working-thread/SKILL.md`
  - Add Navi framing to the skill description, product frame, behavior guardrails, workflow, and output style.
  - Keep existing Challenge Layer, Working Thread, drift, and write-back rules intact.
- Modify `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Add Navi and Progress Map sections.
  - Define trigger phrases, default structure, risk escalation, professional judgment boundary, and roadmap boundaries.
  - Preserve existing Challenge Moment and Challenge Brief behavior as a risk mechanism.
- Modify `plugins/along-working-thread/.codex-plugin/plugin.json`
  - Mention Navi and Progress Map in description/interface/default prompts.
  - Keep version `0.1.0`, skills path, category, and capabilities.
- Modify `plugins/along-working-thread/README.md`
  - Add customer-facing Navi explanation, Progress Map behavior, fresh-session validation prompts, and boundaries.
- Modify `plugins/along-working-thread/VERSION.md`
  - Record Navi as a behavior/documentation pass, not a runtime capability upgrade.
- Modify `plugins/along-working-thread/skills/along-working-thread/**`
  - Sync exact canonical source skill copy from `.agents/skills/along-working-thread`.

## Task 1: Add Failing Source-Skill Tests For Navi

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Insert a source behavior test after the existing Challenge Layer test**

Add this test inside `describe("Along Working Thread Codex skill", () => { ... })`, immediately after `it("documents Challenge Layer behavior and lightweight validation", async () => { ... })`:

```ts
  it("documents Navi Progress Map behavior for non-expert users", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "Navi",
      "Progress Map",
      "non-expert users",
      "understand, supervise, and steer expert agents",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Current position",
      "Completed",
      "What this means for your goal",
      "Still missing",
      "Recommended next step",
      "What you need to confirm now",
      "Main risk",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "what should we do next",
      "what is the current progress",
      "should we continue",
      "are we done",
      "I do not understand the current progress",
      "do not jump straight to another task recommendation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("visible product progress or internal preparation");
    expect(reference).toContain("Challenge Moment becomes the escalation behavior when the map reveals risk");
    expect(reference).toContain("Navi helps the user supervise whether the agent's professional judgment is reliable enough to continue.");
    expect(reference).toContain("claim it can automatically decide the final correct answer in every domain");
    expect(reference).toContain("replace legal, medical, financial, engineering, or other high-risk professional responsibility");
  });
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "documents Navi Progress Map behavior for non-expert users"
```

Expected: FAIL because `.agents/skills/along-working-thread/SKILL.md` and `.agents/skills/along-working-thread/references/working-thread-v1.md` do not yet contain Navi Progress Map behavior.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover navi progress map behavior"
```

## Task 2: Update Canonical Skill And Reference For Navi

**Files:**
- Modify: `.agents/skills/along-working-thread/SKILL.md`
- Modify: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update the source skill frontmatter description**

In `.agents/skills/along-working-thread/SKILL.md`, replace the current `description:` line with:

```yaml
description: 'Use in the Along project when Codex should preserve judgment-oriented Working Thread continuity across active sessions, provide Navi Progress Maps for non-expert progress or next-step questions, challenge high-impact drift, produce Challenge Briefs for Challenge Moments, or draft wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation work that does not involve Working Thread continuity.'
```

- [ ] **Step 2: Replace the short-term product frame paragraphs**

In `.agents/skills/along-working-thread/SKILL.md`, replace the two paragraphs after `# Along Working Thread` with:

```md
Use this skill to make Codex behave in an Along-like way inside active Along project sessions.

The customer-facing product surface is **Navi**: a non-expert progress and decision guidance experience that helps users understand, supervise, and steer expert agents.

The short-term product behavior is **Progress Map + Challenge Layer**. Navi gives a Progress Map when the user asks about progress, next steps, whether to continue, or says they do not understand the current state. Challenge Moment remains the risk-escalation mechanism when the map reveals drift, weak assumptions, premature execution, or self-certifying momentum.

It remains a turn-bound self-initiation skill: when judgment is shaky, the default move is to orient the user, surface risk, and turn uncertainty into validation rather than automatic execution.
```

- [ ] **Step 3: Add Navi hard boundaries**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets to `## Hard Boundaries` after `- Codex must not use Challenge Briefs to start implementation by default.`:

```md
- Codex must not answer progress or next-step confusion by jumping straight to more implementation work.
- Navi must not claim it can automatically give the final correct answer in every professional domain.
- Navi must not replace legal, medical, financial, engineering, or other high-risk professional review.
```

- [ ] **Step 4: Add Navi behavior guardrails**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets to `## Behavior Guardrails` after the existing ordinary request bullet:

```md
- Navi Progress Map triggers when the user asks what should happen next, what the current progress is, whether to continue, whether the work is done, what remains, or says they do not understand the current progress.
- for Progress Map requests, orient before recommending: current position, completed work, what it means for the user's goal, still missing work, recommended next step, what the user needs to confirm now, and one main risk when relevant.
- Progress Map should distinguish visible user-verifiable progress from internal preparation.
- Challenge Moment becomes the escalation behavior when the map reveals risk; it should appear inside the map rather than as a separate lecture.
- professional judgment support should identify unclear requirements, unsupported recommendations, premature next steps, missing validation, and when expert review is needed.
```

- [ ] **Step 5: Add Navi workflow steps**

In `.agents/skills/along-working-thread/SKILL.md`, insert these workflow steps after current step 3 and renumber the following steps:

```md
4. If the user asks about progress, next steps, whether to continue, whether the work is done, what remains, or says they do not understand the current state, provide a Navi Progress Map before recommending more work.
5. If context is insufficient for a reliable Progress Map, say what can be inferred and inspect or ask for the relevant project record, recent changes, or active plan instead of inventing state.
```

After renumbering, ensure the final workflow still includes all existing creation, drift, Challenge Moment, validation, direction-switch, and wrap-up steps.

- [ ] **Step 6: Add Navi output style bullets**

In `.agents/skills/along-working-thread/SKILL.md`, add these bullets to `## Output Style` before `- For Challenge Briefs, lead with the specific risk...`:

```md
- For Navi Progress Maps, default to a project navigator structure with a warm supervisor tone.
- Do not turn every Progress Map into a long project report; include the smallest map that helps the user regain supervisory control.
- Add agent-use coaching only when the user is visibly confused or asks how to use the agent better.
```

- [ ] **Step 7: Update the reference Purpose section**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, replace the two paragraphs under `## Purpose` with:

```md
Use this workflow to validate whether Codex can feel more Along-like inside an active project session by carrying Working Thread continuity, restoring current judgment, giving Navi Progress Maps for non-expert progress questions, challenging high-impact drift, drafting wrap-up, and producing Challenge Briefs for Challenge Moments.

The customer-facing surface is **Navi**. Navi helps non-expert users understand, supervise, and steer expert agents. The short-term product behavior is **Progress Map + Challenge Layer**: Navi orients the user on current progress first, then uses Challenge Moment as the risk-escalation mechanism when the current path may be misleading.
```

- [ ] **Step 8: Add a Navi section after Working Thread Definition**

In `.agents/skills/along-working-thread/references/working-thread-v1.md`, insert this section after `## Working Thread Definition` and before `## Challenge Layer`:

````md
## Navi

Navi is Along's customer-facing product surface for non-expert users supervising expert agents.

Its V1 promise is:

```text
Navi helps non-expert users understand, supervise, and steer expert agents.
```

Navi exists because the user may be responsible for the outcome while lacking enough domain expertise to evaluate the agent's work. Software development is the first concrete example, but the pattern can later apply to legal review, data analysis, research, design, finance, operations, and other expert-agent workflows.

Navi's default behavior is a **Progress Map**. It appears when the user asks what should happen next, what the current progress is, whether to continue, whether the work is done, what remains, or says they do not understand the current progress.

Navi should not jump straight to another task recommendation when the user is asking for orientation. It should first help the user understand where the work stands and what they need to confirm.
````

- [ ] **Step 9: Add a Progress Map section after the Navi section**

Insert this section immediately after the new `## Navi` section:

````md
## Progress Map

A Progress Map is the default Navi response for progress and next-step confusion.

Use this structure:

```text
Current position:
Name the current stage in plain language.

Completed:
- List concrete completed work.

What this means for your goal:
- Explain what the completed work actually changes for the user's goal.

Still missing:
- List the remaining work or unknowns.

Recommended next step:
Name the next step and why it is necessary.

What you need to confirm now:
Name one decision, inspection, or acceptance action the user can actually make.
```

If there is a meaningful risk, add:

```text
Main risk:
Name the risk and why blindly continuing may be costly.
```

Progress Map should distinguish visible product progress or internal preparation. If the work is mostly internal preparation, say that clearly so the user does not mistake it for a user-verifiable result.

If context is insufficient, do not invent project state. Say what can be inferred and inspect or ask for the relevant project record, recent changes, or active plan.

Default personality:

- project navigator by structure;
- warm supervisor by tone;
- professional advisor when risk appears;
- agent-use coach only when the user is visibly confused or asks how to use the agent better.
````

- [ ] **Step 10: Add Navi trigger guidance to user-triggered opportunities**

In `## Challenge Moment`, extend the `User-triggered opportunities:` list with:

```md
- the user asks what should we do next;
- the user asks what the current progress is;
- the user asks whether to continue;
- the user asks whether the work is done;
- the user says they do not understand the current progress.
```

- [ ] **Step 11: Add a Challenge Moment inside Navi section before Challenge Brief**

Insert this section before `## Challenge Brief`:

````md
## Challenge Moment Inside Navi

Navi's default experience is Progress Map. Challenge Moment becomes the escalation behavior when the map reveals risk.

Challenge Moment triggers inside Navi include:

- the work is drifting away from the user's original goal;
- the agent's proposed next step does not match the current stage;
- the user wants to keep implementing before a key acceptance check;
- the user or agent treats implementation completion as requirement satisfaction;
- most completed work is internal preparation, but the user thinks visible product progress is done;
- the user repeatedly says continue, then what, or next without a clear acceptance point;
- the agent suggests more work without explaining why it is necessary;
- the agent expands scope before the user understands the impact.

Challenge Moment should appear as part of the map, not as a separate lecture.

Example:

```text
Current position:
We have completed part of the internal implementation, not a user-verifiable product result.

Main risk:
If we continue adding features now, you may expand scope before confirming whether the core experience matches your original need.

More reliable next step:
Ask the agent to show a version you can try, then confirm whether it satisfies the first user flow.
```
````

- [ ] **Step 12: Add professional judgment boundary after Lightweight Validation**

Insert this section after `## Lightweight Validation`:

````md
## Professional Judgment Boundary

Navi exists because non-expert users need help with professional judgment. V1 must help with that problem, but its promise is process reliability rather than omniscient domain correctness.

Navi should:

- point out unclear requirements;
- point out unsupported agent recommendations;
- distinguish internal work from user-verifiable progress;
- flag next steps that are premature, too broad, goal-drifting, or insufficiently validated;
- ask the agent to provide tradeoffs, cost/risk explanation, acceptance criteria, or read-only review;
- recommend expert review in high-risk domains when needed.

Navi should not:

- claim it can automatically decide the final correct answer in every domain;
- pretend certainty when evidence is missing;
- replace legal, medical, financial, engineering, or other high-risk professional responsibility;
- treat the agent says so as sufficient evidence;
- let the user continue blindly when they clearly do not understand the state.

Working principle:

```text
Navi does not pretend the user understands the expert domain.
Navi helps the user supervise whether the agent's professional judgment is reliable enough to continue.
```
````

- [ ] **Step 13: Run the source behavior test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "documents Navi Progress Map behavior for non-expert users"
```

Expected: PASS.

- [ ] **Step 14: Run the full skill test file**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: existing package sync test may fail because the packaged skill copy has not been updated yet. Source behavior tests should pass.

- [ ] **Step 15: Commit canonical source behavior**

Run:

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: add navi progress map behavior"
```

## Task 3: Add Package Positioning Tests And Update Package Metadata

**Files:**
- Modify: `tests/skills/along-working-thread-skill.test.ts`
- Modify: `plugins/along-working-thread/.codex-plugin/plugin.json`
- Modify: `plugins/along-working-thread/README.md`
- Modify: `plugins/along-working-thread/VERSION.md`

- [ ] **Step 1: Add package tests after the existing Challenge Layer package test**

In `tests/skills/along-working-thread-skill.test.ts`, add this test inside `describe("Along Working Thread repo-contained plugin package", () => { ... })`, immediately after `it("positions the package as a Challenge Layer without expanding runtime scope", async () => { ... })`:

```ts
  it("positions the package around Navi Progress Map without expanding runtime scope", async () => {
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
    expect(manifest.description).toContain("Navi");
    expect(manifest.description).toContain("Progress Map");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["navi", "progress-map"]));
    expect(manifest.interface.shortDescription).toContain("Navi");
    expect(manifest.interface.longDescription).toContain("non-expert users");
    expect(manifest.interface.longDescription).toContain("Progress Map");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.defaultPrompt).toEqual(
      expect.arrayContaining([
        "Give me a Navi Progress Map for the current work.",
        "Explain what is done, what remains, and what I need to confirm.",
      ]),
    );

    expect(readme).toContain("## Navi");
    expect(readme).toContain("Progress Map");
    expect(readme).toContain("understand, supervise, and steer expert agents");
    expect(readme).toContain("Current position");
    expect(readme).toContain("What you need to confirm now");
    expect(readme).toContain("not a standalone general agent");
    expect(readme).toContain("does not replace necessary professional review");
    expect(readme).toContain("接下来我们应该做什么？");
    expect(readme).toContain("现在做到哪了？我看不懂。");

    expect(version).toContain("Navi");
    expect(version).toContain("Progress Map");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });
```

- [ ] **Step 2: Run the package positioning test and verify it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "positions the package around Navi Progress Map without expanding runtime scope"
```

Expected: FAIL because manifest, README, and VERSION do not yet mention Navi Progress Map.

- [ ] **Step 3: Update plugin manifest**

In `plugins/along-working-thread/.codex-plugin/plugin.json`, update only these fields:

```json
{
  "description": "Carry Working Thread continuity, Navi Progress Map behavior, and Challenge Layer validation across active Codex sessions.",
  "keywords": [
    "along",
    "working-thread",
    "continuity",
    "codex",
    "self-initiation",
    "challenge-layer",
    "validation",
    "navi",
    "progress-map"
  ],
  "interface": {
    "shortDescription": "Navi Progress Maps and Challenge Layer continuity for active Codex sessions.",
    "longDescription": "Along Working Thread helps Codex carry project judgment across sessions, give Navi Progress Maps for non-expert users, notice Challenge Moment risks, and turn self-certifying momentum into lightweight validation. It provides turn-bound self-initiation, not background autonomy or always-on presence.",
    "defaultPrompt": [
      "Resume the current Working Thread.",
      "Give me a Navi Progress Map for the current work.",
      "Explain what is done, what remains, and what I need to confirm.",
      "Help me wrap up this phase.",
      "Check whether this direction drifts from our thread.",
      "Check whether this is a self-certification moment.",
      "Turn this challenge into a lightweight validation."
    ]
  }
}
```

Keep the existing `name`, `version`, `skills`, `author`, `interface.displayName`, `interface.developerName`, `interface.category`, and `interface.capabilities` values unchanged.

- [ ] **Step 4: Add a Navi section to README**

In `plugins/along-working-thread/README.md`, insert this section after `## What it is` and before `## Challenge Layer`:

```md
## Navi

Navi is Along's customer-facing product surface for non-expert users supervising expert agents.

Navi helps users understand, supervise, and steer expert agents. When a user asks what is happening, what comes next, whether to continue, or says they do not understand the current progress, Navi should give a **Progress Map** before recommending more work.

A Progress Map should cover:

1. current position;
2. completed work;
3. what this means for the user's goal;
4. still missing work;
5. recommended next step and why it matters;
6. what the user needs to confirm now;
7. the main risk when one exists.

Navi uses Challenge Moment as a risk-escalation mechanism. If the map reveals drift, premature execution, weak assumptions, or implementation success being mistaken for requirement satisfaction, Navi should surface that risk and suggest a more reliable next step.
```

- [ ] **Step 5: Update the README What It Is list**

In `plugins/along-working-thread/README.md`, add this bullet to `## What it is`:

```md
- A Navi Progress Map behavior for progress and next-step questions from non-expert users.
```

- [ ] **Step 6: Update the README What It Is Not list**

In `plugins/along-working-thread/README.md`, add these bullets to `## What it is not`:

```md
- It is not a standalone general agent.
- It does not automatically decide the final correct answer in every professional domain.
- It does not replace necessary professional review.
```

- [ ] **Step 7: Update README fresh-session validation checklist**

In `plugins/along-working-thread/README.md`, add this subsection under `## Fresh-session validation checklist`, immediately after `### Recovery`:

````md
### Navi Progress Map

```text
接下来我们应该做什么？
```

Expected: Codex gives a Navi Progress Map before recommending more work. It should identify current position, completed work, what still remains, why the next step matters, what the user needs to confirm, and the main risk if one exists.

```text
现在做到哪了？我看不懂。
```

Expected: Codex distinguishes visible user-verifiable progress from internal preparation and names what the user can inspect or ask the agent to validate.
````

- [ ] **Step 8: Update VERSION**

Replace the second and third paragraphs in `plugins/along-working-thread/VERSION.md` with:

```md
`0.1.0` is the current turn-bound self-initiation, Navi Progress Map, and Challenge Layer package version.

This pass documents Navi as the customer-facing Progress Map behavior for non-expert progress and next-step questions. It is not a runtime capability upgrade.
```

Add this bullet under `The package continues to provide:`:

```md
- Navi Progress Maps for progress, next-step, continue, and confusion questions from non-expert users;
```

Add this bullet under `It does not add:`:

```md
- automatic final decision-making across every professional domain;
```

- [ ] **Step 9: Run the package positioning test**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts -t "positions the package around Navi Progress Map without expanding runtime scope"
```

Expected: PASS.

- [ ] **Step 10: Commit package metadata and tests**

Run:

```bash
git add tests/skills/along-working-thread-skill.test.ts plugins/along-working-thread/.codex-plugin/plugin.json plugins/along-working-thread/README.md plugins/along-working-thread/VERSION.md
git commit -m "docs: position package around navi progress maps"
```

## Task 4: Sync Packaged Skill Copy And Verify Package

**Files:**
- Modify: `plugins/along-working-thread/skills/along-working-thread/SKILL.md`
- Modify: `plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md`
- No change expected: `plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml`

- [ ] **Step 1: Sync the packaged skill copy from canonical source**

Run:

```bash
cp .agents/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/SKILL.md
cp .agents/skills/along-working-thread/references/working-thread-v1.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
```

Expected: only the packaged `SKILL.md` and packaged `references/working-thread-v1.md` change. `agents/openai.yaml` should already match.

- [ ] **Step 2: Run the full skill/package test file**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run plugin package verification**

Run:

```bash
npm run verify:plugin-package
```

Expected: PASS. This command runs the targeted skill/package tests, validates the plugin manifest, and checks exact source/package skill drift.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Run diff check**

Run:

```bash
git diff --check
```

Expected: no output.

- [ ] **Step 6: Commit synced package copy**

Run:

```bash
git add plugins/along-working-thread/skills/along-working-thread/SKILL.md plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: sync navi skill package copy"
```

## Task 5: Final Verification And Handoff

**Files:**
- Review only: `docs/superpowers/specs/2026-06-27-navi-non-expert-progress-map-design.md`
- Review only: `tests/skills/along-working-thread-skill.test.ts`
- Review only: `.agents/skills/along-working-thread/SKILL.md`
- Review only: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Review only: `plugins/along-working-thread/README.md`
- Review only: `plugins/along-working-thread/.codex-plugin/plugin.json`
- Review only: `plugins/along-working-thread/VERSION.md`

- [ ] **Step 1: Re-run the core verification set**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
npm run verify:plugin-package
npm run typecheck
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Check status and commit history**

Run:

```bash
git status --short --branch
git log --oneline -5
```

Expected:

- branch is ahead of origin by the new plan and implementation commits until pushed;
- `.superpowers/` may remain untracked if it was already present;
- no unstaged or staged implementation changes remain.

- [ ] **Step 3: Report fresh-session validation prompts**

Report these manual validation prompts to the main session:

```text
接下来我们应该做什么？
```

Expected: Navi gives a Progress Map before recommending more work.

```text
现在做到哪了？我看不懂。
```

Expected: Navi distinguishes visible progress from internal preparation.

```text
继续吧。
```

Expected: if no acceptance point is clear, Navi asks whether the current stage has been verified before continuing.

```text
这个方案可以吗？我不懂技术。
```

Expected: Navi explains missing evidence and asks for tradeoffs, risks, or review rather than pretending certainty.

## Boundary Checklist

The implementation is inside scope only if all of these remain true:

- no new dependencies;
- no new runtime, server, watcher, scheduler, notification, or background behavior;
- no UI or desktop surface;
- no new MCP tools, resources, prompts, or transport behavior;
- no Working Thread schema change;
- no `.along/` state;
- no write delegation or automatic implementation;
- no claim that Navi can automatically provide final correct decisions across every professional domain;
- source skill and packaged skill remain in exact sync.

## Recommended Execution Mode

Use **Subagent-Driven** execution. Dispatch one fresh implementer subagent per task:

1. Task 1: tests only.
2. Task 2: canonical source skill/reference only.
3. Task 3: package metadata, README, version, and package tests only.
4. Task 4: package skill sync and verification only.
5. Task 5: final verification and handoff only.

The main agent should review after each task for spec compliance and code quality. If any review finds scope expansion into runtime, UI, MCP, schema, or professional-domain overclaiming, send the task back for repair before continuing.
