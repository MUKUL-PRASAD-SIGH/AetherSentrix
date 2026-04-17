import React from "react";

export function ConnectionGuide({ apiBaseUrl, issue, loading, onRetry, onOpenConsole }) {
  return (
    <section className="setup-panel">
      <div className="setup-hero">
        <div className="eyebrow">Getting Started</div>
        <h2>Connect the backend, then the full bank-security workspace unlocks.</h2>
        <p>
          Right now the website cannot reach the API, so instead of showing dead
          charts and empty bank modules, this screen gives you the exact next
          step.
        </p>
        <div className="setup-actions">
          <button className="primary-button" onClick={onRetry} disabled={loading}>
            {loading ? "Reconnecting..." : "Retry Connection"}
          </button>
          <button className="secondary-button" onClick={onOpenConsole}>
            Configure Host
          </button>
        </div>
      </div>

      <div className="setup-grid">
        <div className="setup-card">
          <span>Error trace</span>
          <p>{issue?.message || "Verify the backend endpoint is up and cross-origin requests are allowed."}</p>
        </div>
        <div className="setup-card">
          <span>Start the API</span>
          <pre>{`cd "c:\\Users\\Mukul Prasad\\Desktop\\PROJECTS\\AS\\AetherSentrix"\npython -m core.api`}</pre>
        </div>
        <div className="setup-card">
          <span>Then refresh</span>
          <p>
            Once `http://127.0.0.1:8080/health` responds, hit `Retry Connection`
            and the live portal plus operator console will populate.
          </p>
        </div>
      </div>
    </section>
  );
}
