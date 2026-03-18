const IS_PROD = process.env.NODE_ENV === 'production';

export const log  = IS_PROD ? () => {} : console.log.bind(console, '[CampusPro]');
export const warn = IS_PROD ? () => {} : console.warn.bind(console, '[CampusPro]');

/* ── Token helpers ───────────────────────────────── */
let _tokenCache = null;

export const TokenStore = {
  set(token) {
    if (!token || typeof token !== 'string') return;
    _tokenCache = token;
    try { sessionStorage.setItem('_cp_tok', token); } catch { /* */ }
  },
  get() {
    if (_tokenCache) return _tokenCache;
    try {
      const t = sessionStorage.getItem('_cp_tok');
      if (t) { _tokenCache = t; return t; }
    } catch { /* */ }
    return null;
  },
  clear() {
    _tokenCache = null;
    try {
      sessionStorage.removeItem('_cp_tok');
      sessionStorage.removeItem('academia_data');
    } catch { /* */ }
  },
  exists() { return !!this.get(); },
};

/* ── Academia data store ─────────────────────────── */
export const DataStore = {
  set(data) {
    try { sessionStorage.setItem('academia_data', JSON.stringify(data)); } catch { /* */ }
  },
  get() {
    try {
      const raw = sessionStorage.getItem('academia_data');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch { return null; }
  },
  clear() {
    try { sessionStorage.removeItem('academia_data'); } catch { /* */ }
  },
};

/* ── Sanitizer ───────────────────────────────────── */
export function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '').trim();
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, typeof v === 'string' ? sanitize(v) : sanitizeObject(v)])
  );
}

/* ── Validators ──────────────────────────────────── */
export const Validators = {
  account:  (v) => { const t = v?.trim() ?? ''; return t.length >= 6 && t.length <= 120; },
  password: (v) => { const t = v ?? ''; return t.length >= 1 && t.length <= 256; },
};

/* ── Secure fetch ────────────────────────────────── */
export async function secureFetch(url, options = {}) {
  const token = TokenStore.get();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-CSRF-Token': token } : {}),
    ...options.headers,
  };
  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 429) return { ok: false, status: 429, error: 'Too many requests. Please wait.' };
    if (res.status === 401 || res.status === 403) {
      TokenStore.clear();
      return { ok: false, status: res.status, error: 'Session expired. Please sign in again.' };
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data: sanitizeObject(data) };
  } catch (err) {
    return { ok: false, status: 0, error: 'Network error. Please check your connection.' };
  }
}

/* ── Route guard ─────────────────────────────────── */
// FIX: redirect to '/' not '/login' — login page is at index.js
export function requireAuth(router) {
  if (!TokenStore.exists() || !DataStore.get()) {
    router.replace('/');
    return false;
  }
  return true;
}

/* ── Logout ──────────────────────────────────────── */
// FIX: redirect to '/' not '/login'
export function logout(router) {
  TokenStore.clear();
  DataStore.clear();
  try {
    localStorage.removeItem('csrf_token');
    sessionStorage.clear();
  } catch { /* */ }
  router.replace('/');
}