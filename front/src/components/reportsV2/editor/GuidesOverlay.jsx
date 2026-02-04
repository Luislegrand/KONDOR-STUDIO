import React from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function GuidesOverlay({ guides, width, height }) {
  const hasVertical = Number.isFinite(guides?.vertical);
  const hasHorizontal = Number.isFinite(guides?.horizontal);
  if (!hasVertical && !hasHorizontal) return null;

  const safeWidth = Math.max(0, Number(width) || 0);
  const safeHeight = Math.max(0, Number(height) || 0);
  const vertical = hasVertical ? clamp(guides.vertical, 0, safeWidth) : null;
  const horizontal = hasHorizontal ? clamp(guides.horizontal, 0, safeHeight) : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {Number.isFinite(vertical) ? (
        <div
          className="absolute top-0 w-px"
          style={{
            left: `${vertical}px`,
            height: `${safeHeight}px`,
            backgroundColor: "var(--primary)",
            opacity: 0.5,
          }}
        />
      ) : null}
      {Number.isFinite(horizontal) ? (
        <div
          className="absolute left-0 h-px"
          style={{
            top: `${horizontal}px`,
            width: `${safeWidth}px`,
            backgroundColor: "var(--primary)",
            opacity: 0.5,
          }}
        />
      ) : null}
    </div>
  );
}
