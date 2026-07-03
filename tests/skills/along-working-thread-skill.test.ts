import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const frontmatter = extractFrontmatter(skill);

    const parsed = await parseWithPyYaml(frontmatter);

    expect(parsed.name).toBe("along-working-thread");
    expect(parsed.description).toEqual(expect.stringContaining("Working Thread continuity"));
    expect(parsed.description).toEqual(expect.stringContaining("any active Codex project"));
    expect(parsed.description).toEqual(expect.stringContaining("non-expert progress"));
    expect(parsed.description).toEqual(expect.stringContaining("现在做到哪了"));
    expect(parsed.description).toEqual(expect.stringContaining("我看不懂"));
    expect(parsed.description).toEqual(expect.stringContaining("接下来"));
    expect(parsed.description).not.toEqual(expect.stringContaining("Use in the Along project"));
  });

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
    expect(metadata).toContain("display_name: Navi");
    expect(metadata).toContain("Use Navi for Progress Maps");
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

  it("documents tightened drift behavior and bounded write-back rules", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const template = await readRepoText("docs/along/project-maps/navi-project-trigger-template.md");
    const readme = await readRepoText("plugins/along-working-thread/README.md");

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
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

  it("documents the Navi Project Map model and source priority", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "Project Map",
      "map_status",
      "overall_stages",
      "current_overall_stage",
      "current_stage_explanation",
      "sub_progress",
      "visible_evidence",
      "missing_or_risk",
      "next_gate",
      "user_confirmation_needed",
      "source",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "user just confirmed",
      "active Working Thread or project record",
      "approved plan or spec",
      "most recent Navi map that the user did not reject",
      "provisional inferred map",
      "clearly marked as awaiting confirmation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("stable Project Map");
    expect(skill).toContain("source priority");
    expect(reference).toContain("If sources conflict");
    expect(reference).toContain("confirmed user-facing project map wins");
    expect(reference).toContain("docs/along/project-maps/");
    expect(reference).toContain("read the matching confirmed Project Map record");
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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/along-working-thread/README.md");

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

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
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
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
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

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
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/along-working-thread/README.md");
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
      "docs/along/project-maps/navi-project-trigger-template.md",
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

  it("documents Navi project initialization as the reliable install path", async () => {
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const initDoc = await readRepoText("docs/along/project-maps/navi-project-init.md");

    for (const expected of [
      "Navi Project Initialization",
      "install Navi into a target project",
      "global skill plus project-local trigger source",
      "ask for user confirmation before writing durable project files",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi project initialization",
      "navi-project-init.md",
      "global skill + project-local trigger source",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "# Navi Project Initialization",
      "Minimum install output",
      "AGENTS.md",
      "docs/along/project-maps/",
      "Project Map or Rhythm Map",
      "`navi init` is the narrow project-local setup surface",
      "Do not use `navi init` as a global Codex plugin or skill installer",
      "Fresh-session validation",
    ]) {
      expect(initDoc).toContain(expected);
    }
  });

  it("documents degraded state rules for unreliable project maps", async () => {
    const skill = await readRepoText(".agents/skills/along-working-thread/SKILL.md");
    const reference = await readRepoText(".agents/skills/along-working-thread/references/working-thread-v1.md");

    for (const expected of [
      "should not draw a confident stable bar",
      "我现在还没有可靠的项目地图",
      "临时判断，待你确认后才会作为稳定项目地图",
      "Accuracy is more important than immediate visual confidence",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("must not draw a confident stable bar");
    expect(skill).toContain("provisional map");
  });

  it("documents graphical progress bar validation in the package README", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");

    for (const expected of [
      "Project Map",
      "stable target-project stage sequence",
      "compact horizontal progress strip",
      "single-line stage strip",
      "source priority",
      "provisional map",
      "must not draw a confident stable bar",
    ]) {
      expect(readme).toContain(expected);
    }
  });

  it("documents Rhythm Map validation in the package README and version boundary", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const version = await readRepoText("plugins/along-working-thread/VERSION.md");

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
  it("documents the current Navi-first product narrative in the root README", async () => {
    const readme = await readRepoText("README.md");

    for (const expected of [
      "Navi is an independent open-source product and the first V1 product surface from the broader Along vision",
      "Navi is the current alpha product you can inspect, install, and test today",
      "This repository is the canonical open-source alpha home for Navi",
      "Navi's V1 alpha behavior centers on",
      "Progress/Rhythm Maps",
      "Try Navi Alpha In 5 Minutes",
      "This alpha is a GitHub source package",
      "npm run navi -- init --target /path/to/target-project",
      "Project-local setup is explicit and dry-run by default",
      "git clone https://github.com/HezLUO/navi.git",
      "Who This Alpha Is For",
      "Wait for a later release if you need npm distribution",
      "global Codex plugin installation",
      "Along is the broader long-term product vision",
      "Current V1 shape",
      "skill/plugin behavior with project-local docs",
      "Verify The Source Package",
      "Alpha Feedback We Want",
      "Did ordinary progress, next-step, confusion, continue, and plan-reliability questions trigger a useful Navi map?",
      "MCP, runtime, local app, background presence",
      "older Along companion ideas",
    ]) {
      expect(readme).toContain(expected);
    }

    const verifyCommandIndex = readme.indexOf("npm run verify:plugin-package");
    const verifySentenceIndex = readme.indexOf("That verifies the repo-contained Navi plugin source package.");
    const initCommandIndex = readme.indexOf("npm run navi -- init --target /path/to/target-project");

    expect(verifyCommandIndex).toBeLessThan(verifySentenceIndex);
    expect(verifySentenceIndex).toBeLessThan(initCommandIndex);
  });

  it("documents shipped navi init scope in debt and roadmap docs", async () => {
    const debt = await readRepoText("docs/along/navi-product-debt.md");
    const roadmap = await readRepoText("docs/along/roadmaps/navi-post-alpha-roadmap.md");

    for (const expected of [
      "Status: partly addressed",
      "partly productized through the narrow project-local `navi init` initializer",
    ]) {
      expect(debt).toContain(expected);
    }

    for (const expected of [
      "Validate the narrow `navi init` project-local initializer",
      "Global plugin installation, one-click sync, npm distribution, or marketplace installation",
    ]) {
      expect(roadmap).toContain(expected);
    }
  });

  it("ships the minimal repo-contained plugin package layout and manifest", async () => {
    for (const requiredPath of [
      "plugins/along-working-thread/.codex-plugin/plugin.json",
      "plugins/along-working-thread/README.md",
      "plugins/along-working-thread/VERSION.md",
      "plugins/along-working-thread/skills/along-working-thread/SKILL.md",
      "plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml",
      "plugins/along-working-thread/skills/along-working-thread/references/working-thread-v1.md",
    ]) {
      expect(await repoPathExists(requiredPath), requiredPath).toBe(true);
    }

    const manifest = JSON.parse(
      await readRepoText("plugins/along-working-thread/.codex-plugin/plugin.json"),
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

    expect(manifest.name).toBe("along-working-thread");
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
      "Navi Progress Maps and Challenge Layer continuity for active Codex sessions.",
    );
    expect(manifest.interface.longDescription).toContain("turn-bound self-initiation");
    expect(manifest.interface.longDescription).toContain("not background autonomy");
    expect(manifest.interface.category).toBe("Productivity");
    expect(manifest.interface.capabilities).toContain("Interactive");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Resume the current Working Thread.",
      "Give me a Navi Progress Map for the current work.",
      "Explain what is done, what remains, and what I need to confirm.",
      "Help me wrap up this phase.",
      "Check whether this direction drifts from our thread.",
      "Check whether this is a self-certification moment.",
      "Turn this challenge into a lightweight validation.",
    ]);
    expect(manifest.name).toBe("along-working-thread");
    expect(manifest.interface.longDescription).toContain("legacy skill id remains along-working-thread");
    const formerDeveloperName = ["Ja", "mes"].join("");
    expect(JSON.stringify(manifest)).not.toContain(formerDeveloperName);

    for (const forbiddenPath of [
      "plugins/along-working-thread/.mcp.json",
      "plugins/along-working-thread/.app.json",
      "plugins/along-working-thread/hooks",
      "plugins/along-working-thread/assets",
      "plugins/along-working-thread/dist",
    ]) {
      expect(await repoPathExists(forbiddenPath), forbiddenPath).toBe(false);
    }
  });

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

  it("documents Navi entry routing in agent metadata without forcing ordinary requests", async () => {
    const agentMetadata = await readRepoText(
      "plugins/along-working-thread/skills/along-working-thread/agents/openai.yaml",
    );

    expect(agentMetadata).toContain("Navi Progress Maps");
    expect(agentMetadata).toContain("Rhythm Maps");
    expect(agentMetadata).toContain("progress, next-step, confusion, continue, or plan-reliability");
    expect(agentMetadata).toContain("接下来");
    expect(agentMetadata).toContain("现在做到哪");
    expect(agentMetadata).toContain("我看不懂");
    expect(agentMetadata).toContain("继续吧");
    expect(agentMetadata).toContain("这个方案可以吗");
    expect(agentMetadata).toContain("ordinary clear execution requests");
    expect(agentMetadata).toContain("stay quiet");
    expect(agentMetadata).toContain("allow_implicit_invocation: true");
  });

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
    const sourceDir = ".agents/skills/along-working-thread";
    const packagedDir = "plugins/along-working-thread/skills/along-working-thread";

    const sourceFiles = await listRepoFiles(sourceDir);
    const packagedFiles = await listRepoFiles(packagedDir);

    expect(packagedFiles).toEqual(sourceFiles);

    for (const relativePath of sourceFiles) {
      const sourceText = await readRepoText(`${sourceDir}/${relativePath}`);
      const packagedText = await readRepoText(`${packagedDir}/${relativePath}`);

      expect(packagedText, relativePath).toBe(sourceText);
    }
  });

  it("documents restrained positioning, validation, and version boundaries", async () => {
    const readme = await readRepoText("plugins/along-working-thread/README.md");
    const version = await readRepoText("plugins/along-working-thread/VERSION.md");

    expect(readme).toContain("# Navi");
    expect(readme).toContain("Navi helps non-expert users understand, supervise, and steer expert agents.");
    expect(readme).toContain("The internal legacy package id remains `along-working-thread`.");
    expect(readme).toContain("## What it is");
    expect(readme).toContain("## What it is not");
    expect(readme).toContain("Codex plugin source package");
    expect(readme).toContain("turn-bound self-initiation");
    expect(readme).toContain("not a background autonomous agent");
    expect(readme).toContain("not an always-on companion");
    expect(readme).toContain("not a replacement for Codex, Hermes, Claude Code, or other agents");
    expect(readme).toContain("npm run verify:plugin-package");
    expect(readme).toContain("Fresh-session validation checklist");
    expect(readme).toContain("Please restore the current Along Working Thread");
    expect(readme).toContain("rate usefulness, self-initiation, co-creator feel, and annoyance");

    expect(version).toContain("# Along Working Thread 0.1.0");
    expect(version).toContain("Along's current V1 product surface");
    expect(version).toContain("not the whole long-term Along product");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });
});
