import type { AdminMember } from '../../api/types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { membershipStatusMeta } from '../../domain/membershipStatus';
import { formatDateTime, formatPeriod } from '../../lib/format';

export function MembersTable({ members }: { members: AdminMember[] }) {
  return (
    <Table>
      <TableCaption>Daftar member beserta status membership terkini</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Telepon</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Paket</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead>Terdaftar</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell>
              <div className="font-medium">{member.name}</div>
              <div className="text-xs text-muted-foreground">{member.email}</div>
            </TableCell>
            <TableCell className="tabular-nums">{member.phone_number ?? '—'}</TableCell>
            <TableCell>
              <StatusBadge meta={membershipStatusMeta(member.membership_status)} />
            </TableCell>
            <TableCell>{member.plan?.name ?? '—'}</TableCell>
            <TableCell className="whitespace-nowrap">{formatPeriod(member.start_date, member.end_date)}</TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(member.registered_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
