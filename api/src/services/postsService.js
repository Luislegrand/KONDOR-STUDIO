// api/src/services/postsService.js
// Service para CRUD e operações úteis sobre posts (escopado por tenant)

const { prisma } = require('../prisma');
const approvalsService = require('./approvalsService');

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

async function ensureApprovalRequest(tenantId, post, userId) {
	if (!post || !post.clientId) return null;

	const existing = await prisma.approval.findFirst({
		where: { tenantId, postId: post.id, status: 'PENDING' },
		orderBy: { createdAt: 'desc' },
	});
	if (existing) return existing;

	return approvalsService.create(tenantId, userId, {
		postId: post.id,
		clientId: post.clientId,
		status: 'PENDING',
		title: post.title,
		description: post.caption,
	});
}

async function syncApprovalWithPostStatus(tenantId, post, status, userId) {
	if (!post || !status) return;

	if (status === 'PENDING_APPROVAL') {
		await ensureApprovalRequest(tenantId, post, userId);
		return;
	}

	if (!['APPROVED', 'REJECTED'].includes(status)) return;

	const latest = await prisma.approval.findFirst({
		where: { tenantId, postId: post.id },
		orderBy: { createdAt: 'desc' },
	});

	if (!latest || latest.status === status) return;

	await approvalsService.changeStatus(tenantId, latest.id, status, {
		by: userId || null,
		note: `Status sincronizado com o post (${status})`,
	});
}

module.exports = {
 	/**
 	 * Lista posts do tenant com filtros e paginação
 	 * @param {String} tenantId
 	 * @param {Object} opts - { status, clientId, q, page, perPage }
 	 */
 	async list(tenantId, opts = {}) {
 		const { status, clientId, q, page = 1, perPage = 50 } = opts;
 		const where = { tenantId };

 		if (status) where.status = status;
 		if (clientId) where.clientId = clientId;
 		if (q) {
 			where.OR = [
 				{ title: { contains: q, mode: 'insensitive' } },
 				{ caption: { contains: q, mode: 'insensitive' } },
 			];
 		}

 		const skip = (Math.max(1, page) - 1) * perPage;
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

 		const payload = {
 			tenantId,
 			clientId: data.clientId || data.client_id || null,
 			title: data.title || null,
 			caption: data.caption || data.body || null,
 			mediaUrl: data.mediaUrl || data.media_url || null,
 			mediaType: data.mediaType || data.media_type || 'image',
 			cta: data.cta || null,
 			tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
			status: data.status || 'DRAFT',
 			scheduledDate: toDateOrNull(scheduledDate),
 			publishedDate: toDateOrNull(publishedDate),
 			clientFeedback: data.clientFeedback || data.client_feedback || null,
 			version: data.version || 1,
 			history: data.history || null,
 			createdBy: userId || null,
 		};

 		const created = await prisma.post.create({ data: payload });
 		await syncApprovalWithPostStatus(tenantId, created, created.status, userId);
 		return created;
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

 		if (data.title !== undefined) updateData.title = data.title;
 		if (data.caption !== undefined || data.body !== undefined) {
 			updateData.caption = data.caption || data.body;
 		}
 		if (data.mediaUrl !== undefined || data.media_url !== undefined) {
 			updateData.mediaUrl = data.mediaUrl || data.media_url;
 		}
 		if (data.mediaType !== undefined || data.media_type !== undefined) {
 			updateData.mediaType = data.mediaType || data.media_type;
 		}
 		if (data.cta !== undefined) updateData.cta = data.cta;
 		if (data.tags !== undefined) updateData.tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
 		if (data.clientId !== undefined || data.client_id !== undefined) {
 			updateData.clientId = data.clientId || data.client_id || null;
 		}
 		if (data.status !== undefined) updateData.status = data.status;

 		if (data.scheduledDate !== undefined || data.scheduled_date !== undefined || data.scheduledAt !== undefined) {
 			const scheduledValue = data.scheduledDate || data.scheduled_date || data.scheduledAt;
 			updateData.scheduledDate = toDateOrNull(scheduledValue);
 		}

 		if (data.publishedDate !== undefined || data.published_date !== undefined) {
 			const publishedValue = data.publishedDate || data.published_date;
 			updateData.publishedDate = toDateOrNull(publishedValue);
 		}

 		if (data.clientFeedback !== undefined || data.client_feedback !== undefined) {
 			updateData.clientFeedback = data.clientFeedback || data.client_feedback || null;
 		}

 		if (data.version !== undefined) updateData.version = data.version;
 		if (data.history !== undefined) updateData.history = data.history;

 		const updated = await prisma.post.update({
 			where: { id },
 			data: updateData,
 		});

		if (updateData.status && updateData.status !== existing.status) {
			await syncApprovalWithPostStatus(tenantId, updated, updateData.status, options.userId || null);
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
 		return prisma.post.findMany({
 			where: {
 				tenantId,
 				OR: [
 					{ title: { contains: term, mode: 'insensitive' } },
 					{ caption: { contains: term, mode: 'insensitive' } },
 				],
 			},
 			take: limit,
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

		if (existing.status === status) return existing;

		const updated = await prisma.post.update({
			where: { id },
			data: { status },
		});

		await syncApprovalWithPostStatus(tenantId, updated, status, userId);
		return updated;
	},
};
