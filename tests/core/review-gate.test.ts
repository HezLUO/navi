import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReviewGate } from "../../src/core/review-gate";

async function makeRepo() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-review-"));
  const repo = path.join(root, "repo");
  await fs.mkdir(repo);
  return repo;
}

const baseInput = {
  kind: "memory_candidate" as const,
  sessionId: "session-1",
  sourceRefs: ["event-1"],
  reason: "Candidate came from wrap-up.",
  riskLevel: "low" as const,
  defaultAction: "keep_as_candidate" as const,
};

describe("ReviewGate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores global and procedural candidates as pending review items", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    await gate.addReviewItem({
      kind: "global_memory_candidate",
      sessionId: "session-1",
      proposedChange: "Remember this across projects.",
      sourceRefs: ["event-1"],
      reason: "User stated a durable preference.",
      riskLevel: "medium",
      defaultAction: "ask",
    });
    await gate.addReviewItem({
      kind: "procedural_memory_candidate",
      sessionId: "session-1",
      proposedChange: "Use a new review procedure.",
      sourceRefs: ["event-2"],
      reason: "The session produced a reusable workflow.",
      riskLevel: "medium",
      defaultAction: "keep_as_candidate",
    });

    const inbox = await gate.readInbox();
    expect(inbox).toHaveLength(2);
    expect(inbox.every((item) => item.status === "pending")).toBe(true);
  });

  it("records rejection so the same candidate can be suppressed", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const item = await gate.addReviewItem({
      kind: "memory_candidate",
      sessionId: "session-1",
      proposedChange: "Remember a rejected fact.",
      sourceRefs: ["event-1"],
      reason: "Candidate came from wrap-up.",
      riskLevel: "low",
      defaultAction: "keep_as_candidate",
    });

    await gate.reject(item.id);
    const inbox = await gate.readInbox();
    expect(inbox.find((entry) => entry.id === item.id)?.status).toBe("rejected");
    expect(await gate.hasRejectedProposal("Remember a rejected fact.")).toBe(true);
  });

  it("returns an existing duplicate candidate without duplicating the inbox", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const input = {
      ...baseInput,
      proposedChange: "Remember one stable preference.",
    };

    const first = await gate.addReviewItem(input);
    const second = await gate.addReviewItem(input);

    expect(second).toEqual(first);
    await expect(gate.readInbox()).resolves.toHaveLength(1);
  });

  it("accepts a review item", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const item = await gate.addReviewItem({
      ...baseInput,
      proposedChange: "Remember an accepted fact.",
    });

    const accepted = await gate.accept(item.id);

    expect(accepted.status).toBe("accepted");
    expect((await gate.readInbox()).find((entry) => entry.id === item.id)?.status).toBe("accepted");
  });

  it("edits the proposed change and marks the item edited", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const item = await gate.addReviewItem({
      ...baseInput,
      proposedChange: "Remember the first draft.",
    });

    const edited = await gate.edit(item.id, "Remember the edited draft.");

    expect(edited).toMatchObject({
      id: item.id,
      proposedChange: "Remember the edited draft.",
      status: "edited",
    });
  });

  it("throws for missing decisions without writing the inbox", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const item = await gate.addReviewItem({
      ...baseInput,
      proposedChange: "Keep this existing item unchanged.",
    });
    const before = await gate.readInbox();
    const renameSpy = vi.spyOn(fs, "rename");

    await expect(gate.accept("missing")).rejects.toThrow("Review item not found: missing");
    await expect(gate.reject("missing")).rejects.toThrow("Review item not found: missing");
    await expect(gate.edit("missing", "Do not write this.")).rejects.toThrow("Review item not found: missing");

    expect(renameSpy).not.toHaveBeenCalled();
    await expect(gate.readInbox()).resolves.toEqual(before);
    expect((await gate.readInbox())[0]).toMatchObject({ id: item.id, status: "pending" });
  });

  it("rejects malformed inbox updates without rewriting the inbox", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const inboxPath = path.join(repo, ".along", "review", "inbox.json");
    const malformed = "{not json";
    await fs.mkdir(path.dirname(inboxPath), { recursive: true });
    await fs.writeFile(inboxPath, malformed);
    const renameSpy = vi.spyOn(fs, "rename");

    await expect(gate.addReviewItem({
      ...baseInput,
      proposedChange: "Do not clobber malformed inbox.",
    })).rejects.toThrow();

    expect(renameSpy).not.toHaveBeenCalled();
    await expect(fs.readFile(inboxPath, "utf8")).resolves.toBe(malformed);
  });

  it("preserves all distinct candidates added concurrently", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const changes = Array.from({ length: 20 }, (_, index) => `Remember concurrent fact ${index}.`);

    await Promise.all(changes.map((proposedChange, index) => (
      gate.addReviewItem({
        ...baseInput,
        proposedChange,
        sourceRefs: [`event-${index}`],
      })
    )));

    const inbox = await gate.readInbox();
    expect(inbox).toHaveLength(changes.length);
    expect(inbox.map((item) => item.proposedChange).sort()).toEqual([...changes].sort());
  });

  it("preserves unrelated items during concurrent status decisions", async () => {
    const repo = await makeRepo();
    const gate = new ReviewGate(repo);
    const first = await gate.addReviewItem({
      ...baseInput,
      proposedChange: "Accept this candidate.",
      sourceRefs: ["event-1"],
    });
    const second = await gate.addReviewItem({
      ...baseInput,
      proposedChange: "Reject this candidate.",
      sourceRefs: ["event-2"],
    });

    await Promise.all([
      gate.accept(first.id),
      gate.reject(second.id),
    ]);

    const inbox = await gate.readInbox();
    expect(inbox.find((item) => item.id === first.id)?.status).toBe("accepted");
    expect(inbox.find((item) => item.id === second.id)?.status).toBe("rejected");
  });
});
