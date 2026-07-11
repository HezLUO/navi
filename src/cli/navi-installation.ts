import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

export interface PluginListRow {
  selector: string;
  pluginName: string;
  marketplaceName?: string;
  installed: boolean;
  enabled: boolean;
  version?: string;
  sourcePath?: string;
  raw: string;
}

export type NaviInstallationKind = "current" | "legacy" | "conflict" | "missing" | "uninspectable";

export interface NaviInstallationStatus {
  kind: NaviInstallationKind;
  current?: PluginListRow;
  legacy?: PluginListRow;
  raw: string;
  diagnostic?: string;
}

export type RunCommand = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

const execFile = promisify(execFileCallback);
const VERSION = /^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/;
const SELECTOR = /^([^@\s]+)@([^@\s]+)$/;

export const defaultRunCommand: RunCommand = async (command, args) => {
  try {
    const { stdout, stderr } = await execFile(command, args, { encoding: "utf8" });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code?: number; stdout?: string; stderr?: string };
    return {
      code: typeof failed.code === "number" ? failed.code : 1,
      stdout: failed.stdout ?? "",
      stderr: failed.stderr ?? "",
    };
  }
};

export function parsePluginListRows(output: string): PluginListRow[] {
  return output.split(/\r?\n/).flatMap((raw) => {
    const row = /^\s*(\S+)\s+(Installed,\s*(?:Enabled|Disabled))\s*(.*)$/i.exec(raw);
    if (!row) return [];
    const [, selector, state, remainder] = row;
    const selectorMatch = SELECTOR.exec(selector);
    if (!selectorMatch) return [];
    const columns = remainder.trim().split(/\s+/).filter(Boolean);
    const version = columns.find((column) => VERSION.test(column));
    const sourcePath = columns.find((column) => column.startsWith("/") || column.startsWith("~"));
    return [{
      selector,
      pluginName: selectorMatch[1],
      marketplaceName: selectorMatch[2],
      installed: /\binstalled\b/i.test(state),
      enabled: /\benabled\b/i.test(state) && !/\bdisabled\b/i.test(state),
      ...(version ? { version } : {}),
      ...(sourcePath ? { sourcePath } : {}),
      raw,
    }];
  });
}

function commandRaw(result: { stdout: string; stderr: string }): string {
  return [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
}

export async function inspectNaviInstallation(
  runCommand: RunCommand = defaultRunCommand,
): Promise<NaviInstallationStatus> {
  const result = await runCommand("codex", ["plugin", "list"]);
  const raw = commandRaw(result);
  if (result.code !== 0) {
    return { kind: "uninspectable", raw, diagnostic: "codex plugin list exited unsuccessfully." };
  }

  const rows = parsePluginListRows(result.stdout);
  if (rows.length === 0 && result.stdout.trim()) {
    return { kind: "uninspectable", raw, diagnostic: "codex plugin list output could not be parsed." };
  }
  const current = rows.find((row) => row.pluginName === "navi");
  const legacy = rows.find((row) => row.pluginName === "along-working-thread");

  if (current?.installed && legacy?.installed) return { kind: "conflict", current, legacy, raw };
  if (current?.installed && current.enabled) return { kind: "current", current, ...(legacy ? { legacy } : {}), raw };
  if (legacy?.installed) return { kind: "legacy", ...(current ? { current } : {}), legacy, raw };
  return { kind: "missing", ...(current ? { current } : {}), ...(legacy ? { legacy } : {}), raw };
}
