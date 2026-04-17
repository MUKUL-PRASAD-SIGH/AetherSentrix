import React from "react";
import { MetricCard } from "../ui/MetricCard";
import { APP_SURFACES, BANK_TEMPLATES } from "../../utils/constants";

export function DeploymentPanel({ backendStatus, alertsCount, endpointCount }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Delivery Slice</div>
          <p className="panel-subtitle">
            Separate product surfaces share one backend telemetry layer and one
            operator console.
          </p>
        </div>
      </div>
      <div className="metric-grid deployment-grid">
        <MetricCard label="Surfaces" value={APP_SURFACES.length} accent="cool" />
        <MetricCard label="Tenant templates" value={BANK_TEMPLATES.length} accent="success" />
        <MetricCard label="Endpoints" value={endpointCount} accent="warm" />
        <MetricCard label="Live alerts" value={alertsCount} accent="danger" />
      </div>
      <div className="journey-note">
        <div className="journey-row">Backend status: {backendStatus}</div>
        <div className="journey-row">Customer portal stays separate from the analyst console.</div>
        <div className="journey-row">Tenant templates keep the same product shell adaptable across bank types.</div>
      </div>
    </section>
  );
}
