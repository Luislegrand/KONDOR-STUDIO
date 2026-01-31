-- AlterTable
ALTER TABLE "metric_catalog" ADD COLUMN     "isCalculated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "metric_catalog" ADD COLUMN     "formula" TEXT;
ALTER TABLE "metric_catalog" ADD COLUMN     "format" TEXT;
ALTER TABLE "metric_catalog" ADD COLUMN     "description" TEXT;
