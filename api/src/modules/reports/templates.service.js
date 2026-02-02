const { prisma } = require('../../prisma');
const dashboardsService = require('./dashboards.service');

async function listTemplates(tenantId) {
  return prisma.reportTemplateV2.findMany({
    where: {
      OR: [{ tenantId: null }, { tenantId }],
    },
    orderBy: [
      { tenantId: 'asc' },
      { name: 'asc' },
    ],
  });
}

async function getTemplateForTenant(tenantId, templateId) {
  return prisma.reportTemplateV2.findFirst({
    where: {
      id: templateId,
      OR: [{ tenantId: null }, { tenantId }],
    },
  });
}

async function instantiateTemplate(tenantId, userId, templateId, payload) {
  const template = await getTemplateForTenant(tenantId, templateId);
  if (!template) return null;

  const layout = dashboardsService.ensureLayoutValid(template.layoutJson);
  const name = payload.nameOverride || template.name;

  const dashboard = await dashboardsService.createDashboard(tenantId, userId, {
    name,
    brandId: payload.brandId,
    groupId: payload.groupId ?? null,
    layoutJson: layout,
  });

  return { dashboardId: dashboard.id };
}

module.exports = {
  listTemplates,
  getTemplateForTenant,
  instantiateTemplate,
};
