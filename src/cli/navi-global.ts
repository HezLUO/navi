import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import {
  assertUnlinkedArtifact,
  confinedCodexPath,
  resolveCanonicalCodexHome,
} from "./navi-codex-home";
import {
  defaultRunCommand,
  inspectNaviInstallation,
  type NaviInstallationStatus,
  type RunCommand,
} from "./navi-installation";
import {
  applyAgentsTransaction,
  inspectTransaction,
  recoverTransaction,
  type TransactionInspection,
} from "./navi-transaction";
import {
  renderNaviCommand,
  TRUSTED_BARE_NAVI_INVOCATION,
  type NaviInvocationContext,
} from "./navi-invocation";

export type { RunCommand } from "./navi-installation";

export const NAVI_GLOBAL_BLOCK_START = "<!-- NAVI:GLOBAL-BOOTSTRAP:START -->";
export const NAVI_GLOBAL_BLOCK_END = "<!-- NAVI:GLOBAL-BOOTSTRAP:END -->";

export type GlobalSetupOperation = "install" | "remove";
export type GlobalAgentsActionKind = "create" | "modify" | "remove" | "skip" | "conflict";

export interface GlobalAgentsAction {
  kind: GlobalAgentsActionKind;
  summary: string;
  content?: string;
  previousContent?: string;
}

/** @deprecated Use NaviInstallationStatus and inspectNaviInstallation instead. */
export interface NaviPluginStatus {
  installed: boolean;
  enabled: boolean;
  version?: string;
  sourcePath?: string;
  raw: string;
}

export interface GlobalSetupOptions {
  codexHome?: string;
  write?: boolean;
  remove?: boolean;
}

export interface GlobalSetupPlan {
  mode: "dry-run" | "write";
  operation: GlobalSetupOperation;
  requestedCodexHome: string;
  codexHome: string;
  agentsPath: string;
  plugin: NaviInstallationStatus;
  transaction: TransactionInspection;
  action: GlobalAgentsAction;
}

export interface NaviSetupIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface NaviSetupDependencies {
  codexHome?: string;
  inspectInstallation?: () => Promise<NaviInstallationStatus>;
  runCommand?: RunCommand;
}

const NO_VERIFIED_INVOCATION = "No verified Navi CLI invocation is available; rerun setup from the checked-out Navi source package.";

function setupBlockReason(
  plan: GlobalSetupPlan,
  invocation: NaviInvocationContext = TRUSTED_BARE_NAVI_INVOCATION,
): string | undefined {
  if (plan.transaction.kind === "recoverable-restore" || plan.transaction.kind === "recoverable-cleanup") {
    return undefined;
  }

  if (plan.transaction.kind === "live-lock") {
    return "Another Navi setup transaction is active; wait for it to finish and retry.";
  }

  if (plan.transaction.kind === "conflict") {
    return `Resolve the Navi setup transaction manually, then retry. ${plan.transaction.diagnostic}`;
  }

  if (plan.action.kind === "conflict") {
    const setupCommand = renderNaviCommand(invocation, ["setup"]);
    return setupCommand
      ? `${plan.action.summary} Repair the Navi-managed AGENTS.md block manually, then rerun ${setupCommand}.`
      : `${plan.action.summary} Repair the Navi-managed AGENTS.md block manually before retrying setup.`;
  }

  const setupCommand = renderNaviCommand(invocation, ["setup"]);
  if (!setupCommand) {
    return NO_VERIFIED_INVOCATION;
  }

  if (plan.operation === "install" && plan.action.kind !== "skip" && (
    plan.plugin.kind !== "current" ||
    !plan.plugin.current?.installed ||
    !plan.plugin.current.enabled
  )) {
    return pluginRepairText(plan.plugin, setupCommand);
  }

  return undefined;
}

