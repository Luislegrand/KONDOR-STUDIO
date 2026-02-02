const express = require('express');

const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const dashboardsRoutes = require('../modules/reports/dashboards.routes');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use('/', dashboardsRoutes);

module.exports = router;
