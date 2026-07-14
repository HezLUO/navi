import fs from "node:fs/promises";
import { NAVI_AGENTS_BLOCK_END, NAVI_AGENTS_BLOCK_START } from "../../src/cli/navi-init";

const LEGACY_SCOPED_COMMIT_AUTHORIZATION =
  "An approved bounded implementation or worktree plan authorizes its explicitly planned local task commits for its worktree parent and bounded subagents. Do not request separate approval for each such commit; report the commit when the task closes. This does not authorize a commit with unknown staged content, history rewriting, merge, push, tag, release, a user request not to commit, project-owned instructions outside the Navi managed block, cross-project changes, scope expansion, or known-risk acceptance.";

async function historicalAgentsBlockFixture(includeScopedCommitAuthorization: boolean): Promise<string> {
  const source = await fs.readFile(
    new URL("../../docs/along/project-maps/navi-project-trigger-template.md", import.meta.url),
    "utf8",
  );
  const fenced = source.match(/````markdown\n([\s\S]*?)\n````/u)?.[1];
  if (fenced === undefined) throw new Error("Historical Navi trigger fixture is missing");

  let body = fenced
    .replace(/\n\nNavi is installed globally once\.[^\n]+\n\n/u, "\n\n")
    .replace("judge; do not include bare", "judge. Do not include bare")
    .replace("`TODO` files", "task/status files");

  if (includeScopedCommitAuthorization) {
    body = body.replace(
      "Stop for user approval before file writes outside the approved mode, commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance. When stopping",
      `Stop for user approval before file writes outside the approved mode, unplanned commits, pushes, tags, releases, cross-project edits, mode changes, scope expansion, validation-budget escalation, or known-risk acceptance. ${LEGACY_SCOPED_COMMIT_AUTHORIZATION} When stopping`,
    );
  }

  return `${NAVI_AGENTS_BLOCK_START}\n${body}\n${NAVI_AGENTS_BLOCK_END}`;
}

export const LEGACY_AGENTS_BLOCK_WITHOUT_SCOPED_AUTHORIZATION =
  await historicalAgentsBlockFixture(false);
export const LEGACY_AGENTS_BLOCK_WITH_SCOPED_AUTHORIZATION =
  await historicalAgentsBlockFixture(true);
