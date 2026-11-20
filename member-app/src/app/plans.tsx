import { useRouter } from 'expo-router';
import { Banner, Button, Text, useTheme } from 'react-native-paper';
import { listPlans } from '../api/memberships';
import { useAuth } from '../auth/useAuth';
import { FadeIn } from '../components/FadeIn';
import { PlanCard } from '../components/PlanCard';
import { Screen } from '../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { canApplyForMembership } from '../domain/membershipStatus';
import { useApiQuery } from '../hooks/useApiQuery';
import { useProfileRefreshOnFocus } from '../hooks/useProfileRefreshOnFocus';

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
      {plans.data && plans.data.length > 0 && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Semua paket termasuk akses gym dan kelas. Pembayaran dilakukan di tempat atau transfer, lalu diverifikasi admin.
        </Text>
      )}
      {plans.data?.map((plan, index) => (
        <FadeIn key={plan.id} index={index}>
          <PlanCard
            plan={plan}
            footer={
              <Button
                mode="contained"
                icon="arrow-right"
                contentStyle={{ flexDirection: 'row-reverse', minHeight: 44 }}
                disabled={!canApply}
                onPress={() => router.push({ pathname: '/apply', params: { planId: String(plan.id) } })}
                accessibilityLabel={`Pilih paket ${plan.name}`}
              >
                Pilih paket
              </Button>
            }
          />
        </FadeIn>
      ))}
    </Screen>
  );
}
