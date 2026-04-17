import React from "react";
import { BANK_WORKSPACES } from "../../utils/constants";

export function WorkspaceMatrixPanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">App Surfaces</div>
          <p className="panel-subtitle">
            Each surface represents a bank app or module you can showcase
            inside one unified website.
          </p>
        </div>
      </div>
      <div className="workspace-list">
        {BANK_WORKSPACES.map((workspace) => (
          <article key={workspace.title} className="workspace-row">
            <div className="workspace-copy">
              <strong>{workspace.title}</strong>
              <p>{workspace.description}</p>
            </div>
            <span className="chip">{workspace.audience}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
