import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { humanize, formatTimestamp, confidenceToScore } from "../../utils/helpers";

export function AnalyticsTable({ alerts }) {
  if (!alerts.length) {
    return (
      <EmptyState
        title="No analytics rows yet"
        description="Analytics rows appear after the alert archive has data."
      />
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Threat</th>
            <th>Severity</th>
            <th>Confidence</th>
            <th>Risk</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr key={alert.alert_id}>
              <td>{formatTimestamp(alert.timestamp)}</td>
              <td>{humanize(alert.threat_category || "unknown")}</td>
              <td>{humanize(alert.severity || "low")}</td>
              <td>{Math.round(confidenceToScore(alert.confidence) * 100)}%</td>
              <td>{Math.round(alert.risk_score || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
