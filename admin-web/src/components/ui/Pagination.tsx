import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../api/types';
import { Button } from './Button';

interface PaginationProps {
  meta: PaginationMeta;
  itemLabel: string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ meta, itemLabel, onPageChange, disabled = false }: PaginationProps) {
  const first = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
  const last = Math.min(meta.current_page * meta.per_page, meta.total);

  return (
    <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
      <p className="text-sm text-muted-foreground">
        Menampilkan {first}–{last} dari {meta.total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Sebelumnya
        </Button>
        <span className="text-sm tabular-nums" aria-current="page">
          {meta.current_page} / {Math.max(meta.last_page, 1)}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || meta.current_page >= meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Berikutnya
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
