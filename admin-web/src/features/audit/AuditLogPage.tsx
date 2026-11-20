import { History, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { listAuditLogs } from '../../api/auditLogs';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Label } from '../../components/ui/Label';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { AUDIT_ACTIONS } from '../../domain/auditLog';
import { useApiQuery } from '../../hooks/useApiQuery';
import { AuditLogTable } from './AuditLogTable';

const ALL = 'all';

function readAction(value: string | null): string {
  return AUDIT_ACTIONS.some((item) => item.value === value) ? (value as string) : '';
}

export function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const action = readAction(params.get('action'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const logs = useApiQuery(`audit-logs:${action}:${page}`, (context) => listAuditLogs(context, { action, page }));

  const changeAction = (value: string) => setParams(value === ALL ? {} : { action: value }, { replace: true });
  const changePage = (next: number) => setParams({ ...(action ? { action } : {}), page: String(next) }, { replace: true });

  return (
    <>
      <PageHeader
        title="Log Aktivitas"
        description="Jejak aksi admin yang mengubah data penting. Catatan tidak bisa diubah atau dihapus dari panel."
        actions={
          <Button variant="outline" onClick={logs.reload} isLoading={logs.isRefreshing}>
            {!logs.isRefreshing && <RefreshCw aria-hidden="true" />}
            Muat ulang
          </Button>
        }
      />
      <Card>
        <div className="border-b px-5 py-4">
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="audit-action">Jenis aksi</Label>
            <Select value={action || ALL} onValueChange={changeAction}>
              <SelectTrigger id="audit-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua aksi</SelectItem>
                {AUDIT_ACTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {logs.isLoading && <LoadingState label="Memuat log aktivitas…" />}
        {logs.error && !logs.data && <ErrorState message={logs.error.message} onRetry={logs.reload} isRetrying={logs.isRefreshing} />}
        {logs.data && logs.data.data.length === 0 && (
          <EmptyState
            icon={History}
            title="Belum ada aktivitas"
            description={action ? 'Belum ada catatan untuk jenis aksi ini.' : 'Aksi admin seperti menyetujui transaksi akan tercatat di sini.'}
          />
        )}
        {logs.data && logs.data.data.length > 0 && (
          <>
            <AuditLogTable entries={logs.data.data} />
            <Pagination meta={logs.data.meta} itemLabel="catatan" onPageChange={changePage} disabled={logs.isRefreshing} />
          </>
        )}
      </Card>
    </>
  );
}
