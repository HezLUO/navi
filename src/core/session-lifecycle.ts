import { presenceStates } from "./types";
import type { AlongSession, SessionLifecycleState } from "./types";
import { getCurrentSessionPath, getSessionFilePath, getSessionIndexPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

export interface CurrentSessionPointer {
  sessionId: string;
  state: SessionLifecycleState;
  updatedAt: string;
  projectPath: string;
  recoveryHint: string;
}

export interface SessionIndexEntry {
  sessionId: string;
  state: SessionLifecycleState;
  startedAt: string;
  updatedAt: string;
  projectPath: string;
}

export interface SessionRecoveryResult {
  session?: AlongSession;
  lifecycleState: SessionLifecycleState | "none";
  reason: string;
}

export interface CurrentLifecycleIdentity {
  sessionId?: string;
  lifecycleState: SessionLifecycleState | "none";
}

const maxRecoverableSessionAgeMs = 12 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string";
}

function hasArray(value: Record<string, unknown>, key: string): boolean {
  return Array.isArray(value[key]);
}

function isSafeSessionId(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && value !== "."
    && value !== ".."
    && value !== "current"
    && value !== "index"
    && !value.includes("/")
    && !value.includes("\\")
    && /^[A-Za-z0-9_-]+$/.test(value);
}

function assertSafeSessionId(sessionId: string): void {
  if (!isSafeSessionId(sessionId)) throw new Error(`Invalid session id: ${sessionId}`);
}

function isPresenceState(value: unknown): value is AlongSession["state"] {
  return typeof value === "string" && (presenceStates as readonly string[]).includes(value);
}

function hasCompatiblePresenceStates(sessionState: unknown, planState: unknown): boolean {
  return isPresenceState(sessionState)
    && isPresenceState(planState)
    && (sessionState === planState || sessionState === "wrap_up" || planState === "wrap_up");
}

function isAlongSession(value: unknown): value is AlongSession {
  if (!isRecord(value)) return false;
  if (
    !isSafeSessionId(value.id)
    || !hasString(value, "repoPath")
    || !hasString(value, "startedAt")
    || !isPresenceState(value.state)
  ) {
    return false;
  }

  const plan = value.plan;
  if (!isRecord(plan)) return false;
  if (
    !isPresenceState(plan.state)
    || !isSafeSessionId(plan.sessionId)
    || !hasString(plan, "learningGoal")
    || !hasString(plan, "currentActivity")
  ) {
    return false;
  }
  if (!hasCompatiblePresenceStates(value.state, plan.state)) return false;

  const context = value.context;
  if (!isRecord(context)) return false;
  return hasString(context, "repoPath")
    && hasString(context, "repoName")
    && hasString(context, "gitStatus")
    && hasArray(context, "recentCommits")
    && hasArray(context, "manifests")
    && hasArray(context, "directorySummary")
    && hasArray(context, "testHints");
}

function isSessionLifecycleState(value: unknown): value is SessionLifecycleState {
  return value === "new"
    || value === "active"
    || value === "paused"
    || value === "wrapped"
    || value === "expired"
    || value === "recovered";
}

function isSessionIndexEntryForProject(value: unknown, repoPath: string): value is SessionIndexEntry {
  return isRecord(value)
    && isSafeSessionId(value.sessionId)
    && isSessionLifecycleState(value.state)
    && hasString(value, "startedAt")
    && hasString(value, "updatedAt")
    && value.projectPath === repoPath;
}

function normalizeIndex(value: unknown, repoPath: string): SessionIndexEntry[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Map<string, SessionIndexEntry>();
  for (const item of value) {
    if (!isSessionIndexEntryForProject(item, repoPath) || deduped.has(item.sessionId)) continue;
    deduped.set(item.sessionId, item);
  }
  return [...deduped.values()];
}

function isCurrentSessionPointer(value: unknown): value is CurrentSessionPointer {
  return isRecord(value)
    && isSafeSessionId(value.sessionId)
    && isSessionLifecycleState(value.state)
    && hasString(value, "updatedAt")
    && hasString(value, "projectPath")
    && hasString(value, "recoveryHint");
}

