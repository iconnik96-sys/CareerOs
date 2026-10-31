/**
 * CareerOS Founder Console API Client
 * Centralized HTTP client managing authentication headers, base URLs,
 * and session expiration fail-closed triggers.
 */

const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // Default development fallback
  return 'http://localhost:8000';
};

export const API_BASE_URL = getApiBaseUrl();

export interface SessionAuth {
  type: 'bearer' | 'admin_key';
  token: string;
  email?: string;
}

const SESSION_KEY = 'careeros_founder_auth';

export const getSessionAuth = (): SessionAuth | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setSessionAuth = (auth: SessionAuth | null) => {
  try {
    if (auth) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(auth));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // SessionStorage unavailable
  }
};

export async function adminFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const auth = getSessionAuth();
  const headers = new Headers(options.headers || {});

  headers.set('Accept', 'application/json');

  if (auth) {
    if (auth.type === 'admin_key') {
      headers.set('X-Admin-Key', auth.token);
    } else if (auth.type === 'bearer') {
      headers.set('Authorization', `Bearer ${auth.token}`);
    }
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401 || response.status === 403) {
    // Unauthorized or forbidden -> notify app of session termination
    window.dispatchEvent(new CustomEvent('careeros:auth_expired', { detail: { status: response.status } }));
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'Access Denied: Founder privileges required.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

