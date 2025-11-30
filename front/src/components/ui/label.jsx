// front/src/components/ui/label.jsx
import React from "react";
import clsx from "clsx";

/**
 * Label no padrão shadcn/ui
 *
 * Uso:
 *  <Label htmlFor="nome">Nome</Label>
 */
export function Label({ className, ...props }) {
  return (
    <label
      className={clsx(
        "block text-sm font-medium text-gray-700 mb-1",
        className
      )}
      {...props}
    />
  );
}

export default Label;
