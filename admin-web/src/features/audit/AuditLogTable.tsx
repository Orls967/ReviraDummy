import type { AuditLogEntry } from '../../api/types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { auditActionMeta, describeAuditEntry } from '../../domain/auditLog';
import { formatDateTime } from '../../lib/format';

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <Table>
      <TableCaption>Catatan aksi admin, terbaru di atas</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu</TableHead>
          <TableHead>Admin</TableHead>
          <TableHead>Aksi</TableHead>
          <TableHead>Detail</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id} className="animate-row-in">
            <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">{formatDateTime(entry.created_at)}</TableCell>
            <TableCell className="whitespace-nowrap font-medium">{entry.actor?.name ?? 'Admin terhapus'}</TableCell>
            <TableCell>
              <StatusBadge meta={auditActionMeta(entry.action, entry.action_label)} />
            </TableCell>
            <TableCell className="min-w-64 text-sm">
              {describeAuditEntry(entry.action, entry.properties) || <span className="text-muted-foreground">—</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
