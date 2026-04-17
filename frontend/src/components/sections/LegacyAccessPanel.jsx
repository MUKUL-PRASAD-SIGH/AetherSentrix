import React from "react";
import {
  LEGACY_ACCESS_STEPS,
  BANK_JOURNEYS,
} from "../../utils/constants";

export function LegacyAccessPanel({ isConnected, alertsCount }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Legacy Credential Scenario</div>
          <p className="panel-subtitle">
            This is the story hook that makes the whole portal feel real instead
            of just decorative.
          </p>
        </div>
      </div>
      <div className="legacy-strip">
        <span className="chip">Dormant employee account</span>
        <span className="chip">
          {isConnected ? `${alertsCount} live signals` : "backend optional"}
        </span>
      </div>
      <div className="timeline-list">
        {LEGACY_ACCESS_STEPS.map((step, index) => (
          <article key={step.title} className="timeline-step">
            <div className="timeline-index">0{index + 1}</div>
            <div className="timeline-copy">
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="journey-note">
        {BANK_JOURNEYS.map((journey) => (
          <div key={journey} className="journey-row">
            {journey}
          </div>
        ))}
      </div>
    </section>
  );
}
