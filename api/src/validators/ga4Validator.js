const { z } = require('zod');

const MAX_LIMIT = Number(process.env.GA4_MAX_LIMIT || 10000);

const numericString = z.string().trim().regex(/^\d+$/, 'Must be numeric');

const dateRangeSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

const dateRangesSchema = z.union([
  z.array(dateRangeSchema),
  z
    .object({
      type: z.string().min(1),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .passthrough(),
  dateRangeSchema,
]);

const runReportSchema = z.object({
  propertyId: numericString.optional(),
  dateRanges: dateRangesSchema.optional(),
  dateRange: dateRangesSchema.optional(),
  dimensions: z.array(z.string().trim().min(1)).optional(),
  metrics: z.array(z.string().trim().min(1)).min(1),
  dimensionFilter: z.any().optional(),
  metricFilter: z.any().optional(),
  orderBys: z.any().optional(),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional(),
});

const propertySelectSchema = z.object({
  propertyId: numericString,
});

const dashboardCreateSchema = z.object({
  integrationPropertyId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  defaultDateRange: z.any().optional().nullable(),
});

const dashboardUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  defaultDateRange: z.any().optional().nullable(),
});

const widgetBaseSchema = z.object({
  type: z.enum(['NUMBER', 'LINE', 'BAR', 'TABLE', 'PIE']),
  title: z.string().trim().min(1).max(120),
  config: z.any(),
  layout: z.any().optional().nullable(),
});

const widgetCreateSchema = widgetBaseSchema;
const widgetUpdateSchema = widgetBaseSchema.partial();

module.exports = {
  runReportSchema,
  propertySelectSchema,
  dashboardCreateSchema,
  dashboardUpdateSchema,
  widgetCreateSchema,
  widgetUpdateSchema,
};
