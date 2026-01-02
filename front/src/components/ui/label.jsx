// front/src/components/ui/label.jsx
import React from "react";
import { cn } from "@/utils/classnames.js";
export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        "block text-sm font-medium text-[var(--text-muted)] mb-1",
        className
      )}
      {...props}
    />
  );
}

export default Label;
