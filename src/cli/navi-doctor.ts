import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertUnlinkedArtifact, resolveCanonicalCodexHome } from "./navi-codex-home";
import { NAVI_GLOBAL_BLOCK_END, NAVI_GLOBAL_BLOCK_START, planGlobalAgentsContent } from "./navi-global";
import { inspectProjectTrigger, type ProjectTriggerState } from "./navi-project-trigger";
import { inspectNaviInstallation, type NaviInstallationStatus } from "./navi-installation";
import { inspectProjectMapFile, type ProjectMapFileState } from "./navi-project-map";
import { inspectTransaction } from "./navi-transaction";

export type DoctorCheckStatus = "pass" | "warn" | "fail";
export interface DoctorCheck {
  id: "cli" | "plugin" | "manifest" | "global-bootstrap" | "package-cache" | "project-init" | "transaction";
  status: DoctorCheckStatus;
  summary: string;
  repair?: string;
}
export type NaviMigrationStage =
  | "legacy-only"
  | "transition-dual"
  | "dual-invalid"
  | "current-only-bootstrap-missing"
  | "current-active"
  | "current-unusable";

export interface NaviDoctorReport {
  requestedCodexHome: string;
  codexHome: string;
  cliRoot: string;
  projectDir: string;
  migrationStage: NaviMigrationStage;
  nextAction?: string;
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

export type ProjectInitializationKind =
  | "not-initialized"
  | "map-ready"
  | "trigger-orphaned"
  | "map-invalid"
  | "trigger-invalid"
  | "healthy";

export interface ProjectInitializationState {
  kind: ProjectInitializationKind;
  trigger: ProjectTriggerState;
  map: ProjectMapFileState;
  lifecycle?: "active" | "paused" | "closed";
}

const DEFAULT_IO: NaviDoctorIo = { stdout: (text) => process.stdout.write(text), stderr: (text) => process.stderr.write(text) };
const DEFAULT_CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GLOBAL_REPAIR = "Run navi setup, review the preview, then run navi setup --write.";
const SOURCE_REPAIR = "Install and enable navi@navi-source, then rerun navi doctor.";
const CURRENT_SOURCE_REPAIR = "Keep the legacy plugin installed. Repair or remove the incomplete Current Navi installation, then rerun navi doctor before removing legacy.";
const CURRENT_ONLY_SOURCE_REPAIR = "Repair the installed Current Navi source path or manifest, then rerun navi doctor.";

function legacyInstallAction(legacySelector: string): string {
  return `Install and enable navi@navi-source, then rerun navi doctor. Keep the exact legacy selector ${legacySelector} installed during this verification step.`;
}

function legacyRemovalAction(legacySelector: string): string {
  return `Run codex plugin remove ${legacySelector}, then rerun navi doctor. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.`;
}

function selectorConflictRepair(status: NaviInstallationStatus): string {
  if (status.conflictReason === "non-authoritative-current") {
    const selector = status.current?.selector;
    return selector
      ? `Remove the non-authoritative Navi selector ${selector}, then install and enable navi@navi-source before rerunning navi doctor.`
      : "Keep the legacy installation unchanged and repair codex plugin list so the non-authoritative Current Navi selector can be identified.";
  }
  if (status.conflictReason === "duplicate-current") {
    return "Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains, then rerun navi doctor.";
  }
  return "Resolve the reported Current Navi plugin selector conflict, then rerun navi doctor.";
}

export async function buildNaviDoctorReport(options: NaviDoctorOptions = {}, dependencies: NaviDoctorDependencies = {}): Promise<NaviDoctorReport> {
  const requestedCodexHome = path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"));
  const canonical = await resolveCanonicalCodexHome(requestedCodexHome);
  const cliRoot = path.resolve(options.cliRoot ?? DEFAULT_CLI_ROOT);
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const installation = await (dependencies.inspectInstallation ?? inspectNaviInstallation)();
  const sourcePath = installation.current?.sourcePath ? path.resolve(installation.current.sourcePath) : undefined;
  const checks = [
    await buildCliCheck(cliRoot),
    buildPluginCheck(installation),
    await buildManifestCheck(installation, sourcePath),
    await buildGlobalBootstrapCheck(canonical.canonicalPath),
    await buildPackageCacheCheck(sourcePath),
    await buildProjectInitCheck(projectDir),
    await buildTransactionCheck(canonical.canonicalPath),
  ];
  const migrationStage = deriveMigrationStage(installation, checks);
  const nextAction = deriveNextAction(migrationStage, installation, checks);

  return {
    requestedCodexHome: canonical.requestedPath,
    codexHome: canonical.canonicalPath,
    cliRoot,
    projectDir,
    migrationStage,
    ...(nextAction ? { nextAction } : {}),
    checks,
  };
}

export function renderNaviDoctorReport(report: NaviDoctorReport): string {
  const roots = report.requestedCodexHome === report.codexHome ? [] : [
    `Requested CODEX_HOME: ${report.requestedCodexHome}`,
    `Canonical CODEX_HOME: ${report.codexHome}`,
  ];
  const lines = [
    ...roots,
    `Migration stage: ${report.migrationStage}`,
    ...report.checks.map((check) => `[${check.status}] ${check.id}: ${check.summary}`),
    ...(report.nextAction ? [`Next action: ${report.nextAction}`] : []),
  ];
  return `${lines.join("\n")}\n`;
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
    case "legacy": return { id: "plugin", status: "fail", summary: `Only legacy plugin ${status.legacy?.selector ?? "unidentified"} is installed.`, repair: SOURCE_REPAIR };
    case "conflict": return status.conflictReason === "dual-generation"
      ? { id: "plugin", status: "fail", summary: `Navi and legacy plugin ${status.legacy?.selector ?? "unidentified"} are both installed.`, repair: CURRENT_SOURCE_REPAIR }
      : { id: "plugin", status: "fail", summary: `Navi plugin installation conflict${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: selectorConflictRepair(status) };
    case "uninspectable": return { id: "plugin", status: "fail", summary: `Navi plugin installation could not be inspected${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: "Repair codex plugin list, then rerun navi doctor." };
    case "missing": return { id: "plugin", status: "fail", summary: "Navi plugin is missing or disabled.", repair: SOURCE_REPAIR };
  }
}

function hasInspectableAuthoritativeCurrent(
  status: NaviInstallationStatus,
  sourcePath: string | undefined,
): sourcePath is string {
  return status.current?.selector === "navi@navi-source"
    && status.current.installed
    && status.current.enabled
    && sourcePath !== undefined;
}

async function buildManifestCheck(status: NaviInstallationStatus, sourcePath: string | undefined): Promise<DoctorCheck> {
  if (!hasInspectableAuthoritativeCurrent(status, sourcePath)) {
    return { id: "manifest", status: "warn", summary: "Navi plugin source is unavailable; manifest inspection is incomplete." };
  }
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(sourcePath, ".codex-plugin", "plugin.json"), "utf8")) as { interface?: { defaultPrompt?: unknown } };
    const prompts = manifest.interface?.defaultPrompt;
    if (Array.isArray(prompts) && prompts.length <= 3) return { id: "manifest", status: "pass", summary: "Installed Navi plugin manifest defaultPrompt contains at most 3 entries." };
    return { id: "manifest", status: "fail", summary: "Installed Navi plugin manifest defaultPrompt must contain at most 3 entries.", repair: "Repair the Current Navi plugin manifest, then rerun navi doctor." };
  } catch { return { id: "manifest", status: "warn", summary: "Navi plugin source is unavailable; manifest inspection is incomplete." }; }
}

