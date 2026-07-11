import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  applyAgentsTransaction,
  inspectTransaction,
  recoverTransaction,
} from "../../src/cli/navi-transaction";

const roots: string[] = [];

async function root(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "navi-transaction-"));
  roots.push(directory);
  return directory;
}

async function record(rootPath: string, input: Record<string, unknown>): Promise<void> {
  await fs.writeFile(
    path.join(rootPath, ".AGENTS.md.navi-transaction-test.json"),
    JSON.stringify({ id: "test", target: "AGENTS.md", stage: "backed-up", createdAt: "2026-07-11T00:00:00.000Z", ...input }),
  );
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })));
});

describe("Navi global transactions", () => {
  it("creates only when AGENTS.md remains absent", async () => {
    const rootPath = await root();
    await applyAgentsTransaction({ root: rootPath, operation: "create", desiredContent: "desired", id: "create" });
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("desired");

    await expect(applyAgentsTransaction({ root: rootPath, operation: "create", desiredContent: "other", id: "again" })).rejects.toThrow(/exists|changed|conflict/i);
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("desired");
  });

  it.each(["modify", "remove"] as const)("rejects %s when approved bytes changed", async (operation) => {
    const rootPath = await root();
    await fs.writeFile(path.join(rootPath, "AGENTS.md"), "changed");

    await expect(applyAgentsTransaction({ root: rootPath, operation, expectedContent: "expected", desiredContent: "desired", id: operation })).rejects.toThrow(/changed|expected/i);
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("changed");
  });

  it("classifies an interrupted modification as recoverable and restores its backup", async () => {
    const rootPath = await root();
    const backup = ".AGENTS.md.navi-backup-test";
    await fs.writeFile(path.join(rootPath, backup), "old");
    await record(rootPath, { operation: "modify", backupFile: backup, expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4", desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b" });

    const inspection = await inspectTransaction(rootPath);
    expect(inspection.kind).toBe("recoverable-restore");
    if (inspection.kind !== "recoverable-restore") throw new Error("expected recovery");
    await recoverTransaction(rootPath, inspection);

    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("old");
    await expect(inspectTransaction(rootPath)).resolves.toMatchObject({ kind: "none" });
  });

  it("cleans an already-published transaction only when target and backup hashes match", async () => {
    const rootPath = await root();
    const backup = ".AGENTS.md.navi-backup-test";
    await fs.writeFile(path.join(rootPath, "AGENTS.md"), "desired");
    await fs.writeFile(path.join(rootPath, backup), "old");
    await record(rootPath, { operation: "modify", backupFile: backup, expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4", desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b" });

    const inspection = await inspectTransaction(rootPath);
    expect(inspection.kind).toBe("recoverable-cleanup");
    if (inspection.kind !== "recoverable-cleanup") throw new Error("expected cleanup");
    await recoverTransaction(rootPath, inspection);

    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("desired");
    await expect(inspectTransaction(rootPath)).resolves.toMatchObject({ kind: "none" });
  });

  it("preserves unexpected recovery content and refuses a live lock", async () => {
    const rootPath = await root();
    const backup = ".AGENTS.md.navi-backup-test";
    await fs.writeFile(path.join(rootPath, "AGENTS.md"), "third-party");
    await fs.writeFile(path.join(rootPath, backup), "old");
    await record(rootPath, { operation: "modify", backupFile: backup, expectedHash: "cba06b5736faf67e54b07b561eae94395e774c517a7d910a54369e1263ccfbd4", desiredHash: "b60b935389f7cf68e7877a80a4ded0dfc93e248b8807932536e1de0f771d259b" });
    await expect(inspectTransaction(rootPath)).resolves.toMatchObject({ kind: "conflict" });

    const locked = await root();
    await fs.writeFile(path.join(locked, ".AGENTS.md.navi-lock"), "lock");
    await expect(inspectTransaction(locked)).resolves.toMatchObject({ kind: "live-lock" });
  });

  it("rejects symlinked transaction artifacts", async () => {
    const rootPath = await root();
    const outside = path.join(rootPath, "outside");
    await fs.writeFile(outside, "outside");
    await fs.symlink(outside, path.join(rootPath, ".AGENTS.md.navi-lock"));

    await expect(inspectTransaction(rootPath)).rejects.toThrow(/symlink/i);
  });

  it("does not remove a stage file it did not create after an exclusive-create collision", async () => {
    const rootPath = await root();
    const stage = path.join(rootPath, ".AGENTS.md.navi-stage-collision");
    await fs.writeFile(stage, "another invocation");

    await expect(applyAgentsTransaction({ root: rootPath, operation: "create", desiredContent: "desired", id: "collision" })).rejects.toThrow(/exist/i);

    await expect(fs.readFile(stage, "utf8")).resolves.toBe("another invocation");
    await expect(fs.access(path.join(rootPath, ".AGENTS.md.navi-lock"))).rejects.toThrow();
  });
});
