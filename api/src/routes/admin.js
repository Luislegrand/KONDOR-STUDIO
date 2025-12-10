// api/src/routes/admin.js
// Namespace /api/admin responsável pelo painel mestre (Control Center)

const express = require('express');
const ensureSuperAdmin = require('../middleware/ensureSuperAdmin');
const { prisma } = require('../prisma');
const { createAccessToken } = require('../utils/jwt');
const crypto = require('crypto');

const router = express.Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const STATUS_LABELS = {
  TRIAL: 'Trial',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
};

const PT_BR_TO_STATUS = {
  TRIAL: 'TRIAL',
  ATIVO: 'ACTIVE',
  ATIVA: 'ACTIVE',
  ACTIVE: 'ACTIVE',
  SUSPENSO: 'SUSPENDED',
  SUSPENSA: 'SUSPENDED',
  SUSPENSOS: 'SUSPENDED',
  INATIVO: 'SUSPENDED',
  INATIVA: 'SUSPENDED',
  CANCELADO: 'CANCELLED',
  CANCELADA: 'CANCELLED',
  CANCELLED: 'CANCELLED',
};

const LOG_LEVELS = new Set(['ERROR', 'WARN', 'INFO']);
const JOB_STATUS = new Set(['FAILED', 'COMPLETED', 'RETRYING']);
const NOTE_SEVERITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

const ROLE_LABELS = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Membro',
  CLIENT: 'Cliente',
  GUEST: 'Convidado',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_ALIASES = {
  DONO: 'OWNER',
  PROPRIETARIO: 'OWNER',
  PROPRIETÁRIO: 'OWNER',
  ADMINISTRADOR: 'ADMIN',
  ADMINISTRADORA: 'ADMIN',
  ADMINISTRATOR: 'ADMIN',
  MEMBRO: 'MEMBER',
  MEMBROS: 'MEMBER',
  CLIENTE: 'CLIENT',
  CLIENTES: 'CLIENT',
  CONVIDADO: 'GUEST',
  CONVIDADA: 'GUEST',
  SUPERADMIN: 'SUPER_ADMIN',
  SUPERADMINISTRADOR: 'SUPER_ADMIN',
};

const USER_STATUS_ALIASES = {
  ACTIVE: true,
  ATIVO: true,
  ATIVA: true,
  TRUE: true,
  '1': true,
  INACTIVE: false,
  INATIVO: false,
  INATIVA: false,
  DESATIVADO: false,
  DESATIVADA: false,
  FALSE: false,
  '0': false,
};

const IMPERSONATION_TOKEN_EXPIRES_IN = process.env.IMPERSONATION_TOKEN_EXPIRES_IN || '1h';
const IMPERSONATION_SESSION_TTL_MINUTES = Number(
  process.env.IMPERSONATION_SESSION_TTL_MINUTES || 90
);

function calcSessionExpiresAt() {
  const minutes = Number.isFinite(IMPERSONATION_SESSION_TTL_MINUTES)
    ? IMPERSONATION_SESSION_TTL_MINUTES
    : 90;
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires;
}

function buildTokenHash(prefix = 'session') {
  return `${prefix}:${crypto.randomBytes(24).toString('hex')}`;
}

function computeExpiryDateFromString(expiresIn) {
  try {
    const lower = String(expiresIn || '').toLowerCase().trim();
    if (!lower) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }
    if (lower.endsWith('d')) {
      const days = parseInt(lower.slice(0, -1), 10);
      const d = new Date();
      d.setDate(d.getDate() + (Number.isFinite(days) ? days : 1));
      return d;
    }
    if (lower.endsWith('h')) {
      const hours = parseInt(lower.slice(0, -1), 10);
      const d = new Date();
      d.setHours(d.getHours() + (Number.isFinite(hours) ? hours : 1));
      return d;
    }
    if (lower.endsWith('m')) {
      const mins = parseInt(lower.slice(0, -1), 10);
      const d = new Date();
      d.setMinutes(d.getMinutes() + (Number.isFinite(mins) ? mins : 30));
      return d;
    }
  } catch (err) {}

  const fallback = new Date();
  fallback.setHours(fallback.getHours() + 1);
  return fallback;
}

function normalizeStatus(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (STATUS_LABELS[normalized]) return normalized;
  if (PT_BR_TO_STATUS[normalized]) return PT_BR_TO_STATUS[normalized];
  return null;
}

