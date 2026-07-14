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

describe("Navi project trigger ownership", () => {
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
- For bounded Codex worktrees, include the source main task ID and Navi Lane Handoff reference in the delegation; when host task messaging is available, emit once on decision-required, blocked, or review-ready, and use the explicit local fallback otherwise. Delivery does not authorize resume, scope expansion, merge, push, tag, or release.
- Do not stage, commit, push, release, initialize, or change project lifecycle unless the current authorization covers that action.
<!-- NAVI:END -->`);
  });

  it.each([
    ["missing", undefined, "missing"],
    ["current", renderAgentsBlock(), "current"],
    ["confirmed Map without Lane Handoff", LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF, "legacy"],
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

  it.each([
    ["confirmed Map without Lane Handoff", LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF],
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

  it("previews an upgrade from the pre-Lane-Handoff confirmed Map trigger", async () => {
    const project = await createProject();
    await writeCanonicalMap(project);
    await fs.writeFile(
      path.join(project, "AGENTS.md"),
      LEGACY_CONFIRMED_MAP_AGENTS_BLOCK_WITHOUT_LANE_HANDOFF,
    );

    const plan = await buildInitPlan({ targetDir: project });

    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0]).toMatchObject({ kind: "modify", relativePath: "AGENTS.md" });
    expect(plan.actions[0]?.content).toContain("Navi Lane Handoff reference");
    expect(plan.actions[0]?.content).not.toContain(
      "Treat worktree completion as review-ready state",
    );
  });

  it("recognizes absent, exact, and unsafe managed blocks", () => {
    expect(recognizeNaviManagedBlock("# User\n")).toEqual({ kind: "absent" });
    expect(recognizeNaviManagedBlock(renderAgentsBlock())).toMatchObject({ kind: "recognized" });
    expect(recognizeNaviManagedBlock(`${NAVI_AGENTS_BLOCK_START}\nchanged\n${NAVI_AGENTS_BLOCK_END}`)).toEqual({ kind: "unsafe" });
  });
});
