import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertUnlinkedArtifact, resolveCanonicalCodexHome } from "./navi-codex-home";
import { NAVI_GLOBAL_BLOCK_END, NAVI_GLOBAL_BLOCK_START, planGlobalAgentsContent } from "./navi-global";
import { recognizeNaviManagedBlock } from "./navi-init";
import { inspectNaviInstallation, type NaviInstallationStatus } from "./navi-installation";
import { inspectTransaction } from "./navi-transaction";

export type DoctorCheckStatus = "pass" | "warn" | "fail";
export interface DoctorCheck {
  id: "cli" | "plugin" | "manifest" | "global-bootstrap" | "package-cache" | "project-init" | "transaction";
  status: DoctorCheckStatus;
  summary: string;
  repair?: string;
}
export interface NaviDoctorReport {
  requestedCodexHome: string;
  codexHome: string;
  cliRoot: string;
  projectDir: string;
  checks: DoctorCheck[];
}
export interface NaviDoctorOptions {
  codexHome?: string;
  projectDir?: string;
  cliRoot?: string;
}
export interface NaviDoctorDependencies {
  inspectInstallation?: () => Promise<NaviInstallationStatus>;
}
export interface NaviDoctorIo { stdout: (text: string) => void; stderr: (text: string) => void; }

const DEFAULT_IO: NaviDoctorIo = { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) };
const DEFAULT_CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GLOBAL_REPAIR = "Run navi setup, review the preview, then run navi setup --write.";
const PROJECT_REPAIR = "Run navi init, review the preview, then run navi init --write.";
const SOURCE_REPAIR = "Install and enable navi@navi-source before running navi setup --write.";
function migrationRepair(legacySelector: string): string {
  return `Install and enable navi@navi-source, preview an exact project trigger upgrade with navi init, run navi init --write only after approval, validate the target project, remove the exact legacy selector ${legacySelector}, then rerun navi doctor and navi setup.`;
}
function selectorConflictRepair(status: NaviInstallationStatus): string {
  if (status.diagnostic?.includes("non-authoritative selector")) {
    return `Remove the non-authoritative Navi selector ${status.current?.selector ?? "reported by codex plugin list"}, then install and enable navi@navi-source before rerunning navi doctor and navi setup.`;
  }
  if (status.diagnostic?.includes("more than once")) {
    return "Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains, then rerun navi doctor and navi setup.";
  }
  return "Resolve the reported Navi plugin selector conflict, then rerun navi doctor and navi setup.";
}

export async function buildNaviDoctorReport(options: NaviDoctorOptions = {}, dependencies: NaviDoctorDependencies = {}): Promise<NaviDoctorReport> {
  const requestedCodexHome = path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"));
  const canonical = await resolveCanonicalCodexHome(requestedCodexHome);
  const cliRoot = path.resolve(options.cliRoot ?? DEFAULT_CLI_ROOT);
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const installation = await (dependencies.inspectInstallation ?? inspectNaviInstallation)();
  const sourcePath = installation.current?.sourcePath ? path.resolve(installation.current.sourcePath) : undefined;
  return {
    requestedCodexHome: canonical.requestedPath,
    codexHome: canonical.canonicalPath,
    cliRoot,
    projectDir,
    checks: [
      await buildCliCheck(cliRoot),
      buildPluginCheck(installation),
      await buildManifestCheck(installation, sourcePath),
      await buildGlobalBootstrapCheck(canonical.canonicalPath),
      await buildPackageCacheCheck(sourcePath),
      await buildProjectInitCheck(projectDir),
      await buildTransactionCheck(canonical.canonicalPath),
    ],
  };
}

export function renderNaviDoctorReport(report: NaviDoctorReport): string {
  const roots = report.requestedCodexHome === report.codexHome ? [] : [
    `Requested CODEX_HOME: ${report.requestedCodexHome}`,
    `Canonical CODEX_HOME: ${report.codexHome}`,
  ];
  return `${[...roots, ...report.checks.flatMap((check) => [
    `[${check.status}] ${check.id}: ${check.summary}`,
    ...(check.repair ? [`  Repair: ${check.repair}`] : []),
  ])].join("\n")}\n`;
}

export async function runNaviDoctorCli(args: string[], io: NaviDoctorIo = DEFAULT_IO, dependencies: NaviDoctorDependencies = {}, options: NaviDoctorOptions = {}): Promise<number> {
  if (args.length > 0) { io.stderr("Usage: navi doctor\n"); return 1; }
  try {
    const report = await buildNaviDoctorReport(options, dependencies);
    io.stdout(renderNaviDoctorReport(report));
    return report.checks.some((check) => check.status === "fail") ? 1 : 0;
  } catch (error) { io.stderr(`${error instanceof Error ? error.message : String(error)}\n`); return 1; }
}

