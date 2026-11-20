import { act, waitFor } from '@testing-library/react';
import { ApiError } from '../lib/http';
import { authValue, renderHookWithAuth } from '../test/renderWithAuth';
import { useMutation } from './useMutation';

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

describe('useMutation', () => {
  it('mengabaikan klik kedua selama request pertama berjalan', async () => {
    const pending = deferred<string>();
    const action = vi.fn(() => pending.promise);
    const { result } = renderHookWithAuth(() => useMutation(action), authValue());

    let first: Promise<unknown> = Promise.resolve();
    let second: Promise<unknown> = Promise.resolve();

    act(() => {
      first = result.current.run(1);
      second = result.current.run(2);
    });

    await expect(second).resolves.toEqual({ status: 'skipped' });
    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await act(async () => {
      pending.resolve('ok');
      await first;
    });

    expect(result.current.isPending).toBe(false);
    await expect(first).resolves.toEqual({ status: 'success', data: 'ok' });
  });

  it('mengirim token sesi ke aksi', async () => {
    const action = vi.fn(async (context: { token: string }) => context.token);
    const { result } = renderHookWithAuth(() => useMutation(action), authValue());

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.run(undefined);
    });

    expect(outcome).toEqual({ status: 'success', data: 'test-token' });
  });

  it('menyimpan error validasi dan mengakhiri sesi saat 401', async () => {
    const auth = authValue();
    const validation = new ApiError(422, 'Periksa isian.', { name: ['Nama wajib diisi.'] });
    const action = vi.fn().mockRejectedValueOnce(validation).mockRejectedValueOnce(new ApiError(401, 'Sesi berakhir.'));
    const { result } = renderHookWithAuth(() => useMutation(action), auth);

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error?.fieldError('name')).toBe('Nama wajib diisi.');

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(auth.expireSession).toHaveBeenCalledTimes(1);
  });
});
