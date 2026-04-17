import React from "react";
import {
  buildAlertSummary, buildCompactEntity, formatMetric, formatTimestamp, humanize,
} from "../utils.js";
import { EmptyState, JsonBlock } from "./UIComponents.jsx";

// ─── Simulation Components ────────────────────────────────────────────────────

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
          <span key={item} className="chip">{item}</span>
        ))}
      </div>
    </div>
  );
}

export function SimulationSummary({ report, alert }) {
  if (!report) {
    return (
      <EmptyState
        title="No simulation executed"
        description="Select a scenario and run it to see events and the resulting alert."
      />
    );
  }
  return (
    <div className="simulation-summary">
      <div className="mini-row wrap">
        <span className="chip">{report.simulation_id}</span>
        <span className="chip">{report.events_generated} events</span>
        <span className="chip">{humanize(report.scenario || "unknown")}</span>
      </div>
      <p>{report.description}</p>
      {alert ? (
        <div className="alert-inline">
          <strong>{humanize(alert.threat_category || "unknown")}</strong>
          <p>{buildAlertSummary(alert)}</p>
        </div>
      ) : null}
      <JsonBlock value={(report.events || []).slice(0, 6)} />
    </div>
  );
}

export function IngestionResult({ result }) {
  if (!result) {
    return (
      <EmptyState
        title="No ingestion result yet"
        description="Submit JSON events or syslog lines to inspect normalized output."
      />
    );
  }
  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{result.ingested} ingested</span>
        {result.alert ? <span className="chip">alert generated</span> : null}
      </div>
      <JsonBlock value={result.events} />
      {result.alert ? <JsonBlock value={result.alert} /> : null}
    </div>
  );
}

export function BatchResult({ result }) {
  if (!result) {
    return (
      <EmptyState
        title="No batch result yet"
        description="Submit an array of event arrays to exercise the live batch detection endpoint."
      />
    );
  }
  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{result.count} alerts returned</span>
      </div>
      <JsonBlock value={result.alerts} />
    </div>
  );
}

// ─── Model Components ─────────────────────────────────────────────────────────

export function ModeStatusCard({ status }) {
  if (!status) {
    return (
      <EmptyState
        title="Model status unavailable"
        description="Reconnect the backend to load active model mode and version information."
      />
    );
  }
  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">{status.active_mode || "synthetic"}</span>
        <span className="chip">{status.active_version || "no real version yet"}</span>
        <span className="chip">{status.real_mode_available ? "real-ready" : "synthetic-only"}</span>
      </div>
      <JsonBlock
        value={{
          active_mode:          status.active_mode,
          active_version:       status.active_version,
          real_mode_available:  status.real_mode_available,
        }}
      />
    </div>
  );
}

export function TrainingResultCard({ run }) {
  if (!run) {
    return (
      <EmptyState
        title="No training run yet"
        description="Train a synthetic or real dataset profile to generate a versioned artifact."
      />
    );
  }
  return (
    <div className="ingest-result">
      <div className="mini-row wrap">
        <span className="chip">{run.version}</span>
        <span className="chip">{run.dataset_name}</span>
        <span className="chip">{run.source_mode}</span>
      </div>
      <JsonBlock value={run.metrics} />
    </div>
  );
}

export function ModelMetricsCard({ status }) {
  if (!status?.active_run) {
    return (
      <EmptyState
        title="No active training metrics yet"
        description="Run a training job to view evaluation metrics, label distribution, and accuracy recommendations."
      />
    );
  }
  const classifierMetrics  = status.active_run.metrics?.classifier || {};
  const anomalyMetrics     = status.active_run.metrics?.anomaly    || {};
  const recommendations    = status.recommendations || [];

  return (
    <div className="model-metrics-grid">
      <div className="metric-card accent-success">
        <span>Classifier Accuracy</span>
        <strong>{formatMetric(classifierMetrics.accuracy)}</strong>
      </div>
      <div className="metric-card accent-cool">
        <span>Macro F1</span>
        <strong>{formatMetric(classifierMetrics.macro_f1)}</strong>
      </div>
      <div className="metric-card accent-warm">
        <span>Anomaly Recall</span>
        <strong>{formatMetric(anomalyMetrics.recall)}</strong>
      </div>
      <div className="metric-card accent-danger">
        <span>Anomaly F1</span>
        <strong>{formatMetric(anomalyMetrics.f1)}</strong>
      </div>
      <div className="panel-subsection">
        <h4>Latest Run</h4>
        <JsonBlock value={status.active_run} />
      </div>
      <div className="panel-subsection">
        <h4>Accuracy Improvement Notes</h4>
        {recommendations.length ? (
          <ul className="flat-list">
            {recommendations.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p className="panel-subtitle">
            No issues flagged yet. Keep adding real labeled traffic and retraining after feedback cycles.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Ops Components ───────────────────────────────────────────────────────────

export function HealthCard({ health }) {
  if (!health) {
    return (
      <EmptyState
        title="Assistant health unavailable"
        description="Reconnect the backend to load assistant health information."
      />
    );
  }
  return (
    <div className="health-card">
      <div className="mini-row wrap">
        <span className="chip">{health.configured ? "configured" : "not configured"}</span>
        <span className="chip">{health.model || "unknown model"}</span>
        <span className="chip">{health.last_success_at || "no successful call yet"}</span>
      </div>
      {health.last_error ? <JsonBlock value={health.last_error} /> : null}
    </div>
  );
}

export function EndpointMatrix() {
  const entries = [
    "GET /health",           "GET /assistant/health",  "GET /ingestion/health",
    "GET /scenarios",        "GET /alerts/recent",     "GET /events/recent",
    "GET /ml/status",        "POST /ingest",           "POST /ingest/syslog",
    "POST /detect",          "POST /detect/batch",     "POST /demo/run",
    "POST /simulate",        "POST /ml/train",         "POST /ml/mode",
    "POST /assistant",
  ];
  return (
    <div className="endpoint-matrix">
      {entries.map((entry) => (
        <div key={entry} className="endpoint-row">
          <span className="chip">wired</span>
          <strong>{entry}</strong>
        </div>
      ))}
    </div>
  );
}

export function ArchiveList({ items, type }) {
  if (!items.length) {
    return (
      <EmptyState
        title="Nothing archived yet"
        description="Persisted records appear here after ingestion, detection, or demo runs."
      />
    );
  }
  return (
    <div className="archive-list">
      {items.map((item, i) => (
        <div key={`${type}-${i}`} className="archive-card">
          <strong>{formatTimestamp(item.timestamp)}</strong>
          <span>{humanize(item.threat_category || item.event_type || type)}</span>
          <small>{buildCompactEntity(item)}</small>
        </div>
      ))}
    </div>
  );
}
