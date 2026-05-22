import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ScriptedCompanionProvider } from "../../src/core/model-provider";
import { AlongRuntime, formatLocalJournalDate, stateForElapsed } from "../../src/core/runtime";
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
    expect(session.state).toBe("arriving");
    expect(session.plan.learningGoal).toContain("understand");

    const wrap = await runtime.wrapUp("I learned where to look first.");
    expect(wrap.journalPath).toContain(".along/journal");
    expect(wrap.remembered).toContain("I learned where to look first.");
    expect(wrap.state).toBe("wrap_up");
    expect(wrap.journalPreview).toContain("I learned where to look first.");
  });

  it("progresses through a bounded rhythm before wrap-up", () => {
    expect(stateForElapsed(0)).toBe("arriving");
    expect(stateForElapsed(4_000)).toBe("settling");
    expect(stateForElapsed(14_000)).toBe("quiet_focus");
    expect(stateForElapsed(31_000)).toBe("gentle_share");
    expect(stateForElapsed(48_000)).toBe("rest");
  });

  it("uses the local timezone date for journal file names", () => {
    const nearUtcMidnight = new Date("2026-05-22T16:30:00.000Z");
    expect(formatLocalJournalDate(nearUtcMidnight, "Asia/Hong_Kong")).toBe("2026-05-23");
    expect(formatLocalJournalDate(nearUtcMidnight, "America/Los_Angeles")).toBe("2026-05-22");
  });

  it("keeps generated folders out of the journal's looked-at list", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-runtime-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
    await fs.mkdir(path.join(repo, ".superpowers"));
    await fs.mkdir(path.join(repo, "dist"));
    await fs.mkdir(path.join(repo, "node_modules"));
    await fs.mkdir(path.join(repo, "src"));

    const runtime = new AlongRuntime({ repoPath: repo, homeDir: home });
    await runtime.start();
    const wrap = await runtime.wrapUp("I stayed with user-facing project context.");
    const journal = await fs.readFile(wrap.journalPath, "utf8");

    expect(journal).toContain("- src/");
    expect(journal).not.toContain("- .along/");
    expect(journal).not.toContain("- .superpowers/");
    expect(journal).not.toContain("- dist/");
    expect(journal).not.toContain("- node_modules/");
  });
});
