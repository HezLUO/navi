import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderLocalMarketplace,
  renderRemoteMarketplace,
  stageDistribution,
} from "../../scripts/stage-plugin-distribution.mjs";

const roots = new Set<string>();
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

afterEach(async () => {
  await Promise.all([...roots].map((root) => fs.rm(root, { recursive: true, force: true })));
  roots.clear();
});

describe("Navi Distribution staging", () => {
  it("renders stable local and immutable remote marketplace identities", () => {
    expect(renderLocalMarketplace()).toMatchObject({
      name: "navi-source",
      interface: { displayName: "Navi Releases" },
      plugins: [{
        name: "navi",
        source: { source: "local", path: "./plugins/navi" },
      }],
    });
    expect(renderRemoteMarketplace("v0.1.0")).toMatchObject({
      name: "navi-source",
      interface: { displayName: "Navi Releases" },
      plugins: [{
        name: "navi",
        source: {
          source: "git-subdir",
          url: "https://github.com/HezLUO/navi.git",
          path: "./plugins/navi",
          ref: "v0.1.0",
        },
      }],
    });
    expect(JSON.stringify(renderRemoteMarketplace("v0.1.0"))).not.toContain('"ref":"main"');
    expect(() => renderRemoteMarketplace("main")).toThrow(/immutable release tag/i);
  });

  it.each([
    "v1.2.3-01",
    "v1.2.3-alpha.01",
  ])("rejects numeric prerelease identifiers with leading zeros: %s", (releaseTag) => {
    expect(() => renderRemoteMarketplace(releaseTag)).toThrow(/immutable release tag/i);
  });

  it("accepts a valid numeric prerelease identifier", () => {
    expect(renderRemoteMarketplace("v1.2.3-alpha.1")).toMatchObject({
      plugins: [{
        source: { ref: "v1.2.3-alpha.1" },
      }],
    });
  });

  it("stages one local marketplace from the exact packaged plugin bytes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const outputDir = path.join(root, "stage");

    const result = await stageDistribution({
      repoRoot,
      outputDir,
      releaseTag: "v0.1.0",
    });

    const localRoot = path.join(outputDir, "navi-0.1.0");
    expect(result).toEqual({
      version: "0.1.0",
      releaseTag: "v0.1.0",
      localMarketplaceRoot: localRoot,
      remoteMarketplacePath: path.join(outputDir, "navi-source.marketplace.json"),
      manifestPath: path.join(outputDir, "distribution-manifest.json"),
    });
    expect(JSON.parse(await fs.readFile(
      path.join(localRoot, ".agents/plugins/marketplace.json"),
      "utf8",
    ))).toEqual(renderLocalMarketplace());
    expect(await fs.readFile(
      path.join(localRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
    )).toEqual(await fs.readFile(
      path.join(repoRoot, "plugins/navi/skills/navi/scripts/navi-project-init.mjs"),
    ));
    await expect(fs.access(path.join(localRoot, "node_modules"))).rejects.toThrow();
    await expect(fs.access(path.join(localRoot, "src"))).rejects.toThrow();
    await expect(fs.access(path.join(localRoot, "work"))).rejects.toThrow();
  });

  it("rejects version drift and an existing output directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    await expect(stageDistribution({
      repoRoot,
      outputDir: path.join(root, "wrong-version"),
      releaseTag: "v9.9.9",
    })).rejects.toThrow(/manifest version 0\.1\.0/i);

    const existing = path.join(root, "existing");
    await fs.mkdir(existing);
    await expect(stageDistribution({
      repoRoot,
      outputDir: existing,
      releaseTag: "v0.1.0",
    })).rejects.toThrow(/already exists/i);
  });

  it("refuses a symlink anywhere in the source plugin tree", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const fakeRepo = path.join(root, "repo");
    const fakePlugin = path.join(fakeRepo, "plugins/navi");
    await fs.mkdir(path.dirname(fakePlugin), { recursive: true });
    await fs.cp(path.join(repoRoot, "plugins/navi"), fakePlugin, { recursive: true });
    await fs.symlink("README.md", path.join(fakePlugin, "linked-readme.md"));

    await expect(stageDistribution({
      repoRoot: fakeRepo,
      outputDir: path.join(root, "stage"),
      releaseTag: "v0.1.0",
    })).rejects.toThrow(/contains a symlink/i);
  });

  it("rejects a manifest version that could escape the output directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const fakeRepo = path.join(root, "repo");
    const fakePlugin = path.join(fakeRepo, "plugins/navi");
    await fs.mkdir(path.dirname(fakePlugin), { recursive: true });
    await fs.cp(path.join(repoRoot, "plugins/navi"), fakePlugin, { recursive: true });
    const manifestPath = path.join(fakePlugin, ".codex-plugin/plugin.json");
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
    const unsafeVersion = "0.1.0/../../../escaped-by-version";
    await fs.writeFile(manifestPath, `${JSON.stringify({
      ...manifest,
      version: unsafeVersion,
    }, null, 2)}\n`);

    await expect(stageDistribution({
      repoRoot: fakeRepo,
      outputDir: path.join(root, "stage"),
      releaseTag: `v${unsafeVersion}`,
    })).rejects.toThrow(/manifest version[\s\S]*semantic version/i);
    await expect(fs.access(path.join(root, "escaped-by-version"))).rejects.toThrow();
  });

  it("rejects an output path whose physical ancestor enters the source plugin", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const fakeRepo = path.join(root, "repo");
    const fakePlugin = path.join(fakeRepo, "plugins/navi");
    await fs.mkdir(path.dirname(fakePlugin), { recursive: true });
    await fs.cp(path.join(repoRoot, "plugins/navi"), fakePlugin, { recursive: true });
    const outputAlias = path.join(root, "plugin-output-alias");
    await fs.symlink(fakePlugin, outputAlias, "dir");

    await expect(stageDistribution({
      repoRoot: fakeRepo,
      outputDir: path.join(outputAlias, "escaped-stage"),
      releaseTag: "v0.1.0",
    })).rejects.toThrow(/physical output[\s\S]*inside the plugin package/i);
    await expect(fs.access(path.join(fakePlugin, "escaped-stage"))).rejects.toThrow();
  });

  it("treats a dot-dot-prefixed child name as physically inside the plugin", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-distribution-"));
    roots.add(root);
    const fakeRepo = path.join(root, "repo");
    const fakePlugin = path.join(fakeRepo, "plugins/navi");
    await fs.mkdir(path.dirname(fakePlugin), { recursive: true });
    await fs.cp(path.join(repoRoot, "plugins/navi"), fakePlugin, { recursive: true });
    const namedChild = path.join(fakePlugin, "..payload");
    await fs.mkdir(namedChild);
    const outputAlias = path.join(root, "dotdot-name-alias");
    await fs.symlink(namedChild, outputAlias, "dir");

    await expect(stageDistribution({
      repoRoot: fakeRepo,
      outputDir: path.join(outputAlias, "escaped-stage"),
      releaseTag: "v9.9.9",
    })).rejects.toThrow(/physical output[\s\S]*inside the plugin package/i);
    await expect(fs.access(path.join(namedChild, "escaped-stage"))).rejects.toThrow();
  });
});
