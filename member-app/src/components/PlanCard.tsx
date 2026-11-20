import { useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, useTheme } from 'react-native-paper';
import type { MembershipPlan } from '../api/types';
import { planAccessibilityLabel, planDurationLabel } from '../domain/plans';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { formatRupiah } from '../lib/money';

interface PlanCardProps {
  plan: MembershipPlan;
  /** Mode pilihan (radio): kartu bisa ditekan dan menampilkan tanda centang saat terpilih. */
  selected?: boolean;
  onSelect?: () => void;
  footer?: ReactNode;
}

export function PlanCard({ plan, selected = false, onSelect, footer }: PlanCardProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useState(() => new Animated.Value(1))[0];
  const isSelectable = onSelect !== undefined;

  const animateTo = (value: number) => {
    if (!reducedMotion) {
      Animated.spring(scale, { toValue: value, useNativeDriver: Platform.OS !== 'web', speed: 40, bounciness: 4 }).start();
    }
  };

  const borderColor = selected ? theme.colors.primary : theme.colors.outlineVariant;
  const backgroundColor = selected ? theme.colors.primaryContainer : theme.colors.surface;

  const body = (
    <View style={styles.body}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="titleMedium" style={styles.name}>
            {plan.name}
          </Text>
          <View style={[styles.duration, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Icon source="calendar-range" size={14} color={theme.colors.onSecondaryContainer} />
            <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
              {planDurationLabel(plan.duration_days)}
            </Text>
          </View>
        </View>
        {isSelectable && (
          <Icon
            source={selected ? 'check-circle' : 'circle-outline'}
            size={24}
            color={selected ? theme.colors.primary : theme.colors.outline}
          />
        )}
      </View>
      <Text variant="headlineSmall" style={[styles.price, { color: theme.colors.onSurface }]}>
        {formatRupiah(plan.price)}
      </Text>
      {plan.description && (
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {plan.description}
        </Text>
      )}
      {footer}
    </View>
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Surface elevation={0} style={[styles.card, { borderColor, backgroundColor, borderWidth: selected ? 2 : 1 }]}>
        {isSelectable ? (
          <Pressable
            onPress={onSelect}
            onPressIn={() => animateTo(0.98)}
            onPressOut={() => animateTo(1)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={planAccessibilityLabel(plan)}
            style={styles.pressable}
          >
            {body}
          </Pressable>
        ) : (
          body
        )}
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressable: {
    minHeight: 48,
  },
  body: {
    gap: 8,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flexShrink: 1,
    gap: 6,
  },
  name: {
    fontWeight: '700',
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  price: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
