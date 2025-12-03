const { prisma } = require('../prisma');
const { buildAndPersistReport } = require('../services/reportBuilder');

const MAX_ATTEMPTS = Number(process.env.WORKER_MAX_ATTEMPTS) || 5;
const BACKOFF_MS = Number(process.env.REPORT_BACKOFF_MS) || 60000;

function safeLog(...args) {
  if (process.env.NODE_ENV === 'test') return;
  console.log('[reportGenerationJob]', ...args);
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

async function claimNextReportJob() {
  const now = new Date();

  const candidate = await prisma.jobQueue.findFirst({
    where: {
      type: 'report_generation',
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
      attempts: { increment: 1 },
      updatedAt: now,
    },
  });

  if (!claimed.count) return null;

  return prisma.jobQueue.findUnique({ where: { id: candidate.id } });
}

function buildSummary(metrics, from, to) {
  const byName = {};

  metrics.forEach((m) => {
    const key = m.name || 'unknown';
    if (!byName[key]) {
      byName[key] = {
        name: key,
        count: 0,
        sum: 0,
        min: m.value,
        max: m.value,
      };
    }
    const agg = byName[key];
    agg.count += 1;
    agg.sum += m.value;
    if (m.value < agg.min) agg.min = m.value;
    if (m.value > agg.max) agg.max = m.value;
  });

  Object.values(byName).forEach((agg) => {
    agg.avg = agg.count > 0 ? agg.sum / agg.count : 0;
  });

  return {
    from,
    to,
    totalMetrics: metrics.length,
    byName,
  };
}

async function finalizeJob(entry, status, result, options = {}) {
  const data = {
    status,
    result,
    updatedAt: new Date(),
  };

  if (status === 'queued' && options.runAt) {
    data.runAt = options.runAt;
  }

  await prisma.jobQueue.update({
    where: { id: entry.id },
    data,
  });
}

async function processReportEntry(entry) {
  if (!entry) return null;

  const tenantId = entry.tenantId;
  if (!tenantId) {
    safeLog('Job sem tenantId, marcando como failed', entry.id);
    await finalizeJob(entry, 'failed', { error: 'missing_tenant' });
    return null;
  }

  const payload = entry.payload || {};
  const now = new Date();
  let from = parseDateOrNull(payload.rangeFrom);
  let to = parseDateOrNull(payload.rangeTo);

  if (!to) to = now;
  if (!from) {
    const days = Number(payload.rangeDays) || 30;
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }

  const metrics = await prisma.metric.findMany({
    where: {
      tenantId,
      collectedAt: {
        gte: from,
        lte: to,
      },
    },
  });

  const summary = buildSummary(metrics, from, to);

  const baseParams =
    payload.params && typeof payload.params === 'object' ? payload.params : {};

  const name = payload.name || 'Relatório';
  const type = payload.type || 'custom';

  const options = {
    name,
    type,
    params: baseParams,
    summary,
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
  };

  if (payload.reportId) {
    options.reportId = payload.reportId;
  }

  const result = await buildAndPersistReport(tenantId, options);

  if (!result || !result.ok || !result.report) {
    const errorMsg = result?.error || 'Falha ao gerar relatório';
    safeLog('buildAndPersistReport retornou erro', {
      jobId: entry.id,
      error: errorMsg,
    });

    await finalizeJob(entry, 'failed', {
      ok: false,
      error: errorMsg,
      summary,
    });

    return null;
  }

  const { report, upload, filename } = result;

  await finalizeJob(entry, 'done', {
    ok: true,
    reportId: report.id,
    summary,
    uploadId: upload ? upload.id : null,
    filename,
  });

  safeLog('Relatório gerado com sucesso', {
    jobId: entry.id,
    reportId: report.id,
    uploadId: upload?.id || null,
  });

  return report;
}

async function pollOnce() {
  const entry = await claimNextReportJob();
  if (!entry) return null;

  try {
    return await processReportEntry(entry);
  } catch (err) {
    const attempts = (entry.attempts || 0) + 1;
    const msg = err?.message || String(err);

    if (attempts >= MAX_ATTEMPTS) {
      await finalizeJob(entry, 'failed', {
        ok: false,
        error: msg,
        attempts,
      });
      safeLog('Job de relatório falhou e atingiu MAX_ATTEMPTS', entry.id, msg);
    } else {
      const runAt = new Date(Date.now() + BACKOFF_MS);
      await finalizeJob(
        entry,
        'queued',
        {
          ok: false,
          error: msg,
          attempts,
          retryAt: runAt,
        },
        { runAt },
      );
      safeLog('Job de relatório falhou, requeued para nova tentativa', entry.id, msg);
    }
    return null;
  }
}

module.exports = {
  pollOnce,
  _claimNextReportJob: claimNextReportJob,
  _processReportEntry: processReportEntry,
};
