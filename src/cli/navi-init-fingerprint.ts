import { createHash } from "node:crypto";

export interface InitFingerprintAction {
  kind: "create" | "modify" | "skip";
  relativePath: string;
  content?: string;
  previousContent?: string;
}

export interface InitFingerprintInput {
  contractVersion: 1;
  targetDir: string;
  candidateMap?: string;
  agentsBefore?: string;
  mapBefore?: string;
  actions: InitFingerprintAction[];
}

export function createInitPlanFingerprint(input: InitFingerprintInput): string {
  const canonicalInput = {
    contractVersion: input.contractVersion,
    targetDir: input.targetDir,
    candidateMap: input.candidateMap ?? null,
    agentsBefore: input.agentsBefore ?? null,
    mapBefore: input.mapBefore ?? null,
    actions: input.actions.map((action) => ({
      kind: action.kind,
      relativePath: action.relativePath,
      content: action.content ?? null,
      previousContent: action.previousContent ?? null,
    })),
  };

  return createHash("sha256").update(JSON.stringify(canonicalInput), "utf8").digest("hex");
}
