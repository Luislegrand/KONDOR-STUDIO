import React from "react";
import WidgetRenderer from "./WidgetRenderer.jsx";
import WidgetEmptyState from "@/components/reports/widgets/WidgetEmptyState.jsx";
import { normalizeLayoutFront, getActivePage } from "./utils.js";

function buildGridStyle(layout) {
  const x = Number(layout?.x || 0);
  const y = Number(layout?.y || 0);
  const w = Number(layout?.w || 12);
  const h = Number(layout?.h || 4);
  return {
    gridColumnStart: x + 1,
    gridColumnEnd: x + w + 1,
    gridRowStart: y + 1,
    gridRowEnd: y + h + 1,
    minHeight: "100%",
  };
}

export default function DashboardRenderer({
  layout,
  dashboardId,
  brandId,
  publicToken,
  activePageId,
  globalFilters,
  healthIssuesByWidgetId,
  fetchReason,
  onWidgetStatusesChange,
}) {
  const normalized = normalizeLayoutFront(layout);
  const activePage = getActivePage(normalized, activePageId);
  const widgets = Array.isArray(activePage?.widgets) ? activePage.widgets : [];
  const [widgetStatuses, setWidgetStatuses] = React.useState({});
  const widgetIdsKey = React.useMemo(
    () => widgets.map((widget) => widget?.id).filter(Boolean).join("|"),
    [widgets]
  );
  const widgetIds = React.useMemo(
    () => (widgetIdsKey ? widgetIdsKey.split("|").filter(Boolean) : []),
    [widgetIdsKey]
  );

  React.useEffect(() => {
    setWidgetStatuses((prev) => {
      const next = {};
      widgetIds.forEach((widgetId) => {
        next[widgetId] = prev?.[widgetId] || { status: "loading", reason: null };
      });
      const prevKeys = Object.keys(prev || {});
      if (
        prevKeys.length === widgetIds.length &&
        widgetIds.every((widgetId) => {
          const previous = prev?.[widgetId] || { status: "loading", reason: null };
          const current = next[widgetId];
          return (
            previous.status === current.status && previous.reason === current.reason
          );
        })
      ) {
        return prev;
      }
      return next;
    });
  }, [widgetIds, widgetIdsKey]);

  const resolvedStatuses = React.useMemo(() => {
    const next = {};
    widgets.forEach((widget) => {
      if (!widget?.id) return;
      next[widget.id] = widgetStatuses?.[widget.id] || {
        status: "loading",
        reason: null,
      };
    });
    return next;
  }, [widgetStatuses, widgets]);

  React.useEffect(() => {
    if (!onWidgetStatusesChange) return;
    onWidgetStatusesChange({
      pageId: activePage?.id || null,
      statuses: resolvedStatuses,
    });
  }, [activePage?.id, onWidgetStatusesChange, resolvedStatuses]);

  const handleWidgetStatusChange = React.useCallback((widgetId, payload) => {
    if (!widgetId) return;
    setWidgetStatuses((prev) => {
      const current = prev?.[widgetId];
      const nextPayload = {
        status: payload?.status || "loading",
        reason: payload?.reason || null,
      };
      if (
        current &&
        current.status === nextPayload.status &&
        current.reason === nextPayload.reason
      ) {
        return prev;
      }
      return {
        ...(prev || {}),
        [widgetId]: nextPayload,
      };
    });
  }, []);

  if (!widgets.length) {
    return (
      <WidgetEmptyState
        title="Nenhum widget configurado"
        description="Este dashboard ainda nao possui widgets."
        variant="no-data"
      />
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        gridAutoRows: "28px",
      }}
    >
      {widgets.map((widget) => {
        const hasTitle = Boolean(String(widget?.title || "").trim());
        const showTitle = widget?.viz?.options?.showTitle !== false;
        const showHeader = showTitle && (widget?.type !== "text" || hasTitle);
        return (
          <div
            key={widget.id}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-none transition-shadow hover:shadow-[var(--shadow-sm)]"
            style={buildGridStyle(widget.layout)}
          >
            {showHeader ? (
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">
                    {widget.title || "Widget"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {String(widget.type || "").toUpperCase()}
                  </p>
                </div>
              </div>
            ) : null}
            <div
              className={
                showHeader
                  ? "h-[calc(100%-48px)] min-h-[120px]"
                  : "h-full min-h-[120px]"
              }
            >
              <WidgetRenderer
                widget={widget}
                dashboardId={dashboardId}
                brandId={brandId}
                publicToken={publicToken}
                pageId={activePage?.id}
                globalFilters={globalFilters}
                healthIssue={healthIssuesByWidgetId?.[widget.id] || null}
                fetchReason={fetchReason}
                onStatusChange={handleWidgetStatusChange}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
