import fs from "node:fs/promises";
import path from "node:path";
import { NAVI_PROJECT_MAP_RELATIVE_PATH } from "./navi-project-map";
import { resolveTargetPath, type InitAction, type InitPlan } from "./navi-init-plan";

const AGENTS_RELATIVE_PATH = "AGENTS.md";

type CreateInitAction = InitAction & {
  kind: "create";
  content: string;
};

type ModifyInitAction = InitAction & {
  kind: "modify";
  content: string;
  previousContent: string;
};

type WritableInitAction = CreateInitAction | ModifyInitAction;

interface PreflightedWrite {
  action: WritableInitAction;
  writePath: string;
}

export interface InitWriteDependencies {
  beforeWrite?: (relativePath: string) => Promise<void>;
  afterWrite?: (relativePath: string) => Promise<void>;
}

export async function applyInitPlan(
  plan: InitPlan,
  dependencies: InitWriteDependencies = {},
): Promise<void> {
  if (plan.mode !== "write") {
    return;
  }

  const targetDir = path.resolve(plan.targetDir);
  const writes = (await preflightInitPlan(plan)).sort(compareActivationWriteOrder);
  let mapWritten = false;

  for (const { action, writePath } of writes) {
    try {
      await assertPhysicalWritePath(targetDir, writePath);
      await dependencies.beforeWrite?.(action.relativePath);

      if (action.kind === "create") {
        await fs.mkdir(path.dirname(writePath), { recursive: true });
        await assertPhysicalWritePath(targetDir, writePath);
        await writeNewFile(writePath, action);
      } else {
        await writeModifiedFile(writePath, action);
      }

      if (action.relativePath === NAVI_PROJECT_MAP_RELATIVE_PATH) mapWritten = true;
      await dependencies.afterWrite?.(action.relativePath);
    } catch (error) {
      if (mapWritten && action.relativePath === AGENTS_RELATIVE_PATH) {
        throw new Error(
          "Navi init partial activation: the Project Map was written, but trigger activation did not complete. The Map was preserved; inspect AGENTS.md before retrying.",
          { cause: error },
        );
      }
      throw error;
    }
  }
}

function compareActivationWriteOrder(left: PreflightedWrite, right: PreflightedWrite): number {
  return activationWriteRank(left.action.relativePath) - activationWriteRank(right.action.relativePath);
}

function activationWriteRank(relativePath: string): number {
  if (relativePath === NAVI_PROJECT_MAP_RELATIVE_PATH) return 0;
  if (relativePath === AGENTS_RELATIVE_PATH) return 2;
  return 1;
}

function resolveActionWritePath(targetDir: string, action: InitAction): string {
  const writePath = resolveTargetPath(targetDir, action.relativePath);

  if (path.resolve(action.absolutePath) !== writePath) {
    throw new Error(`Planned absolute path does not match target-relative path: ${action.relativePath}`);
  }

  return writePath;
}

async function preflightInitPlan(plan: InitPlan): Promise<PreflightedWrite[]> {
  const targetDir = path.resolve(plan.targetDir);
  const writes: PreflightedWrite[] = [];

  for (const action of plan.actions) {
    const writableAction = validateWritableActionShape(action);
    if (writableAction === undefined) {
      continue;
    }

    const writePath = resolveActionWritePath(targetDir, writableAction);
    await assertPhysicalWritePath(targetDir, writePath);

    if (writableAction.kind === "create") {
      await assertCreateTargetIsFresh(writePath, writableAction);
    } else {
      await assertModifyTargetIsFresh(writePath, writableAction);
    }

    writes.push({ action: writableAction, writePath });
  }

  return writes;
}

function validateWritableActionShape(action: InitAction): WritableInitAction | undefined {
  if (action.kind === "skip") {
    return undefined;
  }

  if (action.content === undefined) {
    throw new Error(`Refusing to ${action.kind} ${action.relativePath}: missing content`);
  }

  if (action.kind === "modify" && action.previousContent === undefined) {
    throw new Error(`Refusing to modify ${action.relativePath}: missing previous content guard`);
  }

  return action as WritableInitAction;
}

async function assertPhysicalWritePath(targetDir: string, writePath: string): Promise<void> {
  const resolvedTarget = path.resolve(targetDir);
  const realTarget = await fs.realpath(resolvedTarget);
  const relativeWritePath = path.relative(resolvedTarget, writePath);
  const parts = relativeWritePath.split(path.sep).filter(Boolean);
  let currentPath = resolvedTarget;

  for (const part of parts) {
    currentPath = path.join(currentPath, part);
    const stat = await lstatIfExists(currentPath);
    if (stat === undefined) {
      return;
    }

    const relativeComponent = path.relative(resolvedTarget, currentPath) || ".";
    if (stat.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink inside target: ${relativeComponent}`);
    }

    const realComponent = await fs.realpath(currentPath);
    if (!isPathInside(realTarget, realComponent)) {
      throw new Error(`Refusing to write outside target directory through physical path: ${relativeComponent}`);
    }
  }
}

async function assertCreateTargetIsFresh(writePath: string, action: CreateInitAction): Promise<void> {
  if ((await lstatIfExists(writePath)) !== undefined) {
    throw new Error(`Refusing to create ${action.relativePath}: file already exists since planning`);
  }
}

async function assertModifyTargetIsFresh(writePath: string, action: ModifyInitAction): Promise<void> {
  const current = await readTextIfExists(writePath);
  if (current === undefined) {
    throw new Error(`Refusing to modify ${action.relativePath}: file is missing since planning`);
  }

  if (current !== action.previousContent) {
    throw new Error(`Refusing to modify ${action.relativePath}: file changed since planning`);
  }
}

async function writeNewFile(writePath: string, action: CreateInitAction): Promise<void> {
  try {
    await fs.writeFile(writePath, action.content, { flag: "wx" });
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") {
      throw new Error(`Refusing to create ${action.relativePath}: file already exists since planning`, {
        cause: error,
      });
    }
    throw error;
  }
}

async function writeModifiedFile(writePath: string, action: ModifyInitAction): Promise<void> {
  await assertModifyTargetIsFresh(writePath, action);
  await fs.writeFile(writePath, action.content);
}

async function readTextIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function lstatIfExists(filePath: string) {
  try {
    return await fs.lstat(filePath);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

function isPathInside(parentPath: string, childPath: string): boolean {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
