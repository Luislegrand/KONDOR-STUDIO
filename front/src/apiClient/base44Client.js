// src/apiClient/base44Client.js

// ⚙️ Base URL da API — usando variáveis do Vite, sem "process"
const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_APP_API_URL)) ||
  "http://localhost:4000";

// --------------------
// Helpers de storage
// --------------------

const STORAGE_KEY = "kondor_auth";

function loadAuthFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading auth from storage", err);
    return null;
  }
}

function saveAuthToStorage(data) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Error saving auth to storage", err);
  }
}

function clearAuthFromStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error clearing auth from storage", err);
  }
}

function getAccessToken() {
  const data = loadAuthFromStorage();
  return data?.accessToken || null;
}

function getRefreshToken() {
  const data = loadAuthFromStorage();
  return data?.refreshToken || null;
}

function getTokenId() {
  const data = loadAuthFromStorage();
  return data?.tokenId || null;
}

// --------------------
// Helpers de HTTP
// --------------------

async function rawFetch(path, options = {}) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}/api${normalizedPath}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const opts = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  const res = await fetch(url, opts);
  return res;
}

function buildQuery(params) {
  if (!params || typeof params !== "object") return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// --------------------
// Fetch com auth (access token)
// --------------------

async function authedFetch(path, options = {}) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await rawFetch(path, {
    ...options,
    headers,
  });

  // Se deu 401/403, podemos tratar depois (ex: logo out automático)
  return res;
}

// --------------------
// Wrapper com tratamento de JSON + erro
// --------------------

async function jsonFetch(path, options = {}) {
  const res = await authedFetch(path, options);

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    // se não deu pra parsear JSON, mantém null
  }

  if (!res.ok) {
    const error = new Error(data?.error || "Request failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// --------------------
// Auth
// --------------------

async function login({ email, password }) {
  const res = await rawFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data?.error || "Login failed");
    error.status = res.status;
    error.data = data;
    throw error;
  }

  // Esperado: { accessToken, refreshToken, tokenId?, user, tenant }
  saveAuthToStorage(data);
  return data;
}

async function logout() {
  try {
    await rawFetch("/auth/logout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
  } catch (err) {
    console.error("logout error", err);
  }
  clearAuthFromStorage();
}

async function tryRefreshToken() {
  const refreshToken = getRefreshToken();
  const tokenId = getTokenId();
  if (!refreshToken || !tokenId) return false;

  try {
    const res = await rawFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken, tokenId }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("refresh token failed", data);
      clearAuthFromStorage();
      return false;
    }

    saveAuthToStorage({
      ...loadAuthFromStorage(),
      ...data,
    });

    return true;
  } catch (err) {
    console.error("refresh token error", err);
    clearAuthFromStorage();
    return false;
  }
}

// --------------------
// Helpers gerais de CRUD
// --------------------

function createEntityClient(basePath) {
  return {
    async list(params) {
      const qs = buildQuery(params);
      return jsonFetch(`${basePath}${qs}`, {
        method: "GET",
      });
    },

    async get(id) {
      return jsonFetch(`${basePath}/${id}`, {
        method: "GET",
      });
    },

    async create(payload) {
      return jsonFetch(basePath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    async update(id, payload) {
      return jsonFetch(`${basePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    async delete(id) {
      return jsonFetch(`${basePath}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

// --------------------
// Clients
// --------------------

const Clients = createEntityClient("/clients");

// --------------------
// Posts
// --------------------

const Posts = {
  ...createEntityClient("/posts"),

  async sendToApproval(id) {
    return jsonFetch(`/posts/${id}/send-to-approval`, {
      method: "POST",
    });
  },
};

// --------------------
// Approvals
// --------------------

const Approvals = {
  async list(params) {
    const qs = buildQuery(params);
    return jsonFetch(`/approvals${qs}`, {
      method: "GET",
    });
  },

  async get(id) {
    return jsonFetch(`/approvals/${id}`, {
      method: "GET",
    });
  },

  async approve(id, payload) {
    return jsonFetch(`/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  async reject(id, payload) {
    return jsonFetch(`/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },
};

// --------------------
// Metrics
// --------------------

const Metrics = {
  async overview(params) {
    const qs = buildQuery(params);
    return jsonFetch(`/metrics/overview${qs}`, {
      method: "GET",
    });
  },

  async campaigns(params) {
    const qs = buildQuery(params);
    return jsonFetch(`/metrics/campaigns${qs}`, {
      method: "GET",
    });
  },
};

// --------------------
// Tasks
// --------------------

const Tasks = createEntityClient("/tasks");

// --------------------
// Tenants (config / tema)
// --------------------

const Tenant = {
  async getCurrent() {
    return jsonFetch("/dashboard/tenant", {
      method: "GET",
    });
  },

  async update(payload) {
    return jsonFetch("/tenants/current", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};

// --------------------
// Dashboard
// --------------------

const Dashboard = {
  async overview() {
    return jsonFetch("/dashboard/overview", {
      method: "GET",
    });
  },
};

// --------------------
// Aprovação pública (portal cliente via link)
// --------------------

const PublicApprovals = {
  async getPublicApproval(token) {
    return jsonFetch(`/public/approvals/${token}`, {
      method: "GET",
    });
  },

  async publicApprove(token, payload) {
    return jsonFetch(`/public/approvals/${token}/approve`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },

  async publicReject(token, payload) {
    return jsonFetch(`/public/approvals/${token}/reject`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
  },
};

// --------------------
// Billing
// --------------------

const Billing = {
  async getPlans() {
    return jsonFetch("/billing/plans", { method: "GET" });
  },

  async getStatus() {
    return jsonFetch("/billing/status", { method: "GET" });
  },

  async subscribe(planId) {
    return jsonFetch("/billing/subscribe", {
      method: "POST",
      body: JSON.stringify({ planId }),
    });
  },
};

// --------------------
// Equipe / Team
// --------------------

const TeamMember = {
  async list() {
    return jsonFetch("/team", { method: "GET" });
  },

  async create(payload) {
    return jsonFetch("/team", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async update(id, payload) {
    return jsonFetch(`/team/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async remove(id) {
    return jsonFetch(`/team/${id}`, {
      method: "DELETE",
    });
  },
};

// --------------------
// Export principal
// --------------------

export const base44 = {
  API_BASE_URL,
  rawFetch,
  jsonFetch,
  authedFetch,
  auth: {
    login,
    logout,
    tryRefreshToken,
  },
  entities: {
    Clients,
    Posts,
    Tasks,
    Metrics,
    Approvals,
    PublicApprovals,
    Billing,
    Tenant,
    TeamMember,
    Dashboard,
  },
  storage: {
    loadAuthFromStorage,
    saveAuthFromStorage: saveAuthToStorage,
    clearAuthFromStorage,
    getAccessToken,
    getRefreshToken,
  },
};
