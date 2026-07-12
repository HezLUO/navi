import { createHash } from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { applyAgentsTransaction, inspectTransaction, recoverTransaction } from "../../src/cli/navi-transaction";

const roots: string[] = [];
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
async function root() { const value = await fs.mkdtemp(path.join(os.tmpdir(), "navi-transaction-")); roots.push(value); return value; }
const dir = (rootPath: string, id = "test") => path.join(rootPath, `.AGENTS.md.navi-transaction-${id}`);
async function transaction(rootPath: string, input: Record<string, unknown>, id = "test") {
  const transactionDir = dir(rootPath, id); await fs.mkdir(transactionDir, { mode: 0o700 });
  await fs.writeFile(path.join(transactionDir, "manifest.json"), JSON.stringify({ version: 1, id, pid: 99, target: "AGENTS.md", stage: "backed-up", createdAt: "2026-07-13T00:00:00.000Z", ...input }));
  return transactionDir;
}
afterEach(async () => { await Promise.all(roots.splice(0).map((value) => fs.rm(value, { recursive: true, force: true }))); });

describe("Navi cooperative global transactions", () => {
  it.each([
    { id: "other-than-directory-id" }, { target: "user-notes.md" }, { pid: 0 }, { version: 2 },
    { stageFile: "user-notes.md" }, { backupFile: "user-notes.md" },
  ])("rejects manifest mutations without touching third-party files: %j", async (mutation) => {
    const rootPath = await root(); await fs.writeFile(path.join(rootPath, "user-notes.md"), "KEEP");
    await transaction(rootPath, { operation: "create", desiredHash: sha("desired"), ...mutation });
    const inspection = await inspectTransaction(rootPath, { isProcessAlive: async () => false });
    expect(inspection.kind).toBe("conflict");
    await expect(fs.readFile(path.join(rootPath, "user-notes.md"), "utf8")).resolves.toBe("KEEP");
  });

  it("rejects symlinked transaction directories and mismatched directory IDs", async () => {
    const rootPath = await root(); const outside = path.join(rootPath, "outside"); await fs.mkdir(outside);
    await fs.symlink(outside, dir(rootPath));
    await expect(inspectTransaction(rootPath)).resolves.toMatchObject({ kind: "conflict" });
    await fs.rm(dir(rootPath)); await transaction(rootPath, { operation: "create", desiredHash: sha("desired") }, "other");
    await fs.rename(dir(rootPath, "other"), dir(rootPath));
    await expect(inspectTransaction(rootPath, { isProcessAlive: async () => false })).resolves.toMatchObject({ kind: "conflict" });
  });

  it.each([
    ["create", "missing", "prepared", "cleanup"], ["create", "desired", "published", "cleanup"], ["create", "third-party", "published", "conflict"],
    ["modify", "expected", "prepared", "cleanup"], ["modify", "missing", "backed-up", "restore"], ["modify", "desired", "published", "cleanup"], ["modify", "third-party", "published", "conflict"],
    ["remove", "expected", "prepared", "cleanup"], ["remove", "missing", "published", "cleanup"], ["remove", "third-party", "published", "conflict"],
  ] as const)("uses the operation-specific recovery matrix: %s %s %s", async (operation, targetState, stage, result) => {
    const rootPath = await root(); const tx = await transaction(rootPath, { operation, stage, ...(operation === "create" ? { desiredHash: sha("desired") } : { expectedHash: sha("expected"), ...(operation === "modify" ? { desiredHash: sha("desired") } : {}) }) });
    if (operation !== "create") await fs.writeFile(path.join(tx, "backup"), "expected");
    if (operation !== "remove") await fs.writeFile(path.join(tx, "stage"), "desired");
    if (targetState !== "missing") await fs.writeFile(path.join(rootPath, "AGENTS.md"), targetState === "expected" ? "expected" : targetState === "desired" ? "desired" : "third-party");
    const inspection = await inspectTransaction(rootPath, { isProcessAlive: async () => false });
    expect(inspection.kind).toBe(result === "conflict" ? "conflict" : result === "restore" ? "recoverable-restore" : "recoverable-cleanup");
    if (inspection.kind === "recoverable-restore" || inspection.kind === "recoverable-cleanup") await recoverTransaction(rootPath, inspection);
    if (operation === "remove" && stage === "published" && result === "cleanup") await expect(fs.access(path.join(rootPath, "AGENTS.md"))).rejects.toThrow();
  });

  it("does not replace a target that appears during cooperative create publication", async () => {
    const rootPath = await root();
    await expect(applyAgentsTransaction({ root: rootPath, operation: "create", desiredContent: "desired", id: "create", dependencies: { checkpoint: async (name, paths) => { if (name === "before-publish") await fs.writeFile(paths.targetPath, "concurrent"); } } })).rejects.toThrow();
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("concurrent");
    expect((await inspectTransaction(rootPath, { isProcessAlive: async () => false })).kind).toBe("conflict");
  });

  it("restores only with no-replace during a cooperative concurrent edit", async () => {
    const rootPath = await root(); const tx = await transaction(rootPath, { operation: "modify", expectedHash: sha("approved-old-content"), desiredHash: sha("desired"), stage: "backed-up" });
    await fs.writeFile(path.join(tx, "backup"), "approved-old-content"); await fs.writeFile(path.join(tx, "stage"), "desired"); await fs.writeFile(path.join(rootPath, "AGENTS.md"), "concurrent");
    expect((await inspectTransaction(rootPath, { isProcessAlive: async () => false })).kind).toBe("conflict");
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("concurrent");
  });

  it("preserves cooperative concurrent edits at transaction checkpoints", async () => {
    const rootPath = await root(); await fs.writeFile(path.join(rootPath, "AGENTS.md"), "approved-old-content");
    const checkpoints: string[] = [];
    await expect(applyAgentsTransaction({ root: rootPath, operation: "modify", expectedContent: "approved-old-content", desiredContent: "desired", id: "after-publish", dependencies: { checkpoint: async (name, p) => { checkpoints.push(name); if (name === "after-publish") await fs.writeFile(p.targetPath, "concurrent"); } } })).rejects.toThrow(/changed after publication/i);
    expect(checkpoints).toEqual(["after-plan-verification", "after-backup-move", "before-publish", "after-publish", "before-cleanup"]);
    await expect(fs.readFile(path.join(rootPath, "AGENTS.md"), "utf8")).resolves.toBe("concurrent");
    await expect(fs.readFile(path.join(dir(rootPath, "after-publish"), "backup"), "utf8")).resolves.toBe("approved-old-content");
    expect((await fs.stat(dir(rootPath, "after-publish"))).mode & 0o777).toBe(0o700);
    expect((await inspectTransaction(rootPath, { isProcessAlive: async () => false })).kind).toBe("conflict");
  });
});
