import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractMarkdownSection(markdown: string, heading: string): string {
  const marker = `${heading}\n`;
  const start = markdown.indexOf(marker);
  expect(start, heading).toBeGreaterThanOrEqual(0);

  const level = heading.match(/^#+/u)?.[0].length;
  if (level === undefined) throw new Error(`Expected Markdown heading: ${heading}`);
  const contentStart = start + marker.length;
  const nextHeading = new RegExp(`\\n#{1,${level}} \\S`, "gu");
  nextHeading.lastIndex = contentStart;
  const match = nextHeading.exec(markdown);
  return markdown.slice(contentStart, match?.index ?? markdown.length);
}

describe("Navi supervision contracts", () => {
  it("documents tightened drift behavior and bounded write-back rules", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    expect(reference).toContain("Ordinary / Low Drift");
    expect(reference).toContain("Medium Drift");
    expect(reference).toContain("High Drift");
    expect(reference).toContain("ordinary requests stay quiet");
    expect(reference).toContain("medium drift uses a light note and does not require confirmation");
    expect(reference).toContain("Before the user confirms the direction switch, do not plan the drifted direction.");
    expect(reference).toContain("I will treat this as future-direction exploration");
    expect(reference).toContain("I think this is a real direction switch.");
    expect(reference).toContain("Direction Switch Flow");
    expect(reference).toContain("Automatically draft a Working Thread update");
    expect(reference).toContain("Bounded Adaptive Write-Back");
    expect(reference).toContain("Different long-term problem");
    expect(reference).toContain("Do not add real model invocation tests");
  });

  it("documents Challenge Layer behavior and lightweight validation", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/challenge-v1.md");

    for (const expected of [
      "Challenge Layer",
      "Challenge Moment",
      "Challenge Brief",
      "anti-self-certification",
      "turn into validation",
    ]) {
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

  it("documents alpha 4 phase, validation, and parallel-work supervision", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");

    for (const expected of [
      "phase supervision",
      "verification budget",
      "stop criteria",
      "proactive decision signal",
      "parallel work supervision",
      "vision-distance",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Design: decide what to do, why, and what not to do",
      "Calibration: observe real or semi-real behavior without proving the whole system",
      "Implementation: make a bounded change for a confirmed problem",
      "Release: prepare an external version that users may rely on",
      "Closeout: record outcome, risks, and next steps without adding new validation loops",
      "Exploration: investigate future directions without committing to implementation",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Design mode does not need tests",
      "Implementation mode uses targeted tests around changed behavior",
      "Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks",
      "Closeout mode records the result and should not start a new validation loop",
      "continued validation will not change the current decision",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "task goal",
      "allowed edit scope",
      "allowed validation level",
      "forbidden escalations",
      "stop criteria",
      "expected return format",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "The main session should not default to waiting for every worktree",
      "wait only when the worktree result is blocking",
      "The result will change the current design direction",
      "The result is required before a merge, release, or irreversible decision",
      "The worktree discovered a blocking fact that invalidates the current assumption",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi should proactively surface signals when silence would cause loss of control",
      "The current stage has met its stop criteria",
      "Codex is exceeding the verification budget",
      "Work is drifting from design into implementation, or from implementation into release",
      "A write, commit, push, release, external-project edit, or destructive action needs approval",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "phase supervision",
      "verification budget",
      "proactive decision signals",
      "parallel work supervision",
      "vision-distance",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Alpha.4 supervision extends this from passive progress mapping to decision support",
      "whether to continue, stop, wait, approve, or move to the next phase",
      "without adding UI, runtime, memory, or automatic worktree orchestration",
    ]) {
      expect(readme).toContain(expected);
    }
  });

  it("documents alpha 5 pause semantics and decision-point stopping", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 5 Pause Semantics Layer",
      "Continue-Through Rule",
      "Decision-Point Stop Rule",
      "Pause Reason Rule",
      "No Local Completion Stop Rule",
      "Waiting Scope Rule",
      "When the next action, boundary, and acceptance point are already clear",
      "Navi should not stop simply because a sub-step finished",
      "successful file write or `git diff --check` pass",
      "writing to files when the current mode was read-only",
      "staging, committing, pushing, tagging, or releasing",
      "lane-level waiting from whole-session waiting",
      "When a review/merge lane needs a worktree result",
      "non-conflicting design, supervision, acceptance criteria, roadmap, or risk judgment",
      "Only stop the whole main session when every useful next step depends on the waiting result",
      "continuing would change the worktree scope, touch the same files, cross a mode boundary, or require a user decision",
      "Use the smallest useful intervention",
      "No map when the user says `continue` and the continuation boundary is already clear",
      "Next Decision Visibility Rule",
      "When Navi or Codex proactively stops",
      "No Hint",
      "One Default Recommendation",
      "Short Option Set",
      "the stop is already a clear approval gate",
      "after commit, push, merge, validation, or worktree handoff",
      "does not force a Progress Map",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents alpha 6 stage and vision supervision", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 6 Stage And Vision Supervision Layer",
      "Product Stage is a product-coordinate system",
      "not a waterfall process",
      "Product Definition covers what Navi is, what it is not",
      "User Supervision covers how Navi helps the user supervise Codex",
      "Project Integration covers how Navi enters and works inside real target projects",
      "Behavior Calibration covers whether Navi's behavior works in real or semi-real use",
      "Distribution & Trust covers how external users obtain, understand, verify, and rely on Navi",
      "Runtime Surface covers later product surfaces and long-term capabilities",
      "four primary Work Modes",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Vision Distance should be stage-relative",
      "Do not use percentages",
      "Silent Tracking is the default",
      "Light Signal should usually be one to three sentences",
      "Full Map when the user explicitly asks a broad orientation question",
      "The output should be the smallest useful intervention",
      "Product Stage affects what kind of next step is relevant",
      "Work Mode affects validation budget and allowed actions",
      "Vision Distance explains whether current work is enough for the stage",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
      "not a complete roadmap management system",
      "not an automatic project manager",
      "not runtime UI",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents alpha 7 coordination layer supervision", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 7 Coordination Layer",
      "Lane is a bounded stream of work",
      "Coordination Decision is the main-session judgment",
      "Main Lane",
      "Implementation Lane",
      "Calibration Lane",
      "Review / Merge Lane",
      "Release Lane",
      "External Lane",
      "Lane-level waiting means one stream cannot continue",
      "Whole-session blocked means no useful non-conflicting work remains",
      "continue main lane",
      "switch to review",
      "defer review",
      "pause for user decision",
      "Worktree Running Rule",
      "Worktree Completed Rule",
      "Conflict Rule",
      "Review / Merge Gate Rule",
      "External Wait Rule",
      "Next Decision Rule",
      "Alpha.7 answers",
      "How should the main session coordinate multiple lanes without losing user control?",
      "not automatic thread orchestration",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents alpha 8 decision handoff quality", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 8 Decision Handoff Quality",
      "Alpha.8 answers",
      "When Codex gives control back, is the next decision visible and useful?",
      "Completion is not always a handoff",
      "Handoff Outcome",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "Stop With Decision Rule",
      "One Clear Path Rule",
      "Real Branches Rule",
      "No Menu Inside Approved Boundary Rule",
      "Close Finished Lines Rule",
      "Blocked Means Actually Blocked Rule",
      "Mode-Sensitive Handoff Rule",
      "Silent Completion",
      "One-Sentence Handoff",
      "Short Decision Options",
      "Closure Note",
      "not a mandatory menu in every response",
      "not automatic implementation planning",
      "not automatic worktree creation",
      "not automatic commit, push, merge, tag, or release",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents alpha 11 lane closure next-decision handoff", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 11 Lane Closure Next-Decision Handoff",
      "Alpha.11 answers",
      "Lane closure is not automatically session closure",
      "lane-closure decision invisibility",
      "Is the next decision already visible to the user?",
      "Explicit Closure",
      "One Default Recommendation",
      "Short Real Options",
      "Approval Gate",
      "Blocked Reason",
      "Lane Closure Triggers",
      "Non-Trigger Cases",
      "Push completion is not automatic release preparation",
      "Documentation closeout is not design confirmation",
      "not a mandatory menu",
      "not automatic release preparation",
      "not a project manager or scheduler",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents alpha 12 quietness and rule density control", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/supervision-v1.md");

    for (const expected of [
      "## Alpha 12 Quietness And Rule Density Control",
      "Alpha.12 answers",
      "No control gain, no Navi surface",
      "Orientation Gain",
      "Decision Gain",
      "Boundary Gain",
      "Risk Gain",
      "Coordination Gain",
      "Quietness Ladder",
      "Must-Stay-Quiet Cases",
      "Must-Not-Stay-Quiet Cases",
      "Pseudo-Supervision",
      "Alpha.12 is not a runtime classifier",
      "Alpha.12 is not a new mandatory output format",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("defines one unified Codex Lane Handoff contract without adding a runtime", async () => {
    const [canonicalSkill, packagedSkill, canonicalReference, packagedReference] =
      await Promise.all([
        readRepoText(".agents/skills/navi/SKILL.md"),
        readRepoText("plugins/navi/skills/navi/SKILL.md"),
        readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
        readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
      ]);

    expect(packagedSkill).toBe(canonicalSkill);
    expect(packagedReference).toBe(canonicalReference);

    for (const field of [
      "NAVI_LANE_HANDOFF_EVENT",
      "version: 1",
      "event_id",
      "kind: decision-required | blocked | review-ready",
      "source_task",
      "source_lane",
      "goal",
      "summary",
      "evidence",
      "worktree_state",
      "declared_impact: lane-local | premise-changing",
    ]) {
      expect(canonicalReference).toContain(field);
    }

    for (const kindField of [
      "decision_needed",
      "recommendation",
      "continuation",
      "reason",
      "attempts",
      "commits",
      "changed_scope",
      "verification",
      "residual_risks",
    ]) {
      expect(canonicalReference).toContain(kindField);
    }

    for (const boundary of [
      "retry once immediately",
      "same event_id",
      "silently ignore duplicate",
      "delivery failed",
      "not authorization",
      "next natural checkpoint",
      "read-only parent review",
      "strictly bounded remediation",
      "Do not send a routine acknowledgement",
    ]) {
      expect(canonicalReference).toContain(boundary);
    }

    expect(canonicalReference).toMatch(
      /later meaningful transition[\s\S]*new event_id[\s\S]*second `?review-ready`? after bounded remediation[\s\S]*new review cycle/i,
    );

    for (const nonEvent of [
      "ordinary progress",
      "routine waiting",
      "test passing",
      "local task commit",
      "running child",
    ]) {
      expect(canonicalReference).toContain(nonEvent);
    }

    expect(canonicalSkill).toContain("references/lane-handoff-v1.md");
    expect(canonicalReference).toMatch(
      /not a background process[\s\S]*durable queue[\s\S]*Supervisor Inbox/i,
    );
    expect(canonicalReference).not.toMatch(
      /start a background process|create a durable queue|open a Supervisor Inbox/i,
    );
  });

  it("requires a V1 wire-format conformance check before Lane Handoff delivery", async () => {
    const references = await Promise.all([
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/lane-handoff-v1.md"),
    ]);

    for (const reference of references) {
      const wireCheck = extractMarkdownSection(
        reference,
        "## Pre-Send Wire-Format Check",
      );

      expect(wireCheck).toMatch(
        /payload must begin exactly with `NAVI_LANE_HANDOFF_EVENT`/i,
      );
      expect(wireCheck).toMatch(/bare plain text[\s\S]*no XML\/Markdown wrapper/i);
      expect(wireCheck).toMatch(/exact field names only[\s\S]*no aliases/i);
      expect(wireCheck).toMatch(/source_task_id[\s\S]*source_lane_id[\s\S]*commit/i);
      expect(wireCheck).toMatch(
        /all common fields[\s\S]*all fields required for the selected kind[\s\S]*before sending/i,
      );
      expect(wireCheck).toMatch(
        /malformed payload[\s\S]*not a valid delivery[\s\S]*same transition[\s\S]*same event_id/i,
      );
    }
  });

  it("routes review readiness through Lane Handoff without claiming background delivery", async () => {
    const [skill, projectMap, laneHandoff, packagedProjectMap] =
      await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/project-map-v1.md"),
    ]);

    const parallel = extractMarkdownSection(
      projectMap,
      "### Parallel Work And Review Readiness",
    );

    expect(packagedProjectMap).toBe(projectMap);
    expect(parallel).toMatch(/review-ready[\s\S]*Lane Handoff[\s\S]*natural checkpoint/i);
    expect(parallel).toMatch(/continue[\s\S]*non-conflicting/i);
    expect(skill).toContain("references/lane-handoff-v1.md");
    expect(laneHandoff).toMatch(/task-to-task coordination[\s\S]*not a background/i);
  });
});