/** @deprecated Compatibility adapter for doctor callers pending its Task 7 migration. */
export async function inspectInstalledNaviPlugin(
  runCommand: RunCommand = defaultRunCommand,
): Promise<NaviPluginStatus> {
  const status = await inspectNaviInstallation(runCommand);
  const row = status.current;
  return {
    installed: row?.installed ?? false,
    enabled: row?.enabled ?? false,
    ...(row?.version ? { version: row.version } : {}),
    ...(row?.sourcePath ? { sourcePath: row.sourcePath } : {}),
    raw: status.raw,
  };
}

function pluginAvailability(status: NaviInstallationStatus): string {
  switch (status.kind) {
    case "current":
      return "installed and enabled";
    case "legacy":
      return `legacy-only (${status.legacy?.selector ?? "along-working-thread"})`;
    case "conflict":
      return status.legacy
        ? "conflicted by both Navi and legacy installations"
        : `conflicted: ${status.diagnostic ?? "Navi plugin selectors conflict"}`;
    case "uninspectable":
      return "uninspectable";
    case "missing":
      return status.current ? "installed but disabled" : "missing";
  }
}

function pluginRepairText(status: NaviInstallationStatus, setupCommand: string): string {
  switch (status.kind) {
    case "legacy":
      return `Navi setup requires navi@navi-source; migrate the legacy plugin ${status.legacy?.selector ?? "along-working-thread"} first.`;
    case "conflict":
      if (status.legacy) {
        return "Navi setup is blocked because both Navi and the legacy plugin are installed; remove the legacy plugin first.";
      }
      if (status.diagnostic?.includes("non-authoritative selector")) {
        return `Remove the non-authoritative Navi selector ${status.current?.selector ?? "reported by codex plugin list"}, then install and enable navi@navi-source before rerunning ${setupCommand}.`;
      }
      if (status.diagnostic?.includes("more than once")) {
        return `Remove duplicate navi@navi-source entries so exactly one installed and enabled current selector remains, then rerun ${setupCommand}.`;
      }
      return `Resolve the reported Navi plugin selector conflict, then rerun ${setupCommand}.`;
    case "uninspectable":
      return "Navi setup could not inspect codex plugins; repair codex plugin list and retry.";
    case "missing":
      return status.current
        ? "Navi setup requires navi@navi-source to be installed and enabled; enable the current plugin first."
        : "Navi setup requires navi@navi-source to be installed and enabled.";
    case "current":
      return "Navi setup requires navi@navi-source to be installed and enabled.";
  }
}

export function renderGlobalBootstrapBlock(): string {
  return `${NAVI_GLOBAL_BLOCK_START}
Navi global bootstrap only:
- keep narrow factual and bounded execution requests quiet.
- For broad progress, next-step, stop, wait, continue, confusion, or plan-reliability questions, check whether the active project has project-local Navi guidance.
- If project-local Navi guidance is missing, avoid a confident stable map. Give at most one short provisional judgment, identify the likely project root, and ask whether to initialize that project with Navi.
- Do not draw a full Progress Map or Rhythm Map from the global bootstrap.
- Do not write files or run navi init automatically; do not repeat the reminder in the same session after the user declines.
- When project-local Navi guidance exists, let that guidance and the installed Navi skill own full supervision behavior.
${NAVI_GLOBAL_BLOCK_END}`;
}

const KNOWN_GLOBAL_BOOTSTRAP_BLOCKS = [renderGlobalBootstrapBlock()];

function markerOffsets(text: string): { starts: number[]; ends: number[] } {
  const starts: number[] = [];
  const ends: number[] = [];
  let index = 0;

  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_START, index)) !== -1) {
    starts.push(index);
    index += NAVI_GLOBAL_BLOCK_START.length;
  }

  index = 0;
  while ((index = text.indexOf(NAVI_GLOBAL_BLOCK_END, index)) !== -1) {
    ends.push(index);
    index += NAVI_GLOBAL_BLOCK_END.length;
  }

  return { starts, ends };
}