function normalizeRole(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  if (ROLE_LABELS[normalized]) return normalized;
  if (ROLE_ALIASES[normalized]) return ROLE_ALIASES[normalized];
  return null;
}

function normalizeUserStatus(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toUpperCase();
  if (USER_STATUS_ALIASES.hasOwnProperty(normalized)) {
    return USER_STATUS_ALIASES[normalized];
  }
  return null;
}

function normalizeSource(value) {
  if (!value) return null;
  return String(value).trim().toUpperCase();
}

function normalizeLogLevel(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return LOG_LEVELS.has(normalized) ? normalized : null;
}

function normalizeJobStatus(value) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase();
  return JOB_STATUS.has(normalized) ? normalized : null;
}

function parseDateParam(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeSeverity(value) {
  if (!value) return 'MEDIUM';
  const normalized = String(value).trim().toUpperCase();
  return NOTE_SEVERITIES.has(normalized) ? normalized : 'MEDIUM';
}

async function fetchPrimaryContacts(tenantIds) {
  if (!tenantIds.length) return {};
  const users = await prisma.user.findMany({
    where: {
      tenantId: { in: tenantIds },
      role: { in: ['OWNER', 'ADMIN'] },
      isActive: true,
    },
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, email: true, role: true, tenantId: true, createdAt: true },
  });

  const priority = { OWNER: 1, ADMIN: 2 };
  return users.reduce((acc, user) => {
    const existing = acc[user.tenantId];
    if (!existing) {
      acc[user.tenantId] = user;
      return acc;
    }

    const existingPriority = priority[existing.role] || 99;
    const currentPriority = priority[user.role] || 99;

    if (currentPriority < existingPriority) {
      acc[user.tenantId] = user;
    }

    return acc;
  }, {});
}

async function fetchLatestSubscriptions(tenantIds) {
  if (!tenantIds.length) return {};

  const subscriptions = await prisma.subscription.findMany({
    where: { tenantId: { in: tenantIds } },
    orderBy: [{ tenantId: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      tenantId: true,
      status: true,
      currentPeriodEnd: true,
      currentPeriodStart: true,
      planId: true,
    },
  });

  const map = {};
  for (const sub of subscriptions) {
    if (!map[sub.tenantId]) {
      map[sub.tenantId] = sub;
    }
  }
  return map;
}

function serializeTenant(tenant, contact, subscription) {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    statusLabel: STATUS_LABELS[tenant.status] || tenant.status,
    billingCustomerId: tenant.billingCustomerId,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    plan: tenant.plan
      ? {
          id: tenant.plan.id,
          key: tenant.plan.key,
          name: tenant.plan.name,
          priceCents: tenant.plan.priceCents,
          interval: tenant.plan.interval,
        }
      : null,
    primaryContact: contact
      ? {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          role: contact.role,
        }
      : null,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
  };
}

function serializeUser(user, lastLoginAt) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: ROLE_LABELS[user.role] || user.role,
    isActive: user.isActive,
    lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Garante que todo endpoint abaixo exija SUPER_ADMIN
router.use(ensureSuperAdmin);

// GET /api/admin/overview (placeholder até fase futura)
router.get('/overview', (req, res) => {
  return res.json({
    overview: {
      tenants: { total: 0, ativos: 0, trial: 0, suspensos: 0 },
      usuarios: { total: 0 },
    },
    status: 'stub',
  });
});

// GET /api/admin/tenants
router.get('/tenants', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const search = req.query.search ? String(req.query.search).trim() : null;
    const status = normalizeStatus(req.query.status);

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [total, tenants] = await prisma.$transaction([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const tenantIds = tenants.map((tenant) => tenant.id);
    const [contactMap, subscriptionMap] = await Promise.all([
      fetchPrimaryContacts(tenantIds),
      fetchLatestSubscriptions(tenantIds),
    ]);

    const serialized = tenants.map((tenant) =>
      serializeTenant(tenant, contactMap[tenant.id], subscriptionMap[tenant.id])
    );

    return res.json({
      tenants: serialized,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
      },
      filters: {
        status: status || null,
        search: search || null,
      },
    });
  } catch (error) {
    console.error('[ADMIN] GET /tenants error', error);
    return res.status(500).json({ error: 'Erro ao listar tenants' });
  }
});

