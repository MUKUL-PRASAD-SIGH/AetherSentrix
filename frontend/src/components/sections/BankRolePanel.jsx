import React from "react";
import { BANK_PERSONAS } from "../../utils/constants";

export function BankRolePanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Identity Layers</div>
          <p className="panel-subtitle">
            The portal separates real customer journeys from internal bank work
            while still modeling the risky in-between state of stale access.
          </p>
        </div>
      </div>
      <div className="persona-grid">
        {BANK_PERSONAS.map((persona) => (
          <article key={persona.title} className="persona-card">
            <div className="persona-head">
              <strong>{persona.title}</strong>
              <span>{persona.handle}</span>
            </div>
            <p>{persona.summary}</p>
            <div className="mini-row wrap">
              {persona.badges.map((badge) => (
                <span key={badge} className="chip">
                  {badge}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
