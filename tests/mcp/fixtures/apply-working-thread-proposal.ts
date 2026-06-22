import { access, readFile, writeFile } from "node:fs/promises";
import { createWorkingThreadDocsStore } from "../../../src/mcp/working-thread-docs-store";
import type { WorkingThreadUpdateProposal } from "../../../src/core/working-thread-contract";

const [
  workspaceRoot,
  proposalPath,
  readyPath,
  goPath,
  resultPath,
] = process.argv.slice(2);

if (!workspaceRoot || !proposalPath || !readyPath || !goPath || !resultPath) {
  throw new Error("Usage: apply-working-thread-proposal <workspace> <proposal> <ready> <go> <result>");
}

await writeFile(readyPath, `${process.pid}\n`);
await waitForFile(goPath);

const proposal = JSON.parse(await readFile(proposalPath, "utf8")) as WorkingThreadUpdateProposal;
const store = createWorkingThreadDocsStore({ workspaceRoot });

try {
  const parsed = await store.applySectionPatchProposal(proposal);
  await writeFile(resultPath, JSON.stringify({
    status: "fulfilled",
    currentJudgment: parsed.thread?.currentJudgment,
    nextLikelyMove: parsed.thread?.nextLikelyMove,
  }));
} catch (error) {
  await writeFile(resultPath, JSON.stringify({
    status: "rejected",
    message: error instanceof Error ? error.message : String(error),
  }));
}

async function waitForFile(filePath: string): Promise<void> {
  for (;;) {
    try {
      await access(filePath);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
  }
}
