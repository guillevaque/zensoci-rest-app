// src/api/http.ts
const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "").trim();
const API_BASE  = (import.meta.env.VITE_API_BASE || `${API_ORIGIN ? API_ORIGIN + "/api" : "/api"}`);
export { API_BASE as HTTP_API_BASE };

async function jsonOrThrow(res: Response) {
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status}`);
  if (!ct.includes('application/json')) throw new Error(`No JSON: ${text}`);
  return JSON.parse(text);
}

export const http = {
  get:  (p: string) =>
    fetch(`${API_BASE}${p}`, { credentials: 'include' }).then(jsonOrThrow),
  send: (m: 'POST'|'PUT'|'DELETE', p: string, body?: any) =>
    fetch(`${API_BASE}${p}`, {
      method: m,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).then(jsonOrThrow),
};
