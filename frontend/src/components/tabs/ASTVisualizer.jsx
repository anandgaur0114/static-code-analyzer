import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, RotateCcw, Network } from 'lucide-react';

export default function ASTVisualizer({ ast }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!ast || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'ast-graph-group');

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.15, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoom);

    // Initial center transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, 60).scale(0.85));

    // Construct hierarchy
    const root = d3.hierarchy(ast, (d) => d.children);

    const treeLayout = d3.tree()
      .nodeSize([190, 95])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.5));

    treeLayout(root);

    // Draw Links
    g.selectAll('.ast-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'ast-link')
      .attr('fill', 'none')
      .attr('stroke', '#30363d')
      .attr('stroke-width', 1.5)
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
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // Node Box
    node.append('rect')
      .attr('x', -80)
      .attr('y', -18)
      .attr('width', 160)
      .attr('height', 36)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) => {
        const type = d.data.type || '';
        if (type.includes('Function')) return '#1f6feb';
        if (type.includes('If') || type.includes('While') || type.includes('For')) return '#8957e5';
        if (type.includes('Binary') || type.includes('Unary')) return '#238636';
        if (type.includes('VarDecl')) return '#da3633';
        return '#21262d';
      })
      .attr('stroke', '#484f58')
      .attr('stroke-width', 1.2)
      .style('cursor', 'pointer');

    // Node Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('fill', '#f0f6fc')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', '600')
      .text((d) => {
        const label = d.data.name || d.data.type || 'Node';
        return label.length > 22 ? label.substring(0, 20) + '...' : label;
      })
      .append('title')
      .text((d) => `${d.data.name}\nType: ${d.data.type}\nLine: ${d.data.line}:${d.data.col}`);

  }, [ast]);

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().on('zoom', (event) => {
      d3.select('.ast-graph-group').attr('transform', event.transform);
    });
    svg.transition().duration(400).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, 60).scale(0.85)
    );
    setZoomLevel(0.85);
  };

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(d3.zoom().scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(d3.zoom().scaleBy, 0.75);
  };

  if (!ast || !ast.name) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-dark-400">
        <Network className="w-8 h-8 text-dark-600 mb-2" />
        <p className="text-xs">No Abstract Syntax Tree available. Run analysis on code to generate AST.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-dark-950 overflow-hidden flex flex-col">
      {/* Visualizer Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-dark-850/90 backdrop-blur-md border border-dark-600 p-1.5 rounded-lg shadow-md text-xs text-dark-300">
        <button
          onClick={handleZoomIn}
          className="p-1 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1 hover:bg-dark-700 rounded text-dark-300 hover:text-dark-100 transition"
          title="Reset Zoom & Pan"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="font-mono text-[10px] text-dark-400 px-1 border-l border-dark-700">
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      <div className="absolute top-3 left-3 z-10 bg-dark-850/90 backdrop-blur-md border border-dark-600 px-3 py-1.5 rounded-lg shadow-md text-xs text-dark-300 flex items-center gap-3">
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

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
    </div>
  );
}
