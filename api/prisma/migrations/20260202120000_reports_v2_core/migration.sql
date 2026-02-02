-- CreateEnum
CREATE TYPE "ReportDashboardStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MetricsCatalogFormat" AS ENUM ('NUMBER', 'CURRENCY', 'PERCENT', 'RATIO', 'DURATION');

-- CreateEnum
CREATE TYPE "BrandSourcePlatform" AS ENUM ('META_ADS', 'GOOGLE_ADS', 'TIKTOK_ADS', 'LINKEDIN_ADS', 'GA4', 'GMB', 'FB_IG');

-- CreateEnum
CREATE TYPE "BrandSourceConnectionStatus" AS ENUM ('ACTIVE', 'DISCONNECTED', 'ERROR');

-- CreateTable
CREATE TABLE "report_dashboard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "status" "ReportDashboardStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedVersionId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_dashboard_version" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_dashboard_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_template" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "layoutJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics_catalog" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "format" "MetricsCatalogFormat" NOT NULL,
    "formula" TEXT,
    "requiredFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metrics_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_source_connection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "platform" "BrandSourcePlatform" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "externalAccountName" TEXT NOT NULL,
    "status" "BrandSourceConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_source_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_dashboard_tenantId_idx" ON "report_dashboard"("tenantId");

-- CreateIndex
CREATE INDEX "report_dashboard_brandId_idx" ON "report_dashboard"("brandId");

-- CreateIndex
CREATE INDEX "report_dashboard_groupId_idx" ON "report_dashboard"("groupId");

-- CreateIndex
CREATE INDEX "report_dashboard_status_idx" ON "report_dashboard"("status");

-- CreateIndex
CREATE UNIQUE INDEX "report_dashboard_version_dashboardId_versionNumber_key" ON "report_dashboard_version"("dashboardId", "versionNumber");

-- CreateIndex
CREATE INDEX "report_dashboard_version_dashboardId_idx" ON "report_dashboard_version"("dashboardId");

-- CreateIndex
CREATE INDEX "report_template_tenantId_idx" ON "report_template"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_catalog_key_key" ON "metrics_catalog"("key");

-- CreateIndex
CREATE UNIQUE INDEX "brand_source_connection_brandId_platform_externalAccountId_key" ON "brand_source_connection"("brandId", "platform", "externalAccountId");

-- CreateIndex
CREATE INDEX "brand_source_connection_tenantId_idx" ON "brand_source_connection"("tenantId");

-- CreateIndex
CREATE INDEX "brand_source_connection_brandId_idx" ON "brand_source_connection"("brandId");

-- CreateIndex
CREATE INDEX "brand_source_connection_platform_idx" ON "brand_source_connection"("platform");

-- AddForeignKey
ALTER TABLE "report_dashboard" ADD CONSTRAINT "report_dashboard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard" ADD CONSTRAINT "report_dashboard_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard" ADD CONSTRAINT "report_dashboard_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "brand_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard" ADD CONSTRAINT "report_dashboard_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "report_dashboard_version"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard" ADD CONSTRAINT "report_dashboard_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard_version" ADD CONSTRAINT "report_dashboard_version_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "report_dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_dashboard_version" ADD CONSTRAINT "report_dashboard_version_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_template" ADD CONSTRAINT "report_template_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_source_connection" ADD CONSTRAINT "brand_source_connection_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_source_connection" ADD CONSTRAINT "brand_source_connection_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
