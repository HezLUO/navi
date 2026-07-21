import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderAgentsBlock } from "../../src/cli/navi-project-trigger";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
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

describe("Navi skill and package structure", () => {
  it("routes installed project writes to the Project Map owner", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    expect(skill).toMatch(
      /installed plugin[\s\S]*project-map-v1\.md[\s\S]*package-local init/i,
    );
    expect(skill).not.toContain("~/.codex/plugins/cache");
  });

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

    expect(skill).toContain("name: navi");
    expect(skill).toContain("description:");
    expect(skill).toContain("turn-bound self-initiation");
    expect(skill).toContain("must not silently create");
    expect(skill).toContain("must not silently write");
    expect(skill).toContain("references/working-thread-v1.md");
  });

  it("routes each supervision responsibility to one canonical reference", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const owners = {
      "supervision-v1.md": ["Alpha 4 Supervision Layer", "Alpha 12 Quietness And Rule Density Control"],
      "project-map-v1.md": ["Progress Map", "Confirmed Project Map Model", "Rhythm Map"],
      "project-entry-v1.md": ["Evidence Profile", "Profile Routing", "Confirmed Exit"],
      "challenge-v1.md": ["Challenge Layer", "Challenge Brief", "Professional Judgment Boundary"],
      "working-thread-v1.md": ["Working Thread Definition", "Record Location", "Bounded Adaptive Write-Back"],
      "lane-handoff-v1.md": ["Unified Event", "Pre-Send Wire-Format Check", "Source Main Task"],
    } as const;

    for (const [file, headings] of Object.entries(owners)) {
      expect(skill).toContain(`references/${file}`);
      const canonical = await readRepoText(`.agents/skills/navi/references/${file}`);
      for (const heading of headings) expect(canonical).toContain(`## ${heading}`);
    }

    const requiredReferences = skill.slice(
      skill.indexOf("## Required References"),
      skill.indexOf("## Hard Boundaries"),
    );
    const projectEntryReference = requiredReferences
      .split("\n")
      .find((line) => line.includes("references/project-entry-v1.md"));
    expect(projectEntryReference).toBe(
      "- `references/project-entry-v1.md` is the sole owner for adaptive project entry, Evidence Profile classification, profile-to-strategy routing, and baseline formation.",
    );
    for (const duplicatedDetail of [
      "coherent",
      "conflicting",
      "insufficient",
      "stale",
      "Evidence-First Candidate",
      "Conflict Resolution",
      "Guided Baseline Formation",
      "Targeted Code Check",
    ]) {
      expect(projectEntryReference).not.toContain(duplicatedDetail);
    }

    const behaviorGuardrails = skill.slice(
      skill.indexOf("## Behavior Guardrails"),
      skill.indexOf("## Output Style"),
    );
    expect(behaviorGuardrails).toContain(
      "`references/project-map-v1.md` for confirmed Map authority, Progress/Rhythm Map rendering, lifecycle, maintenance, language following, and initialization preview/write boundary.",
    );
    expect(behaviorGuardrails).not.toContain("initialization baseline policy");
  });

  it("routes explicit Navi update requests to one truthful owner", async () => {
    const skill = normalizeWhitespace(
      await readRepoText(".agents/skills/navi/SKILL.md"),
    );

    expect(skill).toContain("references/update-checkpoint-v1.md");
    expect(skill).toContain("explicit Navi update request");
    expect(skill).toContain("accepted Native Absent boundary");
    expect(skill).toContain("must not claim automatic or same-task update");
    expect(skill).not.toContain("codex plugin marketplace upgrade navi-source --json");
  });

  it("documents project-local Navi trigger sources", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");

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

  });

  it("keeps the package documentation truthful about version-2 Map writes", async () => {
    const [readme, chineseReadme, pluginReadme] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const surface of [readme, pluginReadme]) {
      expect(surface).toMatch(/Current main writes Project Map contract version 2[\s\S]*user-confirmed Outcome Boundary/i);
      expect(surface).toMatch(/version-1 Maps remain readable[\s\S]*do not require immediate reinitialization/i);
      expect(surface).toMatch(/fingerprint-bound approved Outcome Boundary augmentation[\s\S]*does not migrate or rewrite it automatically/i);
      expect(surface).toMatch(/current-main behavior remains unreleased[\s\S]*later tag explicitly includes it/i);
    }
    expect(chineseReadme).toMatch(/当前 main 使用 Project Map contract version 2[\s\S]*经过用户确认的 Outcome Boundary/);
    expect(chineseReadme).toMatch(/version-1 Map 仍然可读[\s\S]*不需要立即重新初始化/);
    expect(chineseReadme).toMatch(/预览、指纹绑定和用户批准[\s\S]*不会自动迁移或重写/);
  });

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
      interface: { displayName: string };
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
    expect(marketplace.interface.displayName).toBe("Navi Releases");
    expect(marketplace.plugins).toEqual([
      expect.objectContaining({
        name: "navi",
        source: { source: "local", path: "./plugins/navi" },
        policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
        category: "Productivity",
      }),
    ]);
  });

  it("keeps the active trigger template exactly aligned with generated init output", async () => {
    const exists = await repoPathExists("docs/navi/project-trigger-template.md");
    expect(exists).toBe(true);
    if (!exists) return;
    const template = await readRepoText("docs/navi/project-trigger-template.md");

    expect(template).toBe(`${renderAgentsBlock()}\n`);
  });

  it("ships the minimal repo-contained plugin package layout and manifest", async () => {
    for (const requiredPath of [
      "plugins/navi/.codex-plugin/plugin.json",
      "plugins/navi/README.md",
      "plugins/navi/VERSION.md",
      "plugins/navi/skills/navi/SKILL.md",
      "plugins/navi/skills/navi/agents/openai.yaml",
      "plugins/navi/skills/navi/references/challenge-v1.md",
      "plugins/navi/skills/navi/references/lane-handoff-v1.md",
      "plugins/navi/skills/navi/references/plan-reliability-v1.md",
      "plugins/navi/skills/navi/references/project-entry-v1.md",
      "plugins/navi/skills/navi/references/project-map-v1.md",
      "plugins/navi/skills/navi/references/supervision-v1.md",
      "plugins/navi/skills/navi/references/update-checkpoint-v1.md",
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
    expect(manifest.description).toBe(
      "Navi helps non-expert Codex users understand project progress, decide what comes next, and initialize project-local supervision with explicit approval.",
    );
    expect(manifest.keywords).toEqual([
      "codex",
      "navi",
      "progress-map",
      "project-supervision",
      "project-map",
      "decision-support",
    ]);
    expect(manifest.interface.displayName).toBe("Navi");
    expect(manifest.interface.developerName).toBe("Navi Contributors");
    expect(manifest.interface.shortDescription).toBe(
      "Project progress, next-step, stop/wait, and decision guidance.",
    );
    expect(manifest.interface.longDescription).toContain("exact approved preview");
    expect(manifest.interface.category).toBe("Productivity");
    expect(manifest.interface.capabilities).toContain("Interactive");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Show where this project stands, what comes next, and what I need to decide.",
      "Should we continue, stop, wait, or move to the next stage?",
      "Set up Navi for this project using a read-only preview before any project write.",
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

    expect(packageJson.private).toBe(true);
    expect(packageJson.description).toContain(
      "Navi helps non-expert users understand, supervise, and steer expert agents",
    );
    expect(packageJson.description).toContain(
      "maps, challenge, pause, stage/vision, and coordination guidance",
    );
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

  it("keeps task routing bounded to explicit user authorization", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");

    expect(skill).toMatch(/model routing[\s\S]*explicit user-authorized policy/i);
    expect(skill).toMatch(/must not switch[\s\S]*active turn/i);
    expect(skill).toMatch(/fast model[\s\S]*must not[\s\S]*downgrade[\s\S]*extend/i);
    expect(skill).toMatch(/must not enable[\s\S]*Fast mode/i);
    expect(skill).toMatch(/Main Turn Host Adapter[\s\S]*not implemented/i);
  });

  it("requires the route application gate without duplicating its schema", async () => {
    const skill = normalizeWhitespace(
      await readRepoText(".agents/skills/navi/SKILL.md"),
    );

    expect(skill).toContain(
      "routing is authorized, Navi must pass the Route Application Gate before creating",
    );
    expect(skill).toContain("must not silently inherit the host default");
    expect(skill).not.toContain("NAVI_ROUTE_APPLICATION version: 1");
  });

  it("requires post-delivery continuity without duplicating its schema", async () => {
    const skill = normalizeWhitespace(
      await readRepoText(".agents/skills/navi/SKILL.md"),
    );

    expect(skill).toContain(
      "Before ending a Main Thread turn after accepted bounded delivery, Codex must apply the Post-Delivery Continuity Gate",
    );
    expect(skill).toContain(
      "must not treat bounded-task completion as automatic source-task closure",
    );
    expect(skill).not.toContain("NAVI_POST_DELIVERY_CONTINUITY version: 1");
  });
});