export function planGlobalAgentsContent(
  existing: string | undefined,
  operation: GlobalSetupOperation,
): GlobalAgentsAction {
  const text = existing ?? "";
  const { starts, ends } = markerOffsets(text);

  if (starts.length === 0 && ends.length === 0) {
    if (operation === "remove") {
      return { kind: "skip", summary: "No Navi global bootstrap block is installed." };
    }

    const content = text.length === 0
      ? renderGlobalBootstrapBlock()
      : `${text}${text.endsWith("\n") ? "" : "\n"}${renderGlobalBootstrapBlock()}`;

    return existing === undefined
      ? { kind: "create", summary: "Create global instructions with the Navi bootstrap block.", content }
      : {
          kind: "modify",
          summary: "Append the Navi bootstrap block to global instructions.",
          content,
          previousContent: existing,
        };
  }

  if (starts.length !== 1 || ends.length !== 1 || starts[0] > ends[0]) {
    return { kind: "conflict", summary: "Navi global bootstrap markers are unsafe or incomplete." };
  }

  const start = starts[0];
  const end = ends[0] + NAVI_GLOBAL_BLOCK_END.length;
  const managedBlock = text.slice(start, end);

  if (!KNOWN_GLOBAL_BOOTSTRAP_BLOCKS.includes(managedBlock)) {
    return { kind: "conflict", summary: "Navi global bootstrap content was modified or is unrecognized." };
  }

  if (operation === "remove") {
    return {
      kind: "remove",
      summary: "Remove the Navi bootstrap block from global instructions.",
      content: `${text.slice(0, start)}${text.slice(end)}`,
      previousContent: existing,
    };
  }

  if (managedBlock === renderGlobalBootstrapBlock()) {
    return { kind: "skip", summary: "The current Navi global bootstrap block is already installed." };
  }

  return {
    kind: "modify",
    summary: "Upgrade the known Navi global bootstrap block.",
    content: `${text.slice(0, start)}${renderGlobalBootstrapBlock()}${text.slice(end)}`,
    previousContent: existing,
  };
}

