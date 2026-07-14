import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderAgentsBlock } from "../../src/cli/navi-init";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

async function repoPathExists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function listRepoFiles(relativeDir: string): Promise<string[]> {
  const root = path.join(repoRoot, relativeDir);

  async function walk(currentDir: string, prefix: string): Promise<string[]> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(currentDir, entry.name);
        const relativePath = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
          return walk(entryPath, relativePath);
        }

        return [relativePath.split(path.sep).join("/")];
      }),
    );

    return nested.flat().sort();
  }

  return walk(root, "");
}

function extractFrontmatter(markdown: string): string {
  expect(markdown.startsWith("---\n")).toBe(true);

  const end = markdown.indexOf("\n---", 4);
  expect(end).toBeGreaterThan(4);

  return markdown.slice(4, end);
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

async function parseWithPyYaml(source: string): Promise<Record<string, unknown>> {
  const script = [
    "import json",
    "import sys",
    "import yaml",
    "payload = yaml.safe_load(sys.stdin.read())",
    "if not isinstance(payload, dict):",
    "    raise SystemExit('frontmatter must parse to a mapping')",
    "print(json.dumps(payload))",
  ].join("\n");

  return new Promise((resolve, reject) => {
    const child = spawn("python3", ["-c", script], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `python3 exited with code ${code}`));
        return;
      }
      resolve(JSON.parse(stdout) as Record<string, unknown>);
    });
    child.stdin.end(source);
  });
}

