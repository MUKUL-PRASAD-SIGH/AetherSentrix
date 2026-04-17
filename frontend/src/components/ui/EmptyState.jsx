import React from "react";

export function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}
