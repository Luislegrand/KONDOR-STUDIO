const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const integrationsController = require('../controllers/integrationsController');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_local_secret';

// Todas as rotas de integração exigem auth + tenant (mesmo já aplicados em server.js,
// mantemos aqui para uso isolado em testes/serviços).
router.use(authMiddleware);
router.use(tenantMiddleware);

// =========================
// WhatsApp (Meta Cloud) - Rotas placeholder (sem integrar Meta ainda)
// =========================

// A) GET /api/integrations/whatsapp/connect-url
router.get('/whatsapp/connect-url', async (req, res) => {
  const tenantId = req.tenantId || (req.user && req.user.tenantId);
  if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });

  const nonce = crypto.randomBytes(16).toString('hex');
  const state = jwt.sign(
    { tenantId, nonce, purpose: 'whatsapp_oauth_state' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );

  const oauthVersion = process.env.META_OAUTH_VERSION || 'v20.0';
  const appId = process.env.META_APP_ID || '0';
  const redirectUri =
    process.env.META_OAUTH_REDIRECT_URI ||
    `http://localhost:${process.env.PORT || 4000}/api/integrations/whatsapp/callback`;

  const url = new URL(`https://www.facebook.com/${oauthVersion}/dialog/oauth`);
  url.searchParams.set('client_id', String(appId));
  url.searchParams.set('redirect_uri', String(redirectUri));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  return res.json({ url: url.toString() });
});

// C) POST /api/integrations/whatsapp/disconnect
router.post('/whatsapp/disconnect', async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.user && req.user.tenantId);
    if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });

    const db = req.db;

    // Multi-tenant obrigatório: sempre filtrar por tenantId
    const existing = await db.integration.findFirst({
      where: { tenantId: String(tenantId), provider: 'WHATSAPP_META_CLOUD' },
      select: { id: true, config: true },
    });

    if (!existing) return res.json({ ok: true });

    let nextConfig = existing.config;
    if (
      nextConfig &&
      typeof nextConfig === 'object' &&
      !Array.isArray(nextConfig)
    ) {
      nextConfig = { ...nextConfig };
      if (Object.prototype.hasOwnProperty.call(nextConfig, 'phone_number_id')) {
        delete nextConfig.phone_number_id;
      }
      if (Object.prototype.hasOwnProperty.call(nextConfig, 'waba_id')) {
        delete nextConfig.waba_id;
      }
      if (Object.prototype.hasOwnProperty.call(nextConfig, 'display_phone')) {
        delete nextConfig.display_phone;
      }
      if (Object.keys(nextConfig).length === 0) nextConfig = null;
    }

    // Não tocar em campos que podem não existir no schema atual (accessToken/refreshToken).
    await db.integration.update({
      where: { id: existing.id },
      data: {
        status: 'DISCONNECTED',
        accessTokenEncrypted: null,
        config: nextConfig,
      },
    });

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
});

// D) POST /api/integrations/whatsapp/test
router.post('/whatsapp/test', async (req, res) => {
  try {
    const tenantId = req.tenantId || (req.user && req.user.tenantId);
    if (!tenantId) return res.status(400).json({ error: 'tenantId missing' });

    const db = req.db;

    // Multi-tenant obrigatório: sempre filtrar por tenantId
    const existing = await db.integration.findFirst({
      where: { tenantId: String(tenantId), provider: 'WHATSAPP_META_CLOUD' },
      select: { id: true },
    });

    if (!existing) {
      return res.json({ ok: true, connected: false, reason: 'no_integration' });
    }

    return res.json({ ok: true, connected: false });
  } catch (err) {
    return res.status(500).json({ error: 'server error' });
  }
});

// =========================
// Rotas CRUD genéricas existentes
// =========================
router.get('/', integrationsController.list);
router.post('/', integrationsController.create);
router.post(
  '/clients/:clientId/integrations/:provider/connect',
  integrationsController.connectForClient
);
router.get('/:id', integrationsController.getById);
router.put('/:id', integrationsController.update);
router.delete('/:id', integrationsController.remove);
router.post('/:id/disconnect', integrationsController.disconnect);

module.exports = router;
