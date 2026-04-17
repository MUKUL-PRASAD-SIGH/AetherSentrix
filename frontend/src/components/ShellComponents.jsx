import React from "react";
import { APP_SURFACES, BANK_TEMPLATES, COMPATIBILITY_AREAS, SAAS_CAPABILITIES } from "../constants.js";
import { MetricCard } from "./UIComponents.jsx";

// ─── Surface Navigation ───────────────────────────────────────────────────────

export function ProductSurfaceNav({ activeSurface, onChange }) {
  return (
    <section className="surface-switcher">
      <div>
        <div className="eyebrow">Product Shell</div>
        <h2>One codebase, three clear surfaces.</h2>
      </div>
      <div className="surface-actions" role="tablist" aria-label="Product surfaces">
        {APP_SURFACES.map((surface) => (
          <button
            key={surface.id}
            className={surface.id === activeSurface ? "surface-button active" : "surface-button"}
            onClick={() => onChange(surface.id)}
          >
            {surface.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── SaaS-surface panels ──────────────────────────────────────────────────────

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

export function DeploymentPanel({ backendStatus, alertsCount, endpointCount }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-title">Delivery Slice</div>
          <p className="panel-subtitle">
            Separate product surfaces share one backend telemetry layer and one
            operator console.
          </p>
        </div>
      </div>
      <div className="metric-grid deployment-grid">
        <MetricCard label="Surfaces"          value={APP_SURFACES.length}    accent="cool"    />
        <MetricCard label="Tenant templates"  value={BANK_TEMPLATES.length}  accent="success" />
        <MetricCard label="Endpoints"         value={endpointCount}          accent="warm"    />
        <MetricCard label="Live alerts"       value={alertsCount}            accent="danger"  />
      </div>
      <div className="journey-note">
        <div className="journey-row">Backend status: {backendStatus}</div>
        <div className="journey-row">Customer portal stays separate from the analyst console.</div>
        <div className="journey-row">Tenant templates keep the same product shell adaptable across bank types.</div>
      </div>
    </section>
  );
}

export function SignalRibbon() {
  const items = [
    "Customer and staff journeys",
    "Privileged access guardrails",
    "Risk-scored session review",
    "Simulation-to-detection loop",
  ];
  return (
    <div className="signal-ribbon">
      {items.map((item) => (
        <div key={item} className="signal-pill">
          <span className="signal-dot" />
          {item}
        </div>
      ))}
    </div>
  );
}

// ─── Console entry components ─────────────────────────────────────────────────

export function ConnectionGuide({ apiBaseUrl, issue, loading, onRetry, onOpenConsole }) {
  return (
    <section className="setup-panel">
      <div className="setup-copy">
        <div className="eyebrow">Getting Started</div>
        <h2>Connect the backend, then the full bank-security workspace unlocks.</h2>
        <p>
          Right now the website cannot reach the API, so instead of showing dead
          charts and empty bank modules, this screen gives you the exact next step.
        </p>
        <div className="setup-actions">
          <button className="primary-button" onClick={onRetry} disabled={loading}>
            {loading ? "Checking..." : "Retry Connection"}
          </button>
          <button className="ghost-button" onClick={onOpenConsole}>
            Open Console Anyway
          </button>
        </div>
      </div>
      <div className="setup-stack">
        <div className="setup-card">
          <span>Current target</span>
          <strong>{apiBaseUrl}</strong>
          <p>{issue?.message || "Backend connection has not succeeded yet."}</p>
        </div>
        <div className="setup-card">
          <span>Start the API</span>
          <pre>{`python -m core.api`}</pre>
        </div>
        <div className="setup-card">
          <span>Then refresh</span>
          <p>
            Once `http://127.0.0.1:8080/health` responds, hit Retry Connection
            and the live portal plus operator console will populate.
          </p>
        </div>
      </div>
    </section>
  );
}

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
          <span>alerts in memory</span>
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
