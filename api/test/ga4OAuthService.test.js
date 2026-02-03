process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 2).toString('base64');
process.env.JWT_SECRET = 'test_secret';

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

function loadService({ tokenResponse, existingIntegration }) {
  mockModule('../src/prisma', {
    prisma: {
      integrationGoogleGa4: {
        findUnique: async () => existingIntegration || null,
        findFirst: async () => existingIntegration || null,
        update: async () => existingIntegration || null,
      },
    },
    useTenant: () => ({
      integrationGoogleGa4: {
        findFirst: async () => existingIntegration || null,
        update: async (args) => ({ id: existingIntegration?.id || 'id', ...args.data }),
        create: async (args) => ({ id: 'new', ...args.data }),
      },
    }),
  });

  mockModule('../src/lib/googleClient', {
    exchangeCodeForTokens: async () => tokenResponse,
    refreshAccessToken: async () => ({ access_token: 'token', expires_in: 3600 }),
    buildAuthUrl: () => 'http://example.com',
    normalizeScopes: (scope) => {
      if (!scope) return [];
      if (Array.isArray(scope)) return scope;
      return String(scope).split(/\s+/).filter(Boolean);
    },
    applyScopePolicy: (scopes) => scopes || [],
    getOAuthScopes: () => ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  resetModule('../src/services/ga4OAuthService');
  return require('../src/services/ga4OAuthService');
}

test('exchangeCode fails when refresh_token missing and no stored token', async () => {
  const service = loadService({
    tokenResponse: {
      access_token: 'access',
      expires_in: 3600,
      scope: 'scope',
    },
    existingIntegration: null,
  });

  const state = service.buildState({ tenantId: 't1', userId: 'u1' });

  await assert.rejects(
    () => service.exchangeCode({ code: 'abc', state }),
    (err) => {
      assert.equal(err.code, 'GA4_REFRESH_TOKEN_MISSING');
      return true;
    }
  );
});
