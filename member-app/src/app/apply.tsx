import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { applyMembership, listPlans } from '../api/memberships';
import type { Membership, PaymentMethod } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { DateStrip } from '../components/DateStrip';
import { FadeIn } from '../components/FadeIn';
import { InlineError } from '../components/InlineError';
import { PlanCard } from '../components/PlanCard';
import { Screen } from '../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { suggestedStartDate } from '../domain/membershipStatus';
import { planDurationLabel } from '../domain/plans';
import { useApiQuery } from '../hooks/useApiQuery';
import { useMutation } from '../hooks/useMutation';
import { addDays, formatLongDate, formatPeriod, todayIso } from '../lib/dates';
import type { ApiError } from '../lib/http';
import { formatRupiah } from '../lib/money';

const START_DATE_CHOICES = 14;

const PAYMENT_HINTS: Record<PaymentMethod, string> = {
  on_the_spot: 'Bayar langsung di meja resepsionis. Admin mengaktifkan membership setelah pembayaran diterima.',
  transfer: 'Transfer ke rekening gym, lalu tunjukkan bukti transfer ke admin untuk verifikasi.',
};

function applicationError(error: ApiError): string {
  return (
    error.fieldError('membership') ??
    error.fieldError('start_date') ??
    error.fieldError('membership_plan_id') ??
    error.fieldError('payment_method') ??
    error.message
  );
}

function SubmittedView({ membership, onDone }: { membership: Membership; onDone: () => void }) {
  const theme = useTheme();

  return (
    <Screen>
      <View style={styles.success} accessibilityLiveRegion="polite">
        <FadeIn>
          <Icon source="check-decagram" size={64} color={theme.colors.primary} />
        </FadeIn>
        <Text variant="headlineSmall" style={styles.center} accessibilityRole="header">
          Pengajuan terkirim
        </Text>
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
          {membership.plan.name} ({formatRupiah(membership.transaction?.amount ?? membership.plan.price)}), rencana mulai{' '}
          {formatLongDate(membership.start_date)}. Admin akan memverifikasi pembayaran Anda; status membership di beranda berubah setelah
          disetujui.
        </Text>
        <Button mode="contained" onPress={onDone} contentStyle={styles.buttonContent}>
          Kembali ke beranda
        </Button>
      </View>
    </Screen>
  );
}

export default function ApplyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();
  const { session, refreshProfile } = useAuth();
  const plans = useApiQuery('plans', listPlans);
  const submit = useMutation((context, application: Parameters<typeof applyMembership>[1]) => applyMembership(context, application));

  const membership = session.status === 'authenticated' ? session.user.membership : null;
  const membershipStatus = membership?.status ?? null;
  const membershipEnd = membership?.end_date ?? null;
  const firstStart = useMemo(() => suggestedStartDate(membershipStatus, membershipEnd, todayIso()), [membershipStatus, membershipEnd]);
  const dates = useMemo(() => Array.from({ length: START_DATE_CHOICES }, (_, index) => addDays(firstStart, index)), [firstStart]);

  const [planId, setPlanId] = useState(params.planId ?? '');
  const [startDate, setStartDate] = useState(firstStart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('on_the_spot');
  const [submitted, setSubmitted] = useState<Membership | null>(null);

  if (submitted) {
    return <SubmittedView membership={submitted} onDone={() => router.dismissTo('/')} />;
  }

  if (plans.isLoading) {
    return <LoadingView label="Memuat paket…" />;
  }

  if (plans.data === null) {
    return <ErrorView message={plans.error?.message ?? 'Paket gagal dimuat.'} onRetry={plans.reload} retrying={plans.isRefreshing} />;
  }

  if (plans.data.length === 0) {
    return <EmptyView icon="package-variant" title="Belum ada paket" description="Paket membership belum tersedia. Silakan hubungi admin gym." />;
  }

  const selectedPlan = plans.data.find((plan) => String(plan.id) === planId) ?? null;
  const estimatedEnd = selectedPlan ? addDays(startDate, selectedPlan.duration_days - 1) : null;

  const handleSubmit = async () => {
    if (selectedPlan === null) {
      return;
    }

    const outcome = await submit.run({ membership_plan_id: selectedPlan.id, start_date: startDate, payment_method: paymentMethod });

    if (outcome.status === 'success') {
      await refreshProfile();
      setSubmitted(outcome.data);
    }
  };

  const footer = (
    <Button
      mode="contained"
      icon="send"
      onPress={() => void handleSubmit()}
      loading={submit.isPending}
      disabled={submit.isPending || selectedPlan === null}
      contentStyle={styles.buttonContent}
    >
      {selectedPlan ? `Kirim pengajuan · ${formatRupiah(selectedPlan.price)}` : 'Pilih paket terlebih dahulu'}
    </Button>
  );

  return (
    <Screen footer={footer}>
      {submit.error && <InlineError message={applicationError(submit.error)} />}
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          1. Pilih paket
        </Text>
        <View accessibilityRole="radiogroup" accessibilityLabel="Paket membership" style={styles.planList}>
          {plans.data.map((plan, index) => (
            <FadeIn key={plan.id} index={index}>
              <PlanCard plan={plan} selected={String(plan.id) === planId} onSelect={() => setPlanId(String(plan.id))} />
            </FadeIn>
          ))}
        </View>
      </View>
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          2. Tanggal mulai
        </Text>
        <DateStrip dates={dates} selected={startDate} onSelect={setStartDate} />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Bila disetujui setelah tanggal ini, masa aktif dimulai pada hari persetujuan.
        </Text>
      </View>
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          3. Metode pembayaran
        </Text>
        <SegmentedButtons
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value === 'transfer' ? 'transfer' : 'on_the_spot')}
          buttons={[
            { value: 'on_the_spot', label: 'Di tempat', icon: 'cash' },
            { value: 'transfer', label: 'Transfer', icon: 'bank-transfer' },
          ]}
        />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {PAYMENT_HINTS[paymentMethod]}
        </Text>
      </View>
      {selectedPlan && estimatedEnd && (
        <FadeIn key={`${selectedPlan.id}:${startDate}:${paymentMethod}`}>
          <Card mode="contained" style={{ backgroundColor: theme.colors.surfaceVariant }} accessibilityLiveRegion="polite">
            <Card.Content style={styles.summary}>
              <Text variant="titleSmall">Ringkasan pengajuan</Text>
              <SummaryRow label="Paket" value={`${selectedPlan.name} · ${planDurationLabel(selectedPlan.duration_days)}`} />
              <SummaryRow label="Perkiraan periode" value={formatPeriod(startDate, estimatedEnd)} />
              <SummaryRow label="Pembayaran" value={paymentMethod === 'transfer' ? 'Transfer bank' : 'Bayar di tempat'} />
              <View style={[styles.totalRow, { borderTopColor: theme.colors.outlineVariant }]}>
                <Text variant="titleSmall">Total bayar</Text>
                <Text variant="titleLarge" style={styles.total}>
                  {formatRupiah(selectedPlan.price)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        </FadeIn>
      )}
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.summaryRow}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.summaryValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  planList: {
    gap: 10,
  },
  summary: {
    gap: 8,
    paddingVertical: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryValue: {
    flexShrink: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 2,
  },
  total: {
    fontWeight: '800',
  },
  success: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 32,
  },
  center: {
    textAlign: 'center',
  },
  buttonContent: {
    minHeight: 48,
  },
});
