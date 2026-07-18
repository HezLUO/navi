import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL("../../" + relativePath, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const marker = heading + "\n";
  const start = markdown.indexOf(marker);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  const contentStart = start + marker.length;
  const nextHeading = /\n## /gu;
  nextHeading.lastIndex = contentStart;
  const match = nextHeading.exec(markdown);
  return markdown.slice(contentStart, match?.index ?? markdown.length);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/[|`]/gu, " ").replace(/\s+/gu, " ").trim();
}

describe("Navi Plan Reliability V1", () => {
  it("defines the contract and both bounded checkpoints", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const contract = extractSection(reference, "## Execution Contract Fields");
    const checkpoints = normalizeWhitespace(
      extractSection(reference, "## Plan Checkpoints"),
    );

    expect(contract).toContain("plan_satisfiability_check: required");
    expect(contract).toContain("plan_artifact_correction: bounded");
    expect(normalizeWhitespace(contract)).toContain(
      "default Navi Supervised Delivery policy rather than a new per-defect user permission",
    );
    expect(checkpoints).toContain("Checkpoint 1: Before Plan Submission");
    expect(checkpoints).toContain("Checkpoint 2: Execution Preflight");
    expect(checkpoints).toContain(
      "Evaluate explicit regular expressions against the exact rendered prose",
    );
    expect(checkpoints).toContain(
      "complete one aggregate scan before reporting or correcting any defect",
    );
    expect(checkpoints).toContain("A clean preflight remains quiet");
  });

  it("separates mechanical artifacts from semantic decisions", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const eligibility = normalizeWhitespace(
      extractSection(reference, "## Mechanical Correction Eligibility"),
    );
    const fixtures = normalizeWhitespace(
      extractSection(reference, "## Classification Fixtures"),
    );

    for (const unchanged of [
      "product meaning",
      "authorized files and ownership",
      "permissions and risk",
      "acceptance criteria and validation budget",
      "stop conditions",
    ]) {
      expect(eligibility).toContain(unchanged);
    }
    expect(fixtures).toContain(
      "Hard-wrapped Markdown breaks a literal-space assertion Mechanical Use an equivalent whitespace-tolerant assertion",
    );
    expect(fixtures).toContain(
      "A scope-audit command runs before its intended commit Mechanical Run it after that commit and record the timing correction",
    );
    expect(fixtures).toContain(
      "An approved safety requirement is missing from the plan Semantic Return one aggregated decision-required event",
    );
    expect(fixtures).toContain(
      "A change reduces verification or expands files Semantic Return one aggregated decision-required event",
    );
  });

  it("allows one aggregate correction round and compact evidence", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/plan-reliability-v1.md",
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Aggregate Correction Lifecycle"),
    );
    const evidence = extractSection(reference, "## Evidence And Quietness");

    expect(lifecycle).toContain("at most one aggregate correction round");
    expect(lifecycle).toContain(
      "A new plan-artifact defect after that round returns to Main Thread premise judgment",
    );
    expect(evidence).toContain("plan_check: passed | corrected");
    expect(evidence).toContain(
      "plan_corrections: none | concise bounded list",
    );
    expect(normalizeWhitespace(evidence)).toContain(
      "corrected must name the equivalent artifacts or command timing and the bounded evidence used to prove equivalence",
    );
    expect(normalizeWhitespace(evidence)).toContain(
      "must not request continue after a passing check or successful bounded correction",
    );
  });

  it("keeps the packaged owner byte-identical", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/plan-reliability-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/plan-reliability-v1.md"),
    ]);
    expect(packaged).toBe(canonical);
  });
});
