-- AlterEnum
ALTER TYPE "IntegrationProvider" ADD VALUE 'WHATSAPP_META_CLOUD';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IntegrationStatus" ADD VALUE 'CONNECTED';
ALTER TYPE "IntegrationStatus" ADD VALUE 'DISCONNECTED';

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "approvalLinkToken" TEXT,
ADD COLUMN     "clientNote" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "sentMethod" TEXT;

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN     "accessTokenEncrypted" TEXT,
ADD COLUMN     "config" JSONB,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WhatsAppMessageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "waMessageId" TEXT,
    "direction" TEXT NOT NULL,
    "fromE164" TEXT,
    "toE164" TEXT,
    "payload" JSONB NOT NULL,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessageLog_waMessageId_key" ON "WhatsAppMessageLog"("waMessageId");

-- CreateIndex
CREATE INDEX "WhatsAppMessageLog_tenantId_idx" ON "WhatsAppMessageLog"("tenantId");

