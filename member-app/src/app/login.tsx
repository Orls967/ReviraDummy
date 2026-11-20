import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/useAuth';
import { BrandLockup } from '../components/BrandLockup';
import { InlineError } from '../components/InlineError';
import { ApiError, describeError } from '../lib/http';

export default function LoginScreen() {
  const theme = useTheme();
  const { session, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notice = session.status === 'anonymous' ? session.notice : null;
  const emailError = error?.fieldError('email');
  const passwordError = error?.fieldError('password');
  const generalError = failure ?? (error && !emailError && !passwordError ? error.message : null);

  const submit = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setFailure(null);

    try {
      await login(email.trim(), password);
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught);
      } else {
        setFailure(describeError(caught));
      }

      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <View style={styles.brand}>
              <BrandLockup />
              <Text variant="titleMedium" accessibilityRole="header">
                Masuk ke akun member
              </Text>
              <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
                Lihat jadwal kelas dan booking sesi latihan Anda.
              </Text>
            </View>
            {notice && !generalError && <InlineError message={notice} />}
            {generalError && <InlineError message={generalError} />}
            <View>
              <TextInput
                mode="outlined"
                label="Email"
                accessibilityLabel="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                error={emailError !== undefined}
                disabled={isSubmitting}
              />
              {emailError && <HelperText type="error">{emailError}</HelperText>}
            </View>
            <View>
              <TextInput
                mode="outlined"
                label="Kata sandi"
                accessibilityLabel="Kata sandi"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                error={passwordError !== undefined}
                disabled={isSubmitting}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword((value) => !value)}
                    accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  />
                }
              />
              {passwordError && <HelperText type="error">{passwordError}</HelperText>}
            </View>
            <Button
              mode="contained"
              onPress={() => void submit()}
              loading={isSubmitting}
              disabled={isSubmitting || email.trim() === '' || password === ''}
              contentStyle={styles.buttonContent}
            >
              {isSubmitting ? 'Memproses…' : 'Masuk'}
            </Button>
            <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
              Belum punya akun? Hubungi admin Revira Fitness Center untuk didaftarkan.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 16,
  },
  brand: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  center: {
    textAlign: 'center',
  },
  buttonContent: {
    minHeight: 48,
  },
  hint: {
    textAlign: 'center',
  },
});
