import path from "node:path";
import os from "node:os";

export function getProjectAlongDir(repoPath: string): string {
  return path.join(repoPath, ".along");
}

export function getGlobalAlongDir(homeDir = os.homedir()): string {
  return path.join(homeDir, ".along");
}

export function getProjectGraphDir(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "graph");
}

export function getGlobalGraphDir(homeDir = os.homedir()): string {
  return path.join(getGlobalAlongDir(homeDir), "graph");
}

export function getRuntimeStatePath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "state.json");
}

export function getRuntimeSettingsPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "settings.json");
}

export function getCurrentSessionPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", "current.json");
}

export function getSessionIndexPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", "index.json");
}

export function getSessionFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "sessions", `${sessionId}.json`);
}

export function getEventsFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "events", `${sessionId}.jsonl`);
}

export function getContextPacketPath(repoPath: string, contextPacketId: string): string {
  return path.join(getProjectAlongDir(repoPath), "context", `${contextPacketId}.json`);
}

export function getReviewInboxPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "review", "inbox.json");
}

export function getTraceFilePath(repoPath: string, sessionId: string): string {
  return path.join(getProjectAlongDir(repoPath), "traces", `${sessionId}.jsonl`);
}

export function getRuntimeLockPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "locks", "runtime.lock");
}

export function getOpenThreadsDir(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "threads");
}

export function getOpenThreadsPath(repoPath: string): string {
  return path.join(getOpenThreadsDir(repoPath), "open-threads.json");
}

export function getDelegationsDir(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "delegations");
}

export function getDelegationRequestsPath(repoPath: string): string {
  return path.join(getDelegationsDir(repoPath), "requests.json");
}

export function getConductorSnapshotPath(repoPath: string): string {
  return path.join(getProjectAlongDir(repoPath), "conductor", "snapshot.json");
}
