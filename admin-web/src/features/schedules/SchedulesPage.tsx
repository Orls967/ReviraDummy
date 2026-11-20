import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { changeScheduleStatus, createSchedule, deleteSchedule, listClasses, listInstructors, listSchedules, updateSchedule } from '../../api/schedules';
import type { ClassSchedule, ClassScheduleInput, ScheduleStatusChange } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useMutation } from '../../hooks/useMutation';
import { formatDate } from '../../lib/format';
import { CancelScheduleDialog } from './CancelScheduleDialog';
import { ScheduleDayList } from './ScheduleDayList';
import { ScheduleDetailDialog } from './ScheduleDetailDialog';
import { ScheduleFormDialog } from './ScheduleFormDialog';
import type { ScheduleAction } from './ScheduleRow';
import { useWeekRange } from './useWeekRange';

const REFRESH_INTERVAL_MS = 30000;

type Panel =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit' | 'detail' | 'cancel' | 'start' | 'complete' | 'delete'; schedule: ClassSchedule };

const CONFIRM_COPY = {
  start: { title: 'Tandai sesi berlangsung?', confirm: 'Tandai berlangsung', toast: 'Sesi ditandai berlangsung' },
  complete: { title: 'Tandai sesi selesai?', confirm: 'Tandai selesai', toast: 'Sesi ditandai selesai' },
  delete: { title: 'Hapus sesi?', confirm: 'Hapus sesi', toast: 'Sesi dihapus' },
} as const;

