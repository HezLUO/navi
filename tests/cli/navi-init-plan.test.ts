import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  renderInitPlan,
  runNaviInitCli,
} from "../../src/cli/navi-init";
import {
  buildInitPlan,
  resolveTargetPath,
} from "../../src/cli/navi-init-plan";
import {
  inspectProjectTrigger,
  renderAgentsBlock,
} from "../../src/cli/navi-project-trigger";
import {
  LEGACY_PROJECT_MAP_ANCHORS,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  parseProjectMapDocument,
  REQUIRED_PROJECT_MAP_ANCHORS,
} from "../../src/cli/navi-project-map";

const tempRoots = new Set<string>();

function confirmedMap(suffix = ""): string {
  return `---
navi_map: 2
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

function legacyMap(suffix = ""): string {
  return `---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-14
---
# Navi Project Map

${LEGACY_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed value ${index + 1}${suffix}.`,
).join("\n\n")}
`;
}

function renderConfirmedMap(version: 1 | 2, anchors: readonly string[]): string {
  return `---
navi_map: ${version}
map_status: confirmed
project_status: active
last_confirmed: 2026-07-16
---
# Navi Project Map

${anchors.map((anchor) => {
  const heading = anchor.replace("navi:", "").split("-").map(
    (part) => part[0]!.toUpperCase() + part.slice(1),
  ).join(" ");
  const value = anchor === "navi:route-to-outcome" ? "Confirmed route." : `Confirmed ${heading}.`;
  return `<!-- ${anchor} -->\n## ${heading}\n\n${value}`;
}).join("\n\n")}
`;
}

const legacyConfirmedMap = () => renderConfirmedMap(1, LEGACY_PROJECT_MAP_ANCHORS);
const currentConfirmedMapWithOnlyOutcomeBoundaryAdded = () =>
  renderConfirmedMap(2, REQUIRED_PROJECT_MAP_ANCHORS);

function renderConfirmedMapWithSyntax(
  version: 1 | 2,
  anchors: readonly string[],
  options: {
    metadataLines?: readonly string[];
    anchorSeparator?: string;
    lineEnding?: "\n" | "\r\n";
  } = {},
): string {
  const metadataLines = options.metadataLines ?? [
    `navi_map: ${version}`,
    "map_status: confirmed",
    "project_status: active",
    "last_confirmed: 2026-07-16",
  ];
  const anchorSeparator = options.anchorSeparator ?? "\n\n";
  const text = `---\n${metadataLines.join("\n")}\n---\n# Navi Project Map\n\n${anchors.map((anchor) => {
    const heading = anchor.replace("navi:", "").split("-").map(
      (part) => part[0]!.toUpperCase() + part.slice(1),
    ).join(" ");
    const value = anchor === "navi:route-to-outcome" ? "Confirmed route." : `Confirmed ${heading}.`;
    return `<!-- ${anchor} -->\n## ${heading}\n\n${value}`;
  }).join(anchorSeparator)}\n`;
  return options.lineEnding === "\r\n" ? text.replace(/\n/g, "\r\n") : text;
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

  it("prioritizes mature-project evidence when the confirmed Map is missing", async () => {
    const project = await createProject();
    await fs.writeFile(path.join(project, "README.md"), "# Project\n");
    await fs.writeFile(path.join(project, "ROADMAP.md"), "# Roadmap\n");
    await fs.writeFile(path.join(project, "STATUS.md"), "# Status\n");
    await fs.writeFile(path.join(project, "package.json"), "{}\n");

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.state).toBe("needs-confirmed-map");
    expect(plan.evidencePaths).toEqual(["README.md", "ROADMAP.md", "STATUS.md"]);
    expect(plan.actions).toEqual([]);
  });

  it("reports each exact root plan, spec, handoff, and workflow as missing-map evidence", async () => {
    for (const relativePath of ["PLAN.md", "SPEC.md", "HANDOFF.md", "WORKFLOW.md"]) {
      const project = await createProject();
      await fs.writeFile(path.join(project, relativePath), `# ${relativePath}\n`);

      const plan = await buildInitPlan({ targetDir: project });

      expect(plan.state).toBe("needs-confirmed-map");
      expect(plan.evidencePaths).toEqual([relativePath]);
      expect(plan.actions).toEqual([]);
    }
  });

  it("does not let nested package READMEs crowd a root ROADMAP out of InitPlan evidence", async () => {
    const project = await createProject();
    await fs.writeFile(path.join(project, "README.md"), "# Project\n");
    await fs.writeFile(path.join(project, "ROADMAP.md"), "# Roadmap\n");
    await fs.mkdir(path.join(project, "packages", "alpha"), { recursive: true });
    await fs.mkdir(path.join(project, "packages", "beta"), { recursive: true });
    await fs.writeFile(path.join(project, "packages", "alpha", "README.md"), "# Alpha\n");
    await fs.writeFile(path.join(project, "packages", "beta", "README.md"), "# Beta\n");

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.evidencePaths).toEqual([
      "README.md",
      "ROADMAP.md",
      "packages/alpha/README.md",
    ]);
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

  it("keeps a legacy v1 Map readable and permits trigger-only activation", async () => {
    const project = await createProject();
    await writeCanonicalMap(project, legacyConfirmedMap());

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.actions.map((action) => action.relativePath)).toEqual(["AGENTS.md"]);
  });

  it("requires v2 for a newly created Map", async () => {
    const project = await createProject();
    const candidate = await writeCandidate(project, legacyConfirmedMap());

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
    expect(plan.diagnostic).toMatch(/version 2|Outcome Boundary/i);
  });

  it("plans one exact v1-to-v2 Outcome Boundary augmentation", async () => {
    const project = await createProject();
    const before = legacyConfirmedMap();
    const after = currentConfirmedMapWithOnlyOutcomeBoundaryAdded();
    await writeCanonicalMap(project, before);
    const candidate = await writeCandidate(project, after);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan.actions[0]).toMatchObject({
      kind: "modify",
      relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
      previousContent: before,
      content: after,
    });
  });

  it.each([
    {
      name: "no separator whitespace",
      current: [
        "navi_map:1",
        "map_status:confirmed",
        "project_status:active",
        "last_confirmed:2026-07-16",
      ],
      candidate: [
        "navi_map:2",
        "map_status:confirmed",
        "project_status:active",
        "last_confirmed:2026-07-17",
      ],
    },
    {
      name: "tabs and trailing whitespace",
      current: [
        "navi_map:\t+01  ",
        "map_status:\tconfirmed\t",
        "project_status:\tactive  ",
        "last_confirmed:\t2026-07-16  ",
      ],
      candidate: [
        "navi_map: 02\t",
        "map_status:\tconfirmed\t",
        "project_status:\tactive  ",
        "last_confirmed: 2026-07-17\t",
      ],
    },
    {
      name: "mixed spaces",
      current: [
        "navi_map:    1",
        "map_status:  confirmed",
        "project_status: active",
        "last_confirmed:   2026-07-16",
      ],
      candidate: [
        "navi_map:\t2",
        "map_status:  confirmed",
        "project_status: active",
        "last_confirmed:\t2026-07-18",
      ],
    },
  ])("accepts an exact upgrade with parser-accepted $name frontmatter", async ({ current, candidate }) => {
    const project = await createProject();
    const before = renderConfirmedMapWithSyntax(1, LEGACY_PROJECT_MAP_ANCHORS, { metadataLines: current });
    const after = renderConfirmedMapWithSyntax(2, REQUIRED_PROJECT_MAP_ANCHORS, { metadataLines: candidate });
    expect(parseProjectMapDocument(before).kind).toBe("valid");
    expect(parseProjectMapDocument(after).kind).toBe("valid");
    await writeCanonicalMap(project, before);
    const candidatePath = await writeCandidate(project, after);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidatePath });

    expect(plan.actions[0]).toMatchObject({
      kind: "modify",
      previousContent: before,
      content: after,
    });
  });

  it.each([
    ["adjacent anchors", ""],
    ["single-newline anchors", "\n"],
    ["blank-line anchors", "\n\n"],
    ["indented anchors", "\n  "],
  ])("accepts an exact upgrade with parser-accepted %s", async (_name, anchorSeparator) => {
    const project = await createProject();
    const before = renderConfirmedMapWithSyntax(1, LEGACY_PROJECT_MAP_ANCHORS, { anchorSeparator });
    const after = renderConfirmedMapWithSyntax(2, REQUIRED_PROJECT_MAP_ANCHORS, { anchorSeparator });
    expect(parseProjectMapDocument(before).kind).toBe("valid");
    expect(parseProjectMapDocument(after).kind).toBe("valid");
    await writeCanonicalMap(project, before);
    const candidatePath = await writeCandidate(project, after);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidatePath });

    expect(plan.actions[0]).toMatchObject({ kind: "modify", content: after });
  });

  it("accepts CRLF normalization and a last_confirmed-only change", async () => {
    const project = await createProject();
    const before = renderConfirmedMapWithSyntax(1, LEGACY_PROJECT_MAP_ANCHORS, { lineEnding: "\r\n" });
    const after = renderConfirmedMapWithSyntax(2, REQUIRED_PROJECT_MAP_ANCHORS, {
      metadataLines: [
        "navi_map: 2",
        "map_status: confirmed",
        "project_status: active",
        "last_confirmed: 2026-07-19",
      ],
    });
    await writeCanonicalMap(project, before);
    const candidatePath = await writeCandidate(project, after);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidatePath });

    expect(plan.actions[0]).toMatchObject({ kind: "modify", content: after });
  });

  it.each([
    ["map_status spacing", (text: string) => text.replace("map_status: confirmed", "map_status:\tconfirmed")],
    ["project_status spacing", (text: string) => text.replace("project_status: active", "project_status:  active")],
    ["extra metadata", (text: string) => text.replace("last_confirmed: 2026-07-16", "last_confirmed: 2026-07-16\nowner: Navi")],
    ["metadata order", (text: string) => text.replace("map_status: confirmed\nproject_status: active", "project_status: active\nmap_status: confirmed")],
    ["non-boundary heading", (text: string) => text.replace("## Route To Outcome", "## Route Toward Outcome")],
    ["non-boundary body", (text: string) => text.replace("Confirmed route.", "Changed route.")],
    ["non-boundary anchor spacing", (text: string) => text.replace("<!-- navi:current-position -->", "  <!-- navi:current-position -->")],
  ])("rejects an upgrade with a parser-accepted %s mutation", async (_name, mutate) => {
    const project = await createProject();
    const before = legacyConfirmedMap();
    const after = mutate(currentConfirmedMapWithOnlyOutcomeBoundaryAdded());
    expect(parseProjectMapDocument(after).kind).toBe("valid");
    await writeCanonicalMap(project, before);
    const candidatePath = await writeCandidate(project, after);

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidatePath });

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
  });

  it("rejects a legacy upgrade that also changes Route To Outcome", async () => {
    const project = await createProject();
    await writeCanonicalMap(project, legacyConfirmedMap());
    const candidate = await writeCandidate(
      project,
      currentConfirmedMapWithOnlyOutcomeBoundaryAdded().replace("Confirmed route", "Changed route"),
    );

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
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
    expect(plan.diagnostic).toMatch(/generic Map update|different/i);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(original);
  });

  it("plans an exact guarded repair for a recognized-version-1 invalid Map", async () => {
    const project = await createProject();
    const invalid = legacyMap().replace("map_status: confirmed", "map_status: draft");
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

  it("requires v2 when repairing a recognized-version-1 invalid Map", async () => {
    const project = await createProject();
    const invalid = legacyMap().replace("map_status: confirmed", "map_status: draft");
    await writeCanonicalMap(project, invalid);
    const candidate = await writeCandidate(project, legacyConfirmedMap());

    const plan = await buildInitPlan({ targetDir: project, mapFile: candidate });

    expect(plan).toMatchObject({ state: "blocked", actions: [] });
    expect(plan.diagnostic).toMatch(/version 2|Outcome Boundary/i);
  });

  it("refuses repair when .navi changes after safe invalid-Map inspection without reading external bytes", async () => {
    const project = await createProject();
    const invalid = legacyMap().replace("map_status: confirmed", "map_status: draft");
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
    ["unsupported", confirmedMap().replace("navi_map: 2", "navi_map: 3")],
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

describe("navi init candidate safety", () => {
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

describe("navi init target confinement", () => {
  it("rejects unsafe target-relative paths and non-directory targets", async () => {
    expect(() => resolveTargetPath("/tmp/example-project", "../outside.md")).toThrow(/outside target/i);
    const project = await createProject();
    const file = path.join(project, "file.txt");
    await fs.writeFile(file, "not a directory");
    await expect(buildInitPlan({ targetDir: file })).rejects.toThrow(/directory/i);
  });
});
