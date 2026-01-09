const express = require('express');

const router = express.Router();

router.get('/health', (req, res) => {
  return res.json({ ok: true, module: 'reporting' });
});

module.exports = router;
