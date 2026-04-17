import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { buildGraph, truncate } from "../../utils/helpers";

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

  const width = 720;
  const height = 280;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 95;
  const positions = graph.nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / graph.nodes.length - Math.PI / 2;
    return {
      ...node,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  });

  const positionMap = Object.fromEntries(
    positions.map((node) => [node.id, node]),
  );

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
        const source = positionMap[edge.source];
        const target = positionMap[edge.target];
        if (!source || !target) {
          return null;
        }
        return (
          <line
            key={`${edge.source}-${edge.target}-${edge.label}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
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
