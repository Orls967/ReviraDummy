import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { FadeIn } from './FadeIn';

interface ScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
}

/**
 * Kerangka layar: konten bisa digulir dengan tarik-untuk-muat-ulang, lebar dibatasi agar tetap
 * nyaman di tablet dan web, dan footer opsional untuk tombol aksi utama.
 */
export function Screen({ children, refreshing = false, onRefresh, footer }: ScreenProps) {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} /> : undefined
        }
      >
        <FadeIn style={styles.inner}>{children}</FadeIn>
      </ScrollView>
      {footer && (
        <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.inner}>{footer}</View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inner: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
