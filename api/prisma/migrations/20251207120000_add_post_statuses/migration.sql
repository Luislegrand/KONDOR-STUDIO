-- Add missing statuses used pelo front
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "PostStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- Ajusta default para DRAFT para alinhar com o onboarding atual
ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
