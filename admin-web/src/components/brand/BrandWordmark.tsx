import { cn } from '../../lib/cn';

interface BrandWordmarkProps {
  tone: 'gold' | 'black';
  className?: string;
}

/** Wordmark "REVIRA / FITNESS CENTER" memakai Archivo lebar, mengikuti brand board. */
export function BrandWordmark({ tone, className }: BrandWordmarkProps) {
  return (
    <span className={cn('inline-flex flex-col items-center leading-none', className)}>
      <span
        className={cn(
          'font-brand text-[1.35em] font-extrabold tracking-[0.02em] [font-stretch:125%]',
          tone === 'gold' ? 'text-brand-gold' : 'text-brand-black dark:text-brand-gold',
        )}
      >
        REVIRA
      </span>
      <span className="mt-[0.35em] mr-[-0.42em] font-brand text-[0.42em] font-bold tracking-[0.42em] text-brand-teal [font-stretch:125%]">
        FITNESS CENTER
      </span>
    </span>
  );
}
