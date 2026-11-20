const API_PREFIX = '/api/v1';

/**
 * EXPO_PUBLIC_API_URL berisi origin server Laravel (mis. http://192.168.1.10:8000), tanpa /api/v1.
 * Untuk Expo Go di HP, gunakan IP komputer di jaringan yang sama, bukan localhost.
 */
export function resolveApiBaseUrl(raw: string | undefined): string | null {
  const value = raw?.trim();

  if (!value) {
    return null;
  }

  return value.replace(/\/+$/, '') + API_PREFIX;
}

export const apiBaseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL);
