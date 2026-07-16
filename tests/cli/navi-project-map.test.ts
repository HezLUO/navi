import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inspectProjectMapFile,
  LEGACY_PROJECT_MAP_ANCHORS,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  parseProjectMapDocument,
  REQUIRED_PROJECT_MAP_ANCHORS,
} from "../../src/cli/navi-project-map";

const roots: string[] = [];
const legacyMap = () => renderMap(1, LEGACY_PROJECT_MAP_ANCHORS);
const currentMap = () => renderMap(2, REQUIRED_PROJECT_MAP_ANCHORS);

function renderMap(version: 1 | 2, anchors: readonly string[]): string {
  return `---
navi_map: ${version}
map_status: confirmed
project_status: active
last_confirmed: 2026-07-16
---
# Navi Project Map

${anchors.map((anchor, index) =>
  `<!-- ${anchor} -->\n## Section ${index + 1}\n\nConfirmed value ${index + 1}.`,
).join("\n\n")}
`;
}

async function temporaryRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-project-map-"));
  roots.push(root);
  return root;
}

async function writeProjectMap(root: string, text: string): Promise<string> {
  const mapPath = path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH);
  await fs.mkdir(path.dirname(mapPath), { recursive: true });
  await fs.writeFile(mapPath, text, "utf8");
  return mapPath;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("confirmed Navi Project Map contract", () => {
  it("accepts the legacy version-one contract", () => {
    expect(parseProjectMapDocument(legacyMap())).toMatchObject({
      kind: "valid",
      document: { version: 1, outcomeBoundaryStatus: "legacy-missing" },
    });
  });

  it("accepts the current version-two contract", () => {
    expect(parseProjectMapDocument(currentMap())).toMatchObject({
      kind: "valid",
      document: { version: 2, outcomeBoundaryStatus: "confirmed" },
    });
  });

  it("rejects a current Map missing the Outcome Boundary anchor", () => {
    expect(parseProjectMapDocument(
      currentMap().replace("<!-- navi:outcome-boundary -->", ""),
    )).toMatchObject({ kind: "invalid", recognizedVersion: 2 });
  });

  it("rejects a legacy Map containing the reserved Outcome Boundary anchor", () => {
    expect(parseProjectMapDocument(
      legacyMap().replace(
        "<!-- navi:route-to-outcome -->",
        "<!-- navi:outcome-boundary -->\n## Outcome Boundary\n\nPartial.\n\n<!-- navi:route-to-outcome -->",
      ),
    )).toMatchObject({ kind: "invalid", recognizedVersion: 1 });
  });

  it.each([
    ["missing anchor", (text: string) => text.replace("<!-- navi:next-decision -->", "")],
    ["duplicate anchor", (text: string) => `${text}\n<!-- navi:next-decision -->\n`],
    ["out-of-order anchors", (text: string) => text
      .replace("<!-- navi:route-to-outcome -->", "<!-- navi:swap-anchor -->")
      .replace("<!-- navi:current-position -->", "<!-- navi:route-to-outcome -->")
      .replace("<!-- navi:swap-anchor -->", "<!-- navi:current-position -->")],
    ["draft status", (text: string) => text.replace("map_status: confirmed", "map_status: draft")],
    ["invalid lifecycle", (text: string) => text.replace("project_status: active", "project_status: waiting")],
    ["invalid date", (text: string) => text.replace("2026-07-16", "13/07/2026")],
  ])("rejects %s", (_name, mutate) => {
    expect(parseProjectMapDocument(mutate(currentMap())).kind).toBe("invalid");
  });

  it("does not count required anchors embedded only in optional frontmatter metadata", () => {
    const metadataAnchors = REQUIRED_PROJECT_MAP_ANCHORS.map(
      (anchor, index) => `metadata_${index}: <!-- ${anchor} -->`,
    ).join("\n");
    const text = `---
navi_map: 2
map_status: confirmed
project_status: active
last_confirmed: 2026-07-16
${metadataAnchors}
---
# Navi Project Map

