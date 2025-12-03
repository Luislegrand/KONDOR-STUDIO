require('dotenv').config();
const { Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');

const {
  metricsSyncQueue,
  reportsQueue,
  whatsappQueue,
} = require('./queues');

const updateMetricsJob = require('./jobs/updateMetricsJob');
const reportGenerationJob = require('./jobs/reportGenerationJob');
const automationWhatsAppJob = require('./jobs/automationWhatsAppJob');

// ------------------------------------------------------
// Conexão do BullMQ (usa REDIS_URL da env; em dev cai pro localhost)
// ------------------------------------------------------
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new Redis(REDIS_URL);

// Períodos de agendamento (ms)
const METRICS_AGG_PERIOD_MS = Number(process.env.METRICS_AGG_PERIOD_MS) || 3600000; // 1h
const REPORTS_GENERATION_PERIOD_MS =
  Number(process.env.REPORTS_GENERATION_PERIOD_MS) || 900000; // 15min
const WHATSAPP_AUTOMATION_PERIOD_MS =
  Number(process.env.WHATSAPP_AUTOMATION_PERIOD_MS) || 300000; // 5min

// ------------------------------------------------------
// Helper genérico para rodar pollOnce() dos módulos de job
// ------------------------------------------------------
async function runPollOnce(jobModule, label) {
  if (!jobModule || typeof jobModule.pollOnce !== 'function') {
    console.warn(
      `[worker] módulo de job sem pollOnce(): ${label}. Nada será processado.`,
    );
    return;
  }

  try {
    const result = await jobModule.pollOnce();
    console.log(`[worker] pollOnce() executado para ${label}`, {
      ok: !!result,
    });
  } catch (err) {
    console.error(
      `[worker] erro ao executar pollOnce() em ${label}:`,
      err && err.stack ? err.stack : err,
    );
    throw err;
  }
}

// ------------------------------------------------------
// Schedulers das filas (necessários para jobs delayed/repeatable)
// ------------------------------------------------------
const metricsScheduler = new QueueScheduler(metricsSyncQueue.name, {
  connection,
});
const reportsScheduler = new QueueScheduler(reportsQueue.name, {
  connection,
});
const whatsappScheduler = new QueueScheduler(whatsappQueue.name, {
  connection,
});

metricsScheduler.on('failed', (jobId, err) => {
  console.error('[metrics-sync:scheduler] failed', jobId, err);
});
reportsScheduler.on('failed', (jobId, err) => {
  console.error('[reports-generation:scheduler] failed', jobId, err);
});
whatsappScheduler.on('failed', (jobId, err) => {
  console.error('[whatsapp-automation:scheduler] failed', jobId, err);
});

// ------------------------------------------------------
// Workers das filas
// ------------------------------------------------------
const metricsWorker = new Worker(
  metricsSyncQueue.name,
  async (job) => {
    console.log('[metricsSync] processing job', job.id, job.name);
    await runPollOnce(updateMetricsJob, 'updateMetricsJob');
  },
  { connection },
);

const reportsWorker = new Worker(
  reportsQueue.name,
  async (job) => {
    console.log('[reports] processing job', job.id, job.name);
    await runPollOnce(reportGenerationJob, 'reportGenerationJob');
  },
  { connection },
);

const whatsappWorker = new Worker(
  whatsappQueue.name,
  async (job) => {
    console.log('[whatsapp] processing job', job.id, job.name);
    await runPollOnce(automationWhatsAppJob, 'automationWhatsAppJob');
  },
  { connection },
);

// ------------------------------------------------------
// Logs de sucesso
// ------------------------------------------------------
metricsWorker.on('completed', (job) => {
  console.log('[metricsSync] job completed', job.id);
});

reportsWorker.on('completed', (job) => {
  console.log('[reports] job completed', job.id);
});

whatsappWorker.on('completed', (job) => {
  console.log('[whatsapp] job completed', job.id);
});

// ------------------------------------------------------
// Logs de erro
// ------------------------------------------------------
metricsWorker.on('failed', (job, err) => {
  console.error('[metricsSync] job failed', job?.id, err);
});

reportsWorker.on('failed', (job, err) => {
  console.error('[reports] job failed', job?.id, err);
});

whatsappWorker.on('failed', (job, err) => {
  console.error('[whatsapp] job failed', job?.id, err);
});

// ------------------------------------------------------
// Agendamento de jobs recorrentes (repeatable jobs)
// ------------------------------------------------------
async function ensureRepeatableJobs() {
  console.log('[worker] configurando repeatable jobs com períodos:', {
    METRICS_AGG_PERIOD_MS,
    REPORTS_GENERATION_PERIOD_MS,
    WHATSAPP_AUTOMATION_PERIOD_MS,
  });

  await metricsSyncQueue.add(
    'metrics-poll',
    {},
    {
      repeat: { every: METRICS_AGG_PERIOD_MS },
      jobId: 'metrics-poll',
      removeOnComplete: true,
    },
  );

  await reportsQueue.add(
    'reports-poll',
    {},
    {
      repeat: { every: REPORTS_GENERATION_PERIOD_MS },
      jobId: 'reports-poll',
      removeOnComplete: true,
    },
  );

  await whatsappQueue.add(
    'whatsapp-poll',
    {},
    {
      repeat: { every: WHATSAPP_AUTOMATION_PERIOD_MS },
      jobId: 'whatsapp-poll',
      removeOnComplete: true,
    },
  );

  console.log('[worker] repeatable jobs registrados com sucesso');
}

ensureRepeatableJobs().catch((err) => {
  console.error(
    '[worker] erro ao configurar repeatable jobs:',
    err && err.stack ? err.stack : err,
  );
});
