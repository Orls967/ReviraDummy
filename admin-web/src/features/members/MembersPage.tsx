import { RefreshCw, Users } from 'lucide-react';
import { listMembers } from '../../api/members';
import { listPlans } from '../../api/plans';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/LoadingState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Pagination } from '../../components/ui/Pagination';
import { useApiQuery } from '../../hooks/useApiQuery';
import { MemberFilters } from './MemberFilters';
import { MembersTable } from './MembersTable';
import { useMemberFilters } from './useMemberFilters';

export function MembersPage() {
  const { query, update } = useMemberFilters();
  const members = useApiQuery(`members:${JSON.stringify(query)}`, (context) => listMembers(context, query));
  const plans = useApiQuery('plans', listPlans);

  return (
    <>
      <PageHeader
        title="Member"
        description="Status membership, paket, dan periode aktif setiap member."
        actions={
          <Button variant="outline" onClick={members.reload} isLoading={members.isRefreshing}>
            {!members.isRefreshing && <RefreshCw aria-hidden="true" />}
            Muat ulang
          </Button>
        }
      />
      <Card>
        <MemberFilters
          status={query.status}
          planId={query.planId}
          search={query.search}
          plans={plans.data ?? []}
          onChange={update}
        />
        {members.isLoading && <LoadingState label="Memuat daftar member…" />}
        {members.error && !members.data && (
          <ErrorState message={members.error.message} onRetry={members.reload} isRetrying={members.isRefreshing} />
        )}
        {members.data && members.data.data.length === 0 && (
          <EmptyState
            icon={Users}
            title="Tidak ada member"
            description="Tidak ada member yang cocok dengan filter ini. Ubah atau reset filter untuk melihat semua member."
          />
        )}
        {members.data && members.data.data.length > 0 && (
          <>
            <MembersTable members={members.data.data} />
            <Pagination
              meta={members.data.meta}
              itemLabel="member"
              onPageChange={(page) => update({ page: String(page) })}
              disabled={members.isRefreshing}
            />
          </>
        )}
      </Card>
    </>
  );
}
