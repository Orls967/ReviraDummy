import { cn } from '../../lib/cn';

const SIZES = {
  sm: 'size-9 rounded-lg text-lg',
  lg: 'size-14 rounded-2xl text-3xl',
} as const;

/** Monogram "R" emas di atas hitam, sesuai brand board Revira Fitness Center. */
export function BrandMark({ size = 'sm', className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-brand-black font-brand font-extrabold text-brand-gold ring-1 ring-white/10 [font-stretch:125%]',
        SIZES[size],
        className,
      )}
    >
      R
    </span>
  );
}
