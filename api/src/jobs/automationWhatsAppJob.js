const { prisma } = require('../prisma');

const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS) || 5;
const BACKOFF_MS_OVERRIDE = process.env.WHATSAPP_BACKOFF_MS
  ? Number(process.env.WHATSAPP_BACKOFF_MS)
  : null;

function safeLog(...args) {
  if (process.env.NODE_ENV === 'test') return;
  console.log('[automationWhatsAppJob]', ...args);
}

function getWhatsappProvider() {
  try {
    const provider = require('../services/whatsappProvider');
    if (!provider || typeof provider.send !== 'function') {
      safeLog('whatsappProvider encontrado, mas sem método send');
      return null;
    }
    return provider;
  } catch (err) {
    safeLog('whatsappProvider não disponível, pulando envio', err?.message || err);
    return null;
  }
}

function renderMessage(entry) {
  const payload = entry.payload || {};
  const type = payload.type || 'generic';

  if (payload.message && typeof payload.message === 'string') {
    return payload.message;
  }

  const vars = payload.vars || {};

  if (type === 'post_pending') {
    return (
      vars.custom ||
      `Você tem um novo conteúdo aguardando aprovação no portal da sua agência.` +
        (vars.postTitle ? ` Título: "${vars.postTitle}".` : '')
    );
  }

  if (type === 'post_approved') {
    return (
      vars.custom ||
      `Seu conteúdo foi aprovado e será publicado em breve.` +
        (vars.postTitle ? ` Título: "${vars.postTitle}".` : '')
    );
  }

  if (type === 'payment_reminder') {
    return (
      vars.custom ||
      `Lembrete: existe um pagamento pendente com a sua agência de marketing.` +
        (vars.dueDate ? ` Vencimento: ${vars.dueDate}.` : '')
    );
  }

  if (type === 'campaign_status') {
    return (
      vars.custom ||
      `Atualização da sua campanha: ${vars.status || 'status atualizado'}.`
    );
  }

  return vars.custom || 'Você recebeu uma nova notificação da sua agência.';
}

function calculaBackoffMs(attempts) {
  if (BACKOFF_MS_OVERRIDE && !Number.isNaN(BACKOFF_MS_OVERRIDE)) {
    return BACKOFF_MS_OVERRIDE;
  }
  const base = 5000;
  const max = 60000;
  const backoff = base * Math.pow(2, Math.max(0, attempts - 1));
  return Math.min(backoff, max);
}

