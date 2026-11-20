import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MembershipPlan } from '../../api/types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { MEMBERSHIP_STATUSES, membershipStatusMeta } from '../../domain/membershipStatus';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ALL } from './useMemberFilters';

interface MemberFiltersProps {
  status: string;
  planId: string;
  search: string;
  plans: MembershipPlan[];
  onChange: (changes: Partial<Record<'status' | 'plan' | 'q', string>>) => void;
}

export function MemberFilters({ status, planId, search, plans, onChange }: MemberFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 350);
  const hasFilters = status !== '' || planId !== '' || search !== '';

  useEffect(() => {
    if (debouncedSearch !== search) {
      onChange({ q: debouncedSearch });
    }
  }, [debouncedSearch, search, onChange]);

  const reset = () => {
    setSearchInput('');
    onChange({ status: '', plan: '', q: '' });
  };

  return (
    <div className="grid gap-3 border-b px-5 py-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] md:items-end">
      <div className="grid gap-2">
        <Label htmlFor="member-search">Cari member</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="member-search"
            type="search"
            placeholder="Nama, email, atau nomor telepon"
            className="pl-9"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-status">Status</Label>
        <Select value={status || ALL} onValueChange={(value) => onChange({ status: value })}>
          <SelectTrigger id="member-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua status</SelectItem>
            {MEMBERSHIP_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {membershipStatusMeta(value).label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="member-plan">Paket</Label>
        <Select value={planId || ALL} onValueChange={(value) => onChange({ plan: value })}>
          <SelectTrigger id="member-plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua paket</SelectItem>
            {plans.map((plan) => (
              <SelectItem key={plan.id} value={String(plan.id)}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button variant="ghost" onClick={reset} disabled={!hasFilters} className="md:mb-0">
        <X aria-hidden="true" />
        Reset
      </Button>
    </div>
  );
}
