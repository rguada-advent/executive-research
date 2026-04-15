// In Electron, the backend runs on localhost:5001. In dev with Vite proxy, use /api.
const BACKEND_URL = window.psgApp?.isElectron
  ? 'http://127.0.0.1:5001'
  : '/api';

// Per-session auth token injected by the Electron preload via contextBridge.
// Included in every Flask API request so the backend can reject calls from
// other processes on the same machine that don't possess the token.
function localAuthHeaders() {
  const token = window.psgApp?.localToken;
  return token ? { 'X-PSG-Local-Token': token } : {};
}

export async function backendFetch(path, body = {}, signal) {
  const r = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...localAuthHeaders(),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    throw new Error(err.error || `Backend error ${r.status}`);
  }
  return r.json();
}

export async function searchGlassdoor(company, signal) {
  return backendFetch('/glassdoor/reviews', { company }, signal);
}

export async function proxyFetch(url, method = 'GET', headers = {}, signal) {
  return backendFetch('/proxy', { url, method, headers }, signal);
}

export async function checkBackendHealth() {
  try {
    const r = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}
