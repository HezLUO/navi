import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import type { AlongEvent, AlongSession, CuriosityItem, GraphEdge, GraphNode, JournalEntry, PermissionEnvelope, PresenceState, ReviewItem, SessionLifecycleState, TraceEntry } from "./types";
import type { ConductorSnapshot, HeartbeatTrigger, ReadOnlyDelegationResult } from "./types";
import { ConductorRuntime } from "./conductor-runtime";
import { buildContextPacket } from "./context-engine";
import { EventStore } from "./event-store";
import { inspectProject } from "./project-adapter";
import { MemoryStore } from "./memory-store";
import { ScriptedCompanionProvider, type CompanionProvider } from "./model-provider";
import { getContextPacketPath, getEventsFilePath, getReviewInboxPath, getSessionFilePath, getTraceFilePath } from "./paths";
import { derivePermissionEnvelope, loadRuntimeProfile } from "./runtime-profile";
import { SessionLifecycle } from "./session-lifecycle";
import { TraceStore } from "./trace-store";
import { WriteCoordinator } from "./write-coordinator";

export interface RuntimeOptions {
  repoPath: string;
  homeDir?: string;
  provider?: CompanionProvider;
}

export interface WrapUpResult {
  journalPath: string;
  remembered: string;
  state: PresenceState;
  journalPreview: string;
}

export interface PauseResult {
  sessionId: string;
  lifecycleState: "paused";
}

interface CanonicalWrapPayload {
  note: string;
  journalPath: string;
}

const rhythmSteps: Array<{ state: PresenceState; maxElapsedMs: number }> = [
  { state: "arriving", maxElapsedMs: 3_000 },
  { state: "settling", maxElapsedMs: 12_000 },
  { state: "quiet_focus", maxElapsedMs: 28_000 },
  { state: "gentle_share", maxElapsedMs: 44_000 },
  { state: "rest", maxElapsedMs: Number.POSITIVE_INFINITY },
];

export function stateForElapsed(elapsedMs: number): PresenceState {
  return rhythmSteps.find((step) => elapsedMs < step.maxElapsedMs)?.state ?? "rest";
}

export function formatLocalJournalDate(date = new Date(), timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    const localYear = date.getFullYear();
    const localMonth = String(date.getMonth() + 1).padStart(2, "0");
    const localDay = String(date.getDate()).padStart(2, "0");
    return `${localYear}-${localMonth}-${localDay}`;
  }
  return `${year}-${month}-${day}`;
}

export class AlongRuntime {
  private static readonly wrapQueues = new Map<string, Promise<unknown>>();

  private session?: AlongSession;
  private readonly memory: MemoryStore;
  private readonly provider: CompanionProvider;
  private readonly lifecycle: SessionLifecycle;
  private readonly events: EventStore;
  private readonly traces: TraceStore;
  private readonly writes: WriteCoordinator;
  private readonly conductor: ConductorRuntime;
  private wrappedResult?: WrapUpResult;
  private wrappedResultSessionId?: string;
  private wrapUpInFlight?: Promise<WrapUpResult>;

  constructor(private readonly options: RuntimeOptions) {
    this.memory = new MemoryStore(options.repoPath, options.homeDir ?? os.homedir());
    this.provider = options.provider ?? new ScriptedCompanionProvider();
    this.lifecycle = new SessionLifecycle(options.repoPath);
    this.events = new EventStore(options.repoPath);
    this.traces = new TraceStore(options.repoPath);
    this.writes = new WriteCoordinator(options.repoPath);
    this.conductor = new ConductorRuntime({ repoPath: options.repoPath });
    this.wrappedResult = undefined;
    this.wrappedResultSessionId = undefined;
    this.wrapUpInFlight = undefined;
  }

