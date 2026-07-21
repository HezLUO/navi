import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readRepoText(relativePath: string): Promise<string> {
  return fs.readFile(new URL(`../../${relativePath}`, import.meta.url), "utf8");
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/gu, " ").trim();
}

function extractSection(markdown: string, heading: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return "";
  const after = markdown.slice(start + heading.length);
  const next = after.search(/\n## /u);
  return next < 0 ? after : after.slice(0, next);
}

describe("Navi Manual Update Fallback V1", () => {
  it("records the accepted Native Absent capability tuple without widening unknowns", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("Native Absent");
    expect(reference).toContain("C1 scheduling remains unknown");
    expect(reference).toContain("C2 upgrade and cache-readiness ordering remains unknown");
    expect(reference).toContain("C3 forced discovery is present");
    expect(reference).toContain("C4 existing-task structured Skill input is absent");
    expect(reference).toContain("version-scoped host evidence");
  });

  it("requires an explicit request, a stable checkpoint, and a closed delivery group", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("explicit user request");
    expect(reference).toContain("stable checkpoint");
    expect(reference).toContain("active delivery group");
    expect(reference).toContain("defer");
    expect(reference).toContain("direct user approval");
    expect(reference).not.toMatch(/automatically checks? the network every prompt/i);
  });

  it("routes each installation channel without guessing", async () => {
    const rawReference = await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    );
    const reference = normalizeWhitespace(rawReference);

    expect(reference).toContain("Git-backed `navi-source`");
    expect(reference).toContain("codex plugin marketplace upgrade navi-source --json");
    expect(reference).toContain("codex plugin list --marketplace navi-source --available --json");
    expect(reference).toContain("local-source marketplace");
    expect(reference).toContain("does not update the source checkout");
    expect(reference).toContain("Public Plugin Directory");
    expect(reference).toContain("not available");
    expect(reference).toContain("unknown channel");
    expect(reference).toContain("must not guess");
    expect(rawReference).not.toMatch(
      /```(?:text|bash)?\s*codex plugin marketplace update(?:\s|`)/iu,
    );
  });

  it("keeps the existing task truthful and uses the narrowest proved activation boundary", async () => {
    const reference = await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    );
    const continuity = normalizeWhitespace(
      extractSection(reference, "## Existing Task Boundary"),
    );

    expect(continuity).toContain("current task may continue using its existing Navi version");
    expect(continuity).toContain("genuinely new Codex task");
    expect(continuity).toContain("narrowest proved");
    expect(continuity).not.toMatch(/restart(?:ing)? Codex[^.]*same task[^.]*updated/i);
    expect(continuity).not.toMatch(/plain text[^.]*inject/i);
  });

  it("preserves failure, project guidance, and release boundaries", async () => {
    const reference = normalizeWhitespace(await readRepoText(
      ".agents/skills/navi/references/update-checkpoint-v1.md",
    ));

    expect(reference).toContain("no immediate retry");
    expect(reference).toContain("prior verified version");
    expect(reference).toContain("does not require `navi init`");
    expect(reference).toContain("does not rewrite `.navi/project-map.md`");
    expect(reference).toContain("does not rewrite the Navi `AGENTS.md` managed block");
    expect(reference).toMatch(/does not authorize[\s\S]*release[\s\S]*publication/i);
  });

  it("keeps the canonical and packaged owners byte-identical", async () => {
    const [canonical, packaged] = await Promise.all([
      readRepoText(".agents/skills/navi/references/update-checkpoint-v1.md"),
      readRepoText("plugins/navi/skills/navi/references/update-checkpoint-v1.md"),
    ]);

    expect(packaged).toBe(canonical);
  });
});
