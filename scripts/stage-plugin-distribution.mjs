#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryUrl = "https://github.com/HezLUO/navi.git";
const semanticVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function isSemanticVersion(value) {
  return typeof value === "string" && semanticVersionPattern.test(value);
}

function assertImmutableReleaseTag(releaseTag) {
  if (
    typeof releaseTag !== "string"
    || !releaseTag.startsWith("v")
    || !isSemanticVersion(releaseTag.slice(1))
  ) {
    throw new Error(`Remote marketplace ref must be an immutable release tag: ${releaseTag}`);
  }
}

function isPathInside(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return relative === "" || (
    relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function pluginEntry(source) {
  return {
    name: "navi",
    source,
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: "Productivity",
  };
}

function marketplace(source) {
  return {
    name: "navi-source",
    interface: { displayName: "Navi Releases" },
    plugins: [pluginEntry(source)],
  };
}

export function renderLocalMarketplace() {
  return marketplace({ source: "local", path: "./plugins/navi" });
}

export function renderRemoteMarketplace(releaseTag) {
  assertImmutableReleaseTag(releaseTag);
  return marketplace({
    source: "git-subdir",
    url: repositoryUrl,
    path: "./plugins/navi",
    ref: releaseTag,
  });
}

async function assertNoSymlink(root, current = root) {
  const currentStat = await fs.lstat(current);
  if (currentStat.isSymbolicLink()) {
    throw new Error(`Plugin package contains a symlink: ${path.relative(root, current) || "."}`);
  }
  if (!currentStat.isDirectory()) {
    throw new Error(`Plugin package path is not a directory: ${current}`);
  }
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    const candidate = path.join(current, entry.name);
    const stat = await fs.lstat(candidate);
    if (stat.isSymbolicLink()) {
      throw new Error(`Plugin package contains a symlink: ${path.relative(root, candidate)}`);
    }
    if (stat.isDirectory()) await assertNoSymlink(root, candidate);
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function resolvePhysicalOutputPath(absoluteOutput) {
  let ancestor = absoluteOutput;
  while (true) {
    try {
      const stat = await fs.lstat(ancestor);
      if (!stat.isDirectory() && !stat.isSymbolicLink()) {
        throw new Error(`Distribution output ancestor is not a directory: ${ancestor}`);
      }
      break;
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      ancestor = parent;
    }
  }
  const realAncestor = await fs.realpath(ancestor);
  return path.resolve(realAncestor, path.relative(ancestor, absoluteOutput));
}

export async function stageDistribution({
  repoRoot = defaultRepoRoot,
  outputDir,
  releaseTag,
}) {
  const absoluteRoot = path.resolve(repoRoot);
  const absoluteOutput = path.resolve(outputDir);
  try {
    await fs.lstat(absoluteOutput);
    throw new Error(`Distribution output already exists: ${absoluteOutput}`);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const pluginRoot = path.join(absoluteRoot, "plugins/navi");
  await assertNoSymlink(pluginRoot);
  const realPluginRoot = await fs.realpath(pluginRoot);
  const physicalOutput = await resolvePhysicalOutputPath(absoluteOutput);
  if (isPathInside(realPluginRoot, physicalOutput)) {
    throw new Error("Distribution physical output must not be inside the plugin package");
  }
  const manifest = JSON.parse(await fs.readFile(
    path.join(pluginRoot, ".codex-plugin/plugin.json"),
    "utf8",
  ));
  if (manifest.name !== "navi" || typeof manifest.version !== "string") {
    throw new Error("Navi plugin manifest identity is invalid");
  }
  if (!isSemanticVersion(manifest.version)) {
    throw new Error(
      `Navi plugin manifest version ${manifest.version} must be a safe semantic version`,
    );
  }
  if (releaseTag !== `v${manifest.version}`) {
    throw new Error(
      `Release tag ${releaseTag} does not match manifest version ${manifest.version}`,
    );
  }
  if (absoluteOutput === pluginRoot || absoluteOutput.startsWith(`${pluginRoot}${path.sep}`)) {
    throw new Error("Distribution output must not be inside the plugin package");
  }

  const localMarketplaceRoot = path.join(absoluteOutput, `navi-${manifest.version}`);
  if (!isPathInside(absoluteOutput, localMarketplaceRoot) || localMarketplaceRoot === absoluteOutput) {
    throw new Error("Staged local marketplace path must remain inside the distribution output");
  }
  const packagedPlugin = path.join(localMarketplaceRoot, "plugins/navi");
  await fs.mkdir(path.dirname(packagedPlugin), { recursive: true });
  await fs.cp(pluginRoot, packagedPlugin, {
    recursive: true,
    errorOnExist: true,
    force: false,
  });

  await writeJson(
    path.join(localMarketplaceRoot, ".agents/plugins/marketplace.json"),
    renderLocalMarketplace(),
  );
  const remoteMarketplacePath = path.join(
    absoluteOutput,
    "navi-source.marketplace.json",
  );
  await writeJson(remoteMarketplacePath, renderRemoteMarketplace(releaseTag));
  const manifestPath = path.join(absoluteOutput, "distribution-manifest.json");
  await writeJson(manifestPath, {
    version: manifest.version,
    releaseTag,
    plugin: "navi",
    marketplace: "navi-source",
    pluginPath: "plugins/navi",
  });

  return {
    version: manifest.version,
    releaseTag,
    localMarketplaceRoot,
    remoteMarketplacePath,
    manifestPath,
  };
}

function parseArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!value || (key !== "--output" && key !== "--release-tag")) {
      throw new Error(
        "Usage: node scripts/stage-plugin-distribution.mjs --output PATH --release-tag TAG",
      );
    }
    options[key === "--output" ? "outputDir" : "releaseTag"] = value;
  }
  if (!options.outputDir || !options.releaseTag) {
    throw new Error(
      "Usage: node scripts/stage-plugin-distribution.mjs --output PATH --release-tag TAG",
    );
  }
  return options;
}

const direct = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const result = await stageDistribution(parseArgs(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
