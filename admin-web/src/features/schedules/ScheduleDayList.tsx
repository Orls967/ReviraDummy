import type { ClassSchedule } from '../../api/types';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatLongDate, todayIso } from '../../lib/format';
import { ScheduleRow, type ScheduleAction } from './ScheduleRow';

interface ScheduleDayListProps {
  schedules: ClassSchedule[];
  onAction: (action: ScheduleAction, schedule: ClassSchedule) => void;
}

function groupByDate(schedules: ClassSchedule[]): [string, ClassSchedule[]][] {
  const groups = new Map<string, ClassSchedule[]>();

  for (const schedule of schedules) {
    const group = groups.get(schedule.schedule_date) ?? [];
    group.push(schedule);
    groups.set(schedule.schedule_date, group);
  }

  return [...groups.entries()];
}

export function ScheduleDayList({ schedules, onAction }: ScheduleDayListProps) {
  const today = todayIso();

  return (
    <div className="grid gap-4">
      {groupByDate(schedules).map(([date, items]) => (
        <Card key={date} aria-labelledby={`day-${date}`}>
          <CardHeader className="flex-row items-center justify-between py-3">
            <CardTitle id={`day-${date}`} className="text-sm">
              {formatLongDate(date)}
              {date === today && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Hari ini</span>}
            </CardTitle>
            <span className="text-xs text-muted-foreground">{items.length} sesi</span>
          </CardHeader>
          <ul className="divide-y">
            {items.map((schedule) => (
              <ScheduleRow key={schedule.id} schedule={schedule} onAction={onAction} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
