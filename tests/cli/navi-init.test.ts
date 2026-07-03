import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  NAVI_AGENTS_BLOCK_START,
  applyInitPlan,
  buildInitPlan,
  parseInitArgs,
  renderInitPlan,
  resolveTargetPath,
  runNaviInitCli,
} from "../../src/cli/navi-init";

const tempRoots = new Set<string>();

async function makeProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-init-"));
  tempRoots.add(root);
  const project = path.join(root, "target-project");
  await fs.mkdir(project);
  return project;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  await Promise.all([...tempRoots].map((root) => fs.rm(root, { recursive: true, force: true })));
  tempRoots.clear();
});

describe("navi init planning", () => {
  it("defaults to dry-run and does not write target files", async () => {
    const project = await makeProject();

    const plan = await buildInitPlan({ targetDir: project, write: false });
    const output = renderInitPlan(plan);

    expect(plan.mode).toBe("dry-run");
    expect(plan.targetDir).toBe(path.resolve(project));
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([
      ["create", "AGENTS.md"],
      ["create", "docs/along/project-maps/navi-project-map.md"],
    ]);
    expect(output).toContain("Navi init preview");
    expect(output).toContain("No files were changed");
    expect(output).toContain("navi init --target");
    expect(output).toContain("接下来我们应该做什么？");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
    expect(await exists(path.join(project, "docs/along/project-maps/navi-project-map.md"))).toBe(false);
  });

  it("writes AGENTS.md and a provisional project map only behind --write", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");
    const map = await fs.readFile(path.join(project, "docs/along/project-maps/navi-project-map.md"), "utf8");

    expect(agents).toContain(NAVI_AGENTS_BLOCK_START);
    expect(agents).toContain("## Navi Progress Map Rules");
    expect(agents).toContain("keep Navi quiet");
    expect(map).toContain("# Navi Project Map");
    expect(map).toContain("Map status: provisional");
    expect(map).toContain("This map only establishes where Navi should look first.");
  });

  it("installs prompt-language-following rules for generated Navi maps", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    expect(agents).toContain("Match the Navi map response language to the user's current prompt by default.");
    expect(agents).toContain("English prompts such as `what's next`, `where are we`, or `continue` should use English map headings");
    expect(agents).toContain("Chinese prompts should still allow Chinese headings and explanations.");
    expect(agents).toContain("When project records contain stage labels in another language, translate or bilingualize those labels");
    expect(agents).toContain("Project rhythm");
    expect(agents).toContain("Current focus");
    expect(agents).toContain("Current track");
    expect(agents).toContain("Current action");
  });

  it("installs alpha 4 supervision rules for phase, validation, and parallel work", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Use Navi as a supervision layer, not just a progress reporter.",
      "phase supervision",
      "verification budget",
      "proactive decision signal",
      "parallel work supervision",
      "vision-distance",
      "Design mode does not need tests.",
      "Implementation mode uses targeted tests around changed behavior.",
      "Release mode is the only default place for full tests, typecheck, package verification, release notes, tag, push, and release checks.",
      "The main session should not default to waiting for every worktree.",
      "Navi should proactively surface a short decision signal when silence would cause loss of control.",
    ]) {
      expect(agents).toContain(expected);
    }
  });

  it("installs alpha 5 pause semantics rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.5 pause semantics",
      "continue to the already-defined acceptance point",
      "Do not stop just because a local sub-step finished",
      "Distinguish lane-level waiting from whole-session waiting",
      "Do not treat a waiting worktree, external review, or background track as a reason to stop the whole main session",
      "continue non-conflicting design, supervision, acceptance-criteria, roadmap, or risk work",
      "Only make the whole session wait when all useful next steps depend on the result",
      "Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases",
      "When stopping, explain the pause reason in one sentence",
      "Use a light continuation contract when a multi-step loop is clear",
      "Next Decision Visibility",
      "smallest useful next-decision hint",
      "no visible next decision except `continue`",
      "after commit, push, merge, validation, or worktree handoff",
      "does not force a Progress Map",
    ]) {
      expect(agents).toContain(expected);
    }
  });

  it("installs alpha 6 stage and vision supervision rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.6 stage-and-vision supervision",
      "Product Stage",
      "Work Mode",
      "Vision Distance",
      "Product Definition",
      "User Supervision",
      "Project Integration",
      "Behavior Calibration",
      "Distribution & Trust",
      "Runtime Surface",
      "Use Silent Tracking by default",
      "Use a Light Signal",
      "Use a Full Map",
      "Exploration is a Design sub-state",
      "Closeout, Waiting, Review, and Merge are loop or workflow states",
      "Do not print Product Stage, Work Mode, and Vision Distance in every response",
    ]) {
      expect(agents).toContain(expected);
    }

    expect(agents).not.toContain("design, calibration, implementation, release, closeout, or exploration");
  });

  it("installs alpha 7 coordination layer rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.7 coordination layer",
      "Coordination Layer",
      "Main Lane",
      "Implementation Lane",
      "Calibration Lane",
      "Review / Merge Lane",
      "Release Lane",
      "External Lane",
      "lane-level waiting",
      "whole-session blocked",
      "The main session can continue non-conflicting work",
      "A completed worktree should create a review option, not an automatic whole-session interruption.",
      "Review immediately when the result may change the current design premise",
      "Defer review when the current main-lane work is non-conflicting",
      "Do not force lane tables into ordinary answers.",
    ]) {
      expect(agents).toContain(expected);
    }
  });

  it("installs alpha 8 decision handoff quality rules for generated Navi triggers", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await applyInitPlan(plan);

    const agents = await fs.readFile(path.join(project, "AGENTS.md"), "utf8");

    for (const expected of [
      "Alpha.8 decision handoff quality",
      "Completion is not always a handoff",
      "Stop with a decision, a recommendation, or closure",
      "Default Next Step",
      "Decision Options",
      "Loop Closure",
      "bare completion report",
      "real next decision",
      "Do not include bare `continue` as a fake option.",
      "No Menu Inside Approved Boundary",
      "Close Finished Lines",
      "Blocked Means Actually Blocked",
      "Use Silent Completion only when the user asked for a narrow status report",
      "Use One-Sentence Handoff when one next step is clearly best",
      "Use Short Decision Options when there are real branches",
      "Use Closure Note when the current line is actually complete",
    ]) {
      expect(agents).toContain(expected);
    }
  });

  it("rejects stale create actions when a target file appears after planning", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const agentsPath = path.join(project, "AGENTS.md");
    const mapPath = path.join(project, "docs/along/project-maps/navi-project-map.md");

    await fs.writeFile(agentsPath, "# Created Elsewhere\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/already exists/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("# Created Elsewhere\n");
    expect(await exists(mapPath)).toBe(false);
  });

  it("preserves existing AGENTS.md content when adding the Navi block", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Project Instructions\n\nKeep this existing rule.\n");

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(agents).toMatch(/^# Project Instructions\n\nKeep this existing rule\./);
    expect(agents.match(/Navi Progress Map Rules/g)).toHaveLength(1);
  });

  it("is idempotent when an AGENTS.md Navi block already exists", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(
      agentsPath,
      `# Project Instructions\n\n${NAVI_AGENTS_BLOCK_START}\n## Navi Progress Map Rules\nExisting block.\n<!-- NAVI:END -->\n`,
    );

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(plan.actions.find((action) => action.relativePath === "AGENTS.md")?.kind).toBe("skip");
    expect(agents.match(new RegExp(NAVI_AGENTS_BLOCK_START, "g"))).toHaveLength(1);
    expect(agents).toContain("Existing block.");
  });

  it("does not overwrite an existing project map", async () => {
    const project = await makeProject();
    const mapPath = path.join(project, "docs/along/project-maps/navi-project-map.md");
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, "# Existing Map\n\nKeep this confirmed map.\n");

    const plan = await buildInitPlan({ targetDir: project, write: true });
    await applyInitPlan(plan);

    const mapAction = plan.actions.find((action) => action.relativePath === "docs/along/project-maps/navi-project-map.md");
    expect(mapAction?.kind).toBe("skip");
    expect(mapAction?.summary).toContain("Existing Markdown records found under docs/along/project-maps");
    expect(mapAction?.summary).toContain("will not create another starter map automatically");
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe("# Existing Map\n\nKeep this confirmed map.\n");
  });

  it("rejects stale modify actions when AGENTS.md changes after planning", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Project Instructions\n\nOriginal rule.\n");
    const plan = await buildInitPlan({ targetDir: project, write: true });

    await fs.writeFile(agentsPath, "# Project Instructions\n\nChanged elsewhere.\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/changed since planning/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("# Project Instructions\n\nChanged elsewhere.\n");
  });

  it("rejects final-path symlinks before modifying AGENTS.md", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    const originalAgents = "# Project Instructions\n\nOriginal rule.\n";
    await fs.writeFile(agentsPath, originalAgents);
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const outsideAgentsPath = path.join(path.dirname(project), "outside-agents.md");
    const mapPath = path.join(project, "docs/along/project-maps/navi-project-map.md");

    await fs.writeFile(outsideAgentsPath, originalAgents);
    await fs.unlink(agentsPath);
    await fs.symlink(outsideAgentsPath, agentsPath);

    await expect(applyInitPlan(plan)).rejects.toThrow(/symlink/i);
    await expect(fs.readFile(outsideAgentsPath, "utf8")).resolves.toBe(originalAgents);
    expect(await exists(mapPath)).toBe(false);
  });

  it("rejects unsafe target-relative writes", () => {
    expect(() => resolveTargetPath("/tmp/example-project", "../outside.md")).toThrow(/outside target/i);
  });

  it("rejects externally supplied plans whose paths escape or mismatch the target", async () => {
    const project = await makeProject();
    const outsidePath = path.join(path.dirname(project), "outside.md");
    const absoluteInsidePath = path.join(project, "absolute.md");

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "create",
            relativePath: "AGENTS.md",
            absolutePath: outsidePath,
            summary: "Unsafe path mismatch.",
            content: "# Unsafe\n",
          },
        ],
      }),
    ).rejects.toThrow(/does not match/i);

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "create",
            relativePath: "../outside.md",
            absolutePath: outsidePath,
            summary: "Unsafe relative path.",
            content: "# Unsafe\n",
          },
        ],
      }),
    ).rejects.toThrow(/outside target/i);

    expect(await exists(outsidePath)).toBe(false);

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "create",
            relativePath: absoluteInsidePath,
            absolutePath: absoluteInsidePath,
            summary: "Unsafe absolute relative path.",
            content: "# Unsafe\n",
          },
        ],
      }),
    ).rejects.toThrow(/absolute/i);

    expect(await exists(absoluteInsidePath)).toBe(false);
  });

  it("rejects symlinked parent directories before creating a project map", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "AGENTS.md"),
      `${NAVI_AGENTS_BLOCK_START}\n## Navi Progress Map Rules\nExisting block.\n<!-- NAVI:END -->\n`,
    );
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const outsideMapDir = path.join(path.dirname(project), "outside-maps");
    const mapParent = path.join(project, "docs/along/project-maps");
    const outsideMapPath = path.join(outsideMapDir, "navi-project-map.md");

    await fs.mkdir(path.dirname(mapParent), { recursive: true });
    await fs.mkdir(outsideMapDir);
    await fs.symlink(outsideMapDir, mapParent);

    await expect(applyInitPlan(plan)).rejects.toThrow(/symlink/i);
    expect(await exists(outsideMapPath)).toBe(false);
  });

  it("rejects target paths that are not directories", async () => {
    const project = await makeProject();
    const fileTarget = path.join(project, "not-a-directory.txt");
    await fs.writeFile(fileTarget, "not a directory");

    await expect(buildInitPlan({ targetDir: fileTarget, write: false })).rejects.toThrow(/directory/i);
  });

  it("rejects a project map create when another map appears after planning", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "AGENTS.md"),
      `${NAVI_AGENTS_BLOCK_START}\n## Navi Progress Map Rules\nExisting block.\n<!-- NAVI:END -->\n`,
    );
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const mapDir = path.join(project, "docs/along/project-maps");
    const alternateMapPath = path.join(mapDir, "another-map.md");
    const plannedMapPath = path.join(mapDir, "navi-project-map.md");

    await fs.mkdir(mapDir, { recursive: true });
    await fs.writeFile(alternateMapPath, "# Another Map\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/project map/i);
    await expect(fs.readFile(alternateMapPath, "utf8")).resolves.toBe("# Another Map\n");
    expect(await exists(plannedMapPath)).toBe(false);
  });

  it("does not create AGENTS.md when a later project map create fails preflight", async () => {
    const project = await makeProject();
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const agentsPath = path.join(project, "AGENTS.md");
    const mapDir = path.join(project, "docs/along/project-maps");
    const alternateMapPath = path.join(mapDir, "another-map.md");
    const plannedMapPath = path.join(mapDir, "navi-project-map.md");

    await fs.mkdir(mapDir, { recursive: true });
    await fs.writeFile(alternateMapPath, "# Another Map\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/project map/i);
    expect(await exists(agentsPath)).toBe(false);
    expect(await exists(plannedMapPath)).toBe(false);
    await expect(fs.readFile(alternateMapPath, "utf8")).resolves.toBe("# Another Map\n");
  });

  it("does not modify AGENTS.md when a later project map create fails preflight", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");
    const originalAgents = "# Project Instructions\n\nKeep this existing rule.\n";
    await fs.writeFile(agentsPath, originalAgents);
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const mapDir = path.join(project, "docs/along/project-maps");
    const alternateMapPath = path.join(mapDir, "another-map.md");
    const plannedMapPath = path.join(mapDir, "navi-project-map.md");

    await fs.mkdir(mapDir, { recursive: true });
    await fs.writeFile(alternateMapPath, "# Another Map\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/project map/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(originalAgents);
    expect(await exists(plannedMapPath)).toBe(false);
  });

  it("rejects create or modify actions that are missing content", async () => {
    const project = await makeProject();
    const agentsPath = path.join(project, "AGENTS.md");

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "create",
            relativePath: "AGENTS.md",
            absolutePath: agentsPath,
            summary: "Malformed create.",
          },
        ],
      }),
    ).rejects.toThrow(/content/i);

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "modify",
            relativePath: "AGENTS.md",
            absolutePath: agentsPath,
            summary: "Malformed modify.",
          },
        ],
      }),
    ).rejects.toThrow(/content/i);
  });

  it("preflights missing modify guards before writing earlier actions", async () => {
    const project = await makeProject();
    const existingPath = path.join(project, "existing.md");
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(existingPath, "# Existing\n");

    await expect(
      applyInitPlan({
        mode: "write",
        targetDir: project,
        validationPrompt: "",
        actions: [
          {
            kind: "create",
            relativePath: "AGENTS.md",
            absolutePath: agentsPath,
            summary: "Create AGENTS first.",
            content: "# New Agents\n",
          },
          {
            kind: "modify",
            relativePath: "existing.md",
            absolutePath: existingPath,
            summary: "Malformed modify.",
            content: "# Changed\n",
          },
        ],
      }),
    ).rejects.toThrow(/previous content/i);

    expect(await exists(agentsPath)).toBe(false);
    await expect(fs.readFile(existingPath, "utf8")).resolves.toBe("# Existing\n");
  });

  it("renders write mode as no-op when every action is skipped", async () => {
    const project = await makeProject();
    await fs.writeFile(
      path.join(project, "AGENTS.md"),
      `${NAVI_AGENTS_BLOCK_START}\n## Navi Progress Map Rules\nExisting block.\n<!-- NAVI:END -->\n`,
    );
    const mapPath = path.join(project, "docs/along/project-maps/navi-project-map.md");
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, "# Existing Map\n");

    const output = renderInitPlan(await buildInitPlan({ targetDir: project, write: true }));

    expect(output).toContain("No files needed changes.");
    expect(output).not.toContain("Files were changed according to the plan above.");
  });
});

