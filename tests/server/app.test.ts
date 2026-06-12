import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";

describe("server app", () => {
  it("starts and resumes a current session through the API", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const app = createApp({ repoPath: repo, homeDir: home });
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address.");

    const initialCurrent = await fetch(`http://127.0.0.1:${address.port}/api/session/current`);
    const initialBody = await initialCurrent.json() as null;
    const start = await fetch(`http://127.0.0.1:${address.port}/api/session/start`, { method: "POST" });
    const startBody = await start.json() as { id: string; plan: { learningGoal: string } };
    const resumed = await fetch(`http://127.0.0.1:${address.port}/api/session/current`);
    const resumedBody = await resumed.json() as { id: string; plan: { learningGoal: string } };
    server.close();

    expect(initialBody).toBeNull();
    expect(startBody.plan.learningGoal).toContain("understand");
    expect(resumedBody.id).toBe(startBody.id);
    expect(resumedBody.plan.learningGoal).toBe(startBody.plan.learningGoal);
  });

  it("exposes Doctor and review endpoints", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    const app = createApp({ repoPath: repo, homeDir: home });
    const server = app.listen(0);
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected TCP address.");

    await fetch(`http://127.0.0.1:${address.port}/api/session/start`, { method: "POST" });
    const pause = await fetch(`http://127.0.0.1:${address.port}/api/session/pause`, { method: "POST" });
    const pauseBody = await pause.json() as { lifecycleState: string };
    await fetch(`http://127.0.0.1:${address.port}/api/session/wrap-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Review me." }),
    });

    const doctor = await fetch(`http://127.0.0.1:${address.port}/api/runtime/doctor`);
    const doctorBody = await doctor.json() as { lifecycleState: string; permissionEnvelope: { canModifyProjectFiles: boolean } };
    const inbox = await fetch(`http://127.0.0.1:${address.port}/api/review/inbox`);
    const inboxBody = await inbox.json() as Array<{ id: string; status: string }>;
    const items = await fetch(`http://127.0.0.1:${address.port}/api/review/items`);
    const itemsBody = await items.json() as Array<{ id: string; status: string }>;
    const decision = await fetch(`http://127.0.0.1:${address.port}/api/review/items/${itemsBody[0].id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "reject" }),
    });
    const decisionBody = await decision.json() as { status: string };
    const reject = await fetch(`http://127.0.0.1:${address.port}/api/review/${inboxBody[0].id}/reject`, { method: "POST" });
    const rejectBody = await reject.json() as { status: string };
    server.close();

    expect(doctorBody.lifecycleState).toBe("wrapped");
    expect(doctorBody.permissionEnvelope.canModifyProjectFiles).toBe(false);
    expect(pauseBody.lifecycleState).toBe("paused");
    expect(inboxBody).toHaveLength(1);
    expect(itemsBody).toHaveLength(1);
    expect(itemsBody[0].id).toBe(inboxBody[0].id);
    expect(decisionBody.status).toBe("rejected");
    expect(rejectBody.status).toBe("rejected");
  });
});
