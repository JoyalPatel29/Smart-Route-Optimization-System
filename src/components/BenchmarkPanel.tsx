import React, { useState } from 'react';
import { runBenchmarkSuite } from '../benchmark/benchmarkRunner';
import { BenchmarkDataPoint } from '../types/graph';
import { Play, Download, BarChart2, TrendingUp, AlertCircle, RefreshCw, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export const BenchmarkPanel: React.FC = () => {
  const [dataPoints, setDataPoints] = useState<BenchmarkDataPoint[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{
    step: number;
    total: number;
    currentV: number;
    status: string;
  } | null>(null);

  const [selectedSizeForBar, setSelectedSizeForBar] = useState<number>(50);
  const [yScaleMode, setYScaleMode] = useState<'linear' | 'log'>('linear');

  // Required benchmark sizes strictly: 10, 25, 50, 100, 250, 500
  const requiredSizes = [10, 25, 50, 100, 250, 500];
  const [selectedSizes, setSelectedSizes] = useState<number[]>(requiredSizes);

  const handleToggleSize = (size: number) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(selectedSizes.filter((s) => s !== size));
      }
    } else {
      setSelectedSizes([...selectedSizes, size].sort((a, b) => a - b));
    }
  };

  const handleSelectAllSizes = () => {
    setSelectedSizes([...requiredSizes]);
  };

  const startBenchmark = async () => {
    setIsRunning(true);
    setProgress({
      step: 0,
      total: selectedSizes.length,
      currentV: selectedSizes[0],
      status: 'Initializing benchmark suite...',
    });

    try {
      const results = await runBenchmarkSuite(
        selectedSizes,
        (step, total, currentV, status) => {
          setProgress({ step, total, currentV, status });
        }
      );
      setDataPoints(results);
      if (results.length > 0) {
        setSelectedSizeForBar(results[Math.min(2, results.length - 1)].vertexCount);
      }
    } catch (err) {
      console.error('Benchmark error:', err);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const exportCSV = () => {
    if (dataPoints.length === 0) return;
    const headers = [
      'Vertices',
      'Edges',
      'Iterations',
      'Dijkstra_Avg_ms',
      'FloydWarshall_Avg_ms',
      'AStar_Avg_ms',
      'Dijkstra_Explored',
      'AStar_Explored',
      'Distances_Match',
    ];
    const rows = dataPoints.map((dp) => [
      dp.vertexCount,
      dp.edgeCount,
      dp.iterations,
      dp.dijkstraAvgMs,
      dp.floydWarshallAvgMs !== null ? dp.floydWarshallAvgMs : 'N/A',
      dp.astarAvgMs,
      dp.dijkstraExploredAvg,
      dp.astarExploredAvg,
      dp.verifiedConsistent ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `daa_benchmark_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Chart Dimensions
  const chartWidth = 650;
  const chartHeight = 280;
  const padding = { top: 25, right: 30, bottom: 40, left: 65 };

  // Calculate scales for Line Chart
  const maxV = dataPoints.length > 0 ? Math.max(...dataPoints.map((d) => d.vertexCount)) : 500;
  const allTimes = dataPoints.flatMap((d) => [
    d.dijkstraAvgMs,
    d.astarAvgMs,
    d.floydWarshallAvgMs ?? 0,
  ]);
  const maxTime = Math.max(0.1, ...allTimes);

  const getX = (v: number) => {
    const minV = dataPoints.length > 0 ? dataPoints[0].vertexCount : 10;
    const ratio = (v - minV) / (maxV - minV || 1);
    return padding.left + ratio * (chartWidth - padding.left - padding.right);
  };

  const getY = (timeMs: number) => {
    const boundedTime = Math.max(0.0001, timeMs);
    let ratio: number;
    if (yScaleMode === 'log') {
      const minLog = Math.log10(0.001);
      const maxLog = Math.log10(Math.max(1, maxTime));
      const curLog = Math.log10(boundedTime);
      ratio = (curLog - minLog) / (maxLog - minLog || 1);
    } else {
      ratio = boundedTime / maxTime;
    }
    ratio = Math.max(0, Math.min(1, ratio));
    return chartHeight - padding.bottom - ratio * (chartHeight - padding.top - padding.bottom);
  };

  // Selected bar point
  const selectedBarPoint =
    dataPoints.find((d) => d.vertexCount === selectedSizeForBar) || dataPoints[0];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Empirical Benchmark & Performance Charts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates Dijkstra, A*, and Floyd-Warshall across 10, 25, 50, 100, 250, and 500 vertices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dataPoints.length > 0 && (
            <button
              onClick={exportCSV}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-600 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Export CSV
            </button>
          )}

          <button
            onClick={startBenchmark}
            disabled={isRunning}
            className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Running Benchmark...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                Run Benchmark Suite
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mandatory Environment Notice */}
      <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs text-blue-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-100">Timing Methodology & Transparency:</span>{' '}
          Execution times are measured on the current machine and depend on hardware, browser performance, and graph input.
          No hard-coded, simulated, estimated, or fabricated times are used.
        </div>
      </div>

      {/* Floyd-Warshall O(V^3) Complexity Warning Banner */}
      <div className="p-3.5 bg-amber-950/40 border border-amber-700/70 rounded-lg text-xs text-amber-200 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-amber-100">
            Complexity Warning: Floyd-Warshall O(V³) Asymptotics
          </div>
          <p className="mt-0.5 text-amber-200/90 leading-relaxed">
            Floyd-Warshall computes all-pairs shortest paths through triply nested loops (Θ(V³)). While Dijkstra and A* execute in O((V + E) log V), Floyd-Warshall performs 15.6 million operations for V = 250 and 125 million operations for V = 500. Larger graph sizes will take noticeably longer to complete.
          </p>
        </div>
      </div>

      {/* Controls: Required Graph Sizes (10, 25, 50, 100, 250, 500) */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-200">Required Benchmark Sizes:</span>
            <div className="inline-flex flex-wrap gap-1.5">
              {requiredSizes.map((size) => {
                const isChecked = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isRunning}
                    onClick={() => handleToggleSize(size)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                      isChecked
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/60'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    V = {size}
                  </button>
                );
              })}
            </div>
            {selectedSizes.length < requiredSizes.length && (
              <button
                type="button"
                onClick={handleSelectAllSizes}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline ml-2"
              >
                Select All
              </button>
            )}
          </div>

          <div className="text-slate-400 text-[11px]">
            {selectedSizes.length} of {requiredSizes.length} sizes selected
          </div>
        </div>

        {/* Live Progress Bar */}
        {isRunning && progress && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {progress.status}
              </span>
              <span className="font-mono text-indigo-300">
                Step {progress.step} / {progress.total} (V = {progress.currentV})
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.step / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Charts & Visualizations */}
      {dataPoints.length > 0 ? (
        <div className="space-y-6">
          {/* Chart 1: Line Chart (Execution Time vs Vertices) */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                  Execution Time vs. Number of Vertices
                </h3>
                <p className="text-[11px] text-slate-400">
                  Real measured execution times: Dijkstra and A* O((V+E) log V) vs. Floyd-Warshall O(V³).
                </p>
              </div>

              {/* Scale toggle & Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Dijkstra
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" /> A*
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Floyd-Warshall
                  </span>
                </div>

                <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-[11px]">
                  <button
                    onClick={() => setYScaleMode('linear')}
                    className={`px-2 py-0.5 rounded ${
                      yScaleMode === 'linear'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Linear Scale
                  </button>
                  <button
                    onClick={() => setYScaleMode('log')}
                    className={`px-2 py-0.5 rounded ${
                      yScaleMode === 'log'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Logarithmic Scale
                  </button>
                </div>
              </div>
            </div>

            {/* SVG Line Graph */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto min-w-[550px] font-sans"
              >
                {/* Grid Lines */}
                <line
                  x1={padding.left}
                  y1={chartHeight - padding.bottom}
                  x2={chartWidth - padding.right}
                  y2={chartHeight - padding.bottom}
                  stroke="#475569"
                  strokeWidth="1"
                />
                <line
                  x1={padding.left}
                  y1={padding.top}
                  x2={padding.left}
                  y2={chartHeight - padding.bottom}
                  stroke="#475569"
                  strokeWidth="1"
                />

                {/* Y Axis Labels */}
                {yScaleMode === 'linear' ? (
                  <>
                    <text x={padding.left - 8} y={chartHeight - padding.bottom} fill="#94a3b8" fontSize="10" textAnchor="end">
                      0 ms
                    </text>
                    <text x={padding.left - 8} y={getY(maxTime / 2)} fill="#94a3b8" fontSize="10" textAnchor="end">
                      {(maxTime / 2).toFixed(1)} ms
                    </text>
                    <text x={padding.left - 8} y={getY(maxTime) + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                      {maxTime.toFixed(1)} ms
                    </text>
                  </>
                ) : (
                  <>
                    <text x={padding.left - 8} y={getY(0.001)} fill="#94a3b8" fontSize="10" textAnchor="end">
                      0.001 ms
                    </text>
                    <text x={padding.left - 8} y={getY(0.1)} fill="#94a3b8" fontSize="10" textAnchor="end">
                      0.1 ms
                    </text>
                    <text x={padding.left - 8} y={getY(10)} fill="#94a3b8" fontSize="10" textAnchor="end">
                      10 ms
                    </text>
                    <text x={padding.left - 8} y={getY(Math.max(10, maxTime))} fill="#94a3b8" fontSize="10" textAnchor="end">
                      {Math.max(10, maxTime).toFixed(0)} ms
                    </text>
                  </>
                )}

                {/* X Axis Labels */}
                {dataPoints.map((d) => (
                  <g key={`x-lbl-${d.vertexCount}`}>
                    <line
                      x1={getX(d.vertexCount)}
                      y1={chartHeight - padding.bottom}
                      x2={getX(d.vertexCount)}
                      y2={chartHeight - padding.bottom + 5}
                      stroke="#64748b"
                    />
                    <text
                      x={getX(d.vertexCount)}
                      y={chartHeight - padding.bottom + 18}
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {d.vertexCount}
                    </text>
                  </g>
                ))}

                {/* Axis Titles */}
                <text
                  x={chartWidth / 2}
                  y={chartHeight - 6}
                  fill="#cbd5e1"
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  Number of Vertices (V)
                </text>
                <text
                  transform={`rotate(-90) translate(-${chartHeight / 2}, 16)`}
                  fill="#cbd5e1"
                  fontSize="11"
                  textAnchor="middle"
                  fontWeight="600"
                >
                  Execution Time (ms)
                </text>

                {/* 1. Dijkstra Line */}
                <path
                  d={dataPoints
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.vertexCount)} ${getY(d.dijkstraAvgMs)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />
                {dataPoints.map((d) => (
                  <circle
                    key={`d-dot-${d.vertexCount}`}
                    cx={getX(d.vertexCount)}
                    cy={getY(d.dijkstraAvgMs)}
                    r="4"
                    fill="#3b82f6"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* 2. A* Line */}
                <path
                  d={dataPoints
                    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.vertexCount)} ${getY(d.astarAvgMs)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                {dataPoints.map((d) => (
                  <circle
                    key={`a-dot-${d.vertexCount}`}
                    cx={getX(d.vertexCount)}
                    cy={getY(d.astarAvgMs)}
                    r="4"
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                ))}

                {/* 3. Floyd-Warshall Line */}
                {dataPoints.some((d) => d.floydWarshallAvgMs !== null) && (
                  <>
                    <path
                      d={dataPoints
                        .filter((d) => d.floydWarshallAvgMs !== null)
                        .map(
                          (d, i) =>
                            `${i === 0 ? 'M' : 'L'} ${getX(d.vertexCount)} ${getY(d.floydWarshallAvgMs!)}`
                        )
                        .join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    {dataPoints
                      .filter((d) => d.floydWarshallAvgMs !== null)
                      .map((d) => (
                        <circle
                          key={`fw-dot-${d.vertexCount}`}
                          cx={getX(d.vertexCount)}
                          cy={getY(d.floydWarshallAvgMs!)}
                          r="4"
                          fill="#f59e0b"
                          stroke="#0f172a"
                          strokeWidth="1.5"
                        />
                      ))}
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Chart 2: Bar Chart for Selected Graph Size + Explored Nodes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Bar comparison for selected size */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Algorithm Comparison at Selected Size
                </h3>
                <select
                  value={selectedSizeForBar}
                  onChange={(e) => setSelectedSizeForBar(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
                >
                  {dataPoints.map((d) => (
                    <option key={d.vertexCount} value={d.vertexCount}>
                      V = {d.vertexCount} ({d.edgeCount} edges)
                    </option>
                  ))}
                </select>
              </div>

              {selectedBarPoint && (
                <div className="space-y-3 pt-2">
                  {/* Dijkstra Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-blue-400">Dijkstra's Algorithm</span>
                      <span className="font-mono text-slate-200">
                        {selectedBarPoint.dijkstraAvgMs < 1
                          ? `${(selectedBarPoint.dijkstraAvgMs * 1000).toFixed(1)} µs`
                          : `${selectedBarPoint.dijkstraAvgMs.toFixed(3)} ms`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-blue-500 h-3.5 rounded-full"
                        style={{
                          width: `${Math.max(
                            4,
                            Math.min(
                              100,
                              (selectedBarPoint.dijkstraAvgMs /
                                (selectedBarPoint.floydWarshallAvgMs || selectedBarPoint.dijkstraAvgMs || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* A* Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-emerald-400">A* Algorithm</span>
                      <span className="font-mono text-slate-200">
                        {selectedBarPoint.astarAvgMs < 1
                          ? `${(selectedBarPoint.astarAvgMs * 1000).toFixed(1)} µs`
                          : `${selectedBarPoint.astarAvgMs.toFixed(3)} ms`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-emerald-500 h-3.5 rounded-full"
                        style={{
                          width: `${Math.max(
                            4,
                            Math.min(
                              100,
                              (selectedBarPoint.astarAvgMs /
                                (selectedBarPoint.floydWarshallAvgMs || selectedBarPoint.dijkstraAvgMs || 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Floyd-Warshall Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span className="font-semibold text-amber-400">Floyd-Warshall Algorithm</span>
                      <span className="font-mono text-slate-200">
                        {selectedBarPoint.floydWarshallAvgMs !== null ? (
                          selectedBarPoint.floydWarshallAvgMs < 1 ? (
                            `${(selectedBarPoint.floydWarshallAvgMs * 1000).toFixed(1)} µs`
                          ) : (
                            `${selectedBarPoint.floydWarshallAvgMs.toFixed(3)} ms`
                          )
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-amber-500 h-3.5 rounded-full"
                        style={{
                          width: selectedBarPoint.floydWarshallAvgMs !== null ? '100%' : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Search Space Pruning (Dijkstra vs A* Explored Nodes) */}
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  Goal-Directed Search Efficiency (Nodes Visited)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Compares number of nodes visited by Dijkstra (uniform wavefront) vs A* (heuristic-guided towards target).
                </p>
              </div>

              {selectedBarPoint && (
                <div className="space-y-4 pt-1">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Dijkstra Explored Nodes</span>
                      <span className="font-mono font-bold text-blue-300">
                        {selectedBarPoint.dijkstraExploredAvg} / {selectedBarPoint.vertexCount} (
                        {Math.round((selectedBarPoint.dijkstraExploredAvg / selectedBarPoint.vertexCount) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700">
                      <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{
                          width: `${(selectedBarPoint.dijkstraExploredAvg / selectedBarPoint.vertexCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>A* Explored Nodes</span>
                      <span className="font-mono font-bold text-emerald-300">
                        {selectedBarPoint.astarExploredAvg} / {selectedBarPoint.vertexCount} (
                        {Math.round((selectedBarPoint.astarExploredAvg / selectedBarPoint.vertexCount) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 border border-slate-700">
                      <div
                        className="bg-emerald-500 h-3 rounded-full"
                        style={{
                          width: `${(selectedBarPoint.astarExploredAvg / selectedBarPoint.vertexCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {selectedBarPoint.dijkstraExploredAvg > selectedBarPoint.astarExploredAvg && (
                    <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-[11px] text-emerald-300">
                      💡 A* visited{' '}
                      <strong>
                        {selectedBarPoint.dijkstraExploredAvg - selectedBarPoint.astarExploredAvg} fewer nodes
                      </strong>{' '}
                      (
                      {Math.round(
                        ((selectedBarPoint.dijkstraExploredAvg - selectedBarPoint.astarExploredAvg) /
                          selectedBarPoint.dijkstraExploredAvg) *
                          100
                      )}
                      % search space reduction) thanks to its Euclidean distance heuristic.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Vertices (V)</th>
                  <th className="px-4 py-3">Edges (E)</th>
                  <th className="px-4 py-3">Runs Avg</th>
                  <th className="px-4 py-3">Dijkstra Time</th>
                  <th className="px-4 py-3">A* Time</th>
                  <th className="px-4 py-3">Floyd-Warshall Time</th>
                  <th className="px-4 py-3">Nodes (Dijkstra vs A*)</th>
                  <th className="px-4 py-3">Distance Equality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
                {dataPoints.map((row) => (
                  <tr key={row.vertexCount} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-100">{row.vertexCount}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{row.edgeCount}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{row.iterations}x</td>
                    <td className="px-4 py-3 font-mono text-blue-300 font-medium">
                      {row.dijkstraAvgMs < 1
                        ? `${(row.dijkstraAvgMs * 1000).toFixed(1)} µs`
                        : `${row.dijkstraAvgMs.toFixed(3)} ms`}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-300 font-medium">
                      {row.astarAvgMs < 1
                        ? `${(row.astarAvgMs * 1000).toFixed(1)} µs`
                        : `${row.astarAvgMs.toFixed(3)} ms`}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-300 font-medium">
                      {row.floydWarshallAvgMs !== null ? (
                        row.floydWarshallAvgMs < 1 ? (
                          `${(row.floydWarshallAvgMs * 1000).toFixed(1)} µs`
                        ) : (
                          `${row.floydWarshallAvgMs.toFixed(3)} ms`
                        )
                      ) : (
                        <span className="text-slate-500 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {row.dijkstraExploredAvg} vs {row.astarExploredAvg}
                    </td>
                    <td className="px-4 py-3">
                      {row.verifiedConsistent ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Discrepancy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
          <BarChart2 className="w-12 h-12 mx-auto mb-2 text-slate-500 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-200">No Benchmark Data Collected Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Click "Run Benchmark Suite" above to benchmark Dijkstra, A*, and Floyd-Warshall across 10, 25, 50, 100, 250, and 500 vertices with real wall-clock performance timing.
          </p>
        </div>
      )}
    </div>
  );
};
