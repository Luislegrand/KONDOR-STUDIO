const { prisma } = require('../../prisma');
const cache = require('./reportingCache.service');

async function listReportSnapshots(tenantId, reportId) {
  const report = await prisma.report.findFirst({
    where: { id: reportId, tenantId },
    include: { widgets: true },
  });

  if (!report) return null;

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
