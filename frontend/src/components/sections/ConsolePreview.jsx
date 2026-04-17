import React from "react";

export function ConsolePreview({ onOpen, alertsCount, scenariosCount }) {
  return (
    <section className="console-preview">
      <div>
        <div className="eyebrow">Workspace Ready</div>
        <h2>The bank simulation is live. Open the operator console when you want to inspect the security layer.</h2>
        <p>
          Keep the experience user-facing up front, then drop into the analyst
          side only when you want to prove how risky sessions are handled.
        </p>
      </div>
      <div className="console-preview-side">
        <div className="preview-stat">
          <strong>{alertsCount}</strong>
          <span>active alerts</span>
        </div>
        <div className="preview-stat">
          <strong>{scenariosCount}</strong>
          <span>risk scenarios loaded</span>
        </div>
        <button className="primary-button block-button" onClick={onOpen}>
          Open Security Console
        </button>
      </div>
    </section>
  );
}
