import fs from "node:fs/promises";
import path from "node:path";
import type { GraphEdge, GraphNode } from "./types";

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const emptyGraph: GraphData = { nodes: [], edges: [] };

export class GraphStore {
  constructor(private readonly graphDir: string) {}

  async read(): Promise<GraphData> {
    await fs.mkdir(this.graphDir, { recursive: true });
    const [nodes, edges] = await Promise.all([
      this.readJson<GraphNode[]>("nodes.json", []),
      this.readJson<GraphEdge[]>("edges.json", []),
    ]);
    return { nodes, edges };
  }

  async addNode(node: GraphNode): Promise<void> {
    const graph = await this.read();
    const withoutDuplicate = graph.nodes.filter((item) => item.id !== node.id);
    await this.writeJson("nodes.json", [...withoutDuplicate, node]);
  }

  async addEdge(edge: GraphEdge): Promise<void> {
    const graph = await this.read();
    const withoutDuplicate = graph.edges.filter((item) => item.id !== edge.id);
    await this.writeJson("edges.json", [...withoutDuplicate, edge]);
  }

  async addMany(nodes: GraphNode[], edges: GraphEdge[]): Promise<void> {
    const graph = await this.read();
    const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
    const edgeMap = new Map(graph.edges.map((edge) => [edge.id, edge]));
    for (const node of nodes) nodeMap.set(node.id, node);
    for (const edge of edges) edgeMap.set(edge.id, edge);
    await this.writeJson("nodes.json", [...nodeMap.values()]);
    await this.writeJson("edges.json", [...edgeMap.values()]);
  }

  private async readJson<T>(fileName: string, fallback: T): Promise<T> {
    try {
      const raw = await fs.readFile(path.join(this.graphDir, fileName), "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async writeJson(fileName: string, value: unknown): Promise<void> {
    await fs.mkdir(this.graphDir, { recursive: true });
    await fs.writeFile(path.join(this.graphDir, fileName), `${JSON.stringify(value, null, 2)}\n`);
  }
}

export { emptyGraph };
