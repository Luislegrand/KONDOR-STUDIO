// api/src/routes/clientPortal.js
// Rotas específicas para o PORTAL DO CLIENTE
// Autenticação via token JWT com payload { type: 'client', clientId, tenantId }

const express = require('express');
const jwt = require('jsonwebtoken');
const { prisma } = require('../prisma');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_local_secret';

/**
 * Extrai token do header Authorization: Bearer <token>
 */
function extractToken(req) {
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      return parts[1];
    }
  }
  // fallback opcional: ?token=...
  if (req.query && req.query.token) return req.query.token;
  return null;
}

/**
 * Middleware de autenticação específico para CLIENTE
 * - Verifica token JWT
 * - Exige payload.type === 'client'
 * - Carrega Client do banco e injeta em req.client + req.tenantId
 */
async function clientAuth(req, res, next) {
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

    if (!payload || payload.type !== 'client') {
      return res.status(401).json({ error: 'Token não é de cliente' });
    }

    const clientId = payload.clientId;
    const tenantId = payload.tenantId;

    if (!clientId || !tenantId) {
      return res.status(401).json({ error: 'Token de cliente incompleto' });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        phone: true,
        metadata: true,
      },
    });

    if (!client) {
      return res.status(401).json({ error: 'Cliente não encontrado' });
    }

    req.client = client;
    req.tenantId = tenantId;

    return next();
  } catch (err) {
    console.error('clientAuth error:', err);
    return res.status(500).json({ error: 'Erro ao validar token de cliente' });
  }
}

/**
 * GET /api/client-portal/me
 * Retorna dados básicos do cliente logado
 */
router.get('/me', clientAuth, async (req, res) => {
  const client = req.client;
  return res.json({
    client: {
      id: client.id,
      tenantId: client.tenantId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      metadata: client.metadata || {},
    },
  });
});

/**
 * GET /api/client-portal/posts
 * Lista posts do cliente logado (por tenant + clientId)
 * Query opcional:
 *  - status: filtra por status (approved, scheduled, published, etc.)
 */
router.get('/posts', clientAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const clientId = req.client.id;
    const { status } = req.query || {};

    const where = {
      tenantId,
      clientId,
    };

    if (status) {
      where.status = status;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ items: posts });
  } catch (err) {
    console.error('GET /client-portal/posts error:', err);
    return res.status(500).json({ error: 'Erro ao buscar posts do cliente' });
  }
});

/**
 * GET /api/client-portal/metrics
 * Retorna métricas associadas a posts do cliente
 * Opcional:
 *  - days: limitar por últimos N dias
 */
router.get('/metrics', clientAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const clientId = req.client.id;
    const days = req.query.days ? parseInt(req.query.days, 10) : null;

    const dateFilter = {};
    if (Number.isFinite(days) && days > 0) {
      const d = new Date();
      d.setDate(d.getDate() - days);
      dateFilter.gte = d;
    }

    const metrics = await prisma.metric.findMany({
      where: {
        tenantId,
        ...(Object.keys(dateFilter).length
          ? { collectedAt: dateFilter }
          : {}),
        // filtra por posts cujo clientId = cliente logado
        post: {
          clientId,
        },
      },
      orderBy: {
        collectedAt: 'desc',
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return res.json({ items: metrics });
  } catch (err) {
    console.error('GET /client-portal/metrics error:', err);
    return res.status(500).json({ error: 'Erro ao buscar métricas do cliente' });
  }
});

/**
 * GET /api/client-portal/approvals
 * Lista aprovações ligadas a posts do cliente
 * Query opcional:
 *  - status: PENDING | APPROVED | REJECTED
 */
router.get('/approvals', clientAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const clientId = req.client.id;
    const { status } = req.query || {};

    const where = {
      tenantId,
      post: {
        clientId,
      },
    };

    if (status) {
      where.status = status;
    }

    const approvals = await prisma.approval.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return res.json({ items: approvals });
  } catch (err) {
    console.error('GET /client-portal/approvals error:', err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar aprovações do cliente' });
  }
});

/**
 * GET /api/client-portal/reports
 * Lista relatórios do tenant (por enquanto, sem filtro fino por cliente)
 */
router.get('/reports', clientAuth, async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const reports = await prisma.report.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ items: reports });
  } catch (err) {
    console.error('GET /client-portal/reports error:', err);
    return res
      .status(500)
      .json({ error: 'Erro ao buscar relatórios do cliente' });
  }
});

module.exports = router;
