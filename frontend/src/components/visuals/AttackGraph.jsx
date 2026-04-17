import React from "react";
import { buildGraph, truncate } from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";

export function AttackGraph({ alerts }) {
  const graph = buildGraph(alerts);
  if (!graph.nodes.length) {
    return (
      <EmptyState
        title="No attack graph yet"
        description="Attack relationships appear after the backend emits graph entities."
      />
    );
  }

  const width = 720,
    height = 280,
    cx = width / 2,
    cy = height / 2,
    r = 95;
  const positions = graph.nodes.map((node, i) => {
    const angle = (Math.PI * 2 * i) / graph.nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
    };
  });
  const posMap = Object.fromEntries(positions.map((n) => [n.id, n]));

  return (
    <svg
      className="graph-canvas"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Attack graph"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="24"
        fill="rgba(10, 18, 36, 0.3)"
      />
      {graph.edges.map((edge) => {
        const s = posMap[edge.source],
          t = posMap[edge.target];
        if (!s || !t) return null;
        return (
          <line
            key={`${edge.source}-${edge.target}-${edge.label}`}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1 + Math.min(edge.weight || 1, 4)}
          />
        );
      })}
      {positions.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="24" className="graph-node" />
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            className="graph-label"
          >
            {truncate(node.label, 12)}
          </text>
        </g>
      ))}
    </svg>
  );
}
