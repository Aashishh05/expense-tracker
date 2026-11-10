import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/utils/format';
import { toggleTheme, useTheme } from '@/utils/theme';
import { Wallet as WalletIcon, House as HomeIcon, Receipt as ReceiptIcon, Tag as TagIcon, Target as TargetIcon, ChartColumn as ChartIcon, User as UserIcon, Plus as PlusIcon, LogOut as LogoutIcon, Sun as SunIcon, Moon as MoonIcon, Repeat as RepeatIcon, Users as UsersIcon } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
const desktopNav = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Transactions', icon: ReceiptIcon },
  { to: '/categories', label: 'Categories', icon: TagIcon },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon },
  { to: '/recurring', label: 'Recurring', icon: RepeatIcon },
  { to: '/groups', label: 'Groups', icon: UsersIcon },
  { to: '/reports', label: 'Reports', icon: ChartIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
];

const mobileNav = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Txns', icon: ReceiptIcon },
  { to: '/budgets', label: 'Budgets', icon: TargetIcon },
  { to: '/reports', label: 'Reports', icon: ChartIcon },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  className,
}: {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  end?: boolean;
  className?: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors duration-150',
          isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-ink/[0.04] hover:text-ink',
          className
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const onTransactions = location.pathname === '/transactions';
  const [logoutOpen, setLogoutOpen] = useState(false);

  const openAddTransaction = () => {
    navigate('/transactions', { state: { add: true } });
  };

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar — translucent material */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface/70 backdrop-blur-xl md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-5 pb-2 pt-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">
            <WalletIcon className="h-[19px] w-[19px]" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Expense Tracker</span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {desktopNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="border-t border-line/80 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent">
              {user ? initials(user.name) : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-ink">{user?.name}</p>
              <p className="truncate text-[11.5px] text-ink-3">{user?.email}</p>
            </div>
            <button
              type="button"
              aria-label="Toggle dark mode"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              className="pressable grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-ink/[0.05] hover:text-ink"
            >
              {theme === 'dark' ? <SunIcon className="h-[17px] w-[17px]" /> : <MoonIcon className="h-[17px] w-[17px]" />}
            </button>
            <button
              type="button"
              aria-label="Log out"
              title="Log out"
              onClick={() => setLogoutOpen(true)}
              className="pressable grid h-8 w-8 place-items-center rounded-lg text-ink-3 hover:bg-ink/[0.05] hover:text-expense"
            >
              <LogoutIcon className="h-[17px] w-[17px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="material sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line px-4 md:hidden">
        <span className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-white">
            <WalletIcon className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Expense Tracker</span>
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className="pressable grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
          >
            {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
          </button>
          <Link
            to="/profile"
            aria-label="Profile"
            className="pressable grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-[13px] font-semibold text-accent"
          >
            {user ? initials(user.name) : '—'}
          </Link>
        </span>
      </header>

      {/* Content — inset for sidebar, bottom padding for the tab bar */}
      <main className="md:pl-60">
        <div
          key={location.pathname}
          className="mx-auto w-full max-w-5xl animate-fade-rise px-4 pb-28 pt-5 sm:px-6 md:px-10 md:pb-14 md:pt-10"
        >
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="material fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        {mobileNav.slice(0, 2).map((item) => (
          <MobileTab key={item.to} {...item} />
        ))}
        {!onTransactions ? (
          <button
            key="add"
            type="button"
            onClick={openAddTransaction}
            aria-label="Add transaction"
            className="pressable mx-auto mt-[-26px] grid h-12 w-12 place-items-center rounded-2xl bg-accent text-white shadow-float"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        ) : (
          <span key="add-spacer" aria-hidden="true" />
        )}
        {mobileNav.slice(2).map((item) => (
          <MobileTab key={item.to} {...item} />
        ))}
      </nav>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        message="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        onConfirm={logout}
        onClose={() => setLogoutOpen(false)}
      />
    </div>
  );
}

function MobileTab({ to, label, icon: Icon, end }: { to: string; label: string; icon: typeof HomeIcon; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
          isActive ? 'text-accent' : 'text-ink-2'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[21px] w-[21px]" />
          <span>{label}</span>
          {isActive && <span className="h-1 w-1 rounded-full bg-accent" />}
        </>
      )}
    </NavLink>
  );
}
