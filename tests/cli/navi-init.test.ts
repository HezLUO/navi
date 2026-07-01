import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  NAVI_AGENTS_BLOCK_START,
  applyInitPlan,
  buildInitPlan,
  parseInitArgs,
  renderInitPlan,
  resolveTargetPath,
  runNaviInitCli,
} from "../../src/cli/navi-init";

async function makeProject(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-init-"));
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

    expect(plan.actions.find((action) => action.relativePath === "docs/along/project-maps/navi-project-map.md")?.kind).toBe("skip");
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe("# Existing Map\n\nKeep this confirmed map.\n");
  });

  it("rejects unsafe target-relative writes", () => {
    expect(() => resolveTargetPath("/tmp/example-project", "../outside.md")).toThrow(/outside target/i);
  });

  it("rejects target paths that are not directories", async () => {
    const project = await makeProject();
    const fileTarget = path.join(project, "not-a-directory.txt");
    await fs.writeFile(fileTarget, "not a directory");

    await expect(buildInitPlan({ targetDir: fileTarget, write: false })).rejects.toThrow(/directory/i);
  });
});

describe("navi init CLI helpers", () => {
  it("parses target and write flags", () => {
    expect(parseInitArgs(["--target", "/tmp/demo", "--write"], "/tmp/fallback")).toEqual({
      targetDir: "/tmp/demo",
      write: true,
    });
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
