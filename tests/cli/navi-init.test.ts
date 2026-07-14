import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  NAVI_AGENTS_BLOCK_END,
  NAVI_AGENTS_BLOCK_START,
  applyInitPlan,
  buildInitPlan,
  inspectProjectTrigger,
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
  parseProjectMapDocument,
} from "../../src/cli/navi-project-map";
import {
  LEGACY_AGENTS_BLOCK_WITHOUT_SCOPED_AUTHORIZATION,
  LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION,
} from "../fixtures/navi-legacy-agents-blocks";

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

function fingerprintFor(plan: InitPlan): string {
  if (plan.fingerprint === undefined) throw new Error("Expected an actionable plan fingerprint");
  return plan.fingerprint;
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

  it("blocks a symlinked AGENTS.md whose external bytes contain the current trigger", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const externalAgents = path.join(path.dirname(project), "external-current-agents.md");
    const externalText = `${renderAgentsBlock()}\n`;
    await fs.writeFile(externalAgents, externalText);
    await fs.symlink(externalAgents, path.join(project, "AGENTS.md"));

    const plan = await buildInitPlan({ targetDir: project, write: true });
    const io = testIo();
    const code = await runNaviInitCli(["--target", project, "--write"], io);

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
    expect(plan.diagnostic).toMatch(/AGENTS\.md.*symbolic link|unsafe/i);
    await expect(inspectProjectTrigger(project)).resolves.toMatchObject({ kind: "unsafe" });
    expect(code).toBe(1);
    expect(io.output()).not.toMatch(/healthy|actionable|applied/i);
    await expect(fs.readFile(externalAgents, "utf8")).resolves.toBe(externalText);
  });

  it("blocks a symlinked AGENTS.md whose external bytes are project-owned content", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const externalAgents = path.join(path.dirname(project), "external-project-agents.md");
    const externalText = "# External project instructions\nDo not touch.\n";
    await fs.writeFile(externalAgents, externalText);
    await fs.symlink(externalAgents, path.join(project, "AGENTS.md"));

    const plan = await buildInitPlan({ targetDir: project });
    const io = testIo();
    const code = await runNaviInitCli(["--target", project], io);

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
    expect(plan.diagnostic).toMatch(/AGENTS\.md.*symbolic link|unsafe/i);
    expect(code).toBe(1);
    expect(io.output()).not.toMatch(/healthy|actionable|Apply with/i);
    await expect(fs.readFile(externalAgents, "utf8")).resolves.toBe(externalText);
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

  it("refuses repair when .navi changes after safe invalid-Map inspection without reading external bytes", async () => {
    const project = await createProject();
    const invalid = confirmedMap().replace("map_status: confirmed", "map_status: draft");
    const mapPath = await writeCanonicalMap(project, invalid);
    const candidate = await writeCandidate(project);
    const mapDirectory = path.dirname(mapPath);
    const movedDirectory = path.join(project, "checked-navi");
    const externalDirectory = path.join(path.dirname(project), "external-repair-navi");
    const externalMap = path.join(externalDirectory, "project-map.md");
    const externalText = confirmedMap(" external");
    await fs.mkdir(externalDirectory);
    await fs.writeFile(externalMap, externalText);
    const canonicalProject = await fs.realpath(project);

    const originalLstat = fs.lstat.bind(fs);
    let substituted = false;
    const lstat = vi.spyOn(fs, "lstat").mockImplementation(async (...args: Parameters<typeof fs.lstat>) => {
      if (!substituted && path.resolve(String(args[0])) === path.join(canonicalProject, "AGENTS.md")) {
        substituted = true;
        await fs.rename(mapDirectory, movedDirectory);
        await fs.symlink(externalDirectory, mapDirectory);
      }
      return originalLstat(...args);
    });
    const externalReads: string[] = [];
    const originalReadFile = fs.readFile.bind(fs);
    const readFile = vi.spyOn(fs, "readFile").mockImplementation(async (...args: Parameters<typeof fs.readFile>) => {
      externalReads.push(await fs.realpath(String(args[0])));
      return originalReadFile(...args);
    });

    try {
      const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });
      expect(plan).toMatchObject({ state: "blocked", actions: [] });
      expect(plan.diagnostic).toMatch(/Map.*changed|unsafe/i);
      expect(externalReads).not.toContain(externalMap);
    } finally {
      lstat.mockRestore();
      readFile.mockRestore();
    }
    await expect(fs.readFile(path.join(movedDirectory, "project-map.md"), "utf8")).resolves.toBe(invalid);
    await expect(fs.readFile(externalMap, "utf8")).resolves.toBe(externalText);
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

  it("prints an actionable dry-run fingerprint without a generic apply command", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const io = testIo();

    const code = await runNaviInitCli(["--target", project, "--map-file", candidate], io);

    expect(code).toBe(0);
    expect(io.output()).toMatch(/^Plan fingerprint: [a-f0-9]{64}$/m);
    expect(io.output()).not.toContain("Apply with:");
  });

  it("writes only with the exact preview fingerprint", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(0);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(confirmedMap());
    await expect(fs.readFile(path.join(project, "AGENTS.md"), "utf8")).resolves.toContain("Navi Project Supervision");
  });

  it("rejects an incorrect fingerprint before writing", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", "0".repeat(64), "--write",
    ], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/fingerprint|plan.*changed|does not match/i);
    await expect(fs.access(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH))).rejects.toThrow();
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
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

