import { apiBaseUrl } from './config';

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

export interface ApiContext {
  token: string;
  signal?: AbortSignal;
}

type HttpMethod = 'GET' | 'POST' | 'DELETE';
export type QueryParams = Readonly<Record<string, string | number | null | undefined>>;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  query?: QueryParams;
}

export const NETWORK_ERROR_MESSAGE = 'Tidak dapat terhubung ke server. Periksa koneksi internet lalu coba lagi.';
export const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan pada server. Coba lagi.';

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  401: 'Sesi Anda berakhir. Silakan masuk kembali.',
  403: 'Akun Anda tidak memiliki akses ke fitur ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah berubah. Muat ulang lalu coba lagi.',
  422: 'Periksa kembali isian Anda.',
  429: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.',
};

/** Di React Native, request yang dibatalkan melempar Error biasa bernama "AbortError" (bukan DOMException). */
export function isAbortError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function buildQueryString(query: QueryParams = {}): string {
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return pairs.length === 0 ? '' : `?${pairs.join('&')}`;
}

function readFieldErrors(payload: unknown): FieldErrors {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {};
  }

  const errors: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(payload.errors)) {
    if (Array.isArray(messages)) {
      errors[field] = messages.filter((message): message is string => typeof message === 'string');
    }
  }

  return errors;
}

export function toApiError(status: number, payload: unknown): ApiError {
  const serverMessage = isRecord(payload) && typeof payload.message === 'string' ? payload.message.trim() : '';
  const useServerMessage = serverMessage !== '' && status !== 401 && status < 500;
  const message = useServerMessage ? serverMessage : (STATUS_MESSAGES[status] ?? GENERIC_ERROR_MESSAGE);

  return new ApiError(status, message, readFieldErrors(payload));
}

export function describeError(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (text === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  if (apiBaseUrl === null) {
    throw new ApiError(0, 'Alamat API belum diatur (EXPO_PUBLIC_API_URL).');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(apiBaseUrl + path + buildQueryString(options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? null : JSON.stringify(options.body),
      signal: options.signal ?? null,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw toApiError(response.status, await readJson(response));
  }

  return response;
}

/**
 * Request yang mengembalikan JSON. Bentuk data dipercaya sesuai kontrak OpenAPI.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);

  return (await readJson(response)) as T;
}

export async function apiSend(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options);
}
