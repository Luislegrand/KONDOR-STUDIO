const { z } = require('zod');

const instantiateTemplateSchema = z
  .object({
    brandId: z.string().uuid(),
    groupId: z.string().uuid().optional().nullable(),
    nameOverride: z.string().min(1).optional(),
  })
  .strict();

module.exports = {
  instantiateTemplateSchema,
};
