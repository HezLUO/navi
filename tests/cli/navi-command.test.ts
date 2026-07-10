import { describe, expect, it, vi } from "vitest";
import { NAVI_USAGE, runNaviCli } from "../../src/cli/navi";

describe("Navi command dispatcher", () => {
  it("dispatches init without exposing the Along runtime", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const runInit = vi.fn(async () => 0);

    const code = await runNaviCli(["init", "--target", "/tmp/demo"], {
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
      runInit,
    });

    expect(code).toBe(0);
    expect(runInit).toHaveBeenCalledWith(["--target", "/tmp/demo"]);
    expect(stdout.join("")).toBe("");
    expect(stderr.join("")).toBe("");
  });

  it("shows Navi usage instead of starting Along when no command is given", async () => {
    const stderr: string[] = [];

    const code = await runNaviCli([], {
      stdout: () => undefined,
      stderr: (text) => stderr.push(text),
      runInit: async () => 0,
    });

    expect(code).toBe(1);
    expect(stderr.join("")).toContain(NAVI_USAGE);
    expect(stderr.join("")).not.toContain("along start");
  });
});
