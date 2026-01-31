const reportDeliveriesService = require("./reportDeliveries.service");

module.exports = {
  async list(req, res) {
    try {
      const items = await reportDeliveriesService.listReportDeliveries(
        req.tenantId,
        req.params.id,
        req.reportingScope
      );
      return res.json({ items });
    } catch (err) {
      const status = err.statusCode || err.status || 500;
      return res.status(status).json({
        error: err.message || "Erro ao listar envios",
      });
    }
  },

  async create(req, res) {
    try {
      const record = await reportDeliveriesService.createReportDelivery(
        req.tenantId,
        req.params.id,
        req.body || {},
        req.reportingScope,
        req.user
      );
      return res.status(201).json(record);
    } catch (err) {
      const status = err.statusCode || err.status || 500;
      return res.status(status).json({
        error: err.message || "Erro ao registrar envio",
      });
    }
  },
};
