import { runNaviInitCli } from "./navi-init";

process.exitCode = await runNaviInitCli(process.argv.slice(2));
