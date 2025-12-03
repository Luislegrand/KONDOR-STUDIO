// api/src/middleware/checkSubscription.js
//
// Middleware que verifica se o tenant tem uma assinatura válida.
// Atualizado para:
//  - Permitir registro, login, refresh, health, e subscribe SEM bloquear.
//  - Liberar planos publicamente.
//  - Considerar TRIAL e ACTIVE como status válidos.
//  - Bloquear somente quando realmente expirado.
//  - Evitar travar o sistema quando não deveria.
//  - Ser totalmente compatível com seu fluxo atual.
//
// Ajuste nomes de modelos/campos conforme o seu Prisma (Subscription, Plan, tenantId etc.)
//

const dayjs = require("dayjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Paths que SEMPRE são liberados:
 * - login/logout/refresh
 * - registro da agência
 * - health checks
 * - listar planos
 * - escolher/alterar plano (subscribe) MESMO expirada
 * - rotas públicas (aprovação via link)
 */
const ALWAYS_ALLOWED = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/tenants/register",
  "/api/billing/plans",
  "/api/billing/subscribe",
  "/api/health",
  "/api/ready",
  "/api/healthz",
];

// Prefixos de rotas públicas
const PUBLIC_PREFIXES = [
  "/api/public",
];

function isAlwaysAllowed(path) {
  return ALWAYS_ALLOWED.some((allowed) => path.startsWith(allowed));
}

function isPublicRoute(path) {
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}

async function checkSubscription(req, res, next) {
  try {
    const path = req.originalUrl || req.path || "";

    // 1) libera rotas públicas (aprovações por link)
    if (isPublicRoute(path)) {
      return next();
    }

    // 2) libera rotas essenciais (login, register, billing/plans, subscribe)
    if (isAlwaysAllowed(path)) {
      return next();
    }

    // 3) se nao tem tenantId, nao dá pra verificar assinatura
    //    e normalmente significa rota pública → libera
    if (!req.tenantId) {
      return next();
    }

    // 4) buscar assinatura mais recente
    const subscription = await prisma.subscription.findFirst({
      where: {
        tenantId: req.tenantId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 5) sem assinatura = bloqueado (exceto rotas liberadas acima)
    if (!subscription) {
      return res.status(402).json({
        error: "Assinatura necessária para continuar.",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    // 6) validar status
    const validStatuses = ["trial", "active"];
    if (!validStatuses.includes(subscription.status)) {
      return res.status(402).json({
        error: "Sua assinatura não está ativa.",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // 7) validar data de expiração
    const now = dayjs();
    const end = subscription.currentPeriodEnd
      ? dayjs(subscription.currentPeriodEnd)
      : null;

    if (end && end.isBefore(now)) {
      return res.status(402).json({
        error: "Seu período terminou.",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    // 8) assinatura válida → segue
    req.subscription = subscription;
    return next();

  } catch (err) {
    console.error("[CHECK_SUBSCRIPTION_ERROR]", err);

    // Para evitar travar a plataforma inteira com um erro de verificação,
    // libera o acesso, mas loga o erro.
    return next();
  }
}

module.exports = { checkSubscription };