function checkById(reportChecks: DoctorCheck[], id: DoctorCheck["id"]): DoctorCheck {
  const check = reportChecks.find((candidate) => candidate.id === id);
  if (!check) throw new Error(`Navi doctor internal error: missing ${id} check.`);
  return check;
}

function deriveMigrationStage(
  installation: NaviInstallationStatus,
  checks: DoctorCheck[],
): NaviMigrationStage {
  const manifest = checkById(checks, "manifest");
  const bootstrap = checkById(checks, "global-bootstrap");

  if (installation.kind === "legacy") return "legacy-only";
  if (installation.kind === "conflict") {
    const verifiedTransition = installation.conflictReason === "dual-generation"
      && installation.current?.selector === "navi@navi-source"
      && installation.current.installed
      && installation.current.enabled
      && manifest.status === "pass";
    return verifiedTransition ? "transition-dual" : "dual-invalid";
  }
  if (installation.kind !== "current" || manifest.status !== "pass") {
    return "current-unusable";
  }
  return bootstrap.status === "pass"
    ? "current-active"
    : "current-only-bootstrap-missing";
}

function deriveNextAction(
  stage: NaviMigrationStage,
  installation: NaviInstallationStatus,
  checks: DoctorCheck[],
): string | undefined {
  const transaction = checkById(checks, "transaction");
  if (transaction.status === "fail") return transaction.repair ?? transaction.summary;

  const cli = checkById(checks, "cli");
  if (cli.status === "fail") return cli.repair ?? cli.summary;

  const bootstrap = checkById(checks, "global-bootstrap");
  if (bootstrap.status === "fail" && /unsafe/i.test(bootstrap.summary)) {
    return bootstrap.repair ?? bootstrap.summary;
  }

  switch (stage) {
    case "legacy-only": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyInstallAction(selector)
        : "Repair codex plugin list so the exact legacy selector can be identified, then rerun navi doctor.";
    }
    case "transition-dual": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyRemovalAction(selector)
        : "Keep both installations unchanged and repair codex plugin list so the exact legacy selector can be identified.";
    }
    case "dual-invalid": {
      const repair = checkById(checks, "plugin").repair ?? CURRENT_SOURCE_REPAIR;
      return installation.legacy
        ? `Keep the exact legacy selector ${installation.legacy.selector} installed. ${repair}`
        : repair;
    }
    case "current-unusable": {
      const plugin = checkById(checks, "plugin");
      const manifest = checkById(checks, "manifest");
      if (installation.kind !== "current") return plugin.repair ?? SOURCE_REPAIR;
      return manifest.repair ?? CURRENT_ONLY_SOURCE_REPAIR;
    }
    case "current-only-bootstrap-missing":
      return bootstrap.repair ?? GLOBAL_REPAIR;
    case "current-active":
      return checkById(checks, "project-init").repair;
  }
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
export async function inspectProjectInitialization(projectDir: string): Promise<ProjectInitializationState> {
  const [trigger, map] = await Promise.all([
    inspectProjectTrigger(projectDir),
    inspectProjectMapFile(projectDir),
  ]);
  const lifecycle = map.kind === "valid" ? map.document.projectStatus : undefined;

  if (map.kind === "invalid" || map.kind === "unsupported" || map.kind === "unsafe") {
    return { kind: "map-invalid", trigger, map };
  }
  if (trigger.kind === "invalid" || trigger.kind === "unsafe") {
    return { kind: "trigger-invalid", trigger, map, ...(lifecycle ? { lifecycle } : {}) };
  }
  if (map.kind === "missing") {
    return trigger.kind === "missing"
      ? { kind: "not-initialized", trigger, map }
      : { kind: "trigger-orphaned", trigger, map };
  }
  if (trigger.kind === "missing") return { kind: "map-ready", trigger, map, lifecycle };
  if (trigger.kind === "legacy") return { kind: "trigger-invalid", trigger, map, lifecycle };
  return { kind: "healthy", trigger, map, lifecycle };
}

