import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseInitArgs,
  renderInitPlan,
  runNaviInitCli,
} from "../../src/cli/navi-init";
import { applyInitPlan } from "../../src/cli/navi-init-apply";
import {
  buildInitPlan,
  resolveTargetPath,
  type InitPlan,
} from "../../src/cli/navi-init-plan";
import {
  NAVI_AGENTS_BLOCK_END,
  NAVI_AGENTS_BLOCK_START,
  inspectProjectTrigger,
  recognizeNaviManagedBlock,
  renderAgentsBlock,
} from "../../src/cli/navi-project-trigger";
import {
  LEGACY_PROJECT_MAP_ANCHORS,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  REQUIRED_PROJECT_MAP_ANCHORS,
  parseProjectMapDocument,
} from "../../src/cli/navi-project-map";
import {
  LEGACY_AGENTS_BLOCK_WITHOUT_SCOPED_AUTHORIZATION,
  LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION,
  LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF,
} from "../fixtures/navi-legacy-agents-blocks";

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

describe("navi init arguments and command journey", () => {
  it("does not accept --suggest-map as a public init option", () => {
    expect(() => parseInitArgs(["--suggest-map"], "/tmp/project")).toThrow(/removed|unknown option/i);
  });

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

  it("writes one fingerprint-bound exact legacy Outcome Boundary upgrade", async () => {
    const project = await createProject();
    await writeCanonicalMap(project, legacyConfirmedMap());
    const candidateText = currentConfirmedMapWithOnlyOutcomeBoundaryAdded();
    const candidate = await writeCandidate(project, candidateText);
    const preview = await buildInitPlan({ targetDir: project, mapFile: candidate });
    const io = testIo();

    const code = await runNaviInitCli([
      "--target", project, "--map-file", candidate, "--expect-plan", fingerprintFor(preview), "--write",
    ], io);

    expect(code).toBe(0);
    await expect(fs.readFile(path.join(project, NAVI_PROJECT_MAP_RELATIVE_PATH), "utf8")).resolves.toBe(candidateText);
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
});
