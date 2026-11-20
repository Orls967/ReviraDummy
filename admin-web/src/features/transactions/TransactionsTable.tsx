import { Check, X } from 'lucide-react';
import type { AdminTransaction } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { isPendingTransaction, paymentMethodLabel, transactionStatusMeta } from '../../domain/transactionStatus';
import { formatDate, formatDateTime, formatPeriod, formatRupiah } from '../../lib/format';

interface TransactionsTableProps {
  transactions: AdminTransaction[];
  busy: boolean;
  onApprove: (transaction: AdminTransaction) => void;
  onReject: (transaction: AdminTransaction) => void;
}

export function TransactionsTable({ transactions, busy, onApprove, onReject }: TransactionsTableProps) {
  return (
    <Table className="[&_td]:px-3 [&_th]:px-3">
      <TableCaption>Daftar transaksi membership</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Paket</TableHead>
          <TableHead className="text-right">Nominal</TableHead>
          <TableHead>Metode</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Aksi</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => {
          const { membership } = transaction;
          const isPending = isPendingTransaction(transaction.verification_status);

          return (
            <TableRow key={transaction.id}>
              <TableCell>
                <div className="font-medium whitespace-nowrap">{transaction.member.name}</div>
                <div className="text-xs text-muted-foreground">Diajukan {formatDateTime(transaction.created_at)}</div>
              </TableCell>
              <TableCell className="min-w-32">
                <div>{membership.plan.name}</div>
                <div className="text-xs text-muted-foreground">
                  {membership.record_type === 'extension' ? 'Perpanjangan' : 'Pendaftaran baru'} · {membership.plan.duration_days} hari
                </div>
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatRupiah(transaction.amount)}</TableCell>
              <TableCell>{paymentMethodLabel(transaction.payment_method)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {membership.end_date === null ? `Mulai ${formatDate(membership.start_date)}` : formatPeriod(membership.start_date, membership.end_date)}
              </TableCell>
              <TableCell>
                <StatusBadge meta={transactionStatusMeta(transaction.verification_status)} />
                {transaction.reject_reason && (
                  <p className="mt-1 max-w-56 text-xs text-muted-foreground">{transaction.reject_reason}</p>
                )}
              </TableCell>
              <TableCell>
                {isPending && (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="success" disabled={busy} onClick={() => onApprove(transaction)}>
                      <Check aria-hidden="true" />
                      Setujui
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => onReject(transaction)}>
                      <X aria-hidden="true" />
                      Tolak
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