describe("Along Working Thread Codex skill", () => {
  it("uses plugin-validator-compatible YAML frontmatter", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const frontmatter = extractFrontmatter(skill);

    const parsed = await parseWithPyYaml(frontmatter);

    expect(parsed.name).toBe("navi");
    expect(parsed.description).toEqual(
      "Use when any active Codex project needs Navi supervision for non-expert progress, next-step, stop, wait, approval, coordination, or vision-distance confusion.",
    );
    expect(parsed.description).toEqual(expect.stringContaining("any active Codex project"));
    expect(parsed.description).toEqual(expect.stringContaining("Navi supervision"));
    expect(parsed.description).toEqual(expect.stringContaining("non-expert progress"));
    expect(parsed.description).toEqual(expect.stringContaining("vision-distance confusion"));
    expect(parsed.description).not.toEqual(expect.stringContaining("Use in the Along project"));
  });

  it("defines a repo-scoped skill with explicit V1 boundaries", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const metadata = await readRepoText(".agents/skills/navi/agents/openai.yaml");

    expect(skill).toContain("name: navi");
    expect(skill).toContain("description:");
    expect(skill).toContain("turn-bound self-initiation");
    expect(skill).toContain("must not silently create");
    expect(skill).toContain("must not silently write");
    expect(skill).toContain("background runtime");
    expect(skill).toContain("references/working-thread-v1.md");
    expect(metadata).toContain("display_name: Navi");
    expect(metadata).toContain("broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability");
    expect(metadata).toContain("keep narrow tasks quiet");
    expect(metadata).toContain("allow_implicit_invocation: true");
  });

  it("documents the V1 workflow, drift levels, and confirmation gates", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

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

  it("defines the global bootstrap handoff boundary", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(
      ".agents/skills/navi/references/working-thread-v1.md",
    );

    for (const text of [skill, reference]) {
      expect(text).toContain("global bootstrap");
      expect(text).toContain("project-local Navi guidance");
      expect(text).toContain("best-effort read-only supervision");
      expect(text).toContain("do not repeat the init reminder in the same session");
      expect(text).toContain("prompt-backed, not a runtime interceptor");
    }
  });

  it("documents tightened drift behavior and bounded write-back rules", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    expect(skill).toContain("ordinary requests stay quiet");
    expect(skill).toContain("Do not plan the drifted direction before user confirmation");
    expect(skill).toContain("automatically draft a Working Thread update");
    expect(skill).toContain("bounded adaptive write-back");

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

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

  it("documents Navi Progress Map behavior for non-expert users", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

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
    for (const expected of [
      "stable target-project overall progress bar",
      "current-stage sub-progress bar",
      "Do not generate a new overall progress bar every time.",
      "Do not hardcode Navi's own stages when the user is asking about a different target project.",
      "If no stable project-level stage sequence exists yet",
      "Fresh sessions should prioritize accuracy over immediate orientation",
      "inspect the source-of-truth before outputting the Progress Map",
      "Do not guess a temporary stage bar just to answer faster.",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("stable target-project overall progress bar");
    expect(skill).toContain("current-stage sub-progress bar");
    expect(skill).toContain("installed, active Codex project");
    expect(skill).toContain("Do not limit Navi Progress Map triggers to the Along repository");
    expect(reference).toContain("Challenge Moment becomes the escalation behavior when the map reveals risk");
    expect(reference).toContain("Navi helps the user supervise whether the agent's professional judgment is reliable enough to continue.");
    expect(reference).toContain("claim it can automatically decide the final correct answer in every domain");
    expect(reference).toContain("replace legal, medical, financial, engineering, or other high-risk professional responsibility");
  });

  it("documents alpha 4 phase, validation, and parallel-work supervision", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");
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
      "stop, wait, approve, continue, or ask how far the current work is from the original goal",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.5 pause semantics",
      "continue inside a bounded, already-approved loop",
      "stop at decisions the user can actually judge",
      "lane-level waiting",
      "whole-session waiting",
      "Do not treat a waiting worktree, external review, or background track as a reason to stop the whole main session",
      "continue non-conflicting design, supervision, acceptance-criteria, roadmap, or risk work",
      "Only make the whole session wait when all useful next steps depend on the result",
      "continue to the already-defined acceptance point",
      "Do not stop just because a local sub-step finished",
      "explain the pause reason",
      "Next Decision Visibility",
      "smallest useful next-decision hint",
      "no visible next decision except `continue`",
      "valid stop can still create continuation friction",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.6 stage-and-vision supervision",
      "Product Stage",
      "Work Mode",
      "Vision Distance",
      "Silent Tracking",
      "Light Signal",
      "Full Map",
      "Product Definition",
      "User Supervision",
      "Project Integration",
      "Behavior Calibration",
      "Distribution & Trust",
      "Runtime Surface",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.7 coordination layer",
      "Coordination Layer",
      "lane-level waiting",
      "whole-session blocked",
      "main session can continue non-conflicting work",
      "completed worktree should create a review option",
      "not an automatic whole-session interruption",
      "Review / Merge is a workflow lane",
      "Release Lane requires explicit user approval",
      "Do not force lane tables into ordinary answers",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.8 decision handoff quality",
      "Completion is not always a handoff",
      "Stop with a decision, a recommendation, or closure",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "bare completion report",
      "real next decision",
      "do not include bare `continue` as a fake option",
      "No Menu Inside Approved Boundary",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.11 lane closure handoff",
      "Lane closure is not automatically session closure",
      "lane-closure decision invisibility",
      "smallest useful next-decision signal",
      "explicit closure",
      "one default recommendation",
      "short real options",
      "approval gate",
      "blocked reason",
      "Push completion is not automatic release preparation",
      "Documentation closeout is not design confirmation",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Alpha.12 quietness gate",
      "No control gain, no Navi surface",
      "Control gain means Navi changes what the user can understand, decide, stop, approve, or redirect.",
      "Use the lightest sufficient surface",
      "Silent Direct Answer",
      "Embedded Hint",
      "One-Sentence Handoff",
      "Short Options",
      "Full Map",
      "narrow status questions",
      "clear chained instructions",
      "approved bounded loops",
      "lightweight design confirmations",
      "fake branches",
      "pseudo-supervision",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }

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

  it("documents alpha 13 global install versus project initialization boundary", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const initDoc = await readRepoText("docs/navi/project-init.md");

    for (const expected of [
      "Navi is installed globally once",
      "navi init initializes a target project",
      "does not install Navi again",
      "project-local initialization is the reliable path",
    ]) {
      expect(skill).toContain(expected);
      expect(reference).toContain(expected);
      expect(initDoc).toContain(expected);
    }

    expect(skill).not.toContain("navi init --suggest-map --accept-suggested-map");
  });

  it("documents the confirmed Navi Project Map model and evidence rules", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "Project Map",
      ".navi/project-map.md",
      "navi_map: 1",
      "map_status: confirmed",
      "Desired Outcome",
      "Route To Outcome",
      "Current Position",
      "Current Boundary",
      "Next Decision",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "user-confirmed Map",
      "Existing project roadmaps are evidence",
      "not alternate Map paths",
      "must not be represented as a stored or stable Map",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("confirmed `.navi/project-map.md`");
    expect(reference).toContain("Stale Or Conflicting Evidence");
    expect(reference).not.toContain("docs/along/project-maps/");
  });

  it("ships a confirmed Project Map record for the current Navi test project", async () => {
    expect(await repoPathExists("docs/along/project-maps/README.md")).toBe(true);
    expect(await repoPathExists("docs/along/project-maps/navi-current-test-project.md")).toBe(true);

    const readme = await readRepoText("docs/along/project-maps/README.md");
    const naviMap = await readRepoText("docs/along/project-maps/navi-current-test-project.md");

    for (const expected of [
      "confirmed Project Map",
      "Do not rewrite `overall_stages` without user confirmation.",
      "current-stage sub-progress",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "# Navi Current Test Project Map",
      "map_status: confirmed",
      "source: user-confirmed current Navi test project map",
      "[问题定义] -> [行为设计] -> [文档写入] -> [新会话验证] -> [真实使用校准] -> [稳定产品行为]",
      "current_overall_stage: 稳定产品行为",
      "Do not rename, remove, merge, split, or reorder `overall_stages` without explicit user confirmation.",
      "local concerns, fixes, retests, pushes, and fresh-session checks must stay in `sub_progress`",
      "V1 docs-backed skill behavior is stable enough to use as the baseline",
    ]) {
      expect(naviMap).toContain(expected);
    }
  });

  it("documents compact horizontal rendering and mandatory current-position explanation", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "compact horizontal progress strip",
      "single-line stage strip",
      "Do not split the overall stage sequence across multiple lines",
      "[需求澄清] -> [方案比较] -> [原型设计]",
      "▲",
      "The strip answers \"where am I\"",
      "the explanation answers \"what does this position mean\"",
      "Every current position must be followed by a plain-language explanation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("compact horizontal progress strip");
    expect(skill).toContain("single-line stage strip");
    expect(skill).toContain("plain-language explanation");
  });

  it("documents two-layer map defaults and local-only exceptions", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");

    const normalizedReference = reference.toLowerCase();
    const normalizedSkill = skill.toLowerCase();
    const normalizedReadme = readme.toLowerCase();

    for (const expected of [
      "overall map first",
      "sub-progress must not be shown alone for orientation prompts",
      "current-stage internal progress is the second layer",
      "Only show current-stage internal progress alone when the user explicitly asks about a local task",
      "or when the stable overall map was just shown and has not changed",
    ]) {
      expect(normalizedReference).toContain(expected.toLowerCase());
    }

    for (const expected of [
      "overall map first",
      "sub-progress must not be shown alone",
      "local-only progress questions may use the current-stage internal strip by itself",
    ]) {
      expect(normalizedSkill).toContain(expected.toLowerCase());
      expect(normalizedReadme).toContain(expected.toLowerCase());
    }
  });

  it("documents Navi Rhythm Map behavior for flowing projects", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running project",
      "recurring daily, weekly, or periodic actions",
      "multiple parallel opportunities, routes, targets, or stakeholders",
      "external feedback that controls the next step",
      "repeated loops of refresh, screen, prepare, wait, follow up, and decide",
      "ongoing stewardship rather than one fixed deliverable",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "project shape",
      "whole long-running project",
      "bounded subtask",
      "linear subtask strip",
      "pick the narrowest useful map",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi should choose a Rhythm Map instead of forcing a one-way overall progress bar",
      "Rhythm Map",
      "flowing projects",
      "specific bounded subtask",
    ]) {
      expect(skill).toContain(expected);
    }
  });

  it("documents Rhythm Map rendering, examples, and downgrade behavior", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "项目节奏",
      "[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]",
      "当前主线",
      "[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]",
      "This map does not express completion percentage.",
      "what the user must confirm",
      "where continuing will lead",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Internship Project",
      "[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]",
      "[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]",
      "status changes require evidence such as email, portal state, or screenshots",
      "material customization should wait until a specific target job is selected",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Hong Kong Application Project",
      "[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]",
      "[申请表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]",
      "[预检] -> [填表] -> [附件核对] -> [最终确认] -> [提交后记录]",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents prompt-language following for Progress and Rhythm Maps", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "default response language should follow the user's current prompt",
      "Project records written in another language do not by themselves decide the response language",
      "English orientation prompts such as `what's next`, `where are we`, or `continue` should produce English map headings",
      "translate or bilingualize source stage labels",
      "Chinese orientation prompts should still allow Chinese headings",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Match the Navi map response language to the user's current prompt by default.",
      "English prompts such as `what's next`, `where are we`, or `continue` should use English map headings",
      "Chinese prompts should still allow Chinese headings and explanations.",
    ]) {
      expect(skill).toContain(expected);
      expect(template).toContain(expected);
    }
  });

  it("documents source classification for non-code flowing workspaces", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "project-local handoff files",
      "session logs",
      "PROJECT_STATE",
      "TODO",
      "trackers",
      "workflow records",
      "valid project records",
      "Do not treat project-local handoff files as forbidden source-thread history",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Application, recruiting, outreach, research, and operations workspaces can be flowing projects",
      "Do not downgrade them to ordinary advice just because they are not software projects.",
      "When a user asks `接下来我们应该做什么？` in a Hong Kong application-style project",
      "should produce a Rhythm Map",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("project-local handoff files");
    expect(skill).toContain("Do not downgrade non-code long-running workspaces to ordinary advice");
  });

  it("documents project-local Navi trigger sources and reusable template", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");

    for (const expected of [
      "Project-Local Navi Trigger Source",
      "Do not rely only on global skill auto-routing",
      "project-local trigger source",
      "AGENTS.md",
      "project-local trigger source is a reliability layer",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Project-local Navi trigger source",
      "docs/navi/project-trigger-template.md",
      "global skill auto-routing can be inconsistent",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "# Navi Project Trigger Template",
      "Paste this into the target project's `AGENTS.md`",
      "When the user asks about project progress, next steps, whether to continue, or says they do not understand the current state",
      "first give a compact Navi map before ordinary task advice",
      "项目节奏",
      "当前主线",
      "If the user gives a clear execution command with the next action, boundary, and acceptance point already established",
      "Read-only checks of task files, status files, tracker rows, spreadsheet rows, today's items, a known file, or a specific record are ordinary clear tasks",
      "do not output a Progress Map or Rhythm Map",
      "keep Navi quiet",
    ]) {
      expect(template).toContain(expected);
    }
  });

  it("documents Navi project initialization as the reliable configuration path", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");
    const initDoc = await readRepoText("docs/navi/project-init.md");

    for (const expected of [
      "Navi Project Initialization",
      "configure Navi for a target project",
      "global skill plus the managed project-local trigger",
      "asks for user confirmation before writing durable project files",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi project initialization",
      "docs/navi/project-init.md",
      "guided confirmed baseline",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "# Navi Project Initialization",
      "One Preview And One Approval",
      "AGENTS.md",
      ".navi/project-map.md",
      "Guided Baseline Formation",
      "`navi init` configures a target project",
      "does not install Navi again",
      "Fresh-Session Validation",
    ]) {
      expect(initDoc).toContain(expected);
    }

    expect(reference).not.toContain("install Navi into a target project");
    expect(initDoc).not.toContain("Minimum install output");
  });

  it("documents uncertain evidence without creating a provisional Map", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    for (const expected of [
      "missing, invalid, unsupported, or stale Map",
      "best-effort read-only supervision",
      "must not be represented as a stored or stable Map",
      "do not invent a stable map",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("missing, invalid, unsupported, or stale Map");
    expect(skill).not.toContain("provisional map");
  });

  it("documents graphical progress bar validation in the package README", async () => {
    const readme = await readRepoText("plugins/navi/README.md");

    for (const expected of [
      "Project Map",
      "stable target-project stage sequence",
      "compact horizontal progress strip",
      "single-line stage strip",
      "Project Map source priority",
      ".navi/project-map.md",
      "must not draw a confident stable bar",
    ]) {
      expect(readme).toContain(expected);
    }
  });

  it("documents Rhythm Map validation in the package README and version boundary", async () => {
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running projects",
      "weekly refresh",
      "daily preparation",
      "waiting for external feedback",
      "decision gate",
      "should not force a one-way overall progress bar",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "internship-style project",
      "Hong Kong application-style project",
      "whole long-running project",
      "bounded subtask",
    ]) {
      expect(readme).toContain(expected);
    }

    expect(version).toContain("Progress/Rhythm Maps and Challenge Layer are the current V1 alpha mechanisms");
    expect(version).toContain("documentation-only behavior update");
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
    expect(record).toContain("Skill Behavior Tightening Pass");
    expect(record).toContain("high-impact drift confirmation");
    expect(record).toContain("Do not build a new standalone Along agent");
    expect(record).toContain("Do not expand the completed Minimal Server V1");
    expect(record).toContain("Do not turn plugin packaging into a broad productization effort");
    expect(record).toContain("personal local plugin first");
  });
});

