DO $$
BEGIN
  CREATE TYPE "ReportPublicShareStatus" AS ENUM ('ACTIVE', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "report_public_share" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "dashboardId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "ReportPublicShareStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  CONSTRAINT "report_public_share_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "report_public_share_tokenHash_key"
  ON "report_public_share"("tokenHash");

CREATE INDEX IF NOT EXISTS "report_public_share_tenantId_idx"
  ON "report_public_share"("tenantId");

CREATE INDEX IF NOT EXISTS "report_public_share_dashboardId_idx"
  ON "report_public_share"("dashboardId");

CREATE INDEX IF NOT EXISTS "report_public_share_status_idx"
  ON "report_public_share"("status");

CREATE UNIQUE INDEX IF NOT EXISTS "report_public_share_dashboard_active_key"
  ON "report_public_share"("dashboardId")
  WHERE "status" = 'ACTIVE';

DO $$
BEGIN
  ALTER TABLE "report_public_share"
    ADD CONSTRAINT "report_public_share_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "report_public_share"
    ADD CONSTRAINT "report_public_share_dashboardId_fkey"
    FOREIGN KEY ("dashboardId") REFERENCES "report_dashboard"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  ALTER TABLE "report_public_share"
    ADD CONSTRAINT "report_public_share_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

INSERT INTO "report_public_share" (
  "id",
  "tenantId",
  "dashboardId",
  "tokenHash",
  "status",
  "createdByUserId",
  "createdAt"
)
SELECT
  d."id" || '-public-share',
  d."tenantId",
  d."id",
  d."sharedTokenHash",
  'ACTIVE'::"ReportPublicShareStatus",
  d."createdByUserId",
  COALESCE(d."sharedAt", CURRENT_TIMESTAMP)
FROM "report_dashboard" d
WHERE d."sharedEnabled" = true
  AND d."sharedTokenHash" IS NOT NULL
ON CONFLICT ("tokenHash") DO NOTHING;
