import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const bodyStart = start + heading.length;
  const next = markdown.slice(bodyStart).search(/\n##? /u);
  return next < 0
    ? markdown.slice(start)
    : markdown.slice(start, bodyStart + next);
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

describe("Navi Delegation Suggestion Gate V1", () => {
  it("records the accepted suggestion-only host boundary", async () => {
    const reference = normalizeWhitespace(
      await readRepoText(".agents/skills/navi/references/delegation-v1.md"),
    );

    expect(reference).toContain(
      "navi-delegation-host-inspection-validation-20260722-01",
    );
    expect(reference).toMatch(
      /C1-C3[\s\S]*present[\s\S]*C4-C6[\s\S]*absent[\s\S]*C7[\s\S]*unknown/i,
    );
    expect(reference).toContain("automatic Evidence delegation is unavailable");
    expect(reference).toContain("suggestion-only and fail-closed");
    expect(reference).toContain("must not call `spawn_agent`");
  });

  it("defines an ephemeral lease for Main and Execution but not Validation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const lease = normalizeWhitespace(
      extractSection(reference, "## Delegation Lease"),
    );

    expect(lease).toMatch(/task-local[\s\S]*revocable[\s\S]*not persisted/i);
    expect(lease).toMatch(/Main[\s\S]*already-authorized Execution/i);
    expect(lease).toMatch(/Validation[\s\S]*does not inherit/i);
    expect(lease).toMatch(/active \| absent \| expired/i);
    expect(lease).toMatch(/goal[\s\S]*permission[\s\S]*risk[\s\S]*work mode/i);
  });

  it("defines the bounded context and decision envelopes", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const context = extractSection(reference, "## Delegation Context");
    const decision = extractSection(reference, "## Delegation Decision");

    for (const field of [
      "NAVI_DELEGATION_CONTEXT",
      "version: 1",
      "source_task",
      "parent_role: main | execution",
      "stage",
      "goal",
      "candidate_questions",
      "candidate_scopes",
      "effects: read-only",
      "separability",
      "expected_benefit",
      "coordination_cost",
      "sensitivity",
      "lease_state: active | absent | expired",
      "host_capabilities: automatic_unsupported",
    ]) {
      expect(context).toContain(field);
    }

    for (const field of [
      "NAVI_DELEGATION_DECISION",
      "version: 1",
      "delegation_id",
      "source_task",
      "parent_role: main | execution",
      "stage",
      "result: continue_in_current_role | delegate_evidence | decision_required",
      "brief_count: 0 | 1 | 2",
      "reason_codes",
      "lease_state: active | absent | expired",
      "visibility: quiet | explain | decision-required",
    ]) {
      expect(decision).toContain(field);
    }
    expect(normalizeWhitespace(decision)).toMatch(
      /delegate_evidence[\s\S]*reserved[\s\S]*must not emit/i,
    );
  });

  it("requires hard eligibility and concrete net benefit", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const eligibility = normalizeWhitespace(
      extractSection(reference, "## Hard Eligibility"),
    );
    const benefit = normalizeWhitespace(
      extractSection(reference, "## Benefit Judgment"),
    );

    expect(eligibility).toMatch(
      /lease[\s\S]*Main or Execution[\s\S]*authorized[\s\S]*stable[\s\S]*read-only/i,
    );
    expect(eligibility).toMatch(
      /user product[\s\S]*permission[\s\S]*risk[\s\S]*integration[\s\S]*release/i,
    );
    expect(eligibility).toMatch(
      /goal[\s\S]*scope[\s\S]*evidence[\s\S]*budget[\s\S]*stop condition/i,
    );
    expect(benefit).toMatch(
      /parallel[\s\S]*context pressure[\s\S]*independent evidence/i,
    );
    expect(benefit).toMatch(
      /brief creation[\s\S]*context loading[\s\S]*reconciliation[\s\S]*model cost/i,
    );
    expect(benefit).toContain("defaults to `continue_in_current_role`");
  });

  it("fails closed without manufacturing user friction", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const behavior = normalizeWhitespace(
      extractSection(reference, "## Current Host Behavior"),
    );
    const quietness = normalizeWhitespace(
      extractSection(reference, "## Quietness And User Control"),
    );

    expect(behavior).toMatch(
      /must not call `spawn_agent`[\s\S]*must not create[\s\S]*must not claim/i,
    );
    expect(behavior).toMatch(
      /parent can continue[\s\S]*continue_in_current_role[\s\S]*quiet/i,
    );
    expect(behavior).toMatch(
      /explicitly requests[\s\S]*automatic delegation[\s\S]*decision_required/i,
    );
    expect(quietness).toMatch(/successful ordinary judgment[\s\S]*quiet/i);
    expect(quietness).toMatch(
      /must not ask[\s\S]*per-worker confirmation[\s\S]*meaningless confirmation/i,
    );
  });

  it("keeps dormant briefs and results bounded and non-authoritative", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const brief = extractSection(reference, "## Evidence Brief");
    const result = extractSection(reference, "## Evidence Result");
    const failure = normalizeWhitespace(
      extractSection(reference, "## Failure Handling"),
    );

    for (const field of [
      "NAVI_EVIDENCE_BRIEF",
      "version: 1",
      "delegation_id",
      "brief_id",
      "parent_task",
      "parent_role: main | execution",
      "goal",
      "questions",
      "allowed_scope",
      "excluded_scope",
      "expected_evidence",
      "budget",
      "stop_conditions",
      "sensitivity_boundary",
      "write_permission: none",
      "recursion_permission: none",
    ]) {
      expect(brief).toContain(field);
    }

    for (const field of [
      "NAVI_EVIDENCE_RESULT",
      "version: 1",
      "delegation_id",
      "brief_id",
      "status: done | blocked | needs_context",
      "answer",
      "evidence",
      "uncertainties",
      "scope_deviations",
      "open_questions",
      "recommended_parent_action",
      "write_state: unchanged | conflict",
    ]) {
      expect(result).toContain(field);
    }
    expect(normalizeWhitespace(result)).toMatch(
      /parent[\s\S]*identity[\s\S]*scope[\s\S]*write state[\s\S]*evidence/i,
    );
    expect(normalizeWhitespace(result)).toMatch(
      /recommendation[\s\S]*not[\s\S]*permission[\s\S]*user approval/i,
    );
    expect(failure).toMatch(
      /blocked[\s\S]*needs_context[\s\S]*must not expand[\s\S]*scope/i,
    );
    expect(failure).toMatch(
      /conflicting[\s\S]*preserve[\s\S]*unauthorized write[\s\S]*invalidates/i,
    );
  });

  it("preserves limits and requires a new accepted host gate before activation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/delegation-v1.md",
    );
    const limits = normalizeWhitespace(extractSection(reference, "## Limits"));
    const activation = normalizeWhitespace(
      extractSection(reference, "## Future Activation Gate"),
    );
    const privacy = normalizeWhitespace(
      extractSection(reference, "## Privacy And Security"),
    );

    expect(limits).toMatch(/at most two[\s\S]*one wave[\s\S]*no recursion/i);
    expect(limits).toMatch(/do not authorize[\s\S]*current host/i);
    expect(limits).toMatch(/must not emit[\s\S]*NAVI_LANE_HANDOFF_EVENT/i);
    expect(privacy).toMatch(
      /minimum necessary context[\s\S]*credentials[\s\S]*private reasoning/i,
    );
    expect(privacy).toMatch(
      /must not be transferred[\s\S]*project[\s\S]*Main task[\s\S]*external agent/i,
    );
    expect(privacy).toMatch(/no persistent[\s\S]*delegation log/i);
    expect(activation).toMatch(
      /fresh[\s\S]*accepted[\s\S]*C1-C7[\s\S]*present/i,
    );
    expect(activation).toMatch(
      /Task Model Routing[\s\S]*Route Application Gate[\s\S]*explicit model[\s\S]*reasoning/i,
    );
    expect(activation).toMatch(/must not self-activate[\s\S]*host update/i);
  });

  it("keeps one canonical owner and a byte-identical package mirror", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/delegation-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/delegation-v1.md"),
    ]);

    expect(packaged).toBe(canonical);
    expect(normalizeWhitespace(canonical)).toMatch(
      /must not self-activate[\s\S]*Do not add[\s\S]*database[\s\S]*queue[\s\S]*watcher[\s\S]*scheduler[\s\S]*daemon/i,
    );
    expect(canonical).not.toContain("mcp__agent_delegate__");
  });
});
