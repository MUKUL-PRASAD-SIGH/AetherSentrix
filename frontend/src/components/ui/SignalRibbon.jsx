import React from "react";

export function SignalRibbon() {
  const items = [
    "Customer and staff journeys",
    "Privileged access guardrails",
    "Risk-scored session review",
    "Simulation-to-detection loop",
  ];

  return (
    <div className="signal-ribbon">
      {items.map((item) => (
        <div key={item} className="signal-pill">
          <span className="signal-dot" />
          {item}
        </div>
      ))}
    </div>
  );
}
