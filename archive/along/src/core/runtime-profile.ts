import type { PermissionEnvelope, RuntimeProfile } from "./types";
import { defaultPermissionEnvelope, defaultRuntimeProfile } from "./types";
import { getRuntimeSettingsPath } from "./paths";
import { WriteCoordinator } from "./write-coordinator";

const runtimeModes = ["companion", "debug", "research"] as const;
const memoryModes = ["off", "session", "project_reviewed", "project_auto", "global_reviewed"] as const;
const presenceModes = ["ambient", "focused", "interactive", "resting"] as const;
const relationshipStyles = ["calm", "close", "reflective", "challenger"] as const;
const accountabilityLevels = ["off", "gentle", "direct", "strict"] as const;
const autonomyLevels = ["quiet", "suggestive", "proactive"] as const;

export async function loadRuntimeProfile(repoPath: string): Promise<RuntimeProfile> {
  const coordinator = new WriteCoordinator(repoPath);
  const raw = await coordinator.readJson<unknown>(getRuntimeSettingsPath(repoPath), {});
  return sanitizeRuntimeProfile(raw);
}

function sanitizeRuntimeProfile(raw: unknown): RuntimeProfile {
  const settings = isRecord(raw) ? raw : {};
  return {
    ...defaultRuntimeProfile,
    runtimeMode: pickEnum(settings.runtimeMode, runtimeModes, defaultRuntimeProfile.runtimeMode),
    memoryMode: pickEnum(settings.memoryMode, memoryModes, defaultRuntimeProfile.memoryMode),
    presenceMode: pickEnum(settings.presenceMode, presenceModes, defaultRuntimeProfile.presenceMode),
    relationshipStyle: pickEnum(settings.relationshipStyle, relationshipStyles, defaultRuntimeProfile.relationshipStyle),
    accountabilityLevel: pickEnum(settings.accountabilityLevel, accountabilityLevels, defaultRuntimeProfile.accountabilityLevel),
    autonomyLevel: pickEnum(settings.autonomyLevel, autonomyLevels, defaultRuntimeProfile.autonomyLevel),
    featureFlags: {
      ...defaultRuntimeProfile.featureFlags,
      ...sanitizeFeatureFlags(settings.featureFlags),
    },
  };
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function sanitizeFeatureFlags(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};

  const flags: Record<string, boolean> = {};
  for (const [key, flag] of Object.entries(value)) {
    if (typeof flag === "boolean") flags[key] = flag;
  }
  return flags;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function derivePermissionEnvelope(profile: RuntimeProfile): PermissionEnvelope {
  return {
    ...defaultPermissionEnvelope,
    canReadProject: profile.memoryMode !== "off",
    canReadAlongMemory: profile.memoryMode !== "off",
    canWriteSession: true,
    canWriteJournal: profile.memoryMode !== "off",
    canCreateMemoryCandidate: profile.memoryMode === "project_reviewed" || profile.memoryMode === "project_auto" || profile.memoryMode === "global_reviewed",
    canPromoteMemory: false,
    canUpdateGraph: profile.memoryMode !== "off",
    canShowStatus: true,
    canAskUser: true,
    canProactivelyMessage: false,
    canCallTools: false,
    canModifyProjectFiles: false,
    requiresReview: {
      memoryPromotion: profile.memoryMode !== "off",
      globalMemory: true,
      proceduralMemory: true,
      proactiveMessage: profile.autonomyLevel !== "quiet",
      projectFileWrite: true,
    },
  };
}
