import React from "react";
import { cn } from "@/utils/classnames.js";

export function PageHeader({ title, subtitle, kicker, actions, className = "" }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center md:justify-between md:pb-7",
        className
      )}
    >
      <div className="absolute -bottom-px left-0 h-[2px] w-28 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--accent-sky)] to-transparent" />
      <div className="space-y-2">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {kicker}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] md:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--text-muted)] md:text-base">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export default PageHeader;
