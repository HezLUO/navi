import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport, runNaviDoctorCli } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";
import { renderAgentsBlock } from "../../src/cli/navi-init";
import { type NaviInstallationStatus } from "../../src/cli/navi-installation";
import { NAVI_PROJECT_MAP_RELATIVE_PATH, REQUIRED_PROJECT_MAP_ANCHORS } from "../../src/cli/navi-project-map";
import { LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION } from "../fixtures/navi-legacy-agents-blocks";

const roots: string[] = [];
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-doctor-")); roots.push(root);
  const codexHome = path.join(root, "codex-home"); const projectDir = path.join(root, "project"); const cliRoot = path.join(root, "cli"); const source = path.join(root, "installed-source");
  await Promise.all([fs.mkdir(codexHome), fs.mkdir(projectDir), fs.mkdir(cliRoot), fs.mkdir(path.join(source, ".codex-plugin"), { recursive: true })]);
  await fs.writeFile(path.join(source, ".codex-plugin", "plugin.json"), JSON.stringify({ interface: { defaultPrompt: ["one"] } }));
  return { root, codexHome, projectDir, cliRoot, source };
}
function current(sourcePath?: string): NaviInstallationStatus { return { kind: "current", current: { selector: "navi@navi-source", pluginName: "navi", marketplaceName: "navi-source", installed: true, enabled: true, ...(sourcePath ? { sourcePath } : {}), raw: "current" }, raw: "current" }; }
function confirmedMap(projectStatus: "active" | "paused" | "closed" = "active"): string {
  return `---
navi_map: 1
map_status: confirmed
project_status: ${projectStatus}
last_confirmed: 2026-07-14
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) => `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed value ${index + 1}.`).join("\n\n")}
`;
}
type TriggerFixture = "missing" | "current" | "legacy" | "invalid";
type MapFixture = "missing" | "valid" | "valid-paused" | "valid-closed" | "invalid" | "unsupported" | "unsafe";
async function buildFixtureReport(triggerFixture: TriggerFixture, mapFixture: MapFixture) {
  const f = await fixture();
  if (triggerFixture !== "missing") {
    const trigger = triggerFixture === "current"
      ? renderAgentsBlock()
      : triggerFixture === "legacy"
        ? LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION
        : "<!-- NAVI:START -->\ngarbage\n<!-- NAVI:END -->";
    await fs.writeFile(path.join(f.projectDir, "AGENTS.md"), `${trigger}\n`);
  }
  if (mapFixture !== "missing") {
    const mapPath = path.join(f.projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    if (mapFixture === "unsafe") {
      await fs.mkdir(mapPath);
    } else {
      const text = mapFixture === "valid"
        ? confirmedMap()
        : mapFixture === "valid-paused"
          ? confirmedMap("paused")
          : mapFixture === "valid-closed"
            ? confirmedMap("closed")
            : mapFixture === "unsupported"
              ? confirmedMap().replace("navi_map: 1", "navi_map: 2")
              : confirmedMap().replace("map_status: confirmed", "map_status: draft");
      await fs.writeFile(mapPath, text);
    }
  }
  return buildNaviDoctorReport(
    { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
    { inspectInstallation: async () => current(f.source) },
  );
}
async function snapshot(root: string): Promise<string[]> { const entries: string[] = []; async function visit(dir: string) { for (const item of await fs.readdir(dir, { withFileTypes: true })) { const target = path.join(dir, item.name); entries.push(`${path.relative(root, target)}:${item.isSymbolicLink() ? "link" : item.isDirectory() ? "dir" : await fs.readFile(target, "utf8")}`); if (item.isDirectory()) await visit(target); } } await visit(root); return entries.sort(); }
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });

