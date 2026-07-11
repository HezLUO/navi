import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport, runNaviDoctorCli } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";
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
    expect(renderNaviDoctorReport(legacyReport)).toContain("along-working-thread@personal");
    expect(renderNaviDoctorReport(legacyReport)).toContain("Install and enable navi@navi-source");
    expect(conflictReport.checks.find((check) => check.id === "plugin")?.status).toBe("fail");
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
    await fs.writeFile(path.join(f.codexHome, ".AGENTS.md.navi-backup-test"), "old");
    await fs.writeFile(path.join(f.codexHome, ".AGENTS.md.navi-transaction-test.json"), JSON.stringify({ id: "test", operation: "modify", target: "AGENTS.md", backupFile: ".AGENTS.md.navi-backup-test", expectedHash: createHash("sha256").update("old").digest("hex"), stage: "backed-up", createdAt: new Date().toISOString() }));
    const recoverable = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(recoverable.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
    expect(recoverable.checks.find((check) => check.id === "transaction")?.repair).toContain("navi setup --write");
    await fs.rm(path.join(f.codexHome, ".AGENTS.md.navi-transaction-test.json")); await fs.writeFile(path.join(f.codexHome, ".AGENTS.md.navi-lock"), "lock");
    const live = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(live.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
  });

  it("accepts no doctor options only", async () => {
    const stderr: string[] = []; expect(await runNaviDoctorCli(["--write"], { stdout: () => undefined, stderr: (text) => stderr.push(text) })).toBe(1); expect(stderr.join("")).toContain("Usage: navi doctor");
  });
});
