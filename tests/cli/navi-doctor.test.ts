import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport, runNaviDoctorCli } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";
import { renderAgentsBlock } from "../../src/cli/navi-init";
import { type NaviInstallationStatus } from "../../src/cli/navi-installation";

const roots: string[] = [];
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-doctor-")); roots.push(root);
  const codexHome = path.join(root, "codex-home"); const projectDir = path.join(root, "project"); const cliRoot = path.join(root, "cli"); const source = path.join(root, "installed-source");
  await Promise.all([fs.mkdir(codexHome), fs.mkdir(projectDir), fs.mkdir(cliRoot), fs.mkdir(path.join(source, ".codex-plugin"), { recursive: true })]);
  await fs.writeFile(path.join(source, ".codex-plugin", "plugin.json"), JSON.stringify({ interface: { defaultPrompt: ["one"] } }));
  return { root, codexHome, projectDir, cliRoot, source };
}
function current(sourcePath?: string): NaviInstallationStatus { return { kind: "current", current: { selector: "navi@navi-source", pluginName: "navi", marketplaceName: "navi-source", installed: true, enabled: true, ...(sourcePath ? { sourcePath } : {}), raw: "current" }, raw: "current" }; }
async function snapshot(root: string): Promise<string[]> { const entries: string[] = []; async function visit(dir: string) { for (const item of await fs.readdir(dir, { withFileTypes: true })) { const target = path.join(dir, item.name); entries.push(`${path.relative(root, target)}:${item.isSymbolicLink() ? "link" : item.isDirectory() ? "dir" : await fs.readFile(target, "utf8")}`); if (item.isDirectory()) await visit(target); } } await visit(root); return entries.sort(); }
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });

