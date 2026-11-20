import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, Icon, Portal, Snackbar, Text, useTheme } from 'react-native-paper';
import { listMemberships } from '../../api/memberships';
import { bookSchedule, cancelBooking, getSchedule } from '../../api/schedules';
import { InlineError } from '../../components/InlineError';
import { ParticipantCounter } from '../../components/ParticipantCounter';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { StatusChip } from '../../components/StatusChip';
import { bookingAvailability } from '../../domain/booking';
import { scheduleStatusMeta } from '../../domain/scheduleStatus';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useMutation } from '../../hooks/useMutation';
import { formatLongDate } from '../../lib/dates';
import type { ApiError } from '../../lib/http';

function bookingErrorMessage(error: ApiError): string {
  return error.fieldError('booking') ?? error.message;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.detailRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Icon source={icon} size={20} color={theme.colors.onSurfaceVariant} />
      <View style={styles.detailText}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="bodyLarge">{value}</Text>
      </View>
    </View>
  );
}

export default function ScheduleDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const scheduleId = Number(params.id);
  const isValidId = Number.isInteger(scheduleId) && scheduleId > 0;

  const schedule = useApiQuery(`schedule:${scheduleId}`, (context) => getSchedule(context, scheduleId));
  const memberships = useApiQuery('memberships', listMemberships);
  const book = useMutation((context, id: number) => bookSchedule(context, id));
  const cancel = useMutation((context, id: number) => cancelBooking(context, id));
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  if (!isValidId) {
    return <ErrorView message="Sesi kelas tidak ditemukan." onRetry={schedule.reload} />;
  }

  if (schedule.isLoading) {
    return <LoadingView label="Memuat detail kelas…" />;
  }

  if (schedule.data === null) {
    return <ErrorView message={schedule.error?.message ?? 'Sesi kelas tidak ditemukan.'} onRetry={schedule.reload} retrying={schedule.isRefreshing} />;
  }

  const data = schedule.data;
  const membershipsKnown = memberships.data !== null || memberships.error !== null;
  const availability = bookingAvailability(data, memberships.data, new Date());
  const isSubmitting = book.isPending || cancel.isPending;
  const actionError = book.error ?? cancel.error;

  const handleBook = async () => {
    cancel.reset();
    const outcome = await book.run(data.id);

    if (outcome.status === 'success') {
      schedule.setData(outcome.data);
      setSnackbar('Booking berhasil. Sampai jumpa di kelas!');
    } else if (outcome.status === 'error') {
      schedule.reload();
    }
  };

  const handleCancel = async () => {
    book.reset();
    const outcome = await cancel.run(data.id);
    setConfirmCancel(false);

    if (outcome.status === 'success') {
      schedule.setData(outcome.data);
      setSnackbar('Booking dibatalkan.');
    } else if (outcome.status === 'error') {
      schedule.reload();
    }
  };

  const footer = (
    <View style={styles.footer}>
      {availability.action === 'book' && (
        <Button
          mode="contained"
          icon="check"
          onPress={() => void handleBook()}
          loading={book.isPending}
          disabled={isSubmitting || !membershipsKnown}
          contentStyle={styles.buttonContent}
        >
          {membershipsKnown ? 'Booking kelas ini' : 'Memeriksa membership…'}
        </Button>
      )}
      {availability.action === 'cancel' && (
        <>
          <View style={styles.bookedRow}>
            <Icon source="check-circle" size={20} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
              Anda sudah booking kelas ini
            </Text>
          </View>
          <Button
            mode="outlined"
            icon="close"
            onPress={() => setConfirmCancel(true)}
            loading={cancel.isPending}
            disabled={isSubmitting || !availability.enabled}
            contentStyle={styles.buttonContent}
          >
            Batalkan booking
          </Button>
        </>
      )}
      {availability.action !== 'book' && availability.reason && (
        <Text variant="bodyMedium" style={[styles.reason, { color: theme.colors.onSurfaceVariant }]}>
          {availability.reason}
        </Text>
      )}
    </View>
  );

  return (
    <>
      <Screen refreshing={schedule.isRefreshing} onRefresh={schedule.reload} footer={footer}>
        <View style={styles.header}>
          <StatusChip meta={scheduleStatusMeta(data.display_status)} />
          <Text variant="headlineSmall" accessibilityRole="header">
            {data.class.name}
          </Text>
          {data.class.description && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {data.class.description}
            </Text>
          )}
        </View>
        {data.cancel_reason && <InlineError message={`Sesi dibatalkan: ${data.cancel_reason}`} />}
        {actionError && <InlineError message={bookingErrorMessage(actionError)} />}
        <Card mode="outlined">
          <Card.Content style={styles.card}>
            <DetailRow icon="calendar-outline" label="Tanggal" value={formatLongDate(data.schedule_date)} />
            <Divider />
            <DetailRow icon="clock-outline" label="Waktu" value={`${data.start_time}–${data.end_time}`} />
            <Divider />
            <DetailRow icon="account-outline" label="Instruktur" value={data.instructor.name} />
          </Card.Content>
        </Card>
        <Card mode="outlined">
          <Card.Content style={styles.card}>
            <Text variant="titleSmall">Peserta</Text>
            <ParticipantCounter count={data.participants_count} minimum={data.min_participants} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Kelas berjalan bila minimum peserta terpenuhi. Tidak ada batas maksimum peserta.
            </Text>
          </Card.Content>
        </Card>
      </Screen>
      <Portal>
        <Dialog visible={confirmCancel} onDismiss={() => !cancel.isPending && setConfirmCancel(false)}>
          <Dialog.Title>Batalkan booking?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Booking {data.class.name} pada {formatLongDate(data.schedule_date)} pukul {data.start_time} akan dibatalkan. Anda bisa booking lagi selama
              sesi belum dimulai.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmCancel(false)} disabled={cancel.isPending}>
              Kembali
            </Button>
            <Button onPress={() => void handleCancel()} loading={cancel.isPending} disabled={cancel.isPending} textColor={theme.colors.error}>
              Batalkan booking
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Snackbar visible={snackbar !== null} onDismiss={() => setSnackbar(null)} duration={3000} wrapperStyle={styles.snackbar}>
          {snackbar ?? ''}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  card: {
    gap: 12,
    paddingVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  footer: {
    gap: 8,
  },
  bookedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reason: {
    textAlign: 'center',
  },
  buttonContent: {
    minHeight: 48,
  },
  snackbar: {
    bottom: 128,
  },
});
