import React from "react";
import { buildHeatmap, humanize } from "../../utils/helpers";
import { EmptyState } from "../ui/EmptyState";

export function Heatmap({ alerts }) {
  const matrix = buildHeatmap(alerts);
  if (!matrix.categories.length || !matrix.sources.length) {
    return (
      <EmptyState
        title="No entity heatmap yet"
        description="Heatmap cells appear once alerts with entities are available."
      />
    );
  }
  const gridStyle = {
    gridTemplateColumns: `1.1fr repeat(${Math.max(
      matrix.categories.length,
      1,
    )}, minmax(58px, 1fr))`,
  };

  return (
    <div className="heatmap">
      <div className="heatmap-header" style={gridStyle}>
        <div />
        {matrix.categories.map((cat) => (
          <span key={cat}>{humanize(cat)}</span>
        ))}
      </div>
      {matrix.sources.map((src) => (
        <div key={src} className="heatmap-row" style={gridStyle}>
          <strong>{src}</strong>
          {matrix.categories.map((cat) => {
            const value = matrix.counts[`${src}::${cat}`] || 0;
            const strength = Math.min(1, value / 3);
            return (
              <div
                key={`${src}-${cat}`}
                className="heatmap-cell"
                style={{ opacity: 0.25 + strength * 0.75 }}
                title={`${src} / ${cat}: ${value}`}
              >
                {value}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
