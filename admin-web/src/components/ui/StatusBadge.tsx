import type { StatusMeta } from '../../domain/tone';
import { Badge } from './Badge';

const DOT_CLASSES = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-brand-teal',
  neutral: 'bg-muted-foreground/60',
} as const;

export function StatusBadge({ meta }: { meta: StatusMeta }) {
  return (
    <Badge tone={meta.tone}>
      <span className={`size-1.5 rounded-full ${DOT_CLASSES[meta.tone]}`} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
