import { AlertDialog } from 'radix-ui';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive' | 'success';
  isPending: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

/**
 * Konfirmasi aksi penting. Tombol konfirmasi tidak menutup dialog otomatis;
 * pemanggil menutupnya setelah request selesai supaya error tetap terlihat.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  isPending,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/45 motion-safe:animate-overlay-in" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => isPending && event.preventDefault()}
          className="fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-md motion-safe:animate-dialog-in -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-6 shadow-lg"
        >
          <div className="grid gap-1.5">
            <AlertDialog.Title className="text-lg font-semibold">{title}</AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground">{description}</AlertDialog.Description>
          </div>
          {children}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={isPending}>
                Batal
              </Button>
            </AlertDialog.Cancel>
            <Button variant={confirmVariant} isLoading={isPending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
