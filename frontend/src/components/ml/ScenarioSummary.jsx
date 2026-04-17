import React from "react";
import { humanize } from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";

export function ScenarioSummary({ scenarios, scenarioName }) {
  const scenario = (scenarios || []).find((s) => s.name === scenarioName);
  if (!scenario) {
    return (
      <EmptyState
        title="Unknown scenario"
        description="Select a scenario from the list to view its description and techniques."
      />
    );
  }
  return (
    <div className="simulation-summary">
      <strong>{humanize(scenario.name)}</strong>
      <p>{scenario.description}</p>
      <div className="mini-row wrap">
        <span className="chip">{scenario.steps} steps</span>
        {(scenario.mitre_techniques || []).slice(0, 4).map((item) => (
          <span key={item} className="chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
