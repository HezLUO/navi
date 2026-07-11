import { describe, expect, it } from "vitest";
import {
  inspectNaviInstallation,
  parsePluginListRows,
  type RunCommand,
} from "../../src/cli/navi-installation";

const CURRENT = "navi@navi-source              Installed, Enabled  0.1.0  /source/plugins/navi";
const LEGACY = "along-working-thread@personal Installed, Enabled  0.1.0  /legacy/plugin";

function commandResult(stdout: string, code = 0): RunCommand {
  return async () => ({ code, stdout, stderr: code === 0 ? "" : "codex plugin list failed" });
}

describe("Navi plugin installation inspection", () => {
  it("parses selector, state, version, and source path from plugin rows", () => {
    expect(parsePluginListRows(`${CURRENT}\n${LEGACY}\n`)).toEqual([
      {
        selector: "navi@navi-source",
        pluginName: "navi",
        marketplaceName: "navi-source",
        installed: true,
        enabled: true,
        version: "0.1.0",
        sourcePath: "/source/plugins/navi",
        raw: CURRENT,
      },
      {
        selector: "along-working-thread@personal",
        pluginName: "along-working-thread",
        marketplaceName: "personal",
        installed: true,
        enabled: true,
        version: "0.1.0",
        sourcePath: "/legacy/plugin",
        raw: LEGACY,
      },
    ]);
  });

  it.each([
    ["current", CURRENT, "current", "navi@navi-source"],
    ["legacy", LEGACY, "legacy", "along-working-thread@personal"],
    ["both", `${CURRENT}\n${LEGACY}`, "conflict", "navi@navi-source"],
    ["neither", "other@market  Installed, Enabled  1.0.0  /other", "missing", undefined],
    ["disabled current", "navi@navi-source  Installed, Disabled  0.1.0  /source/plugins/navi", "missing", "navi@navi-source"],
    ["current without source", "navi@navi-source  Installed, Enabled  0.1.0", "current", "navi@navi-source"],
  ] as const)("classifies %s installations", async (_name, stdout, kind, selector) => {
    const result = await inspectNaviInstallation(commandResult(stdout));

    expect(result.kind).toBe(kind);
    if (selector === "navi@navi-source") expect(result.current?.selector).toBe(selector);
    if (selector === "along-working-thread@personal") expect(result.legacy?.selector).toBe(selector);
  });

  it("preserves command output and reports a nonzero command as uninspectable", async () => {
    const result = await inspectNaviInstallation(commandResult("partial output", 1));

    expect(result).toMatchObject({
      kind: "uninspectable",
      raw: "partial output\ncodex plugin list failed",
    });
  });

  it("reports unparseable output as uninspectable", async () => {
    const result = await inspectNaviInstallation(commandResult("codex plugins are unavailable"));

    expect(result).toMatchObject({ kind: "uninspectable", raw: "codex plugins are unavailable" });
  });
});
