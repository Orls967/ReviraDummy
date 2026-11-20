import { useState, type FormEvent } from 'react';
import type { ClassSchedule } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Textarea } from '../../components/ui/Textarea';
import type { ApiError } from '../../lib/http';
import { formatDate } from '../../lib/format';

interface CancelScheduleDialogProps {
  schedule: ClassSchedule;
  isPending: boolean;
  error: ApiError | null;
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

export function CancelScheduleDialog({ schedule, isPending, error, onSubmit, onClose }: CancelScheduleDialogProps) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (reason.trim() === '') {
      setLocalError('Alasan pembatalan wajib diisi.');

      return;
    }

    setLocalError(null);
    onSubmit(reason.trim());
  };

  const fieldError = localError ?? error?.fieldError('cancel_reason');
  const generalError = error && !error.fieldError('cancel_reason') ? error.message : null;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent isLocked={isPending}>
        <DialogHeader>
          <DialogTitle>Batalkan sesi</DialogTitle>
          <DialogDescription>
            {schedule.class.name}, {formatDate(schedule.schedule_date)} pukul {schedule.start_time}. {schedule.participants_count} member sudah
            booking dan akan melihat alasan ini di aplikasi.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
          {generalError && <Alert tone="danger">{generalError}</Alert>}
          <FormField label="Alasan pembatalan" error={fieldError}>
            {(control) => (
              <Textarea
                {...control}
                maxLength={255}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isPending}
                placeholder="Contoh: Instruktur berhalangan hadir."
              />
            )}
          </FormField>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Kembali
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" isLoading={isPending}>
              Batalkan sesi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
