import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport, runNaviDoctorCli } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";
import { renderAgentsBlock } from "../../src/cli/navi-project-trigger";
import { inspectNaviInstallation, type NaviInstallationStatus } from "../../src/cli/navi-installation";
import type { NaviInvocationContext } from "../../src/cli/navi-invocation";
import { NAVI_PROJECT_MAP_RELATIVE_PATH, REQUIRED_PROJECT_MAP_ANCHORS } from "../../src/cli/navi-project-map";
import { LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION } from "../fixtures/navi-legacy-agents-blocks";

const roots: string[] = [];
const trustedInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "navi",
  reachability: "pass",
  reason: "bare",
  commandPrefix: ["navi"],
};
const fallbackInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/Users/james/.hermes/node/bin/navi"],
  pathBin: "/Users/james/.hermes/node/bin",
};
const directSourceFallbackInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/source/Navi/src/cli/navi-bin.mjs"],
  pathBin: "/source/Navi/src/cli",
};
const differentlyNamedFallbackInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "fallback",
  reason: "path-missing",
  commandPrefix: ["/Users/james/.hermes/node/bin/navi-dev"],
  pathBin: "/Users/james/.hermes/node/bin",
};
const unavailableInvocation: NaviInvocationContext = {
  cliRoot: "/source/Navi",
  entrypoint: "/source/Navi/src/cli/navi-bin.mjs",
  reachability: "unavailable",
  reason: "unavailable",
};
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
  it("passes when bare Navi is trusted", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: trustedInvocation },
    );

    expect(report.checks.find((check) => check.id === "cli")).toMatchObject({
      status: "pass",
      summary: "Navi CLI is reachable as `navi`.",
    });
  });

  it("warns without changing the migration stage when a verified fallback is available", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: fallbackInvocation },
    );

    expect(report.migrationStage).toBe("current-only-bootstrap-missing");
    expect(report.checks.find((check) => check.id === "cli")).toMatchObject({ status: "warn" });
    expect(report.nextAction).toContain("/Users/james/.hermes/node/bin/navi setup");
    expect(report.nextAction).not.toContain("Run navi setup");
    expect(renderNaviDoctorReport(report)).toContain(
      "Using verified fallback: /Users/james/.hermes/node/bin/navi",
    );
    expect(renderNaviDoctorReport(report)).toContain(
      "Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.",
    );
  });

  it("omits linked-bin PATH guidance for a direct canonical source fallback", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: directSourceFallbackInvocation },
    );
    const cli = report.checks.find((check) => check.id === "cli");

    expect(cli).toMatchObject({ status: "warn" });
    expect(cli?.details).toContain("Using verified fallback: /source/Navi/src/cli/navi-bin.mjs");
    expect(cli?.details).not.toContain(
      "Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.",
    );
    expect(renderNaviDoctorReport(report)).not.toContain(
      "Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.",
    );
  });

  it("omits linked-bin PATH guidance for a differently named verified entrypoint", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: differentlyNamedFallbackInvocation },
    );
    const cli = report.checks.find((check) => check.id === "cli");

    expect(cli).toMatchObject({ status: "warn" });
    expect(cli?.details).toContain("Using verified fallback: /Users/james/.hermes/node/bin/navi-dev");
    expect(cli?.details).not.toContain(
      "Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.",
    );
  });

  it("fails command reachability without printing speculative Navi commands", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: unavailableInvocation },
    );

    expect(report.checks.find((check) => check.id === "cli")).toMatchObject({ status: "fail" });
    expect(report.nextAction).toMatch(/verified Navi CLI entrypoint/i);
    expect(report.nextAction).not.toMatch(/\bnavi (?:doctor|setup|init)\b/);
  });

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

  it("uses the verified fallback to repair a confirmed Map with a missing trigger", async () => {
    const f = await fixture();
    const mapPath = path.join(f.projectDir, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, confirmedMap());
    await fs.writeFile(path.join(f.codexHome, "AGENTS.md"), renderGlobalBootstrapBlock());
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: fallbackInvocation },
    );

    expect(report.checks.find((check) => check.id === "project-init")?.repair).toContain(
      "/Users/james/.hermes/node/bin/navi init",
    );
    expect(report.nextAction).toContain("/Users/james/.hermes/node/bin/navi init");
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

  it("guides legacy-only and verified dual transition with one global action", async () => {
    const f = await fixture();
    const legacy = {
      selector: "along-working-thread@personal",
      pluginName: "along-working-thread",
      marketplaceName: "personal",
      installed: true,
      enabled: true,
      raw: "legacy",
    };

    const legacyReport = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => ({ kind: "legacy", legacy, raw: "legacy" }) },
    );
    expect(legacyReport.migrationStage).toBe("legacy-only");
    expect(legacyReport.nextAction).toContain("navi@navi-source");
    expect(renderNaviDoctorReport(legacyReport)).not.toMatch(/navi init|navi setup --write/);

    const dualReport = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      {
        inspectInstallation: async () => ({
          ...current(f.source),
          kind: "conflict",
          conflictReason: "dual-generation",
          legacy,
        }),
      },
    );
    expect(dualReport.migrationStage).toBe("transition-dual");
    expect(dualReport.checks.find((check) => check.id === "manifest")?.status).toBe("pass");
    expect(dualReport.nextAction).toBe(
      "Run codex plugin remove along-working-thread@personal, then rerun navi doctor. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.",
    );
    expect(renderNaviDoctorReport(dualReport)).toContain("Migration stage: transition-dual");
    expect(renderNaviDoctorReport(dualReport).match(/Next action:/g)).toHaveLength(1);
    expect(renderNaviDoctorReport(dualReport)).not.toContain("  Repair:");
    expect(renderNaviDoctorReport(dualReport)).not.toContain("navi init");
  });

  it.each(["distinct", "duplicate"])(
    "keeps %s multiple legacy rows out of the verified dual transition",
    async (name) => {
      const f = await fixture();
      const legacyRows = name === "distinct"
        ? [
            "along-working-thread@personal  Installed, Enabled  0.1.0  /legacy/personal",
            "along-working-thread@other  Installed, Enabled  0.1.0  /legacy/other",
          ]
        : [
            "along-working-thread@personal  Installed, Enabled  0.1.0  /legacy/personal",
            "along-working-thread@personal  Installed, Enabled  0.1.0  /legacy/personal",
          ];
      const installation = await inspectNaviInstallation(async () => ({
        code: 0,
        stdout: [
          `navi@navi-source  Installed, Enabled  0.1.0  ${f.source}`,
          ...legacyRows,
        ].join("\n"),
        stderr: "",
      }));
      const report = await buildNaviDoctorReport(
        { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
        { inspectInstallation: async () => installation },
      );

      expect(installation).toMatchObject({
        kind: "conflict",
        conflictReason: "ambiguous-legacy",
      });
      expect(installation.legacy).toBeUndefined();
      expect(report.migrationStage).toBe("dual-invalid");
      expect(report.nextAction).toMatch(/legacy.*ambiguous|exactly one.*legacy/i);
      expect(report.nextAction).not.toContain("codex plugin remove");
    },
  );

  it.each(["missing source path", "alternate current", "duplicate current"])(
    "keeps legacy installed for %s",
    async (name) => {
      const f = await fixture();
      const legacy = {
        selector: "along-working-thread@personal",
        pluginName: "along-working-thread",
        marketplaceName: "personal",
        installed: true,
        enabled: true,
        raw: "legacy",
      };
      const installation: NaviInstallationStatus = name === "missing source path"
        ? { ...current(), kind: "conflict", conflictReason: "dual-generation", legacy }
        : name === "alternate current"
          ? {
              kind: "conflict",
              conflictReason: "non-authoritative-current",
              current: { selector: "navi@other", pluginName: "navi", marketplaceName: "other", installed: true, enabled: true, raw: "alternate" },
              legacy,
              raw: "alternate",
              diagnostic: "Navi is installed from a non-authoritative selector: navi@other.",
            }
          : {
              ...current(f.source),
              kind: "conflict",
              conflictReason: "duplicate-current",
              legacy,
              diagnostic: "Navi is installed more than once from navi@navi-source.",
            };

      const report = await buildNaviDoctorReport(
        { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
        { inspectInstallation: async () => installation },
      );
      expect(report.migrationStage).toBe("dual-invalid");
      expect(report.nextAction).toMatch(/keep.*legacy.*installed/i);
      expect(report.nextAction).not.toContain("codex plugin remove along-working-thread@personal");
    },
  );

  it("reports current-only bootstrap work before project initialization", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source) },
    );

    expect(report.migrationStage).toBe("current-only-bootstrap-missing");
    expect(report.nextAction).toBe("Run navi setup, review the preview, then run navi setup --write.");
    expect(renderNaviDoctorReport(report)).not.toContain("navi init");
  });

  it("keeps current-active global status independent from project initialization", async () => {
    const f = await fixture();
    await fs.writeFile(path.join(f.codexHome, "AGENTS.md"), renderGlobalBootstrapBlock());
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source) },
    );

    expect(report.migrationStage).toBe("current-active");
    expect(report.checks.find((check) => check.id === "project-init")?.status).toBe("warn");
    expect(report.nextAction).toMatch(/Project Map candidate/i);
  });

  it("reports an installed Current Navi without inspectable source as unusable", async () => {
    const f = await fixture();
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current() },
    );

    expect(report.migrationStage).toBe("current-unusable");
    expect(report.nextAction).toMatch(/source path or manifest/i);
    expect(renderNaviDoctorReport(report)).not.toContain("navi setup --write");
  });

  it.each([
    [
      "an alternate Navi selector",
      {
        kind: "conflict" as const,
        conflictReason: "non-authoritative-current" as const,
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
        conflictReason: "duplicate-current" as const,
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

  it("removes the alternate selector when authoritative and alternate Current Navi coexist", async () => {
    const f = await fixture();
    const installation = await inspectNaviInstallation(async () => ({
      code: 0,
      stdout: [
        "navi@navi-source  Installed, Enabled  0.1.0  /source/plugins/navi",
        "navi@other  Installed, Enabled  0.1.0  /alternate/plugins/navi",
      ].join("\n"),
      stderr: "",
    }));
    const report = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => installation },
    );

    expect(report.nextAction).toContain("Remove the non-authoritative Navi selector navi@other");
    expect(report.nextAction).not.toContain("Remove the non-authoritative Navi selector navi@navi-source");
    expect(installation).toMatchObject({
      kind: "conflict",
      conflictReason: "non-authoritative-current",
      current: { selector: "navi@other" },
    });
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
    expect(report.nextAction).toMatch(/symlink|regular file/i);
  });

  it("fails recoverable transactions with recovery guidance and live transactions without it", async () => {
    const f = await fixture();
    const transaction = path.join(f.codexHome, ".AGENTS.md.navi-transaction-test"); await fs.mkdir(transaction, { mode: 0o700 });
    await fs.writeFile(path.join(transaction, "backup"), "old"); await fs.writeFile(path.join(transaction, "stage"), "desired");
    await fs.writeFile(path.join(transaction, "manifest.json"), JSON.stringify({ version: 1, id: "test", pid: 99, operation: "modify", target: "AGENTS.md", expectedHash: createHash("sha256").update("old").digest("hex"), desiredHash: createHash("sha256").update("desired").digest("hex"), stage: "backed-up", createdAt: new Date().toISOString() }));
    const recoverable = await buildNaviDoctorReport(
      { codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot },
      { inspectInstallation: async () => current(f.source), invocation: fallbackInvocation },
    );
    expect(recoverable.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
    expect(recoverable.checks.find((check) => check.id === "transaction")?.repair).toContain("/Users/james/.hermes/node/bin/navi setup --write");
    expect(recoverable.nextAction).toContain("/Users/james/.hermes/node/bin/navi setup --write");
    expect(recoverable.nextAction).toBe(recoverable.checks.find((check) => check.id === "transaction")?.repair);
    expect(renderNaviDoctorReport(recoverable).match(/Next action:/g)).toHaveLength(1);
    await fs.rm(transaction, { recursive: true }); await fs.writeFile(path.join(f.codexHome, ".AGENTS.md.navi-lock"), "lock");
    const live = await buildNaviDoctorReport({ codexHome: f.codexHome, projectDir: f.projectDir, cliRoot: f.cliRoot }, { inspectInstallation: async () => current(f.source) });
    expect(live.checks.find((check) => check.id === "transaction")?.status).toBe("fail");
  });

  it("accepts no doctor options only", async () => {
    const stderr: string[] = []; expect(await runNaviDoctorCli(["--write"], { stdout: () => undefined, stderr: (text) => stderr.push(text) })).toBe(1); expect(stderr.join("")).toContain("Usage: navi doctor");
  });
});
