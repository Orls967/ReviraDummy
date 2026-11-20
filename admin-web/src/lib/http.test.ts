import { ApiError, buildUrl, describeError, toApiError } from './http';
import { resolveApiBaseUrl } from './config';

describe('resolveApiBaseUrl', () => {
  it('menambahkan prefix /api/v1 dan membuang garis miring di akhir', () => {
    expect(resolveApiBaseUrl('http://localhost:8000/')).toBe('http://localhost:8000/api/v1');
  });

  it('mengembalikan null bila belum diatur', () => {
    expect(resolveApiBaseUrl(undefined)).toBeNull();
    expect(resolveApiBaseUrl('   ')).toBeNull();
  });
});

describe('buildUrl', () => {
  it('melewati parameter kosong', () => {
    expect(buildUrl('http://api.test/api/v1', '/admin/members', { status: '', page: 2, search: null })).toBe(
      'http://api.test/api/v1/admin/members?page=2',
    );
  });
});

describe('toApiError', () => {
  it('membawa pesan dan error per kolom dari 422', () => {
    const error = toApiError(422, {
      message: 'Nama wajib diisi.',
      errors: { name: ['Nama wajib diisi.'], price: ['Harga minimal 0.'] },
    });

    expect(error.status).toBe(422);
    expect(error.message).toBe('Nama wajib diisi.');
    expect(error.fieldError('price')).toBe('Harga minimal 0.');
    expect(error.fieldError('unknown')).toBeUndefined();
  });

  it('memakai pesan server untuk 409', () => {
    expect(toApiError(409, { message: 'Transaksi ini sudah diproses sebelumnya.' }).message).toBe(
      'Transaksi ini sudah diproses sebelumnya.',
    );
  });

  it('memakai pesan bahasa Indonesia untuk 401 dan error server', () => {
    expect(toApiError(401, { message: 'Unauthenticated.' }).message).toBe('Sesi Anda berakhir. Silakan masuk kembali.');
    expect(toApiError(500, { message: 'SQLSTATE[HY000]' }).message).toBe('Terjadi kesalahan pada server. Coba lagi.');
  });
});

describe('describeError', () => {
  it('menyembunyikan detail error non-API', () => {
    expect(describeError(new TypeError('boom'))).toBe('Terjadi kesalahan pada server. Coba lagi.');
    expect(describeError(new ApiError(404, 'Data tidak ditemukan.'))).toBe('Data tidak ditemukan.');
  });
});
