import { Graph } from '../graph/graphModel';
import { AlgorithmResult } from '../types/graph';
import { getNodeNames, measureExecution, reconstructPath } from '../utils/pathUtils';
import { MinPriorityQueue } from '../utils/priorityQueue';

/**
 * A* (A-Star) Heuristic Search Algorithm
 * Manual Implementation for DAA Academic Demonstration
 *
 * Characteristics:
 * - Strategy: Goal-directed Best-First Search
 * - Evaluation function: f(n) = g(n) + h(n)
 *   - g(n): Actual cost from source to node n
 *   - h(n): Heuristic estimate from n to destination (Euclidean distance)
 * - Data Structure: Binary Min-Heap Priority Queue (ordered by f-score)
 * - Time Complexity: O((V + E) log V) in typical implementations with priority queue;
 *                     performance scales with heuristic quality
 * - Space Complexity: O(V + E)
 */

/**
 * Computes an admissible heuristic scale so h(n) <= actual shortest path cost.
 * By finding the minimum ratio of edge.weight / euclidean_dist(u, v),
 * we guarantee that h(n) never overestimates the real route distance.
 */
function computeAdmissibleScale(graph: Graph): number {
  let minRatio = Infinity;
  for (const edge of graph.getAllEdges()) {
    const u = graph.getNode(edge.from);
    const v = graph.getNode(edge.to);
    if (u && v) {
      const spatialDist = Math.hypot(u.x - v.x, u.y - v.y);
      if (spatialDist > 0) {
        const ratio = edge.weight / spatialDist;
        if (ratio < minRatio) {
          minRatio = ratio;
        }
      }
    }
  }

  // If graph has no geometric edges or all collocated, scale is 0 (falls back to Dijkstra)
  return isFinite(minRatio) && minRatio > 0 ? minRatio : 0;
}

export function runAStar(
  graph: Graph,
  sourceId: string,
  destId: string
): AlgorithmResult {
  const { result, executionTimeMs } = measureExecution(() => {
    // 1. Validation
    const sourceNode = graph.getNode(sourceId);
    const destNode = graph.getNode(destId);

    if (!sourceNode) {
      throw new Error(`Source node '${sourceId}' not found in graph.`);
    }
    if (!destNode) {
      throw new Error(`Destination node '${destId}' not found in graph.`);
    }

    // 2. Admissible Euclidean Heuristic Calculation
    const scale = computeAdmissibleScale(graph);

    const heuristic = (nodeId: string): number => {
      const node = graph.getNode(nodeId);
      if (!node) return 0;
      const rawDistance = Math.hypot(node.x - destNode.x, node.y - destNode.y);
      return rawDistance * scale;
    };

    // 3. Initialize scores & data structures
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const closedSet = new Set<string>();
    const exploredOrder: string[] = [];

    for (const node of graph.getAllNodes()) {
      gScore.set(node.id, Infinity);
      fScore.set(node.id, Infinity);
      previous.set(node.id, null);
    }

    gScore.set(sourceId, 0);
    const initialH = heuristic(sourceId);
    fScore.set(sourceId, initialH);

    // MinPriorityQueue keyed by fScore
    const openSet = new MinPriorityQueue<string>();
    openSet.push(sourceId, initialH);

    // Track best g-score inserted into open set to prune redundant entries
    const inOpenSet = new Map<string, number>();
    inOpenSet.set(sourceId, 0);

    // 4. Main Search Loop
    while (!openSet.isEmpty()) {
      const current = openSet.pop()!;
      const currentId = current.element;

      // If we already closed this node with a better gScore, skip
      if (closedSet.has(currentId)) {
        continue;
      }

      closedSet.add(currentId);
      exploredOrder.push(currentId);

      // Reached destination! Optimal path is guaranteed because h is admissible and consistent.
      if (currentId === destId) {
        break;
      }

      const currentG = gScore.get(currentId) ?? Infinity;
      const neighbors = graph.getNeighbors(currentId);

      for (const neighbor of neighbors) {
        const neighborId = neighbor.nodeId;
        if (closedSet.has(neighborId)) continue;

        const tentativeG = currentG + neighbor.weight;
        const neighborExistingG = gScore.get(neighborId) ?? Infinity;

        if (tentativeG < neighborExistingG) {
          previous.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const f = tentativeG + heuristic(neighborId);
          fScore.set(neighborId, f);

          openSet.push(neighborId, f);
          inOpenSet.set(neighborId, tentativeG);
        }
      }
    }

    const finalDistance = gScore.get(destId) ?? Infinity;
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
    algorithm: 'astar',
    algorithmName: 'A* (A-Star) Algorithm',
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
    approach: 'Goal-Directed Heuristic Search (f = g + h)',
    success: result.totalDistance !== -1,
    error: result.totalDistance === -1 ? 'No route found between source and destination (disconnected).' : undefined,
  };
}
