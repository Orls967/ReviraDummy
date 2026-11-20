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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type QueryParams = Readonly<Record<string, string | number | null | undefined>>;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  query?: QueryParams;
}

export const NETWORK_ERROR_MESSAGE = 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
export const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan pada server. Coba lagi.';

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  401: 'Sesi Anda berakhir. Silakan masuk kembali.',
  403: 'Anda tidak memiliki akses ke data ini.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah berubah. Muat ulang lalu coba lagi.',
  422: 'Periksa kembali isian Anda.',
  429: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.',
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function buildUrl(baseUrl: string, path: string, query: QueryParams = {}): string {
  const url = new URL(baseUrl + path);

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    throw new ApiError(0, 'Alamat API belum diatur (VITE_API_URL).');
  }

  const headers = new Headers({ Accept: 'application/json' });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(apiBaseUrl, path, options.query), {
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

/**
 * Request tanpa isi respons (204).
 */
export async function apiSend(path: string, options: RequestOptions = {}): Promise<void> {
  await send(path, options);
}
