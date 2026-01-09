const {
  reportGenerateQueue,
  dashboardRefreshQueue,
} = require('../../queues');
const reportingGeneration = require('./reportingGeneration.service');

const REPORTING_JOB_ATTEMPTS =
  Number(process.env.REPORTING_JOB_ATTEMPTS) || 3;
const REPORTING_JOB_BACKOFF_MS =
  Number(process.env.REPORTING_JOB_BACKOFF_MS) || 15000;

async function enqueueReportGeneration(tenantId, reportId) {
  if (!tenantId || !reportId) {
    const err = new Error('tenantId e reportId sao obrigatorios');
    err.status = 400;
    throw err;
  }

  if (!reportGenerateQueue) {
    return reportingGeneration.generateReportData(tenantId, reportId);
  }

  return reportGenerateQueue.add(
    'reporting_generate',
    { tenantId, reportId },
    {
      attempts: REPORTING_JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: REPORTING_JOB_BACKOFF_MS },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

async function enqueueDashboardRefresh(tenantId, payload = {}) {
  if (!tenantId) {
    const err = new Error('tenantId obrigatorio');
    err.status = 400;
    throw err;
  }

  if (!dashboardRefreshQueue) {
    return reportingGeneration.refreshDashboards(tenantId, payload);
  }

  return dashboardRefreshQueue.add(
    'dashboard_refresh',
    { tenantId, ...payload },
    {
      attempts: REPORTING_JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: REPORTING_JOB_BACKOFF_MS },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}

module.exports = {
  enqueueReportGeneration,
  enqueueDashboardRefresh,
};
