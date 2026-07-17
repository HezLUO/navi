import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const bodyStart = start + heading.length;
  const next = markdown.slice(bodyStart).search(/\n##? /);
  return next < 0
    ? markdown.slice(start)
    : markdown.slice(start, bodyStart + next);
}

describe("Navi Supervised Delivery Loop V1", () => {
  it("defines one canonical execution and validation contract", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );

    const execution = extractSection(reference, "## Execution Contract");
    for (const field of [
      "goal",
      "user_value",
      "source_task",
      "baseline",
      "allowed_scope",
      "forbidden_scope",
      "implementation_plan: expected implementation plan or bounded task list",
      "verification_budget",
      "validation_level: 1 | 2 | 3",
      "validation_preauthorized: true",
      "remediation_limit: 2",
      "stop_conditions",
      "handoff_format: NAVI_LANE_HANDOFF_EVENT V1 review-ready",
    ]) {
      expect(execution).toContain(field);
    }

    const validation = extractSection(reference, "## Validation Contract");
    for (const field of [
      "reviewed_event_id",
      "execution_contract",
      "reviewed_snapshot",
      "changed_scope",
      "evidence",
      "validation_level",
      "command_budget",
      "read_only: true",
      "report_to: source_task",
    ]) {
      expect(validation).toContain(field);
    }
    expect(validation).toMatch(
      /must not include[\s\S]*full transcript[\s\S]*private reasoning/i,
    );
  });

  it("creates one validator and reuses it for bounded remediation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const execution = extractSection(reference, "## Execution Contract");
    const validation = extractSection(reference, "## Validation Contract");

    expect(execution).toContain(
      "one fresh independent Validation Thread only for the initial valid review-ready transition",
    );
    expect(execution).toContain(
      "reusing the same Validation Thread for up to two in-scope remediation re-reviews",
    );
    expect(validation).toContain(
      "Create the fresh Validation Thread only for the initial valid review-ready transition.",
    );
  });

  it("defines the exact Navi validation-result envelope", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const result = extractSection(reference, "## Findings Package");

    for (const field of [
      "NAVI_VALIDATION_RESULT",
      "version: 1",
      "result_id",
      "reviewed_event_id",
      "source_task",
      "execution_lane",
      "validation_lane",
      "reviewed_snapshot",
      "assigned_level: 1 | 2 | 3",
      "used_level: 1 | 2 | 3",
      "verdict: accept | remediation-required | decision-required | unable-to-verify",
      "findings: none",
      "findings:",
      "finding:",
      "severity: Critical | Important | Minor",
      "file: affected file or source reference",
      "evidence: concrete evidence reference",
      "checks",
      "evidence_gaps",
      "validator_write_state: clean | invalidated",
      "recommendation",
    ]) {
      expect(result).toContain(field);
    }
    expect(result).toMatch(
      /either `findings: none` with no record-only fields, or `findings:` followed by one or more severity-ordered `finding:` records/i,
    );
    expect(result).toMatch(
      /each `finding:` record contains exactly:[\s\S]*severity: Critical \| Important \| Minor[\s\S]*file: affected file or source reference[\s\S]*evidence: concrete evidence reference/i,
    );
  });

  it("requires a conformant bare validation-result payload", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const wire = extractSection(
      reference,
      "## Pre-Send Validation Wire-Format Check",
    );

    expect(wire).toMatch(/begin exactly with `NAVI_VALIDATION_RESULT`/i);
    expect(wire).toMatch(/bare plain text[\s\S]*no XML\/Markdown wrapper/i);
    expect(wire).toMatch(/exact field names[\s\S]*no aliases/i);
    expect(wire).toMatch(
      /`findings: none` must omit[\s\S]*`finding:`[\s\S]*`severity:`[\s\S]*`file:`[\s\S]*`evidence:`/i,
    );
    expect(wire).toMatch(
      /`findings:` must contain one or more severity-ordered `finding:` records/i,
    );
    expect(wire).toMatch(/same transition[\s\S]*same result_id/i);
  });

  it("creates at most one validator for one review-ready snapshot", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const lifecycle = extractSection(reference, "## Lifecycle And Identity");
    const laneHandoff = await readRepoText(
      ".agents/skills/navi/references/lane-handoff-v1.md",
    );
    const reviewReady = extractSection(laneHandoff, "## Review Ready");

    expect(lifecycle).toMatch(/one fresh Validation Thread[\s\S]*one reviewed_event_id/i);
    expect(lifecycle).toMatch(/duplicate handoff event IDs[\s\S]*ignore/i);
    expect(lifecycle).toMatch(/duplicate validation result IDs[\s\S]*ignore/i);
    expect(lifecycle).toMatch(/wrong reviewed_snapshot[\s\S]*stale evidence/i);
    expect(lifecycle).toMatch(/same executor-validator pair[\s\S]*at most two/i);
    expect(lifecycle).toMatch(
      /initial valid review-ready[\s\S]*one fresh Validation Thread[\s\S]*remediation[\s\S]*same Validation Thread/i,
    );
    expect(reviewReady).toMatch(
      /reviewed_snapshot: exact commit or immutable snapshot/i,
    );
  });

  it("routes every validation verdict to one next owner", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const routing = extractSection(reference, "## Verdict Routing");

    const expectedRows = [
      ["accept", "Main Thread", "merge or acceptance decision"],
      ["remediation-required", "same Execution Thread", "same Validation Thread"],
      ["decision-required", "user", "scope, permission, architecture, or risk"],
      ["unable-to-verify", "Main Thread", "evidence or premise"],
    ];
    for (const row of expectedRows) {
      for (const cell of row) expect(routing).toContain(cell);
    }
  });

  it("invalidates validator writes and caps remediation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    expect(reference).toMatch(/validator_write_state: invalidated[\s\S]*cannot support acceptance/i);
    expect(reference).toMatch(/two remediation rounds[\s\S]*reassess the plan, architecture, or acceptance criteria/i);
    expect(reference).toMatch(/planned tests[\s\S]*Execution Thread[\s\S]*Release mode/i);
  });

  it("routes successful delivery into the shared no-poll waiting state", async () => {
    const [skill, delivery, packagedSkill, packagedDelivery] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
      readRepoText("plugins/navi/skills/navi/SKILL.md"),
      readRepoText(
        "plugins/navi/skills/navi/references/supervised-delivery-v1.md",
      ),
    ]);
    const lifecycle = extractSection(delivery, "## Lifecycle And Identity");

    expect(skill).toMatch(
      /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
    );
    expect(lifecycle).toMatch(
      /Execution Thread[\s\S]*Validation Thread[\s\S]*Awaiting Direct Event/i,
    );
    expect(lifecycle).toMatch(
      /lane-handoff-v1\.md[\s\S]*do not poll[\s\S]*inbound event/i,
    );
    expect(packagedSkill).toBe(skill);
    expect(packagedDelivery).toBe(delivery);
  });

  it("keeps failed coordination honest and bounded", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const failure = extractSection(reference, "## Failure Handling");

    expect(failure).toMatch(/failure to create[\s\S]*validation-pending/i);
    expect(failure).toMatch(/messaging failure[\s\S]*explicit local fallback/i);
    expect(failure).toMatch(/timed retry[\s\S]*polling loop/i);
    expect(failure).toMatch(/insufficient evidence[\s\S]*approved contract/i);
    expect(failure).toMatch(/formally blocked[\s\S]*Lane Handoff/i);
  });

  it("keeps one detailed owner and a byte-identical package mirror", async () => {
    const [skill, delivery, packagedDelivery, projectMap, supervision] =
      await Promise.all([
        readRepoText(".agents/skills/navi/SKILL.md"),
        readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
        readRepoText("plugins/navi/skills/navi/references/supervised-delivery-v1.md"),
        readRepoText(".agents/skills/navi/references/project-map-v1.md"),
        readRepoText(".agents/skills/navi/references/supervision-v1.md"),
      ]);

    expect(skill).toContain("references/supervised-delivery-v1.md");
    expect(skill).toMatch(/do not create more than one Validation Thread/i);
    expect(skill).toMatch(/do not let a Validation Thread write/i);
    expect(packagedDelivery).toBe(delivery);
    expect(projectMap).toContain("supervised-delivery-v1.md");
    expect(supervision).toContain("supervised-delivery-v1.md");
    expect(supervision).not.toContain("NAVI_VALIDATION_RESULT\nversion: 1");
  });
});
