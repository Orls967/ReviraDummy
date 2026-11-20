import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { MemberQuery } from '../../api/members';
import { MEMBERSHIP_STATUSES } from '../../domain/membershipStatus';

export const ALL = 'all';

function readPage(value: string | null): number {
  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Filter daftar member disimpan di URL agar bisa dibagikan dan tetap ada saat halaman dimuat ulang.
 */
export function useMemberFilters() {
  const [params, setParams] = useSearchParams();

  const query = useMemo<MemberQuery>(() => {
    const status = params.get('status') ?? '';

    return {
      status: (MEMBERSHIP_STATUSES as readonly string[]).includes(status) ? status : '',
      planId: params.get('plan') ?? '',
      search: params.get('q') ?? '',
      page: readPage(params.get('page')),
    };
  }, [params]);

  const update = useCallback(
    (changes: Partial<Record<'status' | 'plan' | 'q' | 'page', string>>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);

          for (const [key, value] of Object.entries(changes)) {
            if (value === '' || value === ALL) {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          }

          if (!('page' in changes)) {
            next.delete('page');
          }

          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { query, update };
}
