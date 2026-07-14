import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GraphStore } from "../../src/core/graph-store";

describe("graph memory", () => {
  it("stores nodes and relations as readable JSON", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "along-graph-"));
    const store = new GraphStore(path.join(dir, "graph"));
    await store.addNode({ id: "session-1", type: "session", label: "First session", properties: {}, createdAt: "2026-05-13T00:00:00.000Z" });
    await store.addNode({ id: "curiosity-1", type: "curiosity", label: "Where do tests begin?", properties: {}, createdAt: "2026-05-13T00:00:00.000Z" });
    await store.addEdge({ id: "edge-1", from: "session-1", to: "curiosity-1", type: "session_produced_curiosity", createdAt: "2026-05-13T00:00:00.000Z" });

    const graph = await store.read();
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges[0].type).toBe("session_produced_curiosity");
  });
});
