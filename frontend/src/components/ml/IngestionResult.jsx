import React from "react";
import { EmptyState } from "../ui/EmptyState";
import { JsonBlock } from "../ui/JsonBlock";

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
