import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  alongEventKinds,
  contextSectionKinds,
  defaultPermissionEnvelope,
  defaultRuntimeProfile,
  reviewItemKinds,
  sessionLifecycleStates,
} from "../../src/core/types";
import {
  getContextPacketPath,
  getCurrentSessionPath,
  getEventsFilePath,
  getReviewInboxPath,
  getRuntimeLockPath,
  getRuntimeSettingsPath,
  getRuntimeStatePath,
  getSessionFilePath,
  getSessionIndexPath,
  getTraceFilePath,
} from "../../src/core/paths";

describe("runtime control-plane type constants", () => {
  it("declares approved session lifecycle states", () => {
    expect(sessionLifecycleStates).toEqual(["new", "active", "paused", "wrapped", "expired", "recovered"]);
  });

  it("keeps the conservative runtime defaults", () => {
    expect(defaultRuntimeProfile).toMatchObject({
      runtimeMode: "companion",
      memoryMode: "project_reviewed",
      presenceMode: "ambient",
      relationshipStyle: "calm",
      accountabilityLevel: "off",
      autonomyLevel: "quiet",
      featureFlags: {},
    });
  });

  it("denies project file writes and global memory promotion by default", () => {
    expect(defaultPermissionEnvelope.canModifyProjectFiles).toBe(false);
    expect(defaultPermissionEnvelope.requiresReview.globalMemory).toBe(true);
    expect(defaultPermissionEnvelope.requiresReview.proceduralMemory).toBe(true);
  });

  it("declares event, context, and review contract names", () => {
    expect(alongEventKinds).toContain("session_recovered");
    expect(alongEventKinds).toContain("user_refusal");
    expect(contextSectionKinds).toContain("permission_envelope");
    expect(reviewItemKinds).toContain("procedural_memory_candidate");
  });
});

describe("runtime control-plane paths", () => {
  it("maps runtime files under the project .along directory", () => {
    const repo = path.join("tmp", "demo");
    expect(getRuntimeStatePath(repo)).toBe(path.join(repo, ".along", "state.json"));
    expect(getRuntimeSettingsPath(repo)).toBe(path.join(repo, ".along", "settings.json"));
    expect(getCurrentSessionPath(repo)).toBe(path.join(repo, ".along", "sessions", "current.json"));
    expect(getSessionIndexPath(repo)).toBe(path.join(repo, ".along", "sessions", "index.json"));
    expect(getSessionFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "sessions", "session-1.json"));
    expect(getEventsFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "events", "session-1.jsonl"));
    expect(getContextPacketPath(repo, "context-1")).toBe(path.join(repo, ".along", "context", "context-1.json"));
    expect(getReviewInboxPath(repo)).toBe(path.join(repo, ".along", "review", "inbox.json"));
    expect(getTraceFilePath(repo, "session-1")).toBe(path.join(repo, ".along", "traces", "session-1.jsonl"));
    expect(getRuntimeLockPath(repo)).toBe(path.join(repo, ".along", "locks", "runtime.lock"));
  });
});
