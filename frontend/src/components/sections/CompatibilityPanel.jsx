import React from "react";
import { COMPATIBILITY_AREAS } from "../../utils/constants";

export function CompatibilityPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Compatibility Envelope</div>
          <p className="panel-subtitle">
            The product is shaped to plug into common bank-side systems instead
            of pretending every bank works the same way.
          </p>
        </div>
      </div>
      <div className="workspace-list">
        {COMPATIBILITY_AREAS.map((area) => (
          <article key={area} className="workspace-row">
            <div className="workspace-copy">
              <strong>{area}</strong>
              <p>Expose adapters, policies, and workflow mappings per tenant.</p>
            </div>
            <span className="chip">compatible</span>
          </article>
        ))}
      </div>
    </section>
  );
}
