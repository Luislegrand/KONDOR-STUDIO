const crypto = require('crypto');

function loadKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || !String(raw).trim()) {
    throw new Error('ENCRYPTION_KEY missing');
  }

  const trimmed = String(raw).trim();
  let key;
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, 'hex');
  } else {
    key = Buffer.from(trimmed, 'base64');
  }

  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 or hex)');
  }

  return key;
}

function assertString(value, label) {
  if (value === null || value === undefined) {
    throw new Error(`${label} missing`);
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
}

function encrypt(text) {
  assertString(text, 'text');
  const key = loadKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

function decrypt(payload) {
  assertString(payload, 'payload');
  const key = loadKey();
  const raw = Buffer.from(payload, 'base64');
  if (raw.length < 28) {
    throw new Error('Invalid encrypted payload');
  }
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

module.exports = {
  encrypt,
  decrypt,
};
