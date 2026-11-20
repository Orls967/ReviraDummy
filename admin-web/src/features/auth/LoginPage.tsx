import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../auth/useAuth';
import { BrandMark } from '../../components/brand/BrandMark';
import { BrandWordmark } from '../../components/brand/BrandWordmark';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { ApiError, describeError } from '../../lib/http';

function redirectTarget(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string') {
    return state.from;
  }

  return '/members';
}

export function LoginPage() {
  const { session, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session.status === 'loading') {
    return <LoadingState label="Memeriksa sesi…" fullScreen />;
  }

  if (session.status === 'authenticated') {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

  const generalMessage = failure ?? (error && Object.keys(error.fieldErrors).length === 0 ? error.message : null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="grid w-full max-w-sm gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandMark size="lg" />
          <BrandWordmark tone="black" className="text-2xl" />
          <div className="grid gap-1">
            <h1 className="text-xl font-semibold tracking-tight">Masuk Panel Admin</h1>
            <p className="text-sm text-muted-foreground">Kelola member, transaksi, dan jadwal kelas.</p>
          </div>
        </div>
        <Card>
          <CardContent className="grid gap-5 p-6">
            {session.notice && !generalMessage && <Alert tone="info">{session.notice}</Alert>}
            {generalMessage && <Alert tone="danger">{generalMessage}</Alert>}
            <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)} noValidate>
              <FormField label="Email" error={error?.fieldError('email')}>
                {(control) => (
                  <Input
                    {...control}
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                  />
                )}
              </FormField>
              <FormField label="Kata sandi" error={error?.fieldError('password')}>
                {(control) => (
                  <Input
                    {...control}
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                  />
                )}
              </FormField>
              <Button type="submit" className="mt-1 w-full" isLoading={isSubmitting}>
                {isSubmitting ? 'Memproses…' : 'Masuk'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
