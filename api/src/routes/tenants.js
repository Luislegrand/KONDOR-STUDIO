const express = require('express');
const router = express.Router();
const { prisma } = require('../prisma');
const { hashPassword, hashToken } = require('../utils/hash');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');

/**
 * POST /tenants/register
 * Rota (hoje protegida por auth na server.js) para criar nova conta
 * (tenant + usuário admin) e iniciar período de uso.
 */
router.post('/register', async (req, res) => {
  const { tenantName, tenantSlug, userName, userEmail, password } = req.body;

  if (!tenantName || !tenantSlug || !userEmail || !password) {
    return res.status(400).json({ error: 'missing fields' });
  }

  try {
    // Garante unicidade básica de slug e email
    const [existingTenant, existingUser] = await Promise.all([
      prisma.tenant.findUnique({ where: { slug: tenantSlug } }),
      prisma.user.findUnique({ where: { email: userEmail } }),
    ]);

    if (existingTenant) {
      return res.status(409).json({ error: 'slug already exists' });
    }

    if (existingUser) {
      return res.status(409).json({ error: 'email already exists' });
    }

    // Criar tenant com settings básicos de branding
    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug: tenantSlug,
        settings: {
          agency_name: tenantName,
          primary_color: '#A78BFA',
          accent_color: '#39FF14',
          logo_url: null,
        },
      },
    });

    // Criar usuário admin (usa campo passwordHash do schema)
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: hashed,
        name: userName,
        tenantId: tenant.id,
        role: 'ADMIN',
      },
    });

    // Tenta localizar o plano "Starter" para vincular trial inicial
    const now = new Date();
    let plan = null;

    try {
      plan = await prisma.plan.findFirst({
        where: {
          key: 'starter_monthly',
          active: true,
        },
      });

      if (!plan) {
        // fallback: primeiro plano ativo que encontrar
        plan = await prisma.plan.findFirst({
          where: { active: true },
        });
      }
    } catch (err) {
      console.warn('warn: não foi possível buscar plano starter', err && err.message);
      plan = null;
    }

    let subscription = null;

    if (plan) {
      const periodEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 dias

      subscription = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'SUCCEEDED',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      // opcional: vincular plano padrão no tenant
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planId: plan.id },
      });
    }

    // Gerar tokens de acesso / refresh
    const payload = { sub: user.id, tenantId: tenant.id };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Salvar refresh token hash + expiração
    const decodedRefresh = jwt.decode(refreshToken);
    const expiresAt = decodedRefresh?.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // fallback 30 dias

    const refreshHash = await hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        tokenHash: refreshHash,
        userId: user.id,
        expiresAt,
      },
    });

    return res.json({
      accessToken,
      refreshToken,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: { id: user.id, email: user.email, name: user.name },
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    });
  } catch (err) {
    console.error('POST /tenants/register error', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'slug or email already exists' });
    }
    return res.status(500).json({ error: 'server error' });
  }
});

/**
 * GET /tenants
 * Retorna o tenant atual do usuário autenticado com campos já
 * preparados para a tela de Settings (agency_name, colors, logo, plan).
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.tenant && req.tenant.id);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant não identificado' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plan: true,
      },
    });

    if (!tenant) {
      return res.json([]);
    }

    const settings = tenant.settings || {};
    const planName =
      tenant.plan && tenant.plan.name
        ? tenant.plan.name.toLowerCase()
        : null;

    const response = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      agency_name: settings.agency_name || tenant.name,
      primary_color: settings.primary_color || '#A78BFA',
      accent_color: settings.accent_color || '#39FF14',
      logo_url: settings.logo_url || null,
      plan: planName, // usado no front para exibir limites
    };

    return res.json([response]);
  } catch (err) {
    console.error('GET /tenants error', err);
    return res.status(500).json({ error: 'Erro ao carregar tenant' });
  }
});

/**
 * PUT /tenants/:id
 * Atualiza branding / tema do tenant (agency_name, cores, logo).
 * Compatível com o que a página Settings envia.
 */
router.put('/:id', async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.tenant && req.tenant.id);
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant não identificado' });
    }

    if (id !== tenantId) {
      return res.status(403).json({ error: 'Operação não permitida para este tenant' });
    }

    const { agency_name, primary_color, accent_color, logo_url } = req.body || {};

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const currentSettings = tenant.settings || {};

    const newSettings = {
      ...currentSettings,
      agency_name: agency_name ?? currentSettings.agency_name ?? tenant.name,
      primary_color: primary_color ?? currentSettings.primary_color ?? '#A78BFA',
      accent_color: accent_color ?? currentSettings.accent_color ?? '#39FF14',
      logo_url: logo_url ?? currentSettings.logo_url ?? null,
    };

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: agency_name || tenant.name,
        settings: newSettings,
      },
      include: {
        plan: true,
      },
    });

    const planName =
      updated.plan && updated.plan.name
        ? updated.plan.name.toLowerCase()
        : null;

    const response = {
      id: updated.id,
      slug: updated.slug,
      name: updated.name,
      agency_name: newSettings.agency_name,
      primary_color: newSettings.primary_color,
      accent_color: newSettings.accent_color,
      logo_url: newSettings.logo_url,
      plan: planName,
    };

    return res.json(response);
  } catch (err) {
    console.error('PUT /tenants/:id error', err);
    return res.status(500).json({ error: 'Erro ao atualizar tenant' });
  }
});

module.exports = router;
