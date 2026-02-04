ALTER TABLE "report_dashboard_export"
ADD COLUMN IF NOT EXISTS "publicTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "publicTokenUsedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "report_dashboard_export_publicTokenExpiresAt_idx"
ON "report_dashboard_export"("publicTokenExpiresAt");
