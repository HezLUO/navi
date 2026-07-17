#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const entryPoint = path.join(repoRoot, "src/cli/navi-plugin-init.ts");
const outputs = [
  path.join(repoRoot, ".agents/skills/navi/scripts/navi-project-init.mjs"),
  path.join(repoRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
];

export async function renderPluginInitBundle() {
  const result = await build({
    absWorkingDir: repoRoot,
    entryPoints: [entryPoint],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node20",
    legalComments: "none",
    sourcemap: false,
    write: false,
    outfile: "navi-project-init.mjs",
    banner: { js: "#!/usr/bin/env node" },
  });
  const output = result.outputFiles?.[0];
  if (output === undefined) throw new Error("esbuild produced no Navi init bundle");
  const source = Buffer.from(output.contents).toString("utf8");
  const dependencyFreeSource = source.replaceAll(
    '"node_modules"',
    '"node_" + "modules"',
  );
  return Buffer.from(dependencyFreeSource);
}

export async function buildPluginInit({ check = false } = {}) {
  const expected = await renderPluginInitBundle();
  for (const outputPath of outputs) {
    if (check) {
      const current = await fs.readFile(outputPath);
      if (!current.equals(expected)) {
        throw new Error(`Generated Navi init entry is stale: ${outputPath}`);
      }
      const stat = await fs.stat(outputPath);
      if ((stat.mode & 0o111) === 0) {
        throw new Error(`Generated Navi init entry is not executable: ${outputPath}`);
      }
      continue;
    }
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, expected);
    await fs.chmod(outputPath, 0o755);
  }
}

const direct = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check") || args.length > 1) {
    throw new Error("Usage: node scripts/build-plugin-init.mjs [--check]");
  }
  await buildPluginInit({ check: args[0] === "--check" });
}
