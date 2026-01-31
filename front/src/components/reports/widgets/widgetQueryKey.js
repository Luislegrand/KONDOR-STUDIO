function normalizeValue(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return keys.reduce((acc, key) => {
      acc[key] = normalizeValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(normalizeValue(value));
}

export function buildWidgetQueryKey({
  connectionId,
  widget,
  filters,
  forceMock = false,
  prefix = "widgetData",
}) {
  const metrics = Array.isArray(widget?.metrics)
    ? [...widget.metrics].map(String).sort()
    : [];
  const widgetFiltersKey = stableStringify(widget?.filters || {});
  const dimensionFiltersKey = stableStringify(filters?.dimensionFilters || []);

  return [
    prefix,
    widget?.id || "",
    widget?.source || "",
    widget?.level || "",
    widget?.breakdown || "",
    widget?.widgetType || "",
    metrics,
    widgetFiltersKey,
    dimensionFiltersKey,
    filters?.dateFrom || "",
    filters?.dateTo || "",
    filters?.compareMode || "",
    filters?.compareDateFrom || "",
    filters?.compareDateTo || "",
    connectionId || "",
    forceMock ? "mock" : "live",
  ];
}
