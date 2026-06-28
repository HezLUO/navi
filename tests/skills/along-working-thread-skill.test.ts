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
    expect(metadata).toContain("display_name: Along Working Thread");
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
      keywords: string[];
      interface: {
        displayName: string;
        shortDescription: string;
        longDescription: string;
        category: string;
        capabilities: string[];
        defaultPrompt: string[];
      };
    };

    expect(manifest.name).toBe("along-working-thread");
    expect(manifest.version).toBe("0.1.0");
    expect(manifest.skills).toBe("./skills/");
    expect(manifest.description).toContain("Working Thread continuity");
    expect(manifest.keywords).toEqual(
      expect.arrayContaining(["along", "working-thread", "continuity", "codex", "self-initiation"]),
    );
    expect(manifest.interface.displayName).toBe("Along Working Thread");
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

    expect(readme).toContain("Bring self-initiation and continuity to the agents you already use.");
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
    expect(version).toContain("customer-facing Progress Map behavior");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");
  });
});
