import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

interface LoadingStateProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingState({ label = 'Memuat data…', fullScreen = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn('flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground', fullScreen && 'min-h-screen')}
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
