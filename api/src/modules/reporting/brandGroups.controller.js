const brandGroupsService = require('./brandGroups.service');
const { hasBrandScope } = require('./reportingScope.service');

module.exports = {
  async list(req, res) {
    try {
      if (hasBrandScope(req.reportingScope)) {
        return res.json({ items: [] });
      }
      const items = await brandGroupsService.listGroups(req.tenantId);
      return res.json({ items });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao listar grupos' });
    }
  },

  async listMembers(req, res) {
    try {
      if (hasBrandScope(req.reportingScope)) {
        return res.status(403).json({ error: 'Acesso negado para este cliente' });
      }
      const items = await brandGroupsService.listGroupMembers(
        req.tenantId,
        req.params.groupId,
      );
      return res.json({ items });
    } catch (err) {
      const status = err.status || 500;
      return res.status(status).json({ error: err.message || 'Erro ao listar membros' });
    }
  },
};
