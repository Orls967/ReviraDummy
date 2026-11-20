import { Pencil, Trash2 } from 'lucide-react';
import type { MembershipPlan } from '../../api/types';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { formatRupiah } from '../../lib/format';

interface PlansTableProps {
  plans: MembershipPlan[];
  onEdit: (plan: MembershipPlan) => void;
  onDelete: (plan: MembershipPlan) => void;
}

export function PlansTable({ plans, onEdit, onDelete }: PlansTableProps) {
  return (
    <Table>
      <TableCaption>Daftar paket membership</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Paket</TableHead>
          <TableHead className="text-right">Durasi</TableHead>
          <TableHead className="text-right">Harga</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <span className="sr-only">Aksi</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell>
              <div className="font-medium">{plan.name}</div>
              {plan.description && <div className="max-w-md text-xs text-muted-foreground">{plan.description}</div>}
            </TableCell>
            <TableCell className="text-right tabular-nums">{plan.duration_days} hari</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{formatRupiah(plan.price)}</TableCell>
            <TableCell>
              <Badge tone={plan.is_active ? 'success' : 'neutral'}>{plan.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(plan)} aria-label={`Ubah paket ${plan.name}`}>
                  <Pencil aria-hidden="true" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(plan)} aria-label={`Hapus paket ${plan.name}`}>
                  <Trash2 className="text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
