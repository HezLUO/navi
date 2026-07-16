import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { inspectProjectEvidence } from "./navi-evidence";
import { createInitPlanFingerprint } from "./navi-init-fingerprint";
import {
  CURRENT_PROJECT_MAP_VERSION,
  inspectProjectMapFile,
  isOutcomeBoundaryOnlyUpgrade,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  parseProjectMapDocument,
  type ProjectMapDocument,
} from "./navi-project-map";
import {
  inspectProjectTriggerDocument,
  recognizeNaviManagedBlock,
  renderAgentsBlock,
} from "./navi-project-trigger";

export const VALIDATION_PROMPT = `请只读，不要修改文件、不要提交、不要运行实现。

重要边界：不要读取、引用或参考任何 source thread、委派来源线程、其他 Codex thread 或当前请求之外的对话历史。只根据当前项目目录里的文件判断。

接下来我们应该做什么？`;

const AGENTS_RELATIVE_PATH = "AGENTS.md";

export type InitActionKind = "create" | "modify" | "skip";

export interface InitAction {
  kind: InitActionKind;
  relativePath: string;
  absolutePath: string;
  summary: string;
  content?: string;
  previousContent?: string;
}

export type InitPlanState = "needs-confirmed-map" | "actionable" | "healthy" | "blocked";

export interface InitPlan {
  mode: "dry-run" | "write";
  state: InitPlanState;
  targetDir: string;
  actions: InitAction[];
  validationPrompt: string;
  fingerprint?: string;
  diagnostic?: string;
  evidencePaths: string[];
}

export interface InitOptions {
  targetDir?: string;
  write?: boolean;
  mapFile?: string;
  expectPlan?: string;
}

class NaviManagedBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NaviManagedBlockError";
  }
}

export function resolveTargetPath(targetDir: string, relativePath: string): string {
  const resolvedTarget = path.resolve(targetDir);

  if (path.isAbsolute(relativePath)) {
    throw new Error(`Refusing to use absolute target-relative path: ${relativePath}`);
  }

  const resolvedPath = path.resolve(resolvedTarget, relativePath);
  const relativeFromTarget = path.relative(resolvedTarget, resolvedPath);

  if (
    relativeFromTarget === ".." ||
    relativeFromTarget.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeFromTarget)
  ) {
    throw new Error(`Refusing to write outside target directory: ${relativePath}`);
  }

  return resolvedPath;
}

