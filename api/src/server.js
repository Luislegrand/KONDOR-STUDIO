/**
 * KONDOR STUDIO — SERVER.JS (VERSÃO BLINDADA + CLIENT PORTAL)
 * API Express + Prisma + Multi-tenant + AuditLog
 */

require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { prisma } = require("./prisma");

const authMiddleware = require("./middleware/auth");
const tenantMiddleware = require("./middleware/tenant");
const auditLog = require("./middleware/auditLog");
// checkSubscription desativado por enquanto
// const checkSubscription = require("./middleware/checkSubscription");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

/* ============================================
   HELPERS
============================================ */

/**
 * Monta rotas de forma segura:
 * - Se o router não for uma função (express.Router), NÃO monta e loga aviso.
 */
function safeMount(path, router) {
  if (router && typeof router === "function") {
    app.use(path, router);
  } else {
    console.warn(
      `⚠️ Rota "${path}" NÃO montada: export inválido em require(...) (esperado express.Router, recebido ${typeof router}).`
    );
  }
}

/* ============================================
   MIDDLEWARES BÁSICOS
============================================ */

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(helmet());
app.use(morgan(isProduction ? "combined" : "dev"));

/* ============================================
   CORS HARDENING
============================================ */

const devOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
];

let envOrigins = [];
if (process.env.CORS_ORIGIN) {
  envOrigins = process.env.CORS_ORIGIN.split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const allowedOrigins = Array.from(new Set([...devOrigins, ...envOrigins]));

if (isProduction && envOrigins.length === 0) {
  console.error(
    "⚠️  CORS_ORIGIN não definido em produção. Configure domínios do painel/portal para evitar bloqueios."
  );
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`🚫 CORS bloqueado para origem: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

/* ============================================
   HEALTHCHECKS
============================================ */

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/healthz", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ status: "ok", db: "ok" });
  } catch (err) {
    console.error("❌ Healthcheck /healthz falhou:", err);
    return res.status(500).json({ status: "error", db: "error" });
  }
});

/* ============================================
   ROTAS PÚBLICAS
============================================ */

const authRoutes = require("./routes/auth");

// Portal do cliente usa JWT próprio (type: "client")
const clientPortalRoutes = require("./routes/clientPortal");

let publicRoutes;
try {
  publicRoutes = require("./routes/public");
} catch (e) {
  try {
    publicRoutes = require("./routes/publicApprovals");
  } catch (err) {
    publicRoutes = null;
    console.warn(
      "⚠️ Rotas públicas não foram carregadas. Verifique ./routes/public ou ./routes/publicApprovals."
    );
  }
}

// Auth de usuário interno (painel)
safeMount("/api/auth", authRoutes);

// Rotas públicas (links de aprovação etc.)
if (publicRoutes) {
  safeMount("/api/public", publicRoutes);
}

// 🔹 Portal do cliente – protegido pelo clientAuth dentro do router
// IMPORTANTE: montado ANTES do app.use("/api", authMiddleware...)
safeMount("/api/client-portal", clientPortalRoutes);

/* ============================================
   ROTAS AUTENTICADAS / MULTI-TENANT (USUÁRIO INTERNO)
============================================ */

// Tudo em /api depois daqui exige auth + tenant (usuário da agência)
app.use("/api", authMiddleware, tenantMiddleware);

/* ============================================
   AUDIT LOG (opcional)
============================================ */

const auditLogEnabled = process.env.AUDIT_LOG_ENABLED === "true";

if (auditLogEnabled) {
  const skip = process.env.AUDITLOG_SKIP_REGEX
    ? process.env.AUDITLOG_SKIP_REGEX
    : "^/health(z)?$|^/health$|^/api/auth";
  const bodyMax = Number(process.env.AUDITLOG_BODY_MAX || 2000);

  console.log("📝 Audit Log ATIVADO", { skip, bodyMax });

  app.use(
    "/api",
    auditLog({
      skip,
      bodyMax,
    })
  );
} else {
  console.log("📘 Audit Log DESATIVADO (AUDIT_LOG_ENABLED != 'true')");
}

/* ============================================
   ROTAS DE NEGÓCIO (PROTEGIDAS - USUÁRIOS INTERNOS)
============================================ */

const tenantsRoutes = require("./routes/tenants");
const clientsRoutes = require("./routes/clients");
const postsRoutes = require("./routes/posts");
const tasksRoutes = require("./routes/tasks");
const metricsRoutes = require("./routes/metrics");
const approvalsRoutes = require("./routes/approvals");
const integrationsRoutes = require("./routes/integrations");
const reportsRoutes = require("./routes/reports");
const billingRoutes = require("./routes/billing");
const teamRoutes = require("./routes/team");
let automationRoutes = null;

try {
  automationRoutes = require("./routes/automation");
} catch (err) {
  console.warn(
    "ℹ️ Rotas de automation (WhatsApp / automações) não foram carregadas. Verifique ./routes/automation se necessário."
  );
}

// Montagem protegida: se alguma rota exportar objeto errado, apenas loga e segue o jogo.
safeMount("/api/tenants", tenantsRoutes);
safeMount("/api/clients", clientsRoutes);
safeMount("/api/posts", postsRoutes);
safeMount("/api/tasks", tasksRoutes);
safeMount("/api/metrics", metricsRoutes);
safeMount("/api/approvals", approvalsRoutes);
safeMount("/api/integrations", integrationsRoutes);
safeMount("/api/reports", reportsRoutes);
safeMount("/api/billing", billingRoutes);
safeMount("/api/team", teamRoutes);

if (automationRoutes) {
  safeMount("/api/automation", automationRoutes);
}

/* ============================================
   404 / ERRO GENÉRICO
============================================ */

app.use((req, res, next) => {
  if (res.headersSent) return next();
  return res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err && err.stack ? err.stack : err);

  if (res.headersSent) {
    return next(err);
  }

  return res
    .status(err.status || 500)
    .json({ error: err.message || "Erro interno do servidor" });
});

/* ============================================
   START
============================================ */

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/healthz`);
});
