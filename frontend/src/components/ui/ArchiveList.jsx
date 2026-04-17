import React from "react";
import { formatTimestamp, humanize, buildCompactEntity } from "../../utils/helpers";
import { EmptyState } from "./EmptyState";

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
          <span>
            {humanize(item.threat_category || item.event_type || type)}
          </span>
          <small>{buildCompactEntity(item)}</small>
        </div>
      ))}
    </div>
  );
}
