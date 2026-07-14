import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  inspectProjectMapFile,
  NAVI_PROJECT_MAP_RELATIVE_PATH,
  parseProjectMapDocument,
  REQUIRED_PROJECT_MAP_ANCHORS,
} from "../../src/cli/navi-project-map";

const roots: string[] = [];
const map = (headings: string[]) => `---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-13
---
# Navi Project Map

${REQUIRED_PROJECT_MAP_ANCHORS.map((anchor, index) =>
  `<!-- ${anchor} -->\n## ${headings[index]}\n\nConfirmed value ${index + 1}.`,
).join("\n\n")}
`;

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
  it.each([
    ["English", ["Desired Outcome", "Route To Outcome", "Current Position", "Current Boundary", "Next Decision", "Evidence And Uncertainty"]],
    ["Chinese", ["期望结果", "实现路线", "当前位置", "当前边界", "下一决策", "证据与不确定性"]],
  ])("accepts %s natural-language headings with stable anchors", (_name, headings) => {
    expect(parseProjectMapDocument(map(headings))).toMatchObject({
      kind: "valid",
      document: { version: 1, mapStatus: "confirmed", projectStatus: "active", lastConfirmed: "2026-07-13" },
    });
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
    ["invalid date", (text: string) => text.replace("2026-07-13", "13/07/2026")],
  ])("rejects %s", (_name, mutate) => {
    expect(parseProjectMapDocument(mutate(map(["A", "B", "C", "D", "E", "F"]))).kind).toBe("invalid");
  });

  it("does not count required anchors embedded only in optional frontmatter metadata", () => {
    const metadataAnchors = REQUIRED_PROJECT_MAP_ANCHORS.map(
      (anchor, index) => `metadata_${index}: <!-- ${anchor} -->`,
    ).join("\n");
    const text = `---
navi_map: 1
map_status: confirmed
project_status: active
last_confirmed: 2026-07-13
${metadataAnchors}
---
# Navi Project Map

No body anchors.
`;

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "invalid", recognizedVersion: 1 });
  });

  it("preserves an unsupported future contract version", () => {
    expect(parseProjectMapDocument(map(["A", "B", "C", "D", "E", "F"]).replace("navi_map: 1", "navi_map: 2"))).toMatchObject({ kind: "unsupported", version: 2 });
  });

  it.each([
    ["0", 0],
    ["02", 2],
    ["-1", -1],
  ])("preserves unsupported base-10 integer version %s", (rawVersion, version) => {
    const text = map(["A", "B", "C", "D", "E", "F"]).replace("navi_map: 1", `navi_map: ${rawVersion}`);

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "unsupported", version });
  });

  it("preserves the original text and accepts unique scalar metadata", () => {
    const text = map(["A", "B", "C", "D", "E", "F"]).replace(
      "last_confirmed: 2026-07-13",
      "last_confirmed: 2026-07-13\nowner: Navi team",
    );

    expect(parseProjectMapDocument(text)).toMatchObject({ kind: "valid", document: { text } });
  });

  it.each([
    ["missing opening delimiter", (text: string) => text.replace(/^---\n/, "")],
    ["missing closing delimiter", (text: string) => text.replace("\n---\n# Navi", "\n# Navi")],
    ["malformed metadata", (text: string) => text.replace("map_status: confirmed", "map_status confirmed")],
    ["duplicate required key", (text: string) => text.replace("map_status: confirmed", "map_status: confirmed\nmap_status: confirmed")],
    ["missing required key", (text: string) => text.replace("project_status: active\n", "")],
    ["non-integer version", (text: string) => text.replace("navi_map: 1", "navi_map: 1.0")],
    ["impossible calendar date", (text: string) => text.replace("2026-07-13", "2026-02-29")],
  ])("rejects %s frontmatter", (_name, mutate) => {
    expect(parseProjectMapDocument(mutate(map(["A", "B", "C", "D", "E", "F"]))).kind).toBe("invalid");
  });

  it("reports a future version before validating version-one contract fields", () => {
    const future = map(["A", "B", "C", "D", "E", "F"])
      .replace("navi_map: 1", "navi_map: 12")
      .replace("map_status: confirmed", "map_status: draft")
      .replace("<!-- navi:next-decision -->", "");

    expect(parseProjectMapDocument(future)).toMatchObject({ kind: "unsupported", version: 12 });
  });

  it.each(["active", "paused", "closed"] as const)("accepts the %s project lifecycle", (status) => {
    const text = map(["A", "B", "C", "D", "E", "F"]).replace("project_status: active", `project_status: ${status}`);

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
    const text = map(["A", "B", "C", "D", "E", "F"]);
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
    const text = map(["A", "B", "C", "D", "E", "F"]);
    await fs.writeFile(targetPath, text, "utf8");
    const mapPath = path.join(root, NAVI_PROJECT_MAP_RELATIVE_PATH);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.symlink(targetPath, mapPath);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsafe", mapPath });
    expect((await fs.lstat(mapPath)).isSymbolicLink()).toBe(true);
    await expect(fs.readFile(targetPath, "utf8")).resolves.toBe(text);
  });

  it("does not follow a symlink substituted after lstat", async () => {
    const root = await temporaryRoot();
    const originalText = map(["A", "B", "C", "D", "E", "F"]);
    const targetText = originalText.replace("2026-07-13", "2026-07-14");
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
    const text = map(["A", "B", "C", "D", "E", "F"]).replace("map_status: confirmed", "map_status: draft");
    const mapPath = await writeProjectMap(root, text);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "invalid", mapPath, recognizedVersion: 1 });
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(text);
  });

  it("returns unsupported parser state without rewriting future content", async () => {
    const root = await temporaryRoot();
    const text = map(["A", "B", "C", "D", "E", "F"]).replace("navi_map: 1", "navi_map: 2");
    const mapPath = await writeProjectMap(root, text);

    await expect(inspectProjectMapFile(root)).resolves.toMatchObject({ kind: "unsupported", mapPath, version: 2 });
    await expect(fs.readFile(mapPath, "utf8")).resolves.toBe(text);
  });
});
