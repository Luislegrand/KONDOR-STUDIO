const { z } = require('zod');

const platformEnum = z.enum([
  'META_ADS',
  'GOOGLE_ADS',
  'TIKTOK_ADS',
  'LINKEDIN_ADS',
  'GA4',
  'GMB',
  'FB_IG',
]);

const listConnectionsSchema = z
  .object({
    brandId: z.string().uuid(),
  })
  .strict();

const listAvailableSchema = z
  .object({
    brandId: z.string().uuid(),
    platform: platformEnum,
  })
  .strict();

const linkConnectionSchema = z
  .object({
    brandId: z.string().uuid(),
    platform: platformEnum,
    externalAccountId: z.string().min(1),
    externalAccountName: z.string().min(1).optional(),
  })
  .strict();

module.exports = {
  platformEnum,
  listConnectionsSchema,
  listAvailableSchema,
  linkConnectionSchema,
};