describe("navi init preview drift", () => {
  it("rejects changed candidate bytes before any target write", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    await fs.writeFile(candidate, confirmedMap(" changed after preview"));
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/fingerprint|plan.*changed|does not match/i);
    await expect(fs.access(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH))).rejects.toThrow();
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
  });

  it("rejects changed AGENTS.md bytes before writing the Map", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    await fs.writeFile(path.join(project, "AGENTS.md"), "# Appeared after preview\n");
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/fingerprint|plan.*changed|does not match/i);
    await expect(fs.access(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH))).rejects.toThrow();
    await expect(fs.readFile(path.join(project, "AGENTS.md"), "utf8")).resolves.toBe("# Appeared after preview\n");
  });

  it("rejects a Map that appears after preview", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    await writeCanonicalMap(project);
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/fingerprint|plan.*changed|does not match/i);
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
  });

  it("rejects changed existing Map bytes after preview", async () => {
    const project = await createProject();
    const mapPath = await writeCanonicalMap(
      project,
      confirmedMap().replace("map_status: confirmed", "map_status: draft"),
    );
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    const changed = confirmedMap().replace("map_status: confirmed", "map_status: proposed");
    await fs.writeFile(mapPath, changed);
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(1);
    expect(io.errors()).toMatch(/fingerprint|plan.*changed|does not match/i);
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(changed);
    await expect(fs.access(path.join(project, "AGENTS.md"))).rejects.toThrow();
  });
});

