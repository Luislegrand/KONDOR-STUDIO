import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/classnames.js";

export function SelectNative({
  className = "",
  selectClassName = "",
  children,
  ...props
}) {
  return (
    <div className={cn("relative", className)}>
      <select className={cn("k-select", selectClassName)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
    </div>
  );
}

export default SelectNative;
