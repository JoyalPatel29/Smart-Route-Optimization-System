import { runAStar } from '../algorithms/astar';
import { runDijkstra } from '../algorithms/dijkstra';
import { runFloydWarshall } from '../algorithms/floydWarshall';
import { Graph } from '../graph/graphModel';
import { AlgorithmComparison, AlgorithmResult } from '../types/graph';

/**
 * Validates a graph before algorithm execution.
 * Checks for empty graphs, non-positive edge weights, and node existence.
 */
export function validateGraphInput(
  graph: Graph,
  sourceId?: string,
  destId?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (graph.getVertexCount() === 0) {
    errors.push('Graph has no vertices (empty graph).');
  }

  for (const edge of graph.getAllEdges()) {
    if (edge.weight <= 0) {
      errors.push(`Edge from ${edge.from} to ${edge.to} has non-positive weight (${edge.weight}). Weights must be > 0.`);
    }
  }

  if (sourceId !== undefined && !graph.getNode(sourceId)) {
    errors.push(`Source vertex '${sourceId}' does not exist in the graph.`);
  }

  if (destId !== undefined && !graph.getNode(destId)) {
    errors.push(`Destination vertex '${destId}' does not exist in the graph.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Runs all three algorithms on the same graph, source, and destination,
 * compares the calculated shortest distances, and checks for exact consistency.
 */
export function compareAllAlgorithms(
  graph: Graph,
  sourceId: string,
  destId: string
): AlgorithmComparison {
  const sourceNode = graph.getNode(sourceId);
  const destNode = graph.getNode(destId);
  const sourceName = sourceNode?.name || sourceId;
  const destName = destNode?.name || destId;

  // Run Dijkstra
  let dijkstraRes: AlgorithmResult;
  try {
    dijkstraRes = runDijkstra(graph, sourceId, destId);
  } catch (err: unknown) {
    dijkstraRes = createErrorResult('dijkstra', "Dijkstra's Algorithm", sourceId, destId, err);
  }

  // Run Floyd-Warshall
  let fwRes: AlgorithmResult;
  try {
    fwRes = runFloydWarshall(graph, sourceId, destId);
  } catch (err: unknown) {
    fwRes = createErrorResult('floyd-warshall', 'Floyd-Warshall Algorithm', sourceId, destId, err);
  }

  // Run A*
  let astarRes: AlgorithmResult;
  try {
    astarRes = runAStar(graph, sourceId, destId);
  } catch (err: unknown) {
    astarRes = createErrorResult('astar', 'A* Algorithm', sourceId, destId, err);
  }

  const dDist = dijkstraRes.totalDistance;
  const fwDist = fwRes.totalDistance;
  const aDist = astarRes.totalDistance;

  // Check equality of distances
  const isConsistent =
    dijkstraRes.success &&
    fwRes.success &&
    astarRes.success &&
    dDist === fwDist &&
    dDist === aDist;

  let message = '';
  if (isConsistent) {
    message = 'All algorithms produced the same shortest distance.';
  } else if (!dijkstraRes.success || !fwRes.success || !astarRes.success) {
    message = 'Route discovery status differs or a graph disconnected / error state occurred.';
  } else {
    message = `MISMATCH DETECTED: Dijkstra: ${dDist}, Floyd-Warshall: ${fwDist}, A*: ${aDist}`;
  }

  return {
    sourceId,
    destId,
    sourceName,
    destName,
    results: {
      dijkstra: dijkstraRes,
      floydWarshall: fwRes,
      astar: astarRes,
    },
    isConsistent,
    verifiedDistance: isConsistent ? dDist : null,
    message,
  };
}

function createErrorResult(
  algorithm: 'dijkstra' | 'floyd-warshall' | 'astar',
  algorithmName: string,
  sourceId: string,
  destId: string,
  err: unknown
): AlgorithmResult {
  const errMsg = err instanceof Error ? err.message : String(err);
  return {
    algorithm,
    algorithmName,
    sourceId,
    destId,
    path: [],
    pathNames: [],
    totalDistance: -1,
    executionTimeMs: 0,
    nodesExplored: 0,
    exploredOrder: [],
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    approach: 'Error',
    success: false,
    error: errMsg,
  };
}
