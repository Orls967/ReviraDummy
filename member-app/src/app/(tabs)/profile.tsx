import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Divider, List, Portal, Text, useTheme } from 'react-native-paper';
import { listMemberships } from '../../api/memberships';
import type { Membership } from '../../api/types';
import { useAuth } from '../../auth/useAuth';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateViews';
import { StatusChip } from '../../components/StatusChip';
import { membershipRecordMeta } from '../../domain/membershipStatus';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useReloadOnFocus } from '../../hooks/useReloadOnFocus';
import { formatPeriod } from '../../lib/dates';
import { formatRupiah } from '../../lib/money';

const PAYMENT_LABELS: Record<string, string> = {
  transfer: 'Transfer bank',
  on_the_spot: 'Bayar di tempat',
};

function MembershipHistoryItem({ membership }: { membership: Membership }) {
  const theme = useTheme();
  const transaction = membership.transaction;

  return (
    <View style={styles.historyItem}>
      <View style={styles.historyHeader}>
        <Text variant="titleSmall">{membership.plan.name}</Text>
        <StatusChip meta={membershipRecordMeta(membership.status)} />
      </View>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {membership.record_type === 'extension' ? 'Perpanjangan' : 'Pendaftaran'} · {formatPeriod(membership.start_date, membership.end_date)}
      </Text>
      {transaction && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {formatRupiah(transaction.amount)} · {PAYMENT_LABELS[transaction.payment_method] ?? transaction.payment_method}
        </Text>
      )}
      {transaction?.reject_reason && (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          Alasan ditolak: {transaction.reject_reason}
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const memberships = useApiQuery('memberships', listMemberships);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useReloadOnFocus(memberships.reload);

  if (session.status !== 'authenticated') {
    return null;
  }

  const { user } = session;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <Screen refreshing={memberships.isRefreshing} onRefresh={memberships.reload}>
      <Card mode="outlined">
        <List.Item title={user.name} description="Nama" left={(props) => <List.Icon {...props} icon="account-outline" />} />
        <Divider />
        <List.Item title={user.email} description="Email" left={(props) => <List.Icon {...props} icon="email-outline" />} />
        <Divider />
        <List.Item title={user.phone_number ?? '—'} description="Nomor telepon" left={(props) => <List.Icon {...props} icon="phone-outline" />} />
      </Card>
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          Riwayat membership
        </Text>
        {memberships.isLoading && <LoadingView label="Memuat riwayat…" />}
        {memberships.error && !memberships.data && (
          <ErrorView message={memberships.error.message} onRetry={memberships.reload} retrying={memberships.isRefreshing} />
        )}
        {memberships.data && memberships.data.length === 0 && (
          <EmptyView icon="history" title="Belum ada riwayat" description="Pengajuan membership Anda akan tercatat di sini." />
        )}
        {memberships.data && memberships.data.length > 0 && (
          <Card mode="outlined">
            {memberships.data.map((membership, index) => (
              <View key={membership.id}>
                {index > 0 && <Divider />}
                <MembershipHistoryItem membership={membership} />
              </View>
            ))}
          </Card>
        )}
      </View>
      <Button mode="outlined" icon="logout" onPress={() => setConfirmLogout(true)} contentStyle={styles.buttonContent}>
        Keluar
      </Button>
      <Portal>
        <Dialog visible={confirmLogout} onDismiss={() => !isLoggingOut && setConfirmLogout(false)}>
          <Dialog.Title>Keluar dari akun?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Anda perlu masuk kembali untuk melihat jadwal dan booking.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmLogout(false)} disabled={isLoggingOut}>
              Batal
            </Button>
            <Button onPress={() => void handleLogout()} loading={isLoggingOut} disabled={isLoggingOut}>
              Keluar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  historyItem: {
    gap: 4,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonContent: {
    minHeight: 48,
  },
});
