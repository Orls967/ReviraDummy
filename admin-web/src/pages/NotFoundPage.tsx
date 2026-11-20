import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <Card>
      <EmptyState
        icon={SearchX}
        title="Halaman tidak ditemukan"
        description="Alamat yang Anda buka tidak tersedia di panel admin."
        action={
          <Button asChild variant="outline">
            <Link to="/members">Kembali ke daftar member</Link>
          </Button>
        }
      />
    </Card>
  );
}
