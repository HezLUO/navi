import { afterEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { link, lstat, mkdtemp, mkdir, readFile, realpath, rename, rm, symlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import type { WorkingThreadUpdateProposal } from "../../src/core/working-thread-contract";
import { createWorkingThreadDocsStore } from "../../src/mcp/working-thread-docs-store";
import { parseWorkingThreadMarkdown } from "../../src/mcp/working-thread-markdown";
import { buildWorkingThreadBaseVersion } from "../../src/mcp/working-thread-version";

const validRecord = `# Store Test Thread

Status: active
Last updated: 2026-06-22

## Why This Matters

The docs store should preserve Working Thread records.

## Current Judgment

The store test is running.

## Boundary

- Only write under docs/along/working-threads.
- Reject stale proposals.

## Drift Triggers

- A write targets another directory.
- A malformed record is patched.

## Next Likely Move

Apply the docs-backed store patch.

## Last Wrap-Up

Task 2 produced the Markdown parser.

## Open Questions

- Should the user confirm this patch?
`;

const malformedRecord = `# Broken Thread

Status: active
Last updated: 2026-06-22

## Current Judgment

This record is missing required sections.
`;

const misplacedMetadataRecord = `# Misplaced Metadata Thread

## Why This Matters

Status: active
Last updated: 2026-06-22

The metadata lines are section content, not top-level record metadata.

## Current Judgment

This record has all sections but misplaced metadata.

## Boundary

- Reject malformed metadata placement.

## Drift Triggers

- Metadata appears in a section body.

## Next Likely Move

Repair the metadata block.

## Last Wrap-Up

The metadata block was misplaced.

## Open Questions

- Who should repair this record?
`;

const storeTestBaseVersion = getBaseVersion("store-test-thread", validRecord);
const tempRoots: string[] = [];

describe("Working Thread docs store", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, {
      force: true,
      recursive: true,
    })));
  });

  it("requires an explicit workspace root", () => {
    expect(() => createWorkingThreadDocsStore({ workspaceRoot: "" })).toThrow(/workspace/i);
  });

  it("exposes the resolved workspace root and records directory", async () => {
    const { recordsDir, store, workspaceRoot } = await createTempStore();
    const expectedWorkspaceRoot = await realpath(workspaceRoot);

    expect(store.workspaceRoot).toBe(expectedWorkspaceRoot);
    expect(store.recordsDir).toBe(path.join(expectedWorkspaceRoot, "docs/along/working-threads"));
    expect(recordsDir).toBe(store.recordsDir);
  });

  it("rejects a symlinked workspace root", async () => {
    const realWorkspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-real-root-"));
    const symlinkWorkspaceRoot = `${realWorkspaceRoot}-link`;
    tempRoots.push(realWorkspaceRoot, symlinkWorkspaceRoot);
    await symlink(realWorkspaceRoot, symlinkWorkspaceRoot);

    expect(() => createWorkingThreadDocsStore({
      workspaceRoot: symlinkWorkspaceRoot,
    })).toThrow(/symlink|symbolic/i);
  });

  it("rejects workspace roots swapped to symlinks after store creation", async () => {
    const { store, workspaceRoot } = await createTempStore();
    const movedWorkspaceRoot = `${workspaceRoot}-moved`;
    const outsideWorkspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-outside-root-"));
    const outsideRecordsDir = path.join(outsideWorkspaceRoot, "docs/along/working-threads");
    const outsideRecordPath = path.join(outsideRecordsDir, "store-test-thread.md");
    tempRoots.push(movedWorkspaceRoot, outsideWorkspaceRoot);
    await mkdir(outsideRecordsDir, { recursive: true });
    await writeFile(outsideRecordPath, validRecord);
    await rename(workspaceRoot, movedWorkspaceRoot);
    await symlink(outsideWorkspaceRoot, workspaceRoot);

    await expect(store.readThread("store-test-thread")).rejects.toThrow(/symlink|symbolic/i);
    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-root-symlink-swap",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "This write escaped through a swapped workspace root.",
        rationale: "Swapped workspace roots must be rejected.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/symlink|symbolic/i);
    await expect(readFile(outsideRecordPath, "utf8")).resolves.toBe(validRecord);
  });

  it("returns an empty summary list when the records directory is missing", async () => {
    const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-docs-store-"));
    tempRoots.push(workspaceRoot);
    const store = createWorkingThreadDocsStore({ workspaceRoot });

    await expect(store.listSummaries()).resolves.toEqual([]);
  });

  it("lists summaries and reads full records from docs/along/working-threads", async () => {
    const { store } = await createTempStore();

    const summaries = await store.listSummaries();
    const parsed = await store.readThread("store-test-thread");

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      id: "store-test-thread",
      title: "Store Test Thread",
      status: "active",
      needsUserDecision: true,
    });
    expect(parsed.malformed).toBe(false);
    expect(parsed.thread?.currentJudgment).toBe("The store test is running.");
  });

  it("applies confirmed section patches inside the allowed directory", async () => {
    const { recordsDir, store } = await createTempStore();

    const result = await store.applySectionPatchProposal({
      proposalId: "proposal-store",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "The store patch was applied.",
        rationale: "The docs-backed store accepted a confirmed patch.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    });

    const updatedFile = await readFile(path.join(recordsDir, "store-test-thread.md"), "utf8");

    expect(result.thread?.currentJudgment).toBe("The store patch was applied.");
    expect(updatedFile).toContain("The store patch was applied.");
  });

  it("rejects symlinked record files and leaves outside targets unchanged", async () => {
    const { recordsDir, store, workspaceRoot } = await createTempStore();
    const outsideFile = path.join(workspaceRoot, "outside-thread.md");
    await writeFile(outsideFile, validRecord);
    await symlink(outsideFile, path.join(recordsDir, "escape-thread.md"));

    await expect(store.readThread("escape-thread")).rejects.toThrow(/symlink|symbolic/i);
    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-symlink",
      threadId: "escape-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "This write escaped the records directory.",
        rationale: "Symlinked records must be rejected.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/symlink|symbolic/i);
    await expect(readFile(outsideFile, "utf8")).resolves.toBe(validRecord);
  });

  it("rejects hard-linked record files and leaves outside aliases unchanged", async () => {
    const { recordsDir, store, workspaceRoot } = await createTempStore();
    const outsideFile = path.join(workspaceRoot, "outside-hardlink-thread.md");
    await writeFile(outsideFile, validRecord);
    await link(outsideFile, path.join(recordsDir, "hardlink-thread.md"));

    await expect(store.readThread("hardlink-thread")).rejects.toThrow(/link|alias|scope/i);
    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-hardlink",
      threadId: "hardlink-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "This write escaped through a hard link.",
        rationale: "Hard-linked records must be rejected.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/link|alias|scope/i);
    await expect(readFile(outsideFile, "utf8")).resolves.toBe(validRecord);
  });

  it("rejects heading-injected patched results before writing", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-malformed-patch",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: `The injected heading would duplicate a required section.

## Current Judgment

This duplicate heading makes the patched record malformed.`,
        rationale: "Malformed patched records must not be persisted.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/heading/i);
    await expect(readFile(recordPath, "utf8")).resolves.toBe(validRecord);
  });

  it("rejects stale proposals", async () => {
    const { store } = await createTempStore();

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-store",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-01-01",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "The stale patch should not apply.",
        rationale: "The proposal is based on an old record.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    })).rejects.toThrow(/stale/i);
  });

  it("rejects stale base versions even when the patched section still matches", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");
    await writeFile(
      recordPath,
      validRecord.replace(
        "Apply the docs-backed store patch.",
        "This unpatched section changed after proposal creation.",
      ),
    );

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-stale-base-version",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "This stale base-version patch should not apply.",
        rationale: "The proposal is based on old full-record content.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    })).rejects.toThrow(/stale.*base version/i);
    const persisted = await readFile(recordPath, "utf8");
    expect(persisted).toContain("The store test is running.");
    expect(persisted).toContain("This unpatched section changed after proposal creation.");
  });

  it("rejects stale section values before mutating the record", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-stale-section",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "A stale current judgment.",
        proposedValue: "This stale section patch should not apply.",
        rationale: "The proposal is based on stale section content.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    })).rejects.toThrow(/current value/i);
    await expect(readFile(recordPath, "utf8")).resolves.toBe(validRecord);
  });

  it("rejects one of two same-base concurrent writes without lock files", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");
    const lockPath = path.join(recordsDir, "store-test-thread.lock");

    const firstWrite = store.applySectionPatchProposal({
      proposalId: "proposal-concurrent-first",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "The first concurrent patch was applied.",
        rationale: "The first queued writer should win.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    });
    const staleWrite = store.applySectionPatchProposal({
      proposalId: "proposal-concurrent-stale",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "nextLikelyMove",
        currentValue: "Apply the docs-backed store patch.",
        proposedValue: "This stale queued patch should not apply.",
        rationale: "The second queued writer uses the same base content.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    });

    const results = await Promise.allSettled([firstWrite, staleWrite]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(Error);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(/stale|concurrent/i);

    const persisted = await readFile(recordPath, "utf8");
    expect([
      persisted.includes("The first concurrent patch was applied."),
      persisted.includes("This stale queued patch should not apply."),
    ].filter(Boolean)).toHaveLength(1);
    await expect(lstat(lockPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects one of two same-base writes from separate processes", async () => {
    const { recordsDir, workspaceRoot } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");
    const goPath = path.join(workspaceRoot, "go");
    const firstProposalPath = path.join(workspaceRoot, "first-proposal.json");
    const secondProposalPath = path.join(workspaceRoot, "second-proposal.json");
    const firstReadyPath = path.join(workspaceRoot, "first-ready");
    const secondReadyPath = path.join(workspaceRoot, "second-ready");
    const firstResultPath = path.join(workspaceRoot, "first-result.json");
    const secondResultPath = path.join(workspaceRoot, "second-result.json");

    await writeFile(firstProposalPath, JSON.stringify({
      proposalId: "proposal-cross-process-first",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "The first cross-process patch was applied.",
        rationale: "Only one process should commit a same-base proposal.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    } satisfies WorkingThreadUpdateProposal));
    await writeFile(secondProposalPath, JSON.stringify({
      proposalId: "proposal-cross-process-second",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      baseVersion: storeTestBaseVersion,
      changes: [{
        section: "nextLikelyMove",
        currentValue: "Apply the docs-backed store patch.",
        proposedValue: "The second cross-process patch was applied.",
        rationale: "Only one process should commit a same-base proposal.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    } satisfies WorkingThreadUpdateProposal));

    const firstWorker = spawnProposalWorker(
      workspaceRoot,
      firstProposalPath,
      firstReadyPath,
      goPath,
      firstResultPath,
    );
    const secondWorker = spawnProposalWorker(
      workspaceRoot,
      secondProposalPath,
      secondReadyPath,
      goPath,
      secondResultPath,
    );

    await Promise.all([waitForFile(firstReadyPath), waitForFile(secondReadyPath)]);
    await writeFile(goPath, "go\n");

    const [firstExit, secondExit] = await Promise.all([firstWorker.done, secondWorker.done]);
    expect(firstExit).toMatchObject({ code: 0, stderr: "" });
    expect(secondExit).toMatchObject({ code: 0, stderr: "" });

    const results = [
      JSON.parse(await readFile(firstResultPath, "utf8")) as ProposalWorkerResult,
      JSON.parse(await readFile(secondResultPath, "utf8")) as ProposalWorkerResult,
    ];
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.message).toMatch(/stale|concurrent|conflict/i);

    const persisted = await readFile(recordPath, "utf8");
    expect([
      persisted.includes("The first cross-process patch was applied."),
      persisted.includes("The second cross-process patch was applied."),
    ].filter(Boolean)).toHaveLength(1);
  }, 20_000);

  it("rejects malformed record writes", async () => {
    const { recordsDir, store } = await createTempStore();
    await writeFile(path.join(recordsDir, "broken.md"), malformedRecord);

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-broken",
      threadId: "broken",
      baseLastUpdated: "2026-06-22",
      changes: [{
        section: "currentJudgment",
        currentValue: "This record is missing required sections.",
        proposedValue: "This malformed record should not be patched.",
        rationale: "Malformed records require repair before writes.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/malformed/i);
  });

  it("rejects writes when metadata appears only inside a section", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "misplaced-metadata.md");
    await writeFile(recordPath, misplacedMetadataRecord);

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-misplaced-metadata",
      threadId: "misplaced-metadata",
      baseLastUpdated: "2026-06-22",
      changes: [{
        section: "currentJudgment",
        currentValue: "This record has all sections but misplaced metadata.",
        proposedValue: "This malformed metadata record should not be patched.",
        rationale: "Metadata placement must be repaired before write-back.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "high",
    })).rejects.toThrow(/malformed/i);
    await expect(readFile(recordPath, "utf8")).resolves.toBe(misplacedMetadataRecord);
  });

  it("rejects thread IDs that escape the Working Thread directory", async () => {
    const { store } = await createTempStore();

    await expect(store.readThread("../package")).rejects.toThrow(/invalid thread id/i);
  });
});

type ProposalWorkerResult =
  | {
    status: "fulfilled";
    currentJudgment?: string;
    nextLikelyMove?: string;
  }
  | {
    status: "rejected";
    message: string;
  };

async function createTempStore() {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-docs-store-"));
  tempRoots.push(workspaceRoot);
  const recordsDir = path.join(workspaceRoot, "docs/along/working-threads");
  await mkdir(recordsDir, { recursive: true });
  await writeFile(path.join(recordsDir, "store-test-thread.md"), validRecord);
  const store = createWorkingThreadDocsStore({ workspaceRoot });

  return {
    recordsDir: store.recordsDir,
    store,
    workspaceRoot,
  };
}

function getBaseVersion(threadId: string, markdown: string): string {
  const parsed = parseWorkingThreadMarkdown({
    id: threadId,
    sourcePath: `docs/along/working-threads/${threadId}.md`,
    markdown,
  });
  if (!parsed.thread) {
    throw new Error(`Expected valid Working Thread fixture: ${threadId}.`);
  }

  return buildWorkingThreadBaseVersion(parsed.thread);
}

function spawnProposalWorker(
  workspaceRoot: string,
  proposalPath: string,
  readyPath: string,
  goPath: string,
  resultPath: string,
): { done: Promise<{ code: number | null; stderr: string; stdout: string }> } {
  const fixturePath = fileURLToPath(new URL("./fixtures/apply-working-thread-proposal.ts", import.meta.url));
  const child = spawn(process.execPath, [
    "--import",
    "tsx",
    fixturePath,
    workspaceRoot,
    proposalPath,
    readyPath,
    goPath,
    resultPath,
  ], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });

  return {
    done: new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, stderr, stdout }));
    }),
  };
}

async function waitForFile(filePath: string): Promise<void> {
  const startedAt = Date.now();
  for (;;) {
    try {
      await lstat(filePath);
      return;
    } catch {
      if (Date.now() - startedAt > 10_000) {
        throw new Error(`Timed out waiting for file: ${filePath}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}
