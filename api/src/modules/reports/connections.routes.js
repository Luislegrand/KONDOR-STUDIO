const express = require('express');
const connectionsController = require('./connections.controller');
const { requireReportingRole } = require('../reporting/reportingAccess.middleware');

const router = express.Router();

const allowViewer = requireReportingRole('viewer');
const allowEditor = requireReportingRole('editor');

router.get('/', allowViewer, connectionsController.list);
router.get('/available', allowViewer, connectionsController.listAvailable);
router.post('/', allowEditor, connectionsController.link);

module.exports = router;
