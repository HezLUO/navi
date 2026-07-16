import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runNaviInitCli } from "../../src/cli/navi-init";
import { applyInitPlan } from "../../src/cli/navi-init-apply";
import {
  buildInitPlan,
  type InitPlan,
} from "../../src/cli/navi-init-plan";
import {
  LEGACY_PROJECT_MAP_ANCHORS,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  REQUIRED_PROJECT_MAP_ANCHORS,
  parseProjectMapDocument,
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
      legacyMap().replace("map_status: confirmed", "map_status: draft"),
    );
    const candidate = await writeCandidate(project);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    const changed = legacyMap().replace("map_status: confirmed", "map_status: proposed");
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
});
