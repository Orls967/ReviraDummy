import { StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

export function ConfigMissingView() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} accessibilityRole="alert">
      <Icon source="cog-off-outline" size={40} color={theme.colors.error} />
      <Text variant="titleLarge">Alamat API belum diatur</Text>
      <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        Isi EXPO_PUBLIC_API_URL dengan alamat server Laravel (mis. http://192.168.1.10:8000), lalu jalankan ulang npx expo start. Lihat
        docs/SETUP.md.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  text: {
    textAlign: 'center',
    maxWidth: 420,
  },
});
