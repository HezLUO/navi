import { describe, expect, it } from "vitest";
import {
  defaultConductorPreferences,
  delegationModeLabels,
  openThreadStatuses,
  threadAttentionActions,
  judgmentMergeClassifications,
} from "../../src/core/types";

describe("living conductor contracts", () => {
  it("defines the Open Thread lifecycle states", () => {
    expect(openThreadStatuses).toEqual(["open", "watching", "needs_user", "delegated", "resolved", "archived"]);
  });

  it("defines deterministic attention actions", () => {
    expect(threadAttentionActions).toEqual(["silent", "thread_update", "read_only_delegation", "digest", "intervention"]);
  });

  it("separates user-facing delegation labels from authority", () => {
    expect(delegationModeLabels).toEqual(["local_only", "ask_before_delegation", "read_only_auto", "write_requires_approval"]);
    expect(defaultConductorPreferences.delegationModeLabel).toBe("read_only_auto");
    expect(defaultConductorPreferences.projectWritePermission).toBe(false);
  });

  it("classifies Judgment Merge outcomes", () => {
    expect(judgmentMergeClassifications).toContain("contradicts_current_judgment");
    expect(judgmentMergeClassifications).toContain("adds_new_risk");
  });
});
