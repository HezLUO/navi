import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { NAVI_USAGE, resolveNaviCliRoot, runNaviCli } from "../../src/cli/navi";

describe("Navi command dispatcher", () => {
  it("decodes the CLI root from its module URL", () => {
    expect(resolveNaviCliRoot("file:///Users/james/Codex%20Project/Navi/src/cli/navi.ts")).toBe(
      "/Users/james/Codex Project/Navi",
    );
  });

  it("runs every command through the JavaScript wrapper from an unrelated directory", () => {
    const root = mkdtempSync(path.join(tmpdir(), "navi-wrapper-"));
    const project = path.join(root, "project");
    const codexHome = path.join(root, "codex-home");
    const wrapper = path.resolve(process.cwd(), "src/cli/navi-bin.mjs");
    mkdirSync(project);
    mkdirSync(codexHome);

    try {
      const execute = (args: string[]) => spawnSync(process.execPath, [wrapper, ...args], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, CODEX_HOME: codexHome },
      });
      const init = execute(["init", "--target", project]);
      const setup = execute(["setup"]);
      const doctor = execute(["doctor"]);

      expect(init.status, init.stderr).toBe(1);
      expect(init.stdout).toContain("confirmed Project Map");
      expect(setup.status, setup.stderr).toBe(1);
      expect(setup.stdout).toContain("Navi setup configures global discovery");
      expect(doctor.status).toBe(1);
      expect(doctor.stdout).toContain("[fail] plugin:");

      for (const result of [init, setup, doctor]) {
        expect(result.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
        expect(result.stderr).not.toContain("along start");
      }
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("runs the source-alpha npm command through its executable wrapper from a spaced path", () => {
    const root = mkdtempSync(path.join(tmpdir(), "navi-source-alpha-"));
    const source = path.join(root, "Navi source alpha");
    const project = path.join(root, "project");
    const codexHome = path.join(root, "codex-home");
    const npm = process.platform === "win32" ? "npm.cmd" : "npm";

    mkdirSync(project);
    mkdirSync(codexHome);
    symlinkSync(process.cwd(), source, "dir");

    try {
      const result = spawnSync(npm, ["--prefix", source, "run", "navi", "--", "init", "--target", project], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, CODEX_HOME: codexHome },
      });

      expect(result.status, result.stderr).toBe(1);
      expect(result.stdout).toContain("confirmed Project Map");
      expect(result.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
      expect(result.stderr).not.toContain("along start");
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("dispatches init without exposing the Along runtime", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const runInit = vi.fn(async () => 0);
    const runSetup = vi.fn(async () => 0);
    const runDoctor = vi.fn(async () => 0);

    const code = await runNaviCli(["init", "--target", "/tmp/demo"], {
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
      runInit,
      runSetup,
      runDoctor,
    });

    expect(code).toBe(0);
    expect(runInit).toHaveBeenCalledWith(["--target", "/tmp/demo"]);
    expect(runSetup).not.toHaveBeenCalled();
    expect(runDoctor).not.toHaveBeenCalled();
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toBe("");
  });

  it("shows Navi usage instead of starting Along when no command is given", async () => {
    const stderr: string[] = [];

    const code = await runNaviCli([], {
      stdout: () => undefined,
      stderr: (text) => stderr.push(text),
      runInit: async () => 0,
      runSetup: async () => 0,
      runDoctor: async () => 0,
    });

    expect(code).toBe(1);
    expect(stderr.join("")).toContain(NAVI_USAGE);
    expect(stderr.join("")).not.toContain("along start");
  });

  it("dispatches setup and doctor only to their injected handlers", async () => {
    const runInit = vi.fn(async () => 0);
    const runSetup = vi.fn(async () => 2);
    const runDoctor = vi.fn(async () => 3);
    const io = { stdout: () => undefined, stderr: () => undefined, runInit, runSetup, runDoctor };

    expect(await runNaviCli(["setup", "--write"], io)).toBe(2);
    expect(runSetup).toHaveBeenCalledWith(["--write"]);
    expect(runInit).not.toHaveBeenCalled();
    expect(runDoctor).not.toHaveBeenCalled();

    expect(await runNaviCli(["doctor"], io)).toBe(3);
    expect(runDoctor).toHaveBeenCalledWith([]);
    expect(runInit).not.toHaveBeenCalled();
  });

  it("rejects start without importing or starting Along runtime", async () => {
    const stderr: string[] = [];
    const code = await runNaviCli(["start"], {
      stdout: () => undefined,
      stderr: (text) => stderr.push(text),
      runInit: async () => 0,
      runSetup: async () => 0,
      runDoctor: async () => 0,
    });

    expect(code).toBe(1);
    expect(stderr.join("")).toContain(NAVI_USAGE);
    expect(stderr.join("")).not.toContain("along start");
  });
});
