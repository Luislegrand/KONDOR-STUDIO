// front/src/components/ui/input.jsx
import React from "react";

export function Input({ className = "", ...props }) {
  const baseClasses =
    "block w-full h-10 rounded-[10px] border border-[var(--border)] bg-white " +
    "px-3 text-sm text-[var(--text)] shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.2)] focus:border-[var(--primary)] " +
    "placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed";

  return <input className={`${baseClasses} ${className}`} {...props} />;
}
