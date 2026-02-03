process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');

function mockModule(path, exports) {
  const resolved = require.resolve(path);
  require.cache[resolved] = { exports };
}

function resetModule(path) {
  const resolved = require.resolve(path);
  delete require.cache[resolved];
}

function buildCatalog(keys) {
  return keys.map((key) => {
    if (['ctr', 'cpc', 'cpm', 'cpa', 'roas'].includes(key)) {
      const requiredFields = {
        ctr: ['clicks', 'impressions'],
        cpc: ['spend', 'clicks'],
        cpm: ['spend', 'impressions'],
        cpa: ['spend', 'conversions'],
        roas: ['revenue', 'spend'],
      };
      return {
        key,
        label: key.toUpperCase(),
        format: 'PERCENT',
        formula: key,
        requiredFields: requiredFields[key],
      };
    }

    return {
      key,
      label: key.toUpperCase(),
      format: 'NUMBER',
      formula: null,
      requiredFields: null,
    };
  });
}

test('metrics query computes derived totals from base sums', async () => {
  const rows = [
    {
      date: '2026-01-01',
      impressions: '100',
      clicks: '10',
      spend: '50',
      revenue: '200',
      conversions: '5',
    },
    {
      date: '2026-01-02',
      impressions: '100',
      clicks: '20',
      spend: '50',
      revenue: '100',
      conversions: '5',
    },
  ];
  const totals = {
    impressions: '200',
    clicks: '30',
    spend: '100',
    revenue: '300',
    conversions: '10',
  };

  const fakePrisma = {
    client: {
      findFirst: async () => ({ id: 'brand-1' }),
    },
    metricsCatalog: {
      findMany: async ({ where }) => buildCatalog(where.key.in),
    },
    $queryRawUnsafe: async (sql) => {
      if (sql.includes('GROUP BY')) return rows;
      return [totals];
    },
  };

  mockModule('../src/prisma', { prisma: fakePrisma });
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const result = await service.queryMetrics('tenant-1', {
    brandId: 'brand-1',
    dateRange: { start: '2026-01-01', end: '2026-01-02' },
    dimensions: ['date'],
    metrics: ['impressions', 'clicks', 'spend', 'revenue', 'ctr', 'roas'],
    filters: [],
    compareTo: null,
  });

  assert.equal(result.rows.length, 2);
  assert.ok(Math.abs(result.rows[0].ctr - 0.1) < 1e-6);
  assert.ok(Math.abs(result.rows[1].ctr - 0.2) < 1e-6);
  assert.ok(Math.abs(result.totals.ctr - 0.15) < 1e-6);
  assert.ok(Math.abs(result.totals.roas - 3) < 1e-6);
});

test('metrics query builds filter placeholders for eq/in', () => {
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const { whereSql, params } = service.buildWhereClause({
    tenantId: 'tenant-1',
    brandId: 'brand-1',
    dateFrom: '2026-01-01',
    dateTo: '2026-01-31',
    filters: [
      { field: 'account_id', op: 'eq', value: 'acc-1' },
      { field: 'platform', op: 'in', value: ['META_ADS', 'GOOGLE_ADS'] },
    ],
  });

  assert.ok(whereSql.includes('"accountId" = $5'));
  assert.ok(whereSql.includes('"platform" IN ($6, $7)'));
  assert.equal(params.length, 7);
  assert.equal(params[4], 'acc-1');
  assert.equal(params[5], 'META_ADS');
  assert.equal(params[6], 'GOOGLE_ADS');
});

