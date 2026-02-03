const express = require('express');

const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const connectionsRoutes = require('../modules/reports/connections.routes');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use('/', connectionsRoutes);

module.exports = router;