// GET /api/admin/tenants/:id
router.get('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            clients: true,
            projects: true,
            posts: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const [contactMap, subscription] = await Promise.all([
      fetchPrimaryContacts([tenant.id]),
      prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const response = serializeTenant(tenant, contactMap[tenant.id], subscription);

    return res.json({
      tenant: {
        ...response,
        settings: tenant.settings || {},
        counts: tenant._count,
      },
    });
  } catch (error) {
    console.error('[ADMIN] GET /tenants/:id error', error);
    return res.status(500).json({ error: 'Erro ao carregar tenant' });
  }
});

// GET /api/admin/tenants/:id/users
router.get('/tenants/:id/users', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const search = req.query.search ? String(req.query.search).trim() : null;
    const roleFilter = req.query.role ? normalizeRole(req.query.role) : null;
    const statusFilter = normalizeUserStatus(req.query.status);

    const where = { tenantId: id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (statusFilter !== null) {
      where.isActive = statusFilter;
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          tenantId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const userIds = users.map((user) => user.id);
    const lastLoginMap = {};

    if (userIds.length) {
      const sessions = await prisma.sessionToken.findMany({
        where: { userId: { in: userIds } },
        orderBy: { createdAt: 'desc' },
        take: userIds.length * 3,
        select: { userId: true, createdAt: true, meta: true },
      });

      sessions.forEach((session) => {
        if (!lastLoginMap[session.userId]) {
          lastLoginMap[session.userId] = session.meta?.isImpersonation
            ? null
            : session.createdAt;
        }
      });
    }

    const serializedUsers = users.map((user) =>
      serializeUser(user, lastLoginMap[user.id] || null)
    );

    return res.json({
      tenant,
      users: serializedUsers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
      },
      filters: {
        search: search || null,
        role: roleFilter || null,
        status:
          statusFilter === null
            ? null
            : statusFilter
            ? 'ACTIVE'
            : 'INACTIVE',
      },
    });
  } catch (error) {
    console.error('[ADMIN] GET /tenants/:id/users error', error);
    return res.status(500).json({ error: 'Erro ao listar usuários do tenant' });
  }
});

