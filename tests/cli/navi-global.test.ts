import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyGlobalSetupPlan,
  buildGlobalSetupPlan,
  NAVI_GLOBAL_BLOCK_END,
  NAVI_GLOBAL_BLOCK_START,
  planGlobalAgentsContent,
  renderGlobalBootstrapBlock,
  runNaviSetupCli,
} from "../../src/cli/navi-global";

const tempRoots: string[] = [];
const enabledPlugin = {
  installed: true,
  enabled: true,
  version: "0.1.0",
  sourcePath: "/tmp/personal/along-working-thread",
  raw: "along-working-thread@personal  installed, enabled  0.1.0  /tmp/personal/along-working-thread",
};

async function makeTempCodexHome(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-global-"));
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("Navi global bootstrap planning", () => {
  it("renders only first-use routing responsibilities", () => {
    const block = renderGlobalBootstrapBlock();

    expect(block).toContain(NAVI_GLOBAL_BLOCK_START);
    expect(block).toContain("broad progress, next-step, stop, wait, continue, confusion, or plan-reliability");
    expect(block).toContain("project-local Navi guidance");
    expect(block).toContain("provisional judgment");
    expect(block).toContain("ask whether to initialize");
    expect(block).toContain("keep narrow factual and bounded execution requests quiet");
    expect(block).toContain("do not repeat the reminder in the same session after the user declines");
    expect(block).toContain("Do not draw a full Progress Map or Rhythm Map");
    expect(block).toContain("Do not write files or run navi init automatically");
    expect(block).not.toContain("Product Stage");
  });

  it("creates a block without changing existing bytes", () => {
    const existing = "# User instructions\n\nKeep my existing rules.\n";
    const action = planGlobalAgentsContent(existing, "install");

    expect(action.kind).toBe("modify");
    expect(action.previousContent).toBe(existing);
    expect(action.content?.startsWith(existing)).toBe(true);
  });

  it("skips the exact current block", () => {
    const block = `${renderGlobalBootstrapBlock()}\n`;
    expect(planGlobalAgentsContent(block, "install").kind).toBe("skip");
  });

  it("removes only the exact managed region and preserves adjacent bytes", () => {
    const before = "before\n";
    const after = "after\n";
    const existing = `${before}${renderGlobalBootstrapBlock()}\n${after}`;
    const action = planGlobalAgentsContent(existing, "remove");

    expect(action.kind).toBe("remove");
    expect(action.content).toBe(`${before}\n${after}`);
  });

  it.each([
    ["before", "after"],
    ["before\n", "after"],
    ["before", "\nafter"],
    ["before\r\n", "\r\nafter"],
  ])("preserves every byte immediately outside the managed region", (before, after) => {
    const existing = `${before}${renderGlobalBootstrapBlock()}${after}`;

    expect(planGlobalAgentsContent(existing, "remove")).toMatchObject({
      kind: "remove",
      content: `${before}${after}`,
    });
  });

  it.each([
    `${NAVI_GLOBAL_BLOCK_START}\nincomplete`,
    `${NAVI_GLOBAL_BLOCK_END}\nend only`,
    `${renderGlobalBootstrapBlock()}\n${renderGlobalBootstrapBlock()}`,
    `${NAVI_GLOBAL_BLOCK_START}\nuser-edited content\n${NAVI_GLOBAL_BLOCK_END}`,
  ])("rejects unsafe or user-modified managed regions", (existing) => {
    expect(planGlobalAgentsContent(existing, "install").kind).toBe("conflict");
    expect(planGlobalAgentsContent(existing, "remove").kind).toBe("conflict");
  });
});

describe("Navi global setup", () => {
  it("keeps setup dry-run read-only", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan(
      { codexHome, write: false, remove: false },
      { inspectPlugin: async () => enabledPlugin },
    );

    await applyGlobalSetupPlan(plan);

    expect(plan.action.kind).toBe("create");
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it("refuses setup writes when the plugin is unavailable", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan(
      { codexHome, write: true, remove: false },
      { inspectPlugin: async () => ({ installed: false, enabled: false, raw: "" }) },
    );

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/plugin.*installed and enabled/i);
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it("creates global instructions on --write", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(plan.agentsPath, "utf8")).resolves.toBe(renderGlobalBootstrapBlock());
  });

  it("leaves exact installed content untouched", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    const existing = `${renderGlobalBootstrapBlock()}\n`;
    await fs.writeFile(agentsPath, existing);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("updates a recognized block without changing outside bytes", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    const existing = `before\n${renderGlobalBootstrapBlock()}after`;
    await fs.writeFile(agentsPath, existing);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("removes a managed block while preserving outside bytes", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, `before${renderGlobalBootstrapBlock()}after`);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true, remove: true }, { inspectPlugin: async () => ({ installed: false, enabled: false, raw: "" }) });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("beforeafter");
  });

  it.each([
    `${NAVI_GLOBAL_BLOCK_START}\nincomplete`,
    `${renderGlobalBootstrapBlock()}${renderGlobalBootstrapBlock()}`,
    `${NAVI_GLOBAL_BLOCK_START}\nuser-edited\n${NAVI_GLOBAL_BLOCK_END}`,
  ])("refuses unsafe managed content without writing", async (existing) => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, existing);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/unsafe|modified|conflict/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("refuses a symlinked AGENTS.md", async () => {
    const codexHome = await makeTempCodexHome();
    const outside = path.join(codexHome, "outside.md");
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(outside, "outside");
    await fs.symlink(outside, agentsPath);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/symlink/i);
    await expect(fs.readFile(outside, "utf8")).resolves.toBe("outside");
  });

  it("refuses a symlinked parent", async () => {
    const root = await makeTempCodexHome();
    const physical = path.join(root, "physical");
    const codexHome = path.join(root, "linked");
    await fs.mkdir(physical);
    await fs.symlink(physical, codexHome);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/symlink/i);
  });

  it("refuses when the file changed between plan and apply", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, "before");
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });
    await fs.writeFile(agentsPath, "changed");

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/changed/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("changed");
  });

  it("cleans up the temporary file when rename fails", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectPlugin: async () => enabledPlugin });

    await expect(applyGlobalSetupPlan(plan, {
      rename: async () => { throw new Error("rename failed"); },
    })).rejects.toThrow("rename failed");

    await expect(fs.readdir(codexHome)).resolves.toEqual([]);
  });

  it("renders setup as global discovery configuration, not project initialization", async () => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli([], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectPlugin: async () => enabledPlugin,
    });

    expect(code).toBe(0);
    expect(output.join("")).toMatch(/global discovery/i);
    expect(output.join("")).toMatch(/does not initialize a project/i);
    expect(output.join("")).toContain("navi setup --write");
  });

  it("explains that removal leaves plugin, CLI, and project-local files intact", async () => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli(["--remove"], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectPlugin: async () => enabledPlugin,
    });

    expect(code).toBe(0);
    expect(output.join("")).toMatch(/plugin, CLI, and project-local files remain/i);
  });
});
