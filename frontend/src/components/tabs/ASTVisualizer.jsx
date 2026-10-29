import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Network, 
  Maximize2, 
  Minimize2, 
  X, 
  Info,
  Layers,
  Code2
} from 'lucide-react';

export default function ASTVisualizer({ ast }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Count total nodes in the AST
  const countNodes = (node) => {
    if (!node) return 0;
    let count = 1;
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countNodes(child);
      }
    }
    return count;
  };

  const totalNodeCount = ast ? countNodes(ast) : 0;

  // Render D3 Tree
  const renderTree = useCallback(() => {
    if (!ast || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || (isFullscreen ? window.innerHeight - 80 : 550);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'ast-graph-group');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoom);

    // Initial center transform
    const initialScale = isFullscreen ? 0.95 : 0.85;
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, isFullscreen ? 80 : 50).scale(initialScale));

    // Construct hierarchy
    const root = d3.hierarchy(ast, (d) => d.children);

    const treeLayout = d3.tree()
      .nodeSize([isFullscreen ? 210 : 190, isFullscreen ? 110 : 95])
      .separation((a, b) => (a.parent === b.parent ? 1.25 : 1.6));

    treeLayout(root);

    // Draw Links
    g.selectAll('.ast-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'ast-link')
      .attr('fill', 'none')
      .attr('stroke', '#30363d')
      .attr('stroke-width', isFullscreen ? 2 : 1.5)
      .attr('d', d3.linkVertical()
        .x((d) => d.x)
        .y((d) => d.y)
      );

    // Draw Nodes
    const node = g.selectAll('.ast-node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', 'ast-node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.data);
      });

    // Node Box
    const boxWidth = isFullscreen ? 175 : 160;
    const boxHeight = isFullscreen ? 40 : 36;

    node.append('rect')
      .attr('x', -boxWidth / 2)
      .attr('y', -boxHeight / 2)
      .attr('width', boxWidth)
      .attr('height', boxHeight)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => {
        const type = d.data.type || '';
        if (type.includes('Function')) return '#1f6feb';
        if (type.includes('If') || type.includes('While') || type.includes('For')) return '#8957e5';
        if (type.includes('Binary') || type.includes('Unary')) return '#238636';
        if (type.includes('VarDecl')) return '#da3633';
        return '#21262d';
      })
      .attr('stroke', (d) => (selectedNode && selectedNode.name === d.data.name ? '#58a6ff' : '#484f58'))
      .attr('stroke-width', (d) => (selectedNode && selectedNode.name === d.data.name ? 2.5 : 1.2))
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

    // Node Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#f0f6fc')
      .attr('font-size', isFullscreen ? '11px' : '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text((d) => {
        const label = d.data.name || d.data.type || 'Node';
        const maxLen = isFullscreen ? 26 : 22;
        return label.length > maxLen ? label.substring(0, maxLen - 2) + '..' : label;
      })
      .append('title')
      .text((d) => `${d.data.name}\nType: ${d.data.type}\nLine: ${d.data.line || '?'}:${d.data.col || '?'}`);

  }, [ast, isFullscreen, selectedNode]);

  // Re-render tree on mount, AST change, or fullscreen toggle
  useEffect(() => {
    renderTree();
    // Re-render when window resizes
    const handleResize = () => renderTree();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderTree]);

  // Close fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', (event) => {
      d3.select('.ast-graph-group').attr('transform', event.transform);
    });
    const defaultScale = isFullscreen ? 0.95 : 0.85;
    svg.transition().duration(350).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, isFullscreen ? 80 : 50).scale(defaultScale)
    );
    setZoomLevel(defaultScale);
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(d3.zoom().scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(d3.zoom().scaleBy, 0.75);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!ast || !ast.name) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-dark-400">
        <Network className="w-8 h-8 text-dark-600 mb-2" />
        <p className="text-xs">No Abstract Syntax Tree available. Run static analysis on code to generate AST.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-dark-950 overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 bg-dark-950/98 backdrop-blur-xl' : ''
      }`}
    >
      {/* Fullscreen Header Bar (Only visible in Fullscreen mode) */}
      {isFullscreen && (
        <div className="bg-dark-850/95 border-b border-dark-600 px-6 py-3 flex items-center justify-between text-dark-100 z-20 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-blue/20 text-brand-blue border border-brand-blue/30 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">Abstract Syntax Tree (AST) Explorer</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                  {totalNodeCount} Nodes
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-dark-700 text-dark-300">
                  Full Screen Studio
                </span>
              </div>
              <p className="text-[11px] text-dark-400">
                Interactive Hierarchical Parse Tree • Click any node to inspect • Drag to pan • Scroll to zoom
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetZoom}
              className="px-2.5 py-1.5 rounded-md bg-dark-750 hover:bg-dark-700 text-dark-300 hover:text-dark-100 border border-dark-600 text-xs flex items-center gap-1.5 transition"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-md bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Exit Fullscreen (or press Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
              <kbd className="ml-1 px-1 py-0.2 bg-white/20 rounded text-[10px]">Esc</kbd>
            </button>
          </div>
        </div>
      )}

      {/* Top Left: Color Legend */}
      <div className={`absolute ${isFullscreen ? 'top-16' : 'top-3'} left-3 z-10 bg-dark-850/90 backdrop-blur-md border border-dark-600 px-3 py-1.5 rounded-lg shadow-md text-xs text-dark-300 flex items-center gap-3`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>
          <span className="text-[11px]">Function</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"></span>
          <span className="text-[11px]">Control Flow</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block"></span>
          <span className="text-[11px]">Expression</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block"></span>
          <span className="text-[11px]">Declaration</span>
        </div>
      </div>

      {/* Top Right: Zoom & Fullscreen Controls */}
      <div className={`absolute ${isFullscreen ? 'top-16' : 'top-3'} right-3 z-10 flex items-center gap-1 bg-dark-850/90 backdrop-blur-md border border-dark-600 p-1 rounded-lg shadow-md text-xs text-dark-300`}>
        <button
          onClick={handleZoomIn}
          className="p-1.5 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1.5 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="font-mono text-[10px] text-dark-400 px-1.5 border-l border-dark-700">
          {Math.round(zoomLevel * 100)}%
        </span>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 hover:bg-dark-700 rounded text-brand-blue hover:text-brand-blue/80 border-l border-dark-700 pl-2 transition flex items-center gap-1"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand to Full Screen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline text-[11px] font-semibold">
            {isFullscreen ? 'Exit' : 'Full Screen'}
          </span>
        </button>
      </div>

      {/* SVG Canvas (Double click anywhere on canvas also enters/exits full screen) */}
      <svg
        ref={svgRef}
        onDoubleClick={toggleFullscreen}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing"
      ></svg>

      {/* Bottom Hint Banner (in normal view mode) */}
      {!isFullscreen && (
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-dark-500 pointer-events-none select-none">
          <span>💡 Double-click canvas or click &quot;Full Screen&quot; to expand</span>
          <span>{totalNodeCount} Nodes</span>
        </div>
      )}

      {/* Node Inspector Drawer (shown when user clicks a node) */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-20 bg-dark-850/95 backdrop-blur-md border border-dark-600 rounded-xl p-4 shadow-2xl max-w-sm w-full text-xs text-dark-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-dark-700 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand-blue" />
              <span className="font-bold text-dark-100">AST Node Inspector</span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-100 transition"
              title="Close Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-dark-400">Node Title</span>
              <p className="font-mono text-xs text-dark-100 font-semibold break-words">
                {selectedNode.name || 'Unnamed'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-dark-400">Node Type</span>
                <p className="font-mono text-[11px] text-brand-purple">
                  {selectedNode.type || 'ASTNode'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-dark-400">Location</span>
                <p className="font-mono text-[11px] text-dark-300">
                  Line {selectedNode.line || 1}, Col {selectedNode.col || 1}
                </p>
              </div>
            </div>
            {selectedNode.children && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-dark-400">Direct Children</span>
                <p className="text-[11px] text-dark-300">
                  {selectedNode.children.length} sub-nodes
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