// PATCH /api/admin/tenants/:id
router.patch('/tenants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status: statusPayload, planKey, planId } = req.body || {};

    const updateData = {};
    let normalizedStatus = null;

    if (statusPayload) {
      normalizedStatus = normalizeStatus(statusPayload);
      if (!normalizedStatus) {
        return res.status(400).json({ error: 'Status inválido' });
      }
      updateData.status = normalizedStatus;
    }

    if (planKey || planId) {
      const planWhere = planId ? { id: planId } : { key: String(planKey).trim() };
      const plan = await prisma.plan.findFirst({ where: planWhere });
      if (!plan) {
        return res.status(404).json({ error: 'Plano não encontrado' });
      }
      updateData.planId = plan.id;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: 'Nenhuma alteração enviada' });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: updateData,
      include: { plan: true },
    });

    const [contactMap, subscription] = await Promise.all([
      fetchPrimaryContacts([updated.id]),
      prisma.subscription.findFirst({
        where: { tenantId: updated.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      tenant: serializeTenant(updated, contactMap[updated.id], subscription),
    });
  } catch (error) {
    console.error('[ADMIN] PATCH /tenants/:id error', error);
    return res.status(500).json({ error: 'Erro ao atualizar tenant' });
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { role: rolePayload, isActive } = req.body || {};

    if (typeof rolePayload === 'undefined' && typeof isActive === 'undefined') {
      return res.status(400).json({ error: 'Nenhuma alteração enviada' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role === 'SUPER_ADMIN') {
      return res
        .status(403)
        .json({ error: 'Usuários SUPER_ADMIN não podem ser alterados por este painel' });
    }

    const updateData = {};

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (typeof rolePayload !== 'undefined') {
      const normalizedRole = normalizeRole(rolePayload);
      if (!normalizedRole) {
        return res.status(400).json({ error: 'Role inválida' });
      }
      if (normalizedRole === 'SUPER_ADMIN') {
        return res
          .status(403)
          .json({ error: 'Atribuição de SUPER_ADMIN não é permitida por esta rota' });
      }
      updateData.role = normalizedRole;
    }

    if (!Object.keys(updateData).length) {
      return res.status(400).json({ error: 'Nenhuma modificação aplicada' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const lastSession = await prisma.sessionToken.findFirst({
      where: { userId: updated.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return res.json({
      user: serializeUser(updated, lastSession ? lastSession.createdAt : null),
    });
  } catch (error) {
    console.error('[ADMIN] PATCH /users/:id error', error);
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// POST /api/admin/impersonate
router.post('/impersonate', async (req, res) => {
  try {
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tenantId: true,
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({ error: 'Usuário está inativo' });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Não é permitido impersonar SUPER_ADMIN' });
    }

    const sessionExpiresAt = calcSessionExpiresAt();
    const sessionRecord = await prisma.sessionToken.create({
      data: {
        userId: targetUser.id,
        tokenHash: buildTokenHash('impersonation'),
        meta: {
          isImpersonation: true,
          superAdminId: req.user.id,
          superAdminEmail: req.user.email || null,
          startedAt: new Date().toISOString(),
        },
        expiresAt: sessionExpiresAt,
      },
    });

    const tokenExpiresAt = computeExpiryDateFromString(IMPERSONATION_TOKEN_EXPIRES_IN);

    const impersonationToken = createAccessToken(
      {
        sub: targetUser.id,
        userId: targetUser.id,
        tenantId: targetUser.tenantId,
        role: targetUser.role,
        impersonated: true,
        superAdminId: req.user.id,
        impersonationSessionId: sessionRecord.id,
      },
      IMPERSONATION_TOKEN_EXPIRES_IN
    );

    await prisma.auditLog.create({
      data: {
        tenantId: targetUser.tenantId,
        userId: req.user.id,
        action: 'IMPERSONATE_START',
        resource: 'user',
        resourceId: targetUser.id,
        ip: req.ip || null,
        meta: {
          impersonatedUserId: targetUser.id,
          impersonatedUserEmail: targetUser.email,
          impersonationSessionId: sessionRecord.id,
        },
      },
    });

    return res.json({
      impersonationToken,
      tokenExpiresAt: tokenExpiresAt.toISOString(),
      sessionId: sessionRecord.id,
      sessionExpiresAt: sessionExpiresAt.toISOString(),
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roleLabel: ROLE_LABELS[targetUser.role] || targetUser.role,
        tenantId: targetUser.tenantId,
        tenantName: targetUser.tenant ? targetUser.tenant.name : null,
      },
    });
  } catch (error) {
    console.error('[ADMIN] POST /impersonate error', error);
    return res.status(500).json({ error: 'Erro ao iniciar impersonate' });
  }
});

// POST /api/admin/impersonate/stop
router.post('/impersonate/stop', async (req, res) => {
  try {
    const { sessionId, impersonatedUserId } = req.body || {};

    if (!sessionId && !impersonatedUserId) {
      return res.status(400).json({ error: 'sessionId ou impersonatedUserId são obrigatórios' });
    }

    let sessionRecord = null;

    if (sessionId) {
      sessionRecord = await prisma.sessionToken.findUnique({
        where: { id: sessionId },
        include: {
          user: { select: { id: true, tenantId: true, email: true, name: true } },
        },
      });
    }

    if (sessionRecord && sessionRecord.meta?.superAdminId && sessionRecord.meta.superAdminId !== req.user.id) {
      return res.status(403).json({ error: 'Este impersonate pertence a outro super admin' });
    }

    let targetInfo = sessionRecord ? sessionRecord.user : null;

    if (!sessionRecord && impersonatedUserId) {
      targetInfo = await prisma.user.findUnique({
        where: { id: impersonatedUserId },
        select: { id: true, tenantId: true, email: true, name: true },
      });
    }

    if (!sessionRecord && !targetInfo) {
      return res.status(404).json({ error: 'Sessão de impersonate não encontrada' });
    }

    if (sessionRecord) {
      const meta = sessionRecord.meta && typeof sessionRecord.meta === 'object'
        ? { ...sessionRecord.meta }
        : {};
      meta.endedAt = new Date().toISOString();
      meta.endedBySuperAdminId = req.user.id;
      await prisma.sessionToken.update({
        where: { id: sessionRecord.id },
        data: { meta },
      });
    }

    if (targetInfo) {
      await prisma.auditLog.create({
        data: {
          tenantId: targetInfo.tenantId,
          userId: req.user.id,
          action: 'IMPERSONATE_END',
          resource: 'user',
          resourceId: targetInfo.id,
          ip: req.ip || null,
          meta: {
            impersonatedUserId: targetInfo.id,
            impersonationSessionId: sessionRecord ? sessionRecord.id : sessionId || null,
          },
        },
      });
    }

    return res.json({ ok: true, sessionId: sessionId || null });
  } catch (error) {
    console.error('[ADMIN] POST /impersonate/stop error', error);
    return res.status(500).json({ error: 'Erro ao encerrar impersonate' });
  }
});

// GET /api/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const search = req.query.search ? String(req.query.search).trim() : null;
    const level = normalizeLogLevel(req.query.level);
    const source = normalizeSource(req.query.source);
    const tenantId = req.query.tenantId ? String(req.query.tenantId) : null;
    const since = parseDateParam(req.query.since);

    const where = {};

    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { stack: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (level) where.level = level;
    if (source) where.source = source;
    if (tenantId) where.tenantId = tenantId;
    if (since) where.createdAt = { gte: since };

    const [total, logs] = await prisma.$transaction([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tenant: { select: { id: true, name: true } },
        },
      }),
    ]);

    const serialized = logs.map((log) => ({
      id: log.id,
      level: log.level,
      source: log.source,
      message: log.message,
      stack: log.stack,
      tenantId: log.tenantId,
      tenantName: log.tenant ? log.tenant.name : null,
      metadata: log.metadata || null,
      createdAt: log.createdAt,
    }));

    return res.json({
      logs: serialized,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
      },
      filters: {
        search: search || null,
        level: level || null,
        source: source || null,
        tenantId: tenantId || null,
        since: since ? since.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('[ADMIN] GET /logs error', error);
    return res.status(500).json({ error: 'Erro ao listar logs' });
  }
});

// GET /api/admin/jobs
router.get('/jobs', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const queue = req.query.queue ? String(req.query.queue).trim() : null;
    const status = normalizeJobStatus(req.query.status) || 'FAILED';
    const tenantId = req.query.tenantId ? String(req.query.tenantId) : null;
    const search = req.query.search ? String(req.query.search).trim() : null;
    const since = parseDateParam(req.query.since);

    const where = {};
    if (queue) where.queue = queue;
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.error = { contains: search, mode: 'insensitive' };
    }
    if (since) where.createdAt = { gte: since };

    const [total, jobs] = await prisma.$transaction([
      prisma.jobLog.count({ where }),
      prisma.jobLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({
      jobs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: pageSize ? Math.ceil(total / pageSize) : 0,
      },
      filters: {
        queue: queue || null,
        status: status || null,
        tenantId: tenantId || null,
        search: search || null,
        since: since ? since.toISOString() : null,
      },
    });
  } catch (error) {
    console.error('[ADMIN] GET /jobs error', error);
    return res.status(500).json({ error: 'Erro ao listar jobs' });
  }
});

// GET /api/admin/tenants/:id/notes
router.get('/tenants/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const notes = await prisma.tenantNote.findMany({
      where: { tenantId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const serialized = notes.map((note) => ({
      id: note.id,
      title: note.title,
      body: note.body,
      severity: note.severity,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      author: note.author
        ? {
            id: note.author.id,
            name: note.author.name,
            email: note.author.email,
          }
        : null,
    }));

    return res.json({ tenant, notes: serialized });
  } catch (error) {
    console.error('[ADMIN] GET /tenants/:id/notes error', error);
    return res.status(500).json({ error: 'Erro ao listar notas' });
  }
});

// POST /api/admin/tenants/:id/notes
router.post('/tenants/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, severity } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const normalizedSeverity = normalizeSeverity(severity);

    const note = await prisma.tenantNote.create({
      data: {
        tenantId: tenant.id,
        title: title.toString().trim(),
        body: body.toString().trim(),
        severity: normalizedSeverity,
        authorId: req.user?.id || null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: req.user?.id || null,
        action: 'TENANT_NOTE_CREATE',
        resource: 'tenant_note',
        resourceId: note.id,
        ip: req.ip || null,
        meta: {
          severity: normalizedSeverity,
          title: note.title,
        },
      },
    });

    return res.status(201).json({
      note: {
        id: note.id,
        title: note.title,
        body: note.body,
        severity: note.severity,
        createdAt: note.createdAt,
        author: note.author
          ? {
              id: note.author.id,
              name: note.author.name,
              email: note.author.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[ADMIN] POST /tenants/:id/notes error', error);
    return res.status(500).json({ error: 'Erro ao criar nota' });
  }
});

module.exports = router;
