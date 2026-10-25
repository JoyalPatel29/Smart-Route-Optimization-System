import { GraphData, GraphEdge, GraphNode } from '../types/graph';

/**
 * Default sample 8-location urban road network for college DAA project.
 * Node coordinates (x, y) are mapped in a canvas space (800 x 500).
 * Edge weights represent road distances in kilometers or travel units.
 * Multiple alternative paths exist between pairs of vertices.
 */
export const SAMPLE_GRAPH_DATA: GraphData = {
  isDirected: false,
  nodes: [
    { id: 'college', name: 'Engineering College', x: 120, y: 140, color: '#3b82f6' },
    { id: 'library', name: 'Central Library', x: 280, y: 80, color: '#6366f1' },
    { id: 'bus_stand', name: 'City Bus Stand', x: 220, y: 260, color: '#06b6d4' },
    { id: 'market', name: 'Town Market', x: 400, y: 190, color: '#10b981' },
    { id: 'hospital', name: 'Civil Hospital', x: 420, y: 350, color: '#ef4444' },
    { id: 'railway', name: 'Railway Station', x: 580, y: 130, color: '#f59e0b' },
    { id: 'mall', name: 'Grand Mall', x: 620, y: 320, color: '#ec4899' },
    { id: 'airport', name: 'Metro Airport', x: 740, y: 210, color: '#8b5cf6' },
  ],
  edges: [
    // Multiple paths between nodes
    { id: 'e1', from: 'college', to: 'library', weight: 4 },
    { id: 'e2', from: 'college', to: 'bus_stand', weight: 5 },
    { id: 'e3', from: 'library', to: 'market', weight: 6 },
    { id: 'e4', from: 'library', to: 'railway', weight: 8 },
    { id: 'e5', from: 'bus_stand', to: 'market', weight: 4 },
    { id: 'e6', from: 'bus_stand', to: 'hospital', weight: 7 },
    { id: 'e7', from: 'market', to: 'hospital', weight: 3 },
    { id: 'e8', from: 'market', to: 'railway', weight: 5 },
    { id: 'e9', from: 'market', to: 'mall', weight: 6 },
    { id: 'e10', from: 'hospital', to: 'mall', weight: 4 },
    { id: 'e11', from: 'railway', to: 'mall', weight: 5 },
    { id: 'e12', from: 'railway', to: 'airport', weight: 7 },
    { id: 'e13', from: 'mall', to: 'airport', weight: 4 },
  ],
};

/**
 * Calculates Euclidean distance between two nodes.
 * Used for A* heuristic and realistic spatial edge weights.
 */
export function getEuclideanDistance(n1: GraphNode, n2: GraphNode): number {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generates a connected random graph of specified size with spatial coordinates.
 * To ensure A* heuristic admissibility (h <= true distance), edge weights are
 * scaled to be >= spatial Euclidean distance.
 */
export function generateRandomGraph(
  vertexCount: number,
  densityMultiplier: number = 1.6,
  canvasWidth: number = 800,
  canvasHeight: number = 500
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const padding = 50;

  // 1. Generate nodes with scattered coordinates
  for (let i = 0; i < vertexCount; i++) {
    const x = Math.round(padding + Math.random() * (canvasWidth - 2 * padding));
    const y = Math.round(padding + Math.random() * (canvasHeight - 2 * padding));
    nodes.push({
      id: `v_${i + 1}`,
      name: `Location ${i + 1}`,
      x,
      y,
    });
  }

  // 2. Ensure graph is connected using a spanning tree (connecting node i to a random prior node)
  const connectedPairs = new Set<string>();
  const makeKey = (u: string, v: string) => (u < v ? `${u}--${v}` : `${v}--${u}`);

  for (let i = 1; i < vertexCount; i++) {
    // Pick nearest or random preceding node to keep graph planar-like
    let bestPrev = 0;
    let minD = Infinity;
    // Look at previous nodes
    for (let j = 0; j < i; j++) {
      const d = getEuclideanDistance(nodes[i], nodes[j]);
      if (d < minD) {
        minD = d;
        bestPrev = j;
      }
    }

    const u = nodes[i].id;
    const v = nodes[bestPrev].id;
    const key = makeKey(u, v);
    connectedPairs.add(key);

    const dist = getEuclideanDistance(nodes[i], nodes[bestPrev]);
    // Realistic positive integer weight based on spatial distance
    const weight = Math.max(1, Math.round(dist / 20));

    edges.push({
      id: `edge_${edges.length + 1}`,
      from: u,
      to: v,
      weight,
    });
  }

  // 3. Add additional edges based on spatial proximity to create alternative routes
  const targetEdgeCount = Math.min(
    Math.round(vertexCount * densityMultiplier),
    (vertexCount * (vertexCount - 1)) / 2
  );

  let attempts = 0;
  while (edges.length < targetEdgeCount && attempts < vertexCount * 10) {
    attempts++;
    const i = Math.floor(Math.random() * vertexCount);
    const j = Math.floor(Math.random() * vertexCount);
    if (i === j) continue;

    const u = nodes[i].id;
    const v = nodes[j].id;
    const key = makeKey(u, v);

    if (!connectedPairs.has(key)) {
      const dist = getEuclideanDistance(nodes[i], nodes[j]);
      // Avoid ridiculously long crossing edges for aesthetic readability
      if (dist < canvasWidth * 0.45 || attempts > vertexCount * 5) {
        connectedPairs.add(key);
        const weight = Math.max(1, Math.round(dist / 20));
        edges.push({
          id: `edge_${edges.length + 1}`,
          from: u,
          to: v,
          weight,
        });
      }
    }
  }

  return {
    isDirected: false,
    nodes,
    edges,
  };
}
