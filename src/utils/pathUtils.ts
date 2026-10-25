import { GraphNode } from '../types/graph';

/**
 * Reconstructs the path array [sourceId, ..., destId] from a previous-node mapping.
 */
export function reconstructPath(
  previous: Map<string, string | null>,
  sourceId: string,
  destId: string
): string[] {
  if (sourceId === destId) {
    return [sourceId];
  }

  const path: string[] = [];
  let curr: string | null = destId;

  // Track visited to prevent infinite loop in case of cyclic corruption
  const visited = new Set<string>();

  while (curr !== null) {
    if (visited.has(curr)) break;
    visited.add(curr);
    path.push(curr);
    if (curr === sourceId) break;
    curr = previous.get(curr) ?? null;
  }

  if (path[path.length - 1] !== sourceId) {
    // Destination was not reached from source
    return [];
  }

  return path.reverse();
}

/**
 * Converts node IDs to readable node names using the nodes map.
 */
export function getNodeNames(path: string[], nodesMap: Map<string, GraphNode>): string[] {
  return path.map((id) => nodesMap.get(id)?.name || id);
}

/**
 * Accurately measures execution time of a synchronous algorithm callback.
 * Returns { result, executionTimeMs }.
 */
export function measureExecution<T>(fn: () => T): { result: T; executionTimeMs: number } {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const executionTimeMs = Math.max(0.001, Number((end - start).toFixed(4)));
  return { result, executionTimeMs };
}