describe("Along Working Thread repo-contained plugin package", () => {
  it("uses the Navi package identity and source marketplace catalog", async () => {
    const canonicalSkillRoot = path.join(repoRoot, ".agents", "skills", "navi");
    const pluginRoot = path.join(repoRoot, "plugins", "navi");
    const packagedSkillRoot = path.join(pluginRoot, "skills", "navi");

    const [canonicalSkill, packagedSkill, manifestSource, marketplaceSource] = await Promise.all([
      fs.readFile(path.join(canonicalSkillRoot, "SKILL.md"), "utf8"),
      fs.readFile(path.join(packagedSkillRoot, "SKILL.md"), "utf8"),
      fs.readFile(path.join(pluginRoot, ".codex-plugin", "plugin.json"), "utf8"),
      fs.readFile(path.join(repoRoot, ".agents", "plugins", "marketplace.json"), "utf8"),
    ]);
    const canonicalFrontmatter = await parseWithPyYaml(extractFrontmatter(canonicalSkill));
    const packagedFrontmatter = await parseWithPyYaml(extractFrontmatter(packagedSkill));
    const pluginManifest = JSON.parse(manifestSource) as { name: string };
    const marketplace = JSON.parse(marketplaceSource) as {
      name: string;
      plugins: Array<{
        name: string;
        source: { source: string; path: string };
        policy: { installation: string; authentication: string };
        category: string;
      }>;
    };

    expect(canonicalFrontmatter.name).toBe("navi");
    expect(packagedFrontmatter.name).toBe("navi");
    expect(pluginManifest.name).toBe("navi");
    expect(marketplace.name).toBe("navi-source");
    expect(marketplace.plugins).toEqual([
      expect.objectContaining({
        name: "navi",
        source: { source: "local", path: "./plugins/navi" },
        policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
        category: "Productivity",
      }),
    ]);
  });

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

  it("documents the current Navi-first public narrative in the root README", async () => {
    const readme = await readRepoText("README.md");

    for (const expected of [
      "Navi helps non-expert users understand, supervise, and steer expert agents.",
      "Navi is an independent open-source product for supervising expert agents.",
      "Current main branch behavior includes Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance.",
      "Latest tagged GitHub source release:",
      "Current main branch:",
      "This alpha is a GitHub source package",
      "Codex skill/plugin behavior",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "navi init --expect-plan <fingerprint> --write",
      "Navi shows where the project is, what is missing, whether to continue, when to stop, how much validation is enough, and whether parallel work should wait or continue.",
      "Along is the parent/lab context and broader long-term product family.",
      "should be understandable without knowing Along",
      "Current installation, discovery, and project triggers use Navi identifiers only.",
      "legacy installation identifier",
      "explicit doctor-guided migration",
      "MCP, runtime, local app, background presence",
      "older Along companion ideas",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi is Along's current V1 product surface",
      "Navi's V1 alpha behavior centers on **Progress/Rhythm Maps** and **Challenge Layer** behavior",
      "`0.1.0-alpha.3` is ready as the latest GitHub source release",
    ]) {
      expect(readme).not.toContain(forbidden);
    }

    const promiseIndex = readme.indexOf("Navi helps non-expert users understand, supervise, and steer expert agents.");
    const alongIndex = readme.indexOf("Along is the parent/lab context");
    const compatibilityIndex = readme.indexOf(
      "Current installation, discovery, and project triggers use Navi identifiers only.",
    );

    expect(promiseIndex).toBeGreaterThanOrEqual(0);
    expect(alongIndex).toBeGreaterThan(promiseIndex);
    expect(compatibilityIndex).toBeGreaterThan(alongIndex);
  });

  it("keeps the Chinese README aligned with the public narrative system", async () => {
    const readme = await readRepoText("README.zh-CN.md");

    for (const expected of [
      "Navi 帮助非专家用户理解、监督并引导 expert agents。",
      "Navi 是一个独立的开源产品，用于监督 expert agents。",
      "当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。",
      "最新 tagged GitHub source release：",
      "当前 main branch：",
      "这个 alpha 是 GitHub source package",
      "Codex skill/plugin 行为",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。",
      "Along 是 parent/lab context 和更长期的产品家族。",
      "不应该要求读者先理解 Along 才能理解 Navi",
      "当前 installation、discovery 和 project triggers 只使用 Navi identifiers。",
      "legacy installation identifier",
      "doctor-guided migration",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi 是这个愿景中的第一个独立 V1 产品表面。",
      "`0.1.0-alpha.3` 是当前面向开发者和早期测试者的最新 GitHub source release。",
    ]) {
      expect(readme).not.toContain(forbidden);
    }
  });

  it("documents the source-alpha setup and project-init boundary", async () => {
    const [englishReadme, chineseReadme, packageReadme, initDoc, debt] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
      readRepoText("docs/along/project-maps/navi-project-init.md"),
      readRepoText("docs/along/navi-product-debt.md"),
    ]);

    for (const readme of [englishReadme, chineseReadme, packageReadme]) {
      for (const expected of [
        "npm link",
        "navi doctor",
        "navi setup",
        "navi setup --write",
        "navi init",
        "navi init --expect-plan <fingerprint> --write",
      ]) {
        expect(readme).toContain(expected);
      }
    }

    expect(englishReadme).toContain("Setup once -> approve project init once -> use natural language");
    for (const expected of [
      "explicit",
      "does not initialize a target project",
      "does not reinstall the plugin",
      "not a normal daily step",
      "npm/marketplace/one-click installation remains out of scope",
      "`src/web` is not the Navi alpha UI",
    ]) {
      expect(englishReadme).toContain(expected);
      expect(packageReadme).toContain(expected);
    }
    expect(chineseReadme).toContain("全局 setup 一次 -> 每个项目批准 init 一次 -> 之后使用自然语言");
    for (const expected of [
      "用户明确执行的 source-alpha 操作",
      "不会初始化目标项目",
      "不会重新安装 plugin",
      "不是日常步骤",
      "公开 npm/marketplace/一键安装仍不在范围内",
      "`src/web` 不是 Navi alpha UI",
    ]) {
      expect(chineseReadme).toContain(expected);
    }
    expect(initDoc).toContain("navi setup = global first-use discovery");
    expect(initDoc).toContain("navi init = one target project's reliable guidance");
    expect(initDoc).toContain("may run `navi init --write` only after explicit user approval");
    expect(debt).toContain("Source-alpha bootstrap is implemented");
    expect(debt).toContain("Public distribution remains open");
  });

  it("documents one guided confirmed-map initialization journey in every active setup document", async () => {
    const activePaths = [
      "README.md",
      "README.zh-CN.md",
      "plugins/navi/README.md",
      "docs/navi/project-init.md",
    ];

    for (const activePath of activePaths) {
      const exists = await repoPathExists(activePath);
      expect(exists, activePath).toBe(true);
      if (!exists) continue;
      const document = await readRepoText(activePath);
      for (const expected of [
        "global setup once",
        "guided confirmed baseline",
        "one trigger + `.navi/project-map.md` preview",
        "one approved project init write",
        "fresh-session natural-language supervision",
      ]) {
        expect(document.toLowerCase()).toContain(expected.toLowerCase());
      }

      for (const forbidden of [
        "starter map",
        "provisional map",
        ".navi/state.md",
        "docs/along/project-maps/",
      ]) {
        expect(document.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it("documents only fingerprint-bound actionable init writes in active READMEs", async () => {
    const activeReadmes = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const readme of activeReadmes) {
      expect(readme).not.toMatch(/\bnavi init --write(?=[`.;,\s]|$)/u);

      expect(readme).toContain("Existing confirmed Map trigger path");
      expect(readme).toMatch(/^navi init$/mu);
      expect(readme).toMatch(/^navi init --expect-plan <fingerprint> --write$/mu);

      expect(readme).toContain("Fresh confirmed Map candidate path");
      expect(readme).toContain("Codex-guided candidate flow");
      expect(readme).toContain("advanced/internal integration detail");
      expect(readme).toMatch(
        /^navi init --map-file <confirmed-map-candidate>$/mu,
      );
      expect(readme).toMatch(
        /^navi init --map-file <confirmed-map-candidate> --expect-plan <fingerprint> --write$/mu,
      );
    }
  });

  it("keeps the active trigger template exactly aligned with generated init output", async () => {
    const exists = await repoPathExists("docs/navi/project-trigger-template.md");
    expect(exists).toBe(true);
    if (!exists) return;
    const template = await readRepoText("docs/navi/project-trigger-template.md");

    expect(template).toBe(`${renderAgentsBlock()}\n`);
  });

  it("marks the alpha 13 and alpha 14 directions as superseded historical evidence", async () => {
    const historicalSpecs = await Promise.all([
      readRepoText(
        "docs/superpowers/specs/2026-07-09-navi-alpha13-project-initialization-suggested-map-preview-design.md",
      ),
      readRepoText(
        "docs/superpowers/specs/2026-07-10-navi-alpha14-project-state-snapshot-design.md",
      ),
    ]);

    for (const spec of historicalSpecs) {
      expect(spec).toMatch(/^# .+\n\n> \*\*Superseded:\*\*/u);
      expect(spec).toContain("confirmed Project Map initialization journey");
      expect(spec).toContain(
        "2026-07-13-navi-confirmed-project-map-init-journey-design.md",
      );
      expect(spec).toContain("retained as historical design evidence");
    }
  });

  it("documents the Navi-only source installation and explicit legacy migration path", async () => {
    const [englishReadme, chineseReadme, packageReadme, initDoc, debt] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
      readRepoText("docs/along/project-maps/navi-project-init.md"),
      readRepoText("docs/along/navi-product-debt.md"),
    ]);

    for (const readme of [englishReadme, chineseReadme, packageReadme]) {
      for (const expected of [
        'codex plugin marketplace add "$PWD"',
        "codex plugin add navi@navi-source",
        "npm link",
        "navi doctor",
        "navi setup",
        "navi setup --write",
      ]) {
        expect(readme).toContain(expected);
      }
    }

    for (const expected of [
      "navi setup --remove",
      "navi setup --remove --write",
      "codex plugin remove navi@navi-source",
      "codex plugin marketplace remove navi-source",
      "npm unlink -g navi",
      "global Codex/plugin/npm state",
    ]) {
      expect(englishReadme).toContain(expected);
      expect(packageReadme).toContain(expected);
    }

    expect(chineseReadme).toContain("全局 Codex/plugin/npm 状态");
    expect(initDoc).toContain("legacy-only");
    expect(initDoc).toContain("dual-install");
    expect(initDoc).toContain("navi doctor");
    expect(debt).toContain("navi@navi-source");
    expect(debt).toContain("legacy migration");

    for (const primaryInstallDoc of [englishReadme, chineseReadme, packageReadme]) {
      expect(primaryInstallDoc).not.toContain("codex plugin add along-working-thread");
    }
    expect(packageReadme).not.toContain("Navi is the current V1 product surface of Along.");
  });

  it("gives every active README the same ordered legacy migration sequence", async () => {
    const readmes = await Promise.all([
      readRepoText("README.md").then((text) => ({ text, marker: "Use this exact sequence", targetValidation: "validate the target project" })),
      readRepoText("README.zh-CN.md").then((text) => ({ text, marker: "两种诊断都使用同一顺序", targetValidation: "验证目标项目" })),
      readRepoText("plugins/navi/README.md").then((text) => ({ text, marker: "Use this exact sequence", targetValidation: "validate the target project" })),
    ]);

    for (const { text, marker, targetValidation } of readmes) {
      const readme = text.slice(text.indexOf(marker));
      const migrationActions = [
        "navi@navi-source",
        "navi init",
        "navi init --expect-plan <fingerprint> --write",
        targetValidation,
        "legacy selector",
        "navi doctor",
        "navi setup",
      ];
      let priorIndex = -1;
      for (const action of migrationActions) {
        const index = readme.indexOf(action);
        expect(index).toBeGreaterThan(priorIndex);
        priorIndex = index;
      }
    }
  });

  it("documents shipped navi init scope in debt and roadmap docs", async () => {
    const debt = await readRepoText("docs/along/navi-product-debt.md");
    const roadmap = await readRepoText("docs/along/roadmaps/navi-post-alpha-roadmap.md");

    for (const expected of [
      "Status: confirmed-Map initialization addressed; calibration and public distribution open",
      "Source-alpha bootstrap is implemented",
    ]) {
      expect(debt).toContain(expected);
    }

    for (const expected of [
      "Calibrate the confirmed-Map init journey",
      "Global plugin installation, one-click sync, npm distribution, or marketplace installation",
    ]) {
      expect(roadmap).toContain(expected);
    }
  });

  it("ships the minimal repo-contained plugin package layout and manifest", async () => {
    for (const requiredPath of [
      "plugins/navi/.codex-plugin/plugin.json",
      "plugins/navi/README.md",
      "plugins/navi/VERSION.md",
      "plugins/navi/skills/navi/SKILL.md",
      "plugins/navi/skills/navi/agents/openai.yaml",
      "plugins/navi/skills/navi/references/working-thread-v1.md",
    ]) {
      expect(await repoPathExists(requiredPath), requiredPath).toBe(true);
    }

    const manifest = JSON.parse(
      await readRepoText("plugins/navi/.codex-plugin/plugin.json"),
    ) as {
      name: string;
      version: string;
      description: string;
      skills: string;
      author: { name: string };
      keywords: string[];
      interface: {
        displayName: string;
        shortDescription: string;
        longDescription: string;
        developerName: string;
        category: string;
        capabilities: string[];
        defaultPrompt: string[];
      };
    };

    expect(manifest.name).toBe("navi");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.author.name).toBe("Navi Contributors");
    expect(manifest.description).toContain("Working Thread continuity");
    expect(manifest.keywords).toEqual(
      expect.arrayContaining(["along", "working-thread", "continuity", "codex", "self-initiation"]),
    );
    expect(manifest.interface.displayName).toBe("Navi");
    expect(manifest.interface.developerName).toBe("Navi Contributors");
    expect(manifest.interface.shortDescription).toBe(
      "Project progress, next-step, stop/wait, and plan-reliability guidance.",
    );
    expect(manifest.interface.longDescription).toContain("turn-bound self-initiation");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.category).toBe("Productivity");
    expect(manifest.interface.capabilities).toContain("Interactive");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Show where this project stands, what comes next, and what I need to decide.",
      "Should we continue, stop, wait, or move to the next stage?",
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    ]);
    expect(manifest.interface.defaultPrompt).toHaveLength(3);
    expect(manifest.name).toBe("navi");
    expect(manifest.interface.longDescription).not.toContain("legacy skill id remains along-working-thread");
    const formerDeveloperName = ["Ja", "mes"].join("");
    expect(JSON.stringify(manifest)).not.toContain(formerDeveloperName);

    for (const forbiddenPath of [
      "plugins/navi/.mcp.json",
      "plugins/navi/.app.json",
      "plugins/navi/hooks",
      "plugins/navi/assets",
      "plugins/navi/dist",
    ]) {
      expect(await repoPathExists(forbiddenPath), forbiddenPath).toBe(false);
    }
  });

  it("positions the package as a Challenge Layer without expanding runtime scope", async () => {
    const manifest = JSON.parse(
      await readRepoText("plugins/navi/.codex-plugin/plugin.json"),
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
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");

    expect(manifest.version).toBe("0.1.0");
    expect(manifest.description).toContain("Challenge Layer");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["challenge-layer", "validation"]));
    expect(manifest.interface.longDescription).toContain("Challenge Moment");
    expect(manifest.interface.longDescription).toContain("not background autonomy");

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

  it("documents Navi entry routing in agent metadata without forcing ordinary requests", async () => {
    const agentMetadata = await readRepoText(
      "plugins/navi/skills/navi/agents/openai.yaml",
    );

    expect(agentMetadata).toContain("broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability");
    expect(agentMetadata).toContain("keep narrow tasks quiet");
    expect(agentMetadata).toContain("allow_implicit_invocation: true");
  });

  it("keeps package metadata aligned with Navi public narrative", async () => {
    const packageJson = JSON.parse(await readRepoText("package.json")) as {
      description: string;
      private: boolean;
    };
    const canonicalMetadata = await readRepoText(".agents/skills/navi/agents/openai.yaml");
    const pluginMetadata = await readRepoText(
      "plugins/navi/skills/navi/agents/openai.yaml",
    );

    expect(packageJson.private).toBe(true);
    expect(packageJson.description).toContain(
      "Navi helps non-expert users understand, supervise, and steer expert agents",
    );
    expect(packageJson.description).toContain("maps, challenge, pause, stage/vision, and coordination guidance");

    for (const metadata of [canonicalMetadata, pluginMetadata]) {
      expect(metadata).toContain("broad project progress, next-step, stop/wait, continue, confusion, or plan-reliability");
      expect(metadata).toContain("keep narrow tasks quiet");
      expect(metadata).toContain("allow_implicit_invocation: true");
      expect(metadata.length).toBeLessThan(700);
    }
  });

  it("positions the package around Navi Progress Map without expanding runtime scope", async () => {
    const manifest = JSON.parse(
      await readRepoText("plugins/navi/.codex-plugin/plugin.json"),
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
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");

    expect(manifest.version).toBe("0.1.0");
    expect(manifest.description).toContain("Navi");
    expect(manifest.description).toContain("Progress Map");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["navi", "progress-map"]));
    expect(manifest.interface.shortDescription).toContain("Project progress");
    expect(manifest.interface.longDescription).toContain("non-expert users");
    expect(manifest.interface.longDescription).toContain("Progress Map");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Show where this project stands, what comes next, and what I need to decide.",
      "Should we continue, stop, wait, or move to the next stage?",
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    ]);
    expect(manifest.interface.defaultPrompt).toHaveLength(3);

    expect(readme).toContain("## Navi");
    expect(readme).toContain("Progress Map");
    expect(readme).toContain("understand, supervise, and steer expert agents");
    expect(readme).toContain("Current position");
    expect(readme).toContain("What you need to confirm now");
    expect(readme).toContain("not a standalone general agent");
    expect(readme).toContain("When this package is installed, Navi Progress Map triggers apply in any active Codex project");
    expect(readme).toContain("Do not require the user to name Navi");
    expect(readme).toContain("accuracy-first");
    expect(readme).toContain("may inspect the target project's source-of-truth before outputting the Progress Map");
    expect(readme).toContain("does not replace necessary professional review");
    expect(readme).toContain("接下来我们应该做什么？");
    expect(readme).toContain("现在做到哪了？我看不懂。");
    expect(readme).toContain("继续吧。");
    expect(readme).toContain("stable target-project overall progress bar");
    expect(readme).toContain("current-stage sub-progress bar");
    expect(readme).toContain("这个方案可以吗？我不懂技术。");
    expect(readme).toContain("pre-approval check");

    expect(version).toContain("Navi");
    expect(version).toContain("Progress Map");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });

  it("keeps the packaged skill copy in exact sync with the repo skill source", async () => {
    const sourceDir = ".agents/skills/navi";
    const packagedDir = "plugins/navi/skills/navi";

    const sourceFiles = await listRepoFiles(sourceDir);
    const packagedFiles = await listRepoFiles(packagedDir);

    expect(packagedFiles).toEqual(sourceFiles);

    for (const relativePath of sourceFiles) {
      const sourceText = await readRepoText(`${sourceDir}/${relativePath}`);
      const packagedText = await readRepoText(`${packagedDir}/${relativePath}`);

      expect(packagedText, relativePath).toBe(sourceText);
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

  it("makes the confirmed Map contract authoritative in canonical and packaged skills", async () => {
    const [canonicalSkill, packagedSkill, manifestSource] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/.codex-plugin/plugin.json"),
    ]);
    const pluginManifest = JSON.parse(manifestSource) as {
      interface: { defaultPrompt: string[] };
    };
    const confirmedMapContract = [
      ".navi/project-map.md",
      "Init Eligibility Gate",
      "Guided Baseline Formation",
      "one missing key judgment at a time",
      "Map language is evidence, not a response-language instruction",
      "meaningful navigation boundary",
      "project_status: active",
      "project_status: paused",
      "project_status: closed",
      "worktree completion as review-ready state",
    ];

    for (const phrase of confirmedMapContract) {
      expect(canonicalSkill).toContain(phrase);
      expect(packagedSkill).toContain(phrase);
    }

    expect(pluginManifest.interface.defaultPrompt).toContain(
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    );

    for (const stalePhrase of [
      "Map status: provisional",
      ".navi/state.md",
      "navi init --suggest-map",
      "write only a provisional trigger",
    ]) {
      expect(canonicalSkill).not.toContain(stalePhrase);
      expect(packagedSkill).not.toContain(stalePhrase);
    }
  });

  it("relates incomplete baseline formation to a combined approved initialization preview", async () => {
    const [skill, reference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
    ]);
    const skillInit = extractMarkdownSection(skill, "## Init Eligibility Gate");
    const eligibility = extractMarkdownSection(reference, "#### Init Eligibility Gate");
    const guided = extractMarkdownSection(reference, "#### Guided Baseline Formation");
    const finalPreview = extractMarkdownSection(reference, "#### Final Preview And Activation");

    expect(skillInit).toMatch(/evidence is insufficient[\s\S]*without writes/i);
    expect(skillInit).toMatch(/one missing key judgment at a time[\s\S]*confirm or correct/i);
    expect(guided).toMatch(/one missing key judgment[\s\S]*one focused question/i);
    expect(guided).toMatch(/confirms or corrects[\s\S]*until the minimum baseline is confirmable/i);
    expect(eligibility).toMatch(/Desired Outcome[\s\S]*route or working rhythm[\s\S]*Current Position[\s\S]*(Next Decision|Current Boundary)/i);
    expect(finalPreview).toMatch(/One final preview[\s\S]*\.navi\/project-map\.md[\s\S]*AGENTS\.md/i);
    expect(finalPreview).toMatch(/One approval[\s\S]*both writes[\s\S]*Map is written first[\s\S]*trigger last/i);
  });

  it("requires the ordered private-candidate, preview, approval, fingerprinted-apply, and cleanup adapter journey", async () => {
    const [skill, reference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
    ]);
    const sections = [
      extractMarkdownSection(skill, "## Init Eligibility Gate"),
      extractMarkdownSection(reference, "#### Final Preview And Activation"),
    ];
    const orderedContract = [
      /create a private candidate file outside the target project/i,
      /navi init --map-file <candidate>/i,
      /one combined Map\+trigger preview/i,
      /obtain approval/i,
      /navi init --map-file <candidate> --expect-plan <fingerprint> --write/i,
      /remove the private candidate after success or explicit abandonment/i,
    ];

    for (const section of sections) {
      let previousIndex = -1;
      for (const phrase of orderedContract) {
        const index = section.search(phrase);
        expect(index).toBeGreaterThan(previousIndex);
        previousIndex = index;
      }
    }
  });

  it("scopes adaptive answers, language, and stale-evidence challenge to their policy sections", async () => {
    const [skill, reference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
    ]);
    const authority = extractMarkdownSection(skill, "## Confirmed Project Map Authority");
    const model = extractMarkdownSection(reference, "### Confirmed Project Map Model");
    const daily = extractMarkdownSection(reference, "### Daily Supervision Behavior");
    const stale = extractMarkdownSection(reference, "#### Stale Or Conflicting Evidence");

    for (const section of [authority, model, daily]) {
      expect(section).toMatch(/relevant Map subset|not a (fixed|required) response template/i);
      expect(section).toMatch(/current prompt|user's current prompt/i);
    }
    expect(authority).toMatch(/Next-step questions[\s\S]*Current Position[\s\S]*Next Decision/i);
    expect(authority).toMatch(/vision-distance questions[\s\S]*Route To Outcome/i);
    expect(stale).toMatch(/challenged judgment[\s\S]*strongest verifiable evidence/i);
    expect(stale).toMatch(/do not invent a stable map or rewrite it silently/i);
    expect(stale).toMatch(/meaningful navigation boundary/i);
  });

  it("binds maintenance, lifecycle, reopening, and worktree review to decision boundaries", async () => {
    const [skill, reference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
    ]);
    const daily = extractMarkdownSection(skill, "## Daily Supervision And Maintenance");
    const maintenance = extractMarkdownSection(reference, "### Map Maintenance And Authorization");
    const lifecycle = extractMarkdownSection(reference, "### Project Lifecycle");
    const parallel = extractMarkdownSection(reference, "### Parallel Work And Review Readiness");

    expect(daily).toMatch(/clear bounded tasks[\s\S]*approved acceptance point/i);
    expect(daily).toMatch(/meaningful navigation boundary[\s\S]*smallest Map patch/i);
    expect(maintenance).toMatch(/meaningful navigation boundary[\s\S]*preview the patch[\s\S]*approval/i);
    expect(maintenance).toMatch(/explicitly covers[\s\S]*Map maintenance[\s\S]*smallest Map patch/i);
    expect(lifecycle).toMatch(/project_status: paused[\s\S]*stay quiet without continuation pressure/i);
    expect(lifecycle).toMatch(/project_status: closed[\s\S]*do not recommend the old route/i);
    expect(lifecycle).toMatch(/Reopening does not trust the old Current Position[\s\S]*confirmation before project_status: active/i);
    expect(parallel).toMatch(/review-ready[\s\S]*Lane Handoff[\s\S]*natural checkpoint/i);
    expect(parallel).toMatch(/continue[\s\S]*non-conflicting/i);
  });

  it("routes review readiness through Lane Handoff without claiming background delivery", async () => {
    const [skill, workingThread, laneHandoff, packagedWorkingThread] =
      await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
      readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/working-thread-v1.md"),
    ]);

    const parallel = extractMarkdownSection(
      workingThread,
      "### Parallel Work And Review Readiness",
    );

    expect(packagedWorkingThread).toBe(workingThread);
    expect(parallel).toMatch(/review-ready[\s\S]*Lane Handoff[\s\S]*natural checkpoint/i);
    expect(parallel).toMatch(/continue[\s\S]*non-conflicting/i);
    expect(skill).toContain("references/lane-handoff-v1.md");
    expect(laneHandoff).toMatch(/task-to-task coordination[\s\S]*not a background/i);
  });

  it("rejects contradictory stored-Map and legacy-path guidance across canonical and packaged contracts", async () => {
    const contracts = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/references/working-thread-v1.md"),
    ]);

    for (const contract of contracts) {
      expect(contract).not.toMatch(/provisional (Project |Rhythm )?Map/i);
      expect(contract).not.toContain("docs/along/project-maps/");
      expect(contract).not.toContain(".navi/state.md");
      expect(contract).not.toContain("navi init --suggest-map");
      expect(contract).not.toContain("write only a provisional trigger");
      expect(contract).not.toMatch(/stored structure is (a|required as a) response template/i);
      expect(contract).not.toMatch(/rewrite (the )?Map silently/i);
    }
  });

  it("uses scoped plan authorization for listed local task commits without weakening approval boundaries", async () => {
    const [canonicalSkill, canonicalReference, packagedSkill, packagedReference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText("plugins/navi/skills/navi/references/working-thread-v1.md"),
    ]);

    for (const contract of [canonicalSkill, canonicalReference, packagedSkill, packagedReference]) {
      expect(contract).toContain("approved bounded implementation or worktree plan");
      expect(contract).toContain("explicitly planned local task commits");
      expect(contract).toContain("Do not request separate approval for each such commit");
      expect(contract).toContain("unknown staged content");
      expect(contract).toContain("history rewriting");
      expect(contract).toContain("merge, push, tag, release");
      expect(contract).not.toContain("Stop for user approval before file writes outside the approved mode, commits, pushes");
      expect(contract).toContain("unplanned commit");
      expect(contract).toContain("user request not to commit");
      expect(contract).toContain("project-owned instructions outside the Navi managed block");
      expect(contract).toContain("cross-project");
      expect(contract).toContain("scope expansion");
      expect(contract).toContain("known-risk acceptance");
    }
  });

  it("documents restrained positioning, validation, and version boundaries", async () => {
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");
    const reference = await readRepoText(
      ".agents/skills/navi/references/working-thread-v1.md",
    );

    expect(readme).toContain("# Navi");
    expect(readme).toContain("Navi helps non-expert users understand, supervise, and steer expert agents.");
    expect(readme).toContain("`along-working-thread` is a legacy installation identifier.");
    expect(readme).toContain("## What it is");
    expect(readme).toContain("## What it is not");
    expect(readme).toContain("Codex plugin source package");
    expect(readme).toContain("turn-bound self-initiation");
    expect(readme).toContain("not a background autonomous agent");
    expect(readme).toContain("not an always-on companion");
    expect(readme).toContain("not a replacement for Codex, Hermes, Claude Code, or other agents");
    expect(readme).toContain("npm run verify:plugin-package");
    expect(readme).toContain("Fresh-session validation checklist");
    expect(readme).toContain("Please restore the current Navi Working Thread");
    expect(readme).toContain("rate usefulness, self-initiation, co-creator feel, and annoyance");

    expect(version).toContain("# Navi 0.1.0");
    expect(version).toContain("0.1.0-alpha.3");
    expect(version).toContain("independent product");
    expect(version).not.toContain("Navi as Along's current V1 product surface");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");

    expect(reference).toContain("the Navi skill may be installed and readable");
    expect(reference).not.toContain("the Along Working Thread skill may be installed and readable");
  });
});
