import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { MembershipSummary } from '../api/types';
import { membershipStatusMeta, normalizeMembershipStatus } from '../domain/membershipStatus';
import { daysBetween, formatPeriod, todayIso } from '../lib/dates';
import { brand } from '../theme';
import { StatusChip } from './StatusChip';

function remainingText(summary: MembershipSummary): string | null {
  const status = normalizeMembershipStatus(summary.status);

  if (status === 'active' && summary.end_date) {
    const days = daysBetween(todayIso(), summary.end_date) + 1;

    return days === 1 ? 'Hari terakhir masa aktif' : `Sisa ${days} hari`;
  }

  if (status === 'upcoming' && summary.start_date) {
    return `Mulai aktif dalam ${daysBetween(todayIso(), summary.start_date)} hari`;
  }

  return null;
}

const DESCRIPTIONS: Record<string, string> = {
  pending: 'Pengajuan Anda sedang menunggu verifikasi admin.',
  expired: 'Masa aktif sudah berakhir. Ajukan perpanjangan untuk booking kelas lagi.',
  none: 'Ajukan membership untuk mulai booking kelas.',
};

/**
 * Kartu utama beranda bergaya brand: latar hitam, nama paket emas, aksen teal.
 */
export function MembershipCard({ summary }: { summary: MembershipSummary | null }) {
  const status = normalizeMembershipStatus(summary?.status);
  const remaining = summary ? remainingText(summary) : null;

  return (
    <Card mode="contained" style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={styles.eyebrow}>
            MEMBERSHIP
          </Text>
          <StatusChip meta={membershipStatusMeta(status)} onDark />
        </View>
        <Text variant="headlineSmall" style={styles.plan}>
          {summary?.plan?.name ?? 'Belum ada paket'}
        </Text>
        {summary?.start_date && (
          <Text variant="bodyMedium" style={styles.body}>
            {formatPeriod(summary.start_date, summary.end_date)}
          </Text>
        )}
        {remaining && (
          <Text variant="titleSmall" style={styles.highlight}>
            {remaining}
          </Text>
        )}
        {DESCRIPTIONS[status] && (
          <Text variant="bodyMedium" style={styles.body}>
            {DESCRIPTIONS[status]}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.black,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2B2B28',
  },
  content: {
    gap: 6,
    paddingVertical: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  eyebrow: {
    color: brand.teal,
    letterSpacing: 2,
  },
  plan: {
    color: brand.gold,
    fontWeight: '800',
  },
  body: {
    color: '#E7E5DE',
  },
  highlight: {
    color: '#FFFFFF',
  },
});
