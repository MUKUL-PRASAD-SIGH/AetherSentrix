import React from "react";
import { SAAS_CAPABILITIES } from "../../utils/constants";

export function SaaSReadinessPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">SaaS Readiness</div>
          <p className="panel-subtitle">
            These are the product layers that make the bank experience feel
            reusable, not one-off.
          </p>
        </div>
      </div>
      <div className="persona-grid">
        {SAAS_CAPABILITIES.map((item) => (
          <article key={item.title} className="persona-card">
            <div className="persona-head">
              <strong>{item.title}</strong>
              <span>foundation</span>
            </div>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
