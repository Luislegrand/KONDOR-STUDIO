// api/src/services/postsService.js
// Service para CRUD e operações úteis sobre posts (escopado por tenant)

const { Prisma } = require('@prisma/client');
const { prisma } = require('../prisma');

class PostValidationError extends Error {
  constructor(message, code = 'POST_VALIDATION_ERROR') {
    super(message);
    this.name = 'PostValidationError';
    this.code = code;
  }
}

/**
 * Converte valores de data flexíveis em Date ou null
 * Aceita: ISO string, timestamp number, ou null/undefined
 */
function toDateOrNull(value) {
  if (!value && value !== 0) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

function sanitizeString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

/**
 * PostStatus existentes no seu schema (conforme você colou):
 * DRAFT, PENDING_APPROVAL, ARCHIVED, SCHEDULED, PUBLISHED, FAILED, CANCELLED, IDEA, APPROVED
 *
 * Importante:
 * - ApprovalStatus tem: PENDING, APPROVED, REJECTED
 * - PostStatus NÃO tem REJECTED
 *
 * Então:
 * - Aceitamos "REJECTED" como ALIAS (input) -> postStatus vira "DRAFT"
 * - E sincronizamos Approval para "REJECTED"
 */
const POST_STATUSES = new Set([
  'DRAFT',
  'PENDING_APPROVAL',
  'ARCHIVED',
  'SCHEDULED',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
  'IDEA',
  'APPROVED',
]);

function normalizePostStatusInput(inputStatus) {
  const raw = sanitizeString(inputStatus);
  if (!raw) return { postStatus: 'DRAFT', approvalOverride: null };

  // Se o front mandar "REJECTED", não existe no PostStatus -> vira DRAFT + override no approval
  if (raw === 'REJECTED') {
    return { postStatus: 'DRAFT', approvalOverride: 'REJECTED' };
  }

  if (!POST_STATUSES.has(raw)) {
    // Evita quebrar Prisma por enum inválido
    return { postStatus: 'DRAFT', approvalOverride: null };
  }

  return { postStatus: raw, approvalOverride: null };
}

async function ensureApprovalRequest(tenantId, post, userId) {
  if (!post || !post.clientId) return null;

  const existing = await prisma.approval.findFirst({
    where: { tenantId, postId: post.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return existing;

  return prisma.approval.create({
    data: {
      tenantId,
      postId: post.id,
      status: 'PENDING',
      // Mantém simples e compatível com o schema atual
      notes: post.caption || post.content || null,
      requesterId: userId || null,
    },
  });
}

/**
 * Sincroniza Approval baseado no STATUS DO POST.
 * - PENDING_APPROVAL -> garante Approval PENDING
 * - APPROVED -> seta Approval APPROVED (se existir pending)
 * - Rejeição: quando o caller passar approvalOverride="REJECTED" (post fica DRAFT)
 */
async function syncApprovalWithPostStatus(tenantId, post, postStatus, userId, approvalOverride = null) {
  if (!post || !postStatus) return;

  // Se post precisa de aprovação, garante um approval pendente
  if (postStatus === 'PENDING_APPROVAL') {
    await ensureApprovalRequest(tenantId, post, userId);
    return;
  }

  // Descobre qual status de approval aplicar (se houver)
  let approvalStatusToApply = null;

  if (approvalOverride === 'REJECTED') approvalStatusToApply = 'REJECTED';
  else if (postStatus === 'APPROVED') approvalStatusToApply = 'APPROVED';
  else return; // outros status do post não mexem em approvals

  const latestPending = await prisma.approval.findFirst({
    where: { tenantId, postId: post.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (!latestPending) return;

  await prisma.approval.update({
    where: { id: latestPending.id },
    data: {
      status: approvalStatusToApply,
      approverId: userId || latestPending.approverId || null,
    },
  });
}

module.exports = {
  /**
   * Lista posts do tenant com filtros e paginação
   * @param {String} tenantId
   * @param {Object} opts - { status, clientId, q, page, perPage }
   */
  async list(tenantId, opts = {}) {
    const { status, clientId, q } = opts;

    const page = Math.max(1, Number(opts.page || 1));
    const perPage = Math.min(100, Math.max(1, Number(opts.perPage || 50)));

    const where = { tenantId };

    if (status) {
      // aceita alias REJECTED sem quebrar; REJECTED no post vira DRAFT.
      const { postStatus } = normalizePostStatusInput(status);
      where.status = postStatus;
    }

    if (clientId) where.clientId = clientId;

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * perPage;
    const take = perPage;

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.post.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  },

  /**
   * Cria um novo post dentro do tenant
   * @param {String} tenantId
   * @param {String} userId - id do usuário que cria
   * @param {Object} data
   */
  async create(tenantId, userId, data = {}) {
    const scheduledDate = data.scheduledDate || data.scheduled_date || data.scheduledAt || null;
    const publishedDate = data.publishedDate || data.published_date || null;

    const title = sanitizeString(data.title);
    const clientId = sanitizeString(data.clientId || data.client_id);
    const mediaUrl = sanitizeString(data.mediaUrl || data.media_url);

    if (!title) throw new PostValidationError('Título é obrigatório');
    if (!clientId) throw new PostValidationError('Selecione um cliente antes de salvar o post');
    if (!mediaUrl) throw new PostValidationError('Envie uma mídia antes de salvar o post');

    const { postStatus, approvalOverride } = normalizePostStatusInput(data.status || 'DRAFT');

    const payload = {
      tenantId,
      clientId,
      title,
      caption: sanitizeString(data.caption || data.body),
      mediaUrl,
      mediaType: sanitizeString(data.mediaType || data.media_type) || 'image',
      cta: sanitizeString(data.cta),
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      status: postStatus,
      scheduledDate: toDateOrNull(scheduledDate),
      publishedDate: toDateOrNull(publishedDate),
      clientFeedback: sanitizeString(data.clientFeedback || data.client_feedback),
      version: Number(data.version || 1),
      history: data.history || null,
      createdBy: userId || null,
    };

    try {
      const created = await prisma.post.create({ data: payload });

      try {
        await syncApprovalWithPostStatus(tenantId, created, created.status, userId, approvalOverride);
      } catch (syncErr) {
        console.error('syncApprovalWithPostStatus(create) failed:', syncErr);
      }

      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          throw new PostValidationError('Cliente selecionado não existe mais', 'INVALID_CLIENT');
        }
      }
      throw err;
    }
  },

  /**
   * Busca post por id dentro do tenant
   * @param {String} tenantId
   * @param {String} id
   */
  async getById(tenantId, id, options = {}) {
    if (!id) return null;
    return prisma.post.findFirst({
      where: { id, tenantId },
      ...options,
    });
  },

  /**
   * Atualiza post
   * @param {String} tenantId
   * @param {String} id
   * @param {Object} data
   */
  async update(tenantId, id, data = {}, options = {}) {
    const existing = await this.getById(tenantId, id);
    if (!existing) return null;

    const updateData = {};
    let approvalOverride = null;

    if (data.title !== undefined) updateData.title = sanitizeString(data.title);

    if (data.caption !== undefined || data.body !== undefined) {
      updateData.caption = sanitizeString(data.caption || data.body);
    }

    if (data.mediaUrl !== undefined || data.media_url !== undefined) {
      updateData.mediaUrl = sanitizeString(data.mediaUrl || data.media_url);
    }

    if (data.mediaType !== undefined || data.media_type !== undefined) {
      updateData.mediaType = sanitizeString(data.mediaType || data.media_type);
    }

    if (data.cta !== undefined) updateData.cta = sanitizeString(data.cta);

    if (data.tags !== undefined) {
      updateData.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
    }

    if (data.clientId !== undefined || data.client_id !== undefined) {
      updateData.clientId = sanitizeString(data.clientId || data.client_id);
    }

    if (data.status !== undefined) {
      const norm = normalizePostStatusInput(data.status);
      updateData.status = norm.postStatus;
      approvalOverride = norm.approvalOverride;
    }

    if (
      data.scheduledDate !== undefined ||
      data.scheduled_date !== undefined ||
      data.scheduledAt !== undefined
    ) {
      const scheduledValue = data.scheduledDate || data.scheduled_date || data.scheduledAt;
      updateData.scheduledDate = toDateOrNull(scheduledValue);
    }

    if (data.publishedDate !== undefined || data.published_date !== undefined) {
      const publishedValue = data.publishedDate || data.published_date;
      updateData.publishedDate = toDateOrNull(publishedValue);
    }

    if (data.clientFeedback !== undefined || data.client_feedback !== undefined) {
      updateData.clientFeedback = sanitizeString(data.clientFeedback || data.client_feedback);
    }

    if (data.version !== undefined) updateData.version = Number(data.version);
    if (data.history !== undefined) updateData.history = data.history;

    const updated = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    // Só sincroniza se status mudou (ou se veio override de REJECTED)
    const statusChanged = updateData.status && updateData.status !== existing.status;
    const hasOverride = approvalOverride === 'REJECTED';

    if (statusChanged || hasOverride) {
      try {
        await syncApprovalWithPostStatus(
          tenantId,
          updated,
          updated.status,
          options.userId || null,
          approvalOverride
        );
      } catch (syncErr) {
        console.error('syncApprovalWithPostStatus(update) failed:', syncErr);
      }
    }

    return updated;
  },

  /**
   * Remove post (dentro do tenant)
   * @param {String} tenantId
   * @param {String} id
   */
  async remove(tenantId, id) {
    const existing = await this.getById(tenantId, id);
    if (!existing) return false;

    await prisma.post.delete({
      where: { id },
    });

    return true;
  },

  /**
   * Sugestão rápida para buscar posts por termos (útil para selects/autocomplete)
   */
  async suggest(tenantId, term, limit = 10) {
    if (!term) return [];
    const take = Math.min(25, Math.max(1, Number(limit || 10)));

    return prisma.post.findMany({
      where: {
        tenantId,
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { caption: { contains: term, mode: 'insensitive' } },
        ],
      },
      take,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, caption: true },
    });
  },

  /**
   * Atualiza apenas o status do post (atalho para automações)
   */
  async updateStatus(tenantId, id, status, userId = null) {
    if (!status) return null;

    const existing = await this.getById(tenantId, id);
    if (!existing) return null;

    const { postStatus, approvalOverride } = normalizePostStatusInput(status);

    if (existing.status === postStatus && !approvalOverride) return existing;

    const updated = await prisma.post.update({
      where: { id },
      data: { status: postStatus },
    });

    try {
      await syncApprovalWithPostStatus(tenantId, updated, postStatus, userId, approvalOverride);
    } catch (syncErr) {
      console.error('syncApprovalWithPostStatus(updateStatus) failed:', syncErr);
    }

    return updated;
  },
};

module.exports.PostValidationError = PostValidationError;
