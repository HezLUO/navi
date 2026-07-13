#!/usr/bin/env node
import { tsImport } from "tsx/esm/api";

const { runNaviCli } = await tsImport("./navi.ts", import.meta.url);
process.exitCode = await runNaviCli(process.argv.slice(2));