async function buildCliCheck(cliRoot: string): Promise<DoctorCheck> {
  return await isDirectory(cliRoot)
    ? { id: "cli", status: "pass", summary: "Navi CLI root is available." }
    : { id: "cli", status: "fail", summary: "Navi CLI root is unavailable.", repair: "Run navi from a checked-out Navi source package." };
}
function buildPluginCheck(status: NaviInstallationStatus): DoctorCheck {
  switch (status.kind) {
    case "current": return { id: "plugin", status: "pass", summary: `Navi plugin is installed and enabled${status.current?.version ? ` (${status.current.version}).` : "."}` };
    case "legacy": return { id: "plugin", status: "fail", summary: `Only legacy plugin ${status.legacy?.selector ?? "along-working-thread"} is installed.`, repair: migrationRepair(status.legacy?.selector ?? "along-working-thread") };
    case "conflict": return status.legacy
      ? { id: "plugin", status: "fail", summary: `Navi and legacy plugin ${status.legacy.selector} are both installed.`, repair: migrationRepair(status.legacy.selector) }
      : { id: "plugin", status: "fail", summary: `Navi plugin installation conflict${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: selectorConflictRepair(status) };
    case "uninspectable": return { id: "plugin", status: "fail", summary: `Navi plugin installation could not be inspected${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: "Repair codex plugin list, then rerun navi doctor." };
    case "missing": return { id: "plugin", status: "fail", summary: "Navi plugin is missing or disabled.", repair: SOURCE_REPAIR };
  }
}
async function buildManifestCheck(status: NaviInstallationStatus, sourcePath: string | undefined): Promise<DoctorCheck> {
  if (status.kind !== "current" || !sourcePath) return { id: "manifest", status: "warn", summary: "Navi plugin source is unavailable; manifest inspection is incomplete." };
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(sourcePath, ".codex-plugin", "plugin.json"), "utf8")) as { interface?: { defaultPrompt?: unknown } };
    const prompts = manifest.interface?.defaultPrompt;
    if (Array.isArray(prompts) && prompts.length <= 3) return { id: "manifest", status: "pass", summary: "Installed Navi plugin manifest defaultPrompt contains at most 3 entries." };
    return { id: "manifest", status: "fail", summary: "Installed Navi plugin manifest defaultPrompt must contain at most 3 entries.", repair: "Reduce plugin interface.defaultPrompt to at most 3 entries." };
  } catch { return { id: "manifest", status: "warn", summary: "Navi plugin source is unavailable; manifest inspection is incomplete." }; }
}
async function buildGlobalBootstrapCheck(codexHome: string): Promise<DoctorCheck> {
  const target = path.join(codexHome, "AGENTS.md");
  try { await assertUnlinkedArtifact(target); } catch { return { id: "global-bootstrap", status: "fail", summary: "Global AGENTS.md is unsafe to inspect.", repair: "Replace the AGENTS.md symlink with a regular file before running navi setup." }; }
  const content = await readOptional(target);
  if (content !== undefined && planGlobalAgentsContent(content, "install").kind === "skip") return { id: "global-bootstrap", status: "pass", summary: "Navi global bootstrap is installed." };
  const markers = content?.includes(NAVI_GLOBAL_BLOCK_START) || content?.includes(NAVI_GLOBAL_BLOCK_END);
  return { id: "global-bootstrap", status: "fail", summary: markers ? "Navi global bootstrap markers are damaged or unrecognized." : "Navi global bootstrap is not installed.", repair: GLOBAL_REPAIR };
}
async function buildPackageCacheCheck(sourcePath: string | undefined): Promise<DoctorCheck> {
  if (!sourcePath) return { id: "package-cache", status: "warn", summary: "Navi source/cache evidence is unavailable; inspection is incomplete." };
  return { id: "package-cache", status: "warn", summary: "Navi installation reports one source path but no separate cache evidence; inspection is incomplete." };
}
async function buildProjectInitCheck(projectDir: string): Promise<DoctorCheck> {
  const content = await readOptional(path.join(projectDir, "AGENTS.md"));
  const recognition = content === undefined ? { kind: "absent" as const } : recognizeNaviManagedBlock(content);
  if (recognition.kind === "recognized") return { id: "project-init", status: "pass", summary: "This project has project-local Navi guidance." };
  return { id: "project-init", status: "warn", summary: recognition.kind === "unsafe" ? "This project has damaged or unrecognized project-local Navi guidance." : "This project does not have project-local Navi guidance.", repair: PROJECT_REPAIR };
}
async function buildTransactionCheck(codexHome: string): Promise<DoctorCheck> {
  const transaction = await inspectTransaction(codexHome);
  switch (transaction.kind) {
    case "none": return { id: "transaction", status: "pass", summary: "No pending Navi setup transaction." };
    case "recoverable-cleanup": case "recoverable-restore": return { id: "transaction", status: "fail", summary: "A recoverable Navi setup transaction needs recovery.", repair: "Run navi setup --write to recover, then rerun navi setup." };
    case "live-lock": return { id: "transaction", status: "fail", summary: "A Navi setup transaction is currently active." };
    case "conflict": return { id: "transaction", status: "fail", summary: `Navi setup transaction requires manual resolution: ${transaction.diagnostic}` };
  }
}
async function readOptional(filePath: string): Promise<string | undefined> { try { return await fs.readFile(filePath, "utf8"); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; } }
async function isDirectory(directory: string): Promise<boolean> { try { return (await fs.lstat(directory)).isDirectory(); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; } }
