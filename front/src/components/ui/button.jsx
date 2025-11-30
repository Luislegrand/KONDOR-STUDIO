// front/src/components/ui/button.jsx
import React from "react";

/**
 * Botão base usado em todo o painel
 * - Usa Tailwind
 * - Aceita className extra
 * - Repassa qualquer prop pro <button>
 */
export function Button({ className = "", children, ...props }) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg border border-transparent " +
    "px-4 py-2 text-sm font-medium shadow-sm transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <button
      className={`${baseClasses} bg-purple-600 text-white hover:bg-purple-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
