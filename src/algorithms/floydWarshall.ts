import { Graph } from '../graph/graphModel';
import { AlgorithmResult } from '../types/graph';
import { getNodeNames, measureExecution } from '../utils/pathUtils';

/**
 * Floyd-Warshall All-Pairs Shortest Path Algorithm
 * Manual Implementation for DAA Academic Demonstration
 *
 * Characteristics:
 * - Strategy: Dynamic Programming
 * - Recurrence: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
 * - Data Structure: 2D Distance Matrix and 2D Next Matrix
 * - Time Complexity: O(V^3)
 * - Space Complexity: O(V^2)
 */
export function runFloydWarshall(
  graph: Graph,
  sourceId: string,
  destId: string
): AlgorithmResult {
  const { result, executionTimeMs } = measureExecution(() => {
    // 1. Validation
    if (!graph.getNode(sourceId)) {
      throw new Error(`Source node '${sourceId}' not found in graph.`);
    }
    if (!graph.getNode(destId)) {
      throw new Error(`Destination node '${destId}' not found in graph.`);
    }

    const allNodes = graph.getAllNodes();
    const V = allNodes.length;

    // Index mappings
    const nodeIndexMap = new Map<string, number>();
    const indexNodeMap = new Map<number, string>();

    allNodes.forEach((node, idx) => {
      nodeIndexMap.set(node.id, idx);
      indexNodeMap.set(idx, node.id);
    });

    const srcIndex = nodeIndexMap.get(sourceId)!;
    const dstIndex = nodeIndexMap.get(destId)!;

    // 2. Initialize Distance & Next Matrices
    const dist: number[][] = Array.from({ length: V }, () =>
      Array.from({ length: V }, () => Infinity)
    );
    const next: (number | null)[][] = Array.from({ length: V }, () =>
      Array.from({ length: V }, () => null)
    );

    // Distance from node to itself is 0
    for (let i = 0; i < V; i++) {
      dist[i][i] = 0;
      next[i][i] = i;
    }

    // Direct edges initialization
    for (const edge of graph.getAllEdges()) {
      const u = nodeIndexMap.get(edge.from);
      const v = nodeIndexMap.get(edge.to);

      if (u !== undefined && v !== undefined) {
        // If multiple edges exist between two nodes, pick minimum weight
        if (edge.weight < dist[u][v]) {
          dist[u][v] = edge.weight;
          next[u][v] = v;
        }

        if (!graph.isDirected) {
          if (edge.weight < dist[v][u]) {
            dist[v][u] = edge.weight;
            next[v][u] = u;
          }
        }
      }
    }

    const exploredOrder: string[] = [];

    // 3. Dynamic Programming Triply Nested Loop (k = intermediate, i = source, j = destination)
    for (let k = 0; k < V; k++) {
      const kNodeId = indexNodeMap.get(k)!;
      exploredOrder.push(kNodeId);
      const rowK = dist[k];

      for (let i = 0; i < V; i++) {
        const dIK = dist[i][k];
        if (dIK === Infinity) continue; // No path through k for this i

        const rowI = dist[i];
        const nextI = next[i];
        const nextIK = next[i][k];

        for (let j = 0; j < V; j++) {
          const dKJ = rowK[j];
          if (dKJ === Infinity) continue;

          const throughK = dIK + dKJ;
          if (throughK < rowI[j]) {
            rowI[j] = throughK;
            nextI[j] = nextIK;
          }
        }
      }
    }

    // 4. Check for negative cycles (if dist[i][i] < 0)
    for (let i = 0; i < V; i++) {
      if (dist[i][i] < 0) {
        throw new Error('Graph contains a negative weight cycle.');
      }
    }

    // 5. Reconstruct Path between requested source and destination
    let path: string[] = [];
    let totalDistance = -1;

    if (dist[srcIndex][dstIndex] !== Infinity) {
      totalDistance = dist[srcIndex][dstIndex];

      if (srcIndex === dstIndex) {
        path = [sourceId];
      } else if (next[srcIndex][dstIndex] !== null) {
        let curr: number | null = srcIndex;
        path.push(indexNodeMap.get(curr)!);

        const visitedIndices = new Set<number>();
        visitedIndices.add(curr);

        while (curr !== dstIndex && curr !== null) {
          curr = next[curr][dstIndex];
          if (curr === null || visitedIndices.has(curr)) break;
          visitedIndices.add(curr);
          path.push(indexNodeMap.get(curr)!);
        }
      }
    }

    return {
      path,
      totalDistance,
      exploredOrder,
      nodesExplored: V, // Considers all V vertices as intermediate relaxers
    };
  });

  const pathNames = getNodeNames(result.path, graph.nodes);

  return {
    algorithm: 'floyd-warshall',
    algorithmName: "Floyd-Warshall Algorithm",
    sourceId,
    destId,
    path: result.path,
    pathNames,
    totalDistance: result.totalDistance,
    executionTimeMs,
    nodesExplored: result.nodesExplored,
    exploredOrder: result.exploredOrder,
    timeComplexity: 'O(V³)',
    spaceComplexity: 'O(V²)',
    approach: 'Dynamic Programming (All-Pairs)',
    success: result.totalDistance !== -1,
    error: result.totalDistance === -1 ? 'No route found between source and destination (disconnected).' : undefined,
  };
}
