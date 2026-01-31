const { prisma } = require('../../prisma');
const cache = require('./reportingCache.service');
const { hasBrandScope, isBrandAllowed } = require('./reportingScope.service');

async function listReportSnapshots(tenantId, reportId, scope) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, tenantId },
    include: { widgets: true },
  });

  if (!report) return null;
  if (hasBrandScope(scope) && !isBrandAllowed(scope, report.brandId)) {
    const err = new Error('Acesso negado para este cliente');
    err.status = 403;
    throw err;
  }

  const widgets = Array.isArray(report.widgets) ? report.widgets : [];
  const items = [];

  for (const widget of widgets) {
    const key = cache.buildReportSnapshotKey(tenantId, report.id, widget.id);
    const snapshot = await cache.getReportSnapshot(key);
    items.push({
      widgetId: widget.id,
      cacheKey: snapshot?.cacheKey || null,
      generatedAt: snapshot?.generatedAt || null,
      data: snapshot?.data || null,
    });
  }

  return {
    reportId: report.id,
    items,
  };
}

module.exports = {
  listReportSnapshots,
};
