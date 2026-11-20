import { waitFor } from '@testing-library/react';
import type { ApiContext } from '../lib/http';
import { ApiError } from '../lib/http';
import { authValue, renderHookWithAuth } from '../test/renderWithAuth';
import { useApiQuery } from './useApiQuery';

describe('useApiQuery', () => {
  it('menunggu sesi siap sebelum mengambil data', () => {
    const fetcher = vi.fn(async () => 'data');
    const { result } = renderHookWithAuth(() => useApiQuery('key', fetcher), authValue({ session: { status: 'loading' } }));

    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(true);
  });

  it('membatalkan request lama saat key berubah sehingga hasil lama tidak menimpa data baru', async () => {
    const signals: AbortSignal[] = [];
    let resolveSlow: (value: string) => void = () => undefined;
    const fetcher = vi.fn((context: ApiContext) => {
      if (context.signal) {
        signals.push(context.signal);
      }

      return signals.length === 1
        ? new Promise<string>((resolve) => {
            resolveSlow = resolve;
          })
        : Promise.resolve('halaman 2');
    });

    const { result, rerender } = renderHookWithAuth(({ page }: { page: number }) => useApiQuery(`page:${page}`, fetcher), authValue(), {
      page: 1,
    });

    rerender({ page: 2 });

    await waitFor(() => expect(result.current.data).toBe('halaman 2'));
    expect(signals[0]?.aborted).toBe(true);

    resolveSlow('halaman 1');
    await Promise.resolve();

    expect(result.current.data).toBe('halaman 2');
  });

  it('menampilkan error dan bisa memuat ulang', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new ApiError(500, 'Server error')).mockResolvedValueOnce(['baris']);
    const { result } = renderHookWithAuth(() => useApiQuery('list', fetcher), authValue());

    await waitFor(() => expect(result.current.error?.message).toBe('Server error'));

    result.current.reload();

    await waitFor(() => expect(result.current.data).toEqual(['baris']));
    expect(result.current.error).toBeNull();
  });

  it('mengakhiri sesi saat token ditolak', async () => {
    const auth = authValue();
    const fetcher = vi.fn().mockRejectedValue(new ApiError(401, 'Sesi berakhir.'));

    renderHookWithAuth(() => useApiQuery('secure', fetcher), auth);

    await waitFor(() => expect(auth.expireSession).toHaveBeenCalledTimes(1));
  });
});
