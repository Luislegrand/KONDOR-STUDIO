const { prisma } = require('../prisma');
const { encrypt } = require('../utils/crypto');

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function pickLegacyToken(integration) {
  if (integration.accessToken && String(integration.accessToken).trim()) {
    return String(integration.accessToken);
  }

  const cfg = integration.config;
  if (!isPlainObject(cfg)) return null;

  for (const key of ['access_token', 'accessToken', 'token']) {
    if (typeof cfg[key] === 'string' && cfg[key].trim()) return cfg[key];
  }

  return null;
}

function removeLegacyTokenFromConfig(config) {
  if (!isPlainObject(config)) return config;
  const next = { ...config };

  for (const key of [
    'access_token',
    'accessToken',
    'accessTokenEncrypted',
    'token',
    'refresh_token',
    'refreshToken',
  ]) {
    if (Object.prototype.hasOwnProperty.call(next, key)) delete next[key];
  }

  return next;
}

async function main() {
  const candidates = await prisma.integration.findMany({
    where: {
      provider: { in: ['WHATSAPP_META_CLOUD', 'WHATSAPP'] },
    },
    select: {
      id: true,
      tenantId: true,
      provider: true,
      status: true,
      accessToken: true,
      accessTokenEncrypted: true,
      config: true,
      updatedAt: true,
    },
  });

  let migrated = 0;
  let skippedAlreadyEncrypted = 0;
  let skippedNoToken = 0;

  for (const integration of candidates) {
    if (integration.accessTokenEncrypted && String(integration.accessTokenEncrypted).trim()) {
      skippedAlreadyEncrypted += 1;
      continue;
    }

    const token = pickLegacyToken(integration);
    if (!token) {
      skippedNoToken += 1;
      continue;
    }

    const encryptedToken = encrypt(token);
    const nextConfig = removeLegacyTokenFromConfig(integration.config);

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        accessTokenEncrypted: encryptedToken,
        accessToken: null,
        config: nextConfig,
      },
    });

    migrated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: candidates.length,
        migrated,
        skippedAlreadyEncrypted,
        skippedNoToken,
      },
      null,
      2
    )
  );
}

main()
  .catch((err) => {
    console.error('migrateEncryptWhatsappTokens failed:', err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (_) {}
  });

