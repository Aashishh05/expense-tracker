import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getSummary, getByCategory, getMonthly } from '@/api/stats';
import { listTransactions } from '@/api/transactions';
import type { Transaction } from '@/types';
import type { StatsSummary, CategoryStat, MonthlyStat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Loader';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { RecentRow } from '@/components/transactions/TransactionList';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import { ArrowRightIcon, PlusIcon, TrendUpIcon, TrendDownIcon, ScaleIcon, ChartIcon } from '@/components/icons';
import { apiMessage, formatCurrency, currentMonthKey, monthEndDay, currentYear, monthLabel } from '@/utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { categories, refresh: refreshCategories } = useCategories();
  const month = currentMonthKey();
  const year = currentYear();

  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryStat[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const refetchAll = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getSummary({ startDate: `${month}-01`, endDate: monthEndDay(month) }).catch((err) => {
        toast.error(apiMessage(err, 'Could not load summary'));
        return null;
      }),
      getByCategory({ type: 'expense', month }).catch(() => null),
      getMonthly({ year }).catch(() => null),
      listTransactions({ limit: 5, sort: '-date' })
        .then((res) => res.data)
        .catch(() => null),
    ])
      .then(([summaryRes, byCategoryRes, monthlyRes, recentRes]) => {
        if (!active) return;
        setSummary(summaryRes?.data ?? null);
        setByCategory(byCategoryRes?.data ?? []);
        setMonthly(monthlyRes?.data?.months ?? []);
        setRecent(recentRes ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month, year, nonce]);

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Dashboard</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            {monthLabel(month)} · your money at a glance
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <PlusIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Add transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            <SummaryCard
              label="Total income"
              value={summary?.income ?? 0}
              sub={`${monthLabel(month)} · income`}
              chipClass="bg-income-soft text-income"
              icon={<TrendUpIcon className="h-5 w-5" />}
              currency={user?.currency}
            />
            <SummaryCard
              label="Total expense"
              value={summary?.expense ?? 0}
              sub={`${monthLabel(month)} · spending`}
              chipClass="bg-expense-soft text-expense"
              icon={<TrendDownIcon className="h-5 w-5" />}
              currency={user?.currency}
            />
            <SummaryCard
              label="Balance"
              value={summary?.balance ?? 0}
              sub={`across ${summary?.count ?? 0} ${summary?.count === 1 ? 'entry' : 'entries'}`}
              chipClass="bg-accent-soft text-accent"
              icon={<ScaleIcon className="h-5 w-5" />}
              currency={user?.currency}
              balance
            />
          </div>

          {/* Charts */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:mt-5">
            <section className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold">Expenses by category</h2>
                <Link to="/reports" className="text-[13px] font-medium text-accent hover:underline">
                  Reports
                </Link>
              </div>
              <ExpensePieChart data={byCategory} currency={user?.currency ?? 'NPR'} />
            </section>

            <section className="card p-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[15.5px] font-semibold">Monthly income vs. expense</h2>
                <span className="nums rounded-lg bg-black/[0.04] px-2 py-0.5 text-[12px] text-ink-2">
                  {year}
                </span>
              </div>
              <MonthlyBarChart data={monthly} currency={user?.currency ?? 'NPR'} />
            </section>
          </div>

          {/* Recent transactions */}
          <section className="card mt-4 md:mt-5">
            <div className="flex items-center justify-between px-4 pb-1 pt-4 md:px-5">
              <h2 className="text-[15.5px] font-semibold">Recent transactions</h2>
              <Link
                to="/transactions"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
              >
                All
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-4 pb-5 pt-2 text-center md:px-5">
                <div className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-ink-3 mx-auto">
                  <ChartIcon className="h-6 w-6" />
                </div>
                <p className="text-[14.5px] font-medium text-ink">Nothing logged yet this month</p>
                <p className="mx-auto mt-1 max-w-[36ch] text-[13px] text-ink-2">
                  Add your first transaction and it will show up right here.
                </p>
              </div>
            ) : (
              <ul className="mt-1.5 divide-y divide-line">
                {recent.map((transaction) => (
                  <RecentRow key={transaction._id} transaction={transaction} currency={user?.currency ?? 'NPR'} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          refetchAll();
          refreshCategories();
        }}
        transaction={editing}
        categories={categories}
        currency={user?.currency ?? 'NPR'}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  chipClass,
  icon,
  currency,
  balance = false,
}: {
  label: string;
  value: number;
  sub: string;
  chipClass: string;
  icon: ReactNode;
  currency?: string;
  balance?: boolean;
}) {
  const negative = balance && value < 0;
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3.5">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${chipClass}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[13px] text-ink-2">{label}</p>
          <p
            className={`nums mt-0.5 truncate text-[21px] font-semibold tracking-tight ${
              balance && negative ? 'text-expense' : 'text-ink'
            }`}
          >
            {formatCurrency(balance && negative ? -value : value, currency ?? 'NPR')}
            {negative && <span className="ml-1 text-[12px] font-medium text-expense">over</span>}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-3">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:mt-5">
        <Skeleton className="h-[340px] rounded-2xl" />
        <Skeleton className="h-[340px] rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-[280px] rounded-2xl md:mt-5" />
    </div>
  );
}
