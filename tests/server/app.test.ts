import fs from "node:fs/promises";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";

async function closeServer(server: Server | undefined): Promise<void> {
  if (!server?.listening) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

describe("server app", () => {
  it("starts and resumes a current session through the API", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    let server: Server | undefined;

    try {
      const app = createApp({ repoPath: repo, homeDir: home });
      server = app.listen(0);
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("Expected TCP address.");

      const initialCurrent = await fetch(`http://127.0.0.1:${address.port}/api/session/current`);
      const initialBody = await initialCurrent.json() as null;
      const start = await fetch(`http://127.0.0.1:${address.port}/api/session/start`, { method: "POST" });
      const startBody = await start.json() as { id: string; plan: { learningGoal: string } };
      const resumed = await fetch(`http://127.0.0.1:${address.port}/api/session/current`);
      const resumedBody = await resumed.json() as { id: string; plan: { learningGoal: string } };

      expect(initialBody).toBeNull();
      expect(startBody.plan.learningGoal).toContain("understand");
      expect(resumedBody.id).toBe(startBody.id);
      expect(resumedBody.plan.learningGoal).toBe(startBody.plan.learningGoal);
    } finally {
      await closeServer(server);
    }
  });

  it("exposes Doctor and review endpoints", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    let server: Server | undefined;

    try {
      const app = createApp({ repoPath: repo, homeDir: home });
      server = app.listen(0);
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
      const invalidTrace = await fetch(`http://127.0.0.1:${address.port}/api/runtime/traces?sessionId=${encodeURIComponent("../current")}`);
      const invalidDecision = await fetch(`http://127.0.0.1:${address.port}/api/review/items/${itemsBody[0].id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "maybe" }),
      });
      const missingReview = await fetch(`http://127.0.0.1:${address.port}/api/review/items/review-missing/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "accepted" }),
      });

      expect(doctorBody.lifecycleState).toBe("wrapped");
      expect(doctorBody.permissionEnvelope.canModifyProjectFiles).toBe(false);
      expect(pauseBody.lifecycleState).toBe("paused");
      expect(inboxBody).toHaveLength(1);
      expect(itemsBody).toHaveLength(1);
      expect(itemsBody[0].id).toBe(inboxBody[0].id);
      expect(decisionBody.status).toBe("rejected");
      expect(rejectBody.status).toBe("rejected");
      expect(invalidTrace.status).toBe(400);
      expect(invalidDecision.status).toBe(400);
      expect(missingReview.status).toBe(404);
    } finally {
      await closeServer(server);
    }
  });

  it("recovers current session after creating a new app instance", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-"));
    const repo = path.join(root, "repo");
    const home = path.join(root, "home");
    await fs.mkdir(repo);
    await fs.mkdir(home);
    await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");

    let firstServer: Server | undefined;
    let secondServer: Server | undefined;

    try {
      const firstApp = createApp({ repoPath: repo, homeDir: home });
      firstServer = firstApp.listen(0);
      const firstAddress = firstServer.address();
      if (!firstAddress || typeof firstAddress === "string") throw new Error("Expected TCP address.");
      const start = await fetch(`http://127.0.0.1:${firstAddress.port}/api/session/start`, { method: "POST" });
      expect(start.status).toBe(200);
      const started = await start.json() as { id?: unknown };
      expect(typeof started.id).toBe("string");
      expect(started.id).not.toBe("");
      await closeServer(firstServer);
      firstServer = undefined;

      const secondApp = createApp({ repoPath: repo, homeDir: home });
      secondServer = secondApp.listen(0);
      const secondAddress = secondServer.address();
      if (!secondAddress || typeof secondAddress === "string") throw new Error("Expected TCP address.");
      const current = await fetch(`http://127.0.0.1:${secondAddress.port}/api/session/current`);
      expect(current.status).toBe(200);
      const recovered = await current.json() as { id?: unknown };
      expect(typeof recovered.id).toBe("string");
      expect(recovered.id).not.toBe("");

      expect(recovered.id).toBe(started.id);
    } finally {
      await Promise.all([closeServer(firstServer), closeServer(secondServer)]);
    }
  });
});
