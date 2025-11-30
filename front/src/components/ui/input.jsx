// front/src/components/ui/input.jsx
import React from "react";

/**
 * Input base usado nos formulários
 */

export function Input({ className = "", ...props }) {
  const baseClasses =
    "block w-full rounded-lg border border-gray-300 bg-white " +
    "px-3 py-2 text-sm text-gray-900 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 " +
    "placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed";

  return <input className={`${baseClasses} ${className}`} {...props} />;
}
