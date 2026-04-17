import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";
import { formatMetric } from "../../utils/helpers";

export function ModelMetricsCard({ status }) {
  if (!status?.active_run) {
    return (
      <EmptyState
        title="No active training metrics yet"
        description="Run a training job to view evaluation metrics, label distribution, and accuracy recommendations."
      />
    );
  }

  const classifierMetrics = status.active_run.metrics?.classifier || {};
  const anomalyMetrics = status.active_run.metrics?.anomaly || {};
  const recommendations = status.recommendations || [];

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
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="panel-subtitle">
            No issues flagged yet. Keep adding real labeled traffic and retraining
            after feedback cycles.
          </p>
        )}
      </div>
    </div>
  );
}
