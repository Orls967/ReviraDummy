import { useRouter } from 'expo-router';
import { listBookings } from '../../api/schedules';
import { ScheduleCard } from '../../components/ScheduleCard';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateViews';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useReloadOnFocus } from '../../hooks/useReloadOnFocus';

export default function BookingsScreen() {
  const router = useRouter();
  const bookings = useApiQuery('bookings', listBookings);

  useReloadOnFocus(bookings.reload);

  return (
    <Screen refreshing={bookings.isRefreshing} onRefresh={bookings.reload}>
      {bookings.isLoading && <LoadingView label="Memuat booking…" />}
      {bookings.error && !bookings.data && <ErrorView message={bookings.error.message} onRetry={bookings.reload} retrying={bookings.isRefreshing} />}
      {bookings.data && bookings.data.length === 0 && (
        <EmptyView
          icon="ticket-outline"
          title="Belum ada booking"
          description="Kelas yang Anda booking dan belum selesai akan muncul di sini."
          actionLabel="Lihat jadwal kelas"
          onAction={() => router.navigate('/schedules')}
        />
      )}
      {bookings.data?.map((schedule) => (
        <ScheduleCard key={schedule.id} schedule={schedule} showDate onPress={() => router.push(`/schedules/${schedule.id}`)} />
      ))}
    </Screen>
  );
}
