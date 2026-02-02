process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  reportLayoutSchema,
} = require('../src/shared/validators/reportLayout.js');

function buildBaseLayout(overrides = {}) {
  return {
    theme: {
      mode: 'light',
      brandColor: '#F59E0B',
      accentColor: '#22C55E',
      bg: '#FFFFFF',
      text: '#0F172A',
      mutedText: '#64748B',
      cardBg: '#FFFFFF',
      border: '#E2E8F0',
      radius: 16,
    },
    globalFilters: {
      dateRange: {
        preset: 'last_7_days',
      },
      platforms: ['META_ADS'],
      accounts: [{ platform: 'META_ADS', external_account_id: 'acc-1' }],
      compareTo: null,
      autoRefreshSec: 30,
    },
    widgets: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        type: 'kpi',
        title: 'Spend',
        layout: { x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        query: {
          dimensions: [],
          metrics: ['spend'],
          filters: [],
        },
        viz: {
          variant: 'default',
          showLegend: true,
          format: 'auto',
          options: {},
        },
      },
    ],
    ...overrides,
  };
}

test('reportLayoutSchema accepts valid layout', () => {
  const result = reportLayoutSchema.safeParse(buildBaseLayout());
  assert.equal(result.success, true);
});

test('reportLayoutSchema rejects duplicate widget ids', () => {
  const base = buildBaseLayout();
  const duplicate = {
    ...base,
    widgets: [
      ...base.widgets,
      {
        ...base.widgets[0],
        title: 'Clicks',
      },
    ],
  };
  const result = reportLayoutSchema.safeParse(duplicate);
  assert.equal(result.success, false);
});

test('reportLayoutSchema rejects kpi with non-date dimension', () => {
  const base = buildBaseLayout({
    widgets: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        type: 'kpi',
        title: 'CTR',
        layout: { x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        query: {
          dimensions: ['platform'],
          metrics: ['ctr'],
          filters: [],
        },
      },
    ],
  });
  const result = reportLayoutSchema.safeParse(base);
  assert.equal(result.success, false);
});

test('reportLayoutSchema rejects timeseries without date dimension', () => {
  const base = buildBaseLayout({
    widgets: [
      {
        id: '33333333-3333-4333-8333-333333333333',
        type: 'timeseries',
        title: 'Spend Over Time',
        layout: { x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
        query: {
          dimensions: ['platform'],
          metrics: ['spend'],
          filters: [],
        },
      },
    ],
  });
  const result = reportLayoutSchema.safeParse(base);
  assert.equal(result.success, false);
});

test('reportLayoutSchema rejects bar with date dimension', () => {
  const base = buildBaseLayout({
    widgets: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        type: 'bar',
        title: 'Spend by Date',
        layout: { x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
        query: {
          dimensions: ['date'],
          metrics: ['spend'],
          filters: [],
        },
      },
    ],
  });
  const result = reportLayoutSchema.safeParse(base);
  assert.equal(result.success, false);
});

test('reportLayoutSchema rejects invalid autoRefreshSec', () => {
  const base = buildBaseLayout({
    globalFilters: {
      dateRange: { preset: 'last_30_days' },
      platforms: [],
      accounts: [],
      compareTo: null,
      autoRefreshSec: 15,
    },
  });
  const result = reportLayoutSchema.safeParse(base);
  assert.equal(result.success, false);
});
