import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { EventStore } from "../../src/core/event-store";
import { ScriptedCompanionProvider } from "../../src/core/model-provider";
import { OpenThreadStore } from "../../src/core/open-thread-store";
import { getCurrentSessionPath, getContextPacketPath, getEventsFilePath, getSessionFilePath } from "../../src/core/paths";
import { ReviewGate } from "../../src/core/review-gate";
import { AlongRuntime, formatLocalJournalDate, stateForElapsed } from "../../src/core/runtime";
import { SessionLifecycle } from "../../src/core/session-lifecycle";
import { TraceStore } from "../../src/core/trace-store";
import type { AlongEvent, AlongSession, ContextPacket } from "../../src/core/types";
import { presenceStates } from "../../src/core/types";

async function makeRuntimeWorkspace() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
  return { root, repo, home };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

describe("presence states", () => {
  it("keeps the approved Along workday order", () => {
    expect(presenceStates).toEqual([
      "arriving",
      "settling",
      "quiet_focus",
      "gentle_share",
      "rest",
      "wrap_up",
    ]);
  });
});

describe("scripted companion provider", () => {
  it("creates a small learning plan without acting like a task manager", async () => {
    const provider = new ScriptedCompanionProvider();
    const plan = await provider.createLearningPlan({
      repoName: "demo",
      openCuriosity: "Where do tests begin?",
      readmeHint: "A demo package",
    });
    expect(plan.learningGoal).toContain("tests");
    expect(plan.learningGoal).not.toContain("roadmap");
    expect(plan.currentActivity).toContain("reading");
  });
});

