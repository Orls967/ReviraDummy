import { useState, type FormEvent } from 'react';
import type { MembershipPlan, MembershipPlanInput } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Switch } from '../../components/ui/Switch';
import { Textarea } from '../../components/ui/Textarea';
import type { ApiError } from '../../lib/http';

interface PlanFormDialogProps {
  open: boolean;
  plan: MembershipPlan | null;
  isPending: boolean;
  error: ApiError | null;
  onSubmit: (input: MembershipPlanInput) => void;
  onClose: () => void;
}

interface PlanFormValues {
  name: string;
  durationDays: string;
  price: string;
  description: string;
  isActive: boolean;
}

function initialValues(plan: MembershipPlan | null): PlanFormValues {
  return {
    name: plan?.name ?? '',
    durationDays: plan ? String(plan.duration_days) : '30',
    price: plan ? String(plan.price) : '',
    description: plan?.description ?? '',
    isActive: plan?.is_active ?? true,
  };
}

function toInput(values: PlanFormValues): MembershipPlanInput {
  return {
    name: values.name.trim(),
    duration_days: Number(values.durationDays),
    price: Number(values.price),
    description: values.description.trim() === '' ? null : values.description.trim(),
    is_active: values.isActive,
  };
}

export function PlanFormDialog({ open, plan, isPending, error, onSubmit, onClose }: PlanFormDialogProps) {
  const [values, setValues] = useState(() => initialValues(plan));
  const set = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(toInput(values));
  };

  const hasFieldErrors = error !== null && Object.keys(error.fieldErrors).length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent isLocked={isPending}>
        <DialogHeader>
          <DialogTitle>{plan ? 'Ubah paket' : 'Tambah paket'}</DialogTitle>
          <DialogDescription>Harga dalam rupiah. Perubahan harga tidak memengaruhi transaksi yang sudah ada.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          {error && !hasFieldErrors && <Alert tone="danger">{error.message}</Alert>}
          <FormField label="Nama paket" error={error?.fieldError('name')}>
            {(control) => (
              <Input {...control} value={values.name} maxLength={100} onChange={(event) => set('name', event.target.value)} disabled={isPending} />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Durasi (hari)" error={error?.fieldError('duration_days')}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={values.durationDays}
                  onChange={(event) => set('durationDays', event.target.value)}
                  disabled={isPending}
                />
              )}
            </FormField>
            <FormField label="Harga (Rp)" error={error?.fieldError('price')}>
              {(control) => (
                <Input
                  {...control}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={values.price}
                  onChange={(event) => set('price', event.target.value)}
                  disabled={isPending}
                />
              )}
            </FormField>
          </div>
          <FormField label="Deskripsi" error={error?.fieldError('description')} hint="Opsional, tampil di aplikasi member.">
            {(control) => (
              <Textarea
                {...control}
                maxLength={1000}
                value={values.description}
                onChange={(event) => set('description', event.target.value)}
                disabled={isPending}
              />
            )}
          </FormField>
          <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <div className="grid gap-1">
              <Label htmlFor="plan-active">Tampilkan ke member</Label>
              <p className="text-xs text-muted-foreground">Paket nonaktif tidak bisa dipilih saat pengajuan.</p>
            </div>
            <Switch id="plan-active" checked={values.isActive} onCheckedChange={(checked) => set('isActive', checked)} disabled={isPending} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isPending}>
              {plan ? 'Simpan perubahan' : 'Tambah paket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
