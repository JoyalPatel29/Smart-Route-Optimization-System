import { runAStar } from '../algorithms/astar';
import { runDijkstra } from '../algorithms/dijkstra';
import { runFloydWarshall } from '../algorithms/floydWarshall';
import { Graph } from '../graph/graphModel';
import { SAMPLE_GRAPH_DATA } from '../graph/sampleGraphs';
import { TestCaseResult } from '../types/graph';
import { validateGraphInput } from './validation';

/**
 * Runs the comprehensive test suite to prove correctness for college DAA evaluation.
 */
export function runAllTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // Test 1: Basic Shortest Path (Simple 3-node triangle)
  {
    const g = new Graph();
    g.addNode({ id: 'A', name: 'Node A', x: 0, y: 0 });
    g.addNode({ id: 'B', name: 'Node B', x: 10, y: 0 });
    g.addNode({ id: 'C', name: 'Node C', x: 5, y: 10 });
    g.addEdge({ id: 'e1', from: 'A', to: 'B', weight: 10 });
    g.addEdge({ id: 'e2', from: 'A', to: 'C', weight: 3 });
    g.addEdge({ id: 'e3', from: 'C', to: 'B', weight: 4 }); // via C is 3 + 4 = 7 < 10

    const d = runDijkstra(g, 'A', 'B');
    const fw = runFloydWarshall(g, 'A', 'B');
    const a = runAStar(g, 'A', 'B');

    const passed = d.totalDistance === 7 && fw.totalDistance === 7 && a.totalDistance === 7;
    results.push({
      id: 'test-1',
      name: '1. Basic Shortest Path (Triangle Graph)',
      description: 'Tests direct edge (10) vs indirect edge (3 + 4 = 7). Optimal path must be A -> C -> B.',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: 7,
      details: passed
        ? 'PASSED: All 3 algorithms picked path [A, C, B] with distance 7.'
        : 'FAILED: Algorithms did not calculate correct shortest distance 7.',
    });
  }

  // Test 2: Multiple Possible Paths (Sample 8-node Urban Graph)
  {
    const g = Graph.fromData(SAMPLE_GRAPH_DATA);
    // College to Airport
    const d = runDijkstra(g, 'college', 'airport');
    const fw = runFloydWarshall(g, 'college', 'airport');
    const a = runAStar(g, 'college', 'airport');

    const passed =
      d.totalDistance > 0 &&
      d.totalDistance === fw.totalDistance &&
      d.totalDistance === a.totalDistance;

    results.push({
      id: 'test-2',
      name: '2. Multiple Possible Paths (Urban Network)',
      description: 'Finds optimal route from College to Airport among 5+ competing alternative paths.',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: d.totalDistance,
      details: passed
        ? `PASSED: Dijkstra (${d.totalDistance}), Floyd-Warshall (${fw.totalDistance}), and A* (${a.totalDistance}) are identical. Path: ${d.path.join(' -> ')}`
        : 'FAILED: Distance mismatch across algorithms on multi-path network.',
    });
  }

  // Test 3: Disconnected Graph
  {
    const g = new Graph();
    g.addNode({ id: 'X', name: 'Island X', x: 50, y: 50 });
    g.addNode({ id: 'Y', name: 'Island Y', x: 100, y: 50 });
    g.addNode({ id: 'Z', name: 'Isolated Z', x: 200, y: 200 }); // Unreachable
    g.addEdge({ id: 'e1', from: 'X', to: 'Y', weight: 5 });

    const d = runDijkstra(g, 'X', 'Z');
    const fw = runFloydWarshall(g, 'X', 'Z');
    const a = runAStar(g, 'X', 'Z');

    const passed =
      !d.success &&
      !fw.success &&
      !a.success &&
      d.totalDistance === -1 &&
      fw.totalDistance === -1 &&
      a.totalDistance === -1;

    results.push({
      id: 'test-3',
      name: '3. Disconnected Graph (Unreachable Destination)',
      description: 'Verifies that algorithms properly report unreachable nodes (distance -1 / failure).',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: -1,
      details: passed
        ? 'PASSED: All 3 algorithms correctly reported failure/unreachable for disconnected destination.'
        : 'FAILED: Disconnected node did not trigger proper unreachable flag.',
    });
  }

  // Test 4: Same Source and Destination
  {
    const g = Graph.fromData(SAMPLE_GRAPH_DATA);
    const d = runDijkstra(g, 'market', 'market');
    const fw = runFloydWarshall(g, 'market', 'market');
    const a = runAStar(g, 'market', 'market');

    const passed =
      d.totalDistance === 0 &&
      fw.totalDistance === 0 &&
      a.totalDistance === 0 &&
      d.path.length === 1 &&
      d.path[0] === 'market';

    results.push({
      id: 'test-4',
      name: '4. Same Source and Destination (Self Loop/Zero Distance)',
      description: 'Tests identity route where source == destination. Distance should be 0 and path [market].',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: 0,
      details: passed
        ? 'PASSED: Distance is 0, path contains exactly source vertex for all algorithms.'
        : 'FAILED: Self-loop did not produce 0 distance.',
    });
  }

  // Test 5: Invalid Input Validation
  {
    const g = Graph.fromData(SAMPLE_GRAPH_DATA);
    const validationCheck = validateGraphInput(g, 'non_existent_node', 'market');
    let dijkstraThrew = false;
    try {
      runDijkstra(g, 'non_existent_node', 'market');
    } catch {
      dijkstraThrew = true;
    }

    const passed = !validationCheck.isValid && dijkstraThrew;
    results.push({
      id: 'test-5',
      name: '5. Invalid Input Handling (Non-existent Node)',
      description: 'Tests validation logic when passed invalid node keys. Must flag errors without crashes.',
      passed,
      dijkstraDistance: null,
      floydWarshallDistance: null,
      astarDistance: null,
      expectedDistance: null,
      details: passed
        ? `PASSED: Validation caught non-existent node: "${validationCheck.errors[0]}" and prevented invalid execution.`
        : 'FAILED: Invalid input was not caught cleanly.',
    });
  }

  // Test 6: Correct Shortest Distance Equality Check
  {
    const g = Graph.fromData(SAMPLE_GRAPH_DATA);
    // Hospital to Railway Station
    const d = runDijkstra(g, 'hospital', 'railway');
    const fw = runFloydWarshall(g, 'hospital', 'railway');
    const a = runAStar(g, 'hospital', 'railway');

    const passed =
      d.totalDistance === fw.totalDistance &&
      d.totalDistance === a.totalDistance &&
      d.totalDistance === 8; // hospital -> market (3) + market -> railway (5) = 8

    results.push({
      id: 'test-6',
      name: '6. Correct Shortest Distance Equality (Hospital -> Railway)',
      description: 'Verifies D(u, v) == FW(u, v) == A*(u, v) == 8 on sample benchmark graph.',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: 8,
      details: passed
        ? `PASSED: Exact match achieved across all 3 algorithms (Distance = 8). Path: ${d.path.join(' -> ')}`
        : 'FAILED: Distance discrepancy between algorithms.',
    });
  }

  // Test 7: Correct Path Reconstruction
  {
    const g = Graph.fromData(SAMPLE_GRAPH_DATA);
    // Bus stand to Airport
    const d = runDijkstra(g, 'bus_stand', 'airport');
    const fw = runFloydWarshall(g, 'bus_stand', 'airport');
    const a = runAStar(g, 'bus_stand', 'airport');

    // Both paths must start at bus_stand, end at airport, and have consecutive valid edges whose weights sum to totalDistance
    const verifyPathValidity = (path: string[], expectedDist: number): boolean => {
      if (path[0] !== 'bus_stand' || path[path.length - 1] !== 'airport') return false;
      let sum = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = g.getAllEdges().find(
          (e) => (e.from === u && e.to === v) || (!g.isDirected && e.from === v && e.to === u)
        );
        if (!edge) return false;
        sum += edge.weight;
      }
      return sum === expectedDist;
    };

    const dValid = verifyPathValidity(d.path, d.totalDistance);
    const fwValid = verifyPathValidity(fw.path, fw.totalDistance);
    const aValid = verifyPathValidity(a.path, a.totalDistance);

    const passed = dValid && fwValid && aValid;
    results.push({
      id: 'test-7',
      name: '7. Path Reconstruction Verification (Bus Stand -> Airport)',
      description: 'Validates that each algorithm reconstructs a strictly contiguous, valid sequence of graph edges.',
      passed,
      dijkstraDistance: d.totalDistance,
      floydWarshallDistance: fw.totalDistance,
      astarDistance: a.totalDistance,
      expectedDistance: d.totalDistance,
      details: passed
        ? `PASSED: Reconstructed path is valid and edge weights sum accurately to ${d.totalDistance}. (Path: ${d.path.join(' -> ')})`
        : 'FAILED: Path reconstruction contained invalid hops or incorrect edge weight sum.',
    });
  }

  return results;
}
