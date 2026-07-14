import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { filterUserFacingGitStatus, inspectProject } from "../../src/core/project-adapter";

async function makeRepo() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "along-repo-"));
  await fs.writeFile(path.join(dir, "README.md"), "# Demo\n\nA small project.");
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }, null, 2));
  await fs.writeFile(path.join(dir, ".env"), "SECRET=hidden");
  await fs.mkdir(path.join(dir, ".along"));
  await fs.mkdir(path.join(dir, ".superpowers"));
  await fs.mkdir(path.join(dir, "dist"));
  await fs.mkdir(path.join(dir, "node_modules"));
  await fs.mkdir(path.join(dir, "src"));
  await fs.writeFile(path.join(dir, "src", "index.ts"), "export const value = 1;");
  return dir;
}

describe("project adapter", () => {
  it("filters generated folders out of user-facing git status", () => {
    expect(filterUserFacingGitStatus([
      " M src/core/runtime.ts",
      "?? .along/",
      "?? .superpowers/",
      "?? dist/index.js",
      "?? node_modules/package/index.js",
    ].join("\n"))).toBe(" M src/core/runtime.ts");
  });

  it("reads bounded project context and ignores sensitive files", async () => {
    const repo = await makeRepo();
    const context = await inspectProject(repo);
    expect(context.repoName).toMatch(/^along-repo-/);
    expect(context.readme).toContain("A small project");
    expect(context.manifests[0].path).toBe("package.json");
    expect(context.manifests[0].content).toContain("\"test\"");
    expect(context.directorySummary).toContain("src/");
    expect(context.directorySummary).not.toContain(".env");
    expect(context.directorySummary).not.toContain(".along/");
    expect(context.directorySummary).not.toContain(".superpowers/");
    expect(context.directorySummary).not.toContain("dist/");
    expect(context.directorySummary).not.toContain("node_modules/");
    expect(context.testHints).toContain("npm test");
  });
});
