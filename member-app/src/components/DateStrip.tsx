import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { formatDayChip, formatLongDate } from '../lib/dates';

interface DateStripProps {
  dates: readonly string[];
  selected: string;
  onSelect: (date: string) => void;
  counts?: Readonly<Record<string, number>>;
}

export function DateStrip({ dates, selected, onSelect, counts }: DateStripProps) {
  const theme = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container} accessibilityRole="tablist">
      {dates.map((date) => {
        const chip = formatDayChip(date);
        const isSelected = date === selected;
        const count = counts?.[date] ?? 0;
        const foreground = isSelected ? theme.colors.onPrimary : theme.colors.onSurface;

        return (
          <Pressable
            key={date}
            onPress={() => onSelect(date)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${formatLongDate(date)}, ${count} sesi`}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                borderColor: isSelected ? theme.colors.primary : theme.colors.outlineVariant,
              },
            ]}
          >
            <Text variant="labelSmall" style={{ color: foreground }}>
              {chip.weekday}
            </Text>
            <Text variant="titleMedium" style={{ color: foreground }}>
              {chip.day}
            </Text>
            <Text variant="labelSmall" style={{ color: foreground }}>
              {count > 0 ? `${count} sesi` : chip.month}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minWidth: 64,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