test('metrics query paginates rows and keeps totals for full dataset', async () => {
  const rows = [
    { date: '2026-01-01', impressions: '100', clicks: '10', spend: '50' },
    { date: '2026-01-02', impressions: '100', clicks: '10', spend: '50' },
    { date: '2026-01-03', impressions: '100', clicks: '10', spend: '50' },
  ];
  const totals = {
    impressions: '300',
    clicks: '30',
    spend: '150',
  };

  const fakePrisma = {
    client: {
      findFirst: async () => ({ id: 'brand-1' }),
    },
    metricsCatalog: {
      findMany: async ({ where }) => buildCatalog(where.key.in),
    },
    $queryRawUnsafe: async (sql) => {
      if (sql.includes('GROUP BY')) return rows;
      return [totals];
    },
  };

  mockModule('../src/prisma', { prisma: fakePrisma });
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const result = await service.queryMetrics('tenant-1', {
    brandId: 'brand-1',
    dateRange: { start: '2026-01-01', end: '2026-01-03' },
    dimensions: ['date'],
    metrics: ['impressions', 'clicks', 'spend', 'ctr'],
    filters: [],
    pagination: { limit: 2, offset: 0 },
  });

  assert.equal(result.rows.length, 2);
  assert.equal(result.pageInfo.limit, 2);
  assert.equal(result.pageInfo.offset, 0);
  assert.equal(result.pageInfo.hasMore, true);
  assert.equal(result.totals.impressions, 300);
  assert.ok(Math.abs(result.totals.ctr - 0.1) < 1e-6);
});

test('metrics query applies sort whitelist (asc/desc)', async () => {
  const rows = [{ date: '2026-01-01', spend: '50' }];
  const totals = { spend: '50' };
  const queries = [];

  const fakePrisma = {
    client: {
      findFirst: async () => ({ id: 'brand-1' }),
    },
    metricsCatalog: {
      findMany: async ({ where }) => buildCatalog(where.key.in),
    },
    $queryRawUnsafe: async (sql) => {
      queries.push(sql);
      if (sql.includes('GROUP BY')) return rows;
      return [totals];
    },
  };

  mockModule('../src/prisma', { prisma: fakePrisma });
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  await service.queryMetrics('tenant-1', {
    brandId: 'brand-1',
    dateRange: { start: '2026-01-01', end: '2026-01-01' },
    dimensions: ['date'],
    metrics: ['spend'],
    filters: [],
    sort: { field: 'spend', direction: 'desc' },
  });

  assert.ok(queries[0].includes('ORDER BY "spend" DESC'));

  queries.length = 0;

  await service.queryMetrics('tenant-1', {
    brandId: 'brand-1',
    dateRange: { start: '2026-01-01', end: '2026-01-01' },
    dimensions: ['date'],
    metrics: ['spend'],
    filters: [],
    sort: { field: 'date', direction: 'asc' },
  });

  assert.ok(queries[0].includes('ORDER BY "date" ASC'));
});

test('compareTo previous_period paginates compare rows', async () => {
  const baseRows = [
    { date: '2026-01-02', spend: '10' },
    { date: '2026-01-03', spend: '20' },
  ];
  const compareRows = [
    { date: '2026-01-01', spend: '5' },
    { date: '2025-12-31', spend: '4' },
  ];
  const totals = { spend: '30' };
  const compareTotals = { spend: '9' };
  let call = 0;

  const fakePrisma = {
    client: {
      findFirst: async () => ({ id: 'brand-1' }),
    },
    metricsCatalog: {
      findMany: async ({ where }) => buildCatalog(where.key.in),
    },
    $queryRawUnsafe: async (sql) => {
      call += 1;
      if (sql.includes('GROUP BY')) {
        return call === 1 ? baseRows : compareRows;
      }
      return call === 2 ? [totals] : [compareTotals];
    },
  };

  mockModule('../src/prisma', { prisma: fakePrisma });
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const result = await service.queryMetrics('tenant-1', {
    brandId: 'brand-1',
    dateRange: { start: '2026-01-02', end: '2026-01-03' },
    dimensions: ['date'],
    metrics: ['spend'],
    filters: [],
    compareTo: { mode: 'previous_period' },
    pagination: { limit: 1, offset: 0 },
  });

  assert.equal(result.compare.rows.length, 1);
  assert.equal(result.compare.pageInfo.hasMore, true);
});

test('compare range previous_period matches length', () => {
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const range = service.buildCompareRange('2026-01-10', '2026-01-19', 'previous_period');
  assert.equal(range.start, '2025-12-31');
  assert.equal(range.end, '2026-01-09');
});

test('compare range previous_year shifts by one year', () => {
  resetModule('../src/modules/metrics/metrics.service');
  const service = require('../src/modules/metrics/metrics.service');

  const range = service.buildCompareRange('2026-02-01', '2026-02-28', 'previous_year');
  assert.equal(range.start, '2025-02-01');
  assert.equal(range.end, '2025-02-28');
});
