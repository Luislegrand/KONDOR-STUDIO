-- Normalize GA4 integrations to one row per tenant
WITH ranked_integrations AS (
  SELECT
    id,
    "tenantId",
    ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "updatedAt" DESC, "createdAt" DESC) AS rn
  FROM "integration_google_ga4"
), keep_integration AS (
  SELECT id, "tenantId"
  FROM ranked_integrations
  WHERE rn = 1
), ranked_properties AS (
  SELECT
    p.id,
    p."tenantId",
    p."propertyId",
    ROW_NUMBER() OVER (
      PARTITION BY p."tenantId", p."propertyId"
      ORDER BY p."updatedAt" DESC, p."createdAt" DESC
    ) AS rn
  FROM "integration_google_ga4_properties" p
), keep_properties AS (
  SELECT rp.id, ki.id AS "integrationId"
  FROM ranked_properties rp
  JOIN keep_integration ki ON ki."tenantId" = rp."tenantId"
  WHERE rp.rn = 1
)
UPDATE "integration_google_ga4_properties" p
SET "integrationId" = kp."integrationId"
FROM keep_properties kp
WHERE p.id = kp.id;

WITH ranked_properties AS (
  SELECT
    p.id,
    p."tenantId",
    p."propertyId",
    ROW_NUMBER() OVER (
      PARTITION BY p."tenantId", p."propertyId"
      ORDER BY p."updatedAt" DESC, p."createdAt" DESC
    ) AS rn
  FROM "integration_google_ga4_properties" p
)
DELETE FROM "integration_google_ga4_properties"
WHERE id IN (
  SELECT id FROM ranked_properties WHERE rn > 1
);

WITH ranked_integrations AS (
  SELECT
    id,
    "tenantId",
    ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "updatedAt" DESC, "createdAt" DESC) AS rn
  FROM "integration_google_ga4"
)
DELETE FROM "integration_google_ga4"
WHERE id IN (
  SELECT id FROM ranked_integrations WHERE rn > 1
);

-- Drop old composite unique + redundant index
DROP INDEX IF EXISTS "integration_google_ga4_tenantId_userId_key";
DROP INDEX IF EXISTS "integration_google_ga4_tenantId_idx";

-- Add unique index on tenantId
CREATE UNIQUE INDEX IF NOT EXISTS "integration_google_ga4_tenantId_key" ON "integration_google_ga4"("tenantId");
