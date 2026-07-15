import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  resolveNaviInvocationContext,
  type NaviInvocationContext,
} from "./navi-invocation";
import type { NaviDoctorDependencies } from "./navi-doctor";

type NaviDoctorInvocationDependencies = NaviDoctorDependencies & {
  invocation?: NaviInvocationContext;
};

async function runNaviInit(args: string[]): Promise<number> {
  const { runNaviInitCli } = await import(new URL("./navi-init.ts", import.meta.url).href) as typeof import("./navi-init");
  return runNaviInitCli(args);
}

async function runNaviSetup(args: string[], invocation: NaviInvocationContext): Promise<number> {
  const { runNaviSetupCli } = await import(new URL("./navi-global.ts", import.meta.url).href) as typeof import("./navi-global");
  return runNaviSetupCli(args, undefined, undefined, invocation);
}

async function runNaviDoctor(args: string[], invocation: NaviInvocationContext): Promise<number> {
  const { runNaviDoctorCli } = await import(new URL("./navi-doctor.ts", import.meta.url).href) as typeof import("./navi-doctor");
  const dependencies: NaviDoctorInvocationDependencies = { invocation };
  return runNaviDoctorCli(args, undefined, dependencies, {
    cliRoot: invocation.cliRoot,
  });
}

export const NAVI_USAGE = "Usage: navi <init|setup|doctor> [options]";

export interface NaviCliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  runInit: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
  runSetup: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
  runDoctor: (args: string[], invocation: NaviInvocationContext) => Promise<number>;
}

export interface NaviCliDependencies {
  resolveInvocation: () => Promise<NaviInvocationContext>;
}

const DEFAULT_IO: NaviCliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  runInit: (args, _invocation) => runNaviInit(args),
  runSetup: runNaviSetup,
  runDoctor: runNaviDoctor,
};

const DEFAULT_DEPENDENCIES: NaviCliDependencies = {
  resolveInvocation: () => resolveNaviInvocationContext({
    cliRoot: resolveNaviCliRoot(),
    launchedEntrypoint: process.argv[1] ?? fileURLToPath(new URL("./navi-bin.mjs", import.meta.url)),
    ...(process.env.PATH === undefined ? {} : { envPath: process.env.PATH }),
    cwd: process.cwd(),
    ...(process.env.npm_lifecycle_event === undefined
      ? {}
      : { npmLifecycleEvent: process.env.npm_lifecycle_event }),
  }),
};

export async function runNaviCli(
  args: string[],
  io: NaviCliIo = DEFAULT_IO,
  dependencies: NaviCliDependencies = DEFAULT_DEPENDENCIES,
): Promise<number> {
  const [command, ...commandArgs] = args;

  if (command !== "init" && command !== "setup" && command !== "doctor") {
    io.stderr(`${NAVI_USAGE}\n`);
    return 1;
  }

  const invocation = await dependencies.resolveInvocation();

  if (command === "init") {
    return io.runInit(commandArgs, invocation);
  }

  if (command === "setup") {
    return io.runSetup(commandArgs, invocation);
  }

  return io.runDoctor(commandArgs, invocation);
}
export function resolveNaviCliRoot(moduleUrl: string = import.meta.url): string {
  return path.resolve(fileURLToPath(new URL("../..", moduleUrl)));
}
