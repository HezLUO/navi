import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AlongRuntime } from "../../src/core/runtime";
import { getRuntimeDoctorReport } from "../../src/core/doctor";
import { getCurrentSessionPath } from "../../src/core/paths";

describe("runtime Doctor", () => {
  it("reports lifecycle, profile, permissions, review items, and storage mode", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-doctor-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    await runtime.wrapUp("Doctor should see this candidate.");

    const report = await getRuntimeDoctorReport(repo);
    expect(report.lifecycleState).toBe("wrapped");
    expect(report.effectiveProfile.runtimeMode).toBe("companion");
    expect(report.permissionEnvelope.canModifyProjectFiles).toBe(false);
    expect(report.pendingReviewItems).toHaveLength(1);
    expect(report.storageMode).toBe("writable");
  });

  it("does not mutate the current session pointer while reporting", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-doctor-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();

    const pointerPath = getCurrentSessionPath(repo);
    const before = await fs.readFile(pointerPath, "utf8");
    await getRuntimeDoctorReport(repo);
    const after = await fs.readFile(pointerPath, "utf8");

    expect(after).toBe(before);
  });
});
