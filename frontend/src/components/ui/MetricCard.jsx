import React from "react";

export function MetricCard({ label, value, accent }) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