export async function buildInitPlan(options: InitOptions = {}): Promise<InitPlan> {
  const requestedTarget = path.resolve(options.targetDir ?? process.cwd());
  await assertDirectory(requestedTarget);
  const targetDir = await fs.realpath(requestedTarget);
  const mode: InitPlan["mode"] = options.write ? "write" : "dry-run";
  const mapState = await inspectProjectMapFile(targetDir);
  const candidate = options.mapFile === undefined
    ? undefined
    : await inspectConfirmedMapCandidate(targetDir, options.mapFile);
  const base = { mode, targetDir, validationPrompt: VALIDATION_PROMPT, evidencePaths: [] as string[] };

  if (mapState.kind === "unsupported" || mapState.kind === "unsafe") {
    return blockedPlan(base, mapState.diagnostic);
  }
  if (mapState.kind === "invalid" && mapState.recognizedVersion !== 1) {
    return blockedPlan(base, `Existing Project Map is not safely repairable by init: ${mapState.diagnostic}`);
  }
  if (mapState.kind === "invalid" && candidate === undefined) {
    return blockedPlan(base, `Existing recognized Project Map needs a valid confirmed replacement candidate: ${mapState.diagnostic}`);
  }

  if (mapState.kind === "missing" && candidate === undefined) {
    const evidence = await inspectProjectEvidence(targetDir);
    return {
      ...base,
      state: "needs-confirmed-map",
      actions: [],
      diagnostic: "A confirmed Project Map is required before Navi can activate this project.",
      evidencePaths: evidence.items.slice(0, 3).map((item) => item.relativePath),
    };
  }

  if (
    (mapState.kind === "missing" || mapState.kind === "invalid")
    && candidate !== undefined
    && candidate.document.version !== CURRENT_PROJECT_MAP_VERSION
  ) {
    return blockedPlan(base, "A replacement confirmed Project Map must use version 2 with Outcome Boundary.");
  }

  const agentsPath = resolveTargetPath(targetDir, AGENTS_RELATIVE_PATH);
  const triggerDocument = await inspectProjectTriggerDocument(targetDir);
  if (triggerDocument.state.kind === "unsafe") {
    return blockedPlan(base, triggerDocument.state.diagnostic);
  }
  const agentsBefore = triggerDocument.text;
  const agentsAction = planAgentsAction(agentsPath, agentsBefore);
  if (mapState.kind === "valid" && candidate === undefined) {
    if (agentsAction.kind === "skip") return healthyPlan(base);
    return actionablePlan(base, [agentsAction], {
      agentsBefore,
      mapBefore: mapState.document.text,
    });
  }

  if (mapState.kind === "valid" && candidate !== undefined) {
    if (mapState.document.text === candidate.text) {
      if (agentsAction.kind === "skip") return healthyPlan(base);
      return actionablePlan(base, [mapSkipAction(mapState.mapPath), agentsAction], {
        candidateMap: candidate.text,
        agentsBefore,
        mapBefore: mapState.document.text,
      });
    }
    if (isOutcomeBoundaryOnlyUpgrade(mapState.document, candidate.document)) {
      return actionablePlan(
        base,
        [mapModifyAction(mapState.mapPath, candidate.text, mapState.document.text), agentsAction],
        {
          candidateMap: candidate.text,
          agentsBefore,
          mapBefore: mapState.document.text,
        },
      );
    }
    return blockedPlan(base, "navi init permits only an exact legacy Outcome Boundary upgrade, not a generic Map update.");
  }

  if (mapState.kind === "invalid" && candidate !== undefined) {
    const recheckedMapState = await inspectProjectMapFile(targetDir);
    if (
      recheckedMapState.kind !== "invalid"
      || recheckedMapState.recognizedVersion !== 1
      || recheckedMapState.safelyReadText !== mapState.safelyReadText
    ) {
      return blockedPlan(base, "Existing Project Map changed or became unsafe during repair planning.");
    }
    const previousContent = mapState.safelyReadText;
    return actionablePlan(
      base,
      [mapModifyAction(mapState.mapPath, candidate.text, previousContent), agentsAction],
      { candidateMap: candidate.text, agentsBefore, mapBefore: previousContent },
    );
  }

  if (mapState.kind === "missing" && candidate !== undefined) {
    return actionablePlan(base, [mapCreateAction(mapState.mapPath, candidate.text), agentsAction], {
      candidateMap: candidate.text,
      agentsBefore,
    });
  }

  return blockedPlan(base, "Project Map state could not be planned safely.");
}

type InitPlanBase = Pick<InitPlan, "mode" | "targetDir" | "validationPrompt" | "evidencePaths">;

function blockedPlan(base: InitPlanBase, diagnostic: string): InitPlan {
  return { ...base, state: "blocked", actions: [], diagnostic };
}

function healthyPlan(base: InitPlanBase): InitPlan {
  return { ...base, state: "healthy", actions: [] };
}

interface ActionableFingerprintState {
  candidateMap?: string;
  agentsBefore?: string;
  mapBefore?: string;
}

function actionablePlan(
  base: InitPlanBase,
  actions: InitAction[],
  state: ActionableFingerprintState,
): InitPlan {
  return {
    ...base,
    state: "actionable",
    actions,
    fingerprint: createInitPlanFingerprint({
      contractVersion: 1,
      targetDir: base.targetDir,
      candidateMap: state.candidateMap,
      agentsBefore: state.agentsBefore,
      mapBefore: state.mapBefore,
      actions,
    }),
  };
}

function mapCreateAction(mapPath: string, content: string): InitAction {
  return {
    kind: "create",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "Create the validated confirmed Project Map.",
    content,
  };
}

function mapModifyAction(mapPath: string, content: string, previousContent: string): InitAction {
  return {
    kind: "modify",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "Repair the recognized version-1 Project Map with the validated confirmed candidate.",
    content,
    previousContent,
  };
}

