import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

export function InlineError({ message }: { message: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorContainer }]} accessibilityRole="alert">
      <Icon source="alert-circle-outline" size={18} color={theme.colors.onErrorContainer} />
      <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onErrorContainer }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    padding: 12,
  },
  text: {
    flex: 1,
  },
});
