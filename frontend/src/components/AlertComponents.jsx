import React from "react";
import {
  buildAlertSummary, confidenceToScore, formatTimestamp, humanize,
} from "../utils.js";
import { EmptyState, JsonBlock } from "./UIComponents.jsx";

// ─── Alert Components ─────────────────────────────────────────────────────────

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
          className={alert.alert_id === selectedAlertId ? "alert-card active" : "alert-card"}
          onClick={() => onSelect(alert.alert_id)}
        >
          <div className="alert-card-top">
            <span className={`severity-pill ${alert.severity || "low"}`}>
              {humanize(alert.severity || "low")}
            </span>
            <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
          </div>
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </button>
      ))}
    </div>
  );
}

export function AlertWorkbench({ alert }) {
  if (!alert) {
    return (
      <EmptyState
        title="Choose an alert"
        description="Select any alert in the feed to inspect the explanation, entities, and playbook."
      />
    );
  }

  return (
    <div className="alert-workbench">
      <div className="mini-row">
        <span className={`severity-pill ${alert.severity || "low"}`}>
          {humanize(alert.severity || "low")}
        </span>
        <span className="chip">Risk {Math.round(alert.risk_score || 0)}</span>
        <span className="chip">
          {Math.round(confidenceToScore(alert.confidence) * 100)}% confidence
        </span>
      </div>
      <h3>{humanize(alert.threat_category || "unknown")}</h3>
      <p>{buildAlertSummary(alert)}</p>
      <div className="detail-block">
        <h4>MITRE</h4>
        <div className="mini-row wrap">
          {(alert.mitre_ids || []).map((item) => (
            <span key={item} className="chip">{item}</span>
          ))}
        </div>
      </div>
      <div className="detail-block">
        <h4>Entities</h4>
        <JsonBlock value={alert.entities || {}} />
      </div>
      <div className="detail-block">
        <h4>Explanation</h4>
        <JsonBlock value={alert.explanation || {}} />
      </div>
      <div className="detail-block">
        <h4>Suggested playbook</h4>
        <ul className="flat-list">
          {(alert.suggested_playbook || []).map((step, i) => (
            <li key={`${step}-${i}`}>{String(step)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

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
