const crypto = require('crypto');

const CACHE_DISABLED = process.env.GA4_CACHE_DISABLED === 'true';
const DEFAULT_TTL_MS = Number(process.env.GA4_CACHE_TTL_MS || 120000);
const METADATA_TTL_MS = Number(process.env.GA4_METADATA_TTL_MS || 24 * 60 * 60 * 1000);
const MAX_CONCURRENT = Number(process.env.GA4_MAX_CONCURRENT || 5);
const RATE_WINDOW_MS = Number(process.env.GA4_RATE_LIMIT_WINDOW_MS || 60000);
const RATE_MAX = Number(process.env.GA4_RATE_LIMIT_MAX || 60);

const memoryCache = new Map();
const propertyQueues = new Map();
const rateCounters = new Map();

function stableStringify(value) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `"${key}":${stableStringify(value[key])}`).join(',')}}`;
}

function hashValue(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex').slice(0, 16);
}

function buildCacheKey({ tenantId, propertyId, payload, kind }) {
  const hash = hashValue(payload || {});
  return ['ga4', kind || 'report', tenantId || 'unknown', propertyId || 'unknown', hash].join(':');
}

function getCache(key) {
  if (CACHE_DISABLED || !key) return null;
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  if (CACHE_DISABLED || !key) return null;
  const ttl = Number(ttlMs) || 0;
  const expiresAt = ttl > 0 ? Date.now() + ttl : null;
  memoryCache.set(key, { value, expiresAt });
  return value;
}

function getMetadataCache(key) {
  return getCache(key);
}

function setMetadataCache(key, value) {
  return setCache(key, value, METADATA_TTL_MS);
}

function getQueueState(propertyId) {
  const key = propertyId || 'global';
  if (!propertyQueues.has(key)) {
    propertyQueues.set(key, { active: 0, queue: [] });
  }
  return propertyQueues.get(key);
}

async function withPropertyLimit(propertyId, task) {
  const state = getQueueState(propertyId);

  if (state.active >= MAX_CONCURRENT) {
    await new Promise((resolve) => state.queue.push(resolve));
  }

  state.active += 1;
  try {
    return await task();
  } finally {
    state.active = Math.max(0, state.active - 1);
    const next = state.queue.shift();
    if (next) next();
  }
}

function assertWithinRateLimit(key) {
  if (!RATE_MAX || RATE_MAX <= 0) return;
  const now = Date.now();
  const entry = rateCounters.get(key);
  if (!entry || entry.resetAt <= now) {
    rateCounters.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return;
  }
  if (entry.count >= RATE_MAX) {
    const err = new Error('GA4 rate limit exceeded');
    err.status = 429;
    err.code = 'GA4_RATE_LIMIT';
    throw err;
  }
  entry.count += 1;
}

module.exports = {
  buildCacheKey,
  getCache,
  setCache,
  getMetadataCache,
  setMetadataCache,
  withPropertyLimit,
  assertWithinRateLimit,
  stableStringify,
  hashValue,
};