describe("navi init CLI helpers", () => {
  it("parses target and write flags", () => {
    expect(parseInitArgs(["--target", "/tmp/demo", "--write"], "/tmp/fallback")).toEqual({
      targetDir: "/tmp/demo",
      write: true,
    });
  });

  it("resolves relative target paths against the injected CLI cwd", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-init-cwd-"));
    tempRoots.add(root);
    const project = path.join(root, "target-project");
    await fs.mkdir(project);
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--target", "target-project"], {
      cwd: root,
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(0);
    expect(stderr.join("")).toBe("");
    expect(stdout.join("")).toContain(`Target: ${project}`);
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
  });

  it("returns a non-zero code for unknown flags", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--bogus"], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(1);
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toContain("Unknown option");
    expect(stderr.join("")).toContain("Usage: navi init");
  });

  it("does not append usage for planning errors", async () => {
    const project = await makeProject();
    const fileTarget = path.join(project, "not-a-directory.txt");
    await fs.writeFile(fileTarget, "not a directory");
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--target", fileTarget], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(1);
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toContain("directory");
    expect(stderr.join("")).not.toContain("Usage: navi init");
  });

  it("renders dry-run output through the CLI runner without writing files", async () => {
    const project = await makeProject();
    const stdout: string[] = [];
    const stderr: string[] = [];

    const code = await runNaviInitCli(["--target", project], {
      cwd: process.cwd(),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    expect(code).toBe(0);
    expect(stderr.join("")).toBe("");
    expect(stdout.join("")).toContain("Navi init preview");
    expect(stdout.join("")).toContain("No files were changed");
    expect(await exists(path.join(project, "AGENTS.md"))).toBe(false);
  });
});
