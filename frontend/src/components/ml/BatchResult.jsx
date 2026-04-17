import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

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
