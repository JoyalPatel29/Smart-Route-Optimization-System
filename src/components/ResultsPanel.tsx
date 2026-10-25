import React from 'react';
import { AlgorithmResult } from '../types/graph';
import { Clock, Route, CheckCircle, AlertTriangle, Cpu, Layers, Milestone } from 'lucide-react';

interface ResultsPanelProps {
  result: AlgorithmResult | null;
  totalVertices: number;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, totalVertices }) => {
  if (!result) {
    return (
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 text-center text-slate-400">
        <Milestone className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60" />
        <p className="text-sm font-medium">No route calculated yet.</p>
        <p className="text-xs text-slate-500 mt-1">
          Select Source and Destination locations above, pick an algorithm, and click "Find Shortest Route".
        </p>
      </div>
    );
  }

  const explorationRatio = totalVertices > 0
    ? Math.round((result.nodesExplored / totalVertices) * 100)
    : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
        <div className="flex items-center gap-2">
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          )}
          <div>
            <h3 className="text-sm font-bold text-slate-100">{result.algorithmName}</h3>
            <p className="text-xs text-slate-400">{result.approach}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono">
            Time: {result.timeComplexity}
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
            Space: {result.spaceComplexity}
          </span>
        </div>
      </div>

      {/* Error state */}
      {!result.success ? (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
          <p className="font-semibold text-rose-200">Execution Notice:</p>
          <p className="mt-1">{result.error || 'Destination could not be reached from source.'}</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Route className="w-3.5 h-3.5 text-sky-400" />
                <span>Total Distance</span>
              </div>
              <div className="text-xl font-bold text-sky-300 font-mono">
                {result.totalDistance}{' '}
                <span className="text-xs font-normal text-slate-400">units</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Execution Time</span>
              </div>
              <div className="text-xl font-bold text-emerald-300 font-mono">
                {result.executionTimeMs < 1
                  ? `${(result.executionTimeMs * 1000).toFixed(1)} µs`
                  : `${result.executionTimeMs.toFixed(3)} ms`}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nodes Explored</span>
              </div>
              <div className="text-xl font-bold text-indigo-300 font-mono">
                {result.nodesExplored}{' '}
                <span className="text-xs font-normal text-slate-400">/ {totalVertices}</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Search Ratio</span>
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono">
                {explorationRatio}%
              </div>
            </div>
          </div>

          {/* Optimal Path Sequence */}
          <div className="bg-slate-900/70 border border-slate-700/60 rounded-lg p-3.5">
            <div className="text-xs font-medium text-slate-300 mb-2 flex items-center justify-between">
              <span>Optimal Route Path ({result.path.length} hops):</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {result.path.join(' ➔ ')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {result.pathNames.map((name, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === result.pathNames.length - 1;

                return (
                  <React.Fragment key={`${result.path[idx]}-${idx}`}>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${
                        isStart
                          ? 'bg-emerald-900/70 text-emerald-200 border-emerald-600'
                          : isEnd
                          ? 'bg-rose-900/70 text-rose-200 border-rose-600'
                          : 'bg-sky-950/70 text-sky-200 border-sky-700'
                      }`}
                    >
                      {isStart && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      {isEnd && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                      {name}
                    </span>
                    {!isEnd && <span className="text-slate-500 font-bold text-xs">➔</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
