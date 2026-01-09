const { z } = require('zod');
const { DATA_SOURCES } = require('./connections.validators');

const VISIBILITIES = ['PRIVATE', 'TENANT', 'PUBLIC'];
const WIDGET_TYPES = ['KPI', 'LINE', 'BAR', 'PIE', 'TABLE', 'TEXT', 'IMAGE'];

const layoutItemSchema = z
  .object({
    i: z.string().min(1),
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    w: z.number().int().min(1),
    h: z.number().int().min(1),
  })
  .passthrough();

const widgetSchema = z
  .object({
    id: z.string().min(1),
    widgetType: z.enum(WIDGET_TYPES),
    title: z.string().trim().optional(),
    source: z.enum(DATA_SOURCES).optional(),
    level: z.string().trim().optional(),
    breakdown: z.string().trim().optional(),
    metrics: z.array(z.string().trim().min(1)).optional(),
    filters: z.any().optional(),
    options: z.any().optional(),
    layout: z.any().optional(),
  })
  .passthrough();

const templateSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  layoutSchema: z.array(layoutItemSchema).optional(),
  widgetsSchema: z.array(widgetSchema).optional(),
});

module.exports = {
  VISIBILITIES,
  WIDGET_TYPES,
  layoutItemSchema,
  widgetSchema,
  templateSchema,
};