async function findAndClaim() {
  const now = new Date();
  const candidate = await prisma.jobQueue.findFirst({
    where: {
      type: 'automation_whatsapp',
      status: 'queued',
      OR: [{ runAt: null }, { runAt: { lte: now } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!candidate) return null;

  const claimed = await prisma.jobQueue.updateMany({
    where: { id: candidate.id, status: 'queued' },
    data: {
      status: 'processing',
      updatedAt: new Date(),
      attempts: { increment: 1 },
    },
  });

  if (claimed.count === 0) return null;

  const entry = await prisma.jobQueue.findUnique({ where: { id: candidate.id } });
  return entry || null;
}

async function processEntry(entry) {
  if (!entry) return false;

  const provider = getWhatsappProvider();
  if (!provider) {
    safeLog('whatsappProvider indisponível; marcando job como failed');
    await prisma.jobQueue.update({
      where: { id: entry.id },
      data: {
        status: 'failed',
        updatedAt: new Date(),
        result: { error: 'whatsappProvider indisponível' },
      },
    });
    return false;
  }

  const payload = entry.payload || {};
  const tenantId = entry.tenantId || payload.tenantId || null;
  const to = payload.to || null;

  if (!to) {
    safeLog('Job sem "to"; marcando como failed', entry.id);
    await prisma.jobQueue.update({
      where: { id: entry.id },
      data: {
        status: 'failed',
        updatedAt: new Date(),
        result: { error: 'Parâmetro "to" ausente no payload do job' },
      },
    });
    return false;
  }

  if (payload.clientId) {
    try {
      const client = await prisma.client.findFirst({
        where: {
          id: payload.clientId,
          ...(tenantId ? { tenantId } : {}),
        },
      });

      if (!client) {
        safeLog('Client não encontrado para job WhatsApp', {
          jobId: entry.id,
          clientId: payload.clientId,
        });
        await prisma.jobQueue.update({
          where: { id: entry.id },
          data: {
            status: 'failed',
            updatedAt: new Date(),
            result: {
              error: 'Client não encontrado para envio de WhatsApp',
              clientId: payload.clientId,
            },
          },
        });
        return false;
      }

      if (client.whatsappOptIn !== true) {
        safeLog('Client sem opt-in de WhatsApp; marcando job como done/skipped', {
          jobId: entry.id,
          clientId: client.id,
        });
        await prisma.jobQueue.update({
          where: { id: entry.id },
          data: {
            status: 'done',
            updatedAt: new Date(),
            result: {
              skipped: true,
              reason: 'client_whatsapp_opt_out',
              clientId: client.id,
            },
          },
        });
        return true;
      }
    } catch (err) {
      safeLog('Erro ao buscar client para checar opt-in', err?.message || err);
    }
  }

  const message = renderMessage(entry);

  try {
    const sendResult = await provider.send(tenantId, to, message, {
      meta: {
        jobId: entry.id,
        type: payload.type || 'generic',
        referenceId: payload.referenceId || null,
      },
    });

    const attempts = entry.attempts || 1;

    if (!sendResult || !sendResult.ok) {
      const now = new Date();
      const backoffMs = calculaBackoffMs(attempts);
      const nextRunAt = new Date(Date.now() + backoffMs);

      if (attempts < MAX_ATTEMPTS) {
        safeLog('Envio WhatsApp falhou; requeue com backoff', {
          jobId: entry.id,
          attempts,
          backoffMs,
        });

        await prisma.jobQueue.update({
          where: { id: entry.id },
          data: {
            status: 'queued',
            runAt: nextRunAt,
            updatedAt: now,
            result: {
              ...(entry.result || {}),
              lastError: sendResult?.error || 'Falha ao enviar WhatsApp',
              attempts,
            },
          },
        });

        return false;
      }

      safeLog('Envio WhatsApp falhou; maxAttempts atingido, marcando como failed', {
        jobId: entry.id,
        attempts,
      });

      await prisma.jobQueue.update({
        where: { id: entry.id },
        data: {
          status: 'failed',
          runAt: null,
          updatedAt: now,
          result: {
            ...(entry.result || {}),
            lastError: sendResult?.error || 'Falha ao enviar WhatsApp',
            attempts,
          },
        },
      });

      return false;
    }

    await prisma.jobQueue.update({
      where: { id: entry.id },
      data: {
        status: 'done',
        updatedAt: new Date(),
        result: {
          ...(entry.result || {}),
          success: true,
          attempts,
          providerStatus: sendResult.status || null,
        },
      },
    });

    safeLog('Mensagem WhatsApp enviada com sucesso', {
      jobId: entry.id,
      to,
      attempts,
    });

    return true;
  } catch (err) {
    const attempts = entry.attempts || 1;
    const now = new Date();
    const backoffMs = calculaBackoffMs(attempts);
    const nextRunAt = new Date(Date.now() + backoffMs);
    const msg = err?.message || String(err);

    if (attempts < MAX_ATTEMPTS) {
      safeLog('Erro inesperado no envio WhatsApp; requeue com backoff', {
        jobId: entry.id,
        attempts,
        backoffMs,
        error: msg,
      });

      await prisma.jobQueue.update({
        where: { id: entry.id },
        data: {
          status: 'queued',
          runAt: nextRunAt,
          updatedAt: now,
          result: {
            ...(entry.result || {}),
            lastError: msg,
            attempts,
          },
        },
      });

      return false;
    }

    safeLog('Erro inesperado no envio WhatsApp; maxAttempts atingido, marcando como failed', {
      jobId: entry.id,
      attempts,
      error: msg,
    });

    await prisma.jobQueue.update({
      where: { id: entry.id },
      data: {
        status: 'failed',
        runAt: null,
        updatedAt: now,
        result: {
          ...(entry.result || {}),
          lastError: msg,
          attempts,
        },
      },
    });

    return false;
  }
}

async function pollOnce() {
  const entry = await findAndClaim();
  if (!entry) return false;
  return processEntry(entry);
}

module.exports = {
  pollOnce,
  _findAndClaim: findAndClaim,
  _processEntry: processEntry,
};
