// api/src/services/whatsappCloud.js
// Integração com WhatsApp Cloud API (Meta)
const { prisma } = require('../prisma');
const { decrypt } = require('../utils/crypto');

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v17.0';

function buildGraphUrl(phoneNumberId) {
  const base = process.env.WHATSAPP_GRAPH_BASE_URL || `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  return `${base.replace(/\/$/, '')}/${phoneNumberId}/messages`;
}

function safeLog(...args) {
  if (process.env.NODE_ENV === 'test') return;
  console.log('[whatsappCloud]', ...args);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function getAgencyWhatsAppIntegration(tenantId) {
  if (!tenantId) return null;

  const integration = await prisma.integration.findFirst({
    where: {
      tenantId,
      provider: 'WHATSAPP_META_CLOUD',
      ownerType: 'AGENCY',
      ownerKey: 'AGENCY',
      status: 'CONNECTED',
    },
    select: {
      id: true,
      tenantId: true,
      provider: true,
      status: true,
      accessTokenEncrypted: true,
      settings: true,
      config: true,
    },
  });

  if (!integration) return null;

  const settings = isPlainObject(integration.settings) ? integration.settings : {};
  const config = isPlainObject(integration.config) ? integration.config : {};

  const phoneNumberId =
    config.phone_number_id ||
    config.phoneNumberId ||
    config.phoneNumberID ||
    settings.phone_number_id ||
    settings.phoneNumberId ||
    settings.phoneNumberID ||
    null;

  if (!phoneNumberId) {
    return {
      integration,
      phoneNumberId: phoneNumberId || null,
      accessToken: null,
      settings,
      incomplete: true,
    };
  }

  if (!integration.accessTokenEncrypted) {
    throw new Error('Missing encrypted token for integration');
  }

  let accessToken;
  try {
    accessToken = decrypt(integration.accessTokenEncrypted);
  } catch (err) {
    safeLog('Encrypted token inválido para integração WhatsApp', err?.message || err);
    throw new Error('Invalid encrypted token for integration');
  }

  return { integration, phoneNumberId, accessToken, settings };
}

async function sendTextMessage({ phoneNumberId, accessToken, toE164, text }) {
  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: 'Configuração de WhatsApp incompleta (phone_number_id/accessToken)' };
  }
  if (!toE164 || !text) {
    return { ok: false, error: 'Parâmetros obrigatórios ausentes (to/text)' };
  }

  const url = buildGraphUrl(phoneNumberId);
  const body = {
    messaging_product: 'whatsapp',
    to: toE164,
    type: 'text',
    text: { preview_url: false, body: text },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const logicalError =
        data?.error?.message ||
        data?.message ||
        `WhatsApp API retornou status ${res.status}`;
      return { ok: false, status: res.status, error: logicalError, data };
    }

    const messageId = data?.messages?.[0]?.id || null;
    return { ok: true, status: res.status, data, messageId };
  } catch (err) {
    safeLog('Erro ao chamar WhatsApp Cloud', err?.message || err);
    return { ok: false, error: err?.message || 'Erro desconhecido' };
  }
}

module.exports = {
  getAgencyWhatsAppIntegration,
  sendTextMessage,
};
