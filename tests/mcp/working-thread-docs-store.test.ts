import { afterEach, describe, expect, it } from "vitest";
import { link, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWorkingThreadDocsStore } from "../../src/mcp/working-thread-docs-store";

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

    expect(store.workspaceRoot).toBe(path.resolve(workspaceRoot));
    expect(store.recordsDir).toBe(recordsDir);
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

  it("rejects malformed patched results before writing", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-malformed-patch",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
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
    })).rejects.toThrow(/malformed/i);
    await expect(readFile(recordPath, "utf8")).resolves.toBe(validRecord);
  });

  it("rejects stale proposals", async () => {
    const { store } = await createTempStore();

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-store",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-01-01",
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

  it("rejects stale section values before mutating the record", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-stale-section",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
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

  it("rejects writes when a record lock already exists", async () => {
    const { recordsDir, store } = await createTempStore();
    const recordPath = path.join(recordsDir, "store-test-thread.md");
    await writeFile(path.join(recordsDir, "store-test-thread.lock"), "locked");

    await expect(store.applySectionPatchProposal({
      proposalId: "proposal-locked",
      threadId: "store-test-thread",
      baseLastUpdated: "2026-06-22",
      changes: [{
        section: "currentJudgment",
        currentValue: "The store test is running.",
        proposedValue: "This locked patch should not apply.",
        rationale: "Another writer holds the record lock.",
      }],
      confirmationPrompt: "Apply this Working Thread update?",
      riskLevel: "medium",
    })).rejects.toThrow(/lock|concurrent/i);
    await expect(readFile(recordPath, "utf8")).resolves.toBe(validRecord);
  });

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

  it("rejects thread IDs that escape the Working Thread directory", async () => {
    const { store } = await createTempStore();

    await expect(store.readThread("../package")).rejects.toThrow(/invalid thread id/i);
  });
});

async function createTempStore() {
  const workspaceRoot = await mkdtemp(path.join(os.tmpdir(), "working-thread-docs-store-"));
  tempRoots.push(workspaceRoot);
  const recordsDir = path.join(workspaceRoot, "docs/along/working-threads");
  await mkdir(recordsDir, { recursive: true });
  await writeFile(path.join(recordsDir, "store-test-thread.md"), validRecord);

  return {
    recordsDir,
    store: createWorkingThreadDocsStore({ workspaceRoot }),
    workspaceRoot,
  };
}
