const { prisma } = require('../../prisma');
const reportingData = require('./reportingData.service');
const reportingGeneration = require('./reportingGeneration.service');
const { hasBrandScope, isBrandAllowed, assertBrandAccess } = require('./reportingScope.service');

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeFilters(globalFilters, widgetFilters) {
  const normalizedGlobal = isPlainObject(globalFilters) ? globalFilters : {};
  const normalizedWidget = isPlainObject(widgetFilters) ? widgetFilters : {};
  const mergeDimensionFilters = () => {
    const globalList = Array.isArray(normalizedGlobal.dimensionFilters)
      ? normalizedGlobal.dimensionFilters
      : [];
    const widgetList = Array.isArray(normalizedWidget.dimensionFilters)
      ? normalizedWidget.dimensionFilters
      : [];
    if (!globalList.length && !widgetList.length) return null;
    return [...globalList, ...widgetList];
  };
  const {
    dateFrom,
    dateTo,
    from,
    to,
    compareMode,
    compareDateFrom,
    compareDateTo,
    dimensionFilters,
    ...restGlobal
  } = normalizedGlobal;
  const { dimensionFilters: widgetDimensionFilters, ...restWidget } = normalizedWidget;
  const merged = { ...restGlobal, ...restWidget };
  const mergedDimensionFilters = mergeDimensionFilters();
  if (mergedDimensionFilters && mergedDimensionFilters.length) {
    merged.dimensionFilters = mergedDimensionFilters;
  }
  return merged;
}

function resolveGlobalFilters(dashboard, overrides = {}) {
  const base =
    dashboard?.globalFiltersSchema && isPlainObject(dashboard.globalFiltersSchema)
      ? dashboard.globalFiltersSchema
      : {};
  if (isPlainObject(overrides)) {
    return { ...base, ...overrides };
  }
  return base;
}

async function resolveBrandForGroup(tenantId, groupId) {
  if (!tenantId || !groupId) return null;
  const member = await prisma.brandGroupMember.findFirst({
    where: { tenantId, groupId },
    select: { brandId: true },
    orderBy: { createdAt: 'asc' },
  });
  return member?.brandId || null;
}

async function resolveConnectionForWidget({
  tenantId,
  source,
  connectionId,
  brandId,
  cacheMap,
}) {
  if (connectionId) return connectionId;
  if (!tenantId || !source || !brandId) return null;

  const key = `${brandId}:${source}`;
  if (cacheMap.has(key)) return cacheMap.get(key);

  const connection = await prisma.dataSourceConnection.findFirst({
    where: {
      tenantId,
      brandId,
      source,
      status: 'CONNECTED',
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  const resolved = connection?.id || null;
  cacheMap.set(key, resolved);
  return resolved;
}

function buildLayout(layoutSchema, widgetsSchema) {
  if (Array.isArray(layoutSchema) && layoutSchema.length) return layoutSchema;
  if (!Array.isArray(widgetsSchema)) return [];
  return widgetsSchema.map((widget, index) => ({
    i: widget.id || `w-${index + 1}`,
    x: (index * 4) % 12,
    y: Math.floor(index / 3) * 4,
    w: 4,
    h: 4,
  }));
}

async function listDashboards(tenantId, filters = {}, scope) {
  const where = { tenantId };
  if (filters.scope) where.scope = filters.scope;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.groupId) where.groupId = filters.groupId;
  if (hasBrandScope(scope)) {
    where.scope = 'BRAND';
    where.brandId = { in: scope.allowedBrandIds };
  }

  return prisma.dashboard.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

async function getDashboard(tenantId, id, scope) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id, tenantId },
  });
  if (!dashboard) return null;
  if (hasBrandScope(scope) && !isBrandAllowed(scope, dashboard.brandId)) {
    const err = new Error('Acesso negado para este cliente');
    err.status = 403;
    throw err;
  }
  return dashboard;
}

async function createDashboard(tenantId, payload, scope) {
  if (hasBrandScope(scope)) {
    if (payload.scope !== 'BRAND') {
      const err = new Error('Escopo invalido para este cliente');
      err.status = 403;
      throw err;
    }
    assertBrandAccess(payload.brandId, scope);
  }
  const layoutSchema = buildLayout(payload.layoutSchema, payload.widgetsSchema);

  return prisma.dashboard.create({
    data: {
      tenantId,
      name: payload.name,
      scope: payload.scope,
      brandId: payload.brandId || null,
      groupId: payload.groupId || null,
      layoutSchema,
      widgetsSchema: payload.widgetsSchema || [],
      globalFiltersSchema: payload.globalFiltersSchema || {},
    },
  });
}

