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
});
