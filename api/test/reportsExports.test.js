process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

function mockModule(path, exports) {
  const resolved = require.resolve(path);
  require.cache[resolved] = { exports };
}

function resetModule(path) {
  const resolved = require.resolve(path);
  delete require.cache[resolved];
}

function buildApp(options = {}) {
  const userRole = options.userRole || 'ADMIN';
  const serviceMock =
    options.serviceMock ||
    {
      createDashboardExport: async () => ({
        export: { id: 'export-1', status: 'READY' },
        url: 'https://files.example.com/export.pdf',
      }),
      exportDashboardPdf: async () => ({
        buffer: Buffer.from('pdf-bytes'),
        filename: 'Relatorio-Teste.pdf',
      }),
    };

  mockModule('../src/prisma', { prisma: {} });
  mockModule('../src/middleware/auth', (req, _res, next) => {
    req.user = { id: 'user-1', role: userRole, tenantId: 'tenant-1' };
    req.tenantId = 'tenant-1';
    next();
  });
  mockModule('../src/middleware/tenant', (req, _res, next) => {
    req.tenantId = req.tenantId || 'tenant-1';
    req.db = {};
    next();
  });
  mockModule('../src/modules/reports/exports.service', serviceMock);

  resetModule('../src/modules/reports/exports.controller');
  resetModule('../src/modules/reports/exports.routes');
  resetModule('../src/modules/reports/dashboards.routes');
  resetModule('../src/routes/reportsDashboards');

  const router = require('../src/routes/reportsDashboards');
  const app = express();
  app.use(express.json());
  app.use('/api/reports/dashboards', router);

  return { app };
}

test('create export returns download url', async () => {
  const { app } = buildApp();
  const res = await request(app)
    .post('/api/reports/dashboards/dashboard-1/exports')
    .send({ format: 'pdf' });

  assert.equal(res.status, 201);
  assert.equal(res.body?.id, 'export-1');
  assert.ok(res.body?.downloadUrl);
  assert.match(res.body.downloadUrl, /\/api\/reports\/exports\/export-1\/download/);
});

test('export-pdf returns a downloadable pdf stream', async () => {
  let calledWith = null;
  const { app } = buildApp({
    serviceMock: {
      createDashboardExport: async () => ({
        export: { id: 'export-1', status: 'READY' },
        url: 'https://files.example.com/export.pdf',
      }),
      exportDashboardPdf: async (...args) => {
        calledWith = args;
        return {
          buffer: Buffer.from('pdf-binary'),
          filename: 'Relatorio-Teste.pdf',
        };
      },
    },
  });

  const payload = {
    filters: {
      dateRange: {
        preset: 'last_30_days',
      },
      platforms: ['META_ADS'],
    },
    page: 'current',
    orientation: 'landscape',
  };
  const res = await request(app)
    .post('/api/reports/dashboards/dashboard-1/export-pdf')
    .send(payload);

  assert.equal(res.status, 200);
  assert.match(String(res.headers['content-type'] || ''), /application\/pdf/);
  assert.match(
    String(res.headers['content-disposition'] || ''),
    /attachment; filename\*=UTF-8''Relatorio-Teste\.pdf/,
  );
  assert.equal(Buffer.from(res.body).toString('utf8'), 'pdf-binary');
  assert.deepEqual(calledWith, [
    'tenant-1',
    'user-1',
    'dashboard-1',
    payload,
  ]);
});

test('export-pdf validates payload and returns 400 for invalid body', async () => {
  const { app } = buildApp();
  const res = await request(app)
    .post('/api/reports/dashboards/dashboard-1/export-pdf')
    .send({
      page: 'invalid-page',
    });

  assert.equal(res.status, 400);
  assert.equal(res.body?.error?.code, 'VALIDATION_ERROR');
});

test('export-pdf requires editor permissions', async () => {
  const { app } = buildApp({ userRole: 'CLIENT' });
  const res = await request(app)
    .post('/api/reports/dashboards/dashboard-1/export-pdf')
    .send({});

  assert.equal(res.status, 403);
});
