import { useState, type FormEvent } from 'react';
import type { AdminTransaction } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Textarea } from '../../components/ui/Textarea';
import type { ApiError } from '../../lib/http';

interface RejectTransactionDialogProps {
  transaction: AdminTransaction | null;
  isPending: boolean;
  error: ApiError | null;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function RejectTransactionDialog({ transaction, isPending, error, onSubmit, onClose }: RejectTransactionDialogProps) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reason.trim();

    if (trimmed === '') {
      setLocalError('Alasan penolakan wajib diisi.');

      return;
    }

    setLocalError(null);
    onSubmit(trimmed);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const fieldError = localError ?? error?.fieldError('reason');
  const generalError = error && !error.fieldError('reason') ? error.message : null;

  return (
    <Dialog open={transaction !== null} onOpenChange={handleOpenChange}>
      <DialogContent isLocked={isPending}>
        <DialogHeader>
          <DialogTitle>Tolak transaksi</DialogTitle>
          <DialogDescription>
            {transaction && `Pengajuan ${transaction.membership.plan.name} oleh ${transaction.member.name} akan ditolak. Alasan ini dapat dilihat member.`}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          {generalError && <Alert tone="danger">{generalError}</Alert>}
          <FormField label="Alasan penolakan" error={fieldError} hint="Maksimal 255 karakter.">
            {(control) => (
              <Textarea
                {...control}
                maxLength={255}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isPending}
                placeholder="Contoh: Nominal transfer tidak sesuai harga paket."
              />
            )}
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" isLoading={isPending}>
              Tolak transaksi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
