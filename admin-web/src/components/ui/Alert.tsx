import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, Info } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/cn';

const alertVariants = cva('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/50 dark:text-teal-200',
      danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200',
    },
  },
  defaultVariants: {
    tone: 'info',
  },
});

type AlertProps = ComponentProps<'div'> & VariantProps<typeof alertVariants>;

export function Alert({ className, tone, children, ...props }: AlertProps) {
  const Icon = tone === 'danger' ? CircleAlert : Info;

  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn(alertVariants({ tone }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid gap-1">{children}</div>
    </div>
  );
}
