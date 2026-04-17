import React from "react";
import { EmptyState } from "../ui/EmptyState";

export function ScenarioSummary({ scenarios, scenarioName }) {
  const scenario = scenarios.find((item) => item.name === scenarioName);
  if (!scenario) {
    return (
      <EmptyState
        title="No scenario selected"
        description="Load scenarios from the API to inspect the library."
      />
    );
  }

  return (
    <div className="scenario-summary">
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
