import React from "react";

export function Legend({ label, value, tone }) {
  return (
    <div className="legend-row">
      <div className={`legend-dot ${tone}`} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
