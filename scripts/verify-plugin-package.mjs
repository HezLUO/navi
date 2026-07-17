#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourceSkillDir = path.join(repoRoot, ".agents/skills/navi");
const packageDir = path.join(repoRoot, "plugins/navi");
const packagedSkillDir = path.join(packageDir, "skills/navi");
const marketplacePath = path.join(repoRoot, ".agents/plugins/marketplace.json");
const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const validatorPath = path.join(
  codexHome,
  "skills/.system/plugin-creator/scripts/validate_plugin.py",
);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON at ${filePath}: ${error instanceof Error ? error.message : error}`);
  }
}

function assertCurrentPackageMetadata() {
  const manifest = readJson(path.join(packageDir, ".codex-plugin/plugin.json"));
  const marketplace = readJson(marketplacePath);

  if (manifest?.name !== "navi") fail("Plugin manifest must use the navi identifier.");
  if (marketplace?.name !== "navi-source") fail("Marketplace must be named navi-source.");
  if (marketplace?.interface?.displayName !== "Navi Releases") {
    fail("Marketplace display name must be Navi Releases.");
  }
  if (!Array.isArray(marketplace?.plugins) || marketplace.plugins.length !== 1) {
    fail("Marketplace must contain exactly one Navi plugin entry.");
  }

  const [plugin] = marketplace.plugins;
  if (
    plugin?.name !== "navi" ||
    plugin?.source?.source !== "local" ||
    plugin?.source?.path !== "./plugins/navi" ||
    plugin?.policy?.installation !== "AVAILABLE" ||
    plugin?.policy?.authentication !== "ON_INSTALL" ||
    plugin?.category !== "Productivity"
  ) {
    fail("Marketplace Navi entry does not match the source-alpha policy.");
  }
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath).map((nested) => path.join(entry.name, nested));
    return [entry.name];
  }).sort().map((filePath) => filePath.split(path.sep).join("/"));
}

function assertSameDirectory(sourceDir, targetDir) {
  const sourceFiles = listFiles(sourceDir);
  const targetFiles = listFiles(targetDir);
  if (JSON.stringify(sourceFiles) !== JSON.stringify(targetFiles)) fail("Packaged skill file list differs from source skill.");

  for (const relativePath of sourceFiles) {
    if (!fs.readFileSync(path.join(sourceDir, relativePath)).equals(fs.readFileSync(path.join(targetDir, relativePath)))) {
      fail(`Packaged skill drift detected: ${relativePath}`);
    }
  }
}

if (!fs.existsSync(validatorPath)) {
  fail(`Missing Codex plugin validator: ${validatorPath}\nInstall or enable the plugin-creator system skill before running package verification.`);
}

assertCurrentPackageMetadata();
console.log("Checking generated package-local Navi init entry...");
run("node", ["scripts/build-plugin-init.mjs", "--check"]);
console.log("Running Navi skill/package tests...");
run("npm", ["test", "--", "tests/skills"]);
console.log("Validating Codex plugin manifest...");
run("python3", [validatorPath, packageDir]);
console.log("Checking source/package skill drift...");
assertSameDirectory(sourceSkillDir, packagedSkillDir);
console.log("Navi repo package verification passed.");
