import React from "react";
import {
  buildGraph, buildHeatmap, confidenceToScore, humanize, truncate,
} from "../utils.js";
import { EmptyState } from "./UIComponents.jsx";

// ─── Chart Components ─────────────────────────────────────────────────────────

export function Legend({ label, value, tone }) {
  return (
    <div className="legend-row">
      <div className={`legend-dot ${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function SeverityDial({ distribution }) {
  const total = Object.values(distribution || {}).reduce((sum, v) => sum + v, 0);
  const low    = distribution?.low    || 0;
  const medium = distribution?.medium || 0;
  const high   = distribution?.high   || 0;
  const lowStop    = total ? (low / total) * 360 : 0;
  const mediumStop = total ? ((low + medium) / total) * 360 : 0;

  return (
    <div className="dial-wrap">
      <div
        className="dial"
        style={{
          background: `conic-gradient(#2bd9a0 0deg ${lowStop}deg, #ffb74d ${lowStop}deg ${mediumStop}deg, #ff5d7a ${mediumStop}deg 360deg)`,
        }}
      >
        <div className="dial-core">
          <strong>{total}</strong>
          <span>alerts</span>
        </div>
      </div>
      <div className="legend-list">
        <Legend label="Low"    value={low}    tone="low"    />
        <Legend label="Medium" value={medium} tone="medium" />
        <Legend label="High"   value={high}   tone="high"   />
      </div>
    </div>
  );
}

export function SeverityBars({ distribution }) {
  const entries = [
    { key: "low",    label: "Low",    value: distribution.low    || 0 },
    { key: "medium", label: "Medium", value: distribution.medium || 0 },
    { key: "high",   label: "High",   value: distribution.high   || 0 },
  ];
  const max = Math.max(...entries.map((e) => e.value), 1);

  return (
    <div className="severity-bars">
      {entries.map((entry) => (
        <div key={entry.key} className="bar-row">
          <span>{entry.label}</span>
          <div className="bar-track">
            <div
              className={`bar-fill ${entry.key}`}
              style={{ width: `${(entry.value / max) * 100}%` }}
            />
          </div>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function TrendChart({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No alert trend yet"
        description="Run the demo or detect a scenario to populate this chart."
      />
    );
  }

  const width = 720, height = 240, pad = 20;
  const points = alerts.map((alert, i) => {
    const x = alerts.length === 1
      ? width / 2
      : pad + (i * (width - pad * 2)) / (alerts.length - 1);
    const score = Math.max(
      confidenceToScore(alert.confidence),
      (alert.risk_score || 0) / 100,
    );
    return { x, y: height - pad - score * (height - pad * 2), alert };
  });
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Alert trend">
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255, 110, 110, 0.55)" />
          <stop offset="100%" stopColor="rgba(255, 110, 110, 0.03)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} rx="22" fill="rgba(10, 18, 36, 0.3)" />
      <polyline
        points={`${pad},${height - pad} ${polyline} ${width - pad},${height - pad}`}
        fill="url(#trendFill)" stroke="none"
      />
      <polyline points={polyline} fill="none" stroke="#ff7373" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <circle
          key={p.alert.alert_id || p.x}
          cx={p.x} cy={p.y} r="6"
          className={`severity-${p.alert.severity || "low"}`}
        />
      ))}
    </svg>
  );
}

export function Heatmap({ alerts }) {
  const matrix = buildHeatmap(alerts);
  if (!matrix.categories.length || !matrix.sources.length) {
    return (
      <EmptyState
        title="No entity heatmap yet"
        description="Heatmap cells appear once alerts with entities are available."
      />
    );
  }
  const gridStyle = {
    gridTemplateColumns: `1.1fr repeat(${Math.max(matrix.categories.length, 1)}, minmax(58px, 1fr))`,
  };

  return (
    <div className="heatmap">
      <div className="heatmap-header" style={gridStyle}>
        <div />
        {matrix.categories.map((cat) => <span key={cat}>{humanize(cat)}</span>)}
      </div>
      {matrix.sources.map((src) => (
        <div key={src} className="heatmap-row" style={gridStyle}>
          <strong>{src}</strong>
          {matrix.categories.map((cat) => {
            const value    = matrix.counts[`${src}::${cat}`] || 0;
            const strength = Math.min(1, value / 3);
            return (
              <div
                key={`${src}-${cat}`}
                className="heatmap-cell"
                style={{ opacity: 0.25 + strength * 0.75 }}
                title={`${src} / ${cat}: ${value}`}
              >
                {value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

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

  const width = 720, height = 280, cx = width / 2, cy = height / 2, r = 95;
  const positions = graph.nodes.map((node, i) => {
    const angle = (Math.PI * 2 * i) / graph.nodes.length - Math.PI / 2;
    return { ...node, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  const posMap = Object.fromEntries(positions.map((n) => [n.id, n]));

  return (
    <svg className="graph-canvas" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Attack graph">
      <rect x="0" y="0" width={width} height={height} rx="24" fill="rgba(10, 18, 36, 0.3)" />
      {graph.edges.map((edge) => {
        const s = posMap[edge.source], t = posMap[edge.target];
        if (!s || !t) return null;
        return (
          <line
            key={`${edge.source}-${edge.target}-${edge.label}`}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1 + Math.min(edge.weight || 1, 4)}
          />
        );
      })}
      {positions.map((node) => (
        <g key={node.id}>
          <circle cx={node.x} cy={node.y} r="24" className="graph-node" />
          <text x={node.x} y={node.y + 4} textAnchor="middle" className="graph-label">
            {truncate(node.label, 12)}
          </text>
        </g>
      ))}
    </svg>
  );
}
