import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { REQUIRED_PROJECT_MAP_ANCHORS } from "../../src/cli/navi-project-map";

const roots = new Set<string>();
const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const canonicalEntry = path.join(
  repoRoot,
  ".agents/skills/navi/scripts/navi-project-init.mjs",
);
const packagedEntry = path.join(
  repoRoot,
  "plugins/navi/skills/navi/scripts/navi-project-init.mjs",
);

function confirmedMap(): string {
  return `---
navi_map: 2
map_status: confirmed
project_status: active
last_confirmed: 2026-07-17
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed ${index + 1}.`,
).join("\n\n")}
`;
}

function installedCopy(): { root: string; entry: string; project: string } {
  const root = mkdtempSync(path.join(tmpdir(), "navi-plugin-init-"));
  roots.add(root);
  const plugin = path.join(root, "cache", "navi-source", "navi", "0.1.0");
  const project = path.join(root, "target project");
  mkdirSync(project, { recursive: true });
  cpSync(path.join(repoRoot, "plugins/navi"), plugin, { recursive: true });
  return {
    root,
    entry: path.join(plugin, "skills/navi/scripts/navi-project-init.mjs"),
    project,
  };
}

afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  roots.clear();
});

describe("installed Navi package-local init entry", () => {
  it("is generated, executable, mirrored, and source-path independent", () => {
    expect(existsSync(canonicalEntry)).toBe(true);
    expect(existsSync(packagedEntry)).toBe(true);
    expect(readFileSync(packagedEntry)).toEqual(readFileSync(canonicalEntry));
    expect(statSync(packagedEntry).mode & 0o111).not.toBe(0);

    const text = readFileSync(packagedEntry, "utf8");
    expect(text).not.toContain("tsx/esm/api");
    expect(text).not.toContain("node_modules");
    expect(text).not.toContain(repoRoot);
    expect(text).not.toContain("~/.codex/plugins/cache");
  });

  it("runs a read-only preview from a copied plugin and unrelated cwd", () => {
    const fixture = installedCopy();
    const result = spawnSync(process.execPath, [
      fixture.entry,
      "--target",
      fixture.project,
    ], { cwd: fixture.root, encoding: "utf8" });

    expect(result.status, result.stderr).toBe(1);
    expect(result.stdout).toContain("Navi init preview");
    expect(result.stdout).toContain("confirmed Project Map");
    expect(existsSync(path.join(fixture.project, ".navi"))).toBe(false);
    expect(existsSync(path.join(fixture.project, "AGENTS.md"))).toBe(false);
  });

  it("writes only the approved Map and managed trigger after exact preview", () => {
    const fixture = installedCopy();
    const candidate = path.join(fixture.root, "candidate.md");
    writeFileSync(candidate, confirmedMap());

    const preview = spawnSync(process.execPath, [
      fixture.entry,
      "--target", fixture.project,
      "--map-file", candidate,
    ], { cwd: fixture.root, encoding: "utf8" });
    const fingerprint = preview.stdout.match(/^Plan fingerprint: ([a-f0-9]{64})$/m)?.[1];
    expect(preview.status, preview.stderr).toBe(0);
    expect(fingerprint).toBeDefined();
    expect(existsSync(path.join(fixture.project, ".navi"))).toBe(false);

    const apply = spawnSync(process.execPath, [
      fixture.entry,
      "--target", fixture.project,
      "--map-file", candidate,
      "--expect-plan", fingerprint!,
      "--write",
    ], { cwd: fixture.root, encoding: "utf8" });

    expect(apply.status, apply.stderr).toBe(0);
    expect(readFileSync(path.join(fixture.project, ".navi/project-map.md"), "utf8"))
      .toBe(confirmedMap());
    expect(readFileSync(path.join(fixture.project, "AGENTS.md"), "utf8"))
      .toContain("Navi Project Supervision");
  });
});
