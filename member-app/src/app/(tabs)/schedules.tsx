import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import { listSchedules } from '../../api/schedules';
import type { ClassSchedule } from '../../api/types';
import { useAuth } from '../../auth/useAuth';
import { DateStrip } from '../../components/DateStrip';
import { ScheduleCard } from '../../components/ScheduleCard';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateViews';
import { normalizeMembershipStatus } from '../../domain/membershipStatus';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useProfileRefreshOnFocus } from '../../hooks/useProfileRefreshOnFocus';
import { useReloadOnFocus } from '../../hooks/useReloadOnFocus';
import { addDays, formatLongDate, todayIso } from '../../lib/dates';

const DAYS = 7;

function countByDate(schedules: readonly ClassSchedule[]): Record<string, number> {
  return schedules.reduce<Record<string, number>>((counts, schedule) => {
    counts[schedule.schedule_date] = (counts[schedule.schedule_date] ?? 0) + 1;

    return counts;
  }, {});
}

export default function SchedulesScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [from] = useState(todayIso);
  const [selected, setSelected] = useState(from);
  const to = addDays(from, DAYS - 1);
  const dates = useMemo(() => Array.from({ length: DAYS }, (_, index) => addDays(from, index)), [from]);
  const schedules = useApiQuery(`schedules:${from}`, (context) => listSchedules(context, { from, to }));

  useReloadOnFocus(schedules.reload);
  useProfileRefreshOnFocus();

  const counts = useMemo(() => countByDate(schedules.data ?? []), [schedules.data]);
  const daySchedules = (schedules.data ?? []).filter((schedule) => schedule.schedule_date === selected);
  const membershipStatus = normalizeMembershipStatus(session.status === 'authenticated' ? session.user.membership?.status : null);
  const membershipInactive = membershipStatus !== 'active' && membershipStatus !== 'upcoming';

  return (
    <Screen refreshing={schedules.isRefreshing} onRefresh={schedules.reload}>
      <Banner
        visible={membershipInactive}
        icon="information-outline"
        actions={[{ label: 'Lihat paket', onPress: () => router.push('/plans') }]}
      >
        Jadwal bisa dilihat, tetapi booking membutuhkan membership aktif pada tanggal sesi.
      </Banner>
      <DateStrip dates={dates} selected={selected} onSelect={setSelected} counts={counts} />
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          {formatLongDate(selected)}
        </Text>
        {schedules.isLoading && <LoadingView label="Memuat jadwal…" />}
        {schedules.error && !schedules.data && (
          <ErrorView message={schedules.error.message} onRetry={schedules.reload} retrying={schedules.isRefreshing} />
        )}
        {schedules.data && daySchedules.length === 0 && (
          <EmptyView icon="calendar-blank-outline" title="Tidak ada kelas" description="Belum ada sesi kelas pada tanggal ini. Coba pilih tanggal lain." />
        )}
        {daySchedules.map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} onPress={() => router.push(`/schedules/${schedule.id}`)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
});
