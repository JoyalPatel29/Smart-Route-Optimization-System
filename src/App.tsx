import React, { useState, useMemo } from 'react';
import { runAStar } from './algorithms/astar';
import { runDijkstra } from './algorithms/dijkstra';
import { runFloydWarshall } from './algorithms/floydWarshall';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { ComparisonTable } from './components/ComparisonTable';
import { GraphVisualization } from './components/GraphVisualization';
import { ResultsPanel } from './components/ResultsPanel';
import { RouteControls } from './components/RouteControls';
import { TestRunnerModal } from './components/TestRunnerModal';
import { Graph } from './graph/graphModel';
import { generateRandomGraph, SAMPLE_GRAPH_DATA } from './graph/sampleGraphs';
import { AlgorithmComparison, AlgorithmResult, AlgorithmType, GraphData } from './types/graph';
import { compareAllAlgorithms, validateGraphInput } from './utils/validation';
import {
  Network,
  Compass,
  BarChart3,
  ShieldCheck,
  MapPin,
  Route,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Graph state initialized with the sample 8-location urban network
  const [graphData, setGraphData] = useState<GraphData>(SAMPLE_GRAPH_DATA);
  const [graph, setGraph] = useState<Graph>(() => Graph.fromData(SAMPLE_GRAPH_DATA));

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'visualizer' | 'comparison' | 'benchmark'>('visualizer');

  // Route calculation selections
  const [sourceId, setSourceId] = useState<string>('college');
  const [destId, setDestId] = useState<string>('airport');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('dijkstra');

  // Results state
  const [singleResult, setSingleResult] = useState<AlgorithmResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<AlgorithmComparison | null>(null);

  // Test Runner modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Synchronize graph instance whenever graphData changes
  const updateGraphData = (newData: GraphData) => {
    setGraphData(newData);
    setGraph(Graph.fromData(newData));
    setSingleResult(null);
    setComparisonResult(null);
  };

  // Re-center / Load default sample graph
  const handleLoadSampleGraph = () => {
    updateGraphData(SAMPLE_GRAPH_DATA);
    setSourceId('college');
    setDestId('airport');
    setSingleResult(null);
    setComparisonResult(null);
  };

  // Generate random connected graph
  const handleGenerateRandom = (vertexCount: number) => {
    const randomGraph = generateRandomGraph(vertexCount, 1.8);
    updateGraphData(randomGraph);
    if (randomGraph.nodes.length >= 2) {
      setSourceId(randomGraph.nodes[0].id);
      setDestId(randomGraph.nodes[randomGraph.nodes.length - 1].id);
    }
  };

  // Toggle directed / undirected graph
  const handleToggleDirected = () => {
    const toggled = !graphData.isDirected;
    const newData: GraphData = {
      ...graphData,
      isDirected: toggled,
    };
    updateGraphData(newData);
  };

  // Reposition node on canvas drag
  const handleUpdateNodePosition = (nodeId: string, x: number, y: number) => {
    setGraphData((prev) => {
      const updatedNodes = prev.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node
      );
      const updatedData: GraphData = { ...prev, nodes: updatedNodes };
      setGraph(Graph.fromData(updatedData));
      return updatedData;
    });
  };

  // Add new node to canvas
  const handleAddNode = (name: string, x: number, y: number) => {
    const newId = `node_${Date.now().toString(36)}`;
    const newNode = { id: newId, name, x, y };
    const updatedData: GraphData = {
      ...graphData,
      nodes: [...graphData.nodes, newNode],
    };
    updateGraphData(updatedData);
  };

  // Add new road/edge
  const handleAddEdge = (from: string, to: string, weight: number) => {
    const newEdgeId = `edge_${Date.now().toString(36)}`;
    const newEdge = { id: newEdgeId, from, to, weight };
    const updatedData: GraphData = {
      ...graphData,
      edges: [...graphData.edges, newEdge],
    };
    updateGraphData(updatedData);
  };

  // Calculate shortest path for selected algorithm
  const handleFindRoute = () => {
    if (!sourceId || !destId) return;

    const validation = validateGraphInput(graph, sourceId, destId);
    if (!validation.isValid) {
      alert(`Cannot calculate route:\n${validation.errors.join('\n')}`);
      return;
    }

    try {
      let res: AlgorithmResult;
      if (selectedAlgorithm === 'dijkstra') {
        res = runDijkstra(graph, sourceId, destId);
      } else if (selectedAlgorithm === 'floyd-warshall') {
        res = runFloydWarshall(graph, sourceId, destId);
      } else {
        res = runAStar(graph, sourceId, destId);
      }
      setSingleResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Calculation error: ${msg}`);
    }
  };

  // Compare all 3 algorithms
  const handleCompareAll = () => {
    if (!sourceId || !destId) return;
    const cmp = compareAllAlgorithms(graph, sourceId, destId);
    setComparisonResult(cmp);
    // Also display the selected algorithm in singleResult
    if (selectedAlgorithm === 'dijkstra') {
      setSingleResult(cmp.results.dijkstra);
    } else if (selectedAlgorithm === 'floyd-warshall') {
      setSingleResult(cmp.results.floydWarshall);
    } else {
      setSingleResult(cmp.results.astar);
    }
  };

  // Reset route state
  const handleReset = () => {
    setSingleResult(null);
    setComparisonResult(null);
  };

  // Highlighted path & explored nodes for graph visualization
  const highlightedPath = singleResult?.success ? singleResult.path : [];
  const exploredNodes = singleResult ? singleResult.exploredOrder : [];

  const sourceNode = useMemo(() => graph.getNode(sourceId), [graph, sourceId]);
  const destNode = useMemo(() => graph.getNode(destId), [graph, destId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Academic Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg border border-blue-400/30">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Smart Route Optimization System
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  DAA Project
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manual implementation of Dijkstra, Floyd-Warshall & A* Shortest-Path Algorithms
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Network className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  <strong className="text-slate-200">{graph.getVertexCount()}</strong> Vertices •{' '}
                  <strong className="text-slate-200">{graph.getEdgeCount()}</strong> Edges
                </span>
              </div>
              {sourceNode && destNode && (
                <div className="flex items-center gap-1 text-slate-400 font-medium">
                  <span className="text-emerald-400 font-semibold">{sourceNode.name}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-rose-400 font-semibold">{destNode.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsTestModalOpen(true)}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Run 7-case correctness suite"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Correctness Tests</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 border-t border-slate-800/80 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visualizer'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            Route Optimizer & Visualizer
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Route className="w-4 h-4" />
            Algorithm Comparison
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Benchmark & Performance Charts
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: Route Optimizer & Visualizer */}
        {activeTab === 'visualizer' && (
          <div className="space-y-6">
            {/* Graph Visualizer Canvas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-semibold text-slate-300">
                  Interactive Graph Network ({graph.getVertexCount()} Locations, {graph.getEdgeCount()} Roads)
                </span>
                <span>Coordinates utilized for A* Euclidean distance heuristic</span>
              </div>
              <GraphVisualization
                nodes={graphData.nodes}
                edges={graphData.edges}
                isDirected={graphData.isDirected ?? false}
                sourceId={sourceId}
                destId={destId}
                highlightedPath={highlightedPath}
                exploredNodes={exploredNodes}
                onSelectSource={setSourceId}
                onSelectDest={setDestId}
                onUpdateNodePosition={handleUpdateNodePosition}
                onAddNode={handleAddNode}
              />
            </div>

            {/* Controls & Single Result in Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <RouteControls
                  nodes={graphData.nodes}
                  sourceId={sourceId}
                  destId={destId}
                  algorithm={selectedAlgorithm}
                  isDirected={graphData.isDirected ?? false}
                  onSelectSource={setSourceId}
                  onSelectDest={setDestId}
                  onSelectAlgorithm={setSelectedAlgorithm}
                  onFindRoute={handleFindRoute}
                  onCompareAll={handleCompareAll}
                  onReset={handleReset}
                  onLoadSampleGraph={handleLoadSampleGraph}
                  onGenerateRandom={handleGenerateRandom}
                  onAddEdge={handleAddEdge}
                  onToggleDirected={handleToggleDirected}
                />
              </div>

              <div className="lg:col-span-5">
                <ResultsPanel
                  result={singleResult}
                  totalVertices={graph.getVertexCount()}
                />
              </div>
            </div>

            {/* Comparison Table below if compared */}
            {comparisonResult && (
              <div className="pt-2">
                <ComparisonTable comparison={comparisonResult} />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Dedicated Algorithm Comparison */}
        {activeTab === 'comparison' && (
          <div className="space-y-6">
            <RouteControls
              nodes={graphData.nodes}
              sourceId={sourceId}
              destId={destId}
              algorithm={selectedAlgorithm}
              isDirected={graphData.isDirected ?? false}
              onSelectSource={setSourceId}
              onSelectDest={setDestId}
              onSelectAlgorithm={setSelectedAlgorithm}
              onFindRoute={handleFindRoute}
              onCompareAll={handleCompareAll}
              onReset={handleReset}
              onLoadSampleGraph={handleLoadSampleGraph}
              onGenerateRandom={handleGenerateRandom}
              onAddEdge={handleAddEdge}
              onToggleDirected={handleToggleDirected}
            />

            <ComparisonTable comparison={comparisonResult} />
          </div>
        )}

        {/* TAB 3: Benchmark Suite & Performance Charts */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <BenchmarkPanel />
          </div>
        )}
      </main>

      {/* Automated Correctness Test Runner Modal */}
      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Smart Route Optimization System • College Design and Analysis of Algorithms (DAA) Course Project
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Dijkstra O((V+E)logV)</span>
            <span>•</span>
            <span>Floyd-Warshall O(V³)</span>
            <span>•</span>
            <span>A* Euclidean Heuristic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
