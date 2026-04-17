import React from "react";
import { APP_SURFACES } from "../../utils/constants";

export function ProductSurfaceNav({ activeSurface, onChange }) {
  return (
    <section className="surface-switcher">
      <div>
        <div className="eyebrow">Product Shell</div>
        <h2>One codebase, three clear surfaces.</h2>
      </div>
      <div className="surface-actions" role="tablist" aria-label="Product surfaces">
        {APP_SURFACES.map((surface) => (
          <button
            key={surface.id}
            className={surface.id === activeSurface ? "surface-button active" : "surface-button"}
            onClick={() => onChange(surface.id)}
          >
            {surface.label}
          </button>
        ))}
      </div>
    </section>
  );
}
