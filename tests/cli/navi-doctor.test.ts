import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildNaviDoctorReport, renderNaviDoctorReport, runNaviDoctorCli } from "../../src/cli/navi-doctor";
import { renderGlobalBootstrapBlock } from "../../src/cli/navi-global";
import { NAVI_AGENTS_BLOCK_END, NAVI_AGENTS_BLOCK_START } from "../../src/cli/navi-init";

const tempRoots: string[] = [];
const enabledPlugin = {
  installed: true,
  enabled: true,
  version: "0.1.0",
  sourcePath: "/tmp/personal/along-working-thread",
  raw: "along-working-thread@personal  installed, enabled  0.1.0  /tmp/personal/along-working-thread",
};

interface DoctorFixture {
  root: string;
  codexHome: string;
  projectDir: string;
  packageRoot: string;
  cacheRoot: string;
}

async function makeDoctorFixture(options: { defaultPrompts?: string[] } = {}): Promise<DoctorFixture> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-doctor-"));
  tempRoots.push(root);
  const fixture = {
    root,
    codexHome: path.join(root, "codex-home"),
    projectDir: path.join(root, "project"),
    packageRoot: path.join(root, "package"),
    cacheRoot: path.join(root, "cache"),
  };
  await Promise.all([fs.mkdir(fixture.codexHome), fs.mkdir(fixture.projectDir), fs.mkdir(fixture.packageRoot)]);
  await fs.mkdir(path.join(fixture.packageRoot, ".codex-plugin"));
  await fs.writeFile(
    path.join(fixture.packageRoot, ".codex-plugin", "plugin.json"),
    JSON.stringify({ interface: { defaultPrompt: options.defaultPrompts ?? ["one", "two", "three"] } }),
  );
  return fixture;
}

async function snapshotTree(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  async function visit(directory: string): Promise<void> {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.relative(root, absolutePath);
      if (entry.isDirectory()) await visit(absolutePath);
      else result[relativePath] = await fs.readFile(absolutePath, "utf8");
    }
  }
  await visit(root);
  return result;
}

