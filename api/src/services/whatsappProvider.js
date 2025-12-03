const DEFAULT_TIMEOUT_MS = Number(process.env.WHATSAPP_TIMEOUT_MS || 8000);
const PROVIDER = (process.env.WHATSAPP_PROVIDER || 'generic').toLowerCase();
const API_URL = process.env.WHATSAPP_API_URL || '';
const API_KEY = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN || '';
const FROM_NUMBER = process.env.WHATSAPP_FROM_NUMBER || null;

function safeLog(...args) {
  if (process.env.NODE_ENV !== 'test') {
    console.log('[whatsappProvider]', ...args);
  }
}

async function httpPostJson(url, body, { headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (typeof fetch !== 'function') {
    throw new Error(
      'Global fetch() não disponível no runtime Node. Atualize a versão do Node ou adicione um HTTP client.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }

    return {
      status: res.status,
      ok: res.ok,
      data,
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      const timeoutError = new Error('Timeout ao chamar gateway WhatsApp');
      timeoutError.code = 'ETIMEDOUT';
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPayload(tenantId, to, message, opts = {}) {
  const meta = {
    provider: opts.provider || PROVIDER,
    ...opts.meta,
  };

  return {
    to,
    message,
    from: opts.from || FROM_NUMBER,
    tenantId,
    meta,
  };
}

async function send(tenantId, to, message, opts = {}) {
  if (!API_URL || !API_KEY) {
    safeLog('WHATSAPP_API_URL/WHATSAPP_API_KEY/WHATSAPP_TOKEN não configurados — ignorando envio', {
      tenantId,
      to,
    });
    return {
      ok: false,
      skipped: true,
      error:
        'WhatsApp provider não configurado (WHATSAPP_API_URL e WHATSAPP_API_KEY/WHATSAPP_TOKEN ausentes)',
    };
  }

  if (!to || !message) {
    return {
      ok: false,
      error: 'Parâmetros inválidos: "to" e "message" são obrigatórios',
    };
  }

  const payload = buildPayload(tenantId, to, message, opts);

  try {
    const response = await httpPostJson(API_URL, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });

    const { status, ok, data } = response;

    if (!ok) {
      const logicalError =
        (data && (data.error || data.message)) ||
        `Gateway WhatsApp retornou status HTTP ${status}`;

      safeLog('Gateway WhatsApp retornou erro', {
        tenantId,
        to,
        status,
        error: logicalError,
      });

      return {
        ok: false,
        status,
        error: logicalError,
        data,
      };
    }

    safeLog('Mensagem WhatsApp enviada com sucesso', {
      tenantId,
      to,
      provider: PROVIDER,
      status,
    });

    return {
      ok: true,
      status,
      data,
    };
  } catch (err) {
    const status = err?.status;
    const msg =
      err?.code === 'ETIMEDOUT'
        ? 'Timeout ao chamar gateway WhatsApp'
        : err?.message || String(err);

    safeLog('Erro ao enviar mensagem WhatsApp', {
      tenantId,
      to,
      provider: PROVIDER,
      status,
      error: msg,
    });

    return {
      ok: false,
      status,
      error: msg,
    };
  }
}

module.exports = {
  send,
};
