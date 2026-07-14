import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadRuntimeProfile, derivePermissionEnvelope } from "../../src/core/runtime-profile";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-profile-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

describe("runtime profile", () => {
  it("uses conservative defaults when settings are missing", async () => {
    const repo = await makeRepo();
    const profile = await loadRuntimeProfile(repo);
    expect(profile.memoryMode).toBe("project_reviewed");
    expect(profile.autonomyLevel).toBe("quiet");
    expect(profile.accountabilityLevel).toBe("off");
  });

  it("merges settings without accepting unknown authority", async () => {
    const repo = await makeRepo();
    await fs.mkdir(path.join(repo, ".along"), { recursive: true });
    await fs.writeFile(path.join(repo, ".along", "settings.json"), JSON.stringify({
      runtimeMode: "debug",
      accountabilityLevel: "strict",
      autonomyLevel: "proactive",
      featureFlags: { doctor: true },
    }));

    const profile = await loadRuntimeProfile(repo);
    const permissions = derivePermissionEnvelope(profile);

    expect(profile.runtimeMode).toBe("debug");
    expect(profile.accountabilityLevel).toBe("strict");
    expect(profile.autonomyLevel).toBe("proactive");
    expect(profile.featureFlags.doctor).toBe(true);
    expect(permissions.canShowStatus).toBe(true);
    expect(permissions.canProactivelyMessage).toBe(false);
    expect(permissions.canModifyProjectFiles).toBe(false);
    expect(permissions.requiresReview.globalMemory).toBe(true);
  });

  it("sanitizes invalid settings before returning a profile", async () => {
    const repo = await makeRepo();
    await fs.mkdir(path.join(repo, ".along"), { recursive: true });
    await fs.writeFile(path.join(repo, ".along", "settings.json"), JSON.stringify({
      memoryMode: "global_auto",
      canModifyProjectFiles: true,
      featureFlags: {
        doctor: true,
        unsafe: "yes",
      },
    }));

    const profile = await loadRuntimeProfile(repo);

    expect(profile.featureFlags.doctor).toBe(true);
    expect(profile.featureFlags).not.toHaveProperty("unsafe");
    expect(profile).not.toHaveProperty("canModifyProjectFiles");
    expect(profile.memoryMode).toBe("project_reviewed");
  });
});
