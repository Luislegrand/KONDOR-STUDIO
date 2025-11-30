// front/src/components/ui/badge.jsx
import React from "react";
import clsx from "clsx";

/**
 * Badge simples no estilo shadcn/ui
 * uso:
 *  <Badge>Ativo</Badge>
 *  <Badge variant="outline">Em análise</Badge>
 */
export function Badge({ className, variant = "default", ...props }) {
  const baseClasses =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";

  const variants = {
    default: "bg-purple-100 text-purple-800 border-transparent",
    outline: "bg-transparent text-gray-700 border-gray-300",
    success: "bg-emerald-100 text-emerald-800 border-transparent",
    warning: "bg-amber-100 text-amber-800 border-transparent",
    danger: "bg-red-100 text-red-800 border-transparent",
  };

  return (
    <span
      className={clsx(baseClasses, variants[variant] || variants.default, className)}
      {...props}
    />
  );
}

export default Badge;
