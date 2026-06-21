#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceSkillDir = path.join(repoRoot, ".agents/skills/along-working-thread");
const packageDir = path.join(repoRoot, "plugins/along-working-thread");
const packagedSkillDir = path.join(packageDir, "skills/along-working-thread");
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const validatorPath = path.join(
  codexHome,
  "skills/.system/plugin-creator/scripts/validate_plugin.py",
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function listFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return listFiles(entryPath).map((nested) => path.join(entry.name, nested));
      }

      return [entry.name];
    })
    .sort()
    .map((filePath) => filePath.split(path.sep).join("/"));
}

function assertSameDirectory(sourceDir, targetDir) {
  const sourceFiles = listFiles(sourceDir);
  const targetFiles = listFiles(targetDir);

  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles)) {
    console.error("Packaged skill file list differs from source skill.");
    console.error("Source files:", sourceFiles);
    console.error("Packaged files:", targetFiles);
    process.exit(1);
  }

  for (const relativePath of sourceFiles) {
    const source = fs.readFileSync(path.join(sourceDir, relativePath));
    const target = fs.readFileSync(path.join(targetDir, relativePath));

    if (!source.equals(target)) {
      console.error(`Packaged skill drift detected: ${relativePath}`);
      process.exit(1);
    }
  }
}

if (!fs.existsSync(validatorPath)) {
  console.error(`Missing Codex plugin validator: ${validatorPath}`);
  console.error("Install or enable the plugin-creator system skill before running package verification.");
  process.exit(1);
}

console.log("Running Along Working Thread skill/package tests...");
run("npm", ["test", "--", "tests/skills/along-working-thread-skill.test.ts"]);

console.log("Validating Codex plugin manifest...");
run("python3", [validatorPath, packageDir]);

console.log("Checking source/package skill drift...");
assertSameDirectory(sourceSkillDir, packagedSkillDir);

console.log("Along Working Thread repo package verification passed.");
