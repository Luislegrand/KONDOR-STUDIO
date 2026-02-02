const { z } = require('zod');
const { reportLayoutSchema } = require('../../shared/validators/reportLayout');

const createDashboardSchema = z
  .object({
    name: z.string().min(1),
    brandId: z.string().uuid(),
    groupId: z.string().uuid().optional().nullable(),
    layoutJson: reportLayoutSchema.optional(),
  })
  .strict();

const updateDashboardSchema = z
  .object({
    name: z.string().min(1).optional(),
    brandId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional().nullable(),
  })
  .strict();

const createVersionSchema = z
  .object({
    layoutJson: reportLayoutSchema,
  })
  .strict();

const publishSchema = z
  .object({
    versionId: z.string().uuid(),
  })
  .strict();

const rollbackSchema = publishSchema;

module.exports = {
  createDashboardSchema,
  updateDashboardSchema,
  createVersionSchema,
  publishSchema,
  rollbackSchema,
};
