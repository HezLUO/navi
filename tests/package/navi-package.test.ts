import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import pluginManifest from "../../plugins/navi/.codex-plugin/plugin.json";

describe("Navi source package wiring", () => {
  it("exposes only the stable Navi JavaScript bin", () => {
    expect(packageJson.scripts.navi).toBe("./src/cli/navi-bin.mjs");
    expect(packageJson.bin).toEqual({ navi: "src/cli/navi-bin.mjs" });
    expect(packageJson.bin).not.toHaveProperty("along");
  });

  it("supports direct Node execution of the Navi init wrapper dry-run", () => {
    const project = mkdtempSync(path.join(tmpdir(), "navi-bin-"));
    try {
      const result = spawnSync(process.execPath, [
        path.resolve(process.cwd(), "src/cli/navi-bin.mjs"),
        "init", "--target", project,
      ], { cwd: process.cwd(), encoding: "utf8" });
      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toContain("Navi init preview");
      expect(result.stdout).toContain("A confirmed Project Map is required");
      expect(existsSync(path.join(project, "AGENTS.md"))).toBe(false);
    } finally {
      rmSync(project, { force: true, recursive: true });
    }
  });

  it("routes first-use supervision through confirmed Map baseline formation", () => {
    expect(pluginManifest.interface.defaultPrompt).toContain(
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    );
  });
});
