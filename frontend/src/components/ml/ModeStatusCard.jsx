import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

export function ModeStatusCard({ status }) {
  if (!status) {
    return (
      <EmptyState
        title="Model status unavailable"
        description="Reconnect the backend to load active model mode and version information."
      />
    );
  }
  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">{status.active_mode || "synthetic"}</span>
        <span className="chip">
          {status.active_version || "no real version yet"}
        </span>
        <span className="chip">
          {status.real_mode_available ? "real-ready" : "synthetic-only"}
        </span>
      </div>
      <JsonBlock
        value={{
          active_mode: status.active_mode,
          active_version: status.active_version,
          real_mode_available: status.real_mode_available,
        }}
      />
    </div>
  );
}
