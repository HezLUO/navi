import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { NAVI_USAGE, runNaviCli } from "../../src/cli/navi";

describe("Navi command dispatcher", () => {
  it("runs init when the TypeScript CLI entrypoint is invoked directly by Node", () => {
    const result = spawnSync(process.execPath, ["src/cli/navi.ts", "init", "--target", process.cwd()], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Navi init preview");
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
