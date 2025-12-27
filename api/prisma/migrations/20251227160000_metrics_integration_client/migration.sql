-- AlterTable
ALTER TABLE "metrics" DROP CONSTRAINT IF EXISTS "metrics_postId_fkey";
ALTER TABLE "metrics" ALTER COLUMN "postId" DROP NOT NULL;
ALTER TABLE "metrics" ADD COLUMN "clientId" TEXT;
ALTER TABLE "metrics" ADD COLUMN "integrationId" TEXT;
ALTER TABLE "metrics" ADD COLUMN "provider" TEXT;
ALTER TABLE "metrics" ADD COLUMN "rangeFrom" TIMESTAMP(3);
ALTER TABLE "metrics" ADD COLUMN "rangeTo" TIMESTAMP(3);

-- Add foreign keys
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "metrics_clientId_idx" ON "metrics"("clientId");
CREATE INDEX "metrics_integrationId_idx" ON "metrics"("integrationId");
