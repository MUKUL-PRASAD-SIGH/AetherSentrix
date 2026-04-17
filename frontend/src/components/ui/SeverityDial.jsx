import React from "react";
import { Legend } from "./Legend";

export function SeverityDial({ distribution }) {
  const total = Object.values(distribution || {}).reduce(
    (sum, value) => sum + value,
    0,
  );
  const low = distribution?.low || 0;
  const medium = distribution?.medium || 0;
  const high = distribution?.high || 0;
  const lowStop = total ? (low / total) * 360 : 0;
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
        <Legend label="Low" value={low} tone="low" />
        <Legend label="Medium" value={medium} tone="medium" />
        <Legend label="High" value={high} tone="high" />
      </div>
    </div>
  );
}
