const TOKEN_KEY = 'libraryCatalogToken';

export function apiUrl(path) {
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  return apiBaseUrl ? new URL(path, `${apiBaseUrl}/`).toString() : path;
}

export async function apiRequest(path, options = {}) {
  const headers = { ...options.headers };
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(apiUrl(path), { ...options, headers });
  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'The request could not be completed.');
  }

  return payload;
}
