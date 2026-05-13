import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { ProjectContext } from "./types";
import { isSensitivePath } from "./safety";

const execFileAsync = promisify(execFile);
const manifestNames = ["package.json", "pyproject.toml", "Cargo.toml", "go.mod"];

async function readIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

async function safeGit(repoPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: repoPath });
    return stdout.trim();
  } catch {
    return "";
  }
}

async function directorySummary(repoPath: string): Promise<string[]> {
  const entries = await fs.readdir(repoPath, { withFileTypes: true });
  return entries
    .map((entry) => (entry.isDirectory() ? `${entry.name}/` : entry.name))
    .filter((entry) => !isSensitivePath(entry))
    .filter((entry) => !entry.startsWith(".git"))
    .slice(0, 40)
    .sort();
}

function testHintsFromPackageJson(content: string | undefined): string[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content) as { scripts?: Record<string, string> };
    if (parsed.scripts?.test) return ["npm test"];
  } catch {
    return [];
  }
  return [];
}

export async function inspectProject(repoPath: string): Promise<ProjectContext> {
  const repoName = path.basename(repoPath);
  const readme = await readIfExists(path.join(repoPath, "README.md"));
  const manifests = [];
  let packageJson: string | undefined;

  for (const name of manifestNames) {
    const content = await readIfExists(path.join(repoPath, name));
    if (content) {
      manifests.push({ path: name, content: content.slice(0, 6000) });
      if (name === "package.json") packageJson = content;
    }
  }

  return {
    repoPath,
    repoName,
    gitStatus: await safeGit(repoPath, ["status", "--short"]),
    recentCommits: (await safeGit(repoPath, ["log", "--oneline", "-5"]))
      .split("\n")
      .filter(Boolean),
    manifests,
    readme: readme?.slice(0, 6000),
    directorySummary: await directorySummary(repoPath),
    testHints: testHintsFromPackageJson(packageJson),
  };
}