No body anchors.
`;

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "invalid", recognizedVersion: 2 });
  });

  it("preserves an unsupported future contract version", () => {
    expect(parseProjectMapDocument(currentMap().replace("navi_map: 2", "navi_map: 3"))).toMatchObject({ kind: "unsupported", version: 3 });
  });

  it.each([
    ["0", 0],
    ["03", 3],
    ["-1", -1],
  ])("preserves unsupported base-10 integer version %s", (rawVersion, version) => {
    const text = currentMap().replace("navi_map: 2", `navi_map: ${rawVersion}`);

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "unsupported", version });
  });

  it("preserves the original text and accepts unique scalar metadata", () => {
    const text = currentMap().replace(
      "last_confirmed: 2026-07-16",
      "last_confirmed: 2026-07-16\nowner: Navi team",
    );

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "valid", document: { text } });
  });

  it.each([
    ["missing opening delimiter", (text: string) => text.replace(/^---\n/, "")],
    ["missing closing delimiter", (text: string) => text.replace("\n---\n# Navi", "\n# Navi")],
    ["malformed metadata", (text: string) => text.replace("map_status: confirmed", "map_status confirmed")],
    ["duplicate required key", (text: string) => text.replace("map_status: confirmed", "map_status: confirmed\nmap_status: confirmed")],
    ["missing required key", (text: string) => text.replace("project_status: active\n", "")],
    ["non-integer version", (text: string) => text.replace("navi_map: 2", "navi_map: 2.0")],
    ["impossible calendar date", (text: string) => text.replace("2026-07-16", "2026-02-29")],
  ])("rejects %s frontmatter", (_name, mutate) => {
    expect(parseProjectMapDocument(mutate(currentMap())).kind).toBe("invalid");
  });

  it("reports a future version before validating recognized contract fields", () => {
    const future = currentMap()
      .replace("navi_map: 2", "navi_map: 12")
      .replace("map_status: confirmed", "map_status: draft")
      .replace("<!-- navi:next-decision -->", "");

    expect(parseProjectMapDocument(future)).toMatchObject({ kind: "unsupported", version: 12 });
  });

  it.each(["active", "paused", "closed"] as const)("accepts the %s project lifecycle", (status) => {
    const text = currentMap().replace("project_status: active", `project_status: ${status}`);

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "valid", document: { projectStatus: status } });
  });

  it("returns missing without creating the map path", async () => {
    const root = await temporaryRoot();
    const mapPath = path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH);

    await expect(inspectProjectMapFile(root)).resolves.toEqual({ kind: "missing", mapPath });
    await expect(fs.access(path.dirname(mapPath))).rejects.toThrow();
  });

  it("reads a valid regular file without modifying it", async () => {
    const root = await temporaryRoot();
    const text = currentMap();
    const mapPath = await writeProjectMap(root, text);
    const before = await fs.stat(mapPath);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({
      kind: "valid",
      mapPath,
      document: { text },
    });
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(text);
    expect((await fs.stat(mapPath)).mtimeMs).toBe(before.mtimeMs);
  });

  it("never follows or replaces a symlink at the map path", async () => {
    const root = await temporaryRoot();
    const targetPath = path.join(root, "outside-map.md");
    const text = currentMap();
    await fs.writeFile(targetPath, text, "utf8");
    const mapPath = path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.symlink(targetPath, mapPath);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsafe", mapPath });
    expect((await fs.lstat(mapPath)).isSymbolicLink()).toBe(true);
    await expect(fs.readFile(targetPath, "utf8")).resolves.toBe(text);
  });

  it("rejects a valid Map behind a symlinked .navi directory without reading or changing external bytes", async () => {
    const root = await temporaryRoot();
    const externalDirectory = `${root}-external-navi`;
    roots.push(externalDirectory);
    const text = currentMap();
    const externalMap = path.join(externalDirectory, "project-map.md");
    await fs.mkdir(externalDirectory);
    await fs.writeFile(externalMap, text, "utf8");
    await fs.symlink(externalDirectory, path.join(root, ".navi"));

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({
      kind: "unsafe",
      mapPath: path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH),
    });
    expect((await fs.lstat(path.join(root, ".navi"))).isSymbolicLink()).toBe(true);
    await expect(fs.readFile(externalMap, "utf8")).resolves.toBe(text);
  });

  it("does not read an external Map when the .navi directory is replaced after inspection", async () => {
    const root = await temporaryRoot();
    const originalText = currentMap();
    const externalText = originalText.replace("2026-07-16", "2026-07-17");
    const mapPath = await writeProjectMap(root, originalText);
    const mapDirectory = path.dirname(mapPath);
    const movedDirectory = path.join(root, "checked-navi");
    const externalDirectory = `${root}-external-replacement`;
    roots.push(externalDirectory);
    const externalMap = path.join(externalDirectory, "project-map.md");
    await fs.mkdir(externalDirectory);
    await fs.writeFile(externalMap, externalText, "utf8");

    const originalLstat = fs.lstat;
    const lstat = vi.spyOn(fs, "lstat").mockImplementationOnce(async (candidate) => {
      const stats = await originalLstat(candidate);
      await fs.rename(mapDirectory, movedDirectory);
      await fs.symlink(externalDirectory, mapDirectory);
      return stats;
    });

    try {
      await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsafe", mapPath });
    } finally {
      lstat.mockRestore();
    }
    await expect(fs.readFile(path.join(movedDirectory, "project-map.md"), "utf8")).resolves.toBe(originalText);
    await expect(fs.readFile(externalMap, "utf8")).resolves.toBe(externalText);
  });

  it("returns unsafe when .navi is replaced by an external symlink with no Map before final inspection", async () => {
    const root = await temporaryRoot();
    const mapDirectory = path.join(root, ".navi");
    const movedDirectory = path.join(root, "checked-empty-navi");
    const externalDirectory = `${root}-external-empty`;
    roots.push(externalDirectory);
    await fs.mkdir(mapDirectory);
    await fs.mkdir(externalDirectory);

    const originalLstat = fs.lstat;
    const lstat = vi.spyOn(fs, "lstat").mockImplementationOnce(async (candidate) => {
      const stats = await originalLstat(candidate);
      await fs.rename(mapDirectory, movedDirectory);
      await fs.symlink(externalDirectory, mapDirectory);
      return stats;
    });

    try {
      await expect(inspectProjectMapFile(root)).resolves.toMatchObject({
        kind: "unsafe",
        mapPath: path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH),
      });
    } finally {
      lstat.mockRestore();
    }
    expect((await fs.lstat(mapDirectory)).isSymbolicLink()).toBe(true);
    await expect(fs.readdir(externalDirectory)).resolves.toEqual([]);
  });

  it("does not follow a symlink substituted after lstat", async () => {
    const root = await temporaryRoot();
    const originalText = currentMap();
    const targetText = originalText.replace("2026-07-16", "2026-07-17");
    const mapPath = await writeProjectMap(root, originalText);
    const movedPath = path.join(root, "checked-map.md");
    const targetPath = path.join(root, "replacement-map.md");
    await fs.writeFile(targetPath, targetText, "utf8");

    const originalLstat = fs.lstat;
    const lstat = vi.spyOn(fs, "lstat").mockImplementationOnce(async (candidate) => {
      const stats = await originalLstat(candidate);
      await fs.rename(mapPath, movedPath);
      await fs.symlink(targetPath, mapPath);
      return stats;
    });

    try {
      await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsafe", mapPath });
    } finally {
      lstat.mockRestore();
    }
    expect((await fs.lstat(mapPath)).isSymbolicLink()).toBe(true);
    await expect(fs.readFile(movedPath, "utf8")).resolves.toBe(originalText);
    await expect(fs.readFile(targetPath, "utf8")).resolves.toBe(targetText);
  });

  it("returns unsafe for a directory at the file path without modifying it", async () => {
    const root = await temporaryRoot();
    const mapPath = path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(mapPath, { recursive: true });

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsafe", mapPath });
    expect((await fs.lstat(mapPath)).isDirectory()).toBe(true);
    await expect(fs.readdir(mapPath)).resolves.toEqual([]);
  });

  it("returns invalid parser state without rewriting invalid content", async () => {
    const root = await temporaryRoot();
    const text = currentMap().replace("map_status: confirmed", "map_status: draft");
    const mapPath = await writeProjectMap(root, text);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({
      kind: "invalid",
      mapPath,
      recognizedVersion: 2,
      safelyReadText: text,
    });
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(text);
  });

  it("returns unsupported parser state without rewriting future content", async () => {
    const root = await temporaryRoot();
    const text = currentMap().replace("navi_map: 2", "navi_map: 3");
    const mapPath = await writeProjectMap(root, text);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsupported", mapPath, version: 3 });
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(text);
  });
});