async function copyPackageToCache(packageRoot: string, cacheRoot: string): Promise<void> {
  await fs.cp(packageRoot, cacheRoot, { recursive: true });
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("Navi doctor", () => {
  it("reports healthy global and project-local setup without writing", async () => {
    const fixture = await makeDoctorFixture();
    await fs.writeFile(path.join(fixture.codexHome, "AGENTS.md"), `${renderGlobalBootstrapBlock()}\n`);
    await fs.writeFile(path.join(fixture.projectDir, "AGENTS.md"), `${NAVI_AGENTS_BLOCK_START}\nlocal\n${NAVI_AGENTS_BLOCK_END}\n`);
    const before = await snapshotTree(fixture.root);

    const report = await buildNaviDoctorReport(
      { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot },
      { inspectPlugin: async () => enabledPlugin },
    );

    expect(report.checks.find((check) => check.id === "plugin")?.status).toBe("pass");
    expect(report.checks.find((check) => check.id === "global-bootstrap")?.status).toBe("pass");
    expect(report.checks.find((check) => check.id === "project-init")?.status).toBe("pass");
    expect(await snapshotTree(fixture.root)).toEqual(before);
  });

  it("reports excessive default prompts as a manifest failure", async () => {
    const fixture = await makeDoctorFixture({ defaultPrompts: ["1", "2", "3", "4"] });
    const report = await buildNaviDoctorReport(
      { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot },
      { inspectPlugin: async () => enabledPlugin },
    );

    expect(report.checks.find((check) => check.id === "manifest")?.status).toBe("fail");
    expect(renderNaviDoctorReport(report)).toContain("defaultPrompt must contain at most 3 entries");
  });

  it("reports a missing or disabled plugin with its smallest repair", async () => {
    const fixture = await makeDoctorFixture();
    const report = await buildNaviDoctorReport(
      { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot },
      { inspectPlugin: async () => ({ installed: true, enabled: false, raw: "disabled" }) },
    );

    expect(report.checks.find((check) => check.id === "plugin")).toMatchObject({
      status: "fail",
      repair: "Install and enable the source-alpha Navi plugin before running navi setup --write.",
    });
  });

  it.each([
    ["missing", undefined],
    ["damaged", "<!-- NAVI:GLOBAL-BOOTSTRAP:START -->\nincomplete"],
  ])("reports a %s global bootstrap", async (_kind, content) => {
    const fixture = await makeDoctorFixture();
    if (content) await fs.writeFile(path.join(fixture.codexHome, "AGENTS.md"), content);
    const report = await buildNaviDoctorReport(
      { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot },
      { inspectPlugin: async () => enabledPlugin },
    );

    expect(report.checks.find((check) => check.id === "global-bootstrap")).toMatchObject({
      status: "fail",
      repair: "Run navi setup, review the preview, then run navi setup --write.",
    });
  });

  it("reports an uninitialized project and accepts an exact initialized marker", async () => {
    const fixture = await makeDoctorFixture();
    const options = { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot };
    const dependencies = { inspectPlugin: async () => enabledPlugin };

    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "project-init")).toMatchObject({
      status: "warn",
      repair: "Run navi init, review the preview, then run navi init --write.",
    });
    await fs.writeFile(path.join(fixture.projectDir, "AGENTS.md"), `${NAVI_AGENTS_BLOCK_START}\nlocal\n${NAVI_AGENTS_BLOCK_END}`);
    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "project-init")?.status).toBe("pass");
  });

  it("reports package-cache drift and a missing cache without crashing", async () => {
    const fixture = await makeDoctorFixture();
    await fs.mkdir(path.join(fixture.cacheRoot, ".codex-plugin"), { recursive: true });
    await fs.writeFile(path.join(fixture.cacheRoot, ".codex-plugin", "plugin.json"), "different");
    const options = {
      codexHome: fixture.codexHome,
      projectDir: fixture.projectDir,
      packageRoot: fixture.packageRoot,
      cacheRoot: fixture.cacheRoot,
    };
    const dependencies = { inspectPlugin: async () => enabledPlugin };

    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("fail");
    await fs.rm(fixture.cacheRoot, { recursive: true });
    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("warn");
  });

  it("treats binary differences and symlinks in the cache as mismatches", async () => {
    const fixture = await makeDoctorFixture();
    await copyPackageToCache(fixture.packageRoot, fixture.cacheRoot);
    await fs.writeFile(path.join(fixture.packageRoot, "binary"), Buffer.from([0x80]));
    await fs.writeFile(path.join(fixture.cacheRoot, "binary"), Buffer.from([0x81]));
    const options = {
      codexHome: fixture.codexHome,
      projectDir: fixture.projectDir,
      packageRoot: fixture.packageRoot,
      cacheRoot: fixture.cacheRoot,
    };
    const dependencies = { inspectPlugin: async () => enabledPlugin };

    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("fail");

    await fs.writeFile(path.join(fixture.cacheRoot, "binary"), Buffer.from([0x80]));
    await fs.symlink(path.join(fixture.packageRoot, "binary"), path.join(fixture.cacheRoot, "linked-binary"));
    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("fail");
  });

  it("treats cache and source root symlinks as cache mismatches without traversing them", async () => {
    const fixture = await makeDoctorFixture();
    const cacheTarget = path.join(fixture.root, "cache-target");
    await copyPackageToCache(fixture.packageRoot, cacheTarget);
    await fs.symlink(cacheTarget, fixture.cacheRoot);
    const options = {
      codexHome: fixture.codexHome,
      projectDir: fixture.projectDir,
      packageRoot: fixture.packageRoot,
      cacheRoot: fixture.cacheRoot,
    };
    const dependencies = { inspectPlugin: async () => enabledPlugin };

    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("fail");

    await fs.unlink(fixture.cacheRoot);
    await copyPackageToCache(cacheTarget, fixture.cacheRoot);
    const packageTarget = path.join(fixture.root, "package-target");
    await fs.rename(fixture.packageRoot, packageTarget);
    await fs.symlink(packageTarget, fixture.packageRoot);
    expect((await buildNaviDoctorReport(options, dependencies)).checks.find((check) => check.id === "package-cache")?.status).toBe("fail");
  });

  it("warns when the cache root is a broken symlink", async () => {
    const fixture = await makeDoctorFixture();
    await fs.symlink(path.join(fixture.root, "missing-cache"), fixture.cacheRoot);

    const report = await buildNaviDoctorReport(
      { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot, cacheRoot: fixture.cacheRoot },
      { inspectPlugin: async () => enabledPlugin },
    );

    expect(report.checks.find((check) => check.id === "package-cache")).toMatchObject({ status: "warn" });
  });

  it("warns when the cache root cannot be read", async () => {
    const fixture = await makeDoctorFixture();
    await copyPackageToCache(fixture.packageRoot, fixture.cacheRoot);
    await fs.chmod(fixture.cacheRoot, 0o000);
    try {
      const report = await buildNaviDoctorReport(
        { codexHome: fixture.codexHome, projectDir: fixture.projectDir, packageRoot: fixture.packageRoot, cacheRoot: fixture.cacheRoot },
        { inspectPlugin: async () => enabledPlugin },
      );

      expect(report.checks.find((check) => check.id === "package-cache")).toMatchObject({ status: "warn" });
    } finally {
      await fs.chmod(fixture.cacheRoot, 0o700);
    }
  });

  it("rejects all doctor command-line options", async () => {
    const stderr: string[] = [];
    const code = await runNaviDoctorCli(["--write"], { stdout: () => undefined, stderr: (text) => stderr.push(text) });

    expect(code).toBe(1);
    expect(stderr.join("")).toContain("Usage: navi doctor");
  });
});