describe("Navi doctor", () => {
  it.each([
    ["not-initialized", "missing", "missing", "warn"],
    ["map-ready", "missing", "valid", "warn"],
    ["trigger-orphaned", "current", "missing", "fail"],
    ["map-invalid", "current", "invalid", "fail"],
    ["map-unsupported", "current", "unsupported", "fail"],
    ["trigger-invalid", "invalid", "valid", "fail"],
    ["healthy-active", "current", "valid", "pass"],
    ["healthy-paused", "current", "valid-paused", "pass"],
    ["healthy-closed", "current", "valid-closed", "pass"],
  ] as const)("classifies %s", async (_name, triggerFixture, mapFixture, expectedStatus) => {
    const report = await buildFixtureReport(triggerFixture, mapFixture);
    expect(report.checks.find((check) => check.id === "project-init")?.status).toBe(expectedStatus);
  });

  it("does not pass marker-wrapped garbage", async () => {
    const report = await buildFixtureReport("invalid", "valid");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check?.status).toBe("fail");
    expect(check?.summary).toMatch(/trigger.*invalid|damaged.*trigger/i);
  });

  it("guides a Map-ready project to preview trigger activation without regenerating its Map", async () => {
    const report = await buildFixtureReport("missing", "valid");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "warn" });
    expect(check?.summary).toMatch(/valid confirmed Project Map.*trigger/i);
    expect(check?.repair).toMatch(/navi init.*preview.*trigger activation/i);
    expect(check?.repair).not.toMatch(/form|regenerate|replace.*Map/i);
  });

  it("gives a recognized-version-1 invalid Map a corrected-candidate repair preview", async () => {
    const report = await buildFixtureReport("current", "invalid");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "fail" });
    expect(check?.repair).toMatch(/corrected confirmed.*candidate/i);
    expect(check?.repair).toMatch(/exact repair preview/i);
    expect(check?.repair).toContain("navi init --map-file");
  });

  it.each([
    ["unknown-format", confirmedMap().replace("navi_map: 1", "navi_map: one")],
    ["unsupported", confirmedMap().replace("navi_map: 1", "navi_map: 2")],
  ] as const)("gives a %s Map manual preservation guidance without an overwrite command", async (_name, mapText) => {
    const f = await fixture();
    await fs.writeFile(path.join(f.projectDir, "AGENTS.md"), `${renderAgentsBlock()}\n`);
    const mapPath = path.join(f.projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, mapText);
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source) },
    );
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "fail" });
    expect(check?.repair).toMatch(/preserve.*Project Map.*manual/i);
    expect(check?.repair).not.toContain("navi init --write");
  });

  it("gives an unsafe Map manual preservation guidance without an overwrite command", async () => {
    const report = await buildFixtureReport("current", "unsafe");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "fail" });
    expect(check?.repair).toMatch(/preserve.*Project Map.*manual/i);
    expect(check?.repair).not.toContain("navi init --write");
  });

  it("reports a legacy trigger with a valid Map as non-healthy with exact upgrade guidance", async () => {
    const report = await buildFixtureReport("legacy", "valid");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "fail" });
    expect(check?.summary).toMatch(/legacy.*trigger/i);
    expect(check?.repair).toMatch(/navi init.*exact.*trigger upgrade preview/i);
  });

  it.each(["paused", "closed"] as const)("names a healthy %s lifecycle without urging continuation", async (lifecycle) => {
    const report = await buildFixtureReport("current", lifecycle === "paused" ? "valid-paused" : "valid-closed");
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "pass" });
    expect(check?.summary).toContain(lifecycle);
    expect(check?.summary).not.toMatch(/continue|resume|next/i);
    expect(check?.repair).toBeUndefined();
  });

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
      expect(output).toMatch(
        /Existing confirmed Map branch:[\s\S]*preview with navi init,[\s\S]*capture the Plan fingerprint,[\s\S]*apply with navi init --expect-plan <fingerprint> --write/i,
      );
      expect(output).toMatch(
        /Missing confirmed Map branch:[\s\S]*form and confirm a Project Map candidate,[\s\S]*preview with navi init --map-file <candidate>,[\s\S]*capture the Plan fingerprint,[\s\S]*apply with navi init --map-file <candidate> --expect-plan <fingerprint> --write/i,
      );
      expect(output).not.toMatch(/navi init --write(?:[\s.,]|$)/);
      expect(output).not.toMatch(/navi init --map-file <candidate>[\s\S]*apply with navi init --expect-plan <fingerprint> --write/i);
      expect(output).toMatch(/validate the target project[\s\S]*along-working-thread@personal[\s\S]*navi doctor[\s\S]*navi setup/i);
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
      `${renderAgentsBlock().replace("Navi Project Supervision", "Navi Project Supervison")}\n`,
    );

    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source) },
    );
    const check = report.checks.find((candidate) => candidate.id === "project-init");

    expect(check).toMatchObject({ status: "fail", repair: expect.stringContaining("navi init") });
    expect(check?.summary).toMatch(/trigger.*invalid or unsafe/i);
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
