import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

async function repoPathExists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

function extractMarkdownSection(markdown: string, heading: string): string {
  const marker = `${heading}\n`;
  const start = markdown.indexOf(marker);
  expect(start, heading).toBeGreaterThanOrEqual(0);

  const level = heading.match(/^#+/u)?.[0].length;
  if (level === undefined) throw new Error(`Expected Markdown heading: ${heading}`);
  const contentStart = start + marker.length;
  const nextHeading = new RegExp(`\\n#{1,${level}} \\S`, "gu");
  nextHeading.lastIndex = contentStart;
  const match = nextHeading.exec(markdown);
  return markdown.slice(contentStart, match?.index ?? markdown.length);
}

describe("Navi Project Map contracts", () => {
  it("owns the complete Response Language Selection section outside the Working Thread reference", async () => {
    const [projectMap, workingThread] = await Promise.all([
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText(".agents/skills/navi/references/working-thread-v1.md"),
    ]);
    const responseLanguageSelection = extractMarkdownSection(
      projectMap,
      "## Response Language Selection",
    ).trim();

    expect(responseLanguageSelection).toBe(`For Navi Progress Maps and Rhythm Maps, the default response language should follow the user's current prompt.

Project records written in another language do not by themselves decide the response language. They are source evidence, not the answer-language selector.

English orientation prompts such as \`what's next\`, \`where are we\`, or \`continue\` should produce English map headings, plain-language explanations, recommended next step, confirmation gate, and risk wording. If a source Project Map or Rhythm Map uses Chinese stage labels such as \`[方向校准]\` or \`当前焦点\`, translate or bilingualize source stage labels so the English answer remains readable, for example \`[Direction alignment / 方向校准]\`.

Chinese orientation prompts should still allow Chinese headings and explanations. When the user's prompt language is mixed or unclear, prefer the language that best matches the current user-facing request, not the language of older project records.`);
    expect(workingThread).not.toContain("## Response Language Selection");
    expect(workingThread).not.toContain("the answer-language selector");
  });

  it("defines the global bootstrap handoff boundary", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-map-v1.md",
    );

    for (const text of [reference]) {
      expect(text).toContain("global bootstrap");
      expect(text).toContain("project-local Navi guidance");
      expect(text).toContain("best-effort read-only supervision");
      expect(text).toContain("do not repeat the init reminder in the same session");
      expect(text).toContain("prompt-backed, not a runtime interceptor");
    }
  });

  it("documents Navi Progress Map behavior for non-expert users", async () => {
    const skill = await readRepoText(".agents/skills/navi/SKILL.md");
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const challenge = await readRepoText(".agents/skills/navi/references/challenge-v1.md");

    for (const expected of [
      "Navi",
      "Progress Map",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Current position",
      "Completed",
      "What this means for your goal",
      "Still missing",
      "Recommended next step",
      "What you need to confirm now",
      "Main risk",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("visible product progress or internal preparation");
    for (const expected of [
      "stable target-project overall progress bar",
      "current-stage sub-progress bar",
      "Do not generate a new overall progress bar every time.",
      "Do not hardcode Navi's own stages when the user is asking about a different target project.",
      "If no stable project-level stage sequence exists yet",
      "Fresh sessions should prioritize accuracy over immediate orientation",
      "inspect the source-of-truth before outputting the Progress Map",
      "Do not guess a temporary stage bar just to answer faster.",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(skill).toContain("installed, active Codex project");
    expect(skill).toContain("Do not limit Navi Progress Map triggers to the Along repository");
    expect(challenge).toContain("Challenge Moment becomes the escalation behavior when the map reveals risk");
    expect(challenge).toContain("Navi helps the user supervise whether the agent's professional judgment is reliable enough to continue.");
    expect(challenge).toContain("claim it can automatically decide the final correct answer in every domain");
    expect(challenge).toContain("replace legal, medical, financial, engineering, or other high-risk professional responsibility");
  });

  it("documents alpha 13 global install versus project initialization boundary", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const initDoc = await readRepoText("docs/navi/project-init.md");

    for (const expected of [
      "Navi is installed globally once",
      "navi init initializes a target project",
      "does not install Navi again",
      "project-local initialization is the reliable path",
    ]) {
      expect(reference).toContain(expected);
      expect(initDoc).toContain(expected);
    }

    expect(reference).not.toContain("navi init --suggest-map --accept-suggested-map");
  });

  it("documents the confirmed Navi Project Map model and evidence rules", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "Project Map",
      ".navi/project-map.md",
      "navi_map: 1",
      "map_status: confirmed",
      "Desired Outcome",
      "Route To Outcome",
      "Current Position",
      "Current Boundary",
      "Next Decision",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "user-confirmed Map",
      "Existing project roadmaps are evidence",
      "not alternate Map paths",
      "must not be represented as a stored or stable Map",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("confirmed `.navi/project-map.md`");
    expect(reference).toContain("Stale Or Conflicting Evidence");
    expect(reference).not.toContain("docs/along/project-maps/");
  });

  it("documents compact horizontal rendering and mandatory current-position explanation", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "compact horizontal progress strip",
      "single-line stage strip",
      "Do not split the overall stage sequence across multiple lines",
      "[需求澄清] -> [方案比较] -> [原型设计]",
      "▲",
      "The strip answers \"where am I\"",
      "the explanation answers \"what does this position mean\"",
      "Every current position must be followed by a plain-language explanation",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("compact horizontal progress strip");
    expect(reference).toContain("single-line stage strip");
    expect(reference).toContain("plain-language explanation");
  });

  it("documents two-layer map defaults and local-only exceptions", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");

    const normalizedReference = reference.toLowerCase();
    const normalizedReadme = readme.toLowerCase();

    for (const expected of [
      "overall map first",
      "sub-progress must not be shown alone for orientation prompts",
      "current-stage internal progress is the second layer",
      "Only show current-stage internal progress alone when the user explicitly asks about a local task",
      "or when the stable overall map was just shown and has not changed",
    ]) {
      expect(normalizedReference).toContain(expected.toLowerCase());
    }

    for (const expected of [
      "overall map first",
      "sub-progress must not be shown alone",
    ]) {
      expect(normalizedReference).toContain(expected.toLowerCase());
      expect(normalizedReadme).toContain(expected.toLowerCase());
    }
  });

  it("documents Navi Rhythm Map behavior for flowing projects", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running project",
      "recurring daily, weekly, or periodic actions",
      "multiple parallel opportunities, routes, targets, or stakeholders",
      "external feedback that controls the next step",
      "repeated loops of refresh, screen, prepare, wait, follow up, and decide",
      "ongoing stewardship rather than one fixed deliverable",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "project shape",
      "whole long-running project",
      "bounded subtask",
      "linear subtask strip",
      "pick the narrowest useful map",
    ]) {
      expect(reference).toContain(expected);
    }

  });

  it("documents Rhythm Map rendering, examples, and downgrade behavior", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "项目节奏",
      "[周期刷新] + [日常准备] + [机会/对象等待] + [决策确认]",
      "当前主线",
      "[读取状态] -> [判断优先级] -> [执行最小闭环] -> [记录/等待反馈]",
      "This map does not express completion percentage.",
      "what the user must confirm",
      "where continuing will lead",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Internship Project",
      "[每周岗位刷新] + [每日笔试/面试准备] + [投递等待] + [岗位决策]",
      "[检查反馈] -> [完成今日练习] -> [刷新岗位池] -> [决定是否定制材料]",
      "status changes require evidence such as email, portal state, or screenshots",
      "material customization should wait until a specific target job is selected",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Example: Hong Kong Application Project",
      "[方向校准] + [导师/项目筛选] + [材料/表单准备] + [提交/外联跟进]",
      "[申请表单预检] -> [人工填报] -> [最终提交确认] -> [记录结果]",
      "[预检] -> [填表] -> [附件核对] -> [最终确认] -> [提交后记录]",
    ]) {
      expect(reference).toContain(expected);
    }
  });

  it("documents prompt-language following for Progress and Rhythm Maps", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "The current prompt controls response language",
      "Map language is evidence, not a response-language instruction",
      "Codex renders a candidate Map in the current prompt language",
    ]) {
      expect(reference).toContain(expected);
    }

  });

  it("documents source classification for non-code flowing workspaces", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "project-local handoff files",
      "session logs",
      "PROJECT_STATE",
      "TODO",
      "trackers",
      "workflow records",
      "valid project records",
      "Do not treat project-local handoff files as forbidden source-thread history",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Application, recruiting, outreach, research, and operations workspaces can be flowing projects",
      "Do not downgrade them to ordinary advice just because they are not software projects.",
      "When a user asks `接下来我们应该做什么？` in a Hong Kong application-style project",
      "should produce a Rhythm Map",
    ]) {
      expect(reference).toContain(expected);
    }

  });

  it("documents Navi project initialization as the reliable configuration path", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const readme = await readRepoText("plugins/navi/README.md");
    const initDoc = await readRepoText("docs/navi/project-init.md");

    for (const expected of [
      "Navi Project Initialization",
      "configure Navi for a target project",
      "global skill plus the managed project-local trigger",
      "asks for user confirmation before writing durable project files",
    ]) {
      expect(reference).toContain(expected);
    }

    for (const expected of [
      "Navi project initialization",
      "docs/navi/project-init.md",
      "guided confirmed baseline",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "# Navi Project Initialization",
      "One Preview And One Approval",
      "AGENTS.md",
      ".navi/project-map.md",
      "Guided Baseline Formation",
      "`navi init` configures a target project",
      "does not install Navi again",
      "Fresh-Session Validation",
    ]) {
      expect(initDoc).toContain(expected);
    }

    expect(reference).not.toContain("install Navi into a target project");
    expect(initDoc).not.toContain("Minimum install output");
  });

  it("documents uncertain evidence without creating a provisional Map", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");

    for (const expected of [
      "missing, invalid, unsupported, or stale Map",
      "best-effort read-only supervision",
      "must not be represented as a stored or stable Map",
      "do not invent a stable map",
    ]) {
      expect(reference).toContain(expected);
    }

    expect(reference).toContain("missing, invalid, unsupported, or stale Map");
    expect(reference).not.toContain("provisional map");
  });

  it("documents graphical progress bar validation in the package README", async () => {
    const readme = await readRepoText("plugins/navi/README.md");

    for (const expected of [
      "Project Map",
      "stable target-project stage sequence",
      "compact horizontal progress strip",
      "single-line stage strip",
      "Project Map source priority",
      ".navi/project-map.md",
      "must not draw a confident stable bar",
    ]) {
      expect(readme).toContain(expected);
    }
  });

  it("documents Rhythm Map validation in the package README and version boundary", async () => {
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");

    for (const expected of [
      "Rhythm Map",
      "flowing long-running projects",
      "weekly refresh",
      "daily preparation",
      "waiting for external feedback",
      "decision gate",
      "should not force a one-way overall progress bar",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const expected of [
      "internship-style project",
      "Hong Kong application-style project",
      "whole long-running project",
      "bounded subtask",
    ]) {
      expect(readme).toContain(expected);
    }

    expect(version).toContain("Progress/Rhythm Maps and Challenge Layer are the current V1 alpha mechanisms");
    expect(version).toContain("documentation-only behavior update");
  });

  it("documents one guided confirmed-map initialization journey in every active setup document", async () => {
    const activePaths = [
      "README.md",
      "README.zh-CN.md",
      "plugins/navi/README.md",
      "docs/navi/project-init.md",
    ];

    for (const activePath of activePaths) {
      const exists = await repoPathExists(activePath);
      expect(exists, activePath).toBe(true);
      if (!exists) continue;
      const document = await readRepoText(activePath);
      for (const expected of [
        "global setup once",
        "guided confirmed baseline",
        "one trigger + `.navi/project-map.md` preview",
        "one approved project init write",
        "fresh-session natural-language supervision",
      ]) {
        expect(document.toLowerCase()).toContain(expected.toLowerCase());
      }

      for (const forbidden of [
        "starter map",
        "provisional map",
        ".navi/state.md",
        "docs/along/project-maps/",
      ]) {
        expect(document.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it("documents shipped navi init scope in debt and roadmap docs", async () => {
    const debt = await readRepoText("docs/navi/product-debt.md");
    const roadmap = await readRepoText("docs/navi/roadmap.md");

    for (const expected of [
      "Status: confirmed-Map initialization addressed; calibration and public distribution open",
      "Source-alpha bootstrap is implemented",
    ]) {
      expect(debt).toContain(expected);
    }

    for (const expected of [
      "Calibrate the confirmed-Map init journey",
      "Global plugin installation, one-click sync, npm distribution, or marketplace installation",
    ]) {
      expect(roadmap).toContain(expected);
    }
  });

  it("positions the package around Navi Progress Map without expanding runtime scope", async () => {
    const manifest = JSON.parse(
      await readRepoText("plugins/navi/.codex-plugin/plugin.json"),
    ) as {
      version: string;
      description: string;
      keywords: string[];
      interface: {
        shortDescription: string;
        longDescription: string;
        defaultPrompt: string[];
      };
    };
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");

    expect(manifest.version).toBe("0.1.0");
    expect(manifest.description).toContain("Navi");
    expect(manifest.description).toContain("Progress Map");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["navi", "progress-map"]));
    expect(manifest.interface.shortDescription).toContain("Project progress");
    expect(manifest.interface.longDescription).toContain("non-expert users");
    expect(manifest.interface.longDescription).toContain("Progress Map");
    expect(manifest.interface.defaultPrompt).toEqual([
      "Show where this project stands, what comes next, and what I need to decide.",
      "Should we continue, stop, wait, or move to the next stage?",
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    ]);
    expect(manifest.interface.defaultPrompt).toHaveLength(3);

    expect(readme).toContain("## Navi");
    expect(readme).toContain("Progress Map");
    expect(readme).toContain("understand, supervise, and steer expert agents");
    expect(readme).toContain("Current position");
    expect(readme).toContain("What you need to confirm now");
    expect(readme).toContain("not a standalone general agent");
    expect(readme).toContain("When this package is installed, Navi Progress Map triggers apply in any active Codex project");
    expect(readme).toContain("Do not require the user to name Navi");
    expect(readme).toContain("accuracy-first");
    expect(readme).toContain("may inspect the target project's source-of-truth before outputting the Progress Map");
    expect(readme).toContain("does not replace necessary professional review");
    expect(readme).toContain("接下来我们应该做什么？");
    expect(readme).toContain("现在做到哪了？我看不懂。");
    expect(readme).toContain("继续吧。");
    expect(readme).toContain("stable target-project overall progress bar");
    expect(readme).toContain("current-stage sub-progress bar");
    expect(readme).toContain("这个方案可以吗？我不懂技术。");
    expect(readme).toContain("pre-approval check");

    expect(version).toContain("Navi");
    expect(version).toContain("Progress Map");
  });

  it("makes the confirmed Map contract authoritative in the canonical reference", async () => {
    const [canonicalReference, manifestSource] = await Promise.all([
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText("plugins/navi/.codex-plugin/plugin.json"),
    ]);
    const pluginManifest = JSON.parse(manifestSource) as {
      interface: { defaultPrompt: string[] };
    };
    const confirmedMapContract = [
      ".navi/project-map.md",
      "project-entry-v1.md",
      "Adaptive Baseline Formation",
      "Project Map schema, rendering, lifecycle, and maintenance",
      "Map language is evidence, not a response-language instruction",
      "meaningful navigation boundary",
      "project_status: active",
      "project_status: paused",
      "project_status: closed",
      "review-ready",
    ];

    for (const phrase of confirmedMapContract) {
      expect(canonicalReference).toContain(phrase);
    }

    expect(canonicalReference).not.toContain(
      "profile: coherent | conflicting | insufficient | stale",
    );

    expect(pluginManifest.interface.defaultPrompt).toContain(
      "Check for a confirmed .navi/project-map.md and help form the missing baseline before initialization.",
    );

    for (const stalePhrase of [
      "Map status: provisional",
      ".navi/state.md",
      "navi init --suggest-map",
      "write only a provisional trigger",
    ]) {
      expect(canonicalReference).not.toContain(stalePhrase);
    }
  });

  it("routes adaptive baseline formation to its owner before the combined approved initialization preview", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const adaptive = extractMarkdownSection(reference, "#### Adaptive Baseline Formation");
    const finalPreview = extractMarkdownSection(reference, "#### Final Preview And Activation");

    expect(adaptive).toContain("project-entry-v1.md");
    expect(adaptive).toContain("Project Map schema, rendering, lifecycle, and maintenance");
    expect(adaptive).toMatch(
      /hand[\s\S]*adaptive project entry[\s\S]*bounded evidence profiling[\s\S]*profile-to-strategy routing[\s\S]*baseline formation[\s\S]*project-entry-v1\.md/i,
    );
    for (const duplicatedDetail of [
      "coherent",
      "conflicting",
      "insufficient",
      "stale",
      "Evidence-First Candidate",
      "Conflict Resolution",
      "Guided Baseline Formation",
      "Targeted Code Check",
    ]) {
      expect(adaptive).not.toContain(duplicatedDetail);
    }
    expect(finalPreview).toMatch(/One final preview[\s\S]*\.navi\/project-map\.md[\s\S]*AGENTS\.md/i);
    expect(finalPreview).toMatch(/One approval[\s\S]*both writes[\s\S]*Map is written first[\s\S]*trigger last/i);
  });

  it("hands unclear project scope to the adaptive-entry owner", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const projectShape = extractMarkdownSection(reference, "### Project Shape Selection");

    expect(projectShape).toMatch(
      /unclear scope[\s\S]*project-entry-v1\.md[\s\S]*rather than inventing or storing stages/i,
    );
    expect(projectShape).not.toContain("Guided Baseline Formation");
  });

  it("routes valid confirmed Map state before adaptive baseline formation", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const initialization = extractMarkdownSection(reference, "### Navi Project Initialization");

    const stateFirstIndex = initialization.indexOf("#### Project State First");
    const adaptiveIndex = initialization.indexOf("#### Adaptive Baseline Formation");
    expect(stateFirstIndex).toBeGreaterThanOrEqual(0);
    expect(adaptiveIndex).toBeGreaterThan(stateFirstIndex);
    expect(initialization).toMatch(
      /valid confirmed `?\.navi\/project-map\.md`?[\s\S]*skip adaptive baseline formation[\s\S]*existing Project Map behavior/i,
    );
    expect(initialization).toMatch(
      /only the managed trigger is missing[\s\S]*`navi init`[\s\S]*trigger-only preview and activation/i,
    );
    expect(initialization).toMatch(/do not reconfirm or regenerate the baseline/i);
  });

  it("requires the ordered private-candidate, preview, approval, fingerprinted-apply, and cleanup adapter journey", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const sections = [extractMarkdownSection(reference, "#### Final Preview And Activation")];
    const orderedContract = [
      /create a private candidate file outside the target project/i,
      /navi init --map-file <candidate>/i,
      /one combined Map\+trigger preview/i,
      /obtain approval/i,
      /navi init --map-file <candidate> --expect-plan <fingerprint> --write/i,
      /remove the private candidate after success or explicit abandonment/i,
    ];

    for (const section of sections) {
      let previousIndex = -1;
      for (const phrase of orderedContract) {
        const index = section.search(phrase);
        expect(index).toBeGreaterThan(previousIndex);
        previousIndex = index;
      }
    }
  });

  it("scopes adaptive answers, language, and stale-evidence challenge to their policy sections", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const model = extractMarkdownSection(reference, "### Confirmed Project Map Model");
    const daily = extractMarkdownSection(reference, "### Daily Supervision Behavior");
    const stale = extractMarkdownSection(reference, "#### Stale Or Conflicting Evidence");

    for (const section of [model, daily]) {
      expect(section).toMatch(/relevant Map subset|not a (fixed|required) response template/i);
      expect(section).toMatch(/current prompt|user's current prompt/i);
    }
    expect(model).toMatch(/Next-step questions[\s\S]*Current Position[\s\S]*Next Decision/i);
    expect(model).toMatch(/vision-distance questions[\s\S]*Route To Outcome/i);
    expect(stale).toMatch(/challenged judgment[\s\S]*strongest verifiable evidence/i);
    expect(stale).toMatch(/do not invent a stable map or rewrite it silently/i);
    expect(stale).toMatch(/meaningful navigation boundary/i);
  });

  it("binds maintenance, lifecycle, reopening, and worktree review to decision boundaries", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/project-map-v1.md");
    const daily = extractMarkdownSection(reference, "### Daily Supervision Behavior");
    const maintenance = extractMarkdownSection(reference, "### Map Maintenance And Authorization");
    const lifecycle = extractMarkdownSection(reference, "### Project Lifecycle");
    const parallel = extractMarkdownSection(reference, "### Parallel Work And Review Readiness");

    expect(daily).toMatch(/clear bounded tasks[\s\S]*approved acceptance point/i);
    expect(maintenance).toMatch(/meaningful navigation boundary[\s\S]*preview the patch[\s\S]*approval/i);
    expect(maintenance).toMatch(/explicitly covers[\s\S]*Map maintenance[\s\S]*smallest Map patch/i);
    expect(lifecycle).toMatch(/project_status: paused[\s\S]*stay quiet without continuation pressure/i);
    expect(lifecycle).toMatch(/project_status: closed[\s\S]*do not recommend the old route/i);
    expect(lifecycle).toMatch(/Reopening does not trust the old Current Position[\s\S]*confirmation before project_status: active/i);
    expect(parallel).toMatch(/review-ready[\s\S]*Lane Handoff[\s\S]*natural checkpoint/i);
    expect(parallel).toMatch(/continue[\s\S]*non-conflicting/i);
  });

  it("rejects contradictory stored-Map and legacy-path guidance across canonical contracts", async () => {
    const contracts = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
    ]);

    for (const contract of contracts) {
      expect(contract).not.toMatch(/provisional (Project |Rhythm )?Map/i);
      expect(contract).not.toContain("docs/along/project-maps/");
      expect(contract).not.toContain(".navi/state.md");
      expect(contract).not.toContain("navi init --suggest-map");
      expect(contract).not.toContain("write only a provisional trigger");
      expect(contract).not.toMatch(/stored structure is (a|required as a) response template/i);
      expect(contract).not.toMatch(/rewrite (the )?Map silently/i);
    }
  });

  it("owns the dual-boundary completion and compatibility policy", async () => {
    const projectMap = await readRepoText(
      ".agents/skills/navi/references/project-map-v1.md",
    );

    expect(projectMap).toMatch(
      /Outcome Boundary[\s\S]*Enough Outcome[\s\S]*Acceptance Evidence[\s\S]*Outside This Boundary[\s\S]*Revisit Trigger/i,
    );
    expect(projectMap).toMatch(
      /Outcome Boundary[\s\S]*whole current goal[\s\S]*Current Boundary[\s\S]*current stage/i,
    );
    expect(projectMap).toMatch(
      /version 1[\s\S]*legacy[\s\S]*readable[\s\S]*version 2[\s\S]*new/i,
    );
    expect(projectMap).toMatch(
      /Existing Boundary[\s\S]*Proposed Boundary[\s\S]*Reason For Change[\s\S]*Decision Required/i,
    );
    expect(projectMap).toMatch(/ordinary commits[\s\S]*do not[\s\S]*reconfirm/i);
    expect(projectMap).toMatch(/Acceptance Evidence[\s\S]*quiet/i);
  });

  it("distinguishes legacy v1 anchors from required v2 anchors", async () => {
    const projectMap = await readRepoText(
      ".agents/skills/navi/references/project-map-v1.md",
    );
    const model = extractMarkdownSection(projectMap, "### Confirmed Project Map Model");
    const legacyAnchors = model.match(
      /Version 1 legacy-readable Maps use these stable required anchors:\n(?<anchors>[\s\S]*?)\n\nVersion 2 Maps use these stable required anchors:/,
    )?.groups?.anchors;
    const currentAnchors = model.match(
      /Version 2 Maps use these stable required anchors:\n(?<anchors>[\s\S]*?)\n\nOptional Parallel Lanes/,
    )?.groups?.anchors;

    expect(legacyAnchors).toBeDefined();
    expect(legacyAnchors).toContain("Desired Outcome");
    expect(legacyAnchors).toContain("Route To Outcome");
    expect(legacyAnchors).not.toContain("Outcome Boundary");
    expect(currentAnchors).toBeDefined();
    expect(currentAnchors).toContain("Desired Outcome");
    expect(currentAnchors).toContain("Outcome Boundary");
    expect(currentAnchors).toContain("Route To Outcome");
  });
});
