// api/src/services/whatsappCloud.js
// Integração com WhatsApp Cloud API (Meta)
const { prisma } = require('../prisma');

const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || 'v17.0';

function buildGraphUrl(phoneNumberId) {
  const base = process.env.WHATSAPP_GRAPH_BASE_URL || `https://graph.facebook.com/${GRAPH_API_VERSION}`;
  return `${base.replace(/\/$/, '')}/${phoneNumberId}/messages`;
}

function safeLog(...args) {
  if (process.env.NODE_ENV === 'test') return;
  console.log('[whatsappCloud]', ...args);
}

async function getAgencyWhatsAppIntegration(tenantId) {
  if (!tenantId) return null;

  const integration = await prisma.integration.findFirst({
    where: {
      tenantId,
      provider: 'WHATSAPP',
      ownerType: 'AGENCY',
      ownerKey: 'AGENCY',
      status: 'ACTIVE',
    },
  });

  if (!integration) return null;

  const settings = integration.settings || {};
  const phoneNumberId = settings.phone_number_id || settings.phoneNumberId || settings.phoneNumberID;

  if (!integration.accessToken || !phoneNumberId) {
    return {
      integration,
      phoneNumberId: phoneNumberId || null,
      accessToken: integration.accessToken || null,
      incomplete: true,
    };
  }

  return { integration, phoneNumberId, accessToken: integration.accessToken, settings };
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
