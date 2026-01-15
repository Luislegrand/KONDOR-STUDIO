process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');

const test = require('node:test');
const assert = require('node:assert/strict');

const { encrypt, decrypt } = require('../src/lib/crypto');

test('encrypt/decrypt roundtrip', () => {
  const value = 'hello-world';
  const encrypted = encrypt(value);
  const decrypted = decrypt(encrypted);
  assert.equal(decrypted, value);
});
