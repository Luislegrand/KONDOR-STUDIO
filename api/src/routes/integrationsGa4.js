const express = require('express');

const authMiddleware = require('../middleware/auth');
const tenantGuard = require('../middleware/tenantGuard');
const validate = require('../middleware/validate');
const {
  propertySelectSchema,
} = require('../validators/ga4Validator');
const controller = require('../controllers/integrationsGa4Controller');

const router = express.Router();

router.use(authMiddleware, tenantGuard);

router.get('/oauth/start', controller.oauthStart);
router.get('/status', controller.status);
router.post('/disconnect', controller.disconnect);
router.get('/properties/sync', controller.propertiesSync);
router.get('/properties', controller.propertiesList);
router.post('/properties/select', validate(propertySelectSchema), controller.propertiesSelect);
router.post('/demo-report', controller.demoReport);
router.get('/metadata', controller.metadata);

module.exports = router;
