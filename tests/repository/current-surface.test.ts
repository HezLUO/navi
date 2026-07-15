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

  it("records complexity stabilization as the current phase and real-project calibration as the next gate", async () => {
    const [debt, roadmap, history] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    ]);

    expect(debt).toContain("## Complexity Regression Gate");
    expect(debt).toContain("Does it create a second state, rule, or template authority?");
    expect(debt).toContain("Being easy to parallelize does not establish product priority.");

    for (const document of [roadmap, history]) {
      expect(document).toContain("Complexity stabilization is the current phase");
      expect(document).toContain("two or three real-project calibrations");
      expect(document).toContain("not another capability alpha or release");
    }
  });

  it("lists the approved Supervised Delivery Loop design as active", async () => {
    const history = await fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8");
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    expect(active).toContain("`docs/superpowers/specs/2026-07-14-navi-supervised-delivery-loop-design.md`");
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
