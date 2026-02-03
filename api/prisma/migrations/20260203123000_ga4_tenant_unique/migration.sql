-- Normalize GA4 integrations to one row per tenant
WITH ranked_integrations AS (
  SELECT
    id,
    "tenantId",
    "userId",
    "googleAccountEmail",
    "accessToken",
    "refreshTokenEnc",
    "tokenExpiry",
    "scope",
    "status",
    "lastError",
    "createdAt",
    "updatedAt",
    ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "updatedAt" DESC, "createdAt" DESC) AS rn,
    FIRST_VALUE("userId") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "userId" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_userId,
    FIRST_VALUE("googleAccountEmail") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "googleAccountEmail" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_googleAccountEmail,
    FIRST_VALUE("accessToken") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "accessToken" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_accessToken,
    FIRST_VALUE("refreshTokenEnc") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "refreshTokenEnc" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_refreshTokenEnc,
    FIRST_VALUE("tokenExpiry") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "tokenExpiry" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_tokenExpiry,
    FIRST_VALUE("scope") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "scope" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_scope,
    FIRST_VALUE("status") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "status" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_status,
    FIRST_VALUE("lastError") OVER (
      PARTITION BY "tenantId"
      ORDER BY CASE WHEN "lastError" IS NULL THEN 1 ELSE 0 END, "updatedAt" DESC, "createdAt" DESC
    ) AS keep_lastError
  FROM "integration_google_ga4"
), keep_integration AS (
  SELECT *
  FROM ranked_integrations
  WHERE rn = 1
)
UPDATE "integration_google_ga4" g
SET
  "userId" = ki.keep_userId,
  "googleAccountEmail" = ki.keep_googleAccountEmail,
  "accessToken" = ki.keep_accessToken,
  "refreshTokenEnc" = ki.keep_refreshTokenEnc,
  "tokenExpiry" = ki.keep_tokenExpiry,
  "scope" = COALESCE(ki.keep_scope, g."scope"),
  "status" = COALESCE(ki.keep_status, g."status"),
  "lastError" = ki.keep_lastError
FROM keep_integration ki
WHERE g.id = ki.id;

-- Reassign properties to the kept integration
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

-- Delete duplicate properties
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

-- Delete duplicate integrations
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
