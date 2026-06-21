/**
 * services/http.ts — Base HTTP client
 * Reads VITE_API_ORIGIN from .env.local to point to your Hostinger API.
 * Example .env.local:  VITE_API_ORIGIN=https://app.zensoci.com
 */

const _origin = (import.meta.env.VITE_API_ORIGIN ?? '').trim();
export const API_BASE = _origin ? `${_origin}/api` : '/api';

async function parseResponse(res: Response): Promise<any> {
  const ct   = res.headers.get('content-type') ?? '';
  const text = await res.text();

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (ct.includes('application/json')) {
      try { msg = JSON.parse(text).error ?? msg; } catch { /* noop */ }
    } else {
      msg = text.slice(0, 140) || msg;
    }
    throw new Error(msg);
  }

  if (!ct.includes('application/json')) {
    throw new Error(`Respuesta no JSON: ${text.slice(0, 100)}`);
  }
  return JSON.parse(text);
}

export const http = {
  get: (path: string) =>
    fetch(`${API_BASE}${path}`, { credentials: 'include' })
      .then(parseResponse),

  post: (path: string, body?: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(parseResponse),

  put: (path: string, body?: unknown) =>
    fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(parseResponse),

  delete: (path: string) =>
    fetch(`${API_BASE}${path}`, { method: 'DELETE', credentials: 'include' })
      .then(parseResponse),
};
