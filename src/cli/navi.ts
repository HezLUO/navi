#!/usr/bin/env node
import { pathToFileURL } from "node:url";

async function runNaviInit(args: string[]): Promise<number> {
  const { runNaviInitCli } = await import(new URL("./navi-init.ts", import.meta.url).href) as typeof import("./navi-init");
  return runNaviInitCli(args);
}

async function runNaviSetup(args: string[]): Promise<number> {
  const { runNaviSetupCli } = await import(new URL("./navi-global.ts", import.meta.url).href) as typeof import("./navi-global");
  return runNaviSetupCli(args);
}

async function runNaviDoctor(args: string[]): Promise<number> {
  const { runNaviDoctorCli } = await import(new URL("./navi-doctor.ts", import.meta.url).href) as typeof import("./navi-doctor");
  return runNaviDoctorCli(args);
}

export const NAVI_USAGE = "Usage: navi <init|setup|doctor> [options]";

export interface NaviCliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  runInit: (args: string[]) => Promise<number>;
  runSetup: (args: string[]) => Promise<number>;
  runDoctor: (args: string[]) => Promise<number>;
}

const DEFAULT_IO: NaviCliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  runInit: runNaviInit,
  runSetup: runNaviSetup,
  runDoctor: runNaviDoctor,
};

export async function runNaviCli(args: string[], io: NaviCliIo = DEFAULT_IO): Promise<number> {
  const [command, ...commandArgs] = args;

  if (command === "init") {
    return io.runInit(commandArgs);
  }

  if (command === "setup") {
    return io.runSetup(commandArgs);
  }

  if (command === "doctor") {
    return io.runDoctor(commandArgs);
  }

  io.stderr(`${NAVI_USAGE}\n`);
  return 1;
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  process.exit(await runNaviCli(process.argv.slice(2)));
}
