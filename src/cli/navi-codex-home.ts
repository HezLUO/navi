import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface CanonicalCodexHome {
  requestedPath: string;
  canonicalPath: string;
}

export async function resolveCanonicalCodexHome(requestedPath: string): Promise<CanonicalCodexHome> {
  const requestedPathResolved = path.resolve(requestedPath);
  let stats;
  try {
    stats = await fs.stat(requestedPathResolved);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`CODEX_HOME does not exist: ${requestedPathResolved}`);
    }
    throw error;
  }
  if (!stats.isDirectory()) throw new Error(`CODEX_HOME is not a directory: ${requestedPathResolved}`);

  return { requestedPath: requestedPathResolved, canonicalPath: await fs.realpath(requestedPathResolved) };
}

export function confinedCodexPath(root: string, basename: string): string {
  if (!basename || path.basename(basename) !== basename) {
    throw new Error(`Managed artifact must be a confined basename: ${basename}`);
  }
  const canonicalRoot = path.resolve(root);
  const candidate = path.resolve(canonicalRoot, basename);
  const relative = path.relative(canonicalRoot, candidate);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`Managed artifact is not confined to CODEX_HOME: ${candidate}`);
  }
  return candidate;
}

export async function assertUnlinkedArtifact(artifactPath: string): Promise<"missing" | "file"> {
  let stats;
  try {
    stats = await fs.lstat(artifactPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "missing";
    throw error;
  }
  if (stats.isSymbolicLink()) throw new Error(`Refusing symlinked managed artifact: ${artifactPath}`);
  if (!stats.isFile()) throw new Error(`Managed artifact is not a regular file: ${artifactPath}`);
  return "file";
}
