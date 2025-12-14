// api/src/services/metricsService.js
// Service responsável por ingestão, consulta e agregação de métricas para um tenant.
// Projetado para ser simples, testável e eficiente com Prisma/Postgres.

const { prisma } = require('../prisma');

/**
 * Normaliza um valor de tempo para Date ou null
 */
function toDateOrNull(v) {
  if (!v && v !== 0) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d;
}

async function resolveClientIdForMetric(tenantId, data = {}) {
  if (data.clientId) return data.clientId;
  if (data.client_id) return data.client_id;

  const postId = data.postId || data.post_id;
  if (!postId) return null;

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId },
    select: { clientId: true },
  });
  return post?.clientId || null;
}

async function createMetricRecord(tenantId, data = {}) {
  if (!data || typeof data !== 'object') {
    throw new Error('Dados de métrica inválidos');
  }

  const metricKey = data.key || data.name || data.type;
  if (!metricKey) throw new Error('Campo "key" ou "name" é obrigatório');
  if (data.value === undefined || data.value === null) {
    throw new Error('Campo "value" é obrigatório');
  }

  const postId = data.postId || data.post_id || null;
  const clientId = await resolveClientIdForMetric(tenantId, {
    ...data,
    postId,
  });

  const payload = {
    tenantId,
    clientId,
    postId,
    source: data.source || null,
    name: metricKey,
    value: Number(data.value),
    collectedAt: toDateOrNull(
      data.timestamp || data.collectedAt || data.collected_at
    ) || new Date(),
    meta: data.meta || data.metadata || null,
  };

  return prisma.metric.create({ data: payload });
}

