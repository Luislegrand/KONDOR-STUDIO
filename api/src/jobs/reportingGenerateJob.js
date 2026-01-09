const reportingGeneration = require('../modules/reporting/reportingGeneration.service');

async function processJob(data = {}) {
  const tenantId = data.tenantId;
  const reportId = data.reportId;
  if (!tenantId || !reportId) {
    const err = new Error('tenantId/reportId obrigatorios');
    err.status = 400;
    throw err;
  }
  return reportingGeneration.generateReportData(tenantId, reportId);
}

module.exports = {
  processJob,
};
