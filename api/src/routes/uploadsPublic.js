const express = require('express');
const router = express.Router();
const uploadsService = require('../services/uploadsService');

function detectRequestProtocol(req) {
  const header = (req.headers['x-forwarded-proto'] || '')
    .toString()
    .split(',')[0]
    .trim();
  return header || req.protocol || 'http';
}

function forceProtocol(urlString, protocol) {
  if (!urlString || !protocol) return urlString;
  try {
    const parsed = new URL(urlString);
    const normalizedProtocol = protocol.endsWith(':')
      ? protocol
      : `${protocol}:`;
    if (parsed.protocol !== normalizedProtocol) {
      parsed.protocol = normalizedProtocol;
    }
    return parsed.toString();
  } catch (err) {
    return urlString;
  }
}

/**
 * Rota pública para servir arquivos upados no S3/local storage.
 * Não exige autenticação porque apenas gera um redirect seguro.
 */
router.get('/:key', async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    if (!key) return res.status(404).json({ error: 'Arquivo não encontrado' });

    const fileUrl = await uploadsService.getUrlForKey(key);
    if (!fileUrl) return res.status(404).json({ error: 'Arquivo não encontrado' });

    if (/^https?:\/\//i.test(fileUrl)) {
      return res.redirect(fileUrl);
    }

    const requestProtocol = detectRequestProtocol(req);
    const baseUrl =
      process.env.UPLOADS_BASE_URL ||
      process.env.API_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      process.env.RENDER_EXTERNAL_URL ||
      `${requestProtocol}://${req.get('host')}`;
    const normalized = forceProtocol(baseUrl, requestProtocol).replace(/\/$/, '');
    const absoluteUrl = `${normalized}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
    return res.redirect(absoluteUrl);
  } catch (err) {
    console.error('GET /uploads/public/:key error:', err);
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
});

module.exports = router;