export function SchedulesPage() {
  const week = useWeekRange();
  const schedules = useApiQuery(
    `schedules:${week.from}:${week.to}`,
    (context) => listSchedules(context, { from: week.from, to: week.to }),
    { refreshIntervalMs: REFRESH_INTERVAL_MS },
  );
  const classes = useApiQuery('classes', listClasses);
  const instructors = useApiQuery('instructors', listInstructors);
  const [panel, setPanel] = useState<Panel>({ type: 'none' });

  const save = useMutation((context, args: { id: number | null; input: ClassScheduleInput }) =>
    args.id === null ? createSchedule(context, args.input) : updateSchedule(context, args.id, args.input),
  );
  const changeStatus = useMutation((context, args: { id: number; change: ScheduleStatusChange }) =>
    changeScheduleStatus(context, args.id, args.change),
  );
  const remove = useMutation((context, id: number) => deleteSchedule(context, id));

  const close = () => setPanel({ type: 'none' });

  const handleAction = (action: ScheduleAction, schedule: ClassSchedule) => {
    save.reset();
    changeStatus.reset();
    setPanel({ type: action, schedule });
  };

  const handleSave = async (input: ClassScheduleInput) => {
    const id = panel.type === 'edit' ? panel.schedule.id : null;
    const outcome = await save.run({ id, input });

    if (outcome.status === 'success') {
      toast.success(id === null ? 'Jadwal ditambahkan' : 'Jadwal diperbarui', {
        description: `${outcome.data.class.name}, ${formatDate(outcome.data.schedule_date)} ${outcome.data.start_time}`,
      });
      close();
      schedules.reload();
    }
  };

  const handleCancel = async (reason: string) => {
    if (panel.type !== 'cancel') {
      return;
    }

    const outcome = await changeStatus.run({ id: panel.schedule.id, change: { status: 'cancelled', cancel_reason: reason } });

    if (outcome.status === 'success') {
      toast.success('Sesi dibatalkan', { description: outcome.data.class.name });
      close();
      schedules.reload();
    }
  };

  const handleConfirm = async () => {
    if (panel.type !== 'start' && panel.type !== 'complete' && panel.type !== 'delete') {
      return;
    }

    const { schedule, type } = panel;
    const outcome =
      type === 'delete'
        ? await remove.run(schedule.id)
        : await changeStatus.run({ id: schedule.id, change: { status: type === 'start' ? 'ongoing' : 'completed' } });

    if (outcome.status === 'skipped') {
      return;
    }

    if (outcome.status === 'success') {
      toast.success(CONFIRM_COPY[type].toast, { description: schedule.class.name });
    } else {
      toast.error('Aksi gagal', { description: outcome.error.message });
    }

    close();
    schedules.reload();
  };

  const openCreate = () => {
    save.reset();
    setPanel({ type: 'create' });
  };

  const confirmType = panel.type === 'start' || panel.type === 'complete' || panel.type === 'delete' ? panel.type : null;
  const catalogReady = classes.data !== null && instructors.data !== null;

  return (
    <>
      <PageHeader
        title="Jadwal Kelas"
        description="Kelola sesi kelas dan pantau jumlah peserta. Data diperbarui otomatis setiap 30 detik."
        actions={
          <>
            <Button variant="outline" onClick={schedules.reload} isLoading={schedules.isRefreshing}>
              {!schedules.isRefreshing && <RefreshCw aria-hidden="true" />}
              Muat ulang
            </Button>
            <Button onClick={openCreate} disabled={!catalogReady}>
              <Plus aria-hidden="true" />
              Tambah jadwal
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium" aria-live="polite">
          {formatDate(week.from)} – {formatDate(week.to)}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={week.previous}>
            <ChevronLeft aria-hidden="true" />
            Minggu sebelumnya
          </Button>
          <Button variant="outline" size="sm" onClick={week.today} disabled={week.isCurrentWeek}>
            Hari ini
          </Button>
          <Button variant="outline" size="sm" onClick={week.next}>
            Minggu berikutnya
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>
      {schedules.isLoading && (
        <Card>
          <LoadingState label="Memuat jadwal…" />
        </Card>
      )}
      {schedules.error && !schedules.data && (
        <Card>
          <ErrorState message={schedules.error.message} onRetry={schedules.reload} isRetrying={schedules.isRefreshing} />
        </Card>
      )}
      {schedules.data && schedules.data.length === 0 && (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="Belum ada jadwal minggu ini"
            description="Tambahkan sesi kelas agar member bisa membooking."
            action={
              <Button variant="outline" onClick={openCreate} disabled={!catalogReady}>
                <Plus aria-hidden="true" />
                Tambah jadwal
              </Button>
            }
          />
        </Card>
      )}
      {schedules.data && schedules.data.length > 0 && <ScheduleDayList schedules={schedules.data} onAction={handleAction} />}

      {(panel.type === 'create' || panel.type === 'edit') && classes.data && instructors.data && (
        <ScheduleFormDialog
          schedule={panel.type === 'edit' ? panel.schedule : null}
          defaultDate={week.from}
          classes={classes.data}
          instructors={instructors.data}
          isPending={save.isPending}
          error={save.error}
          onSubmit={(input) => void handleSave(input)}
          onClose={close}
        />
      )}
      {panel.type === 'detail' && <ScheduleDetailDialog scheduleId={panel.schedule.id} onClose={close} />}
      {panel.type === 'cancel' && (
        <CancelScheduleDialog
          schedule={panel.schedule}
          isPending={changeStatus.isPending}
          error={changeStatus.error}
          onSubmit={(reason) => void handleCancel(reason)}
          onClose={close}
        />
      )}
      <ConfirmDialog
        open={confirmType !== null}
        onOpenChange={(open) => !open && close()}
        title={confirmType ? CONFIRM_COPY[confirmType].title : ''}
        description={
          panel.type === 'start' || panel.type === 'complete' || panel.type === 'delete'
            ? `${panel.schedule.class.name}, ${formatDate(panel.schedule.schedule_date)} pukul ${panel.schedule.start_time}.`
            : ''
        }
        confirmLabel={confirmType ? CONFIRM_COPY[confirmType].confirm : ''}
        confirmVariant={confirmType === 'delete' ? 'destructive' : 'default'}
        isPending={changeStatus.isPending || remove.isPending}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
