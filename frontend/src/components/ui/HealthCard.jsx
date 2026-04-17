import React from "react";
import { EmptyState } from "./EmptyState";
import { JsonBlock } from "./JsonBlock";

export function HealthyCard({ health }) {
  if (!health) {
    return (
      <EmptyState
        title="Assistant health unavailable"
        description="Reconnect the backend to load assistant health information."
      />
    );
  }
  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">
          {health.configured ? "configured" : "not configured"}
        </span>
        <span className="chip">{health.model || "unknown model"}</span>
        <span className="chip">
          {health.last_success_at || "no successful call yet"}
        </span>
      </div>
      {health.last_error ? <JsonBlock value={health.last_error} /> : null}
    </div>
  );
}
