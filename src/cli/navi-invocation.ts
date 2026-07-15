import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export type NaviInvocationReachability = "pass" | "fallback" | "unavailable";
export type NaviInvocationReason = "bare" | "path-missing" | "path-mismatch" | "unavailable";

export interface NaviInvocationContext {
  cliRoot: string;
  entrypoint: string;
  reachability: NaviInvocationReachability;
  reason: NaviInvocationReason;
  commandPrefix?: readonly string[];
  pathCandidate?: string;
  pathBin?: string;
}

export interface NaviInvocationOptions {
  cliRoot: string;
  launchedEntrypoint: string;
  envPath?: string;
  cwd: string;
  npmLifecycleEvent?: string;
}

export interface NaviInvocationDependencies {
  access: typeof fs.access;
  realpath: typeof fs.realpath;
  readFile: typeof fs.readFile;
  stat: typeof fs.stat;
}

const DEFAULT_DEPENDENCIES: NaviInvocationDependencies = {
  access: fs.access,
  realpath: fs.realpath,
  readFile: fs.readFile,
  stat: fs.stat,
};

export const TRUSTED_BARE_NAVI_INVOCATION: NaviInvocationContext = {
  cliRoot: "",
  entrypoint: "navi",
  reachability: "pass",
  reason: "bare",
  commandPrefix: ["navi"],
};

export async function resolveNaviInvocationContext(
  options: NaviInvocationOptions,
  dependencies: NaviInvocationDependencies = DEFAULT_DEPENDENCIES,
): Promise<NaviInvocationContext> {
  const cliRoot = path.resolve(options.cliRoot);
  const expectedEntrypoint = path.join(cliRoot, "src/cli/navi-bin.mjs");
  const canonicalEntrypoint = await executableRealpathOptional(expectedEntrypoint, dependencies);
  if (!canonicalEntrypoint) {
    return {
      cliRoot,
      entrypoint: expectedEntrypoint,
      reachability: "unavailable",
      reason: "unavailable",
      commandPrefix: undefined,
    };
  }
  const pathCandidate = await firstExecutableOnPath(options.envPath, options.cwd, "navi", dependencies);
  const pathMatches = pathCandidate === undefined
    ? false
    : await executableRealpathOptional(pathCandidate, dependencies) === canonicalEntrypoint;

  if (pathCandidate !== undefined && pathMatches) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "pass",
      reason: "bare",
      commandPrefix: ["navi"],
      pathCandidate,
      pathBin: path.dirname(pathCandidate),
    };
  }

  const launched = path.resolve(options.launchedEntrypoint);
  if (await executableRealpathOptional(launched, dependencies) === canonicalEntrypoint) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "fallback",
      reason: pathCandidate ? "path-mismatch" : "path-missing",
      commandPrefix: [launched],
      pathBin: path.dirname(launched),
      ...(pathCandidate ? { pathCandidate } : {}),
    };
  }

  const npmCandidate = options.envPath
    ? await firstExecutableOnPath(options.envPath, options.cwd, "npm", dependencies)
    : undefined;
  if (options.npmLifecycleEvent === "navi"
    && path.resolve(options.cwd) === cliRoot
    && npmCandidate !== undefined
    && await hasExecutableSourceScript(cliRoot, dependencies)) {
    return {
      cliRoot,
      entrypoint: canonicalEntrypoint,
      reachability: "fallback",
      reason: pathCandidate ? "path-mismatch" : "path-missing",
      commandPrefix: ["npm", "run", "navi", "--"],
      ...(pathCandidate ? { pathCandidate, pathBin: path.dirname(pathCandidate) } : {}),
    };
  }

  return {
    cliRoot,
    entrypoint: canonicalEntrypoint,
    reachability: "unavailable",
    reason: "unavailable",
    commandPrefix: undefined,
    ...(pathCandidate ? { pathCandidate, pathBin: path.dirname(pathCandidate) } : {}),
  };
}

export function renderNaviCommand(
  context: NaviInvocationContext,
  args: readonly string[],
): string | undefined {
  if (!context.commandPrefix) return undefined;
  return [...context.commandPrefix, ...args].map(quotePosixToken).join(" ");
}

async function firstExecutableOnPath(
  envPath: string | undefined,
  cwd: string,
  command: string,
  dependencies: NaviInvocationDependencies,
): Promise<string | undefined> {
  if (envPath === undefined) return undefined;
  for (const directory of envPath.split(path.delimiter)) {
    const candidate = path.join(path.resolve(cwd, directory), command);
    if (await isExecutable(candidate, dependencies)) return candidate;
  }
  return undefined;
}

async function isExecutable(candidate: string, dependencies: NaviInvocationDependencies): Promise<boolean> {
  return await executableRealpathOptional(candidate, dependencies) !== undefined;
}

async function executableRealpathOptional(
  candidate: string,
  dependencies: NaviInvocationDependencies,
): Promise<string | undefined> {
  try {
    await dependencies.access(candidate, constants.X_OK);
    const canonical = await dependencies.realpath(candidate);
    return (await dependencies.stat(canonical)).isFile() ? canonical : undefined;
  } catch {
    return undefined;
  }
}

async function hasExecutableSourceScript(
  cliRoot: string,
  dependencies: NaviInvocationDependencies,
): Promise<boolean> {
  try {
    const value = JSON.parse(await dependencies.readFile(path.join(cliRoot, "package.json"), "utf8")) as {
      name?: unknown;
      bin?: Record<string, unknown>;
      scripts?: Record<string, unknown>;
    };
    const sourceScript = value.scripts?.navi;
    if (value.name !== "navi"
      || value.bin?.navi !== "src/cli/navi-bin.mjs"
      || sourceScript !== "./src/cli/navi-bin.mjs") {
      return false;
    }
    return isExecutable(path.resolve(cliRoot, sourceScript), dependencies);
  } catch {
    return false;
  }
}

function quotePosixToken(token: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(token)) return token;
  return `'${token.replaceAll("'", `'"'"'`)}'`;
}
