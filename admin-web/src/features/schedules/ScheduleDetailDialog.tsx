import { Users } from 'lucide-react';
import { getSchedule } from '../../api/schedules';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { scheduleStatusMeta } from '../../domain/scheduleStatus';
import { useApiQuery } from '../../hooks/useApiQuery';
import { formatDateTime, formatLongDate } from '../../lib/format';
import { ParticipantMeter } from './ParticipantMeter';

interface ScheduleDetailDialogProps {
  scheduleId: number;
  onClose: () => void;
}

export function ScheduleDetailDialog({ scheduleId, onClose }: ScheduleDetailDialogProps) {
  const detail = useApiQuery(`schedule:${scheduleId}`, (context) => getSchedule(context, scheduleId), { refreshIntervalMs: 15000 });
  const schedule = detail.data;
  const participants = schedule?.participants ?? [];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{schedule ? schedule.class.name : 'Detail sesi'}</DialogTitle>
          <DialogDescription>
            {schedule
              ? `${formatLongDate(schedule.schedule_date)}, ${schedule.start_time}–${schedule.end_time} · ${schedule.instructor.name}`
              : 'Memuat detail sesi.'}
          </DialogDescription>
        </DialogHeader>
        {detail.isLoading && <LoadingState label="Memuat peserta…" />}
        {detail.error && !schedule && <ErrorState message={detail.error.message} onRetry={detail.reload} isRetrying={detail.isRefreshing} />}
        {schedule && (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <StatusBadge meta={scheduleStatusMeta(schedule.display_status)} />
              <ParticipantMeter count={schedule.participants_count} minimum={schedule.min_participants} />
            </div>
            {participants.length === 0 ? (
              <EmptyState icon={Users} title="Belum ada peserta" description="Member yang membooking sesi ini akan muncul di sini." />
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableCaption>Peserta yang membooking sesi ini</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Booking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="font-medium">{participant.member.name}</div>
                          <div className="text-xs text-muted-foreground">{participant.member.email}</div>
                        </TableCell>
                        <TableCell className="tabular-nums">{participant.member.phone_number ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(participant.booked_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
