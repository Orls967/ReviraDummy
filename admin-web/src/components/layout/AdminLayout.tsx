import { CalendarDays, History, LogOut, Package, ReceiptText, Users, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../auth/useAuth';
import { cn } from '../../lib/cn';
import { BrandMark } from '../brand/BrandMark';
import { BrandWordmark } from '../brand/BrandWordmark';
import { Button } from '../ui/Button';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/members', label: 'Member', icon: Users },
  { to: '/transactions', label: 'Transaksi', icon: ReceiptText },
  { to: '/schedules', label: 'Jadwal Kelas', icon: CalendarDays },
  { to: '/plans', label: 'Paket Membership', icon: Package },
  { to: '/activity', label: 'Log Aktivitas', icon: History },
];

export function AdminLayout() {
  const { session, logout } = useAuth();
  const { pathname } = useLocation();
  const userName = session.status === 'authenticated' ? session.user.name : '';

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
      >
        Lewati ke konten utama
      </a>
      <aside className="flex flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <BrandMark />
          <BrandWordmark tone="gold" className="items-start text-base" />
        </div>
        <p className="px-5 pb-2 text-[0.7rem] font-semibold tracking-[0.18em] text-sidebar-muted uppercase">Panel Admin</p>
        <nav aria-label="Menu utama" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap text-sidebar-muted transition-colors duration-150 hover:bg-white/5 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-teal/60',
                  isActive && 'bg-sidebar-accent text-brand-gold hover:bg-sidebar-accent hover:text-brand-gold',
                )
              }
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center justify-between gap-2 border-t border-sidebar-border px-4 py-3 lg:flex">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="text-xs text-sidebar-muted">Administrator</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
            onClick={() => void logout()}
            aria-label="Keluar"
          >
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-3 border-b px-4 py-2 sm:px-6 lg:hidden">
          <span className="truncate text-sm text-muted-foreground">{userName}</span>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut aria-hidden="true" />
            Keluar
          </Button>
        </div>
        <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-6 focus:outline-none sm:px-6 sm:py-8">
          <div key={pathname} className="grid animate-page-in grid-cols-[minmax(0,1fr)] gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
