import { GraphData, GraphEdge, GraphNode } from '../types/graph';

export interface GraphNeighbor {
  nodeId: string;
  weight: number;
  edgeId: string;
}

export class Graph {
  public nodes: Map<string, GraphNode> = new Map();
  public adjacencyList: Map<string, GraphNeighbor[]> = new Map();
  public edges: GraphEdge[] = [];
  public isDirected: boolean = false;

  constructor(isDirected: boolean = false) {
    this.isDirected = isDirected;
  }

  public static fromData(data: GraphData): Graph {
    const graph = new Graph(data.isDirected ?? false);
    for (const node of data.nodes) {
      graph.addNode(node);
    }
    for (const edge of data.edges) {
      graph.addEdge(edge);
    }
    return graph;
  }

  public toData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges],
      isDirected: this.isDirected,
    };
  }

  public addNode(node: GraphNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, { ...node });
      this.adjacencyList.set(node.id, []);
    }
  }

  public removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.adjacencyList.delete(nodeId);
    // Remove all edges referencing this node
    this.edges = this.edges.filter((e) => e.from !== nodeId && e.to !== nodeId);
    // Clean up adjacency lists
    for (const [, neighbors] of this.adjacencyList) {
      const idx = neighbors.findIndex((n) => n.nodeId === nodeId);
      if (idx !== -1) {
        neighbors.splice(idx, 1);
      }
    }
  }

  public addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      throw new Error(`Cannot add edge: vertices ${edge.from} or ${edge.to} do not exist.`);
    }
    if (edge.weight <= 0) {
      throw new Error(`Edge weight must be positive. Received weight ${edge.weight}.`);
    }

    this.edges.push(edge);
    this.adjacencyList.get(edge.from)?.push({
      nodeId: edge.to,
      weight: edge.weight,
      edgeId: edge.id,
    });

    if (!this.isDirected && edge.from !== edge.to) {
      this.adjacencyList.get(edge.to)?.push({
        nodeId: edge.from,
        weight: edge.weight,
        edgeId: edge.id,
      });
    }
  }

  public getNeighbors(nodeId: string): GraphNeighbor[] {
    return this.adjacencyList.get(nodeId) || [];
  }

  public getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  public getVertexCount(): number {
    return this.nodes.size;
  }

  public getEdgeCount(): number {
    return this.edges.length;
  }

  public clone(): Graph {
    return Graph.fromData(this.toData());
  }
}
