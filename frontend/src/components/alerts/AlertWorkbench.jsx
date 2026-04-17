import React from "react";
import {
  buildAlertSummary,
  confidenceToScore,
  humanize,
} from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

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
            <span key={item} className="chip">
              {item}
            </span>
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
