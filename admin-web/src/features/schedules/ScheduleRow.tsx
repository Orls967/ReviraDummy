import { Ban, CheckCheck, Eye, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react';
import type { ClassSchedule } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/DropdownMenu';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { scheduleActions, scheduleStatusMeta } from '../../domain/scheduleStatus';
import { ParticipantMeter } from './ParticipantMeter';

export type ScheduleAction = 'detail' | 'edit' | 'start' | 'complete' | 'cancel' | 'delete';

interface ScheduleRowProps {
  schedule: ClassSchedule;
  onAction: (action: ScheduleAction, schedule: ClassSchedule) => void;
}

export function ScheduleRow({ schedule, onAction }: ScheduleRowProps) {
  const actions = scheduleActions(schedule.status, schedule.display_status);

  return (
    <li className="grid gap-3 px-5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-5">
      <div className="text-sm font-semibold tabular-nums">
        {schedule.start_time}–{schedule.end_time}
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium">{schedule.class.name}</p>
        <p className="truncate text-sm text-muted-foreground">{schedule.instructor.name}</p>
        {schedule.cancel_reason && <p className="mt-1 text-xs text-destructive">Alasan batal: {schedule.cancel_reason}</p>}
      </div>
      <StatusBadge meta={scheduleStatusMeta(schedule.display_status)} />
      <ParticipantMeter count={schedule.participants_count} minimum={schedule.min_participants} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${schedule.class.name} ${schedule.start_time}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onAction('detail', schedule)}>
            <Eye aria-hidden="true" />
            Lihat peserta
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!actions.canEdit} onSelect={() => onAction('edit', schedule)}>
            <Pencil aria-hidden="true" />
            Ubah jadwal
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!actions.canStart} onSelect={() => onAction('start', schedule)}>
            <Play aria-hidden="true" />
            Tandai berlangsung
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!actions.canComplete} onSelect={() => onAction('complete', schedule)}>
            <CheckCheck aria-hidden="true" />
            Tandai selesai
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!actions.canCancel} onSelect={() => onAction('cancel', schedule)}>
            <Ban aria-hidden="true" />
            Batalkan sesi
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive disabled={schedule.participants_count > 0} onSelect={() => onAction('delete', schedule)}>
            <Trash2 aria-hidden="true" />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
