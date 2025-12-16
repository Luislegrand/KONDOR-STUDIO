// api/src/jobs/whatsappApprovalRequestJob.js
// Processa job BullMQ "whatsapp_send_approval_request"
const { prisma } = require('../prisma');
const whatsappCloud = require('../services/whatsappCloud');

function buildApprovalMessage(post, approvalLink) {
  const titlePart = post?.title ? ` "${post.title}"` : '';
  const base =
    `Olá! Você tem um novo conteúdo${titlePart} para aprovar do estúdio da sua agência.` +
    (approvalLink ? ` Abra o link para revisar: ${approvalLink}` : '');

  return base || 'Você tem um novo conteúdo para aprovar.';
}

function resolvePublicBaseUrl() {
  return (
    process.env.APP_PUBLIC_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.PUBLIC_APP_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    ''
  ).replace(/\/$/, '');
}

async function logJob(status, data = {}) {
  try {
    await prisma.jobLog.create({
      data: {
        queue: 'whatsapp-automation',
        jobId: data.jobId ? String(data.jobId) : null,
        status,
        attempts: data.attempts || null,
        tenantId: data.tenantId || null,
        error: data.error || null,
      },
    });
  } catch (err) {
    // logging best-effort
  }
}

async function processApprovalRequestJob(payload = {}, jobMeta = {}) {
  const { tenantId, postId, clientId, approvalId, publicToken } = payload;
  if (!tenantId || !postId || !clientId || !approvalId) {
    throw new Error('Parâmetros obrigatórios ausentes no job de aprovação via WhatsApp');
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId },
    include: { client: true },
  });

  if (!post || !post.client || post.client.id !== clientId) {
    throw new Error('Post ou cliente não encontrado para este tenant');
  }

  if (post.whatsappSentAt) {
    await logJob('COMPLETED', {
      jobId: jobMeta.jobId,
      tenantId,
      attempts: jobMeta.attemptsMade || null,
      error: null,
    });
    return {
      ok: true,
      skipped: true,
      reason: 'already_sent',
      postId,
      messageId: post.whatsappMessageId || null,
    };
  }

  const client = post.client;
  if (!client.whatsappOptIn || !client.whatsappNumberE164) {
    await logJob('COMPLETED', {
      jobId: jobMeta.jobId,
      tenantId,
      attempts: jobMeta.attemptsMade || null,
      error: 'client_whatsapp_unavailable',
    });
    return {
      ok: false,
      skipped: true,
      reason: 'client_whatsapp_unavailable',
      postId,
    };
  }

  const integration = await whatsappCloud.getAgencyWhatsAppIntegration(tenantId);
  if (!integration || integration.incomplete) {
    throw new Error('Integração WhatsApp da agência não configurada');
  }

  const publicBase = resolvePublicBaseUrl();
  const approvalLink = publicToken
    ? `${publicBase || ''}/public/approvals/${publicToken}`
    : null;
  const message = buildApprovalMessage(post, approvalLink);

  const sendResult = await whatsappCloud.sendTextMessage({
    phoneNumberId: integration.phoneNumberId,
    accessToken: integration.accessToken,
    toE164: client.whatsappNumberE164,
    text: message,
  });

  if (!sendResult.ok) {
    throw new Error(sendResult.error || 'Falha ao enviar mensagem pelo WhatsApp Cloud');
  }

  await prisma.post.update({
    where: { id: post.id },
    data: {
      whatsappSentAt: new Date(),
      whatsappMessageId: sendResult.messageId || null,
    },
  });

  await logJob('COMPLETED', {
    jobId: jobMeta.jobId,
    tenantId,
    attempts: jobMeta.attemptsMade || null,
  });

  return {
    ok: true,
    postId,
    messageId: sendResult.messageId || null,
  };
}

module.exports = {
  processApprovalRequestJob,
};
