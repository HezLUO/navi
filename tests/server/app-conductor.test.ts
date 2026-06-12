import fs from "node:fs/promises";
import type { Server } from "node:http";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/server/app";
import { OpenThreadStore } from "../../src/core/open-thread-store";

async function closeServer(server: Server | undefined): Promise<void> {
  if (!server?.listening) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
}

async function makeServer() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "along-api-conductor-"));
  const repo = path.join(root, "repo");
  const home = path.join(root, "home");
  await fs.mkdir(repo);
  await fs.mkdir(home);
  await fs.writeFile(path.join(repo, "README.md"), "# Demo\n");
  const app = createApp({ repoPath: repo, homeDir: home });
  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address.");
  return { repo, server, base: `http://127.0.0.1:${address.port}` };
}

describe("conductor API", () => {
  it("returns conductor snapshot and heartbeat decisions", async () => {
    let server: Server | undefined;

    try {
      const running = await makeServer();
      server = running.server;
      const { repo, base } = running;
      const threads = new OpenThreadStore(repo);
      await threads.createSeedThread({
        id: "thread-1",
        title: "Runtime plan drift",
        whyItMatters: "Runtime completion matters before Memory v2.",
        currentJudgment: "Runtime may be incomplete.",
      });

      await fetch(`${base}/api/session/start`, { method: "POST" });
      const heartbeat = await fetch(`${base}/api/conductor/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger: "resume" }),
      });
      const heartbeatBody = await heartbeat.json() as { attention: Array<{ action: string }>; delegations: unknown[] };
      const snapshot = await fetch(`${base}/api/conductor/snapshot`);
      const snapshotBody = await snapshot.json() as { threads: Array<{ id: string }> };

      expect(heartbeat.status).toBe(200);
      expect(heartbeatBody.attention[0].action).toBe("read_only_delegation");
      expect(heartbeatBody.delegations).toHaveLength(1);
      expect(snapshotBody.threads[0].id).toBe("thread-1");
    } finally {
      await closeServer(server);
    }
  });

  it("returns 400 for malformed delegation result JSON", async () => {
    let server: Server | undefined;

    try {
      const running = await makeServer();
      server = running.server;

      const response = await fetch(`${running.base}/api/conductor/delegation-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });

      expect(response.status).toBe(400);
    } finally {
      await closeServer(server);
    }
  });
});
