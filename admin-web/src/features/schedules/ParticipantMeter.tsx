import { participantProgress } from '../../domain/participants';
import { cn } from '../../lib/cn';

export function ParticipantMeter({ count, minimum }: { count: number; minimum: number }) {
  const progress = participantProgress(count, minimum);
  const percent = progress.minimum === 0 ? 100 : Math.min(100, Math.round((progress.count / progress.minimum) * 100));

  return (
    <div className="grid min-w-36 gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-medium tabular-nums">{progress.label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className={cn('h-full rounded-full transition-[width]', progress.isMinimumMet ? 'bg-emerald-500' : 'bg-amber-500')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className={cn('text-xs', progress.isMinimumMet ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>
        {progress.isMinimumMet ? 'Minimum terpenuhi' : `Butuh ${progress.missing} peserta lagi`}
      </span>
    </div>
  );
}
