import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertUnlinkedArtifact, resolveCanonicalCodexHome } from "./navi-codex-home";
import { NAVI_GLOBAL_BLOCK_END, NAVI_GLOBAL_BLOCK_START, planGlobalAgentsContent } from "./navi-global";
import { inspectProjectTrigger, type ProjectTriggerState } from "./navi-project-trigger";
import { inspectNaviInstallation, type NaviInstallationStatus } from "./navi-installation";
import {
  renderNaviCommand,
  TRUSTED_BARE_NAVI_INVOCATION,
  type NaviInvocationContext,
} from "./navi-invocation";
import { inspectProjectMapFile, type ProjectMapFileState } from "./navi-project-map";
import { inspectTransaction } from "./navi-transaction";

export type DoctorCheckStatus = "pass" | "warn" | "fail";
export interface DoctorCheck {
  id: "cli" | "plugin" | "manifest" | "global-bootstrap" | "package-cache" | "project-init" | "transaction";
  status: DoctorCheckStatus;
  summary: string;
  repair?: string;
  details?: string[];
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
  invocation?: NaviInvocationContext;
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
const OPTIONAL_PATH_NOTE = "Optional: add the linked Navi bin directory to the PATH inherited by Codex and restart Codex before expecting bare `navi` to work.";

function sourceRepair(invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `Install and enable navi@navi-source, then rerun ${doctor}.`
    : "Install and enable navi@navi-source after establishing a verified Navi CLI entrypoint.";
}

function currentSourceRepair(invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `Keep the legacy plugin installed. Repair or remove the incomplete Current Navi installation, then rerun ${doctor} before removing legacy.`
    : "Keep the legacy plugin installed. Repair or remove the incomplete Current Navi installation, then establish a verified Navi CLI entrypoint before removing legacy.";
}

function currentOnlySourceRepair(invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `Repair the installed Current Navi source path or manifest, then rerun ${doctor}.`
    : "Repair the installed Current Navi source path or manifest after establishing a verified Navi CLI entrypoint.";
}

function globalRepair(invocation: NaviInvocationContext): string {
  const setup = renderNaviCommand(invocation, ["setup"]);
  const setupWrite = renderNaviCommand(invocation, ["setup", "--write"]);
  return setup && setupWrite
    ? `Run ${setup}, review the preview, then run ${setupWrite}.`
    : "Establish a verified Navi CLI entrypoint before previewing and applying global setup.";
}

function legacyInstallAction(legacySelector: string, invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `Install and enable navi@navi-source, then rerun ${doctor}. Keep the exact legacy selector ${legacySelector} installed during this verification step.`
    : `Install and enable navi@navi-source after establishing a verified Navi CLI entrypoint. Keep the exact legacy selector ${legacySelector} installed during this verification step.`;
}

function legacyRemovalAction(legacySelector: string, invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `Run codex plugin remove ${legacySelector}, then rerun ${doctor}. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.`
    : `Run codex plugin remove ${legacySelector} only after establishing a verified Navi CLI entrypoint for the follow-up check. If removal fails, keep both installations unchanged and resolve that Codex plugin error before continuing.`;
}

function selectorConflictRepair(status: NaviInstallationStatus, invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  if (status.conflictReason === "ambiguous-legacy") {
    return doctor
      ? `Keep all legacy plugin installations unchanged. Resolve the ambiguous legacy plugin rows so exactly one identified legacy selector remains, then rerun ${doctor}.`
      : "Keep all legacy plugin installations unchanged. Resolve the ambiguous legacy plugin rows after establishing a verified Navi CLI entrypoint.";
  }
  if (status.conflictReason === "non-authoritative-current") {
    const selector = status.current?.selector;
    return selector
      ? doctor
        ? `Remove the non-authoritative Navi selector ${selector}, then install and enable navi@navi-source before rerunning ${doctor}.`
        : `Remove the non-authoritative Navi selector ${selector}, then install and enable navi@navi-source after establishing a verified Navi CLI entrypoint.`
      : "Keep the legacy installation unchanged and repair codex plugin list so the non-authoritative Current Navi selector can be identified.";
  }
  if (status.conflictReason === "duplicate-current") {
    return doctor
      ? `Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains, then rerun ${doctor}.`
      : "Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains after establishing a verified Navi CLI entrypoint.";
  }
  return doctor
    ? `Resolve the reported Current Navi plugin selector conflict, then rerun ${doctor}.`
    : "Resolve the reported Current Navi plugin selector conflict after establishing a verified Navi CLI entrypoint.";
}

export async function buildNaviDoctorReport(options: NaviDoctorOptions = {}, dependencies: NaviDoctorDependencies = {}): Promise<NaviDoctorReport> {
  const requestedCodexHome = path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"));
  const canonical = await resolveCanonicalCodexHome(requestedCodexHome);
  const cliRoot = path.resolve(options.cliRoot ?? DEFAULT_CLI_ROOT);
  const projectDir = path.resolve(options.projectDir ?? process.cwd());
  const invocation = dependencies.invocation ?? TRUSTED_BARE_NAVI_INVOCATION;
  const installation = await (dependencies.inspectInstallation ?? inspectNaviInstallation)();
  const sourcePath = installation.current?.sourcePath ? path.resolve(installation.current.sourcePath) : undefined;
  const checks = [
    await buildCliCheck(cliRoot, invocation),
    buildPluginCheck(installation, invocation),
    await buildManifestCheck(installation, sourcePath, invocation),
    await buildGlobalBootstrapCheck(canonical.canonicalPath, invocation),
    await buildPackageCacheCheck(sourcePath),
    await buildProjectInitCheck(projectDir, invocation),
    await buildTransactionCheck(canonical.canonicalPath, invocation),
  ];
  const migrationStage = deriveMigrationStage(installation, checks);
  const nextAction = deriveNextAction(migrationStage, installation, checks, invocation);

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
    ...report.checks.flatMap((check) => [
      `[${check.status}] ${check.id}: ${check.summary}`,
      ...(check.details ?? []),
    ]),
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

async function buildCliCheck(cliRoot: string, invocation: NaviInvocationContext): Promise<DoctorCheck> {
  if (!await isDirectory(cliRoot)) {
    return { id: "cli", status: "fail", summary: "Navi CLI root is unavailable.", repair: "Run navi from a checked-out Navi source package." };
  }
  switch (invocation.reachability) {
    case "pass":
      return { id: "cli", status: "pass", summary: "Navi CLI is reachable as `navi`." };
    case "fallback": {
      const fallback = renderNaviCommand(invocation, []);
      const knownLinkedBin = invocation.pathBin !== undefined
        && invocation.commandPrefix?.length === 1
        && path.isAbsolute(invocation.commandPrefix[0])
        && invocation.commandPrefix[0] !== invocation.entrypoint
        && path.basename(invocation.commandPrefix[0]) === "navi"
        && path.dirname(invocation.commandPrefix[0]) === invocation.pathBin;
      return {
        id: "cli",
        status: "warn",
        summary: invocation.reason === "path-mismatch"
          ? "The first `navi` on PATH does not belong to this Navi source; a verified fallback will be used."
          : "Bare `navi` is not reachable from the PATH inherited by Codex; a verified fallback will be used.",
        ...(fallback ? { details: [
          `Using verified fallback: ${fallback}`,
          ...(knownLinkedBin ? [OPTIONAL_PATH_NOTE] : []),
        ] } : {}),
      };
    }
    case "unavailable":
      return {
        id: "cli",
        status: "fail",
        summary: "No verified Navi CLI invocation is available.",
        repair: "Run Navi from the checked-out source package to establish a verified Navi CLI entrypoint.",
      };
  }
}
function buildPluginCheck(status: NaviInstallationStatus, invocation: NaviInvocationContext): DoctorCheck {
  switch (status.kind) {
    case "current": return { id: "plugin", status: "pass", summary: `Navi plugin is installed and enabled${status.current?.version ? ` (${status.current.version}).` : "."}` };
    case "legacy": return { id: "plugin", status: "fail", summary: `Only legacy plugin ${status.legacy?.selector ?? "unidentified"} is installed.`, repair: sourceRepair(invocation) };
    case "conflict": return status.conflictReason === "dual-generation"
      ? { id: "plugin", status: "fail", summary: `Navi and legacy plugin ${status.legacy?.selector ?? "unidentified"} are both installed.`, repair: currentSourceRepair(invocation) }
      : { id: "plugin", status: "fail", summary: `Navi plugin installation conflict${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: selectorConflictRepair(status, invocation) };
    case "uninspectable": return { id: "plugin", status: "fail", summary: `Navi plugin installation could not be inspected${status.diagnostic ? `: ${status.diagnostic}` : "."}`, repair: pluginListRepair("Repair codex plugin list", invocation) };
    case "missing": return { id: "plugin", status: "fail", summary: "Navi plugin is missing or disabled.", repair: sourceRepair(invocation) };
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

async function buildManifestCheck(status: NaviInstallationStatus, sourcePath: string | undefined, invocation: NaviInvocationContext): Promise<DoctorCheck> {
  if (!hasInspectableAuthoritativeCurrent(status, sourcePath)) {
    return { id: "manifest", status: "warn", summary: "Navi plugin source is unavailable; manifest inspection is incomplete." };
  }
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(sourcePath, ".codex-plugin", "plugin.json"), "utf8")) as { interface?: { defaultPrompt?: unknown } };
    const prompts = manifest.interface?.defaultPrompt;
    if (Array.isArray(prompts) && prompts.length <= 3) return { id: "manifest", status: "pass", summary: "Installed Navi plugin manifest defaultPrompt contains at most 3 entries." };
    const doctor = renderNaviCommand(invocation, ["doctor"]);
    return { id: "manifest", status: "fail", summary: "Installed Navi plugin manifest defaultPrompt must contain at most 3 entries.", repair: doctor ? `Repair the Current Navi plugin manifest, then rerun ${doctor}.` : "Repair the Current Navi plugin manifest after establishing a verified Navi CLI entrypoint." };
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
  invocation: NaviInvocationContext,
): string | undefined {
  const transaction = checkById(checks, "transaction");
  if (transaction.status === "fail") return transaction.repair ?? transaction.summary;

  const bootstrap = checkById(checks, "global-bootstrap");
  if (bootstrap.status === "fail" && /unsafe/i.test(bootstrap.summary)) {
    return bootstrap.repair ?? bootstrap.summary;
  }

  const cli = checkById(checks, "cli");
  if (cli.status === "fail") return cli.repair ?? cli.summary;

  switch (stage) {
    case "legacy-only": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyInstallAction(selector, invocation)
        : pluginListRepair("Repair codex plugin list so the exact legacy selector can be identified", invocation);
    }
    case "transition-dual": {
      const selector = installation.legacy?.selector;
      return selector
        ? legacyRemovalAction(selector, invocation)
        : "Keep both installations unchanged and repair codex plugin list so the exact legacy selector can be identified.";
    }
    case "dual-invalid": {
      const repair = checkById(checks, "plugin").repair ?? currentSourceRepair(invocation);
      return installation.legacy
        ? `Keep the exact legacy selector ${installation.legacy.selector} installed. ${repair}`
        : repair;
    }
    case "current-unusable": {
      const plugin = checkById(checks, "plugin");
      const manifest = checkById(checks, "manifest");
      if (installation.kind !== "current") return plugin.repair ?? sourceRepair(invocation);
      return manifest.repair ?? currentOnlySourceRepair(invocation);
    }
    case "current-only-bootstrap-missing":
      return bootstrap.repair ?? globalRepair(invocation);
    case "current-active":
      return checkById(checks, "project-init").repair;
  }
}
function pluginListRepair(prefix: string, invocation: NaviInvocationContext): string {
  const doctor = renderNaviCommand(invocation, ["doctor"]);
  return doctor
    ? `${prefix}, then rerun ${doctor}.`
    : `${prefix} after establishing a verified Navi CLI entrypoint.`;
}

async function buildGlobalBootstrapCheck(codexHome: string, invocation: NaviInvocationContext): Promise<DoctorCheck> {
  const target = path.join(codexHome, "AGENTS.md");
  try {
    await assertUnlinkedArtifact(target);
  } catch {
    const setup = renderNaviCommand(invocation, ["setup"]);
    return {
      id: "global-bootstrap",
      status: "fail",
      summary: "Global AGENTS.md is unsafe to inspect.",
      repair: setup
        ? `Replace the AGENTS.md symlink with a regular file before running ${setup}.`
        : "Replace the AGENTS.md symlink with a regular file before retrying global setup from a verified Navi CLI entrypoint.",
    };
  }
  const content = await readOptional(target);
  if (content !== undefined && planGlobalAgentsContent(content, "install").kind === "skip") return { id: "global-bootstrap", status: "pass", summary: "Navi global bootstrap is installed." };
  const markers = content?.includes(NAVI_GLOBAL_BLOCK_START) || content?.includes(NAVI_GLOBAL_BLOCK_END);
  return { id: "global-bootstrap", status: "fail", summary: markers ? "Navi global bootstrap markers are damaged or unrecognized." : "Navi global bootstrap is not installed.", repair: globalRepair(invocation) };
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

async function buildProjectInitCheck(projectDir: string, invocation: NaviInvocationContext): Promise<DoctorCheck> {
  const state = await inspectProjectInitialization(projectDir);
  const init = renderNaviCommand(invocation, ["init"]);
  const initWithFingerprint = renderNaviCommand(invocation, [
    "init", "--expect-plan", "<fingerprint>", "--write",
  ]);
  const initWithCandidate = renderNaviCommand(invocation, [
    "init", "--map-file", "<candidate>",
  ]);
  const candidatePreview = initWithCandidate
    ? `Use Navi in the current Codex project session to form and confirm a Project Map candidate, then review the exact ${initWithCandidate} preview before approving its fingerprinted write.`
    : "Use Navi in the current Codex project session to form and confirm a Project Map candidate after establishing a verified Navi CLI entrypoint; then review the exact candidate preview before approving its fingerprinted write.";
  switch (state.kind) {
    case "not-initialized":
      return {
        id: "project-init",
        status: "warn",
        summary: "This project has neither a confirmed Project Map nor a Navi project trigger.",
        repair: candidatePreview,
      };
    case "map-ready":
      return {
        id: "project-init",
        status: "warn",
        summary: "This project has a valid confirmed Project Map but its Navi project trigger is missing.",
        repair: init && initWithFingerprint
          ? `Run ${init} to preview the exact trigger activation, then use its fingerprint with ${initWithFingerprint} after approval.`
          : "Establish a verified Navi CLI entrypoint before previewing and approving the fingerprint-bound trigger activation.",
      };
    case "trigger-orphaned":
      return {
        id: "project-init",
        status: "fail",
        summary: `This project has a recognized ${state.trigger.kind} Navi trigger but no confirmed Project Map.`,
        repair: candidatePreview,
      };
    case "map-invalid": {
      const diagnostic = "diagnostic" in state.map
        ? state.map.diagnostic
        : "Project Map inspection returned an inconsistent state.";
      const repair = state.map.kind === "invalid" && state.map.recognizedVersion === 1
        ? initWithCandidate
          ? `Use Navi to form a corrected confirmed Project Map candidate, then run ${initWithCandidate} to review the exact repair preview before approving its fingerprinted write.`
          : "Use Navi to form a corrected confirmed Project Map candidate after establishing a verified Navi CLI entrypoint, then review the exact repair preview before approving its fingerprinted write."
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
          repair: init && initWithFingerprint
            ? `Run ${init} to review the exact project trigger upgrade preview, then use its fingerprint with ${initWithFingerprint} after approval.`
            : "Establish a verified Navi CLI entrypoint before previewing and approving the fingerprint-bound project trigger upgrade.",
        };
      }
      const diagnostic = "diagnostic" in state.trigger
        ? state.trigger.diagnostic
        : "Project trigger inspection returned an inconsistent state.";
      return {
        id: "project-init",
        status: "fail",
        summary: `This project's Navi trigger is invalid or unsafe: ${diagnostic}`,
        repair: init
          ? `Preserve project-owned AGENTS.md instructions and manually resolve only the damaged or unsafe Navi trigger before previewing activation again with ${init}.`
          : "Preserve project-owned AGENTS.md instructions and manually resolve only the damaged or unsafe Navi trigger before previewing activation again from a verified Navi CLI entrypoint.",
      };
    case "healthy":
      return {
        id: "project-init",
        status: "pass",
        summary: `Navi project initialization is healthy (${state.lifecycle} lifecycle).`,
      };
  }
}
async function buildTransactionCheck(codexHome: string, invocation: NaviInvocationContext): Promise<DoctorCheck> {
  const transaction = await inspectTransaction(codexHome);
  switch (transaction.kind) {
    case "none": return { id: "transaction", status: "pass", summary: "No pending Navi setup transaction." };
    case "recoverable-cleanup": case "recoverable-restore": {
      const setup = renderNaviCommand(invocation, ["setup"]);
      const setupWrite = renderNaviCommand(invocation, ["setup", "--write"]);
      return {
        id: "transaction",
        status: "fail",
        summary: "A recoverable Navi setup transaction needs recovery.",
        repair: setup && setupWrite
          ? `Run ${setupWrite} to recover, then rerun ${setup}.`
          : "Establish a verified Navi CLI entrypoint, then use setup write mode to recover the pending transaction before rerunning setup.",
      };
    }
    case "live-lock": return { id: "transaction", status: "fail", summary: "A Navi setup transaction is currently active." };
    case "conflict": return { id: "transaction", status: "fail", summary: `Navi setup transaction requires manual resolution: ${transaction.diagnostic}` };
  }
}
async function readOptional(filePath: string): Promise<string | undefined> { try { return await fs.readFile(filePath, "utf8"); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; } }
async function isDirectory(directory: string): Promise<boolean> { try { return (await fs.lstat(directory)).isDirectory(); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; } }
