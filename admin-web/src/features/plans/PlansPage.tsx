import { Package, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createPlan, deletePlan, listPlans, updatePlan } from '../../api/plans';
import type { MembershipPlan, MembershipPlanInput } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useMutation } from '../../hooks/useMutation';
import { PlanFormDialog } from './PlanFormDialog';
import { PlansTable } from './PlansTable';

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; plan: MembershipPlan };

export function PlansPage() {
  const plans = useApiQuery('plans', listPlans);
  const save = useMutation((context, args: { id: number | null; input: MembershipPlanInput }) =>
    args.id === null ? createPlan(context, args.input) : updatePlan(context, args.id, args.input),
  );
  const remove = useMutation((context, id: number) => deletePlan(context, id));
  const [form, setForm] = useState<FormState>({ mode: 'closed' });
  const [deleting, setDeleting] = useState<MembershipPlan | null>(null);

  const editingPlan = form.mode === 'edit' ? form.plan : null;

  const openForm = (next: FormState) => {
    save.reset();
    setForm(next);
  };

  const handleSave = async (input: MembershipPlanInput) => {
    const outcome = await save.run({ id: editingPlan?.id ?? null, input });

    if (outcome.status === 'success') {
      toast.success(editingPlan ? 'Paket diperbarui' : 'Paket ditambahkan', { description: outcome.data.name });
      setForm({ mode: 'closed' });
      plans.reload();
    }
  };

  const handleDelete = async () => {
    if (deleting === null) {
      return;
    }

    const outcome = await remove.run(deleting.id);

    if (outcome.status === 'skipped') {
      return;
    }

    if (outcome.status === 'success') {
      toast.success('Paket dihapus', { description: deleting.name });
    } else {
      toast.error('Paket tidak bisa dihapus', { description: outcome.error.message });
    }

    setDeleting(null);
    plans.reload();
  };

  return (
    <>
      <PageHeader
        title="Paket Membership"
        description="Atur nama, durasi, dan harga paket yang bisa dipilih member."
        actions={
          <Button onClick={() => openForm({ mode: 'create' })}>
            <Plus aria-hidden="true" />
            Tambah paket
          </Button>
        }
      />
      <Card>
        {plans.isLoading && <LoadingState label="Memuat paket…" />}
        {plans.error && !plans.data && <ErrorState message={plans.error.message} onRetry={plans.reload} isRetrying={plans.isRefreshing} />}
        {plans.data && plans.data.length === 0 && (
          <EmptyState
            icon={Package}
            title="Belum ada paket"
            description="Tambahkan paket pertama agar member bisa mengajukan membership."
            action={
              <Button variant="outline" onClick={() => openForm({ mode: 'create' })}>
                <Plus aria-hidden="true" />
                Tambah paket
              </Button>
            }
          />
        )}
        {plans.data && plans.data.length > 0 && (
          <PlansTable plans={plans.data} onEdit={(plan) => openForm({ mode: 'edit', plan })} onDelete={setDeleting} />
        )}
      </Card>
      {form.mode !== 'closed' && (
        <PlanFormDialog
          key={editingPlan?.id ?? 'new'}
          open
          plan={editingPlan}
          isPending={save.isPending}
          error={save.error}
          onSubmit={(input) => void handleSave(input)}
          onClose={() => setForm({ mode: 'closed' })}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Hapus paket?"
        description={
          deleting
            ? `Paket ${deleting.name} akan dihapus permanen. Paket yang sudah pernah dipakai member tidak bisa dihapus; nonaktifkan saja.`
            : ''
        }
        confirmLabel="Hapus paket"
        confirmVariant="destructive"
        isPending={remove.isPending}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
