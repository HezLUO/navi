import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

const root = process.cwd();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(absolute) : [absolute];
  }));
  return files.flat();
}

describe("Current Navi repository surface", () => {
  it("keeps navi init responsibilities in focused modules", async () => {
    const expected = {
      "src/cli/navi-init.ts": ["runNaviInitCli", "parseInitArgs", "renderInitPlan"],
      "src/cli/navi-init-plan.ts": ["buildInitPlan", "resolveTargetPath"],
      "src/cli/navi-init-apply.ts": ["applyInitPlan"],
      "src/cli/navi-project-trigger.ts": ["renderAgentsBlock", "recognizeNaviManagedBlock", "inspectProjectTrigger"],
    };
    for (const [relative, exports] of Object.entries(expected)) {
      const text = await fs.readFile(path.join(root, relative), "utf8");
      for (const name of exports) expect(text, relative).toMatch(new RegExp(`export (?:async )?(?:function|const|type|interface) ${name}|export \\{[^}]*${name}`));
    }
  });

  it("keeps active Navi docs outside the Historical Along namespace", async () => {
    for (const relative of [
      "docs/navi/README.md",
      "docs/navi/calibration-log.md",
      "docs/navi/product-debt.md",
      "docs/navi/roadmap.md",
      "docs/navi/design-history.md",
    ]) {
      await expect(fs.stat(path.join(root, relative))).resolves.toBeDefined();
    }
    await expect(fs.stat(path.join(root, "docs/along"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps the product-debt complexity regression gate and priority rule", async () => {
    const debt = await fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8");

    expect(debt).toContain("## Complexity Regression Gate");
    expect(debt).toContain("Does it create a second state, rule, or template authority?");
    expect(debt).toContain("Being easy to parallelize does not establish product priority.");
  });

  it("records Outcome Boundary calibration as the current bounded gate", async () => {
    const [history, roadmap] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
    ]);
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
    const historyPhase = history.match(/## Current Phase\n(?<phase>[\s\S]*?)\n## /)?.groups?.phase ?? "";
    const roadmapPhase = roadmap.match(/## Current Phase\n(?<phase>[\s\S]*?)\n## /)?.groups?.phase ?? "";

    for (const currentPhase of [historyPhase, roadmapPhase]) {
      expect(currentPhase).toContain("Supervised Delivery Loop V1 is integrated");
      expect(currentPhase).toMatch(/Outcome Boundary[\s\S]*real-project calibration/i);
      expect(currentPhase).toContain("Product Complete");
      expect(currentPhase).not.toContain(
        "adaptive project entry implementation is the current bounded gate",
      );
    }

    expect(active).toContain(
      "`docs/superpowers/specs/2026-07-16-navi-adaptive-project-entry-design.md`",
    );
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-16-navi-adaptive-project-entry.md`",
    );
  });

  it("documents the unreleased version-2 Project Map write contract", async () => {
    const [projectInit, roadmap, readme] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/project-init.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "README.md"), "utf8"),
    ]);

    expect(projectInit).toMatch(/navi_map: 2[\s\S]*Outcome Boundary/i);
    expect(projectInit).toMatch(/version 1[\s\S]*readable[\s\S]*does not require reinitialization/i);
    expect(projectInit).toMatch(/preview[\s\S]*fingerprint[\s\S]*approval/i);
    expect(projectInit).toMatch(
      /parsed metadata[\s\S]*anchor ranges[\s\S]*line-ending normalization[\s\S]*every other byte/i,
    );
    expect(roadmap).toMatch(/Outcome Boundary[\s\S]*real-project calibration/i);
    expect(readme).toMatch(/current main[\s\S]*unreleased/i);
    expect(readme).not.toMatch(
      /runtime scheduler is included|background service is included/i,
    );
  });

  it("requires both current boundary and next decision in current entry docs", async () => {
    const englishSurfaces = await Promise.all([
      "README.md",
      "plugins/navi/README.md",
      "docs/navi/project-init.md",
    ].map((relative) => fs.readFile(path.join(root, relative), "utf8")));
    const chineseReadme = await fs.readFile(path.join(root, "README.zh-CN.md"), "utf8");

    for (const surface of englishSurfaces) {
      expect(surface).toMatch(/both Current Boundary and Next Decision/i);
      expect(surface).not.toMatch(/Next Decision or Current Boundary|Current Boundary or Next Decision/i);
    }
    expect(chineseReadme).toContain("同时包含 Current Boundary 和 Next Decision");
    expect(chineseReadme).not.toMatch(/Next Decision 或 Current Boundary|Current Boundary 或 Next Decision/i);
  });

  it("lists the approved Supervised Delivery Loop design as active", async () => {
    const history = await fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8");
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    expect(active).toContain("`docs/superpowers/specs/2026-07-14-navi-supervised-delivery-loop-design.md`");
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-15-navi-supervised-delivery-loop.md`",
    );
  });

  it("records Distribution feasibility as a separate approved lane", async () => {
    const [history, roadmap, debt] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
    ]);

    expect(history).toContain(
      "docs/superpowers/specs/2026-07-17-navi-distribution-ready-design.md",
    );
    expect(history).toContain(
      "docs/superpowers/plans/2026-07-17-navi-distribution-feasibility.md",
    );
    expect(roadmap).toMatch(/Codex-first Product Complete[\s\S]*one remaining gate/i);
    expect(roadmap).toMatch(/Distribution feasibility[\s\S]*separately approved/i);
    expect(roadmap).toMatch(/Product Complete calibration[\s\S]*neither replaced nor declared complete/i);
    expect(debt).toMatch(/package-local init[\s\S]*real installation calibration/i);
    expect(debt).toMatch(/Public Plugin Directory[\s\S]*not a prerequisite/i);
  });

  it("keeps supervised delivery contracts in one active owner", async () => {
    const [skill, delivery, supervision] = await Promise.all([
      fs.readFile(path.join(root, ".agents/skills/navi/SKILL.md"), "utf8"),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervised-delivery-v1.md"),
        "utf8",
      ),
      fs.readFile(
        path.join(root, ".agents/skills/navi/references/supervision-v1.md"),
        "utf8",
      ),
    ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(delivery).toContain("NAVI_VALIDATION_RESULT");
    expect(supervision).not.toContain("NAVI_VALIDATION_RESULT\nversion: 1");
  });

  it("separates global legacy cutover from project-local migration", async () => {
    const [readme, chineseReadme, pluginReadme, projectInit, designHistory] = await Promise.all([
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "README.zh-CN.md"), "utf8"),
      fs.readFile(path.join(root, "plugins/navi/README.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/project-init.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
    ]);

    for (const text of [readme, pluginReadme]) {
      expect(text).toContain("short dual-install transition");
      expect(text).toContain("codex plugin remove <exact legacy selector>");
      expect(text).toContain("does not scan or initialize target projects");
      expect(text).toContain("next use of a project with a recognized legacy trigger");
      expect(text).not.toMatch(/preview an exact project trigger upgrade[\s\S]*validate the target project[\s\S]*remove the exact legacy selector/i);
    }

    expect(chineseReadme).toContain("短暂 dual-install 过渡");
    expect(chineseReadme).toContain("codex plugin remove <doctor 报告的精确 legacy selector>");
    expect(chineseReadme).toContain("不会扫描或初始化目标项目");
    expect(projectInit).toContain("Global migration is not a project-initialization prerequisite");
    expect(projectInit).toContain("fingerprint-bound");
    const active = designHistory.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
    expect(active).toContain("docs/superpowers/specs/2026-07-15-navi-source-alpha-legacy-migration-design.md");
    expect(active).toContain("docs/superpowers/plans/2026-07-15-navi-source-alpha-legacy-migration.md");
  });

  it("keeps active tests and fixtures independent from Historical Along docs", async () => {
    for (const relativeDir of ["tests/cli", "tests/fixtures", "tests/package", "tests/skills"]) {
      const activeTestFiles = await listFiles(path.join(root, relativeDir));
      for (const file of activeTestFiles) {
        const testSource = await fs.readFile(file, "utf8");
        expect(testSource, path.relative(root, file)).not.toContain("archive/along/docs/");
      }
    }
  });

  it("keeps Historical Along outside Current Navi defaults", async () => {
    expect(packageJson.scripts).toEqual({
      navi: "./src/cli/navi-bin.mjs",
      "build:plugin-init": "node scripts/build-plugin-init.mjs",
      "check:plugin-init": "node scripts/build-plugin-init.mjs --check",
      "stage:plugin-distribution": "node scripts/stage-plugin-distribution.mjs",
      test: "vitest run",
      "test:watch": "vitest",
      typecheck: "tsc --noEmit",
      "verify:plugin-package": "node scripts/verify-plugin-package.mjs",
    });
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.devDependencies).toEqual({
      "@types/node": "^22.10.0",
      esbuild: "^0.28.1",
      tsx: "^4.19.0",
      typescript: "^5.7.0",
      vitest: "^2.1.0",
    });

    const activeFiles = await listFiles(path.join(root, "src"));
    expect(activeFiles.every((file) => file.includes(`${path.sep}src${path.sep}cli${path.sep}`))).toBe(true);
    expect(await fs.readFile(path.join(root, "archive/along/README.md"), "utf8"))
      .toMatch(/Historical Along Evidence[\s\S]*not a supported runnable subsystem/i);
  });

  it("does not import archived code from active source or tests", async () => {
    const activeFiles = [
      ...(await listFiles(path.join(root, "src"))),
      ...(await listFiles(path.join(root, "tests"))),
    ].filter((file) => /\.(?:ts|mjs)$/.test(file));

    for (const file of activeFiles) {
      const text = await fs.readFile(file, "utf8");
      expect(text, path.relative(root, file)).not.toMatch(
        /(?:from\s+|import\()["'][^"']*(?:archive\/along|src\/(?:core|mcp|server|web))/
      );
    }
  });

  it("indexes active task routing authority while deferring main-turn switching", async () => {
    const [history, roadmap, debt] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
    ]);
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    expect(active).toContain(
      "`docs/superpowers/specs/2026-07-18-navi-codex-model-reasoning-routing-design.md`",
    );
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-18-navi-task-model-routing-foundation.md`",
    );
    expect(history).toMatch(/Task Routing Foundation model-routing design and plan remain Active authority/i);
    expect(history).toMatch(/Main Turn Host Adapter[\s\S]*superseded by the current boundary/i);
    expect(roadmap).toMatch(/task-creation and follow-up boundaries[\s\S]*Execution and Validation Tasks/i);
    expect(roadmap).toMatch(/Main turns keep the user's selected model[\s\S]*does not switch the active Main turn/i);
    expect(roadmap).toMatch(/Main Turn Host Adapter and a Navi local panel are deferred[\s\S]*not part of the current Codex-first Product Complete gate/i);
    expect(roadmap).toMatch(/One passing joint natural sample is sufficient[\s\S]*do not create an artificial task merely to test routing/i);
    expect(debt).toMatch(/host model catalog[\s\S]*natural calibration/i);
    expect(debt).toMatch(/Main turns keep the user's selected model[\s\S]*does not switch the active Main turn/i);
    expect(debt).toMatch(/Main Turn Host Adapter and a Navi local panel are intentionally deferred/i);
    expect(debt).toMatch(/One passing joint natural sample is sufficient[\s\S]*do not create an artificial task merely to test routing/i);
  });

  it("records bounded dependency restore as active but uncalibrated", async () => {
    const [history, calibration] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
    ]);
    const active = history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";
    const dependencyRecord = calibration.match(
      /## 2026-07-16 - Bounded Project-Local `npm ci` Preauthorization\n(?<entry>[\s\S]*?)(?=\n## |$)/,
    )?.groups?.entry ?? "";

    expect(active).toContain(
      "`docs/superpowers/specs/2026-07-18-navi-bounded-dependency-restore-design.md`",
    );
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-18-navi-bounded-dependency-restore.md`",
    );
    expect(dependencyRecord).toMatch(
      /implemented in current source[\s\S]*natural calibration pending/i,
    );
    expect(dependencyRecord).not.toMatch(/Product Complete[^\n]*closed/i);
  });

  it("records plan and delivery reliability as active but uncalibrated", async () => {
    const [history, roadmap, debt, calibration] = await Promise.all([
      fs.readFile(path.join(root, "docs/navi/design-history.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/roadmap.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/product-debt.md"), "utf8"),
      fs.readFile(path.join(root, "docs/navi/calibration-log.md"), "utf8"),
    ]);
    const active =
      history.match(/## Active\n(?<entries>[\s\S]*?)\n## /)?.groups?.entries ?? "";

    expect(active).toContain(
      "`docs/superpowers/specs/2026-07-19-navi-plan-delivery-reliability-design.md`",
    );
    expect(active).toContain(
      "`docs/superpowers/plans/2026-07-19-navi-plan-delivery-reliability.md`",
    );
    expect(roadmap).toMatch(
      /Plan And Delivery Reliability V1[\s\S]*one natural joint calibration/i,
    );
    expect(debt).toContain("### 10. Plan And Delivery Reliability Debt");
    expect(debt).toMatch(
      /general Markdown parser[\s\S]*not justified[\s\S]*natural calibration/i,
    );
    expect(calibration).toContain(
      "## 2026-07-18 - Repeated Unsatisfiable Plan-Artifact Decisions",
    );
    expect(calibration).toContain(
      "## 2026-07-18 - Validation Result Printed But Not Delivered",
    );
    expect(calibration).toMatch(
      /user relay count: 0[\s\S]*meaningless\s+continue count: 0/i,
    );
    expect(roadmap).not.toMatch(/Product Complete is closed/i);
  });
});
