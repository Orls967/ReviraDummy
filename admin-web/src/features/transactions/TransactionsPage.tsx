import { ReceiptText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { approveTransaction, listTransactions, rejectTransaction } from '../../api/transactions';
import type { AdminTransaction } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useMutation } from '../../hooks/useMutation';
import { formatPeriod } from '../../lib/format';
import { RejectTransactionDialog } from './RejectTransactionDialog';
import { TransactionsTable } from './TransactionsTable';

const TABS = [
  { value: 'pending', label: 'Menunggu' },
  { value: 'verified', label: 'Disetujui' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua' },
] as const;

const EMPTY_MESSAGES: Record<string, string> = {
  pending: 'Tidak ada pengajuan yang menunggu verifikasi.',
  verified: 'Belum ada transaksi yang disetujui.',
  rejected: 'Belum ada transaksi yang ditolak.',
  all: 'Belum ada transaksi.',
};

function readTab(value: string | null): string {
  return TABS.some((tab) => tab.value === value) ? (value as string) : 'pending';
}

export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const tab = readTab(params.get('status'));
  const page = Math.max(1, Number(params.get('page')) || 1);
  const status = tab === 'all' ? '' : tab;

  const transactions = useApiQuery(`transactions:${status}:${page}`, (context) => listTransactions(context, { status, page }));
  const approve = useMutation((context, id: number) => approveTransaction(context, id));
  const reject = useMutation((context, args: { id: number; reason: string }) => rejectTransaction(context, args.id, args.reason));
  const [approving, setApproving] = useState<AdminTransaction | null>(null);
  const [rejecting, setRejecting] = useState<AdminTransaction | null>(null);

  const changeTab = (value: string) => setParams(value === 'pending' ? {} : { status: value }, { replace: true });
  const changePage = (next: number) => setParams({ ...(tab === 'pending' ? {} : { status: tab }), page: String(next) }, { replace: true });

  const handleApprove = async () => {
    if (approving === null) {
      return;
    }

    const outcome = await approve.run(approving.id);

    if (outcome.status === 'skipped') {
      return;
    }

    setApproving(null);

    if (outcome.status === 'success') {
      const { membership, member } = outcome.data;
      toast.success(`Membership ${member.name} aktif`, {
        description: `Periode ${formatPeriod(membership.start_date, membership.end_date)}.`,
      });
    } else {
      toast.error('Transaksi gagal disetujui', { description: outcome.error.message });
    }

    transactions.reload();
  };

  const handleReject = async (reason: string) => {
    if (rejecting === null) {
      return;
    }

    const outcome = await reject.run({ id: rejecting.id, reason });

    if (outcome.status === 'success') {
      toast.success(`Transaksi ${outcome.data.member.name} ditolak`);
      setRejecting(null);
      transactions.reload();
    } else if (outcome.status === 'error' && outcome.error.status === 409) {
      setRejecting(null);
      toast.error('Transaksi sudah diproses', { description: outcome.error.message });
      transactions.reload();
    }
  };

  const closeReject = () => {
    reject.reset();
    setRejecting(null);
  };

  const isBusy = approve.isPending || reject.isPending;

  return (
    <>
      <PageHeader
        title="Transaksi"
        description="Verifikasi pembayaran untuk mengaktifkan membership member."
        actions={
          <Button variant="outline" onClick={transactions.reload} isLoading={transactions.isRefreshing}>
            {!transactions.isRefreshing && <RefreshCw aria-hidden="true" />}
            Muat ulang
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList aria-label="Filter status transaksi">
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card>
        {transactions.isLoading && <LoadingState label="Memuat transaksi…" />}
        {transactions.error && !transactions.data && (
          <ErrorState message={transactions.error.message} onRetry={transactions.reload} isRetrying={transactions.isRefreshing} />
        )}
        {transactions.data && transactions.data.data.length === 0 && (
          <EmptyState icon={ReceiptText} title="Tidak ada transaksi" description={EMPTY_MESSAGES[tab] ?? ''} />
        )}
        {transactions.data && transactions.data.data.length > 0 && (
          <>
            <TransactionsTable
              transactions={transactions.data.data}
              busy={isBusy}
              onApprove={setApproving}
              onReject={(transaction) => {
                reject.reset();
                setRejecting(transaction);
              }}
            />
            <Pagination
              meta={transactions.data.meta}
              itemLabel="transaksi"
              onPageChange={changePage}
              disabled={transactions.isRefreshing}
            />
          </>
        )}
      </Card>
      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Setujui transaksi?"
        description={
          approving
            ? `Membership ${approving.membership.plan.name} milik ${approving.member.name} akan langsung aktif. Tanggal mulai yang sudah lewat digeser ke hari ini.`
            : ''
        }
        confirmLabel="Setujui"
        confirmVariant="success"
        isPending={approve.isPending}
        onConfirm={() => void handleApprove()}
      />
      <RejectTransactionDialog
        key={rejecting?.id ?? 'closed'}
        transaction={rejecting}
        isPending={reject.isPending}
        error={reject.error}
        onSubmit={(reason) => void handleReject(reason)}
        onClose={closeReject}
      />
    </>
  );
}