describe("Along runtime", () => {
  it("starts with a bounded curiosity and writes memory on wrap-up", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
    await fs.writeFile(path.join(repo, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    expect(session.state).toBe("arriving");
    expect(session.plan.learningGoal).toContain("understand");

    const wrap = await runtime.wrapUp("I learned where to look first.");
    expect(wrap.journalPath).toContain(".along/journal");
    expect(wrap.remembered).toContain("I learned where to look first.");
    expect(wrap.state).toBe("wrap_up");
    expect(wrap.journalPreview).toContain("I learned where to look first.");
  });

  it("runs conductor heartbeat and delegation ingestion through the current session", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    const threads = new OpenThreadStore(repo);
    await threads.createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });

    const heartbeat = await runtime.conductorHeartbeat("resume");
    const snapshot = await runtime.conductorSnapshot();
    expect(heartbeat.delegations[0]).toMatchObject({ threadId: "thread-1", target: "codex", status: "requested" });
    expect(snapshot.delegations).toHaveLength(1);

    const merge = await runtime.ingestDelegationResult({
      requestId: heartbeat.delegations[0].id,
      threadId: "thread-1",
      target: "codex",
      status: "completed",
      summary: "Doctor API is missing.",
      evidence: ["No doctor endpoint."],
      risks: ["Runtime plan incomplete."],
      recommendations: ["Finish Doctor."],
      confidence: "high",
      completedAt: "2026-06-12T00:05:00.000Z",
    });

    const [thread] = await threads.readAll();
    expect(merge.shouldNotifyUser).toBe(true);
    expect(thread.status).toBe("needs_user");
    expect(thread.currentJudgment).toContain("Doctor API is missing.");
  });

  it("rejects conductor heartbeat after the current session is wrapped", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    await new OpenThreadStore(repo).createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    await runtime.wrapUp("I learned runtime conductor heartbeat should stop after wrap-up.");

    await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
      "Cannot run conductor heartbeat after session wrap-up.",
    );
    await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
  });

  it("rejects conductor heartbeat while the current session is paused", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    await new OpenThreadStore(repo).createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    await runtime.pause();

    await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
      "Cannot run conductor heartbeat unless current session is active.",
    );
    await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
  });

  it("rejects conductor heartbeat after a paused session is recovered by current", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    await new OpenThreadStore(repo).createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    await runtime.pause();
    await runtime.current();

    await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
      "Cannot run conductor heartbeat unless current session is active.",
    );
    await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
    const traces = await new TraceStore(repo).readTraces(session.id);
    expect(traces.some((trace) => trace.operation === "conductorHeartbeat")).toBe(false);
  });

  it("rejects conductor heartbeat if pause lands between lifecycle check and current recovery", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    await new OpenThreadStore(repo).createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    const lifecycle = (runtime as unknown as { lifecycle: SessionLifecycle }).lifecycle;
    const originalCurrentLifecycleState = lifecycle.currentLifecycleState.bind(lifecycle);
    let pausedAfterPrecheck = false;
    const lifecycleState = vi.spyOn(lifecycle, "currentLifecycleState").mockImplementation(async () => {
      const state = await originalCurrentLifecycleState();
      if (!pausedAfterPrecheck) {
        pausedAfterPrecheck = true;
        await lifecycle.markPaused(session.id);
      }
      return state;
    });

    try {
      await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
        "Cannot run conductor heartbeat unless current session is active.",
      );
    } finally {
      lifecycleState.mockRestore();
    }
    await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
    const traces = await new TraceStore(repo).readTraces(session.id);
    expect(traces.some((trace) => trace.operation === "conductorHeartbeat")).toBe(false);
  });

  it("rejects conductor heartbeat if pause lands after the final lifecycle check before side effects", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    await new OpenThreadStore(repo).createSeedThread({
      id: "thread-1",
      title: "Runtime plan drift",
      whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
      currentJudgment: "Runtime implementation may be incomplete.",
    });
    const lifecycle = (runtime as unknown as { lifecycle: SessionLifecycle }).lifecycle;
    const originalCurrentLifecycleState = lifecycle.currentLifecycleState.bind(lifecycle);
    let lifecycleChecks = 0;
    const lifecycleState = vi.spyOn(lifecycle, "currentLifecycleState").mockImplementation(async () => {
      lifecycleChecks += 1;
      const state = await originalCurrentLifecycleState();
      if (lifecycleChecks === 2) await lifecycle.markPaused(session.id);
      return state;
    });

    try {
      await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
        "Cannot run conductor heartbeat unless current session is active.",
      );
    } finally {
      lifecycleState.mockRestore();
    }
    await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
    const traces = await new TraceStore(repo).readTraces(session.id);
    expect(traces.some((trace) => trace.operation === "conductorHeartbeat")).toBe(false);
  });

  it("rejects conductor heartbeat if durable current switches after session recovery", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      await new OpenThreadStore(repo).createSeedThread({
        id: "thread-1",
        title: "Runtime plan drift",
        whyItMatters: "Along should not proceed to Memory v2 before runtime foundations are done.",
        currentJudgment: "Runtime implementation may be incomplete.",
      });
      const lifecycle = (runtime as unknown as { lifecycle: SessionLifecycle }).lifecycle;
      const originalCurrentLifecycleState = lifecycle.currentLifecycleState.bind(lifecycle);
      const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      let switchedSession: AlongSession | undefined;
      let lifecycleChecks = 0;
      const lifecycleState = vi.spyOn(lifecycle, "currentLifecycleState").mockImplementation(async () => {
        lifecycleChecks += 1;
        const state = await originalCurrentLifecycleState();
        if (lifecycleChecks === 2) {
          vi.setSystemTime(new Date("2026-06-03T10:01:00.000Z"));
          switchedSession = await secondRuntime.start();
        }
        return state;
      });

      try {
        await expect(runtime.conductorHeartbeat("resume")).rejects.toThrow(
          "Cannot run conductor heartbeat because current session changed.",
        );
      } finally {
        lifecycleState.mockRestore();
      }
      await expect(runtime.conductorSnapshot()).resolves.toMatchObject({ delegations: [] });
      const firstTraces = await new TraceStore(repo).readTraces(session.id);
      const secondTraces = await new TraceStore(repo).readTraces(switchedSession?.id ?? "missing-session");
      expect(firstTraces.some((trace) => trace.operation === "conductorHeartbeat")).toBe(false);
      expect(secondTraces.some((trace) => trace.operation === "conductorHeartbeat")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("progresses through a bounded rhythm before wrap-up", () => {
    expect(stateForElapsed(0)).toBe("arriving");
    expect(stateForElapsed(4_000)).toBe("settling");
    expect(stateForElapsed(14_000)).toBe("quiet_focus");
    expect(stateForElapsed(31_000)).toBe("gentle_share");
    expect(stateForElapsed(48_000)).toBe("rest");
  });

  it("uses the local timezone date for journal file names", () => {
    const nearUtcMidnight = new Date("2026-05-22T16:30:00.000Z");
    expect(formatLocalJournalDate(nearUtcMidnight, "Asia/Hong_Kong")).toBe("2026-05-23");
    expect(formatLocalJournalDate(nearUtcMidnight, "America/Los_Angeles")).toBe("2026-05-22");
  });

  it("keeps generated folders out of the journal's looked-at list", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    await fs.mkdir(path.join(repo, ".superpowers"));
    await fs.mkdir(path.join(repo, "dist"));
    await fs.mkdir(path.join(repo, "node_modules"));
    await fs.mkdir(path.join(repo, "src"));

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    const wrap = await runtime.wrapUp("I stayed with user-facing project context.");
    const journal = await fs.readFile(wrap.journalPath, "utf8");

    expect(journal).toContain("- src/");
    expect(journal).not.toContain("- .along/");
    expect(journal).not.toContain("- .superpowers/");
    expect(journal).not.toContain("- dist/");
    expect(journal).not.toContain("- node_modules/");
  });

  it("recovers the current session after runtime re-instantiation", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const started = await firstRuntime.start();

    const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const recovered = await secondRuntime.current();
    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const events = await new EventStore(repo).readEvents(started.id);

    expect(recovered?.id).toBe(started.id);
    expect(recovered?.plan.learningGoal).toBe(started.plan.learningGoal);
    expect(pointer).toMatchObject({ sessionId: started.id, state: "recovered" });
    expect(events.some((event) => event.kind === "session_recovered")).toBe(true);
  });

  it("records recovery when durable current session replaces stale in-memory session", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      await firstRuntime.start();

      vi.setSystemTime(new Date("2026-06-03T10:01:00.000Z"));
      const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const secondSession = await secondRuntime.start();

      const recovered = await firstRuntime.current();
      const eventsAfterRecovery = await new EventStore(repo).readEvents(secondSession.id);
      const tracesAfterRecovery = await new TraceStore(repo).readTraces(secondSession.id);
      const recoveryEvents = eventsAfterRecovery.filter((event) => event.kind === "session_recovered");
      const recoveryTraces = tracesAfterRecovery.filter((trace) => trace.operation === "recoverCurrentSession");

      await firstRuntime.current();
      const eventsAfterRepeat = await new EventStore(repo).readEvents(secondSession.id);
      const tracesAfterRepeat = await new TraceStore(repo).readTraces(secondSession.id);

      expect(recovered?.id).toBe(secondSession.id);
      expect(recoveryEvents).toHaveLength(1);
      expect(recoveryTraces).toHaveLength(1);
      expect(eventsAfterRepeat.filter((event) => event.kind === "session_recovered")).toHaveLength(1);
      expect(tracesAfterRepeat.filter((trace) => trace.operation === "recoverCurrentSession")).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("writes runtime events and traces during start and wrap-up", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const wrap = await runtime.wrapUp("Runtime integration wrote a traceable memory candidate.");
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const startEvent = events.find((event) => event.kind === "session_started");
    const wrapEvent = events.find((event) => event.kind === "session_wrapped");
    const startTrace = traces.find((trace) => trace.operation === "startSession");
    const wrapTrace = traces.find((trace) => trace.operation === "wrapUp");

    expect(startEvent?.idempotencyKey).toBe(`session_started:${session.id}`);
    expect(wrapEvent?.payload).toMatchObject({ note: wrap.remembered, journalPath: wrap.journalPath });
    expect(startTrace).toMatchObject({
      operation: "startSession",
      contextPacketId: `context:${session.id}:session_start`,
      outcome: "allowed",
    });
    expect(startTrace?.relatedEventIds).toContain(startEvent?.id);
    expect(wrapTrace).toMatchObject({
      operation: "wrapUp",
      contextPacketId: `context:${session.id}:wrap_up`,
      outcome: "queued",
    });
    expect(wrapTrace?.relatedEventIds).toContain(wrapEvent?.id);
    await expect(readJson<ContextPacket>(getContextPacketPath(repo, `context:${session.id}:session_start`))).resolves.toMatchObject({
      sessionId: session.id,
      purpose: "session_start",
    });
    await expect(readJson<ContextPacket>(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).resolves.toMatchObject({
      sessionId: session.id,
      purpose: "wrap_up",
    });
  });

  it("keeps wrap-up idempotent for repeated requests", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();

    const first = await runtime.wrapUp("I learned the runtime writes through lifecycle.");
    const second = await runtime.wrapUp("This second note should not replace the first.");
    const journal = await fs.readFile(first.journalPath, "utf8");
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);

    expect(second).toEqual(first);
    expect(journal.match(/I learned the runtime writes through lifecycle\./g)).toHaveLength(1);
    expect(journal).not.toContain("This second note should not replace the first.");
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(1);
  });

  it("replays wrap-up idempotently after runtime re-instantiation", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const note = "I learned durable wrap-up replay.";
    const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await firstRuntime.start();
    const first = await firstRuntime.wrapUp(note);
    const firstJournal = await fs.readFile(first.journalPath, "utf8");
    const firstEvents = await new EventStore(repo).readEvents(session.id);
    const firstTraces = await new TraceStore(repo).readTraces(session.id);
    const firstInbox = await new ReviewGate(repo).readInbox();

    const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const second = await secondRuntime.wrapUp(note);
    const secondJournal = await fs.readFile(first.journalPath, "utf8");
    const secondEvents = await new EventStore(repo).readEvents(session.id);
    const secondTraces = await new TraceStore(repo).readTraces(session.id);
    const secondInbox = await new ReviewGate(repo).readInbox();
    const current = await secondRuntime.current();

    expect(second).toEqual(first);
    expect(secondJournal).toBe(firstJournal);
    expect(secondJournal.match(/I learned durable wrap-up replay\./g)).toHaveLength(1);
    expect(secondEvents.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
    expect(secondEvents).toHaveLength(firstEvents.length);
    expect(secondInbox.filter((item) => item.proposedChange === note)).toHaveLength(1);
    expect(secondInbox).toHaveLength(firstInbox.length);
    expect(secondTraces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(1);
    expect(secondTraces).toHaveLength(firstTraces.length);
    expect(current?.state).toBe("wrap_up");
  });

  it("repairs wrap-up artifacts for a lifecycle-wrapped session without side effects", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const note = "I learned wrap-up repair is canonical.";
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    await new SessionLifecycle(repo).markWrapped(session.id);

    const repaired = await new AlongRuntime({ repoPath: repo, homeDir: home }).wrapUp(note);
    const journal = await fs.readFile(repaired.journalPath, "utf8");
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    const context = await readJson<ContextPacket>(getContextPacketPath(repo, `context:${session.id}:wrap_up`));
    const wrapEvent = events.find((event) => event.kind === "session_wrapped");

    expect(repaired).toMatchObject({ remembered: note, state: "wrap_up" });
    expect(journal).toContain(note);
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
    expect(wrapEvent?.payload).toMatchObject({ note, journalPath: repaired.journalPath });
    expect(inbox.filter((item) => item.proposedChange === note)).toHaveLength(1);
    expect(traces.filter((trace) => trace.operation === "wrapUp" && trace.relatedEventIds.includes(wrapEvent?.id ?? ""))).toHaveLength(1);
    expect(context).toMatchObject({ sessionId: session.id, purpose: "wrap_up" });
  });

  it("fails closed when an existing wrap event has incomplete canonical payload", async () => {
    const cases: Array<{ name: string; payload: (journalPath: string) => Record<string, unknown> }> = [
      { name: "missing note", payload: (journalPath) => ({ journalPath }) },
      { name: "invalid note", payload: (journalPath) => ({ note: 42, journalPath }) },
      { name: "missing journalPath", payload: () => ({ note: "Existing malformed note." }) },
      { name: "invalid journalPath", payload: () => ({ note: "Existing malformed note.", journalPath: "relative-journal.md" }) },
    ];

    for (const testCase of cases) {
      const { repo, home } = await makeRuntimeWorkspace();
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      await new SessionLifecycle(repo).markWrapped(session.id);
      const journalPath = path.join(repo, ".along", "journal", `${formatLocalJournalDate()}.md`);
      await new EventStore(repo).recordEvent({
        sessionId: session.id,
        source: "runtime",
        kind: "session_wrapped",
        visibility: "reviewable",
        scope: "session",
        payload: testCase.payload(journalPath),
        provenance: { route: `test.${testCase.name}` },
        memoryEligibility: "candidate",
        riskLevel: "low",
        idempotencyKey: `session_wrapped:${session.id}`,
      });

      await expect(new AlongRuntime({ repoPath: repo, homeDir: home }).wrapUp(`Caller note for ${testCase.name}.`))
        .rejects.toThrow(`Malformed canonical wrap-up event: ${session.id}`);

      const events = await new EventStore(repo).readEvents(session.id);
      const traces = await new TraceStore(repo).readTraces(session.id);
      const inbox = await new ReviewGate(repo).readInbox();
      expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
      expect(await pathExists(journalPath)).toBe(false);
      expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
      expect(inbox).toHaveLength(0);
      expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
    }
  });

  it("does not reference a non-durable wrap event when the idempotency key is malformed", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const key = `session_wrapped:${session.id}`;
    const journalPath = path.join(repo, ".along", "journal", `${formatLocalJournalDate()}.md`);
    await new EventStore(repo).recordEvent({
      sessionId: session.id,
      source: "runtime",
      kind: "session_started",
      visibility: "internal",
      scope: "session",
      payload: { note: "Wrong event owns the wrap key.", journalPath },
      provenance: { route: "test.idempotencyCollision" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: key,
    });

    await expect(runtime.wrapUp("Caller note should not become a non-durable event."))
      .rejects.toThrow(`Malformed canonical wrap-up event: ${session.id}`);

    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    expect(events.filter((event) => event.idempotencyKey === key)).toHaveLength(1);
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(0);
    expect(await pathExists(journalPath)).toBe(false);
    expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
    expect(inbox).toHaveLength(0);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
  });

  it("preflights malformed wrap idempotency state before closing an active session", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const key = `session_wrapped:${session.id}`;
    const journalPath = path.join(repo, ".along", "journal", `${formatLocalJournalDate()}.md`);
    await new EventStore(repo).recordEvent({
      sessionId: session.id,
      source: "runtime",
      kind: "session_started",
      visibility: "internal",
      scope: "session",
      payload: { note: "Wrong event owns the wrap key.", journalPath },
      provenance: { route: "test.preflightCollision" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: key,
    });

    await expect(runtime.wrapUp("This note must not close the session."))
      .rejects.toThrow(`Malformed canonical wrap-up event: ${session.id}`);

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, session.id));
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    expect(pointer).toMatchObject({ sessionId: session.id, state: "active" });
    expect(persisted.state).toBe("arriving");
    expect(persisted.plan.state).toBe("arriving");
    expect(events.filter((event) => event.idempotencyKey === key)).toHaveLength(1);
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(0);
    expect(await pathExists(journalPath)).toBe(false);
    expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
    expect(inbox).toHaveLength(0);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
  });

  it("fails closed when duplicate wrap idempotency events are ambiguous", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const key = `session_wrapped:${session.id}`;
    const journalPath = path.join(repo, ".along", "journal", `${formatLocalJournalDate()}.md`);
    const validEvent = await new EventStore(repo).recordEvent({
      sessionId: session.id,
      source: "runtime",
      kind: "session_wrapped",
      visibility: "reviewable",
      scope: "session",
      payload: { note: "Preexisting valid note.", journalPath },
      provenance: { route: "test.validDuplicate" },
      memoryEligibility: "candidate",
      riskLevel: "low",
      idempotencyKey: key,
    });
    const malformedDuplicate: AlongEvent = {
      ...validEvent,
      id: `${validEvent.id}-malformed`,
      payload: { note: "Malformed duplicate lacks journalPath." },
      provenance: { route: "test.malformedDuplicate" },
    };
    await fs.appendFile(getEventsFilePath(repo, session.id), `${JSON.stringify(malformedDuplicate)}\n`);

    await expect(runtime.wrapUp("This note must not converge ambiguous events."))
      .rejects.toThrow(`Malformed canonical wrap-up event: ${session.id}`);

    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, session.id));
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    expect(pointer).toMatchObject({ sessionId: session.id, state: "active" });
    expect(persisted.state).toBe("arriving");
    expect(persisted.plan.state).toBe("arriving");
    expect(events.filter((event) => event.idempotencyKey === key)).toHaveLength(2);
    expect(await pathExists(journalPath)).toBe(false);
    expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
    expect(inbox).toHaveLength(0);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
  });

  it("does not let stale in-memory current overwrite a wrapped durable session", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await firstRuntime.start();
      const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      await secondRuntime.current();
      await firstRuntime.wrapUp("I learned current must revalidate durable wrap-up.");

      vi.setSystemTime(new Date("2026-06-03T10:00:05.000Z"));
      const current = await secondRuntime.current();
      const persisted = await readJson<AlongSession>(getSessionFilePath(repo, session.id));

      expect(current?.state).toBe("wrap_up");
      expect(persisted.state).toBe("wrap_up");
      expect(persisted.plan.state).toBe("wrap_up");
    } finally {
      vi.useRealTimers();
    }
  });

  it("replays wrap-up when another runtime already wrapped a stale recovered session", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const firstNote = "I learned the first recovered runtime owns wrap-up.";
    const secondNote = "This stale recovered runtime should replay the first note.";
    const initialRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await initialRuntime.start();
    const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await firstRuntime.current();
    await secondRuntime.current();

    const first = await firstRuntime.wrapUp(firstNote);
    const firstJournal = await fs.readFile(first.journalPath, "utf8");
    const firstEvents = await new EventStore(repo).readEvents(session.id);
    const firstTraces = await new TraceStore(repo).readTraces(session.id);
    const firstInbox = await new ReviewGate(repo).readInbox();
    const firstContext = await fs.readFile(getContextPacketPath(repo, `context:${session.id}:wrap_up`), "utf8");

    const second = await secondRuntime.wrapUp(secondNote);
    const secondJournal = await fs.readFile(first.journalPath, "utf8");
    const secondEvents = await new EventStore(repo).readEvents(session.id);
    const secondTraces = await new TraceStore(repo).readTraces(session.id);
    const secondInbox = await new ReviewGate(repo).readInbox();
    const secondContext = await fs.readFile(getContextPacketPath(repo, `context:${session.id}:wrap_up`), "utf8");

    expect(second).toEqual(first);
    expect(second.remembered).toBe(firstNote);
    expect(secondJournal).toBe(firstJournal);
    expect(secondJournal.match(/I learned the first recovered runtime owns wrap-up\./g)).toHaveLength(1);
    expect(secondJournal).not.toContain(secondNote);
    expect(secondEvents.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
    expect(secondEvents).toHaveLength(firstEvents.length);
    expect(secondInbox.filter((item) => item.proposedChange === firstNote)).toHaveLength(1);
    expect(secondInbox).toHaveLength(firstInbox.length);
    expect(secondTraces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(1);
    expect(secondTraces).toHaveLength(firstTraces.length);
    expect(secondContext).toBe(firstContext);
    expect(secondContext).not.toContain(secondNote);
  });

  it("serializes competing wrap-up requests across recovered runtime instances", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const firstNote = "I learned cross-runtime wrap-up is canonical.";
    const secondNote = "This competing cross-runtime note should not persist.";
    const initialRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await initialRuntime.start();
    const firstRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await firstRuntime.current();
    await secondRuntime.current();

    const [first, second] = await Promise.all([
      firstRuntime.wrapUp(firstNote),
      secondRuntime.wrapUp(secondNote),
    ]);
    const journal = await fs.readFile(first.journalPath, "utf8");
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    const context = await fs.readFile(getContextPacketPath(repo, `context:${session.id}:wrap_up`), "utf8");
    const wrappedEvents = events.filter((event) => event.kind === "session_wrapped");
    const canonicalNote = first.remembered;
    const losingNote = canonicalNote === firstNote ? secondNote : firstNote;

    expect(second).toEqual(first);
    expect(wrappedEvents).toHaveLength(1);
    expect(wrappedEvents[0].payload.note).toBe(canonicalNote);
    expect(journal.match(new RegExp(canonicalNote, "g"))).toHaveLength(1);
    expect(journal).not.toContain(losingNote);
    expect(inbox.filter((item) => item.proposedChange === canonicalNote)).toHaveLength(1);
    expect(inbox).toHaveLength(1);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(1);
    expect(context).toContain(canonicalNote);
    expect(context).not.toContain(losingNote);
  });

  it("repairs a stale same-session journal section with the canonical wrap-up note", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const note = "I learned stale journal sections are repaired.";
    const staleNote = "A stale note that should be replaced.";
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const date = formatLocalJournalDate();
    const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
    await fs.mkdir(path.dirname(journalPath), { recursive: true });
    await fs.writeFile(journalPath, [
      `# ${date} Along Journal`,
      "",
      `## Session ${session.id}`,
      "",
      "### I Now Believe",
      `- ${staleNote}`,
      "",
    ].join("\n"));

    const wrap = await runtime.wrapUp(note);
    const journal = await fs.readFile(wrap.journalPath, "utf8");

    expect(wrap.journalPath).toBe(journalPath);
    expect(journal.match(new RegExp(note, "g"))).toHaveLength(1);
    expect(journal).not.toContain(staleNote);
    expect(journal.match(new RegExp(`## Session ${session.id}`, "g"))).toHaveLength(1);
  });

  it("does not write wrap-up side effects when the current pointer is stale", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    const pointer = await readJson<Record<string, unknown>>(getCurrentSessionPath(repo));
    await fs.writeFile(getCurrentSessionPath(repo), `${JSON.stringify({ ...pointer, sessionId: "other-session" }, null, 2)}\n`);

    await expect(runtime.wrapUp("Do not persist this stale wrap-up.")).rejects.toThrow(`Current session mismatch: ${session.id}`);

    const date = formatLocalJournalDate();
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    expect(await pathExists(path.join(repo, ".along", "journal", `${date}.md`))).toBe(false);
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(0);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
    expect(inbox).toHaveLength(0);
    expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
  });

  it("does not write wrap-up side effects when the current pointer is malformed", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    await fs.writeFile(getCurrentSessionPath(repo), "{}\n");

    await expect(runtime.wrapUp("Do not persist this malformed wrap-up.")).rejects.toThrow("Current session pointer malformed");

    const date = formatLocalJournalDate();
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();
    expect(await pathExists(path.join(repo, ".along", "journal", `${date}.md`))).toBe(false);
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(0);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(0);
    expect(inbox).toHaveLength(0);
    expect(await pathExists(getContextPacketPath(repo, `context:${session.id}:wrap_up`))).toBe(false);
  });

  it("serializes concurrent wrap-up requests in one runtime instance", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const note = "I learned concurrent wrap-up is serialized.";
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();

    const [first, second] = await Promise.all([
      runtime.wrapUp(note),
      runtime.wrapUp("This concurrent note should not win."),
    ]);
    const journal = await fs.readFile(first.journalPath, "utf8");
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);
    const inbox = await new ReviewGate(repo).readInbox();

    expect(second).toEqual(first);
    expect(first.remembered).toBe(note);
    expect(journal.match(/I learned concurrent wrap-up is serialized\./g)).toHaveLength(1);
    expect(journal).not.toContain("This concurrent note should not win.");
    expect(events.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
    expect(traces.filter((trace) => trace.operation === "wrapUp")).toHaveLength(1);
    expect(inbox.filter((item) => item.proposedChange === note)).toHaveLength(1);
    expect(inbox).toHaveLength(1);
  });

  it("preserves multiple sessions on the same journal date", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const firstSession = await runtime.start();
      const firstWrap = await runtime.wrapUp("First same-day session note.");

      vi.setSystemTime(new Date("2026-06-03T10:01:00.000Z"));
      const secondSession = await runtime.start();
      const secondWrap = await runtime.wrapUp("Second same-day session note.");
      const journal = await fs.readFile(firstWrap.journalPath, "utf8");

      expect(secondWrap.journalPath).toBe(firstWrap.journalPath);
      expect(secondWrap.remembered).toBe("Second same-day session note.");
      expect(journal).toContain(`## Session ${firstSession.id}`);
      expect(journal).toContain(`## Session ${secondSession.id}`);
      expect(journal.match(/same-day session note\./g)).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("creates separate review candidates for separate sessions with the same wrap-up note", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      const note = "I learned the same thing twice.";
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const firstSession = await runtime.start();
      await runtime.wrapUp(note);

      vi.setSystemTime(new Date("2026-06-03T10:01:00.000Z"));
      const secondSession = await runtime.start();
      await runtime.wrapUp(note);
      const inbox = await new ReviewGate(repo).readInbox();
      const matching = inbox.filter((item) => item.kind === "memory_candidate" && item.proposedChange === note);

      expect(matching).toHaveLength(2);
      expect(matching.map((item) => item.sessionId).sort()).toEqual([firstSession.id, secondSession.id].sort());
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not reuse a cached wrap-up result after durable current switches sessions", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const firstSession = await runtime.start();
      const firstWrap = await runtime.wrapUp("First cached wrap result.");

      vi.setSystemTime(new Date("2026-06-03T10:01:00.000Z"));
      const secondRuntime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const secondSession = await secondRuntime.start();
      const secondWrap = await runtime.wrapUp("Second durable current wrap result.");
      const secondEvents = await new EventStore(repo).readEvents(secondSession.id);
      const secondJournal = await fs.readFile(secondWrap.journalPath, "utf8");
      const inbox = await new ReviewGate(repo).readInbox();

      expect(firstWrap.remembered).toBe("First cached wrap result.");
      expect(secondWrap).not.toEqual(firstWrap);
      expect(secondWrap.remembered).toBe("Second durable current wrap result.");
      expect(secondEvents.filter((event) => event.kind === "session_wrapped")).toHaveLength(1);
      expect(secondJournal).toContain(`## Session ${secondSession.id}`);
      expect(secondJournal).toContain("Second durable current wrap result.");
      expect(inbox.some((item) => item.sessionId === firstSession.id && item.proposedChange === "First cached wrap result.")).toBe(true);
      expect(inbox.some((item) => item.sessionId === secondSession.id && item.proposedChange === "Second durable current wrap result.")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("repairs a legacy same-session journal section without deleting later sessions", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        `Session: ${session.id}`,
        "",
        "## I Now Believe",
        "- Legacy stale note.",
        "",
        "## Session later-session",
        "",
        "### I Now Believe",
        "- Later section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical legacy repair note.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical legacy repair note.");
      expect(journal).not.toContain("Legacy stale note.");
      expect(journal).toContain("## Session later-session");
      expect(journal).toContain("Later section must stay.");
      expect(journal.match(/## Session /g)).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("repairs a non-leading legacy journal block without deleting neighboring sessions", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        "Session: earlier-legacy",
        "",
        "## I Now Believe",
        "- Earlier legacy section must stay.",
        "",
        `Session: ${session.id}`,
        "",
        "## I Now Believe",
        "- Target stale legacy note.",
        "",
        "Session: later-legacy",
        "",
        "## I Now Believe",
        "- Later legacy section must stay.",
        "",
        "## Session canonical-later",
        "",
        "### I Now Believe",
        "- Later canonical section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical non-leading legacy repair note.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain("Session: earlier-legacy");
      expect(journal).toContain("Earlier legacy section must stay.");
      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical non-leading legacy repair note.");
      expect(journal).not.toContain("Target stale legacy note.");
      expect(journal).toContain("Session: later-legacy");
      expect(journal).toContain("Later legacy section must stay.");
      expect(journal).toContain("## Session canonical-later");
      expect(journal).toContain("Later canonical section must stay.");
    } finally {
      vi.useRealTimers();
    }
  });

  it("repairs a canonical journal section without deleting a following legacy block", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        `## Session ${session.id}`,
        "",
        "### I Now Believe",
        "- Target stale canonical note.",
        "",
        "Session: following-legacy",
        "",
        "## I Now Believe",
        "- Following legacy section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical replacement before legacy note.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical replacement before legacy note.");
      expect(journal).not.toContain("Target stale canonical note.");
      expect(journal).toContain("Session: following-legacy");
      expect(journal).toContain("Following legacy section must stay.");
    } finally {
      vi.useRealTimers();
    }
  });

  it("collapses duplicate same-session journal sections while preserving unrelated sections", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        "## Session unrelated-before",
        "",
        "### I Now Believe",
        "- Unrelated canonical section must stay.",
        "",
        `## Session ${session.id}`,
        "",
        "### I Now Believe",
        "- First stale target note.",
        "",
        "Session: unrelated-legacy",
        "",
        "## I Now Believe",
        "- Unrelated legacy section must stay.",
        "",
        `Session: ${session.id}`,
        "",
        "## I Now Believe",
        "- Second stale target note.",
        "",
        "## Session unrelated-after",
        "",
        "### I Now Believe",
        "- Later canonical section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical collapsed journal note.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain("## Session unrelated-before");
      expect(journal).toContain("Unrelated canonical section must stay.");
      expect(journal).toContain("Session: unrelated-legacy");
      expect(journal).toContain("Unrelated legacy section must stay.");
      expect(journal).toContain("## Session unrelated-after");
      expect(journal).toContain("Later canonical section must stay.");
      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical collapsed journal note.");
      expect(journal).not.toContain("First stale target note.");
      expect(journal).not.toContain("Second stale target note.");
      expect(journal.match(new RegExp(session.id, "g"))).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves an adjacent canonical journal marker after repairing a session", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        `## Session ${session.id}`,
        "## Session adjacent-canonical",
        "",
        "### I Now Believe",
        "- Adjacent canonical section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical repair before adjacent canonical marker.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical repair before adjacent canonical marker.");
      expect(journal).toContain("## Session adjacent-canonical");
      expect(journal).toContain("Adjacent canonical section must stay.");
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves an adjacent legacy journal marker after repairing a session", async () => {
    vi.useFakeTimers();
    try {
      const { repo, home } = await makeRuntimeWorkspace();
      vi.setSystemTime(new Date("2026-06-03T10:00:00.000Z"));
      const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
      const session = await runtime.start();
      const date = formatLocalJournalDate();
      const journalPath = path.join(repo, ".along", "journal", `${date}.md`);
      await fs.mkdir(path.dirname(journalPath), { recursive: true });
      await fs.writeFile(journalPath, [
        `# ${date} Along Journal`,
        "",
        `## Session ${session.id}`,
        "Session: adjacent-legacy",
        "",
        "## I Now Believe",
        "- Adjacent legacy section must stay.",
        "",
      ].join("\n"));

      const wrap = await runtime.wrapUp("Canonical repair before adjacent legacy marker.");
      const journal = await fs.readFile(wrap.journalPath, "utf8");

      expect(journal).toContain(`## Session ${session.id}`);
      expect(journal).toContain("Canonical repair before adjacent legacy marker.");
      expect(journal).toContain("Session: adjacent-legacy");
      expect(journal).toContain("Adjacent legacy section must stay.");
    } finally {
      vi.useRealTimers();
    }
  });

  it("pauses the current session through the lifecycle manager", async () => {
    const { repo, home } = await makeRuntimeWorkspace();
    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();

    const paused = await runtime.pause();
    const pointer = await readJson<{ sessionId: string; state: string }>(getCurrentSessionPath(repo));
    const persisted = await readJson<AlongSession>(getSessionFilePath(repo, session.id));
    const events = await new EventStore(repo).readEvents(session.id);
    const traces = await new TraceStore(repo).readTraces(session.id);

    expect(paused).toEqual({ sessionId: session.id, lifecycleState: "paused" });
    expect(pointer).toMatchObject({ sessionId: session.id, state: "paused" });
    expect(persisted.state).toBe(session.state);
    expect(events.some((event) => event.kind === "session_paused")).toBe(true);
    expect(traces.some((trace) => trace.operation === "pauseSession" && trace.outcome === "allowed")).toBe(true);
  });
});
