import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text, useTheme } from 'react-native-paper';
import type { ClassSchedule } from '../api/types';
import { scheduleStatusMeta } from '../domain/scheduleStatus';
import { formatDate } from '../lib/dates';
import { ParticipantCounter } from './ParticipantCounter';
import { StatusChip } from './StatusChip';

interface ScheduleCardProps {
  schedule: ClassSchedule;
  showDate?: boolean;
  onPress: () => void;
}

export function ScheduleCard({ schedule, showDate = false, onPress }: ScheduleCardProps) {
  const theme = useTheme();
  const status = scheduleStatusMeta(schedule.display_status);
  const when = `${showDate ? `${formatDate(schedule.schedule_date)}, ` : ''}${schedule.start_time}–${schedule.end_time}`;

  return (
    <Card
      mode="outlined"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${schedule.class.name}, ${when}, ${status.label}${schedule.is_booked ? ', sudah dibooking' : ''}`}
      accessibilityHint="Buka detail sesi"
    >
      <Card.Content style={styles.content}>
        <View style={styles.row}>
          <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
            {when}
          </Text>
          <StatusChip meta={status} />
        </View>
        <View style={styles.titleBlock}>
          <Text variant="titleMedium">{schedule.class.name}</Text>
          <View style={styles.instructor}>
            <Icon source="account-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {schedule.instructor.name}
            </Text>
          </View>
        </View>
        <ParticipantCounter count={schedule.participants_count} minimum={schedule.min_participants} />
        {schedule.is_booked && (
          <View style={styles.booked}>
            <Icon source="check-circle" size={18} color={theme.colors.primary} />
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
              Anda sudah booking
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleBlock: {
    gap: 2,
  },
  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  booked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
