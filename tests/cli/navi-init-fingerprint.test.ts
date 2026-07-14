import { describe, expect, it } from "vitest";
import { createInitPlanFingerprint } from "../../src/cli/navi-init-fingerprint";

const input = {
  contractVersion: 1 as const,
  targetDir: "/tmp/project",
  candidateMap: "confirmed map\n",
  agentsBefore: undefined,
  mapBefore: undefined,
  actions: [
    { kind: "create" as const, relativePath: ".navi/project-map.md", content: "confirmed map\n" },
    { kind: "create" as const, relativePath: "AGENTS.md", content: "trigger\n" },
  ],
};

describe("navi init plan fingerprint", () => {
  it("is deterministic for identical exact input", () => {
    expect(createInitPlanFingerprint(input)).toBe(createInitPlanFingerprint(structuredClone(input)));
  });

  it.each([
    ["candidate", { ...input, candidateMap: "changed\n" }],
    ["target", { ...input, targetDir: "/tmp/other" }],
    ["agents", { ...input, agentsBefore: "new instructions\n" }],
    ["map", { ...input, mapBefore: "existing\n" }],
    ["actions", { ...input, actions: [...input.actions].reverse() }],
  ])("changes when %s changes", (_name, changed) => {
    expect(createInitPlanFingerprint(changed)).not.toBe(createInitPlanFingerprint(input));
  });
});
