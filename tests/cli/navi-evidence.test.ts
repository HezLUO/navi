import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { inspectProjectEvidence } from "../../src/cli/navi-evidence";
import { renderAgentsBlock } from "../../src/cli/navi-project-trigger";

const roots: string[] = [];

async function projectRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "navi-evidence-"));
  roots.push(root);
  return root;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("bounded Navi project evidence inspection", () => {
  it("discovers only candidate local text sources in deterministic priority order", async () => {
    const root = await projectRoot();
    await fs.writeFile(path.join(root, "package.json"), "{}\n");
    await fs.writeFile(path.join(root, "README.md"), "# Read me\n");
    await fs.writeFile(path.join(root, "STATUS.md"), "# Status\n");
    await fs.writeFile(path.join(root, "photo.png"), "not really an image\n");

    const result = await inspectProjectEvidence(root);

    expect(result.items.map((item) => item.relativePath)).toEqual(["README.md", "STATUS.md", "package.json"]);
    expect(result.items.map((item) => item.text)).toEqual(["# Read me\n", "# Status\n", "{}\n"]);
    expect(result.truncated).toBe(false);
  });

  it("keeps candidate count bounded and deterministic", async () => {
    const root = await projectRoot();
    for (let index = 0; index < 90; index += 1) {
      await fs.writeFile(path.join(root, `README-${String(index).padStart(2, "0")}.md`), `# ${index}\n`);
    }

    const result = await inspectProjectEvidence(root);

    expect(result.items).toHaveLength(50);
    expect(result.items[0]?.relativePath).toBe("README-00.md");
    expect(result.items.at(-1)?.relativePath).toBe("README-49.md");
    expect(result.truncated).toBe(true);
  });

  it("preserves high-priority project-map evidence when many README candidates exist", async () => {
    const root = await projectRoot();
    for (let index = 0; index < 80; index += 1) {
      await fs.writeFile(path.join(root, `README-${String(index).padStart(2, "0")}.md`), `# ${index}\n`);
    }
    const mapDir = path.join(root, "docs/along/project-maps");
    await fs.mkdir(mapDir, { recursive: true });
    await fs.writeFile(path.join(mapDir, "confirmed.md"), "# Existing project record\n");

    const result = await inspectProjectEvidence(root);

    expect(result.items.map((item) => item.relativePath)).toContain("docs/along/project-maps/confirmed.md");
    expect(result.items).toHaveLength(50);
  });

  it("bounds large snippets with head and tail without full-file reads", async () => {
    const root = await projectRoot();
    const readme = path.join(root, "README.md");
    await fs.writeFile(readme, `HEAD\n${"middle ".repeat(5000)}\nTAIL`);
    const originalReadFile = fs.readFile.bind(fs);
    vi.spyOn(fs, "readFile").mockImplementation(async (...args: Parameters<typeof fs.readFile>) => {
      if (path.resolve(String(args[0])) === readme) throw new Error("full read forbidden");
      return originalReadFile(...args);
    });

    const result = await inspectProjectEvidence(root);

    expect(result.items[0]?.text).toContain("HEAD");
    expect(result.items[0]?.text).toContain("Navi evidence omitted between bounded head and tail");
    expect(result.items[0]?.text).toContain("TAIL");
    expect(Buffer.byteLength(result.items[0]?.text ?? "")).toBeLessThan(13 * 1024);
    expect(result.truncated).toBe(true);
  });

  it("charges the total byte budget by raw bytes read", async () => {
    const root = await projectRoot();
    for (let index = 0; index < 30; index += 1) {
      await fs.writeFile(path.join(root, `README-${String(index).padStart(2, "0")}.md`), "x".repeat(20 * 1024));
    }
    let rawBytesRead = 0;
    const originalOpen = fs.open.bind(fs);
    vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
      const handle = await originalOpen(...args);
      const tracked = handle as unknown as { read: (...readArgs: unknown[]) => Promise<{ bytesRead: number }> };
      const originalRead = tracked.read.bind(handle);
      tracked.read = async (...readArgs: unknown[]) => {
        const value = await originalRead(...readArgs);
        rawBytesRead += value.bytesRead;
        return value;
      };
      return handle;
    });

    const result = await inspectProjectEvidence(root);

    expect(rawBytesRead).toBeLessThanOrEqual(160 * 1024);
    expect(result.truncated).toBe(true);
  });

  it("does not let an oversized unrelated directory starve root evidence", async () => {
    const root = await projectRoot();
    const mapDir = path.join(root, "docs/along/project-maps");
    await fs.mkdir(mapDir, { recursive: true });
    for (let index = 0; index < 200; index += 1) {
      await fs.writeFile(path.join(mapDir, `unrelated-${String(index).padStart(3, "0")}.txt`), "ignored\n");
    }
    await fs.writeFile(path.join(root, "README.md"), "# Root evidence\n");

    const result = await inspectProjectEvidence(root);

    expect(result.items.map((item) => item.relativePath)).toContain("README.md");
    expect(result.truncated).toBe(true);
  });

  it("skips ignored, unreadable, and disappearing paths safely", async () => {
    const root = await projectRoot();
    const ignored = path.join(root, "node_modules");
    const unreadable = path.join(root, "workflow-records");
    const vanishing = path.join(root, "README.md");
    await fs.mkdir(ignored);
    await fs.mkdir(unreadable);
    await fs.writeFile(path.join(ignored, "README.md"), "ignored\n");
    await fs.writeFile(path.join(unreadable, "plan.md"), "unreadable\n");
    await fs.writeFile(vanishing, "gone\n");
    const originalOpendir = fs.opendir.bind(fs);
    vi.spyOn(fs, "opendir").mockImplementation(async (...args: Parameters<typeof fs.opendir>) => {
      if (path.resolve(String(args[0])) === unreadable) {
        const error = new Error("denied") as NodeJS.ErrnoException;
        error.code = "EACCES";
        throw error;
      }
      return originalOpendir(...args);
    });
    const originalOpen = fs.open.bind(fs);
    vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
      if (path.resolve(String(args[0])) === vanishing) {
        const error = new Error("gone") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        throw error;
      }
      return originalOpen(...args);
    });

    await expect(inspectProjectEvidence(root)).resolves.toEqual({ items: [], truncated: false });
  });

  it.each(["docs", "along", "project-maps"] as const)(
    "does not read external evidence through a symlinked %s directory component",
    async (symlinkedComponent) => {
      const root = await projectRoot();
      const external = `${root}-external-${symlinkedComponent}`;
      roots.push(external);
      const localDocs = path.join(root, "docs");
      const localAlong = path.join(localDocs, "along");
      let linkPath: string;
      let externalMapDirectory: string;

      if (symlinkedComponent === "docs") {
        linkPath = localDocs;
        externalMapDirectory = path.join(external, "along", "project-maps");
      } else if (symlinkedComponent === "along") {
        await fs.mkdir(localDocs);
        linkPath = localAlong;
        externalMapDirectory = path.join(external, "project-maps");
      } else {
        await fs.mkdir(localAlong, { recursive: true });
        linkPath = path.join(localAlong, "project-maps");
        externalMapDirectory = external;
      }

      await fs.mkdir(externalMapDirectory, { recursive: true });
      const externalReadme = path.join(externalMapDirectory, "README.md");
      const externalMap = path.join(externalMapDirectory, "escaped-map.md");
      await fs.writeFile(externalReadme, "# External README\n");
      await fs.writeFile(externalMap, "# External Map-like record\n");
      await fs.symlink(external, linkPath);
      const openedPaths: string[] = [];
      const originalOpen = fs.open.bind(fs);
      vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
        openedPaths.push(await fs.realpath(String(args[0])));
        return originalOpen(...args);
      });

      const result = await inspectProjectEvidence(root);

      expect(result.items).toEqual([]);
      expect(openedPaths).not.toContain(externalReadme);
      expect(openedPaths).not.toContain(externalMap);
      await expect(fs.readFile(externalReadme, "utf8")).resolves.toBe("# External README\n");
      await expect(fs.readFile(externalMap, "utf8")).resolves.toBe("# External Map-like record\n");
    },
  );

  it("revalidates directory identities after opendir before traversing evidence", async () => {
    const root = await projectRoot();
    const mapDirectory = path.join(root, "docs", "along", "project-maps");
    const movedDirectory = path.join(root, "docs", "along", "checked-project-maps");
    const externalDirectory = `${root}-external-opendir`;
    roots.push(externalDirectory);
    await fs.mkdir(mapDirectory, { recursive: true });
    await fs.mkdir(externalDirectory);
    for (let index = 0; index < 170; index += 1) {
      await fs.writeFile(
        path.join(externalDirectory, `README-${String(index).padStart(3, "0")}.md`),
        `# Escaped through opendir ${index}\n`,
      );
    }

    const originalOpendir = fs.opendir.bind(fs);
    let substituted = false;
    vi.spyOn(fs, "opendir").mockImplementation(async (...args: Parameters<typeof fs.opendir>) => {
      if (!substituted && path.resolve(String(args[0])) === mapDirectory) {
        substituted = true;
        await fs.rename(mapDirectory, movedDirectory);
        await fs.symlink(externalDirectory, mapDirectory);
      }
      return originalOpendir(...args);
    });

    const result = await inspectProjectEvidence(root);

    expect(result).toEqual({ items: [], truncated: false });
    expect(result.items.some((item) => item.text.includes("Escaped through opendir"))).toBe(false);
  });

  it("binds candidate parent and file identities before reading evidence", async () => {
    const root = await projectRoot();
    const workflowDirectory = path.join(root, "workflow");
    const movedDirectory = path.join(root, "checked-workflow");
    const candidatePath = path.join(workflowDirectory, "plan.md");
    const externalDirectory = `${root}-external-open`;
    const externalCandidate = path.join(externalDirectory, "plan.md");
    roots.push(externalDirectory);
    await fs.mkdir(workflowDirectory);
    await fs.mkdir(externalDirectory);
    await fs.writeFile(candidatePath, "# Local plan\n");
    await fs.writeFile(externalCandidate, "# Escaped through open\n");

    const originalOpen = fs.open.bind(fs);
    let substituted = false;
    vi.spyOn(fs, "open").mockImplementation(async (...args: Parameters<typeof fs.open>) => {
      if (!substituted && path.resolve(String(args[0])) === candidatePath) {
        substituted = true;
        await fs.rename(workflowDirectory, movedDirectory);
        await fs.symlink(externalDirectory, workflowDirectory);
      }
      return originalOpen(...args);
    });

    const result = await inspectProjectEvidence(root);

    expect(result.items.map((item) => item.text)).not.toContain("# Escaped through open\n");
    expect(result.items.map((item) => item.relativePath)).not.toContain("workflow/plan.md");
    await expect(fs.readFile(path.join(movedDirectory, "plan.md"), "utf8")).resolves.toBe("# Local plan\n");
    await expect(fs.readFile(externalCandidate, "utf8")).resolves.toBe("# Escaped through open\n");
  });

  it("strips the generated Navi block but keeps project-owned AGENTS evidence", async () => {
    const root = await projectRoot();
    await fs.writeFile(path.join(root, "AGENTS.md"), `${renderAgentsBlock()}\n\n# User evidence\nKeep this project fact.\n`);

    const result = await inspectProjectEvidence(root);

    expect(result.items).toEqual([{ relativePath: "AGENTS.md", text: "\n\n# User evidence\nKeep this project fact.\n" }]);
    expect(result.items[0]?.text).not.toContain("Navi Progress Map Rules");
  });
});
