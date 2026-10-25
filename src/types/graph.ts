export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  color?: string;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
  directed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isDirected?: boolean;
}

export type AlgorithmType = 'dijkstra' | 'floyd-warshall' | 'astar';

export interface AlgorithmResult {
  algorithm: AlgorithmType;
  algorithmName: string;
  sourceId: string;
  destId: string;
  path: string[]; // sequence of node IDs
  pathNames: string[]; // sequence of node names
  totalDistance: number;
  executionTimeMs: number; // Measured in ms (floating-point precision)
  nodesExplored: number;
  exploredOrder: string[]; // sequence of visited nodes during execution
  timeComplexity: string;
  spaceComplexity: string;
  approach: string;
  success: boolean;
  error?: string;
}

export interface AlgorithmComparison {
  sourceId: string;
  destId: string;
  sourceName: string;
  destName: string;
  results: {
    dijkstra: AlgorithmResult;
    floydWarshall: AlgorithmResult;
    astar: AlgorithmResult;
  };
  isConsistent: boolean;
  verifiedDistance: number | null;
  message: string;
}

export interface BenchmarkDataPoint {
  vertexCount: number;
  edgeCount: number;
  iterations: number;
  dijkstraAvgMs: number;
  floydWarshallAvgMs: number | null; // null if V > threshold to prevent browser freeze
  astarAvgMs: number;
  dijkstraExploredAvg: number;
  astarExploredAvg: number;
  verifiedConsistent: boolean;
}

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  dijkstraDistance: number | null;
  floydWarshallDistance: number | null;
  astarDistance: number | null;
  expectedDistance: number | null;
  details: string;
}
