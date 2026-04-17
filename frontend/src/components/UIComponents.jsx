import React from "react";

// ─── UI Primitives ────────────────────────────────────────────────────────────

export function Banner({ banner, onDismiss }) {
  return (
    <section className={`banner banner-${banner.tone || "neutral"}`}>
      <div>
        <strong>{banner.title}</strong>
        <p>{banner.message}</p>
      </div>
      <button className="ghost-button small-button" onClick={onDismiss}>
        Dismiss
      </button>
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "neutral" }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}

export function FeatureCard({ title, description }) {
  return (
    <div className="feature-card">
      <span>Capability</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function MetricCard({ label, value, accent }) {
  return (
    <div className={`metric-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export function JsonBlock({ value }) {
  return (
    <pre className="json-block">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
