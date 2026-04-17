import React from "react";
import { humanize, buildAlertSummary } from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

export function SimulationSummary({ report, alert }) {
  if (!report) {
    return (
      <EmptyState
        title="No simulation executed"
        description="Select a scenario and run it to see events and the resulting alert."
      />
    );
  }
  return (
    <div className="simulation-summary">
      <div className="mini-row wrap">
        <span className="chip">{report.simulation_id}</span>
        <span className="chip">{report.events_generated} events</span>
        <span className="chip">{humanize(report.scenario || "unknown")}</span>
      </div>
      <p>{report.description}</p>
      {alert ? (
        <div className="alert-inline">
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </div>
      ) : null}
      <JsonBlock value={(report.events || []).slice(0, 6)} />
    </div>
  );
}
