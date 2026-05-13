import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { inspectProject } from "../../src/core/project-adapter";

async function makeRepo() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "along-repo-"));
  await fs.writeFile(path.join(dir, "README.md"), "# Demo\n\nA small project.");
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }, null, 2));
  await fs.writeFile(path.join(dir, ".env"), "SECRET=hidden");
  await fs.mkdir(path.join(dir, "src"));
  await fs.writeFile(path.join(dir, "src", "index.ts"), "export const value = 1;");
  return dir;
}

describe("project adapter", () => {
  it("reads bounded project context and ignores sensitive files", async () => {
    const repo = await makeRepo();
    const context = await inspectProject(repo);
    expect(context.repoName).toMatch(/^along-repo-/);
    expect(context.readme).toContain("A small project");
    expect(context.manifests[0].path).toBe("package.json");
    expect(context.manifests[0].content).toContain("\"test\"");
    expect(context.directorySummary).toContain("src/");
    expect(context.directorySummary).not.toContain(".env");
    expect(context.testHints).toContain("npm test");
  });
});
