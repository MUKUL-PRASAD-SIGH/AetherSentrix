import React from "react";

export function StatTile({ label, value, hint, tone = "neutral" }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
