import { Link } from 'react-router-dom';
import type { Transaction } from '@/types';
import { formatDate, formatCurrency, softColor } from '@/utils/format';
import { PencilIcon, TrashIcon, ReceiptIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/Button';

interface TransactionListProps {
  data: Transaction[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showActions?: boolean;
}

function CategoryChip({ transaction }: { transaction: Transaction }) {
  const category =
    typeof transaction.category === 'object' && transaction.category !== null
      ? transaction.category
      : null;
  const color = category?.color || '#64748b';
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px]"
      style={{ backgroundColor: softColor(color) }}
      aria-hidden="true"
    >
      {category?.icon || '🧾'}
    </span>
  );
}

function categoryMeta(transaction: Transaction) {
  const category =
    typeof transaction.category === 'object' && transaction.category !== null
      ? transaction.category
      : null;
  return {
    name: category?.name ?? 'Uncategorized',
    note: transaction.note ?? '',
  };
}

export function TransactionList({ data, currency, onEdit, onDelete, showActions = true }: TransactionListProps) {
  return (
    <>
      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {data.map((transaction) => {
          const { name, note } = categoryMeta(transaction);
          return (
            <li key={transaction._id} className="flex items-center gap-3 px-4 py-3">
              <CategoryChip transaction={transaction} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-ink">{name}</p>
                <p className="truncate text-[12.5px] text-ink-2">
                  {note || formatDate(transaction.date)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`nums text-[14.5px] font-semibold ${
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '−'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
                <p className="text-[11.5px] text-ink-3">{formatDate(transaction.date)}</p>
              </div>
              {showActions && (
                <div className="ml-1 flex flex-col gap-0.5">
                  <IconButton label="Edit" tone="accent" onClick={() => onEdit(transaction)}>
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => onDelete(transaction)}>
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-line text-[12.5px] font-medium text-ink-2">
            <th className="px-4 py-2.5 font-medium">Category</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            {showActions && <th className="w-24 px-4 py-2.5 font-medium" aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {data.map((transaction) => {
            const { name, note } = categoryMeta(transaction);
            return (
              <tr key={transaction._id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-ink/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CategoryChip transaction={transaction} />
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-medium text-ink">{name}</p>
                      {note && <p className="truncate text-[12.5px] text-ink-2">{note}</p>}
                    </div>
                  </div>
                </td>
                <td className="nums px-4 py-3 text-[13.5px] text-ink-2">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`nums text-[14.5px] font-semibold ${
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatCurrency(transaction.amount, currency)}
                  </span>
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-0.5">
                      <IconButton label="Edit" tone="accent" onClick={() => onEdit(transaction)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Delete" tone="danger" onClick={() => onDelete(transaction)}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** Small compact row used on the dashboard's recent list. */
export function RecentRow({ transaction, currency }: { transaction: Transaction; currency: string }) {
  const { name, note } = categoryMeta(transaction);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CategoryChip transaction={transaction} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-ink">{note || name}</p>
        <p className="text-[12.5px] text-ink-2">
          {name} · {formatDate(transaction.date)}
        </p>
      </div>
      <span
        className={`nums text-[14.5px] font-semibold ${
          transaction.type === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {transaction.type === 'income' ? '+' : '−'}
        {formatCurrency(transaction.amount, currency)}
      </span>
    </li>
  );
}

export function EmptyTransactions({ href, ctaLabel }: { href: string; ctaLabel: string }) {
  return (
    <div className="px-4 md:px-0">
      <div className="card bg-transparent shadow-none border-dashed">
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.04] text-ink-3">
            <ReceiptIcon className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-medium text-ink">No transactions yet</p>
          <p className="max-w-[38ch] text-[13.5px] text-ink-2">
            Track your first income or expense and the dashboard will come alive.
          </p>
          <Link
            to={href}
            className="mt-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0077ed] active:scale-95"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