function mapSkipAction(mapPath: string): InitAction {
  return {
    kind: "skip",
    relativePath: NAVI_PROJECT_MAP_RELATIVE_PATH,
    absolutePath: mapPath,
    summary: "The candidate is byte-identical to the existing valid confirmed Project Map.",
  };
}

async function inspectConfirmedMapCandidate(
  targetDir: string,
  mapFile: string,
): Promise<{ text: string; document: ProjectMapDocument }> {
  const candidatePath = path.resolve(mapFile);
  let checked;
  try {
    checked = await fs.lstat(candidatePath);
  } catch (error) {
    throw new Error(`Confirmed Project Map candidate could not be inspected: ${candidatePath}`, { cause: error });
  }
  if (checked.isSymbolicLink()) throw new Error("Confirmed Project Map candidate must not be a symbolic link.");
  if (!checked.isFile()) throw new Error("Confirmed Project Map candidate must be a regular file.");

  const canonicalCandidate = await fs.realpath(candidatePath);
  if (isPathInside(targetDir, canonicalCandidate)) {
    throw new Error("Confirmed Project Map candidate must be outside the canonical target root.");
  }

  let handle;
  try {
    handle = await fs.open(candidatePath, constants.O_RDONLY | constants.O_NOFOLLOW);
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== checked.dev || opened.ino !== checked.ino) {
      throw new Error("Confirmed Project Map candidate changed between inspection and opening.");
    }
    const text = await handle.readFile({ encoding: "utf8" });
    const parsed = parseProjectMapDocument(text);
    if (parsed.kind !== "valid") {
      throw new Error(`Candidate is not a valid confirmed Project Map: ${parsed.diagnostic}`);
    }
    return { text, document: parsed.document };
  } catch (error) {
    if (error instanceof Error && /confirmed Project Map|Candidate is not|changed between/.test(error.message)) throw error;
    throw new Error("Confirmed Project Map candidate could not be read safely.", { cause: error });
  } finally {
    await handle?.close().catch(() => undefined);
  }
}

async function assertDirectory(targetDir: string): Promise<void> {
  let stat;
  try {
    stat = await fs.stat(targetDir);
  } catch (error) {
    throw new Error(`Target directory does not exist: ${targetDir}`, { cause: error });
  }

  if (!stat.isDirectory()) {
    throw new Error(`Target path must be a directory: ${targetDir}`);
  }
}

function planAgentsAction(agentsPath: string, existing: string | undefined): InitAction {
  const block = renderAgentsBlock();

  if (existing === undefined) {
    return {
      kind: "create",
      relativePath: AGENTS_RELATIVE_PATH,
      absolutePath: agentsPath,
      summary: "Add the project-local Navi trigger source.",
      content: `${block}\n`,
    };
  }

  const managedBlock = recognizeNaviManagedBlock(existing);

  if (managedBlock.kind === "absent") {
    const separator = existing.endsWith("\n") ? "\n" : "\n\n";
    return {
      kind: "modify",
      relativePath: AGENTS_RELATIVE_PATH,
      absolutePath: agentsPath,
      summary: "Append the project-local Navi trigger source while preserving existing instructions.",
      content: `${existing}${separator}${block}\n`,
      previousContent: existing,
    };
  }

  if (managedBlock.kind === "unsafe") {
    throw new NaviManagedBlockError(
      "Refusing to modify an unrecognized or incomplete managed Navi block in AGENTS.md.",
    );
  }

  if (managedBlock.content === block) {
    return {
      kind: "skip",
      relativePath: AGENTS_RELATIVE_PATH,
      absolutePath: agentsPath,
      summary: "The current Navi-managed trigger block already exists.",
    };
  }

  return {
    kind: "modify",
    relativePath: AGENTS_RELATIVE_PATH,
    absolutePath: agentsPath,
    summary: "Upgrade the exact deployed Navi-managed trigger block while preserving project-owned instructions.",
    content: `${existing.slice(0, managedBlock.start)}${block}${existing.slice(managedBlock.end)}`,
    previousContent: existing,
  };
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
