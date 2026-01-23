const { z } = require('zod');

const DATA_SOURCES = [
  'META_ADS',
  'GOOGLE_ADS',
  'TIKTOK_ADS',
  'LINKEDIN_ADS',
  'GA4',
  'GBP',
  'META_SOCIAL',
];

const linkConnectionSchema = z
  .object({
    source: z.enum(DATA_SOURCES),
    integrationId: z.string().uuid().optional().nullable(),
    externalAccountId: z.string().trim().min(1),
    displayName: z.string().trim().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.source !== 'GA4' && !data.integrationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'integrationId é obrigatório',
        path: ['integrationId'],
      });
    }
  });

module.exports = {
  DATA_SOURCES,
  linkConnectionSchema,
};
