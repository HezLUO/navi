import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
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
    expect(record).toContain("Do not implement Core/MCP");
    expect(record).toContain("Do not turn plugin packaging into a broad productization effort");
    expect(record).toContain("personal local plugin first");
  });
});
