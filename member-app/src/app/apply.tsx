import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Icon, RadioButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { applyMembership, listPlans } from '../api/memberships';
import type { Membership, MembershipPlan, PaymentMethod } from '../api/types';
import { useAuth } from '../auth/useAuth';
import { DateStrip } from '../components/DateStrip';
import { InlineError } from '../components/InlineError';
import { Screen } from '../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../components/StateViews';
import { suggestedStartDate } from '../domain/membershipStatus';
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
      <View style={styles.success}>
        <Icon source="check-decagram" size={56} color={theme.colors.primary} />
        <Text variant="headlineSmall" style={styles.center} accessibilityRole="header">
          Pengajuan terkirim
        </Text>
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
          {membership.plan.name}, rencana mulai {formatLongDate(membership.start_date)}. Admin akan memverifikasi pembayaran Anda; status
          membership di beranda berubah setelah disetujui.
        </Text>
        <Button mode="contained" onPress={onDone} contentStyle={styles.buttonContent}>
          Kembali ke beranda
        </Button>
      </View>
    </Screen>
  );
}

function PlanOption({ plan }: { plan: MembershipPlan }) {
  return (
    <RadioButton.Item
      value={String(plan.id)}
      label={`${plan.name} · ${plan.duration_days} hari · ${formatRupiah(plan.price)}`}
      labelVariant="bodyLarge"
      accessibilityLabel={`${plan.name}, ${plan.duration_days} hari, ${formatRupiah(plan.price)}`}
    />
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
      Kirim pengajuan
    </Button>
  );

  return (
    <Screen footer={footer}>
      {submit.error && <InlineError message={applicationError(submit.error)} />}
      <View style={styles.section}>
        <Text variant="titleMedium" accessibilityRole="header">
          1. Pilih paket
        </Text>
        <Card mode="outlined">
          <RadioButton.Group value={planId} onValueChange={setPlanId}>
            {plans.data.map((plan) => (
              <PlanOption key={plan.id} plan={plan} />
            ))}
          </RadioButton.Group>
        </Card>
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
        <Card mode="contained" style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Card.Content style={styles.summary}>
            <Text variant="titleSmall">Ringkasan</Text>
            <Text variant="bodyMedium">{selectedPlan.name}</Text>
            <Text variant="bodyMedium">Perkiraan periode: {formatPeriod(startDate, estimatedEnd)}</Text>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              {formatRupiah(selectedPlan.price)}
            </Text>
          </Card.Content>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  summary: {
    gap: 4,
    paddingVertical: 14,
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
