import React, { useRef, useState, useEffect } from 'react';
import { GraphEdge, GraphNode } from '../types/graph';
import { ZoomIn, ZoomOut, RotateCcw, Move, Plus, Info } from 'lucide-react';

interface GraphVisualizationProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isDirected: boolean;
  sourceId: string;
  destId: string;
  highlightedPath: string[]; // Node IDs in optimal path
  exploredNodes: string[]; // Node IDs explored during execution
  onSelectSource: (nodeId: string) => void;
  onSelectDest: (nodeId: string) => void;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onAddNode: (name: string, x: number, y: number) => void;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  nodes,
  edges,
  isDirected,
  sourceId,
  destId,
  highlightedPath,
  exploredNodes,
  onSelectSource,
  onSelectDest,
  onUpdateNodePosition,
  onAddNode,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [contextMenuNode, setContextMenuNode] = useState<{ id: string; x: number; y: number } | null>(null);
  const [isAddingNodeMode, setIsAddingNodeMode] = useState(false);

  // Set of path edges for fast lookup
  const pathEdgePairs = React.useMemo(() => {
    const pairs = new Set<string>();
    for (let i = 0; i < highlightedPath.length - 1; i++) {
      const u = highlightedPath[i];
      const v = highlightedPath[i + 1];
      pairs.add(`${u}->${v}`);
      if (!isDirected) {
        pairs.add(`${v}->${u}`);
      }
    }
    return pairs;
  }, [highlightedPath, isDirected]);

  const pathNodeSet = React.useMemo(() => new Set(highlightedPath), [highlightedPath]);
  const exploredNodeSet = React.useMemo(() => new Set(exploredNodes), [exploredNodes]);

  // Handle Dragging Nodes or Panning SVG
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === 'rect') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setContextMenuNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
      return;
    }

    if (draggingNodeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      const boundedX = Math.max(30, Math.min(850, Math.round(rawX - dragOffset.x)));
      const boundedY = Math.max(30, Math.min(550, Math.round(rawY - dragOffset.y)));
      onUpdateNodePosition(draggingNodeId, boundedX, boundedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation();
    if (e.button === 2) {
      // Right click context menu
      e.preventDefault();
      setContextMenuNode({ id: node.id, x: e.clientX, y: e.clientY });
      return;
    }
    setContextMenuNode(null);
    setDraggingNodeId(node.id);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const currentSvgX = (e.clientX - rect.left - pan.x) / zoom;
      const currentSvgY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({
        x: currentSvgX - node.x,
        y: currentSvgY - node.y,
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isAddingNodeMode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = Math.round((e.clientX - rect.left - pan.x) / zoom);
      const clickY = Math.round((e.clientY - rect.top - pan.y) / zoom);
      const defaultName = `Station ${nodes.length + 1}`;
      const name = window.prompt('Enter name for new location:', defaultName);
      if (name && name.trim()) {
        onAddNode(name.trim(), clickX, clickY);
      }
      setIsAddingNodeMode(false);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Node map for edge coordinates
  const nodesMap = React.useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  return (
    <div className="relative w-full h-[540px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col select-none">
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 shadow-md text-xs text-slate-200">
        <span className="font-semibold text-slate-300">Graph Canvas:</span>
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-200"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-200"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-200"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-slate-600 mx-1" />
        <button
          onClick={() => setIsAddingNodeMode(!isAddingNodeMode)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors font-medium ${
            isAddingNodeMode
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-700 text-slate-300'
          }`}
          title="Click canvas to add node"
        >
          <Plus className="w-3.5 h-3.5" />
          {isAddingNodeMode ? 'Click Canvas...' : 'Add Node'}
        </button>
      </div>

      {/* Floating Instructions Pill */}
      <div className="absolute top-3 right-3 z-10 hidden md:flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-[11px] text-slate-300">
        <Info className="w-3.5 h-3.5 text-blue-400" />
        <span>Click node to select • Drag to reposition • Right-click for options</span>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={`w-full h-full ${
          isAddingNodeMode
            ? 'cursor-crosshair'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <defs>
          {/* Edge arrow marker for directed mode */}
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker
            id="arrowhead-active"
            viewBox="0 0 10 10"
            refX="24"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>

          {/* Glowing filter for shortest route */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Grid Pattern */}
        <g
          transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: '0 0' }}
        >
          {/* Subtle grid lines */}
          <g opacity="0.12" stroke="#94a3b8" strokeWidth="0.5">
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={600} />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`gy-${i}`} x1={0} y1={i * 50} x2={900} y2={i * 50} />
            ))}
          </g>

          {/* 1. EDGES */}
          <g className="edges-layer">
            {edges.map((edge) => {
              const u = nodesMap.get(edge.from);
              const v = nodesMap.get(edge.to);
              if (!u || !v) return null;

              const isPathEdge =
                pathEdgePairs.has(`${edge.from}->${edge.to}`) ||
                pathEdgePairs.has(`${edge.to}->${edge.from}`);

              const midX = (u.x + v.x) / 2;
              const midY = (u.y + v.y) / 2;

              return (
                <g key={edge.id}>
                  {/* Glowing highlight underlayer if in optimal route */}
                  {isPathEdge && (
                    <line
                      x1={u.x}
                      y1={u.y}
                      x2={v.x}
                      y2={v.y}
                      stroke="#38bdf8"
                      strokeWidth="8"
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                      filter="url(#routeGlow)"
                    />
                  )}

                  {/* Main edge stroke */}
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke={isPathEdge ? '#0284c7' : '#475569'}
                    strokeWidth={isPathEdge ? '3.5' : '2'}
                    strokeDasharray={isPathEdge ? 'none' : undefined}
                    strokeLinecap="round"
                    markerEnd={
                      isDirected
                        ? isPathEdge
                          ? 'url(#arrowhead-active)'
                          : 'url(#arrowhead)'
                        : undefined
                    }
                  />

                  {/* Weight label pill */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-14"
                      y="-10"
                      width="28"
                      height="20"
                      rx="10"
                      fill={isPathEdge ? '#0369a1' : '#1e293b'}
                      stroke={isPathEdge ? '#38bdf8' : '#334155'}
                      strokeWidth="1.2"
                      className="transition-colors"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill={isPathEdge ? '#ffffff' : '#94a3b8'}
                      fontSize="11"
                      fontWeight={isPathEdge ? '700' : '500'}
                      fontFamily="monospace"
                    >
                      {edge.weight}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 2. NODES */}
          <g className="nodes-layer">
            {nodes.map((node) => {
              const isSource = node.id === sourceId;
              const isDest = node.id === destId;
              const isPath = pathNodeSet.has(node.id);
              const isExplored = exploredNodeSet.has(node.id) && !isPath;

              let fillColor = '#1e293b';
              let strokeColor = '#475569';
              let radius = 22;

              if (isSource) {
                fillColor = '#059669';
                strokeColor = '#34d399';
                radius = 26;
              } else if (isDest) {
                fillColor = '#dc2626';
                strokeColor = '#f87171';
                radius = 26;
              } else if (isPath) {
                fillColor = '#0284c7';
                strokeColor = '#38bdf8';
                radius = 24;
              } else if (isExplored) {
                fillColor = '#312e81';
                strokeColor = '#818cf8';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!sourceId || (sourceId && destId)) {
                      onSelectSource(node.id);
                    } else {
                      onSelectDest(node.id);
                    }
                  }}
                  className="cursor-pointer group"
                >
                  {/* Outer pulse animation for source and dest */}
                  {(isSource || isDest) && (
                    <circle
                      r={radius + 6}
                      fill="none"
                      stroke={isSource ? '#34d399' : '#f87171'}
                      strokeWidth="1.5"
                      opacity="0.6"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={radius}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isSource || isDest || isPath ? '3' : '2'}
                    className="transition-all duration-200 group-hover:scale-110"
                  />

                  {/* Inner text or initials */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#ffffff"
                    fontSize={isSource || isDest ? '11' : '10'}
                    fontWeight="700"
                    pointerEvents="none"
                  >
                    {isSource ? 'SRC' : isDest ? 'DST' : node.name.substring(0, 3).toUpperCase()}
                  </text>

                  {/* Node Name Label Below */}
                  <g transform="translate(0, 36)" pointerEvents="none">
                    <rect
                      x={-Math.max(40, node.name.length * 4)}
                      y="-11"
                      width={Math.max(80, node.name.length * 8)}
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      fillOpacity="0.9"
                      stroke="#334155"
                      strokeWidth="0.8"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill={isSource ? '#34d399' : isDest ? '#f87171' : isPath ? '#38bdf8' : '#e2e8f0'}
                      fontSize="11"
                      fontWeight={isSource || isDest || isPath ? '600' : '400'}
                    >
                      {node.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Context Menu for right-click node */}
      {contextMenuNode && (
        <div
          className="fixed z-50 bg-slate-800 text-slate-100 rounded-lg shadow-xl border border-slate-700 py-1 text-xs w-44"
          style={{ top: contextMenuNode.y, left: contextMenuNode.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 font-semibold text-slate-400 border-b border-slate-700">
            {nodesMap.get(contextMenuNode.id)?.name}
          </div>
          <button
            onClick={() => {
              onSelectSource(contextMenuNode.id);
              setContextMenuNode(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-emerald-600/30 hover:text-emerald-300 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Set as Source
          </button>
          <button
            onClick={() => {
              onSelectDest(contextMenuNode.id);
              setContextMenuNode(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-rose-600/30 hover:text-rose-300 flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Set as Destination
          </button>
        </div>
      )}

      {/* Bottom Legend Bar */}
      <div className="bg-slate-800/95 border-t border-slate-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-emerald-300 inline-block" />
            <span className="text-slate-200 font-medium">Source (Start)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-red-300 inline-block" />
            <span className="text-slate-200 font-medium">Destination (Target)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-500 border border-sky-300 inline-block" />
            <span className="text-slate-200 font-medium">Shortest Path</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-indigo-800 border border-indigo-400 inline-block" />
            <span className="text-slate-200">Explored Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-700 border border-slate-600 font-mono text-[10px]">4</span>
            <span className="text-slate-300">Edge Weight</span>
          </div>
        </div>

        <div className="text-slate-400 text-[11px]">
          {nodes.length} Vertices • {edges.length} Edges • {isDirected ? 'Directed' : 'Undirected'}
        </div>
      </div>
    </div>
  );
};
