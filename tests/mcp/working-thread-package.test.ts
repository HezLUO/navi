import packageJson from "../../package.json";

describe("Working Thread MCP package wiring", () => {
  it("exposes a repo-level stdio launch script without adding a new package bin", () => {
    expect(packageJson.scripts["mcp:working-thread"]).toBe(
      "tsx src/mcp/working-thread-server.ts",
    );

    expect(packageJson.bin).toEqual({
      along: "src/cli/index.ts",
    });
  });

  it("uses the standard MCP TypeScript SDK and SDK-compatible Zod", () => {
    expect(packageJson.dependencies["@modelcontextprotocol/sdk"]).toBeDefined();
    expect(packageJson.dependencies.zod).toMatch(/^\^?(3\.(2[5-9]|[3-9]\d)|[4-9]\.)/);
  });
});
