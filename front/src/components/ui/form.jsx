import React from "react";
import { cn } from "@/utils/classnames.js";

export function FormSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={cn(
        "rounded-[16px] border border-[var(--border)] bg-white/90 shadow-[var(--shadow-sm)] " +
          "transition-[box-shadow,border-color] duration-[var(--motion-base)] ease-[var(--ease-standard)] " +
          "hover:border-slate-200/80 hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--primary-light)] text-[var(--primary)]">
                <Icon className="h-5 w-5" />
              </span>
            ) : null}
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
              {description ? (
                <p className="text-xs text-[var(--text-muted)]">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function FormGrid({ children, className = "" }) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>;
}

export function FormRow({ children, className = "" }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

export function FormHint({ children, className = "" }) {
  return <p className={cn("text-[11px] text-[var(--text-muted)]", className)}>{children}</p>;
}

export function FormDivider({ className = "" }) {
  return <div className={cn("h-px bg-[var(--border)]", className)} />;
}

export default FormSection;