async function updateDashboard(tenantId, id, payload, scope) {
  const existing = await getDashboard(tenantId, id, scope);
  if (!existing) return null;

  const data = {
    name: payload.name ?? existing.name,
    scope: payload.scope ?? existing.scope,
    brandId: Object.prototype.hasOwnProperty.call(payload, 'brandId')
      ? payload.brandId
      : existing.brandId,
    groupId: Object.prototype.hasOwnProperty.call(payload, 'groupId')
      ? payload.groupId
      : existing.groupId,
    layoutSchema: payload.layoutSchema ?? existing.layoutSchema,
    widgetsSchema: payload.widgetsSchema ?? existing.widgetsSchema,
    globalFiltersSchema: payload.globalFiltersSchema ?? existing.globalFiltersSchema,
  };

  return prisma.dashboard.update({
    where: { id: existing.id },
    data,
  });
}

async function queryDashboardData(tenantId, id, overrides = {}, scope) {
  const dashboard = await getDashboard(tenantId, id, scope);
  if (!dashboard) return null;

  const globalFilters = resolveGlobalFilters(dashboard, overrides.filters);
  const { dateFrom, dateTo } = reportingGeneration.resolveDateRange(
    {
      dateFrom: globalFilters.dateFrom || globalFilters.from || overrides.dateFrom,
      dateTo: globalFilters.dateTo || globalFilters.to || overrides.dateTo,
    },
    overrides.rangeDays,
  );

  const compareMode = globalFilters.compareMode || overrides.compareMode || null;
  const compareDateFrom =
    globalFilters.compareDateFrom || overrides.compareDateFrom || null;
  const compareDateTo =
    globalFilters.compareDateTo || overrides.compareDateTo || null;

  let effectiveBrandId = null;
  let effectiveGroupId = null;

  if (dashboard.scope === 'BRAND') {
    effectiveBrandId = dashboard.brandId || null;
  } else if (dashboard.scope === 'GROUP') {
    effectiveGroupId = dashboard.groupId || null;
    effectiveBrandId =
      globalFilters.brandId || overrides.brandId || (await resolveBrandForGroup(
        tenantId,
        effectiveGroupId,
      ));
  } else {
    effectiveBrandId = globalFilters.brandId || overrides.brandId || null;
    effectiveGroupId = globalFilters.groupId || overrides.groupId || null;
  }

  const widgets = Array.isArray(dashboard.widgetsSchema)
    ? dashboard.widgetsSchema
    : [];
  const results = [];
  const connectionCache = new Map();

  for (const widget of widgets) {
    if (!widget?.source) {
      results.push({
        widgetId: widget?.id || null,
        error: 'Widget sem fonte configurada',
      });
      continue;
    }

    const inheritBrand = widget?.inheritBrand !== false;
    const widgetBrandId = widget?.brandId || null;
    const resolvedBrandId = inheritBrand ? effectiveBrandId : widgetBrandId;

    if (!resolvedBrandId) {
      results.push({
        widgetId: widget?.id || null,
        error: 'Selecione uma marca para este widget ou defina uma marca global',
      });
      continue;
    }

    const resolvedConnectionId = await resolveConnectionForWidget({
      tenantId,
      source: widget.source,
      connectionId: inheritBrand ? null : widget.connectionId,
      brandId: resolvedBrandId,
      cacheMap: connectionCache,
    });

    const finalConnectionId = inheritBrand
      ? resolvedConnectionId || widget.connectionId
      : widget.connectionId || resolvedConnectionId;

    if (!finalConnectionId) {
      results.push({
        widgetId: widget?.id || null,
        error: 'Widget sem conexao configurada',
      });
      continue;
    }

    try {
      const response = await reportingData.queryMetrics(tenantId, {
        source: widget.source,
        connectionId: finalConnectionId,
        dateFrom,
        dateTo,
        compareMode,
        compareDateFrom,
        compareDateTo,
        level: widget.level || null,
        breakdown: widget.breakdown || null,
        metrics: Array.isArray(widget.metrics) ? widget.metrics : [],
        filters: mergeFilters(
          {
            ...globalFilters,
            brandId: effectiveBrandId,
            groupId: effectiveGroupId,
          },
          widget.filters,
        ),
        options: widget.options || null,
      }, scope);
      results.push({
        widgetId: widget.id,
        data: response.data,
        cached: response.cached,
        cacheKey: response.cacheKey,
      });
    } catch (err) {
      results.push({
        widgetId: widget.id,
        error: err?.message || 'Erro ao consultar widget',
      });
    }
  }

  return {
    dashboardId: dashboard.id,
    scope: dashboard.scope,
    brandId: effectiveBrandId,
    groupId: effectiveGroupId,
    compareMode,
    compareDateFrom,
    compareDateTo,
    dateFrom,
    dateTo,
    widgets: results,
  };
}

module.exports = {
  listDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  queryDashboardData,
};
