-- CreateEnum
CREATE TYPE "Ga4IntegrationStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "AnalyticsWidgetType" AS ENUM ('NUMBER', 'LINE', 'BAR', 'TABLE', 'PIE');

-- CreateTable
CREATE TABLE "integration_google_ga4" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleAccountEmail" TEXT,
    "accessToken" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "scope" TEXT NOT NULL,
    "status" "Ga4IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_google_ga4_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_google_ga4_properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountId" TEXT,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_google_ga4_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationPropertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDateRange" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "type" "AnalyticsWidgetType" NOT NULL,
    "title" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "layout" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_google_ga4_tenantId_userId_key" ON "integration_google_ga4"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "integration_google_ga4_tenantId_idx" ON "integration_google_ga4"("tenantId");

-- CreateIndex
CREATE INDEX "integration_google_ga4_userId_idx" ON "integration_google_ga4"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_google_ga4_properties_tenantId_integrationId_propertyId_key" ON "integration_google_ga4_properties"("tenantId", "integrationId", "propertyId");

-- CreateIndex
CREATE INDEX "integration_google_ga4_properties_tenantId_idx" ON "integration_google_ga4_properties"("tenantId");

-- CreateIndex
CREATE INDEX "integration_google_ga4_properties_integrationId_idx" ON "integration_google_ga4_properties"("integrationId");

-- CreateIndex
CREATE INDEX "integration_google_ga4_properties_propertyId_idx" ON "integration_google_ga4_properties"("propertyId");

-- CreateIndex
CREATE INDEX "analytics_dashboards_tenantId_idx" ON "analytics_dashboards"("tenantId");

-- CreateIndex
CREATE INDEX "analytics_dashboards_userId_idx" ON "analytics_dashboards"("userId");

-- CreateIndex
CREATE INDEX "analytics_dashboards_integrationPropertyId_idx" ON "analytics_dashboards"("integrationPropertyId");

-- CreateIndex
CREATE INDEX "analytics_dashboard_widgets_tenantId_idx" ON "analytics_dashboard_widgets"("tenantId");

-- CreateIndex
CREATE INDEX "analytics_dashboard_widgets_dashboardId_idx" ON "analytics_dashboard_widgets"("dashboardId");

-- AddForeignKey
ALTER TABLE "integration_google_ga4" ADD CONSTRAINT "integration_google_ga4_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_google_ga4" ADD CONSTRAINT "integration_google_ga4_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_google_ga4_properties" ADD CONSTRAINT "integration_google_ga4_properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_google_ga4_properties" ADD CONSTRAINT "integration_google_ga4_properties_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integration_google_ga4"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_integrationPropertyId_fkey" FOREIGN KEY ("integrationPropertyId") REFERENCES "integration_google_ga4_properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboard_widgets" ADD CONSTRAINT "analytics_dashboard_widgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboard_widgets" ADD CONSTRAINT "analytics_dashboard_widgets_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "analytics_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
