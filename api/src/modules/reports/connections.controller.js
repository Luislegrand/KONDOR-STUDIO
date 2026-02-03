const {
  listConnectionsSchema,
  listAvailableSchema,
  linkConnectionSchema,
} = require('./connections.validators');
const connectionsService = require('./connections.service');

function formatValidationError(error) {
  return error.flatten ? error.flatten() : error.errors || error;
}

function handleError(res, err) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Erro inesperado';
  const details = err.details || null;
  return res.status(status).json({
    error: {
      code,
      message,
      details,
    },
  });
}

async function list(req, res) {
  const parsed = listConnectionsSchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: formatValidationError(parsed.error),
      },
    });
  }

  try {
    const items = await connectionsService.listConnections(
      req.tenantId,
      parsed.data.brandId,
    );
    return res.json({ items });
  } catch (err) {
    return handleError(res, err);
  }
}

async function listAvailable(req, res) {
  const parsed = listAvailableSchema.safeParse(req.query || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: formatValidationError(parsed.error),
      },
    });
  }

  try {
    const items = await connectionsService.listAvailableAccounts(
      req.tenantId,
      parsed.data.brandId,
      parsed.data.platform,
    );
    return res.json({ items });
  } catch (err) {
    return handleError(res, err);
  }
}

async function link(req, res) {
  const parsed = linkConnectionSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        details: formatValidationError(parsed.error),
      },
    });
  }

  try {
    const item = await connectionsService.linkConnection(
      req.tenantId,
      req.user?.id,
      parsed.data,
    );
    return res.status(201).json(item);
  } catch (err) {
    return handleError(res, err);
  }
}

module.exports = {
  list,
  listAvailable,
  link,
};
