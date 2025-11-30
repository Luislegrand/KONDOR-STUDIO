// front/src/components/ui/textarea.jsx
import React from "react";

/**
 * Textarea simples no padrão shadcn/ui
 *
 * Uso:
 *  <Textarea rows={4} placeholder="Descreva..." />
 */
export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={
        "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm " +
        "shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 " +
        "focus:ring-purple-500 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    />
  );
}

export default Textarea;
