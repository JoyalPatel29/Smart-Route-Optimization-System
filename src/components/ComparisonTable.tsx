import React from 'react';
import { AlgorithmComparison } from '../types/graph';
import { CheckCircle2, AlertTriangle, ShieldCheck, Zap, Info } from 'lucide-react';

interface ComparisonTableProps {
  comparison: AlgorithmComparison | null;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ comparison }) => {
  if (!comparison) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
        <Zap className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" />
        <p className="text-sm font-medium">No comparison run yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Select source and destination, then click "Compare All 3 Algorithms" to evaluate Dijkstra, Floyd-Warshall, and A* side-by-side.
        </p>
      </div>
    );
  }

  const { results, isConsistent, message, sourceName, destName } = comparison;
  const rows = [results.dijkstra, results.floydWarshall, results.astar];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
      {/* Title & Endpoints */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Empirical Algorithm Comparison
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluated on identical graph topology: <span className="text-emerald-300 font-medium">{sourceName}</span> ➔ <span className="text-rose-300 font-medium">{destName}</span>
          </p>
        </div>
      </div>

      {/* Correctness Validation Banner */}
      <div
        className={`p-3.5 rounded-lg border flex items-start gap-3 text-xs ${
          isConsistent
            ? 'bg-emerald-950/40 border-emerald-700/70 text-emerald-200'
            : 'bg-amber-950/40 border-amber-700/70 text-amber-200'
        }`}
      >
        {isConsistent ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        )}
        <div>
          <div className="font-semibold text-sm">
            {isConsistent ? 'Mathematical Correctness Verified' : 'Algorithm Validation Alert'}
          </div>
          <p className="mt-0.5">{message}</p>
          {isConsistent && (
            <p className="text-[11px] text-emerald-300/80 mt-1">
              Verified shortest path distance: <span className="font-mono font-bold">{comparison.verifiedDistance} units</span>. All three algorithms achieved mathematical optimality.
            </p>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
            <tr>
              <th className="px-4 py-3">Algorithm</th>
              <th className="px-4 py-3">Shortest Path</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Measured Time</th>
              <th className="px-4 py-3">Nodes Explored</th>
              <th className="px-4 py-3">Time Complexity</th>
              <th className="px-4 py-3">Space Complexity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
            {rows.map((row) => (
              <tr key={row.algorithm} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3.5 font-semibold text-slate-100 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        row.algorithm === 'dijkstra'
                          ? 'bg-blue-400'
                          : row.algorithm === 'floyd-warshall'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {row.algorithmName}
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block pl-3.5">
                    {row.approach}
                  </span>
                </td>

                <td className="px-4 py-3.5 font-mono text-[11px]">
                  {row.success ? (
                    <span className="text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
                      {row.path.join(' ➔ ')}
                    </span>
                  ) : (
                    <span className="text-rose-400">Unreachable</span>
                  )}
                </td>

                <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                  {row.totalDistance !== -1 ? `${row.totalDistance}` : '∞'}
                </td>

                <td className="px-4 py-3.5 font-mono text-emerald-300 font-semibold whitespace-nowrap">
                  {row.executionTimeMs < 1
                    ? `${(row.executionTimeMs * 1000).toFixed(1)} µs`
                    : `${row.executionTimeMs.toFixed(3)} ms`}
                </td>

                <td className="px-4 py-3.5 font-mono text-indigo-300">
                  {row.nodesExplored}
                </td>

                <td className="px-4 py-3.5 font-mono text-slate-300">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {row.timeComplexity}
                  </span>
                </td>

                <td className="px-4 py-3.5 font-mono text-slate-300">
                  <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {row.spaceComplexity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Viva / Empirical Note */}
      <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700/60">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-300">DAA Experimental Note:</span> Timings reflect live, actual wall-clock execution via <code className="text-sky-300">performance.now()</code>. In small graphs, execution times are sub-millisecond (measured in microseconds). Notice how A* explores fewer nodes than Dijkstra on spatial graphs due to its goal-directed Euclidean heuristic <code className="text-sky-300">f(n) = g(n) + h(n)</code>.
        </p>
      </div>
    </div>
  );
};
