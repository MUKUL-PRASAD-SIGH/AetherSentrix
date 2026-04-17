import React from "react";

export function SeverityBars({ distribution }) {
  const total = Object.values(distribution || {}).reduce(
    (sum, v) => sum + v,
    0,
  );
  const low = distribution?.low || 0;
  const medium = distribution?.medium || 0;
  const high = distribution?.high || 0;

  const lowPct = total ? (low / total) * 100 : 0;
  const medPct = total ? (medium / total) * 100 : 0;
  const highPct = total ? (high / total) * 100 : 0;

  return (
    <div className="severity-track">
      <div
        className="severity-segment low"
        style={{ width: `${lowPct}%` }}
        title={`Low: ${low}`}
      />
      <div
        className="severity-segment medium"
        style={{ width: `${medPct}%` }}
        title={`Medium: ${medium}`}
      />
      <div
        className="severity-segment high"
        style={{ width: `${highPct}%` }}
        title={`High: ${high}`}
      />
    </div>
  );
}
