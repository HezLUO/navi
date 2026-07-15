import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  renderNaviCommand,
  resolveNaviInvocationContext,
} from "../../src/cli/navi-invocation";

const roots: string[] = [];

async function fixture(): Promise<{ root: string; cliRoot: string; wrapper: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-invocation-"));
  roots.push(root);
  const cliRoot = path.join(root, "Navi source alpha");
  const wrapper = path.join(cliRoot, "src/cli/navi-bin.mjs");
  await fs.mkdir(path.dirname(wrapper), { recursive: true });
  await fs.writeFile(wrapper, "#!/usr/bin/env node\n");
  await fs.chmod(wrapper, 0o755);
  await fs.writeFile(path.join(cliRoot, "package.json"), JSON.stringify({
    name: "navi",
    bin: { navi: "src/cli/navi-bin.mjs" },
    scripts: { navi: "./src/cli/navi-bin.mjs" },
  }));
  return { root, cliRoot, wrapper };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("Navi invocation resolution", () => {
  it("trusts the first executable PATH candidate when it resolves to this Navi wrapper", async () => {
    const f = await fixture();
    const bin = path.join(f.root, "bin");
    await fs.mkdir(bin);
    await fs.symlink(f.wrapper, path.join(bin, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: bin,
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "pass", commandPrefix: ["navi"] });
    expect(renderNaviCommand(context, ["setup", "--write"])).toBe("navi setup --write");
  });

  it("treats an empty PATH component as the provided current working directory", async () => {
    const f = await fixture();
    await fs.symlink(f.wrapper, path.join(f.root, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: "",
      cwd: f.root,
    });

    expect(context).toMatchObject({
      reachability: "pass",
      commandPrefix: ["navi"],
      pathCandidate: path.join(f.root, "navi"),
    });
  });

  it("treats an undefined PATH as absent rather than as an empty component", async () => {
    const f = await fixture();
    await fs.symlink(f.wrapper, path.join(f.root, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      cwd: f.root,
    });

    expect(context).toMatchObject({
      reachability: "fallback",
      reason: "path-missing",
      commandPrefix: [f.wrapper],
    });
    expect(context.pathCandidate).toBeUndefined();
  });

  it("resolves relative PATH components against the provided current working directory", async () => {
    const f = await fixture();
    const relativeBin = "relative-bin";
    const bin = path.join(f.root, relativeBin);
    await fs.mkdir(bin);
    await fs.symlink(f.wrapper, path.join(bin, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: relativeBin,
      cwd: f.root,
    });

    expect(context).toMatchObject({
      reachability: "pass",
      commandPrefix: ["navi"],
      pathCandidate: path.join(bin, "navi"),
    });
  });

  it("rejects a mismatched first PATH candidate and uses the verified launched entrypoint", async () => {
    const f = await fixture();
    const bin = path.join(f.root, "bin");
    const other = path.join(f.root, "other-navi");
    await fs.mkdir(bin);
    await fs.writeFile(other, "#!/bin/sh\nexit 0\n");
    await fs.chmod(other, 0o755);
    await fs.symlink(other, path.join(bin, "navi"));

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: bin,
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "fallback", reason: "path-mismatch" });
    expect(context.commandPrefix).toEqual([f.wrapper]);
    expect(renderNaviCommand(context, ["doctor"])).toBe(`'${f.wrapper}' doctor`);
  });

  it("uses the verified executable source npm invocation when the launched entrypoint is unknown", async () => {
    const f = await fixture();

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: path.join(f.root, "unknown"),
      envPath: "",
      cwd: f.cliRoot,
      npmLifecycleEvent: "navi",
    });

    expect(context).toMatchObject({
      reachability: "fallback",
      reason: "path-missing",
      commandPrefix: ["npm", "run", "navi", "--"],
    });
    expect(renderNaviCommand(context, ["setup", "--write"])).toBe("npm run navi -- setup --write");
  });

  it("rejects the source npm invocation when its direct script target is not executable", async () => {
    const f = await fixture();
    await fs.chmod(f.wrapper, 0o644);

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: path.join(f.root, "unknown"),
      envPath: path.join(f.root, "missing-bin"),
      cwd: f.cliRoot,
      npmLifecycleEvent: "navi",
    });

    expect(context).toMatchObject({
      reachability: "unavailable",
      reason: "unavailable",
      commandPrefix: undefined,
    });
  });

  it("reports unavailable when no bare, absolute, or verified npm invocation exists", async () => {
    const f = await fixture();
    await fs.chmod(f.wrapper, 0o644);

    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: path.join(f.root, "unknown"),
      envPath: "",
      cwd: f.root,
    });

    expect(context).toMatchObject({ reachability: "unavailable", commandPrefix: undefined });
    expect(renderNaviCommand(context, ["doctor"])).toBeUndefined();
  });

  it("quotes every unsafe POSIX token without executing it", async () => {
    const f = await fixture();
    const context = await resolveNaviInvocationContext({
      cliRoot: f.cliRoot,
      launchedEntrypoint: f.wrapper,
      envPath: "",
      cwd: f.root,
    });

    expect(renderNaviCommand(context, ["init", "--target", "/tmp/James' project"])).toBe(
      `'${f.wrapper}' init --target '/tmp/James'"'"' project'`,
    );
  });
});
