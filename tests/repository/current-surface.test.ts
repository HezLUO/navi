import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

const root = process.cwd();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  }));
  return files.flat();
}

describe("Current Navi repository surface", () => {
  it("keeps navi init responsibilities in focused modules", async () => {
    const expected = {
      "src/cli/navi-init.ts": ["runNaviInitCli", "parseInitArgs", "renderInitPlan"],
      "src/cli/navi-init-plan.ts": ["buildInitPlan", "resolveTargetPath"],
      "src/cli/navi-init-apply.ts": ["applyInitPlan"],
      "src/cli/navi-project-trigger.ts": ["renderAgentsBlock", "recognizeNaviManagedBlock", "inspectProjectTrigger"],
    };
    for (const [relative, exports] of Object.entries(expected)) {
      const text = await fs.readFile(path.join(root, relative), "utf8");
      for (const name of exports) expect(text, relative).toMatch(new RegExp(`export (?:async )?(?:function|const|type|interface) ${name}|export \\{[^}]*${name}`));
    }
  });

  it("keeps active Navi docs outside the Historical Along namespace", async () => {
    for (const relative of [
      "docs/navi/README.md",
      "docs/navi/calibration-log.md",
      "docs/navi/product-debt.md",
      "docs/navi/roadmap.md",
      "docs/navi/design-history.md",
    ]) {
      await expect(fs.stat(path.join(root, relative))).resolves.toBeDefined();
    }
    await expect(fs.stat(path.join(root, "docs/along"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps the product-debt complexity regression gate and priority rule", async () => {
    const debt = await fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8");

    expect(debt).toContain("## Complexity Regression Gate");
    expect(debt).toContain("Does it create a second state, rule, or template authority?");
    expect(debt).toContain("Being easy to parallelize does not establish product priority.");
  });

  it("records supervised delivery as the current bounded implementation gate", async () => {
    const [history, roadmap] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    ]);
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
    const currentPhase = roadmap.match(/## Current Phase\n(?<phase>[\s\S]*?)\n## /)?.groups?.phase ?? "";

    for (const currentSurface of [history, currentPhase]) {
      expect(currentSurface).toContain(
        "Source-alpha CLI invocation reachability and its real-environment calibration are closed",
      );
      expect(currentSurface).toContain(
        "Codex-first Supervised Delivery Loop V1 implementation is the current bounded gate",
      );
      expect(currentSurface).toContain(
        "the next gate is the first natural bounded calibration, not distribution or release",
      );
      expect(currentSurface).not.toContain(
        "Source-alpha CLI invocation reachability is the current bounded implementation gate",
      );
    }
    expect(active).toContain("docs/superpowers/specs/2026-07-15-navi-source-alpha-cli-invocation-design.md");
    expect(active).toContain("docs/superpowers/plans/2026-07-15-navi-source-alpha-cli-invocation.md");
  });

  it("lists the approved Supervised Delivery Loop design as active", async () => {
    const history = await fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8");
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    expect(active).toContain("`docs/superpowers/specs/2026-07-14-navi-supervised-delivery-loop-design.md`");
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-15-navi-supervised-delivery-loop.md`",
    );
  });

  it("keeps supervised delivery contracts in one active owner", async () => {
    const [skill, delivery, supervision] = await Promise.all([
      fs.readFile(path.join(root, ".agents/skills/navi/SKILL.md"), "utf8"),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervised-delivery-v1.md"),
        "utf8",
      ),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervision-v1.md"),
        "utf8",
      ),
    ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(delivery).toContain("NAVI_VALIDATION_RESULT");
    expect(supervision).not.toContain("NAVI_VALIDATION_RESULT\nversion: 1");
  });

  it("separates global legacy cutover from project-local migration", async () => {
    const [readme, chineseReadme, pluginReadme, projectInit, designHistory] = await Promise.all([
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "README.zh-CN.md"), "utf8"),
      fs.readFile(path.join(root, "plugins/navi/README.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/project-init.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    ]);

    for (const text of [readme, pluginReadme]) {
      expect(text).toContain("short dual-install transition");
      expect(text).toContain("codex plugin remove <exact legacy selector>");
      expect(text).toContain("does not scan or initialize target projects");
      expect(text).toContain("next use of a project with a recognized legacy trigger");
      expect(text).not.toMatch(/preview an exact project trigger upgrade[\s\S]*validate the target project[\s\S]*remove the exact legacy selector/i);
    }

    expect(chineseReadme).toContain("短暂 dual-install 过渡");
    expect(chineseReadme).toContain("codex plugin remove <doctor 报告的精确 legacy selector>");
    expect(chineseReadme).toContain("不会扫描或初始化目标项目");
    expect(projectInit).toContain("Global migration is not a project-initialization prerequisite");
    expect(projectInit).toContain("fingerprint-bound");
    const active = designHistory.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
    expect(active).toContain("docs/superpowers/specs/2026-07-15-navi-source-alpha-legacy-migration-design.md");
    expect(active).toContain("docs/superpowers/plans/2026-07-15-navi-source-alpha-legacy-migration.md");
  });

  it("keeps active tests and fixtures independent from Historical Along docs", async () => {
    for (const relativeDir of ["tests/cli", "tests/fixtures", "tests/package", "tests/skills"]) {
      const activeTestFiles = await listFiles(path.join(root, relativeDir));
      for (const file of activeTestFiles) {
        const testSource = await fs.readFile(file, "utf8");
        expect(testSource, path.relative(root, file)).not.toContain("archive/along/docs/");
      }
    }
  });

  it("keeps Historical Along outside Current Navi defaults", async () => {
    expect(packageJson.scripts).toEqual({
      navi: "./src/cli/navi-bin.mjs",
      test: "vitest run",
      "test:watch": "vitest",
      typecheck: "tsc --noEmit",
      "verify:plugin-package": "node scripts/verify-plugin-package.mjs",
    });
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.devDependencies).toEqual({
      "@types/node": "^22.10.0",
      tsx: "^4.19.0",
      typescript: "^5.7.0",
      vitest: "^2.1.0",
    });

    const activeFiles = await listFiles(path.join(root, "src"));
    expect(activeFiles.every((file) => file.includes(`${path.sep}src${path.sep}cli${path.sep}`))).toBe(true);
    expect(await fs.readFile(path.join(root, "archive/along/README.md"), "utf8"))
      .toMatch(/Historical Along Evidence[\s\S]*not a supported runnable subsystem/i);
  });

  it("does not import archived code from active source or tests", async () => {
    const activeFiles = [
      ...(await listFiles(path.join(root, "src"))),
      ...(await listFiles(path.join(root, "tests"))),
    ].filter((file) => /\.(?:ts|mjs)$/.test(file));

    for (const file of activeFiles) {
      const text = await fs.readFile(file, "utf8");
      expect(text, path.relative(root, file)).not.toMatch(
        /(?:from\s+|import\()["'][^"']*(?:archive\/along|src\/(?:core|mcp|server|web))/
      );
    }
  });
});
