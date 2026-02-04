-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'spend',
  'Spend',
  'Investimento total',
  'CURRENCY',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'spend'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'impressions',
  'Impressions',
  'Quantidade de impressões',
  'NUMBER',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'impressions'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'clicks',
  'Clicks',
  'Quantidade de cliques',
  'NUMBER',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'clicks'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'conversions',
  'Conversions',
  'Conversões atribuídas',
  'NUMBER',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'conversions'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'revenue',
  'Revenue',
  'Receita atribuída',
  'CURRENCY',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'revenue'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'sessions',
  'Sessions',
  'Sessões (GA4)',
  'NUMBER',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'sessions'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'leads',
  'Leads',
  'Leads gerados',
  'NUMBER',
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'leads'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'ctr',
  'CTR',
  'Click-through rate',
  'PERCENT',
  'clicks / impressions',
  '["clicks","impressions"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'ctr'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'cpc',
  'CPC',
  'Custo por clique',
  'CURRENCY',
  'spend / clicks',
  '["spend","clicks"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'cpc'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'cpm',
  'CPM',
  'Custo por mil impressões',
  'CURRENCY',
  '(spend / impressions) * 1000',
  '["spend","impressions"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'cpm'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'cpa',
  'CPA',
  'Custo por aquisição',
  'CURRENCY',
  'spend / conversions',
  '["spend","conversions"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'cpa'
);

INSERT INTO "metrics_catalog" (
  "id",
  "key",
  "label",
  "description",
  "format",
  "formula",
  "requiredFields",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'roas',
  'ROAS',
  'Retorno sobre investimento em mídia',
  'RATIO',
  'revenue / spend',
  '["revenue","spend"]'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "metrics_catalog"
  WHERE "key" = 'roas'
);
