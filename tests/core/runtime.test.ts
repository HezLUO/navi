import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ScriptedCompanionProvider } from "../../src/core/model-provider";
import { AlongRuntime } from "../../src/core/runtime";
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

describe("Along runtime", () => {
  it("starts with a bounded curiosity and writes memory on wrap-up", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
    await fs.writeFile(path.join(repo, "package.json"), JSON.stringify({ scripts: { test: "vitest" } }));

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    const session = await runtime.start();
    expect(session.state).toBe("settling");
    expect(session.plan.learningGoal).toContain("understand");

    const wrap = await runtime.wrapUp("I learned where to look first.");
    expect(wrap.journalPath).toContain(".along/journal");
    expect(wrap.remembered).toContain("I learned where to look first.");
  });
});
