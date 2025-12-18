/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,provider,ownerKey]` on the table `integrations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[salaryRecordId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - Made the column `occurredAt` on table `financial_records` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "IntegrationOwnerType" AS ENUM ('AGENCY', 'CLIENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "SupportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TenantStatus" AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterEnum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Role'
      AND e.enumlabel = 'SUPER_ADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';
  END IF;
END
$$;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "whatsappNumberE164" TEXT;

-- AlterTable
UPDATE "financial_records"
SET "occurredAt" = COALESCE("createdAt", NOW())
WHERE "occurredAt" IS NULL;
ALTER TABLE "financial_records" ALTER COLUMN "occurredAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "integrations" ADD COLUMN IF NOT EXISTS "clientId" TEXT,
ADD COLUMN IF NOT EXISTS "ownerKey" TEXT NOT NULL DEFAULT 'AGENCY',
ADD COLUMN IF NOT EXISTS "ownerType" "IntegrationOwnerType" NOT NULL DEFAULT 'AGENCY';

WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY "tenantId", "provider", "ownerKey"
      ORDER BY "createdAt" ASC, id ASC
    ) AS rn
  FROM "integrations"
)
UPDATE "integrations" i
SET "ownerKey" = i."ownerKey" || '_' || i.id
FROM ranked r
WHERE i.id = r.id AND r.rn > 1;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "whatsappMessageId" TEXT,
ADD COLUMN IF NOT EXISTS "whatsappSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "deviceName" TEXT,
ADD COLUMN IF NOT EXISTS "ip" TEXT,
ADD COLUMN IF NOT EXISTS "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
ADD COLUMN IF NOT EXISTS "userAgent" TEXT;

-- AlterTable
ALTER TABLE "session_tokens" ADD COLUMN IF NOT EXISTS "meta" JSONB;

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "salaryCents" INTEGER,
ADD COLUMN IF NOT EXISTS "salaryRecordId" TEXT;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "status" "TenantStatus" NOT NULL DEFAULT 'TRIAL';

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "tenantId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "job_logs" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "jobId" TEXT,
    "status" TEXT NOT NULL,
    "attempts" INTEGER,
    "tenantId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_notes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "SupportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "from" TEXT NOT NULL,
    "waMessageId" TEXT,
    "phoneNumberId" TEXT,
    "type" TEXT NOT NULL,
    "textBody" TEXT,
    "rawPayload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_logs_tenantId_idx" ON "system_logs"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_logs_source_idx" ON "system_logs"("source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_logs_tenantId_idx" ON "job_logs"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_logs_queue_idx" ON "job_logs"("queue");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_logs_status_idx" ON "job_logs"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "job_logs_createdAt_idx" ON "job_logs"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_notes_tenantId_idx" ON "tenant_notes"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_notes_authorId_idx" ON "tenant_notes"("authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_notes_severity_idx" ON "tenant_notes"("severity");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_messages_waMessageId_key" ON "whatsapp_messages"("waMessageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "whatsapp_messages_tenantId_idx" ON "whatsapp_messages"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "whatsapp_messages_from_idx" ON "whatsapp_messages"("from");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integrations_ownerType_ownerKey_idx" ON "integrations"("ownerType", "ownerKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "integrations_clientId_idx" ON "integrations"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_tenantId_provider_ownerKey_key" ON "integrations"("tenantId", "provider", "ownerKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "metrics_collectedAt_idx" ON "metrics"("collectedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "refresh_tokens_tenantId_idx" ON "refresh_tokens"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "refresh_tokens_revoked_idx" ON "refresh_tokens"("revoked");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_salaryRecordId_key" ON "team_members"("salaryRecordId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users"("username");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "team_members" ADD CONSTRAINT "team_members_salaryRecordId_fkey" FOREIGN KEY ("salaryRecordId") REFERENCES "financial_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "integrations" ADD CONSTRAINT "integrations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "system_logs" ADD CONSTRAINT "system_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "job_logs" ADD CONSTRAINT "job_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "tenant_notes" ADD CONSTRAINT "tenant_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "tenant_notes" ADD CONSTRAINT "tenant_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
