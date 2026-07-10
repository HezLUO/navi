#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const { runNaviInitCli } = await import(
  new URL("./navi-init.ts", import.meta.url).href
) as typeof import("./navi-init");

export const NAVI_USAGE = "Usage: navi <init|setup|doctor> [options]";

export interface NaviCliIo {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  runInit: (args: string[]) => Promise<number>;
}

const DEFAULT_IO: NaviCliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  runInit: runNaviInitCli,
};

export async function runNaviCli(args: string[], io: NaviCliIo = DEFAULT_IO): Promise<number> {
  const [command, ...commandArgs] = args;

  if (command === "init") {
    return io.runInit(commandArgs);
  }

  io.stderr(`${NAVI_USAGE}\n`);
  return 1;
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  process.exit(await runNaviCli(process.argv.slice(2)));
}
