import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

describe("Navi capability truthfulness", () => {
  it("uses the truthful Historical Along path for active Shared Desk references", async () => {
    const activeReferences = [
      "docs/navi/product-debt.md",
      "docs/navi/roadmap.md",
      ".agents/skills/navi/references/supervision-v1.md",
    ];

    for (const relativePath of activeReferences) {
      const text = await readRepoText(relativePath);
      expect(text, relativePath).not.toMatch(/(?<!archive\/along\/)src\/web/u);
    }
  });

  it("documents Codex task handoff without claiming background notifications", async () => {
    const [readme, chineseReadme, pluginReadme] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const surface of [readme, pluginReadme]) {
      expect(surface).toMatch(/decision-required[\s\S]*blocked[\s\S]*review-ready/i);
      expect(surface).toMatch(/Codex task-to-task[\s\S]*active session/i);
      expect(surface).toMatch(/no background watcher[\s\S]*notification service/i);
    }

    expect(chineseReadme).toMatch(/decision-required[\s\S]*blocked[\s\S]*review-ready/i);
    expect(chineseReadme).toMatch(/活跃会话[\s\S]*Codex 任务之间/i);
    expect(chineseReadme).toMatch(/不包含后台 watcher[\s\S]*通知服务/i);
  });

  it("distinguishes the latest tagged alpha from unreleased Lane Handoff behavior", async () => {
    const [readme, chineseReadme, pluginReadme] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    expect(readme).toMatch(
      /Latest tagged GitHub source release: `0\.1\.0-alpha\.3`[\s\S]*Current main branch:[\s\S]*unreleased[\s\S]*Lane Handoff[\s\S]*remains unreleased/i,
    );
    expect(chineseReadme).toMatch(
      /最新 tagged GitHub source release：`0\.1\.0-alpha\.3`[\s\S]*当前 main branch：[\s\S]*尚未发布[\s\S]*Lane Handoff[\s\S]*仍是未发布/i,
    );
    expect(pluginReadme).toMatch(
      /Latest tagged GitHub source release: `0\.1\.0-alpha\.3`[\s\S]*Current main[\s\S]*unreleased[\s\S]*Lane Handoff[\s\S]*remains unreleased/i,
    );
    expect(pluginReadme).not.toContain(
      "This repo-contained package is the GitHub alpha source-package form of Navi `0.1.0-alpha.3`.",
    );
  });

  it("documents the V1 workflow, drift levels, and confirmation gates", async () => {
    const reference = await readRepoText(".agents/skills/navi/references/working-thread-v1.md");

    expect(reference).toContain("Working Thread");
    expect(reference).toContain("Start / Resume Briefing");
    expect(reference).toContain("Impact-Based Drift Challenge");
    expect(reference).toContain("Layered Wrap-Up");
    expect(reference).toContain("none");
    expect(reference).toContain("low");
    expect(reference).toContain("medium");
    expect(reference).toContain("high");
    expect(reference).toContain("First Working Thread creation requires user confirmation");
    expect(reference).toContain("Durable write-back requires user confirmation");
    expect(reference).toContain("Do not implement Core/MCP");
  });

  it("documents the current Navi-first public narrative in the root README", async () => {
    const readme = await readRepoText("README.md");

    for (const expected of [
      "Navi helps non-expert users understand, supervise, and steer expert agents.",
      "Navi is an independent open-source product for supervising expert agents.",
      "Current main branch behavior includes Progress/Rhythm Maps, Challenge Layer, pause semantics, stage/vision supervision, and coordination guidance.",
      "Latest tagged GitHub source release:",
      "Current main branch:",
      "This alpha is a GitHub source package",
      "Codex skill/plugin behavior",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "navi init --expect-plan <fingerprint> --write",
      "Navi shows where the project is, what is missing, whether to continue, when to stop, how much validation is enough, and whether parallel work should wait or continue.",
      "Along is the parent/lab context and broader long-term product family.",
      "should be understandable without knowing Along",
      "Current installation, discovery, and project triggers use Navi identifiers only.",
      "legacy installation identifier",
      "explicit doctor-guided migration",
      "MCP, runtime, local app, background presence",
      "older Along companion ideas",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi is Along's current V1 product surface",
      "Navi's V1 alpha behavior centers on **Progress/Rhythm Maps** and **Challenge Layer** behavior",
      "`0.1.0-alpha.3` is ready as the latest GitHub source release",
    ]) {
      expect(readme).not.toContain(forbidden);
    }

    const promiseIndex = readme.indexOf("Navi helps non-expert users understand, supervise, and steer expert agents.");
    const alongIndex = readme.indexOf("Along is the parent/lab context");
    const compatibilityIndex = readme.indexOf(
      "Current installation, discovery, and project triggers use Navi identifiers only.",
    );

    expect(promiseIndex).toBeGreaterThanOrEqual(0);
    expect(alongIndex).toBeGreaterThan(promiseIndex);
    expect(compatibilityIndex).toBeGreaterThan(alongIndex);
  });

  it("keeps the Chinese README aligned with the public narrative system", async () => {
    const readme = await readRepoText("README.zh-CN.md");

    for (const expected of [
      "Navi 帮助非专家用户理解、监督并引导 expert agents。",
      "Navi 是一个独立的开源产品，用于监督 expert agents。",
      "当前 main branch 行为包括 Progress/Rhythm Maps、Challenge Layer、pause semantics、stage/vision supervision 和 coordination guidance。",
      "最新 tagged GitHub source release：",
      "当前 main branch：",
      "这个 alpha 是 GitHub source package",
      "Codex skill/plugin 行为",
      "project-local docs",
      "`navi init`",
      "source package verification",
      "npm run verify:plugin-package",
      "Navi 会说明项目现在在哪里、还缺什么、是否应该继续、什么时候该停、验证做到什么程度够，以及并行工作应该等待还是继续。",
      "Along 是 parent/lab context 和更长期的产品家族。",
      "不应该要求读者先理解 Along 才能理解 Navi",
      "当前 installation、discovery 和 project triggers 只使用 Navi identifiers。",
      "legacy installation identifier",
      "doctor-guided migration",
    ]) {
      expect(readme).toContain(expected);
    }

    for (const forbidden of [
      "Navi 是这个愿景中的第一个独立 V1 产品表面。",
      "`0.1.0-alpha.3` 是当前面向开发者和早期测试者的最新 GitHub source release。",
    ]) {
      expect(readme).not.toContain(forbidden);
    }
  });

  it("documents the source-alpha setup and project-init boundary", async () => {
    const [englishReadme, chineseReadme, packageReadme, initDoc, debt] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
      readRepoText("docs/navi/project-init.md"),
      readRepoText("docs/navi/product-debt.md"),
    ]);

    for (const readme of [englishReadme, chineseReadme, packageReadme]) {
      for (const expected of [
        "npm link",
        "navi doctor",
        "navi setup",
        "navi setup --write",
        "navi init",
        "navi init --expect-plan <fingerprint> --write",
      ]) {
        expect(readme).toContain(expected);
      }
    }

    expect(englishReadme).toContain("Setup once -> approve project init once -> use natural language");
    for (const expected of [
      "explicit",
      "does not initialize a target project",
      "does not reinstall the plugin",
      "not a normal daily step",
      "npm/marketplace/one-click installation remains out of scope",
      "`archive/along/src/web` is not the Navi alpha UI",
    ]) {
      expect(englishReadme).toContain(expected);
      expect(packageReadme).toContain(expected);
    }
    expect(chineseReadme).toContain("全局 setup 一次 -> 每个项目批准 init 一次 -> 之后使用自然语言");
    for (const expected of [
      "用户明确执行的 source-alpha 操作",
      "不会初始化目标项目",
      "不会重新安装 plugin",
      "不是日常步骤",
      "公开 npm/marketplace/一键安装仍不在范围内",
      "`archive/along/src/web` 不是 Navi alpha UI",
    ]) {
      expect(chineseReadme).toContain(expected);
    }
    expect(initDoc).toContain("Global capability: install the Navi source package and run `navi setup` once");
    expect(initDoc).toContain("`navi init` configures a target project. It does not install Navi again.");
    expect(initDoc).toContain("One explicit approval can authorize both actions as one bounded project initialization write.");
    expect(initDoc).toContain("navi init --map-file <candidate> --expect-plan <fingerprint> --write");
    expect(initDoc).not.toMatch(/\bnavi init --write(?=[`.;,\s]|$)/u);
    expect(debt).toContain("Source-alpha bootstrap is implemented");
    expect(debt).toContain("Public distribution remains open");
  });

  it("documents only fingerprint-bound actionable init writes in active READMEs", async () => {
    const activeReadmes = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
    ]);

    for (const readme of activeReadmes) {
      expect(readme).not.toMatch(/\bnavi init --write(?=[`.;,\s]|$)/u);

      expect(readme).toContain("Existing confirmed Map trigger path");
      expect(readme).toMatch(/^navi init$/mu);
      expect(readme).toMatch(/^navi init --expect-plan <fingerprint> --write$/mu);

      expect(readme).toContain("Fresh confirmed Map candidate path");
      expect(readme).toContain("Codex-guided candidate flow");
      expect(readme).toContain("advanced/internal integration detail");
      expect(readme).toMatch(
        /^navi init --map-file <confirmed-map-candidate>$/mu,
      );
      expect(readme).toMatch(
        /^navi init --map-file <confirmed-map-candidate> --expect-plan <fingerprint> --write$/mu,
      );
    }
  });

  it("marks the alpha 13 and alpha 14 directions as superseded historical evidence", async () => {
    const historicalSpecs = await Promise.all([
      readRepoText(
        "docs/superpowers/specs/2026-07-09-navi-alpha13-project-initialization-suggested-map-preview-design.md",
      ),
      readRepoText(
        "docs/superpowers/specs/2026-07-10-navi-alpha14-project-state-snapshot-design.md",
      ),
    ]);

    for (const spec of historicalSpecs) {
      expect(spec).toMatch(/^# .+\n\n> \*\*Superseded:\*\*/u);
      expect(spec).toContain("confirmed Project Map initialization journey");
      expect(spec).toContain(
        "2026-07-13-navi-confirmed-project-map-init-journey-design.md",
      );
      expect(spec).toContain("retained as historical design evidence");
    }
  });

  it("documents the Navi-only source installation and explicit legacy migration path", async () => {
    const [englishReadme, chineseReadme, packageReadme, initDoc, debt] = await Promise.all([
      readRepoText("README.md"),
      readRepoText("README.zh-CN.md"),
      readRepoText("plugins/navi/README.md"),
      readRepoText("docs/navi/project-init.md"),
      readRepoText("docs/navi/product-debt.md"),
    ]);

    for (const readme of [englishReadme, chineseReadme, packageReadme]) {
      for (const expected of [
        'codex plugin marketplace add "$PWD"',
        "codex plugin add navi@navi-source",
        "npm link",
        "navi doctor",
        "navi setup",
        "navi setup --write",
      ]) {
        expect(readme).toContain(expected);
      }

      expect(readme).toContain("npm run navi -- doctor");
      expect(readme).toMatch(/PATH|路径/);
      expect(readme).toMatch(/fallback|备用/);
      expect(readme).not.toMatch(/automatically (?:edit|modify).*PATH/i);
    }

    for (const expected of [
      "navi setup --remove",
      "navi setup --remove --write",
      "codex plugin remove navi@navi-source",
      "codex plugin marketplace remove navi-source",
      "npm unlink -g navi",
      "global Codex/plugin/npm state",
    ]) {
      expect(englishReadme).toContain(expected);
      expect(packageReadme).toContain(expected);
    }

    expect(chineseReadme).toContain("全局 Codex/plugin/npm 状态");
    expect(initDoc).toContain("`navi doctor` reports the project configuration separately from global discovery");
    expect(initDoc).toContain("It does not silently initialize or repair the project.");
    expect(debt).toContain("navi@navi-source");
    expect(debt).toContain("legacy migration");

    for (const primaryInstallDoc of [englishReadme, chineseReadme, packageReadme]) {
      expect(primaryInstallDoc).not.toContain("codex plugin add along-working-thread");
    }
    expect(packageReadme).not.toContain("Navi is the current V1 product surface of Along.");
  });

  it("gives every active README the same global-first legacy migration sequence", async () => {
    const readmes = await Promise.all([
      readRepoText("README.md").then((text) => ({
        text,
        marker: "If `navi doctor` reports a legacy-only installation",
        migrationActions: [
          "navi@navi-source",
          "short dual-install transition",
          "codex plugin remove <exact legacy selector>",
          "navi doctor",
          "navi setup --write",
          "does not scan or initialize target projects",
          "next use of a project with a recognized legacy trigger",
          "fingerprint-bound `navi init` upgrade",
        ],
      })),
      readRepoText("README.zh-CN.md").then((text) => ({
        text,
        marker: "如果 `navi doctor` 报告 legacy-only installation",
        migrationActions: [
          "navi@navi-source",
          "短暂 dual-install 过渡",
          "codex plugin remove <doctor 报告的精确 legacy selector>",
          "navi doctor",
          "navi setup --write",
          "不会扫描或初始化目标项目",
          "之后第一次进入带有 recognized legacy trigger 的项目时",
          "fingerprint-bound `navi init` 升级",
        ],
      })),
      readRepoText("plugins/navi/README.md").then((text) => ({
        text,
        marker: "If `navi doctor` reports a legacy-only installation",
        migrationActions: [
          "navi@navi-source",
          "short dual-install transition",
          "codex plugin remove <exact legacy selector>",
          "navi doctor",
          "navi setup --write",
          "does not scan or initialize target projects",
          "next use of a project with a recognized legacy trigger",
          "fingerprint-bound `navi init` upgrade",
        ],
      })),
    ]);

    for (const { text, marker, migrationActions } of readmes) {
      const readme = text.slice(text.indexOf(marker));
      let priorIndex = -1;
      for (const action of migrationActions) {
        const index = readme.indexOf(action, priorIndex + 1);
        expect(index).toBeGreaterThan(priorIndex);
        priorIndex = index;
      }
    }
  });

  it("positions the package as a Challenge Layer without expanding runtime scope", async () => {
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
    expect(manifest.description).toContain("Challenge Layer");
    expect(manifest.keywords).toEqual(expect.arrayContaining(["challenge-layer", "validation"]));
    expect(manifest.interface.longDescription).toContain("Challenge Moment");
    expect(manifest.interface.longDescription).toContain("not background autonomy");

    expect(readme).toContain("## Challenge Layer");
    expect(readme).toContain("Challenge Moment");
    expect(readme).toContain("Challenge Brief");
    expect(readme).toContain("anti-self-certification");
    expect(readme).toContain("Challenge after completion");
    expect(readme).toContain("fresh-session check");
    expect(readme).toContain("read-only review");
    expect(readme).toContain("user calibration");
    expect(readme).toContain("It does not make implementation success equal product proof.");

    expect(version).toContain("Challenge Layer");
    expect(version).toContain("0.1.0");
  });

  it("uses scoped plan authorization for listed local task commits without weakening approval boundaries", async () => {
    const [canonicalSkill, canonicalReference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervision-v1.md"),
    ]);

    expect(canonicalReference).toContain("approved bounded implementation or worktree plan");
    expect(canonicalReference).toContain("explicitly planned local task commits");
    expect(canonicalReference).toContain("Do not request separate approval for each such commit");
    expect(canonicalReference).toContain("unknown staged content");
    expect(canonicalReference).toContain("history rewriting");
    expect(canonicalReference).toContain("merge, push, tag, release");
    expect(canonicalReference).not.toContain("Stop for user approval before file writes outside the approved mode, commits, pushes");
    expect(canonicalReference).toContain("unplanned commit");
    expect(canonicalReference).toContain("user request not to commit");
    expect(canonicalReference).toContain("project-owned instructions outside the Navi managed block");
    expect(canonicalReference).toContain("cross-project");
    expect(canonicalReference).toContain("scope expansion");
    expect(canonicalReference).toContain("known-risk acceptance");

    expect(canonicalSkill).toContain("must not use pause semantics to bypass user approval");
    expect(canonicalSkill).toContain("must not silently escalate a bounded implementation task");
  });

  it("documents restrained positioning, validation, and version boundaries", async () => {
    const readme = await readRepoText("plugins/navi/README.md");
    const version = await readRepoText("plugins/navi/VERSION.md");
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-map-v1.md",
    );

    expect(readme).toContain("# Navi");
    expect(readme).toContain("Navi helps non-expert users understand, supervise, and steer expert agents.");
    expect(readme).toContain("`along-working-thread` is a legacy installation identifier.");
    expect(readme).toContain("## What it is");
    expect(readme).toContain("## What it is not");
    expect(readme).toContain("Codex plugin source package");
    expect(readme).toContain("turn-bound self-initiation");
    expect(readme).toContain("not a background autonomous agent");
    expect(readme).toContain("not an always-on companion");
    expect(readme).toContain("not a replacement for Codex, Hermes, Claude Code, or other agents");
    expect(readme).toContain("npm run verify:plugin-package");
    expect(readme).toContain("Fresh-session validation checklist");
    expect(readme).toContain("Please restore the current Navi Working Thread");
    expect(readme).toContain("rate usefulness, self-initiation, co-creator feel, and annoyance");

    expect(version).toContain("# Navi 0.1.0");
    expect(version).toContain("0.1.0-alpha.3");
    expect(version).toContain("independent product");
    expect(version).not.toContain("Navi as Along's current V1 product surface");
    expect(version).toContain("not a runtime capability upgrade");
    expect(version).toContain("Do not bump to 0.2.0");

    expect(reference).toContain("the Navi skill may be installed and readable");
    expect(reference).not.toContain("the Along Working Thread skill may be installed and readable");
  });
});
