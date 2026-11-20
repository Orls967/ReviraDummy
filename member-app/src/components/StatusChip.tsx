import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { StatusMeta } from '../domain/tone';
import { toneColors } from '../theme';

interface StatusChipProps {
  meta: StatusMeta;
  /** Paksa warna untuk latar gelap, mis. di kartu membership hitam pada tema terang. */
  onDark?: boolean;
}

export function StatusChip({ meta, onDark = false }: StatusChipProps) {
  const theme = useTheme();
  const colors = toneColors(meta.tone, onDark || theme.dark);

  return (
    <View style={[styles.chip, { backgroundColor: colors.background }]} accessibilityLabel={`Status: ${meta.label}`}>
      <View style={[styles.dot, { backgroundColor: colors.foreground }]} />
      <Text variant="labelMedium" style={{ color: colors.foreground }}>
        {meta.label}
      </Text>
    </View>
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
