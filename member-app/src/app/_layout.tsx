import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../auth/AuthProvider';
import { useAuth } from '../auth/useAuth';
import { ConfigMissingView } from '../components/ConfigMissingView';
import { LoadingView } from '../components/StateViews';
import { apiBaseUrl } from '../lib/config';
import { darkTheme, lightTheme } from '../theme';

function RootNavigator() {
  const { session } = useAuth();
  const theme = useTheme();

  if (session.status === 'loading') {
    return (
      <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
        <LoadingView label="Menyiapkan aplikasi…" />
      </View>
    );
  }

  const isSignedIn = session.status === 'authenticated';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerBackTitle: 'Kembali',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="schedules/[id]" options={{ title: 'Detail Kelas' }} />
        <Stack.Screen name="plans" options={{ title: 'Paket Membership' }} />
        <Stack.Screen name="apply" options={{ title: 'Ajukan Membership' }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        {apiBaseUrl === null ? (
          <ConfigMissingView />
        ) : (
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        )}
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'center',
  },
});