function isRecoverablePointerState(state: SessionLifecycleState): boolean {
  return state === "active" || state === "paused" || state === "recovered";
}

function canTransitionFrom(currentState: SessionLifecycleState, targetState: SessionLifecycleState): boolean {
  if (targetState === "paused") return currentState === "active" || currentState === "paused" || currentState === "recovered";
  if (targetState === "wrapped") return currentState === "active" || currentState === "paused" || currentState === "recovered" || currentState === "wrapped";
  return false;
}

function parseTimestamp(value: string): Date | undefined {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return undefined;
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (parsed.toISOString() !== value) return undefined;
  return parsed;
}

function crossesNaturalDay(startedAt: Date, now: Date): boolean {
  return startedAt.getFullYear() !== now.getFullYear()
    || startedAt.getMonth() !== now.getMonth()
    || startedAt.getDate() !== now.getDate();
}

function isOlderThanMaxAge(startedAt: Date, now: Date): boolean {
  return now.getTime() - startedAt.getTime() > maxRecoverableSessionAgeMs;
}

function isExpiredRecoveryCandidate(pointerUpdatedAt: Date, sessionStartedAt: Date, now: Date): boolean {
  return isOlderThanMaxAge(pointerUpdatedAt, now)
    || isOlderThanMaxAge(sessionStartedAt, now)
    || crossesNaturalDay(pointerUpdatedAt, now)
    || crossesNaturalDay(sessionStartedAt, now);
}

export class SessionLifecycle {
  private readonly coordinator: WriteCoordinator;

  constructor(private readonly repoPath: string) {
    this.coordinator = new WriteCoordinator(repoPath);
  }

  async startSession(session: AlongSession): Promise<void> {
    assertSafeSessionId(session.id);
    this.assertSessionValidForProject(session.id, session);
    await this.writeSessionState(session, "active", "session started");
  }

  async markPaused(sessionId: string): Promise<void> {
    assertSafeSessionId(sessionId);
    await this.transitionSessionState(sessionId, "paused", "session paused");
  }

  async markWrapped(sessionId: string): Promise<void> {
    assertSafeSessionId(sessionId);
    await this.transitionSessionState(sessionId, "wrapped", "session wrapped", (session) => {
      session.state = "wrap_up";
      session.plan.state = "wrap_up";
    });
  }

  async recoverCurrentSession(): Promise<SessionRecoveryResult> {
    return await this.coordinator.withRuntimeLock("session:recover", async () => {
      const rawPointer = await this.coordinator.readJson<unknown | null>(getCurrentSessionPath(this.repoPath), null);
      if (rawPointer === null) return { lifecycleState: "none", reason: "no current session pointer" };
      if (!isCurrentSessionPointer(rawPointer)) return { lifecycleState: "none", reason: "current session pointer malformed" };
      const pointer = rawPointer;
      if (pointer.projectPath !== this.repoPath) return { lifecycleState: "none", reason: "current pointer belongs to another project" };
      if (pointer.state === "expired") return await this.recoverExpiredPointer(pointer);
      if (pointer.state !== "wrapped" && !isRecoverablePointerState(pointer.state)) {
        return { lifecycleState: "none", reason: "current session pointer not recoverable" };
      }
      const rawSession = await this.readSessionValue(pointer.sessionId);
      if (rawSession === undefined) return { lifecycleState: "none", reason: "current session file missing" };
      if (!isAlongSession(rawSession)) return { lifecycleState: "none", reason: "current session file malformed" };
      const session = rawSession;
      if (!this.matchesCurrentSession(pointer.sessionId, session)) {
        return { lifecycleState: "none", reason: "current session file mismatch" };
      }
      const pointerUpdatedAt = parseTimestamp(pointer.updatedAt);
      if (!pointerUpdatedAt) return { lifecycleState: "none", reason: "current session pointer malformed" };
      const sessionStartedAt = parseTimestamp(session.startedAt);
      if (!sessionStartedAt) return { lifecycleState: "none", reason: "current session file malformed" };
      if (pointer.state === "wrapped" || session.state === "wrap_up" || session.plan.state === "wrap_up") {
        const wrappedSession: AlongSession = {
          ...session,
          state: "wrap_up",
          plan: { ...session.plan, state: "wrap_up" },
        };
        await this.writeSessionSnapshot(wrappedSession, "wrapped", "session wrapped");
        return { session: wrappedSession, lifecycleState: "wrapped", reason: "current session is wrapped" };
      }
      if (isExpiredRecoveryCandidate(pointerUpdatedAt, sessionStartedAt, new Date())) {
        await this.writePointerAndIndex(session, "expired", "session expired");
        return { session, lifecycleState: "expired", reason: "current session expired" };
      }
      const nextSession: AlongSession = {
        ...session,
        state: "arriving",
        plan: { ...session.plan, state: "arriving" },
      };
      const recoveryHint = pointer.state === "paused"
        ? "session recovered from paused state"
        : "session recovered from disk";
      await this.writePointerAndIndex(nextSession, "recovered", recoveryHint);
      return { session: nextSession, lifecycleState: "recovered", reason: "current session recovered" };
    });
  }