async function buildProjectInitCheck(projectDir: string): Promise<DoctorCheck> {
  const state = await inspectProjectInitialization(projectDir);
  switch (state.kind) {
    case "not-initialized":
      return {
        id: "project-init",
        status: "warn",
        summary: "This project has neither a confirmed Project Map nor a Navi project trigger.",
        repair: "Use Navi in the current Codex project session to form and confirm a Project Map candidate, then review the exact navi init --map-file preview before approving its fingerprinted write.",
      };
    case "map-ready":
      return {
        id: "project-init",
        status: "warn",
        summary: "This project has a valid confirmed Project Map but its Navi project trigger is missing.",
        repair: "Run navi init to preview the exact trigger activation, then use its fingerprint with navi init --expect-plan <fingerprint> --write after approval.",
      };
    case "trigger-orphaned":
      return {
        id: "project-init",
        status: "fail",
        summary: `This project has a recognized ${state.trigger.kind} Navi trigger but no confirmed Project Map.`,
        repair: "Use Navi in the current Codex project session to form and confirm a Project Map candidate, then review the exact navi init --map-file preview before approving its fingerprinted write.",
      };
    case "map-invalid": {
      const diagnostic = "diagnostic" in state.map
        ? state.map.diagnostic
        : "Project Map inspection returned an inconsistent state.";
      const repair = state.map.kind === "invalid" && state.map.recognizedVersion === 1
        ? "Use Navi to form a corrected confirmed Project Map candidate, then run navi init --map-file <candidate> to review the exact repair preview before approving its fingerprinted write."
        : `Preserve the existing Project Map evidence and resolve the reported path or format manually; no automatic overwrite is safe. ${diagnostic}`;
      return {
        id: "project-init",
        status: "fail",
        summary: `This project's Project Map is not valid for initialization: ${diagnostic}`,
        repair,
      };
    }
    case "trigger-invalid":
      if (state.trigger.kind === "legacy") {
        return {
          id: "project-init",
          status: "fail",
          summary: "This project has a valid confirmed Project Map but a recognized legacy Navi trigger.",
          repair: "Run navi init to review the exact project trigger upgrade preview, then use its fingerprint with navi init --expect-plan <fingerprint> --write after approval.",
        };
      }
      const diagnostic = "diagnostic" in state.trigger
        ? state.trigger.diagnostic
        : "Project trigger inspection returned an inconsistent state.";
      return {
        id: "project-init",
        status: "fail",
        summary: `This project's Navi trigger is invalid or unsafe: ${diagnostic}`,
        repair: "Preserve project-owned AGENTS.md instructions and manually resolve only the damaged or unsafe Navi trigger before previewing activation again with navi init.",
      };
    case "healthy":
      return {
        id: "project-init",
        status: "pass",
        summary: `Navi project initialization is healthy (${state.lifecycle} lifecycle).`,
      };
  }
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
