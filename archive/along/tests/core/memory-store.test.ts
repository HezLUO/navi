import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MemoryStore } from "../../src/core/memory-store";
import { getGlobalAlongDir, getProjectAlongDir } from "../../src/core/paths";

describe("Along memory paths", () => {
  it("uses .along inside the project", () => {
    expect(getProjectAlongDir("/tmp/demo")).toBe("/tmp/demo/.along");
  });

  it("uses the supplied home directory for global memory", () => {
    expect(getGlobalAlongDir("/Users/example")).toBe("/Users/example/.along");
  });
});

describe("memory store", () => {
  it("initializes readable project and global memory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-memory-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);

    const store = new MemoryStore(repo, home);
    await store.ensureInitialized();

    await expect(fs.readFile(path.join(repo, ".along", "companion.md"), "utf8")).resolves.toContain("Along");
    await expect(fs.readFile(path.join(home, ".along", "companion-profile.md"), "utf8")).resolves.toContain("learns along");
  });

  it("initializes runtime settings with conservative defaults", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-memory-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);

    const store = new MemoryStore(repo, home);
    await store.ensureInitialized();

    const settings = JSON.parse(await fs.readFile(path.join(repo, ".along", "settings.json"), "utf8"));
    expect(settings.memoryMode).toBe("project_reviewed");
    expect(settings.canModifyProjectFiles).toBeUndefined();
  });

  it("does not overwrite existing open thread storage during initialization", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-memory-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);

    const store = new MemoryStore(repo, home);
    await store.ensureInitialized();
    const threadsPath = path.join(repo, ".along", "threads", "open-threads.json");
    const customContent = "[{\"id\":\"custom\"}]\n";
    await fs.writeFile(threadsPath, customContent);

    await store.ensureInitialized();

    await expect(fs.readFile(threadsPath, "utf8")).resolves.toBe(customContent);
  });
});
