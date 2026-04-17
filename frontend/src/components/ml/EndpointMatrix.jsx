import React from "react";

export function EndpointMatrix() {
  const entries = [
    "GET /health",
    "GET /assistant/health",
    "GET /ingestion/health",
    "GET /scenarios",
    "GET /alerts/recent",
    "GET /events/recent",
    "GET /ml/status",
    "POST /ingest",
    "POST /ingest/syslog",
    "POST /detect",
    "POST /detect/batch",
    "POST /demo/run",
    "POST /simulate",
    "POST /ml/train",
    "POST /ml/mode",
    "POST /assistant",
  ];
  return (
    <div className="endpoint-matrix">
      {entries.map((entry) => (
        <div key={entry} className="endpoint-row">
          <span className="chip">wired</span>
          <strong>{entry}</strong>
        </div>
      ))}
    </div>
  );
}
