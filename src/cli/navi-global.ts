import { execFile as execFileCallback } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

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

export interface NaviPluginStatus {
  installed: boolean;
  enabled: boolean;
  version?: string;
  sourcePath?: string;
  raw: string;
}

export type RunCommand = (
  command: string,
  args: string[],
) => Promise<{ code: number; stdout: string; stderr: string }>;

export interface GlobalSetupOptions {
  codexHome?: string;
  write?: boolean;
  remove?: boolean;
}

export interface GlobalSetupPlan {
  mode: "dry-run" | "write";
  operation: GlobalSetupOperation;
  codexHome: string;
  agentsPath: string;
  plugin: NaviPluginStatus;
  action: GlobalAgentsAction;
}

export interface NaviSetupIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export interface NaviSetupDependencies {
  codexHome?: string;
  inspectPlugin?: () => Promise<NaviPluginStatus>;
  runCommand?: RunCommand;
  rename?: (oldPath: string, newPath: string) => Promise<void>;
}

const execFile = promisify(execFileCallback);

const unavailablePlugin = (raw: string): NaviPluginStatus => ({
  installed: false,
  enabled: false,
  raw,
});

const defaultRunCommand: RunCommand = async (command, args) => {
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

export async function inspectInstalledNaviPlugin(
  runCommand: RunCommand = defaultRunCommand,
): Promise<NaviPluginStatus> {
  const result = await runCommand("codex", ["plugin", "list"]);
  if (result.code !== 0) return unavailablePlugin(result.stderr || result.stdout);

  const row = result.stdout.split(/\r?\n/).find((line) =>
    line.trimStart().startsWith("along-working-thread@"),
  );
  if (!row) return unavailablePlugin(result.stderr);

  const columns = row.trim().split(/\s{2,}/);
  const state = columns[1] ?? "";
  const version = columns.find((column) => /^v?\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(column));
  const sourcePath = columns.find((column) => column.startsWith("/") || column.startsWith("~"));
  return {
    installed: /installed/i.test(state),
    enabled: /enabled/i.test(state),
    ...(version ? { version } : {}),
    ...(sourcePath ? { sourcePath } : {}),
    raw: row,
  };
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
  const codexHome = path.resolve(
    options.codexHome ?? dependencies.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex"),
  );
  try {
    const stats = await fs.stat(codexHome);
    if (!stats.isDirectory()) throw new Error(`CODEX_HOME is not a directory: ${codexHome}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const agentsPath = path.join(codexHome, "AGENTS.md");
  const [existing, plugin] = await Promise.all([
    readAgentsContent(agentsPath),
    dependencies.inspectPlugin
      ? dependencies.inspectPlugin()
      : inspectInstalledNaviPlugin(dependencies.runCommand),
  ]);
  const operation: GlobalSetupOperation = options.remove ? "remove" : "install";
  return {
    mode: options.write ? "write" : "dry-run",
    operation,
    codexHome,
    agentsPath,
    plugin,
    action: planGlobalAgentsContent(existing, operation),
  };
}

async function assertNoSymlink(filePath: string, rootPath = filePath): Promise<void> {
  const resolved = path.resolve(filePath);
  const root = path.resolve(rootPath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Invalid setup path: ${resolved}`);
  const segments = relative.split(path.sep).filter(Boolean);
  let current = root;
  try {
    if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Refusing symlinked setup path: ${current}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      if ((await fs.lstat(current)).isSymbolicLink()) {
        throw new Error(`Refusing symlinked setup path: ${current}`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
  }
}

async function assertUnchanged(agentsPath: string, expected: string | undefined): Promise<void> {
  const current = await readAgentsContent(agentsPath);
  if (current !== expected) throw new Error("Global AGENTS.md changed after setup was planned.");
}

export async function applyGlobalSetupPlan(
  plan: GlobalSetupPlan,
  dependencies: Pick<NaviSetupDependencies, "rename"> = {},
): Promise<void> {
  if (plan.mode === "dry-run" || plan.action.kind === "skip") return;
  if (plan.action.kind === "conflict") throw new Error(plan.action.summary);
  if (plan.operation === "install" && (!plan.plugin.installed || !plan.plugin.enabled)) {
    throw new Error("Navi setup requires the along-working-thread plugin to be installed and enabled.");
  }

  await assertUnchanged(plan.agentsPath, plan.action.previousContent);
  await assertNoSymlink(plan.codexHome);
  await assertNoSymlink(plan.agentsPath, plan.codexHome);
  const parent = path.dirname(plan.agentsPath);
  const parentStats = await fs.stat(parent);
  if (!parentStats.isDirectory()) throw new Error(`CODEX_HOME is not a directory: ${parent}`);

  const content = plan.action.content ?? "";
  if (plan.action.kind === "remove" && content.length === 0) {
    await assertUnchanged(plan.agentsPath, plan.action.previousContent);
    await fs.unlink(plan.agentsPath);
    return;
  }

  let tempPath: string | undefined;
  let renamed = false;
  try {
    tempPath = path.join(parent, `.AGENTS.md.navi-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    let mode = 0o600;
    try {
      mode = (await fs.stat(plan.agentsPath)).mode & 0o777;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const handle = await fs.open(tempPath, "wx", mode);
    try {
      await handle.writeFile(content, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await assertUnchanged(plan.agentsPath, plan.action.previousContent);
    await (dependencies.rename ?? fs.rename)(tempPath, plan.agentsPath);
    renamed = true;
  } finally {
    if (tempPath && !renamed) await fs.rm(tempPath, { force: true });
  }
}

export function renderGlobalSetupPlan(plan: GlobalSetupPlan): string {
  const availability = plan.plugin.installed && plan.plugin.enabled ? "installed and enabled" : "unavailable";
  const apply = plan.operation === "remove" ? "navi setup --remove --write" : "navi setup --write";
  return [
    `Navi setup configures global discovery at ${plan.agentsPath}; it does not initialize a project.`,
    `Plugin preflight: along-working-thread is ${availability}.`,
    `Planned action: ${plan.action.kind} — ${plan.action.summary}`,
    "No files were written.",
    `Apply with: ${apply}`,
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
      io.stdout(`${renderGlobalSetupPlan(plan)}\n`);
      return 0;
    }
    await applyGlobalSetupPlan(plan, dependencies);
    io.stdout(`${plan.action.summary}\n`);
    if (remove) io.stdout("The plugin, CLI, and project-local files remain.\n");
    return 0;
  } catch (error) {
    io.stderr(`${(error as Error).message}\n`);
    return 1;
  }
}