  async currentLifecycleState(): Promise<SessionLifecycleState | "none"> {
    return (await this.currentLifecycleIdentity()).lifecycleState;
  }

  async currentLifecycleIdentity(): Promise<CurrentLifecycleIdentity> {
    const rawPointer = await this.coordinator.readJson<unknown | null>(getCurrentSessionPath(this.repoPath), null);
    if (rawPointer === null) return { lifecycleState: "none" };
    if (!isCurrentSessionPointer(rawPointer)) return { lifecycleState: "none" };
    if (rawPointer.projectPath !== this.repoPath) return { lifecycleState: "none" };
    return {
      sessionId: rawPointer.sessionId,
      lifecycleState: this.visibleLifecycleState(rawPointer),
    };
  }

  private visibleLifecycleState(pointer: CurrentSessionPointer): SessionLifecycleState {
    if (pointer.state === "recovered" && pointer.recoveryHint === "session recovered from paused state") {
      return "paused";
    }
    return pointer.state;
  }

  private async recoverExpiredPointer(pointer: CurrentSessionPointer): Promise<SessionRecoveryResult> {
    const rawSession = await this.readSessionValue(pointer.sessionId);
    if (rawSession === undefined) return { lifecycleState: "none", reason: "current session file missing" };
    if (!isAlongSession(rawSession)) return { lifecycleState: "none", reason: "current session file malformed" };
    const session = rawSession;
    if (!this.matchesCurrentSession(pointer.sessionId, session)) {
      return { lifecycleState: "none", reason: "current session file mismatch" };
    }
    const pointerUpdatedAt = parseTimestamp(pointer.updatedAt);
    if (!pointerUpdatedAt) return { lifecycleState: "none", reason: "current session pointer malformed" };
    const sessionStartedAt = parseTimestamp(session.startedAt);
    if (!sessionStartedAt) return { lifecycleState: "none", reason: "current session file malformed" };
    await this.writePointerAndIndex(session, "expired", "session expired");
    return { session, lifecycleState: "expired", reason: "current session expired" };
  }

  async readIndex(): Promise<SessionIndexEntry[]> {
    const rawIndex = await this.coordinator.readJson<unknown>(getSessionIndexPath(this.repoPath), []);
    return normalizeIndex(rawIndex, this.repoPath);
  }

  private async readSessionValue(sessionId: string): Promise<unknown | undefined> {
    assertSafeSessionId(sessionId);
    return await this.coordinator.readJson<unknown | undefined>(getSessionFilePath(this.repoPath, sessionId), undefined);
  }

