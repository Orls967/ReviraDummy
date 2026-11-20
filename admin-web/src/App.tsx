import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAdmin } from './auth/RequireAdmin';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoadingState } from './components/ui/LoadingState';
import { Toaster } from './components/ui/Toaster';
import { LoginPage } from './features/auth/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

const MembersPage = lazy(() => import('./features/members/MembersPage').then((module) => ({ default: module.MembersPage })));
const TransactionsPage = lazy(() =>
  import('./features/transactions/TransactionsPage').then((module) => ({ default: module.TransactionsPage })),
);
const SchedulesPage = lazy(() => import('./features/schedules/SchedulesPage').then((module) => ({ default: module.SchedulesPage })));
const AuditLogPage = lazy(() => import('./features/audit/AuditLogPage').then((module) => ({ default: module.AuditLogPage })));
const PlansPage = lazy(() => import('./features/plans/PlansPage').then((module) => ({ default: module.PlansPage })));

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingState label="Memuat halaman…" />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <RequireAdmin>
                  <AdminLayout />
                </RequireAdmin>
              }
            >
              <Route index element={<Navigate to="/members" replace />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="activity" element={<AuditLogPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  );
}
