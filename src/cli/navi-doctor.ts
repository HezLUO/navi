import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  inspectInstalledNaviPlugin,
  NAVI_GLOBAL_BLOCK_END,
  NAVI_GLOBAL_BLOCK_START,
  planGlobalAgentsContent,
  type NaviPluginStatus,
} from "./navi-global";
import { NAVI_AGENTS_BLOCK_END, NAVI_AGENTS_BLOCK_START } from "./navi-init";

export type DoctorCheckStatus = "pass" | "warn" | "fail";

export interface DoctorCheck {
  id: "cli" | "plugin" | "manifest" | "global-bootstrap" | "package-cache" | "project-init";
  status: DoctorCheckStatus;
  summary: string;
  repair?: string;
}

export interface NaviDoctorReport {
  codexHome: string;
  projectDir: string;
  checks: DoctorCheck[];
}

export interface NaviDoctorOptions {
  codexHome?: string;
  projectDir?: string;
  packageRoot?: string;
  cacheRoot?: string;
}

export interface NaviDoctorDependencies {
  inspectPlugin?: () => Promise<NaviPluginStatus>;
}

export interface NaviDoctorIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const DEFAULT_IO: NaviDoctorIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

const GLOBAL_REPAIR = "Run navi setup, review the preview, then run navi setup --write.";
const PROJECT_REPAIR = "Run navi init, review the preview, then run navi init --write.";
const PLUGIN_REPAIR = "Install and enable the source-alpha Navi plugin before running navi setup --write.";
const MANIFEST_REPAIR = "Reduce plugin interface.defaultPrompt to at most 3 entries.";
const IGNORED_PACKAGE_ENTRIES = new Set([".git", "node_modules", ".DS_Store", "Thumbs.db"]);

export async function buildNaviDoctorReport(
  options: NaviDoctorOptions = {},
  dependencies: NaviDoctorDependencies = {},
): Promise<NaviDoctorReport> {
  const codexHome = path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"));
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const packageRoot = path.resolve(options.packageRoot ?? path.join(process.cwd(), "plugins", "along-working-thread"));
  const plugin = await (dependencies.inspectPlugin ?? inspectInstalledNaviPlugin)();
  const cacheRoot = path.resolve(
    options.cacheRoot ?? path.join(codexHome, "plugins", "cache", "personal", "along-working-thread", plugin.version?.replace(/^v/, "") ?? "0.1.0"),
  );

  return {
    codexHome,
    projectDir,
    checks: [
      await buildCliCheck(packageRoot),
      buildPluginCheck(plugin),
      await buildManifestCheck(packageRoot),
      await buildGlobalBootstrapCheck(codexHome),
      await buildPackageCacheCheck(packageRoot, cacheRoot),
      await buildProjectInitCheck(projectDir),
    ],
  };
}

export function renderNaviDoctorReport(report: NaviDoctorReport): string {
  return `${report.checks.flatMap((check) => [
    `[${check.status}] ${check.id}: ${check.summary}`,
    ...(check.repair ? [`  Repair: ${check.repair}`] : []),
  ]).join("\n")}\n`;
}

