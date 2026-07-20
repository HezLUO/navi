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

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
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
      "plan_satisfiability_check: required",
      "plan_artifact_correction: bounded",
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

  it("defines one additive dependency restore extension", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const extension = extractSection(reference, "## Dependency Restore Extension");

    for (const field of [
      "dependency_restore:",
      "preauthorized: true",
      "package_manager: npm",
      "command: npm ci",
      "trusted_baseline: exact commit SHA",
      "lockfile: package-lock.json",
      "lockfile_digest: SHA-256",
      "expected_state: node_modules absent",
      "lifecycle_scripts: allowed",
      "network: host-mediated",
      "allowed_install_write: node_modules",
      "immutable_files:",
      "- package.json",
      "- package-lock.json",
      "post_install_audit: required",
    ]) {
      expect(extension).toContain(field);
    }
    expect(extension).toMatch(/optional[\s\S]*additive/i);
    expect(extension).toMatch(/every field[\s\S]*required/i);
    expect(extension).toMatch(/one Execution\s+Task[\s\S]*one install attempt/i);
    expect(extension).toMatch(/does\s+not survive[\s\S]*new task[\s\S]*changed baseline/i);
  });

  it("limits dependency restore to an exact trusted npm ci preflight", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const preflight = extractSection(reference, "## Dependency Restore Preflight");

    expect(preflight).toMatch(/HEAD[\s\S]*trusted_baseline/i);
    expect(preflight).toMatch(/worktree\s+is\s+clean/i);
    expect(preflight).toMatch(/lockfile[\s\S]*digest/i);
    expect(preflight).toMatch(/node_modules[\s\S]*absent/i);
    expect(preflight).toMatch(/exact command[\s\S]*`npm ci`/i);
    expect(preflight).toMatch(/no `sudo`[\s\S]*`-g`[\s\S]*global npm/i);
    expect(preflight).toMatch(/private registry[\s\S]*credential[\s\S]*dependency edit/i);
    expect(preflight).toMatch(/existing[\s\S]*node_modules[\s\S]*not an eligible restore/i);
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

  it("uses the shared one-shot reconciliation owner after direct delivery", async () => {
    const [skill, delivery, laneHandoff, packagedSkill, packagedDelivery] =
      await Promise.all([
        readRepoText(".agents/skills/navi/SKILL.md"),
        readRepoText(
          ".agents/skills/navi/references/supervised-delivery-v1.md",
        ),
        readRepoText(".agents/skills/navi/references/lane-handoff-v1.md"),
        readRepoText("plugins/navi/skills/navi/SKILL.md"),
        readRepoText(
          "plugins/navi/skills/navi/references/supervised-delivery-v1.md",
        ),
      ]);
    const lifecycle = extractSection(delivery, "## Lifecycle And Identity");
    const failure = extractSection(delivery, "## Failure Handling");
    const reconciliation = extractSection(
      laneHandoff,
      "## Main-Task Reconciliation",
    );

    expect(skill).toMatch(
      /successful direct task-message delivery[\s\S]*Awaiting Direct Event/i,
    );
    expect(lifecycle).toMatch(
      /Execution Thread[\s\S]*Validation Thread[\s\S]*Awaiting Direct Event/i,
    );
    expect(lifecycle).toMatch(
      /dependent control checkpoint[\s\S]*Main-Task Reconciliation[\s\S]*lane-handoff-v1\.md/i,
    );
    expect(lifecycle).toMatch(/ordinary progress[\s\S]*must not trigger/i);
    expect(failure).toMatch(
      /completed task[\s\S]*valid event[\s\S]*delivery-protocol-failure[\s\S]*not authorization/i,
    );

    for (const detailedOwnerTerm of [
      "last_reconciliation_reason",
      "create, replace, cancel, or redirect",
      "only useful remaining action is waiting",
      "one bounded re-delivery",
    ]) {
      expect(reconciliation).toContain(detailedOwnerTerm);
      expect(delivery).not.toContain(detailedOwnerTerm);
    }

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

  it("keeps model routing additive and explicitly authorized", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const extension = extractSection(reference, "## Model Routing Extension");

    for (const field of [
      "model_routing_policy: balanced",
      "model_routing_authorized: true",
      "execution_route: NAVI_ROUTE_DECISION V2",
      "validation_route: derive at review-ready from validation_level",
      "route_application: NAVI_ROUTE_APPLICATION V1 after host response",
      "router_check_preauthorized: true",
    ]) {
      expect(extension).toContain(field);
    }
    expect(extension).toMatch(/additive[\s\S]*existing Execution Contract/i);
    expect(extension).toMatch(/absent[\s\S]*host-default[\s\S]*no Router Check/i);
    expect(extension).toMatch(/does not authorize[\s\S]*experimental[\s\S]*Fast mode/i);
  });

  it("gates execution and validation independently before task creation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const extension = normalizeWhitespace(
      extractSection(reference, "## Model Routing Extension"),
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Task Route Lifecycle"),
    );

    expect(extension).toContain("execution_route: NAVI_ROUTE_DECISION V2");
    expect(extension).toContain(
      "route_application: NAVI_ROUTE_APPLICATION V1 after host response",
    );
    expect(lifecycle).toContain(
      "Before creating the Execution Thread's Codex task",
    );
    expect(lifecycle).toContain("Pass the Route Application Gate");
    expect(lifecycle).toContain("exact model and thinking arguments");
    expect(lifecycle).toContain(
      "derive the Validation route from validation_level independently",
    );
    expect(lifecycle).toContain(
      "must not inherit the Execution Thread's Route Decision or application result",
    );
  });

  it("fails closed and distinguishes unchanged from changed follow-ups", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Task Route Lifecycle"),
    );
    const failure = normalizeWhitespace(
      extractSection(reference, "## Failure Handling"),
    );

    expect(lifecycle).toContain(
      "unchanged valid Route Lease omits model and thinking overrides",
    );
    expect(lifecycle).toContain(
      "route-changing follow-up must create a new V2 decision and pass the gate",
    );
    expect(lifecycle).toContain(
      "Reuse the same Validation Thread for bounded remediation re-review",
    );
    expect(failure).toContain(
      "missing or mismatched model or thinking argument is a pre-send failure",
    );
    expect(failure).toContain("must not create a host-default task");
    expect(failure).toContain("decision-required");
    expect(failure).toContain("must not silently lower tier");
  });

  it("keeps validation floors and truthful application evidence", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Task Route Lifecycle"),
    );

    expect(lifecycle).toContain("Level 1 uses fast + medium");
    expect(lifecycle).toContain("Level 2 uses standard + high");
    expect(lifecycle).toContain("Level 3 uses strong + high");
    expect(lifecycle).toContain(
      "applied only after the host accepts the exact requested combination",
    );
  });

  it("runs one host-mediated restore and audits the result", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const lifecycle = extractSection(reference, "## Dependency Restore Lifecycle");

    expect(lifecycle).toMatch(/run `npm ci` once/i);
    expect(lifecycle).toMatch(/lifecycle scripts[\s\S]*not risk-free/i);
    expect(lifecycle).toMatch(/host[\s\S]*network or sandbox[\s\S]*authoritative/i);
    expect(lifecycle).toMatch(/package\.json[\s\S]*package-lock\.json[\s\S]*byte-identical/i);
    expect(lifecycle).toMatch(/no tracked file changed/i);
    expect(lifecycle).toMatch(/no untracked path[\s\S]*outside[\s\S]*node_modules/i);
    expect(lifecycle).toMatch(/no global npm[\s\S]*shell-profile[\s\S]*credential[\s\S]*external-project state[\s\S]*intentionally changed/i);
    expect(lifecycle).toMatch(/worktree remains suitable[\s\S]*approved implementation plan/i);
    expect(lifecycle).toMatch(/continue[\s\S]*approved implementation plan[\s\S]*without[\s\S]*continue/i);
  });

  it("routes every restore failure without redefining blocked", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const failure = extractSection(reference, "## Dependency Restore Failure Routing");

    for (const cause of [
      "preflight mismatch",
      "host permission",
      "nonzero",
      "post-install drift",
    ]) {
      expect(failure.toLowerCase()).toContain(cause);
    }
    expect(failure).toMatch(/decision-required/i);
    expect(failure).toMatch(/exhausts[\s\S]*one preauthorized attempt/i);
    expect(failure).toMatch(/do not[\s\S]*retry[\s\S]*`npm install`/i);
    expect(failure).toMatch(/do not[\s\S]*commit[\s\S]*auto-revert[\s\S]*clean/i);
    expect(failure).toMatch(/formal `blocked`[\s\S]*existing[\s\S]*lifecycle rule/i);
  });

  it("keeps dependency restore execution-only and quiet", async () => {
    const [skill, reference] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/supervised-delivery-v1.md"),
    ]);
    const roles = extractSection(reference, "## Dependency Restore Role Boundaries");
    const quietness = extractSection(reference, "## Dependency Restore Quietness");

    expect(skill).toMatch(/dependency restore[\s\S]*supervised-delivery-v1\.md/i);
    expect(skill).toMatch(/must not[\s\S]*permanent[\s\S]*project permission/i);
    expect(roles).toMatch(/Execution\s+Task alone/i);
    expect(roles).toMatch(/Validation Task[\s\S]*read-only[\s\S]*must not install/i);
    expect(quietness).toMatch(/successful path[\s\S]*quiet/i);
    expect(quietness).toMatch(/do not[\s\S]*dependency restore complete[\s\S]*continue/i);
  });

  it("embeds the delivery operation in Execution and Validation prompts", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/supervised-delivery-v1.md",
    );
    const adoption = extractSection(reference, "## Delivery Completion Adoption");
    const normalized = adoption
      .replace(/[|`]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim();

    expect(normalized).toContain(
      "Execution and Validation task prompts must embed the Delivery Completion Clause operation",
    );
    expect(normalized).toContain("A reference path alone is insufficient");
    expect(normalized).toContain(
      "Only host-confirmed delivery allows the task to claim handoff completion",
    );
    expect(normalized).toContain(
      "Two failed attempts preserve the complete local report for one-shot Main-Task Reconciliation",
    );
    expect(adoption).not.toContain("delivery_attempts: 1 | 2");
  });
});