  private async transitionSessionState(
    sessionId: string,
    state: SessionLifecycleState,
    recoveryHint: string,
    mutate?: (session: AlongSession) => void,
  ): Promise<void> {
    await this.coordinator.withRuntimeLock(`session:${state}`, async () => {
      await this.readCurrentPointerForTransition(sessionId, state);
      const session = await this.readSessionForTransition(sessionId);
      mutate?.(session);
      await this.writeSessionSnapshot(session, state, recoveryHint);
    });
  }

  private async readCurrentPointerForTransition(sessionId: string, targetState: SessionLifecycleState): Promise<CurrentSessionPointer> {
    const rawPointer = await this.coordinator.readJson<unknown | null>(getCurrentSessionPath(this.repoPath), null);
    if (rawPointer === null) throw new Error(`Current session missing: ${sessionId}`);
    if (!isCurrentSessionPointer(rawPointer)) throw new Error("Current session pointer malformed");
    if (rawPointer.projectPath !== this.repoPath || rawPointer.sessionId !== sessionId) {
      throw new Error(`Current session mismatch: ${sessionId}`);
    }
    if (!canTransitionFrom(rawPointer.state, targetState)) {
      throw new Error(`Current session state incompatible: ${sessionId}`);
    }
    return rawPointer;
  }

  private async readSessionForTransition(sessionId: string): Promise<AlongSession> {
    assertSafeSessionId(sessionId);
    const rawSession = await this.readSessionValue(sessionId);
    if (rawSession === undefined) throw new Error(`Session not found: ${sessionId}`);
    this.assertSessionValidForProject(sessionId, rawSession);
    return rawSession;
  }

  private assertSessionValidForProject(sessionId: string, session: unknown): asserts session is AlongSession {
    if (!isAlongSession(session) || !this.matchesCurrentSession(sessionId, session)) {
      throw new Error(`Session malformed: ${sessionId}`);
    }
  }

  private async writeSessionState(session: AlongSession, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    await this.coordinator.withRuntimeLock(`session:${state}`, async () => {
      await this.writeSessionSnapshot(session, state, recoveryHint);
    });
  }

  private async writeSessionSnapshot(session: AlongSession, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    assertSafeSessionId(session.id);
    const nextIndex = await this.buildIndex(session, state);
    await this.coordinator.atomicWriteJson(getSessionFilePath(this.repoPath, session.id), session);
    await this.writePointer(session.id, state, recoveryHint);
    await this.writeIndex(nextIndex);
  }

  private async writePointerAndIndex(session: AlongSession, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    assertSafeSessionId(session.id);
    const nextIndex = await this.buildIndex(session, state);
    await this.writePointer(session.id, state, recoveryHint);
    await this.writeIndex(nextIndex);
  }

  private async writePointer(sessionId: string, state: SessionLifecycleState, recoveryHint: string): Promise<void> {
    assertSafeSessionId(sessionId);
    const pointer: CurrentSessionPointer = {
      sessionId,
      state,
      updatedAt: new Date().toISOString(),
      projectPath: this.repoPath,
      recoveryHint,
    };
    await this.coordinator.atomicWriteJson(getCurrentSessionPath(this.repoPath), pointer);
  }

  private async buildIndex(session: AlongSession, state: SessionLifecycleState): Promise<SessionIndexEntry[]> {
    assertSafeSessionId(session.id);
    const index = await this.readIndex();
    const next: SessionIndexEntry = {
      sessionId: session.id,
      state,
      startedAt: session.startedAt,
      updatedAt: new Date().toISOString(),
      projectPath: this.repoPath,
    };
    return [
      next,
      ...index.filter((item) => item.sessionId !== session.id),
    ];
  }

  private async writeIndex(index: SessionIndexEntry[]): Promise<void> {
    await this.coordinator.atomicWriteJson(getSessionIndexPath(this.repoPath), index);
  }

  private matchesCurrentSession(sessionId: string, session: AlongSession): boolean {
    return session.id === sessionId
      && session.plan.sessionId === sessionId
      && session.repoPath === this.repoPath
      && session.context.repoPath === this.repoPath;
  }
}
