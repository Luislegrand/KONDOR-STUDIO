const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const integrationsController = require('../controllers/integrationsController');

// Todas as rotas de integração exigem auth + tenant (mesmo já aplicados em server.js,
// mantemos aqui para uso isolado em testes/serviços).
router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', integrationsController.list);
router.post('/', integrationsController.create);
router.post(
  '/clients/:clientId/integrations/:provider/connect',
  integrationsController.connectForClient
);
router.get('/:id', integrationsController.getById);
router.put('/:id', integrationsController.update);
router.delete('/:id', integrationsController.remove);
router.post('/:id/disconnect', integrationsController.disconnect);

module.exports = router;
