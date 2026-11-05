import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getSummary, getByCategory, getMonthly } from '@/api/stats';
import type { CategoryStat, MonthlyStat, StatsSummary } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader, Skeleton } from '@/components/ui/Loader';
import { ExpensePieChart } from '@/components/charts/ExpensePieChart';
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart';
import { IconButton } from '@/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons';
import {
  apiMessage,
  formatCurrency,
  currentMonthKey,
  currentYear,
  monthEndDay,
  monthLabel,
  shiftMonth,
  cn,
  softColor,
} from '@/utils/format';

export default function Reports() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'NPR';

  const [month, setMonth] = useState(currentMonthKey());
  const [year, setYear] = useState(currentYear());

  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [byCategory, setByCategory] = useState<CategoryStat[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      getSummary({ startDate: `${month}-01`, endDate: monthEndDay(month) }).catch(() => null),
      getByCategory({ type: 'expense', month }).catch(() => null),
      getMonthly({ year }).catch(() => null),
    ])
      .then(([summaryRes, byCategoryRes, monthlyRes]) => {
        if (!active) return;
        setSummary(summaryRes?.data ?? null);
        setByCategory(byCategoryRes?.data ?? []);
        setMonthly(monthlyRes?.data?.months ?? []);
      })
      .catch((err) => toast.error(apiMessage(err, 'Could not load reports')))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month, year]);

  const totalExpense = byCategory.reduce((total, category) => total + category.total, 0);
  const years = Array.from({ length: currentYear() - 2023 }, (_, i) => 2024 + i);

  if (loading && !summary) return <FullPageLoader />;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 md:items-center">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Reports</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Where your money went — month by month</p>
        </div>
      </header>

      {/* Month summary strip */}
      <div className="card mb-4 grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <MonthStat
          label={`${monthLabel(month)} income`}
          value={summary ? formatCurrency(summary.income, currency) : '—'}
          tone="income"
        />
        <MonthStat
          label={`${monthLabel(month)} expenses`}
          value={summary ? formatCurrency(summary.expense, currency) : '—'}
          tone="expense"
        />
        <MonthStat
          label="Balance"
          value={summary ? formatCurrency(summary.balance, currency) : '—'}
          tone={summary && summary.balance < 0 ? 'expense' : 'ink'}
        />
      </div>

      {/* Category breakdown for the selected month */}
      <section className="card p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-[15.5px] font-semibold">Expense breakdown</h2>
          <div className="flex items-center rounded-xl border border-line">
            <IconButton label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))} className="h-8 w-8">
              <ChevronLeftIcon className="h-4 w-4" />
            </IconButton>
            <span className="min-w-[5rem] text-center text-[13px] font-medium">{monthLabel(month)}</span>
            <IconButton label="Next month" onClick={() => setMonth(shiftMonth(month, 1))} className="h-8 w-8">
              <ChevronRightIcon className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
        <p className="mb-3 text-[12.5px] text-ink-2">
          {byCategory.length} {byCategory.length === 1 ? 'category' : 'categories'} with spending
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ExpensePieChart data={byCategory} currency={currency} />

          {byCategory.length > 0 && (
            <ul className="space-y-3 self-center">
              {byCategory.map((category, index) => {
                const share = totalExpense > 0 ? Math.round((category.total / totalExpense) * 100) : 0;
                const color = category.color || '#64748b';
                return (
                  <li key={category._id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-[13.5px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[13px]"
                          style={{ backgroundColor: softColor(color) }}
                          aria-hidden="true"
                        >
                          {category.icon || '🧾'}
                        </span>
                        <span className="truncate font-medium text-ink">{category.name}</span>
                      </span>
                      <span className="nums shrink-0 text-ink-2">
                        {formatCurrency(category.total, currency)} · <span className="nums">{share}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.05]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: color || ['#0071e3', '#f59e0b', '#8b5cf6'][index % 3] }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Yearly trend */}
      <section className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15.5px] font-semibold">Monthly income vs. expense</h2>
          <select
            aria-label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="nums rounded-xl border border-line bg-surface px-3 py-1.5 text-[13.5px] font-medium text-ink outline-none focus:border-accent"
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        {loading ? <Skeleton className="h-[280px]" /> : <MonthlyBarChart data={monthly} currency={currency} />}
      </section>
    </>
  );
}

function MonthStat({ label, value, tone }: { label: string; value: string; tone: 'income' | 'expense' | 'ink' }) {
  return (
    <div className="p-4 text-center">
      <p className="text-[12.5px] text-ink-2">{label}</p>
      <p
        className={cn(
          'nums mt-0.5 text-[19px] font-semibold tracking-tight',
          tone === 'income' ? 'text-income' : tone === 'expense' ? 'text-expense' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  );
}
