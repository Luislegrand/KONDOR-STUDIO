const { prisma } = require('../../prisma');

async function listTemplates(tenantId, filters = {}) {
  const where = { tenantId };
  if (filters.visibility) {
    where.visibility = filters.visibility;
  }
  return prisma.reportTemplate.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
}

async function getTemplate(tenantId, id) {
  if (!id) return null;
  return prisma.reportTemplate.findFirst({
    where: { id, tenantId },
  });
}

async function createTemplate(tenantId, payload) {
  return prisma.reportTemplate.create({
    data: {
      tenantId,
      name: payload.name,
      description: payload.description || null,
      visibility: payload.visibility || 'TENANT',
      layoutSchema: payload.layoutSchema || [],
      widgetsSchema: payload.widgetsSchema || [],
      version: 1,
    },
  });
}

async function updateTemplate(tenantId, id, payload) {
  const existing = await getTemplate(tenantId, id);
  if (!existing) return null;

  const updatePayload = {
    name: payload.name || existing.name,
    description:
      payload.description !== undefined ? payload.description : existing.description,
    visibility: payload.visibility || existing.visibility,
    layoutSchema: payload.layoutSchema || existing.layoutSchema || [],
    widgetsSchema: payload.widgetsSchema || existing.widgetsSchema || [],
  };

  if (existing.visibility === 'TENANT' || existing.visibility === 'PUBLIC') {
    return prisma.reportTemplate.create({
      data: {
        tenantId,
        name: updatePayload.name,
        description: updatePayload.description || null,
        visibility: updatePayload.visibility,
        layoutSchema: updatePayload.layoutSchema,
        widgetsSchema: updatePayload.widgetsSchema,
        version: existing.version + 1,
        parentTemplateId: existing.id,
      },
    });
  }

  return prisma.reportTemplate.update({
    where: { id: existing.id },
    data: {
      name: updatePayload.name,
      description: updatePayload.description || null,
      visibility: updatePayload.visibility,
      layoutSchema: updatePayload.layoutSchema,
      widgetsSchema: updatePayload.widgetsSchema,
    },
  });
}

async function duplicateTemplate(tenantId, id, overrides = {}) {
  const existing = await getTemplate(tenantId, id);
  if (!existing) return null;

  const name = overrides.name || `Copia - ${existing.name}`;
  const description =
    overrides.description !== undefined ? overrides.description : existing.description;
  const visibility = overrides.visibility || existing.visibility;

  return prisma.reportTemplate.create({
    data: {
      tenantId,
      name,
      description,
      visibility,
      layoutSchema: existing.layoutSchema || [],
      widgetsSchema: existing.widgetsSchema || [],
      version: 1,
    },
  });
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  duplicateTemplate,
};