describe("navi init guarded writes", () => {
  it("renders the concise confirmed-Map activation contract exactly", () => {
    expect(renderAgentsBlock).toHaveLength(0);
    expect((renderAgentsBlock as (...args: unknown[]) => string)(false)).toBe(renderAgentsBlock());
    expect(renderAgentsBlock()).toBe(`<!-- NAVI:START -->
## Navi Project Supervision

- For broad progress, next-step, stop, wait, confusion, plan-reliability, or vision-distance questions, read \`.navi/project-map.md\` before advising.
- Keep clear, bounded execution requests quiet and continue to their approved acceptance point.
- Match the response language to the user's current prompt; the saved Map language is evidence only.
- Treat a missing, invalid, unsupported, or stale Map as uncertain evidence; do not invent a stable map or rewrite it silently.
- Update the Map only when navigation judgment changes materially and only within an explicit bounded write scope or after a compact preview and approval.
- Treat worktree completion as review-ready state, not an automatic interruption; review when the result can change the current decision.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
<!-- NAVI:END -->`);
  });

  it.each([
    ["missing", undefined, "missing"],
    ["current", renderAgentsBlock(), "current"],
    ["legacy before scoped authorization", LEGACY_AGENTS_BLOCK_WITHOUT_SCOPED_AUTHORIZATION, "legacy"],
    ["legacy with scoped authorization", LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION, "legacy"],
    ["marker-wrapped garbage", `${NAVI_AGENTS_BLOCK_START}\ngarbage\n${NAVI_AGENTS_BLOCK_END}`, "invalid"],
    ["duplicate blocks", `${renderAgentsBlock()}\n${renderAgentsBlock()}`, "invalid"],
  ] as const)("classifies a %s project trigger truthfully", async (_name, content, expectedKind) => {
    const project = await createProject();
    if (content !== undefined) await fs.writeFile(path.join(project, "AGENTS.md"), content);

    await expect(inspectProjectTrigger(project)).resolves.toMatchObject({ kind: expectedKind });
  });

  it("classifies symlinked and non-regular project trigger paths as unsafe", async () => {
    const project = await createProject();
    const elsewhere = path.join(path.dirname(project), "elsewhere-agents.md");
    await fs.writeFile(elsewhere, renderAgentsBlock());
    await fs.symlink(elsewhere, path.join(project, "AGENTS.md"));

    await expect(inspectProjectTrigger(project)).resolves.toMatchObject({ kind: "unsafe" });
    await fs.rm(path.join(project, "AGENTS.md"));
    await fs.mkdir(path.join(project, "AGENTS.md"));
    await expect(inspectProjectTrigger(project)).resolves.toMatchObject({ kind: "unsafe" });
  });

  it("preserves existing AGENTS.md content when adding the trigger", async () => {
    const project = await createProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Project Instructions\n\nKeep this existing rule.\n");
    const candidate = await writeCandidate(project);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });
    await applyInitPlan(plan);

    const agents = await fs.readFile(agentsPath, "utf8");
    expect(agents).toMatch(/^# Project Instructions\n\nKeep this existing rule\./);
    expect(agents.match(/Navi Project Supervision/g)).toHaveLength(1);
  });

  it.each([
    ["legacy before scoped authorization", LEGACY_AGENTS_BLOCK_WITHOUT_SCOPED_AUTHORIZATION],
    ["legacy with scoped authorization", LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION],
  ])("upgrades only a recognized %s block and refuses edited managed blocks", async (_name, previous) => {
    const project = await createProject();
    await writeCanonicalMap(project);
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, `before\n${previous}\nafter\n`);

    const plan = await buildInitPlan({ targetDir: project });
    expect(plan.actions[0]).toMatchObject({ kind: "modify", previousContent: `before\n${previous}\nafter\n` });
    expect(plan.actions[0]?.content).toMatch(/^before\n/);
    expect(plan.actions[0]?.content).toMatch(/after\n$/);

    await fs.writeFile(agentsPath, `${renderAgentsBlock().replace("Navi Project Supervision", "Navi Project Supervison")}\n`);
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

  it("writes the Map before the trigger", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });
    const writes: string[] = [];

    await applyInitPlan(plan, {
      beforeWrite: async (relativePath) => {
        writes.push(relativePath);
      },
    });

    expect(writes).toEqual([NAVI_PROJECT_MAP_RELATIVE_PATH, "AGENTS.md"]);
  });

  it("leaves the trigger absent or unchanged when the Map write fails", async () => {
    const project = await createProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Existing instructions\n");
    const candidate = await writeCandidate(project);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });

    await expect(applyInitPlan(plan, {
      beforeWrite: async (relativePath) => {
        if (relativePath === NAVI_PROJECT_MAP_RELATIVE_PATH) throw new Error("injected Map failure");
      },
    })).rejects.toThrow(/injected Map failure/i);

    await expect(fs.access(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH))).rejects.toThrow();
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("# Existing instructions\n");
  });

  it("keeps a valid inactive Map and reports partial activation when the trigger write fails", async () => {
    const project = await createProject();
    const agentsPath = path.join(project, "AGENTS.md");
    await fs.writeFile(agentsPath, "# Existing instructions\n");
    const candidateText = confirmedMap();
    const candidate = await writeCandidate(project, candidateText);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });

    await expect(applyInitPlan(plan, {
      beforeWrite: async (relativePath) => {
        if (relativePath === "AGENTS.md") throw new Error("injected trigger failure");
      },
    })).rejects.toThrow(/partial activation/i);

    const writtenMap = await fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8");
    expect(writtenMap).toBe(candidateText);
    expect(parseProjectMapDocument(writtenMap).kind).toBe("valid");
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("# Existing instructions\n");
  });

  it("does not clean up the Map when trigger ownership becomes uncertain", async () => {
    const project = await createProject();
    const candidateText = confirmedMap();
    const candidate = await writeCandidate(project, candidateText);
    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate, write: true });

    await expect(applyInitPlan(plan, {
      afterWrite: async (relativePath) => {
        if (relativePath === "AGENTS.md") throw new Error("injected post-trigger failure");
      },
    })).rejects.toThrow(/partial activation/i);

    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(candidateText);
    await expect(fs.readFile(path.join(project, "AGENTS.md"), "utf8")).resolves.toContain("Navi Project Supervision");
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