module.exports = {
  /**
   * Lista métricas com filtros básicos e paginação
   * opts: { metricType, clientId, startDate, endDate, page, perPage }
   */
  async list(tenantId, opts = {}) {
    const {
      metricType,
      clientId,
      source,
      key,
      startDate,
      endDate,
      startTs,
      endTs,
      page = 1,
      perPage = 100,
      order = 'desc',
    } = opts;

    const where = { tenantId };

    const metricKey = key || metricType;
    if (metricKey) where.name = metricKey;
    if (clientId) where.clientId = clientId;
    if (source) where.source = source;

    const rangeStart = startTs || startDate;
    const rangeEnd = endTs || endDate;
    if (rangeStart || rangeEnd) {
      where.collectedAt = {};
      if (rangeStart) where.collectedAt.gte = toDateOrNull(rangeStart);
      if (rangeEnd) where.collectedAt.lte = toDateOrNull(rangeEnd);
    }

    const skip = (Math.max(1, page) - 1) * perPage;
    const take = perPage;

    const [items, total] = await Promise.all([
      prisma.metric.findMany({
        where,
        orderBy: { collectedAt: order === 'asc' ? 'asc' : 'desc' },
        skip,
        take,
      }),
      prisma.metric.count({ where }),
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
   * Ingesta (cria) uma métrica.
   */
  async create(tenantId, data = {}) {
    return createMetricRecord(tenantId, data);
  },
  async ingest(tenantId, data = {}) {
    return createMetricRecord(tenantId, data);
  },

  /**
   * Recupera métrica por id (dentro do tenant)
   */
  async getById(tenantId, id) {
    if (!id) return null;
    return prisma.metric.findFirst({ where: { id, tenantId } });
  },

  /**
   * Atualiza métrica (pouco comum, mas disponível)
   */
  async update(tenantId, id, data = {}) {
    const existing = await this.getById(tenantId, id);
    if (!existing) return null;

    const updateData = {};
    if (data.value !== undefined) updateData.value = Number(data.value);
    if (data.timestamp !== undefined || data.collectedAt !== undefined || data.collected_at !== undefined) {
      updateData.collectedAt = toDateOrNull(
        data.timestamp || data.collectedAt || data.collected_at
      );
    }
    if (data.meta !== undefined) updateData.meta = data.meta;
    if (data.clientId !== undefined || data.client_id !== undefined) {
      updateData.clientId = data.clientId || data.client_id || null;
    }
    if (data.postId !== undefined || data.post_id !== undefined) {
      updateData.postId = data.postId || data.post_id || null;
    }
    if (data.source !== undefined) updateData.source = data.source || null;
    if (data.key !== undefined || data.name !== undefined || data.type !== undefined) {
      updateData.name = data.key || data.name || data.type;
    }

    await prisma.metric.update({ where: { id }, data: updateData });
    return this.getById(tenantId, id);
  },

  /**
   * Remove métrica
   */
  async remove(tenantId, id) {
    const existing = await this.getById(tenantId, id);
    if (!existing) return false;
    await prisma.metric.delete({ where: { id } });
    return true;
  },

  /**
   * Agregação rápida de métricas por período e tipo.
   * options: { groupBy: 'day'|'hour'|'week'|'month', metricTypes: [], clientId, startDate, endDate }
   * Retorna objeto { buckets: [{ period, metrics: { type: aggregatedValue, ... } }, ...] }
   *
   * NOTE: Utiliza queries simples e Postgres date_trunc via prisma.$queryRaw para eficiência.
   */
  async aggregate(tenantId, options = {}) {
    const {
      groupBy = 'day',
      metricTypes = null,
      clientId = null,
      source = null,
      startDate = null,
      endDate = null,
    } = options;

    // map groupBy to postgres date_trunc precision
    const precisionMap = {
      hour: 'hour',
      day: 'day',
      week: 'week',
      month: 'month',
    };
    const precision = precisionMap[groupBy] || 'day';

    const params = [tenantId];
    let whereSql = `"tenantId" = $1`;
    let idx = 2;

    if (clientId) {
      whereSql += ` AND "clientId" = $${idx}`;
      params.push(clientId);
      idx++;
    }
    if (source) {
      whereSql += ` AND "source" = $${idx}`;
      params.push(source);
      idx++;
    }
    if (startDate) {
      whereSql += ` AND "collectedAt" >= $${idx}`;
      params.push(new Date(startDate).toISOString());
      idx++;
    }
    if (endDate) {
      whereSql += ` AND "collectedAt" <= $${idx}`;
      params.push(new Date(endDate).toISOString());
      idx++;
    }
    if (Array.isArray(metricTypes) && metricTypes.length) {
      // build IN list with parameter placeholders
      const placeholders = metricTypes.map((_, i) => `$${idx + i}`).join(', ');
      whereSql += ` AND "name" IN (${placeholders})`;
      metricTypes.forEach((t) => params.push(t));
      idx += metricTypes.length;
    }

    // raw query: group by truncated timestamp and type, sum values
    const raw = `
      SELECT date_trunc('${precision}', "collectedAt") AS period,
             "name",
             SUM(value) AS total_value
      FROM "metrics"
      WHERE ${whereSql}
      GROUP BY period, "name"
      ORDER BY period ASC
    `;

    const rows = await prisma.$queryRawUnsafe(raw, ...params);

    // transform to buckets
    const bucketsMap = new Map();
    for (const r of rows) {
      const periodKey = new Date(r.period).toISOString();
      if (!bucketsMap.has(periodKey)) bucketsMap.set(periodKey, { period: periodKey, metrics: {} });
      const bucket = bucketsMap.get(periodKey);
      bucket.metrics[r.name] = Number(r.total_value);
    }

    return { buckets: Array.from(bucketsMap.values()) };
  },

  /**
   * Retorna resumo rápido (last N days) com totals por tipo.
   * options: { days: 7, metricTypes: [] }
   */
  async quickSummary(tenantId, options = {}) {
    const { days = 7, metricTypes = [], clientId = null, source = null } = options;
    const start = new Date();
    start.setDate(start.getDate() - days);

    const where = {
      tenantId,
      collectedAt: { gte: start },
    };
    if (Array.isArray(metricTypes) && metricTypes.length) {
      where.name = { in: metricTypes };
    }
    if (clientId) where.clientId = clientId;
    if (source) where.source = source;

    // group by type using prisma aggregation
    const rows = await prisma.metric.groupBy({
      by: ['name'],
      where,
      _sum: { value: true },
    });

    const result = {};
    for (const r of rows) {
      result[r.name] = (r._sum && r._sum.value) ? Number(r._sum.value) : 0;
    }

    return {
      since: start.toISOString(),
      totals: result,
    };
  },
};
