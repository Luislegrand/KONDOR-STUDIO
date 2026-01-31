const { prisma } = require('../../prisma');

function normalizeId(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(normalizeId).filter(Boolean);
  }
  const single = normalizeId(value);
  return single ? [single] : [];
}

function uniqueIds(list) {
  return Array.from(new Set((list || []).map(normalizeId).filter(Boolean)));
}

function extractAllowedBrands(permissions) {
  if (!permissions || typeof permissions !== 'object') return [];
  const candidates = [
    ...normalizeIdList(permissions.clientIds),
    ...normalizeIdList(permissions.brandIds),
    ...normalizeIdList(permissions.clients),
    ...normalizeIdList(permissions.brands),
    ...normalizeIdList(permissions.clientId),
    ...normalizeIdList(permissions.brandId),
  ];
  return uniqueIds(candidates);
}

function hasBrandScope(scope) {
  return Array.isArray(scope?.allowedBrandIds);
}

function isBrandAllowed(scope, brandId) {
  if (!hasBrandScope(scope)) return true;
  const normalized = normalizeId(brandId);
  if (!normalized) return false;
  return scope.allowedBrandIds.includes(normalized);
}

function assertBrandAccess(brandId, scope) {
  if (!hasBrandScope(scope)) return;
  if (!isBrandAllowed(scope, brandId)) {
    const err = new Error('Acesso negado para este cliente');
    err.status = 403;
    throw err;
  }
}

async function resolveAllowedBrandIds(req) {
  if (!req) return null;
  if (req.reportingScope && Object.prototype.hasOwnProperty.call(req.reportingScope, 'allowedBrandIds')) {
    return req.reportingScope.allowedBrandIds;
  }

  let allowedBrandIds = null;

  if (req.isClientPortal || String(req?.user?.role || '').toUpperCase() === 'CLIENT') {
    const clientId = normalizeId(req.clientId || req.user?.id);
    allowedBrandIds = clientId ? [clientId] : [];
  } else if (req.user?.id && req.tenantId) {
    const member = await prisma.teamMember.findFirst({
      where: { tenantId: req.tenantId, userId: req.user.id },
      select: { permissions: true },
    });
    const ids = extractAllowedBrands(member?.permissions);
    if (ids.length) {
      allowedBrandIds = ids;
    }
  }

  req.reportingScope = { allowedBrandIds };
  return allowedBrandIds;
}

async function attachReportingScope(req, res, next) {
  try {
    await resolveAllowedBrandIds(req);
    return next();
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao resolver escopo de clientes' });
  }
}

module.exports = {
  attachReportingScope,
  resolveAllowedBrandIds,
  hasBrandScope,
  isBrandAllowed,
  assertBrandAccess,
};
