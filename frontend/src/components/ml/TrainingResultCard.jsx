import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

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
