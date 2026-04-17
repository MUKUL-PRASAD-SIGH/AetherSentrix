import React from "react";

export function FeatureCard({ title, description }) {
  return (
    <div className="feature-card">
      <span>Capability</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
