import React from "react";
import { Button } from "@/components/ui/button.jsx";

function statusLabel(status) {
  const value = String(status || "").toLowerCase();
  if (value === "connected" || value === "active") return "Conectado";
  if (value === "error") return "Erro";
  return "Desconectado";
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "connected" || value === "active") {
    return "border-emerald-400/40 text-emerald-300 bg-emerald-400/10";
  }
  if (value === "error") {
    return "border-red-400/40 text-red-300 bg-red-400/10";
  }
  return "border-amber-400/40 text-amber-200 bg-amber-400/10";
}

export default function IntegrationTile({
  title,
  subtitle,
  description,
  status,
  icon,
  accentClass,
  onConnect,
  actionLabel,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/40 transition-transform hover:-translate-y-1 hover:border-slate-500/70">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-500/60 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass}`}>
          {icon}
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(status)}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
      </div>

      {description ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">{description}</p>
      ) : null}

      <div className="mt-5">
        <Button
          onClick={onConnect}
          className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/10"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
