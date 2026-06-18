# Along Codex Skill-First V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repo-scoped Codex skill and docs-backed Working Thread records that let Codex validate Along-like turn-bound self-initiation inside active Along project sessions.

**Architecture:** Keep this V1 as a skill-first workflow, not an Along runtime feature. The repo-scoped skill describes how Codex should restore Working Threads, classify drift, and draft wrap-ups; project docs hold reviewable continuity records; Vitest coverage validates the skill package and docs-backed record shape.

**Tech Stack:** Codex repo skill under `.agents/skills`, Markdown documentation, YAML skill metadata, TypeScript, Vitest, existing npm scripts.

---

## Spec And Boundaries

Approved spec:

`docs/superpowers/specs/2026-06-18-along-codex-skill-first-v1-design.md`

Implementation must preserve these boundaries:

- no new standalone Along agent;
- no background runtime, watcher, scheduler, notification, or automation;
- no local/desktop presence surface;
- no full Along Core implementation;
- no MCP server implementation;
- no plugin packaging;
- no Hermes adapter;
- no delegation candidate or conductor workflow;
- no write delegation;
- no relationship mode or emotional simulation implementation.

This plan creates a Codex skill workflow and docs-backed continuity records only.

## Environment Notes

- If implementing in a new worktree without `node_modules`, ask the user before running `npm ci`.
- Do not push, merge, delete worktrees, rewrite history, or clean `.superpowers/` unless explicitly asked.
- `.along/` remains ignored local runtime data and is not part of this V1.
- Expected focused verification:
  - `npm test -- tests/skills/along-working-thread-skill.test.ts`
  - `npm run typecheck`
  - `npm run build`
  - full `npm test`
- If full `npm test` fails only because Express cannot listen in the sandbox with `EPERM`, rerun with appropriate escalation and record that the escalated run passed.

## File Structure

Create:

- `.agents/skills/along-working-thread/SKILL.md`
  - Repo-scoped Codex skill entrypoint.
  - Owns trigger rules, safety boundaries, and required workflow steps.

- `.agents/skills/along-working-thread/agents/openai.yaml`
  - Skill metadata.
  - Allows implicit project-level consideration while keeping persistent actions confirmation-gated in the skill instructions.

- `.agents/skills/along-working-thread/references/working-thread-v1.md`
  - Detailed reference loaded by the skill.
  - Owns Working Thread definition, record shape, resume briefing, drift classification, and wrap-up behavior.

- `docs/along/working-threads/README.md`
  - Product-owned docs-backed continuity directory guide.
  - Owns the reusable Working Thread record template and write rules.

