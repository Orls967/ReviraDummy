import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Banner, Button, Card, Text, useTheme } from 'react-native-paper';
import { listPlans } from '../api/memberships';
import { useAuth } from '../auth/useAuth';
import { Screen } from '../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { canApplyForMembership } from '../domain/membershipStatus';
import { useApiQuery } from '../hooks/useApiQuery';
import { useProfileRefreshOnFocus } from '../hooks/useProfileRefreshOnFocus';
import { formatRupiah } from '../lib/money';

export default function PlansScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const plans = useApiQuery('plans', listPlans);
  useProfileRefreshOnFocus();
  const membership = session.status === 'authenticated' ? session.user.membership : null;
  const canApply = canApplyForMembership(membership?.status, membership?.has_pending_application ?? false);

  return (
    <Screen refreshing={plans.isRefreshing} onRefresh={plans.reload}>
      <Banner visible={!canApply} icon="timer-sand">
        Anda masih punya pengajuan yang menunggu verifikasi admin. Paket baru bisa dipilih setelah pengajuan itu diproses.
      </Banner>
      {plans.isLoading && <LoadingView label="Memuat paket…" />}
      {plans.error && !plans.data && <ErrorView message={plans.error.message} onRetry={plans.reload} retrying={plans.isRefreshing} />}
      {plans.data && plans.data.length === 0 && (
        <EmptyView icon="package-variant" title="Belum ada paket" description="Paket membership belum tersedia. Silakan hubungi admin gym." />
      )}
      {plans.data?.map((plan) => (
        <Card key={plan.id} mode="outlined">
          <Card.Content style={styles.content}>
            <View style={styles.header}>
              <Text variant="titleLarge">{plan.name}</Text>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                {plan.duration_days} hari
              </Text>
            </View>
            <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
              {formatRupiah(plan.price)}
            </Text>
            {plan.description && (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {plan.description}
              </Text>
            )}
          </Card.Content>
          <Card.Actions>
            <Button
              mode="contained"
              disabled={!canApply}
              onPress={() => router.push({ pathname: '/apply', params: { planId: String(plan.id) } })}
              accessibilityLabel={`Pilih paket ${plan.name}`}
            >
              Pilih paket
            </Button>
          </Card.Actions>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 6,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
});
