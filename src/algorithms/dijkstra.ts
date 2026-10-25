import { Graph } from '../graph/graphModel';
import { AlgorithmResult } from '../types/graph';
import { getNodeNames, measureExecution, reconstructPath } from '../utils/pathUtils';
import { MinPriorityQueue } from '../utils/priorityQueue';

/**
 * Dijkstra's Shortest Path Algorithm
 * Manual Implementation for DAA Academic Demonstration
 *
 * Characteristics:
 * - Strategy: Greedy approach
 * - Data Structure: Binary Min-Heap / Priority Queue
 * - Time Complexity: O((V + E) log V)
 * - Space Complexity: O(V + E)
 * - Constraint: Edge weights must be non-negative
 */
export function runDijkstra(
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

    // 2. Initialize data structures
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const exploredOrder: string[] = [];

    for (const node of graph.getAllNodes()) {
      distances.set(node.id, Infinity);
      previous.set(node.id, null);
    }

    distances.set(sourceId, 0);

    const pq = new MinPriorityQueue<string>();
    pq.push(sourceId, 0);

    // 3. Main Loop
    while (!pq.isEmpty()) {
      const top = pq.pop()!;
      const u = top.element;
      const currentDist = top.priority;

      // Skip stale items from heap
      if (currentDist > (distances.get(u) ?? Infinity)) {
        continue;
      }

      if (!visited.has(u)) {
        visited.add(u);
        exploredOrder.push(u);
      }

      // Early exit if target node is reached and extracted
      if (u === destId) {
        break;
      }

      const neighbors = graph.getNeighbors(u);
      for (const neighbor of neighbors) {
        const v = neighbor.nodeId;
        const weight = neighbor.weight;

        if (weight < 0) {
          throw new Error(`Negative edge weight (${weight}) encountered on edge ${u}->${v}. Dijkstra requires non-negative weights.`);
        }

        const newDist = currentDist + weight;
        const existingDist = distances.get(v) ?? Infinity;

        if (newDist < existingDist) {
          distances.set(v, newDist);
          previous.set(v, u);
          pq.push(v, newDist);
        }
      }
    }

    const finalDistance = distances.get(destId) ?? Infinity;
    const path = finalDistance === Infinity ? [] : reconstructPath(previous, sourceId, destId);

    return {
      path,
      totalDistance: finalDistance === Infinity ? -1 : finalDistance,
      exploredOrder,
      nodesExplored: exploredOrder.length,
    };
  });

  const pathNames = getNodeNames(result.path, graph.nodes);

  return {
    algorithm: 'dijkstra',
    algorithmName: "Dijkstra's Algorithm",
    sourceId,
    destId,
    path: result.path,
    pathNames,
    totalDistance: result.totalDistance,
    executionTimeMs,
    nodesExplored: result.nodesExplored,
    exploredOrder: result.exploredOrder,
    timeComplexity: 'O((V + E) log V)',
    spaceComplexity: 'O(V + E)',
    approach: 'Greedy with Min-Priority Queue',
    success: result.totalDistance !== -1,
    error: result.totalDistance === -1 ? 'No route found between source and destination (disconnected).' : undefined,
  };
}
