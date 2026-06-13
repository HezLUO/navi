import { describe, expect, it } from "vitest";
import {
  buildSharedDeskModel,
  type ConductorSnapshotInput,
  type OpenThreadInput,
} from "../../src/web/shared-desk-model";

function thread(overrides: Partial<OpenThreadInput> = {}): OpenThreadInput {
  return {
    id: "thread-1",
    title: "Product feeling before capability expansion",
    status: "open",
    whyItMatters: "This decides whether Along becomes a generic agent competitor.",
    currentJudgment: "Tighten product expression before Hermes.",
    risks: [],
    evidence: [],
    ...overrides,
  };
}

function snapshot(overrides: Partial<ConductorSnapshotInput> = {}): ConductorSnapshotInput {
  return {
    threads: [
      thread({ id: "main", title: "Main candidate", status: "needs_user" }),
      thread({ id: "watch-1", title: "Watch self-initiation", status: "delegated" }),
      thread({ id: "watch-2", title: "Watch companionship", status: "open" }),
      thread({ id: "extra", title: "Extra thread", status: "open" }),
    ],
    attention: [
      { threadId: "main", action: "intervention", score: 11, reasons: ["changed judgment"] },
      { threadId: "watch-1", action: "read_only_delegation", score: 8, reasons: ["evidence gap"] },
      { threadId: "watch-2", action: "thread_update", score: 4, reasons: ["watching nearby concern"] },
      { threadId: "extra", action: "thread_update", score: 3, reasons: ["lower signal"] },
    ],
    delegations: [
      {
        id: "delegation-1",
        threadId: "main",
        target: "codex",
        status: "requested",
        reason: "Read-only review can reduce uncertainty.",
        scope: [".along", "docs", "src", "tests"],
        forbiddenActions: [
          "Do not modify files.",
          "Do not create commits.",
          "Do not push branches.",
        ],
      },
    ],
    preferences: { delegationModeLabel: "read_only_auto", projectWritePermission: false },
    ...overrides,
  };
}

describe("buildSharedDeskModel", () => {
  it("selects one main thread and at most two watch threads", () => {
    const model = buildSharedDeskModel({ conductor: snapshot() });

    expect(model.mode).toBe("active");
    expect(model.mainThread?.id).toBe("main");
    expect(model.watchThreads.map((item) => item.id)).toEqual(["watch-1", "watch-2"]);
    expect(model.watchThreads).toHaveLength(2);
  });

  it("qualifies watch threads by status before attention action", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot({
        threads: [
          thread({ id: "main", title: "Main candidate", status: "needs_user" }),
          thread({ id: "delegated-silent", title: "Delegated silent", status: "delegated" }),
          thread({ id: "open-silent", title: "Open silent", status: "open" }),
          thread({ id: "open-low-score", title: "Open low score", status: "open" }),
        ],
        attention: [
          { threadId: "main", action: "intervention", score: 11, reasons: ["changed judgment"] },
          { threadId: "delegated-silent", action: "silent", score: 0, reasons: [] },
          { threadId: "open-silent", action: "silent", score: 9, reasons: [] },
          { threadId: "open-low-score", action: "thread_update", score: 2, reasons: [] },
        ],
        delegations: [],
      }),
    });

    expect(model.watchThreads.map((item) => item.id)).toEqual(["delegated-silent"]);
  });

  it("attaches the matching read-only delegation to the main thread", () => {
    const model = buildSharedDeskModel({ conductor: snapshot() });

    expect(model.mainThread?.delegation?.target).toBe("codex");
    expect(model.mainThread?.delegation?.status).toBe("requested");
    expect(model.mainThread?.delegation?.forbiddenActions).toContain("Do not modify files.");
  });

  it("returns quiet state when no thread has enough signal", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot({
        threads: [thread({ id: "quiet", status: "open", evidence: [], risks: [] })],
        attention: [{ threadId: "quiet", action: "silent", score: 0, reasons: [] }],
        delegations: [],
      }),
    });

    expect(model.mode).toBe("quiet");
    expect(model.mainThread).toBeUndefined();
    expect(model.watchThreads).toEqual([]);
    expect(model.quietMessage).toBe("I'm here. I do not see a thread worth interrupting you for right now.");
  });

  it("lets a user force a watch thread to become main", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot(),
      overrides: { forcedMainThreadId: "watch-1", hiddenThreadIds: [], notNowThreadIds: [] },
    });

    expect(model.mainThread?.id).toBe("watch-1");
    expect(model.mainThread?.selectionReason).toContain("You asked Along to focus here");
    expect(model.watchThreads.map((item) => item.id)).toEqual(["main", "watch-2"]);
  });

  it("hides and suppresses user-dismissed threads", () => {
    const model = buildSharedDeskModel({
      conductor: snapshot(),
      overrides: {
        forcedMainThreadId: undefined,
        hiddenThreadIds: ["main"],
        notNowThreadIds: ["watch-1"],
      },
    });

    expect(model.mainThread?.id).toBe("watch-2");
    expect(model.visibleThreads.map((item) => item.id)).not.toContain("main");
    expect(model.visibleThreads.map((item) => item.id)).not.toContain("watch-1");
  });
});
