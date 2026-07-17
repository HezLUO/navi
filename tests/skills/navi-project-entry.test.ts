import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function extractSection(markdown: string, heading: string): string {
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

describe("Navi adaptive project entry", () => {
  it("hands confirmed candidates to the Project Map init owner", async () => {
    const entry = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const exit = extractSection(entry, "## Confirmed Exit");

    expect(exit).toContain("project-map-v1.md");
    expect(exit).toContain("package-local init entry");
    expect(exit).not.toContain("scripts/navi-project-init.mjs");
    expect(exit).not.toContain("~/.codex/plugins/cache");
  });

  it("defines one visible entry and four evidence profiles", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );

    expect(reference).toContain("one user-visible project-entry journey");
    expect(reference).toContain("Evidence Profile");
    for (const profile of ["coherent", "conflicting", "insufficient", "stale"]) {
      expect(reference).toContain(profile);
    }
    for (const field of [
      "profile",
      "sources",
      "supported_judgments",
      "missing_judgments",
      "conflicts",
      "uncertainty",
      "next_baseline_action",
    ]) {
      expect(reference).toContain(field);
    }
  });

  it("defines precise criteria and safe handling for every evidence profile", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const profile = extractSection(reference, "## Evidence Profile");

    expect(profile).toMatch(
      /coherent[\s\S]*every required baseline area[\s\S]*no unresolved material conflict/i,
    );
    expect(profile).toMatch(
      /conflicting[\s\S]*incompatible claims[\s\S]*Desired Outcome[\s\S]*major route[\s\S]*current phase[\s\S]*stopping boundary[\s\S]*Next Decision/i,
    );
    expect(profile).toMatch(
      /insufficient[\s\S]*one or more required baseline areas[\s\S]*cannot be made confirmable/i,
    );
    expect(profile).toMatch(
      /stale[\s\S]*apparently authoritative source[\s\S]*plausibly passed by current repository facts/i,
    );
    expect(profile).toMatch(
      /stale[\s\S]*targeted code or Git check[\s\S]*reclassify/i,
    );
    expect(profile).toMatch(
      /cannot resolve[\s\S]*(?:preserve|record)[\s\S]*uncertainty[\s\S]*ask the user[\s\S]*not silently demote/i,
    );
  });

  it("uses a valid confirmed Map fast path before forming an Evidence Profile", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const fastPath = extractSection(reference, "## Project State Fast Path");

    expect(fastPath).toMatch(/inspect project state before forming an Evidence Profile/i);
    expect(fastPath).toMatch(
      /valid confirmed `?\.navi\/project-map\.md`?[\s\S]*skips? Evidence Profile and baseline formation/i,
    );
    expect(fastPath).toContain("existing Project Map behavior");
    expect(fastPath).toMatch(
      /only the managed trigger is missing[\s\S]*project-map-v1\.md[\s\S]*formal init entry[\s\S]*trigger-only preview and activation/i,
    );
    expect(fastPath).not.toContain("navi init");
    expect(fastPath).toMatch(/must not reconfirm or regenerate the baseline/i);
  });

  it("routes each profile without deciding direction for the user", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const routing = extractSection(reference, "## Profile Routing");

    expect(routing).toContain("coherent -> Evidence-First Candidate");
    expect(routing).toContain("conflicting -> Conflict Resolution");
    expect(routing).toContain("insufficient -> Guided Baseline Formation");
    expect(routing).toContain("stale -> Targeted Code Check, then reclassify");
    expect(routing).toMatch(/must not[\s\S]*modification time/i);
    expect(routing).toMatch(/direction conflict[\s\S]*user/i);
  });

  it("sequences conflict resolution without confirming an unresolved direction", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const routing = extractSection(reference, "## Profile Routing");

    expect(routing).toContain("one focused direction question at a time");
    expect(routing).toMatch(
      /must not produce a `map_status: confirmed` candidate until the conflict is resolved/i,
    );
    for (const forbiddenAuthority of [
      "modification time",
      "fixed filename priority",
      "code state",
      "model confidence",
    ]) {
      expect(routing).toContain(forbiddenAuthority);
    }
  });

  it("makes conflict recommendations conditional on available evidence", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const routing = extractSection(reference, "## Profile Routing");

    expect(routing).toMatch(/recommendation only when (?:the evidence can support one|supportable)/i);
    expect(routing).toMatch(/recommendation[\s\S]*state its evidence basis/i);
    expect(routing).toMatch(/recommendation[\s\S]*visibly distinct from user approval/i);
    expect(routing).toMatch(/otherwise[\s\S]*evidence supports no default recommendation/i);
    expect(routing).toMatch(/never invent a recommendation/i);
    expect(routing).toContain("one focused direction question at a time");
    expect(routing).toMatch(
      /must not produce a `map_status: confirmed` candidate until the conflict is resolved/i,
    );
  });

  it("keeps scanning bounded and code checks targeted", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const scan = extractSection(reference, "## Bounded Evidence Scan");

    for (const expected of [
      ".navi/project-map.md",
      "AGENTS.md",
      "README",
      "roadmap",
      "active specification or implementation plan",
      "status records, handoffs, trackers, or task files",
      "Git status, current branch, and recent commits",
    ]) {
      expect(scan).toContain(expected);
    }
    expect(scan).toMatch(/stop gathering evidence[\s\S]*unlikely to change the profile/i);
    expect(scan).toMatch(/targeted code check[\s\S]*cannot establish the user's desired outcome/i);
  });

  it("defines mature and evidence-poor baseline strategies", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );

    const mature = extractSection(reference, "## Evidence-First Candidate");
    expect(mature).toMatch(/do not ask[\s\S]*repeat supported facts/i);
    expect(mature).toMatch(/complete candidate[\s\S]*final confirmation/i);

    const guided = extractSection(reference, "## Guided Baseline Formation");
    expect(guided).toContain("one missing judgment at a time");
    expect(guided).toContain("provisional route or working rhythm");
    expect(guided).toContain("Evidence And Uncertainty");
    expect(guided).toMatch(/must not[\s\S]*blank placeholder/i);
  });

  it("preserves layered authority and the existing approved write exit", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    const authority = extractSection(reference, "## Layered Authority");
    expect(authority).toContain("roadmaps own detailed product sequencing");
    expect(authority).toContain("confirmed `.navi/project-map.md`");
    expect(authority).toMatch(/does not replace[\s\S]*roadmap/i);
    expect(authority).toMatch(/references source evidence instead of copying complete plans/i);
    expect(authority).toMatch(/does not become the sole authority for all project facts/i);

    const exit = extractSection(reference, "## Confirmed Exit");
    for (const expected of [
      "one combined",
      "fingerprint",
      "Map first",
      "trigger second",
      "explicit approval",
    ]) {
      expect(exit).toContain(expected);
    }
  });

  it("does not claim a persisted classifier or runtime surface", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );
    expect(reference).toContain("turn-local, prompt/docs-backed Codex judgment");
    expect(reference).toMatch(/not a persisted profile[\s\S]*runtime classifier/i);
    expect(reference).not.toContain("Navi runs a runtime classifier");
    expect(reference).not.toContain("Navi starts a background repository indexer");
    expect(reference).not.toContain("`navi init --new`");
    expect(reference).not.toContain("`navi init --existing`");
  });

  it("routes the skill and Project Map owner without duplicating the entry contract", async () => {
    const [skill, projectMap, entry] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText(".agents/skills/navi/references/project-entry-v1.md"),
    ]);

    const entryReferenceLine = skill
      .split("\n")
      .find((line) => line.includes("references/project-entry-v1.md"));
    expect(entryReferenceLine).toBeDefined();
    expect(entryReferenceLine).toMatch(
      /sole owner[\s\S]*adaptive project entry[\s\S]*Evidence Profile classification[\s\S]*profile-to-strategy routing[\s\S]*baseline formation/i,
    );
    expect(skill).toMatch(/uninitialized[\s\S]*adaptive project entry/i);
    expect(projectMap).toContain("project-entry-v1.md");
    expect(projectMap).toContain("Project Map schema, rendering, lifecycle, and maintenance");
    expect(projectMap).toMatch(
      /project-entry-v1\.md[\s\S]*broad supervision[\s\S]*bounded evidence scan[\s\S]*adaptive baseline-formation strategy/i,
    );
    expect(projectMap).not.toContain("runs the Init Eligibility Gate");
    expect(projectMap).not.toContain("performs Guided Baseline Formation when needed");
    expect(projectMap).not.toContain("profile: coherent | conflicting | insufficient | stale");
    expect(entry).toContain("profile: coherent | conflicting | insufficient | stale");
  });

  it("keeps evidence classification and profile routing details only in project-entry-v1", async () => {
    const [skill, projectMap, entry] = await Promise.all([
      readRepoText(".agents/skills/navi/SKILL.md"),
      readRepoText(".agents/skills/navi/references/project-map-v1.md"),
      readRepoText(".agents/skills/navi/references/project-entry-v1.md"),
    ]);
    const entryReferenceLine = skill
      .split("\n")
      .find((line) => line.includes("references/project-entry-v1.md"));
    expect(entryReferenceLine).toBeDefined();
    const adaptive = extractSection(projectMap, "#### Adaptive Baseline Formation");

    for (const expected of [
      "coherent -> Evidence-First Candidate",
      "conflicting -> Conflict Resolution",
      "insufficient -> Guided Baseline Formation",
      "stale -> Targeted Code Check, then reclassify",
    ]) {
      expect(entry).toContain(expected);
    }

    for (const secondaryOwnerSection of [entryReferenceLine ?? "", adaptive]) {
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
        expect(secondaryOwnerSection).not.toContain(duplicatedDetail);
      }
    }
  });

  it("keeps every modified package skill file byte-identical", async () => {
    for (const relativePath of [
      "SKILL.md",
      "references/project-map-v1.md",
      "references/project-entry-v1.md",
    ]) {
      const [canonical, packaged] = await Promise.all([
        readRepoText(`.agents/skills/navi/${relativePath}`),
        readRepoText(`plugins/navi/skills/navi/${relativePath}`),
      ]);
      expect(packaged).toBe(canonical);
    }
  });

  it("forms evidence-backed and guided Outcome Boundary candidates", async () => {
    const projectEntry = await readRepoText(
      ".agents/skills/navi/references/project-entry-v1.md",
    );

    expect(projectEntry).toMatch(/coherent[\s\S]*Outcome Boundary candidate/i);
    expect(projectEntry).toMatch(/two or three[\s\S]*completion levels/i);
    expect(projectEntry).toMatch(
      /provisional[\s\S]*user confirms[\s\S]*Revisit Trigger/i,
    );
    expect(projectEntry).toMatch(
      /no default recommendation|supports no default recommendation/i,
    );
  });
});
