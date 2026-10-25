import { runAStar } from '../algorithms/astar';
import { runDijkstra } from '../algorithms/dijkstra';
import { runFloydWarshall } from '../algorithms/floydWarshall';
import { Graph } from '../graph/graphModel';
import { generateRandomGraph } from '../graph/sampleGraphs';
import { BenchmarkDataPoint } from '../types/graph';

export interface BenchmarkProgressCallback {
  (currentStep: number, totalSteps: number, currentVertexCount: number, currentStatus: string): void;
}

/**
 * Runs benchmarks across required graph sizes: 10, 25, 50, 100, 250, and 500 vertices.
 * Evaluates Dijkstra, A*, and Floyd-Warshall using actual browser performance timing API.
 */
export async function runBenchmarkSuite(
  vertexSizes: number[] = [10, 25, 50, 100, 250, 500],
  onProgress?: BenchmarkProgressCallback
): Promise<BenchmarkDataPoint[]> {
  const results: BenchmarkDataPoint[] = [];
  const total = vertexSizes.length;

  for (let i = 0; i < total; i++) {
    const V = vertexSizes[i];

    // 1. Generate valid connected weighted graph
    onProgress?.(i + 1, total, V, `Generating connected weighted graph (${V} vertices)...`);
    await new Promise((resolve) => setTimeout(resolve, 25));

    const graphData = generateRandomGraph(V, 1.8);
    const graph = Graph.fromData(graphData);
    const nodes = graph.getAllNodes();

    // 2. Select valid source and destination
    const sourceId = nodes[0].id;
    const destId = nodes[nodes.length - 1].id;

    // Determine iteration count based on size for timing stability
    // Smaller graphs run repeated iterations to combat timer jitter
    const iterations = V <= 25 ? 8 : V <= 50 ? 4 : V <= 100 ? 2 : 1;

    // 3. Run Dijkstra
    onProgress?.(i + 1, total, V, `Running Dijkstra's algorithm (${iterations} iteration${iterations > 1 ? 's' : ''})...`);
    await new Promise((resolve) => setTimeout(resolve, 20));

    let dijkstraTotalMs = 0;
    let dijkstraExploredSum = 0;
    let lastDijkstraDist = -1;

    for (let it = 0; it < iterations; it++) {
      const d = runDijkstra(graph, sourceId, destId);
      dijkstraTotalMs += d.executionTimeMs;
      dijkstraExploredSum += d.nodesExplored;
      lastDijkstraDist = d.totalDistance;
    }

    const dijkstraAvgMs = Number((dijkstraTotalMs / iterations).toFixed(4));
    const dijkstraExploredAvg = Math.round(dijkstraExploredSum / iterations);

    // 4. Run A*
    onProgress?.(i + 1, total, V, `Running A* algorithm with Euclidean heuristic...`);
    await new Promise((resolve) => setTimeout(resolve, 20));

    let astarTotalMs = 0;
    let astarExploredSum = 0;
    let lastAstarDist = -1;

    for (let it = 0; it < iterations; it++) {
      const a = runAStar(graph, sourceId, destId);
      astarTotalMs += a.executionTimeMs;
      astarExploredSum += a.nodesExplored;
      lastAstarDist = a.totalDistance;
    }

    const astarAvgMs = Number((astarTotalMs / iterations).toFixed(4));
    const astarExploredAvg = Math.round(astarExploredSum / iterations);

    // 5. Run Floyd-Warshall
    onProgress?.(i + 1, total, V, `Running Floyd-Warshall All-Pairs DP (O(V³))...`);
    await new Promise((resolve) => setTimeout(resolve, 25));

    const fwIterations = V <= 25 ? 4 : 1;
    let fwTotalMs = 0;
    let lastFwDist = -1;

    for (let it = 0; it < fwIterations; it++) {
      const fw = runFloydWarshall(graph, sourceId, destId);
      fwTotalMs += fw.executionTimeMs;
      lastFwDist = fw.totalDistance;
    }

    const floydWarshallAvgMs = Number((fwTotalMs / fwIterations).toFixed(4));

    // 8. Verify shortest distance consistency between all three algorithms
    const verifiedConsistent =
      lastDijkstraDist !== -1 &&
      lastDijkstraDist === lastAstarDist &&
      lastDijkstraDist === lastFwDist;

    // 7. Record result
    results.push({
      vertexCount: V,
      edgeCount: graph.getEdgeCount(),
      iterations,
      dijkstraAvgMs,
      floydWarshallAvgMs,
      astarAvgMs,
      dijkstraExploredAvg,
      astarExploredAvg,
      verifiedConsistent,
    });
  }

  return results;
}
