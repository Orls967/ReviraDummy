const API_PREFIX = '/api/v1';

/**
 * VITE_API_URL berisi origin server Laravel (mis. http://localhost:8000), tanpa /api/v1.
 */
export function resolveApiBaseUrl(raw: string | undefined): string | null {
  const value = raw?.trim();

  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, '') + API_PREFIX;
}

export const apiBaseUrl = resolveApiBaseUrl(import.meta.env.VITE_API_URL);
