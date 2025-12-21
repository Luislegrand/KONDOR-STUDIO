const crypto = require('crypto');

function deriveKey() {
  const raw = process.env.CRYPTO_KEY;
  if (!raw || !String(raw).trim()) {
    throw new Error('Missing CRYPTO_KEY env var (required for token encryption)');
  }

  return crypto.createHash('sha256').update(Buffer.from(String(raw), 'utf8')).digest();
}

function assertStringValue(value, label) {
  if (value === null || value === undefined) {
    throw new Error(`${label} cannot be null or undefined`);
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
}

exports.encrypt = function encrypt(plainText) {
  assertStringValue(plainText, 'plainText');

  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
};

exports.decrypt = function decrypt(encrypted) {
  assertStringValue(encrypted, 'encrypted');

  const key = deriveKey();
  const payload = Buffer.from(encrypted, 'base64');
  if (payload.length < 12 + 16) {
    throw new Error('Invalid encrypted payload (too short)');
  }

  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const ciphertext = payload.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
};

