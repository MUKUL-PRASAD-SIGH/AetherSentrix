import React from "react";
import { confidenceToScore } from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";

export function TrendChart({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No alert trend yet"
        description="Run the demo or detect a scenario to populate this chart."
      />
    );
  }

  const width = 720,
    height = 240,
    pad = 20;
  const points = alerts.map((alert, i) => {
    const x =
      alerts.length === 1
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
    <svg
      className="trend-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Alert trend"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 110, 110, 0.55)" />
          <stop offset="100%" stopColor="rgba(255, 110, 110, 0.03)" />
        </linearGradient>
      </defs>
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx="22"
        fill="rgba(10, 18, 36, 0.3)"
      />
      <polyline
        points={`${pad},${height - pad} ${polyline} ${width - pad},${height - pad}`}
        fill="url(#trendFill)"
        stroke="none"
      />
      <polyline
        points={polyline}
        fill="none"
        stroke="#ff7373"
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p) => (
        <circle
          key={p.alert.alert_id || p.x}
          cx={p.x}
          cy={p.y}
          r="6"
          className={`severity-${p.alert.severity || "low"}`}
        />
      ))}
    </svg>
  );
}
