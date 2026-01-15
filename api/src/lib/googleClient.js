const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

function normalizeScopes(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  const scopes = normalizeScopes(process.env.GOOGLE_OAUTH_SCOPES);

  if (!clientId) throw new Error('GOOGLE_OAUTH_CLIENT_ID missing');
  if (!clientSecret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET missing');
  if (!redirectUri) throw new Error('GOOGLE_OAUTH_REDIRECT_URI missing');
  if (!scopes.length) {
    throw new Error('GOOGLE_OAUTH_SCOPES missing');
  }

  return { clientId, clientSecret, redirectUri, scopes };
}

function buildAuthUrl({ state }) {
  const { clientId, redirectUri, scopes } = getOAuthConfig();
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('scope', scopes.join(' '));
  if (state) url.searchParams.set('state', state);
  return url.toString();
}

async function exchangeCodeForTokens(code) {
  if (!code) throw new Error('OAuth code missing');
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error_description || json?.error || 'OAuth token exchange failed';
    const err = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new Error('refreshToken missing');
  const { clientId, clientSecret } = getOAuthConfig();

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.error_description || json?.error || 'OAuth refresh failed';
    const err = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

module.exports = {
  normalizeScopes,
  getOAuthConfig,
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
};