- `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
  - Seed Working Thread for the accepted V1 direction.
  - Gives Codex a real record to restore during subjective validation.

- `tests/skills/along-working-thread-skill.test.ts`
  - Vitest coverage for skill package, reference guardrails, docs-backed record shape, and seed record boundaries.

Modify:

- `docs/superpowers/notes/2026-06-15-living-presence-brainstorm-continuity.md`
  - Add a short implementation-status note after the skill and docs are in place.

Do not modify `src/`, server runtime, web UI, `.along/`, MCP config, plugin manifests, or package dependencies for this V1.

## Task 1: Add Failing Skill Package Tests

**Files:**
- Create: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Write tests for the repo skill package and docs-backed continuity shape**

Create `tests/skills/along-working-thread-skill.test.ts`:

```ts
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Along Working Thread Codex skill", () => {
  it("defines a repo-scoped skill with explicit V1 boundaries", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const metadata = await readRepoText(".agents/skills/along-working-thread/agents/openai.yaml");

    expect(skill).toContain("name: along-working-thread");
    expect(skill).toContain("description:");
    expect(skill).toContain("turn-bound self-initiation");
    expect(skill).toContain("must not silently create");
    expect(skill).toContain("must not silently write");
    expect(skill).toContain("background runtime");
    expect(skill).toContain("references/working-thread-v1.md");
    expect(metadata).toContain("display_name: Along Working Thread");
    expect(metadata).toContain("allow_implicit_invocation: true");
  });

  it("documents the V1 workflow, drift levels, and confirmation gates", async () => {
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    expect(reference).toContain("Working Thread");
    expect(reference).toContain("Start / Resume Briefing");
    expect(reference).toContain("Impact-Based Drift Challenge");
    expect(reference).toContain("Layered Wrap-Up");
    expect(reference).toContain("none");
    expect(reference).toContain("low");
    expect(reference).toContain("medium");
    expect(reference).toContain("high");
    expect(reference).toContain("First Working Thread creation requires user confirmation");
    expect(reference).toContain("Durable write-back requires user confirmation");
    expect(reference).toContain("Do not implement Core/MCP");
  });

  it("ships a product-owned Working Thread directory with the required record template", async () => {
    const readme = await readRepoText("docs/along/working-threads/README.md");

    for (const heading of [
      "# Along Working Threads",
      "## Record Template",
      "## Why This Matters",
      "## Current Judgment",
      "## Boundary",
      "## Drift Triggers",
      "## Next Likely Move",
      "## Last Wrap-Up",
      "## Open Questions",
    ]) {
      expect(readme).toContain(heading);
    }
    expect(readme).toContain("Do not store chat transcripts here.");
    expect(readme).toContain("Do not create or update a durable record without user confirmation.");
  });

  it("includes a seed Working Thread for the accepted existing-agent V1 direction", async () => {
    const record = await readRepoText("docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md");

    for (const heading of [
      "# Existing-Agent Self-Initiation Layer",
      "Status: active",
      "## Why This Matters",
      "## Current Judgment",
      "## Boundary",
      "## Drift Triggers",
      "## Next Likely Move",
      "## Last Wrap-Up",
      "## Open Questions",
    ]) {
      expect(record).toContain(heading);
    }
    expect(record).toContain("Codex-first");
    expect(record).toContain("skill-first");
    expect(record).toContain("docs-backed");
    expect(record).toContain("turn-bound self-initiation");
    expect(record).toContain("Do not build a new standalone Along agent");
    expect(record).toContain("Do not implement Core/MCP");
    expect(record).toContain("Do not package a plugin");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because `.agents/skills/along-working-thread/SKILL.md` and the Working Thread docs do not exist.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/skills/along-working-thread-skill.test.ts
git commit -m "test: cover along working thread skill package"
```

## Task 2: Add Repo-Scoped Codex Skill Entrypoint

**Files:**
- Create: `.agents/skills/along-working-thread/SKILL.md`
- Create: `.agents/skills/along-working-thread/agents/openai.yaml`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Create the skill entrypoint**

Create `.agents/skills/along-working-thread/SKILL.md`:

```md
---
name: along-working-thread
description: Use in the Along project when Codex should preserve judgment-oriented Working Thread continuity across active sessions: resume relevant threads, suggest thread creation, challenge high-impact drift, or draft wrap-up with user confirmation. Do not use for one-off coding tasks, background automation, or implementation work that does not involve Working Thread continuity.
---

# Along Working Thread

Use this skill to make Codex behave in an Along-like way inside active Along project sessions.

This skill validates turn-bound self-initiation. It does not provide background runtime, notifications, local/desktop presence, Core/MCP implementation, plugin packaging, Hermes integration, delegation, write delegation, relationship modes, or emotional simulation.

## Required Reference

Before acting on a Working Thread, read:

`references/working-thread-v1.md`

## Hard Boundaries

- This skill may be considered by default in the Along project when the user request matches Working Thread behavior.
- Codex must not silently create durable Working Thread docs.
- Codex must not silently write persistent continuity records.
- Codex must not treat a high-impact drift challenge as a hard block.
- First Working Thread creation requires user confirmation.
- Durable write-back requires user confirmation.
- Major direction changes require user confirmation.
- Do not implement Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, background runtime, or delegation as part of this skill.

## Workflow

1. Check whether the user's request concerns an existing or possible Working Thread.
2. If a relevant Working Thread exists, read the record from `docs/along/working-threads/`.
3. At session start or resume, provide a short briefing with current judgment, active boundary, and next likely move.
4. If the user request may create a new durable Working Thread, suggest creation and ask for confirmation before writing.
5. If the user request may drift from the active Working Thread, classify drift against the record as `none`, `low`, `medium`, or `high`.
6. For `high` drift, issue a non-blocking confirmation challenge.
7. At meaningful phase boundaries, suggest wrap-up when judgment continuity changed.
8. Draft the wrap-up first. Write to docs only after user confirmation.

## Output Style

- Keep resume briefings short.
- Explain challenges by pointing to the stored Working Thread boundary.
- Ask for confirmation instead of refusing user direction.
- Do not present Working Threads like an inbox.
- Do not produce a report unless the user asks for one.
```

- [ ] **Step 2: Create skill metadata**

Create `.agents/skills/along-working-thread/agents/openai.yaml`:

```yaml
interface:
  display_name: Along Working Thread
  short_description: Resume, protect, and wrap Along Working Threads inside Codex sessions.
  default_prompt: Use Along Working Thread to resume or update project continuity.

policy:
  allow_implicit_invocation: true
```

- [ ] **Step 3: Run the focused test and confirm the remaining failures**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because `references/working-thread-v1.md` and `docs/along/working-threads/` do not exist yet.

- [ ] **Step 4: Commit the skill entrypoint**

```bash
git add .agents/skills/along-working-thread/SKILL.md .agents/skills/along-working-thread/agents/openai.yaml
git commit -m "feat: add along working thread skill entrypoint"
```

## Task 3: Add Working Thread V1 Skill Reference

**Files:**
- Create: `.agents/skills/along-working-thread/references/working-thread-v1.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Create the detailed skill reference**

Create `.agents/skills/along-working-thread/references/working-thread-v1.md`:

````md
# Working Thread V1 Reference

This reference defines the skill-first V1 behavior for Along-like Codex sessions.

## Purpose

Use this workflow to validate whether Codex can feel more Along-like inside an active project session by carrying Working Thread continuity, restoring current judgment, challenging high-impact drift, and drafting wrap-up.

Do not implement Core/MCP, plugin packaging, Hermes adapter, background runtime, local/desktop presence, delegation, write delegation, relationship modes, or emotional simulation.

## Working Thread Definition

A Working Thread is a cross-session judgment container for an unfinished question, direction, doubt, or creative line that will keep affecting future decisions.

It is not a chat transcript, todo list, issue ticket, implementation spec, or generic memory.

Chat is where conversation happens. Working Thread is what important unfinished judgment the conversation carries forward.

## Record Location

Read and write Working Thread records under:

```text
docs/along/working-threads/
```

Do not use `.along/` for V1 Working Thread continuity. `.along/` remains future local state and ignored runtime data.

## Record Fields

Each Working Thread record uses these sections:

```text
Title
Status
Last updated
Why This Matters
Current Judgment
Boundary
Drift Triggers
Next Likely Move
Last Wrap-Up
Open Questions
```

## Working Thread Creation

A user can explicitly ask to start, record, or continue a Working Thread.

Codex can suggest a Working Thread when a strong signal appears:

- the user indicates long-term continuity;
- the discussion is judgment-heavy;
- the same theme recurs across sessions or a long session;
- the topic will affect future multi-turn decisions.

First Working Thread creation requires user confirmation. Do not silently create a durable record.

Suggested wording:

```text
I think this is becoming a Working Thread rather than a one-off question.
Do you want me to record it so future sessions can carry it forward?
```

## Start / Resume Briefing

When a relevant Working Thread exists, provide a short briefing.

Include:

- the Working Thread title;
- the current shared judgment;
- the active boundary if relevant;
- the next likely move.

Avoid full history unless the user asks.

Preferred shape:

```text
I brought this thread back:
we last confirmed V1 is Codex-first, skill-first, and docs-backed.
Current judgment: validate start/resume, drift challenge, and wrap-up before building Core/MCP.
I suggest we define the drift challenge behavior next, without entering implementation yet.
```

## Impact-Based Drift Challenge

Classify the user's new request against the active Working Thread record.

Use the record as the source of truth, especially:

- Current Judgment
- Boundary
- Drift Triggers
- Next Likely Move
- Open Questions

Drift levels:

- `none`: no meaningful drift; stay silent.
- `low`: minor shift; stay silent.
- `medium`: possible shift; optionally add a soft note without blocking.
- `high`: significant shift; issue a confirmation challenge.

High drift examples:

- the request moves from design into implementation before approval;
- the request revives Core/MCP implementation while Core/MCP is deferred;
- the request revives plugin packaging, Hermes adapter, local/desktop presence, or delegation while deferred;
- the request shifts back toward building a new standalone agent;
- the request bypasses user review gates recorded in the Working Thread.

Preferred challenge:

```text
I notice this may shift the Working Thread.
Current boundary: V1 is skill-first and docs-backed; Core/MCP implementation is deferred.
Your new request moves toward implementing Core/MCP now.
Do you want to intentionally switch direction, or continue with the current V1 behavior design?
```

The challenge is not a refusal. The user can intentionally switch direction after confirming.

## Layered Wrap-Up

Wrap-up is a phase-end continuity update. It is not a chat summary, meeting transcript, or task log.

Default write-back fields:

```text
Last Wrap-Up
Current Judgment
Boundary changes
Open Questions
Next Likely Move
```

For major direction changes, add:

```text
Decision notes
Rejected options
Reason for change
```

Durable write-back requires user confirmation.

Trigger wrap-up when:

- the user explicitly asks;
- a design choice is accepted;
- subjective calibration ends;
- the user says approved, recognized, continue next time, or stop here;
- the conversation switches to another Working Thread;
- Current Judgment, Boundary, Open Questions, or Next Likely Move changed.

Small routine changes should not trigger proactive wrap-up.
````

- [ ] **Step 2: Run the focused test and confirm the remaining failures**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: FAIL because `docs/along/working-threads/README.md` and the seed Working Thread record do not exist yet.

- [ ] **Step 3: Commit the reference**

```bash
git add .agents/skills/along-working-thread/references/working-thread-v1.md
git commit -m "docs: add along working thread skill reference"
```

## Task 4: Add Docs-Backed Working Thread Directory And Seed Record

**Files:**
- Create: `docs/along/working-threads/README.md`
- Create: `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Create the Working Threads directory README**

Create `docs/along/working-threads/README.md`:

````md
# Along Working Threads

This directory stores docs-backed Working Thread continuity for Along.

Working Threads are cross-session judgment containers. They preserve important unfinished judgment, accepted boundaries, drift triggers, and next moves so Codex can resume the work without relying only on chat context or model memory.

Do not store chat transcripts here.
Do not store task-management logs here.
Do not create or update a durable record without user confirmation.

## Record Template

Use this shape for V1 records:

```md
# Working Thread Title

Status: active | quiet | closed
Last updated: YYYY-MM-DD

## Why This Matters

Briefly state why this unfinished question, direction, doubt, or creative line affects future decisions.

## Current Judgment

State the best current shared judgment.

## Boundary

State what this thread is and is not allowed to pull into the current phase.

## Drift Triggers

- List signals that should cause Codex to consider a drift challenge.

## Next Likely Move

State the next useful direction if the thread resumes.

## Last Wrap-Up

Record the most recent compact continuity update.

## Open Questions

- List unresolved questions that should carry forward.
```

## Write Rules

- Keep records short and judgment-oriented.
- Update only fields that changed.
- Use `Decision notes`, `Rejected options`, and `Reason for change` only for major direction changes.
- Confirm with the user before creating or durably updating a record.
- Do not use `.along/` for V1 Working Thread continuity.
````

- [ ] **Step 2: Create the seed Working Thread record**

Create `docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md`:

```md
# Existing-Agent Self-Initiation Layer

Status: active
Last updated: 2026-06-18

## Why This Matters

Along should not try to compete directly with Codex, Hermes, or Claude Code as a new general coding agent. The current product direction is to test whether existing agents can gain Along-like self-initiation and companionship during active work.

## Current Judgment

V1 should be Codex-first, skill-first, and docs-backed. It should validate turn-bound self-initiation through start/resume briefing, impact-based drift challenge, and layered wrap-up before building Core/MCP, plugin packaging, Hermes integration, local/desktop presence, or background runtime.

## Boundary

- Do not build a new standalone Along agent in V1.
- Do not implement Core/MCP in V1.
- Do not package a plugin in V1.
- Do not implement Hermes adapter in V1.
- Do not implement local/desktop presence surface in V1.
- Do not implement delegation candidate or conductor workflow in V1.
- Do not use `.along/` as the V1 Working Thread continuity store.
- Do not write durable Working Thread docs without user confirmation.

## Drift Triggers

- The work shifts from skill-first validation into Core/MCP implementation.
- The work shifts toward plugin packaging before behavior is validated.
- The work revives Hermes adapter, delegation, or local/desktop presence as V1 scope.
- The work shifts back toward building a standalone general agent.
- The work bypasses spec review or write-back confirmation.

## Next Likely Move

Implement and validate the repo-scoped Codex skill, docs-backed Working Thread template, and seed record. Then run subjective validation in real Codex sessions before considering Core/MCP or plugin packaging.

## Last Wrap-Up

The formal V1 spec was approved for implementation planning. The accepted path is Codex-first, skill-first, docs-backed continuity with project-level default consideration and confirmation for first or persistent actions.

## Open Questions

- Does resume briefing feel like companionship rather than a report during real use?
- Does impact-based drift challenge feel helpful rather than supervisory?
- Does layered wrap-up preserve continuity without becoming a log?
- After validation, should Along Core/MCP or plugin packaging come next?
```

- [ ] **Step 3: Run the focused test and verify it passes**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
```

Expected: PASS for all tests in `tests/skills/along-working-thread-skill.test.ts`.

- [ ] **Step 4: Commit the Working Thread docs**

```bash
git add docs/along/working-threads/README.md docs/along/working-threads/2026-06-18-existing-agent-self-initiation-layer.md
git commit -m "docs: add along working thread records"
```

## Task 5: Update Continuity Record And Run Final Verification

**Files:**
- Modify: `docs/superpowers/notes/2026-06-15-living-presence-brainstorm-continuity.md`
- Test: `tests/skills/along-working-thread-skill.test.ts`

- [ ] **Step 1: Update the continuity record with implementation status**

Append or update this section near the existing formal spec status in `docs/superpowers/notes/2026-06-15-living-presence-brainstorm-continuity.md` after the skill files and Working Thread docs are in place:

```md
Implementation status:

- Repo-scoped Codex skill implemented under `.agents/skills/along-working-thread/`.
- Docs-backed Working Thread continuity implemented under `docs/along/working-threads/`.
- Verification completed with `npm test -- tests/skills/along-working-thread-skill.test.ts`, `npm run typecheck`, `npm run build`, and full `npm test`.
- V1 remains skill-first and does not include Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, background runtime, delegation, or write delegation.
- Next gate is subjective validation of real Codex sessions using the Working Thread skill.
```

- [ ] **Step 2: Run focused verification**

Run:

```bash
npm test -- tests/skills/along-working-thread-skill.test.ts
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

Expected: PASS. If this fails only because Express `listen` is blocked by sandbox permissions, rerun with escalation and record the escalated result.

- [ ] **Step 6: Check git status**

Run:

```bash
git status --short
```

Expected: only ignored/local runtime artifacts that should not be committed, such as `.superpowers/`, may remain untracked.

- [ ] **Step 7: Commit the continuity update and any final verification fixes**

```bash
git add docs/superpowers/notes/2026-06-15-living-presence-brainstorm-continuity.md
git commit -m "docs: record along skill-first implementation status"
```

## Self-Review Checklist

- Spec coverage:
  - Codex-first skill workflow is covered by Tasks 2 and 3.
  - Docs-backed continuity store is covered by Task 4.
  - Working Thread record shape is covered by Task 4 and tests in Task 1.
  - Start/resume, drift challenge, and wrap-up behavior are covered by Task 3.
  - Confirmation gates are covered by Task 3 and tests in Task 1.
  - Out-of-scope Core/MCP, plugin packaging, Hermes adapter, local/desktop presence, background runtime, and delegation are explicitly prohibited in skill docs and seed record.
- Completeness scan:
  - The plan uses concrete task instructions rather than incomplete markers.
  - Template text is concrete instructional text.
- Type consistency:
  - Test paths, skill paths, reference paths, and docs paths match across all tasks.
  - The test file reads every planned created file by exact path.

## Execution Handoff

Plan complete when this file is committed. Recommended execution mode is **Subagent-Driven**: one subagent per task, with main-session review after each task. Use Inline Execution only if the user wants this current session to implement directly.
