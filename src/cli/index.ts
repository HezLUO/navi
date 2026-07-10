#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import open from "open";

const command = process.argv[2] ?? "start";

if (command === "init") {
  const { runNaviInitCli } = await import(
    new URL("./navi-init.ts", import.meta.url).href
  ) as typeof import("./navi-init");
  const exitCode = await runNaviInitCli(process.argv.slice(3));
  process.exit(exitCode);
}

if (command !== "start") {
  console.error(`Unknown command "${command}". Use: navi init [--target <path>] [--write] [--suggest-map] or along start`);
  process.exit(1);
}

const repoPath = process.cwd();
const port = Number(process.env.ALONG_PORT ?? 4317);
const serverEntry = path.resolve("src/server/index.ts");

const child = spawn("npx", ["tsx", serverEntry], {
  cwd: path.resolve(import.meta.dirname, "../.."),
  env: {
    ...process.env,
    ALONG_REPO_PATH: repoPath,
    ALONG_PORT: String(port),
  },
  stdio: "inherit",
});

setTimeout(() => {
  void open(`http://127.0.0.1:5173`);
}, 800);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