async function readAgentsContent(agentsPath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(agentsPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export async function buildGlobalSetupPlan(
  options: GlobalSetupOptions,
  dependencies: NaviSetupDependencies = {},
): Promise<GlobalSetupPlan> {
  const requestedCodexHome = path.resolve(
    options.codexHome ?? dependencies.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"),
  );
  const { canonicalPath: codexHome } = await resolveCanonicalCodexHome(requestedCodexHome);
  const agentsPath = confinedCodexPath(codexHome, "AGENTS.md");
  await assertUnlinkedArtifact(agentsPath);
  const [existing, plugin, transaction] = await Promise.all([
    readAgentsContent(agentsPath),
    dependencies.inspectInstallation
      ? dependencies.inspectInstallation()
      : inspectNaviInstallation(dependencies.runCommand),
    inspectTransaction(codexHome),
  ]);
  const operation: GlobalSetupOperation = options.remove ? "remove" : "install";
  return {
    mode: options.write ? "write" : "dry-run",
    operation,
    requestedCodexHome,
    codexHome,
    agentsPath,
    plugin,
    transaction,
    action: planGlobalAgentsContent(existing, operation),
  };
}

export async function applyGlobalSetupPlan(
  plan: GlobalSetupPlan,
  invocation: NaviInvocationContext = TRUSTED_BARE_NAVI_INVOCATION,
): Promise<"applied" | "recovered"> {
  if (plan.mode === "dry-run") return "applied";

  if (plan.transaction.kind === "recoverable-restore" || plan.transaction.kind === "recoverable-cleanup") {
    await recoverTransaction(plan.codexHome, plan.transaction);
    return "recovered";
  }
  if (plan.transaction.kind !== "none") throw new Error(`Navi setup is blocked by transaction state: ${plan.transaction.kind}.`);
  if (plan.action.kind === "skip") return "applied";
  const blocked = setupBlockReason(plan, invocation);
  if (blocked) throw new Error(blocked);

  const operation = plan.action.kind === "create"
    ? "create"
    : plan.action.kind === "remove" && (plan.action.content ?? "").length === 0
      ? "remove"
      : "modify";
  await applyAgentsTransaction({
    root: plan.codexHome,
    operation,
    expectedContent: plan.action.previousContent,
    ...(operation === "remove" ? {} : { desiredContent: plan.action.content ?? "" }),
  });
  return "applied";
}

export function renderGlobalSetupPlan(
  plan: GlobalSetupPlan,
  invocation: NaviInvocationContext = TRUSTED_BARE_NAVI_INVOCATION,
): string {
  const availability = pluginAvailability(plan.plugin);
  const apply = renderNaviCommand(
    invocation,
    plan.operation === "remove" ? ["setup", "--remove", "--write"] : ["setup", "--write"],
  );
  const recoveryCommand = renderNaviCommand(invocation, ["setup", "--write"]);
  const recovery = plan.transaction.kind === "recoverable-restore" || plan.transaction.kind === "recoverable-cleanup";
  const blocked = setupBlockReason(plan, invocation);
  return [
    `Navi setup configures global discovery at ${plan.agentsPath}; it does not initialize a project.`,
    ...(plan.requestedCodexHome === plan.codexHome
      ? []
      : [
          `Requested CODEX_HOME: ${plan.requestedCodexHome}`,
          `Canonical CODEX_HOME: ${plan.codexHome}`,
        ]),
    `Transaction state: ${plan.transaction.kind}.`,
    "No files were written.",
    ...(recovery
      ? [recoveryCommand
          ? `Next step: run ${recoveryCommand} to recover the prior Navi setup transaction only, then rerun the original setup request.`
          : NO_VERIFIED_INVOCATION]
      : [
          `Plugin preflight: Navi is ${availability}.`,
          `Planned action: ${plan.action.kind} — ${plan.action.summary}`,
          ...(blocked ? [`Setup is blocked: ${blocked}`] : [`Apply with: ${apply}`]),
        ]),
    ...(plan.operation === "remove" ? ["The plugin, CLI, and project-local files remain."] : []),
  ].join("\n");
}

const DEFAULT_SETUP_IO: NaviSetupIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

export async function runNaviSetupCli(
  args: string[],
  io: NaviSetupIo = DEFAULT_SETUP_IO,
  dependencies: NaviSetupDependencies = {},
  invocation: NaviInvocationContext = TRUSTED_BARE_NAVI_INVOCATION,
): Promise<number> {
  if (args.some((arg) => arg !== "--write" && arg !== "--remove") || args.filter((arg) => arg === "--write").length > 1 || args.filter((arg) => arg === "--remove").length > 1) {
    io.stderr("Usage: navi setup [--write] [--remove]\n");
    return 1;
  }
  const write = args.includes("--write");
  const remove = args.includes("--remove");
  try {
    const plan = await buildGlobalSetupPlan({ codexHome: dependencies.codexHome, write, remove }, dependencies);
    if (!write) {
      io.stdout(`${renderGlobalSetupPlan(plan, invocation)}\n`);
      return setupBlockReason(plan, invocation) ? 1 : 0;
    }
    const result = await applyGlobalSetupPlan(plan, invocation);
    if (result === "recovered") {
      const rerunCommand = renderNaviCommand(invocation, ["setup"]);
      io.stdout(rerunCommand
        ? `Recovered the prior Navi setup transaction. Rerun with: ${rerunCommand}.\n`
        : `Recovered the prior Navi setup transaction. ${NO_VERIFIED_INVOCATION}\n`);
      return 0;
    }
    io.stdout(`${plan.action.summary}\n`);
    if (remove) io.stdout("The plugin, CLI, and project-local files remain.\n");
    return 0;
  } catch (error) {
    io.stderr(`${(error as Error).message}\n`);
    return 1;
  }
}
