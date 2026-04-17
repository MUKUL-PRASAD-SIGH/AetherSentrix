import React from "react";
import {
  buildAlertSummary,
  formatTimestamp,
  humanize,
} from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";

export function AlertFeed({ alerts, selectedAlertId, onSelect }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No alerts loaded"
        description="Run the demo or the simulator to populate the live alert feed."
      />
    );
  }

  return (
    <div className="alert-feed">
      {alerts.map((alert) => (
        <button
          key={alert.alert_id}
          className={
            alert.alert_id === selectedAlertId
              ? "alert-card active"
              : "alert-card"
          }
          onClick={() => onSelect(alert.alert_id)}
        >
          <div className="alert-card-top">
            <span className={`severity-pill ${alert.severity || "low"}`}>
              {humanize(alert.severity || "low")}
            </span>
            <span className="alert-time">
              {formatTimestamp(alert.timestamp)}
            </span>
          </div>
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </button>
      ))}
    </div>
  );
}
