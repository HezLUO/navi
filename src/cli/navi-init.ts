import path from "node:path";
import { applyInitPlan } from "./navi-init-apply";
import { buildInitPlan, type InitOptions, type InitPlan } from "./navi-init-plan";

export {
  applyInitPlan,
  type InitWriteDependencies,
} from "./navi-init-apply";
export {
  buildInitPlan,
  resolveTargetPath,
  VALIDATION_PROMPT,
  type InitAction,
  type InitActionKind,
  type InitOptions,
  type InitPlan,
  type InitPlanState,
} from "./navi-init-plan";
export {
  inspectProjectTrigger,
  NAVI_AGENTS_BLOCK_END,
  NAVI_AGENTS_BLOCK_START,
  recognizeNaviManagedBlock,
  renderAgentsBlock,
  type NaviManagedBlockRecognition,
  type ProjectTriggerState,
} from "./navi-project-trigger";

export type ParsedInitOptions = InitOptions & { targetDir: string; write: boolean };

export interface NaviInitIo {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

class InitArgsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InitArgsError";
  }
}

export function parseInitArgs(args: string[], cwd = process.cwd()): ParsedInitOptions {
  const parsed: ParsedInitOptions = {
    targetDir: path.resolve(cwd),
    write: false,
  };
  const seen = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (["--target", "--map-file", "--expect-plan"].includes(arg)) {
      if (seen.has(arg)) throw new InitArgsError(`Duplicate option: ${arg}`);
      seen.add(arg);
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new InitArgsError(`Missing value for ${arg}`);
      if (arg === "--target") parsed.targetDir = path.resolve(cwd, value);
      else if (arg === "--map-file") parsed.mapFile = path.resolve(cwd, value);
      else parsed.expectPlan = value;
      index += 1;
      continue;
    }

    if (arg === "--write") {
      if (seen.has(arg)) throw new InitArgsError(`Duplicate option: ${arg}`);
      seen.add(arg);
      parsed.write = true;
      continue;
    }

    if (arg === "--suggest-map") {
      throw new InitArgsError(
        "The --suggest-map option was removed. Use Navi in Codex to form and confirm a Project Map, then pass it with --map-file.",
      );
    }

    throw new InitArgsError(`Unknown option: ${arg}`);
  }

  if (parsed.expectPlan !== undefined && !parsed.write) {
    throw new InitArgsError("--expect-plan requires --write");
  }
  return parsed;
}

export function renderInitPlan(plan: InitPlan): string {
  const lines: string[] = [];
  const isDryRun = plan.mode === "dry-run";
  const heading = isDryRun
    ? "Navi init preview"
    : plan.state === "actionable"
      ? "Navi init applied"
      : plan.state === "blocked"
        ? "Navi init blocked"
        : plan.state === "needs-confirmed-map"
          ? "Navi init needs a confirmed Project Map"
          : "Navi init status";
  lines.push(heading);
  lines.push(`Target: ${plan.targetDir}`);
  lines.push("This does not install Navi again.");
  lines.push("");

  if (plan.state === "needs-confirmed-map") {
    lines.push(plan.diagnostic ?? "A confirmed Project Map is required before Navi can activate this project.");
    if (plan.evidencePaths.length > 0) {
      lines.push("Candidate local sources to review:");
      for (const evidencePath of plan.evidencePaths.slice(0, 3)) lines.push(`- ${evidencePath}`);
    }
    lines.push("Use Navi in the current Codex project session to form and confirm the Project Map.");
  } else if (plan.state === "blocked") {
    lines.push(`Blocked: ${plan.diagnostic ?? "Existing project state cannot be changed safely by init."}`);
  } else if (plan.state === "healthy") {
    lines.push("Navi is already initialized with a valid confirmed Project Map and current recognized trigger.");
  }

  for (const action of plan.actions) {
    const label = action.kind === "create" ? "Create" : action.kind === "modify" ? "Modify" : "Skip";
    lines.push(`- ${label}: ${action.relativePath}`);
    lines.push(`  ${action.summary}`);
  }

  const writableActions = plan.actions.filter((action) => action.kind === "create" || action.kind === "modify");
  if (plan.actions.length > 0) lines.push("");
  if (isDryRun && plan.state === "actionable") {
    lines.push("No files were changed.");
  } else if (!isDryRun && plan.state === "actionable" && writableActions.length === 0) {
    lines.push("No files needed changes.");
  } else if (!isDryRun && plan.state === "actionable") {
    lines.push("Files were changed according to the plan above.");
  }

  if (plan.fingerprint) lines.push(`Plan fingerprint: ${plan.fingerprint}`);

  if (plan.state === "actionable" || plan.state === "healthy") {
    lines.push("");
    lines.push("Fresh-session validation prompt:");
    lines.push("```text");
    lines.push(plan.validationPrompt);
    lines.push("```");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export async function runNaviInitCli(
  args: string[],
  io: NaviInitIo = {
    cwd: process.cwd(),
    stdout: (text) => process.stdout.write(text),
    stderr: (text) => process.stderr.write(text),
  },
): Promise<number> {
  let options: ParsedInitOptions;
  try {
    options = parseInitArgs(args, io.cwd);
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    io.stderr("Usage: navi init [--target <path>] [--map-file <path>] [--expect-plan <value> --write]\n");
    return 1;
  }

  try {
    const plan = await buildInitPlan(options);
    if (plan.state === "needs-confirmed-map" || plan.state === "blocked") {
      io.stdout(renderInitPlan(plan));
      return 1;
    }
    if (options.write && plan.actions.some((action) => action.kind === "create" || action.kind === "modify") && !options.expectPlan) {
      io.stderr("Refusing actionable writes without --expect-plan. Preview the plan through the Codex integration first.\n");
      return 1;
    }
    if (
      options.write
      && plan.actions.some((action) => action.kind === "create" || action.kind === "modify")
      && options.expectPlan !== plan.fingerprint
    ) {
      io.stderr("Refusing actionable writes because --expect-plan does not match the current plan fingerprint. Preview the plan again.\n");
      return 1;
    }
    await applyInitPlan(plan);
    io.stdout(renderInitPlan(plan));
    return 0;
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