  async start(): Promise<AlongSession> {
    await this.memory.ensureInitialized();
    const context = await inspectProject(this.options.repoPath);
    const curiosities = await this.memory.readCuriosities();
    const selected = curiosities.find((item) => item.status === "open") ?? this.createInitialCuriosity(context.repoName);
    if (!curiosities.some((item) => item.id === selected.id)) {
      await this.memory.writeCuriosities([selected, ...curiosities]);
    }

    const providerPlan = await this.provider.createLearningPlan({
      repoName: context.repoName,
      openCuriosity: selected.question,
      readmeHint: context.readme?.slice(0, 120),
    });

    const sessionId = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
    const session: AlongSession = {
      id: sessionId,
      repoPath: this.options.repoPath,
      startedAt: new Date().toISOString(),
      state: "arriving",
      context,
      plan: {
        state: "arriving",
        sessionId,
        learningGoal: providerPlan.learningGoal,
        currentActivity: providerPlan.currentActivity,
        selectedCuriosity: selected,
        shareLine: providerPlan.shareLine,
      },
    };

    this.session = session;
    this.wrappedResult = undefined;
    this.wrappedResultSessionId = undefined;
    this.wrapUpInFlight = undefined;
    const profile = await loadRuntimeProfile(this.options.repoPath);
    const permissionEnvelope = derivePermissionEnvelope(profile);
    await this.lifecycle.startSession(session);
    const event = await this.events.recordEvent({
      sessionId,
      source: "runtime",
      kind: "session_started",
      visibility: "internal",
      scope: "session",
      payload: {
        repoPath: this.options.repoPath,
        repoName: context.repoName,
        selectedCuriosityId: selected.id,
      },
      provenance: { route: "runtime.start" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: `session_started:${sessionId}`,
    });
    const packet = buildContextPacket({
      session,
      purpose: "session_start",
      profile,
      permissionEnvelope,
      recentEvents: [event],
      reviewedMemory: [],
      memoryCandidates: [],
      maxItems: 8,
      maxApproxTokens: 1000,
    });
    await this.writes.atomicWriteJson(getContextPacketPath(this.options.repoPath, packet.id), packet);
    await this.traces.recordTrace({
      sessionId,
      operation: "startSession",
      inputs: [
        ".along/settings.json",
        `.along/sessions/${sessionId}.json`,
        `event:${event.id}`,
        `context:${packet.id}`,
      ],
      decision: "start active session",
      reason: "A new runtime session was requested and persisted through the lifecycle manager.",
      permissionSnapshot: JSON.stringify(permissionEnvelope),
      contextPacketId: packet.id,
      relatedEventIds: [event.id],
      outcome: "allowed",
    });
    await this.writeStartGraph(session, selected);
    return session;
  }

  async current(): Promise<AlongSession | undefined> {
    const priorSessionId = this.session?.id;
    const recovered = await this.recoverCurrentSessionWithContentionRetry();

    if (recovered.session && recovered.lifecycleState === "wrapped") {
      this.clearCachedWrapResultUnless(recovered.session.id);
      this.session = undefined;
      return recovered.session;
    }

    if (!recovered.session || recovered.lifecycleState === "expired" || recovered.lifecycleState === "none") {
      this.clearCachedWrapResultUnless(undefined);
      this.session = undefined;
      return undefined;
    }

    this.clearCachedWrapResultUnless(recovered.session.id);
    this.session = recovered.session;
    if (!priorSessionId || priorSessionId !== recovered.session.id) {
      const event = await this.events.recordEvent({
        sessionId: recovered.session.id,
        source: "runtime",
        kind: "session_recovered",
        visibility: "internal",
        scope: "session",
        payload: { lifecycleState: recovered.lifecycleState, reason: recovered.reason },
        provenance: { route: "runtime.current" },
        memoryEligibility: "never",
        riskLevel: "low",
        idempotencyKey: `session_recovered:${recovered.session.id}`,
      });
      await this.traces.recordTrace({
        sessionId: recovered.session.id,
        operation: "recoverCurrentSession",
        inputs: [
          ".along/sessions/current.json",
          `.along/sessions/${recovered.session.id}.json`,
          `event:${event.id}`,
        ],
        decision: "recover session into memory",
        reason: recovered.reason,
        relatedEventIds: [event.id],
        outcome: "recovered",
      });
    }

    await this.refreshPresenceState();
    return this.session;
  }

  async conductorSnapshot(): Promise<ConductorSnapshot> {
    return await this.conductor.snapshot();
  }

  async conductorHeartbeat(trigger: HeartbeatTrigger): Promise<ConductorSnapshot> {
    const lifecycleState = await this.lifecycle.currentLifecycleState();
    this.assertCanRunConductorHeartbeat(lifecycleState);
    const currentSession = await this.current();
    if (!currentSession) {
      throw new Error("Cannot run conductor heartbeat without a current session.");
    }
    this.assertCanRunConductorHeartbeat(await this.lifecycle.currentLifecycleState());
    if (currentSession.state === "wrap_up") {
      throw new Error("Cannot run conductor heartbeat after session wrap-up.");
    }
    return await this.withRuntimeLockContentionRetry(`runtime:conductor-heartbeat:${currentSession.id}`, async () => {
      const currentIdentity = await this.lifecycle.currentLifecycleIdentity();
      this.assertCanRunConductorHeartbeat(currentIdentity.lifecycleState);
      if (currentIdentity.sessionId !== currentSession.id) {
        throw new Error("Cannot run conductor heartbeat because current session changed.");
      }
      if (currentSession.state === "wrap_up") {
        throw new Error("Cannot run conductor heartbeat after session wrap-up.");
      }
      return await this.conductor.runHeartbeat({ trigger, sessionId: currentSession.id });
    });
  }

  async ingestDelegationResult(result: ReadOnlyDelegationResult) {
    return await this.conductor.ingestDelegationResult(result);
  }

  async wrapUp(note: string): Promise<WrapUpResult> {
    if (this.wrapUpInFlight) return this.wrapUpInFlight;

    const queuedSessionId = this.session?.id;
    const wrapUp = queuedSessionId
      ? this.serializeWrapUpForSession(queuedSessionId, () => this.performWrapUp(note, queuedSessionId))
      : this.performWrapUp(note);
    this.wrapUpInFlight = wrapUp.finally(() => {
      this.wrapUpInFlight = undefined;
    });
    return this.wrapUpInFlight;
  }

  private async performWrapUp(note: string, queuedSessionId?: string): Promise<WrapUpResult> {
    const inMemorySession = this.session;
    if (inMemorySession && inMemorySession.state !== "wrap_up") await this.preflightWrapEventState(inMemorySession.id);
    const activeSession = await this.current();
    if (!activeSession) {
      if (inMemorySession && inMemorySession.state !== "wrap_up") await this.markWrappedWithContentionRetry(inMemorySession.id);
      throw new Error("Cannot wrap up before starting an active session.");
    }
    if (this.wrappedResult && this.wrappedResultSessionId === activeSession.id) return this.wrappedResult;

    const complete = async (): Promise<WrapUpResult> => {
      if (this.wrappedResult && this.wrappedResultSessionId === activeSession.id) return this.wrappedResult;
      if (activeSession.state !== "wrap_up") {
        await this.preflightWrapEventState(activeSession.id);
        await this.markWrappedWithContentionRetry(activeSession.id);
      }
      return await this.completeCanonicalWrapUp(activeSession, note);
    };

    if (queuedSessionId === activeSession.id) return await complete();
    return await this.serializeWrapUpForSession(activeSession.id, complete);
  }

  async pause(): Promise<PauseResult> {
    const currentSession = await this.current();
    if (!currentSession || currentSession.state === "wrap_up") throw new Error("Cannot pause without an active session.");

    await this.lifecycle.markPaused(currentSession.id);
    const event = await this.events.recordEvent({
      sessionId: currentSession.id,
      source: "runtime",
      kind: "session_paused",
      visibility: "internal",
      scope: "session",
      payload: { lifecycleState: "paused" },
      provenance: { route: "runtime.pause" },
      memoryEligibility: "never",
      riskLevel: "low",
      idempotencyKey: `session_paused:${currentSession.id}`,
    });
    await this.traces.recordTrace({
      sessionId: currentSession.id,
      operation: "pauseSession",
      inputs: [
        ".along/sessions/current.json",
        `.along/sessions/${currentSession.id}.json`,
        `event:${event.id}`,
      ],
      decision: "pause current session",
      reason: "The current runtime session was paused through the lifecycle manager.",
      relatedEventIds: [event.id],
      outcome: "allowed",
    });

    return { sessionId: currentSession.id, lifecycleState: "paused" };
  }

  private createInitialCuriosity(repoName: string): CuriosityItem {
    return {
      id: `curiosity-${Date.now()}`,
      question: `What is the smallest useful entry point in ${repoName}?`,
      whyItMatters: "Along needs one small thread to understand before expanding.",
      nextProbe: "Read the README and manifest files, then inspect the top-level source folders.",
      status: "open",
      relatedProjectArea: "project-entry",
      createdFromSession: "initial",
    };
  }

  private async writeStartGraph(session: AlongSession, curiosity: CuriosityItem): Promise<void> {
    const createdAt = new Date().toISOString();
    const nodes: GraphNode[] = [
      { id: `project:${path.basename(session.repoPath)}`, type: "project", label: path.basename(session.repoPath), properties: { path: session.repoPath }, createdAt },
      { id: `session:${session.id}`, type: "session", label: session.id, properties: { repoPath: session.repoPath }, createdAt },
      { id: curiosity.id, type: "curiosity", label: curiosity.question, properties: { status: curiosity.status }, createdAt },
    ];
    const edges: GraphEdge[] = [
      { id: `edge:${session.id}:curiosity`, from: `session:${session.id}`, to: curiosity.id, type: "session_produced_curiosity", createdAt },
    ];
    await this.memory.projectGraph.addMany(nodes, edges);
  }

  private async refreshPresenceState(): Promise<void> {
    if (!this.session || this.session.state === "wrap_up") return;
    const elapsedMs = Date.now() - Date.parse(this.session.startedAt);
    const nextState = stateForElapsed(Number.isFinite(elapsedMs) ? elapsedMs : 0);
    if (nextState === this.session.state) return;
    this.session.state = nextState;
    this.session.plan.state = nextState;
    await this.writes.atomicWriteJson(getSessionFilePath(this.options.repoPath, this.session.id), this.session);
  }

  private createJournalEntry(session: AlongSession, note: string, date = formatLocalJournalDate()): JournalEntry {
    return {
      sessionId: session.id,
      date,
      triedToUnderstand: session.plan.learningGoal,
      lookedAt: session.context.directorySummary.slice(0, 6),
      nowBelieves: [note],
      stillUnsure: [session.plan.selectedCuriosity?.question ?? "what to inspect next"],
      nextTime: session.plan.selectedCuriosity?.nextProbe ?? "continue from the current project summary",
      noticedAboutSession: "I stayed with one small thread instead of expanding into a large plan.",
    };
  }

  private async completeCanonicalWrapUp(session: AlongSession, requestedNote: string): Promise<WrapUpResult> {
    return await this.withRuntimeLockContentionRetry(`runtime:wrap-up:${session.id}`, async () => {
      const existingEvent = await this.readWrappedEvent(session.id);
      const event = existingEvent ?? await this.recordWrappedEventWithinLock(
        session.id,
        requestedNote,
        path.join(this.memory.projectDir, "journal", `${formatLocalJournalDate()}.md`),
      );
      const { note: remembered, journalPath } = this.requireCanonicalWrapPayload(event, session.id);
      const entry = this.createJournalEntry(session, remembered, this.journalDateForPath(journalPath));
      await this.memory.writeJournal(entry);

      const profile = await loadRuntimeProfile(this.options.repoPath);
      const permissionEnvelope = derivePermissionEnvelope(profile);
      const packet = buildContextPacket({
        session: {
          ...session,
          state: "wrap_up",
          plan: { ...session.plan, state: "wrap_up" },
        },
        purpose: "wrap_up",
        profile,
        permissionEnvelope,
        recentEvents: [event],
        reviewedMemory: [],
        memoryCandidates: [remembered],
        maxItems: 8,
        maxApproxTokens: 1000,
      });
      await this.writes.atomicWriteJson(getContextPacketPath(this.options.repoPath, packet.id), packet);

      const reviewItem = await this.addWrapReviewItemWithinLock(session.id, remembered, event.id, packet.id);
      await this.recordWrapTraceWithinLock(session.id, event, packet.id, reviewItem.id, journalPath, permissionEnvelope);

      session.state = "wrap_up";
      session.plan.state = "wrap_up";
      this.wrappedResult = {
        journalPath,
        remembered,
        state: "wrap_up",
        journalPreview: this.previewJournal(entry),
      };
      this.wrappedResultSessionId = session.id;
      return this.wrappedResult;
    });
  }

  private clearCachedWrapResultUnless(sessionId: string | undefined): void {
    if (sessionId && this.wrappedResultSessionId === sessionId) return;
    this.wrappedResult = undefined;
    this.wrappedResultSessionId = undefined;
  }

  private async serializeWrapUpForSession<T>(sessionId: string, fn: () => Promise<T>): Promise<T> {
    const key = `${this.options.repoPath}:${sessionId}`;
    const previous = AlongRuntime.wrapQueues.get(key) ?? Promise.resolve();
    const next = previous.then(fn, fn);
    AlongRuntime.wrapQueues.set(key, next);

    try {
      return await next;
    } finally {
      if (AlongRuntime.wrapQueues.get(key) === next) AlongRuntime.wrapQueues.delete(key);
    }
  }

  private async markWrappedWithContentionRetry(sessionId: string): Promise<void> {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        await this.lifecycle.markWrapped(sessionId);
        return;
      } catch (error) {
        if (!this.isRuntimeLockActiveError(error) || attempt === maxAttempts - 1) throw error;
        await this.waitForRuntimeLockContention(attempt);
        if (await this.readWrappedEvent(sessionId)) return;
      }
    }
  }

  private async preflightWrapEventState(sessionId: string): Promise<void> {
    await this.readWrappedEvent(sessionId);
  }

  private async recoverCurrentSessionWithContentionRetry() {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.lifecycle.recoverCurrentSession();
      } catch (error) {
        if (!this.isRuntimeLockActiveError(error) || attempt === maxAttempts - 1) throw error;
        await this.waitForRuntimeLockContention(attempt);
      }
    }
    throw new Error("Runtime lock is active");
  }

  private assertCanRunConductorHeartbeat(lifecycleState: SessionLifecycleState | "none"): void {
    if (lifecycleState === "none") {
      throw new Error("Cannot run conductor heartbeat without a current session.");
    }
    if (lifecycleState === "wrapped") {
      throw new Error("Cannot run conductor heartbeat after session wrap-up.");
    }
    if (lifecycleState !== "active" && lifecycleState !== "recovered") {
      throw new Error("Cannot run conductor heartbeat unless current session is active.");
    }
  }

  private async withRuntimeLockContentionRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await this.writes.withRuntimeLock(operation, async () => fn());
      } catch (error) {
        if (!this.isRuntimeLockActiveError(error) || attempt === maxAttempts - 1) throw error;
        await this.waitForRuntimeLockContention(attempt);
      }
    }
    throw new Error("Runtime lock is active");
  }

  private async recordWrappedEventWithinLock(sessionId: string, note: string, journalPath: string): Promise<AlongEvent> {
    const now = new Date().toISOString();
    const event: AlongEvent = {
      id: `event-${randomUUID()}`,
      schemaVersion: 1,
      occurredAt: now,
      receivedAt: now,
      sessionId,
      source: "runtime",
      kind: "session_wrapped",
      visibility: "reviewable",
      scope: "session",
      payload: { note, journalPath },
      provenance: { route: "runtime.wrapUp", filePath: journalPath },
      memoryEligibility: "candidate",
      riskLevel: "low",
      idempotencyKey: `session_wrapped:${sessionId}`,
    };
    await this.writes.appendJsonLine(getEventsFilePath(this.options.repoPath, sessionId), event);
    const persisted = await this.readWrappedEvent(sessionId);
    if (!persisted) throw new Error(`Canonical wrap-up event was not persisted: ${sessionId}`);
    return persisted;
  }

  private async addWrapReviewItemWithinLock(sessionId: string, note: string, eventId: string, packetId: string): Promise<ReviewItem> {
    let selected: ReviewItem | undefined;
    await this.writes.updateJson<ReviewItem[]>(getReviewInboxPath(this.options.repoPath), [], (inbox) => {
      const existing = inbox.find((item) => (
        item.kind === "memory_candidate"
        && item.sessionId === sessionId
        && item.sourceRefs.includes(eventId)
        && item.sourceRefs.includes(packetId)
      ));
      if (existing) {
        selected = existing;
        return inbox;
      }
      selected = {
        id: `review-${randomUUID()}`,
        kind: "memory_candidate",
        createdAt: new Date().toISOString(),
        sessionId,
        proposedChange: note,
        sourceRefs: [eventId, packetId],
        reason: "Candidate came from wrap-up.",
        riskLevel: "low",
        defaultAction: "keep_as_candidate",
        status: "pending",
      };
      return [...inbox, selected];
    });
    if (!selected) throw new Error("Review item was not created");
    return selected;
  }

  private async recordWrapTraceWithinLock(
    sessionId: string,
    event: AlongEvent,
    contextPacketId: string,
    reviewItemId: string,
    journalPath: string,
    permissionEnvelope: PermissionEnvelope,
  ): Promise<void> {
    const existing = await this.traces.readTraces(sessionId);
    const alreadyRecorded = existing.some((trace) => (
      trace.operation === "wrapUp"
      && trace.contextPacketId === contextPacketId
      && trace.relatedEventIds.includes(event.id)
    ));
    if (alreadyRecorded) return;

    const trace: TraceEntry = {
      id: `trace-${randomUUID()}`,
      at: new Date().toISOString(),
      sessionId,
      operation: "wrapUp",
      inputs: [
        `event:${event.id}`,
        `context:${contextPacketId}`,
        `review:${reviewItemId}`,
        `journal:${journalPath}`,
      ],
      decision: "queue memory candidate and wrap session",
      reason: "Wrap-up writes the journal, records a review-gated memory candidate, and closes the lifecycle session.",
      permissionSnapshot: JSON.stringify(permissionEnvelope),
      contextPacketId,
      relatedEventIds: [event.id],
      outcome: "queued",
    };
    await this.writes.appendJsonLine(getTraceFilePath(this.options.repoPath, sessionId), trace);
  }

  private async readWrappedEvent(sessionId: string): Promise<AlongEvent | undefined> {
    const events = await this.events.readEvents(sessionId);
    const keyedEvents = events.filter((event) => event.idempotencyKey === `session_wrapped:${sessionId}`);
    if (keyedEvents.length === 0) return undefined;
    if (keyedEvents.length !== 1) throw new Error(`Malformed canonical wrap-up event: ${sessionId}`);
    if (!this.getCanonicalWrapPayload(keyedEvents[0], sessionId)) {
      throw new Error(`Malformed canonical wrap-up event: ${sessionId}`);
    }
    return keyedEvents[0];
  }

  private journalDateForPath(journalPath: string): string {
    const parsed = path.parse(journalPath).name;
    return /^\d{4}-\d{2}-\d{2}$/.test(parsed) ? parsed : formatLocalJournalDate();
  }

  private isRuntimeLockActiveError(error: unknown): boolean {
    return error instanceof Error && error.message === "Runtime lock is active";
  }

  private async waitForRuntimeLockContention(attempt: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10 * (attempt + 1)));
  }

  private stringPayloadValue(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private requireCanonicalWrapPayload(event: AlongEvent, sessionId: string): CanonicalWrapPayload {
    const payload = this.getCanonicalWrapPayload(event, sessionId);
    if (!payload) throw new Error(`Malformed canonical wrap-up event: ${sessionId}`);
    return payload;
  }

  private getCanonicalWrapPayload(event: AlongEvent, sessionId: string): CanonicalWrapPayload | undefined {
    if (
      event.kind !== "session_wrapped"
      || event.sessionId !== sessionId
      || event.idempotencyKey !== `session_wrapped:${sessionId}`
    ) {
      return undefined;
    }
    const note = this.stringPayloadValue(event.payload.note);
    const journalPath = this.stringPayloadValue(event.payload.journalPath);
    if (note === undefined || journalPath === undefined || !this.isCanonicalJournalPath(journalPath)) return undefined;
    return { note, journalPath };
  }

  private isCanonicalJournalPath(journalPath: string): boolean {
    if (!path.isAbsolute(journalPath)) return false;
    const journalDir = path.resolve(this.memory.projectDir, "journal");
    const normalized = path.resolve(journalPath);
    return path.dirname(normalized) === journalDir
      && /^\d{4}-\d{2}-\d{2}\.md$/.test(path.basename(normalized));
  }

  private previewJournal(entry: JournalEntry): string {
    return [
      `I remembered: ${entry.nowBelieves[0]}`,
      `I looked at: ${entry.lookedAt.slice(0, 3).join(", ") || "the project shape"}.`,
      `Next time: ${entry.nextTime}`,
    ].join("\n");
  }
}