export async function runNaviDoctorCli(
  args: string[],
  io: NaviDoctorIo = DEFAULT_IO,
  dependencies: NaviDoctorDependencies = {},
): Promise<number> {
  if (args.length > 0) {
    io.stderr("Usage: navi doctor\n");
    return 1;
  }

  try {
    const report = await buildNaviDoctorReport({}, dependencies);
    io.stdout(renderNaviDoctorReport(report));
    return report.checks.some((check) => check.status === "fail") ? 1 : 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function buildCliCheck(packageRoot: string): Promise<DoctorCheck> {
  if (await isDirectory(packageRoot)) {
    return { id: "cli", status: "pass", summary: "Navi source package is available." };
  }
  return {
    id: "cli",
    status: "fail",
    summary: "Navi source package is unavailable.",
    repair: "Run navi from a checked-out Navi source package.",
  };
}

function buildPluginCheck(plugin: NaviPluginStatus): DoctorCheck {
  if (plugin.installed && plugin.enabled) {
    return {
      id: "plugin",
      status: "pass",
      summary: `Navi plugin is installed and enabled${plugin.version ? ` (${plugin.version}).` : "."}`,
    };
  }
  return {
    id: "plugin",
    status: "fail",
    summary: "Navi plugin is missing or disabled.",
    repair: PLUGIN_REPAIR,
  };
}

async function buildManifestCheck(packageRoot: string): Promise<DoctorCheck> {
  const manifestPath = path.join(packageRoot, ".codex-plugin", "plugin.json");
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as { interface?: { defaultPrompt?: unknown } };
    const prompts = manifest.interface?.defaultPrompt;
    if (Array.isArray(prompts) && prompts.length <= 3) {
      return { id: "manifest", status: "pass", summary: "Plugin manifest defaultPrompt contains at most 3 entries." };
    }
    if (Array.isArray(prompts)) {
      return {
        id: "manifest",
        status: "fail",
        summary: "Plugin manifest defaultPrompt must contain at most 3 entries.",
        repair: MANIFEST_REPAIR,
      };
    }
    return { id: "manifest", status: "fail", summary: "Plugin manifest defaultPrompt is missing or invalid.", repair: MANIFEST_REPAIR };
  } catch {
    return { id: "manifest", status: "fail", summary: "Plugin manifest is unavailable or invalid.", repair: MANIFEST_REPAIR };
  }
}

async function buildGlobalBootstrapCheck(codexHome: string): Promise<DoctorCheck> {
  const content = await readOptional(path.join(codexHome, "AGENTS.md"));
  if (content !== undefined && planGlobalAgentsContent(content, "install").kind === "skip") {
    return { id: "global-bootstrap", status: "pass", summary: "Navi global bootstrap is installed." };
  }
  const hasMarkers = content?.includes(NAVI_GLOBAL_BLOCK_START) || content?.includes(NAVI_GLOBAL_BLOCK_END);
  return {
    id: "global-bootstrap",
    status: "fail",
    summary: hasMarkers ? "Navi global bootstrap markers are damaged or unrecognized." : "Navi global bootstrap is not installed.",
    repair: GLOBAL_REPAIR,
  };
}

async function buildPackageCacheCheck(packageRoot: string, cacheRoot: string): Promise<DoctorCheck> {
  let cacheAvailable: boolean;
  try {
    cacheAvailable = await isDirectory(cacheRoot);
  } catch {
    return { id: "package-cache", status: "warn", summary: "Navi plugin cache is unavailable for comparison." };
  }
  if (!cacheAvailable) {
    return { id: "package-cache", status: "warn", summary: "Navi plugin cache is unavailable for comparison." };
  }
  if (!(await isDirectory(packageRoot))) {
    return { id: "package-cache", status: "warn", summary: "Navi source package is unavailable for cache comparison." };
  }
  try {
    return await samePackageTree(packageRoot, cacheRoot)
      ? { id: "package-cache", status: "pass", summary: "Navi source package and cache are aligned." }
      : { id: "package-cache", status: "fail", summary: "Navi source package and cache differ.", repair: "Refresh the installed Navi plugin cache from the verified source package." };
  } catch {
    return { id: "package-cache", status: "warn", summary: "Navi plugin cache is unavailable for comparison." };
  }
}

async function buildProjectInitCheck(projectDir: string): Promise<DoctorCheck> {
  const content = await readOptional(path.join(projectDir, "AGENTS.md"));
  if (content !== undefined && hasSingleCompleteMarkerPair(content, NAVI_AGENTS_BLOCK_START, NAVI_AGENTS_BLOCK_END)) {
    return { id: "project-init", status: "pass", summary: "This project has project-local Navi guidance." };
  }
  return {
    id: "project-init",
    status: "warn",
    summary: "This project does not have project-local Navi guidance.",
    repair: PROJECT_REPAIR,
  };
}

async function readOptional(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function isDirectory(directory: string): Promise<boolean> {
  try {
    return (await fs.stat(directory)).isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function hasSingleCompleteMarkerPair(content: string, startMarker: string, endMarker: string): boolean {
  const start = content.indexOf(startMarker);
  return start !== -1 && start === content.lastIndexOf(startMarker) && content.indexOf(endMarker, start) !== -1 && content.indexOf(endMarker) === content.lastIndexOf(endMarker);
}

async function samePackageTree(leftRoot: string, rightRoot: string): Promise<boolean> {
  const [left, right] = await Promise.all([readPackageTree(leftRoot), readPackageTree(rightRoot)]);
  if (left === undefined || right === undefined) return false;
  if (left.size !== right.size) return false;
  for (const [relativePath, contents] of left) {
    const otherContents = right.get(relativePath);
    if (otherContents === undefined || !otherContents.equals(contents)) return false;
  }
  return true;
}

async function readPackageTree(root: string): Promise<Map<string, Buffer> | undefined> {
  const files = new Map<string, Buffer>();
  async function visit(directory: string): Promise<boolean> {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) return false;
      if (IGNORED_PACKAGE_ENTRIES.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!(await visit(absolutePath))) return false;
      } else if (entry.isFile()) {
        files.set(path.relative(root, absolutePath), await fs.readFile(absolutePath));
      } else {
        return false;
      }
    }
    return true;
  }
  return (await visit(root)) ? files : undefined;
}
