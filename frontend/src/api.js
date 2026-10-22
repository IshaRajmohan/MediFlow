// In development, an empty API_URL means requests go through Vite's /api proxy.
// For deployment, set VITE_API_URL to the public backend URL.
const API_URL = import.meta.env.VITE_API_URL || '';

/** Send a request to the Express API and return its JSON response. */
export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('mediflow_token');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data !== null
      ? (data.error || data.message || 'Request failed')
      : (data || 'Request failed');
    throw new Error(message);
  }

  return data;
}
