import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  assertUnlinkedArtifact,
  confinedCodexPath,
  resolveCanonicalCodexHome,
} from "../../src/cli/navi-codex-home";
import {
  applyGlobalSetupPlan,
  buildGlobalSetupPlan,
  NAVI_GLOBAL_BLOCK_END,
  NAVI_GLOBAL_BLOCK_START,
  planGlobalAgentsContent,
  renderGlobalBootstrapBlock,
  runNaviSetupCli,
  renderGlobalSetupPlan,
} from "../../src/cli/navi-global";
import type { NaviInvocationContext } from "../../src/cli/navi-invocation";

const tempRoots: string[] = [];
const enabledInstallation = {
  kind: "current" as const,
  current: {
    selector: "navi@navi-source",
    pluginName: "navi",
    marketplaceName: "navi-source",
    installed: true,
    enabled: true,
    version: "0.1.0",
    sourcePath: "/tmp/source/plugins/navi",
    raw: "navi@navi-source  Installed, Enabled  0.1.0  /tmp/source/plugins/navi",
  },
  raw: "navi@navi-source  Installed, Enabled  0.1.0  /tmp/source/plugins/navi",
};

const missingInstallation = { kind: "missing" as const, raw: "" };

const fallbackInvocation: NaviInvocationContext = {
  cliRoot: "/Users/james/Codex Project/Navi",
  entrypoint: "/Users/james/.hermes/node/bin/navi",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/Users/james/.hermes/node/bin/navi"],
};

const unavailableInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "unavailable",
  reason: "unavailable",
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
    expect(block).not.toContain("NAVI_LANE_HANDOFF_EVENT");
    expect(block).not.toContain("source main task ID");
    expect(block).not.toContain("review-ready");
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
  it("canonicalizes an existing physical CODEX_HOME directory", async () => {
    const codexHome = await makeTempCodexHome();

    await expect(resolveCanonicalCodexHome(codexHome)).resolves.toEqual({
      requestedPath: path.resolve(codexHome),
      canonicalPath: await fs.realpath(codexHome),
    });
  });

  it("uses the physical root when CODEX_HOME is a user-facing symlink", async () => {
    const root = await makeTempCodexHome();
    const physical = path.join(root, "physical");
    const requested = path.join(root, "linked");
    await fs.mkdir(physical);
    await fs.symlink(physical, requested);

    const plan = await buildGlobalSetupPlan(
      { codexHome: requested },
      { inspectInstallation: async () => enabledInstallation },
    );

    expect(plan.requestedCodexHome).toBe(path.resolve(requested));
    expect(plan.codexHome).toBe(await fs.realpath(physical));
    expect(plan.agentsPath).toBe(path.join(await fs.realpath(physical), "AGENTS.md"));
    expect(renderGlobalSetupPlan(plan)).toContain(`Requested CODEX_HOME: ${path.resolve(requested)}`);
    expect(renderGlobalSetupPlan(plan)).toContain(`Canonical CODEX_HOME: ${await fs.realpath(physical)}`);
  });

  it.each([
    ["missing", async (root: string) => path.join(root, "missing")],
    ["non-directory", async (root: string) => {
      const file = path.join(root, "file");
      await fs.writeFile(file, "not a directory");
      return file;
    }],
  ])("rejects a %s CODEX_HOME", async (_name, makePath) => {
    const root = await makeTempCodexHome();
    await expect(makePath(root).then(resolveCanonicalCodexHome)).rejects.toThrow(/CODEX_HOME/i);
  });

  it("confines managed artifacts to basenames beneath the canonical root", async () => {
    const codexHome = await makeTempCodexHome();

    expect(confinedCodexPath(codexHome, "AGENTS.md")).toBe(path.join(codexHome, "AGENTS.md"));
    expect(() => confinedCodexPath(codexHome, "../AGENTS.md")).toThrow(/confined|basename/i);
    expect(() => confinedCodexPath(codexHome, path.join(codexHome, "AGENTS.md"))).toThrow(/confined|basename/i);
  });

  it("rejects symlinked managed artifacts while allowing missing or regular files", async () => {
    const codexHome = await makeTempCodexHome();
    const target = path.join(codexHome, "target");
    const agents = path.join(codexHome, "AGENTS.md");
    const transaction = path.join(codexHome, ".AGENTS.md.navi-transaction-test");
    await fs.writeFile(target, "content");
    await fs.symlink(target, agents);
    await fs.symlink(target, transaction);

    await expect(assertUnlinkedArtifact(path.join(codexHome, "missing"))).resolves.toBe("missing");
    await expect(assertUnlinkedArtifact(target)).resolves.toBe("file");
    await expect(assertUnlinkedArtifact(agents)).rejects.toThrow(/symlink/i);
    await expect(assertUnlinkedArtifact(transaction)).rejects.toThrow(/symlink/i);
  });

  it("keeps setup dry-run read-only", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan(
      { codexHome, write: false, remove: false },
      { inspectInstallation: async () => enabledInstallation },
    );

    await applyGlobalSetupPlan(plan);

    expect(plan.action.kind).toBe("create");
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it("keeps a recoverable transaction visible but untouched during dry-run", async () => {
    const codexHome = await makeTempCodexHome();
    const transactionDir = path.join(codexHome, ".AGENTS.md.navi-transaction-dry-recovery");
    await fs.mkdir(transactionDir, { mode: 0o700 });
    await fs.writeFile(path.join(transactionDir, "backup"), "old");
    await fs.writeFile(path.join(transactionDir, "stage"), "desired");
    await fs.writeFile(path.join(transactionDir, "manifest.json"), JSON.stringify({
      version: 1, id: "dry-recovery", pid: 99, operation: "modify", target: "AGENTS.md",
      expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4",
      desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b",
      stage: "backed-up", createdAt: "2026-07-13T00:00:00.000Z",
    }));

    const plan = await buildGlobalSetupPlan({ codexHome, write: false }, { inspectInstallation: async () => missingInstallation });
    await expect(applyGlobalSetupPlan(plan)).resolves.toBe("applied");
    expect(plan.transaction.kind).toBe("recoverable-restore");
    await expect(fs.access(transactionDir)).resolves.toBeUndefined();
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it("prioritizes a recoverable transaction over missing-plugin and action-conflict dry-run advice", async () => {
    const codexHome = await makeTempCodexHome();
    const transactionDir = path.join(codexHome, ".AGENTS.md.navi-transaction-priority");
    await fs.mkdir(transactionDir, { mode: 0o700 });
    await fs.writeFile(path.join(transactionDir, "backup"), "old");
    await fs.writeFile(path.join(transactionDir, "stage"), "desired");
    await fs.writeFile(path.join(transactionDir, "manifest.json"), JSON.stringify({
      version: 1, id: "priority", pid: 99, operation: "modify", target: "AGENTS.md",
      expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4",
      desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b",
      stage: "backed-up", createdAt: "2026-07-13T00:00:00.000Z",
    }));
    const output: string[] = [];

    const code = await runNaviSetupCli(
      [],
      { stdout: (text) => output.push(text), stderr: (text) => output.push(text) },
      { codexHome, inspectInstallation: async () => missingInstallation },
      fallbackInvocation,
    );

    expect(code).toBe(0);
    expect(output.join("")).toContain("recover the prior Navi setup transaction");
    expect(output.join("")).toContain("/Users/james/.hermes/node/bin/navi setup --write");
    expect(output.join("")).not.toContain("requires navi@navi-source");
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();

    const plan = await buildGlobalSetupPlan({ codexHome, write: false }, { inspectInstallation: async () => missingInstallation });
    const conflictedActionPlan = {
      ...plan,
      action: { kind: "conflict" as const, summary: "user-edited managed block" },
    };
    expect(renderGlobalSetupPlan(conflictedActionPlan)).toContain("recover the prior Navi setup transaction");
    expect(renderGlobalSetupPlan(conflictedActionPlan)).not.toContain("Repair the Navi-managed");
  });

  it.each([
    ["live lock", { kind: "live-lock" as const, lockPath: "/tmp/navi-lock" }, "Another Navi setup transaction is active"],
    ["transaction conflict", { kind: "conflict" as const, diagnostic: "retained transaction evidence" }, "Resolve the Navi setup transaction manually"],
  ])("prioritizes a %s over action and plugin dry-run advice", async (_name, transaction, expected) => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan({ codexHome, write: false }, { inspectInstallation: async () => missingInstallation });
    const combinedPlan = {
      ...plan,
      transaction,
      action: { kind: "conflict" as const, summary: "user-edited managed block" },
    };

    const rendered = renderGlobalSetupPlan(combinedPlan);

    expect(rendered).toContain(expected);
    expect(rendered).not.toContain("requires navi@navi-source");
    expect(rendered).not.toContain("Repair the Navi-managed");
    expect(rendered).not.toContain("Apply with:");
  });

  it("recovers a pending transaction before plugin or planned-action preflight", async () => {
    const codexHome = await makeTempCodexHome();
    const transactionDir = path.join(codexHome, ".AGENTS.md.navi-transaction-recover");
    await fs.mkdir(transactionDir, { mode: 0o700 });
    await fs.writeFile(path.join(transactionDir, "backup"), "old");
    await fs.writeFile(path.join(transactionDir, "stage"), "desired");
    await fs.writeFile(
      path.join(transactionDir, "manifest.json"),
      JSON.stringify({
        version: 1,
        id: "recover",
        pid: 99,
        operation: "modify",
        target: "AGENTS.md",
        expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4",
        desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b",
        stage: "backed-up",
        createdAt: "2026-07-11T00:00:00.000Z",
      }),
    );
    const plan = await buildGlobalSetupPlan(
      { codexHome, write: true },
      { inspectInstallation: async () => missingInstallation },
    );

    await expect(applyGlobalSetupPlan(plan)).resolves.toBe("recovered");
    await expect(fs.readFile(path.join(codexHome, "AGENTS.md"), "utf8")).resolves.toBe("old");
  });

  it("refuses setup writes when the plugin is unavailable", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan(
      { codexHome, write: true, remove: false },
      { inspectInstallation: async () => missingInstallation },
    );

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/installed and enabled/i);
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it.each([
    ["legacy-only", { kind: "legacy", legacy: { selector: "along-working-thread@personal", pluginName: "along-working-thread", installed: true, enabled: true, raw: "legacy" }, raw: "legacy" }, /migrate the legacy plugin/i],
    ["dual installation", { kind: "conflict", current: enabledInstallation.current, legacy: { selector: "along-working-thread@personal", pluginName: "along-working-thread", installed: true, enabled: true, raw: "legacy" }, raw: "both" }, /both Navi and the legacy plugin/i],
    ["disabled current", { kind: "missing", current: { ...enabledInstallation.current, enabled: false }, raw: "disabled" }, /enable the current plugin/i],
    ["uninspectable list", { kind: "uninspectable", raw: "failure" }, /could not inspect codex plugins/i],
    ["alternate Navi selector", { kind: "conflict", current: { selector: "navi@other", pluginName: "navi", marketplaceName: "other", installed: true, enabled: true, raw: "alternate" }, raw: "alternate", diagnostic: "Navi is installed from a non-authoritative selector: navi@other." }, /Remove the non-authoritative Navi selector navi@other/i],
    ["duplicate current selectors", { kind: "conflict", current: enabledInstallation.current, raw: "duplicate", diagnostic: "Navi is installed more than once from navi@navi-source." }, /Remove duplicate navi@navi-source entries/i],
  ] as const)("refuses %s installation preflight with repair text", async (_name, installation, repair) => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli(["--write"], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectInstallation: async () => installation,
    });

    expect(code).toBe(1);
    expect(output.join("")).toMatch(repair);
    await expect(fs.access(path.join(codexHome, "AGENTS.md"))).rejects.toThrow();
  });

  it("creates global instructions on --write", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(plan.agentsPath, "utf8")).resolves.toBe(renderGlobalBootstrapBlock());
  });

  it("leaves exact installed content untouched", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    const existing = `${renderGlobalBootstrapBlock()}\n`;
    await fs.writeFile(agentsPath, existing);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("updates a recognized block without changing outside bytes", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    const existing = `before\n${renderGlobalBootstrapBlock()}after`;
    await fs.writeFile(agentsPath, existing);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });

    await applyGlobalSetupPlan(plan);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("removes a managed block while preserving outside bytes", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, `before${renderGlobalBootstrapBlock()}after`);
    const plan = await buildGlobalSetupPlan({ codexHome, write: true, remove: true }, { inspectInstallation: async () => missingInstallation });

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
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/unsafe|modified|conflict/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe(existing);
  });

  it("refuses a symlinked AGENTS.md", async () => {
    const codexHome = await makeTempCodexHome();
    const outside = path.join(codexHome, "outside.md");
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(outside, "outside");
    await fs.symlink(outside, agentsPath);
    await expect(buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation })).rejects.toThrow(/symlink/i);
    await expect(fs.readFile(outside, "utf8")).resolves.toBe("outside");
  });

  it("refuses when the file changed between plan and apply", async () => {
    const codexHome = await makeTempCodexHome();
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, "before");
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });
    await fs.writeFile(agentsPath, "changed");

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/changed/i);
    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("changed");
  });

  it("does not overwrite a target that appears after a create plan", async () => {
    const codexHome = await makeTempCodexHome();
    const plan = await buildGlobalSetupPlan({ codexHome, write: true }, { inspectInstallation: async () => enabledInstallation });
    const agentsPath = path.join(codexHome, "AGENTS.md");
    await fs.writeFile(agentsPath, "concurrent content");

    await expect(applyGlobalSetupPlan(plan)).rejects.toThrow(/changed/i);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toBe("concurrent content");
  });

  it("renders setup as global discovery configuration, not project initialization", async () => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli([], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectInstallation: async () => enabledInstallation,
    });

    expect(code).toBe(0);
    expect(output.join("")).toMatch(/global discovery/i);
    expect(output.join("")).toMatch(/does not initialize a project/i);
    expect(output.join("")).toContain("navi setup --write");
  });

  it.each([
    ["managed-block conflict", async (codexHome: string) => {
      await fs.writeFile(
        path.join(codexHome, "AGENTS.md"),
        `${NAVI_GLOBAL_BLOCK_START}\nuser-edited\n${NAVI_GLOBAL_BLOCK_END}`,
      );
    }, enabledInstallation],
    ["missing plugin", async () => undefined, missingInstallation],
    ["disabled plugin", async () => undefined, {
      kind: "missing" as const,
      current: { ...enabledInstallation.current, enabled: false },
      raw: "disabled",
    }],
    ["legacy-only plugin", async () => undefined, {
      kind: "legacy" as const,
      legacy: {
        selector: "along-working-thread@personal",
        pluginName: "along-working-thread",
        installed: true,
        enabled: true,
        raw: "legacy",
      },
      raw: "legacy",
    }],
    ["dual plugin installation", async () => undefined, {
      kind: "conflict" as const,
      current: enabledInstallation.current,
      legacy: {
        selector: "along-working-thread@personal",
        pluginName: "along-working-thread",
        installed: true,
        enabled: true,
        raw: "legacy",
      },
      raw: "both",
    }],
    ["ambiguous transaction", async (codexHome: string) => {
      await Promise.all([
        fs.mkdir(path.join(codexHome, ".AGENTS.md.navi-transaction-first")),
        fs.mkdir(path.join(codexHome, ".AGENTS.md.navi-transaction-second")),
      ]);
    }, enabledInstallation],
  ])("blocks a %s preview without offering an unsafe write command", async (_name, arrange, installation) => {
    const codexHome = await makeTempCodexHome();
    await arrange(codexHome);
    const output: string[] = [];

    const code = await runNaviSetupCli([], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectInstallation: async () => installation,
    });

    expect(code).not.toBe(0);
    expect(output.join("")).not.toContain("Apply with:");
    expect(output.join("")).not.toContain("navi setup --write");
    expect(output.join("")).not.toMatch(/force|delete the lock/i);
  });

  it("blocks an unsafe CODEX_HOME without offering an unsafe write command", async () => {
    const root = await makeTempCodexHome();
    const unsafeRoot = path.join(root, "missing");
    const output: string[] = [];

    const code = await runNaviSetupCli([], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome: unsafeRoot,
      inspectInstallation: async () => enabledInstallation,
    });

    expect(code).not.toBe(0);
    expect(output.join("")).not.toContain("Apply with:");
    expect(output.join("")).not.toContain("navi setup --write");
  });

  it.each([
    ["install", [], "navi setup --write"],
    ["remove", ["--remove"], "navi setup --remove --write"],
  ])("renders a safe %s preview with its apply command", async (_name, args, applyCommand) => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli(args, { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectInstallation: async () => enabledInstallation,
    });

    expect(code).toBe(0);
    expect(output.join("")).toContain("Apply with:");
    expect(output.join("")).toContain(applyCommand);
  });

  it.each([
    ["install", [], "/Users/james/.hermes/node/bin/navi setup --write"],
    ["remove", ["--remove"], "/Users/james/.hermes/node/bin/navi setup --remove --write"],
  ])("renders a verified fallback for %s preview", async (_name, args, expected) => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];
    const code = await runNaviSetupCli(
      args,
      { stdout: (text) => output.push(text), stderr: (text) => output.push(text) },
      { codexHome, inspectInstallation: async () => enabledInstallation },
      fallbackInvocation,
    );

    expect(code).toBe(0);
    expect(output.join("")).toContain(expected);
    expect(output.join("")).not.toContain("Apply with: navi ");
  });

  it("blocks a preview when no verified invocation is available", async () => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli(
      [],
      { stdout: (text) => output.push(text), stderr: (text) => output.push(text) },
      { codexHome, inspectInstallation: async () => enabledInstallation },
      unavailableInvocation,
    );

    expect(code).not.toBe(0);
    expect(output.join("")).toContain(
      "No verified Navi CLI invocation is available; rerun setup from the checked-out Navi source package.",
    );
    expect(output.join("")).not.toContain("Apply with:");
  });

  it("explains that removal leaves plugin, CLI, and project-local files intact", async () => {
    const codexHome = await makeTempCodexHome();
    const output: string[] = [];

    const code = await runNaviSetupCli(["--remove"], { stdout: (text) => output.push(text), stderr: (text) => output.push(text) }, {
      codexHome,
      inspectInstallation: async () => enabledInstallation,
    });

    expect(code).toBe(0);
    expect(output.join("")).toMatch(/plugin, CLI, and project-local files remain/i);
  });
});
