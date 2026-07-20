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

describe("Navi Task Model Routing V1", () => {
  it("defines the exact bounded routing context", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const context = extractSection(reference, "## Routing Context");

    for (const field of [
      "NAVI_ROUTING_CONTEXT",
      "version: 1",
      "role: main | execution | validation | router",
      "work_mode: design | calibration | implementation | release",
      "task_kind: status | exploration | edit | debug | review | decision",
      "scope: narrow | multi-file | cross-module | external-state",
      "reversibility: reversible | costly | irreversible",
      "uncertainty: low | medium | high",
      "evidence_conflict: true | false",
      "validation_level: 1 | 2 | 3 | none",
      "required_capabilities",
      "recent_failures: 0 | 1 | 2+",
      "user_policy: balanced",
      "user_override",
      "current_lease",
    ]) {
      expect(context).toContain(field);
    }
    expect(context).toMatch(
      /must not include[\s\S]*complete conversation[\s\S]*private reasoning[\s\S]*full test transcript/i,
    );
  });

  it("versions pending decisions separately from final application evidence", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const decision = normalizeWhitespace(
      extractSection(reference, "## Route Decision"),
    );
    const application = normalizeWhitespace(
      extractSection(reference, "## Route Application Result"),
    );

    for (const field of [
      "NAVI_ROUTE_DECISION",
      "version: 2",
      "route_id",
      "source_task",
      "target_role",
      "work_mode",
      "task_kind",
      "capability_floor",
      "selected_tier: fast | standard | strong",
      "resolved_model",
      "reasoning_effort",
      "lease_scope",
      "reason_codes",
      "visibility: quiet | explain | decision-required",
      "escalate_on",
      "downgrade_after",
      "fallback",
      "application_state: pending | host-default",
    ]) {
      expect(decision).toContain(field);
    }
    expect(decision).toContain("NAVI_ROUTE_DECISION V1");
    expect(decision).toContain("records remain readable");

    for (const field of [
      "NAVI_ROUTE_APPLICATION",
      "version: 1",
      "route_id",
      "boundary: task-create | route-changing-follow-up",
      "target_role: execution | validation | router",
      "target_task",
      "requested_model",
      "requested_reasoning",
      "host_operation: create-task | send-follow-up",
      "application_state: applied | recommended-not-applied",
      "host_evidence",
    ]) {
      expect(application).toContain(field);
    }
    expect(application).toContain("ephemeral coordination evidence");
    expect(application).toContain("Do not write it to a project file");
  });

  it("fails closed before a route-authorized host operation", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const gate = normalizeWhitespace(
      extractSection(reference, "## Route Application Gate"),
    );

    for (const requirement of [
      "routing is explicitly authorized",
      "one complete NAVI_ROUTE_DECISION V2",
      "application_state is pending",
      "model and thinking arguments",
      "exactly equal resolved_model and reasoning_effort",
      "neither value is unavailable",
      "at or above the deterministic floor",
      "same route_id",
    ]) {
      expect(gate).toContain(requirement);
    }
    expect(gate).toContain("must not send the host operation");
    expect(gate).toContain(
      "must not omit the overrides and inherit host default",
    );
  });

  it("records application only after host acceptance", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const lifecycle = normalizeWhitespace(
      extractSection(reference, "## Route Application Lifecycle"),
    );
    const quietness = normalizeWhitespace(
      extractSection(reference, "## Quietness"),
    );

    expect(lifecycle).toContain(
      "Host acceptance of the exact request produces applied",
    );
    expect(lifecycle).toContain(
      "Host rejection or an unsupported combination produces recommended-not-applied",
    );
    expect(lifecycle).toContain(
      "unchanged valid Route Lease omits model and thinking overrides",
    );
    expect(lifecycle).toContain(
      "route-changing follow-up creates a new V2 decision and repeats the gate",
    );
    expect(quietness).toContain(
      "A passed ordinary Route Application Gate is quiet",
    );
  });

  it("sets deterministic role and validation floors", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const floors = extractSection(reference, "## Deterministic Floors");

    const rows = [
      ["Main design, architecture, or acceptance", "strong + high"],
      ["Mechanical reversible execution", "fast + medium"],
      ["Ordinary bounded execution", "standard + medium"],
      ["Shared-core or complex-debug execution", "strong + high"],
      ["Validation Level 1", "fast + medium"],
      ["Validation Level 2", "standard + high"],
      ["Validation Level 3", "strong + high"],
    ];
    for (const row of rows) {
      for (const cell of row) expect(floors).toContain(cell);
    }
    expect(floors).toMatch(/permission[\s\S]*irreversible[\s\S]*strong/i);
  });

  it("keeps Router Check exceptional and non-recursive", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const router = extractSection(reference, "## Router Check");

    expect(router).toMatch(/only when deterministic rules[\s\S]*more than one valid route/i);
    expect(router).toMatch(/strong \+ low[\s\S]*strong \+ medium/i);
    expect(router).toMatch(/short-lived[\s\S]*read-only[\s\S]*tool-free/i);
    expect(router).toMatch(/cannot lower[\s\S]*deterministic floor/i);
    expect(router).toMatch(/must not create another Router Check/i);
    expect(router).toMatch(/strong \+ high[\s\S]*route the actual task/i);
  });

  it("uses stage leases, upward-only fallback, and explicit user control", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const lease = extractSection(reference, "## Route Lease");
    const fallback = extractSection(reference, "## Host Resolution And Fallback");
    const overrides = extractSection(reference, "## User Overrides");

    expect(lease).toMatch(/task-local[\s\S]*stage-bound/i);
    expect(lease).toMatch(/must not[\s\S]*project file[\s\S]*global database/i);
    expect(lease).toMatch(/fast model[\s\S]*must not[\s\S]*downgrade[\s\S]*extend/i);
    expect(fallback).toMatch(/same tier[\s\S]*stronger tier[\s\S]*never silently/i);
    expect(fallback).toMatch(/recommended-not-applied[\s\S]*must not claim/i);
    expect(overrides).toMatch(/task[\s\S]*stage[\s\S]*session/i);
    expect(overrides).toMatch(/below the floor[\s\S]*explicit confirmation/i);
    expect(overrides).toMatch(/cannot replace[\s\S]*independent validation/i);
  });

  it("keeps model mappings dynamic and Fast mode user-controlled", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/model-routing-v1.md",
    );
    const catalog = extractSection(reference, "## Host Model Catalog");
    const boundaries = extractSection(reference, "## Boundaries");

    expect(catalog).toMatch(/GPT-5\.6 Luna[\s\S]*GPT-5\.6 Terra[\s\S]*GPT-5\.6 Sol/i);
    expect(catalog).toMatch(/preferences[\s\S]*not a static model catalog/i);
    expect(catalog).toMatch(/Codex Spark[\s\S]*ultra-fast\/text-only/i);
    expect(catalog).toMatch(/deprecated[\s\S]*must not/i);
    expect(boundaries).toMatch(/Fast mode[\s\S]*user-controlled/i);
    expect(boundaries).toMatch(/not a database[\s\S]*not a daemon[\s\S]*not a scheduler/i);
    expect(boundaries).toMatch(/must not switch[\s\S]*active turn/i);
  });

  it("keeps one canonical owner and a byte-identical package mirror", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/model-routing-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/model-routing-v1.md"),
    ]);
    expect(packaged).toBe(canonical);
  });
});
