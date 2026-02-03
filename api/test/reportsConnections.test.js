process.env.NODE_ENV = 'test';

const { randomUUID } = require('crypto');
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

function createFakePrisma() {
  const state = {
    clients: [],
    brandSourceConnections: [],
    dataSourceConnections: [],
  };

  const prisma = {
    client: {
      findFirst: async ({ where }) => {
        const found = state.clients.find(
          (item) => item.id === where.id && item.tenantId === where.tenantId,
        );
        return found ? { id: found.id } : null;
      },
    },
    brandSourceConnection: {
      findMany: async ({ where }) =>
        state.brandSourceConnections
          .filter(
            (item) =>
              item.tenantId === where.tenantId && item.brandId === where.brandId,
          )
          .map((item) => ({ ...item })),
      upsert: async ({ where, update, create }) => {
        const key = where.brandId_platform_externalAccountId;
        const index = state.brandSourceConnections.findIndex(
          (item) =>
            item.brandId === key.brandId &&
            item.platform === key.platform &&
            item.externalAccountId === key.externalAccountId,
        );
        if (index >= 0) {
          const next = {
            ...state.brandSourceConnections[index],
            ...update,
            updatedAt: new Date(),
          };
          state.brandSourceConnections[index] = next;
          return { ...next };
        }
        const created = {
          id: randomUUID(),
          tenantId: create.tenantId,
          brandId: create.brandId,
          platform: create.platform,
          externalAccountId: create.externalAccountId,
          externalAccountName: create.externalAccountName,
          status: create.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.brandSourceConnections.push(created);
        return { ...created };
      },
    },
    dataSourceConnection: {
      findMany: async ({ where }) =>
        state.dataSourceConnections
          .filter(
            (item) =>
              item.tenantId === where.tenantId &&
              item.brandId === where.brandId &&
              item.source === where.source &&
              item.status === where.status,
          )
          .map((item) => ({ ...item })),
      findFirst: async ({ where }) =>
        state.dataSourceConnections.find(
          (item) =>
            item.tenantId === where.tenantId &&
            item.brandId === where.brandId &&
            item.source === where.source &&
            item.externalAccountId === where.externalAccountId &&
            item.status === where.status,
        ) || null,
    },
  };

  return { prisma, state };
}

function buildApp() {
  const { prisma, state } = createFakePrisma();

  mockModule('../src/prisma', { prisma });
  mockModule('../src/middleware/auth', (req, _res, next) => {
    const role = req.headers['x-role'] || 'ADMIN';
    const tenantId = req.headers['x-tenant-id'] || 'tenant-1';
    req.user = { id: 'user-1', role, tenantId };
    req.tenantId = tenantId;
    next();
  });
  mockModule('../src/middleware/tenant', (req, _res, next) => {
    req.tenantId = req.tenantId || req.user?.tenantId || 'tenant-1';
    req.db = {};
    next();
  });

  resetModule('../src/modules/reports/connections.service');
  resetModule('../src/modules/reports/connections.controller');
  resetModule('../src/modules/reports/connections.routes');
  resetModule('../src/routes/reportsConnections');

  const router = require('../src/routes/reportsConnections');

  const app = express();
  app.use(express.json());
  app.use('/api/reports/connections', router);

  return { app, state };
}

test('GET /api/reports/connections returns brand connections', async () => {
  const { app, state } = buildApp();
  const tenantId = 'tenant-1';
  const brandId = '11111111-1111-4111-8111-111111111111';

  state.clients.push({ id: brandId, tenantId });
  state.brandSourceConnections.push({
    id: 'conn-1',
    tenantId,
    brandId,
    platform: 'META_ADS',
    externalAccountId: 'act-1',
    externalAccountName: 'Meta Ads 1',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const res = await request(app)
    .get('/api/reports/connections')
    .query({ brandId })
    .set('x-tenant-id', tenantId);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].platform, 'META_ADS');
});

test('GET /api/reports/connections/available returns accounts for platform', async () => {
  const { app, state } = buildApp();
  const tenantId = 'tenant-1';
  const brandId = '11111111-1111-4111-8111-111111111111';

  state.clients.push({ id: brandId, tenantId });
  state.dataSourceConnections.push({
    id: 'ds-1',
    tenantId,
    brandId,
    source: 'META_ADS',
    externalAccountId: 'act-1',
    displayName: 'Meta Ads 1',
    status: 'CONNECTED',
  });

  const res = await request(app)
    .get('/api/reports/connections/available')
    .query({ brandId, platform: 'META_ADS' })
    .set('x-tenant-id', tenantId);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.items.length, 1);
  assert.equal(res.body.items[0].externalAccountId, 'act-1');
});

test('POST /api/reports/connections creates brand connection', async () => {
  const { app, state } = buildApp();
  const tenantId = 'tenant-1';
  const brandId = '11111111-1111-4111-8111-111111111111';

  state.clients.push({ id: brandId, tenantId });
  state.dataSourceConnections.push({
    id: 'ds-1',
    tenantId,
    brandId,
    source: 'META_ADS',
    externalAccountId: 'act-1',
    displayName: 'Meta Ads 1',
    status: 'CONNECTED',
  });

  const res = await request(app)
    .post('/api/reports/connections')
    .set('x-tenant-id', tenantId)
    .send({
      brandId,
      platform: 'META_ADS',
      externalAccountId: 'act-1',
    });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.brandId, brandId);
  assert.equal(res.body.platform, 'META_ADS');
  assert.equal(res.body.externalAccountId, 'act-1');
});

test('POST /api/reports/connections rejects missing account', async () => {
  const { app, state } = buildApp();
  const tenantId = 'tenant-1';
  const brandId = '11111111-1111-4111-8111-111111111111';

  state.clients.push({ id: brandId, tenantId });

  const res = await request(app)
    .post('/api/reports/connections')
    .set('x-tenant-id', tenantId)
    .send({
      brandId,
      platform: 'META_ADS',
      externalAccountId: 'missing',
    });

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.code, 'ACCOUNT_NOT_FOUND');
});
