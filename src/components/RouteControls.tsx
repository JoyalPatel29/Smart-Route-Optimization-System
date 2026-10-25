import React, { useState } from 'react';
import { AlgorithmType, GraphNode } from '../types/graph';
import { Play, GitCompare, RotateCcw, Shuffle, Sparkles, PlusCircle } from 'lucide-react';

interface RouteControlsProps {
  nodes: GraphNode[];
  sourceId: string;
  destId: string;
  algorithm: AlgorithmType;
  isDirected: boolean;
  onSelectSource: (id: string) => void;
  onSelectDest: (id: string) => void;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  onFindRoute: () => void;
  onCompareAll: () => void;
  onReset: () => void;
  onLoadSampleGraph: () => void;
  onGenerateRandom: (vertexCount: number) => void;
  onAddEdge: (from: string, to: string, weight: number) => void;
  onToggleDirected: () => void;
}

export const RouteControls: React.FC<RouteControlsProps> = ({
  nodes,
  sourceId,
  destId,
  algorithm,
  isDirected,
  onSelectSource,
  onSelectDest,
  onSelectAlgorithm,
  onFindRoute,
  onCompareAll,
  onReset,
  onLoadSampleGraph,
  onGenerateRandom,
  onAddEdge,
  onToggleDirected,
}) => {
  const [showAddEdgeModal, setShowAddEdgeModal] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState('');
  const [edgeTo, setEdgeTo] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('5');
  const [randomSize, setRandomSize] = useState(15);

  const handleCreateEdge = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(edgeWeight);
    if (!edgeFrom || !edgeTo || edgeFrom === edgeTo || isNaN(w) || w <= 0) {
      alert('Please select two distinct nodes and enter a positive weight.');
      return;
    }
    onAddEdge(edgeFrom, edgeTo, w);
    setShowAddEdgeModal(false);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          Route Optimization Controls
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onLoadSampleGraph}
            className="text-xs bg-slate-700/70 hover:bg-slate-600 text-slate-200 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors border border-slate-600"
            title="Reload default 8-location city network"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sample Graph
          </button>
          <button
            onClick={onReset}
            className="text-xs bg-slate-700/70 hover:bg-slate-600 text-slate-300 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors border border-slate-600"
            title="Reset paths and selections"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Selectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source Selector */}
        <div>
          <label className="block text-xs font-medium text-emerald-400 mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Source Location (Start)
          </label>
          <select
            value={sourceId}
            onChange={(e) => onSelectSource(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Choose Source --</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} ({n.id})
              </option>
            ))}
          </select>
        </div>

        {/* Destination Selector */}
        <div>
          <label className="block text-xs font-medium text-rose-400 mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Destination Location (Target)
          </label>
          <select
            value={destId}
            onChange={(e) => onSelectDest(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">-- Choose Destination --</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id} disabled={n.id === sourceId}>
                {n.name} ({n.id})
              </option>
            ))}
          </select>
        </div>

        {/* Algorithm Selector */}
        <div>
          <label className="block text-xs font-medium text-sky-400 mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            Shortest-Path Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => onSelectAlgorithm(e.target.value as AlgorithmType)}
            className="w-full bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
          >
            <option value="dijkstra">1. Dijkstra's Algorithm (Greedy)</option>
            <option value="floyd-warshall">2. Floyd-Warshall (Dynamic Prog)</option>
            <option value="astar">3. A* Algorithm (Euclidean Heuristic)</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          onClick={onFindRoute}
          disabled={!sourceId || !destId}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
        >
          <Play className="w-4 h-4 fill-white" />
          Find Shortest Route ({algorithm === 'dijkstra' ? 'Dijkstra' : algorithm === 'floyd-warshall' ? 'Floyd-Warshall' : 'A*'})
        </button>

        <button
          onClick={onCompareAll}
          disabled={!sourceId || !destId}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2.5 rounded-lg shadow flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-sm"
        >
          <GitCompare className="w-4 h-4" />
          Compare All 3 Algorithms
        </button>

        <button
          onClick={() => setShowAddEdgeModal(true)}
          className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3.5 py-2.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors border border-slate-600"
          title="Add road / edge between two nodes"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          Add Road (Edge)
        </button>
      </div>

      {/* Quick Graph Tools Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-700/60 text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Random Graph:</span>
          <select
            value={randomSize}
            onChange={(e) => setRandomSize(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          >
            <option value={10}>10 Nodes (Small)</option>
            <option value={20}>20 Nodes (Medium)</option>
            <option value={35}>35 Nodes (Dense)</option>
            <option value={50}>50 Nodes (Large)</option>
          </select>
          <button
            onClick={() => onGenerateRandom(randomSize)}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-600"
          >
            <Shuffle className="w-3 h-3 text-cyan-400" />
            Generate
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Graph Mode:</span>
          <button
            onClick={onToggleDirected}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              isDirected
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-700/60 text-slate-300 border-slate-600'
            }`}
          >
            {isDirected ? 'Directed Graph' : 'Undirected Graph (Default)'}
          </button>
        </div>
      </div>

      {/* Add Edge Modal */}
      {showAddEdgeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Add Weighted Connection (Road)
            </h3>
            <form onSubmit={handleCreateEdge} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">From Location:</label>
                <select
                  value={edgeFrom}
                  onChange={(e) => setEdgeFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  required
                >
                  <option value="">-- Choose Source --</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">To Location:</label>
                <select
                  value={edgeTo}
                  onChange={(e) => setEdgeTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  required
                >
                  <option value="">-- Choose Target --</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id} disabled={n.id === edgeFrom}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Weight (Distance/Cost &gt; 0):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddEdgeModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                >
                  Add Edge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
