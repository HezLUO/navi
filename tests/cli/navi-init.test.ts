import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  NAVI_AGENTS_BLOCK_END,
  NAVI_AGENTS_BLOCK_START,
  applyInitPlan,
  buildInitPlan,
  parseInitArgs,
  recognizeNaviManagedBlock,
  renderAgentsBlock,
  renderInitPlan,
  resolveTargetPath,
  runNaviInitCli,
  type InitPlan,
} from "../../src/cli/navi-init";
import {
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  REQUIRED_PROJECT_MAP_ANCHORS,
} from "../../src/cli/navi-project-map";

const tempRoots = new Set<string>();

function confirmedMap(suffix = ""): string {
  return `---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-14
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed value ${index + 1}${suffix}.`,
).join("\n\n")}
`;
}

async function createProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-init-"));
  tempRoots.add(root);
  const project = path.join(root, "target-project");
  await fs.mkdir(project);
  return project;
}

async function writeCandidate(project: string, text = confirmedMap()): Promise<string> {
  const candidate = path.join(path.dirname(project), `candidate-${Math.random().toString(16).slice(2)}.md`);
  await fs.writeFile(candidate, text);
  return candidate;
}

async function writeCanonicalMap(project: string, text = confirmedMap()): Promise<string> {
  const mapPath = path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH);
  await fs.mkdir(path.dirname(mapPath), { recursive: true });
  await fs.writeFile(mapPath, text);
  return mapPath;
}

async function snapshot(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(relativeDir: string): Promise<void> {
    const absoluteDir = relativeDir ? path.join(root, relativeDir) : root;
    for (const entry of (await fs.readdir(absoluteDir, { withFileTypes: true })).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    )) {
      const relativePath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) await walk(relativePath);
      else if (entry.isFile()) files[relativePath.split(path.sep).join("/")] = await fs.readFile(path.join(root, relativePath), "utf8");
    }
  }
  await walk("");
  return files;
}

function testIo(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    cwd,
    stdout: (text: string) => stdout.push(text),
    stderr: (text: string) => stderr.push(text),
    output: () => stdout.join(""),
    errors: () => stderr.join(""),
  };
}

function externalPlan(project: string, actions: InitPlan["actions"]): InitPlan {
  return {
    mode: "write",
    state: "actionable",
    targetDir: project,
    actions,
    validationPrompt: "",
    evidencePaths: [],
  };
}

afterEach(async () => {
  await Promise.all([...tempRoots].map((root) => fs.rm(root, { recursive: true, force: true })));
  tempRoots.clear();
});

describe("navi init confirmed Map planning", () => {
  it("keeps no-payload init read-only and explains the missing confirmed baseline", async () => {
    const project = await createProject();
    const before = await snapshot(project);
    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.state).toBe("needs-confirmed-map");
    expect(plan.actions).toEqual([]);
    expect(renderInitPlan(plan)).toContain("confirmed Project Map");
    expect(renderInitPlan(plan)).not.toContain("Apply with:");
    expect(await snapshot(project)).toEqual(before);
  });

  it("names at most three bounded local evidence sources without inferring a Map", async () => {
    const project = await createProject();
    await fs.writeFile(path.join(project, "README.md"), "# Project\n");
    await fs.writeFile(path.join(project, "STATUS.md"), "# Status\n");
    await fs.writeFile(path.join(project, "TODO.md"), "# Todo\n");
    await fs.writeFile(path.join(project, "README-extra.md"), "# Extra\n");

    const plan = await buildInitPlan({ targetDir: project });
    const output = renderInitPlan(plan);

    expect(plan.evidencePaths).toHaveLength(3);
    expect(output).toContain("README.md");
    expect(output).not.toMatch(/shape hint|Rhythm Map|Suggested map/i);
  });

  it("does not accept --suggest-map as a public init option", () => {
    expect(() => parseInitArgs(["--suggest-map"], "/tmp/project")).toThrow(/removed|unknown option/i);
  });

  it("does not write a trigger when a confirmed Map payload is absent", async () => {
    const project = await createProject();
    const io = testIo();
    const code = await runNaviInitCli(["--target", project, "--write"], io);

    expect(code).toBe(1);
    expect(io.output()).toContain("confirmed Project Map");
    expect(io.output()).not.toMatch(/applied|successfully|files were changed/i);
    expect(io.output()).toMatch(/needs|requires|required/i);
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
    await expect(fs.access(path.join(project, ".navi/project-map.md"))).rejects.toThrow();
  });

  it("plans Map creation before trigger activation for a valid candidate", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.state).toBe("actionable");
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([
      ["create", NAVI_PROJECT_MAP_RELATIVE_PATH],
      ["create", "AGENTS.md"],
    ]);
    expect(plan.actions[0]?.content).toBe(confirmedMap());
  });

  it("plans only trigger activation when a valid confirmed Map already exists", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.state).toBe("actionable");
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([["create", "AGENTS.md"]]);
  });

  it("skips an identical confirmed Map candidate and plans the trigger", async () => {
    const project = await createProject();
    const text = confirmedMap();
    await writeCanonicalMap(project, text);
    const candidate = await writeCandidate(project, text);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.state).toBe("actionable");
    expect(plan.actions.map((action) => [action.kind, action.relativePath])).toEqual([
      ["skip", NAVI_PROJECT_MAP_RELATIVE_PATH],
      ["create", "AGENTS.md"],
    ]);
  });

  it("blocks a candidate that differs from an existing valid confirmed Map", async () => {
    const project = await createProject();
    const original = confirmedMap();
    await writeCanonicalMap(project, original);
    const candidate = await writeCandidate(project, confirmedMap(" changed"));

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.state).toBe("blocked");
    expect(plan.actions).toEqual([]);
    expect(plan.diagnostic).toMatch(/update command|different/i);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(original);
  });

  it("plans an exact guarded repair for a recognized-version-1 invalid Map", async () => {
    const project = await createProject();
    const invalid = confirmedMap().replace("map_status: confirmed", "map_status: draft");
    await writeCanonicalMap(project, invalid);
    const candidateText = confirmedMap();
    const candidate = await writeCandidate(project, candidateText);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });
    const mapAction = plan.actions[0];

    expect(plan.state).toBe("actionable");
    expect(mapAction).toMatchObject({
      kind: "modify",
      relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
      previousContent: invalid,
      content: candidateText,
    });
  });

  it.each([
    ["unknown", "not a recognized Map\n"],
    ["unsupported", confirmedMap().replace("navi_map: 1", "navi_map: 2")],
  ])("blocks and preserves an %s existing Map", async (_name, existing) => {
    const project = await createProject();
    await writeCanonicalMap(project, existing);
    const candidate = await writeCandidate(project);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.state).toBe("blocked");
    expect(plan.actions).toEqual([]);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(existing);
  });

  it("blocks and preserves an unsafe existing Map path", async () => {
    const project = await createProject();
    const outside = await writeCandidate(project);
    const mapPath = path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.symlink(outside, mapPath);
    const candidate = await writeCandidate(project);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.state).toBe("blocked");
    expect(plan.actions).toEqual([]);
    expect((await fs.lstat(mapPath)).isSymbolicLink()).toBe(true);
  });

  it("is healthy only when the valid Map and current recognized trigger are present", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    await fs.writeFile(path.join(project, "AGENTS.md"), `${renderAgentsBlock()}\n`);

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.state).toBe("healthy");
    expect(plan.actions).toEqual([]);
    expect(renderInitPlan(plan)).toContain("already initialized");
  });
});

describe("navi init arguments and candidate safety", () => {
  it("parses target, map-file, expect-plan, and write", () => {
    expect(parseInitArgs([
      "--target", "demo", "--map-file", "candidate.md", "--expect-plan", "preview", "--write",
    ], "/tmp/root")).toEqual({
      targetDir: "/tmp/root/demo",
      mapFile: "/tmp/root/candidate.md",
      expectPlan: "preview",
      write: true,
    });
  });

  it.each(["--target", "--map-file", "--expect-plan", "--write"])("rejects duplicate %s options", (option) => {
    const value = option === "--write" ? [option, option] : [option, "one", option, "two"];
    expect(() => parseInitArgs(value, "/tmp/root")).toThrow(/duplicate/i);
  });

  it.each(["--target", "--map-file", "--expect-plan"])("requires one following value for %s", (option) => {
    expect(() => parseInitArgs([option], "/tmp/root")).toThrow(/missing value/i);
    expect(() => parseInitArgs([option, "--write"], "/tmp/root")).toThrow(/missing value/i);
  });

  it("rejects --expect-plan without --write", () => {
    expect(() => parseInitArgs(["--expect-plan", "preview"], "/tmp/root")).toThrow(/requires --write/i);
  });

  it("renders a migration message for the removed --suggest-map option", async () => {
    const io = testIo();
    const code = await runNaviInitCli(["--suggest-map"], io);
    expect(code).toBe(1);
    expect(io.errors()).toMatch(/--suggest-map.*removed/i);
  });

  it("rejects write without expect-plan when actions are required", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const io = testIo();

    const code = await runNaviInitCli(["--target", project, "--write"], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/--expect-plan/i);
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
  });

  it("permits pre-Task-3 guarded write with expect-plan present", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", "pre-task-3", "--write",
    ], io);

    expect(code).toBe(0);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(confirmedMap());
    await expect(fs.readFile(path.join(project, "AGENTS.md"), "utf8")).resolves.toContain("Navi Progress Map Rules");
  });

  it("rejects a candidate inside the canonical target root", async () => {
    const project = await createProject();
    const candidate = path.join(project, "candidate.md");
    await fs.writeFile(candidate, confirmedMap());
    await expect(buildInitPlan({ targetDir: project, mapFile: candidate })).rejects.toThrow(/outside.*target|inside.*target/i);
  });

  it("rejects symlinked and non-regular candidate paths", async () => {
    const project = await createProject();
    const regular = await writeCandidate(project);
    const symlink = path.join(path.dirname(project), "candidate-link.md");
    const directory = path.join(path.dirname(project), "candidate-dir");
    await fs.symlink(regular, symlink);
    await fs.mkdir(directory);

    await expect(buildInitPlan({ targetDir: project, mapFile: symlink })).rejects.toThrow(/symbolic link|symlink/i);
    await expect(buildInitPlan({ targetDir: project, mapFile: directory })).rejects.toThrow(/regular file/i);
  });

  it("rejects an invalid candidate Map", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project, "# Draft\n");
    await expect(buildInitPlan({ targetDir: project, mapFile: candidate })).rejects.toThrow(/confirmed Project Map|invalid/i);
  });
});

describe("navi init guarded writes", () => {
  it("preserves existing AGENTS.md content when adding the trigger", async () => {
    const project = await createProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Project Instructions\n\nKeep this existing rule.\n");
    const candidate = await writeCandidate(project);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(agents).toMatch(/^# Project Instructions\n\nKeep this existing rule\./);
    expect(agents.match(/Navi Progress Map Rules/g)).toHaveLength(1);
  });

  it("upgrades only a recognized deployed block and refuses edited managed blocks", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const agentsPath = path.join(project, "AGENTS.md");
    const previous = renderAgentsBlock(false);
    await fs.writeFile(agentsPath, `before\n${previous}\nafter\n`);

    const plan = await buildInitPlan({ targetDir: project });
    expect(plan.actions[0]).toMatchObject({ kind: "modify", previousContent: `before\n${previous}\nafter\n` });
    expect(plan.actions[0]?.content).toMatch(/^before\n/);
    expect(plan.actions[0]?.content).toMatch(/after\n$/);

    await fs.writeFile(agentsPath, `${renderAgentsBlock().replace("Navi Progress Map Rules", "Navi Progress Map Rulez")}\n`);
    await expect(buildInitPlan({ targetDir: project })).rejects.toThrow(/managed Navi block/i);
  });

  it("recognizes absent, exact, and unsafe managed blocks", () => {
    expect(recognizeNaviManagedBlock("# User\n")).toEqual({ kind: "absent" });
    expect(recognizeNaviManagedBlock(renderAgentsBlock())).toMatchObject({ kind: "recognized" });
    expect(recognizeNaviManagedBlock(`${NAVI_AGENTS_BLOCK_START}\nchanged\n${NAVI_AGENTS_BLOCK_END}`)).toEqual({ kind: "unsafe" });
  });

  it("rejects stale target state before writing any action", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });
    await fs.writeFile(path.join(project, "AGENTS.md"), "# Appeared\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/already exists/i);
    await expect(fs.access(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH))).rejects.toThrow();
  });

  it("rejects a stale guarded modification", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Original\n");
    const plan = await buildInitPlan({ targetDir: project, write: true });
    await fs.writeFile(agentsPath, "# Changed\n");

    await expect(applyInitPlan(plan)).rejects.toThrow(/changed since planning/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("# Changed\n");
  });

  it("rejects final-path and parent-directory symlinks", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Original\n");
    const plan = await buildInitPlan({ targetDir: project, write: true });
    const outside = path.join(path.dirname(project), "outside-agents.md");
    await fs.writeFile(outside, "# Original\n");
    await fs.unlink(agentsPath);
    await fs.symlink(outside, agentsPath);
    await expect(applyInitPlan(plan)).rejects.toThrow(/symlink/i);
    await expect(fs.readFile(outside, "utf8")).resolves.toBe("# Original\n");

    const second = await createProject();
    const candidate = await writeCandidate(second);
    const secondPlan = await buildInitPlan({ targetDir: second, mapFile: candidate, write: true });
    const outsideDir = path.join(path.dirname(second), "outside-navi");
    await fs.mkdir(outsideDir);
    await fs.symlink(outsideDir, path.join(second, ".navi"));
    await expect(applyInitPlan(secondPlan)).rejects.toThrow(/symlink/i);
    await expect(fs.readdir(outsideDir)).resolves.toEqual([]);
  });

  it("rejects unsafe or malformed externally supplied actions", async () => {
    const project = await createProject();
    const outside = path.join(path.dirname(project), "outside.md");

    await expect(applyInitPlan(externalPlan(project, [{
      kind: "create", relativePath: "AGENTS.md", absolutePath: outside, summary: "mismatch", content: "x",
    }]))).rejects.toThrow(/does not match/i);
    await expect(applyInitPlan(externalPlan(project, [{
      kind: "create", relativePath: "../outside.md", absolutePath: outside, summary: "escape", content: "x",
    }]))).rejects.toThrow(/outside target/i);
    await expect(applyInitPlan(externalPlan(project, [{
      kind: "create", relativePath: "AGENTS.md", absolutePath: path.join(project, "AGENTS.md"), summary: "missing",
    }]))).rejects.toThrow(/missing content/i);
    await expect(applyInitPlan(externalPlan(project, [{
      kind: "modify", relativePath: "AGENTS.md", absolutePath: path.join(project, "AGENTS.md"), summary: "guard", content: "x",
    }]))).rejects.toThrow(/previous content/i);
    await expect(fs.access(outside)).rejects.toThrow();
  });

  it("rejects an absolute relativePath without writing anything", async () => {
    const project = await createProject();
    const absolutePath = path.join(project, "absolute.md");

    await expect(applyInitPlan(externalPlan(project, [{
      kind: "create",
      relativePath: absolutePath,
      absolutePath,
      summary: "absolute relative path",
      content: "# Must not write\n",
    }]))).rejects.toThrow(/absolute/i);

    await expect(fs.access(absolutePath)).rejects.toThrow();
  });

  it("preflights a malformed later action before writing an earlier valid action", async () => {
    const project = await createProject();
    const firstPath = path.join(project, "first.md");
    const existingPath = path.join(project, "existing.md");
    await fs.writeFile(existingPath, "# Existing\n");

    await expect(applyInitPlan(externalPlan(project, [
      {
        kind: "create",
        relativePath: "first.md",
        absolutePath: firstPath,
        summary: "valid earlier action",
        content: "# First\n",
      },
      {
        kind: "modify",
        relativePath: "existing.md",
        absolutePath: existingPath,
        summary: "malformed later action",
        content: "# Changed\n",
      },
    ]))).rejects.toThrow(/previous content/i);

    await expect(fs.access(firstPath)).rejects.toThrow();
    await expect(fs.readFile(existingPath, "utf8")).resolves.toBe("# Existing\n");
  });

  it("rejects unsafe target-relative paths and non-directory targets", async () => {
    expect(() => resolveTargetPath("/tmp/example-project", "../outside.md")).toThrow(/outside target/i);
    const project = await createProject();
    const file = path.join(project, "file.txt");
    await fs.writeFile(file, "not a directory");
    await expect(buildInitPlan({ targetDir: file })).rejects.toThrow(/directory/i);
  });
});
