import React from "react";
import { Button } from "@/components/ui/button.jsx";

function statusLabel(status) {
  const value = String(status || "").toLowerCase();
  if (value === "connected" || value === "active") return "Conectado";
  if (value === "error") return "Erro";
  if (value === "soon") return "Em breve";
  return "Desconectado";
}

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "connected" || value === "active") {
    return "border-emerald-200 text-emerald-700 bg-emerald-50";
  }
  if (value === "error") {
    return "border-red-200 text-red-600 bg-red-50";
  }
  if (value === "soon") {
    return "border-slate-200 text-slate-500 bg-slate-50";
  }
  return "border-amber-200 text-amber-700 bg-amber-50";
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
  meta,
  disabled = false,
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/60 transition-transform hover:-translate-y-1 hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass}`}>
          {icon}
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(status)}`}>
          {statusLabel(status)}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>

      {description ? (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {meta ? (
        <p className="mt-2 text-[11px] text-slate-400">{meta}</p>
      ) : null}

      <div className="mt-5">
        <Button
          onClick={onConnect}
          disabled={disabled}
          className="w-full bg-purple-600 text-white hover:bg-purple-700"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
