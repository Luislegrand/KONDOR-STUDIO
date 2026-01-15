process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeRunReportPayload } = require('../src/services/ga4DataService');

test('normalizeRunReportPayload enforces metrics limit', () => {
  const metrics = Array.from({ length: 11 }, (_, idx) => `m${idx}`);
  assert.throws(() =>
    normalizeRunReportPayload({ metrics, dimensions: [] })
  );
});

test('normalizeRunReportPayload enforces dimensions limit', () => {
  const dimensions = Array.from({ length: 11 }, (_, idx) => `d${idx}`);
  assert.throws(() =>
    normalizeRunReportPayload({ metrics: ['sessions'], dimensions })
  );
});

test('normalizeRunReportPayload enforces limit max', () => {
  assert.throws(() =>
    normalizeRunReportPayload({
      metrics: ['sessions'],
      dimensions: [],
      limit: 999999,
    })
  );
});
