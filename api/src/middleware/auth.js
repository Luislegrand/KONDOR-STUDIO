// api/src/middleware/auth.js
// Middleware de autenticação JWT e injeção do usuário/tenant no request

const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_local_secret';

// Suporte simples a token em header "Authorization: Bearer <token>"
// ou ?token=... (útil para testes)
function extractToken(req) {
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }
  }
  // fallback: query param
  if (req.query && req.query.token) return req.query.token;
  return null;
}

/**
 * Middleware padrão de auth para USUÁRIOS internos (User).
 * Espera tokens com payload contendo userId/id/sub.
 */
async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // token expirado ou inválido
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    // O payload pode conter userId ou sub dependendo de como o token foi gerado
    const userId = payload.userId || payload.id || payload.sub;
    if (!userId) {
      return res
        .status(401)
        .json({ error: 'Token sem identificação de usuário' });
    }

    // Busca usuário no banco (traz apenas campos necessários)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Injeta dados úteis no request para uso posterior
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    req.tenantId = user.tenantId;

    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res
      .status(500)
      .json({ error: 'Erro no servidor ao validar token' });
  }
}

/**
 * Middleware específico para CLIENTE (portal do cliente).
 * Espera tokens com payload:
 *   { type: 'client', clientId, tenantId }
 */
async function requireClientAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    if (payload.type !== 'client' || !payload.clientId || !payload.tenantId) {
      return res
        .status(401)
        .json({ error: 'Token não é de cliente ou está incompleto' });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: payload.clientId,
        tenantId: payload.tenantId,
      },
      select: {
        id: true,
        name: true,
        tenantId: true,
        portalEmail: true,
      },
    });

    if (!client) {
      return res.status(401).json({ error: 'Cliente não encontrado' });
    }

    req.client = {
      id: client.id,
      name: client.name,
      email: client.portalEmail || null,
    };
    req.clientId = client.id;
    req.tenantId = client.tenantId;

    return next();
  } catch (error) {
    console.error('Client auth middleware error:', error);
    return res
      .status(500)
      .json({ error: 'Erro no servidor ao validar token do cliente' });
  }
}

/**
 * Middleware de autorização por ROLE para USUÁRIOS internos.
 * Exemplo de uso:
 *   const auth = require('../middleware/auth');
 *   router.get('/billing', auth, auth.requireRole('OWNER', 'ADMIN'), handler);
 */
function requireRole(...allowedRoles) {
  const normalizedAllowed = new Set(
    (allowedRoles || []).map((r) => String(r).toUpperCase())
  );

  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.role) {
      return res.status(403).json({ error: 'Acesso não permitido' });
    }

    const currentRole = String(user.role).toUpperCase();
    if (!normalizedAllowed.has(currentRole)) {
      return res.status(403).json({ error: 'Acesso não permitido' });
    }

    return next();
  };
}

// Export padrão continua sendo o authMiddleware de usuário
module.exports = authMiddleware;

// Exports auxiliares para quem precisar de client portal / roles
module.exports.requireClientAuth = requireClientAuth;
module.exports.requireRole = requireRole;
