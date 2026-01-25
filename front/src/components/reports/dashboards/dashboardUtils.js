import { getWidgetTypeMeta } from "@/components/reports/widgets/widgetMeta.js";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function buildLayoutFromWidgets(widgets = []) {
  if (!Array.isArray(widgets)) return [];
  return widgets.map((widget, index) => ({
    i: String(widget?.id || widget?.i || `w-${index + 1}`),
    x: (index * 4) % 12,
    y: Math.floor(index / 3) * 4,
    w: 4,
    h: 4,
  }));
}

function getNextY(layout) {
  if (!Array.isArray(layout) || !layout.length) return 0;
  return layout.reduce((max, item) => {
    const y = Number.isFinite(item?.y) ? item.y : 0;
    const h = Number.isFinite(item?.h) ? item.h : 0;
    return Math.max(max, y + h);
  }, 0);
}

export function createLayoutItem(id, layout) {
  const safeLayout = Array.isArray(layout) ? layout : [];
  const nextY = getNextY(safeLayout);
  const nextX = (safeLayout.length * 4) % 12;
  return {
    i: String(id),
    x: nextX,
    y: nextY,
    w: 4,
    h: 4,
  };
}

export function normalizeLayout(layout = [], widgets = []) {
  const widgetList = Array.isArray(widgets) ? widgets : [];
  if (!Array.isArray(layout) || !layout.length) {
    return buildLayoutFromWidgets(widgetList);
  }

  const widgetIds = new Set(
    widgetList.map((widget, index) => String(widget?.id || widget?.i || `w-${index + 1}`))
  );
  const seen = new Set();
  const normalized = layout
    .filter((item) => item && (item.i || item.id))
    .map((item, index) => {
      const i = String(item.i ?? item.id ?? `w-${index + 1}`);
      const x = Number.isFinite(item.x) ? item.x : (index * 4) % 12;
      const y = Number.isFinite(item.y) ? item.y : Math.floor(index / 3) * 4;
      const w = Number.isFinite(item.w) && item.w > 0 ? item.w : 4;
      const h = Number.isFinite(item.h) && item.h > 0 ? item.h : 4;
      return { i, x, y, w, h };
    })
    .filter((item) => {
      if (seen.has(item.i)) return false;
      seen.add(item.i);
      return widgetIds.size ? widgetIds.has(item.i) : true;
    });

  if (!normalized.length && widgetList.length) {
    return buildLayoutFromWidgets(widgetList);
  }
  return normalized;
}

export function normalizeWidgets(widgets = []) {
  if (!Array.isArray(widgets)) return [];
  return widgets
    .filter((widget) => widget && typeof widget === "object")
    .map((widget, index) => {
      const base = isPlainObject(widget) ? { ...widget } : {};
      const widgetType = base.widgetType || base.type || "KPI";
      const id = base.id || base.i || `w-${index + 1}`;
      return {
        ...base,
        id: String(id),
        widgetType,
        title:
          base.title ||
          `${getWidgetTypeMeta(widgetType)?.label || "Widget"} widget`,
        source: base.source || "",
        connectionId: base.connectionId || "",
        brandId: base.brandId || "",
        inheritBrand: base.inheritBrand !== false,
        level: base.level || "",
        breakdown: base.breakdown || "",
        metrics: Array.isArray(base.metrics) ? base.metrics : [],
        filters: isPlainObject(base.filters) ? base.filters : {},
        options: isPlainObject(base.options) ? base.options : {},
      };
    });
}
