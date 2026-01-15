const express = require('express');

const controller = require('../controllers/integrationsGa4Controller');

const router = express.Router();

router.get('/oauth/callback', controller.oauthCallback);

module.exports = router;
