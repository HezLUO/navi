import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import packageJson from "../../package.json";

describe("Working Thread MCP package wiring", () => {
  it("exposes the Navi project installer bin while preserving Along compatibility", () => {
    expect(packageJson.scripts["mcp:working-thread"]).toBe(
      "tsx src/mcp/working-thread-server.ts",
    );
    expect(packageJson.scripts.navi).toBe("tsx src/cli/index.ts");

    expect(packageJson.bin).toEqual({
      navi: "src/cli/index.ts",
      along: "src/cli/index.ts",
    });
  });

  it("uses the standard MCP TypeScript SDK and SDK-compatible Zod", () => {
    expect(packageJson.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
    expect(packageJson.dependencies.zod).toMatch(/^\^?(3\.(2[5-9]|[3-9]\d)|[4-9]\.)/);
  });

  it("supports direct Node execution of the Navi init bin dry-run", () => {
    const project = mkdtempSync(path.join(tmpdir(), "navi-bin-"));

    try {
      const result = spawnSync(
        process.execPath,
        ["src/cli/index.ts", "init", "--target", project],
        {
          cwd: process.cwd(),
          encoding: "utf8",
        },
      );

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("Navi init preview");
      expect(existsSync(path.join(project, "AGENTS.md"))).toBe(false);
    } finally {
      rmSync(project, { force: true, recursive: true });
    }
  });
});
