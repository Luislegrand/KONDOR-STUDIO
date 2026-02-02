-- CreateTable
CREATE TABLE "fact_kondor_metrics_daily" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "platform" "BrandSourcePlatform" NOT NULL,
    "accountId" TEXT NOT NULL,
    "campaignId" TEXT,
    "adsetId" TEXT,
    "adId" TEXT,
    "currency" TEXT NOT NULL,
    "impressions" BIGINT NOT NULL,
    "clicks" BIGINT NOT NULL,
    "spend" NUMERIC(18,6) NOT NULL,
    "conversions" NUMERIC(18,6) NOT NULL,
    "revenue" NUMERIC(18,6) NOT NULL,
    "sessions" BIGINT,
    "leads" BIGINT,

    CONSTRAINT "fact_kondor_metrics_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fact_kondor_metrics_daily_tenantId_brandId_date_idx" ON "fact_kondor_metrics_daily"("tenantId", "brandId", "date");

-- CreateIndex
CREATE INDEX "fact_kondor_metrics_daily_tenantId_brandId_platform_date_idx" ON "fact_kondor_metrics_daily"("tenantId", "brandId", "platform", "date");

-- AddForeignKey
ALTER TABLE "fact_kondor_metrics_daily" ADD CONSTRAINT "fact_kondor_metrics_daily_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_kondor_metrics_daily" ADD CONSTRAINT "fact_kondor_metrics_daily_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
