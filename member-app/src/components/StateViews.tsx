import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text, useTheme } from 'react-native-paper';
import { FadeIn } from './FadeIn';

type IconName = ComponentProps<typeof Icon>['source'];

export function LoadingView({ label = 'Memuat…' }: { label?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator />
      <Text variant="bodyMedium">{label}</Text>
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function ErrorView({ message, onRetry, retrying = false }: ErrorViewProps) {
  const theme = useTheme();

  return (
    <FadeIn>
      <View style={styles.container} accessibilityRole="alert">
        <Icon source="wifi-alert" size={36} color={theme.colors.error} />
        <Text variant="titleMedium">Data gagal dimuat</Text>
        <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
          {message}
        </Text>
        <Button mode="outlined" icon="refresh" onPress={onRetry} loading={retrying} disabled={retrying}>
          Coba lagi
        </Button>
      </View>
    </FadeIn>
  );
}

interface EmptyViewProps {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({ icon, title, description, actionLabel, onAction }: EmptyViewProps) {
  const theme = useTheme();

  return (
    <FadeIn style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Icon source={icon} size={32} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleMedium" style={styles.center}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button mode="contained-tonal" onPress={onAction}>
          {actionLabel}
        </Button>
      )}
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  center: {
    textAlign: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
