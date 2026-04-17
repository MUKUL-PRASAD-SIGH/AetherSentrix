import React from "react";

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
