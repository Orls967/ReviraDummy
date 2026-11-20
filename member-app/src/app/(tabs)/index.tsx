import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { listBookings } from '../../api/schedules';
import { useAuth } from '../../auth/useAuth';
import { MembershipCard } from '../../components/MembershipCard';
import { ScheduleCard } from '../../components/ScheduleCard';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { canApplyForMembership, normalizeMembershipStatus } from '../../domain/membershipStatus';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useReloadOnFocus } from '../../hooks/useReloadOnFocus';

const PREVIEW_COUNT = 2;

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session, refreshProfile } = useAuth();
  const bookings = useApiQuery('bookings', listBookings);
  const { reload: reloadBookings } = bookings;

  const refresh = useCallback(() => {
    void refreshProfile();
    reloadBookings();
  }, [refreshProfile, reloadBookings]);

  useReloadOnFocus(refresh);

  if (session.status !== 'authenticated') {
    return null;
  }

  const { user } = session;
  const status = normalizeMembershipStatus(user.membership?.status);
  const hasPendingApplication = user.membership?.has_pending_application ?? false;
  const canBook = status === 'active' || status === 'upcoming';
  const firstName = user.name.split(' ')[0] ?? user.name;

  return (
    <Screen refreshing={bookings.isRefreshing} onRefresh={refresh}>
      <View style={styles.greeting}>
        <Text variant="headlineSmall" accessibilityRole="header">
          Halo, {firstName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Siap latihan hari ini?
        </Text>
      </View>
      <MembershipCard summary={user.membership} />
      <View style={styles.actions}>
        {canBook && (
          <Button mode="contained" icon="calendar-search" onPress={() => router.navigate('/schedules')} contentStyle={styles.buttonContent}>
            Lihat jadwal kelas
          </Button>
        )}
        {canApplyForMembership(status, hasPendingApplication) ? (
          <Button
            mode={canBook ? 'outlined' : 'contained'}
            icon="card-account-details-outline"
            onPress={() => router.push('/plans')}
            contentStyle={styles.buttonContent}
          >
            {status === 'none' ? 'Pilih paket & ajukan membership' : 'Perpanjang membership'}
          </Button>
        ) : (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {status === 'pending'
              ? 'Tarik layar ke bawah untuk memperbarui status pengajuan.'
              : 'Pengajuan perpanjangan Anda sedang menunggu verifikasi admin.'}
          </Text>
        )}
      </View>
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          Booking terdekat
        </Text>
        {bookings.isLoading && <LoadingView label="Memuat booking…" />}
        {bookings.error && !bookings.data && <ErrorView message={bookings.error.message} onRetry={bookings.reload} retrying={bookings.isRefreshing} />}
        {bookings.data && bookings.data.length === 0 && (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Belum ada kelas yang Anda booking.
          </Text>
        )}
        {bookings.data?.slice(0, PREVIEW_COUNT).map((schedule) => (
          <ScheduleCard key={schedule.id} schedule={schedule} showDate onPress={() => router.push(`/schedules/${schedule.id}`)} />
        ))}
        {bookings.data && bookings.data.length > PREVIEW_COUNT && (
          <Button mode="text" onPress={() => router.navigate('/bookings')}>
            Lihat semua booking ({bookings.data.length})
          </Button>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    gap: 2,
  },
  actions: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
});
