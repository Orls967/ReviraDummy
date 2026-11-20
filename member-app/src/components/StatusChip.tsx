import { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { StatusMeta } from '../domain/tone';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { toneColors } from '../theme';

interface StatusChipProps {
  meta: StatusMeta;
  /** Paksa warna untuk latar gelap, mis. di kartu membership hitam pada tema terang. */
  onDark?: boolean;
}

/** Chip status; saat label berubah (mis. booking berhasil) chip "berdenyut" sekali agar perubahan terlihat. */
export function StatusChip({ meta, onDark = false }: StatusChipProps) {
  const theme = useTheme();
  const colors = toneColors(meta.tone, onDark || theme.dark);
  const reducedMotion = useReducedMotion();
  const scale = useState(() => new Animated.Value(1))[0];
  const previousLabel = useRef(meta.label);

  useEffect(() => {
    if (previousLabel.current === meta.label) {
      return;
    }

    previousLabel.current = meta.label;

    if (reducedMotion) {
      return;
    }

    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 14, bounciness: 10 }).start();
  }, [meta.label, reducedMotion, scale]);

  return (
    <Animated.View
      style={[styles.chip, { backgroundColor: colors.background, transform: [{ scale }] }]}
      accessibilityLabel={`Status: ${meta.label}`}
    >
      <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
      <Text variant="labelMedium" style={{ color: colors.foreground }}>
        {meta.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
