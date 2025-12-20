const express = require('express');
const jwt = require('jsonwebtoken');

const { prisma } = require('../prisma');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_local_secret';

function buildRedirectUrl() {
  const fallback = '/integrations?whatsapp=callback';
  const base = process.env.PUBLIC_APP_URL;
  if (!base) return fallback;
  return `${String(base).replace(/\/+$/, '')}${fallback}`;
}

// B) GET /api/integrations/whatsapp/callback
router.get('/callback', async (req, res) => {
  const code = req.query && req.query.code;
  const state = req.query && req.query.state;

  if (!code || !state) {
    return res.status(400).json({ error: 'missing code or state' });
  }

  let payload;
  try {
    payload = jwt.verify(String(state), JWT_SECRET);
  } catch {
    return res.status(400).json({ error: 'invalid state' });
  }

  // Segurança extra: garantir que o state foi gerado para este propósito
  if (!payload || payload.purpose !== 'whatsapp_oauth_state') {
    return res.status(400).json({ error: 'invalid state' });
  }

  const tenantId = payload && payload.tenantId;
  if (!tenantId) {
    return res.status(400).json({ error: 'invalid state' });
  }

  const nowIso = new Date().toISOString();

  try {
    const existing = await prisma.integration.findFirst({
      where: {
        tenantId: String(tenantId),
        provider: 'WHATSAPP_META_CLOUD',
      },
      select: { id: true, config: true },
    });

    const baseConfig =
      existing &&
      existing.config &&
      typeof existing.config === 'object' &&
      !Array.isArray(existing.config)
        ? existing.config
        : null;

    const nextConfig = { ...(baseConfig || {}), callback_received_at: nowIso };

    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: {
          status: 'DISCONNECTED', // NUNCA marcar como connected nesta etapa
          accessTokenEncrypted: null,
          config: nextConfig,
        },
      });
    } else {
      await prisma.integration.create({
        data: {
          tenantId: String(tenantId),
          provider: 'WHATSAPP_META_CLOUD',
          status: 'DISCONNECTED', // NUNCA marcar como connected nesta etapa
          accessTokenEncrypted: null,
          config: nextConfig,
        },
      });
    }

    return res.redirect(302, buildRedirectUrl());
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
});

module.exports = router;
