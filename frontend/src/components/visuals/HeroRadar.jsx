import React from "react";

export function HeroRadar({ isConnected, alerts }) {
  const points = (alerts || []).slice(0, 6);

  return (
    <div className="radar-card">
      <div className="radar-head">
        <span>Access and risk radar</span>
        <strong>{isConnected ? "monitoring" : "standby"}</strong>
      </div>
      <div className="radar-stage">
        <div className="radar-ring ring-1" />
        <div className="radar-ring ring-2" />
        <div className="radar-ring ring-3" />
        <div className="radar-sweep" />
        {points.map((alert, index) => (
          <span
            key={alert.alert_id || index}
            className={`radar-blip ${alert.severity || "medium"}`}
            style={{
              left: `${18 + ((index * 13) % 58)}%`,
              top: `${22 + ((index * 11) % 48)}%`,
            }}
          />
        ))}
      </div>
      <div className="radar-foot">
        <small>
          {isConnected
            ? "Live risk signals pulsing from the backend while the bank portal story plays on top."
            : "Starts animating once the backend returns alert and session data."}
        </small>
      </div>
    </div>
  );
}
