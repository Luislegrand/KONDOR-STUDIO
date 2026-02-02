const { z } = require('zod');

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const dateRangeSchema = z
  .object({
    start: dateKey,
    end: dateKey,
  })
  .superRefine((value, ctx) => {
    const start = new Date(value.start);
    const end = new Date(value.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateRange.start/end inválidos',
      });
      return;
    }
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateRange.start não pode ser maior que dateRange.end',
      });
    }
  })
  .strict();

const dimensionEnum = z.enum(['date', 'platform', 'account_id', 'campaign_id']);

const filterSchema = z
  .object({
    field: z.enum(['platform', 'campaign_id', 'account_id']),
    op: z.enum(['eq', 'in']),
    value: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .superRefine((value, ctx) => {
    if (value.op === 'eq' && Array.isArray(value.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Filtro eq exige value string',
      });
    }
    if (value.op === 'in' && !Array.isArray(value.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Filtro in exige value array',
      });
    }
  })
  .strict();

const compareToSchema = z
  .object({
    mode: z.enum(['previous_period', 'previous_year']),
  })
  .strict();

const metricsQuerySchema = z
  .object({
    tenantId: z.string().uuid().optional(),
    brandId: z.string().uuid(),
    dateRange: dateRangeSchema,
    dimensions: z.array(dimensionEnum).default([]),
    metrics: z.array(z.string().min(1)).min(1),
    filters: z.array(filterSchema).default([]),
    compareTo: compareToSchema.optional().nullable(),
  })
  .strict();

module.exports = {
  metricsQuerySchema,
};
