import React from "react";
import { Search, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input.jsx";
import { cn } from "@/utils/classnames.js";

export default function MetricsLibraryPanel({
  platforms = [],
  activePlatform,
  onPlatformChange,
  metrics = [],
  searchTerm = "",
  onSearchChange,
  onMetricClick,
  onMetricDragStart,
}) {
  const filtered = React.useMemo(() => {
    const query = String(searchTerm || "").trim().toLowerCase();
    if (!query) return metrics;
    return metrics.filter((metric) => {
      const label = String(metric.label || metric.value || "").toLowerCase();
      const key = String(metric.value || "").toLowerCase();
      return label.includes(query) || key.includes(query);
    });
  }, [metrics, searchTerm]);

  return (
    <div className="rounded-[16px] border border-[var(--border)] bg-white p-4 shadow-none transition-shadow hover:shadow-[var(--shadow-sm)]">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[var(--text)]">Metricas</p>
        <p className="text-xs text-[var(--text-muted)]">
          Arraste uma metrica para o canvas.
        </p>
      </div>

      {platforms.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const active = platform.value === activePlatform;
            return (
              <button
                key={platform.value}
                type="button"
                onClick={() => onPlatformChange?.(platform.value)}
                className={cn(
                  "rounded-[12px] border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-slate-300"
                )}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Buscar metrica..."
          className="pl-9"
        />
      </div>

      {filtered.length ? (
        <div className="space-y-2">
          {filtered.map((metric) => (
            <button
              key={metric.value}
              type="button"
              draggable
              onDragStart={(event) => onMetricDragStart?.(event, metric)}
              onClick={() => onMetricClick?.(metric)}
              className="flex w-full items-center justify-between rounded-[12px] border border-[var(--border)] bg-white px-3 py-2 text-left text-sm text-[var(--text)] transition hover:border-slate-300 hover:bg-[var(--surface-muted)]"
            >
              <span className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="font-semibold">{metric.label}</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {metric.value}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] px-3 py-4 text-xs text-[var(--text-muted)]">
          Nenhuma metrica encontrada.
        </div>
      )}
    </div>
  );
}