describe("Navi doctor", () => {
  it("uses explicit CLI and installed-source roots without reading the process cwd or writing", async () => {
    const f = await fixture(); const unrelated = path.join(f.root, "unrelated"); await fs.mkdir(unrelated); const before = await snapshot(f.root);
    const report = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: unrelated, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(report.checks.find((check) => check.id === "cli")?.status).toBe("pass");
    expect(report.checks.find((check) => check.id === "manifest")?.status).toBe("pass");
    expect(await snapshot(f.root)).toEqual(before);
  });

  it("warns when current installation metadata has no source path", async () => {
    const f = await fixture(); const report = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current() });
    expect(report.checks.find((check) => check.id === "manifest")?.status).toBe("warn");
    expect(report.checks.find((check) => check.id === "package-cache")?.status).toBe("warn");
  });

  it("reports legacy and conflict installation states truthfully", async () => {
    const f = await fixture(); const legacy = { selector: "along-working-thread@personal", pluginName: "along-working-thread", installed: true, enabled: true, raw: "legacy" };
    const legacyReport = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => ({ kind: "legacy", legacy, raw: "legacy" }) });
    const conflictReport = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => ({ ...current(f.source), kind: "conflict", legacy }) });
    for (const output of [legacyReport, conflictReport].map((report) => report.checks.find((check) => check.id === "plugin")?.repair ?? "")) {
      const migrationActions = [
        "navi@navi-source",
        "navi init",
        "navi init --write",
        "validate the target project",
        "along-working-thread@personal",
        "navi doctor",
        "navi setup",
      ];
      let priorIndex = -1;
      for (const action of migrationActions) {
        const index = output.indexOf(action);
        expect(index).toBeGreaterThan(priorIndex);
        priorIndex = index;
      }
    }
    expect(conflictReport.checks.find((check) => check.id === "plugin")?.status).toBe("fail");
  });

  it.each([
    [
      "an alternate Navi selector",
      {
        kind: "conflict" as const,
        current: { selector: "navi@other", pluginName: "navi", marketplaceName: "other", installed: true, enabled: true, raw: "alternate" },
        raw: "alternate",
        diagnostic: "Navi is installed from a non-authoritative selector: navi@other.",
      },
      "non-authoritative selector: navi@other",
      "Remove the non-authoritative Navi selector navi@other",
    ],
    [
      "duplicate current selectors",
      {
        kind: "conflict" as const,
        current: { selector: "navi@navi-source", pluginName: "navi", marketplaceName: "navi-source", installed: true, enabled: true, raw: "duplicate" },
        raw: "duplicate",
        diagnostic: "Navi is installed more than once from navi@navi-source.",
      },
      "installed more than once from navi@navi-source",
      "Remove duplicate navi@navi-source entries",
    ],
  ])("reports %s without inventing a legacy plugin", async (_name, installation, summary, repair) => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => installation },
    );
    const check = report.checks.find((candidate) => candidate.id === "plugin");

    expect(check?.summary).toContain(summary);
    expect(check?.repair).toContain(repair);
    expect(check?.summary).not.toContain("legacy plugin");
    expect(check?.repair).not.toContain("along-working-thread");
  });

  it("uses init's managed-block recognition instead of accepting damaged project markers", async () => {
    const f = await fixture();
    await fs.writeFile(
      path.join(f.projectDir, "AGENTS.md"),
      `${renderAgentsBlock().replace("Navi Progress Map Rules", "Navi Progress Map Rulez")}\n`,
    );

    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source) },
    );
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "warn", repair: expect.stringContaining("navi init") });
    expect(check?.summary).toContain("damaged or unrecognized");
  });

  it("warns when one inspectable plugin path has no separate cache evidence", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    const packageCache = report.checks.find((check) => check.id === "package-cache");
    expect(packageCache?.status).toBe("warn");
    expect(packageCache?.summary).toContain("no separate cache evidence");
    expect(packageCache?.summary).not.toContain("pass");
    expect(packageCache?.summary).not.toContain("drift");
  });

  it("reports canonical CODEX_HOME aliases and rejects a symlinked AGENTS.md", async () => {
    const f = await fixture(); const alias = path.join(f.root, "codex-alias"); await fs.symlink(f.codexHome, alias); await fs.symlink(path.join(f.root, "elsewhere"), path.join(f.codexHome, "AGENTS.md"));
    const report = await buildNaviDoctorReport({ codexHome: alias, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(renderNaviDoctorReport(report)).toContain(`Requested CODEX_HOME: ${alias}`);
    expect(renderNaviDoctorReport(report)).toContain(`Canonical CODEX_HOME: ${report.codexHome}`);
    expect(report.checks.find((check) => check.id === "global-bootstrap")?.status).toBe("fail");
  });

  it("fails recoverable transactions with recovery guidance and live transactions without it", async () => {
    const f = await fixture();
    const transaction = path.join(f.codexHome, ".AGENTS.md.navi-transaction-test"); await fs.mkdir(transaction, { mode: 0o700 });
    await fs.writeFile(path.join(transaction, "backup"), "old"); await fs.writeFile(path.join(transaction, "stage"), "desired");
    await fs.writeFile(path.join(transaction, "manifest.json"), JSON.stringify({ version: 1, id: "test", pid: 99, operation: "modify", target: "AGENTS.md", expectedHash: createHash("sha256").update("old").digest("hex"), desiredHash: createHash("sha256").update("desired").digest("hex"), stage: "backed-up", createdAt: new Date().toISOString() }));
    const recoverable = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(recoverable.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
    expect(recoverable.checks.find((check) => check.id === "transaction")?.repair).toContain("navi setup --write");
    await fs.rm(transaction, { recursive: true }); await fs.writeFile(path.join(f.codexHome, ".AGENTS.md.navi-lock"), "lock");
    const live = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(live.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
  });

  it("accepts no doctor options only", async () => {
    const stderr: string[] = []; expect(await runNaviDoctorCli(["--write"], { stdout: () => undefined, stderr: (text) => stderr.push(text) })).toBe(1); expect(stderr.join("")).toContain("Usage: navi doctor");
  });
});
