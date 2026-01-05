import React from "react";
import { CalendarDays, Clock } from "lucide-react";
import { cn } from "@/utils/classnames.js";
import { Input } from "@/components/ui/input.jsx";

export function DateField({ className = "", inputClassName = "", ...props }) {
  return (
    <div className={cn("relative", className)}>
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <Input type="date" className={cn("pl-9", inputClassName)} {...props} />
    </div>
  );
}

export function TimeField({ className = "", inputClassName = "", ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <Input type="time" className={cn("pl-9", inputClassName)} {...props} />
    </div>
  );
}

export default DateField;
