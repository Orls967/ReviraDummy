import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { addDays, todayIso } from '../../lib/format';

const DAYS_PER_VIEW = 7;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function useWeekRange() {
  const [params, setParams] = useSearchParams();
  const fromParam = params.get('from');
  const from = fromParam !== null && ISO_DATE.test(fromParam) ? fromParam : todayIso();
  const to = addDays(from, DAYS_PER_VIEW - 1);

  const goTo = useCallback(
    (nextFrom: string) => setParams(nextFrom === todayIso() ? {} : { from: nextFrom }, { replace: true }),
    [setParams],
  );

  return useMemo(
    () => ({
      from,
      to,
      previous: () => goTo(addDays(from, -DAYS_PER_VIEW)),
      next: () => goTo(addDays(from, DAYS_PER_VIEW)),
      today: () => goTo(todayIso()),
      isCurrentWeek: from === todayIso(),
    }),
    [from, to, goTo],
  );
}
