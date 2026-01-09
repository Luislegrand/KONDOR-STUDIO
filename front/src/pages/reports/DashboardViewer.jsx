import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import GridLayout, { useContainerWidth } from "react-grid-layout";
import PageShell from "@/components/ui/page-shell.jsx";
import { Button } from "@/components/ui/button.jsx";
import { DateField } from "@/components/ui/date-field.jsx";
import { base44 } from "@/apiClient/base44Client";

function toDateKey(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildLayout(widgets, layoutSchema) {
  if (Array.isArray(layoutSchema) && layoutSchema.length) return layoutSchema;
  if (!Array.isArray(widgets)) return [];
  return widgets.map((widget, index) => ({
    i: widget.id || `w-${index + 1}`,
    x: (index * 4) % 12,
    y: Math.floor(index / 3) * 4,
    w: 4,
    h: 4,
  }));
}

export default function DashboardViewer() {
  const { dashboardId } = useParams();
  const navigate = useNavigate();
  const { width, containerRef } = useContainerWidth({
    measureBeforeMount: true,
    initialWidth: 960,
  });

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["reporting-dashboard", dashboardId],
    queryFn: () => base44.reporting.getDashboard(dashboardId),
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!dashboard) return;
    const filters = dashboard.globalFiltersSchema || {};
    if (!dateFrom && filters.dateFrom) setDateFrom(filters.dateFrom);
    if (!dateTo && filters.dateTo) setDateTo(filters.dateTo);
    if (!dateFrom && !filters.dateFrom) {
      const today = new Date();
      const from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateFrom(toDateKey(from));
      setDateTo(toDateKey(today));
    }
  }, [dashboard, dateFrom, dateTo]);

  const widgets = useMemo(
    () => (dashboard?.widgetsSchema || []).map((w) => ({ ...w })),
    [dashboard]
  );
  const layout = useMemo(
    () => buildLayout(widgets, dashboard?.layoutSchema || []),
    [widgets, dashboard]
  );

  const { data: liveData, isFetching } = useQuery({
    queryKey: ["reporting-dashboard-data", dashboardId, dateFrom, dateTo],
    queryFn: () =>
      base44.reporting.queryDashboardData(dashboardId, {
        dateFrom,
        dateTo,
        filters: { dateFrom, dateTo },
      }),
    enabled: Boolean(dashboardId && dateFrom && dateTo && widgets.length),
  });

  const refreshMutation = useMutation({
    mutationFn: () =>
      base44.reporting.queryDashboardData(dashboardId, {
        dateFrom,
        dateTo,
        filters: { dateFrom, dateTo },
      }),
  });

  const liveByWidget = useMemo(() => {
    const items = liveData?.widgets || [];
    return items.reduce((acc, item) => {
      if (item?.widgetId) acc[item.widgetId] = item;
      return acc;
    }, {});
  }, [liveData]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="h-48 rounded-[18px] border border-[var(--border)] bg-white/70 animate-pulse" />
      </PageShell>
    );
  }

  if (!dashboard) {
    return (
      <PageShell>
        <div className="rounded-[18px] border border-[var(--border)] bg-white px-6 py-6 text-center">
          Dashboard nao encontrado.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Dashboard ao vivo
            </p>
            <h1 className="text-2xl font-semibold text-[var(--text)]">
              {dashboard.name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => navigate("/reports/dashboards")}>
              Voltar
            </Button>
            <Button
              variant="secondary"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isLoading}
            >
              {refreshMutation.isLoading ? "Atualizando..." : "Atualizar dados"}
            </Button>
          </div>
        </div>

        <section className="rounded-[18px] border border-[var(--border)] bg-white px-6 py-5 shadow-[var(--shadow-sm)]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Periodo inicial</p>
              <DateField value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">Periodo final</p>
              <DateField value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="flex items-end text-xs text-[var(--text-muted)]">
              {isFetching ? "Atualizando indicadores..." : "Dados ao vivo."}
            </div>
          </div>
        </section>

        {widgets.length ? (
          <section className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)]">
            <div ref={containerRef}>
              <GridLayout
                layout={layout}
                cols={12}
                rowHeight={32}
                margin={[16, 16]}
                width={width}
                isDraggable={false}
                isResizable={false}
              >
                {widgets.map((widget) => {
                  const live = liveByWidget[widget.id];
                  const data = live?.data || null;
                  const totals =
                    data && typeof data.totals === "object" ? data.totals : {};
                  const metrics = Array.isArray(widget.metrics)
                    ? widget.metrics
                    : [];
                  const primaryMetric = metrics[0] || null;
                  const primaryValue =
                    primaryMetric && totals
                      ? totals[primaryMetric]
                      : null;

                  return (
                    <div
                      key={widget.id}
                      className="rounded-[12px] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-sm)]"
                    >
                      <p className="text-xs text-[var(--text-muted)]">
                        {widget.widgetType || "Widget"}
                      </p>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {widget.title || "Widget"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {widget.source || "Fonte"}{" "}
                        {widget.level ? `• ${widget.level}` : ""}
                      </p>
                      {live?.error ? (
                        <div className="mt-3 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          {live.error}
                        </div>
                      ) : data ? (
                        <div className="mt-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
                          <p className="text-xs text-[var(--text-muted)]">
                            {primaryMetric || "Metricas"}
                          </p>
                          <p className="text-lg font-semibold text-[var(--text)]">
                            {typeof primaryValue === "number"
                              ? primaryValue.toLocaleString("pt-BR")
                              : primaryMetric
                              ? "-"
                              : `${Object.keys(totals).length} metricas`}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-[10px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)]">
                          Sem dados carregados
                        </div>
                      )}
                    </div>
                  );
                })}
              </GridLayout>
            </div>
          </section>
        ) : (
          <section className="rounded-[18px] border border-[var(--border)] bg-white px-6 py-6 text-sm text-[var(--text-muted)]">
            Nenhum widget configurado neste dashboard.
          </section>
        )}
      </div>
    </PageShell>
  );
}
