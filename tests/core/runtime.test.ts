import { describe, expect, it } from "vitest";
import { ScriptedCompanionProvider } from "../../src/core/model-provider";
import { presenceStates } from "../../src/core/types";

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
