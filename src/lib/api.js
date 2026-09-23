// Centralized fetch wrapper + image URL helpers.
//
// The React Native app called `fetch` directly everywhere. The clone keeps that
// convention but funnels it through one module so backend errors surface the
// same `{ message }` shape the ASP.NET controllers return.

const API_BASE = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE) || "";

export async function apiFetch(path, options = {}) {
  const { token, ...init } = options;
  const headers = { Accept: "application/json", ...(init.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // no JSON body
  }
  return { ok: res.ok, status: res.status, data };
}

/**
 * The RN app resolved worker/client pictures like:
 *   item.picture.startsWith('/') ? `${SERVER_BASE}${item.picture}` : fallbackUrl
 * This helper reproduces that exactly.
 */
export function resolveImage(picture, fallback) {
  if (picture && picture.startsWith("/")) return `${API_BASE}${picture}`;
  if (picture && /^https?:\/\//.test(picture)) return picture;
  return fallback || null;
}
