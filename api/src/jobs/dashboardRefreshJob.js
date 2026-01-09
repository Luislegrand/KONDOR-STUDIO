const reportingGeneration = require('../modules/reporting/reportingGeneration.service');

async function processJob(data = {}) {
  const tenantId = data.tenantId;
  if (!tenantId) {
    const err = new Error('tenantId obrigatorio');
    err.status = 400;
    throw err;
  }
  return reportingGeneration.refreshDashboards(tenantId, data);
}

module.exports = {
  processJob,
};
