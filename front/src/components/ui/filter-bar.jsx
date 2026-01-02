import React from "react";
import { cn } from "@/utils/classnames.js";

export function FilterBar({ children, className = "" }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default FilterBar;
