import { useState, type FormEvent } from 'react';
import type { ClassSchedule, ClassScheduleInput, GymClass, Instructor } from '../../api/types';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import type { ApiError } from '../../lib/http';
import { todayIso } from '../../lib/format';

interface ScheduleFormDialogProps {
  schedule: ClassSchedule | null;
  defaultDate: string;
  classes: GymClass[];
  instructors: Instructor[];
  isPending: boolean;
  error: ApiError | null;
  onSubmit: (input: ClassScheduleInput) => void;
  onClose: () => void;
}

interface ScheduleFormValues {
  classId: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export function ScheduleFormDialog({
  schedule,
  defaultDate,
  classes,
  instructors,
  isPending,
  error,
  onSubmit,
  onClose,
}: ScheduleFormDialogProps) {
  const [values, setValues] = useState<ScheduleFormValues>(() => ({
    classId: schedule ? String(schedule.class.id) : '',
    instructorId: schedule ? String(schedule.instructor.id) : '',
    date: schedule?.schedule_date ?? defaultDate,
    startTime: schedule?.start_time ?? '07:00',
    endTime: schedule?.end_time ?? '08:00',
  }));
  const [missing, setMissing] = useState<string | null>(null);
  const set = <K extends keyof ScheduleFormValues>(key: K, value: ScheduleFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const chooseClass = (classId: string) => {
    const gymClass = classes.find((item) => String(item.id) === classId);
    const defaultInstructor = gymClass?.default_instructor_id;

    setValues((current) => ({
      ...current,
      classId,
      instructorId: current.instructorId === '' && defaultInstructor ? String(defaultInstructor) : current.instructorId,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.classId === '' || values.instructorId === '') {
      setMissing('Pilih kelas dan instruktur terlebih dahulu.');

      return;
    }

    setMissing(null);
    onSubmit({
      gym_class_id: Number(values.classId),
      instructor_id: Number(values.instructorId),
      schedule_date: values.date,
      start_time: values.startTime,
      end_time: values.endTime,
    });
  };

  const generalError = missing ?? (error && Object.keys(error.fieldErrors).length === 0 ? error.message : error?.fieldError('schedule'));

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent isLocked={isPending}>
        <DialogHeader>
          <DialogTitle>{schedule ? 'Ubah jadwal' : 'Tambah jadwal'}</DialogTitle>
          <DialogDescription>Jam mengikuti zona waktu gym. Kelas tidak dibatasi jumlah maksimum peserta.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          {generalError && <Alert tone="danger">{generalError}</Alert>}
          <FormField label="Kelas" error={error?.fieldError('gym_class_id')}>
            {(control) => (
              <Select value={values.classId} onValueChange={chooseClass} disabled={isPending}>
                <SelectTrigger {...control}>
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((gymClass) => (
                    <SelectItem key={gymClass.id} value={String(gymClass.id)}>
                      {gymClass.name} · min. {gymClass.min_participants} peserta
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField label="Instruktur" error={error?.fieldError('instructor_id')}>
            {(control) => (
              <Select value={values.instructorId} onValueChange={(value) => set('instructorId', value)} disabled={isPending}>
                <SelectTrigger {...control}>
                  <SelectValue placeholder="Pilih instruktur" />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.id} value={String(instructor.id)}>
                      {instructor.name}
                      {instructor.specialization ? ` · ${instructor.specialization}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField label="Tanggal" error={error?.fieldError('schedule_date')}>
            {(control) => (
              <Input
                {...control}
                type="date"
                min={todayIso()}
                value={values.date}
                onChange={(event) => set('date', event.target.value)}
                disabled={isPending}
              />
            )}
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Jam mulai" error={error?.fieldError('start_time')}>
              {(control) => (
                <Input {...control} type="time" value={values.startTime} onChange={(event) => set('startTime', event.target.value)} disabled={isPending} />
              )}
            </FormField>
            <FormField label="Jam selesai" error={error?.fieldError('end_time')}>
              {(control) => (
                <Input {...control} type="time" value={values.endTime} onChange={(event) => set('endTime', event.target.value)} disabled={isPending} />
              )}
            </FormField>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Batal
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isPending}>
              {schedule ? 'Simpan perubahan' : 'Tambah jadwal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
