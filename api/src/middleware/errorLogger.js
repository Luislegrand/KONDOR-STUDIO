// api/src/middleware/errorLogger.js
// Middleware global para capturar erros e registrar em SystemLog

const { prisma } = require('../prisma');

function parseError(err) {
  if (!err) return { message: 'Erro desconhecido' };
  if (typeof err === 'string') return { message: err };

  const base = {
    message: err.message || 'Erro sem mensagem',
    stack: err.stack || null,
    name: err.name || 'Error',
  };

  if (err.code) base.code = err.code;
  if (err.status || err.statusCode) base.status = err.status || err.statusCode;
  if (err.details) base.details = err.details;

  return base;
}

function sanitizeStack(stack) {
  if (!stack) return null;
  const lines = String(stack).split('\n').slice(0, 15);
  return lines.join('\n');
}

function errorLogger(options = {}) {
  const {
    level = 'ERROR',
    source = 'API',
    logRequestBody = false,
  } = options;

  return async (err, req, res, next) => {
    try {
      const parsed = parseError(err);
      const payload = {
        level,
        source,
        message: parsed.message.slice(0, 500),
        stack: sanitizeStack(parsed.stack),
        tenantId: req.tenantId || null,
      };

      const meta = {
        method: req.method,
        url: req.originalUrl,
        status: err.status || err.statusCode || null,
        userId: req.user ? req.user.id : null,
        ip: req.ip || req.headers['x-forwarded-for'] || null,
      };

      if (err.code) meta.code = err.code;
      if (err.details) meta.details = err.details;
      if (logRequestBody && req.body) meta.body = req.body;

      payload.metadata = meta;

      await prisma.systemLog.create({
        data: {
          level: payload.level,
          source: payload.source,
          message: payload.message,
          stack: payload.stack,
          tenantId: payload.tenantId,
          metadata: payload.metadata,
        },
      });
    } catch (loggingErr) {
      console.error('[ERROR_LOGGER] Falha ao registrar log', loggingErr);
    }

    console.error('❌ Erro não tratado:', err && err.stack ? err.stack : err);

    if (res.headersSent) {
      return next(err);
    }

    return res
      .status(err.status || err.statusCode || 500)
      .json({ error: err.message || 'Erro interno do servidor' });
  };
}

module.exports = errorLogger;
