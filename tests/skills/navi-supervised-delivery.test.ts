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
});
